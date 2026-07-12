/**
 * test_all_tools.mjs
 * Comprehensive automated test suite for all Qofeno Appwrite functions.
 * Tests real function invocations with real payloads.
 * Run: node scripts/test_all_tools.mjs
 */
import { Client, Functions } from 'node-appwrite';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) throw new Error('.env file not found');
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(\w+)=(.*)$/);
    if (match) process.env[match[1]] = match[2];
  }
}

// Small minimal DOCX (base64 encoded real minimal docx)
const MINIMAL_DOCX_BASE64 = 'UEsDBBQACAgIAAAAIQAAAAAAAAAAAAAAAAALAAAAX3JlbHMvLnJlbHONzrsKwkAQRuF9nzKkT3ezKIIU2Uop0mdYs8mC2Q3ZjaDPrqKQKoX/hcP5GKa2r6YSHaQ2sByg6BuoRFFLbVkGx93m8gOBpEKrOqdBXdGQl4vs+QmU5Xh/KmNFGWSSJCCEiQCmB4CMtEpxQoSjQKWTgVFKZhqQnBiLJLmgVyFwgSAvDICUSh2lAyYJkL7xyxjJi1PQIAXjv5p2jLbYHTKR8AAAD//wMAUEsDBBQACAgIAAAAIQDVBCxmMQEAAH4CAAATAAAAd29yZC9kb2N1bWVudC54bWyFkV1LwzAUhu/9FSH3bpOuY5SmFxUvZOhF8eeSpOuyLU3CSTpX/91k3Qr7IAnk43meg3m8fh8GMYNtlcESBSmCRBtp61GjbadNbqVGjsASpbVAKJoJ+K1TBGGLkGGHnBGBhkh4TW8TpqDaEnqGAOHUMfuCwS4OBqWUWODlMDXuYkLhCMt7vARjLgFUYGMPRoAdoBBU+aOb0EiAHHhFGRaUNFNpqUiGOA6OaYJPaJFxZKJIgjhFJAnWZ5yx9CL5uyaAjfqm1CixRJlTaJWqkl4wjFXUluGnEiTgvlWE1gQ8eKWJXaSI3EJGTaqaIlX5neMTVsn6RmXN/R/BFPwAAAP//AwBQSwMEFAAICAgAAAAhAAAAAAAAAAAAAAAAAAoAAAB3b3JkL2ZvbnQveG1sAAAAUEsFBgAAAAADAAMAxwAAAMgAAAAA';

let MINIMAL_PDF_BASE64 = '';

async function runTests() {
  loadEnv();

  // Dynamically generate a valid PDF with content for conversion/extracting tools to test cleanly
  try {
    const doc = await PDFDocument.create();
    const font = await doc.embedFont(StandardFonts.Helvetica);
    const page = doc.addPage([595, 842]);
    page.drawText('Qofeno Test PDF Document', { x: 50, y: 780, size: 20, font, color: rgb(0, 0, 0) });
    page.drawText('This is a real valid test document with some content for word count and conversion testing.', { x: 50, y: 745, size: 12, font, color: rgb(0.2, 0.2, 0.2) });
    const bytes = await doc.save();
    MINIMAL_PDF_BASE64 = Buffer.from(bytes).toString('base64');
  } catch (err) {
    console.error('Failed to pre-generate valid PDF:', err.message);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://fra.cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const fnClient = new Functions(client);
  const results = [];

  async function test(toolId, payload, validate) {
    const envKey = `VITE_APPWRITE_FUNCTION_${toolId.toUpperCase().replace(/-/g, '_')}_ID`;
    const resolvedId = process.env[envKey] || toolId;
    process.stdout.write(`Testing ${toolId} (ID: ${resolvedId})... `);
    try {
      const exec = await fnClient.createExecution(resolvedId, JSON.stringify(payload), false);
      const resp = exec.responseBody ? JSON.parse(exec.responseBody) : {};
      const passed = validate(resp);
      if (passed) {
        console.log(`✅ PASS`);
        results.push({ tool: toolId, status: 'PASS', info: resp.output_filename || resp.result?.words || '' });
      } else {
        console.log(`❌ FAIL: ${resp.error || JSON.stringify(resp).substring(0, 100)}`);
        results.push({ tool: toolId, status: 'FAIL', error: resp.error });
      }
    } catch (e) {
      console.log(`❌ ERROR: ${e.message}`);
      results.push({ tool: toolId, status: 'ERROR', error: e.message });
    }
  }

  console.log('\n🔬 Qofeno Tool Test Suite\n' + '─'.repeat(50));

  // Text/JSON tools
  await test('json-formatter', { json: '{"a":1,"b":2}', action: 'format' }, r => r.success && r.result);
  await test('word-counter', { text: 'Hello world test sentence here.' }, r => r.success && r.words === 5);
  await test('base64-encoder', { text: 'qofeno', action: 'encode' }, r => r.success && r.result === 'cW9mZW5v');
  await test('text-case-converter', { text: 'hello world', target_case: 'upper' }, r => r.success && r.result?.includes('HELLO'));

  // PDF Tools (using minimal valid PDF)
  const pdfPayload = { file_base64: MINIMAL_PDF_BASE64, input_filename: 'test.pdf' };
  await test('pdf-compressor', { ...pdfPayload, compression_level: 'Medium' }, r => r.success && r.download_url);
  await test('pdf-rotate', { ...pdfPayload, rotation: '90° Clockwise', apply_to: 'All pages' }, r => r.success && r.download_url);
  await test('pdf-page-numbers', { ...pdfPayload, position: 'Bottom center', start_number: '1' }, r => r.success && r.download_url);
  await test('pdf-watermark', { ...pdfPayload, watermark_text: 'CONFIDENTIAL', opacity: '0.3' }, r => r.success && r.download_url);
  await test('pdf-flatten', pdfPayload, r => r.success && r.download_url);
  await test('pdf-repair', pdfPayload, r => r.success && r.download_url);
  await test('pdf-sign', { ...pdfPayload, signature_text: 'John Doe' }, r => r.success && r.download_url);
  await test('pdf-crop', { ...pdfPayload, margin: '10' }, r => r.success && r.download_url);
  await test('pdf-protect', { ...pdfPayload, owner_password: 'test123' }, r => r.success && r.download_url);
  await test('pdf-unlock', pdfPayload, r => r.success && r.download_url);
  await test('pdf-to-html', pdfPayload, r => r.success && r.download_url);
  await test('pdf-splitter', { ...pdfPayload, split_mode: 'Every N pages', page_ranges: '1' }, r => r.success);
  await test('pdf-metadata-viewer', pdfPayload, r => r.success);
  await test('pdf-word-count', pdfPayload, r => r.success);

  // Summary
  console.log('\n' + '─'.repeat(50));
  console.log('📊 Test Results Summary:');
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status !== 'PASS').length;
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${icon} ${r.tool.padEnd(30)} ${r.status} ${r.info || r.error || ''}`);
  });
  console.log(`\n🎯 Score: ${passed}/${results.length} tests passed (${Math.round(passed/results.length*100)}%)`);

  if (failed > 0) {
    console.log('\n⚠️  Some tools failed. Check Appwrite function logs for details.');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test suite crashed:', err.message);
  process.exit(1);
});
