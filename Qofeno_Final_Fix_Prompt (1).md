You are an expert full-stack developer working on **Qofeno** — a growing online tools platform built by Mohd Zaheer Uddin.

**FIRST: Read and analyze every single file and folder in this project before touching anything.** Understand every page, component, Appwrite function, config, env setup, and existing implementations. List what's broken, what's incomplete, what needs fixing. Then fix everything in order.

You have full access to:
- All project files (read, create, update, delete)
- Appwrite via API key
- Cloudflare Pages via API key
- GitHub (commit, push)
- npm/yarn (install any package needed)
- Resend API key (provided below for real emails)
- PayPal Client ID + Secret (provided below for real payments)

**NO demo data. NO mock data. NO example data. NO placeholder content. NO MVPs. Everything must be real, live, and working.**

---

## CREDENTIALS TO USE:

```env
# PayPal (real — provided by Mohd Zaheer Uddin)
PAYPAL_CLIENT_ID=[I WILL PASTE HERE]
PAYPAL_CLIENT_SECRET=[I WILL PASTE HERE]
PAYPAL_MODE=live        # real live payments
PAYPAL_WEBHOOK_ID=[generate after creating webhook below]
NEXT_PUBLIC_PAYPAL_CLIENT_ID=[same as PAYPAL_CLIENT_ID]

# Resend (real email — provided by Mohd Zaheer Uddin)
RESEND_API_KEY=[I WILL PASTE HERE]
EMAIL_FROM_NAME=Qofeno
EMAIL_FROM_ADDRESS=hello@[your-domain]

# All existing env vars remain as-is
```

Add all of these to:
1. Your local `.env.local`
2. Appwrite Function environment variables (server functions only — never NEXT_PUBLIC_ for secrets)
3. Cloudflare Pages environment variables (production)
4. GitHub Actions secrets (for CI/CD)

---

## FIX 1 — PAYPAL PLANS + SUBSCRIPTIONS + WEBHOOK (REAL)

### Step 1: Create PayPal Products and Plans via PayPal API

Using the real PayPal credentials, create the subscription products and plans programmatically:

```js
// Run this as a one-time setup script: scripts/setup-paypal.js
const base = process.env.PAYPAL_MODE === "live"
  ? "https://api-m.paypal.com"
  : "https://api-m.sandbox.paypal.com"

// 1. Get access token
const auth = await fetch(`${base}/v1/oauth2/token`, {
  method: "POST",
  headers: {
    "Authorization": `Basic ${Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64")}`,
    "Content-Type": "application/x-www-form-urlencoded"
  },
  body: "grant_type=client_credentials"
})
const { access_token } = await auth.json()

// 2. Create Product
const product = await fetch(`${base}/v1/catalogs/products`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${access_token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    name: "Qofeno Pro",
    description: "Access to all Qofeno tools with priority processing",
    type: "SERVICE",
    category: "SOFTWARE"
  })
})
const productData = await product.json()
// Save productData.id as PAYPAL_PRODUCT_ID in env

// 3. Create Monthly Plan ($9/month)
const monthlyPlan = await fetch(`${base}/v1/billing/plans`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${access_token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    product_id: productData.id,
    name: "Qofeno Pro Monthly",
    billing_cycles: [{
      frequency: { interval_unit: "MONTH", interval_count: 1 },
      tenure_type: "REGULAR",
      sequence: 1,
      total_cycles: 0,
      pricing_scheme: { fixed_price: { value: "9.00", currency_code: "USD" } }
    }],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: { value: "0", currency_code: "USD" },
      setup_fee_failure_action: "CONTINUE",
      payment_failure_threshold: 3
    }
  })
})
const monthlyPlanData = await monthlyPlan.json()
// Save monthlyPlanData.id as PAYPAL_PLAN_ID_MONTHLY in env

