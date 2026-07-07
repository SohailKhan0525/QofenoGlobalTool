import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowRight, faMagnifyingGlass, faChevronRight, faCircleCheck, 
  faBolt, faSliders, faMusic, faFileLines, faImage, faVideo, 
  faCode, faChartColumn, faGraduationCap, faWandMagicSparkles, 
  faMicrochip, faHeart, faUsers, faStar, faPenNib
} from '@fortawesome/free-solid-svg-icons';
import { useToolCatalog } from '../../lib/toolCatalog';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface HomeProps {
  onNavigate: (page: string) => void;
  onRequestTool?: () => void;
}

const PERSONAS = [
  { id: 'students', label: '🎓 Students', title: 'Ace your study sessions', desc: 'Compress assignment files, format citations, convert document formats, and outline text. Complete homework without bloated installations or subscription plans.', bgClass: 'bg-gradient-to-br from-purple-100 to-pink-100', icon: faGraduationCap, iconColor: 'text-purple-600', link: '/tools?category=Writing Tools,PDF & Documents,Study Tools' },
  { id: 'devs', label: '👨‍💻 Developers', title: 'Slick daily utilities', desc: 'Format JSON outputs, encode/decode Base64 strings, analyze payloads, and clean structured data. Secure, fast developer essentials built for active coders.', bgClass: 'bg-gradient-to-br from-cyan-100 to-blue-100', icon: faCode, iconColor: 'text-cyan-600', link: '/tools?category=Developer Tools,Data Tools' },
  { id: 'professionals', label: '💼 Professionals', title: 'Work faster, not harder', desc: 'Merge PDF reports, compress heavy images, trim video presentations, and run files. Professional-grade utilities that do not require IT security clearance or subscription tiers.', bgClass: 'bg-gradient-to-br from-emerald-100 to-teal-100', icon: faChartColumn, iconColor: 'text-emerald-600', link: '/tools?category=PDF & Documents,Image Tools,Video Tools' },
  { id: 'everyone', label: '🌍 Everyone Else', title: 'Impossibly simple for all', desc: 'If you can click a button, you can use Qofeno. No complex learning curves. High contrast responsive panels tailored to process tools in seconds.', bgClass: 'bg-gradient-to-br from-amber-100 to-orange-100', icon: faWandMagicSparkles, iconColor: 'text-amber-600', link: '/tools?filter=free' }
];

const CATEGORY_META: Record<string, { icon: any, color: string }> = {
  'PDF & Documents': { icon: faFileLines, color: 'bg-red-50 text-red-650' },
  'Image Tools': { icon: faImage, color: 'bg-emerald-50 text-emerald-650' },
  'Video Tools': { icon: faVideo, color: 'bg-blue-50 text-blue-650' },
  'Audio Tools': { icon: faMusic, color: 'bg-amber-50 text-amber-650' },
  'Developer Tools': { icon: faCode, color: 'bg-purple-50 text-purple-650' },
  'Data Tools': { icon: faChartColumn, color: 'bg-cyan-50 text-cyan-650' },
  'Study Tools': { icon: faGraduationCap, color: 'bg-pink-50 text-pink-650' },
  'Writing Tools': { icon: faPenNib, color: 'bg-violet-50 text-violet-650' },
};

// Interactive Typing demo subcomponent
function SearchTypingDemo() {
  const [text, setText] = useState('');
  const [showResults, setShowResults] = useState(false);
  
  useEffect(() => {
    let index = 0;
    const phrase = 'compress pdf';
    setText('');
    setShowResults(false);
    
    const typingInterval = setInterval(() => {
      if (index < phrase.length) {
        setText(prev => prev + phrase[index]);
        index++;
      } else {
        clearInterval(typingInterval);
        setTimeout(() => setShowResults(true), 500);
      }
    }, 150);
    
    return () => clearInterval(typingInterval);
  }, []);

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-neutral-100 p-5 flex flex-col gap-4 min-h-[180px] justify-center">
      <div className="flex items-center gap-3 bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-100">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="text-neutral-400 w-4 h-4" />
        <span className="text-sm font-semibold text-neutral-800">{text}</span>
        <span className="w-0.5 h-4 bg-purple-600 animate-[pulse_1s_infinite]" />
      </div>
      {showResults && (
        <motion.div 
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="bg-purple-50/50 border border-purple-100 rounded-xl p-3 flex items-center justify-between"
        >
          <div>
            <h4 className="font-bold text-xs text-purple-900">PDF Compressor</h4>
            <p className="text-[10px] text-purple-600/70 mt-0.5">Reduce file size without quality loss</p>
          </div>
          <span className="bg-purple-600 text-white text-[9px] font-bold px-3 py-1.5 rounded-lg">Open</span>
        </motion.div>
      )}
    </div>
  );
}

