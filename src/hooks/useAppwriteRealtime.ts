import { useEffect, useState } from 'react';
import { Query } from 'appwrite';
import { realtime, databases, DATABASE_ID } from '../lib/qofeno-appwrite';

export function useRealtimeCollection<T>(
  databaseId: string,
  collectionId: string,
  queries: string[],
  onUpdate: (docs: T[]) => void
): () => void {
  const channel = `databases.${databaseId}.collections.${collectionId}.documents`;

  const unsubscribe = realtime.subscribe(channel, () => {
    databases.listDocuments(databaseId, collectionId, queries)
      .then(r => onUpdate(r.documents as T[]))
      .catch(console.error);
  });

  return unsubscribe as any;
}

export function useRealtimeDocument<T>(
  databaseId: string,
  collectionId: string,
  documentId: string,
  onUpdate: (doc: T) => void
): () => void {
  const channel = `databases.${databaseId}.collections.${collectionId}.documents.${documentId}`;

  const unsubscribe = realtime.subscribe(channel, (response) => {
    onUpdate(response.payload as T);
  });

  return unsubscribe as any;
}

export function useRealtimeToolStats(toolSlug: string) {
  const [stats, setStats] = useState({ views: 0, likes: 0 });

  useEffect(() => {
    if (!toolSlug) return;
    databases.listDocuments(DATABASE_ID, 'tool_views', [
      Query.equal('tool_slug', toolSlug),
      Query.limit(1),
    ]).then(r => {
      if (r.total > 0) {
        setStats({
          views: Number(r.documents[0].count || 0),
          likes: Number(r.documents[0].likes || 0),
        });
      }
    }).catch(() => {});

    const unsubscribe = realtime.subscribe(
      `databases.${DATABASE_ID}.collections.tool_views.documents`,
      (response: any) => {
        if (response.payload && response.payload.tool_slug === toolSlug) {
          setStats({
            views: Number(response.payload.count || 0),
            likes: Number(response.payload.likes || 0),
          });
        }
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') (unsubscribe as any)();
    };
  }, [toolSlug]);

  return stats;
}

export function useRealtimeNotifications(userId: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!userId) return;

    databases.listDocuments(DATABASE_ID, 'notifications', [
      Query.equal('user_id', userId),
      Query.orderDesc('created_at'),
      Query.limit(20),
    ]).then(r => {
      setNotifications(r.documents);
      setUnread(r.documents.filter((n: any) => !n.read).length);
    }).catch(() => {});

    const unsubscribe = realtime.subscribe(
      `databases.${DATABASE_ID}.collections.notifications.documents`,
      (response: any) => {
        if (response.payload && response.payload.user_id !== userId) return;
        if (response.events.some((e: string) => e.includes('.create'))) {
          setNotifications(prev => [response.payload, ...prev]);
          setUnread(prev => prev + 1);
        }
        if (response.events.some((e: string) => e.includes('.update'))) {
          setNotifications(prev =>
            prev.map(n => n.$id === response.payload.$id ? response.payload : n)
          );
          setUnread(prev => response.payload.read ? Math.max(0, prev - 1) : prev);
        }
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') (unsubscribe as any)();
    };
  }, [userId]);

  return { notifications, unread };
}

export function useRealtimePlan(userId: string) {
  const [plan, setPlan] = useState('free');

  useEffect(() => {
    if (!userId) return;

    databases.listDocuments(DATABASE_ID, 'users_meta', [
      Query.equal('user_id', userId),
      Query.limit(1),
    ]).then(r => {
      if (r.total > 0) setPlan(r.documents[0].plan || 'free');
    }).catch(() => {});

    const unsubscribe = realtime.subscribe(
      `databases.${DATABASE_ID}.collections.users_meta.documents`,
      (response: any) => {
        if (response.payload && response.payload.user_id === userId) {
          setPlan(response.payload.plan || 'free');
        }
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') (unsubscribe as any)();
    };
  }, [userId]);

  return plan;
}

export function useRealtimeExecution(executionId: string | null, onDone: (result: any) => void) {
  useEffect(() => {
    if (!executionId) return;

    const unsubscribe = realtime.subscribe(
      `databases.${DATABASE_ID}.collections.tool_executions.documents.${executionId}`,
      (response: any) => {
        const doc = response.payload;
        if (doc && doc.status === 'completed') {
          onDone({ success: true, ...doc });
        }
        if (doc && doc.status === 'failed') {
          onDone({ success: false, error: doc.error_message });
        }
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') (unsubscribe as any)();
    };
  }, [executionId, onDone]);
}

export function useRealtimeWhatsNew() {
  const [entries, setEntries] = useState<any[]>([]);

  useEffect(() => {
    databases.listDocuments(DATABASE_ID, 'whats_new', [
      Query.equal('published', true),
      Query.orderDesc('created_at'),
      Query.limit(50),
    ]).then(r => setEntries(r.documents)).catch(() => {});

    const unsubscribe = realtime.subscribe(
      `databases.${DATABASE_ID}.collections.whats_new.documents`,
      (response: any) => {
        if (response.payload && response.payload.published) {
          setEntries(prev => {
            const exists = prev.find(e => e.$id === response.payload.$id);
            if (exists) return prev.map(e => e.$id === response.payload.$id ? response.payload : e);
            return [response.payload, ...prev];
          });
        }
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') (unsubscribe as any)();
    };
  }, []);

  return entries;
}
