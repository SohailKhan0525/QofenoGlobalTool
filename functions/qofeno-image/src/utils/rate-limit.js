import { ID, Query } from "node-appwrite"

export async function checkRateLimit(db, identifier, plan) {
  const limits = { free: 100, pro: 1000, teams: 5000 }
  const limit = limits[plan] || limits.free
  const windowStart = new Date(Math.floor(Date.now() / 3600000) * 3600000).toISOString()
  const key = `${identifier}_${windowStart}`

  try {
    const existing = await db.listDocuments(process.env.DATABASE_ID || "qofeno_db", "rate_limits", [
      Query.equal("key", key), Query.limit(1)
    ])

    if (existing.total > 0) {
      if (existing.documents[0].count >= limit) {
        throw new Error(`Rate limit reached (${limit} requests/hour on ${plan} plan).`)
      }
      await db.updateDocument(
        process.env.DATABASE_ID || "qofeno_db", "rate_limits",
        existing.documents[0].$id,
        { count: existing.documents[0].count + 1 }
      )
    } else {
      await db.createDocument(
        process.env.DATABASE_ID || "qofeno_db", "rate_limits", ID.unique(),
        { key, count: 1, window_start: windowStart }
      )
    }
  } catch (err) {
    if (err.message.includes("Rate limit reached")) {
      throw err;
    }
    // Don't fail execution if rate_limits collection or DB has temporary issue
    console.log("Rate limit check non-fatal error:", err.message);
  }
}
