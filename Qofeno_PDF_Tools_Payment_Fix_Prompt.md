You are an expert full-stack developer working on **Qofeno** — a growing online tools platform built by Mohd Zaheer Uddin.

**FIRST: Read and analyze every single file and folder in this project before touching anything.** Understand the full codebase, every page, component, Appwrite function, config, and environment setup. List what's broken, what's missing, what needs fixing. Then proceed in order.

You have full access to:
- All project files (read, create, update, delete)
- Appwrite via API key (collections, buckets, functions, deploy)
- Cloudflare Pages via API key (build, deploy)
- GitHub (commit, push)
- npm/yarn (install any package needed)
- Any open-source CLI tool (ghostscript, ffmpeg, LibreOffice, ImageMagick, etc.)

---

## PART 1 — ADD ALL PDF TOOLS

Add every PDF tool listed below. Each tool gets:
- Its own Appwrite Function
- A tool page at /tools/[slug]
- An entry in the `tools` collection in Appwrite
- Settings panel on the tool page
- Correct plan assignment (FREE or PRO)

### PDF Tools — Full List:

**FREE tools (no login required):**
```
pdf-compressor          PDF Compressor
pdf-merger              PDF Merger
pdf-splitter            PDF Splitter
pdf-rotate              PDF Rotate Pages
pdf-to-jpg              PDF to JPG
jpg-to-pdf              JPG to PDF
pdf-page-numbers        Add Page Numbers to PDF
pdf-to-text             PDF to Text (extract text)
pdf-word-count          PDF Word Count
pdf-metadata-viewer     PDF Metadata Viewer
```

**PRO tools (login required):**
```
pdf-to-word             PDF to Word (.docx)
pdf-to-excel            PDF to Excel (.xlsx)
pdf-to-powerpoint       PDF to PowerPoint (.pptx)
pdf-to-html             PDF to HTML
word-to-pdf             Word to PDF (.docx → .pdf)
excel-to-pdf            Excel to PDF (.xlsx → .pdf)
powerpoint-to-pdf       PowerPoint to PDF (.pptx → .pdf)
pdf-ocr                 PDF OCR (scanned PDF → searchable)
pdf-redact              PDF Redact (remove sensitive text)
pdf-watermark           Add Watermark to PDF
pdf-unlock              Remove PDF Password
pdf-protect             Add Password to PDF
pdf-sign                Digital Signature (place signature image)
pdf-crop                PDF Crop Pages
pdf-repair              PDF Repair (attempt to fix corrupted PDF)
pdf-compare             PDF Compare (highlight differences)
pdf-flatten             PDF Flatten (flatten form fields)
pdf-thumbnail           PDF Thumbnail Generator
```

### Update the pricing plans to include PDF tools:

**FREE plan includes:**
- All FREE tools listed above
- Max file size: 50MB per file
- No login required

**PRO plan includes:**
- All FREE tools + all PRO tools
- Max file size: 500MB per file
- Priority server processing
- Saved history

Update the /pricing page and pricing preview on / home page to reflect this clearly.
Show a "What's included" section per plan that lists tool categories with counts.

---

## PART 2 — TOOL SETTINGS PANEL

Every tool page must have a **Settings Panel** — tool-specific options the user can configure before processing.

### Settings Panel design:
```jsx
// Appears between the upload zone and the process button
// Collapsible on mobile (shadcn Accordion or Collapsible)
// Always visible on desktop

<ToolSettings>
  {/* Tool-specific options rendered here */}
</ToolSettings>
```

### PDF Tool Settings (implement for each):

**pdf-compressor:**
```
Compression Level: [Low | Medium (default) | High | Maximum]
  Low:     quality=90, minimal size reduction
  Medium:  quality=75, balanced (default)
  High:    quality=50, significant reduction
  Maximum: quality=25, smallest file, lower quality
Output: Show estimated size reduction preview after file selected
```

**pdf-merger:**
```
Page order: drag-and-drop reorder of uploaded files (react-beautiful-dnd or dnd-kit)
  - User uploads multiple PDFs
  - Sees list of files with drag handles
  - Can reorder before merging
Output filename: editable text input (default: "merged.pdf")
```

