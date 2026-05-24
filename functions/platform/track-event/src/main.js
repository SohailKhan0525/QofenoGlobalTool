import { Client, Databases, ID } from "node-appwrite"

export default async ({ req, res, log, error }) => {
  const raw = req.body || req.payload || '{}'
  const parsedInput = (typeof raw === 'string') ? JSON.parse(raw) : raw
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const db = new Databases(client)

  try {
    const { event_type, tool_slug, user_id } = parsedInput

    if (event_type === 'view') {
      // Upsert tool_views (simple implementation)
      const docs = await db.listDocuments(process.env.DATABASE_ID, 'tool_views', [ ])
      const existing = (docs.documents || []).find(d => d.tool_slug === tool_slug)
      if (existing) {
        await db.updateDocument(process.env.DATABASE_ID, 'tool_views', existing.$id, { count: (existing.count || 0) + 1 })
        return res.json({ success: true, count: existing.count + 1 })
      }
      const created = await db.createDocument(process.env.DATABASE_ID, 'tool_views', ID.unique(), { tool_slug, count: 1 })
      return res.json({ success: true, count: 1 })
    }

    if (event_type === 'like' || event_type === 'unlike') {
      if (!user_id) return res.json({ success: false, error: 'user_id required' }, 400)
      if (event_type === 'like') {
        await db.createDocument(process.env.DATABASE_ID, 'tool_likes', ID.unique(), { user_id, tool_slug, created_at: new Date().toISOString() })
        return res.json({ success: true, liked: true })
      } else {
        // naive delete: list then delete first matching
        const list = await db.listDocuments(process.env.DATABASE_ID, 'tool_likes', [])
        const toDel = (list.documents || []).find(d => d.user_id === user_id && d.tool_slug === tool_slug)
        if (toDel) { await db.deleteDocument(process.env.DATABASE_ID, 'tool_likes', toDel.$id) }
        return res.json({ success: true, liked: false })
      }
    }

    if (event_type === 'recent') {
      if (!user_id) return res.json({ success: false, error: 'user_id required' }, 400)
      // Upsert recently_viewed
      await db.createDocument(process.env.DATABASE_ID, 'recently_viewed', ID.unique(), { user_id, tool_slug, viewed_at: new Date().toISOString() })
      return res.json({ success: true })
    }

    return res.json({ success: false, error: 'unknown event' }, 400)
  } catch (err) {
    error(err.message)
    return res.json({ success: false, error: err.message }, 500)
  }
}