// 4. Create Yearly Plan ($64.80/year = $5.40/mo)
const yearlyPlan = await fetch(`${base}/v1/billing/plans`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${access_token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    product_id: productData.id,
    name: "Qofeno Pro Yearly",
    billing_cycles: [{
      frequency: { interval_unit: "YEAR", interval_count: 1 },
      tenure_type: "REGULAR",
      sequence: 1,
      total_cycles: 0,
      pricing_scheme: { fixed_price: { value: "64.80", currency_code: "USD" } }
    }],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: { value: "0", currency_code: "USD" },
      setup_fee_failure_action: "CONTINUE",
      payment_failure_threshold: 3
    }
  })
})
const yearlyPlanData = await yearlyPlan.json()
// Save yearlyPlanData.id as PAYPAL_PLAN_ID_YEARLY in env
```

Add to .env:
```env
PAYPAL_PRODUCT_ID=        # from setup script output
PAYPAL_PLAN_ID_MONTHLY=   # from setup script output
PAYPAL_PLAN_ID_YEARLY=    # from setup script output
```

### Step 2: Create PayPal Webhook

After deploying the paypal-webhook Appwrite Function, register the webhook URL:

```js
// scripts/setup-paypal-webhook.js
const webhook = await fetch(`${base}/v1/notifications/webhooks`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${access_token}`,
    "Content-Type": "application/json"
  },
  body: JSON.stringify({
    url: `${process.env.APPWRITE_ENDPOINT}/v1/functions/paypal-webhook/executions`,
    event_types: [
      { name: "BILLING.SUBSCRIPTION.ACTIVATED" },
      { name: "BILLING.SUBSCRIPTION.CANCELLED" },
      { name: "BILLING.SUBSCRIPTION.EXPIRED" },
      { name: "BILLING.SUBSCRIPTION.SUSPENDED" },
      { name: "PAYMENT.SALE.COMPLETED" },
      { name: "PAYMENT.SALE.DENIED" }
    ]
  })
})
const webhookData = await webhook.json()
// Save webhookData.id as PAYPAL_WEBHOOK_ID in env
```

### Step 3: Wire PayPal Subscription button on /checkout/pro

```jsx
// Use @paypal/react-paypal-js for real subscription flow
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js"

<PayPalScriptProvider options={{
  clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
  vault: true,
  intent: "subscription"
}}>
  <PayPalButtons
    style={{ layout: "vertical", color: "blue", shape: "rect", label: "subscribe" }}
    createSubscription={(data, actions) => {
      return actions.subscription.create({
        plan_id: isYearly
          ? process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY
          : process.env.NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY
      })
    }}
    onApprove={async (data) => {
      // data.subscriptionID is the real PayPal subscription ID
      // Send to your API route to verify + update Appwrite
      const res = await fetch("/api/paypal/activate", {
        method: "POST",
        body: JSON.stringify({
          subscriptionId: data.subscriptionID,
          userId: currentUser.$id,
          plan: isYearly ? "yearly" : "monthly"
        })
      })
      const result = await res.json()
      if (result.success) {
        router.push("/dashboard?upgraded=true")
      }
    }}
    onError={(err) => {
      showErrorToast("Payment failed. Please try again.")
    }}
  />
</PayPalScriptProvider>
```

### Step 4: API route /api/paypal/activate

```js
// pages/api/paypal/activate.js OR app/api/paypal/activate/route.js
import { serverDatabases } from "@/lib/appwrite-server"
import { ID, Query } from "node-appwrite"

export async function POST(req) {
  const { subscriptionId, userId, plan } = await req.json()

  // Verify subscription with PayPal API
  const base = process.env.PAYPAL_MODE === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com"

  const token = await getPayPalToken()
  const sub = await fetch(`${base}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { "Authorization": `Bearer ${token}` }
  })
  const subData = await sub.json()

  if (subData.status !== "ACTIVE") {
    return Response.json({ success: false, error: "Subscription not active" }, { status: 400 })
  }

  // Update Appwrite users_meta
  const existing = await serverDatabases.listDocuments(
    process.env.APPWRITE_DATABASE_ID,
    "users_meta",
    [Query.equal("user_id", userId)]
  )

  await serverDatabases.updateDocument(
    process.env.APPWRITE_DATABASE_ID,
    "users_meta",
    existing.documents[0].$id,
    {
      plan: "pro",
      plan_expires_at: subData.billing_info?.next_billing_time,
      payment_ref: subscriptionId,
      updated_at: new Date().toISOString()
    }
  )

  // Create subscription record
  await serverDatabases.createDocument(
    process.env.APPWRITE_DATABASE_ID,
    "subscriptions",
    ID.unique(),
    {
      user_id: userId,
      plan: "pro",
      status: "active",
      payment_provider: "paypal",
      payment_sub_id: subscriptionId,
      current_period_start: new Date().toISOString(),
      current_period_end: subData.billing_info?.next_billing_time,
      created_at: new Date().toISOString()
    }
  )

  return Response.json({ success: true })
}
```

---

## FIX 2 — TOOL UX: ILOVEPDF.COM STYLE (INPUT ONLY → THEN PROCESS → THEN DOWNLOAD)

This is the most important UX change. Every tool page must follow this exact 3-step flow:

### Step 1: Show ONLY the file input (nothing else)

When user first lands on a tool page:
- Show ONLY the upload zone — centered, clean, prominent
- NO settings panel visible yet
- NO process button visible yet
- NO other clutter

```jsx
// Tool page state machine:
// "idle" → "file_selected" → "processing" → "done" → "error"
const [stage, setStage] = useState("idle")
```

**Stage: "idle"**
```jsx
// Only show this:
<UploadZone
  accept={tool.accepted_types}
  maxSize={isPro ? 500 : 50}
  onFileSelect={(file) => {
    setSelectedFile(file)
    setStage("file_selected")
  }}
