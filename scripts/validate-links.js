#!/usr/bin/env node

/**
 * Build-time Internal Link Validation Script
 *
 * Validates:
 * - All nearbyCities references exist as content files
 * - All relatedServices references exist
 * - All relatedPosts references exist
 * - Warns about orphan pages (pages with no incoming internal links)
 */

import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { parse as parseYaml } from 'yaml';

const contentDir = resolve('src/content');

// Parse frontmatter from markdown file
function parseFrontmatter(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  try {
    return parseYaml(match[1]);
  } catch (e) {
    console.warn(`Warning: Could not parse frontmatter in ${filePath}`);
    return null;
  }
}

// Get all files in a collection
function getCollectionFiles(collection) {
  const collectionPath = join(contentDir, collection);
  if (!existsSync(collectionPath)) return [];

  return readdirSync(collectionPath, { withFileTypes: true })
    .filter(e => e.isFile() && e.name.endsWith('.md'))
    .map(e => ({
      id: e.name.replace(/\.md$/, ''),
      path: join(collectionPath, e.name),
      frontmatter: parseFrontmatter(join(collectionPath, e.name)),
    }));
}

// Get all subdirectory files in a collection (for locations)
function getNestedCollectionFiles(collection) {
  const collectionPath = join(contentDir, collection);
  if (!existsSync(collectionPath)) return [];

  const files = [];
  const entries = readdirSync(collectionPath, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const subDirPath = join(collectionPath, entry.name);
      const subEntries = readdirSync(subDirPath, { withFileTypes: true });
      for (const subEntry of subEntries) {
        if (subEntry.isFile() && subEntry.name.endsWith('.md')) {
          const filePath = join(subDirPath, subEntry.name);
          files.push({
            id: `${entry.name}/${subEntry.name.replace(/\.md$/, '')}`,
            path: filePath,
            frontmatter: parseFrontmatter(filePath),
            state: entry.name,
          });
        }
      }
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      // Handle flat files in collection root
      files.push({
        id: entry.name.replace(/\.md$/, ''),
        path: join(collectionPath, entry.name),
        frontmatter: parseFrontmatter(join(collectionPath, entry.name)),
      });
    }
  }

  return files;
}

