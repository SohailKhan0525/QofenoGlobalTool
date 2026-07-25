import dotenv from 'dotenv';
dotenv.config();

const endpoint = (process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1').replace(/\/$/, '');
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

const headers = {
  'X-Appwrite-Project': projectId,
  'X-Appwrite-Key': apiKey,
  'Content-Type': 'application/json'
};

const TOOL_FUNCTION_IDS = [
  'qofeno-pdf', 'qofeno-image', 'qofeno-video', 
  'qofeno-audio', 'qofeno-text', 'qofeno-developer', 
  'qofeno-data', 'qofeno-security'
];

async function runTestAndGetLogs() {
  // First trigger a test execution
  console.log("Triggering test execution of qofeno-security (password-generator)...");
  const triggerR = await fetch(`${endpoint}/functions/qofeno-security/executions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ body: JSON.stringify({ tool: 'password-generator', length: 20, include_symbols: true }), async: false })
  });
  const ex = await triggerR.json();
  console.log(`  Status: ${ex.status}`);
  console.log(`  Duration: ${ex.duration}s`);
  console.log(`  Response: ${ex.responseBody?.substring(0, 500)}`);
  if (ex.errors) console.log(`  Errors: ${ex.errors}`);
  if (ex.logs) console.log(`  Logs:\n${ex.logs.split('\n').slice(-20).map(l => '    ' + l).join('\n')}`);

  console.log("\n---\n");

  console.log("Triggering test execution of qofeno-pdf (pdf-compress with dummy file_id)...");
  const pdfR = await fetch(`${endpoint}/functions/qofeno-pdf/executions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ body: JSON.stringify({ tool: 'pdf-compress', file_id: 'test-id', bucket_id: 'tool_inputs', input_filename: 'test.pdf' }), async: false })
  });
  const pdfEx = await pdfR.json();
  console.log(`  Status: ${pdfEx.status}`);
  console.log(`  Duration: ${pdfEx.duration}s`);
  console.log(`  Response: ${pdfEx.responseBody?.substring(0, 500)}`);
  if (pdfEx.errors) console.log(`  Errors: ${pdfEx.errors}`);
  if (pdfEx.logs) console.log(`  Logs:\n${pdfEx.logs.split('\n').slice(-30).map(l => '    ' + l).join('\n')}`);

  console.log("\n---\n");
  
  console.log("Triggering test execution of qofeno-image (image-resize with dummy file_id)...");
  const imgR = await fetch(`${endpoint}/functions/qofeno-image/executions`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ body: JSON.stringify({ tool: 'image-resize', file_id: 'test-id', bucket_id: 'tool_inputs', input_filename: 'test.jpg', width: 800, height: 600 }), async: false })
  });
  const imgEx = await imgR.json();
  console.log(`  Status: ${imgEx.status}`);
  console.log(`  Duration: ${imgEx.duration}s`);
  console.log(`  Response: ${imgEx.responseBody?.substring(0, 500)}`);
  if (imgEx.errors) console.log(`  Errors: ${imgEx.errors}`);
  if (imgEx.logs) console.log(`  Logs:\n${imgEx.logs.split('\n').slice(-30).map(l => '    ' + l).join('\n')}`);
}

runTestAndGetLogs();
