import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileContract, faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { SEO } from '../../components/SEO';
import { cn } from '../../lib/utils';

const SECTIONS = [
  {
    title: "1. Acceptance & Operator",
    content: "By accessing and using Qofeno, you agree to be bound by these Terms of Service. Qofeno is created, operated, and maintained by Mohd Zaheer Uddin."
  },
  {
    title: "2. Free Tools vs Pro Subscriptions",
    content: "• Free Tools: Standard tools are available to all users with no account required, subject to fair use and standard file size limits.\n• Pro / Teams Tiers: Paid subscriptions billed through PayPal unlock 500MB+ file limits, batch conversions, and priority queues. You may cancel your subscription anytime via your Settings or PayPal dashboard."
  },
  {
    title: "3. Refund Policy",
    content: "We offer a 7-day money-back guarantee on your initial subscription payment if you encounter unresolved technical difficulties. To request a refund, contact us via the contact form with your PayPal transaction ID within 7 days of purchase."
  },
  {
    title: "4. Acceptable Use",
    content: "You agree not to use Qofeno to upload, process, or distribute illegal, infringing, malware, defamatory, or abusive content. Automated abuse, API reverse-engineering without authorization, and DDoS attacks are strictly forbidden and subject to immediate IP bans."
  },
  {
    title: "5. File Handling & Ownership",
    content: "You retain 100% intellectual property ownership of all uploaded files. Files are processed securely in temporary runtime environments and permanently deleted immediately upon completion. We never inspect, index, or share your file content."
  },
  {
    title: "6. Service Availability & SLA",
    content: "Services are provided on an 'as-is' and 'as-available' basis. While we strive for 99.9% uptime across our serverless infrastructure, no service level agreement (SLA) applies to the free tier."
  },
  {
    title: "7. Limitation of Liability",
    content: "To the maximum extent permitted by law, Qofeno and Mohd Zaheer Uddin shall not be liable for indirect, incidental, or consequential damages. Total liability for any claim shall not exceed the amount paid in subscription fees over the preceding 12 months."
  },
  {
    title: "8. Governing Law & Jurisdiction",
    content: "These Terms are governed by and construed in accordance with the laws of India, the jurisdiction where Mohd Zaheer Uddin is based, without regard to conflict of law principles."
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
