import { useEffect, useRef, useState, useMemo } from 'react';
import { 
  FileText, Image as ImageIcon, Video, Cpu, Code2, Sparkles, 
  BarChart3, GraduationCap, Scale, ShieldAlert, Mail, Zap, 
  ChevronRight, ArrowRight, User, Laptop, Users, Calendar, 
  Search, ShieldCheck, Heart, Star, Plus, CheckCircle2, MessageSquare
} from 'lucide-react';
import gsap from 'gsap';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { SEO } from '../../components/SEO';

// Types and props
interface HomeProps {
  onNavigate: (page: string) => void;
  onRequestTool: () => void;
}


const CATEGORIES = [
  { icon: Code2, title: 'Developer Tools', count: 2, color: 'text-cyan-600 bg-cyan-50', tools: ['JSON Formatter', 'Base64 Encoder'] },
  { icon: Cpu, title: 'AI & Automation', count: 1, color: 'text-amber-600 bg-amber-50', tools: ['Text Counter'] }
];

const STORY_STEPS = [
  {
    title: "Find the right tool",
    desc: "Search by name or browse by category. Found what you need? Just click it.",
    id: "step1"
  },
  {
    title: "Use it instantly",
    desc: "No account needed for most tools. Upload your file and let Qofeno do the heavy lifting right in your browser.",
    id: "step2"
  },
  {
    title: "Download your result",
    desc: "Your file, processed and ready. No hidden fees or unexpected watermarks.",
    id: "step3"
  }
];

const FEATURED_TOOLS = [
  { id: '1', icon: Code2, name: "JSON Parser & Formatter", category: "Developer", usage: "1.2M", desc: "Format, validate, and beautify your JSON data." },
  { id: '2', icon: Code2, name: "Base64 Native Encoder", category: "Developer", usage: "900K", desc: "Securely encode or decode text strings." },
  { id: '3', icon: Code2, name: "Text Word & Character Counter", category: "AI Tools", usage: "200K", desc: "Count words, characters, and reading time instantly." }
];

const PERSONAS = [
  { id: 'students', label: '🎓 Students', title: 'Ace your study sessions', desc: 'Compress files, generate citations, convert formats, and create study planners. Everything you need to finish assignments ahead of schedule without installing clunky software.', bgClass: 'bg-gradient-to-br from-purple-100 to-pink-100', icon: GraduationCap, iconColor: 'text-purple-600' },
  { id: 'devs', label: '👨‍💻 Developers', title: 'Slick daily utilities', desc: 'Format JSON, encode/decode, generate regex, test APIs, and clean payloads. All the key tools dev teams use daily in an intuitive UI, running securely on our servers.', bgClass: 'bg-gradient-to-br from-cyan-100 to-blue-100', icon: Code2, iconColor: 'text-cyan-600' },
  { id: 'professionals', label: '💼 Professionals', title: 'Work faster, not harder', desc: 'Edit PDFs, resize images, convert documents to text, and build presentation outlines. Professional-grade utilities that don\'t require IT approval or paid subscriptions.', bgClass: 'bg-gradient-to-br from-emerald-100 to-teal-100', icon: BarChart3, iconColor: 'text-emerald-600' },
  { id: 'everyone', label: '🌍 Everyone Else', title: 'Impossibly simple for all', desc: 'If you can click a button, you can use Qofeno. No learning curves. Made readable with clean high-contrast elements, perfect for everyday utility tasks.', bgClass: 'bg-gradient-to-br from-amber-100 to-orange-100', icon: Sparkles, iconColor: 'text-amber-600' }
];

