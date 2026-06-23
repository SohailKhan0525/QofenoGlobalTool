const fs = require('fs');

const file = 'c:/Qofeno/QofenoGlobalTool/src/components/Pages/CheckoutProPage.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes("import { Turnstile }")) {
  content = content.replace(
    "import { SEO } from '../SEO';",
    "import { SEO } from '../SEO';\nimport { Turnstile } from '@marsidev/react-turnstile';"
  );
}

if (!content.includes("const [turnstileToken, setTurnstileToken] = useState('')")) {
  content = content.replace(
    "const [isYearly, setIsYearly] = useState(false);",
    "const [isYearly, setIsYearly] = useState(false);\n  const [turnstileToken, setTurnstileToken] = useState('');"
  );
}

if (!content.includes("<Turnstile")) {
  const newButtonLogic = `
          {turnstileToken ? (
            <PayPalButton isYearly={isYearly} />
          ) : (
            <div className="flex flex-col items-center">
              <p className="text-sm text-neutral-400 mb-3 text-center">Please complete the captcha to checkout securely.</p>
              <div className="bg-white/5 rounded-xl p-2 border border-white/10">
                <Turnstile
                  siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY || '1x00000000000000000000AA'}
                  onSuccess={(token) => setTurnstileToken(token)}
                  options={{ theme: 'dark' }}
                />
              </div>
            </div>
          )}
  `;
  content = content.replace("<PayPalButton isYearly={isYearly} />", newButtonLogic);
}

fs.writeFileSync(file, content, 'utf8');
console.log('CheckoutProPage.tsx updated with Turnstile.');
