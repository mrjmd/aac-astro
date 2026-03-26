/**
 * Validate Draft Links
 *
 * Checks that published content does not contain internal links or
 * relatedPosts references to draft blog posts. These cause 404s in
 * Google Search Console.
 *
 * Usage: node scripts/validate-draft-links.js
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const CONTENT_DIR = 'src/content';
const BLOG_DIR = join(CONTENT_DIR, 'blog');

// Directories to scan for links to draft posts
const SCAN_DIRS = [
  join(CONTENT_DIR, 'blog'),
  join(CONTENT_DIR, 'services'),
  join(CONTENT_DIR, 'partners'),
  join(CONTENT_DIR, 'resources'),
  join(CONTENT_DIR, 'concrete-repair'),
  join(CONTENT_DIR, 'locations'),
  join(CONTENT_DIR, 'projects'),
];

function getDraftSlugs() {
  const files = readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'));
  const drafts = [];
  for (const file of files) {
    const content = readFileSync(join(BLOG_DIR, file), 'utf8');
    if (content.match(/^draft:\s*true/m)) {
      drafts.push(file.replace('.md', ''));
    }
  }
  return new Set(drafts);
}

function isDraft(filePath) {
  const content = readFileSync(filePath, 'utf8');
  return !!content.match(/^draft:\s*true/m);
}

function scanFile(filePath, draftSlugs) {
  const content = readFileSync(filePath, 'utf8');
  const errors = [];

  // Strip HTML comments to avoid false positives
  const stripped = content.replace(/<!--[\s\S]*?-->/g, '');

  // Check markdown body links: [text](/blog/draft-slug)
  const linkPattern = /\[([^\]]*)\]\(\/blog\/([^)]+)\)/g;
  let match;
  while ((match = linkPattern.exec(stripped)) !== null) {
    const slug = match[2].replace(/\/$/, '');
    if (draftSlugs.has(slug)) {
      const line = stripped.substring(0, match.index).split('\n').length;
      errors.push({
        type: 'body-link',
        slug,
        line,
        context: match[0],
      });
    }
  }

  // Check relatedPosts frontmatter
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (fmMatch) {
    const fm = fmMatch[1];
    const rpMatch = fm.match(/relatedPosts:\s*\n((?:\s+-\s+"[^"]+"\n?)*)/);
    if (rpMatch) {
      const entries = rpMatch[1].matchAll(/- "([^"]+)"/g);
      for (const entry of entries) {
        if (draftSlugs.has(entry[1])) {
          errors.push({
            type: 'relatedPosts',
            slug: entry[1],
            line: null,
            context: `relatedPosts: "${entry[1]}"`,
          });
        }
      }
    }
  }

  return errors;
}

function main() {
  console.log('🔍 Checking for published→draft blog links...\n');

  const draftSlugs = getDraftSlugs();
  console.log(`📝 Draft blog posts: ${draftSlugs.size}`);

  let totalErrors = 0;
  const allErrors = [];

  for (const dir of SCAN_DIRS) {
    if (!existsSync(dir)) continue;

    const walkDir = (d) => {
      const entries = readdirSync(d, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(d, entry.name);
        if (entry.isDirectory()) {
          walkDir(fullPath);
        } else if (entry.name.endsWith('.md')) {
          // Skip draft files — draft→draft links are fine
          if (isDraft(fullPath)) continue;

          const errors = scanFile(fullPath, draftSlugs);
          if (errors.length > 0) {
            totalErrors += errors.length;
            for (const err of errors) {
              allErrors.push({ file: fullPath, ...err });
            }
          }
        }
      }
    };
    walkDir(dir);
  }

  if (totalErrors === 0) {
    console.log('\n✅ No published→draft links found!\n');
    process.exit(0);
  } else {
    console.log(`\n❌ Found ${totalErrors} published→draft link(s):\n`);
    for (const err of allErrors) {
      const loc = err.line ? `:${err.line}` : '';
      console.log(`  ${err.file}${loc}`);
      console.log(`    ${err.type}: /blog/${err.slug}`);
      console.log(`    ${err.context}\n`);
    }
    console.log('Fix these before committing. See docs/DRAFT-LINK-TRACKING.md for the process.\n');
    process.exit(1);
  }
}

main();