export function Home({ onNavigate, onRequestTool }: HomeProps) {
  const [activePersona, setActivePersona] = useState('students');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryTab, setActiveCategoryTab] = useState('All');
  const [stats, setStats] = useState({ tools: 0, files: 0, countries: 0 });

  // GSAP Ref nodes
  const sectionRef = useRef<HTMLDivElement>(null);
  const headlineRef = useRef<HTMLHeadingElement>(null);
  const subRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const trustBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Counting up stats
    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // Cinematic word reveal
      if (headlineRef.current) {
        const words = headlineRef.current.querySelectorAll('.word-reveal');
        tl.fromTo(words, 
          { y: 80, opacity: 0 }, 
          { y: 0, opacity: 1, duration: 0.8, stagger: 0.05, ease: 'power4.out' },
          0.1
        );
      }

      tl.fromTo(subRef.current, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6 }, '-=0.4');
      tl.fromTo(ctaRef.current, { scale: 0.9, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.6, ease: 'back.out(1.5)' }, '-=0.3');
      
      // Floating chips reveal
      tl.fromTo('.floating-chip', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.04, duration: 0.6, ease: 'back.out(1.2)' }, '-=0.2');

      // Trust Counters animation on viewport enter
      gsap.fromTo('.trust-counter-val', 
        { innerText: 0 },
        { 
          innerText: (i, el) => el.getAttribute('data-target'),
          snap: { innerText: 1 },
          duration: 2,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: trustBarRef.current,
            start: 'top 85%'
          },
          onUpdate: function() {
            // format values dynamically
          }
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Filter categories helper
  const filteredCategories = useMemo(() => CATEGORIES.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.tools.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
  ), [searchQuery]);

  return (
    <div ref={sectionRef} className="relative overflow-hidden w-full">
      <SEO title="Home" description="Qofeno - Professional online tools for developers and creators. No limits, totally fast." />
      
      {/* SECTION 1 — HERO */}
      <section className="relative min-h-screen flex flex-col justify-center items-center pt-32 pb-24 md:pt-48 md:pb-32 px-6 md:px-12 bg-white text-center z-10 overflow-hidden">
        {/* Glowing floating orbs in background */}
        <div className="absolute inset-0 pointer-events-none -z-10">
          <div className="absolute top-[10%] left-[5%] w-[45vw] h-[45vw] rounded-full bg-purple-100/40 blur-[130px] animate-slow-drift" />
          <div className="absolute bottom-[10%] right-[5%] w-[40vw] h-[40vw] rounded-full bg-pink-100/30 blur-[110px] animate-slow-drift-reverse" />
          <div className="absolute top-[40%] right-[15%] w-[35vw] h-[35vw] rounded-full bg-cyan-100/20 blur-[120px]" />
          <div className="absolute inset-0 bg-[radial-gradient(#7c3aed0a_1px,transparent_1px)] [background-size:16px_16px] opacity-60" />
        </div>

        {/* Floating Tool Chips Orbiting */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
          <FloatingHeroChip text="📄 PDF Tools" top="18%" left="15%" rotate="-12" speed="3" />
          <FloatingHeroChip text="✍️ Writing Tools" top="24%" right="12%" rotate="15" speed="4" />
          <FloatingHeroChip text="🖼️ Image Tools" top="55%" left="8%" rotate="8" speed="3.5" />
          <FloatingHeroChip text="💻 Dev Tools" top="64%" right="16%" rotate="-10" speed="4.5" />
          <FloatingHeroChip text="🤖 AI Tools" bottom="15%" left="20%" rotate="-6" speed="3" />
          <FloatingHeroChip text="🎓 Study Tools" bottom="18%" right="24%" rotate="12" speed="4" />
        </div>

        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {/* Eyebrow Badge */}
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 155 }}
            className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 px-4 py-2 rounded-full text-purple-700 font-semibold text-xs tracking-wider uppercase mb-8"
          >
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-600"></span>
            </span>
            Tools for everyone. Free to start.
          </motion.div>

          {/* Heading with word reveals */}
          <h1 ref={headlineRef} className="font-display text-5xl md:text-8xl font-black tracking-tight text-[#0F0A1E] leading-[1.05] mb-8">
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
          <p ref={subRef} className="text-lg md:text-2xl text-neutral-500 max-w-2xl mb-12 leading-relaxed">
            Qofeno brings together powerful tools for PDFs, images, video, writing, code, and more — all server-processed, free to start, right in your browser.
          </p>

          {/* CTA Group */}
          <div ref={ctaRef} className="flex flex-col sm:flex-row items-center gap-4 mb-16 z-20">
            <button 
              onClick={() => onNavigate('tools')}
              className="w-full sm:w-auto px-8 py-4.5 bg-gradient-to-r from-purple-600 to-violet-500 text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 group cursor-pointer"
            >
              Explore Tools
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={() => onNavigate('pricing')}
              className="w-full sm:w-auto px-8 py-4.5 bg-white border border-neutral-200 text-neutral-800 rounded-2xl font-bold text-lg hover:bg-neutral-50 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
            >
              View Pricing
            </button>
          </div>

          {/* Quick Search Panel */}
          <div className="w-full max-w-xl bg-white/70 backdrop-blur-xl border border-neutral-100 rounded-2xl p-2 shadow-2xl shadow-purple-500/5 flex items-center gap-2">
            <Search className="w-6 h-6 text-neutral-400 ml-3 shrink-0" />
            <input 
              type="text" 
              placeholder="Search tools (e.g., format json)..." 
              className="w-full bg-transparent py-3 outline-none text-neutral-800 text-base placeholder-neutral-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-xs text-neutral-400 hover:text-neutral-900 px-2">Clear</button>
            )}
            <button 
              onClick={() => {
                onNavigate('tools');
                localStorage.setItem('qofeno_initial_search', searchQuery);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
            >
              Find
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2 — WHAT IS QOFENO */}
      <section ref={trustBarRef} className="py-24 border-t border-b border-purple-50 bg-[#FAFAFA] relative z-20">
        <div className="max-w-5xl mx-auto px-6 md:px-12 text-center">
          <h2 className="font-display text-3xl md:text-5xl font-black text-[#0F0A1E] mb-6">One place. Hundreds of tools.</h2>
          <p className="text-lg md:text-xl text-neutral-500 leading-relaxed mb-16 max-w-3xl mx-auto">
            Qofeno is a growing collection of free online tools. Every tool runs on our servers — you upload, we process, you download. Your files are never stored permanently.
          </p>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4 relative mb-12">
            <div className="hidden md:block absolute top-1/2 left-[20%] right-[20%] h-0.5 border-t-2 border-dashed border-neutral-300 -z-10" />
            
            <div className="flex flex-col items-center bg-white p-6 rounded-3xl z-10 w-48 shadow-xl shadow-purple-900/5 border border-neutral-100">
              <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <span className="font-bold text-[#0F0A1E]">1. Upload</span>
            </div>

            <div className="flex flex-col items-center bg-purple-600 text-white p-6 rounded-3xl z-10 w-48 shadow-2xl shadow-purple-600/20">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4 animate-[spin_4s_linear_infinite]">
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

          <div className="inline-flex items-center gap-2 bg-white border border-neutral-200 px-4 py-2 rounded-full text-neutral-600 font-semibold text-xs shadow-sm">
            🔒 Files are deleted from our servers after processing
          </div>
        </div>
      </section>

      {/* SECTION 3 — CATEGORIES SHOWCASE */}
      <section id="tools-showcase" className="py-28 px-6 md:px-12 bg-white relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="font-display text-3xl md:text-6xl font-bold tracking-tight text-[#0F0A1E] mb-6">Tools for every kind of task</h2>
            <p className="text-lg md:text-xl text-neutral-500">New tools added regularly. Whatever you're building or fixing, there's a tool for it.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredCategories.map((cat, idx) => {
              const IconComp = cat.icon;
              return (
                <motion.div
                  key={idx}
                  onClick={() => {
                    localStorage.setItem('selected_category_filter', cat.title);
                    onNavigate('tools');
                  }}
                  className="group relative bg-[#FAFAFA] border border-neutral-100 hover:border-purple-200/60 p-6 rounded-3xl cursor-pointer hover:bg-white transition-all duration-300"
                  whileHover={{ y: -8, boxShadow: '0 20px 40px -10px rgba(124, 58, 237, 0.08)' }}
                >
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300", cat.color)}>
                    <IconComp className="w-7 h-7" />
                  </div>
                  <div className="absolute top-6 right-6">
                    <span className="bg-purple-100/40 text-purple-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      {cat.count} tools
                    </span>
                  </div>
                  <h3 className="font-display text-xl font-bold text-[#0F0A1E] mb-2">{cat.title}</h3>
                  
                  {/* Popular tools previews */}
                  <div className="mt-4 flex flex-col gap-2">
                    <span className="text-xs text-neutral-400 uppercase font-bold tracking-wider">Top Tools</span>
                    <div className="flex flex-wrap gap-1.5">
                      {cat.tools.map((t, i) => (
                        <span key={i} className="bg-white group-hover:bg-purple-50/50 text-neutral-600 group-hover:text-purple-900 border border-neutral-100 rounded-lg text-xs py-1 px-2 font-medium">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 flex items-center text-purple-600 font-semibold text-sm group-hover:translate-x-1 transition-transform">
                    Explore inside <ChevronRight className="w-4 h-4" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 4 — HOW IT WORKS STICKY STORYTELLING */}
      <section className="py-24 px-6 md:px-12 bg-neutral-50 relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          
          {/* Sticky Left Column */}
          <div className="lg:sticky lg:top-32 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 bg-purple-50 border border-purple-100 px-3 py-1.5 rounded-full text-purple-700 font-bold text-xs uppercase mb-6 w-fit">
              <Zap className="w-3.5 h-3.5 text-pink-500 fill-pink-500" /> Let's get things done
            </div>
            <h2 className="font-display text-3xl md:text-6xl font-black text-[#0F0A1E] tracking-tight mb-6">How Qofeno Works</h2>
            <p className="text-lg text-neutral-500 max-w-md mb-8">
              We focus on removing complexity. Your files are processed securely on our servers.
            </p>

            <div className="relative border-l-2 border-purple-100 pl-6 flex flex-col gap-8">
              <div className="relative group">
                <div className="absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full bg-white border-2 border-purple-600 group-hover:bg-purple-600 transition-colors" />
                <h3 className="font-bold text-xl text-[#0F0A1E] group-hover:text-purple-700 transition-colors mb-2">Find your tool</h3>
                <p className="text-neutral-500 leading-relaxed text-sm max-w-md">Search by name or browse by category. No account needed for free tools.</p>
              </div>
              <div className="relative group">
                <div className="absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full bg-white border-2 border-purple-600 group-hover:bg-purple-600 transition-colors" />
                <h3 className="font-bold text-xl text-[#0F0A1E] group-hover:text-purple-700 transition-colors mb-2">Upload your file</h3>
                <p className="text-neutral-500 leading-relaxed text-sm max-w-md">Your file is sent securely to our servers. Processing happens server-side, not in your browser.</p>
              </div>
              <div className="relative group">
                <div className="absolute -left-[31px] top-1 w-4.5 h-4.5 rounded-full bg-white border-2 border-purple-600 group-hover:bg-purple-600 transition-colors" />
                <h3 className="font-bold text-xl text-[#0F0A1E] group-hover:text-purple-700 transition-colors mb-2">Download your result</h3>
                <p className="text-neutral-500 leading-relaxed text-sm max-w-md">Your result is ready instantly. Download it. Your file is deleted from our servers.</p>
              </div>
            </div>
          </div>

          {/* Right Column Visualizers */}
          <div className="space-y-12">
            
            {/* Step 1 Visual */}
            <div className="bg-white border border-neutral-100 p-12 rounded-3xl shadow-xl shadow-purple-900/5 aspect-video flex flex-col justify-center items-center relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(#7c3aed0a_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />
              <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-neutral-100 p-4 flex items-center gap-3 relative z-10 animate-[bounce_3s_ease-in-out_infinite]">
                <Search className="w-6 h-6 text-neutral-300" />
                <div className="h-4 w-32 bg-neutral-200 rounded-md animate-pulse"></div>
                <div className="w-px h-6 bg-purple-600 animate-[pulse_1s_infinite]"></div>
              </div>
            </div>

            {/* Step 2 Visual */}
            <div className="bg-white border border-neutral-100 p-12 rounded-3xl shadow-xl shadow-purple-900/5 aspect-video flex justify-center items-center relative overflow-hidden gap-8">
              <div className="flex flex-col items-center animate-[bounce_4s_ease-in-out_infinite]">
                 <FileText className="w-16 h-16 text-neutral-300" />
                 <span className="text-xs font-bold text-neutral-400 mt-2 hover:text-purple-600">INPUT FILE</span>
              </div>
              
              <div className="flex flex-col items-center">
                 <div className="flex gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-purple-400 animate-pulse delay-75"></div>
                    <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse delay-150"></div>
                    <div className="w-2 h-2 rounded-full bg-purple-600 animate-pulse delay-300"></div>
                 </div>
                 <ArrowRight className="w-8 h-8 text-purple-600" />
              </div>

              <div className="flex flex-col items-center relative z-10 animate-[bounce_4s_ease-in-out_infinite_reverse]">
                 <div className="w-20 h-20 bg-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-600/30">
                    <Cpu className="w-10 h-10 text-white" />
                 </div>
                 <span className="text-xs font-bold text-purple-600 mt-4 uppercase tracking-widest bg-purple-50 px-2 py-0.5 rounded-full">Server</span>
              </div>
            </div>

            {/* Step 3 Visual */}
            <div className="bg-white border border-neutral-100 p-12 rounded-3xl shadow-xl shadow-purple-900/5 aspect-video flex flex-col justify-center items-center relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(#10b9810a_1px,transparent_1px)] [background-size:16px_16px] opacity-60 pointer-events-none" />
               <div className="w-32 h-32 bg-green-50 rounded-full flex items-center justify-center mb-6 relative z-10">
                  <CheckCircle2 className="w-16 h-16 text-green-500" />
               </div>
               <div className="w-full max-w-xs bg-white rounded-2xl shadow-xl border border-neutral-100 p-4 flex justify-between items-center relative z-10">
                  <div className="flex items-center gap-3">
                     <FileText className="w-6 h-6 text-green-500" />
                     <div className="h-2.5 w-20 bg-neutral-200 rounded-full"></div>
                  </div>
                  <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                    <div className="w-3 h-3 border-b-2 border-r-2 border-green-500 rotate-45 transform translate-y-[-2px]"></div>
                  </div>
               </div>
               <span className="text-[10px] font-bold text-neutral-400 mt-6 uppercase tracking-widest bg-neutral-100 px-3 py-1 rounded-full">Securely Deleted</span>
            </div>

          </div>

        </div>
      </section>

      {/* SECTION 5 — HORIZONTAL CARDS */}
      <section className="py-28 px-6 md:px-12 bg-white relative z-20 border-b border-purple-50 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-4">
            <div>
              <h2 className="font-display text-3xl md:text-6xl font-black text-[#0F0A1E]">This week's most-used tools</h2>
              <p className="text-lg text-neutral-500 mt-2">The standard benchmarks used millions of times daily. Try for free.</p>
            </div>
            <button 
              onClick={() => onNavigate('tools')}
              className="text-purple-600 font-bold hover:text-purple-800 flex items-center gap-1 shrink-0 text-base"
            >
              See all tools <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-8 snap-x snap-mandatory scrollbar-thin">
            {FEATURED_TOOLS.map((tool, index) => {
              const ToolIcon = tool.icon;
              return (
                <div key={index} className="w-[320px] shrink-0 bg-[#FAFAFA] border border-neutral-100 hover:border-purple-200 hover:bg-white p-6 rounded-3xl snap-start flex flex-col justify-between transition-all duration-300">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-6">
                      <ToolIcon className="w-6 h-6 text-purple-600 animate-pulse" />
                    </div>
                    <span className="text-[10px] uppercase tracking-wider font-bold text-neutral-400 bg-neutral-100 py-1 px-2.5 rounded-full inline-block mb-3">
                      {tool.category}
                    </span>
                    <h3 className="text-lg font-bold text-[#0F0A1E] mb-2">{tool.name}</h3>
                    <p className="text-sm text-neutral-500 mb-6 leading-relaxed">{tool.desc}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
                    <button 
                      onClick={() => {
                        localStorage.setItem('selected_tool_id', tool.id);
                        onNavigate('tool');
                      }}
                      className="text-purple-600 font-semibold text-xs flex items-center hover:translate-x-1 transition-transform cursor-pointer"
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
      <section className="py-28 px-6 md:px-12 bg-[#FAFAFA] relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-display text-3xl md:text-6xl font-bold tracking-tight text-[#0F0A1E] mb-6">Built for everyone</h2>
            <p className="text-lg text-neutral-500">Perfectly suited for individual workflows, enterprise teams, and students alike.</p>
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

          <div className="bg-white border border-neutral-100 rounded-3xl p-8 md:p-12 shadow-xl flex flex-col lg:flex-row gap-12 items-center">
            {PERSONAS.map((p) => {
              if (p.id !== activePersona) return null;
              return (
                <div key={p.id} className="w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div>
                    <h3 className="font-display text-2xl md:text-4xl font-extrabold text-[#0F0A1E] mb-4">{p.title}</h3>
                    <p className="text-lg text-neutral-500 leading-relaxed mb-8">{p.desc}</p>
                    <button 
                      onClick={() => onNavigate('tools')}
                      className="px-6 py-3 bg-[#0F0A1E] text-white font-bold rounded-xl text-sm hover:bg-purple-700 transition-colors"
                    >
                      Explore Segment Tools
                    </button>
                  </div>
                  <div className={cn("relative aspect-video rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center", p.bgClass)}>
                    <div className="absolute inset-0 bg-[radial-gradient(black_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] pointer-events-none" />
                    {p.icon && <p.icon className={cn("w-28 h-28 opacity-60 hover:scale-110 transition-transform duration-700", p.iconColor)} />}
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
            <p className="text-lg text-neutral-500">Most tools are completely free. Pro unlocks everything.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* FREE PLAN */}
            <div className="border border-purple-100 bg-white p-8 rounded-3xl flex flex-col justify-between">
              <div>
                <h3 className="font-display text-xl font-bold mb-2">Free</h3>
                <div className="text-4xl font-black text-[#0F0A1E] mb-6">$0<span className="text-lg text-neutral-400 font-medium">/forever</span></div>
                <ul className="space-y-3 mb-8 text-sm text-neutral-600 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600" /> Access to core tools</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600" /> Browser-based, no signup</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600" /> Instant execution</li>
                </ul>
              </div>
              <button onClick={() => onNavigate('tools')} className="w-full py-3 rounded-xl border border-purple-200 text-purple-700 font-bold hover:bg-purple-50 transition-colors">
                Start for Free
              </button>
            </div>

            {/* PRO PLAN */}
            <div className="border border-purple-200 bg-purple-50 p-8 rounded-3xl flex flex-col justify-between relative transform scale-105 shadow-xl shadow-purple-500/10">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                Most Popular
              </div>
              <div>
                <h3 className="font-display text-xl font-bold mb-2 text-purple-900">Pro</h3>
                <div className="text-4xl font-black text-purple-900 mb-6">$9<span className="text-lg text-purple-700/60 font-medium">/mo</span></div>
                <ul className="space-y-3 mb-8 text-sm text-purple-900 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600" /> Everything in Free</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600" /> All tools unlocked</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600" /> Priority processing</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-purple-600" /> Higher file size limits</li>
                </ul>
              </div>
              <button onClick={() => onNavigate('pricing')} className="w-full py-3 rounded-xl bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors">
                Get Pro
              </button>
            </div>

             {/* ENTERPRISE PLAN */}
             <div className="border border-neutral-800 bg-[#0F0A1E] text-white p-8 rounded-3xl flex flex-col justify-between">
              <div>
                <h3 className="font-display text-xl font-bold mb-2">Enterprise</h3>
                <div className="text-4xl font-black mb-6">Custom</div>
                <ul className="space-y-3 mb-8 text-sm text-neutral-400 font-medium">
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /> Bulk processing</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /> API Access</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-400" /> Team accounts</li>
                </ul>
              </div>
              <button onClick={() => onNavigate('contact')} className="w-full py-3 rounded-xl bg-white text-[#0F0A1E] font-bold hover:bg-neutral-200 transition-colors">
                Contact Us
              </button>
            </div>
          </div>
          <div className="text-center mt-10">
            <button onClick={() => onNavigate('pricing')} className="text-purple-600 font-bold hover:text-purple-800 hover:underline">
              See full pricing details →
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 8 — BUILT BY */}
      <section className="py-28 px-6 md:px-12 bg-[#FAFAFA] relative z-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 bg-purple-100 text-purple-700 rounded-full font-black text-2xl flex items-center justify-center mx-auto mb-6">MZ</div>
          <h2 className="font-display text-3xl md:text-5xl font-black text-[#0F0A1E] mb-6">Built with care, one tool at a time</h2>
          <p className="text-lg md:text-xl text-neutral-500 leading-relaxed mb-10 max-w-2xl mx-auto">
            Qofeno is designed and developed by Mohd Zaheer Uddin. Every tool is tested and built to actually work. If you have a suggestion or found something broken, I'd love to hear from you.
          </p>
          <button 
            onClick={() => onNavigate('contact')}
            className="inline-flex items-center gap-2 px-8 py-4 bg-[#0F0A1E] text-white font-bold rounded-2xl hover:bg-neutral-800 transition-colors"
          >
            Say hello <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* SECTION 9 — TOOL GROWTH TRACKER */}
      <section className="py-24 bg-[#140F26] text-white text-center relative z-20">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-display text-3xl md:text-5xl font-black mb-4 tracking-tight">We're building something big.</h2>
          <p className="text-purple-300 font-bold mb-12 text-lg">New tools are added every week. Here's where we are.</p>
          
          <div className="w-full max-w-xl mx-auto bg-neutral-800 h-4 rounded-full overflow-hidden mb-6 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-[25%]" />
          </div>
          <div className="flex justify-between max-w-xl mx-auto text-neutral-400 text-sm font-semibold mb-12">
            <span>Currently: 142 tools</span>
            <span>Goal: 500 tools by end of year</span>
          </div>

          <button 
            onClick={() => onNavigate('contact')}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-500 active:scale-95 transition-transform text-white rounded-2xl font-bold"
          >
            Request a tool →
          </button>
        </div>
      </section>

      {/* SECTION 10 — CTA BANNER */}
      <section className="py-28 bg-gradient-to-br from-purple-900 to-[#2B1B54] text-white relative z-20 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none -z-10">
           {/* Drifting tool icons */}
           <FileText className="absolute top-10 left-[10%] w-24 h-24 text-white opacity-5 animate-slow-drift" />
           <ImageIcon className="absolute bottom-10 right-[15%] w-32 h-32 text-white opacity-5 animate-slow-drift-reverse" />
        </div>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="font-display text-4xl md:text-7xl font-extrabold mb-8 tracking-tight leading-none">Start using Qofeno today</h2>
          <p className="text-lg md:text-xl text-purple-200/90 max-w-xl mx-auto mb-12">Free tools. No signup. No friction.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <button 
              onClick={() => onNavigate('tools')}
              className="px-8 py-4 bg-white text-purple-900 font-bold text-lg rounded-2xl hover:bg-purple-100 transition-colors"
            >
              Explore All Tools
            </button>
            <button 
              onClick={() => onNavigate('pricing')}
              className="px-8 py-4 bg-transparent border border-white/20 text-white hover:border-white font-bold text-lg rounded-2xl transition-colors"
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
