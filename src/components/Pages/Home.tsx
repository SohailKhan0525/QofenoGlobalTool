import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowRight, faMagnifyingGlass, faChevronRight, faCircleCheck, 
  faBolt, faSliders, faMusic, faFileLines, faImage, faVideo, 
  faCode, faChartColumn, faGraduationCap, faWandMagicSparkles, 
  faMicrochip, faHeart, faUsers, faStar, faPenNib, faUpload, faDownload, faGear
} from '@fortawesome/free-solid-svg-icons';
import { useToolCatalog, FALLBACK_TOOLS } from '../../lib/toolCatalog';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { databases, DATABASE_ID } from '../../lib/qofeno-appwrite';
import { Query } from 'appwrite';

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

// Interactive Typing demo subcomponent with multi-phrase loop
function SearchTypingDemo() {
  const [text, setText] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [phraseIdx, setPhraseIdx] = useState(0);

  const phrases = [
    'compress pdf',
    'png to webp converter',
    'format json payload',
    'merge pdf documents'
  ];

  const currentPhrase = phrases[phraseIdx % phrases.length];

  useEffect(() => {
    let active = true;
    let isDeleting = false;
    let charIndex = 0;
    let timer: any = null;

    const tick = () => {
      if (!active) return;

      if (!isDeleting) {
        // Typing
        if (charIndex <= currentPhrase.length) {
          setText(currentPhrase.substring(0, charIndex));
          charIndex++;
          if (charIndex > currentPhrase.length) {
            setShowResults(true);
            timer = setTimeout(() => {
              isDeleting = true;
              setShowResults(false);
              tick();
            }, 1800);
            return;
          }
          timer = setTimeout(tick, 70);
        }
      } else {
        // Deleting
        if (charIndex > 0) {
          charIndex--;
          setText(currentPhrase.substring(0, charIndex));
          timer = setTimeout(tick, 35);
        } else {
          isDeleting = false;
          setPhraseIdx(prev => prev + 1);
          timer = setTimeout(tick, 300);
        }
      }
    };

    timer = setTimeout(tick, 200);

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, [phraseIdx]);

  const results = [
    { id: 1, name: currentPhrase.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '), desc: 'Fast, secure server processing' },
    { id: 2, name: 'PDF Tools', desc: 'Merge, split & compress PDFs' },
    { id: 3, name: 'Format & Convert', desc: 'Clean, optimize & export files' }
  ];

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-neutral-100 p-5 flex flex-col gap-4 min-h-[250px] justify-center font-sans">
      <div className="flex items-center gap-3 bg-neutral-50 px-4 py-3 rounded-xl border border-neutral-200 shadow-inner">
        <FontAwesomeIcon icon={faMagnifyingGlass} className="text-purple-600 w-4 h-4 animate-pulse" />
        <span className="text-sm font-bold text-neutral-800 flex-1 font-mono tracking-tight">{text}</span>
        <span className="w-0.5 h-4 bg-purple-600 animate-[ping_1s_infinite]" />
      </div>
      <div className="flex flex-col gap-2 flex-1 justify-center min-h-[140px]">
        {showResults ? (
          results.map((r, idx) => (
            <motion.div 
              key={`${r.id}-${phraseIdx}`}
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: idx * 0.1, duration: 0.25 }}
              className={cn(
                "border rounded-xl p-3 flex items-center justify-between transition-all",
                r.id === 1 
                  ? "bg-purple-50/70 border-purple-500 shadow-sm ring-1 ring-purple-200" 
                  : "bg-white border-neutral-150"
              )}
            >
              <div>
                <h4 className={cn("font-extrabold text-xs", r.id === 1 ? "text-purple-900" : "text-neutral-700")}>{r.name}</h4>
                <p className="text-[9px] text-neutral-400 mt-0.5 font-medium">{r.desc}</p>
              </div>
              <span className={cn(
                "text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider",
                r.id === 1 ? "bg-purple-600 text-white shadow-sm" : "bg-neutral-100 text-neutral-500"
              )}>
                {r.id === 1 ? 'Selected' : 'Open'}
              </span>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-neutral-400 gap-2">
            <span className="text-xs font-semibold">Searching Qofeno tools...</span>
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Upload progress simulation subcomponent with rich looping animation
function UploadProgressDemo() {
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState<'uploading' | 'processing' | 'done'>('uploading');

  useEffect(() => {
    let active = true;
    let timer: any = null;

    const runCycle = () => {
      if (!active) return;
      setProgress(0);
      setStage('uploading');

      let currentProgress = 0;
      const interval = setInterval(() => {
        if (!active) {
          clearInterval(interval);
          return;
        }
        currentProgress += 12;
        if (currentProgress >= 100) {
          currentProgress = 100;
          setProgress(100);
          clearInterval(interval);
          setStage('processing');

          timer = setTimeout(() => {
            if (!active) return;
            setStage('done');
            timer = setTimeout(() => {
              if (active) runCycle();
            }, 2500);
          }, 2000);
        } else {
          setProgress(currentProgress);
        }
      }, 120);
    };

    runCycle();

    return () => {
      active = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-neutral-100 p-5 flex flex-col justify-center items-center gap-4 min-h-[250px] font-sans">
      <div className="w-full border-2 border-dashed border-purple-200 rounded-2xl p-6 flex flex-col items-center justify-center relative bg-purple-50/20 overflow-hidden">
        {stage === 'uploading' && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col items-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
              className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center border border-purple-200 mb-4 shadow-sm"
            >
              <FontAwesomeIcon icon={faUpload} className="w-6 h-6" />
            </motion.div>
            
            <div className="w-full">
              <div className="flex justify-between text-[11px] font-extrabold text-neutral-600 mb-1.5 px-1">
                <span>annual_report.pdf</span>
                <span className="text-purple-600">{progress}%</span>
              </div>
              <div className="w-full bg-neutral-200 rounded-full h-2.5 overflow-hidden p-0.5">
                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-full rounded-full transition-all duration-150" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-[10px] text-neutral-400 font-semibold text-center mt-2">
                Uploading {Math.round((progress / 100) * 2.4 * 10) / 10} MB / 2.4 MB...
              </p>
            </div>
          </motion.div>
        )}

        {stage === 'processing' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-2 text-center"
          >
            <div className="relative w-14 h-14 mb-4 flex items-center justify-center">
              <FontAwesomeIcon icon={faGear} className="text-purple-600 w-12 h-12 animate-spin" style={{ animationDuration: '4s' }} />
              <FontAwesomeIcon icon={faGear} className="text-pink-500 w-6 h-6 absolute -bottom-1 -right-1 animate-[spin_2s_linear_infinite_reverse]" />
            </div>
            <h4 className="font-extrabold text-neutral-900 text-sm">Server Processing...</h4>
            <p className="text-[10px] text-purple-600 font-semibold mt-1 bg-purple-50 px-3 py-1 rounded-full border border-purple-100 animate-pulse">
              ⚡ Executing compression algorithm
            </p>
          </motion.div>
        )}

        {stage === 'done' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center py-2 text-center"
          >
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 shadow-md">
              <FontAwesomeIcon icon={faCircleCheck} className="w-6 h-6" />
            </div>
            <h4 className="font-extrabold text-neutral-900 text-sm">Processing Complete!</h4>
            <p className="text-[10px] text-emerald-600 font-bold mt-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Done in 0.8 seconds
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

// Success Check & Confetti simulation subcomponent with looping celebration
function DownloadSuccessDemo() {
  const [particles, setParticles] = useState<any[]>([]);
  const [downloaded, setDownloaded] = useState(false);

  useEffect(() => {
    let active = true;

    const generateParticles = () => {
      if (!active) return;
      setDownloaded(false);
      const list = Array.from({ length: 24 }).map((_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 160,
        y: (Math.random() - 0.5) * 160,
        color: ['bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-yellow-400', 'bg-emerald-500', 'bg-indigo-500'][i % 6],
        scale: Math.random() * 0.8 + 0.4,
        delay: Math.random() * 0.3
      }));
      setParticles(list);
    };

    generateParticles();
    const interval = setInterval(generateParticles, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-neutral-100 p-5 flex flex-col justify-center items-center gap-4 min-h-[250px] relative overflow-hidden font-sans">
      {particles.map(p => (
        <motion.div
          key={p.id}
          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
          animate={{ opacity: 0, scale: p.scale, x: p.x, y: p.y }}
          transition={{ duration: 1.6, delay: p.delay, ease: "easeOut" }}
          className={`absolute w-2 h-2 rounded-full ${p.color} z-0 pointer-events-none`}
        />
      ))}
      
      <motion.div 
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1.2, 1] }}
        transition={{ duration: 0.5, ease: "backOut" }}
        className="w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 border border-emerald-200 shadow-lg shadow-emerald-100 z-10"
      >
        <FontAwesomeIcon icon={faCircleCheck} className="w-8 h-8 text-emerald-600" />
      </motion.div>
      
      <div className="text-center w-full z-10 space-y-1">
        <h4 className="font-extrabold text-neutral-900 text-base">Ready for Download!</h4>
        <div className="flex items-center justify-center gap-3 text-xs font-extrabold mt-2">
          <span className="text-neutral-400 line-through">2.4 MB</span>
          <span className="text-purple-600 font-bold">→</span>
          <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">0.8 MB (66% smaller)</span>
        </div>
      </div>

      <motion.button 
        whileTap={{ scale: 0.95 }}
        onClick={() => setDownloaded(true)}
        className={cn(
          "w-full py-3.5 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all cursor-pointer z-10 flex items-center justify-center gap-2",
          downloaded
            ? "bg-purple-700 shadow-purple-500/30"
            : "bg-gradient-to-r from-emerald-500 to-teal-600 shadow-emerald-500/20 hover:shadow-emerald-500/30"
        )}
      >
        <FontAwesomeIcon icon={downloaded ? faCircleCheck : faDownload} className={cn("w-4 h-4", !downloaded && "animate-bounce")} />
        {downloaded ? 'Downloaded Successfully!' : 'Download Compressed PDF'}
      </motion.button>
    </div>
  );
}

export function Home({ onNavigate, onRequestTool }: HomeProps) {
  const { tools, featuredTools, categoryCards } = useToolCatalog();
  const activeTools = tools.filter(t => !t.is_coming_soon);
  const fallbackActiveTools = FALLBACK_TOOLS.filter(t => !t.is_coming_soon);
  const freeCount = activeTools.filter(t => t.type === 'Free').length || fallbackActiveTools.filter(t => t.type === 'Free').length;
  const totalCount = activeTools.length || fallbackActiveTools.length;
  const [activePersona, setActivePersona] = useState('students');
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [isHovered, setIsHovered] = useState(false);
  const [pricingYearly, setPricingYearly] = useState(false);

  // Dynamic Real-time Most Used Tools
  const [liveTopTools, setLiveTopTools] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;
    async function fetchTopUsedTools() {
      try {
        const resp = await databases.listDocuments(DATABASE_ID, 'tool_views', [
          Query.orderDesc('count'),
          Query.limit(8)
        ]);
        if (cancelled || !resp?.documents?.length) return;
        const topSlugs = resp.documents.map((d: any) => d.tool_slug);
        const matched = topSlugs.map(slug => tools.find(t => t.slug === slug || t.id === slug)).filter(Boolean);
        if (matched.length > 0) {
          setLiveTopTools(matched);
        }
      } catch {
        // Keep fallback
      }
    }
    void fetchTopUsedTools();
    return () => { cancelled = true; };
  }, [tools]);

  const displayFeatured = liveTopTools.length > 0 ? liveTopTools : featuredTools;

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

  // Automatic step cycler for How It Works Interactive Demo
  useEffect(() => {
    if (isHovered) return;
    const interval = setInterval(() => {
      setActiveStep(prev => (prev === 3 ? 1 : (prev + 1) as any));
    }, 6000);
    return () => clearInterval(interval);
  }, [isHovered]);

  // Entrance animations via GSAP
  useEffect(() => {
    let ctx: any;
    import('gsap').then(({ default: gsap }) => {
      ctx = gsap.context(() => {
        const tl = gsap.timeline();

        if (headlineRef.current) {
          const words = headlineRef.current.querySelectorAll('.word-reveal');
          tl.fromTo(words, 
            { y: 80, opacity: 0 }, 
            { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power4.out' },
            0.1
          );
        }

        if (subRef.current) {
          tl.fromTo(subRef.current, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' }, '-=0.4');
        }
        if (ctaRef.current) {
          tl.fromTo(ctaRef.current, { scale: 0.85, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.7, ease: 'back.out(1.5)' }, '-=0.3');
        }
        
        tl.fromTo('.floating-chip', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.08, duration: 0.7, ease: 'back.out(1.4)' }, '-=0.2');
      });
    });

    return () => {
      if (ctx) ctx.revert();
    };
  }, []);

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

        {/* Floating chips */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none z-10">
          <FloatingHeroChip text="✂️ Crop Image" top="20%" left="12%" rotate="-12" speed="3.2" />
          <FloatingHeroChip text="⚙️ JSON Formatter" top="28%" right="10%" rotate="8" speed="2.8" />
          <FloatingHeroChip text="📦 Compress PDF" bottom="24%" left="15%" rotate="6" speed="3.5" />
          <FloatingHeroChip text="🎶 Audio Extraction" bottom="18%" right="15%" rotate="-6" speed="3.1" />
        </div>

        {/* Main Content Box */}
        <div className="max-w-4xl flex flex-col items-center relative z-10">
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 px-4 py-2 rounded-full text-purple-700 font-extrabold text-xs uppercase mb-8 shadow-sm"
          >
            <span className="w-2 h-2 rounded-full bg-purple-600 animate-pulse" /> Free & Server-Processed
          </motion.div>

          {/* Headline */}
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

      {/* SECTION 2 — HOW IT WORKS */}
      <section ref={trustBarRef} className="py-24 border-t border-b border-purple-50 bg-[#FAFAFA] relative z-20 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <span className="text-xs uppercase tracking-widest font-black text-purple-600 bg-purple-100/60 px-3.5 py-1.5 rounded-full inline-block mb-4">
              Simple 3-Step Process
            </span>
            <h2 className="font-display text-3xl md:text-5xl font-black text-[#0F0A1E] mb-6">How Qofeno Works</h2>
            <p className="text-lg md:text-xl text-neutral-500 leading-relaxed mb-16 max-w-3xl mx-auto font-medium">
              Every tool runs on ultra-fast servers — you upload, we process, you download. Your files are never stored permanently.
            </p>
          </motion.div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-6 relative mb-12">
            <div className="hidden md:block absolute top-1/2 left-[15%] right-[15%] h-1 bg-gradient-to-r from-purple-200 via-purple-500 to-emerald-300 -z-10 rounded-full opacity-60 animate-pulse" />
            
            {/* Step 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="flex flex-col items-center bg-white p-8 rounded-3xl z-10 w-full md:w-60 shadow-xl shadow-purple-900/5 border border-purple-100/80 transition-all cursor-pointer"
            >
              <div className="w-14 h-14 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <FontAwesomeIcon icon={faUpload} className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-purple-600 uppercase tracking-widest mb-1">Step 1</span>
              <span className="font-extrabold text-lg text-[#0F0A1E]">Upload File</span>
              <p className="text-xs text-neutral-400 mt-2 font-medium">Drag & drop or select from your device.</p>
            </motion.div>

            {/* Step 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.25 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="flex flex-col items-center bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 text-white p-8 rounded-3xl z-10 w-full md:w-60 shadow-2xl shadow-purple-600/30 transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-4 shadow-inner">
                <FontAwesomeIcon icon={faGear} className="w-6 h-6 text-white animate-spin" style={{ animationDuration: '8s' }} />
              </div>
              <span className="text-xs font-black text-purple-200 uppercase tracking-widest mb-1">Step 2</span>
              <span className="font-extrabold text-lg">Fast Processing</span>
              <p className="text-xs text-purple-100/80 mt-2 font-medium">Server processes in seconds.</p>
            </motion.div>

            {/* Step 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              whileHover={{ y: -6, scale: 1.02 }}
              className="flex flex-col items-center bg-white p-8 rounded-3xl z-10 w-full md:w-60 shadow-xl shadow-purple-900/5 border border-purple-100/80 transition-all cursor-pointer"
            >
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <FontAwesomeIcon icon={faDownload} className="w-6 h-6" />
              </div>
              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-1">Step 3</span>
              <span className="font-extrabold text-lg text-[#0F0A1E]">Download Result</span>
              <p className="text-xs text-neutral-400 mt-2 font-medium">Save your processed file instantly.</p>
            </motion.div>
          </div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="inline-flex items-center gap-2 bg-white border border-neutral-200 px-5 py-2.5 rounded-full text-neutral-700 font-bold text-xs shadow-md shadow-purple-900/5"
          >
            🔒 Files automatically deleted after download / 1 hour for free users
          </motion.div>
        </div>
      </section>

      {/* SECTION 3 — CATEGORIES SHOWCASE ("Tools for every kind of task") */}
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
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  whileHover={{ y: -8, scale: 1.02 }}
                  onClick={() => {
                    localStorage.setItem('selected_category_filter', cat.name);
                    onNavigate('tools');
                  }}
                  className="group relative bg-[#FAFAFA] border border-neutral-100 hover:border-purple-200/60 p-6 rounded-3xl cursor-pointer hover:bg-white transition-all duration-300 hover:shadow-xl hover:shadow-purple-500/5"
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
                </motion.div>
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
              <FontAwesomeIcon icon={faBolt} className="w-3.5 h-3.5 text-pink-500 fill-pink-500 animate-pulse" /> Interactive Demo
            </div>
            <h2 className="font-display text-3xl md:text-6xl font-black text-[#0F0A1E] tracking-tight mb-6">Experience Qofeno</h2>
            <p className="text-lg text-neutral-500 max-w-md mb-8 font-medium">
              Click any step to inspect the real-time mockup in action.
            </p>

            <div className="relative border-l-2 border-neutral-200 pl-6 flex flex-col gap-6">
              {[
                { step: 1 as const, icon: faMagnifyingGlass, title: "1. Find your tool", desc: "Search by name or browse by category" },
                { step: 2 as const, icon: faUpload, title: "2. Upload & Process", desc: "Drop your file — server processes in seconds" },
                { step: 3 as const, icon: faDownload, title: "3. Download Result", desc: "Ready instantly. File deleted after download." }
              ].map(item => (
                <div 
                  key={item.step}
                  onClick={() => { setActiveStep(item.step); setIsHovered(true); }}
                  className={cn(
                    "relative pl-6 py-4 rounded-2xl cursor-pointer transition-all duration-300 flex items-start gap-4",
                    activeStep === item.step ? "bg-white border-l-4 border-purple-600 shadow-md" : "bg-transparent border-l-4 border-transparent hover:bg-neutral-100/50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 border transition-all",
                    activeStep === item.step 
                      ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-200" 
                      : "bg-white text-neutral-400 border-neutral-200"
                  )}>
                    <FontAwesomeIcon icon={item.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className={cn(
                      "text-lg mb-1 transition-all",
                      activeStep === item.step ? "font-black text-[#0F0A1E]" : "font-semibold text-neutral-600"
                    )}>
                      {item.title}
                    </h3>
                    <p className="text-neutral-500 text-xs font-semibold leading-relaxed max-w-md">{item.desc}</p>
                  </div>
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

      {/* SECTION 5 — THIS WEEK'S MOST-USED TOOLS */}
      <section className="py-28 px-6 md:px-12 bg-white relative z-20 border-b border-purple-50 overflow-hidden select-none">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div>
              <h2 className="font-display text-3xl md:text-6xl font-black text-[#0F0A1E]">This week's most-used tools</h2>
              <p className="text-lg text-neutral-500 mt-2 font-medium">Dynamically updated live from processing metrics & active user usage.</p>
            </div>
            <button 
              onClick={() => onNavigate('tools')}
              className="text-purple-600 font-bold hover:text-purple-800 flex items-center gap-1 shrink-0 text-base cursor-pointer"
            >
              See all tools <FontAwesomeIcon icon={faChevronRight} className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-thin">
            {displayFeatured.map((tool, index) => {
              const ToolIcon = tool.icon || faWandMagicSparkles;
              return (
                <motion.div 
                  key={index} 
                  whileHover={{ y: -6, scale: 1.02 }}
                  className="w-[320px] shrink-0 bg-[#FAFAFA] border border-neutral-100 hover:border-purple-200 hover:bg-white p-6 rounded-3xl snap-start flex flex-col justify-between transition-all duration-300 shadow-sm"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-6">
                      <FontAwesomeIcon icon={ToolIcon} className="w-6 h-6 text-purple-600 animate-pulse" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 bg-neutral-100 py-1 px-2.5 rounded-full inline-block mb-3">
                      {tool.category || 'General'}
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
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 6 — PERSONAS ("Built for everyone") */}
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
                <motion.div 
                  key={p.id} 
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.4 }}
                  className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center"
                >
                  <div>
                    <h3 className="font-display text-2xl md:text-4xl font-extrabold text-[#0F0A1E] mb-4">{p.title}</h3>
                    <p className="text-lg text-neutral-500 leading-relaxed mb-8 font-medium">{p.desc}</p>
                    
                    <div className="mb-8 border-t border-neutral-100 pt-6">
                      <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-3">Popular tools in this segment:</span>
                      <div className="flex flex-wrap gap-2">
                        {relativeTools.length > 0 ? (
                          relativeTools.map((t, i) => (
                            <div 
                              key={i} 
                              onClick={() => {
                                localStorage.setItem('selected_tool_id', t.id);
                                onNavigate(`tool`);
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
                        onNavigate(p.link);
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
                </motion.div>
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
          <div className="flex justify-center items-center gap-3.5 mb-16 select-none">
            <span className={cn("text-xs font-black uppercase tracking-wider transition-colors", !pricingYearly ? "text-purple-600" : "text-neutral-400")}>Monthly</span>
            <button 
              type="button"
              onClick={() => setPricingYearly(!pricingYearly)}
              className="w-14 h-7 rounded-full bg-purple-600 relative transition-all duration-300 cursor-pointer shadow-inner p-1"
            >
              <motion.div 
                layout
                className="w-5 h-5 bg-white rounded-full shadow-md"
                animate={{ x: pricingYearly ? 28 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
              />
            </button>
            <span className={cn("text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-colors", pricingYearly ? "text-purple-600" : "text-neutral-400")}>
              Yearly <span className="bg-pink-100 text-pink-700 text-[9px] font-black px-2.5 py-0.5 rounded-full border border-pink-200">Save 40%</span>
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto items-stretch select-none font-medium">
            {/* FREE PLAN */}
            <motion.div 
              whileHover={{ y: -6 }}
              className="border border-neutral-250 bg-white p-8 rounded-3xl flex flex-col justify-between shadow-sm"
            >
              <div>
                <h3 className="font-display text-xl font-bold mb-2">Free</h3>
                <p className="text-xs text-neutral-400 mb-6 font-semibold">Always free for basic converting processes.</p>
                <div className="text-4xl font-black text-[#0F0A1E] mb-6">$0<span className="text-xs text-neutral-400 font-black uppercase tracking-wider ml-1">/ forever</span></div>
                <ul className="space-y-4 mb-8 text-sm text-neutral-600">
                  <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-purple-600 bg-purple-50 p-0.5 rounded" /> Access to {freeCount} Free tools</li>
                  <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-purple-600 bg-purple-50 p-0.5 rounded" /> File uploads up to 50MB</li>
                  <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-purple-600 bg-purple-50 p-0.5 rounded" /> Auto-deletes after download</li>
                </ul>
              </div>
              <button onClick={() => onNavigate('tools')} className="w-full py-3.5 rounded-xl border border-purple-200 text-purple-700 font-extrabold text-xs uppercase tracking-wider hover:bg-purple-50 transition-colors cursor-pointer">
                Start for Free
              </button>
            </motion.div>

            {/* PRO PLAN */}
            <motion.div 
              whileHover={{ y: -8 }}
              className="relative group rounded-3xl transform scale-105 shadow-2xl shadow-purple-500/10"
            >
              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-600 via-pink-500 to-purple-650 rounded-[26px] opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 blur-[2px]"></div>
              <div className="relative border border-purple-200 bg-white p-8 rounded-3xl flex flex-col justify-between h-full shadow-sm">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-[10px] font-black uppercase tracking-wider px-4 py-1.5 rounded-full shadow-md">
                  Most Popular
                </div>
                <div>
                  <h3 className="font-display text-xl font-black mb-2 text-purple-900">Pro</h3>
                  <p className="text-xs text-neutral-400 mb-6 font-semibold">Billed for individual utility creators.</p>
                  <div className="text-4xl font-black text-[#0F0A1E] mb-6">${pricingYearly ? "6.60" : "11.00"}<span className="text-xs text-neutral-450 font-black uppercase tracking-wider ml-1">/ mo</span></div>
                  <ul className="space-y-4 mb-8 text-sm text-[#0F0A1E]">
                    <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4.5 h-4.5 text-purple-700 bg-purple-50 p-0.5 rounded" /> Everything in Free</li>
                    <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4.5 h-4.5 text-purple-700 bg-purple-50 p-0.5 rounded" /> All tools unlocked ({totalCount} tools)</li>
                    <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4.5 h-4.5 text-purple-700 bg-purple-50 p-0.5 rounded" /> Files up to 500MB + Priority Queue</li>
                    <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4.5 h-4.5 text-purple-700 bg-purple-50 p-0.5 rounded" /> Inputs kept 6d • Results kept 7d</li>
                  </ul>
                </div>
                <button onClick={() => onNavigate('pricing')} className="w-full py-3.5 rounded-xl bg-purple-600 text-white font-extrabold text-xs uppercase tracking-wider hover:bg-purple-700 transition-colors shadow-md shadow-purple-500/10 cursor-pointer">
                  Get Pro
                </button>
              </div>
            </motion.div>

            {/* TEAMS PLAN */}
            <motion.div 
              whileHover={{ y: -6 }}
              className="border border-neutral-800 bg-[#0F0A1E] text-white p-8 rounded-3xl flex flex-col justify-between shadow-sm"
            >
              <div>
                <h3 className="font-display text-xl font-bold mb-2">Teams</h3>
                <p className="text-xs text-neutral-450 mb-6 font-semibold">Shared logs & priority seats for workgroups.</p>
                <div className="text-4xl font-black mb-6">${pricingYearly ? "11.40" : "19.00"}<span className="text-xs text-neutral-400 font-black uppercase tracking-wider ml-1">/ mo</span></div>
                <ul className="space-y-4 mb-8 text-sm text-neutral-300">
                  <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4.5 h-4.5 text-green-400 bg-green-950/20 p-0.5 rounded" /> Up to 5 team members</li>
                  <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4.5 h-4.5 text-green-400 bg-green-950/20 p-0.5 rounded" /> Files up to 1GB per session</li>
                  <li className="flex items-center gap-2.5"><FontAwesomeIcon icon={faCircleCheck} className="w-4.5 h-4.5 text-green-400 bg-green-950/20 p-0.5 rounded" /> Shared tool history & retention</li>
                </ul>
              </div>
              <button 
                onClick={() => {
                  onNavigate('/checkout/pro?plan=teams');
                }} 
                className="w-full py-3.5 rounded-xl bg-white text-[#0F0A1E] font-extrabold text-xs uppercase tracking-wider hover:bg-neutral-100 transition-colors cursor-pointer"
              >
                Start Teams Plan
              </button>
            </motion.div>
          </div>
          <div className="text-center mt-12">
            <button onClick={() => onNavigate('pricing')} className="text-purple-650 font-bold hover:text-purple-800 hover:underline cursor-pointer">
              See full pricing details →
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 8 — BUILT BY ("Built with care, one tool at a time") */}
      <section className="py-28 px-6 md:px-12 bg-[#FAFAFA] relative z-20 border-t border-purple-50">
        <div className="max-w-4xl mx-auto text-center font-medium">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            className="w-20 h-20 bg-gradient-to-tr from-purple-700 via-purple-600 to-fuchsia-500 text-white rounded-full font-black text-2xl flex flex-col items-center justify-center mx-auto mb-6 shadow-xl shadow-purple-500/20"
          >
            <span>MZ</span>
            <span className="text-[9px] text-purple-200 uppercase tracking-widest font-bold">Founder</span>
          </motion.div>
          <h2 className="font-display text-3xl md:text-5xl font-black text-[#0F0A1E] mb-6">Built with care, one tool at a time</h2>
          <p className="text-lg md:text-xl text-neutral-500 leading-relaxed mb-10 max-w-2xl mx-auto font-medium">
            Qofeno is designed and developed by Mohd Zaheer Uddin. Every tool is tested and built to actually work. If you have a suggestion or found something broken, I'd love to hear from you.
          </p>
          <button 
            onClick={() => onNavigate('contact')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#0F0A1E] text-white font-bold rounded-2xl hover:bg-neutral-800 transition-colors cursor-pointer shadow-lg"
          >
            Say hello <FontAwesomeIcon icon={faArrowRight} className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* SECTION 9 — TOOL GROWTH TRACKER ("We're building something big") */}
      <section className="py-24 bg-[#140F26] text-white text-center relative z-20 border-t border-purple-950/20">
        <div className="max-w-4xl mx-auto px-6 font-medium">
          <h2 className="font-display text-3xl md:text-5xl font-black mb-4 tracking-tight">We're building something big.</h2>
          <p className="text-purple-300 font-bold mb-12 text-lg">New tools are added every week. Here's where we are.</p>
          
          <div className="w-full max-w-xl mx-auto bg-neutral-800 h-4 rounded-full overflow-hidden mb-6 relative">
            <motion.div 
              initial={{ width: 0 }}
              whileInView={{ width: `${Math.min(100, Math.round((tools.length / 544) * 100))}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 rounded-full" 
            />
          </div>
          <div className="flex justify-between max-w-xl mx-auto text-neutral-400 text-sm font-semibold mb-12">
            <span>Currently: {tools.length} active tools</span>
            <span>Goal: 500+ tools benchmark</span>
          </div>

          <button 
            onClick={() => {
              if (onRequestTool) onRequestTool();
              else onNavigate('contact');
            }}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-500 active:scale-95 transition-transform text-white rounded-2xl font-bold cursor-pointer shadow-lg shadow-purple-600/30"
          >
            Request a tool →
          </button>
        </div>
      </section>

      {/* SECTION 10 — CTA BANNER ("Start using Qofeno today") */}
      <section className="py-28 bg-gradient-to-br from-purple-900 via-purple-950 to-[#2B1B54] text-white relative z-20 overflow-hidden border-t border-purple-950/20">
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
              className="px-8 py-4 bg-white text-purple-900 font-bold text-lg rounded-2xl hover:bg-purple-100 transition-colors cursor-pointer shadow-xl"
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
  const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <div 
      style={{ top, left, right, bottom, transform: `rotate(${rotate}deg)` }}
      className="floating-chip absolute pointer-events-none select-none z-10"
    >
      <div
        style={{ animationDuration: `${speed}s` }}
        className={cn(
          "bg-white shadow-2xl shadow-purple-500/10 border border-purple-100 px-4 py-2 rounded-2xl flex items-center gap-2 font-semibold text-[#0F0A1E] text-xs pointer-events-auto",
          !prefersReduced && "animate-[float_infinite_ease-in-out]"
        )}
      >
        {text}
      </div>
    </div>
  );
}
