#!/usr/bin/env node

/**
 * JSON-LD Schema Validation Script
 *
 * Crawls built HTML files and validates JSON-LD structured data against Schema.org standards.
 * Run after build: npm run validate:schema
 */

import { readdir, readFile } from 'fs/promises';
import { join, relative } from 'path';
import { JSDOM } from 'jsdom';

const DIST_DIR = 'dist';
const REQUIRED_SCHEMAS = {
  // Page type patterns and their required schema types
  'services/': ['Service'],
  'concrete-resurfacing/': ['Service'],
  'connecticut/': ['LocalBusiness'],
  'massachusetts/': ['LocalBusiness'],
  'blog/': ['Article'],
  'partners/': ['WebPage'],
  'foundation-types/': ['Article'],
};

// Required properties for each schema type
const SCHEMA_REQUIREMENTS = {
  Service: ['name', 'description', 'provider'],
  LocalBusiness: ['name', 'telephone', 'address'],
  Article: ['headline', 'author'],
  WebPage: ['name', 'description'],
  FAQPage: ['mainEntity'],
  BreadcrumbList: ['itemListElement'],
};

let errors = [];
let warnings = [];
let pagesChecked = 0;
let schemasFound = 0;

async function getAllHtmlFiles(dir) {
  const files = [];

  async function walk(currentDir) {
    const entries = await readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.name.endsWith('.html')) {
        files.push(fullPath);
      }
    }
  }

  await walk(dir);
  return files;
}

function extractJsonLd(html) {
  const dom = new JSDOM(html);
  const scripts = dom.window.document.querySelectorAll('script[type="application/ld+json"]');
  const schemas = [];

  scripts.forEach((script, index) => {
    try {
      const data = JSON.parse(script.textContent);
      // Handle @graph arrays
      if (data['@graph']) {
        schemas.push(...data['@graph']);
      } else if (Array.isArray(data)) {
        schemas.push(...data);
      } else {
        schemas.push(data);
      }
    } catch (e) {
      errors.push(`Invalid JSON-LD at script ${index}: ${e.message}`);
    }
  });

  return schemas;
}

function validateSchema(schema, filePath) {
  const type = schema['@type'];

  if (!type) {
    errors.push(`${filePath}: Schema missing @type property`);
    return;
  }

  // Check required properties for known types
  const requirements = SCHEMA_REQUIREMENTS[type];
  if (requirements) {
    for (const prop of requirements) {
      if (!schema[prop]) {
        warnings.push(`${filePath}: ${type} schema missing recommended property: ${prop}`);
      }
    }
  }

  // Validate nested schemas
  if (type === 'FAQPage' && schema.mainEntity) {
    const questions = Array.isArray(schema.mainEntity) ? schema.mainEntity : [schema.mainEntity];
    for (const q of questions) {
      if (q['@type'] !== 'Question') {
        errors.push(`${filePath}: FAQPage mainEntity item should be type Question`);
      }
      if (!q.name || !q.acceptedAnswer) {
        errors.push(`${filePath}: FAQ Question missing name or acceptedAnswer`);
      }
    }
  }

  if (type === 'BreadcrumbList' && schema.itemListElement) {
    const items = Array.isArray(schema.itemListElement) ? schema.itemListElement : [schema.itemListElement];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.position || !item.name) {
        errors.push(`${filePath}: BreadcrumbList item ${i} missing position or name`);
      }
    }
  }

  // Validate LocalBusiness specifics
  if (type === 'LocalBusiness' || type === 'HomeAndConstructionBusiness') {
    if (!schema.telephone) {
      errors.push(`${filePath}: LocalBusiness missing telephone`);
    }
    if (!schema.address && !schema.areaServed) {
      warnings.push(`${filePath}: LocalBusiness should have address or areaServed`);
    }
  }

  schemasFound++;
}

function checkRequiredSchemas(schemas, filePath) {
  const relativePath = relative(DIST_DIR, filePath);
  const schemaTypes = schemas.map(s => s['@type']).filter(Boolean);

  for (const [pathPattern, requiredTypes] of Object.entries(REQUIRED_SCHEMAS)) {
    if (relativePath.includes(pathPattern)) {
      for (const requiredType of requiredTypes) {
        if (!schemaTypes.includes(requiredType)) {
          // Also check for related types (e.g., HomeAndConstructionBusiness extends LocalBusiness)
          const hasRelated = schemaTypes.some(t =>
            (requiredType === 'LocalBusiness' && t === 'HomeAndConstructionBusiness') ||
            (requiredType === 'Article' && t === 'BlogPosting')
          );

          if (!hasRelated) {
            warnings.push(`${relativePath}: Expected ${requiredType} schema but not found`);
          }
        }
      }
    }
  }
}

async function validateFile(filePath) {
  const html = await readFile(filePath, 'utf-8');
  const relativePath = relative(DIST_DIR, filePath);

  const schemas = extractJsonLd(html);

  if (schemas.length === 0) {
    // Some pages may not need schemas (index, about, etc.)
    const requiresSchema = Object.keys(REQUIRED_SCHEMAS).some(pattern =>
      relativePath.includes(pattern)
    );

    if (requiresSchema) {
      warnings.push(`${relativePath}: No JSON-LD schemas found`);
    }
  }

  for (const schema of schemas) {
    validateSchema(schema, relativePath);
  }

  checkRequiredSchemas(schemas, filePath);
  pagesChecked++;
}

async function main() {
  console.log('🔍 Validating JSON-LD schemas...\n');

  try {
    const files = await getAllHtmlFiles(DIST_DIR);

    for (const file of files) {
      await validateFile(file);
    }

    console.log(`📄 Pages checked: ${pagesChecked}`);
    console.log(`📊 Schemas found: ${schemasFound}`);
    console.log('');

    if (warnings.length > 0) {
      console.log(`⚠️  Warnings (${warnings.length}):`);
      warnings.forEach(w => console.log(`   ${w}`));
      console.log('');
    }

    if (errors.length > 0) {
      console.log(`❌ Errors (${errors.length}):`);
      errors.forEach(e => console.log(`   ${e}`));
      console.log('');
      process.exit(1);
    }

    console.log('✅ Schema validation passed!');

  } catch (error) {
    console.error('Failed to validate schemas:', error);
    process.exit(1);
  }
}

main();
