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
  ChevronDown: 'faChevronDown',
  ChevronLeft: 'faChevronLeft',
  ChevronRight: 'faChevronRight',
  MoreHorizontal: 'faEllipsis',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

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
    const faName = faMap[name] || 'faCheck'; // Fallback
    faIconsToImport.add(faName);
    const searchTag = asName || name;
    const regex = new RegExp(`<${searchTag}([^>]*)>`, 'g');
    content = content.replace(regex, (match, attrs) => {
      const isSelfClosing = match.endsWith('/>');
      const restAttrs = isSelfClosing ? attrs.slice(0, -1) : attrs;
      let finalAttrs = restAttrs;
      return `<FontAwesomeIcon icon={${faName}} ${finalAttrs}${isSelfClosing ? '/' : ''}>`;
    });
    content = content.replace(new RegExp(`</${searchTag}>`, 'g'), `</FontAwesomeIcon>`);
  });

  content = content.replace(/import\s+\{[^}]+\}\s+from\s+['"]lucide-react['"];?/, '');

  if (faIconsToImport.size > 0) {
    const faImportStr = `import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';\nimport { ${[...faIconsToImport].join(', ')} } from '@fortawesome/free-solid-svg-icons';\n`;
    content = faImportStr + content;
  }
  
  content = content.replace(/LucideIcon/g, 'any');

  fs.writeFileSync(filePath, content);
  console.log(`Processed ${filePath}`);
}

const uiDir = path.join(__dirname, 'components', 'ui');
if (fs.existsSync(uiDir)) {
  const files = fs.readdirSync(uiDir).map(f => path.join(uiDir, f));
  files.forEach(processFile);
}
