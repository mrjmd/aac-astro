#!/usr/bin/env node

/**
 * Generate AI blog hero images using Google's Imagen 4 API.
 *
 * Usage:
 *   GEMINI_API_KEY=your-key node scripts/generate-blog-images.js [--section published|post-launch|all] [--only slug1,slug2]
 *
 * Options:
 *   --section   Which section to generate: "published" (default), "post-launch", or "all"
 *   --only      Comma-separated list of slugs to generate (overrides --section)
 *   --dry-run   Parse and print what would be generated without calling the API
 *   --model     Model variant: "standard" (default), "fast", or "ultra"
 *
 * The script parses docs/blog-image-prompts.md, calls the Imagen 4 API for each
 * entry, and saves JPGs to public/images/blog/. It skips images that already exist.
 */

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const PROJECT_ROOT = new URL("..", import.meta.url).pathname;
const PROMPTS_FILE = path.join(PROJECT_ROOT, "docs/blog-image-prompts.md");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "public/images/blog");
const OAUTH_CREDS_PATH = path.join(PROJECT_ROOT, "scripts/.credentials/google-oauth.json");
const VERTEX_TOKEN_PATH = path.join(PROJECT_ROOT, "scripts/.credentials/vertex-token.json");

const GCP_PROJECT = "astro-website-489317";
const GCP_LOCATION = "us-central1";

const MODELS = {
  standard: "imagen-4.0-generate-001",
  fast: "imagen-4.0-fast-generate-001",
  ultra: "imagen-4.0-ultra-generate-001",
};

// Vertex AI uses a different model for style reference (Imagen 3 capability)
const VERTEX_STYLE_MODEL = "imagen-3.0-capability-001";

// Rate limits vary by tier. 8s between requests is safe for most paid tiers.
const DELAY_BETWEEN_REQUESTS_MS = 8_000;

// ---------------------------------------------------------------------------
// Parse the markdown tables
// ---------------------------------------------------------------------------

const REFS_DIR = path.join(PROJECT_ROOT, "media/blog-refs");

function parsePromptsFile() {
  const content = fs.readFileSync(PROMPTS_FILE, "utf-8");
  const lines = content.split("\n");

  const published = [];
  const postLaunch = [];
  let currentSection = null;

  for (const line of lines) {
    if (line.includes("REPLACE — Published Posts")) {
      currentSection = "published";
      continue;
    }
    if (line.includes("REPLACE — Not Yet Published")) {
      currentSection = "post-launch";
      continue;
    }
    if (line.startsWith("## ") && !line.includes("REPLACE")) {
      currentSection = null;
      continue;
    }

    // Split on pipe, trim each cell
    const cells = line.split("|").map((c) => c.trim()).filter(Boolean);
    // Must start with a row number
    if (!cells.length || !/^\d+$/.test(cells[0]) || !currentSection) continue;

    // Published table: # | Slug | FileName | Prompt | Status | Feedback
    // Post-launch table: # | Slug | PublishDate | FileName | Prompt | Status | Feedback
    let slug, fileName, prompt, status, feedback;
    if (currentSection === "published") {
      [, slug, fileName, prompt, status, feedback] = cells;
    } else {
      [, slug, , fileName, prompt, status, feedback] = cells;
    }

    // Skip struck-through rows
    if (slug?.startsWith("~~")) continue;

    const entry = {
      slug: slug || "",
      fileName: fileName || "",
      prompt: prompt || "",
      status: (status || "").toLowerCase(),
      feedback: feedback || "",
    };
    if (currentSection === "published") published.push(entry);
    else if (currentSection === "post-launch") postLaunch.push(entry);
  }

  return { published, postLaunch };
}

// ---------------------------------------------------------------------------
// Check for reference images
// ---------------------------------------------------------------------------

/**
 * Reference image resolution order:
 * 1. media/blog-refs/{slug}.{jpg,jpeg,png,webp}  — direct slug match
 * 2. media/blog-refs/refs.json mapping            — { "slug": "filename-in-this-dir" }
 *
 * refs.json example:
 * {
 *   "cinderblock-foundation-repair-guide": "stair-step.png",
 *   "basement-waterproofing-vs-foundation-repair": "waterproof-membrane.png",
 *   "foundation-repair-warranty-guide": "employee-1.PNG"
 * }
 */
