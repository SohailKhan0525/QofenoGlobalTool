const fs = require('fs');
const path = require('path');

const toolCatalogPath = path.join(__dirname, '../src/lib/toolCatalog.ts');
const publicDir = path.join(__dirname, '../public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');

try {
  const catalogContent = fs.readFileSync(toolCatalogPath, 'utf8');
  // Look for slug: 'slug-value'
  const slugRegex = /slug:\s*['"]([^'"]+)['"]/g;
  const slugs = [];
  let match;
  while ((match = slugRegex.exec(catalogContent)) !== null) {
    slugs.push(match[1]);
  }

  // Deduplicate slugs
  const uniqueSlugs = Array.from(new Set(slugs));

  const baseUrl = 'https://qofeno-labs.pages.dev';
  const staticRoutes = [
    '',
    '/tools',
    '/pricing',
    '/whats-new',
    '/about',
    '/contact',
    '/profile',
    '/settings',
    '/terms',
    '/policy'
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  // Add static routes
  for (const route of staticRoutes) {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}${route}</loc>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>${route === '' ? '1.0' : '0.8'}</priority>\n`;
    xml += `  </url>\n`;
  }

  // Add dynamic tool routes
  for (const slug of uniqueSlugs) {
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/tools/${slug}</loc>\n`;
    xml += `    <changefreq>weekly</changefreq>\n`;
    xml += `    <priority>0.6</priority>\n`;
    xml += `  </url>\n`;
  }

  xml += `</urlset>\n`;

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  fs.writeFileSync(sitemapPath, xml);
  console.log(`Generated sitemap with ${uniqueSlugs.length} tools to ${sitemapPath}`);
} catch (e) {
  console.error('Failed to generate sitemap:', e);
  process.exit(1);
}
