You are an expert full-stack developer working on **Qofeno** — a growing online tools platform built by Mohd Zaheer Uddin.

**FIRST: Read and analyze every single file and folder in this project before touching anything.** Understand every page, component, Appwrite function, config, and environment setup. List what's broken, missing, incomplete. Then fix everything in order below.

You have full access to everything: all files, Appwrite API key, Cloudflare API key, GitHub, npm.
**NO demo. NO mock. NO placeholder. NO MVP. Everything real, live, working.**

---

## CREDENTIALS (fill before starting):
```env
RESEND_API_KEY=              # provided in .env
PAYPAL_CLIENT_ID=            # provided in .env
PAYPAL_CLIENT_SECRET=        # provided in .env
CLOUDFLARE_TURNSTILE_SITE_KEY=    # provided in .env
CLOUDFLARE_TURNSTILE_SECRET_KEY=  # provided in .env
```

---

## FIX 1 — FONT AWESOME ICONS EVERYWHERE

Replace every icon on the entire site with Font Awesome icons. No other icon library.

```bash
npm install @fortawesome/react-fontawesome
npm install @fortawesome/free-solid-svg-icons
npm install @fortawesome/free-regular-svg-icons
npm install @fortawesome/free-brands-svg-icons
```

```jsx
// Usage everywhere:
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faFilePdf, faImage, faVideo, faRobot, faCode,
         faPenNib, faDatabase, faShield, faBolt,
         faDownload, faUpload, faCheck, faXmark,
         faBell, faUser, faGear, faHouse, faTools,
         faTag, faStar, faHeart, faShareNodes,
         faLock, faUnlock, faKey, faEnvelope,
         faArrowRight, faArrowLeft, faRotate,
         faMagnifyingGlass, faFilter, faSliders,
         faChevronDown, faChevronUp, faEye, faEyeSlash,
         faTriangleExclamation, faCircleInfo, faSpinner,
         faFileWord, faFileExcel, faFilePowerpoint,
         faFileImage, faFileZipper, faFileLines,
         faCrop, faWatermark, faScissors, faMerge,
         faCompressArrowsAlt, faExpand, faFont } from "@fortawesome/free-solid-svg-icons"

// Replace every lucide-react, heroicons, or any other icon import
// Go through EVERY file and replace with FontAwesome equivalents
```

Icon mapping for tool categories:
```
PDF tools:       faFilePdf
Image tools:     faImage
Video tools:     faVideo
AI tools:        faRobot
Dev tools:       faCode
Writing tools:   faPenNib
Data tools:      faDatabase
Security tools:  faShield
Productivity:    faBolt
```

---

## FIX 2 — QOFENO.PNG AS LOGO EVERYWHERE

Use `qofeno.png` as the logo on every single page and component.

```jsx
// <QofenoLogo /> component — use everywhere:
import Image from "next/image"

export function QofenoLogo({ size = 40, showText = true }) {
  return (
    <div className="flex items-center gap-2">
      <Image
        src="/qofeno.png"
        alt="Qofeno"
        width={size}
        height={size}
        className="rounded-lg"
        priority
      />
      {showText && (
        <span className="font-bold text-xl text-purple-700">Qofeno</span>
      )}
    </div>
  )
}
```

Place everywhere:
- Navbar (desktop + mobile)
- MobileNavOverlay header
- BottomNavBar (small version)
- Footer
- Auth pages (/login, /signup, /forgot-password, /reset-password)
- Browser tab favicon (use qofeno.png as favicon too)
- Email templates (as base64 inline or hosted URL)
- /about page — wherever MZ logo was shown

Put `qofeno.png` in `/public/qofeno.png`
Add to `<head>`: `<link rel="icon" href="/qofeno.png" />`

---

## FIX 3 — QOFENO.PNG AS FOUNDER PHOTO IN ABOUT PAGE

In the About page, replace any placeholder MZ avatar or initials with `qofeno.png`:

```jsx
// About page — founder section:
<div className="flex flex-col items-center gap-4">
  <Image
    src="/qofeno.png"
    alt="Mohd Zaheer Uddin"
    width={120}
    height={120}
    className="rounded-full border-4 border-purple-200 shadow-lg"
  />
  <div className="text-center">
    <h3 className="text-xl font-bold text-gray-900">Mohd Zaheer Uddin</h3>
    <p className="text-purple-600 font-medium">Founder & Developer</p>
  </div>
</div>
```

---

## FIX 4 — ABOUT PAGE (REAL CONTENT)

Rewrite the About page with real, honest content about Qofeno.

