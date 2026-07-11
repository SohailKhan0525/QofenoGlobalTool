import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faShieldHalved, faUnlock, faRotate, faCircleCheck, faCircleHalfStroke, faCircle } from '@fortawesome/free-solid-svg-icons';
import { cn } from '../../lib/utils';
import { SEO } from '../../components/SEO';

const VALUES = [
  { icon: faUnlock, title: "Free & Open", desc: "Core tools are always free. Everyone deserves access to quality software without arbitrary paywalls." },
  { icon: faShieldHalved, title: "Privacy First", desc: "Files process locally when possible, and cloud operations never store data longer than needed." },
  { icon: faRotate, title: "Always Growing", desc: "New tools are added every week. If something's missing, let me know and I'll build it." }
];

import { useState, useEffect } from 'react';
import { databases, DATABASE_ID } from '../../lib/qofeno-appwrite';
import { Query } from 'appwrite';

export function About({ onNavigate }: { onNavigate?: (p: string) => void }) {
  const [roadmap, setRoadmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function loadRoadmap() {
      try {
        const res = await databases.listDocuments(DATABASE_ID, 'roadmap', [
          Query.orderAsc('order'),
          Query.limit(50)
        ]);
        if (!cancelled) {
          setRoadmap(res.documents);
        }
      } catch (err) {
        console.error("Failed to load roadmap", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadRoadmap();
    return () => { cancelled = true; };
  }, []);
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
        <div className="text-center mb-20">
          <h1 className="font-display text-4xl md:text-7xl font-black text-[#0F0A1E] mb-6 leading-tight">Built by one person,<br/>for everyone</h1>
          <p className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto">
            Qofeno is being built with honesty and care to bring together hundreds of useful tools in one place.
          </p>
        </div>

        {/* MISSION STATEMENT LARGE DISPLAY PULL QUOTE */}
        <div 
          className="bg-[#FAFAFA] border border-neutral-100 rounded-3xl p-8 md:p-14 mb-24 relative shadow-xl shadow-purple-900/5 text-center"
        >
          <div className="absolute top-6 left-6 text-purple-200 font-bold opacity-30 select-none text-8xl font-serif leading-none">“</div>
          <p className="text-lg md:text-2xl font-medium leading-relaxed max-w-2xl mx-auto text-neutral-700 mb-6 relative z-10">
            Qofeno started as a simple idea: why should useful tools be scattered across dozens of different websites? Why should they cost money or require signing up just to compress a file?
            <br />
            <br />
            Qofeno is an attempt to fix that — one tool at a time.
          </p>
        </div>

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
               <img 
                 src="/qofeno.png" 
                 alt="Mohd Zaheer Uddin" 
                 className="w-40 h-40 rounded-full border-4 border-purple-200/20 shadow-2xl object-cover bg-white relative z-10"
               />
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
                  <FontAwesomeIcon icon={val.icon} className="w-6 h-6" />
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
          
          <div className="bg-[#FAFAFA] border border-neutral-100 rounded-3xl p-8 relative overflow-hidden font-medium">
            <div className="space-y-8 relative z-10">
              {loading ? (
                <div className="text-center py-6 text-neutral-400 font-bold">Loading roadmap...</div>
              ) : roadmap.length > 0 ? (
                (() => {
                  const shipped = roadmap.filter(r => {
                    const s = String(r.status || '').toLowerCase();
                    return s === 'shipped' || s === 'done';
                  });
                  const inProgress = roadmap.filter(r => {
                    const s = String(r.status || '').toLowerCase();
                    return s === 'in_progress' || s === 'doing';
                  });
                  const planned = roadmap.filter(r => {
                    const s = String(r.status || '').toLowerCase();
                    return s === 'planned';
                  });

                  return (
                    <div className="space-y-8">
                      {/* Shipped Section */}
                      {shipped.length > 0 && (
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-emerald-600 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faCircleCheck} className="w-3.5 h-3.5" /> Shipped & Live
                          </h3>
                          <div className="space-y-4 pl-5 border-l-2 border-emerald-100">
                            {shipped.map((item, idx) => (
                              <div key={item.$id || idx} className="py-2">
                                <h4 className="font-bold text-base text-[#0F0A1E]">{item.title}</h4>
                                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{item.description || item.content || item.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* In Progress Section */}
                      {inProgress.length > 0 && (
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-blue-600 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faCircleHalfStroke} className="w-3.5 h-3.5 animate-spin-slow" /> In Progress
                          </h3>
                          <div className="space-y-4 pl-5 border-l-2 border-blue-100">
                            {inProgress.map((item, idx) => (
                              <div key={item.$id || idx} className="py-2">
                                <h4 className="font-bold text-base text-[#0F0A1E]">{item.title}</h4>
                                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{item.description || item.content || item.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Planned Section */}
                      {planned.length > 0 && (
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-neutral-500 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faCircle} className="w-3.5 h-3.5 text-neutral-400" /> Planned / Backlog
                          </h3>
                          <div className="space-y-4 pl-5 border-l-2 border-neutral-200">
                            {planned.map((item, idx) => (
                              <div key={item.$id || idx} className="py-2">
                                <h4 className="font-bold text-base text-[#0F0A1E]">{item.title}</h4>
                                <p className="text-xs text-neutral-500 mt-1 leading-relaxed">{item.description || item.content || item.desc}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="text-center py-8 space-y-4">
                  <p className="text-neutral-500 text-sm font-semibold">More tools being added regularly.</p>
                  <button 
                    onClick={() => onNavigate && onNavigate('whats-new')}
                    className="text-xs text-purple-600 hover:text-purple-800 font-bold underline cursor-pointer"
                  >
                    Check What's New for updates
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* CONTACT CTA */}
        <div className="text-center py-12 px-6 bg-purple-50 rounded-3xl border border-purple-150">
          <h2 className="font-display text-2xl font-bold text-purple-900 mb-4">Have a suggestion? Found a bug?</h2>
          <p className="text-purple-700/80 mb-8 max-w-md mx-auto">I read every single message. Help me build exactly what you need.</p>
          <button onClick={() => onNavigate && onNavigate('contact')} className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-bold px-8 py-4 rounded-xl transition-colors cursor-pointer">
            Say Hello <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