**pdf-splitter:**
```
Split mode:
  By page ranges: text input "1-3, 5, 7-9" (default)
  Every N pages: number input (e.g. every 2 pages)
  By bookmarks: split at each bookmark
Output: single PDF or zip of multiple PDFs
```

**pdf-rotate:**
```
Rotation: [90° Clockwise | 180° | 90° Counter-clockwise]
Apply to: [All pages | Odd pages | Even pages | Specific pages (input)]
```

**pdf-to-jpg:**
```
Quality: slider 50–100 (default 90)
DPI: [72 | 96 | 150 | 300 (default) | 600]
Pages: [All (default) | Specific pages input]
Output: individual JPGs in a ZIP file
```

**jpg-to-pdf:**
```
Page size: [A4 (default) | Letter | Legal | Auto-fit]
Orientation: [Portrait (default) | Landscape | Auto]
Margin: [None | Small | Medium | Large]
Order: drag-and-drop if multiple images
```

**pdf-to-word:**
```
Conversion mode:
  Standard (default): best for text-heavy PDFs
  OCR mode: for scanned PDFs (uses OCR) — PRO only
Preserve layout: toggle (on by default)
```

**pdf-watermark:**
```
Watermark text: text input
  OR image watermark: upload image
Position: [Center | Top-left | Top-right | Bottom-left | Bottom-right | Tile]
Opacity: slider 10–100% (default 30%)
Font size: 24–120 (default 48)
Color: color picker (default: light gray)
Rotation: -90° to 90° (default 45°)
Apply to: [All pages | First page | Last page]
```

**pdf-protect:**
```
Owner password: text input (required)
User password: text input (optional — restrict opening)
Permissions: checkboxes
  ☐ Allow printing
  ☐ Allow copying text
  ☐ Allow editing
  ☐ Allow annotations
```

**pdf-page-numbers:**
```
Position: [Bottom center (default) | Bottom left | Bottom right | Top center | Top left | Top right]
Start number: number input (default: 1)
Font size: 8–24 (default 12)
Format: [1 | Page 1 | 1 of N | Page 1 of N]
Margin: slider (distance from edge)
```

**pdf-ocr:**
```
Language: dropdown [English (default) | Spanish | French | German | Arabic | Hindi | Auto-detect]
Output type: [Searchable PDF (default) | Text file (.txt)]
```

**pdf-compare:**
```
Upload PDF 1 and PDF 2 (two upload zones)
Highlight color: [Yellow (default) | Red | Green | Blue]
Compare mode: [Text only | Visual | Both]
```

