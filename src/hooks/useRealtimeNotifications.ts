import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { realtime, DATABASE_ID } from '../lib/qofeno-appwrite';

export function useRealtimeNotifications(userId?: string | null, onNotificationReceived?: () => void) {
  const onNotificationReceivedRef = useRef(onNotificationReceived);
  useEffect(() => {
    onNotificationReceivedRef.current = onNotificationReceived;
  }, [onNotificationReceived]);

  useEffect(() => {
    if (!userId) return;

    const channel = `databases.${DATABASE_ID}.collections.notifications.documents`;
    let unsubscribe: (() => void) | null = null;

    try {
      const sub = realtime.subscribe(channel, (event: any) => {
        const isCreate = event?.events?.some((e: string) => e.endsWith('.create'));
        const doc = event?.payload;

        if (!doc) return;
        if (doc.user_id && doc.user_id !== userId && doc.user_id !== 'all') return;

        if (isCreate) {
          toast(doc.title || 'Notification', {
            description: doc.message || undefined,
            duration: 5000,
          });
        }

        if (onNotificationReceivedRef.current) {
          onNotificationReceivedRef.current();
        }
      });

      if (typeof sub === 'function') {
        unsubscribe = sub;
      } else if (sub && typeof (sub as any).close === 'function') {
        unsubscribe = () => (sub as any).close();
      }
    } catch (err) {
      console.warn('Realtime notifications subscription failed:', err);
    }

    return () => {
      if (unsubscribe) {
        try {
          unsubscribe();
        } catch {}
      }
    };
  }, [userId]);
}
