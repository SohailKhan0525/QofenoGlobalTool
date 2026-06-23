const fs = require('fs');

const homePath = 'c:/Qofeno/QofenoGlobalTool/src/components/Pages/Home.tsx';
let content = fs.readFileSync(homePath, 'utf8');

// Ensure Appwrite imports are present
if (!content.includes("import { databases, DATABASE_ID }")) {
  content = content.replace(
    "import { useToolCatalog } from '../../lib/toolCatalog';",
    "import { useToolCatalog } from '../../lib/toolCatalog';\nimport { databases, DATABASE_ID } from '../../lib/qofeno-appwrite';\nimport { Query } from 'appwrite';"
  );
}

// Add state for dynamic tools and stats
if (!content.includes("const [dynamicFeaturedTools, setDynamicFeaturedTools] = useState<any[]>([])")) {
  content = content.replace(
    "const [stats, setStats] = useState({ tools: 0, files: 0, countries: 0 });",
    `const [stats, setStats] = useState({ tools: 0, files: 0, countries: 0 });
  const [dynamicFeaturedTools, setDynamicFeaturedTools] = useState<any[]>([]);
  const [dynamicToolsCount, setDynamicToolsCount] = useState(0);
  const [toolsAddedRecently, setToolsAddedRecently] = useState(false);`
  );
}

// Add useEffect to fetch data
if (!content.includes("databases.listDocuments(DATABASE_ID, 'tools'")) {
  const effectCode = `
  useEffect(() => {
    async function fetchRealData() {
      try {
        const toolsData = await databases.listDocuments(DATABASE_ID, 'tools', [
          Query.equal('is_active', true),
          Query.orderDesc('created_at'),
          Query.limit(8)
        ]);
        setDynamicFeaturedTools(toolsData.documents);
        setDynamicToolsCount(toolsData.total);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentTools = await databases.listDocuments(DATABASE_ID, 'tools', [
          Query.greaterThan('created_at', sevenDaysAgo.toISOString()),
          Query.equal('is_active', true)
        ]);
        setToolsAddedRecently(recentTools.total > 0);
      } catch (err) {
        console.error('Failed to fetch dynamic tools data', err);
      }
    }
    fetchRealData();
  }, []);
`;
  content = content.replace(/useEffect\(\(\) => \{\n\s+\/\/ Counting up stats/g, effectCode + "\n  useEffect(() => {\n    // Counting up stats");
}

fs.writeFileSync(homePath, content, 'utf8');
console.log('Home.tsx updated with dynamic data fetching.');
