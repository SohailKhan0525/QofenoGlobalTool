import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCookieBite, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../../components/SEO';
import { cn } from '../../lib/utils';

const SECTIONS = [
  {
    title: "1. What Are Cookies?",
    content: "Cookies are small text files stored on your device when you visit a website. They help the site function correctly, remember your preferences, and provide anonymous usage statistics."
  },
  {
    title: "2. Cookies We Use",
    content: "We use the following specific cookies and local storage items:\n\n• `a_session_[projectId]` - Appwrite session cookie. (Essential for keeping you logged in).\n• `cf_clearance` - Cloudflare security clearance. (Essential for DDoS protection and Turnstile verification).\n• `qofeno_likes` - Local storage item containing your liked tools. (Functional).\n• `qofeno_recently_viewed` - Local storage item containing your recently viewed tools. (Functional).\n• `qofeno_cookie_consent` - Remembers whether you accepted the cookie banner. (Functional)."
  },
  {
    title: "3. How to Control Cookies",
    content: "You can control and/or delete cookies as you wish. You can delete all cookies that are already on your computer and you can set most browsers to prevent them from being placed. However, if you do this, you may have to manually adjust some preferences every time you visit Qofeno and some services (like logging in) will not work."
  },
  {
    title: "4. Contact for Questions",
    content: "If you have any questions regarding our cookie policy, please reach out via the contact form and direct your inquiry to Mohd Zaheer Uddin."
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
