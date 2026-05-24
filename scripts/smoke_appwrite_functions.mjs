import fs from 'node:fs';
import path from 'node:path';
import { Client, Functions } from 'appwrite';

const envPath = path.join(process.cwd(), '.env.server');
const env = Object.fromEntries(
  fs.readFileSync(envPath, 'utf8').split(/\r?\n/).filter((line) => line && !line.trim().startsWith('#') && line.includes('=')).map((line) => {
    const index = line.indexOf('=');
    return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
  })
);

const client = new Client()
  .setEndpoint(env.APPWRITE_ENDPOINT)
  .setProject(env.APPWRITE_PROJECT_ID)
  .setKey(env.APPWRITE_API_KEY);

const functions = new Functions(client);

async function main() {
  const jsonFormatter = await functions.createExecution(
    '2217055e890645a5af054eb1d6186efe',
    JSON.stringify({ json: '{"a":1}', action: 'format' }),
    false
  );
  console.log('json-formatter:', jsonFormatter.responseBody);

  const base64Encoder = await functions.createExecution(
    'e63948affa5e460085fc9fc8b2a14dde',
    JSON.stringify({ text: 'hello', action: 'encode' }),
    false
  );
  console.log('base64-encoder:', base64Encoder.responseBody);

  const textCase = await functions.createExecution(
    '8be86de4f76b44d59fbfba912b749482',
    JSON.stringify({ text: 'hello world', target_case: 'title' }),
    false
  );
  console.log('text-case-converter:', textCase.responseBody);

  const wordCounter = await functions.createExecution(
    '4291a710a39643dca3c0f28615496583',
    JSON.stringify({ text: 'hello world. this is a test.' }),
    false
  );
  console.log('word-counter:', wordCounter.responseBody);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
