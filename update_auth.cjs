const fs = require('fs');

const file = 'c:/Qofeno/QofenoGlobalTool/src/components/Pages/Auth.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("import { Turnstile }")) {
  content = content.replace(
    "import { SEO } from '../../components/SEO';",
    "import { SEO } from '../../components/SEO';\nimport { Turnstile } from '@marsidev/react-turnstile';"
  );
}

if (!content.includes("const [turnstileToken, setTurnstileToken] = useState('')")) {
  content = content.replace(
    "const [shake, setShake] = useState(false);",
    "const [shake, setShake] = useState(false);\n  const [turnstileToken, setTurnstileToken] = useState('');"
  );
}

// Update validation
if (!content.includes("if (!isLogin && !turnstileToken)")) {
  content = content.replace(
    "if (!isLogin && password.length < 8) return 'Password must be at least 8 characters.';",
    "if (!isLogin && password.length < 8) return 'Password must be at least 8 characters.';\n    if (!isLogin && !turnstileToken) return 'Please complete the captcha verification.';"
  );
}

// Add Turnstile component to the form
if (!content.includes("<Turnstile")) {
  content = content.replace(
    "{errorMessage && (",
    `{!isLogin && (
            <div className="flex justify-center my-4">
              <Turnstile
                siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                onSuccess={(token) => setTurnstileToken(token)}
                onError={() => triggerError('Captcha verification failed. Please try again.')}
              />
            </div>
          )}
          {errorMessage && (`
  );
}

fs.writeFileSync(file, content, 'utf8');
console.log('Auth.tsx updated with Turnstile.');