```
Hero:
  Headline: "Built by one person, for everyone"
  Sub: "Qofeno is a growing collection of free and pro tools
        that work right in your browser — no installs, no friction."

What is Qofeno (real description):
  "Qofeno is an online platform that brings hundreds of useful tools
   together in one place. Tools for working with PDFs, images, video,
   writing, code, and more. Everything runs on our servers — you upload,
   we process, you download. Files are deleted immediately after.

   Whether you're a student compressing a PDF, a developer formatting JSON,
   or a freelancer resizing images — Qofeno is built for you."

How it works (3 steps with FA icons):
  1. faUpload    Upload your file
  2. faGear      We process it on our servers
  3. faDownload  Download your result — file deleted after

Who built it:
  Photo: qofeno.png
  Name: Mohd Zaheer Uddin
  Role: Founder & Developer
  Bio: [Mohd Zaheer Uddin writes his own bio — leave a placeholder comment for him]
  Links: GitHub, Twitter/X, LinkedIn, Email (real links from .env or config)

Values (3 cards with FA icons):
  faLock         Privacy First — files deleted after processing
  faUnlock       Free & Open — core tools always free
  faRotate       Always Growing — new tools added regularly

Current tool stats (real, from Appwrite tools collection count):
  Show: "[X] tools available" — fetched dynamically, not hardcoded

Roadmap (honest, no fake ETAs):
  Show real shipped items ✅
  Show real in-progress 🔄
  Show real planned 📋
```

---

## FIX 5 — LANDING PAGE — VERIFY REAL TOOLS ONLY

The landing page must only show tools that actually exist and work in the `tools` collection.

Fix the featured tools section:
```js
// Fetch tools dynamically from Appwrite tools collection
// Never hardcode tool names or slugs on the landing page
const featuredTools = await databases.listDocuments(
  DATABASE_ID,
  "tools",
  [
    Query.equal("is_active", true),
    Query.orderDesc("created_at"),
    Query.limit(8)
  ]
)
```

Fix the "new tools added weekly" section:
```js
// Only show this claim if tools collection has documents added in last 7 days
const recentTools = await databases.listDocuments(
  DATABASE_ID,
  "tools",
  [
    Query.greaterThan("created_at", sevenDaysAgo),
    Query.equal("is_active", true)
  ]
)

// If recentTools.total > 0: show "New tools added this week"
// If recentTools.total === 0: show "New tools added regularly" (more honest)
```

Tool category counts on landing page:
```js
// Show real counts from database — not fake numbers
// Query tools collection grouped by category
```

---

## FIX 6 — CONTACT PAGE (REAL + RESEND INTEGRATED)

Completely fix and improve the contact page.

```jsx
// Contact page layout:
// Desktop: 50/50 split
// Mobile: stacked

Left side:
  Headline: "Get in touch"
  Sub: "I read every message and reply personally."
       — Mohd Zaheer Uddin

  Contact info (FA icons):
  faEnvelope  [real email from ADMIN_EMAIL env var]
  fa-brands faGithub  [real GitHub URL]
  fa-brands faXTwitter  [real Twitter URL]
  fa-brands faLinkedin  [real LinkedIn URL]

  Response time badge:
  faCircleInfo  "I typically reply within 24–48 hours"

  Floating FA envelope icon (Framer float animation)

Right side — contact form:
  Fields (FloatingLabelInput + shadcn):
    Name (required)
    Email (required)
    Subject (shadcn Select):
      General | Tool Request | Bug Report | Business Inquiry | Other
    Message (Textarea, min 120px)
  Submit: "Send Message"

Form submission → two real emails via Resend:

1. Forward to Mohd Zaheer Uddin:
await resend.emails.send({
  from: `Qofeno Contact <${process.env.EMAIL_FROM_ADDRESS}>`,
  to: process.env.ADMIN_EMAIL,
  subject: `[Qofeno] ${subject} — from ${name}`,
  html: `
    <p><strong>From:</strong> ${name} (${email})</p>
    <p><strong>Subject:</strong> ${subject}</p>
    <p><strong>Message:</strong></p>
    <p>${message}</p>
  `
})

2. Auto-reply to sender:
await resend.emails.send({
  from: `Qofeno <${process.env.EMAIL_FROM_ADDRESS}>`,
  to: email,
  replyTo: process.env.ADMIN_EMAIL,
  subject: "Thanks for reaching out — Qofeno",
  html: `
    <p>Hi ${name},</p>
    <p>Thanks for reaching out to Qofeno. I've received your message
       and will reply as soon as possible — usually within 24–48 hours.</p>
    <p>— Mohd Zaheer Uddin</p>
    <p style="color:#9CA3AF;font-size:12px">Qofeno · Built by Mohd Zaheer Uddin</p>
  `
})

Store in Appwrite contact_messages collection as well.

Success state: FA faCircleCheck icon + "Message sent!" + confetti
Error state: FA faTriangleExclamation + error message + retry
```

---

## FIX 7 — PRICING PAGE TOGGLE FIX + IMPROVEMENT

Fix the monthly/yearly toggle completely.

