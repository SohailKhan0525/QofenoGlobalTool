import { Client, Databases, ID, Query } from 'node-appwrite';

function parseBody(req) {
  const raw = req.body || req.payload || '{}';
  if (typeof raw !== 'string') return raw || {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export default async ({ req, res, error }) => {
  const body = parseBody(req);
  const userId = body.user_id || body.userId || body.$id || body.event?.$id || body.user?.$id || body?.payload?.$id;

  if (!userId) {
    return res.json({ success: false, error: 'user_id required' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);
  const databaseId = process.env.DATABASE_ID;
  const now = new Date().toISOString();

  try {
    const existing = await db.listDocuments(databaseId, 'users_meta', [Query.equal('user_id', userId), Query.limit(1)]);
    if ((existing.documents || []).length > 0) {
      const doc = existing.documents[0];
      await db.updateDocument(databaseId, 'users_meta', doc.$id, { updated_at: now });
      return res.json({ success: true, user_id: userId, created: false });
    }

    await db.createDocument(databaseId, 'users_meta', ID.unique(), {
      user_id: userId,
      plan: 'free',
      plan_expires_at: null,
      payment_ref: null,
      tools_used: 0,
      files_processed: 0,
      storage_used: 0,
      created_at: now,
      updated_at: now
    });

    return res.json({ success: true, user_id: userId, created: true });
  } catch (err) {
    error(err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
}