import { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRocket, faWrench, faBug, faBullhorn } from '@fortawesome/free-solid-svg-icons';
import { cn } from '../../lib/utils';
import { SEO } from '../../components/SEO';
import { databases, DATABASE_ID } from '../../lib/qofeno-appwrite';
import { Query } from 'appwrite';

// Types for Timeline Entry
type EntryType = 'new_tool' | 'improvement' | 'fix' | 'product_update';

interface TimelineEntry {
  $id: string;
  type: EntryType;
  title: string;
  published_at: string;
  content: string;
  author: string;
}

export function BlogDocs() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch Blog Posts from Appwrite
  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await databases.listDocuments(DATABASE_ID, 'blog_posts', [
          Query.equal('published', true),
          Query.orderDesc('published_at')
        ]);
        setEntries(res.documents as unknown as TimelineEntry[]);
      } catch (err) {
        console.error("Failed to load blog posts:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  // Simulated Reading Progress loop based on main window scroll
  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        setScrollProgress((window.scrollY / totalHeight) * 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getBadgeStyle = (type: EntryType) => {
    switch (type) {
      case 'new_tool': return 'bg-green-100 text-green-700 border-green-200';
      case 'improvement': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'fix': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'product_update': return 'bg-purple-100 text-purple-700 border-purple-200';
      default: return 'bg-neutral-100 text-neutral-700';
    }
  };

  const getBadgeIcon = (type: EntryType) => {
    switch (type) {
      case 'new_tool': return faRocket;
      case 'improvement': return faWrench;
      case 'fix': return faBug;
      case 'product_update': return faBullhorn;
      default: return faRocket;
    }
  };

  const getBadgeLabel = (type: EntryType) => {
    switch (type) {
      case 'new_tool': return 'New Tool';
      case 'improvement': return 'Improvement';
      case 'fix': return 'Fix';
      case 'product_update': return 'Announcement';
      default: return 'Update';
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-24 pb-20 relative select-none">
      <SEO title="What's New" description="A chronological log of new tools, improvements, and updates shipped to Qofeno." />
      
      {/* SCROLL PROGRESS INDICATOR */}
      <div className="fixed top-[60px] lg:top-[72px] left-0 right-0 h-1 bg-transparent z-50">
        <div className="h-full bg-purple-600 transition-all duration-75 ease-out" style={{ width: `${scrollProgress}%` }} />
      </div>

      <div className="max-w-3xl mx-auto px-6">
        
        {/* HEADER SECTION */}
        <div className="mb-16 md:mb-24 pt-10">
          <h1 className="font-display text-4xl md:text-6xl font-black text-[#0F0A1E] mb-6 tracking-tight">What's New</h1>
          <p className="text-lg text-neutral-500 max-w-xl">
            A chronological log of new tools, improvements, and updates shipped to Qofeno.
          </p>
        </div>

        {/* TIMELINE LIST */}
        <div className="relative border-l-2 border-purple-100/60 pl-8 md:pl-12 pb-12 space-y-16">
          {loading ? (
             <div className="text-center py-16 text-neutral-400 font-bold">Loading updates...</div>
          ) : entries.length === 0 ? (
            <div className="text-center bg-white border border-neutral-100 rounded-3xl py-16 px-6 shadow-sm">
               <FontAwesomeIcon icon={faWrench} className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
               <p className="text-[#0F0A1E] font-bold text-lg mb-2">Nothing here yet</p>
               <p className="text-neutral-500 text-sm">— first update coming soon.</p>
            </div>
          ) : (
            entries.map((entry, index) => {
              const formattedDate = new Date(entry.published_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              return (
                <div 
                  key={entry.$id}
                  className="relative"
                >
                  {/* TIMELINE DOT */}
                  <div className="absolute -left-[41px] md:-left-[57px] top-1.5 w-4 h-4 bg-white border-[3px] border-purple-500 rounded-full shadow-sm" />
                  
                  {/* CONTENT AREA */}
                  <div className="bg-white border border-neutral-100/80 rounded-3xl p-6 md:p-8 shadow-xl shadow-purple-900/5 transition-all hover:shadow-2xl hover:shadow-purple-900/10">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border", getBadgeStyle(entry.type))}>
                        <FontAwesomeIcon icon={getBadgeIcon(entry.type)} className="w-3.5 h-3.5" />
                        {getBadgeLabel(entry.type)}
                      </span>
                      <span className="text-sm font-semibold text-neutral-400">{formattedDate}</span>
                    </div>
                    
                    <h2 className="font-display text-2xl font-bold text-[#0F0A1E] mb-3">{entry.title}</h2>
                    
                    <div className="text-xs font-bold text-neutral-400 mb-6 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">MZ</div>
                      By {entry.author}
                    </div>
                    
                    <div className="text-neutral-600 text-[15px] leading-relaxed whitespace-pre-wrap">
                      {entry.content}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
