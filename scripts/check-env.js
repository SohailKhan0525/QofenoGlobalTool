// scripts/check-env.js
// Checks for all required env vars and tells you exactly what's missing

import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

const required = {
  // Appwrite
  "NEXT_PUBLIC_APPWRITE_ENDPOINT":       { public: true,  description: "Appwrite API endpoint URL" },
  "NEXT_PUBLIC_APPWRITE_PROJECT_ID":     { public: true,  description: "Appwrite project ID" },
  "APPWRITE_API_KEY":                    { public: false, description: "Appwrite server API key — get from Appwrite Console → API Keys" },

  // Google Analytics
  "NEXT_PUBLIC_GA_MEASUREMENT_ID":       { public: true,  description: "Google Analytics 4 Measurement ID — already known: G-DZB3DZP46T" },

  // PayPal
  "NEXT_PUBLIC_PAYPAL_CLIENT_ID":        { public: true,  description: "PayPal Client ID — get from developer.paypal.com → Apps & Credentials" },
  "PAYPAL_CLIENT_SECRET":                { public: false, description: "PayPal Client Secret — same page as Client ID" },
  "PAYPAL_PLAN_ID_MONTHLY":              { public: false, description: "PayPal Pro monthly plan ID — run scripts/setup-paypal.js to generate" },
  "PAYPAL_PLAN_ID_YEARLY":               { public: false, description: "PayPal Pro yearly plan ID — run scripts/setup-paypal.js to generate" },
  "PAYPAL_TEAMS_PLAN_ID_MONTHLY":        { public: false, description: "PayPal Teams monthly plan ID — run scripts/setup-paypal.js to generate" },
  "PAYPAL_TEAMS_PLAN_ID_YEARLY":         { public: false, description: "PayPal Teams yearly plan ID — run scripts/setup-paypal.js to generate" },
  "PAYPAL_WEBHOOK_ID":                   { public: false, description: "PayPal webhook ID — run scripts/setup-paypal-webhook.js to generate" },

  // Resend
  "RESEND_API_KEY":                      { public: false, description: "Resend API key — get from resend.com → API Keys" },
  "EMAIL_FROM_ADDRESS":                  { public: false, description: "Verified sender email — must be verified in Resend dashboard" },
  "ADMIN_EMAIL":                         { public: false, description: "Your personal email — receives contact form submissions" },

  // Cloudflare Turnstile
  "NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY":  { public: true,  description: "Turnstile site key — get from Cloudflare Dashboard → Turnstile" },
  "CLOUDFLARE_TURNSTILE_SECRET_KEY":            { public: false, description: "Turnstile secret key — same page as site key" },

  // Cloudflare Pages deployment
  "CLOUDFLARE_API_KEY":                  { public: false, description: "Cloudflare API token — cloudflare.com → Profile → API Tokens → Create Token" },
  "CLOUDFLARE_ACCOUNT_ID":               { public: false, description: "Cloudflare Account ID — cloudflare.com → right sidebar" },
  "CLOUDFLARE_PAGES_PROJECT":            { public: false, description: "Cloudflare Pages project name (e.g. qofeno-labs)" },

  // App
  "NEXT_PUBLIC_APP_URL":                 { public: true,  description: "Your live URL e.g. https://qofeno-labs.pages.dev" },
  "NEXT_PUBLIC_CONTACT_EMAIL":           { public: true,  description: "Public contact email shown on contact page" },
  "NEXT_PUBLIC_GITHUB_URL":              { public: true,  description: "Your GitHub profile URL" },
  "NEXT_PUBLIC_TWITTER_URL":             { public: true,  description: "Your Twitter/X profile URL" },
  "NEXT_PUBLIC_LINKEDIN_URL":            { public: true,  description: "Your LinkedIn profile URL" },
};

const missing = [];
const present = [];

for (const [key, info] of Object.entries(required)) {
  const value = process.env[key];
  if (!value || value.trim() === "") {
    missing.push({ key, ...info });
  } else {
    present.push(key);
  }
}

console.log("\n=== ENV VAR CHECK ===\n");

if (present.length > 0) {
  console.log(`✅ Present (${present.length}):`);
  present.forEach(k => console.log(`   ${k}`));
}

if (missing.length > 0) {
  console.log(`\n❌ MISSING (${missing.length}) — you need to provide these:\n`);
  missing.forEach(m => {
    console.log(`   ${m.key}`);
    console.log(`   → Where to get it: ${m.description}`);
    console.log(`   → Type: ${m.public ? "Public (NEXT_PUBLIC_ prefix)" : "Server-only (keep secret)"}`);
    console.log();
  });
  console.log("Add missing vars to .env.local before proceeding.");
  process.exit(1);  // stop here — don't deploy with missing keys
} else {
  console.log("\n✅ All required env vars present. Ready to deploy.\n");
}