// Upload progress simulation subcomponent
function UploadProgressDemo() {
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) return 0;
        return p + 5;
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-neutral-100 p-5 flex flex-col justify-center items-center gap-4 min-h-[180px] relative">
      <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 border border-purple-100 animate-bounce">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
      </div>
      <div className="w-full">
        <div className="flex justify-between text-[10px] font-bold text-neutral-500 mb-1 px-1">
          <span>draft_proposal.pdf</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-neutral-150 rounded-full h-2 overflow-hidden">
          <div className="bg-purple-600 h-full transition-all duration-150" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}

// Success Check & Confetti simulation subcomponent
function DownloadSuccessDemo() {
  const [particles, setParticles] = useState<any[]>([]);

  useEffect(() => {
    const list = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 80 - 40,
      y: Math.random() * 80 - 40,
      color: ['bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-yellow-500'][i % 4],
      delay: Math.random() * 0.4
    }));
    setParticles(list);
  }, []);

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-neutral-100 p-5 flex flex-col justify-center items-center gap-4 min-h-[180px] relative overflow-hidden">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
          animate={{ opacity: 0, scale: 1.1, x: p.x * 1.5, y: p.y * 1.5 }}
          transition={{ duration: 1.2, delay: p.delay, repeat: Infinity, repeatDelay: 1 }}
          className={`absolute w-2 h-2 rounded-full ${p.color}`}
        />
      ))}
      
      <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-500 border border-green-100">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      
      <div className="text-center w-full">
        <h4 className="font-bold text-neutral-800 text-xs">Success!</h4>
        <p className="text-[9px] font-semibold text-green-600 mt-0.5">Original: 18.4MB → Compressed: 2.3MB</p>
      </div>

      <button className="w-full py-2 bg-green-600 hover:bg-green-700 text-white font-bold text-[10px] rounded-lg shadow-lg shadow-green-500/10 transition-all cursor-pointer">
        Download Ready
      </button>
    </div>
  );
}

