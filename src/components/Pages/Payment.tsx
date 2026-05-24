import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CreditCard, Lock, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { SEO } from '../../components/SEO';

export function Payment({ onNavigate }: { onNavigate: (page: string) => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Form states
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [name, setName] = useState('');

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleCardChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardNumber(formatCardNumber(e.target.value));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      v = v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    setExpiryDate(v);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      localStorage.setItem('isLoggedIn', 'true');
      
      // Auto redirect to home after success
      setTimeout(() => {
        onNavigate('home');
      }, 2000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F3FF] flex flex-col items-center justify-center pt-[100px] pb-6 px-6 relative overflow-hidden select-none">
      <SEO title="Payment" description="Complete your payment securely." />
      
      {/* Background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-300/20 blur-[120px]" />
        <div className="absolute top-[60%] -right-[10%] w-[60%] h-[60%] rounded-full bg-purple-400/10 blur-[120px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-lg bg-white rounded-3xl md:rounded-[32px] p-8 md:p-10 shadow-2xl shadow-purple-900/5 relative z-10 border border-white/50"
      >
        <AnimatePresence mode="wait">
          {!isSuccess ? (
            <motion.div
              key="payment-form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-50 rounded-full mb-4">
                  <CreditCard className="w-8 h-8 text-purple-600" />
                </div>
                <h1 className="font-black text-2xl md:text-3xl text-[#0F0A1E] mb-2 tracking-tight">Complete your upgrade</h1>
                <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                  You are upgrading to <span className="font-bold text-purple-600">Qofeno Pro</span> at $9/mo. Cancel anytime.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Cardholder Name</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-neutral-50 border border-neutral-200 focus:border-purple-600 focus:bg-white pl-4 pr-4 py-3.5 rounded-xl outline-none transition-all text-neutral-800 text-sm font-medium"
                    placeholder="John Doe"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Card Number</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      maxLength={19}
                      value={cardNumber}
                      onChange={handleCardChange}
                      className="w-full bg-neutral-50 border border-neutral-200 focus:border-purple-600 focus:bg-white pl-11 pr-4 py-3.5 rounded-xl outline-none transition-all text-neutral-800 text-sm font-medium font-mono"
                      placeholder="0000 0000 0000 0000"
                    />
                    <CreditCard className="w-5 h-5 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider ml-1">Expiry Date</label>
                    <input 
                      type="text" 
                      required
                      maxLength={5}
                      value={expiryDate}
                      onChange={handleExpiryChange}
                      className="w-full bg-neutral-50 border border-neutral-200 focus:border-purple-600 focus:bg-white px-4 py-3.5 rounded-xl outline-none transition-all text-neutral-800 text-sm font-medium font-mono"
                      placeholder="MM/YY"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider ml-1">CVV</label>
                    <input 
                      type="text" 
                      required
                      maxLength={4}
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value.replace(/[^0-9]/g, ''))}
                      className="w-full bg-neutral-50 border border-neutral-200 focus:border-purple-600 focus:bg-white px-4 py-3.5 rounded-xl outline-none transition-all text-neutral-800 text-sm font-medium font-mono"
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-xl p-4 flex items-start gap-3 border border-neutral-100">
                  <Lock className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-neutral-500 font-medium leading-relaxed">
                    Payments are secure and encrypted. Qofeno does not store your credit card information.
                  </p>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading || cardNumber.length < 19 || expiryDate.length < 5 || cvv.length < 3 || name.length < 2}
                  className="w-full mt-2 py-4 bg-gradient-to-br from-[#0F0A1E] to-[#1E143C] hover:opacity-90 text-white font-bold rounded-xl shadow-xl shadow-neutral-900/10 transition-all flex items-center justify-center cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    "Pay $9.00"
                  )}
                </button>
                
                <div className="pt-6 mt-6 border-t border-neutral-100 space-y-3">
                  <p className="text-xs font-bold text-center text-neutral-400 uppercase tracking-widest mb-3">Other Ways to Pay</p>
                  <button type="button" disabled className="w-full py-3.5 bg-[#FFC439]/50 text-[#003087]/50 font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                    <span className="italic font-black decoration-solid">PayPal</span> (Coming Soon)
                  </button>
                  <button type="button" disabled className="w-full py-3.5 bg-black/50 text-white font-bold rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
                    <span className="font-semibold">Apple Pay</span> (Coming Soon)
                  </button>
                </div>
                
                <button
                  type="button"
                  onClick={() => onNavigate('pricing')}
                  className="w-full pt-4 pb-2 text-neutral-500 font-bold hover:text-[#0F0A1E] transition-colors text-sm cursor-pointer"
                >
                  Cancel Upgrade
                </button>
              </form>
            </motion.div>
          ) : (
            <motion.div
              key="success-message"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-10"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle2 className="w-12 h-12 text-green-500" />
              </motion.div>
              <h2 className="font-black text-2xl text-[#0F0A1E] mb-2">Payment Successful!</h2>
              <p className="text-neutral-500 mb-8">Your account has been upgraded to Pro.</p>
              
              <div className="w-6 h-6 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-neutral-400 mt-4 uppercase tracking-widest">Redirecting to home</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
