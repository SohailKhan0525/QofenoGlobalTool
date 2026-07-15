import { Query } from "node-appwrite"

export async function verifyPlan(db, userId, requiredPlan) {
  if (!userId) return false

  const meta = await db.listDocuments(process.env.DATABASE_ID, "users_meta", [
    Query.equal("user_id", userId),
    Query.limit(1)
  ])

  const plan = meta.documents[0]?.plan ?? "free"

  if (requiredPlan === "teams") return plan === "teams"
  if (requiredPlan === "pro")   return ["pro", "teams"].includes(plan)
  return true
}