function findRefImage(slug) {
  // Direct slug match
  for (const ext of [".jpg", ".jpeg", ".png", ".webp"]) {
    const refPath = path.join(REFS_DIR, `${slug}${ext}`);
    if (fs.existsSync(refPath)) return refPath;
  }

  // Check refs.json mapping
  const mappingPath = path.join(REFS_DIR, "refs.json");
  if (fs.existsSync(mappingPath)) {
    try {
      const mapping = JSON.parse(fs.readFileSync(mappingPath, "utf-8"));
      const mapped = mapping[slug];
      if (mapped) {
        const refPath = path.join(REFS_DIR, mapped);
        if (fs.existsSync(refPath)) return refPath;
        console.warn(`    Warning: refs.json maps "${slug}" → "${mapped}" but file not found`);
      }
    } catch (e) {
      console.warn(`    Warning: Could not parse refs.json: ${e.message}`);
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// OAuth2 auth for Vertex AI (same pattern as project-import-core.js)
// ---------------------------------------------------------------------------

import { createServer } from "node:http";

const VERTEX_SCOPES = [
  "https://www.googleapis.com/auth/cloud-platform",
];

let cachedAccessToken = null;
let tokenExpiry = 0;

async function getVertexAccessToken() {
  // Return cached token if still valid (with 60s buffer)
  if (cachedAccessToken && Date.now() < tokenExpiry - 60_000) {
    return cachedAccessToken;
  }

  if (!fs.existsSync(OAUTH_CREDS_PATH)) {
    throw new Error(
      `OAuth credentials not found at ${OAUTH_CREDS_PATH}\n` +
        "Reference images require Vertex AI auth. See scripts/.credentials/ setup.",
    );
  }

  const creds = JSON.parse(fs.readFileSync(OAUTH_CREDS_PATH, "utf-8"));
  const { client_id, client_secret } = creds.installed || creds.web;

  // Try saved Vertex token
  if (fs.existsSync(VERTEX_TOKEN_PATH)) {
    const token = JSON.parse(fs.readFileSync(VERTEX_TOKEN_PATH, "utf-8"));

    // Refresh if expired
    if (!token.expiry_date || token.expiry_date < Date.now()) {
      const refreshed = await refreshOAuthToken(client_id, client_secret, token.refresh_token);
      if (refreshed) {
        cachedAccessToken = refreshed.access_token;
        tokenExpiry = Date.now() + (refreshed.expires_in || 3600) * 1000;
        const updated = { ...token, access_token: refreshed.access_token, expiry_date: tokenExpiry };
        fs.writeFileSync(VERTEX_TOKEN_PATH, JSON.stringify(updated, null, 2));
        return cachedAccessToken;
      }
      console.log("⚠️  Vertex AI token refresh failed. Re-authenticating...");
    } else {
      cachedAccessToken = token.access_token;
      tokenExpiry = token.expiry_date;
      return cachedAccessToken;
    }
  }

  // No token or refresh failed — run interactive OAuth flow
  console.log("\n🔐 Vertex AI requires a one-time authorization with cloud-platform scope.");
  const token = await runOAuthFlow(client_id, client_secret);
  cachedAccessToken = token.access_token;
  tokenExpiry = Date.now() + (token.expires_in || 3600) * 1000;
  const toSave = { ...token, expiry_date: tokenExpiry };
  fs.writeFileSync(VERTEX_TOKEN_PATH, JSON.stringify(toSave, null, 2));
  return cachedAccessToken;
}

async function refreshOAuthToken(clientId, clientSecret, refreshToken) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

async function runOAuthFlow(clientId, clientSecret) {
  const redirectUri = "http://localhost:3334/callback";

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: VERTEX_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
  });
  const authUrl = `https://accounts.google.com/o/oauth2/auth?${params}`;

  console.log("\nAuthorize by visiting:\n");
  console.log(`  ${authUrl}\n`);

  // Auto-open browser on macOS
  try {
    const { exec } = await import("child_process");
    exec(`open "${authUrl}"`);
  } catch { /* manual fallback above */ }

  // Wait for the callback
  const code = await new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:3334`);
      const authCode = url.searchParams.get("code");
      if (authCode) {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end("<h1>Authorized! You can close this tab.</h1>");
        server.close();
        resolve(authCode);
      } else {
        res.writeHead(400);
        res.end("No code received");
      }
    });
    server.listen(3334, () => {
      console.log("  Waiting for authorization callback on port 3334...\n");
    });
    server.on("error", reject);
  });

  // Exchange code for token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Token exchange failed: ${err}`);
  }

  return tokenRes.json();
}

// ---------------------------------------------------------------------------
// Imagen API calls — Gemini API (simple) or Vertex AI (with reference images)
// ---------------------------------------------------------------------------