```jsx
// PlanToggle component — fix the broken toggle:
const [isYearly, setIsYearly] = useState(false)

// Prices:
const prices = {
  monthly: { pro: 9.00, display: "$9/mo" },
  yearly:  { pro: 5.40, display: "$5.40/mo", total: "$64.80/yr", savings: "Save 40%" }
}

// Toggle UI:
<div className="flex items-center justify-center gap-4 mb-8">
  <span className={`font-medium ${!isYearly ? "text-purple-700" : "text-gray-400"}`}>
    Monthly
  </span>
  <button
    onClick={() => setIsYearly(!isYearly)}
    className={`relative w-14 h-7 rounded-full transition-colors duration-300
                ${isYearly ? "bg-purple-600" : "bg-gray-200"}`}
  >
    <motion.div
      animate={{ x: isYearly ? 28 : 4 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="absolute top-1 w-5 h-5 bg-white rounded-full shadow"
    />
  </button>
  <span className={`font-medium ${isYearly ? "text-purple-700" : "text-gray-400"}`}>
    Yearly
  </span>
  {isYearly && (
    <motion.span
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      className="px-3 py-1 bg-green-100 text-green-700 text-sm font-semibold rounded-full"
    >
      Save 40%
    </motion.span>
  )}
</div>

// Price display with GSAP morph animation when toggle switches:
// Use GSAP CountTo or Framer animate value
// Monthly: $9.00/mo
// Yearly:  $5.40/mo (billed $64.80/yr)
```

---

## FIX 8 — PRIVACY POLICY PAGE (IMPROVED + REAL)

Rewrite the privacy policy with real, readable content.

```
URL: /privacy
Title: "Privacy Policy"
Last updated: [real date]
Author: Mohd Zaheer Uddin

Sections (sticky TOC on desktop, accordion on mobile):

1. Introduction
   Plain English explanation of what this document is.

2. Information We Collect
   Account information: name, email, hashed password
   Usage data: which tools you used, when (no file content)
   Files: uploaded for processing ONLY — never stored permanently

3. How We Use Your Information
   To provide tool processing
   To manage your account
   To send you notifications you opted into
   To respond to contact form messages

4. File Handling Policy (PROMINENT — purple highlighted box)
   "Files you upload to Qofeno are processed on our servers only.
    All files are permanently and automatically deleted immediately
    after processing is complete. We never read, store, sell,
    or share your files under any circumstances."

5. Cookies
   Essential cookies (session, login)
   Functional cookies (preferences)
   Analytics (list the specific tool used, e.g. Plausible/none)
   No advertising cookies

6. Third-Party Services
   Appwrite (backend infrastructure)
   PayPal (payment processing)
   Resend (transactional emails)
   Cloudflare (hosting + security + Turnstile)

7. Data Retention
   Account data: retained while your account is active
   Tool usage metadata: retained for 90 days
   Files: deleted immediately after processing
   Contact messages: retained for 1 year

8. Your Rights
   Access your data → /settings/privacy
   Delete your data → /settings/privacy
   Export your data → /settings/privacy
   Contact: [ADMIN_EMAIL]

9. Children's Privacy
   Service not directed at children under 13.

10. Changes to This Policy
    We'll notify you via email for significant changes.

11. Contact
    [ADMIN_EMAIL]
    Mohd Zaheer Uddin

Design:
  Sticky left TOC (desktop), accordion (mobile)
  FA faBookOpen icon in header
  Highlighted file handling section (purple card)
  Clean readable typography, max-width 700px
```

---

## FIX 9 — TERMS OF SERVICE PAGE (IMPROVED + REAL)

```
URL: /terms
Title: "Terms of Service"
Last updated: [real date]

Sections:
1. Acceptance of Terms
2. Description of Service
   Server-side tool processing, free and paid tiers
3. Account Responsibilities
   Keep credentials secure, responsible for account activity
4. Free vs Pro Access
   Free: anonymous use, limited file size
   Pro: requires account, PayPal subscription
5. Acceptable Use
   No illegal content, no abuse, no automated scraping
6. File Processing Terms
   Files processed server-side, deleted after download
   You own your files — we claim no rights
   We are not liable for data loss (keep backups)
7. Payment Terms (PayPal)
   Subscription billing, cancellation policy
   Refund policy: [define clearly]
8. Intellectual Property
   Qofeno name, logo, UI © Mohd Zaheer Uddin
   Your content remains yours
9. Limitation of Liability
10. Governing Law — [Mohd Zaheer Uddin fills in jurisdiction]
11. Contact — [ADMIN_EMAIL]
```

---

## FIX 10 — COOKIES PAGE (REAL + INTEGRATED)

