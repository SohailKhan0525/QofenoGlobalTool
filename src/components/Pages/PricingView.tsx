import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCircleQuestion, faChevronDown, faWandMagicSparkles, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useRef, useMemo } from 'react';
import gsap from 'gsap';

import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const FAQ_ITEMS = [
  { q: "Is Qofeno free?", a: "Yes, we provide essential tools completely free of charge. We also have a Pro plan for heavy users requiring advanced options and priority processing." },
  { q: "Is my data secure?", a: "Absolutely. Most of our tools process your data locally right in your browser. For tools that require server processing, data is fully encrypted and deleted instantly." },
  { q: "Do I need an account to use the tools?", a: "No. You can start using our free tools immediately without any registration." },
  { q: "What are the limitations of the free plan?", a: "The free plan limits file sizes to 50MB and runs occasionally with standard processing priority. Pro gives you 500MB and top priority." },
  { q: "How can I cancel my Pro subscription?", a: "You can cancel your Pro subscription easily from your account dashboard at any time. No questions asked." }
];

const PLAN_FEATURES = [
  { name: "Access to free tools", free: true, pro: true, enterprise: true },
  { name: "Server-side processing", free: true, pro: true, enterprise: true },
  { name: "No login required", free: true, pro: true, enterprise: true },
  { name: "Files deleted after processing", free: true, pro: true, enterprise: true },
  { name: "Maximum Upload Limit", free: "50 MB", pro: "500 MB", enterprise: "Unlimited" },
  { name: "All tools unlocked", free: false, pro: true, enterprise: true },
  { name: "Saved processing history", free: false, pro: true, enterprise: true },
  { name: "Priority server processing", free: false, pro: true, enterprise: true },
  { name: "No ads", free: false, pro: true, enterprise: true },
  { name: "Early access to new tools", free: false, pro: true, enterprise: true },
  { name: "API access (server-to-server)", free: false, pro: false, enterprise: true },
  { name: "Bulk file processing", free: false, pro: false, enterprise: true },
  { name: "Team accounts", free: false, pro: false, enterprise: true },
  { name: "Dedicated support", free: false, pro: false, enterprise: true },
];

import { SEO } from '../../components/SEO';

