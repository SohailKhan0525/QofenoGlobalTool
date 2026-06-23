import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileContract, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../../components/SEO';
import { cn } from '../../lib/utils';

const SECTIONS = [
  {
    title: "1. Acceptance of Terms",
    content: "By accessing and using Qofeno, you accept and agree to be bound by the terms and provision of this agreement."
  },
  {
    title: "2. Description of Service",
    content: "Qofeno provides online file processing, format conversion, and data manipulation tools. The service operates primarily on server-side functions and offers both free and paid subscription tiers."
  },
  {
    title: "3. Account Responsibilities",
    content: "If you create an account, you are responsible for maintaining the security of your credentials and are fully responsible for all activities that occur under the account. You must immediately notify us of any unauthorized uses of your account."
  },
  {
    title: "4. Free vs Pro Access",
    content: "Free users may access basic tools anonymously subject to file size limitations (e.g., 50MB max) and standard processing queues. Pro users require an account and an active PayPal subscription, granting access to 500MB limits, premium tools, and priority processing queues."
  },
  {
    title: "5. Acceptable Use",
    content: "You agree not to use the service to upload, process, or distribute any material that is illegal, defamatory, abusive, or obscene. Automated scraping or reverse-engineering of our serverless APIs without an Enterprise agreement is strictly prohibited and will result in IP bans."
  },
  {
    title: "6. File Processing Terms",
    content: "Your files are processed securely on our serverless infrastructure. They are automatically and permanently deleted immediately after your download link expires or within a maximum of 2 hours. You retain all ownership rights to your files; we claim no intellectual property rights over your uploaded content. We are not liable for any data loss, and you should always keep original backups."
  },
  {
    title: "7. Payment Terms",
    content: "Pro subscriptions are billed via PayPal on a recurring monthly or yearly basis. You may cancel your subscription at any time through your billing dashboard. Refunds are evaluated on a case-by-case basis; if you experience persistent technical failures, please contact support within 7 days of the charge."
  },
  {
    title: "8. Intellectual Property",
    content: "The Qofeno name, logo, UI/UX designs, and original source code are the intellectual property of Mohd Zaheer Uddin. You may not copy, reproduce, or distribute the platform's design without permission."
  },
  {
    title: "9. Limitation of Liability",
    content: "In no event shall Qofeno, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service."
  },
  {
    title: "10. Contact",
    content: "If you have any questions about these Terms, please contact us via the site's contact form."
  }
];

export function Terms() {
  const [openSection, setOpenSection] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-white pt-32 md:pt-40 pb-20 px-6 md:px-12 select-none">
      <SEO title="Terms of Service" description="Qofeno Terms of Service and Usage Rules." />
      
      <div className="max-w-4xl mx-auto flex flex-col md:flex-row gap-12 items-start">
        
        {/* Desktop Sticky TOC */}
        <div className="hidden md:block w-64 sticky top-32 shrink-0 border-r border-neutral-100 pr-6">
          <h3 className="font-black text-sm uppercase tracking-widest text-neutral-400 mb-6 flex items-center gap-2">
            <FontAwesomeIcon icon={faFileContract} /> Sections
          </h3>
          <ul className="space-y-3">
            {SECTIONS.map((sec, i) => (
              <li key={i}>
                <button 
                  onClick={() => {
                    setOpenSection(i);
                    document.getElementById(`term-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
            <h1 className="font-display font-black text-4xl md:text-5xl text-[#0F0A1E] mb-4">Terms of Service</h1>
            <p className="text-neutral-500 font-semibold">Last updated: {new Date().toLocaleDateString()}</p>
          </div>

          <div className="space-y-6">
            {SECTIONS.map((sec, i) => (
              <div 
                key={i} 
                id={`term-${i}`}
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
