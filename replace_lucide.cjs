const fs = require('fs');
const path = require('path');

const faMap = {
  AlertCircle: 'faCircleExclamation',
  CheckCircle2: 'faCircleCheck',
  Check: 'faCheck',
  Copy: 'faCopy',
  FileText: 'faFileLines',
  ImageIcon: 'faImage',
  Loader2: 'faSpinner',
  Plus: 'faPlus',
  Trash2: 'faTrashCan',
  UploadCloud: 'faCloudArrowUp',
  Video: 'faVideo',
  Download: 'faDownload',
  Sparkles: 'faWandMagicSparkles',
  SlidersHorizontal: 'faSliders',
  HelpCircle: 'faCircleQuestion',
  ChevronDown: 'faChevronDown'
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Find all used lucide icons
  const lucideImportMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"]/);
  if (!lucideImportMatch) return;

  const usedIcons = lucideImportMatch[1]
    .split(',')
    .map(i => i.trim())
    .filter(i => i && i !== 'LucideIcon');

  const faIconsToImport = new Set();
  usedIcons.forEach(icon => {
    let name = icon;
    let asName = null;
    if (icon.includes(' as ')) {
      const parts = icon.split(' as ');
      name = parts[0].trim();
      asName = parts[1].trim();
    }
    const faName = faMap[name];
    if (faName) {
      faIconsToImport.add(faName);
      const searchTag = asName || name;
      // Replace <IconName ... /> or <IconName>
      const regex = new RegExp(`<${searchTag}([^>]*)>`, 'g');
      content = content.replace(regex, (match, attrs) => {
        // if attrs contains className, inject it
        // Check for self closing
        const isSelfClosing = match.endsWith('/>');
        const restAttrs = isSelfClosing ? attrs.slice(0, -1) : attrs;
        let finalAttrs = restAttrs;
        if (searchTag === 'Loader2') {
          if (!finalAttrs.includes('className')) {
            finalAttrs += ' className="animate-spin" ';
          } else if (!finalAttrs.includes('animate-spin')) {
            finalAttrs = finalAttrs.replace(/className=(['"])(.*?)\1/, `className=$1$2 animate-spin$1`);
          }
        }
        return `<FontAwesomeIcon icon={${faName}} ${finalAttrs}${isSelfClosing ? '/' : ''}>`;
      });
      // Replace </IconName>
      content = content.replace(new RegExp(`</${searchTag}>`, 'g'), `</FontAwesomeIcon>`);
    }
  });

  // Remove lucide import
  content = content.replace(/import\s+\{[^}]+\}\s+from\s+['"]lucide-react['"];?/, '');

  // Add FA imports
  const faImportStr = `import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';\nimport { ${[...faIconsToImport].join(', ')} } from '@fortawesome/free-solid-svg-icons';\n`;
  content = faImportStr + content;

  // Replace LucideIcon type with any or FontAwesomeIcon props
  content = content.replace(/LucideIcon/g, 'any');

  fs.writeFileSync(filePath, content);
  console.log(`Processed ${filePath}`);
}

const files = [
  path.join(__dirname, 'src/components/Pages/PricingView.tsx'),
  path.join(__dirname, 'src/components/Pages/FileToolWorkspace.tsx')
];

files.forEach(f => {
  if (fs.existsSync(f)) {
    processFile(f);
  }
});