export function PricingView({ onNavigate, onGetPro }: { onNavigate?: (p: string) => void; onGetPro?: () => void }) {
  const { isAuthenticated } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const priceFree = 0;
  const pricePro = isYearly ? 5.4 : 9;
  const priceEnterprise = isYearly ? 159 : 199;

  useEffect(() => {
    if (isYearly) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2000); // 2 seconds
      return () => clearTimeout(timer);
    }
  }, [isYearly]);

  return (
    <section className="pt-32 md:pt-40 pb-24 px-6 md:px-12 bg-white relative">
      <SEO title="Pricing" description="Upgrade your Qofeno experience. Choose the plan that works for you." />
      
      {/* Firecracker celebration for Yearly Discount! */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="absolute inset-0 pointer-events-none z-0 flex justify-center items-center overflow-hidden"
          >
            {useMemo(() => [...Array(60)].map((_, i) => {
              const angle = (i * 360) / 60;
              const radius = 250 + Math.random() * 100;
              const x = Math.cos((angle * Math.PI) / 180) * radius;
              const y = Math.sin((angle * Math.PI) / 180) * radius;
              return (
                <motion.div
                  key={i}
                  className="absolute w-1 h-8 rounded-full"
                  style={{
                    backgroundColor: ['#7C3AED', '#EC4899', '#06B6D4', '#FBBF24'][i % 4],
                    boxShadow: '0 0 10px currentColor',
                  }}
                  initial={{ 
                    x: 0, 
                    y: 0, 
                    scale: 0, 
                    rotate: angle + 90 
                  }}
                  animate={{
                    x,
                    y,
                    scale: [0, 1, 0],
                  }}
                  transition={{
                    duration: 1 + Math.random() * 0.5,
                    ease: "easeOut",
                  }}
                />
              );
            }), [])}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto flex flex-col items-center">
        
        {/* HERO HEADER */}
        <div className="text-center max-w-3xl mb-16">
          <span className="text-xs uppercase tracking-widest font-bold text-pink-600 bg-pink-50 px-3.5 py-1.5 rounded-full inline-block mb-4">
            No credit card required to start
          </span>
          <h1 className="font-display text-4xl md:text-7xl font-black text-[#0F0A1E] mb-6">Simple pricing. Powerful tools.</h1>
          <p className="text-lg md:text-xl text-neutral-500">Free forever for basic converting and calculation. Scale only when limits are stretched.</p>
        </div>

        {/* TOGGLE INDICATOR WITH CONFETTI TRIGGER */}
        <div className="flex items-center gap-4 bg-purple-50 rounded-full p-1.5 border border-purple-100 mb-16 relative">
          <button 
            type="button"
            onClick={() => setIsYearly(false)}
            className={cn("px-6 py-2.5 rounded-full text-sm font-extrabold transition-all cursor-pointer z-10", !isYearly ? "bg-purple-600 text-white shadow-lg shadow-purple-600/15" : "text-neutral-600 hover:text-neutral-900")}
          >
            Monthly
          </button>
          <div className="relative">
            <button 
              type="button"
              onClick={() => setIsYearly(true)}
              className={cn("px-6 py-2.5 rounded-full text-sm font-extrabold transition-all cursor-pointer flex items-center gap-1.5 z-10 relative", isYearly ? "bg-purple-600 text-white shadow-lg shadow-purple-600/15" : "text-neutral-600 hover:text-neutral-900")}
            >
              Yearly
            </button>
            <AnimatePresence>
              {isYearly && (
                <motion.span 
                  initial={{ scale: 0.8, opacity: 0, y: 10 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.8, opacity: 0, y: 10 }}
                  className="absolute -top-10 left-1/2 -translate-x-1/2 bg-pink-100 text-pink-700 text-[10px] font-black px-2.5 py-1 rounded-full flex items-center gap-1 shadow-sm border border-pink-200 whitespace-nowrap z-20 pointer-events-none"
                >
                  <FontAwesomeIcon icon={faWandMagicSparkles}  className="w-3 h-3 animate-spin" /> Save 40%
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* PLAN CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl items-stretch mb-24">
          
          {/* FREE PLAN */}
          <motion.div 
            whileHover={{ y: -6 }}
            className="border border-neutral-200 bg-white text-neutral-900 rounded-3xl p-8 flex flex-col justify-between transition-all"
          >
            <div>
              <h3 className="font-display text-xl font-bold mb-2">Free</h3>
              <p className="text-sm text-neutral-500 mb-6">Always free for basic files and utility processes.</p>
              
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-extrabold tracking-tight">$0</span>
                <span className="text-neutral-500 font-semibold ml-1">/mo forever</span>
              </div>

              <button onClick={() => onNavigate && onNavigate('tools')} className="w-full py-4 rounded-xl font-extrabold text-sm mb-8 bg-neutral-100 text-[#0F0A1E] hover:bg-neutral-200 transition-colors cursor-pointer">
                Start for Free
              </button>

              <ul className="space-y-4">
                {['Hundreds of free tools', 'No login required', 'Server-processed instantly', 'Files deleted after processing'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-neutral-600 font-medium">
                    <FontAwesomeIcon icon={faCheck}  className="w-4.5 h-4.5 text-purple-600 bg-purple-50 rounded p-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* PRO PLAN (Featured/Most Popular) */}
          <motion.div 
            whileHover={{ y: -8 }}
            className="border-2 border-purple-600 bg-gradient-to-b from-purple-950 to-[#1A0F33] text-white rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[11px] font-black uppercase px-4 py-1.5 rounded-b-xl flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
              Most Popular ✦
            </div>

            <div className="mt-4">
              <h3 className="font-display text-2xl font-black mb-2 flex items-center gap-1.5">Pro <FontAwesomeIcon icon={faWandMagicSparkles}  className="w-5 h-5 text-amber-400 fill-amber-400" /></h3>
              <p className="text-sm text-purple-200/80 mb-6">Designed directly for high-volume content developers & creators.</p>
              
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-black tracking-tight flex items-baseline">$<motion.span key={isYearly ? "yearly" : "monthly"} initial={{ opacity: 0, y: 15, filter: "blur(4px)" }} animate={{ opacity: 1, y: 0, filter: "blur(0px)" }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>{isYearly ? "5.40" : "9.00"}</motion.span></span>
                <span className="text-purple-300 font-semibold ml-1">/{isYearly ? 'mo billed yearly' : 'mo'}</span>
              </div>

              <button onClick={() => (onGetPro ? onGetPro() : onNavigate && onNavigate(isAuthenticated ? 'payment' : 'login'))} className="w-full py-4 rounded-xl font-extrabold text-sm mb-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity cursor-pointer">
                Get Pro
              </button>

              <ul className="space-y-4">
                {['Everything in Free', 'All tools — no restrictions', 'Large file support (up to 500MB)', 'Priority server processing', 'Saved processing history', 'No ads'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-purple-100 font-medium">
                    <FontAwesomeIcon icon={faCheck}  className="w-4.5 h-4.5 text-purple-350 bg-purple-900/50 rounded p-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* ENTERPRISE PLAN */}
          <motion.div 
            whileHover={{ y: -6 }}
            className="border border-neutral-200 bg-[#0F0A1E] text-white rounded-3xl p-8 flex flex-col justify-between transition-all"
          >
            <div>
              <h3 className="font-display text-xl font-bold mb-2">Enterprise</h3>
              <p className="text-sm text-neutral-400 mb-6 font-medium">Bespoke integrations, audited safety pipelines, GDPR logs.</p>
              
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-extrabold tracking-tight">Custom</span>
              </div>

              <button onClick={() => onNavigate && onNavigate('contact')} className="w-full py-4 rounded-xl font-extrabold text-sm mb-8 bg-white text-[#0F0A1E] hover:bg-neutral-200 transition-colors cursor-pointer">
                Contact Us
              </button>

              <ul className="space-y-4">
                {['Everything in Pro', 'API access (server-to-server)', 'Bulk file processing', 'Team accounts', 'Dedicated support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-neutral-400 font-medium">
                    <FontAwesomeIcon icon={faCheck}  className="w-4.5 h-4.5 text-purple-600 bg-purple-900/40 rounded p-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

        </div>

        {/* FEATURE COMPARISON TABLE */}
        <div className="w-full max-w-4xl mb-24 overflow-x-auto rounded-3xl border border-neutral-200/80 bg-white">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="p-5 font-bold text-neutral-800">Feature</th>
                <th className="p-5 font-bold text-neutral-800 text-center">Free</th>
                <th className="p-5 font-bold text-neutral-800 text-center text-purple-700">Pro</th>
                <th className="p-5 font-bold text-neutral-800 text-center">Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_FEATURES.map((feat, idx) => (
                <tr key={idx} className="border-b border-neutral-150 hover:bg-purple-50/20 transition-colors">
                  <td className="p-5 font-semibold text-neutral-700">{feat.name}</td>
                  <td className="p-5 text-center text-neutral-500 font-semibold">
                    {typeof feat.free === 'boolean' ? (feat.free ? <FontAwesomeIcon icon={faCheck}  className="w-5 h-5 text-purple-600 mx-auto" /> : '-') : feat.free}
                  </td>
                  <td className="p-5 text-center text-purple-900 font-bold">
                    {typeof feat.pro === 'boolean' ? (feat.pro ? <FontAwesomeIcon icon={faCheck}  className="w-5 h-5 text-purple-600 mx-auto" /> : '-') : feat.pro}
                  </td>
                  <td className="p-5 text-center text-neutral-500 font-semibold">
                    {typeof feat.enterprise === 'boolean' ? (feat.enterprise ? <FontAwesomeIcon icon={faCheck}  className="w-5 h-5 text-purple-600 mx-auto" /> : '-') : feat.enterprise}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ACCORDION FAQ SECTION */}
        <div className="w-full max-w-3xl">
          <h2 className="font-display text-3xl font-black text-[#0F0A1E] text-center mb-12">Frequently Asked Questions</h2>
          <div className="space-y-4">
            {FAQ_ITEMS.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div key={idx} className="border border-neutral-250 bg-[#FAFAFA] rounded-2xl overflow-hidden transition-all duration-300">
                  <button
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-6 text-left font-bold text-[#0F0A1E] hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <FontAwesomeIcon icon={faChevronDown}  className={cn("w-5 h-5 text-purple-600 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="p-6 pt-0 text-sm text-neutral-500 leading-relaxed border-t border-neutral-200/50 bg-white">
                          {faq.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
