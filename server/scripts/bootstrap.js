// Bootstrap script - runs BEFORE the app starts
// Fixes DATABASE_URL to have proper file: prefix for SQLite
// This MUST run as a separate process via `node scripts/bootstrap.js`

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
const dataDir = join(__dirname, '..', 'data');

// Load .env file if exists
try {
  if (existsSync(envPath)) {
    const envContent = readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        if (!process.env[key]) {
          process.env[key] = valueParts.join('=');
        }
      }
    });
  }
} catch (e) {
  // Ignore errors reading .env
}

function ensureDataDirectory() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
    console.log('✓ Created data/ directory');
  }
}

function fixDatabaseUrl() {
  let url = process.env.DATABASE_URL;
  
  // Also check Render's internal database variable
  if (!url) {
    url = process.env.PG_DATABASE_URL;
  }
  if (!url) {
    url = process.env.DATABASE_PRIVATE_URL;
  }
  
  // PostgreSQL URLs (Render uses dpg-*.render.com)
  if (url && (url.startsWith('postgresql://') || url.startsWith('postgres://'))) {
    console.log('✓ Using PostgreSQL:', url.replace(/:[^:@]+@/, ':***@'));
    return;
  }
  
  // If URL contains dpg- hostname, it's PostgreSQL even without prefix
  if (url && (url.includes('dpg-') || url.includes('.render.com'))) {
    if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
      url = 'postgresql://' + url;
      process.env.DATABASE_URL = url;
    }
    console.log('✓ Using PostgreSQL (detected from hostname):', url.replace(/:[^:@]+@/, ':***@'));
    return;
  }
  
  // SQLite fallback - ensure data directory
  ensureDataDirectory();
  
  if (!url) {
    const envContent = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';
    const newContent = envContent + '\nDATABASE_URL=file:./data/prod.db\n';
    writeFileSync(envPath, newContent);
    process.env.DATABASE_URL = 'file:./data/prod.db';
    console.log('✓ Created DATABASE_URL=file:./data/prod.db');
    return;
  }
  
  // Already has file: prefix
  if (url.startsWith('file:')) {
    console.log('✓ Using SQLite:', url);
    return;
  }
  
  // Fix SQLite URL without file: prefix
  const fixedUrl = url.startsWith('./') ? `file:${url}` : `file:./${url}`;
  process.env.DATABASE_URL = fixedUrl;
  
  let envContent = existsSync(envPath) ? readFileSync(envPath, 'utf-8') : '';
  if (envContent.match(/^DATABASE_URL=/m)) {
    envContent = envContent.replace(/^DATABASE_URL=.+$/m, `DATABASE_URL=${fixedUrl}`);
  } else {
    envContent = envContent + '\nDATABASE_URL=' + fixedUrl + '\n';
  }
  writeFileSync(envPath, envContent);
  console.log('✓ Fixed DATABASE_URL:', fixedUrl);
}

fixDatabaseUrl();
