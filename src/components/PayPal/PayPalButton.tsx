import React, { useEffect, useRef, useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../context/AuthContext';
import { databases, DATABASE_ID } from '../../lib/qofeno-appwrite';
import { ID, Query } from 'appwrite';
import { toast } from 'sonner';

const PAYPAL_CLIENT_ID    = import.meta.env.VITE_PAYPAL_CLIENT_ID    || '';
const PLAN_ID_MONTHLY     = import.meta.env.VITE_PAYPAL_PLAN_ID_MONTHLY || '';
const PLAN_ID_YEARLY      = import.meta.env.VITE_PAYPAL_PLAN_ID_YEARLY  || '';
const TEAMS_PLAN_ID_MONTHLY = import.meta.env.VITE_PAYPAL_TEAMS_PLAN_ID_MONTHLY || '';
const TEAMS_PLAN_ID_YEARLY  = import.meta.env.VITE_PAYPAL_TEAMS_PLAN_ID_YEARLY  || '';
const PAYPAL_MODE         = import.meta.env.VITE_PAYPAL_MODE           || 'live';

type PayPalButtonProps = {
  isYearly?: boolean;
  planType?: 'pro' | 'teams';
};

export function PayPalButton({ isYearly = false, planType = 'pro' }: PayPalButtonProps) {
  const { user, isLoading, refreshSession } = useAuth();
  const [success, setSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);
  // Track whether we've already attempted a one-time re-verify so we don't loop.
  const retried = useRef(false);

  // If the component mounts with no user and no in-progress load, it means
  // we arrived here right after a redirect (OAuth or email login) but the
  // AuthContext's initial account.get() already finished and returned null.
  // Do one silent re-verify to catch this race condition.
  useEffect(() => {
    if (!isLoading && !user && !retried.current) {
      retried.current = true;
      void refreshSession();
    }
  }, [isLoading, user, refreshSession]);

  const planId = planType === 'teams'
    ? (isYearly ? (TEAMS_PLAN_ID_YEARLY || PLAN_ID_YEARLY) : (TEAMS_PLAN_ID_MONTHLY || PLAN_ID_MONTHLY))
    : (isYearly ? PLAN_ID_YEARLY : PLAN_ID_MONTHLY);

  // ── Success state ────────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="p-6 bg-green-50 text-green-800 rounded-2xl border border-green-200 text-center">
        <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-black mb-2">Payment Successful! 🎉</h3>
        <p className="text-sm font-medium mb-4">
          Your {planType.toUpperCase()} account is now active. Welcome to Qofeno {planType.toUpperCase()}!
        </p>
        <button
          onClick={() => {
            window.history.pushState({}, '', '/profile');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
        >
          Go to Profile →
        </button>
      </div>
    );
  }

  // ── Auth loading guard — show spinner while session is being verified ────────
  // This prevents the login gate from flashing right after OAuth redirect.
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-3 py-6 text-neutral-500">
        <FontAwesomeIcon icon={faSpinner} className="h-5 w-5 animate-spin text-purple-500" />
        <span className="text-sm font-semibold">Verifying your session…</span>
      </div>
    );
  }

  // ── Unauthenticated Guard — only shown once isLoading is false ────────────────
  if (!user) {
    return (
      <div className="w-full text-center space-y-3">
        <button
          onClick={() => {
            const currentPlan = planType || 'pro';
            window.history.pushState({}, '', `/login?redirect=/checkout/pro?plan=${currentPlan}`);
            window.dispatchEvent(new PopStateEvent('popstate'));
          }}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-2xl font-black text-sm hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-600/20"
        >
          <span>Sign In to Subscribe to {planType.toUpperCase()} →</span>
        </button>
        <p className="text-xs text-neutral-400 font-medium">Please sign in first so your subscription links directly to your Qofeno profile.</p>
      </div>
    );
  }

  // ── Not configured guards ────────────────────────────────────────────────────
  if (!PAYPAL_CLIENT_ID) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm text-center font-bold">
        PayPal is currently being configured. Please check back shortly.
      </div>
    );
  }

  if (!planId) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm text-center">
          <strong>PayPal Subscription Plan not configured.</strong>
          <p className="mt-1 text-xs font-medium">
            The administrator needs to create a PayPal Subscription Plan and add the Plan ID to the environment.
          </p>
          <p className="mt-2 text-xs font-mono bg-amber-100 px-2 py-1 rounded">
            VITE_PAYPAL_PLAN_ID_{isYearly ? 'YEARLY' : 'MONTHLY'}
          </p>
        </div>
      </div>
    );
  }

  // ── Main PayPal button ────────────────────────────────────────────────────────
  return (
    <div className="w-full" key={`${planType}-${isYearly ? 'yearly' : 'monthly'}`}>
      {processing && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm text-center flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Activating your {planType.toUpperCase()} subscription…
        </div>
      )}

      <PayPalScriptProvider options={{
        'client-id': PAYPAL_CLIENT_ID,
        clientId: PAYPAL_CLIENT_ID,
        currency: 'USD',
        vault: true,
        intent: 'subscription',
      }}>
        <PayPalButtons
          style={{ layout: 'vertical', shape: 'rect', color: 'blue', label: 'subscribe' }}
          disabled={processing}
          createSubscription={(_data, actions) => {
            const givenName = user.name?.trim() ? user.name.trim().split(' ')[0] : 'Subscriber';
            const surname = user.name?.trim() && user.name.trim().split(' ').length > 1 
              ? user.name.trim().split(' ').slice(1).join(' ') 
              : 'Qofeno';

            return actions.subscription.create({
              plan_id: planId,
              custom_id: user.id, // Used by PayPal webhook to identify the user
              subscriber: {
                name: {
                  given_name: givenName,
                  surname: surname,
                },
                email_address: user.email,
              },
            });
          }}
          onApprove={async (data) => {
            setProcessing(true);
            try {
              const now = new Date().toISOString();

              if (user) {
                // 1. Update users_meta.plan = planType (create if missing)
                try {
                  const docs = await databases.listDocuments(DATABASE_ID, 'users_meta', [
                    Query.equal('user_id', user.id)
                  ]);
                  const userMeta = docs.documents[0];
                  if (userMeta) {
                    await databases.updateDocument(DATABASE_ID, 'users_meta', userMeta.$id, {
                      plan: planType,
                      payment_ref: data.subscriptionID || data.orderID || null,
                      updated_at: now,
                    });
                  } else {
                    await databases.createDocument(DATABASE_ID, 'users_meta', ID.unique(), {
                      user_id: user.id,
                      email: user.email,
                      name: user.name || 'Subscriber',
                      plan: planType,
                      payment_ref: data.subscriptionID || data.orderID || null,
                      created_at: now,
                      updated_at: now,
                    });
                  }
                } catch (_) {
                  // Webhook backup handles this
                }

                // 2. Create / update subscriptions record
                try {
                  const existingSubs = await databases.listDocuments(DATABASE_ID, 'subscriptions', [
                    Query.equal('user_id', user.id)
                  ]);
                  const existing = existingSubs.documents[0];
                  const subPayload = {
                    user_id: user.id,
                    plan: planType,
                    period: isYearly ? 'yearly' : 'monthly',
                    status: 'active',
                    subscription_id: data.subscriptionID || null,
                    payment_method: 'paypal',
                    updated_at: now,
                  };

                  if (existing) {
                    await databases.updateDocument(DATABASE_ID, 'subscriptions', existing.$id, subPayload);
                  } else {
                    await databases.createDocument(DATABASE_ID, 'subscriptions', ID.unique(), {
                      ...subPayload,
                      created_at: now,
                    });
                  }
                } catch (_) {
                  // Non-fatal
                }
              }

              toast.success(`🎉 Subscription activated! Welcome to Qofeno ${planType.toUpperCase()}!`);
              setSuccess(true);
            } catch (err) {
              toast.error('Payment received but profile update failed. Contact support if your plan doesn\'t reflect PRO.');
            } finally {
              setProcessing(false);
            }
          }}
          onError={(err) => {
            const errStr = String(err?.message || err || '');
            if (errStr.includes('cancel')) return;
            toast.error('PayPal checkout error. Please check your card or try again.');
            console.error('PayPal Error:', err);
          }}
          onCancel={() => {
            toast.info('Payment cancelled. You can try again anytime.');
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
