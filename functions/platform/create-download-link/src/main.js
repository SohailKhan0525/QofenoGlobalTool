import { Client, Databases, Query } from 'node-appwrite';

function parseBody(req) {
  const raw = req.body || req.payload || '{}';
  if (typeof raw !== 'string') return raw || {};
  try { return JSON.parse(raw); } catch { return {}; }
}

export default async ({ req, res, error }) => {
  const body = parseBody(req);
  const executionId = body.execution_id || body.executionId;
  const userId = body.user_id || body.userId;

  if (!executionId) {
    return res.json({ success: false, error: 'execution_id required' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);

  try {
    const existing = await db.listDocuments(process.env.DATABASE_ID, 'tool_executions', [Query.equal('$id', executionId), Query.limit(1)]);
    const execution = existing.documents?.[0];

    if (!execution) {
      return res.json({ success: false, error: 'Execution not found' }, 404);
    }

    if (userId && execution.user_id && execution.user_id !== userId) {
      return res.json({ success: false, error: 'Not authorized' }, 403);
    }

    return res.json({
      success: false,
      message: 'File no longer available — please re-upload',
      execution_id: executionId
    });
  } catch (err) {
    error(err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
}