export function Home({ onNavigate, onRequestTool }: HomeProps) {
  const { tools, featuredTools, categoryCards } = useToolCatalog();
  const [activePersona, setActivePersona] = useState('students');
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [isHovered, setIsHovered] = useState(false);
  const [pricingYearly, setPricingYearly] = useState(false);

  // Persona loading state
  const [studentTools, setStudentTools] = useState<any[]>([]);
  const [devTools, setDevTools] = useState<any[]>([]);
  const [proTools, setProTools] = useState<any[]>([]);
  const [everyoneTools, setEveryoneTools] = useState<any[]>([]);

  // Refs for animations
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const trustBarRef = useRef<HTMLDivElement>(null);

  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (!tools || tools.length === 0) return;
    
    setStudentTools(tools.filter(t => ['Writing Tools', 'PDF & Documents', 'Study Tools'].includes(t.category)).slice(0, 3));
    setDevTools(tools.filter(t => ['Developer Tools', 'Data Tools'].includes(t.category)).slice(0, 3));
    setProTools(tools.filter(t => ['PDF & Documents', 'Image Tools', 'Video Tools'].includes(t.category)).slice(0, 3));
    setEveryoneTools(tools.filter(t => t.type === 'Free').slice(0, 3));
  }, [tools]);

  // Automatic step cycler
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveStep(prev => (prev === 3 ? 1 : (prev + 1) as any));
    }, 6000);
    return () => clearInterval(interval);
  }, [isHovered]);

  // Entrance animations
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      if (prefersReduced) {
        if (headlineRef.current) {
          gsap.set(headlineRef.current.querySelectorAll('.word-reveal'), { y: 0, opacity: 1 });
        }
        if (subRef.current) gsap.set(subRef.current, { y: 0, opacity: 1 });
        if (ctaRef.current) gsap.set(ctaRef.current, { scale: 1, opacity: 1 });
        gsap.set('.floating-chip', { scale: 1, opacity: 1 });
        return;
      }

      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll('.word-reveal');
        tl.fromTo(words, 
          { y: 80, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: 'power4.out' },
          0.1
        );
      }

      if (subRef.current) {
        tl.fromTo(subRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.4');
      }
      if (ctaRef.current) {
        tl.fromTo(ctaRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.5)' }, '-=0.3');
      }
      
      tl.fromTo('.floating-chip', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.04, duration: 0.6, ease: 'back.out(1.2)' }, '-=0.2');
    });

    return () => ctx.revert();
  }, [prefersReduced]);

  const filteredCategories = categoryCards.filter(c => c.name !== 'All Tools').slice(0, 4);

  return (
    <div className="bg-white min-h-screen text-neutral-900 font-sans selection:bg-neutral-900 selection:text-white">
      
      {/* SECTION 1 — HERO SECTION */}
      <section className="relative pt-36 md:pt-48 pb-28 px-6 md:px-12 flex flex-col items-center justify-center text-center overflow-hidden bg-white select-none">
        
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-[10%] -left-[10%] w-[45%] h-[45%] rounded-full bg-purple-300/25 blur-[100px]" />
          <div className="absolute top-[30%] -right-[10%] w-[55%] h-[55%] rounded-full bg-purple-400/15 blur-[120px]" />
        </div>

        {/* Floating chips (decorative) */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none z-10">
          <FloatingHeroChip text="✂️ Crop Image" top="20%" left="12%" rotate="-12" speed="3.2" />
          <FloatingHeroChip text="⚙️ JSON Formatter" top="28%" right="10%" rotate="8" speed="2.8" />
          <FloatingHeroChip text="📦 Compress PDF" bottom="24%" left="15%" rotate="6" speed="3.5" />
          <FloatingHeroChip text="🎶 Audio Extraction" bottom="18%" right="15%" rotate="-6" speed="3.1" />
        </div>

        {/* Main Content Box */}
        <div className="max-w-4xl flex flex-col items-center relative z-10">
          
          <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 px-4 py-2 rounded-full text-purple-700 font-extrabold text-xs uppercase mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" /> Free & Server-Processed
          </div>

          {/* Cinematic Headline */}
          <h1 ref={headlineRef} className="font-display text-5xl md:text-8xl font-black tracking-tight leading-none text-[#0F0A1E] mb-8 select-none">
            <span className="inline-block overflow-hidden py-1">
              <span className="word-reveal inline-block origin-bottom-left">Every</span>
            </span>{' '}
            <span className="inline-block overflow-hidden py-1">
              <span className="word-reveal inline-block text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-500 font-black">Tool</span>
            </span>{' '}
            <span className="inline-block overflow-hidden py-1">
              <span className="word-reveal inline-block origin-bottom-left">You'll</span>
            </span>{' '}
            <span className="inline-block overflow-hidden py-1">
              <span className="word-reveal inline-block origin-bottom-left">Ever</span>
            </span>{' '}
            <span className="inline-block overflow-hidden py-1">
              <span className="word-reveal inline-block origin-bottom-left text-[#0F0A1E]">Need.</span>
            </span>
          </h1>

          {/* Subheading */}
          <p ref={subRef} className="text-lg md:text-2xl text-neutral-500 max-w-2xl mb-12 leading-relaxed font-medium">
            Qofeno brings together powerful tools for PDFs, images, video, writing, code, and more — all server-processed, free to start, right in your browser.
          </p>

          {/* CTA Group */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center gap-4 z-20">
            <button 
              onClick={() => onNavigate('tools')}
              className="w-full sm:w-auto px-8 py-4.5 bg-gradient-to-r from-purple-600 to-violet-500 text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-purple-500/30 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
            >
              Explore Tools
              <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => onNavigate('pricing')}
              className="w-full sm:w-auto px-8 py-4.5 bg-white border border-neutral-200 text-neutral-800 rounded-2xl font-bold text-lg hover:bg-neutral-50 hover:shadow-xl hover:shadow-neutral-200/50 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              View Pricing
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2 — WHAT IS QOFENO */}
      <section ref={trustBarRef} className="py-24 border-t border-b border-purple-50 bg-[#FAFAFA] relative z-20">
        <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-black text-[#0F0A1E] mb-6">One place. Hundreds of tools.</h2>
          <p className="text-lg md:text-xl text-neutral-500 leading-relaxed mb-16 max-w-3xl mx-auto font-medium">
            Qofeno is a growing collection of free online tools. Every tool runs on our servers — you upload, we process, you download. Your files are never stored permanently.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4 relative mb-12">
            <div className="hidden md:block absolute top-1/2 left-[20%] right-[20%] h-0.5 border-t-2 border-dashed border-neutral-350 -z-10" />
            
            <div className="flex flex-col items-center bg-white p-6 rounded-3xl z-10 w-48 shadow-xl shadow-purple-900/5 border border-neutral-100">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <span className="font-bold text-[#0F0A1E]">1. Upload</span>
            </div>

            <div className="flex flex-col items-center bg-purple-600 text-white p-6 rounded-3xl z-10 w-48 shadow-2xl shadow-purple-600/20">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4 animate-[spin_6s_linear_infinite]">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <span className="font-bold">2. Server processes</span>
            </div>

            <div className="flex flex-col items-center bg-white p-6 rounded-3xl z-10 w-48 shadow-xl shadow-purple-900/5 border border-neutral-100">
              <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <span className="font-bold text-[#0F0A1E]">3. Download</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-white border border-neutral-200 px-4 py-2 rounded-full text-neutral-600 font-bold text-xs shadow-sm">
            🔒 Files are deleted from our servers after processing
          </div>
        </div>
      </section>

      {/* SECTION 3 — CATEGORIES SHOWCASE */}
      <section id="tools-showcase" className="py-28 px-6 md:px-12 bg-white relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="font-display text-3xl md:text-6xl font-bold tracking-tight text-[#0F0A1E] mb-6">Tools for every kind of task</h2>
            <p className="text-lg md:text-xl text-neutral-500 font-medium">New tools added regularly. Whatever you're building or fixing, there's a tool for it.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-medium">
            {filteredCategories.map((cat, idx) => {
              const meta = CATEGORY_META[cat.name] || { icon: faWandMagicSparkles, color: 'bg-purple-50 text-purple-650' };
              const IconComp = meta.icon;
              const catTools = tools.filter(t => t.category === cat.name).slice(0, 3);
              return (
                <div
                  key={idx}
                  onClick={() => {
                    localStorage.setItem('selected_category_filter', cat.name);
                    onNavigate('tools');
                  }}
                  className="group relative bg-[#FAFAFA] border border-neutral-100 hover:border-purple-200/60 p-6 rounded-3xl cursor-pointer hover:bg-white transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-purple-500/5"
                >
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300", meta.color)}>
                    <FontAwesomeIcon icon={IconComp} className="w-7 h-7" />
                  </div>
                  <div className="absolute top-6 right-6">
                    <span className="bg-purple-100/40 text-purple-700 text-xs font-bold px-2.5 py-1 rounded-full">
                      {cat.count} tools
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#0F0A1E] mb-2">{cat.name}</h3>
                  
                  {/* Popular tools previews */}
                  <div className="mt-4 flex flex-col gap-2">
                    <span className="text-xs text-neutral-400 uppercase font-black tracking-wider">Top Tools</span>
                    <div className="flex flex-wrap gap-1.5">
                      {catTools.map((t, i) => (
                        <span key={i} className="bg-white group-hover:bg-purple-50/50 text-neutral-600 group-hover:text-purple-900 border border-neutral-100 rounded-lg text-xs py-1 px-2 font-semibold">
                          {t.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center text-purple-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                    Explore inside <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS INTERACTIVE DEMO */}
      <section 
        className="py-24 px-6 md:px-12 bg-neutral-50 relative z-20"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Interactive Steps Left */}
          <div className="flex flex-col justify-center select-none">
            <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-full text-purple-700 font-bold text-xs uppercase mb-6 w-fit">
              <FontAwesomeIcon icon={faBolt} className="w-3.5 h-3.5 text-pink-500 fill-pink-500 animate-pulse" /> Let's get things done
            </div>
            <h2 className="font-display text-3xl md:text-6xl font-black text-[#0F0A1E] tracking-tight mb-6">How Qofeno Works</h2>
            <p className="text-lg text-neutral-500 max-w-md mb-8 font-medium">
              We focus on removing complexity. Click any step to inspect the interactive mockup.
            </p>

            <div className="relative border-l-2 border-neutral-200 pl-6 flex flex-col gap-6">
              {[
                { step: 1 as const, title: "1. Find your tool", desc: "Search by keyword or select structured categories. No login credentials required to start." },
                { step: 2 as const, title: "2. Upload your file", desc: "Drag and drop payloads securely. The execution is processed on dedicated server-side engines." },
                { step: 3 as const, title: "3. Download your result", desc: "Download the converted package instantly. Inputs are systematically purged from cache databases." }
              ].map(item => (
                <div 
                  key={item.step}
                  onClick={() => { setActiveStep(item.step); setIsHovered(true); }}
                  className={cn(
                    "relative pl-6 py-4 rounded-2xl cursor-pointer transition-all duration-300",
                    activeStep === item.step ? "bg-white border-l-4 border-purple-650 shadow-sm" : "bg-transparent border-l-4 border-transparent hover:bg-neutral-100/50"
                  )}
                >
                  <h3 className="font-black text-lg text-[#0F0A1E] mb-1">{item.title}</h3>
                  <p className="text-neutral-500 text-xs font-semibold leading-relaxed max-w-md">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Mockup Display Box Right */}
          <div className="bg-white border border-neutral-200/80 p-8 rounded-3xl shadow-xl shadow-purple-900/5 aspect-video flex flex-col justify-center items-center relative overflow-hidden min-h-[300px]">
            <div className="absolute inset-0 bg-[radial-gradient(#7c3aed0a_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />
            <AnimatePresence mode="wait">
              {activeStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full flex justify-center"
                >
                  <SearchTypingDemo />
                </motion.div>
              )}
              {activeStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full flex justify-center"
                >
                  <UploadProgressDemo />
                </motion.div>
              )}
              {activeStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full flex justify-center"
                >
                  <DownloadSuccessDemo />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </section>

      {/* SECTION 5 — HORIZONTAL CARDS */}
      <section className="py-28 px-6 md:px-12 bg-white relative z-20 border-b border-purple-50 overflow-hidden select-none">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div>
              <h2 className="font-display text-3xl md:text-6xl font-black text-[#0F0A1E]">This week's most-used tools</h2>
              <p className="text-lg text-neutral-500 mt-2 font-medium">The standard benchmarks used millions of times daily. Try for free.</p>
            </div>
            <button 
              onClick={() => onNavigate('tools')}
              className="text-purple-600 font-bold hover:text-purple-800 flex items-center gap-1 shrink-0 text-base cursor-pointer"
            >
              See all tools <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-thin">
            {featuredTools.map((tool, index) => {
              const ToolIcon = tool.icon;
              return (
                <div key={index} className="w-[320px] shrink-0 bg-[#FAFAFA] border border-neutral-100 hover:border-purple-200 hover:bg-white p-6 rounded-3xl snap-start flex flex-col justify-between transition-all duration-300">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-6">
                      <FontAwesomeIcon icon={ToolIcon} className="w-6 h-6 text-purple-600 animate-pulse" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 bg-neutral-100 py-1 px-2.5 rounded-full inline-block mb-3">
                      {tool.category}
                    </span>
                    <h3 className="text-lg font-bold text-[#0F0A1E] mb-2">{tool.name}</h3>
                    <p className="text-sm text-neutral-500 mb-6 leading-relaxed font-semibold">{tool.desc}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                    <button 
                      onClick={() => {
                        localStorage.setItem('selected_tool_id', tool.id);
                        onNavigate('tool');
                      }}
                      className="text-purple-600 font-bold text-xs flex items-center hover:translate-x-1 transition-transform cursor-pointer"
                    >
                      Try Free →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 6 — PERSONAS */}
      <section className="py-28 px-6 md:px-12 bg-[#FAFAFA] relative z-20 font-medium select-none">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-6xl font-bold tracking-tight text-[#0F0A1E] mb-6">Built for everyone</h2>
            <p className="text-lg text-neutral-500">Perfected settings matching students, developers, and office workgroups.</p>
          </div>

          <div className="flex justify-center flex-wrap gap-2 mb-12">
            {PERSONAS.map(p => (
              <button
                key={p.id}
                onClick={() => setActivePersona(p.id)}
                className={cn(
                  "px-6 py-3 rounded-full font-bold text-sm transition-all duration-200 cursor-pointer",
                  activePersona === p.id 
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-600/20" 
                    : "bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-700"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="bg-white border border-neutral-250 rounded-3xl p-8 md:p-12 shadow-sm flex flex-col lg:flex-row gap-12 items-center">
            {PERSONAS.map((p) => {
              if (p.id !== activePersona) return null;
              
              const relativeTools = p.id === 'students' ? studentTools 
                                  : p.id === 'devs' ? devTools 
                                  : p.id === 'professionals' ? proTools 
                                  : everyoneTools;
                                  
              return (
                <div key={p.id} className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <h3 className="font-display text-2xl md:text-4xl font-extrabold text-[#0F0A1E] mb-4">{p.title}</h3>
                    <p className="text-lg text-neutral-500 leading-relaxed mb-8 font-medium">{p.desc}</p>
                    
                    {/* Real tools previews */}
                    <div className="mb-8 border-t border-neutral-100 pt-6">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-3">Popular tools in this segment:</span>
                      <div className="flex flex-wrap gap-2">
                        {relativeTools.length > 0 ? (
                          relativeTools.map((t, i) => (
                            <div 
                              key={i} 
                              onClick={() => {
                                localStorage.setItem('selected_tool_id', t.slug);
                                onNavigate('tool');
                              }}
                              className="px-3.5 py-2 bg-neutral-50 hover:bg-purple-50/30 hover:border-purple-200 border border-neutral-200 rounded-xl text-xs font-bold text-neutral-700 cursor-pointer transition-all"
                            >
                              {t.name}
                            </div>
                          ))
                        ) : (
                          <div className="h-6 w-32 bg-neutral-100 animate-pulse rounded-md"></div>
                        )}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        window.history.pushState({}, '', p.link);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="px-6 py-3.5 bg-neutral-900 hover:bg-black text-white text-xs font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
                    >
                      Find Segment Tools →
                    </button>
                  </div>
                  <div className={cn("relative aspect-video rounded-3xl overflow-hidden shadow-sm flex items-center justify-center border border-neutral-100", p.bgClass)}>
                    <div className="absolute inset-0 bg-[radial-gradient(black_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] pointer-events-none" />
                    {p.icon && <FontAwesomeIcon icon={p.icon} className={cn("w-28 h-28 opacity-60 hover:scale-110 transition-transform duration-700", p.iconColor)} />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 7 — PRICING PREVIEW */}
      <section className="py-28 px-6 md:px-12 bg-white relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-black text-[#0F0A1E] mb-6">Free to start. Upgrade when you need more.</h2>
            <p className="text-lg text-neutral-500 font-medium">Core tools are completely free. Pro unlocks maximum bandwidth capacity.</p>
          </div>

          {/* Pricing Toggle */}
          <div className="flex justify-center items-center gap-3.5 mb-16">
            <span className={cn("text-xs font-black uppercase tracking-wider", !pricingYearly ? "text-neutral-900" : "text-neutral-400")}>Monthly</span>
            <button 
              type="button"
              onClick={() => setPricingYearly(!pricingYearly)}
              className="w-12 h-6 rounded-full bg-purple-650 relative transition-all duration-300 cursor-pointer"
            >
              <div className={cn("w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300", pricingYearly ? "translate-x-7" : "translate-x-1")} />
            </button>
            <span className={cn("text-xs font-black uppercase tracking-wider flex items-center gap-1", pricingYearly ? "text-neutral-900" : "text-neutral-400")}>
              Yearly <span className="bg-pink-100 text-pink-700 text-[8px] font-black px-2 py-0.5 rounded">Save 40%</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch select-none font-medium">
            
            {/* FREE PLAN */}
            <div className="border border-neutral-250 bg-white p-8 rounded-3xl flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="font-display text-xl font-bold mb-2">Free</h3>
                <p className="text-xs text-neutral-400 mb-6 font-semibold">Always free for basic converting processes.</p>
                <div className="text-4xl font-black text-[#0F0A1E] mb-6">$0<span className="text-xs text-neutral-400 font-black uppercase tracking-wider ml-1">/ forever</span></div>
                <ul className="space-y-4 mb-8 text-sm text-neutral-600">
                  <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-purple-600 bg-purple-50 p-0.5 rounded" /> Access to {tools.filter(t => t.type === 'Free').length || 18} Free tools</li>
                  <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-purple-600 bg-purple-50 p-0.5 rounded" /> File uploads up to 50MB</li>
                  <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-purple-600 bg-purple-50 p-0.5 rounded" /> Secure cache processing</li>
                </ul>
              </div>
              <button onClick={() => onNavigate('tools')} className="w-full py-3.5 rounded-xl border border-purple-200 text-purple-700 font-extrabold text-xs uppercase tracking-wider hover:bg-purple-50 transition-colors cursor-pointer">
                Start for Free
              </button>
            </div>

            {/* PRO PLAN */}
            <div className="relative group rounded-3xl transform scale-105 shadow-2xl shadow-purple-500/10">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-650 rounded-[26px] opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 blur-[2px]"></div>
              <div className="relative border border-purple-200 bg-white p-8 rounded-3xl flex flex-col justify-between h-full shadow-sm">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md">
                  Most Popular
                </div>
                <div>
                  <h3 className="font-display text-xl font-black mb-2 text-purple-900">Pro</h3>
                  <p className="text-xs text-neutral-400 mb-6 font-semibold">Billed for individual utility volume creators.</p>
                  <div className="text-4xl font-black text-[#0F0A1E] mb-6">${pricingYearly ? "5.40" : "9.00"}<span className="text-xs text-neutral-450 font-black uppercase tracking-wider ml-1">/ mo</span></div>
                  <ul className="space-y-4 mb-8 text-sm text-[#0F0A1E]">
                    <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4.5 h-4.5 text-purple-700 bg-purple-50 p-0.5 rounded" /> Everything in Free</li>
                    <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4.5 h-4.5 text-purple-700 bg-purple-50 p-0.5 rounded" /> All tools unlocked ({tools.length} tools)</li>
                    <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4.5 h-4.5 text-purple-700 bg-purple-50 p-0.5 rounded" /> Files up to 500MB + priority</li>
                  </ul>
                </div>
                <button onClick={() => onNavigate('pricing')} className="w-full py-3.5 rounded-xl bg-purple-600 text-white font-extrabold text-xs uppercase tracking-wider hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/10 cursor-pointer">
                  Get Pro
                </button>
              </div>
            </div>

            {/* TEAMS PLAN */}
            <div className="border border-neutral-800 bg-[#0F0A1E] text-white p-8 rounded-3xl flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="font-display text-xl font-bold mb-2">Teams</h3>
                <p className="text-xs text-neutral-450 mb-6 font-semibold">Shared logs & priority seats for workgroups.</p>
                <div className="text-4xl font-black mb-6">${pricingYearly ? "12.00" : "19.00"}<span className="text-xs text-neutral-400 font-black uppercase tracking-wider ml-1">/ mo</span></div>
                <ul className="space-y-4 mb-8 text-sm text-neutral-300">
                  <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4.5 h-4.5 text-green-400 bg-green-950/20 p-0.5 rounded" /> Up to 5 team members</li>
                  <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4.5 h-4.5 text-green-400 bg-green-950/20 p-0.5 rounded" /> Files up to 1GB per session</li>
                  <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4.5 h-4.5 text-green-400 bg-green-950/20 p-0.5 rounded" /> Shared tool history</li>
                </ul>
              </div>
              <button 
                onClick={() => {
                  window.history.pushState({}, '', `/checkout/pro?plan=teams`);
                  window.dispatchEvent(new PopStateEvent('popstate'));
                }} 
                className="w-full py-3.5 rounded-xl bg-white text-[#0F0A1E] font-extrabold text-xs uppercase tracking-wider hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Start Teams Plan
              </button>
            </div>
          </div>
          <div className="text-center mt-12">
            <button onClick={() => onNavigate('pricing')} className="text-purple-650 font-bold hover:text-purple-800 hover:underline cursor-pointer">
              See full pricing details →
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 8 — BUILT BY */}
      <section className="py-28 px-6 md:px-12 bg-[#FAFAFA] relative z-20 border-t border-purple-50">
        <div className="max-w-4xl mx-auto text-center font-medium">
          <div className="w-20 h-20 bg-purple-100 text-purple-700 rounded-full font-black text-2xl flex items-center justify-center mx-auto mb-6">MZ</div>
          <h2 className="font-display text-3xl md:text-5xl font-black text-[#0F0A1E] mb-6">Built with care, one tool at a time</h2>
          <p className="text-lg md:text-xl text-neutral-500 leading-relaxed mb-10 max-w-2xl mx-auto font-medium">
            Qofeno is designed and developed by Mohd Zaheer Uddin. Every tool is tested and built to actually work. If you have a suggestion or found something broken, I'd love to hear from you.
          </p>
          <button 
            onClick={() => onNavigate('contact')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#0F0A1E] text-white font-bold rounded-2xl hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Say hello <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* SECTION 9 — TOOL GROWTH TRACKER */}
      <section className="py-24 bg-[#140F26] text-white text-center relative z-20 border-t border-purple-950/20">
        <div className="max-w-4xl mx-auto px-6 font-medium">
          <h2 className="font-display text-3xl md:text-5xl font-black mb-4 tracking-tight">We're building something big.</h2>
          <p className="text-purple-300 font-bold mb-12 text-lg">New tools are added every week. Here's where we are.</p>
          
          <div className="w-full max-w-xl mx-auto bg-neutral-800 h-4 rounded-full overflow-hidden mb-6 relative">
            <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-[25%]" />
          </div>
          <div className="flex justify-between max-w-xl mx-auto text-neutral-400 text-sm font-semibold mb-12">
            <span>Currently: {tools.length} tools</span>
            <span>Goal: 500 tools by end of year</span>
          </div>

          <button 
            onClick={() => onNavigate('contact')}
            className="px-8 py-4 bg-purple-650 hover:bg-purple-500 active:scale-95 transition-transform text-white rounded-2xl font-bold cursor-pointer"
          >
            Request a tool →
          </button>
        </div>
      </section>

      {/* SECTION 10 — CTA BANNER */}
      <section className="py-28 bg-gradient-to-br from-purple-900 to-[#2B1B54] text-white relative z-20 overflow-hidden border-t border-purple-950/20">
        <div className="absolute inset-0 pointer-events-none -z-10">
           <FontAwesomeIcon icon={faFileLines} className="absolute top-10 left-[10%] w-24 h-24 text-white opacity-5" />
           <FontAwesomeIcon icon={faImage} className="absolute bottom-10 right-[15%] w-32 h-32 text-white opacity-5" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl md:text-7xl font-extrabold mb-8 tracking-tight leading-none">Start using Qofeno today</h2>
          <p className="text-lg md:text-xl text-purple-200/90 max-w-xl mx-auto mb-12 font-medium">Free tools. No signup. No friction.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => onNavigate('tools')}
              className="px-8 py-4 bg-white text-purple-900 font-bold text-lg rounded-2xl hover:bg-purple-100 transition-colors cursor-pointer"
            >
              Explore All Tools
            </button>
            <button 
              onClick={() => onNavigate('pricing')}
              className="px-8 py-4 bg-transparent border border-white/20 text-white hover:border-white font-bold text-lg rounded-2xl transition-colors cursor-pointer"
            >
              View Pricing
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}

// Subordinate floating chips animations
interface FloatingChipProps {
  text: string;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  rotate: string;
  speed: string;
}

function FloatingHeroChip({ text, top, left, right, bottom, rotate, speed }: FloatingChipProps) {
  const chipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    gsap.to(chipRef.current, {
      y: '+=14',
      duration: parseFloat(speed),
      repeat: -1,
      yoyo: true,
      ease: 'sine.inOut'
    });
  }, [speed]);

  return (
    <div 
      ref={chipRef} 
      style={{ top, left, right, bottom, transform: `rotate(${rotate}deg)` }}
      className="floating-chip absolute bg-white shadow-2xl shadow-purple-500/10 border border-purple-100 px-4 py-2 rounded-2xl flex items-center gap-2 font-semibold text-[#0F0A1E] text-xs pointer-events-auto select-none"
    >
      {text}
    </div>
  );
}