### Settings Panel component rules:
- Uses shadcn components: Slider, Select, Input, Switch, Checkbox, RadioGroup, Label
- Responsive: stacks vertically on mobile, 2-column grid on desktop for longer forms
- Defaults pre-filled so user can process immediately without changing anything
- Settings passed as params in function request body
- Settings saved in localStorage per tool (so user's preferences persist)

---

## PART 3 — FIX OUTPUT FORMAT (CRITICAL)

**Rule: Every tool must produce a valid, correct output in the exact expected format.**

Current problem: Some tools produce corrupted, wrong format, or unreadable outputs.

### Fix every tool function to guarantee valid output:

**PDF tools — output must be:**
- Valid PDF that opens in Adobe Reader, Preview, Chrome, Edge
- Correct MIME type: application/pdf
- Not corrupted — test by opening in a PDF viewer after download
- File size makes sense (compressor = smaller, merger = combined size, etc.)

**Conversion tools — output must match target format exactly:**
```
pdf-to-word     → valid .docx that opens in Microsoft Word / LibreOffice
pdf-to-excel    → valid .xlsx that opens in Excel / Google Sheets
pdf-to-jpg      → valid JPEG files that open in any image viewer
jpg-to-pdf      → valid PDF with images embedded correctly
word-to-pdf     → valid PDF that matches the Word document layout
pdf-to-text     → valid .txt with readable extracted text
pdf-ocr         → searchable PDF with selectable text layer
```

### Output validation — add to EVERY function:

After processing, before uploading to output bucket:
```js
// Validate output file exists and has size > 0
const outputStat = fs.statSync(outputPath)
if (!outputStat || outputStat.size === 0) {
  throw new Error("Output file is empty or missing — processing failed")
}

// For PDF outputs — validate PDF header
if (outputMimeType === "application/pdf") {
  const header = fs.readFileSync(outputPath, { encoding: "utf8", flag: "r" }).substring(0, 5)
  if (header !== "%PDF-") {
    throw new Error("Output is not a valid PDF file")
  }
}

// For image outputs — validate with sharp
if (["image/jpeg","image/png","image/webp"].includes(outputMimeType)) {
  const metadata = await sharp(outputPath).metadata()
  if (!metadata.width || !metadata.height) {
    throw new Error("Output image is corrupted or invalid")
  }
}

// For docx outputs — validate zip structure (docx is a zip)
if (outputMimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
  // Check file starts with PK (zip magic bytes)
  const buf = fs.readFileSync(outputPath)
  if (buf[0] !== 0x50 || buf[1] !== 0x4B) {
    throw new Error("Output .docx is corrupted")
  }
}
```

### Retry logic — if output is invalid, retry once:
```js
async function processWithRetry(processFn, maxRetries = 2) {
  let lastError
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await processFn()
      // validate result
      return result
    } catch (err) {
      lastError = err
      log(`Attempt ${attempt} failed: ${err.message}. Retrying...`)
      await new Promise(r => setTimeout(r, 500)) // wait 500ms before retry
    }
  }
  throw lastError
}
```

### Install proper processing libraries:

For PDF tools — install and use these (they produce valid outputs):
```bash
# In each function's directory:
npm install node-appwrite

# PDF processing
npm install pdf-lib          # PDF create, merge, split, rotate, watermark
npm install pdf-parse        # Extract text from PDFs
npm install hummus-recipe    # Advanced PDF manipulation
npm install pdfjs-dist       # PDF rendering

# For PDF to Word / Excel / PowerPoint conversions
# Use LibreOffice (headless) — most reliable converter
# Install in function via apt or use a Docker-based runtime

# For OCR
npm install tesseract.js     # OCR — works without external deps

# For image processing
npm install sharp             # Image resize, convert, compress

# For zip output (multiple files)
npm install archiver          # Create ZIP archives

# For Office file generation
npm install docx              # Generate .docx files
npm install exceljs           # Generate .xlsx files
npm install pptxgenjs         # Generate .pptx files
```

### LibreOffice for conversions (most reliable):
For PDF↔Office conversions, use LibreOffice headless in the Appwrite Function:
```js
import { execSync } from "child_process"

// Convert docx to pdf using LibreOffice:
execSync(`libreoffice --headless --convert-to pdf --outdir ${tmpDir} ${inputPath}`)

// Convert pdf to docx:
execSync(`libreoffice --headless --convert-to docx --outdir ${tmpDir} ${inputPath}`)
```

If LibreOffice is not available in the runtime, use these npm alternatives:
- docx + pdf-lib for PDF→Word (text extraction + rebuild)
- mammoth for Word→HTML→PDF pipeline

---

## PART 4 — TOOL PAGE — SAME FORMAT ACROSS ALL TOOLS

Every tool page must follow the exact same layout and UX pattern.
A user who uses PDF Compressor must feel exactly the same experience using PDF to Word.

### Universal tool page layout:
```
1. Breadcrumb          Home > Tools > PDF > [Tool Name]
2. Tool header         Icon + Name + Category badge + FREE/PRO badge + description
3. Privacy badge       "🔒 Files processed on our servers and deleted after download"
4. Upload zone         File drop area (tool-specific accepted types shown)
5. Settings panel      Tool-specific options (collapsible on mobile)
6. Process button      Large, gradient, tool-specific label ("Compress PDF", "Convert to Word")
7. Processing state    Ring + "Processing on our servers..."
8. Result card         Green card + filename + size + DOWNLOAD button
9. Reset link          "Process another file →"
10. Related tools      Horizontal row of same-category tools
```

### Upload zone — consistent across ALL tools:
```jsx
<UploadZone
  accept={tool.accepted_types}        // e.g. ["application/pdf"]
  maxSize={isPro ? 500 : 50}          // MB
  label="Drop your PDF here"
  sublabel="or tap to browse"
  hint={`Accepts: PDF up to ${isPro ? "500MB" : "50MB"}`}
/>
```

### Process button — consistent label per tool:
```js
const toolLabels = {
  "pdf-compressor":    "Compress PDF",
  "pdf-merger":        "Merge PDFs",
  "pdf-splitter":      "Split PDF",
  "pdf-to-word":       "Convert to Word",
  "pdf-to-jpg":        "Convert to JPG",
  "pdf-to-excel":      "Convert to Excel",
  "jpg-to-pdf":        "Convert to PDF",
  "word-to-pdf":       "Convert to PDF",
  "pdf-watermark":     "Add Watermark",
  "pdf-protect":       "Protect PDF",
  "pdf-ocr":           "Run OCR",
  "pdf-rotate":        "Rotate Pages",
  "pdf-page-numbers":  "Add Page Numbers",
  "pdf-to-text":       "Extract Text",
  "pdf-compare":       "Compare PDFs",
  // etc.
}
```

### Download card — consistent across ALL tools:
```jsx
// Same green card design for every single tool
// Same "Download Result" button (large, full-width, purple)
// Same privacy note below
// Same "Process another file →" reset link
// Output filename must match expected format:
//   pdf-compressor: original_compressed.pdf
//   pdf-to-word:    original.docx
//   pdf-to-jpg:     original_pages.zip (or individual jpgs)
//   jpg-to-pdf:     images.pdf
//   pdf-watermark:  original_watermarked.pdf
//   pdf-protect:    original_protected.pdf
```

### Error state — consistent across ALL tools:
```jsx
// If processing fails — show this clearly:
<div className="mt-6 p-5 rounded-2xl border-2 border-red-200 bg-red-50 w-full">
  <div className="flex items-center gap-3 mb-3">
    <AlertCircleIcon className="text-red-500 w-6 h-6" />
    <p className="font-semibold text-red-800">Processing failed</p>
  </div>
  <p className="text-sm text-red-600 mb-4">{errorMessage}</p>
  <button onClick={resetTool} className="w-full py-3 bg-red-600 text-white rounded-xl font-semibold">
    Try again with a different file
  </button>
</div>
```

---

## PART 5 — REAL PAYPAL INTEGRATION

Integrate PayPal as the real payment method for Pro plan.

### PayPal setup:
```env
# Add to .env
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox    # Change to "live" when ready
PAYPAL_WEBHOOK_ID=your_paypal_webhook_id

# Frontend
NEXT_PUBLIC_PAYPAL_CLIENT_ID=your_paypal_client_id
NEXT_PUBLIC_PAYPAL_MODE=sandbox
```

### Install PayPal SDK:
```bash
npm install @paypal/react-paypal-js        # Frontend
npm install @paypal/checkout-server-sdk    # Backend / Appwrite functions
```

### Payment flow:
```
1. User clicks "Get Pro" → checks if logged in
   Not logged in → /login?redirect=/checkout/pro
   Logged in → /checkout/pro

2. /checkout/pro page:
   - Show plan details (Pro $9/mo or $5.40/mo yearly)
   - Monthly/Yearly toggle
   - PayPal button renders
   - "Coming Soon" badges for: Apple Pay | Google Pay | Stripe

3. PayPal button flow:
   a. User clicks PayPal button
   b. Frontend calls /api/paypal/create-order:
      Creates PayPal subscription or order via PayPal API
      Returns { orderID }
   c. PayPal popup opens → user approves
   d. Frontend calls /api/paypal/capture-order with orderID
   e. Server verifies payment with PayPal API
   f. On success: update users_meta.plan = "pro" in Appwrite
   g. Create subscriptions document
   h. Redirect → /dashboard with success toast

4. PayPal webhook (Appwrite Function: payment-webhook):
   - Receives PayPal webhook events
   - Verifies webhook signature using PAYPAL_WEBHOOK_ID
   - Handles: BILLING.SUBSCRIPTION.ACTIVATED, BILLING.SUBSCRIPTION.CANCELLED,
              PAYMENT.SALE.COMPLETED, BILLING.SUBSCRIPTION.EXPIRED
   - Updates users_meta and subscriptions accordingly
```

### /checkout/pro page layout:
```jsx
<div className="max-w-lg mx-auto p-6">
  <h1>Upgrade to Pro</h1>

  {/* Plan toggle */}
  <PlanToggle />  {/* Monthly $9 / Yearly $5.40/mo */}

  {/* What you get */}
  <ProFeaturesList />

  {/* PayPal button */}
  <PayPalScriptProvider options={{ clientId: PAYPAL_CLIENT_ID }}>
    <PayPalButtons
      createOrder={createPayPalOrder}
      onApprove={onPayPalApprove}
      onError={onPayPalError}
      style={{ layout: "vertical", color: "blue", shape: "rect" }}
    />
  </PayPalScriptProvider>

  {/* Coming soon payment methods */}
  <div className="mt-4">
    <p className="text-sm text-gray-400 text-center mb-3">More payment methods coming soon</p>
    <div className="flex gap-3 justify-center opacity-40">
      <Badge>Apple Pay</Badge>
      <Badge>Google Pay</Badge>
      <Badge>Stripe</Badge>
    </div>
  </div>

  {/* Security note */}
  <p className="text-xs text-center text-gray-400 mt-4">
    🔒 Secure payment via PayPal · Cancel anytime
  </p>
</div>
```

### Appwrite Function: `paypal-webhook`
```js
// Verify PayPal webhook signature
// Handle subscription events
// Update Appwrite database

import { Client, Databases } from "node-appwrite"
import https from "https"

export default async ({ req, res, log, error }) => {
  // 1. Verify PayPal webhook signature
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  const headers = req.headers
  const body = req.body

  const isValid = await verifyPayPalWebhook(webhookId, headers, body)
  if (!isValid) return res.json({ error: "Invalid signature" }, 401)

  const event = JSON.parse(body)
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)
  const db = new Databases(client)

  switch (event.event_type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED":
      // Set plan = pro, create subscription record
      break
    case "BILLING.SUBSCRIPTION.CANCELLED":
      // Set subscription status = cancelled
      break
    case "BILLING.SUBSCRIPTION.EXPIRED":
      // Set plan = free
      break
    case "PAYMENT.SALE.COMPLETED":
      // Log payment
      break
  }

  return res.json({ received: true })
}
```

### Update /dashboard/billing page:
```
Show PayPal subscription details:
- Plan: Pro (Monthly/Yearly)
- Next billing date
- Payment method: PayPal (show PayPal logo)
- "Manage subscription" → links to PayPal subscription management
- "Cancel subscription" → confirms → cancels via PayPal API
```

### Display payment method logos (from Appwrite payment logos endpoint):
```js
// Show on /checkout/pro:
// PayPal logo (active)
// Visa, Mastercard logos (show as "via PayPal")
// Apple Pay, Google Pay, Stripe (grayed out "Coming Soon")
```

---

## PART 6 — APPLY REACTBITS.DEV COMPONENTS

Go to https://reactbits.dev/get-started and read the documentation.
Install and apply these components to make Qofeno look premium:

```bash
# Install ReactBits components as needed:
npx reactbits@latest add aurora          # Hero background
npx reactbits@latest add split-text     # Headline animation
npx reactbits@latest add magnet         # CTA button magnetic effect
npx reactbits@latest add shine-border   # Pro pricing card highlight
npx reactbits@latest add tilt           # Tool cards depth effect
npx reactbits@latest add blur-fade      # Staggered page reveals
npx reactbits@latest add count-up       # Number counters
npx reactbits@latest add dot-pattern    # Upload zone texture
npx reactbits@latest add animated-gradient # Section backgrounds
npx reactbits@latest add text-shimmer   # Loading/processing text
```

Apply to:
- Hero: Aurora background, SplitText headline, Magnet CTA
- Tool cards on /tools: Tilt effect
- Pro pricing card: ShineBorder
- Upload zone: DotPattern background
- Process button: subtle glow animation
- Tool count badge: CountUp
- All page sections: BlurFade stagger reveal
- Footer: AnimatedGradient subtle background

Rules:
- Do NOT break the purple/white color system
- All ReactBits animations must respect prefers-reduced-motion
- Test on mobile — disable heavy effects on mobile if needed

---

## PART 7 — FIX AND SECURE EVERYTHING

### Fix all tool functions:
- Every function uses correct npm packages for its tool category
- Every function validates output (not empty, correct format, correct MIME type)
- Every function has retry logic (processWithRetry)
- Every function cleans up /tmp files in finally{}
- Every function deletes input file from tool_inputs bucket
- Every function sets Permission.read(Role.any()) on output file
- Every function returns consistent response shape

### Fix all permissions in Appwrite:
- tool_inputs bucket: Create = Any (allow anonymous upload)
- tool_outputs bucket: Read = Any (allow download via URL)
- notifications collection: add and configure correctly
- All 9 existing collections: verify permissions are correct

### Security:
- APPWRITE_API_KEY never in any client file
- PAYPAL_CLIENT_SECRET never in any client file  
- Only NEXT_PUBLIC_* vars go to browser
- .env.local in .gitignore (verify)
- .env.example exists with all keys, no real values
- PayPal webhook verifies signature before any DB write
- Input validation in every function (MIME type, file size)
- Rate limiting: add Cloudflare WAF rule for free tier abuse

### Responsiveness (final pass):
Test at 320px, 375px, 390px, 430px, 768px, 1024px, 1280px, 1440px

Every page must pass:
- No horizontal overflow
- Touch targets ≥ 44×44px
- Inputs font-size ≥ 16px (no iOS zoom)
- BottomNavBar safe area insets
- Tool pages: upload zone, settings, process button, download card all stack correctly
- Settings panel: collapses on mobile, readable on all sizes
- PayPal button: renders correctly on mobile

---

## PART 8 — BUILD + TEST + DEPLOY

### Step 1: Install all dependencies:
```bash
npm install
```

### Step 2: Build:
```bash
npm run build
```
Fix ALL errors. Zero build errors before continuing.

### Step 3: Test locally:
```bash
npm run start
```

Test these specific flows with REAL files:
```
FREE tool test:
  1. Go to /tools/pdf-compressor
  2. Upload a real PDF (> 500KB)
  3. Choose compression level (Medium)
  4. Click "Compress PDF"
  5. Verify ProcessingRing shows
  6. Verify green download card appears
  7. Click "Download Result"
  8. Verify: valid PDF downloads, file is smaller than original
  9. Open downloaded PDF — must open correctly

CONVERSION test:
  1. Go to /tools/pdf-to-word
  2. Upload a real PDF with text
  3. Click "Convert to Word"
  4. Download .docx
  5. Open in Word/LibreOffice — must be readable, not corrupted

MULTI-FILE test (merger):
  1. Go to /tools/pdf-merger
  2. Upload 2+ PDFs
  3. Reorder them
  4. Click "Merge PDFs"
  5. Download merged.pdf
  6. Verify all pages from all input files are present

FREE tool anonymous test:
  1. Log out completely
  2. Go to /tools/pdf-compressor
  3. Upload and process without logging in
  4. Verify it works, no auth wall, no redirect

PAYPAL test (sandbox):
  1. Go to /pricing → click "Get Pro"
  2. Complete PayPal sandbox checkout
  3. Verify plan updates to "pro" in Appwrite
  4. Verify PRO tools now work

DOWNLOAD 401 test:
  1. Process any tool
  2. Click download
  3. Verify NO 401 error — file downloads correctly
```

### Step 4: Deploy Appwrite Functions:
For every tool function + platform function:
```bash
# Using Appwrite CLI
appwrite login
appwrite deploy function --functionId=pdf-compressor
appwrite deploy function --functionId=pdf-merger
appwrite deploy function --functionId=pdf-splitter
appwrite deploy function --functionId=pdf-to-word
appwrite deploy function --functionId=pdf-to-jpg
appwrite deploy function --functionId=jpg-to-pdf
appwrite deploy function --functionId=pdf-rotate
appwrite deploy function --functionId=pdf-page-numbers
appwrite deploy function --functionId=pdf-to-text
appwrite deploy function --functionId=pdf-watermark
appwrite deploy function --functionId=pdf-protect
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
appwrite deploy function --functionId=payment-webhook
appwrite deploy function --functionId=paypal-webhook
```

After deploying each function:
- Test with a real file in Appwrite console
- Verify: success:true, valid download_url, file downloads correctly

### Step 5: Commit and push to GitHub:
```bash
git add .
git commit -m "feat: all PDF tools, PayPal payment, tool settings, output validation, ReactBits UI, responsive fixes"
git push origin main
```

### Step 6: Deploy to Cloudflare Pages:
```bash
npx wrangler pages deploy .next \
  --project-name=[CLOUDFLARE_PAGES_PROJECT] \
  --branch=main
```

Or let CI/CD auto-deploy on push to main.

### Step 7: Post-deploy verification on live URL:
```
□ All PDF tool pages load correctly
□ PDF Compressor: upload real PDF → compress → download → valid PDF
□ PDF to Word: upload real PDF → convert → download → valid DOCX opens in Word
□ PDF Merger: upload 2 PDFs → merge → download → valid merged PDF
□ Download button: clearly visible, green card, works on mobile
□ No 401 errors on any download
□ Free tools: work without login
□ Pro tools: show AuthWall correctly
□ Settings panel: visible and functional on every tool page
□ PayPal checkout: sandbox payment completes, plan updates
□ Notifications: bell shows in navbar
□ Filters on /tools: apply, reset, URL sync work
□ Mobile: test on real iPhone + Android
□ No console errors on live URL
□ Lighthouse: 85+ mobile, 90+ desktop
```

---

## ENVIRONMENT VARIABLES (.env.local):

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

# Server only (NEVER NEXT_PUBLIC_)
APPWRITE_ENDPOINT=
APPWRITE_PROJECT_ID=
APPWRITE_API_KEY=

# PayPal
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
NEXT_PUBLIC_PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_MODE=sandbox
PAYPAL_WEBHOOK_ID=

# Email
EMAIL_FROM_NAME=Qofeno
EMAIL_FROM_ADDRESS=hello@yourdomain.com

# Cloudflare
CLOUDFLARE_API_KEY=
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_PAGES_PROJECT=
CLOUDFLARE_PAGES_DOMAIN=
```

---

## RULES — NON-NEGOTIABLE:

1. **Read all files first** before touching anything
2. **Fix 401 download error** — Permission.read(Role.any()) on all output files
3. **Every tool output must be valid** — validate format, retry on failure, never serve corrupted file
4. **Same UX pattern across all tools** — identical upload/process/download flow
5. **Free tools need no auth** — zero friction for anonymous users
6. **PayPal only for now** — Apple Pay, GPay, Stripe = "Coming Soon" badges
7. **APPWRITE_API_KEY + PAYPAL_CLIENT_SECRET never in client code**
8. **Product name: Qofeno** — no suffixes anywhere
9. **Author: Mohd Zaheer Uddin** — footer, legal, about, emails
10. **Read docs before using any library:**
    - ReactBits: https://reactbits.dev/get-started
    - PayPal SDK: https://developer.paypal.com/sdk/js/
    - Appwrite: https://appwrite.io/docs
    - pdf-lib: https://pdf-lib.js.org
    - sharp: https://sharp.pixelplumbing.com
    - LibreOffice: https://www.libreoffice.org/get-help/documentation/
11. **Test with real files** — not dummy/empty files
12. **No console.log in production** — remove before deploying
13. **Deploy functions, push GitHub, deploy Cloudflare** — all three, in that order

Start with Step 1 — read all files. Report findings. Then fix in order.
