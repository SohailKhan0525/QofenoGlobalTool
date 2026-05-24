const fs = require('fs');
const path = require('path');
const fetch = global.fetch || require('node-fetch');
function parseEnvFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return text.split(/\r?\n/).reduce((acc, line) => {
    if (!line || line.trim().startsWith('#') || !line.includes('=')) return acc;
    const idx = line.indexOf('=');
    acc[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
    return acc;
  }, {});
}

function toVariableId(key, functionId) {
  const keyPart = key.toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 18);
  return `var-${functionId.slice(0, 8)}-${keyPart}`.slice(0, 36);
}

async function main(){
  const envPath = path.join(__dirname,'..','.env.server');
  if(!fs.existsSync(envPath)){ console.error('.env.server not found'); process.exit(1); }
  const env = parseEnvFile(envPath);
  const endpoint = env.APPWRITE_ENDPOINT;
  const project = env.APPWRITE_PROJECT_ID;
  const key = env.APPWRITE_API_KEY;
  if(!endpoint||!project||!key){ console.error('Missing APPWRITE config in .env.server'); process.exit(1); }

  const funcs = [
    { id: '2ae3ea71599748069626086a6ffcc629', name:'platform-track-event' },
    { id: '2217055e890645a5af054eb1d6186efe', name:'tools-json-formatter' },
    { id: '8be86de4f76b44d59fbfba912b749482', name:'tools-text-case-converter' },
    { id: '4291a710a39643dca3c0f28615496583', name:'tools-word-counter' },
    { id: '52f028f5cf6946229b615d8ec83a5126', name:'_template-src' }
  ];

  const vars = [
    { key:'APPWRITE_ENDPOINT', value:endpoint, secret:false },
    { key:'APPWRITE_PROJECT_ID', value:project, secret:false },
    { key:'APPWRITE_API_KEY', value:key, secret:true },
    { key:'DATABASE_ID', value: env.DATABASE_ID || 'qofeno_db', secret:false },
    { key:'BUCKET_INPUTS', value: env.BUCKET_INPUTS || 'tool_inputs', secret:false },
    { key:'BUCKET_OUTPUTS', value: env.BUCKET_OUTPUTS || 'tool_outputs', secret:false }
  ];

  for(const f of funcs){
    console.log(`Setting vars for ${f.name} (${f.id})`);
    const existingRes = await fetch(`${endpoint}/functions/${f.id}/variables`, {
      headers:{ 'X-Appwrite-Project': project, 'X-Appwrite-Key': key }
    });
    const existing = await existingRes.json().catch(() => ({ variables: [] }));
    for(const v of vars){
      try{
        const existingVar = (existing.variables || []).find(item => item.key === v.key);
        const variableId = existingVar?.$id || toVariableId(v.key, f.id);
        const url = `${endpoint}/functions/${f.id}/variables${existingVar ? `/${variableId}` : ''}`;
        const res = await fetch(url,{
          method: existingVar ? 'PUT' : 'POST',
          headers:{ 'Content-Type':'application/json', 'X-Appwrite-Project': project, 'X-Appwrite-Key': key },
          body: JSON.stringify({ variableId, key: v.key, value: v.value, secret: v.secret })
        });
        const text = await res.text();
        try{ console.log('  ', v.key, res.status, JSON.parse(text)); }
        catch{ console.log('  ', v.key, res.status, text.slice(0,200)); }
      }catch(err){ console.error('  error',err.message); }
    }
  }
}
main();