async function generateImage(prompt, apiKey, modelId, refImagePath) {
  if (refImagePath) {
    return generateWithVertexAI(prompt, modelId, refImagePath);
  }
  return generateWithGeminiAPI(prompt, apiKey, modelId);
}

async function generateWithGeminiAPI(prompt, apiKey, modelId) {
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predict`;

  const body = {
    instances: [{ prompt }],
    parameters: {
      aspectRatio: "16:9",
      sampleCount: 1,
      personGeneration: "allow_adult",
    },
  };

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${errorText}`);
  }

  const json = await res.json();
  return extractImageBytes(json);
}

async function generateWithVertexAI(prompt, modelId, refImagePath) {
  const accessToken = await getVertexAccessToken();

  // Vertex AI endpoint — use capability model for style references
  const vertexModel = VERTEX_STYLE_MODEL;
  const apiUrl =
    `https://${GCP_LOCATION}-aiplatform.googleapis.com/v1/projects/${GCP_PROJECT}` +
    `/locations/${GCP_LOCATION}/publishers/google/models/${vertexModel}:predict`;

  const refBytes = fs.readFileSync(refImagePath);

  const body = {
    instances: [
      {
        prompt,
        referenceImages: [
          {
            referenceType: "REFERENCE_TYPE_STYLE",
            referenceId: 1,
            referenceImage: {
              bytesBase64Encoded: refBytes.toString("base64"),
            },
            styleImageConfig: {
              styleDescription: "Use this as a visual style and content reference.",
            },
          },
        ],
      },
    ],
    parameters: {
      aspectRatio: "16:9",
      sampleCount: 1,
      personGeneration: "allow_adult",
    },
  };

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Vertex AI error ${res.status}: ${errorText}`);
  }

  const json = await res.json();
  return extractImageBytes(json);
}

function extractImageBytes(json) {
  const imageBytes =
    json.predictions?.[0]?.bytesBase64Encoded ??
    json.predictions?.[0]?.image?.imageBytes;

  if (!imageBytes) {
    throw new Error(
      `No image in response: ${JSON.stringify(json).substring(0, 200)}`,
    );
  }

  return Buffer.from(imageBytes, "base64");
}

// ---------------------------------------------------------------------------
// Save as JPG using sharp
// ---------------------------------------------------------------------------

async function saveAsJpg(imageBuffer, outputPath) {
  await sharp(imageBuffer)
    .jpeg({ quality: 90, mozjpeg: true })
    .toFile(outputPath);
}

// ---------------------------------------------------------------------------
// Archive previous version before overwriting
// ---------------------------------------------------------------------------

const ARCHIVE_DIR = path.join(OUTPUT_DIR, ".archive");

function archivePrevious(outputPath) {
  if (!fs.existsSync(outputPath)) return;

  fs.mkdirSync(ARCHIVE_DIR, { recursive: true });

  const baseName = path.basename(outputPath, ".jpg");

  // Find the next version number
  const existing = fs.readdirSync(ARCHIVE_DIR)
    .filter((f) => f.startsWith(baseName + "-v"));
  let version = 1;
  for (const f of existing) {
    const m = f.match(/-v(\d+)\.jpg$/);
    if (m) version = Math.max(version, parseInt(m[1], 10) + 1);
  }

  const archiveName = `${baseName}-v${version}.jpg`;
  const archivePath = path.join(ARCHIVE_DIR, archiveName);
  fs.renameSync(outputPath, archivePath);
  console.log(`    Archived previous → .archive/${archiveName}`);
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const sectionIdx = args.indexOf("--section");
  const onlyIdx = args.indexOf("--only");
  const modelIdx = args.indexOf("--model");

  const sectionArg = sectionIdx !== -1 ? args[sectionIdx + 1] : "published";
  const onlyArg = onlyIdx !== -1 ? args[onlyIdx + 1]?.split(",") : null;
  const modelArg = modelIdx !== -1 ? args[modelIdx + 1] : "standard";
  const modelId = MODELS[modelArg];

  if (!modelId) {
    console.error(
      `Error: Unknown model "${modelArg}". Use: standard, fast, or ultra`,
    );
    process.exit(1);
  }

  // Try env var first, then fall back to .credentials file
  const credentialsPath = path.join(PROJECT_ROOT, "scripts/.credentials/gemini-api-key");
  let apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey && fs.existsSync(credentialsPath)) {
    apiKey = fs.readFileSync(credentialsPath, "utf-8").trim();
  }
  if (!apiKey && !dryRun) {
    console.error(
      "Error: GEMINI_API_KEY not found.\n" +
        "Set it via env var or place it in scripts/.credentials/gemini-api-key",
    );
    process.exit(1);
  }

  console.log(`Model: ${modelId}`);

  // Parse the markdown
  const { published, postLaunch } = parsePromptsFile();
  console.log(
    `Parsed ${published.length} published + ${postLaunch.length} post-launch entries.\n`,
  );

  // Select which entries to process
  let entries;
  if (onlyArg) {
    const all = [...published, ...postLaunch];
    entries = onlyArg
      .map((slug) => all.find((e) => e.slug === slug.trim()))
      .filter(Boolean);
    if (entries.length !== onlyArg.length) {
      const found = entries.map((e) => e.slug);
      const missing = onlyArg.filter((s) => !found.includes(s.trim()));
      console.warn(`Warning: slugs not found: ${missing.join(", ")}`);
    }
  } else if (sectionArg === "all") {
    entries = [...published, ...postLaunch];
  } else if (sectionArg === "post-launch") {
    entries = postLaunch;
  } else {
    entries = published;
  }

  if (entries.length === 0) {
    console.log("No entries to process.");
    return;
  }

  // Ensure output dir exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Process each entry
  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const entry of entries) {
    const outputPath = path.join(OUTPUT_DIR, entry.fileName);

    // Skip approved entries
    if (entry.status === "approved") {
      console.log(`  SKIP  ${entry.fileName} (approved)`);
      skipped++;
      continue;
    }

    // For non-redo entries, skip if file already exists
    const isRedo = entry.status === "redo";
    if (!isRedo && fs.existsSync(outputPath)) {
      console.log(`  SKIP  ${entry.fileName} (already exists — mark as "redo" to regenerate)`);
      skipped++;
      continue;
    }

    // Build the effective prompt, appending feedback for redos
    let effectivePrompt = entry.prompt;
    if (isRedo && entry.feedback) {
      effectivePrompt += ` IMPORTANT REVISION: ${entry.feedback}`;
    }

    // Check for reference image
    const refImagePath = findRefImage(entry.slug);

    if (dryRun) {
      console.log(`  WOULD GENERATE  ${entry.fileName}${isRedo ? " (REDO)" : ""}`);
      console.log(`    Prompt: ${effectivePrompt.substring(0, 100)}...`);
      if (refImagePath) console.log(`    Reference: ${refImagePath}`);
      console.log();
      generated++;
      continue;
    }

    console.log(
      `  [${generated + skipped + failed + 1}/${entries.length}] ${isRedo ? "REDO " : ""}Generating ${entry.fileName}...`,
    );
    if (refImagePath) console.log(`    Using reference: ${path.basename(refImagePath)}`);

    try {
      const imageBuffer = await generateImage(effectivePrompt, apiKey, modelId, refImagePath);
      // Archive AFTER successful generation, before writing new file
      if (isRedo) archivePrevious(outputPath);
      await saveAsJpg(imageBuffer, outputPath);
      console.log(`    ✓ Saved (${(fs.statSync(outputPath).size / 1024).toFixed(0)} KB)`);
      generated++;
    } catch (err) {
      console.error(`    ✗ FAILED: ${err.message}`);
      failed++;

      // If rate limited, wait longer and retry once
      if (err.message.includes("429")) {
        console.log("    Waiting 60s for rate limit cooldown...");
        await sleep(60_000);
        try {
          const imageBuffer = await generateImage(effectivePrompt, apiKey, modelId, refImagePath);
          await saveAsJpg(imageBuffer, outputPath);
          console.log(`    ✓ Retry succeeded (${(fs.statSync(outputPath).size / 1024).toFixed(0)} KB)`);
          generated++;
          failed--;
        } catch (retryErr) {
          console.error(`    ✗ Retry also failed: ${retryErr.message}`);
        }
      }
    }

    // Rate limit delay
    if (generated + failed < entries.length) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS);
    }
  }

  console.log(
    `\nDone! Generated: ${generated}, Skipped: ${skipped}, Failed: ${failed}`,
  );

  if (generated > 0 && !dryRun) {
    console.log(
      "\nNext steps:" +
        "\n  1. Review generated images in public/images/blog/" +
        "\n  2. Add IPTC metadata:  exiftool -IPTC:DigitalSourceType='trainedAlgorithmicMedia' -IPTC:Credit='AI-generated illustration' public/images/blog/*.jpg" +
        "\n  3. Generate WebP variants:  npm run optimize:images" +
        "\n  4. Update frontmatter heroImage paths in each blog post",
    );
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