/>
// Nothing else visible
```

Upload zone design (ilovepdf style):
```jsx
<div className="flex flex-col items-center justify-center
                border-2 border-dashed border-purple-300
                rounded-3xl bg-purple-50 hover:bg-purple-100
                transition-all cursor-pointer
                min-h-[280px] w-full max-w-2xl mx-auto p-8"
  onClick={openFilePicker}
  onDrop={handleDrop}
>
  {/* Large tool icon */}
  <div className="w-20 h-20 mb-4 text-purple-500">
    <ToolSVGIcon />
  </div>

  {/* Main label */}
  <h2 className="text-2xl font-bold text-gray-800 mb-2">
    Select {tool.input_label}
  </h2>
  {/* Examples: "Select PDF file", "Select images", "Select video" */}

  {/* Sub label */}
  <p className="text-gray-500 text-base mb-6">
    or drop {tool.input_label} here
  </p>

  {/* Select button */}
  <button className="px-8 py-3 bg-purple-600 text-white font-semibold
                     rounded-xl text-lg hover:bg-purple-700 transition">
    Select {tool.input_label}
  </button>

  {/* Accepted types + size limit */}
  <p className="text-xs text-gray-400 mt-4">
    {tool.accepted_extensions} up to {isPro ? "500MB" : "50MB"}
  </p>
