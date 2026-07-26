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
  created_at: string;
  body: string;
  author: string;
}

const FALLBACK_ENTRIES: TimelineEntry[] = [
  {
    $id: 'v2.4.0',
    type: 'new_tool',
    title: 'Qofeno v2.4 Release: Complete Media & Document Tools Suite',
    created_at: new Date().toISOString(),
    body: 'We have launched over 540+ online processing tools spanning PDF compression, image blur/crop/watermark, audio extraction, developer formatters, and AI text processing. All server-processed with zero tracking.',
    author: 'Mohd Zaheer Uddin'
  },
  {
    $id: 'v2.3.0',
    type: 'improvement',
    title: 'Plan-Aware File Retention & Priority Processing Queues',
    created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
    body: 'Free accounts now feature instant post-download file purging. Pro & Teams plan members enjoy 6-day input retention and 7-day output retention with 500MB+ file uploads.',
    author: 'Mohd Zaheer Uddin'
  },
  {
    $id: 'v2.2.0',
    type: 'fix',
    title: 'Dual Envelope Ingestion & High-Availability Exception Tracking',
    created_at: new Date(Date.now() - 86400000 * 7).toISOString(),
    body: 'Sentry error reporting and BetterStack uptime monitoring have been upgraded with dual HTTP fallback to ensure 100% immediate delivery of execution alerts.',
    author: 'Mohd Zaheer Uddin'
  }
];

export function BlogDocs() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch What's New posts from Appwrite
  useEffect(() => {
    async function fetchPosts() {
      try {
        const res = await databases.listDocuments(DATABASE_ID, 'whats_new', [
          Query.equal('published', true),
          Query.orderDesc('created_at')
        ]);
        if (res.documents?.length > 0) {
          setEntries(res.documents as unknown as TimelineEntry[]);
        } else {
          setEntries(FALLBACK_ENTRIES);
        }
      } catch (err) {
        console.error("Failed to load changelog updates:", err);
        setEntries(FALLBACK_ENTRIES);
      } finally {
        setLoading(false);
      }
    }
    fetchPosts();
  }, []);

  // Reading Progress loop based on main window scroll
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

  const displayList = entries.length > 0 ? entries : FALLBACK_ENTRIES;

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
          <span className="text-xs font-black uppercase tracking-widest text-purple-600 bg-purple-100 px-3.5 py-1.5 rounded-full inline-block mb-4">
            Changelog & Updates
          </span>
          <h1 className="font-display text-4xl md:text-6xl font-black text-[#0F0A1E] mb-6 tracking-tight">What's New</h1>
          <p className="text-lg text-neutral-500 max-w-xl font-medium">
            A chronological log of new tools, performance improvements, and security updates shipped to Qofeno.
          </p>
        </div>

        {/* TIMELINE LIST */}
        <div className="relative border-l-2 border-purple-200/60 pl-8 md:pl-12 pb-12 space-y-16">
          {loading ? (
             <div className="text-center py-16 text-neutral-400 font-bold">Loading updates...</div>
          ) : (
            displayList.map((entry, index) => {
              const formattedDate = new Date(entry.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
              return (
                <div 
                  key={entry.$id || index}
                  className="relative"
                >
                  {/* TIMELINE DOT */}
                  <div className="absolute -left-[41px] md:-left-[57px] top-1.5 w-4 h-4 bg-white border-[3px] border-purple-600 rounded-full shadow-sm" />
                  
                  {/* CONTENT AREA */}
                  <div className="bg-white border border-neutral-150 rounded-3xl p-6 md:p-8 shadow-xl shadow-purple-900/5 transition-all hover:shadow-2xl hover:shadow-purple-900/10">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <span className={cn("inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border", getBadgeStyle(entry.type))}>
                        <FontAwesomeIcon icon={getBadgeIcon(entry.type)} className="w-3.5 h-3.5" />
                        {getBadgeLabel(entry.type)}
                      </span>
                      <span className="text-xs font-bold text-neutral-400">{formattedDate}</span>
                    </div>
                    
                    <h2 className="font-display text-2xl font-bold text-[#0F0A1E] mb-3">{entry.title}</h2>
                    
                    <div className="text-xs font-extrabold text-neutral-500 mb-6 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-600 to-fuchsia-500 text-white text-[10px] font-black flex items-center justify-center shadow-sm">MZ</div>
                      By {entry.author || 'Mohd Zaheer Uddin'}
                    </div>
                    
                    <div className="text-neutral-600 text-[15px] leading-relaxed whitespace-pre-wrap font-medium">
                      {entry.body}
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
