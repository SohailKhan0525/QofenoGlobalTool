import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: '.env.local' });

const token = process.env.SENTRY_AUTH_TOKEN;
const orgSlug = 'sohailkhan-0q';

async function setupSentryProject() {
  if (!token) {
    console.log("Missing SENTRY_AUTH_TOKEN");
    return;
  }
  console.log("\n=== SETTING UP SENTRY PROJECT ===\n");
  
  const pRes = await fetch(`https://de.sentry.io/api/0/organizations/${orgSlug}/projects/`, {
    headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
  });
  const projects = await pRes.json();
  console.log("Existing projects:", projects.map(p => p.slug));

  let project = projects.find(p => p.slug === 'qofeno' || p.slug === 'qofenoglobaltool');
  const targetSlug = project?.slug || 'qofeno';
  console.log(`Fetching DSN keys for project '${targetSlug}'...`);
  const keysRes = await fetch(`https://de.sentry.io/api/0/projects/${orgSlug}/${targetSlug}/keys/`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const keys = await keysRes.json();
  if (keysRes.ok && keys.length > 0) {
    console.log(`\n🎉 SENTRY DSN FOUND: ${keys[0].dsn.public}\n`);
  }
}

setupSentryProject();
