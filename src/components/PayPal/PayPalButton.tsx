import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useAuth } from '../../context/AuthContext';
import { databases } from '../../lib/qofeno-appwrite';
import { toast } from 'sonner';

const PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || '';
const PLAN_ID_MONTHLY = import.meta.env.VITE_PAYPAL_PLAN_ID_MONTHLY || '';
const PLAN_ID_YEARLY = import.meta.env.VITE_PAYPAL_PLAN_ID_YEARLY || '';
const DATABASE_ID = import.meta.env.VITE_APPWRITE_DATABASE_ID || 'qofeno_db';

type PayPalButtonProps = {
  isYearly?: boolean;
};


export function PayPalButton({ isYearly = false }: PayPalButtonProps) {
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);
  const [processing, setProcessing] = useState(false);

  const planId = isYearly ? PLAN_ID_YEARLY : PLAN_ID_MONTHLY;

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
          Your PRO account is now active. Welcome to Qofeno PRO!
        </p>
        <button
          onClick={() => { window.history.pushState({}, '', '/dashboard'); window.dispatchEvent(new PopStateEvent('popstate')); }}
          className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors"
        >
          Go to Dashboard →
        </button>
      </div>
    );
  }

  if (!PAYPAL_CLIENT_ID) {
    return (
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm text-center">
        PayPal is being configured. Please check back soon.
      </div>
    );
  }

  if (!planId) {
    return (
      <div className="space-y-3">
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm text-center">
          <strong>PayPal Subscription Plan not configured.</strong>
          <p className="mt-1 text-xs">The administrator needs to add a PayPal Plan ID to enable payments.</p>
        </div>
        <p className="text-xs text-center text-neutral-400">
          To enable payments: Create a subscription plan in PayPal Dashboard and add the Plan ID to <code>VITE_PAYPAL_PLAN_ID_MONTHLY</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {processing && (
        <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm text-center flex items-center justify-center gap-2">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          Processing your subscription...
        </div>
      )}
      <PayPalScriptProvider options={{
        'client-id': PAYPAL_CLIENT_ID,
        currency: 'USD',
        vault: true,
        intent: 'subscription',
      }}>
        <PayPalButtons
          style={{ layout: 'vertical', shape: 'rect', color: 'blue', label: 'subscribe' }}
          disabled={processing}
          createSubscription={(_data, actions) => {
            if (!user) {
              toast.error('Please log in first to subscribe.');
              throw new Error('User not logged in');
            }
            return actions.subscription.create({
              plan_id: planId,
              custom_id: user.id, // Used by PayPal webhook to identify the user
              subscriber: {
                name: { given_name: user.name?.split(' ')[0] || '', surname: user.name?.split(' ').slice(1).join(' ') || '' },
                email_address: user.email,
              },
            });
          }}
          onApprove={async (data) => {
            setProcessing(true);
            try {
              // Optimistically update user's plan in DB while webhook processes
              if (user) {
                try {
                  const docs = await databases.listDocuments(DATABASE_ID, 'users_meta');
                  const userMeta = docs.documents.find((d: any) => d.user_id === user.id);
                  if (userMeta) {
                    await databases.updateDocument(DATABASE_ID, 'users_meta', userMeta.$id, {
                      plan: 'pro',
                      payment_ref: data.subscriptionID || data.orderID,
                      updated_at: new Date().toISOString(),
                    });
                  }
                } catch (_) {
                  // PayPal webhook will handle this as backup
                }
              }
              toast.success('🎉 Subscription activated! Welcome to Qofeno PRO!');
              setSuccess(true);
            } catch (err) {
              toast.error('Payment was received but profile update failed. Please contact support.');
            } finally {
              setProcessing(false);
            }
          }}
          onError={(err) => {
            toast.error('PayPal payment failed. Please try again or contact support.');
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
