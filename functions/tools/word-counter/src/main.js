export default async ({ req, res, log, error }) => {
  try {
    const raw = req.body || req.payload || '{}'
    const body = (typeof raw === 'string') ? JSON.parse(raw) : raw
    const { text = '' } = body
    if (typeof text !== 'string') return res.json({ success: false, error: 'text must be a string' }, 400)

    const words = (text.trim().length === 0) ? 0 : text.trim().split(/\s+/).length
    const characters = text.length
    const sentences = (text.match(/[.!?]+/g) || []).length
    const paragraphs = (text.split(/

+/).filter(p => p.trim().length > 0)).length
    const reading_time_minutes = Math.max(1, Math.round(words / 200))

    return res.json({ success: true, words, characters, sentences, paragraphs, reading_time_minutes })
  } catch (err) {
    error(err.message)
    return res.json({ success: false, error: err.message }, 500)
  }
}
