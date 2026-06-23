import fs from 'fs';
import path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env');
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(\w+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  }
}

loadEnv();

fetch(process.env.APPWRITE_ENDPOINT + '/databases/qofeno_db/collections/tools/documents', {
  headers: {
    'X-Appwrite-Project': process.env.APPWRITE_PROJECT_ID,
    'X-Appwrite-Key': process.env.APPWRITE_API_KEY
  }
})
.then(r => r.json())
.then(data => {
  console.log("Total tools:", data.total);
  data.documents.forEach(d => console.log(`ID: ${d.$id}, Slug: ${d.slug}`));
})
.catch(console.error);