```
URL: /cookies
Title: "Cookie Policy"
Last updated: [real date]

Sections:
1. What Are Cookies
2. Cookies We Use (list each one specifically):
   a_session_[projectId]  — Appwrite session (essential, login)
   qofeno_likes           — liked tools (functional, localStorage)
   qofeno_recently_viewed — recently viewed tools (functional)
   cf_clearance           — Cloudflare security (essential)
   [analytics if any]     — analytics tool name
3. How to Control Cookies
   Browser settings instructions
   Opt-out links
4. Contact for Questions — [ADMIN_EMAIL]

Cookie consent banner (show on first visit):
  Small banner at bottom: "We use essential cookies for login and preferences."
  "Accept" button + "Learn more" → /cookies
  Store consent in localStorage: qofeno_cookie_consent = true
  Once accepted, banner never shows again
  FA faCookie icon in banner
```

---

## FIX 11 — BLOG PAGE (AUTO-CONTENT EVERY 5 DAYS VIA APPWRITE)

The blog must publish new content automatically every 5 days.

### Appwrite Function: `auto-publish-blog`

```js
// Schedule: CRON every 5 days
// 0 9 */5 * *   (9am every 5 days)

// This function:
// 1. Checks what was recently added (new tools, improvements from whats_new)
// 2. Auto-generates a blog post about it
// 3. Saves to a new blog_posts collection

// Collection: blog_posts
Attributes:
  title        string    required
  slug         string    required  (unique)
  content      string    required
  excerpt      string    required
  type         string    (new_tool|improvement|tutorial|product_update)
  author       string    default: "Mohd Zaheer Uddin"
  published    boolean   default: false
  published_at datetime
  created_at   datetime
  updated_at   datetime
Indexes: slug (unique), published (key), published_at (desc)
Permissions: Read = Any (published only), Write = Server API key only
```

### Whats New → Blog integration:
```js
// When a whats_new entry is created with published=true,
// auto-create a matching blog_posts entry:

// In the auto-publish-blog function or a separate trigger:
const recentUpdates = await db.listDocuments(DATABASE_ID, "whats_new", [
  Query.equal("published", true),
  Query.greaterThan("created_at", fiveDaysAgo),
  Query.orderDesc("created_at")
])

for (const update of recentUpdates.documents) {
  // Check if blog post already exists for this update
  const existing = await db.listDocuments(DATABASE_ID, "blog_posts", [
    Query.equal("source_id", update.$id)
  ])
  if (existing.total > 0) continue

  // Create blog post from whats_new entry
  const slug = update.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")
  await db.createDocument(DATABASE_ID, "blog_posts", ID.unique(), {
    title: update.title,
    slug: `${slug}-${Date.now()}`,
    content: update.body,
    excerpt: update.body.substring(0, 160) + "...",
    type: update.type === "new_tool" ? "new_tool" : "product_update",
    author: "Mohd Zaheer Uddin",
    published: true,
    published_at: new Date().toISOString(),
    source_id: update.$id,
    created_at: new Date().toISOString()
  })
}
```

### Blog page /blog:
```jsx
// Fetch real posts from blog_posts collection
// Show empty state if no posts yet (honest)
// Each post card: title + type badge + date + excerpt + "Read more →"
// FA icon per type: faTools (new_tool), faStar (improvement), faNewspaper (update)
// Desktop: 3-col grid | Mobile: 1-col

// Blog article /blog/[slug]:
// Real content from blog_posts collection
// Reading progress bar (GSAP)
// Author: Mohd Zaheer Uddin + qofeno.png + date
// Back link: ← Back to blog
// Related posts (same type)
```

---

## FIX 12 — SHARE LINK FOR TOOLS

Add a real share link to every tool page.

```jsx
// Share button on every tool page:
<button
  onClick={async () => {
    const url = `${window.location.origin}/tools/${tool.slug}`
    if (navigator.share) {
      // Native share on mobile
      await navigator.share({
        title: `${tool.name} — Qofeno`,
        text: tool.description,
        url
      })
    } else {
      // Copy to clipboard fallback
      await navigator.clipboard.writeText(url)
      showToast("Link copied!")
    }
  }}
  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-500
             hover:text-purple-600 border rounded-xl hover:border-purple-300 transition"
>
  <FontAwesomeIcon icon={faShareNodes} />
  Share
</button>
```

---

## FIX 13 — APPWRITE REALTIME FOR ALL TOOLS

Wire Appwrite Realtime to every tool page for live status updates.

```js
// On every tool page — after submitting file:
// 1. Create execution record (status: "processing")
// 2. Subscribe to that document via Realtime
// 3. Function updates document when done
// 4. Realtime pushes update to browser instantly
// 5. Show download button the moment status = "completed"

const [executionId, setExecutionId] = useState(null)

useEffect(() => {
  if (!executionId) return

  const unsub = client.subscribe(
    `databases.${DATABASE_ID}.collections.tool_executions.documents.${executionId}`,
    (response) => {
      const doc = response.payload
      if (doc.status === "completed") {
        setStage("done")
        setDownloadUrl(doc.download_url)
        setOutputFilename(doc.output_filename)
        window.open(doc.download_url, "_blank") // auto-open download
        unsub() // stop listening
      }
      if (doc.status === "failed") {
        setStage("error")
        setErrorMessage(doc.error_message)
        unsub()
      }
    }
  )

  return unsub
}, [executionId])
```

