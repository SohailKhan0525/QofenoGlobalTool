import { Client, Databases, ID, Query } from "node-appwrite"

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
      // Upsert tool_views by tool_slug and increment view count.
      const docs = await db.listDocuments(process.env.DATABASE_ID, 'tool_views', [
        Query.equal('tool_slug', tool_slug),
        Query.limit(1)
      ])
      const existing = (docs.documents || [])[0]
      if (existing) {
        const nextCount = Number(existing.count || 0) + 1
        const nextLikes = Number(existing.likes || 0)
        await db.updateDocument(process.env.DATABASE_ID, 'tool_views', existing.$id, {
          count: nextCount,
          likes: nextLikes,
        })
        return res.json({ success: true, count: nextCount, likes: nextLikes })
      }

      await db.createDocument(process.env.DATABASE_ID, 'tool_views', ID.unique(), {
        tool_slug,
        count: 1,
        likes: 0,
      })
      return res.json({ success: true, count: 1, likes: 0 })
    }

    if (event_type === 'like' || event_type === 'unlike') {
      const views = await db.listDocuments(process.env.DATABASE_ID, 'tool_views', [
        Query.equal('tool_slug', tool_slug),
        Query.limit(1)
      ])
      const existing = (views.documents || [])[0]

      let currentCount = Number(existing?.count || 0)
      let currentLikes = Number(existing?.likes || 0)

      if (event_type === 'like') {
        currentLikes += 1
      } else {
        currentLikes = Math.max(0, currentLikes - 1)
      }

      if (existing) {
        await db.updateDocument(process.env.DATABASE_ID, 'tool_views', existing.$id, {
          count: currentCount,
          likes: currentLikes,
        })
      } else {
        await db.createDocument(process.env.DATABASE_ID, 'tool_views', ID.unique(), {
          tool_slug,
          count: currentCount,
          likes: currentLikes,
        })
      }

      // Keep user-specific likes only when a logged-in user id is available.
      if (user_id) {
        if (event_type === 'like') {
          const list = await db.listDocuments(process.env.DATABASE_ID, 'tool_likes', [
            Query.equal('user_id', user_id),
            Query.equal('tool_slug', tool_slug),
            Query.limit(1)
          ])
          if (!list.total) {
            await db.createDocument(process.env.DATABASE_ID, 'tool_likes', ID.unique(), {
              user_id,
              tool_slug,
              created_at: new Date().toISOString(),
            })
          }
        } else {
          const list = await db.listDocuments(process.env.DATABASE_ID, 'tool_likes', [
            Query.equal('user_id', user_id),
            Query.equal('tool_slug', tool_slug),
            Query.limit(10)
          ])
          for (const doc of (list.documents || [])) {
            await db.deleteDocument(process.env.DATABASE_ID, 'tool_likes', doc.$id)
          }
        }
      }

      return res.json({ success: true, liked: event_type === 'like', likes: currentLikes })
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
