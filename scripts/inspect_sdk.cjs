const fs = require('fs');
const src = fs.readFileSync('node_modules/appwrite/dist/cjs/sdk.js', 'utf-8');

// Find the full X-Fallback-Cookies response handling block
const idx = src.indexOf('X-Fallback-Cookies');
const block = src.slice(Math.max(0, idx - 200), idx + 800);
console.log('X-Fallback-Cookies response block:\n', block);
console.log('---');

// Find createSession endpoint
const token = '/account/sessions/token';
const csIdx = src.indexOf(token);
if (csIdx > -1) {
  console.log('\ncreateSession endpoint block:\n', src.slice(Math.max(0, csIdx-100), csIdx+300));
}

// Also look for how get() sends the session header
const getIdx = src.indexOf("'X-Appwrite-Session'");
if (getIdx > -1) {
  console.log('\nSession header usage:\n', src.slice(Math.max(0, getIdx-300), getIdx+200));
}