For small files (< 5MB): sync execution — result comes back instantly in response.
For large files (> 5MB): async execution + Realtime subscription above.

---

## FIX 14 — TOOL SETTINGS — REAL AND PROCESSED

Every tool's settings panel must actually be used in the function call.

```jsx
// Settings must be passed to the Appwrite Function:
const result = await functions.createExecution(
  tool.function_id,
  JSON.stringify({
    file_id: uploadedFileId,
    user_id: user?.$id || null,
    is_pro_tool: !tool.is_free,
    // Tool-specific settings:
    ...settings  // compression_level, rotation, quality, page_ranges, etc.
  }),
  false
)
```

Each function must use the settings params:
```js
// pdf-compressor function — use compression_level param:
const { file_id, compression_level = "medium" } = JSON.parse(req.body)
const gsSettings = {
  low:     "/prepress",
  medium:  "/ebook",
  high:    "/screen",
  maximum: "/screen -dColorImageDownsampleThreshold=1.0"
}
execSync(`gs -sDEVICE=pdfwrite -dPDFSETTINGS=${gsSettings[compression_level]} ...`)

// pdf-to-jpg function — use quality + dpi params:
const { quality = 90, dpi = 300 } = JSON.parse(req.body)
// Use these in the conversion

// image-resizer — use width + height + fit params:
const { width, height, fit = "cover" } = JSON.parse(req.body)
sharp(input).resize(width, height, { fit }).toFile(output)
```

Settings must be persisted per tool in localStorage:
```js
// Save user's last settings for each tool
localStorage.setItem(`qofeno_settings_${toolSlug}`, JSON.stringify(settings))
// Load on tool page mount
const savedSettings = JSON.parse(localStorage.getItem(`qofeno_settings_${toolSlug}`) || "{}")
```

---

## FIX 15 — REAL NOTIFICATIONS FOR ALL USERS

Fix notifications to be real and automatic.

Trigger notifications in these Appwrite Functions:

**auth-webhook (on new user):**
```js
// Create welcome notification
await db.createDocument(DATABASE_ID, "notifications", ID.unique(), {
  user_id: userId,
  title: "Welcome to Qofeno! 🎉",
  message: "Start using hundreds of free tools right now.",
  type: "info",
  read: false,
  link: "/tools",
  created_at: new Date().toISOString()
})
```

**paypal-webhook (on subscription activated):**
```js
// Create Pro upgrade notification
await db.createDocument(DATABASE_ID, "notifications", ID.unique(), {
  user_id: userId,
  title: "You're now on Pro ✦",
  message: "All tools are unlocked. Enjoy priority processing.",
  type: "success",
  read: false,
  link: "/tools",
  created_at: new Date().toISOString()
})
```

**auto-publish-blog (on new tool published):**
```js
// Notify all users about new tool
const allUsers = await db.listDocuments(DATABASE_ID, "users_meta")
for (const user of allUsers.documents) {
  await db.createDocument(DATABASE_ID, "notifications", ID.unique(), {
    user_id: user.user_id,
    title: `New tool: ${toolName}`,
    message: `${toolName} is now available — try it free.`,
    type: "info",
    read: false,
    link: `/tools/${toolSlug}`,
    created_at: new Date().toISOString()
  })
}
```

Notification bell (Navbar — FA faBell icon):
```jsx
// Real-time unread count badge
// Click → shadcn Popover with notification list
// Each item: FA icon (by type) + title + message + time ago
// Click item → navigate to link + mark as read
// "Mark all as read" button
// Realtime subscription: new notifications appear instantly
```

---

## FIX 16 — REMOVE DASHBOARD PAGE

Remove /dashboard completely.

Redirect any /dashboard link to the user's profile or settings:
```js
// app/dashboard/page.js:
import { redirect } from "next/navigation"
export default function DashboardPage() {
  redirect("/profile")
}
```

Update ALL links, buttons, and nav items that point to /dashboard:
- Navbar logged-in menu → remove "Dashboard" → keep "Profile" + "Settings"
- BottomNavBar → replace Dashboard tab with Profile tab
- After login redirect → /profile (not /dashboard)
- After PayPal payment → /profile?upgraded=true
- Footer → remove /dashboard link
- Sidebar → does not exist anymore (dashboard removed)

---

## FIX 17 — UPGRADE PAGE + PRO FEATURES

Fix the upgrade flow and protect Pro features.

/upgrade page (rename from /checkout/pro if needed):
```jsx
// Show what Pro includes
// PayPal subscription button
// Plan toggle (monthly/yearly)
// "Coming Soon" for Apple Pay, GPay, Stripe

// After payment success: redirect /profile?plan=upgraded
// Show success toast: "You're now on Qofeno Pro ✦"
```

