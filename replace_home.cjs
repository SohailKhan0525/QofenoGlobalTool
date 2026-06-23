const fs = require('fs');

const iconMapping = {
  FileText: 'faFileLines',
  ImageIcon: 'faImage',
  Video: 'faVideo',
  Cpu: 'faMicrochip',
  Code2: 'faCode',
  Sparkles: 'faWandMagicSparkles',
  BarChart3: 'faChartColumn',
  GraduationCap: 'faGraduationCap',
  Scale: 'faScaleBalanced',
  ShieldAlert: 'faShieldHalved',
  Mail: 'faEnvelope',
  Zap: 'faBolt',
  ChevronRight: 'faChevronRight',
  ArrowRight: 'faArrowRight',
  User: 'faUser',
  Laptop: 'faLaptop',
  Users: 'faUsers',
  Calendar: 'faCalendar',
  Search: 'faMagnifyingGlass',
  ShieldCheck: 'faShieldHalved',
  Heart: 'faHeart',
  Star: 'faStar',
  Plus: 'faPlus',
  CheckCircle2: 'faCircleCheck',
  MessageSquare: 'faMessage',
};

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');

  // Remove lucide-react import completely
  content = content.replace(/import\s+\{([^}]+)\}\s+from\s+['"]lucide-react['"];\s*/g, '');

  // Add FontAwesome imports
  const uniqueFaIcons = Array.from(new Set(Object.values(iconMapping)));
  const faImport = `import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';\nimport { ${uniqueFaIcons.join(', ')} } from '@fortawesome/free-solid-svg-icons';\n`;
  content = content.replace(/import\s+gsap\s+from/, faImport + 'import gsap from');

  // Find all <IconName .../> and replace with <FontAwesomeIcon icon={fa...} .../>
  for (const [lucideName, faName] of Object.entries(iconMapping)) {
    // 1. JSX elements
    const jsxRegex = new RegExp(`<${lucideName}\\s+([^>]*?)>`, 'g');
    content = content.replace(jsxRegex, `<FontAwesomeIcon icon={${faName}} $1>`);
    
    // 2. Object values, e.g. { icon: Code2 } -> { icon: faCode }
    const objRegex = new RegExp(`(?<![a-zA-Z])icon:\\s*${lucideName}(?![a-zA-Z])`, 'g');
    content = content.replace(objRegex, `icon: ${faName}`);
    
    // 3. React references without JSX, e.g. p.icon -> already handled if we pass faName directly
    // Also change { icon: Icon, text } -> we need to render <FontAwesomeIcon icon={Icon} .../>
    // In Home.tsx: <IconComp className="w-7 h-7" />
    // This is fine as long as IconComp is assigned the faName.
  }

  // Edge cases in Home.tsx:
  // <p.icon className={cn("w-28 h-28 opacity-60 hover:scale-110 transition-transform duration-700", p.iconColor)} />
  content = content.replace(/<p\.icon\s+([^>]+)>/g, '<FontAwesomeIcon icon={p.icon} $1>');
  
  // <ToolIcon className="w-6 h-6 text-purple-600 animate-pulse" />
  content = content.replace(/<ToolIcon\s+([^>]+)>/g, '<FontAwesomeIcon icon={ToolIcon} $1>');

  // <IconComp className="w-7 h-7" />
  content = content.replace(/<IconComp\s+([^>]+)>/g, '<FontAwesomeIcon icon={IconComp} $1>');

  fs.writeFileSync(filePath, content, 'utf-8');
}

processFile('c:/Qofeno/QofenoGlobalTool/src/components/Pages/Home.tsx');
console.log('Replaced Lucide with FA in Home.tsx');
