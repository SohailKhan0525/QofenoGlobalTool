const fs = require('fs');

async function testEndpoint(endpointName, url) {
  try {
    const res = await fetch(`${url}/account/sessions/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Appwrite-Project': '69c58725000ef2b43f18',
        'Origin': 'https://qofeno-labs.pages.dev'
      },
      body: JSON.stringify({ userId: 'test_user', secret: 'test_secret' })
    });
    console.log(`[${endpointName}] Status:`, res.status);
    console.log(`[${endpointName}] Access-Control-Allow-Origin:`, res.headers.get('access-control-allow-origin'));
    const body = await res.text();
    console.log(`[${endpointName}] Body:`, body);
  } catch (err) {
    console.error(`[${endpointName}] Error:`, err.message);
  }
}

async function main() {
  await testEndpoint('fra.cloud.appwrite.io', 'https://fra.cloud.appwrite.io/v1');
  console.log('---');
  await testEndpoint('cloud.appwrite.io', 'https://cloud.appwrite.io/v1');
}

main();
