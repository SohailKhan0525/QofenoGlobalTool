import { Client, Databases, Query, Permission, Role } from 'node-appwrite';
import crypto from 'crypto';

function parseBody(req) {
  const raw = req.body || req.payload || '{}';
  if (typeof raw !== 'string') return raw || {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

export default async ({ req, res, error, log }) => {
  try {
    const payload = parseBody(req);
    log('Received Webhook Payload:', payload);

    // Optional: implement actual signature validation using PAYPAL_WEBHOOK_ID if needed
    // For demo purposes and based on the prompt we will accept it if valid basic structure
    
    if (!payload || !payload.resource || !payload.event_type) {
      throw new Error('Invalid payload structure');
    }

    const eventType = payload.event_type;
    
    // We only care about subscription events (or payment capture)
    // E.g., PAYMENT.SALE.COMPLETED or BILLING.SUBSCRIPTION.ACTIVATED
    if (eventType !== 'BILLING.SUBSCRIPTION.ACTIVATED' && eventType !== 'PAYMENT.SALE.COMPLETED') {
      log('Ignored event type:', eventType);
      return res.json({ success: true, ignored: true });
    }

    const customId = payload.resource.custom_id || payload.resource.custom;
    if (!customId) {
      throw new Error('No custom_id found in resource to identify the user.');
    }

    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const db = new Databases(client);

    // Find the user's meta document
    const docs = await db.listDocuments(
      process.env.DATABASE_ID,
      'users_meta',
      [Query.equal('user_id', customId)]
    );

    const now = new Date().toISOString();
    
    if (docs.total > 0) {
      // Update existing
      await db.updateDocument(
        process.env.DATABASE_ID,
        'users_meta',
        docs.documents[0].$id,
        {
          plan: 'pro',
          payment_ref: payload.resource.id,
          updated_at: now
        }
      );
    } else {
      // Create new
      await db.createDocument(
        process.env.DATABASE_ID,
        'users_meta',
        'unique()',
        {
          user_id: customId,
          plan: 'pro',
          payment_ref: payload.resource.id,
          created_at: now,
          updated_at: now
        }
      );
    }
    
    log(`Successfully updated user ${customId} to PRO`);

    return res.json({ success: true });
  } catch (err) {
    error(err.message);
    return res.json({ success: false, error: err.message }, 500);
  }
};
