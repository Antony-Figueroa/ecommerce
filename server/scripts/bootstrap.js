// Bootstrap script - runs BEFORE the app starts
// Fixes DATABASE_URL to have proper file: prefix for SQLite
// This MUST run as a separate process via `node scripts/bootstrap.js`

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
const dataDir = join(__dirname, '..', 'data');

function ensureDataDirectory() {
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true });
    console.log('✓ Created data/ directory');
  }
}

function fixDatabaseUrl() {
  let envContent = '';
  
  ensureDataDirectory();
  
  // Read existing .env or create default
  if (existsSync(envPath)) {
    envContent = readFileSync(envPath, 'utf-8');
  }
  
  // Check if DATABASE_URL is already set with proper format
  const dbUrlMatch = envContent.match(/^DATABASE_URL=(.+)$/m);
  
  if (dbUrlMatch) {
    const url = dbUrlMatch[1].trim();
    
    // Already has proper prefix
    if (url.startsWith('file:') || 
        url.startsWith('postgresql://') || 
        url.startsWith('postgres://')) {
      console.log('✓ DATABASE_URL already has proper format:', url);
      return;
    }
    
    // Fix the URL
    let fixedUrl;
    if (url.startsWith('./')) {
      fixedUrl = `file:${url}`;
    } else {
      fixedUrl = `file:./${url}`;
    }
    
    envContent = envContent.replace(/^DATABASE_URL=.+$/m, `DATABASE_URL=${fixedUrl}`);
    writeFileSync(envPath, envContent);
    console.log('✓ Fixed DATABASE_URL:', fixedUrl);
  } else {
    // Add DATABASE_URL with default
    const newContent = envContent + '\nDATABASE_URL=file:./data/prod.db\n';
    writeFileSync(envPath, newContent);
    console.log('✓ Created DATABASE_URL=file:./data/prod.db');
  }
}

fixDatabaseUrl();
