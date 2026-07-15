import fs from 'fs';
import path from 'path';

const REPLACEMENTS = {
  'APPWRITE_PROJECT_ID': '69c58725000ef2b43f18',
  'VITE_APPWRITE_PROJECT_ID': '69c58725000ef2b43f18',
  'DATABASE_ID': 'qofeno_db',
  'VITE_APPWRITE_DATABASE_ID': 'qofeno_db',
  'CLOUDFLARE_ACCOUNT_ID': '2a7f21d5cb486bd75ae0dca7c8ea9dfb',
  'PAYPAL_CLIENT_ID': 'AaVoX-loRQ3UBfoES-x2DRMHs6RxMzJMMBY67Hf4mPKDIbjcSVPEAB0tk1rJQ4E2Jq2iT1Q6YGCu5FS5',
  'VITE_PAYPAL_CLIENT_ID': 'AaVoX-loRQ3UBfoES-x2DRMHs6RxMzJMMBY67Hf4mPKDIbjcSVPEAB0tk1rJQ4E2Jq2iT1Q6YGCu5FS5',
  'PAYPAL_WEBHOOK_ID': '64H37292TG0768704',
  'PAYPAL_PRODUCT_ID': 'PROD-8X0066432S263072A'
};

const ENV_FILES = ['.env', '.env.server'];

function recoverFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf8');

  for (const [key, val] of Object.entries(REPLACEMENTS)) {
    // Replace key=[anything] with key=val, ensuring it starts from line start
    const regex = new RegExp(`^(${key}=).*$`, 'gm');
    content = content.replace(regex, `$1${val}`);
  }

  fs.writeFileSync(filePath, content);
  console.log(`✓ Recovered ${filePath}`);
}

function main() {
  main();
}

for (const file of ENV_FILES) {
  recoverFile(path.resolve(file));
}
