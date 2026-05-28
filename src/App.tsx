/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { Home } from './components/Pages/Home';
import { ToolsCatalog } from './components/Pages/ToolsCatalog';
import { PricingView } from './components/Pages/PricingView';
import { BlogDocs } from './components/Pages/BlogDocs';
import { About } from './components/Pages/About';
import { Contact } from './components/Pages/Contact';
import { ComingSoon } from './components/Pages/ComingSoon';
import { Auth } from './components/Pages/Auth';
import { Payment } from './components/Pages/Payment';
import { ToolPage } from './components/Pages/ToolPage';
import { Terms } from './components/Pages/Terms';
import { Policy } from './components/Pages/Policy';
import { ForgotPassword } from './components/Pages/ForgotPassword';
import { AuthCallback } from './components/Pages/AuthCallback';
import { Dashboard } from './components/Pages/Dashboard';
import { Profile } from './components/Pages/Profile';
import { Settings } from './components/Pages/Settings';
import { NotFound } from './components/Pages/NotFound';
import { FaGithub, FaInstagram } from 'react-icons/fa';
import { FaToolbox } from 'react-icons/fa6';

// shadcn / UI components
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

// Icons & animations
import { Search, Plus, Calendar, Mail, FileText, CheckCircle2, User, Menu, X, LogOut, ChevronDown, Bell, Settings, Moon, Sun, Monitor, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import { cn } from './lib/utils';
import { toast } from 'sonner';
import { FALLBACK_TOOLS, useToolCatalog } from './lib/toolCatalog';
import { getPathForPage, parseRoute } from './lib/appRouter';
import { useAuth } from './context/AuthContext';

import { ErrorBoundary } from './components/ErrorBoundary';

// Page Transitions config as specified:
// Exit: opacity: 1→0, translateY: 0→-20, scale: 1→0.98, duration: 350ms
// Enter: opacity: 0→1, translateY: 20→0, scale: 0.98→1, duration: 550ms, delay: 50ms
const PAGE_VARIANTS: any = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98,
    filter: 'blur(4px)'
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.55,
      ease: [0.22, 1, 0.36, 1],
      delay: 0.05
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.98,
    filter: 'blur(4px)',
    transition: {
      duration: 0.35,
      ease: [0.4, 0, 1, 1]
    }
  }
};

