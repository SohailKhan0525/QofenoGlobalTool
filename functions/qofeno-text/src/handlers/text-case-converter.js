export default async ({ req, res, log, error }) => {
  try {
    const raw = req.body || req.payload || '{}'
    const body = (typeof raw === 'string') ? JSON.parse(raw) : raw
    const { text = '', target_case = 'lower' } = body
    if (typeof text !== 'string') return res.json({ success: false, error: 'text must be a string' }, 400)

    const transform = {
      lower: s => s.toLowerCase(),
      upper: s => s.toUpperCase(),
      title: s => s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.substr(1).toLowerCase()),
      camel: s => s.replace(/(?:^|\s)(\w)/g, (_, c, i) => i === 0 ? c.toLowerCase() : c.toUpperCase()).replace(/\s+/g, ''),
      snake: s => s.replace(/\s+/g, '_').toLowerCase(),
      kebab: s => s.replace(/\s+/g, '-').toLowerCase(),
      pascal: s => s.replace(/(?:^|\s)(\w)/g, (_, c) => c.toUpperCase()).replace(/\s+/g, '')
    }

    const fn = transform[target_case] || transform.lower
    return res.json({ success: true, result: fn(text) })
  } catch (err) {
    error(err.message)
    return res.json({ success: false, error: err.message }, 500)
  }
}
