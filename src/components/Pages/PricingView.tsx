import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCircleQuestion, faChevronDown, faWandMagicSparkles, faCircleExclamation } from '@fortawesome/free-solid-svg-icons';
import { useState, useEffect, useRef, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { SEO } from '../../components/SEO';
import { PlanToggle } from '../PlanToggle';

const FAQ_ITEMS = [
  { q: "Is Qofeno free?", a: "Yes! We offer a wide range of essential converting, editing, and formatting tools completely free of charge. You can use them without signup." },
  { q: "Is my data secure?", a: "Absolutely. Most of our client-side tools process data directly in your browser. For tools that require server execution, data is transmitted over encrypted pipelines and deleted instantly after processing." },
  { q: "Do I need an account to use the tools?", a: "No account is required to use any of our free tools. Signup is only required if you choose to upgrade to a Pro or Teams subscription." },
  { q: "What are the limitations of the free plan?", a: "Free plan accounts have a standard file processing queue priority and a maximum file upload limit of 50MB per file." },
  { q: "How can I cancel my Pro or Teams subscription?", a: "You can cancel your subscription at any time. Simply head over to your account preferences panel, click 'Manage PayPal Subscription', and disable the pre-approved payment profile." },
  { q: "Can I upgrade or downgrade my plan later?", a: "Yes, you can toggle between Pro and Teams plans or change billing periods from monthly to yearly anytime inside your settings panel." },
  { q: "Do you offer refunds?", a: "Yes, we provide a full refund within 7 days of initial subscription if you run into technical issues that prevent you from using our services." },
  { q: "What file size limit applies to Pro and Teams plans?", a: "Pro users can upload files up to 500MB, while Teams users enjoy expanded file size capacity up to 1GB." },
  { q: "Can I share my Pro credentials with team members?", a: "Pro plans are configured for individual use only. If you wish to share tools, files, and histories with colleagues, you should subscribe to the Teams plan." },
  { q: "Who is the developer behind Qofeno?", a: "Qofeno is created, designed, and maintained by Mohd Zaheer Uddin. The project aims to provide high-quality developer and document tools without bulk installations." }
];

const PLAN_FEATURES = [
  { name: "Access to free tools", free: true, pro: true, teams: true },
  { name: "Server-side processing", free: true, pro: true, teams: true },
  { name: "No login required", free: true, pro: true, teams: false },
  { name: "Files deleted after processing", free: true, pro: true, teams: true },
  { name: "Maximum Upload Limit", free: "50 MB", pro: "500 MB", teams: "1 GB" },
  { name: "All tools unlocked", free: false, pro: true, teams: true },
  { name: "Saved processing history", free: false, pro: true, teams: true },
  { name: "Priority server processing", free: false, pro: true, teams: true },
  { name: "No ads", free: false, pro: true, teams: true },
  { name: "Early access to new tools", free: false, pro: true, teams: true },
  { name: "Multi-user seats", free: false, pro: false, teams: "Up to 5 seats" },
  { name: "Shared team history", free: false, pro: false, teams: true },
  { name: "Priority developer support", free: false, pro: false, teams: true },
];

export function PricingView({ onNavigate, onGetPro }: { onNavigate?: (p: string) => void; onGetPro?: () => void }) {
  const { isAuthenticated } = useAuth();
  const [isYearly, setIsYearly] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const priceFree = 0;
  const pricePro = isYearly ? 5.40 : 9.00;
  const priceTeams = isYearly ? 12.00 : 19.00;

  const confettiParticles = useMemo(() => [...Array(60)].map((_, i) => {
    const angle = (i * 360) / 60;
    const radius = 250 + Math.random() * 100;
    const x = Math.cos((angle * Math.PI) / 180) * radius;
    const y = Math.sin((angle * Math.PI) / 180) * radius;
    return { id: i, angle, x, y };
  }), []);

  useEffect(() => {
    if (isYearly) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isYearly]);

  return (
    <section className="pt-32 md:pt-40 pb-24 px-6 md:px-12 bg-white relative">
      <SEO title="Pricing Plans" description="Upgrade your Qofeno experience. Choose the plan that works for you." />
      
      {/* Firecracker celebration for Yearly Discount! */}
      <AnimatePresence>
        {showConfetti && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="absolute inset-0 pointer-events-none z-0 flex justify-center items-center overflow-hidden"
          >
            {confettiParticles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute w-1 h-8 rounded-full"
                style={{
                  backgroundColor: ['#7C3AED', '#EC4899', '#06B6D4', '#FBBF24'][p.id % 4],
                  boxShadow: '0 0 10px currentColor',
                }}
                initial={{ 
                  x: 0, 
                  y: 0, 
                  scale: 0, 
                  rotate: p.angle + 90 
                }}
                animate={{
                  x: p.x,
                  y: p.y,
                  scale: [0, 1, 0],
                }}
                transition={{
                  duration: 1 + Math.random() * 0.5,
                  ease: "easeOut",
                }}
              />
            ))}
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

        {/* TOGGLE INDICATOR */}
        <div className="flex justify-center mb-16">
          <PlanToggle isYearly={isYearly} onChange={setIsYearly} />
        </div>

        {/* PLAN CARDS GRID */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl items-stretch mb-24">
          
          {/* FREE PLAN */}
          <motion.div 
            whileHover={prefersReduced ? {} : { y: -6 }}
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
                    <FontAwesomeIcon icon={faCheck} className="w-4.5 h-4.5 text-purple-600 bg-purple-50 rounded p-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* PRO PLAN */}
          <motion.div 
            whileHover={prefersReduced ? {} : { y: -8 }}
            className="border-2 border-purple-600 bg-gradient-to-b from-purple-950 to-[#1A0F33] text-white rounded-3xl p-8 flex flex-col justify-between shadow-2xl relative"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-[11px] font-black uppercase px-4 py-1.5 rounded-b-xl flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-ping" />
              Most Popular ✦
            </div>

            <div className="mt-4">
              <h3 className="font-display text-2xl font-black mb-2 flex items-center gap-1.5">Pro <FontAwesomeIcon icon={faWandMagicSparkles} className="w-5 h-5 text-amber-400 fill-amber-400" /></h3>
              <p className="text-sm text-purple-200/80 mb-6">Designed directly for high-volume content developers & creators.</p>
              
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-black tracking-tight flex items-baseline">
                  $<motion.span key={isYearly ? "yearly" : "monthly"} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>{pricePro.toFixed(2)}</motion.span>
                </span>
                <span className="text-purple-300 font-semibold ml-1">/{isYearly ? 'mo billed yearly' : 'mo'}</span>
              </div>

              <button 
                onClick={() => onNavigate && onNavigate(isAuthenticated ? '/checkout/pro?plan=pro' : '/login?redirect=/checkout/pro?plan=pro')} 
                className="w-full py-4 rounded-xl font-extrabold text-sm mb-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity cursor-pointer"
              >
                Get Pro
              </button>

              <ul className="space-y-4">
                {['Everything in Free', 'All tools — no restrictions', 'Large file support (up to 500MB)', 'Priority server processing', 'Saved processing history', 'No ads'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-purple-100 font-medium">
                    <FontAwesomeIcon icon={faCheck} className="w-4.5 h-4.5 text-purple-350 bg-purple-900/50 rounded p-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

          {/* TEAMS PLAN */}
          <motion.div 
            whileHover={prefersReduced ? {} : { y: -6 }}
            className="border border-neutral-200 bg-[#0F0A1E] text-white rounded-3xl p-8 flex flex-col justify-between transition-all"
          >
            <div>
              <h3 className="font-display text-xl font-bold mb-2">Teams</h3>
              <p className="text-sm text-neutral-400 mb-6 font-medium">Collaborative utilities and higher file limits for standard workgroups.</p>
              
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-black tracking-tight flex items-baseline">
                  $<motion.span key={isYearly ? "t-yearly" : "t-monthly"} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ type: "spring", stiffness: 400, damping: 25 }}>{priceTeams.toFixed(2)}</motion.span>
                </span>
                <span className="text-neutral-400 font-semibold ml-1">/{isYearly ? 'mo billed yearly' : 'mo'}</span>
              </div>

              <button 
                onClick={() => onNavigate && onNavigate(isAuthenticated ? '/checkout/pro?plan=teams' : '/login?redirect=/checkout/pro?plan=teams')} 
                className="w-full py-4 rounded-xl font-extrabold text-sm mb-8 bg-white text-[#0F0A1E] hover:bg-neutral-250 transition-colors cursor-pointer"
              >
                Start Teams Plan
              </button>

              <ul className="space-y-4">
                {['Everything in Pro', 'Up to 5 team members', 'Shared tool history', '1 GB file size limits', 'Priority technical support'].map((f, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-neutral-400 font-medium">
                    <FontAwesomeIcon icon={faCheck} className="w-4.5 h-4.5 text-purple-600 bg-purple-900/40 rounded p-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>

        </div>

        {/* FEATURE COMPARISON TABLE */}
        <div className="w-full max-w-4xl mb-24 overflow-x-auto rounded-3xl border border-neutral-200/80 bg-white shadow-sm">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50">
                <th className="p-5 font-bold text-neutral-800">Feature</th>
                <th className="p-5 font-bold text-neutral-800 text-center">Free</th>
                <th className="p-5 font-bold text-neutral-800 text-center text-purple-700">Pro</th>
                <th className="p-5 font-bold text-neutral-800 text-center">Teams</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_FEATURES.map((feat, idx) => (
                <tr key={idx} className="border-b border-neutral-150 hover:bg-purple-50/20 transition-colors">
                  <td className="p-5 font-semibold text-neutral-700">{feat.name}</td>
                  <td className="p-5 text-center text-neutral-500 font-semibold">
                    {typeof feat.free === 'boolean' ? (feat.free ? <FontAwesomeIcon icon={faCheck} className="w-5 h-5 text-purple-600 mx-auto" /> : '-') : feat.free}
                  </td>
                  <td className="p-5 text-center text-purple-900 font-bold">
                    {typeof feat.pro === 'boolean' ? (feat.pro ? <FontAwesomeIcon icon={faCheck} className="w-5 h-5 text-purple-600 mx-auto" /> : '-') : feat.pro}
                  </td>
                  <td className="p-5 text-center text-neutral-500 font-semibold">
                    {typeof feat.teams === 'boolean' ? (feat.teams ? <FontAwesomeIcon icon={faCheck} className="w-5 h-5 text-purple-600 mx-auto" /> : '-') : feat.teams}
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
                    type="button"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between p-6 text-left font-bold text-[#0F0A1E] hover:bg-neutral-100 transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <FontAwesomeIcon icon={faChevronDown} className={cn("w-5 h-5 text-purple-600 transition-transform duration-300", isOpen ? "rotate-180" : "")} />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={prefersReduced ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={prefersReduced ? { height: 'auto', opacity: 1 } : { height: 0, opacity: 0 }}
                        transition={{ duration: prefersReduced ? 0 : 0.3 }}
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
