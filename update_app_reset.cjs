const fs = require('fs');

const file = 'c:/Qofeno/QofenoGlobalTool/src/App.tsx';
let content = fs.readFileSync(file, 'utf8');

// Add import
if (!content.includes("import { ResetPassword }")) {
  content = content.replace(
    "import { ForgotPassword } from './components/Pages/ForgotPassword';",
    "import { ForgotPassword } from './components/Pages/ForgotPassword';\nimport { ResetPassword } from './components/Pages/ResetPassword';"
  );
}

// Add to render switch
if (!content.includes("activeTab === 'reset-password'")) {
  content = content.replace(
    "{activeTab === 'forgot-password' && <ForgotPassword onNavigate={setActiveTab} />}",
    "{activeTab === 'forgot-password' && <ForgotPassword onNavigate={setActiveTab} />}\n              {activeTab === 'reset-password' && <ResetPassword onNavigate={setActiveTab} />}"
  );
}

fs.writeFileSync(file, content, 'utf8');
console.log('App.tsx updated to include ResetPassword route.');
