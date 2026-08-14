import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faShieldHalved, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../../components/SEO';
import { cn } from '../../lib/utils';

const SECTIONS = [
  {
    title: "1. Introduction",
    content: "Welcome to Qofeno, created and maintained by Mohd Zaheer Uddin. This Privacy Policy explains transparently how we collect, use, and protect your information when using our tools platform. Our fundamental principle is that your files belong exclusively to you, and we collect only the minimal data required to provide and secure our services."
  },
  {
    title: "2. Information We Collect",
    content: "• Account Information: Name and email address stored securely in Appwrite Auth when you create an account.\n• Usage Data: Telemetry on which tools are executed, duration, and file size metadata stored in Appwrite Database to monitor performance. We NEVER collect file contents.\n• Analytics: Aggregated, anonymized traffic data (pages visited, referrer, country) via Google Analytics 4 (GA4).\n• Error Reports: Technical stack traces and runtime error reports via Sentry to debug and fix application bugs (no personal data transmitted).\n• Payment Data: All payment details are processed and secured exclusively by PayPal. Qofeno never collects or stores credit card or banking details."
  },
  {
    title: "3. What We Do NOT Collect",
    isHighlighted: true,
    content: "• Your Uploaded Files: Processed in memory/serverless functions and permanently deleted immediately after processing is complete.\n• Browsing History: We do not track your activity outside of Qofeno.\n• Granular Location: We do not collect GPS or precise device location beyond country-level geolocation for DDoS defense."
  },
  {
    title: "4. How We Protect Your Data",
    content: "• Encryption: All data in transit is encrypted using modern TLS 1.3/HTTPS, and data at rest is encrypted in Appwrite Cloud.\n• Session Security: Authentication sessions use HTTP-only, Secure cookies (a_session_[projectId]) inaccessible to client-side JavaScript, protecting against XSS attacks.\n• Content Security Policy (CSP): Strict CSP headers prevent malicious script execution and data exfiltration.\n• Automated Deletion: Files uploaded for tool operations are purged immediately upon generation of your download link."
  },
  {
    title: "5. Cookies & Local Storage",
    content: "We use strictly necessary and security cookies:\n• a_session_[projectId]: Essential Appwrite session cookie (HTTP-only, 30 days) to keep you logged in.\n• __cf_bm & cf_clearance: Essential Cloudflare Bot Management cookies (30 minutes) to prevent DDoS attacks.\n• _ga & _ga_*: Anonymous first-party Google Analytics cookies (opt-out available in Settings).\nWe do NOT use third-party advertising cookies or cross-site tracking trackers."
  },
  {
    title: "6. Data Retention Policy",
    content: "• Account Data: Maintained until you choose to delete your account.\n• Tool Execution Metadata: Anonymous execution logs are retained for up to 90 days for reliability analytics.\n• Processed Files: Deleted immediately following processing (never stored permanently).\n• Contact Messages: Retained for up to 1 year to resolve support requests."
  },
  {
    title: "7. Your Rights (GDPR & Privacy)",
    content: "Under applicable data protection regulations, you have the right to:\n• Access and export your account data via Settings → Privacy & Data → Download My Data.\n• Delete your account and associated data permanently via Settings → Danger Zone.\n• Opt out of anonymous analytics telemetry in workspace preferences.\n• Contact Mohd Zaheer Uddin directly regarding any privacy questions."
  },
  {
    title: "8. Changes & Contact",
    content: "If we update this Privacy Policy, we will post the revised date at the top of this page. For privacy inquiries or data requests, please contact Mohd Zaheer Uddin via our Contact page."
  }
];

export function Policy() {
  const [openSection, setOpenSection] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white pt-32 md:pt-40 pb-20 px-6 md:px-12 select-none">
      <SEO title="Privacy Policy" description="Qofeno Privacy Policy and Data Handling details." />
      
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-start">
        
        {/* Desktop Sticky TOC */}
        <div className="hidden md:block w-64 sticky top-32 shrink-0 border-r border-neutral-100 pr-6">
          <h3 className="font-black text-sm uppercase tracking-widest text-neutral-400 mb-6 flex items-center gap-2">
            <FontAwesomeIcon icon={faBookOpen} /> Contents
          </h3>
          <ul className="space-y-3">
            {SECTIONS.map((sec, i) => (
              <li key={i}>
                <button 
                  onClick={() => {
                    setOpenSection(i);
                    document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
            <h1 className="font-display font-black text-4xl md:text-5xl text-[#0F0A1E] mb-4">Privacy Policy</h1>
            <p className="text-neutral-500 font-semibold">Last updated: {new Date().toLocaleDateString()} • By Mohd Zaheer Uddin</p>
          </div>

          <div className="space-y-6">
            {SECTIONS.map((sec, i) => (
              <div 
                key={i} 
                id={`section-${i}`}
                className={cn(
                  "rounded-2xl transition-all duration-300 overflow-hidden",
                  sec.isHighlighted 
                    ? "bg-purple-50 border border-purple-200 shadow-md shadow-purple-500/10 p-6 md:p-8" 
                    : "bg-white border border-neutral-200"
                )}
              >
                {/* Mobile Accordion Toggle / Desktop Header */}
                <button 
                  onClick={() => setOpenSection(openSection === i ? null : i)}
                  className={cn(
                    "w-full text-left flex items-center justify-between font-bold text-lg md:text-xl",
                    !sec.isHighlighted && "p-6 cursor-pointer md:cursor-default"
                  )}
                >
                  <span className={sec.isHighlighted ? "text-purple-900" : "text-[#0F0A1E]"}>
                    {sec.isHighlighted && <FontAwesomeIcon icon={faShieldHalved} className="mr-2 text-purple-600" />}
                    {sec.title}
                  </span>
                  {!sec.isHighlighted && <FontAwesomeIcon icon={faChevronDown} className="md:hidden text-neutral-400 w-4 h-4" />}
                </button>

                {/* Content */}
                <AnimatePresence initial={false}>
                  {(openSection === i || sec.isHighlighted || typeof window !== 'undefined' && window.innerWidth >= 768) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className={cn("text-neutral-600 leading-relaxed", !sec.isHighlighted && "px-6 pb-6 pt-0 border-t border-neutral-100 mt-4 md:border-none md:mt-0")}
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
