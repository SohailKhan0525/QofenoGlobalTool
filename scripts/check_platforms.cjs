const fs = require('fs');

async function main() {
  const envText = fs.readFileSync('.env', 'utf-8');
  let apiKey = '';
  for (const line of envText.split('\n')) {
    if (line.startsWith('APPWRITE_API_KEY=')) {
      apiKey = line.split('=')[1].trim();
    }
  }

  const endpoint = 'https://cloud.appwrite.io/v1';
  const projectId = '69c58725000ef2b43f18';

  const res = await fetch(`${endpoint}/projects/${projectId}/platforms`, {
    headers: {
      'X-Appwrite-Project': projectId,
      'X-Appwrite-Key': apiKey
    }
  });

  console.log('Status:', res.status);
  const data = await res.json();
  console.log('Platforms:', JSON.stringify(data, null, 2));
}

main().catch(console.error);
