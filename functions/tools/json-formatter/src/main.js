export default async ({ req, res, log, error }) => {
  try {
    const raw = req.body || req.payload || '{}'
    const body = (typeof raw === 'string') ? JSON.parse(raw) : raw
    const { json = '', action = 'format' } = body
    if (typeof json !== 'string') return res.json({ success: false, error: 'json must be string' }, 400)

    if (action === 'minify') {
      const parsed = JSON.parse(json)
      return res.json({ success: true, result: JSON.stringify(parsed) })
    }

    // default: format
    const parsed = JSON.parse(json)
    return res.json({ success: true, result: JSON.stringify(parsed, null, 2) })
  } catch (err) {
    error(err.message)
    return res.json({ success: false, error: err.message }, 400)
  }
}
