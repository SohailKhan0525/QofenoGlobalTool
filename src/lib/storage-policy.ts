// src/lib/storage-policy.ts
// WHAT WE STORE WHERE — Enforced project-wide
import { ID, Query } from 'appwrite';
import { databases, DATABASE_ID } from './qofeno-appwrite';

/*
APPWRITE (server-side, secure):
  ✅ User session (Appwrite Auth — HTTP-only cookie)
  ✅ User plan (users_meta collection)
  ✅ Tool likes (tool_likes collection — for logged-in users)
  ✅ Tool history (tool_executions collection)
  ✅ Notifications (notifications collection)
  ✅ Preferences (account.updatePrefs() — stored in Appwrite)
  ✅ Subscriptions (subscriptions collection)
  ✅ Recently viewed (recently_viewed collection)

LOCALSTORAGE (only for non-sensitive, non-personal data):
  ✅ Cookie consent acknowledged (boolean — not personal data)
  ✅ Anonymous tool likes (slugs only — no PII, low risk)
  ✅ UI preferences (theme choice) — fallback if not logged in

NEVER IN LOCALSTORAGE:
  ❌ Session tokens
  ❌ API keys
  ❌ User email or name
  ❌ Plan information
  ❌ Payment information
  ❌ Any PII (personally identifiable information)
*/

export async function migrateLikesToAppwrite(userId: string): Promise<void> {
  if (!userId || typeof window === 'undefined') return;
  try {
    const localLikes = JSON.parse(localStorage.getItem('qofeno_likes') || '[]') as string[];
    if (!Array.isArray(localLikes) || localLikes.length === 0) return;

    for (const slug of localLikes) {
      if (!slug) continue;
      try {
        const existing = await databases.listDocuments(DATABASE_ID, 'tool_likes', [
          Query.equal('user_id', userId),
          Query.equal('tool_slug', slug),
        ]);
        if (existing.total === 0) {
          await databases.createDocument(DATABASE_ID, 'tool_likes', ID.unique(), {
            user_id: userId,
            tool_slug: slug,
            created_at: new Date().toISOString(),
          });
        }
      } catch {}
    }
    localStorage.removeItem('qofeno_likes');
  } catch (err) {
    console.warn('[StoragePolicy] Migration error:', err);
  }
}
