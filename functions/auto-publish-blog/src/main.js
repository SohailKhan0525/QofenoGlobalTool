import { Client, Databases, Query, ID } from 'node-appwrite';

export default async ({ req, res, log, error }) => {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);
  const DATABASE_ID = process.env.DATABASE_ID || 'qofeno_db';
  
  log('Running auto-publish-blog CRON...');

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  try {
    const recentUpdates = await db.listDocuments(DATABASE_ID, "whats_new", [
      Query.equal("published", true),
      Query.greaterThan("created_at", fiveDaysAgo.toISOString()),
      Query.orderDesc("created_at")
    ]);

    log(`Found ${recentUpdates.total} recent updates in whats_new`);

    let createdCount = 0;
    for (const update of recentUpdates.documents) {
      const existing = await db.listDocuments(DATABASE_ID, "blog_posts", [
        Query.equal("source_id", update.$id)
      ]);
      
      if (existing.total > 0) {
        log(`Blog post for ${update.$id} already exists. Skipping.`);
        continue;
      }

      const slug = update.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const postBody = update.body || update.content || '';
      const excerpt = postBody.length > 160 ? postBody.substring(0, 160) + "..." : postBody;

      await db.createDocument(DATABASE_ID, "blog_posts", ID.unique(), {
        title: update.title,
        slug: `${slug}-${Date.now()}`,
        content: postBody,
        excerpt: excerpt,
        type: update.type === "new_tool" ? "new_tool" : "product_update",
        author: "Mohd Zaheer Uddin",
        published: true,
        published_at: new Date().toISOString(),
        source_id: update.$id,
        created_at: new Date().toISOString()
      });
      
      createdCount++;

      // Also notify all users about the new tool
      if (update.type === "new_tool") {
        const allUsers = await db.listDocuments(DATABASE_ID, "users_meta");
        for (const user of allUsers.documents) {
          await db.createDocument(DATABASE_ID, "notifications", ID.unique(), {
            user_id: user.user_id,
            title: `New tool: ${update.title}`,
            message: `${update.title} is now available — try it free.`,
            type: "info",
            read: false,
            link: `/tools`,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    log(`Successfully created ${createdCount} new blog posts.`);
    return res.json({ success: true, created: createdCount });

  } catch (err) {
    error(`Failed auto-publish-blog: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