Protect Pro tool pages:
```js
// In tool page — check plan:
const userPlan = userMeta?.plan || "free"
const canUseTool = tool.is_free || userPlan === "pro" || userPlan === "enterprise"

if (!canUseTool) {
  // Show AuthWall with upgrade prompt
  // DO NOT show upload zone
}
```

---

## FIX 18 — FORGOT PASSWORD (REAL INTEGRATION)

Fix forgot password with Resend for the reset email.

```js
// /api/auth/forgot-password:
const token = await account.createRecovery(email, `${APP_URL}/reset-password`)
// Appwrite sends the recovery email automatically
// But customize the template in Appwrite Console → Auth → Email Templates:
// Subject: "Reset your Qofeno password"
// Add Qofeno branding

// /reset-password page:
// Takes ?userId and ?secret from email link
// Form: new password + confirm + PasswordStrength
// Submit: account.updateRecovery(userId, secret, newPassword, newPassword)
// Success: redirect /login + toast "Password updated successfully"
// Invalid/expired: show error + "Request new link" → /forgot-password
```

Strong password requirements:
```js
// PasswordStrength component — enforce these rules:
const rules = [
  { test: (p) => p.length >= 8,     label: "At least 8 characters" },
  { test: (p) => /[A-Z]/.test(p),   label: "One uppercase letter" },
  { test: (p) => /[a-z]/.test(p),   label: "One lowercase letter" },
  { test: (p) => /[0-9]/.test(p),   label: "One number" },
  { test: (p) => /[^A-Za-z0-9]/.test(p), label: "One special character" }
]
// Show checklist of rules below password field
// Submit button disabled until all rules pass
// Strength: 0-2 rules = Weak (red), 3-4 = Good (amber), 5 = Strong (green)
```

---

## FIX 19 — CLOUDFLARE TURNSTILE CAPTCHA

Add Cloudflare Turnstile to signup form and PayPal checkout.

```bash
npm install @marsidev/react-turnstile
```

```env
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=    # from Cloudflare dashboard
CLOUDFLARE_TURNSTILE_SECRET_KEY=               # server-side only
```

**On /signup page — below the form, above submit button:**
```jsx
import { Turnstile } from "@marsidev/react-turnstile"

const [turnstileToken, setTurnstileToken] = useState(null)

<Turnstile
  siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY}
  onSuccess={(token) => setTurnstileToken(token)}
  onExpire={() => setTurnstileToken(null)}
  options={{ theme: "light", size: "normal" }}
/>

// Submit button disabled until turnstileToken is set
// Verify token on server before creating account:
const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
  method: "POST",
  body: JSON.stringify({
    secret: process.env.CLOUDFLARE_TURNSTILE_SECRET_KEY,
    response: turnstileToken
  }),
  headers: { "Content-Type": "application/json" }
})
const { success } = await verifyRes.json()
if (!success) return Response.json({ error: "Captcha verification failed" }, { status: 400 })
```

**On /upgrade (PayPal button) — verify human before showing PayPal:**
```jsx
// Show Turnstile BEFORE rendering PayPal button
// Once Turnstile passes → show PayPal subscription button
const [captchaPassed, setCaptchaPassed] = useState(false)

{!captchaPassed ? (
  <div className="flex flex-col items-center gap-4 py-6">
    <p className="text-sm text-gray-500">Please verify you're human to continue</p>
    <Turnstile
      siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY}
      onSuccess={() => setCaptchaPassed(true)}
    />
  </div>
) : (
  <PayPalButtons ... />
)}
```

---

## FIX 20 — RATE LIMITING

Implement rate limiting using Cloudflare + Appwrite.

**Cloudflare WAF rules (set via Cloudflare dashboard or API):**
```
Rule 1: Tool execution rate limit
  Path: /api/tools/*
  Rate: 10 requests per minute per IP (free users)
  Action: Block with custom error page

Rule 2: Auth rate limit
  Path: /api/auth/*, /login, /signup
  Rate: 5 requests per minute per IP
  Action: Block with custom error page

Rule 3: Contact form
  Path: /api/contact
  Rate: 3 requests per minute per IP
  Action: Block
```

**In Appwrite Functions — server-side rate check:**
```js
// Simple rate limit using Appwrite database
// Track execution count per IP per hour in a rate_limits collection
const { ip } = req.headers
const hourKey = `${ip}_${Math.floor(Date.now() / 3600000)}`

const existing = await db.listDocuments(DATABASE_ID, "rate_limits", [
  Query.equal("key", hourKey)
])

const limit = is_pro_user ? 100 : 20 // pro gets higher limit

if (existing.total > 0 && existing.documents[0].count >= limit) {
  return res.json({
    success: false,
    error: "Rate limit exceeded. Please try again later.",
    code: "RATE_LIMITED"
  }, 429)
}

// Increment count
if (existing.total > 0) {
  await db.updateDocument(DATABASE_ID, "rate_limits", existing.documents[0].$id, {
    count: existing.documents[0].count + 1
  })
} else {
  await db.createDocument(DATABASE_ID, "rate_limits", ID.unique(), {
    key: hourKey,
    count: 1,
    expires_at: new Date(Date.now() + 3600000).toISOString()
  })
}
```

