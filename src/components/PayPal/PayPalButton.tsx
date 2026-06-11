import React, { useState } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';

export function PayPalButton() {
  const { user } = useAuth();
  const [success, setSuccess] = useState(false);

  if (success) {
    return (
      <div className="p-6 bg-green-50 text-green-800 rounded-2xl border border-green-200 text-center">
        <h3 className="text-xl font-black mb-2">Payment Successful! 🎉</h3>
        <p className="text-sm font-medium">Your PRO account is now active. You can now access all premium tools and features.</p>
      </div>
    );
  }

  // Use test plan id for demo, or a real one if available
  const planId = import.meta.env.VITE_PAYPAL_PLAN_ID || 'P-3RX065706M3469222L5IFM4I'; 

  return (
    <div className="w-full max-w-md mx-auto relative z-10">
      <PayPalScriptProvider options={{ 
        "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "test", 
        currency: "USD", 
        vault: true, 
        intent: "subscription" 
      }}>
        <PayPalButtons
          style={{ layout: "vertical", shape: "rect", color: "blue", label: "subscribe" }}
          createSubscription={(data, actions) => {
            return actions.subscription.create({
              plan_id: planId,
              custom_id: user?.id || 'anonymous' // To map the webhook to the user
            });
          }}
          onApprove={async (data, actions) => {
            toast.success("Subscription completed successfully! Refresh the page to see your PRO status.");
            setSuccess(true);
          }}
          onError={(err) => {
            toast.error("An error occurred with PayPal processing.");
            console.error('PayPal Error:', err);
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
