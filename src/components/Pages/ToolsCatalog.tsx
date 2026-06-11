import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  Flame,
  SlidersHorizontal,
  Settings,
  Heart,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { SEO } from '../../components/SEO';
import { Skeleton } from "@/components/ui/skeleton";
import { FALLBACK_TOOLS, useToolCatalog } from '../../lib/toolCatalog';
import { account, databases, DATABASE_ID, trackEvent } from '../../lib/qofeno-appwrite';
import { Query } from 'appwrite';

export const ALL_TOOLS = FALLBACK_TOOLS;

const ImageWithFallback = ({ src, icon: Icon, alt }: { src?: string | null, icon: any, alt: string }) => {
  const [imgError, setImgError] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);

  if (!src || imgError) {
    return (
      <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300 overflow-hidden relative">
        <Icon className="w-6 h-6 text-purple-600 relative z-10" />
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
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Tools');
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [activeFilterTag, setActiveFilterTag] = useState('All'); // All, Favorites, Free, Pro, New, Popular
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [isFiltering, setIsFiltering] = useState(false);

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

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
    setIsFiltering(true);
    const t = setTimeout(() => setIsFiltering(false), 300);
    return () => clearTimeout(t);
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

  // Filtering Logic
  const filteredTools = useMemo(() => {
    const sourceTools = tools.length > 0 ? tools : FALLBACK_TOOLS;
    return sourceTools.filter(tool => {
      // Search query check
      const matchesSearch = tool.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
                tool.desc.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      // Category check
      let matchesCategory = true;
      if (selectedCategory !== 'All Tools') {
        matchesCategory = tool.category === selectedCategory;
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
        matchesTag = tool.isNew;
      } else if (activeFilterTag === 'Popular') {
        matchesTag = tool.isPopular;
      }

      return matchesSearch && matchesCategory && matchesSub && matchesTag;
    });
  }, [debouncedSearch, selectedCategory, selectedSubCategory, activeFilterTag, favorites, tools]);

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
            {/* Massive Search input */}
            <div className="lg:col-span-2 relative sticky top-[72px] md:top-auto z-20 bg-[#FAFAFA] py-2 md:py-0">
              <input 
                type="text" 
                placeholder="Find tools..." 
                className="w-full bg-white border border-neutral-200 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 rounded-2xl py-4.5 pl-14 pr-12 outline-none text-neutral-800 text-lg shadow-sm transition-all placeholder-neutral-400"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Search className="w-6 h-6 text-neutral-400 absolute left-5 top-1/2 -translate-y-1/2" />
              {searchQuery ? (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-500 flex items-center justify-center"
                  aria-label="Clear search"
                >
                  ×
                </button>
              ) : null}
            </div>

            {/* Quick action chips for filtering in header */}
            <div className="flex overflow-x-auto lg:flex-wrap gap-2 pb-2 lg:pb-0 snap-x">
              {filterTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveFilterTag(tag)}
                  className={cn(
                    "shrink-0 snap-start px-4 py-2.5 rounded-full text-sm font-bold transition-all duration-200 cursor-pointer border",
                    activeFilterTag === tag
                      ? "bg-purple-600 text-white border-purple-600 shadow-lg shadow-purple-600/10"
                      : "bg-white hover:bg-neutral-50 text-neutral-700 border-neutral-200"
                  )}
                >
                  {tag === 'Popular' && <Flame className="w-4 h-4 inline mr-1 fill-amber-500 text-amber-500" />}
                  {tag}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RECENTLY VIEWED SECTION */}
        {recentlyViewed.length > 0 && searchQuery === '' && selectedCategory === 'All Tools' && activeFilterTag === 'All' && (
          <div className="mb-12">
            <h2 className="text-sm uppercase font-bold text-neutral-400 tracking-wider flex items-center gap-2 mb-4">
              <Sparkles className="w-4 h-4 text-purple-600" />
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
                      <ToolIcon className="w-5 h-5 text-purple-600" />
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
          
          {/* LEFT SIDEBAR: CATEGORY filtering (Hidden on Mobile) */}
          <aside className="hidden lg:flex w-full lg:w-72 shrink-0 bg-white border border-neutral-200/60 rounded-3xl p-6 self-start flex-col sticky top-[100px] h-fit max-h-[calc(100vh-120px)] overflow-y-auto">
            <h3 className="text-sm uppercase font-bold text-neutral-400 tracking-wider mb-6 flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-purple-600" /> Filter Categories
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
                        {hasSub && (isExpanded ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />)}
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
                                {isSubSelected && <Check className="w-3.5 h-3.5 text-purple-600" />}
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
                }}
                className="text-xs text-purple-600 hover:text-purple-800 font-bold transition-colors cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>

            <motion.div 
              layout 
              className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {isFiltering ? (
                  [...Array(6)].map((_, i) => (
                    <motion.div
                      key={`skeleton-${i}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="bg-white border border-neutral-200/50 rounded-3xl p-6 flex flex-col h-full"
                    >
                      <div className="w-full h-32 rounded-xl bg-neutral-100 flex items-center justify-center mb-6 overflow-hidden">
                        <Skeleton className="w-12 h-12 rounded-2xl" />
                      </div>
                      <Skeleton className="h-3 w-24 mb-3" />
                      <Skeleton className="h-6 w-3/4 mb-4" />
                      <div className="space-y-2 mt-auto">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                      </div>
                    </motion.div>
                  ))
                ) : (
                  filteredTools.map((tool) => {
                    const ToolIcon = tool.icon;
                    return (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.3 }}
                        key={tool.id}
                        onClick={() => {
                          localStorage.setItem('selected_tool_id', tool.id);
                          onNavigate('tool');
                        }}
                        whileHover={{ scale: 1.02, rotateX: 2, rotateY: -2, z: 20 }}
                        style={{ perspective: 1000 }}
                        className="group bg-white border border-neutral-200/50 rounded-3xl p-6 hover:shadow-2xl hover:shadow-purple-500/15 cursor-pointer flex flex-col transition-all duration-300 relative"
                      >
                        <div className="absolute top-6 right-6 flex items-center gap-1.5 z-10">
                          <button 
                            onClick={(e) => toggleFavorite(e, tool.id)}
                            className={cn(
                              "p-1.5 rounded-full transition-colors cursor-pointer",
                              favorites.includes(tool.id) ? "bg-pink-100 text-pink-600" : "bg-neutral-100 text-neutral-400 hover:text-pink-600 hover:bg-pink-50"
                            )}
                          >
                            <Heart className={cn("w-4 h-4", favorites.includes(tool.id) && "fill-current")} />
                          </button>
                          {tool.isNew && (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <span className="h-1.5 w-1.5 bg-emerald-500 rounded-full animate-pulse" />
                              NEW
                            </span>
                          )}
                          {tool.isPopular && (
                            <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Flame className="w-3.5 h-3.5 fill-current text-amber-500" />
                              POP
                            </span>
                          )}
                          {tool.type === 'Pro' && (
                            <span className="bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 text-[10px] font-extrabold px-2.5 py-0.5 rounded-md shadow-sm">
                              PRO
                            </span>
                          )}
                        </div>

                        <div>
                          <ImageWithFallback src={tool.imageUrl} icon={ToolIcon} alt={tool.name} />
                          
                          <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-1 flex items-center gap-2">
                            {tool.subcategory}
                            <span className="flex items-center gap-1 text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded">
                              <Settings className="w-3 h-3" /> Server-processed
                            </span>
                          </div>
                          <h3 className="text-lg font-bold text-[#0F0A1E] group-hover:text-purple-600 transition-colors mb-2">{tool.name}</h3>
                          <p className="text-sm text-neutral-500 leading-relaxed">{tool.desc}</p>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </motion.div>

            {filteredTools.length === 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-neutral-200/50 rounded-3xl p-16 text-center max-w-lg mx-auto mt-12"
              >
                 {/* Honest Empty State SVG/Icon */}
                 <div className="w-16 h-16 rounded-3xl bg-neutral-100 flex items-center justify-center mx-auto mb-6 animate-[bounce_4s_ease-in-out_infinite]">
                   <Search className="w-6 h-6 text-neutral-400" />
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
                    Suggest this tool <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </main>

        </div>
      </div>
      {/* MOBILE FILTER FAB */}
      <button 
        onClick={() => setIsMobileFilterOpen(true)}
        className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 bg-[#0F0A1E] text-white px-6 py-3.5 rounded-full shadow-2xl font-bold flex items-center gap-2 z-40 cursor-pointer border border-neutral-700 hover:scale-105 active:scale-95 transition-all"
      >
        <SlidersHorizontal className="w-4 h-4" /> Filters
      </button>

      {/* MOBILE FILTER BOTTOM SHEET */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-50 bg-[#0F0A1E]/40 backdrop-blur-sm pointer-events-auto flex items-end justify-center"
            onClick={() => setIsMobileFilterOpen(false)}
          >
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 28 }}
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
                        {hasSub && (isExpanded ? <ChevronDown className="w-4 h-4 text-neutral-400" /> : <ChevronRight className="w-4 h-4 text-neutral-400" />)}
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
                                {isSubSelected && <Check className="w-3.5 h-3.5 text-purple-600" />}
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