</div>
```

### Step 2: File selected → show settings + process button

When correct file type is selected and validated:
```jsx
// Stage: "file_selected"
// Animate in with Framer Motion (slide up from bottom)
<motion.div
  initial={{ opacity: 0, y: 30 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
>
  {/* Selected file info */}
  <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border mb-4">
    <FileIcon className="text-purple-500 w-8 h-8" />
    <div className="flex-1 min-w-0">
      <p className="font-medium text-gray-800 truncate">{file.name}</p>
      <p className="text-sm text-gray-400">{formatBytes(file.size)}</p>
    </div>
    <button onClick={resetTool} className="text-gray-400 hover:text-red-500 p-2">
      <XIcon className="w-5 h-5" />
    </button>
  </div>

  {/* Tool settings (if any) */}
  {tool.hasSettings && <ToolSettings toolSlug={tool.slug} onChange={setSettings} />}

  {/* BIG PROCESS BUTTON — only visible after file selected */}
  <button
    onClick={handleProcess}
    className="w-full py-5 mt-4
               bg-gradient-to-r from-purple-600 to-purple-500
               hover:from-purple-700 hover:to-purple-600
               text-white font-bold text-xl rounded-2xl
               shadow-xl shadow-purple-200
               flex items-center justify-center gap-3
               active:scale-[0.98] transition-all"
  >
    <ZapIcon className="w-6 h-6" />
    {tool.action_label}  {/* "Compress PDF", "Convert to Word", etc. */}
  </button>
</motion.div>
```

**Wrong file type selected → show clear error:**
```jsx
// If user selects wrong file type:
<div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3">
  <AlertCircleIcon className="text-red-500 w-6 h-6 flex-shrink-0" />
  <div>
    <p className="font-medium text-red-800">Wrong file type</p>
    <p className="text-sm text-red-600">
      This tool accepts {tool.accepted_extensions} files only
    </p>
  </div>
</div>
```

### Step 3: After processing → open download in new tab

After processing completes successfully:
```jsx
// Stage: "done"
// Auto-open download in new tab
useEffect(() => {
  if (stage === "done" && downloadUrl) {
    // Open download in new tab immediately
    window.open(downloadUrl, "_blank")
  }
}, [stage, downloadUrl])

// Also show the result card clearly:
<motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
  className="p-6 bg-green-50 border-2 border-green-200 rounded-3xl w-full"
>
  {/* Success icon + message */}
  <div className="flex items-center gap-3 mb-5">
    <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
      <CheckIcon className="text-white w-7 h-7" />
    </div>
    <div>
      <p className="text-lg font-bold text-green-800">Your file is ready!</p>
      <p className="text-sm text-green-600">{outputFilename} · {formatBytes(outputSize)}</p>
    </div>
  </div>

  {/* Download button — large, obvious */}
  <a href={downloadUrl} download={outputFilename} target="_blank" rel="noopener noreferrer">
    <button className="w-full py-4 bg-purple-600 hover:bg-purple-700
                       text-white font-bold text-lg rounded-2xl
                       flex items-center justify-center gap-3
                       shadow-lg shadow-purple-200 active:scale-[0.98] transition-all mb-3">
      <DownloadIcon className="w-6 h-6" />
      Download {outputFilename}
    </button>
  </a>

  {/* Process another */}
  <button
    onClick={resetTool}
    className="w-full py-3 text-purple-600 font-medium hover:underline"
  >
    ↩ Process another file
  </button>

  {/* Privacy note */}
  <p className="text-xs text-center text-gray-400 mt-3">
    🔒 This file will be deleted from our servers automatically
  </p>
</motion.div>
```

### Processing state:
```jsx
// Stage: "processing"
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="flex flex-col items-center justify-center py-16 gap-6"
>
  <ProcessingRing size={72} />
  <div className="text-center">
    <p className="text-xl font-semibold text-gray-800">Processing your file...</p>
    <p className="text-sm text-gray-500 mt-1">Running on our servers — this won't take long</p>
  </div>
</motion.div>
```

Apply this exact same flow to EVERY tool page — PDF, image, video, developer, writing, all of them.

---

## FIX 3 — FIX ALL TOOL FUNCTIONS (VALID OUTPUT ONLY)

Every tool function must produce a 100% valid, correct output.

### For each tool function, fix:

**PDF Compressor:**
```js
// Use pdf-lib for safe compression
// If pdf-lib isn't reducing enough, use ghostscript:
import { execSync } from "child_process"
execSync(`gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dBATCH -sOutputFile="${outputPath}" "${inputPath}"`)
// Validate: output must be smaller than input AND valid PDF
```

**PDF to Word:**
```js
// Use LibreOffice headless for best conversion quality:
execSync(`libreoffice --headless --convert-to docx:"Microsoft Word 2007-2019 XML" --outdir "${tmpDir}" "${inputPath}"`)
// If LibreOffice not available, use mammoth + docx:
// Extract text with pdf-parse, rebuild with docx library
// Validate: output.docx must be > 0 bytes AND start with PK magic bytes
```

**PDF Merger:**
```js
// Use pdf-lib - proven reliable:
import { PDFDocument } from "pdf-lib"
const merged = await PDFDocument.create()
for (const fileId of file_ids) {
  const bytes = await storage.getFileDownload(BUCKET_INPUTS, fileId)
  const pdf = await PDFDocument.load(bytes)
  const pages = await merged.copyPages(pdf, pdf.getPageIndices())
  pages.forEach(p => merged.addPage(p))
}
const mergedBytes = await merged.save()
// Validate: pageCount === sum of all input page counts
```

**Image tools:**
```js
// Always use sharp - most reliable:
import sharp from "sharp"
// Validate output with sharp metadata check:
const meta = await sharp(outputPath).metadata()
if (!meta.width || !meta.height) throw new Error("Invalid image output")
```

**Validation wrapper for ALL functions:**
```js
async function validateAndUpload(outputPath, mimeType, storage, BUCKET_OUTPUTS) {
  // 1. Check file exists
  if (!fs.existsSync(outputPath)) throw new Error("Output file not created")

  // 2. Check file size > 0
  const stat = fs.statSync(outputPath)
  if (stat.size === 0) throw new Error("Output file is empty")

  // 3. Check format signature
  const buf = fs.readFileSync(outputPath)
  if (mimeType === "application/pdf" && buf.slice(0,4).toString() !== "%PDF")
    throw new Error("Output is not a valid PDF")
  if (mimeType.includes("wordprocessingml") && buf[0] !== 0x50)
    throw new Error("Output is not a valid DOCX")

  // 4. Upload to Appwrite with correct permissions
  const { Permission, Role, ID } = await import("node-appwrite")
  const file = await storage.createFile(
    BUCKET_OUTPUTS,
    ID.unique(),
    new Blob([buf], { type: mimeType }),
    [Permission.read(Role.any()), Permission.delete(Role.any())]
  )

  // 5. Generate download URL
  const downloadUrl = `${process.env.APPWRITE_ENDPOINT}/storage/buckets/${BUCKET_OUTPUTS}/files/${file.$id}/download?project=${process.env.APPWRITE_PROJECT_ID}`

  return { file, downloadUrl }
}
```

---

## FIX 4 — REAL EMAILS WITH RESEND

Replace any existing email setup with Resend.

```bash
npm install resend
```

```js
// lib/resend.js
import { Resend } from "resend"
export const resend = new Resend(process.env.RESEND_API_KEY)
```

### Wire these real emails:

**1. Welcome email (on signup):**
```js
// In auth-webhook Appwrite Function:
await resend.emails.send({
  from: `Qofeno <${process.env.EMAIL_FROM_ADDRESS}>`,
  to: userEmail,
  subject: "Welcome to Qofeno! 🎉",
  html: `
    <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;padding:40px 20px">
      <div style="text-align:center;margin-bottom:32px">
        <h1 style="color:#7C3AED;font-size:32px;margin:0">Qofeno</h1>
      </div>
      <h2 style="color:#0F0A1E">Welcome, ${userName}! 👋</h2>
      <p style="color:#6B7280;line-height:1.6">
        Your account is ready. Start using hundreds of free tools right now —
        no limits, no friction.
      </p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/tools"
         style="display:inline-block;margin:24px 0;padding:14px 32px;
                background:#7C3AED;color:white;border-radius:12px;
                font-weight:600;text-decoration:none">
        Explore Tools
      </a>
      <p style="color:#9CA3AF;font-size:13px;margin-top:40px">
        Built by Mohd Zaheer Uddin ·
        <a href="${process.env.NEXT_PUBLIC_APP_URL}/privacy" style="color:#7C3AED">Privacy</a>
      </p>
    </div>
  `
})
```

**2. Pro upgrade email (in paypal-webhook or /api/paypal/activate):**
```js
await resend.emails.send({
  from: `Qofeno <${process.env.EMAIL_FROM_ADDRESS}>`,
  to: userEmail,
  subject: "You're now on Qofeno Pro ✦",
  html: `...` // Pro confirmation with features list + dashboard link
})
```

**3. Contact form auto-reply + forward:**
```js
// Forward to Mohd Zaheer Uddin:
await resend.emails.send({
  from: `Qofeno Contact <${process.env.EMAIL_FROM_ADDRESS}>`,
  to: process.env.ADMIN_EMAIL,  // Mohd Zaheer Uddin's real email
  subject: `[Qofeno Contact] ${subject}`,
  html: `Name: ${name}<br>Email: ${email}<br>Message: ${message}`
})
// Auto-reply to sender:
await resend.emails.send({
  from: `Qofeno <${process.env.EMAIL_FROM_ADDRESS}>`,
  to: email,
  subject: "Thanks for reaching out — Qofeno",
  html: `Hi ${name}, thanks for contacting Qofeno. I'll reply soon. — Mohd Zaheer Uddin`
})
```

**4. Subscription cancellation email:**
```js
await resend.emails.send({
  from: `Qofeno <${process.env.EMAIL_FROM_ADDRESS}>`,
  to: userEmail,
  subject: "Your Qofeno Pro subscription has been cancelled",
  html: `...` // Confirmation + access continues until period end
})
```

Add to .env:
```env
RESEND_API_KEY=           # provided by Mohd Zaheer Uddin
EMAIL_FROM_ADDRESS=       # your verified Resend domain email
EMAIL_FROM_NAME=Qofeno
ADMIN_EMAIL=              # Mohd Zaheer Uddin's personal email for contact forwards
NEXT_PUBLIC_APP_URL=      # https://yourdomain.com
```

---

## FIX 5 — NOTIFICATIONS (REAL + WIRED)

Fix the notifications system completely.

### Notifications collection in Appwrite (create if missing):
```
Collection: notifications
Attributes:
  user_id    string   required
  title      string   required
  message    string   required
  type       string   required  (info|success|warning|promo)
  read       boolean  default: false
  link       string   nullable
  created_at datetime
Indexes: user_id (key), read (key), created_at (desc)
Permissions: Read = Owner, Write = Server API key only
```

### Wire real notifications:

**On signup:** Create welcome notification in Appwrite
**On Pro upgrade:** Create "You're now Pro" notification
**On new tool published:** Create notification for all users (batch)
**On plan expiry (3 days before):** Create renewal reminder notification

### Notification bell component:
```jsx
// Real-time unread count via Appwrite Realtime
const [notifications, setNotifications] = useState([])
const [unreadCount, setUnreadCount] = useState(0)

useEffect(() => {
  if (!user) return
  // Fetch notifications
  databases.listDocuments(DATABASE_ID, "notifications", [
    Query.equal("user_id", user.$id),
    Query.orderDesc("created_at"),
    Query.limit(20)
  ]).then(res => {
    setNotifications(res.documents)
    setUnreadCount(res.documents.filter(n => !n.read).length)
  })

  // Subscribe to new notifications via Realtime
  const unsub = client.subscribe(
    `databases.${DATABASE_ID}.collections.notifications.documents`,
    (response) => {
      if (response.payload.user_id === user.$id) {
        setNotifications(prev => [response.payload, ...prev])
        setUnreadCount(prev => prev + 1)
      }
    }
  )
  return unsub
}, [user])
```

---

## FIX 6 — FIX AUTH COMPLETELY

Fix every auth issue:

**Session persistence:**
```js
// _app.js or layout.js — check session on every page load
useEffect(() => {
  account.get()
    .then(user => setUser(user))
    .catch(() => setUser(null))
}, [])
```

**Protected routes middleware:**
```js
// middleware.js (Next.js)
export function middleware(request) {
  const protectedPaths = ["/dashboard", "/profile", "/settings", "/checkout"]
  const isProtected = protectedPaths.some(p => request.nextUrl.pathname.startsWith(p))
  if (isProtected && !request.cookies.get("a_session_[project_id]")) {
    return NextResponse.redirect(new URL(`/login?redirect=${request.nextUrl.pathname}`, request.url))
  }
}
```

**After login redirect:**
```js
const redirect = searchParams.get("redirect") || "/dashboard"
router.push(redirect)
```

**OAuth flow:**
```js
// Google OAuth
await account.createOAuth2Session(
  "google",
  `${window.location.origin}/auth/callback`,
  `${window.location.origin}/login?error=oauth_failed`
)
```

**Auth callback page (/auth/callback):**
```js
// pages/auth/callback.js
// Appwrite sets session automatically after OAuth redirect
// Just redirect to intended destination
useEffect(() => {
  const redirect = localStorage.getItem("auth_redirect") || "/dashboard"
  localStorage.removeItem("auth_redirect")
  router.push(redirect)
}, [])
```

**Fix logout:**
```js
const handleLogout = async () => {
  await account.deleteSession("current")
  setUser(null)
  router.push("/")
}
```

**Fix navbar auth state:**
- Use React context or Zustand for global user state
- Navbar subscribes to user state — updates instantly on login/logout
- No page refresh needed

---

## FIX 7 — FIX ALL PAGES BUTTONS AND LINKS

Go through every page and fix every button and link:

**Rules:**
- Every `<a>` or `<Link>` must have a real href — no "#"
- Every button that navigates must use router.push() or Link
- Every external link: target="_blank" rel="noopener noreferrer"
- Every internal link: uses Next.js Link component (not window.location)
- Footer links: all verified working
- Navbar links: all verified working
- CTA buttons: all verified working
- "Coming Soon" links: redirect to /coming-soon page (not 404)

**Fix checkout flow:**
- "Get Pro" → check auth → /checkout/pro
- /checkout/pro: show PayPal button, plan toggle, feature list
- After payment: redirect /dashboard with toast "You're now Pro! ✦"
- /dashboard/billing: show PayPal subscription details, cancel option

---

## FIX 8 — FULL RESPONSIVENESS (ALL PAGES + ALL TOOLS)

Test and fix at: 320px, 375px, 390px, 430px, 768px, 1024px, 1280px, 1440px

**Tool pages (most important):**
- Upload zone: full-width on mobile, tap-to-browse works on iOS + Android
- Settings panel: stacks vertically, readable on 320px
- Process button: full-width, min 56px tall, visible gradient
- Processing ring: centered, text not cut off
- Download card: full-width, download button min 56px tall
- Related tools: horizontal snap scroll on mobile

**All pages:**
- No horizontal overflow anywhere
- BottomNavBar safe area insets
- Content not hidden behind BottomNavBar
- All inputs font-size ≥ 16px

---

## FIX 9 — BUILD + TEST + DEPLOY EVERYTHING

### Install all dependencies:
```bash
npm install resend @paypal/react-paypal-js @paypal/checkout-server-sdk
npm install pdf-lib pdf-parse archiver tesseract.js
npm install sharp fluent-ffmpeg ffmpeg-static
npm install docx exceljs pptxgenjs mammoth
```

### Build:
```bash
npm run build
# Fix ALL errors — zero tolerance
```

### Test with REAL files locally:
- Real PDF > 1MB → compress → download → verify smaller + valid
- Real PDF → convert to Word → verify .docx opens in Word
- 2 real PDFs → merge → verify combined page count
- Real image → resize → verify dimensions correct
- Real video → compress → verify plays correctly

### Deploy Appwrite Functions:
```bash
# Install Appwrite CLI if not installed
npm install -g appwrite-cli
appwrite login --endpoint [APPWRITE_ENDPOINT] --projectId [PROJECT_ID]

# Deploy each function
appwrite deploy function --functionId=pdf-compressor
appwrite deploy function --functionId=pdf-merger
appwrite deploy function --functionId=pdf-splitter
appwrite deploy function --functionId=pdf-to-word
appwrite deploy function --functionId=pdf-to-jpg
appwrite deploy function --functionId=jpg-to-pdf
appwrite deploy function --functionId=pdf-rotate
appwrite deploy function --functionId=pdf-watermark
appwrite deploy function --functionId=pdf-protect
appwrite deploy function --functionId=pdf-page-numbers
appwrite deploy function --functionId=pdf-to-text
appwrite deploy function --functionId=pdf-ocr
appwrite deploy function --functionId=image-resizer
appwrite deploy function --functionId=image-compressor
appwrite deploy function --functionId=image-converter
appwrite deploy function --functionId=image-bg-remover
appwrite deploy function --functionId=video-compressor
appwrite deploy function --functionId=video-trimmer
appwrite deploy function --functionId=json-formatter
appwrite deploy function --functionId=text-case-converter
appwrite deploy function --functionId=word-counter
appwrite deploy function --functionId=base64-encoder
appwrite deploy function --functionId=track-event
appwrite deploy function --functionId=auth-webhook
appwrite deploy function --functionId=paypal-webhook
appwrite deploy function --functionId=send-welcome-email

# Test each deployed function in Appwrite console with a real file
```

### Run PayPal setup scripts:
```bash
node scripts/setup-paypal.js        # creates product + plans
node scripts/setup-paypal-webhook.js # registers webhook URL
# Save output IDs to .env
```

### Commit and push:
```bash
git add .
git commit -m "fix: ilovepdf UX, PayPal real plans+webhook, Resend emails, notifications, all tool functions, auth, responsiveness"
git push origin main
```

### Deploy Cloudflare Pages:
```bash
npx wrangler pages deploy .next \
  --project-name=[CLOUDFLARE_PAGES_PROJECT] \
  --branch=main
```

### Post-deploy verification on LIVE URL:
```
□ PDF Compressor: select PDF → process button appears → compress → download opens new tab
□ Download: no 401 error, file downloads correctly
□ PDF to Word: valid .docx downloads, opens in Word
□ PayPal checkout: real payment completes, plan updates in Appwrite
□ PayPal webhook: fires correctly after payment
□ Welcome email: received after signup (via Resend)
□ Pro upgrade email: received after PayPal payment
□ Contact form: email forwarded to Mohd Zaheer Uddin's inbox
□ Notifications: bell in navbar, real-time updates
□ Auth: login, signup, OAuth, logout all work
□ Protected routes: /dashboard redirects if not logged in
□ All links work: no 404s, no broken hrefs
□ Mobile iPhone Safari: upload zone works, download works
□ Mobile Android Chrome: all tools work
□ No console errors anywhere
□ Lighthouse: 85+ mobile, 90+ desktop
```

---

## ENVIRONMENT VARIABLES — COMPLETE LIST:

```env
# Appwrite
NEXT_PUBLIC_APPWRITE_ENDPOINT=
NEXT_PUBLIC_APPWRITE_PROJECT_ID=
NEXT_PUBLIC_APPWRITE_DATABASE_ID=qofeno_db
NEXT_PUBLIC_COL_TOOLS=tools
NEXT_PUBLIC_COL_USERS_META=users_meta
NEXT_PUBLIC_COL_EXECUTIONS=tool_executions
NEXT_PUBLIC_COL_VIEWS=tool_views
NEXT_PUBLIC_COL_LIKES=tool_likes
NEXT_PUBLIC_COL_RECENTLY_VIEWED=recently_viewed
NEXT_PUBLIC_COL_SUBSCRIPTIONS=subscriptions
NEXT_PUBLIC_COL_WHATS_NEW=whats_new
NEXT_PUBLIC_COL_CONTACT=contact_messages
NEXT_PUBLIC_COL_NOTIFICATIONS=notifications
NEXT_PUBLIC_BUCKET_INPUTS=tool_inputs
NEXT_PUBLIC_BUCKET_OUTPUTS=tool_outputs
NEXT_PUBLIC_OAUTH_REDIRECT=
NEXT_PUBLIC_APP_URL=

# PayPal (public)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY=
NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY=
NEXT_PUBLIC_PAYPAL_MODE=live

# Server only (NEVER NEXT_PUBLIC_)
APPWRITE_ENDPOINT=
APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=
APPWRITE_DATABASE_ID=qofeno_db

# PayPal (server only)
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=live
PAYPAL_WEBHOOK_ID=
PAYPAL_PRODUCT_ID=
PAYPAL_PLAN_ID_MONTHLY=
PAYPAL_PLAN_ID_YEARLY=

# Resend
RESEND_API_KEY=
EMAIL_FROM_NAME=Qofeno
EMAIL_FROM_ADDRESS=
ADMIN_EMAIL=

# Cloudflare
CLOUDFLARE_API_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_PAGES_PROJECT=
CLOUDFLARE_PAGES_DOMAIN=
```

---

## NON-NEGOTIABLE RULES:

1. Read ALL files before touching anything
2. NO demo, mock, example, placeholder, or MVP content — everything real
3. Fix 401 download error first — Permission.read(Role.any()) on all outputs
4. ilovepdf.com UX: input only → file selected → process button → download new tab
5. Every tool output must be valid and correct format — validate before serving
6. PayPal: real plans + real webhook + real subscription flow
7. Resend: all emails real, branded, sent from verified domain
8. APPWRITE_API_KEY + PAYPAL_CLIENT_SECRET: never in client code, ever
9. Product name: Qofeno — always, everywhere
10. Author: Mohd Zaheer Uddin — footer, about, emails, legal
11. All links work — zero 404s, zero "#" hrefs
12. Deploy order: Appwrite functions → push GitHub → Cloudflare Pages
13. Test with real files — not empty or fake files
14. Read docs when unsure:
    - Resend: https://resend.com/docs
    - PayPal subscriptions: https://developer.paypal.com/docs/subscriptions/
    - Appwrite: https://appwrite.io/docs
    - ReactBits: https://reactbits.dev/get-started

Start with reading all files. Report findings. Then fix in order. Do not skip any step.
