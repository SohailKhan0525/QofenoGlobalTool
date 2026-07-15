/**
 * whats-new-notifier — Triggers when a new whats_new update document is created.
 * Loops through registered users to create in-app notifications and ensures a blog post document exists.
 */
import { Client, Databases, ID, Query } from 'node-appwrite';

function parseBody(req) {
  if (req.bodyRaw && typeof req.bodyRaw === 'string') {
    try { return JSON.parse(req.bodyRaw); } catch { /* ignore */ }
  }
  if (req.body && typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch { /* ignore */ }
  }
  if (typeof req.body === 'object' && req.body !== null) {
    return req.body;
  }
  return {};
}

export default async ({ req, res, log, error }) => {
  const body = parseBody(req);
  log(`Payload: ${JSON.stringify(body)}`);

  const title = body.title;
  const updateBody = body.body || body.content || '';
  const updateType = body.type || 'improvement';
  const updateId = body.$id;

  if (!title || !updateId) {
    return res.json({ success: false, error: 'title and $id are required' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);
  const databaseId = process.env.DATABASE_ID || 'qofeno_db';
  const now = new Date().toISOString();

  try {
    // 1. Auto-create the corresponding blog post in blog_posts if not exists
    try {
      const existingBlog = await db.listDocuments(databaseId, 'blog_posts', [
        Query.equal('source_id', updateId),
        Query.limit(1)
      ]);

      if (existingBlog.total === 0) {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 80);
        const excerpt = updateBody.length > 160 ? updateBody.substring(0, 160) + '...' : updateBody;

        await db.createDocument(databaseId, 'blog_posts', ID.unique(), {
          title,
          slug: `${slug}-${Date.now()}`,
          content: updateBody,
          excerpt,
          type: updateType === 'new_tool' ? 'new_tool' : 'product_update',
          author: 'Mohd Zaheer Uddin',
          published: true,
          published_at: now,
          source_id: updateId,
          created_at: now,
          updated_at: now
        });
        log(`Auto-created blog post for whats_new update: ${updateId}`);
      } else {
        log(`Blog post for ${updateId} already exists.`);
      }
    } catch (blogErr) {
      log(`Failed to auto-create blog post (non-fatal): ${blogErr.message}`);
    }

    // 2. Fetch all users from users_meta to deliver in-app notifications
    let offset = 0;
    const limit = 50;
    const usersToNotify = [];

    while (true) {
      const metaDocs = await db.listDocuments(databaseId, 'users_meta', [
        Query.limit(limit),
        Query.offset(offset)
      ]);
      if (metaDocs.documents.length === 0) break;
      usersToNotify.push(...metaDocs.documents);
      offset += limit;
      if (metaDocs.documents.length < limit) break;
    }

    log(`Found ${usersToNotify.length} users to evaluate for whats_new notifications.`);

    // 3. Loop through users and create unique notifications
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const notificationTitle = `Update: ${title}`;

    for (const meta of usersToNotify) {
      const userId = meta.user_id;

      try {
        // A. Deduplicate: check if already notified about this exact title in last 30 days
        const existing = await db.listDocuments(databaseId, 'notifications', [
          Query.equal('user_id', userId),
          Query.equal('title', notificationTitle),
          Query.greaterThan('created_at', thirtyDaysAgo),
          Query.limit(1)
        ]);

        if (existing.total > 0) {
          log(`User ${userId} already notified about this update. Skipping.`);
          continue;
        }

        // B. Create notification
        await db.createDocument(databaseId, 'notifications', ID.unique(), {
          user_id: userId,
          title: notificationTitle,
          message: updateBody.length > 200 ? updateBody.substring(0, 200) + '...' : updateBody,
          type: 'info',
          read: false,
          link: '/whats-new',
          created_at: now
        });
        log(`Created notification for user: ${userId}`);
      } catch (userLoopErr) {
        error(`Failed delivering notification to user ${userId}: ${userLoopErr.message}`);
      }
    }

    return res.json({ success: true, count: usersToNotify.length });
  } catch (err) {
    error(`Failed whats-new-notifier execution: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
