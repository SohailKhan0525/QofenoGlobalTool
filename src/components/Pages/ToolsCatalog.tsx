import React, { useState, useEffect, useMemo } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faFire, faWandMagicSparkles, faSliders, faChevronDown, faChevronRight, faCheck, faHeart, faGear } from '@fortawesome/free-solid-svg-icons';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { SEO } from '../../components/SEO';
import { Skeleton } from "@/components/ui/skeleton";
import { FALLBACK_TOOLS, useToolCatalog } from '../../lib/toolCatalog';
import { account, databases, DATABASE_ID, trackEvent } from '../../lib/qofeno-appwrite';
import { Query } from 'appwrite';
import { useAuth } from '../../context/AuthContext';

const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const ALL_TOOLS = FALLBACK_TOOLS;

const ImageWithFallback = ({ src, icon: Icon, alt }: { src?: string | null, icon: any, alt: string }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!src || imgError) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 overflow-hidden relative">
        <FontAwesomeIcon icon={Icon} className="w-6 h-6 text-purple-600 relative z-10" />
      </div>
    );
  }

  return (
    <div className="w-full h-32 rounded-xl bg-neutral-100 flex items-center justify-center mb-6 overflow-hidden relative group-hover:shadow-lg transition-all duration-300">
      {!imgLoaded && (
        <div className="absolute inset-0 bg-neutral-200 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          imgLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setImgLoaded(true)}
        onError={() => setImgError(true)}
      />
    </div>
  );
};

interface ToolsCatalogProps {
  onNavigate: (page: string) => void;
}

export function ToolsCatalog({ onNavigate }: ToolsCatalogProps) {
  const { tools, categoryCards } = useToolCatalog();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Tools');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [activeFilterTag, setActiveFilterTag] = useState('All'); // All, Favorites, Free, Pro, New, Popular
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [popularToolSlugs, setPopularToolSlugs] = useState<string[]>([]);
  const [toolViewCounts, setToolViewCounts] = useState<Record<string, number>>({});

  const getOrCreateAnonId = () => {
    try {
      let aid = localStorage.getItem('anon_user_id');
      if (!aid) {
        // Generate a stable anonymous id for like/view tracking.
        const seed = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
        aid = `anon-${seed}`;
        localStorage.setItem('anon_user_id', aid);
      }
      return aid;
    } catch { return null }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 200);
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q') || '';
    const category = params.get('category') || 'All Tools';
    const sub = params.get('sub') || null;
    const filter = params.get('filter') || 'All';
    setSearchQuery(q);
    setDebouncedSearch(q);
    setSelectedCategory(category === 'all' ? 'All Tools' : category);
    setSelectedSubCategory(sub);
    setActiveFilterTag(filter);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());
    if (selectedCategory !== 'All Tools') params.set('category', selectedCategory);
    if (selectedSubCategory) params.set('sub', selectedSubCategory);
    if (activeFilterTag !== 'All') params.set('filter', activeFilterTag);
    const next = params.toString();
    const url = next ? `/tools?${next}` : '/tools';
    window.history.replaceState({}, '', url);
  }, [debouncedSearch, selectedCategory, selectedSubCategory, activeFilterTag]);


  useEffect(() => {
    let cancelled = false;

    const initialCategory = localStorage.getItem('selected_category_filter');
    if (initialCategory) {
      setSelectedCategory(initialCategory);
      localStorage.removeItem('selected_category_filter');
    }
    const initialSearch = localStorage.getItem('qofeno_initial_search');
    if (initialSearch) {
      setSearchQuery(initialSearch);
      localStorage.removeItem('qofeno_initial_search');
    }

    const loadLocal = () => {
      try {
        const favs = JSON.parse(localStorage.getItem('qofeno_likes') || '[]');
        setFavorites(favs);
      } catch {}
      try {
        const rv = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
        setRecentlyViewed(rv);
      } catch {}
    };

    // use outer getOrCreateAnonId

    const loadRemote = async () => {
      try {
        const viewsRes = await databases.listDocuments(DATABASE_ID, 'tool_views', [Query.orderDesc('count'), Query.limit(1000)]);
        const popularSlugs = (viewsRes.documents || []).map((d: any) => String(d.tool_slug));
        const countsMap: Record<string, number> = {};
        (viewsRes.documents || []).forEach((d: any) => {
          countsMap[d.tool_slug] = Number(d.count || 0);
        });
        if (!cancelled) {
          setPopularToolSlugs(popularSlugs);
          setToolViewCounts(countsMap);
        }
      } catch (err) {
        console.error("Failed to load popular tool views", err);
      }

      try {
        const user = await account.get();
        const userId = user?.$id;
        if (!userId) return;

        const likes = await databases.listDocuments(DATABASE_ID, 'tool_likes', [Query.equal('user_id', userId), Query.limit(1000)]);
        const likedSlugs = (likes.documents || []).map((d: any) => String(d.tool_slug));
        if (!cancelled) setFavorites(likedSlugs);

        const rv = await databases.listDocuments(DATABASE_ID, 'recently_viewed', [Query.equal('user_id', userId), Query.orderDesc('viewed_at'), Query.limit(20)]);
        const recentIds = (rv.documents || []).map((d: any) => String(d.tool_slug));
        if (!cancelled) setRecentlyViewed(recentIds.slice(0, 4));
      } catch {
        // Anonymous visitors fall back to local storage only.
      }
    };

    loadLocal();
    void loadRemote();

    return () => { cancelled = true };
  }, []);

  const toggleFavorite = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      const user = await account.get();
      if (user && user.$id) {
        const userId = user.$id;
        const isFav = favorites.includes(id);
        await trackEvent(isFav ? 'unlike' : 'like', id, userId);
        setFavorites(prev => isFav ? prev.filter(f => f !== id) : [...prev, id]);
        return;
      }
    } catch {
      // not logged in — try anonymous server-side user
    }
    try {
      const anon = getOrCreateAnonId();
      const isFav = favorites.includes(id);
      if (anon) {
        const nextFavs = isFav ? favorites.filter(f => f !== id) : [...favorites, id];
        await trackEvent(isFav ? 'unlike' : 'like', id, anon);
        setFavorites(nextFavs);
        localStorage.setItem('qofeno_likes', JSON.stringify(nextFavs));
        return;
      }
    } catch {}

    // final fallback: localStorage toggle
    setFavorites(prev => {
      const isFav = prev.includes(id);
      const newFavs = isFav ? prev.filter(f => f !== id) : [...prev, id];
      localStorage.setItem('qofeno_likes', JSON.stringify(newFavs));
      return newFavs;
    });
  };

  const toggleExpand = (cat: string) => {
    setExpandedCats(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  // Tag list for quick header filters
  const filterTags = ['All', 'Favorites', 'Free', 'Pro', 'New', 'Popular'];

  // Unique popular tags computation
  const popularTags = useMemo(() => {
    const counts: Record<string, number> = {};
    const sourceTools = tools.length > 0 ? tools : FALLBACK_TOOLS;
    sourceTools.forEach(tool => {
      if (Array.isArray(tool.tags)) {
        tool.tags.forEach(tag => {
          const t = tag.toLowerCase().trim();
          if (t && t.length > 1) {
            counts[t] = (counts[t] || 0) + 1;
          }
        });
      }
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 16);
  }, [tools]);

  const filteredTools = useMemo(() => {
    const sourceTools = tools.length > 0 ? tools : FALLBACK_TOOLS;
    let list = sourceTools.filter(tool => {
      // Search query check (matches name, description or tags)
      const matchesSearch = tool.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                tool.desc.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
                (tool.tags && tool.tags.some(tag => tag.toLowerCase().includes(debouncedSearch.toLowerCase())));
      
      // Category check
      let matchesCategory = true;
      if (selectedCategory !== 'All Tools') {
        const allowedCats = selectedCategory.split(',');
        matchesCategory = allowedCats.includes(tool.category);
      }

      // Subcategory check
      let matchesSub = true;
      if (selectedSubCategory) {
        matchesSub = tool.subcategory === selectedSubCategory;
      }

      // Quick tag filters Check
      let matchesTag = true;
      if (activeFilterTag === 'Favorites') {
        matchesTag = favorites.includes(tool.id);
      } else if (activeFilterTag === 'Free') {
        matchesTag = tool.type === 'Free';
      } else if (activeFilterTag === 'Pro') {
        matchesTag = tool.type === 'Pro';
      } else if (activeFilterTag === 'New') {
        const isNew = (tool.is_new_until && new Date(tool.is_new_until) > new Date()) || 
                      (tool.addedAt ? (Date.now() - new Date(tool.addedAt).getTime() < 7 * 24 * 60 * 60 * 1000) : tool.isNew);
        matchesTag = !!isNew;
      } else if (activeFilterTag === 'Popular') {
        matchesTag = tool.isPopular || popularToolSlugs.includes(tool.slug) || ((toolViewCounts[tool.slug] || 0) > 0);
      }

      // Selected popular tag check
      let matchesSelectedTag = true;
      if (selectedTag) {
        matchesSelectedTag = !!(tool.tags && tool.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase()));
      }

      return matchesSearch && matchesCategory && matchesSub && matchesTag && matchesSelectedTag;
    });

    if (activeFilterTag === 'Popular') {
      list = [...list].sort((a, b) => {
        const countA = toolViewCounts[a.slug] || (a.isPopular ? 10 : 0);
        const countB = toolViewCounts[b.slug] || (b.isPopular ? 10 : 0);
        return countB - countA;
      });
    }

    return list;
  }, [debouncedSearch, selectedCategory, selectedSubCategory, activeFilterTag, selectedTag, favorites, popularToolSlugs, toolViewCounts, tools]);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 md:pt-40 md:pb-32 px-6 md:px-12">
      <SEO title="All Tools - Search Catalog" description="Browse all our free tools for developers, designers, and students." />
      <div className="max-w-7xl mx-auto">
        
        {/* TOP PANEL: SEARCH & DESCRIPTIONS */}
        <div className="mb-12">
          <span className="text-xs uppercase font-bold tracking-wider text-purple-600 bg-purple-100/50 py-1.5 px-3.5 rounded-full inline-block mb-4">
            Every tool you'll ever need
          </span>
          <h1 className="font-display text-4xl md:text-5xl font-black text-[#0F0A1E] mb-8 tracking-tight">Search all tools</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            {/* Massive Search input and inline action buttons */}
            <div className="lg:col-span-2 sticky top-[72px] md:top-auto z-20 bg-[#FAFAFA] py-2 md:py-0 flex items-center gap-3">
              <div className="relative flex-1">
                <input 
                  type="text" 
                  placeholder="Find tools..." 
                  className="w-full bg-white border border-neutral-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 rounded-2xl py-4.5 pl-14 pr-12 outline-none text-neutral-800 text-lg shadow-sm transition-all placeholder-neutral-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <FontAwesomeIcon icon={faMagnifyingGlass} className="w-6 h-6 text-neutral-400 absolute left-5 top-1/2 -translate-y-1/2" />
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center cursor-pointer"
                    aria-label="Clear search"
                  >
                    ×
                  </button>
                ) : null}
              </div>

              {/* Desktop Categories Toggle Button */}
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className="hidden lg:flex items-center gap-2 bg-white border border-neutral-200 hover:border-purple-200 text-neutral-700 hover:text-purple-650 px-5 py-4.5 rounded-2xl font-bold transition-all cursor-pointer shadow-sm shrink-0"
              >
                <FontAwesomeIcon icon={faSliders} className="w-5 h-5" />
                <span>Categories</span>
              </button>

              {/* Mobile Filters Trigger Button */}
              <button
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center justify-center w-[58px] h-[58px] bg-white border border-neutral-200 text-neutral-700 rounded-2xl font-bold transition-all cursor-pointer shadow-sm shrink-0"
              >
                <FontAwesomeIcon icon={faSliders} className="w-5 h-5" />
              </button>
            </div>

            {/* Quick action chips for filtering in header */}
            <div className="flex overflow-x-auto lg:flex-wrap gap-2 pb-2 lg:pb-0 snap-x">
              {filterTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    if (tag === 'Favorites' && !isAuthenticated) {
                      onNavigate('login');
                      return;
                    }
                    setActiveFilterTag(tag);
                  }}
                  className={cn(
                    "shrink-0 snap-start px-4 py-2.5 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer border",
                    activeFilterTag === tag
                      ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/10"
                      : "bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200"
                  )}
                >
                  {tag === 'Popular' && <FontAwesomeIcon icon={faFire} className="w-4 h-4 inline mr-1 fill-amber-500 text-amber-500" />}
                  {tag}
                </button>
              ))}
            </div>
            {popularTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4 items-center overflow-x-auto pb-1">
                <span className="text-[10px] font-black uppercase text-neutral-400 tracking-wider shrink-0 mr-1">Popular Tags:</span>
                {popularTags.map(tag => {
                  const isSelected = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setSelectedTag(isSelected ? null : tag)}
                      className={cn(
                        "shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 cursor-pointer border",
                        isSelected 
                          ? "bg-purple-100 text-purple-700 border-purple-200" 
                          : "bg-white hover:bg-neutral-50 text-neutral-600 border-neutral-200"
                      )}
                    >
                      #{tag}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RECENTLY VIEWED SECTION */}
        {recentlyViewed.length > 0 && searchQuery === '' && selectedCategory === 'All Tools' && activeFilterTag === 'All' && (
          <div className="mb-12">
            <h2 className="text-sm uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-2 mb-4">
              <FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4 text-purple-600" />
              Recently Viewed
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 snap-x custom-scrollbar">
              {recentlyViewed.map(id => {
                const tool = tools.find(t => t.id === id) || FALLBACK_TOOLS.find(t => t.id === id);
                if (!tool) return null;
                const ToolIcon = tool.icon;
                return (
                  <div
                    key={`rv-${tool.id}`}
                    onClick={() => {
                      localStorage.setItem('selected_tool_id', tool.id);
                      onNavigate('tool');
                    }}
                    className="shrink-0 snap-start w-[280px] bg-white border border-neutral-200/50 rounded-2xl p-4 hover:border-purple-200 hover:shadow-lg hover:shadow-purple-500/5 cursor-pointer flex items-center gap-4 transition-all"
                  >
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                      <FontAwesomeIcon icon={ToolIcon} className="w-5 h-5 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#0F0A1E] truncate w-full group-hover:text-purple-600 transition-colors">{tool.name}</h4>
                      <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">{tool.category}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SIDEBAR & MAIN AREA COLLABORATIVE PATTERN */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR: CATEGORY filtering (Hidden on Mobile, toggleable on Desktop) */}
          {showSidebar && (
            <aside className="hidden lg:flex w-full lg:w-72 shrink-0 bg-white border border-neutral-200/60 rounded-3xl p-6 self-start flex-col sticky top-[100px] h-fit max-h-[calc(100vh-120px)] overflow-y-auto animate-none">
            <h3 className="text-sm uppercase font-bold text-neutral-400 tracking-wider mb-6 flex items-center gap-2">
              <FontAwesomeIcon icon={faSliders} className="w-4 h-4 text-purple-600" /> Filter Categories
            </h3>
            
            <nav className="flex flex-col gap-2">
              {categoryCards.map((cat, idx) => {
                const isSelected = selectedCategory === cat.name;
                const hasSub = cat.sub && cat.sub.length > 0;
                const isExpanded = expandedCats[cat.name];

                return (
                  <div key={idx} className="flex flex-col">
                    <button
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setSelectedSubCategory(null);
                        if (hasSub) toggleExpand(cat.name);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-between cursor-pointer",
                        isSelected 
                          ? "bg-purple-50 text-purple-700 border-l-4 border-purple-600" 
                          : "hover:bg-neutral-50 text-neutral-700"
                      )}
                    >
                      <span>{cat.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400 bg-neutral-100 rounded-lg px-2 py-0.5">{cat.count}</span>
                        {hasSub && (isExpanded ? <FontAwesomeIcon icon={faChevronDown} className="w-4 h-4 text-neutral-400" /> : <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 text-neutral-400" />)}
                      </div>
                    </button>

                    {/* Expandable subcategories nested with spring transition */}
                    <AnimatePresence>
                      {hasSub && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pl-6 pt-1.5 pb-2.5 flex flex-col gap-1 border-l border-neutral-100 ml-4 mb-2 overflow-hidden.5"
                        >
                          {cat.sub?.map((sub, sIdx) => {
                            const isSubSelected = selectedSubCategory === sub;
                            return (
                              <button
                                key={sIdx}
                                onClick={() => setSelectedSubCategory(sub === selectedSubCategory ? null : sub)}
                                className={cn(
                                  "w-full text-left font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-between cursor-pointer",
                                  isSubSelected 
                                    ? "text-purple-600 bg-purple-50/50" 
                                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                                )}
                              >
                                <span>{sub}</span>
                                {isSubSelected && <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-purple-600" />}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </nav>
          </aside>
          )}

          {/* MAIN COLUMN: CARDS GRID REFLOWS */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <span className="text-sm font-semibold text-neutral-500">
                Found <span className="text-neutral-900 font-extrabold">{filteredTools.length}</span> tools
              </span>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All Tools');
                  setSelectedSubCategory(null);
                  setActiveFilterTag('All');
                  setSelectedTag(null);
                }}
                className="text-xs text-purple-600 hover:text-purple-800 font-bold transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredTools.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                      <div
                        key={tool.id}
                        onClick={() => {
                          if (tool.is_coming_soon) return;
                          localStorage.setItem('selected_tool_id', tool.id);
                          onNavigate('tool');
                        }}
                        className={cn(
                          "group bg-white border border-neutral-200/50 rounded-3xl p-6 hover:shadow-xl hover:shadow-purple-500/10 cursor-pointer flex flex-col transition-all duration-300 relative",
                          !prefersReduced && !tool.is_coming_soon && "hover:-translate-y-1.5 hover:scale-[1.02] active:scale-[0.98]",
                          tool.is_coming_soon && "opacity-75 bg-neutral-50/50 border-neutral-200/80 cursor-default"
                        )}
                      >
                        <div className="absolute top-6 right-6 flex items-center gap-1.5 z-10">
                          {tool.is_coming_soon ? (
                            <span className="bg-neutral-200 text-neutral-600 text-[10px] font-black tracking-wider px-2.5 py-0.5 rounded-md shadow-sm">
                              COMING SOON
                            </span>
                          ) : (
                            <>
                              <button 
                                onClick={(e) => toggleFavorite(e, tool.id)}
                                className={cn(
                                  "p-1.5 rounded-full transition-colors cursor-pointer",
                                  favorites.includes(tool.id) ? "bg-pink-100 text-pink-600" : "bg-neutral-100 text-neutral-400 hover:text-pink-600 hover:bg-pink-50"
                                )}
                              >
                                <FontAwesomeIcon icon={faHeart} className={cn("w-4 h-4", favorites.includes(tool.id) && "fill-current")} />
                              </button>
                              {((tool.is_new_until && new Date(tool.is_new_until) > new Date()) || (tool.addedAt ? (Date.now() - new Date(tool.addedAt).getTime() < 7 * 24 * 60 * 60 * 1000) : tool.isNew)) && (
                                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                  NEW
                                </span>
                              )}
                              {tool.isPopular && (
                                <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <FontAwesomeIcon icon={faFire} className="w-3.5 h-3.5 fill-current text-amber-500" />
                                  POP
                                </span>
                              )}
                              {tool.type === 'Pro' && (
                                <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md shadow-sm">
                                  PRO
                                </span>
                              )}
                            </>
                          )}
                        </div>

                        <div>
                          <ImageWithFallback src={tool.imageUrl} icon={ToolIcon} alt={tool.name} />
                          
                          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1 flex items-center gap-2">
                            {tool.subcategory}
                            <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                              <FontAwesomeIcon icon={faGear} className="w-3 h-3" /> Server-processed
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-[#0F0A1E] group-hover:text-purple-600 transition-colors mb-2 truncate max-w-full tool-card-title">{tool.name}</h3>
                          <p className="text-sm text-neutral-500 leading-relaxed line-clamp-2 min-h-[40px] overflow-hidden text-ellipsis tool-card-desc">{tool.desc}</p>
                          
                          <div className="flex items-center gap-3 text-xs text-neutral-400 font-bold mt-4 pt-4 border-t border-neutral-100">
                            <span className="flex items-center gap-1">
                              <svg className="w-3.5 h-3.5 text-neutral-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              {tool.runs} views
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>

            {filteredTools.length === 0 && (
              <div className="bg-white border border-neutral-200/50 rounded-3xl p-16 text-center max-w-lg mx-auto mt-12">
                 {/* Honest Empty State SVG/Icon */}
                 <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center mx-auto mb-6 animate-[bounce_4s_ease-in-out_infinite]">
                   <FontAwesomeIcon icon={faMagnifyingGlass} className="w-6 h-6 text-neutral-400" />
                 </div>
                <h3 className="font-display font-black text-[#0F0A1E] text-2xl mb-2">No tools found for this search</h3>
                <p className="text-neutral-500 text-sm mb-8 leading-relaxed">
                  We're adding new tools every week. If you need something specific that isn't here yet, let us know and we'll build it.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button 
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All Tools');
                      setSelectedSubCategory(null);
                      setActiveFilterTag('All');
                    }}
                    className="bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl px-6 py-3 text-sm font-bold transition-colors cursor-pointer"
                  >
                    Clear Filter
                  </button>
                  <button 
                    onClick={() => onNavigate && onNavigate('contact')}
                    className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6 py-3 text-sm font-bold transition-colors shadow-lg shadow-purple-600/10 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    Suggest this tool <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </main>

        </div>
      </div>
      {/* MOBILE FILTER FAB */}
      <button 
        onClick={() => setIsMobileFilterOpen(true)}
        className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0F0A1E] text-white px-6 py-3.5 rounded-full shadow-2xl font-bold flex items-center gap-2 z-40 cursor-pointer border border-neutral-700 hover:scale-105 active:scale-95 transition-all"
      >
        <FontAwesomeIcon icon={faSliders} className="w-4 h-4" /> Filters
      </button>

      {/* MOBILE FILTER BOTTOM SHEET */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <motion.div 
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.2 }}
            className="lg:hidden fixed inset-0 z-50 bg-[#0F0A1E]/40 backdrop-blur-sm pointer-events-auto flex items-end justify-center"
            onClick={() => setIsMobileFilterOpen(false)}
          >
            <motion.div 
              initial={prefersReduced ? { y: 0 } : { y: "100%" }}
              animate={{ y: 0 }}
              exit={prefersReduced ? { y: 0 } : { y: "100%" }}
              transition={prefersReduced ? { duration: 0 } : { type: "spring", stiffness: 400, damping: 28 }}
              className="w-full bg-white rounded-t-[24px] rounded-b-none p-6 pt-2 pb-8 max-h-[85vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto my-4 cursor-grab" />
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-[#0F0A1E]">Filters</h3>
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="bg-neutral-100 w-8 h-8 rounded-full flex items-center justify-center font-bold text-neutral-500 pb-1"
                >
                  x
                </button>
              </div>

              {/* Mobile filter copy from desktop */}
              <nav className="flex flex-col gap-2 mb-6">
              {categoryCards.map((cat, idx) => {
                const isSelected = selectedCategory === cat.name;
                const hasSub = cat.sub && cat.sub.length > 0;
                const isExpanded = expandedCats[cat.name];

                return (
                  <div key={idx} className="flex flex-col">
                    <button
                      onClick={() => {
                        setSelectedCategory(cat.name);
                        setSelectedSubCategory(null);
                        if (hasSub) toggleExpand(cat.name);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-2xl font-bold text-sm transition-all flex items-center justify-between cursor-pointer",
                        isSelected 
                          ? "bg-purple-50 text-purple-700 border-l-4 border-purple-600" 
                          : "hover:bg-neutral-50 text-neutral-700"
                      )}
                    >
                      <span>{cat.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-neutral-400 bg-neutral-100 rounded-lg px-2 py-0.5">{cat.count}</span>
                        {hasSub && (isExpanded ? <FontAwesomeIcon icon={faChevronDown} className="w-4 h-4 text-neutral-400" /> : <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 text-neutral-400" />)}
                      </div>
                    </button>

                    <AnimatePresence>
                      {hasSub && isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pl-6 pt-1.5 pb-2.5 flex flex-col gap-1 border-l border-neutral-100 ml-4 mb-2 overflow-hidden"
                        >
                          {cat.sub?.map((sub, sIdx) => {
                            const isSubSelected = selectedSubCategory === sub;
                            return (
                              <button
                                key={sIdx}
                                onClick={() => setSelectedSubCategory(sub === selectedSubCategory ? null : sub)}
                                className={cn(
                                  "w-full text-left font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-between cursor-pointer",
                                  isSubSelected 
                                    ? "text-purple-600 bg-purple-50/50" 
                                    : "text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50"
                                )}
                              >
                                <span>{sub}</span>
                                {isSubSelected && <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 text-purple-600" />}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
              </nav>

              <div className="flex gap-4">
                <button 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All Tools');
                    setSelectedSubCategory(null);
                    setActiveFilterTag('All');
                    setIsMobileFilterOpen(false);
                  }}
                  className="flex-1 bg-neutral-100 text-neutral-700 py-3.5 rounded-xl font-bold cursor-pointer hover:bg-neutral-200"
                >
                  Clear
                </button>
                <button 
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="flex-[2] bg-purple-600 text-white py-3.5 rounded-xl font-bold cursor-pointer hover:bg-purple-700 shadow-lg shadow-purple-600/20"
                >
                  Apply Filters
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
