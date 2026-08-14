import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCookieBite, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../../components/SEO';
import { cn } from '../../lib/utils';

const SECTIONS = [
  {
    title: "1. What Are Cookies?",
    content: "Cookies are small text files stored securely on your browser when you visit a website. They allow the site to remember your authentication session, maintain preferences, and provide necessary bot and security protection."
  },
  {
    title: "2. Cookies We Use",
    content: "1. Essential Cookies (Strictly Necessary — Cannot be Disabled):\n• a_session_[projectId]: Sets and maintains your authenticated user session. Duration: 30 days. Type: HTTP-only, Secure. Set by: Appwrite.\n\n2. Analytics Cookies (Can be Disabled):\n• _ga, _ga_*: Anonymous aggregate usage metrics. Duration: 2 years. Set by: Google Analytics 4. Opt-out available in Settings → Appearance & Privacy.\n\n3. Security Cookies (Bot & DDoS Defense):\n• __cf_bm & cf_clearance: Cloudflare Bot Management and Turnstile clearance tokens to block automated attacks. Duration: 30 minutes. Set by: Cloudflare.\n\nWe do NOT use any third-party tracking or advertising cookies."
  },
  {
    title: "3. Local Storage Policy",
    content: "We use browser local storage exclusively for non-sensitive, non-PII operational data:\n• qofeno_cookie_consent: Remembers that you acknowledged this cookie notice.\n• qofeno_likes: Temporary anonymous tool favorites (migrated to your private Appwrite database upon sign in).\n• qofeno_recently_viewed: Remembers your recent tool shortcuts locally.\n\nWe NEVER store session tokens, passwords, API keys, or personal identifying information (PII) in local storage."
  },
  {
    title: "4. Managing Your Cookie Preferences",
    content: "You can control cookie settings through your browser preferences. Disabling essential cookies may prevent login functionality. If you have questions about our cookie policy, please contact Mohd Zaheer Uddin via the Contact page."
  }
];

export function Cookies() {
  const [openSection, setOpenSection] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white pt-32 md:pt-40 pb-20 px-6 md:px-12 select-none">
      <SEO title="Cookie Policy" description="Qofeno Cookie Policy and Local Storage Usage." />
      
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-start">
        
        {/* Desktop Sticky TOC */}
        <div className="hidden md:block w-64 sticky top-32 shrink-0 border-r border-neutral-100 pr-6">
          <h3 className="font-black text-sm uppercase tracking-widest text-neutral-400 mb-6 flex items-center gap-2">
            <FontAwesomeIcon icon={faCookieBite} /> Sections
          </h3>
          <ul className="space-y-3">
            {SECTIONS.map((sec, i) => (
              <li key={i}>
                <button 
                  onClick={() => {
                    setOpenSection(i);
                    document.getElementById(`cookie-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }}
                  className={cn("text-sm text-left transition-colors font-semibold", openSection === i ? "text-purple-600" : "text-neutral-500 hover:text-neutral-900")}
                >
                  {sec.title}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <div className="mb-12">
            <h1 className="font-display font-black text-4xl md:text-5xl text-[#0F0A1E] mb-4">Cookie Policy</h1>
            <p className="text-neutral-500 font-semibold">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="space-y-6">
            {SECTIONS.map((sec, i) => (
              <div 
                key={i} 
                id={`cookie-${i}`}
                className="bg-white border border-neutral-200 rounded-2xl transition-all duration-300 overflow-hidden"
              >
                <button 
                  onClick={() => setOpenSection(openSection === i ? null : i)}
                  className="w-full text-left flex items-center justify-between font-bold text-lg md:text-xl p-6 cursor-pointer md:cursor-default"
                >
                  <span className="text-[#0F0A1E]">
                    {sec.title}
                  </span>
                  <FontAwesomeIcon icon={faChevronDown} className="md:hidden text-neutral-400 w-4 h-4" />
                </button>

                <AnimatePresence initial={false}>
                  {(openSection === i || typeof window !== 'undefined' && window.innerWidth >= 768) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="text-neutral-600 leading-relaxed px-6 pb-6 pt-0 border-t border-neutral-100 mt-4 md:border-none md:mt-0"
                    >
                      {sec.content.split('\n').map((para, idx) => (
                        <p key={idx} className={idx > 0 ? "mt-4" : ""}>{para}</p>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