Add `rate_limits` collection to Appwrite:
```
Attributes: key (string, unique), count (integer), expires_at (datetime)
Indexes: key (unique), expires_at (key)
Permissions: Write = Server API key only
```

---

## FIX 21 — NEW TOOL BADGE (AUTOMATIC)

When a new tool is added to the tools collection, automatically mark it as new.

```js
// In tools collection — add is_new_until datetime attribute:
// When a tool document is created: set is_new_until = now + 7 days

// In ToolCard component:
const isNew = tool.is_new_until && new Date(tool.is_new_until) > new Date()

{isNew && (
  <span className="flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700
                   text-xs font-semibold rounded-full animate-pulse">
    <FontAwesomeIcon icon={faStar} className="w-3 h-3" />
    NEW
  </span>
)}
```

---

## FIX 22 — SECURE AND PROTECT ALL PAGES

Security checklist — fix every item:

```
Auth & Sessions:
  □ All protected routes check session via middleware.js
  □ Session cookie httpOnly + secure + sameSite
  □ APPWRITE_API_KEY never in any client bundle
  □ PAYPAL_CLIENT_SECRET never in any client bundle
  □ RESEND_API_KEY never in any client bundle
  □ .env.local in .gitignore (verify before push)
  □ No secrets in any component, page, or public file

API Routes:
  □ All /api/* routes validate session for authenticated actions
  □ All /api/* routes validate input (type, size, format)
  □ PayPal webhook verifies signature
  □ Resend only called from server-side (API routes or functions)

Appwrite:
  □ tool_inputs bucket: Create = Any, Read = Server only
  □ tool_outputs bucket: Create = Server only, Read = Any (signed URL)
  □ All collections: correct permissions verified
  □ Input MIME type validated in every function
  □ File size limits enforced in every function

Frontend:
  □ All external links: rel="noopener noreferrer"
  □ No dangerouslySetInnerHTML with user content
  □ Contact form: sanitize input before storing
  □ Turnstile on signup + PayPal
  □ CSP headers set in Cloudflare Pages
```

---

## FIX 23 — FIX EVERY PAGE WITH REAL CONTENT

Go through every page — remove anything fake, add real content:

```
/ Home:           Real tool counts from DB, real featured tools from DB
/tools:           Real tools from DB only, correct categories
/tools/[slug]:    Real function call, real output, real settings
/pricing:         Fixed toggle, real PayPal plans, real feature comparison
/upgrade:         Real PayPal button, Turnstile captcha
/login:           Fixed auth, Turnstile removed (only on signup)
/signup:          Fixed auth, Turnstile captcha, strong password
/forgot-password: Real Appwrite recovery flow
/reset-password:  Real Appwrite recovery update
/profile:         Real user data from Appwrite Auth + users_meta
/settings:        Real toggles wired to Appwrite
/settings/billing:Real PayPal subscription data
/whats-new:       Real entries from whats_new collection only
/blog:            Real posts from blog_posts collection
/blog/[slug]:     Real content from blog_posts
/about:           Real content, qofeno.png as founder photo
/contact:         Real form → Resend → email delivered
/privacy:         Real policy content
/terms:           Real terms content
/cookies:         Real cookie list + consent banner
/coming-soon:     Clean page for unbuilt features
```

---

## FIX 24 — BUILD + TEST + DEPLOY

### Install all dependencies:
```bash
npm install @fortawesome/react-fontawesome @fortawesome/free-solid-svg-icons
npm install @fortawesome/free-regular-svg-icons @fortawesome/free-brands-svg-icons
npm install @marsidev/react-turnstile
npm install resend
npm install @paypal/react-paypal-js
npm install pdf-lib pdf-parse archiver sharp fluent-ffmpeg ffmpeg-static
npm install docx exceljs mammoth tesseract.js
npm install framer-motion gsap @studio-freight/lenis
```

### Build:
```bash
npm run build
# Zero errors tolerance
```

### Test with REAL files:
```
□ PDF Compressor: real PDF → compress → valid smaller PDF downloads
□ PDF to Word: real text PDF → .docx opens in Word correctly
□ Image Resizer: real JPG → resized correctly
□ Signup → Turnstile passes → account created → welcome email received
□ Forgot password → reset email received → password updated
□ PayPal: Turnstile passes → PayPal button shows → payment → Pro activated
□ Notification: appears after signup, after Pro upgrade
□ Blog: whats_new entry → auto blog post created
□ Contact form: submitted → email received by Mohd Zaheer Uddin
□ Share link: copied/native share works
□ All FA icons showing correctly
□ qofeno.png showing as logo everywhere
□ Monthly/yearly toggle: animates and prices update correctly
□ No 401 on any download
□ Rate limiting: 21st request in an hour gets blocked
```

