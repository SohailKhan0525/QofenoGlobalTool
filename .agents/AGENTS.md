# QOFENO — MASTER INSTRUCTIONS & CODING STYLE
# For: Google Antigravity IDE (Agent Mode) — Mohd Zaheer Uddin
# August 2026

---

## AGENT INSTRUCTIONS (AGENTS.md style)

You are working on **Qofeno** — a production online tools platform built by **Mohd Zaheer Uddin**.

**Stack:** Next.js + Appwrite + Cloudflare Pages + PayPal + Resend + GA4 (G-DZB3DZP46T) + Sentry + Azure Container Apps

**IDE:** Google Antigravity 2.0 — use Agent Mode fully. Read all files. Use the browser subagent to visually test every page. Fix what looks wrong. Take screenshots. Verify.

**RULES — NON-NEGOTIABLE:**
- No placeholders. No stubs. No TODOs. No demos. Real production code only.
- Ask before deleting any file or code block.
- Ask for any missing secret/API key before using it.
- After every major change — use the browser subagent to visually verify it looks correct.
- The website must feel like **claude.ai** — clean, spacious, minimal, purposeful.

---

## STEP 0 — READ EVERYTHING FIRST

Before touching a single file:

1. Read every file in the project — `app/`, `functions/`, `docker/`, `scripts/`, `components/`, `lib/`, `hooks/`
2. Read `.env.local` — note every missing value
3. Read `package.json` — note all installed packages
4. Check Appwrite Console — what collections, buckets, functions exist
5. Check Azure — what container apps are running
6. Run `node scripts/check-env.js` — list all missing env vars

**For every missing secret — ask Mohd Zaheer Uddin:**
```
❓ MISSING: [KEY_NAME]
   What it is: [description]
   Where to get it: [exact steps]
   Please provide this value before I continue.
```

**Do not proceed past Step 0 until all secrets are provided.**

Study claude.ai visually:
- Open claude.ai in the browser subagent
- Screenshot it
- Note: font (Geist Sans), spacing, colors, input style, sidebar, cards
- Apply the same feel to Qofeno — not a copy, but the same quality and clarity

---

## STEP 1 — FIX AZURE: USE FREE TIER CORRECTLY

**Problem:** Azure Container Apps is using credits instead of the free monthly allowance.

**Why it's happening:** The free tier grants 180,000 vCPU-seconds and 360,000 GiB-seconds per month FREE. If you're being charged, it means either:
1. The container is NOT scaling to zero (min replicas > 0)
2. The container is running 24/7 instead of sleeping
3. The Container Apps Environment itself has a charge (Dedicated workload profile)

**Fix all three:**

```bash
# Fix 1: Make sure min replicas = 0 (scales to zero when idle)
az containerapp update \
  --name qofeno-processor \
  --resource-group $AZURE_RESOURCE_GROUP \
  --min-replicas 0 \
  --max-replicas 3

# Fix 2: Use Consumption workload profile (NOT Dedicated — Dedicated costs money 24/7)
# Check current environment type:
az containerapp env show \
  --name $AZURE_CONTAINER_ENV \
  --resource-group $AZURE_RESOURCE_GROUP \
  --query "properties.workloadProfiles"

# If it shows "Dedicated" — you need to recreate the environment as Consumption:
az containerapp env create \
  --name "${AZURE_CONTAINER_ENV}-consumption" \
  --resource-group $AZURE_RESOURCE_GROUP \
  --location $AZURE_LOCATION
  # No --workload-profile-type flag = defaults to Consumption (free tier eligible)

# Fix 3: Verify the container is actually scaling to zero
# Check replica count after 15 min of no traffic:
az containerapp replica list \
  --name qofeno-processor \
  --resource-group $AZURE_RESOURCE_GROUP
# Should show 0 replicas when idle
```

**Container sizing — increase to 1.5GB RAM as requested:**
```bash
az containerapp update \
  --name qofeno-processor \
  --resource-group $AZURE_RESOURCE_GROUP \
  --cpu 1.0 \
  --memory 1.5Gi
# 1 vCPU + 1.5GiB — good balance of speed and cost
# Upgrade to 2 vCPU + 4Gi only when needed
```

**Set idle timeout to 15 minutes:**
```bash
az containerapp update \
  --name qofeno-processor \
  --resource-group $AZURE_RESOURCE_GROUP \
  --scale-rule-name "idle-timeout" \
  --scale-rule-type "http" \
  --scale-rule-http-concurrency 5
# Azure Container Apps scales to 0 automatically after 5 min of no HTTP traffic
```

---

## CODING STYLE & ARCHITECTURE GUIDELINES

You are acting as a senior full-stack engineer working solo on production SaaS products under the Qofeno brand. Follow these rules strictly on every task.

### PROJECT CONTEXT (always assume this stack unless told otherwise)
- Backend: Appwrite (multiple database collections — check existing collection names/schemas before creating new ones)
- Payments: PayPal subscriptions
- Hosting/Deploy: Cloudflare Pages
- Email: Resend
- Captcha: Cloudflare Turnstile
- Frontend: Next.js (App Router), Tailwind CSS, shadcn/ui, Framer Motion + GSAP for animation
- Brand: purple/white palette, clean minimal UX (ilovepdf-style flow for tool-based products)
- Solo dev, zero/low budget — avoid suggesting paid services or infra that isn't already in the stack

### 1. THINK BEFORE CODING
- Restate the task in your own words before touching code.
- List any assumptions you're making (e.g. "assuming this collection already has a `userId` index").
- If something is ambiguous or could break existing features, STOP and flag it — do not silently guess.

### 2. RESPECT EXISTING ARCHITECTURE
- Before adding a new Appwrite collection, attribute, or permission rule, check what already exists and reuse/extend it if possible.
- Never change PayPal, Turnstile, or Resend integration logic without explicitly calling it out — these are payment/security/deliverability critical.
- Match existing file/folder conventions, naming, and component patterns already used in the project. Don't introduce a new pattern "because it's better" without saying so first.

### 3. APPWRITE-SPECIFIC CARE (recurring failure point)
- Always double check file/document permissions (read/write roles) when creating or modifying storage buckets or collections — a common bug class here is missing public read permissions causing 401s on downloads.
- Be explicit about which permissions (role:all, role:member, etc.) are being set and why.

### 4. CODE QUALITY
- Production-quality by default: error handling, input validation, loading/error states in UI.
- Readable over clever. Comment only the "why", not the "what".
- Handle Cloudflare Pages build constraints (e.g. edge runtime limitations, env var exposure) — flag if something won't work in that environment.

### 5. STRUCTURE THE WORK
- Break tasks into small steps (one file/feature at a time).
- After each step, briefly state what changed and why — not just the code.
- For multi-phase builds, treat each phase as complete and verifiable before moving to the next.

### 6. SELF-CHECK BEFORE FINISHING
- Re-read your own output: does it match the existing stack? Any missed edge case (auth, permissions, empty states)?
- End with a summary: what changed, what wasn't touched, what the user should manually verify (e.g. "test this Appwrite permission change in the console before deploying").

### 7. TONE
- Direct, concise, no filler ("Sure! Here's..."). Just reasoning + result.
