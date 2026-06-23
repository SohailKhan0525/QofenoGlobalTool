import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCookieBite } from '@fortawesome/free-solid-svg-icons';

export function CookieConsentBanner({ onNavigate }: { onNavigate?: (p: string) => void }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('qofeno_cookie_consent');
    if (!consent) {
      // Small delay so it doesn't instantly jar the user on load
      const t = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(t);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('qofeno_cookie_consent', 'true');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-4 left-4 right-4 md:left-auto md:right-8 md:w-96 bg-white border border-neutral-200 shadow-2xl rounded-2xl p-5 z-50 flex flex-col gap-4 select-none"
        >
          <div className="flex items-start gap-3">
            <div className="bg-purple-100 text-purple-600 w-10 h-10 rounded-xl flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faCookieBite} className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-[#0F0A1E] text-sm mb-1">We use cookies</h4>
              <p className="text-xs text-neutral-500 leading-relaxed">
                We use essential cookies for login and preferences to improve your experience. 
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full">
            <button 
              onClick={() => {
                if (onNavigate) onNavigate('cookies');
              }}
              className="flex-1 py-2 text-xs font-bold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Learn more
            </button>
            <button 
              onClick={handleAccept}
              className="flex-1 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors shadow-lg shadow-purple-600/20"
            >
              Accept
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
