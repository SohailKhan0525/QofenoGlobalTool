import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faSpinner, faPaperPlane, faCircleExclamation, faCircleCheck } from '@fortawesome/free-solid-svg-icons';
import { cn } from '../../lib/utils';
import { SEO } from '../../components/SEO';
import { submitContactForm } from '../../lib/qofeno-appwrite';

export function Contact() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Enterprise API Inquiry');
  const [message, setMessage] = useState('');

  // Status handlers
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [errorShake, setErrorShake] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Confetti particles for success feedback
  const [showConfetti, setShowConfetti] = useState(false);
  const confettiParticles = useMemo(() => [...Array(30)].map((_, i) => (
    <motion.div
      key={i}
      className="absolute w-2.5 h-2.5 rounded-full"
      style={{
        backgroundColor: ['#A78BFA', '#F59E0B', '#10B981', '#EC4899'][i % 4],
        left: `${Math.random() * 100}%`,
        top: '-10px',
      }}
      animate={{
        y: '100vh',
        x: `${Math.random() * 30 - 15}vw`,
        rotate: [0, 360],
      }}
      transition={{
        duration: Math.random() * 1.5 + 1.2,
        ease: 'easeOut',
      }}
    />
  )), []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple verification check to trigger shake
    if (!name || !email || !message) {
      setErrorShake(true);
      setTimeout(() => setErrorShake(false), 500);
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await submitContactForm({
        name,
        email,
        subject: topic,
        message,
      });
      setIsSubmitting(false);
      setIsDone(true);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 2400);
    } catch (err) {
      setIsSubmitting(false);
      setErrorShake(true);
      setSubmitError(err instanceof Error ? err.message : 'Failed to send your message. Please try again.');
      setTimeout(() => setErrorShake(false), 500);
    }
  };

  return (
    <section className="min-h-screen bg-white pt-24 md:pt-32 pb-16 md:pb-20 px-4 sm:px-6 md:px-12 relative flex items-center select-none">
      <SEO title="Contact Us" description="Get in touch with the Qofeno team." />
      
      {/* SUCCESS CONFETTI */}
      <AnimatePresence>
        {showConfetti && (
          <div className="fixed inset-0 pointer-events-none z-50 flex justify-center items-center overflow-hidden">
            {confettiParticles}
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 md:gap-16 items-center">
        
        {/* LEFT COMPONENT COLUMN */}
        <div className="flex flex-col items-start">
          <span className="text-xs font-bold uppercase tracking-widest text-[#7C3AED] bg-purple-50 px-3.5 py-1.5 rounded-full inline-block mb-6">
            Get in Touch
          </span>
          <h1 className="font-display text-4xl md:text-7xl font-black text-[#0F0A1E] mb-6 leading-none">Let's talk</h1>
          <p className="text-lg text-neutral-500 max-w-md mb-12 font-medium">
            Have questions or need to request a new tool? Drop a note below. Mohd Zaheer Uddin personally reviews and responds to every query.
          </p>

          <div className="space-y-6 w-full max-w-sm">
            <div className="flex items-center gap-4 p-4.5 bg-[#FAFAFA] border border-neutral-100 rounded-xl">
              <div className="p-3 bg-purple-100 text-purple-705 rounded-xl">
                <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-neutral-400 uppercase tracking-wider">Email Assistance</h4>
                <p className="font-bold text-neutral-800 text-sm">support@qofeno.dev</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COMPONENT FORM WITH SHAKE ERRORS AND ROTATION FEEDBACKS */}
        <div className="bg-[#FAFAFA] border border-neutral-200/60 p-5 sm:p-6 md:p-10 rounded-3xl shadow-sm relative">
          
          <AnimatePresence mode="wait">
            {!isDone ? (
              <motion.form 
                onSubmit={handleSubmit}
                className={cn("space-y-6", errorShake ? "animate-shake" : "")}
              >
                <div className="space-y-1 font-medium">
                  <label className="text-xs font-black text-neutral-700 uppercase tracking-wider">Your Full Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Sohail Khan"
                    className="w-full bg-white border border-neutral-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 rounded-xl p-3.5 outline-none text-neutral-800 text-sm transition-all"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>

                <div className="space-y-1 font-medium">
                  <label className="text-xs font-black text-neutral-700 uppercase tracking-wider">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="e.g. you@domain.com"
                    className="w-full bg-white border border-neutral-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 rounded-xl p-3.5 outline-none text-neutral-800 text-sm transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-1 font-medium">
                  <label className="text-xs font-black text-neutral-700 uppercase tracking-wider">Topic of Inquiry</label>
                  <select 
                    className="w-full bg-white border border-neutral-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 rounded-xl p-3.5 outline-none text-neutral-800 text-sm transition-all cursor-pointer"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  >
                    <option>Enterprise API Inquiry</option>
                    <option>Sponsorship & Affiliation</option>
                    <option>Academic Study Claim</option>
                    <option>Missing Converter Request</option>
                  </select>
                </div>

                <div className="space-y-1 font-medium">
                  <label className="text-xs font-black text-neutral-700 uppercase tracking-wider">Your Detailed Message</label>
                  <textarea 
                    rows={4}
                    placeholder="How can I help you? Please describe the tool idea or inquiry in detail..."
                    className="w-full bg-white border border-neutral-200 focus:border-purple-600 focus:ring-4 focus:ring-purple-100 rounded-xl p-3.5 outline-none text-neutral-800 text-sm transition-all resize-none"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />
                </div>

                {errorShake && (
                  <p className="text-xs text-rose-600 font-bold flex items-center gap-1.5"><FontAwesomeIcon icon={faCircleExclamation} className="w-4 h-4" /> Please complete all descriptive details before submitting.</p>
                )}

                {submitError && (
                  <p className="text-xs text-rose-600 font-bold flex items-center gap-1.5"><FontAwesomeIcon icon={faCircleExclamation} className="w-4 h-4" /> {submitError}</p>
                )}

                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-violet-500 text-white font-extrabold text-sm rounded-xl hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-500/10"
                >
                  {isSubmitting ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPaperPlane} className="w-4 h-4" />
                      <span>Send Message</span>
                    </>
                  )}
                </button>
              </motion.form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 space-y-6"
              >
                <FontAwesomeIcon icon={faCircleCheck} className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
                <h3 className="font-black text-2xl text-neutral-900">Message Sent!</h3>
                <p className="text-neutral-500 text-sm max-w-sm mx-auto">
                  I'll read your message and respond as soon as I can.
                </p>
                <button 
                  onClick={() => {
                    setIsDone(false);
                    setName('');
                    setEmail('');
                    setMessage('');
                  }}
                  className="bg-neutral-900 text-white rounded-xl py-2 px-6 text-xs font-bold"
                >
                  Send another message
                </button>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

      </div>
    </section>
  );
}
