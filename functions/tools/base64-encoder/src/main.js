export default async ({ req, res, log, error }) => {
  try {
    const raw = req.body || req.payload || '{}'
    const body = typeof raw === 'string' ? JSON.parse(raw) : raw
    const { text = '', action = 'encode' } = body

    if (typeof text !== 'string') {
      return res.json({ success: false, error: 'text must be a string' }, 400)
    }

    if (action === 'decode') {
      const result = Buffer.from(text, 'base64').toString('utf8')
      return res.json({ success: true, result })
    }

    const result = Buffer.from(text, 'utf8').toString('base64')
    return res.json({ success: true, result })
  } catch (err) {
    error(err.message)
    return res.json({ success: false, error: err.message }, 400)
  }
}
