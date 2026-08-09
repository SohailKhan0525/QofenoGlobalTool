import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faClock, faStar, faGear, faShieldHalved, faHardDrive,
  faBolt, faCircleCheck, faSpinner, faArrowUpRightFromSquare, faTrash,
  faWandMagicSparkles, faChevronRight, faLayerGroup
} from '@fortawesome/free-solid-svg-icons';
import { databases, DATABASE_ID } from '../../lib/qofeno-appwrite';
import { useAuth } from '../../context/AuthContext';
import { SEO } from '../../components/SEO';
import { PlanBadge } from '../../components/PlanBadge';
import { Query } from 'appwrite';
import { FALLBACK_TOOLS, useToolCatalog } from '../../lib/toolCatalog';
import { toast } from 'sonner';

export function Profile({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const { user } = useAuth();
  
  // States
  const [memberSince, setMemberSince] = useState('');
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [usageStats, setUsageStats] = useState({ toolsUsed: 0, filesProcessed: 0 });
  const [likedTools, setLikedTools] = useState<string[]>([]);
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [lastViewedSlug, setLastViewedSlug] = useState<string>('');

  useEffect(() => {
    let cancelled = false;

    const loadProfileData = async () => {
      const initDate = user?.$createdAt || user?.createdAt;
      if (initDate) {
        const d = new Date(initDate);
        if (!isNaN(d.getTime())) {
          setMemberSince(d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
        }
      }

      // 1. Users Meta
      if (user?.id) {
        try {
          const metaDocs = await databases.listDocuments(DATABASE_ID, 'users_meta', [
            Query.equal('user_id', user.id),
            Query.limit(1)
          ]);
          
          if (!cancelled && metaDocs.documents.length > 0) {
            const doc = metaDocs.documents[0];
            setUsageStats({
              toolsUsed: doc.tools_used || 0,
              filesProcessed: doc.files_processed || 0
            });
          }
        } catch {}
      }

      // 2. Liked / Favorites Tools
      let likes: string[] = [];
      if (user?.id) {
        try {
          const likesDocs = await databases.listDocuments(DATABASE_ID, 'tool_likes', [
            Query.equal('user_id', user.id),
            Query.limit(100)
          ]);
          likes = likesDocs.documents.map((d: any) => String(d.tool_slug || d.tool_id));
        } catch {}
      }

      try {
        const localLikes = JSON.parse(localStorage.getItem('qofeno_likes') || '[]');
        if (Array.isArray(localLikes)) {
          likes = Array.from(new Set([...likes, ...localLikes]));
        }
      } catch {}
      if (!cancelled) setLikedTools(likes);

      // 3. Execution History
      let history: any[] = [];
      if (user?.id) {
        try {
          const execDocs = await databases.listDocuments(DATABASE_ID, 'tool_executions', [
            Query.equal('user_id', user.id),
            Query.orderDesc('created_at'),
            Query.limit(20)
          ]);
          history = execDocs.documents;
        } catch {}
      }

      let localHist: any[] = [];
      try {
        const rawLocal = localStorage.getItem('qofeno_tool_history') || localStorage.getItem('recently_viewed');
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed)) {
            localHist = parsed.map((item: any) => typeof item === 'string' ? { tool_slug: item, created_at: new Date().toISOString() } : item);
          }
        }
      } catch {}

      const mergedHistory = history.length > 0 ? history : localHist;
      if (!cancelled) {
        setHistoryItems(mergedHistory);
      }

      // 4. Last Viewed Tool
      let lastSlug = '';
      if (user?.id) {
        try {
          const rvDocs = await databases.listDocuments(DATABASE_ID, 'recently_viewed', [
            Query.equal('user_id', user.id),
            Query.orderDesc('viewed_at'),
            Query.limit(1)
          ]);
          if (rvDocs.documents.length > 0) {
            lastSlug = String(rvDocs.documents[0].tool_slug || '');
          }
        } catch {}
      }

      if (!lastSlug) {
        try {
          const rawRv = localStorage.getItem('recently_viewed');
          if (rawRv) {
            const parsed = JSON.parse(rawRv);
            if (Array.isArray(parsed) && parsed.length > 0) {
              lastSlug = typeof parsed[0] === 'string' ? parsed[0] : parsed[0].tool_slug || parsed[0].id;
            }
          }
        } catch {}
      }

      if (!lastSlug && mergedHistory.length > 0) {
        lastSlug = mergedHistory[0].tool_slug || mergedHistory[0].tool_id;
      }

      if (!cancelled && lastSlug) {
        setLastViewedSlug(lastSlug);
      }

      if (!cancelled) setLoadingMeta(false);
    };

    void loadProfileData();

    return () => { cancelled = true; };
  }, [user]);

  const handleClearHistory = async () => {
    try {
      if (user?.id) {
        for (const item of historyItems) {
          if (item.$id) {
            await databases.deleteDocument(DATABASE_ID, 'tool_executions', item.$id).catch(() => {});
          }
        }
      }
      localStorage.removeItem('qofeno_tool_history');
      localStorage.removeItem('recently_viewed');
      setHistoryItems([]);
      setLastViewedSlug('');
      toast.success("Tool execution history cleared.");
    } catch {
      toast.error("Failed to clear history.");
    }
  };

  const getInitials = (n = 'User') => {
    return n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  };

  const getAvatarBg = (n = 'User') => {
    const charCodeSum = n.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const colors = [
      'bg-purple-600',
      'bg-indigo-600',
      'bg-blue-600',
      'bg-pink-600',
      'bg-emerald-600',
      'bg-rose-600'
    ];
    return colors[charCodeSum % colors.length];
  };

  const navigateTo = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  const avatarBg = getAvatarBg(user.name);
  const userPlan = user.plan || 'free';
  const maxUpload = userPlan === 'teams' ? '1 GB' : (userPlan === 'pro' ? '500 MB' : '50 MB');
  const queueSpeed = userPlan === 'teams' ? 'Dedicated Priority Node' : (userPlan === 'pro' ? 'Priority Speed' : 'Standard Queue');

  const { tools: catalogFetched } = useToolCatalog();
  const catalogTools = catalogFetched.length > 0 ? catalogFetched : FALLBACK_TOOLS;

  const favoritedToolsList = catalogTools.filter(t => likedTools.includes(t.id) || likedTools.includes(t.slug));
  const lastToolObj = lastViewedSlug
    ? catalogTools.find(t => t.id === lastViewedSlug || t.slug === lastViewedSlug)
    : (historyItems[0] ? catalogTools.find(t => t.id === historyItems[0].tool_slug || t.id === historyItems[0].tool_id) : favoritedToolsList[0] || catalogTools[0]);
  const totalRunsCount = Math.max(usageStats.toolsUsed, historyItems.length);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-28 pb-24 px-4 select-none relative font-sans">
      <SEO title={`${user.name} — Profile Dashboard`} description="View your tool execution history, statistics, and saved favorites." />
      
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* 1. HERO PROFILE CARD */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between transition-all">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="relative shrink-0">
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.name} 
                  className="w-20 h-20 rounded-full object-cover shadow-lg shadow-purple-900/10 border-2 border-purple-100"
                />
              ) : (
                <div className={`w-20 h-20 rounded-full ${avatarBg} text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-purple-900/10`}>
                  {getInitials(user.name)}
                </div>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h1 className="text-2xl font-black text-[#0F0A1E]">{user.name}</h1>
                <PlanBadge plan={userPlan} />
              </div>
              <p className="text-neutral-500 text-sm mt-1">{user.email}</p>
              {memberSince && (
                <p className="text-neutral-400 text-xs mt-1.5 font-medium">Member since {memberSince}</p>
              )}
            </div>
          </div>
          
          <button 
            onClick={() => navigateTo('/settings')}
            className="px-5 py-3 bg-neutral-900 hover:bg-black text-white text-xs font-bold uppercase tracking-wider rounded-2xl transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow shrink-0"
          >
            <FontAwesomeIcon icon={faGear} className="w-3.5 h-3.5" /> Account Settings
          </button>
        </div>

        {/* 2. STATS OVERVIEW GRID */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm text-center">
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 mx-auto mb-2">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4" />
            </div>
            <span className="block text-2xl font-black text-[#0F0A1E]">{totalRunsCount}</span>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Total Runs</span>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm text-center">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-2">
              <FontAwesomeIcon icon={faHardDrive} className="w-4 h-4" />
            </div>
            <span className="block text-2xl font-black text-[#0F0A1E]">{maxUpload}</span>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Max Upload Limit</span>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm text-center">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 mx-auto mb-2">
              <FontAwesomeIcon icon={faStar} className="w-4 h-4" />
            </div>
            <span className="block text-2xl font-black text-[#0F0A1E]">{likedTools.length}</span>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Saved Favorites</span>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-sm text-center">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 mx-auto mb-2">
              <FontAwesomeIcon icon={faBolt} className="w-4 h-4" />
            </div>
            <span className="block text-xs font-bold text-emerald-700 truncate mt-1.5">{queueSpeed}</span>
            <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mt-1">Processing Queue</span>
          </div>
        </div>

        {/* 3. LAST VIEWED / QUICK RESUME BAR */}
        {lastToolObj && (
          <div className="bg-gradient-to-r from-purple-900 to-[#1a0f3a] text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="relative z-10 space-y-1 text-center md:text-left">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                <FontAwesomeIcon icon={faClock} className="w-3 h-3" /> Last Viewed Tool
              </div>
              <h3 className="text-xl font-black">{lastToolObj.name}</h3>
              <p className="text-purple-200/80 text-xs max-w-lg">{lastToolObj.desc}</p>
            </div>
            <button 
              onClick={() => {
                localStorage.setItem('selected_tool_id', lastToolObj.id);
                navigateTo(`/tools/${lastToolObj.id}`);
              }}
              className="relative z-10 px-6 py-3.5 bg-white hover:bg-purple-50 text-purple-950 font-black text-xs uppercase tracking-wider rounded-2xl transition-all cursor-pointer shadow-lg shrink-0 flex items-center gap-2"
            >
              Open Tool <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 4. EXECUTION HISTORY (2 COLS) */}
          <div className="lg:col-span-2 bg-white border border-neutral-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FontAwesomeIcon icon={faClock} className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#0F0A1E]">Tool Execution History</h2>
                  <p className="text-xs text-neutral-400 font-medium">Your recent operations and processes</p>
                </div>
              </div>
              {historyItems.length > 0 && (
                <button 
                  onClick={handleClearHistory}
                  className="text-xs text-neutral-400 hover:text-red-600 font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faTrash} className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {historyItems.length > 0 ? (
              <div className="space-y-3">
                {historyItems.map((item, idx) => {
                  const toolMatch = catalogTools.find(t => t.id === item.tool_slug || t.id === item.tool_id);
                  const toolTitle = toolMatch?.name || item.tool_name || item.tool_slug || 'Tool Process';
                  const dateStr = item.created_at || item.$createdAt ? new Date(item.created_at || item.$createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Recently';

                  return (
                    <div 
                      key={item.$id || idx}
                      onClick={() => {
                        if (toolMatch) {
                          localStorage.setItem('selected_tool_id', toolMatch.id);
                          navigateTo(`/tools/${toolMatch.id}`);
                        }
                      }}
                      className="p-4 rounded-2xl border border-neutral-100 hover:border-purple-200 bg-neutral-50/50 hover:bg-purple-50/20 transition-all flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-white border border-neutral-200 flex items-center justify-center text-purple-600 shrink-0 group-hover:scale-105 transition-transform">
                          <FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[#0F0A1E] truncate group-hover:text-purple-600 transition-colors">{toolTitle}</h4>
                          <span className="text-[11px] text-neutral-400 font-medium">{dateStr}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60 uppercase tracking-wider">
                          Completed
                        </span>
                        <FontAwesomeIcon icon={faChevronRight} className="w-3.5 h-3.5 text-neutral-300 group-hover:text-purple-600 transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 bg-neutral-50/60 border border-dashed border-neutral-200 rounded-2xl space-y-2">
                <FontAwesomeIcon icon={faClock} className="w-8 h-8 text-neutral-300 mx-auto mb-1" />
                <p className="text-sm font-bold text-neutral-600">No execution history yet</p>
                <p className="text-xs text-neutral-400">Tools you run will automatically log execution history here.</p>
                <button 
                  onClick={() => navigateTo('/tools')}
                  className="mt-3 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Explore All Tools
                </button>
              </div>
            )}
          </div>

          {/* 5. SAVED FAVORITES (1 COL) */}
          <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-neutral-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FontAwesomeIcon icon={faStar} className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-[#0F0A1E]">Starred Tools</h2>
                  <p className="text-xs text-neutral-400 font-medium">Quick access tools</p>
                </div>
              </div>
            </div>

            {favoritedToolsList.length > 0 ? (
              <div className="space-y-3">
                {favoritedToolsList.map(tool => (
                  <div 
                    key={tool.id}
                    onClick={() => {
                      localStorage.setItem('selected_tool_id', tool.id);
                      navigateTo(`/tools/${tool.id}`);
                    }}
                    className="p-3.5 rounded-2xl border border-neutral-100 hover:border-amber-200 bg-neutral-50/50 hover:bg-amber-50/20 transition-all flex items-center justify-between cursor-pointer group"
                  >
                    <div className="min-w-0 pr-2">
                      <h4 className="text-xs font-bold text-[#0F0A1E] truncate group-hover:text-purple-600 transition-colors">{tool.name}</h4>
                      <span className="text-[10px] text-neutral-400 font-medium block truncate">{tool.category}</span>
                    </div>
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3.5 h-3.5 text-neutral-300 group-hover:text-purple-600 shrink-0 transition-colors" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-neutral-50/60 border border-dashed border-neutral-200 rounded-2xl space-y-2">
                <FontAwesomeIcon icon={faStar} className="w-7 h-7 text-neutral-300 mx-auto mb-1" />
                <p className="text-xs font-bold text-neutral-600">No saved favorites</p>
                <p className="text-[11px] text-neutral-400">Click the star icon on any tool to pin it here.</p>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