export default function App() {
  const { user, isAuthenticated, isLoading: isAuthLoading, logout } = useAuth();
  const { tools } = useToolCatalog();
  const initialRoute = parseRoute(window.location.pathname, window.location.search);
  const [activeTab, setActiveTabState] = useState(initialRoute.page);
  const [currentToolSlug, setCurrentToolSlug] = useState(initialRoute.toolSlug || localStorage.getItem('selected_tool_id') || 'json-formatter');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestToolName, setRequestToolName] = useState('');
  const [requestToolDesc, setRequestToolDesc] = useState('');
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [navbarScrolled, setNavbarScrolled] = useState(false);
  
  // Interactive width-expanding search trigger in navbar
  const [searchOpen, setSearchOpen] = useState(false);
  const [navbarSearchText, setNavbarSearchText] = useState('');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('light');

  // Real, persistent-ready state for notifications
  const [notifications, setNotifications] = useState([
    { id: '1', title: "Your tool request 'JSON Validator' is live!", time: "2 hours ago", read: false },
    { id: '2', title: "You successfully upgraded to Pro.", time: "1 day ago", read: true },
    { id: '3', title: "New AI tools added to the catalog.", time: "3 days ago", read: true }
  ]);

  // Real states for notification preferences inside the Preferences Dialog
  const [prefAppUpdates, setPrefAppUpdates] = useState(true);
  const [prefMarketing, setPrefMarketing] = useState(false);
  const [prefSecurityAlerts, setPrefSecurityAlerts] = useState(true);

  const appTools = tools.length > 0 ? tools : FALLBACK_TOOLS;

  const setActiveTab = (page: string) => {
    if (page.startsWith('/')) {
      const route = parseRoute(page, '');
      if (route.page === 'tool') {
        const slug = route.toolSlug || currentToolSlug || 'json-formatter';
        setCurrentToolSlug(slug);
        localStorage.setItem('selected_tool_id', slug);
      }
      window.history.pushState({}, '', page);
      setActiveTabState(route.page);
      return;
    }

    if (page === 'tool') {
      const slug = localStorage.getItem('selected_tool_id') || currentToolSlug || 'json-formatter';
      setCurrentToolSlug(slug);
      window.history.pushState({}, '', getPathForPage('tool', slug));
      setActiveTabState('tool');
      return;
    }

    window.history.pushState({}, '', getPathForPage(page as any));
    setActiveTabState(page as any);
  };

  const goToProCheckout = () => {
    if (isAuthenticated) {
      setActiveTab('payment');
      return;
    }

    window.history.pushState({}, '', '/login?redirect=/checkout/pro');
    setActiveTabState('login');
  };

  // Refs for click outside handling
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notificationsContainerRef = useRef<HTMLDivElement>(null);
  const profileContainerRef = useRef<HTMLDivElement>(null);

  // Click outside to close notifications, search, and profile dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        notificationsContainerRef.current && 
        !notificationsContainerRef.current.contains(event.target as Node)
      ) {
        setShowNotifications(false);
      }
      if (
        searchContainerRef.current && 
        !searchContainerRef.current.contains(event.target as Node)
      ) {
        setSearchOpen(false);
      }
      if (
        profileContainerRef.current && 
        !profileContainerRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // GSAP animation for theme switch
  useEffect(() => {
    gsap.to("html", {
      duration: 0.5,
      filter: theme === 'dark' ? 'invert(1) hue-rotate(180deg)' : 'invert(0) hue-rotate(0deg)',
      ease: "power2.inOut"
    });
  }, [theme]);

  useEffect(() => {
    const syncRoute = () => {
      const route = parseRoute(window.location.pathname, window.location.search);
      if (route.page === 'tool' && route.toolSlug) {
        setCurrentToolSlug(route.toolSlug);
        localStorage.setItem('selected_tool_id', route.toolSlug);
      }
      setActiveTabState(route.page);
    };

    window.addEventListener('popstate', syncRoute);
    syncRoute();
    return () => window.removeEventListener('popstate', syncRoute);
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;
    const route = parseRoute(window.location.pathname, window.location.search);
    if (['dashboard', 'profile', 'settings', 'payment'].includes(route.page) && !isAuthenticated) {
      const redirect = `${window.location.pathname}${window.location.search}`;
      window.history.replaceState({}, '', `/login?redirect=${encodeURIComponent(redirect)}`);
      setActiveTabState('login');
    }
  }, [isAuthenticated, isAuthLoading]);

  // Watch scroll values to apply navbar background saturates & blur checks
  useEffect(() => {
    const handleScroll = () => {
      setNavbarScrolled(window.scrollY > 30);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Back to top function on route tab changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeTab]);

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem('appwrite_user_id');
    localStorage.removeItem('isLoggedIn');
    window.history.pushState({}, '', '/');
    setActiveTabState('home');
  };

  const handleRequestToolSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestToolName || !requestToolDesc) return;
    setRequestSubmitted(true);
    setTimeout(() => {
      setIsRequestModalOpen(false);
      setRequestSubmitted(false);
      setRequestToolName('');
      setRequestToolDesc('');
    }, 2000);
  };

  return (
    <TooltipProvider>
      <Layout>
        <Toaster position="top-right" theme={theme === 'system' ? 'system' : (theme === 'dark' ? 'dark' : 'light')} />

        {/* PREFERENCES DIALOG */}
        <AnimatePresence>
          {showPreferences && (
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-[#0F0A1E]/40 backdrop-blur-md z-[100] flex items-center justify-center p-6"
               onClick={() => setShowPreferences(false)}
             >
               <motion.div 
                 initial={{ scale: 0.95, y: 15 }}
                 animate={{ scale: 1, y: 0 }}
                 exit={{ scale: 0.95, y: 15 }}
                 className="bg-white border border-neutral-100 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
                 onClick={(e) => e.stopPropagation()}
               >
                 <button onClick={() => setShowPreferences(false)} className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 font-bold"><X className="w-5 h-5"/></button>
                 <h3 className="text-xl font-black text-[#0F0A1E] mb-6 flex items-center gap-2"><Settings className="w-5 h-5 text-purple-600" /> Preferences</h3>
                 
                 <div className="space-y-6 overflow-y-auto pr-1 flex-1 font-sans">
                   <div className="space-y-3">
                     <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block">Theme</label>
                     <div className="grid grid-cols-3 gap-2">
                       <button onClick={() => { setTheme('light'); toast.success("Theme updated to Light"); }} className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer", theme === 'light' ? "border-purple-600 bg-purple-50 text-purple-600" : "border-neutral-200 hover:border-purple-300 text-neutral-500")}><Sun className="w-5 h-5" /><span className="text-xs font-bold font-sans">Light</span></button>
                       <button onClick={() => { setTheme('dark'); toast.success("Theme updated to Dark"); }} className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer", theme === 'dark' ? "border-purple-600 bg-purple-50 text-purple-600" : "border-neutral-200 hover:border-purple-300 text-neutral-500")}><Moon className="w-5 h-5" /><span className="text-xs font-bold font-sans">Dark</span></button>
                       <button onClick={() => { setTheme('system'); toast.success("Theme updated to System"); }} className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer", theme === 'system' ? "border-purple-600 bg-purple-50 text-purple-600" : "border-neutral-200 hover:border-purple-300 text-neutral-500")}><Monitor className="w-5 h-5" /><span className="text-xs font-bold font-sans">System</span></button>
                     </div>
                   </div>

                   <div className="space-y-3">
                     <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block">Language</label>
                     <select className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-3 text-sm font-semibold outline-none focus:border-purple-600 transition-all cursor-pointer">
                       <option>English (US)</option>
                       <option>Spanish</option>
                       <option>French</option>
                       <option>German</option>
                     </select>
                   </div>

                   <div className="space-y-4 pt-4 border-t border-neutral-100">
                     <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block">Notification Settings</label>
                     <div className="space-y-4">
                       <div className="flex items-center justify-between gap-4">
                         <div className="flex-1">
                           <p className="text-xs font-bold text-[#0F0A1E]">Tool Releases & Updates</p>
                           <p className="text-[10px] text-neutral-400">Get notified when new tools or features launch.</p>
                         </div>
                         <button
                           type="button"
                           onClick={() => {
                             const next = !prefAppUpdates;
                             setPrefAppUpdates(next);
                             toast.info(`Tool releases turned ${next ? 'ON' : 'OFF'}`);
                           }}
                           className={cn(
                             "w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0",
                             prefAppUpdates ? "bg-purple-600" : "bg-neutral-200"
                           )}
                         >
                           <motion.div
                             layout
                             className="bg-white w-4 h-4 rounded-full shadow-md"
                             animate={{ x: prefAppUpdates ? 16 : 0 }}
                             transition={{ type: "spring", stiffness: 500, damping: 30 }}
                           />
                         </button>
                       </div>

                       <div className="flex items-center justify-between gap-4">
                         <div className="flex-1">
                           <p className="text-xs font-bold text-[#0F0A1E]">Account & Pro Billing</p>
                           <p className="text-[10px] text-neutral-400">Receive subscription updates & metrics alerts.</p>
                         </div>
                         <button
                           type="button"
                           onClick={() => {
                             const next = !prefMarketing;
                             setPrefMarketing(next);
                             toast.info(`Billing updates turned ${next ? 'ON' : 'OFF'}`);
                           }}
                           className={cn(
                             "w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0",
                             prefMarketing ? "bg-purple-600" : "bg-neutral-200"
                           )}
                         >
                           <motion.div
                             layout
                             className="bg-white w-4 h-4 rounded-full shadow-md"
                             animate={{ x: prefMarketing ? 16 : 0 }}
                             transition={{ type: "spring", stiffness: 500, damping: 30 }}
                           />
                         </button>
                       </div>

                       <div className="flex items-center justify-between gap-4">
                         <div className="flex-1">
                           <p className="text-xs font-bold text-[#0F0A1E]">Security Alerts</p>
                           <p className="text-[10px] text-neutral-400">Warnings on logins and credentials modification.</p>
                         </div>
                         <button
                           type="button"
                           onClick={() => {
                             const next = !prefSecurityAlerts;
                             setPrefSecurityAlerts(next);
                             toast.info(`Security alerts turned ${next ? 'ON' : 'OFF'}`);
                           }}
                           className={cn(
                             "w-10 h-6 flex items-center rounded-full p-1 transition-colors cursor-pointer shrink-0",
                             prefSecurityAlerts ? "bg-purple-600" : "bg-neutral-200"
                           )}
                         >
                           <motion.div
                             layout
                             className="bg-white w-4 h-4 rounded-full shadow-md"
                             animate={{ x: prefSecurityAlerts ? 16 : 0 }}
                             transition={{ type: "spring", stiffness: 500, damping: 30 }}
                           />
                         </button>
                       </div>
                     </div>
                   </div>
                 </div>

                 <button onClick={() => { setShowPreferences(false); toast.success("Preferences saved successfully!"); }} className="w-full mt-6 py-3.5 bg-neutral-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-colors cursor-pointer shrink-0">Save Changes</button>
               </motion.div>
             </motion.div>
          )}
        </AnimatePresence>
      
        {/* GLOBAL NAVBAR REDESIGN FOR QOFENO BRAND */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'fixed top-0 left-0 right-0 z-50 flex items-center px-4 md:px-8 transition-all duration-300 select-none',
          navbarScrolled
            ? 'h-[62px] bg-white/85 backdrop-blur-[20px] backdrop-saturate-[160%] border-b border-purple-100/60 shadow-md shadow-purple-500/5'
            : 'h-[76px] bg-transparent'
        )}
      >
        <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand logo & icon */}
        <div 
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-10 h-10 bg-gradient-to-tr from-purple-600 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:rotate-3 transition-transform">
            <span className="text-white text-[18px]"><FaToolbox /></span>
          </div>
          <span className="font-extrabold text-xl md:text-2xl tracking-tight text-[#0F0A1E] font-sans">
            Qofeno
          </span>
        </div>

        {/* Wide nav categories linking tabs */}
        <nav className="hidden lg:flex items-center gap-8 relative group/nav">
          <button
            onClick={() => setActiveTab('home')}
            className={cn("text-sm font-bold tracking-tight transition-all relative py-6 cursor-pointer", activeTab === 'home' ? "text-purple-600" : "text-neutral-500 hover:text-neutral-900")}
          >
            Home
          </button>

          {/* Tools Mega Menu Wrapper */}
          <div className="group/tools relative py-6">
            <button
              onClick={() => setActiveTab('tools')}
              className={cn("text-sm font-bold tracking-tight transition-all relative cursor-pointer", activeTab === 'tools' ? "text-purple-600" : "text-neutral-500 hover:text-neutral-900")}
            >
              Tools
            </button>
            {/* Mega Menu Dropdown */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-[800px] bg-white/95 backdrop-blur-2xl border border-purple-100 shadow-2xl shadow-purple-900/10 rounded-3xl p-8 opacity-0 translate-y-[-12px] pointer-events-none group-hover/tools:opacity-100 group-hover/tools:translate-y-0 group-hover/tools:pointer-events-auto transition-all duration-250 ease-out z-50">
              <div className="grid grid-cols-5 gap-8">
                {/* Categories */}
                <div className="col-span-3 space-y-4">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Categories</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { unicode: '📄 PDF & Documents', cat: 'PDF & Documents' },
                      { unicode: '🖼️ Image Tools', cat: 'Image Tools' },
                      { unicode: '🎬 Video Tools', cat: 'Video Tools' },
                      { unicode: '🤖 AI Tools', cat: 'AI & Automation' },
                      { unicode: '💻 Dev Tools', cat: 'Developer Tools' },
                      { unicode: '📊 Data Tools', cat: 'Data Tools' },
                      { unicode: '🎓 Study Tools', cat: 'Study Tools' },
                      { unicode: '✍️ Writing Tools', cat: 'Writing Tools' }
                    ].map((item, i) => (
                      <div 
                        key={i} 
                        onClick={() => {
                          localStorage.setItem('selected_category_filter', item.cat);
                          setActiveTab('tools');
                        }} 
                        className="text-sm font-bold text-neutral-700 hover:text-purple-600 cursor-pointer transition-colors flex items-center gap-2"
                      >
                        {item.unicode}
                      </div>
                    ))}
                  </div>
                  <div onClick={() => setActiveTab('tools')} className="text-sm font-bold text-purple-600 cursor-pointer pt-4 inline-block hover:underline">Explore all categories →</div>
                </div>
                {/* Available Tools */}
                <div className="col-span-2 border-l border-neutral-100 pl-8 space-y-4">
                  <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">Available Tools</h4>
                  {appTools.map((tool) => (
                    <div 
                      key={tool.id} 
                      onClick={() => {
                        localStorage.setItem('selected_tool_id', tool.id);
                        setActiveTab('tool');
                      }} 
                      className="group flex items-center justify-between cursor-pointer py-1.5"
                    >
                      <span className="text-sm font-bold text-[#0F0A1E] group-hover:text-purple-600 transition-colors">{tool.name}</span>
                      {tool.isNew ? (
                        <span className="text-[9px] font-black text-white bg-purple-600 rounded px-1.5 py-0.5 uppercase tracking-wider shrink-0 shadow-sm">New</span>
                      ) : tool.isPopular ? (
                        <span className="text-[9px] font-black text-white bg-amber-500 rounded px-1.5 py-0.5 uppercase tracking-wider shrink-0 shadow-sm">Popular</span>
                      ) : (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                      )}
                    </div>
                  ))}
                  <div className="mt-6 pt-4 border-t border-neutral-100">
                    <button onClick={() => { setActiveTab('tools'); setSearchOpen(true); }} className="text-xs font-bold bg-neutral-100 hover:bg-neutral-200 text-neutral-600 w-full py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
                       <Search className="w-3.5 h-3.5" /> Search all tools
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {[
            { id: 'pricing', label: 'Pricing' },
            { id: 'whats-new', label: 'What\'s New' },
            { id: 'about', label: 'About' },
            { id: 'contact', label: 'Contact' }
          ].map((navItem) => (
            <button
              key={navItem.id}
              onClick={() => setActiveTab(navItem.id)}
              className={cn(
                "text-sm font-bold tracking-tight transition-all relative py-6 cursor-pointer",
                activeTab === navItem.id 
                  ? "text-purple-600" 
                  : "text-neutral-500 hover:text-neutral-900"
              )}
            >
              {navItem.label}
              {activeTab === navItem.id && (
                <motion.span 
                  layoutId="activeNavIndicator" 
                  className="absolute bottom-[20px] left-0 right-0 h-[2.5px] bg-purple-600 rounded-full" 
                />
              )}
            </button>
          ))}
        </nav>

          {/* Interactive Width-Expanding Search and CTAs */}
          <div className="flex items-center gap-3 md:gap-4">
            
            {/* Notification Center */}
            <div className="hidden lg:block relative" ref={notificationsContainerRef}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="w-10 h-10 rounded-xl hover:bg-neutral-100 flex items-center justify-center text-neutral-500 transition-colors relative cursor-pointer"
              >
                <Bell className="w-5 h-5 animate-none hover:animate-swing" />
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute top-full right-0 mt-2 w-80 bg-white shadow-2xl rounded-2xl border border-neutral-200/50 overflow-hidden z-50 pointer-events-auto"
                  >
                    <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
                      <h4 className="font-bold text-[#0F0A1E]">Notifications</h4>
                      {notifications.some(n => !n.read) && (
                        <button 
                          onClick={() => {
                            setNotifications(notifications.map(n => ({ ...n, read: true })));
                            toast.success("All notifications marked as read");
                          }}
                          className="text-[10px] uppercase font-bold tracking-widest text-purple-600 hover:text-purple-800 cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id} 
                            onClick={() => {
                              setNotifications(notifications.map(n => n.id === notif.id ? { ...n, read: true } : n));
                            }}
                            className={cn(
                              "p-4 border-b border-neutral-50 last:border-0 hover:bg-neutral-50 cursor-pointer transition-colors relative", 
                              !notif.read ? "bg-purple-50/30 font-bold" : "text-neutral-500"
                            )}
                          >
                            {!notif.read && <span className="absolute top-4 right-4 w-1.5 h-1.5 bg-purple-600 rounded-full" />}
                            <p className="text-xs text-[#0F0A1E] mb-1 pr-4 leading-tight">{notif.title}</p>
                            <p className="text-[10px] text-neutral-400 font-medium">{notif.time}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-xs text-neutral-400">No new notifications.</div>
                      )}
                    </div>
                    <div className="p-3 border-t border-neutral-100 bg-neutral-50 text-center">
                      <button 
                        onClick={() => {
                          setShowNotifications(false);
                          setShowPreferences(true);
                        }} 
                        className="text-xs font-bold text-neutral-500 hover:text-purple-600 flex items-center justify-center gap-1 w-full"
                      >
                        <Settings className="w-3.5 h-3.5" /> Notification Settings
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          
            {/* Dynamic wider click search input */}
          <div className="hidden lg:flex items-center gap-1 bg-[#FAFAFA] border border-neutral-200/50 p-1.5 rounded-xl transition-all relative" ref={searchContainerRef}>
            <input 
              type="text" 
              placeholder="Search tools..." 
              className={cn(
                "bg-transparent outline-none text-xs font-semibold text-neutral-800 placeholder-neutral-400 focus:placeholder-transparent transition-all",
                searchOpen ? "w-[120px] xl:w-[220px] 2xl:w-[320px] px-2" : "w-0 overflow-hidden"
              )}
              value={navbarSearchText}
              onChange={(e) => setNavbarSearchText(e.target.value)}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  localStorage.setItem('qofeno_initial_search', navbarSearchText);
                  setActiveTab('tools');
                  setSearchOpen(false);
                }
              }}
            />
            <button 
              onClick={() => {
                if(searchOpen && navbarSearchText) {
                  localStorage.setItem('qofeno_initial_search', navbarSearchText);
                  setActiveTab('tools');
                }
                setSearchOpen(!searchOpen);
              }}
              className="p-1.5 hover:bg-neutral-150 rounded-lg text-neutral-500 hover:text-neutral-900 cursor-pointer"
            >
              <Search className="w-4.5 h-4.5" />
            </button>

            {/* Suggestions Dropdown */}
            <AnimatePresence>
              {searchOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute top-full mt-2 left-0 w-full bg-white border border-neutral-200/50 shadow-2xl rounded-2xl overflow-hidden z-50 pointer-events-auto"
                >
                  <div className="max-h-80 overflow-y-auto">
                    {navbarSearchText.length > 0 ? (
                      appTools.filter(t => t.name.toLowerCase().includes(navbarSearchText.toLowerCase()) || t.desc.toLowerCase().includes(navbarSearchText.toLowerCase())).length > 0 ? (
                        <>
                          <div className="p-2 border-b border-neutral-100 bg-neutral-50">
                            <span className="text-[10px] uppercase font-bold text-neutral-400 px-2 tracking-widest leading-none">Suggestions</span>
                          </div>
                          {appTools.filter(t => t.name.toLowerCase().includes(navbarSearchText.toLowerCase()) || t.desc.toLowerCase().includes(navbarSearchText.toLowerCase())).slice(0, 5).map(tool => (
                            <button
                              key={tool.id}
                              className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-purple-50 transition-colors border-b border-neutral-50 last:border-0 cursor-pointer group"
                              onClick={() => {
                                localStorage.setItem('selected_tool_id', tool.id);
                                setActiveTab('tool');
                                setSearchOpen(false);
                                setNavbarSearchText('');
                              }}
                            >
                              <div className="w-8 h-8 rounded-lg bg-neutral-100 group-hover:bg-purple-100 flex items-center justify-center text-neutral-500 group-hover:text-purple-600 transition-colors">
                                <tool.icon className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-xs text-[#0F0A1E] truncate flex items-center gap-2">
                                  {tool.name}
                                  {tool.isPopular && <span className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 bg-amber-100 text-amber-700 uppercase tracking-widest"><Sparkles className="w-2.5 h-2.5" /> Popular</span>}
                                </h4>
                                <p className="text-[10px] text-neutral-400 truncate w-full">{tool.desc}</p>
                              </div>
                            </button>
                          ))}
                        </>
                      ) : (
                        <div className="p-4 text-center">
                          <p className="text-xs font-bold text-neutral-400 mb-2">No tools found for "{navbarSearchText}". Popular right now:</p>
                          {appTools.filter(t => t.isPopular).slice(0, 3).map(tool => (
                            <button
                              key={tool.id}
                              className="w-full mt-2 text-left px-3 py-2 border border-neutral-100 rounded-lg flex items-center gap-2 hover:bg-purple-50 transition-colors cursor-pointer group"
                              onClick={() => {
                                localStorage.setItem('selected_tool_id', tool.id);
                                setActiveTab('tool');
                                setSearchOpen(false);
                                setNavbarSearchText('');
                              }}
                            >
                              <tool.icon className="w-3.5 h-3.5 text-neutral-400 group-hover:text-purple-600" />
                              <span className="text-xs font-bold text-[#0F0A1E] truncate">{tool.name}</span>
                            </button>
                          ))}
                        </div>
                      )
                    ) : (
                      <>
                        <div className="p-2 border-b border-neutral-100 bg-neutral-50 mb-1">
                          <span className="text-[10px] uppercase font-bold text-neutral-400 px-2 tracking-widest leading-none">Popular Forms</span>
                        </div>
                        {appTools.filter(t => t.isPopular).slice(0, 5).map(tool => (
                          <button
                            key={tool.id}
                            className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-purple-50 transition-colors cursor-pointer group"
                            onClick={() => {
                              localStorage.setItem('selected_tool_id', tool.id);
                              setActiveTab('tool');
                              setSearchOpen(false);
                            }}
                          >
                            <div className="w-7 h-7 rounded-lg bg-amber-50 group-hover:bg-purple-100 flex items-center justify-center text-amber-600 group-hover:text-purple-600 transition-colors">
                              <tool.icon className="w-3.5 h-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-xs text-[#0F0A1E] truncate">{tool.name}</h4>
                            </div>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Search and Hamburger for Mobile */}
          <div className="lg:hidden flex items-center gap-1">
            <button 
              className="p-2 text-neutral-600 hover:text-purple-600 cursor-pointer"
              onClick={() => setActiveTab('tools')}
            >
              <Search className="w-5 h-5" />
            </button>
            <button 
              className="p-2 text-neutral-600 hover:text-purple-600 cursor-pointer"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>

          {isAuthenticated ? (
            <div className="hidden lg:block relative" ref={profileContainerRef}>
              <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 bg-neutral-100 hover:bg-neutral-200 px-4 py-2 rounded-xl transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-purple-600 flex items-center justify-center text-white text-[10px] font-bold">{(user?.name || 'User').slice(0, 2).toUpperCase()}</div>
                <span className="text-sm font-bold text-[#0F0A1E]">{user?.name || 'User'}</span>
                <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-purple-700">{user?.plan === 'pro' ? 'Pro' : 'Free'}</span>
                <ChevronDown className="w-3 h-3 text-neutral-500" />
              </button>
              
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute top-full mt-2 right-0 w-48 bg-white border border-neutral-200 shadow-xl rounded-xl p-2 z-50 pointer-events-auto"
                  >
                    <div className="px-3 py-2 border-b border-neutral-100 mb-2">
                      <p className="text-xs font-bold text-[#0F0A1E]">{user?.plan === 'pro' ? 'Pro Account' : 'Free Account'}</p>
                    </div>
                    <button 
                      onClick={() => { setShowProfileMenu(false); setShowPreferences(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer mb-1"
                    >
                      <Settings className="w-4 h-4" /> Preferences
                    </button>
                    <button 
                      onClick={() => {
                        setShowProfileMenu(false);
                        void handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button 
              whileHover={{ scale: 1.04, boxShadow: '0 8px 24px rgba(124,58,237,0.35)' }}
              whileTap={{ scale: 0.97 }}
              onClick={goToProCheckout}
              className="hidden lg:block px-6 py-2.5 bg-gradient-to-br from-[#7C3AED] to-[#A78BFA] text-white text-sm font-bold rounded-xl cursor-pointer"
            >
              Get Pro
            </motion.button>
          )}
        </div>
        </div>
      </motion.header>

      {/* MOBILE NAV OVERLAY */}
      <AnimatePresence>
        {isMobileNavOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-[100] bg-[#0F0A1E]/40 backdrop-blur-sm"
            onClick={() => setIsMobileNavOpen(false)}
          >
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", stiffness: 350, damping: 35 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-0 right-0 bottom-0 w-full max-w-[320px] bg-white shadow-2xl flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-10">
                <div 
                  className="font-black text-xl tracking-tight text-[#0F0A1E] flex items-center gap-1.5 cursor-pointer"
                  onClick={() => { setIsMobileNavOpen(false); setActiveTab('home'); }}
                >
                  <div className="w-7 h-7 bg-purple-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-[12px]"><FaToolbox /></span>
                  </div>
                  Qofeno
                </div>
                <button 
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-2 text-neutral-500 bg-neutral-100 rounded-full hover:bg-neutral-200 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {[
                  { label: 'Home', id: 'home' },
                  { label: 'Tools', id: 'tools' },
                  { label: 'Pricing', id: 'pricing' },
                  { label: 'What\'s New', id: 'whats-new' },
                  { label: 'About', id: 'about' },
                  { label: 'Contact', id: 'contact' },
                ].map((item, idx) => (
                  <motion.button
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + idx * 0.06 }}
                    onClick={() => { setIsMobileNavOpen(false); setActiveTab(item.id); }}
                    className={cn(
                      "text-left py-3.5 px-4 rounded-xl font-bold text-base transition-colors",
                      activeTab === item.id ? "bg-purple-50 text-purple-600" : "text-neutral-700 hover:bg-neutral-50"
                    )}
                  >
                    {item.label}
                  </motion.button>
                ))}
              </div>

              <div className="mt-auto pt-6 border-t border-neutral-100 flex flex-col gap-3">
                <button 
                  onClick={() => { setIsMobileNavOpen(false); goToProCheckout(); }}
                  className="w-full py-3.5 rounded-xl font-bold text-white bg-purple-600 transition-colors cursor-pointer"
                >
                  Get Pro
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* RENDER ACTIVE ROUTE / VIEWPORT WITH FLUID EXIT-ENTER ANIMATION */}
      <main className="min-h-screen">
        <ErrorBoundary onReset={() => setActiveTab('home')}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              variants={PAGE_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              className="w-full"
            >
              {activeTab === 'home' && (
                <Home 
                  onNavigate={(page) => setActiveTab(page)} 
                  onRequestTool={() => setIsRequestModalOpen(true)} 
                />
              )}
              {activeTab === 'tools' && (
                <ToolsCatalog onNavigate={(page) => setActiveTab(page)} />
              )}
              {activeTab === 'pricing' && <PricingView onNavigate={(page) => setActiveTab(page)} onGetPro={goToProCheckout} />}
              {activeTab === 'whats-new' && <BlogDocs />}
              {activeTab === 'about' && <About onNavigate={(page) => setActiveTab(page)} />}
              {activeTab === 'contact' && <Contact />}
              {activeTab === 'tool' && <ToolPage onNavigate={(page) => setActiveTab(page)} />}
              {activeTab === 'login' && <Auth type="login" onNavigate={(page) => setActiveTab(page)} />}
              {activeTab === 'signup' && <Auth type="signup" onNavigate={(page) => setActiveTab(page)} />}
              {activeTab === 'payment' && <Payment onNavigate={(page) => setActiveTab(page)} />}
              {activeTab === 'forgot-password' && <ForgotPassword onNavigate={(page) => setActiveTab(page)} />}
              {activeTab === 'auth-callback' && <AuthCallback onNavigate={(page) => setActiveTab(page)} />}
              {activeTab === 'dashboard' && <Dashboard />}
              {activeTab === 'profile' && <Profile />}
              {activeTab === 'settings' && <Settings />}
              {activeTab === 'coming-soon' && <ComingSoon onBack={() => setActiveTab('home')} />}
              {activeTab === 'terms' && <Terms />}
              {activeTab === 'policy' && <Policy />}
              {activeTab === 'not-found' && <NotFound onNavigate={(page) => setActiveTab(page)} />}
            </motion.div>
          </AnimatePresence>
        </ErrorBoundary>
      </main>

      {/* REQUEST A TOOL FLOATING MODAL DYNAMIC SUBMISSION FOR HOME PAGE */}
      <AnimatePresence>
        {isRequestModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-[#0F0A1E]/40 backdrop-blur-md z-50 flex items-center justify-center p-6"
            onClick={() => setIsRequestModalOpen(false)}
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white border border-neutral-100 rounded-3xl p-8 max-w-md w-full shadow-2xl relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsRequestModalOpen(false)}
                className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 font-bold"
              >
                ✕
              </button>

              <AnimatePresence mode="wait">
                {!requestSubmitted ? (
                  <motion.form 
                    onSubmit={handleRequestToolSubmit}
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div>
                      <h3 className="text-xl font-black text-[#0F0A1E] mb-2">Request or Design a Tool</h3>
                      <p className="text-xs text-neutral-400 leading-relaxed">Our automation pipeline evaluates, packages, and releases custom quick widgets weekly. Tell us what you need converted!</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-neutral-700 uppercase tracking-widest">Tool Name Idea</label>
                      <input 
                        type="text" 
                        placeholder="e.g., CSV to XML sovereign generator" 
                        required
                        className="w-full bg-neutral-50 border border-neutral-250 focus:border-purple-600 focus:bg-white p-3 rounded-xl outline-none text-sm transition-all text-neutral-800"
                        value={requestToolName}
                        onChange={(e) => setRequestToolName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-black text-neutral-700 uppercase tracking-widest">Process Description</label>
                      <textarea 
                        rows={3}
                        required
                        placeholder="e.g., Squeezes layout XML grids, maps coordinates instantly locally..." 
                        className="w-full bg-neutral-50 border border-neutral-250 focus:border-purple-600 focus:bg-white p-3 rounded-xl outline-none text-sm resize-none transition-all text-neutral-800"
                        value={requestToolDesc}
                        onChange={(e) => setRequestToolDesc(e.target.value)}
                      />
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-colors shadow-lg shadow-purple-500/10 cursor-pointer"
                    >
                      Submit Tool Spec
                    </button>
                  </motion.form>
                ) : (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-center py-6 space-y-4"
                  >
                    <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto animate-bounce" />
                    <h3 className="font-extrabold text-xl text-[#0F0A1E]">Specification Submitted!</h3>
                    <p className="text-xs text-neutral-400 max-w-xs mx-auto">We've added '{requestToolName}' to our development queue. Our agent builder will publish this module shortly.</p>
                  </motion.div>
                )}
              </AnimatePresence>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ULTRA PREMIUM DARK VIOLET GLOBAL FOOTER */}
      <footer className="bg-[#0A0614] border-t border-purple-950/40 text-white pt-20 pb-12 px-6 md:px-12 select-none relative z-20">
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-12 font-sans mb-16">
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-[14px]"><FaToolbox /></span>
              </div>
              <span className="font-extrabold text-xl tracking-tight">Qofeno</span>
            </div>
            <p className="text-purple-200/60 max-w-sm text-sm leading-relaxed mb-8 font-medium">
              Every tool you'll ever need.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/MohdZaheerU" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-white hover:scale-115 transition-all w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                GH
              </a>
              <button onClick={() => setActiveTab('coming-soon')} className="text-neutral-500 hover:text-[#1DA1F2] hover:scale-115 transition-all w-10 h-10 rounded-full bg-white/5 flex items-center justify-center cursor-pointer">
                𝕏
              </button>
              <button onClick={() => setActiveTab('coming-soon')} className="text-neutral-500 hover:text-[#0A66C2] hover:scale-115 transition-all w-10 h-10 rounded-full bg-white/5 flex items-center justify-center cursor-pointer">
                IN
              </button>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-sm text-purple-200 uppercase tracking-widest mb-6">Tools</h4>
            <ul className="space-y-3.5 text-neutral-400 text-xs font-semibold">
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition-colors cursor-pointer">Browse All Tools</button></li>
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition-colors cursor-pointer">PDF Tools</button></li>
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition-colors cursor-pointer">Image Tools</button></li>
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition-colors cursor-pointer">AI Tools</button></li>
              <li><button onClick={() => setActiveTab('tools')} className="hover:text-white transition-colors cursor-pointer">Developer Tools</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-purple-200 uppercase tracking-widest mb-6">Product</h4>
            <ul className="space-y-3.5 text-neutral-400 text-xs font-semibold">
              <li><button onClick={() => setActiveTab('pricing')} className="hover:text-white transition-colors cursor-pointer">Pricing</button></li>
              <li><button onClick={() => setActiveTab('whats-new')} className="hover:text-white transition-colors cursor-pointer">What's New</button></li>
              <li><button onClick={() => setActiveTab('coming-soon')} className="hover:text-white transition-colors cursor-pointer">Blog</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm text-purple-200 uppercase tracking-widest mb-6">Company</h4>
            <ul className="space-y-3.5 text-neutral-400 text-xs font-semibold">
              <li><button onClick={() => setActiveTab('about')} className="hover:text-white transition-colors cursor-pointer">About</button></li>
              <li><button onClick={() => setActiveTab('contact')} className="hover:text-white transition-colors cursor-pointer">Contact</button></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-sm text-purple-200 uppercase tracking-widest mb-6">Account</h4>
            <ul className="space-y-3.5 text-neutral-400 text-xs font-semibold">
              {!isAuthenticated && <li><button onClick={() => setActiveTab('pricing')} className="hover:text-white transition-colors cursor-pointer">Get Pro</button></li>}
              {isAuthenticated && <li><button className="text-purple-400 cursor-default">{user?.plan === 'pro' ? 'Pro Active' : 'Signed In'}</button></li>}
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-medium tracking-tight">
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} Qofeno. Built by Mohd Zaheer Uddin.</span>
            <div className="flex items-center gap-3">
              <a href="https://github.com/MohdZaheerU" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors"><span className="text-[16px]"><FaGithub /></span></a>
            </div>
          </div>
          <div className="flex gap-6">
            <button onClick={() => setActiveTab('policy')} className="hover:text-neutral-300 transition-colors cursor-pointer">Privacy Policy</button>
            <button onClick={() => setActiveTab('terms')} className="hover:text-neutral-300 transition-colors cursor-pointer">Terms of Service</button>
            <button onClick={() => setActiveTab('coming-soon')} className="hover:text-neutral-300 transition-colors cursor-pointer">Cookie Policy</button>
          </div>
        </div>
      </footer>

    </Layout>
    </TooltipProvider>
  );
}
