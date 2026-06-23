const fs = require('fs');
const path = require('path');

const iconMapping = {
  Search: 'faMagnifyingGlass',
  ChevronDown: 'faChevronDown',
  ChevronRight: 'faChevronRight',
  Check: 'faCheck',
  Flame: 'faFire',
  SlidersHorizontal: 'faSliders',
  Settings: 'faGear',
  Heart: 'faHeart',
  Sparkles: 'faWandMagicSparkles',
  FileText: 'faFileLines',
  ImageIcon: 'faImage',
  Video: 'faVideo',
  Cpu: 'faMicrochip',
  Code2: 'faCode',
  BarChart3: 'faChartColumn',
  GraduationCap: 'faGraduationCap',
  Scale: 'faScaleBalanced',
  ShieldAlert: 'faShieldHalved',
  Mail: 'faEnvelope',
  Zap: 'faBolt',
  ArrowRight: 'faArrowRight',
  User: 'faUser',
  Laptop: 'faLaptop',
  Users: 'faUsers',
  Calendar: 'faCalendar',
  ShieldCheck: 'faShieldHalved',
  Star: 'faStar',
  Plus: 'faPlus',
  CheckCircle2: 'faCircleCheck',
  MessageSquare: 'faMessage',
  LayoutDashboard: 'faTableColumns',
  CreditCard: 'faCreditCard',
  Lock: 'faLock',
  ArrowLeft: 'faArrowLeft',
  Shield: 'faShield',
  HardDrive: 'faHardDrive',
  Clock: 'faClock',
  DownloadCloud: 'faCloudArrowDown',
  Copy: 'faCopy',
  CheckCircle: 'faCircleCheck',
  Wand2: 'faWandMagic',
  X: 'faXmark',
  AlertCircle: 'faCircleExclamation',
  Twitter: 'faTwitter',
  Github: 'faGithub',
  Linkedin: 'faLinkedin',
  Facebook: 'faFacebook',
  Loader2: 'faSpinner',
  Upload: 'faUpload',
  Download: 'faDownload',
  Eye: 'faEye',
  EyeOff: 'faEyeSlash'
};

const baseDir = 'c:/Qofeno/QofenoGlobalTool/src/components/Pages';
const files = [
  'ToolsCatalog.tsx', 'Terms.tsx', 'PricingView.tsx', 'Policy.tsx', 
  'Payment.tsx', 'ForgotPassword.tsx', 'FileToolWorkspace.tsx', 
  'Contact.tsx', 'ComingSoon.tsx', 'BlogDocs.tsx', 'AuthCallback.tsx', 'About.tsx'
];

function processFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  let content = fs.readFileSync(filePath, 'utf-8');

  if (!content.includes('lucide-react')) return;

  // Extract imports from lucide-react to know which FA icons to use
  const lucideImportMatch = content.match(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?/);
  if (!lucideImportMatch) return;
  
  const importedLucideIcons = lucideImportMatch[1].split(',').map(s => s.trim().split(/\s+as\s+/)[0]).filter(Boolean);
  
  // Replace lucide import
  content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];?\s*/g, '');

  const faIconsToImport = new Set();
  importedLucideIcons.forEach(name => {
    if (iconMapping[name]) faIconsToImport.add(iconMapping[name]);
  });

  const uniqueFaIcons = Array.from(faIconsToImport);
  if (uniqueFaIcons.length > 0) {
    const faImport = `import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';\nimport { ${uniqueFaIcons.join(', ')} } from '@fortawesome/free-solid-svg-icons';\n`;
    
    // insert after React import
    if (content.includes('import React')) {
        content = content.replace(/(import React.*?;\n)/, `$1${faImport}`);
    } else {
        content = faImport + content;
    }
  }

  // Replace usages
  importedLucideIcons.forEach(lucideName => {
    const faName = iconMapping[lucideName];
    if (!faName) return;

    // 1. JSX tags <IconName .../> -> <FontAwesomeIcon icon={faName} .../>
    const jsxRegex = new RegExp(`<${lucideName}\\s+([^>]*?)>`, 'g');
    content = content.replace(jsxRegex, `<FontAwesomeIcon icon={${faName}} $1>`);
    
    const selfCloseRegex = new RegExp(`<${lucideName}\\s*/>`, 'g');
    content = content.replace(selfCloseRegex, `<FontAwesomeIcon icon={${faName}} />`);

    // 2. Variables assigned or used as components
    const varRegex = new RegExp(`(?<![a-zA-Z])icon:\\s*${lucideName}(?![a-zA-Z])`, 'g');
    content = content.replace(varRegex, `icon: ${faName}`);
  });

  // Handle generic dynamic icon components <ToolIcon ... />
  content = content.replace(/<ToolIcon\s+([^>]*?)>/g, '<FontAwesomeIcon icon={ToolIcon} $1>');
  content = content.replace(/<Icon\s+([^>]*?)>/g, '<FontAwesomeIcon icon={Icon} $1>');

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log('Processed', filePath);
}

files.forEach(f => processFile(path.join(baseDir, f)));
