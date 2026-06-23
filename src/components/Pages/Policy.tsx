import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBookOpen, faShieldHalved, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../../components/SEO';
import { cn } from '../../lib/utils';

const SECTIONS = [
  {
    title: "1. Introduction",
    content: "Welcome to Qofeno. This Privacy Policy explains in plain English how we collect, use, and protect your information when you use our platform and services. Our core principle is that your files belong to you, and we minimize data collection to only what is strictly necessary to provide the service."
  },
  {
    title: "2. Information We Collect",
    content: "Account information: If you register, we collect your name, email, and a hashed password.\nUsage data: We collect telemetry on which tools you use and when, to help us improve the platform. We NEVER collect the contents of your files.\nFiles: Files are uploaded strictly for processing purposes and are never stored permanently."
  },
  {
    title: "3. How We Use Your Information",
    content: "We use your information exclusively to provide tool processing capabilities, manage your account, send you necessary notifications (if opted in), and respond to your direct contact form messages."
  },
  {
    title: "4. File Handling Policy",
    isHighlighted: true,
    content: "Files you upload to Qofeno are processed on our servers only. All files are permanently and automatically deleted immediately after processing is complete. We never read, store, sell, or share your files under any circumstances."
  },
  {
    title: "5. Cookies",
    content: "We use essential cookies such as `a_session_[projectId]` for login state and Cloudflare's `cf_clearance` for security. We use functional local storage to remember your recent tools. We do NOT use invasive tracking or advertising cookies."
  },
  {
    title: "6. Third-Party Services",
    content: "To provide our service, we rely on trusted infrastructure: Appwrite (Backend), PayPal (Payments), Resend (Emails), and Cloudflare (Hosting, Security, and Turnstile Captcha)."
  },
  {
    title: "7. Data Retention",
    content: "Account data is retained while your account is active. Tool usage metadata is retained for 90 days. Files are deleted immediately. Contact messages are retained for up to 1 year."
  },
  {
    title: "8. Your Rights",
    content: "You have the right to access, export, or delete your data at any time via your account settings. For manual requests, please contact us."
  },
  {
    title: "9. Children's Privacy",
    content: "Our services are not directed at children under the age of 13."
  },
  {
    title: "10. Changes to This Policy",
    content: "If we make significant changes to this policy, we will notify you via the email address associated with your account."
  },
  {
    title: "11. Contact",
    content: "For any privacy-related inquiries, please contact Mohd Zaheer Uddin via the site's contact form."
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
