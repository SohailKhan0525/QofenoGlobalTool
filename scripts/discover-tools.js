import fs from 'fs';
import path from 'path';

const root = process.cwd();
const catalogPath = path.join(root, 'src', 'lib', 'toolCatalog.ts');
const fileToolPath = path.join(root, 'src', 'components', 'Pages', 'FileToolWorkspace.tsx');
const toolPagePath = path.join(root, 'src', 'components', 'Pages', 'ToolPage.tsx');
const functionsRoot = path.join(root, 'appwrite-functions', 'tools');
const outputPath = path.join(root, 'scratch', 'tool-inventory.md');

function read(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

function safeRead(filePath) {
  try {
    return read(filePath);
  } catch {
    return '';
  }
}

function parseCatalogEntries(text) {
  const entries = [];
  const regex = /id:\s*'([^']+)'[\s\S]*?slug:\s*'([^']+)'[\s\S]*?name:\s*'([^']+)'[\s\S]*?category:\s*'([^']+)'[\s\S]*?type:\s*'([^']+)'[\s\S]*?functionId:\s*[^|]+?\|\|\s*'([^']+)'/g;
  for (const match of text.matchAll(regex)) {
    entries.push({
      id: match[1],
      slug: match[2],
      name: match[3],
      category: match[4],
      type: match[5],
      functionId: match[6],
    });
  }
  return entries;
}

function parseFileToolConfig(text) {
  const config = new Map();
  const start = text.indexOf('const FILE_TOOL_CONFIG: Record<string, FileToolConfig> = {');
  const end = text.indexOf('};\r\n\r\nfunction humanFileSize', start);
  if (start === -1 || end === -1) return config;
  const slice = text.slice(start, end);
  const blocks = [...slice.matchAll(/'([^']+)':\s*\{([\s\S]*?)\n\s*\},/g)];
  for (const match of blocks) {
    const slug = match[1];
    const body = match[2];
    const acceptMatch = body.match(/accept:\s*'([^']+)'/);
    const processLabelMatch = body.match(/processLabel:\s*'([^']+)'/);
    const fieldMatches = [...body.matchAll(/\{\s*type:\s*'([^']+)'/g)].map((item) => item[1]);
    config.set(slug, {
      accept: acceptMatch ? acceptMatch[1] : '',
      processLabel: processLabelMatch ? processLabelMatch[1] : '',
      fields: fieldMatches,
    });
  }
  return config;
}

function parseFileToolSlugs(text) {
  const start = text.indexOf('export const FILE_TOOL_SLUGS = new Set([');
  const end = text.indexOf(']);', start);
  if (start === -1 || end === -1) return new Set();
  const slice = text.slice(start, end);
  const slugs = [...slice.matchAll(/'([^']+)'/g)]
    .map((match) => match[1])
    .filter((slug) => !slug.includes('/') && !slug.startsWith('@') && !slug.includes(' '));
  return new Set(slugs);
}

function isPlaceholderFunction(content) {
  return content.includes('// Placeholder') ||
    content.includes('// Simplistic booklet') ||
    content.includes('just copy pages for now') ||
    (content.includes('PDFDocument.create()') && !content.includes('processWithRetry')) ||
    (content.includes('PDFDocument.load') === false && content.includes("tool_slug: 'pdf-") && !content.includes('gs') && !content.includes('soffice') && !content.includes('pdf-portfolio'));
}

function normalizeAccept(accept) {
  if (!accept) return ['unknown'];
  return accept.split(',').map((value) => value.trim()).filter(Boolean);
}

function markdownEscape(value) {
  return String(value ?? '').replaceAll('|', '\\|').replaceAll('\n', ' ');
}

function formatArray(values) {
  return `[${values.map((item) => `"${item}"`).join(', ')}]`;
}

function main() {
  const catalogText = read(catalogPath);
  const fileToolText = safeRead(fileToolPath);
  safeRead(toolPagePath);

  const catalogEntries = parseCatalogEntries(catalogText);
  const fileToolConfig = parseFileToolConfig(fileToolText);
  const fileToolSlugs = parseFileToolSlugs(fileToolText);
  const textToolSlugs = new Set(['json-formatter', 'base64-encoder', 'word-counter']);
  const functionDirs = fs.existsSync(functionsRoot)
    ? fs.readdirSync(functionsRoot, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => entry.name)
    : [];
  const functionDirSet = new Set(functionDirs);

  const rows = [];
  let placeholderCount = 0;

  for (const tool of catalogEntries) {
    const toolDir = path.join(functionsRoot, tool.slug);
    const mainJsPath = path.join(toolDir, 'src', 'main.js');
    const hasFunction = functionDirSet.has(tool.slug) && fs.existsSync(mainJsPath);
    const mainJs = hasFunction ? read(mainJsPath) : '';
    const isStub = hasFunction && isPlaceholderFunction(mainJs);
    const settings = fileToolConfig.get(tool.slug);
    const hasSettings = Boolean(settings);
    const isWired = hasSettings || textToolSlugs.has(tool.slug);
    const acceptedTypes = textToolSlugs.has(tool.slug)
      ? ['text/plain']
      : settings
        ? normalizeAccept(settings.accept)
        : ['unknown'];
    const outputType = textToolSlugs.has(tool.slug) ? 'text/plain' : 'unknown';
    const status = !hasFunction
      ? 'missing'
      : isStub
        ? 'stub'
        : isWired
          ? 'working'
          : 'broken';

    if (isStub) placeholderCount += 1;

    rows.push({
      slug: tool.slug,
      name: tool.name,
      category: tool.category,
      is_free: tool.type === 'Free',
      function_id: tool.functionId,
      accepted_types: acceptedTypes,
      output_type: outputType,
      has_function: hasFunction ? 'yes' : 'no',
      is_wired: isWired ? 'yes' : 'no',
      has_settings: hasSettings ? 'yes' : 'no',
      status,
    });
  }

  const table = [
    '# Qofeno Tool Inventory',
    '',
    `Generated from ${path.relative(root, catalogPath)}, ${path.relative(root, fileToolPath)}, ${path.relative(root, toolPagePath)}, and ${path.relative(root, functionsRoot)}.`,
    '',
    `Catalog tools: ${rows.length}`,
    `Function folders: ${functionDirs.length}`,
    `File-tool slugs: ${fileToolSlugs.size}`,
    `File-tool settings entries: ${fileToolConfig.size}`,
    `Placeholder/stub functions: ${placeholderCount}`,
    '',
    '| slug | name | category | is_free | function_id | accepted_types | output_type | has_function | is_wired | has_settings | status |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
    ...rows.map((row) => `| ${markdownEscape(row.slug)} | ${markdownEscape(row.name)} | ${markdownEscape(row.category)} | ${row.is_free ? 'true' : 'false'} | ${markdownEscape(row.function_id)} | ${markdownEscape(formatArray(row.accepted_types))} | ${markdownEscape(row.output_type)} | ${row.has_function} | ${row.is_wired} | ${row.has_settings} | ${row.status} |`),
    '',
    'Notes:',
    '- `category` preserves the catalog labels from source.',
    '- `accepted_types` and `output_type` are only filled when the source exposes them directly; otherwise they remain `unknown`.',
    '- `is_wired` is based on explicit file-workspace settings or the three ToolPage text-tool branches.',
    '- `status` is a static codebase heuristic: `working`, `broken`, `stub`, or `missing`.',
  ].join('\n');

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, table, 'utf8');
  console.log(table);
}

main();
