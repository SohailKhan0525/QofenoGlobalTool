const fs = require('fs');

const appTsx = 'c:/Qofeno/QofenoGlobalTool/src/App.tsx';
let content = fs.readFileSync(appTsx, 'utf8');

// Add imports
if (!content.includes("import { Cookies }")) {
  content = content.replace(
    "import { Terms } from './components/Pages/Terms';",
    "import { Terms } from './components/Pages/Terms';\nimport { Cookies } from './components/Pages/Cookies';"
  );
}

if (!content.includes("import { CookieConsentBanner }")) {
  content = content.replace(
    "import { ErrorBoundary } from './components/ErrorBoundary';",
    "import { ErrorBoundary } from './components/ErrorBoundary';\nimport { CookieConsentBanner } from './components/CookieConsentBanner';"
  );
}

// Add route logic
if (!content.includes("activeTab === 'cookies'")) {
  const replacement = `
          {activeTab === 'cookies' && (
            <motion.div key="cookies" variants={PAGE_VARIANTS} initial="initial" animate="animate" exit="exit" className="absolute inset-0">
              <Cookies />
            </motion.div>
          )}
          {activeTab === 'terms' && (`;
  
  content = content.replace("{activeTab === 'terms' && (", replacement);
}

// Add banner below router
if (!content.includes("<CookieConsentBanner")) {
  content = content.replace(
    "<Toaster position=\"top-center\" />",
    "<Toaster position=\"top-center\" />\n        <CookieConsentBanner onNavigate={setActiveTab} />"
  );
}

fs.writeFileSync(appTsx, content, 'utf8');
console.log('App.tsx updated with Cookies route and Banner.');