async function main() {
  console.log('\n===================================');
  console.log('  Internal Link Validation');
  console.log('===================================\n');

  let errors = 0;
  let warnings = 0;

  // Load all collections
  const services = getCollectionFiles('services');
  const concreteRepair = getCollectionFiles('concrete-repair');
  const blog = getCollectionFiles('blog');
  const foundationTypes = getCollectionFiles('foundation-types');
  const locations = getNestedCollectionFiles('locations');

  // Create ID sets for quick lookup
  const serviceIds = new Set(services.map(s => s.id));
  const concreteRepairIds = new Set(concreteRepair.map(s => s.id));
  const blogIds = new Set(blog.map(b => b.id));
  const locationCities = new Map(); // city name -> location id

  for (const loc of locations) {
    if (loc.frontmatter?.city) {
      locationCities.set(loc.frontmatter.city, loc.id);
    }
  }

  console.log('Collections loaded:');
  console.log(`  - Services: ${services.length}`);
  console.log(`  - Concrete Repair: ${concreteRepair.length}`);
  console.log(`  - Blog posts: ${blog.length}`);
  console.log(`  - Foundation types: ${foundationTypes.length}`);
  console.log(`  - Locations: ${locations.length}`);
  console.log('');

  // Track incoming links for orphan detection
  const incomingLinks = new Map();

  // Initialize all pages with 0 incoming links
  for (const s of services) incomingLinks.set(`services/${s.id}`, 0);
  for (const s of concreteRepair) incomingLinks.set(`concrete-repair/${s.id}`, 0);
  for (const b of blog) incomingLinks.set(`blog/${b.id}`, 0);
  for (const f of foundationTypes) incomingLinks.set(`foundation-types/${f.id}`, 0);
  for (const l of locations) incomingLinks.set(`locations/${l.id}`, 0);

  // Validate services - relatedServices
  console.log('Validating service references...');
  for (const service of services) {
    const related = service.frontmatter?.relatedServices || [];
    for (const relatedId of related) {
      if (!serviceIds.has(relatedId)) {
        console.log(`  [ERROR] ${service.id}: relatedService "${relatedId}" not found`);
        errors++;
      } else {
        // Count incoming link
        incomingLinks.set(`services/${relatedId}`, (incomingLinks.get(`services/${relatedId}`) || 0) + 1);
      }
    }
  }

  // Validate concrete-repair - relatedServices
  for (const service of concreteRepair) {
    const related = service.frontmatter?.relatedServices || [];
    for (const relatedId of related) {
      if (!concreteRepairIds.has(relatedId)) {
        console.log(`  [ERROR] ${service.id}: relatedService "${relatedId}" not found`);
        errors++;
      } else {
        incomingLinks.set(`concrete-repair/${relatedId}`, (incomingLinks.get(`concrete-repair/${relatedId}`) || 0) + 1);
      }
    }
  }

  // Validate blog - relatedPosts and relatedServices
  console.log('Validating blog references...');
  for (const post of blog) {
    const related = post.frontmatter?.relatedPosts || [];
    for (const relatedId of related) {
      if (!blogIds.has(relatedId)) {
        console.log(`  [ERROR] ${post.id}: relatedPost "${relatedId}" not found`);
        errors++;
      } else {
        incomingLinks.set(`blog/${relatedId}`, (incomingLinks.get(`blog/${relatedId}`) || 0) + 1);
      }
    }

    const relatedSvc = post.frontmatter?.relatedServices || [];
    for (const svcId of relatedSvc) {
      if (!serviceIds.has(svcId)) {
        console.log(`  [ERROR] ${post.id}: relatedService "${svcId}" not found`);
        errors++;
      } else {
        incomingLinks.set(`services/${svcId}`, (incomingLinks.get(`services/${svcId}`) || 0) + 1);
      }
    }
  }

  // Validate locations - nearbyCities
  console.log('Validating location references...');
  for (const location of locations) {
    const nearby = location.frontmatter?.nearbyCities || [];
    const stateAbbr = location.frontmatter?.stateAbbr;

    for (const cityName of nearby) {
      // Check if city exists in same state
      const cityId = locationCities.get(cityName);
      if (!cityId) {
        console.log(`  [ERROR] ${location.id}: nearbyCities "${cityName}" not found`);
        errors++;
      } else {
        // Verify it's in the same state
        const cityLocation = locations.find(l => l.id === cityId);
        if (cityLocation && cityLocation.frontmatter?.stateAbbr !== stateAbbr) {
          console.log(`  [WARN] ${location.id}: nearbyCities "${cityName}" is in different state (${cityLocation.frontmatter?.stateAbbr})`);
          warnings++;
        }
        incomingLinks.set(`locations/${cityId}`, (incomingLinks.get(`locations/${cityId}`) || 0) + 1);
      }
    }
  }

  // Check for orphan pages (pages with no incoming links)
  console.log('\nChecking for orphan pages...');
  const orphans = [];
  for (const [page, count] of incomingLinks.entries()) {
    if (count === 0) {
      orphans.push(page);
    }
  }

  if (orphans.length > 0) {
    console.log(`  [WARN] Found ${orphans.length} pages with no incoming internal links:`);
    orphans.slice(0, 10).forEach(p => console.log(`         - ${p}`));
    if (orphans.length > 10) {
      console.log(`         ... and ${orphans.length - 10} more`);
    }
    warnings += orphans.length;
  }

  // Summary
  console.log('\n-----------------------------------');
  console.log('  Summary');
  console.log('-----------------------------------');
  console.log(`  Errors: ${errors}`);
  console.log(`  Warnings: ${warnings}`);
  console.log('-----------------------------------\n');

  if (errors > 0) {
    console.log('FAILED: Broken internal links found.\n');
    process.exit(1);
  }

  if (warnings > 0) {
    console.log('PASSED with warnings.\n');
    process.exit(0);
  }

  console.log('PASSED: All internal links are valid.\n');
  process.exit(0);
}

main().catch(error => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
