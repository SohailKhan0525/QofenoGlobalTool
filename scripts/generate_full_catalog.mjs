import fs from 'fs';
import path from 'path';

const toolsDir = path.join(process.cwd(), 'appwrite-functions', 'tools');
const toolCatalogPath = path.join(process.cwd(), 'src', 'lib', 'toolCatalog.ts');

const directories = fs.readdirSync(toolsDir).filter(f => fs.statSync(path.join(toolsDir, f)).isDirectory());

function categorizeSlug(slug) {
  if (slug.includes('pdf')) return { cat: 'PDF & Documents', icon: 'faFileLines' };
  if (slug.includes('video')) return { cat: 'Video Tools', icon: 'faVideo' };
  if (slug.includes('image') || slug.includes('jpg')) return { cat: 'Image Tools', icon: 'faImageIcon' };
  if (slug.includes('audio')) return { cat: 'Audio Tools', icon: 'faMusic' };
  if (slug.includes('word') || slug.includes('excel') || slug.includes('powerpoint')) return { cat: 'PDF & Documents', icon: 'faFileLines' };
  if (slug.includes('json') || slug.includes('base64') || slug.includes('text')) return { cat: 'Developer Tools', icon: 'faCode' };
  return { cat: 'AI & Automation', icon: 'faRobot' };
}

function subcategorize(slug) {
  if (slug.includes('compress')) return 'Compressors';
  if (slug.includes('convert') || slug.includes('to')) return 'Converters';
  if (slug.includes('merge') || slug.includes('combine')) return 'Combiners';
  if (slug.includes('split') || slug.includes('extract')) return 'Separators';
  if (slug.includes('manipulator') || slug.includes('edit')) return 'Editors';
  if (slug.includes('resize') || slug.includes('crop') || slug.includes('trim')) return 'Resizers';
  return 'Utilities';
}

function formatName(slug) {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
    .replace('Pdf', 'PDF')
    .replace('Jpg', 'JPG')
    .replace('Html', 'HTML')
    .replace('Json', 'JSON')
    .replace('Ocr', 'OCR')
    .replace('Bg', 'Background');
}

function determineType(slug) {
  const proKeywords = ['ocr', 'protect', 'unlock', 'watermark', 'sign', 'repair', 'compare'];
  return proKeywords.some(k => slug.includes(k)) ? 'Pro' : 'Free';
}

let toolsArrayStr = `export const FALLBACK_TOOLS: ToolCard[] = [\n`;

for (const slug of directories) {
  const { cat, icon } = categorizeSlug(slug);
  const subcat = subcategorize(slug);
  const name = formatName(slug);
  const type = determineType(slug);
  
  // Format VITE env var mapping for the function ID
  const envKey = `VITE_APPWRITE_FUNCTION_${slug.toUpperCase().replace(/-/g, '_')}_ID`;
  
  toolsArrayStr += `  {
    id: '${slug}',
    slug: '${slug}',
    name: '${name}',
    category: '${cat}',
    subcategory: '${subcat}',
    type: '${type}',
    isNew: true,
    isPopular: false,
    runs: '0',
    desc: 'High-quality ${name} tool running directly in your browser or securely on our servers.',
    icon: ${icon},
    imageUrl: null,
    schemaMarkup: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: '${name}',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      description: 'High-quality ${name} tool running directly in your browser or securely on our servers.',
    }),
    functionId: import.meta.env.${envKey} || '${slug}',
  },
`;
}

toolsArrayStr += `];`;

let catalogContent = fs.readFileSync(toolCatalogPath, 'utf8');

// Replace everything between export const FALLBACK_TOOLS: ToolCard[] = [ and ];
const regex = /export const FALLBACK_TOOLS: ToolCard\[\] = \[[\s\S]*?\];/;
if (regex.test(catalogContent)) {
  catalogContent = catalogContent.replace(regex, toolsArrayStr);
  fs.writeFileSync(toolCatalogPath, catalogContent);
  console.log(`Successfully injected ${directories.length} tools into toolCatalog.ts`);
} else {
  console.error("Could not find FALLBACK_TOOLS array in toolCatalog.ts");
}
