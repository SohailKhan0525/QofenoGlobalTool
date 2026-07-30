export default async ({ req, res, log, error }) => {
  try {
    const raw = req.body || req.payload || '{}';
    const body = (typeof raw === 'string') ? JSON.parse(raw) : raw;
    const jsonInput = body.json || body.input_text || body.input || '';

    if (!jsonInput) {
      return res.json({ success: false, error: 'JSON input string is required' }, 400);
    }

    const parsed = (typeof jsonInput === 'object') ? jsonInput : JSON.parse(String(jsonInput));
    const action = body.action || 'format';

    if (action === 'minify') {
      return res.json({ success: true, result: JSON.stringify(parsed) });
    }

    return res.json({ success: true, result: JSON.stringify(parsed, null, 2) });
  } catch (err) {
    if (error) error(err.message);
    return res.json({ success: false, error: err.message }, 400);
  }
};
