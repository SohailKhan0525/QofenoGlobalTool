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
  const fileId = body.file_id || body.fileId;
  const bucketId = body.bucket_id || body.bucketId || process.env.BUCKET_OUTPUTS;

  if (!executionId && !fileId) {
    return res.json({ success: false, error: 'execution_id or file_id required' }, 400);
  }

  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const db = new Databases(client);

  try {
    // If caller provided a file_id directly, construct a download URL and return it.
    if (fileId) {
      const endpoint = process.env.APPWRITE_ENDPOINT.replace(/\/$/, '');
      const downloadUrl = `${endpoint}/storage/buckets/${bucketId}/files/${fileId}/download?project=${process.env.APPWRITE_PROJECT_ID}`;
      const expiresAt = Date.now() + (30 * 60 * 1000);
      return res.json({ success: true, download_url: downloadUrl, expires_at: new Date(expiresAt).toISOString(), file_id: fileId, bucket_id: bucketId });
    }

    const existing = await db.listDocuments(process.env.DATABASE_ID, 'tool_executions', [Query.equal('$id', executionId), Query.limit(1)]);
    const execution = existing.documents?.[0];

    if (!execution) {
      return res.json({ success: false, error: 'Execution not found' }, 404);
    }

    if (userId && execution.user_id && execution.user_id !== userId) {
      return res.json({ success: false, error: 'Not authorized' }, 403);
    }

    // If the execution already recorded a download_url, return it with a short expiry.
    if (execution.download_url) {
      const expiresAt = Date.now() + (30 * 60 * 1000); // 30 minutes
      return res.json({
        success: true,
        download_url: execution.download_url,
        expires_at: new Date(expiresAt).toISOString(),
        execution_id: executionId,
      });
    }

    // Fallthrough: no file recorded for this execution
    return res.json({
      success: false,
      message: 'File no longer available — please re-upload',
      execution_id: executionId,
    });
  } catch (err) {
    error(err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
}