### Deploy Appwrite Functions:
```bash
appwrite login
# Deploy all functions including new ones:
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
appwrite deploy function --functionId=payment-webhook
appwrite deploy function --functionId=auto-publish-blog
appwrite deploy function --functionId=send-welcome-email
# Test each function after deploy in Appwrite console with real file
```

### Push to GitHub:
```bash
git add .
git commit -m "feat: FA icons, qofeno.png logo, real blog, Turnstile captcha, notifications, rate limiting, fixed auth, fixed tools, real emails, all pages real content"
git push origin main
```

### Deploy Cloudflare Pages:
```bash
npx wrangler pages deploy .next \
  --project-name=[CLOUDFLARE_PAGES_PROJECT] \
  --branch=main
```

### Post-deploy live verification:
```
□ qofeno.png logo visible everywhere on live site
□ FA icons rendering correctly on all pages
□ Tool page: upload zone → process button appears after file select → download opens new tab
□ No 401 on downloads
□ Monthly/yearly toggle works on pricing page
□ Signup: Turnstile shows, account created, welcome email arrives
□ Forgot password: email arrives, reset works
□ PayPal: Turnstile → PayPal button → payment → Pro activated → email arrives
□ Notifications: appear after signup and Pro upgrade
□ Blog: shows real posts (auto-generated from whats_new)
□ About: qofeno.png as founder photo, real content
□ Contact: email delivered to Mohd Zaheer Uddin
□ Privacy/Terms/Cookies: real content, readable
□ Cookie consent banner: appears on first visit
□ /dashboard: redirects to /profile
□ Pro tools: show AuthWall for free users
□ Share button: copies link or opens native share
□ Rate limiting: works correctly
□ Mobile: real iPhone + Android test — everything works
□ No console errors on live URL
□ Lighthouse: 85+ mobile, 90+ desktop
```

---

## COMPLETE .ENV TEMPLATE:

```env
# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com

# Appwrite (public)
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
NEXT_PUBLIC_COL_BLOG=blog_posts
NEXT_PUBLIC_COL_RATE_LIMITS=rate_limits
NEXT_PUBLIC_BUCKET_INPUTS=tool_inputs
NEXT_PUBLIC_BUCKET_OUTPUTS=tool_outputs
NEXT_PUBLIC_OAUTH_REDIRECT=

# Appwrite (server only)
APPWRITE_ENDPOINT=
APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=
APPWRITE_DATABASE_ID=qofeno_db

# PayPal (public)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
NEXT_PUBLIC_PAYPAL_PLAN_ID_MONTHLY=
NEXT_PUBLIC_PAYPAL_PLAN_ID_YEARLY=
NEXT_PUBLIC_PAYPAL_MODE=live

# PayPal (server only)
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=live
PAYPAL_WEBHOOK_ID=
PAYPAL_PRODUCT_ID=
PAYPAL_PLAN_ID_MONTHLY=
PAYPAL_PLAN_ID_YEARLY=

# Resend (server only)
RESEND_API_KEY=
EMAIL_FROM_NAME=Qofeno
EMAIL_FROM_ADDRESS=
ADMIN_EMAIL=

# Cloudflare Turnstile
NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY=
CLOUDFLARE_TURNSTILE_SECRET_KEY=

# Cloudflare Pages
CLOUDFLARE_API_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_PAGES_PROJECT=
CLOUDFLARE_PAGES_DOMAIN=
```

---

## NON-NEGOTIABLE RULES:

1. Read ALL files before touching anything
2. Font Awesome only — no other icon library anywhere
3. qofeno.png as logo everywhere — no other logo
4. Real content only — no fake, demo, mock, placeholder, MVP
5. Fix 401 download error — Permission.read(Role.any()) on ALL output files
6. ilovepdf UX — input only → file selected → process button → download new tab
7. Every tool output validated before serving — never serve corrupted file
8. APPWRITE_API_KEY, PAYPAL_CLIENT_SECRET, RESEND_API_KEY — NEVER in client code
9. Product name: Qofeno — always, everywhere
10. Author: Mohd Zaheer Uddin — footer, about, emails, legal, blog posts
11. /dashboard removed — redirects to /profile
12. Deploy order: Appwrite functions → push GitHub → Cloudflare Pages
13. Test with real files on live URL after deploy
14. Read docs when unsure:
    - Font Awesome React: https://docs.fontawesome.com/web/use-with/react
    - Cloudflare Turnstile: https://developers.cloudflare.com/turnstile/
    - Resend: https://resend.com/docs
    - PayPal subscriptions: https://developer.paypal.com/docs/subscriptions/
    - ReactBits: https://reactbits.dev/get-started
    - Appwrite: https://appwrite.io/docs

Start with Step 1 — read every file. Report findings. Then fix in order. Do not skip any fix.
