import { Client, Databases, Query, ID } from "node-appwrite";
import fetch from "node-fetch";

/**
 * azure-manager — Appwrite Cloud Function
 *
 * The broker between the Qofeno frontend and the Azure Container App processor.
 * All communication with the Azure container routes through here so:
 *   1. The container secret never touches the browser
 *   2. Azure disabled/enabled state is checked centrally
 *   3. Cold-start polling logic lives in one place
 *
 * Actions:
 *   { action: "wake" }   → Pings /health until container is alive, returns timing
 *   { action: "status" } → Returns current Azure state (enabled/disabled, credit)
 */

const WAKE_TIMEOUT_MS   = 65_000;  // 65s max wait for cold start
const HEALTH_POLL_MS    = 2_500;   // ping every 2.5s
const HEALTH_FETCH_MS   = 5_000;   // per-ping timeout

function initDb() {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT  || "https://fra.cloud.appwrite.io/v1")
    .setProject(process.env.APPWRITE_PROJECT_ID || "69c58725000ef2b43f18")
    .setKey(process.env.APPWRITE_API_KEY);
  return new Databases(client);
}

async function getSetting(db, key) {
  const dbId = process.env.DATABASE_ID || "qofeno_db";
  try {
    const docs = await db.listDocuments(dbId, "settings", [
      Query.equal("key", key),
      Query.limit(1),
    ]);
    return docs.documents[0]?.value ?? null;
  } catch {
    return null;
  }
}

async function pingHealth(url, secret) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), HEALTH_FETCH_MS);
  try {
    const res = await fetch(`${url}/health`, {
      method:  "GET",
      headers: { Authorization: `Bearer ${secret}` },
      signal:  controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();   // { status, idle_seconds, ready, timestamp }
  } catch {
    clearTimeout(timer);
    return null;
  }
}

/**
 * action: "wake"
 * Sends rapid health pings until the container responds or timeout is reached.
 * Returns { awake, cold_start_ms, idle_seconds, url }
 */
async function handleWake(db, res, log) {
  const processorUrl = process.env.AZURE_PROCESSOR_URL
    || await getSetting(db, "azure_processor_url");

  if (!processorUrl) {
    log("AZURE_PROCESSOR_URL not configured — container not yet provisioned");
    return res.json({
      awake: false,
      reason: "Container not provisioned",
      hint:   "Run scripts/build_azure_containers.mjs to deploy the container, then set AZURE_PROCESSOR_URL on this function.",
    });
  }

  // Check credit protection flag before trying to wake
  const disabled = await getSetting(db, "azure_disabled");
  if (disabled === "true") {
    const reason = await getSetting(db, "azure_disabled_reason") || "Credit protection active";
    log(`Azure disabled: ${reason}`);
    return res.json({
      awake:   false,
      reason,
      disabled: true,
    });
  }

  const secret     = process.env.QOFENO_CONTAINER_SECRET || "";
  const start      = Date.now();

  log(`Waking container at ${processorUrl}...`);

  while (Date.now() - start < WAKE_TIMEOUT_MS) {
    const health = await pingHealth(processorUrl, secret);

    if (health && health.status === "ok") {
      const elapsed = Date.now() - start;
      log(`Container warm after ${elapsed}ms (idle was ${health.idle_seconds}s)`);
      return res.json({
        awake:         true,
        cold_start_ms: elapsed,
        idle_seconds:  health.idle_seconds,
        url:           processorUrl,
      });
    }

    // Not ready yet — wait before next ping
    await new Promise(r => setTimeout(r, HEALTH_POLL_MS));
  }

  log(`Container wake timed out after ${WAKE_TIMEOUT_MS}ms`);
  return res.json({
    awake:  false,
    reason: `Timeout — container did not respond within ${WAKE_TIMEOUT_MS / 1000}s`,
  }, 503);
}

/**
 * action: "status"
 * Returns current credit/enabled state without polling.
 */
async function handleStatus(db, res, log) {
  const [disabled, reason, remaining, spent, checkedAt, processorUrl] = await Promise.all([
    getSetting(db, "azure_disabled"),
    getSetting(db, "azure_disabled_reason"),
    getSetting(db, "azure_credit_remaining"),
    getSetting(db, "azure_spent_this_month"),
    getSetting(db, "azure_cost_checked_at"),
    getSetting(db, "azure_processor_url")
      .catch(() => null)
      .then(v => v || process.env.AZURE_PROCESSOR_URL || null),
  ]);

  const url = process.env.AZURE_PROCESSOR_URL || processorUrl;

  // Quick live ping if not disabled
  let live = false;
  if (disabled !== "true" && url) {
    const secret = process.env.QOFENO_CONTAINER_SECRET || "";
    const health = await pingHealth(url, secret);
    live = !!(health && health.status === "ok");
  }

  log(`Status: disabled=${disabled}, remaining=$${remaining}, live=${live}`);

  return res.json({
    enabled:   disabled !== "true",
    disabled:  disabled === "true",
    reason:    reason || null,
    credit: {
      remaining:  remaining ? parseFloat(remaining) : null,
      spent:      spent     ? parseFloat(spent)     : null,
      checked_at: checkedAt || null,
    },
    container: {
      url:  url || null,
      live,
    },
  });
}

export default async (context) => {
  const { req, res, log, error } = context;

  const db = initDb();

  let body = {};
  try {
    body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
  } catch {
    body = {};
  }

  const action = (body.action || req.query?.action || "status").toLowerCase();

  log(`azure-manager action: ${action}`);

  switch (action) {
    case "wake":
      return await handleWake(db, res, log);

    case "status":
      return await handleStatus(db, res, log);

    default:
      error(`Unknown action: ${action}`);
      return res.json({ success: false, error: `Unknown action: ${action}` }, 400);
  }
};
