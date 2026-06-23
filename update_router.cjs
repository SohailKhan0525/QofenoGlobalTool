const fs = require('fs');

const file = 'c:/Qofeno/QofenoGlobalTool/src/lib/appRouter.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("'reset-password'")) {
  content = content.replace("'forgot-password'", "'forgot-password'\n  | 'reset-password'");
  content = content.replace("'forgot-password': '/forgot-password',", "'forgot-password': '/forgot-password',\n  'reset-password': '/reset-password',");
  content = content.replace("if (normalizedPath === '/forgot-password') return { page: 'forgot-password', pathname, search };", "if (normalizedPath === '/forgot-password') return { page: 'forgot-password', pathname, search };\n  if (normalizedPath === '/reset-password') return { page: 'reset-password', pathname, search };");
  fs.writeFileSync(file, content, 'utf8');
}

console.log('appRouter.ts updated.');
