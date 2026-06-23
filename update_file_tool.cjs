const fs = require('fs');

const file = 'c:/Qofeno/QofenoGlobalTool/src/components/Pages/FileToolWorkspace.tsx';
let content = fs.readFileSync(file, 'utf8');

// Ensure realtime is imported
if (!content.includes("import { realtime }")) {
  content = content.replace(
    "import { executeJsonFunction, FUNCTION_IDS } from '../../lib/qofeno-appwrite';",
    "import { executeJsonFunction, FUNCTION_IDS, realtime, DATABASE_ID } from '../../lib/qofeno-appwrite';"
  );
}

// Add state for logs and executionId
if (!content.includes("const [serverLogs, setServerLogs] = useState<string[]>([])")) {
  content = content.replace(
    "const [wrongType, setWrongType] = useState(false);",
    `const [wrongType, setWrongType] = useState(false);
  const [serverLogs, setServerLogs] = useState<string[]>([]);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);`
  );
}

// Reset logs on stage reset
content = content.replace(/setWrongType\(false\);/g, "setWrongType(false);\n    setServerLogs([]);\n    setCurrentExecutionId(null);");

// Subscribe to real-time logs when processing
if (!content.includes("useEffect(() => {\n    if (stage !== 'processing') return;")) {
  const effectCode = `
  useEffect(() => {
    if (stage !== 'processing') return;
    const channel = \`databases.\${DATABASE_ID}.collections.tool_logs.documents\`;
    const sub = realtime.subscribe(channel, (event: any) => {
      const doc = event?.payload;
      if (doc && doc.log_message) {
        setServerLogs(prev => [...prev, doc.log_message].slice(-5));
      }
    });
    return () => {
      sub();
    };
  }, [stage]);
`;
  content = content.replace("const runTool = async () => {", effectCode + "\n  const runTool = async () => {");
}

// Inject the terminal output UI into the processing stage
if (!content.includes("Terminal Logs")) {
  const terminalUI = `
        <div className="w-full max-w-md mt-6 bg-[#0F0A1E] text-green-400 rounded-xl p-4 font-mono text-xs overflow-hidden h-32 flex flex-col justify-end relative shadow-inner">
          <div className="absolute top-2 left-3 text-neutral-500 font-bold uppercase text-[10px]">Server Logs</div>
          <div className="mt-4 flex flex-col gap-1">
            {serverLogs.length === 0 && <span className="text-neutral-500 animate-pulse">Waiting for backend initialization...</span>}
            {serverLogs.map((log, i) => (
              <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="truncate">
                > {log}
              </motion.div>
            ))}
          </div>
        </div>
  `;
  content = content.replace(
    /<\/div>\s*<\/motion\.div>/g,
    `</div>\n${terminalUI}\n      </motion.div>`
  );
}

fs.writeFileSync(file, content, 'utf8');
console.log('FileToolWorkspace.tsx updated with Realtime Logs.');
