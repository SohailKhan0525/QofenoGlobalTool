import fs from 'fs';
import path from 'path';

const FUNCTIONS_ROOT = path.resolve('functions');

const PLATFORM_SRC = path.resolve('appwrite-functions', 'platform');
const PAYPAL_SRC = path.resolve('appwrite-functions', 'paypal-webhook');

function copyDirRecursive(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') continue; // Skip node_modules
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function main() {
  // 1. Copy platform subdirectories
  if (fs.existsSync(PLATFORM_SRC)) {
    const dirs = fs.readdirSync(PLATFORM_SRC).filter(f => fs.statSync(path.join(PLATFORM_SRC, f)).isDirectory());
    for (const d of dirs) {
      const src = path.join(PLATFORM_SRC, d);
      const dest = path.join(FUNCTIONS_ROOT, d);
      copyDirRecursive(src, dest);
      console.log(`✓ Copied platform function: ${d}`);
    }
  }

  // 2. Copy paypal-webhook
  if (fs.existsSync(PAYPAL_SRC)) {
    const dest = path.join(FUNCTIONS_ROOT, 'paypal-webhook');
    copyDirRecursive(PAYPAL_SRC, dest);
    console.log(`✓ Copied paypal-webhook`);
  }

  console.log('Platform functions copying complete!');
}

main();
