import { Client, Users, Databases, ID, Query } from "node-appwrite"
import dotenv from "dotenv"
import fs from "fs"

dotenv.config({ path: ".env.local" })
dotenv.config({ path: ".env", override: false })

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
  .setProject(process.env.APPWRITE_PROJECT_ID || "69c58725000ef2b43f18")
  .setKey(process.env.APPWRITE_API_KEY)

const users = new Users(client)
const db = new Databases(client)

const TEST_USER_EMAIL = "test@qofeno.internal"
const TEST_USER_PASSWORD = "Qofeno@Test2024!"
const TEST_USER_NAME = "Qofeno Test Account"

async function setup() {
  console.log("Setting up Qofeno test user...\n")

  let testUser
  try {
    const existing = await users.list([Query.equal("email", TEST_USER_EMAIL)])
    if (existing.users.length > 0) {
      testUser = existing.users[0]
      console.log(`✓ Test user already exists: ${testUser.$id}`)
    }
  } catch (err) {
    console.log("Error checking existing user:", err.message)
  }

  if (!testUser) {
    try {
      testUser = await users.create(
        ID.unique(),
        TEST_USER_EMAIL,
        `+100000000001`,
        TEST_USER_PASSWORD,
        TEST_USER_NAME
      )
      await users.updateEmailVerification(testUser.$id, true)
      console.log(`✓ Created test user: ${testUser.$id}`)
    } catch (err) {
      console.error("Failed to create test user:", err.message)
      throw err
    }
  }

  try {
    const existingMeta = await db.listDocuments("qofeno_db", "users_meta", [
      Query.equal("user_id", testUser.$id)
    ])

    if (existingMeta.total > 0) {
      await db.updateDocument("qofeno_db", "users_meta", existingMeta.documents[0].$id, {
        plan: "teams",
        plan_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      })
      console.log(`✓ Updated test user plan to: teams`)
    } else {
      await db.createDocument("qofeno_db", "users_meta", ID.unique(), {
        user_id: testUser.$id,
        plan: "teams",
        plan_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        tools_used: 0,
        files_processed: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      console.log(`✓ Created users_meta with teams plan`)
    }
  } catch (err) {
    console.warn("Notice: users_meta update:", err.message)
  }

  const envLine = [
    `TEST_USER_ID=${testUser.$id}`,
    `TEST_USER_EMAIL=${TEST_USER_EMAIL}`,
    `TEST_USER_PASSWORD=${TEST_USER_PASSWORD}`,
    `TEST_USER_PLAN=teams`
  ].join("\n")

  fs.writeFileSync(".env.test", envLine)
  console.log(`\n✓ Test credentials saved to .env.test`)

  console.log(`\n✅ Test user ready:`)
  console.log(`   ID:    ${testUser.$id}`)
  console.log(`   Email: ${TEST_USER_EMAIL}`)
  console.log(`   Plan:  teams (tests ALL 500+ tools)`)
}

setup().catch(console.error)
