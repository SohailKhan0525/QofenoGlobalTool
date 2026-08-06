import { Client, Databases, Query, ID } from "node-appwrite";
import fetch from "node-fetch";

/**
 * azure-cost-monitor — Appwrite Cloud Function (schedule: 0 9 * * *)
 *
 * Runs daily at 9am UTC. Queries Azure Cost Management API for current
 * month spending, updates Appwrite settings, sends Resend email alerts
 * at $25 / $50 / $80 spent, and disables Azure routing if credit < $10.
 *
 * Re-enables Azure routing automatically if credit recovers (e.g. after
 * the monthly credit renewal from GitHub Student Developer Pack).
 */

async function getAzureToken() {
  const tenantId     = process.env.AZURE_TENANT_ID;
  const clientId     = process.env.AZURE_CLIENT_ID;
  const clientSecret = process.env.AZURE_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) return null;

  const body = new URLSearchParams({
    grant_type:    "client_credentials",
    client_id:     clientId,
    client_secret: clientSecret,
    resource:      "https://management.azure.com/",
  });

  try {
    const res = await fetch(
      `https://login.microsoftonline.com/${tenantId}/oauth2/token`,
      { method: "POST", body }
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

async function upsertSetting(db, key, value) {
  const dbId = process.env.DATABASE_ID || "qofeno_db";
  try {
    const existing = await db.listDocuments(dbId, "settings", [
      Query.equal("key", key),
      Query.limit(1),
    ]);
    const now = new Date().toISOString();
    if (existing.total > 0) {
      await db.updateDocument(dbId, "settings", existing.documents[0].$id, {
        value,
        updated_at: now,
      });
    } else {
      await db.createDocument(dbId, "settings", ID.unique(), {
        key,
        value,
        created_at: now,
        updated_at: now,
      });
    }
  } catch (err) {
    console.error(`Failed to upsert setting "${key}":`, err.message);
  }
}

/**
 * Sends an email via Resend API.
 * Returns { sent: true } or { sent: false, error }
 */
async function sendEmail(subject, html) {
  const apiKey = process.env.RESEND_API_KEY;
  const adminEmail = process.env.ADMIN_EMAIL || "sohailkhannn.0525@gmail.com";

  if (!apiKey) {
    console.warn("RESEND_API_KEY not set — email skipped");
    return { sent: false, error: "RESEND_API_KEY missing" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from:    "Qofeno Monitor <no-reply@qofeno.com>",
        to:      [adminEmail],
        subject,
        html,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Resend error:", data);
      return { sent: false, error: data.message || "Resend API error" };
    }
    return { sent: true, id: data.id };
  } catch (err) {
    return { sent: false, error: err.message };
  }
}

function creditAlertHtml(level, spent, remaining) {
  const colors = {
    critical: "#dc2626",
    warning:  "#d97706",
    notice:   "#7c3aed",
  };
  const color = colors[level] || "#374151";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; padding: 32px;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: ${color}; padding: 24px 32px;">
      <h1 style="color: white; margin: 0; font-size: 20px;">
        Qofeno — Azure Credit Alert
      </h1>
    </div>
    <div style="padding: 32px;">
      <p style="color: #374151; font-size: 16px; margin: 0 0 16px;">
        <strong style="color: ${color};">$${spent.toFixed(2)} spent</strong> of $100 Azure for Students credit this month.
      </p>
      <p style="color: #374151; font-size: 16px; margin: 0 0 24px;">
        <strong>$${remaining.toFixed(2)} remaining.</strong>
      </p>
      ${level === "critical" ? `
      <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <p style="color: #991b1b; margin: 0; font-size: 14px;">
          <strong>Pro tools have been temporarily switched to basic processing.</strong>
          Azure routing is disabled until credit is renewed.
        </p>
      </div>` : ""}
      <a href="https://portal.azure.com/#view/Microsoft_Azure_CostManagement/Menu/~/overview"
         style="display: inline-block; background: ${color}; color: white; padding: 12px 24px;
                border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 14px;">
        View Azure Cost Management
      </a>
      ${level === "critical" || level === "warning" ? `
      <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">
        Renew at: <a href="https://azure.microsoft.com/en-us/free/students" style="color: ${color};">azure.microsoft.com/free/students</a>
      </p>` : ""}
    </div>
    <div style="background: #f9fafb; padding: 16px 32px; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        Qofeno — Automated credit monitor | Product by Mohd Zaheer Uddin
      </p>
    </div>
  </div>
</body>
</html>`;
}

export default async (context) => {
  const { res, log } = context;

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT  || "https://fra.cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_PROJECT_ID || "69c58725000ef2b43f18")
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);

  // ── 1. Query Azure Cost Management ──────────────────────────────────────────
  const token          = await getAzureToken();
  const subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;

  let spent     = 0;
  let remaining = 100;
  let apiReached = false;

  if (token && subscriptionId) {
    const startDate = new Date();
    startDate.setDate(1);
    const start = startDate.toISOString().split("T")[0];
    const end   = new Date().toISOString().split("T")[0];

    try {
      const costRes = await fetch(
        `https://management.azure.com/subscriptions/${subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2023-11-01`,
        {
          method:  "POST",
          headers: {
            Authorization:  `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            type:      "ActualCost",
            timeframe: "Custom",
            timePeriod: { from: start, to: end },
            dataset: {
              granularity: "None",
              aggregation: { totalCost: { name: "Cost", function: "Sum" } },
            },
          }),
        }
      );

      if (costRes.ok) {
        const costData = await costRes.json();
        spent     = parseFloat(costData.properties?.rows?.[0]?.[0] ?? 0);
        remaining = Math.max(0, 100 - spent);
        apiReached = true;
      } else {
        log(`Azure Cost API returned ${costRes.status} — using stored values`);
      }
    } catch (err) {
      log(`Azure Cost API fetch error: ${err.message}`);
    }
  } else {
    log("Azure credentials not configured — cost check skipped");
  }

  log(`Azure spending: $${spent.toFixed(2)} spent, $${remaining.toFixed(2)} remaining`);

  // ── 2. Persist to Appwrite settings ─────────────────────────────────────────
  await upsertSetting(db, "azure_credit_remaining",   remaining.toFixed(2));
  await upsertSetting(db, "azure_spent_this_month",   spent.toFixed(2));
  await upsertSetting(db, "azure_cost_checked_at",    new Date().toISOString());
  await upsertSetting(db, "azure_api_reachable",      String(apiReached));

  // ── 3. Apply credit-protection rules ────────────────────────────────────────
  let status = "ok";
  let emailResult = null;

  if (remaining < 10) {
    // CRITICAL: disable Azure routing, email admin
    log("CRITICAL: Less than $10 Azure credit remaining! Disabling Azure routing.");
    await upsertSetting(db, "azure_disabled",        "true");
    await upsertSetting(db, "azure_disabled_reason", "Credit below $10");
    status = "critical";

    emailResult = await sendEmail(
      "🚨 Qofeno Azure Credit Critical — Pro Tools Paused",
      creditAlertHtml("critical", spent, remaining)
    );
    log(`Critical email sent: ${JSON.stringify(emailResult)}`);

  } else if (remaining < 25) {
    // WARNING: re-enable Azure if it was previously disabled for credit reasons
    // (credit might have been renewed)
    await upsertSetting(db, "azure_disabled", "false");
    status = "warning";
    log("WARNING: Less than $25 Azure credit remaining");

    emailResult = await sendEmail(
      `⚠️ Qofeno Azure Credit Low — $${remaining.toFixed(2)} remaining`,
      creditAlertHtml("warning", spent, remaining)
    );
    log(`Warning email sent: ${JSON.stringify(emailResult)}`);

  } else if (remaining < 50) {
    // NOTICE: halfway through credit — no disable
    await upsertSetting(db, "azure_disabled", "false");
    status = "notice";
    log("NOTICE: Less than $50 Azure credit remaining (halfway)");

    emailResult = await sendEmail(
      `📊 Qofeno Azure Credit Update — $${remaining.toFixed(2)} remaining`,
      creditAlertHtml("notice", spent, remaining)
    );
    log(`Notice email sent: ${JSON.stringify(emailResult)}`);

  } else {
    // All good — ensure Azure is enabled (handles credit renewal recovery)
    await upsertSetting(db, "azure_disabled", "false");
    log("Azure credit healthy — no action needed");
  }

  return res.json({
    success: true,
    spent:    parseFloat(spent.toFixed(2)),
    remaining: parseFloat(remaining.toFixed(2)),
    status,
    api_reached: apiReached,
    email:   emailResult,
  });
};
