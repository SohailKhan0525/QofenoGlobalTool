import { useState } from 'react';
import { ArrowRight, Unlock, ShieldCheck, TrendingUp, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { SEO } from '../../components/SEO';

const VALUES = [
  { icon: Unlock, title: "Free & Open", desc: "Core tools are always free. Everyone deserves access to quality software without arbitrary paywalls." },
  { icon: ShieldCheck, title: "Privacy First", desc: "Files process locally when possible, and cloud operations never store data longer than needed." },
  { icon: TrendingUp, title: "Always Growing", desc: "New tools are added every week. If something's missing, let me know and I'll build it." }
];

const ROADMAP = [
  { status: "done", title: "Core PDF & Image Tools", desc: "Compression, conversion, and editing for everyday files." },
  { status: "done", title: "Developer Utilities", desc: "Code formatters, encoders, and regex testers." },
  { status: "doing", title: "AI-Powered Text Assistants", desc: "On-the-fly summarization and content generation." },
  { status: "next", title: "Bulk Processing API", desc: "Headless access for enterprise scale automations." }
];

export function About({ onNavigate }: { onNavigate?: (p: string) => void }) {
  return (
    <div className="min-h-screen bg-white pt-32 pb-20 overflow-hidden relative select-none">
      <SEO title="About Us" description="Learn about the mission and vision of Qofeno." />
      
      {/* BACKGROUND GRADIENT ORBS */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <div className="absolute top-[15%] left-[10%] w-[50vw] h-[50vw] rounded-full bg-purple-100/40 blur-[130px] animate-slow-drift" />
        <div className="absolute bottom-[10%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-pink-100/30 blur-[110px] animate-slow-drift-reverse" />
      </div>

      <div className="max-w-4xl mx-auto px-6">
        
        {/* HERO SECTION */}
        <div className="text-center mb-20 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <h1 className="font-display text-4xl md:text-7xl font-black text-[#0F0A1E] mb-6 leading-tight">Built by one person,<br/>for everyone</h1>
          <p className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto">
            Qofeno is being built with honesty and care to bring together hundreds of useful tools in one place.
          </p>
        </div>

        {/* MISSION STATEMENT LARGE DISPLAY PULL QUOTE */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#FAFAFA] border border-neutral-100 rounded-3xl p-8 md:p-14 mb-24 relative shadow-xl shadow-purple-900/5 text-center"
        >
          <div className="absolute top-6 left-6 text-purple-200 font-bold opacity-30 select-none text-8xl font-serif leading-none">“</div>
          <p className="text-lg md:text-2xl font-medium leading-relaxed max-w-2xl mx-auto text-neutral-700 mb-6 relative z-10">
            Qofeno started as a simple idea: why should useful tools be scattered across dozens of different websites? Why should they cost money or require signing up just to compress a file?
            <br />
            <br />
            Qofeno is an attempt to fix that — one tool at a time.
          </p>
        </motion.div>

        {/* THE BUILDER */}
        <div className="bg-gradient-to-br from-[#140F26] to-[#2B1B54] rounded-3xl overflow-hidden mb-24 shadow-2xl text-white">
          <div className="flex flex-col md:flex-row">
            <div className="p-10 md:p-16 flex-1 flex flex-col justify-center">
              <span className="text-amber-400 font-bold uppercase tracking-widest text-xs mb-4">Founder & Developer</span>
              <h2 className="font-display text-3xl md:text-5xl font-extrabold mb-6">Mohd Zaheer Uddin</h2>
              <p className="text-purple-200/80 mb-8 leading-relaxed">
                I'm building Qofeno to be the most practical, fastest tool aggregator on the internet. Every tool is hand-picked, built, and tested by me to ensure it actually works.
              </p>
              <div className="flex gap-6 text-sm font-semibold">
                <a href="https://github.com/MohdZaheerU" target="_blank" rel="noopener noreferrer" className="hover:text-purple-300 transition-colors">GitHub</a>
                <span className="hover:text-purple-300 transition-colors cursor-pointer">Twitter</span>
                <span className="hover:text-purple-300 transition-colors cursor-pointer">LinkedIn</span>
                <a href="mailto:sohailkhannn.0525@gmail.com" className="hover:text-purple-300 transition-colors">Email</a>
              </div>
            </div>
            <div className="md:w-2/5 aspect-square bg-[#352565] flex items-center justify-center relative overflow-hidden">
               {/* Honest generic avatar representation */}
               <div className="w-40 h-40 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-2xl">
                 <span className="text-5xl font-black text-white">MZ</span>
               </div>
               <div className="absolute inset-0 bg-[radial-gradient(#ffffff20_1px,transparent_1px)] [background-size:24px_24px] opacity-10" />
            </div>
          </div>
        </div>

        {/* CORE VALUES */}
        <div className="mb-24">
          <h2 className="font-display text-3xl font-black text-[#0F0A1E] text-center mb-12">Built on core values</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {VALUES.map((val, idx) => (
              <div key={idx} className="bg-white border border-neutral-150 p-8 rounded-2xl hover:border-purple-200 hover:shadow-xl hover:shadow-purple-500/5 transition-all">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
                  <val.icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-[#0F0A1E] mb-3">{val.title}</h3>
                <p className="text-neutral-500 leading-relaxed text-sm">{val.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ROADMAP */}
        <div className="max-w-2xl mx-auto mb-20 section-reveal">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl font-black text-[#0F0A1E] mb-4">Here's what we're building next</h2>
            <p className="text-neutral-500">I ship improvements weekly. Follow the roadmap.</p>
          </div>
          
          <div className="bg-[#FAFAFA] border border-neutral-100 rounded-3xl p-8 relative overflow-hidden">
            <div className="space-y-8 relative z-10">
              {ROADMAP.map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="mt-1 shrink-0">
                    {item.status === 'done' && <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center border-4 border-emerald-100"><ShieldCheck className="w-2.5 h-2.5 text-white" /></div>}
                    {item.status === 'doing' && <div className="w-5 h-5 rounded-full bg-amber-500 animate-pulse border-4 border-amber-100" />}
                    {item.status === 'next' && <div className="w-5 h-5 rounded-full border-[3px] border-neutral-300 bg-white" />}
                  </div>
                  <div>
                    <h4 className={cn("font-bold text-lg", item.status === 'done' ? "text-neutral-900" : "text-[#0F0A1E]")}>{item.title}</h4>
                    <p className="text-sm text-neutral-500 mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            {/* Connection line */}
            <div className="absolute left-[39px] top-12 bottom-12 w-0.5 bg-neutral-200 z-0" />
          </div>
        </div>

        {/* CONTACT CTA */}
        <div className="text-center py-12 px-6 bg-purple-50 rounded-3xl border border-purple-150">
          <h2 className="font-display text-2xl font-bold text-purple-900 mb-4">Have a suggestion? Found a bug?</h2>
          <p className="text-purple-700/80 mb-8 max-w-md mx-auto">I read every single message. Help me build exactly what you need.</p>
          <button onClick={() => onNavigate && onNavigate('contact')} className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-xl transition-colors cursor-pointer">
            Say Hello <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
