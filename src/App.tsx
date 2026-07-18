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
import { Cookies } from './components/Pages/Cookies';
import { Policy } from './components/Pages/Policy';
import { ForgotPassword } from './components/Pages/ForgotPassword';
import { ResetPassword } from './components/Pages/ResetPassword';
import { AuthCallback } from './components/Pages/AuthCallback';
import { Profile } from './components/Pages/Profile';
import { Settings as SettingsPage } from './components/Pages/Settings';
import { NotFound } from './components/Pages/NotFound';

// shadcn / UI components
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

// Font Awesome icons — ALL icons use Font Awesome only
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch, faPlus, faCalendar, faEnvelope, faFileText, faCheckCircle,
  faUser, faBars, faXmark, faRightFromBracket, faChevronDown,
  faBell, faGear, faMoon, faSun, faDesktop, faWandMagicSparkles,
  faFilePdf, faImage, faVideo, faRobot, faCode,
  faPenNib, faDatabase, faShield, faBolt,
  faDownload, faUpload, faCheck, faStar,
  faLock, faUnlock, faKey, faArrowRight, faArrowLeft, faRotate,
  faMagnifyingGlass, faFilter, faSliders, faChevronUp,
  faEye, faEyeSlash, faTriangleExclamation, faCircleInfo, faSpinner,
  faFileWord, faFileExcel, faFilePowerpoint, faFileImage,
  faFileZipper, faFileLines, faCrop, faScissors, faCompressArrowsAlt,
  faExpand, faFont, faShareNodes, faBookOpen, faTools,
  faHouse, faTag, faHeart, faWater,
} from '@fortawesome/free-solid-svg-icons';
import { faGithub, faXTwitter, faLinkedin, faInstagram } from '@fortawesome/free-brands-svg-icons';
import { faCheckCircle as faCheckCircleReg, faBell as faBellReg } from '@fortawesome/free-regular-svg-icons';

import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import { toast } from 'sonner';
import { FALLBACK_TOOLS, useToolCatalog } from './lib/toolCatalog';
import { getPathForPage, parseRoute } from './lib/appRouter';
import { useAuth } from './context/AuthContext';
import { databases, DATABASE_ID, realtime } from './lib/qofeno-appwrite';
import { Query } from 'appwrite';

import { ErrorBoundary } from './components/ErrorBoundary';
import { CookieConsentBanner } from './components/CookieConsentBanner';

// Text scramble effect component
function ScrambleText({ 
  text, 
  trigger,
  scrolled = false,
  collapseOnScroll = false
}: { 
  text: string; 
  trigger: number;
  scrolled?: boolean;
  collapseOnScroll?: boolean;
}) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    let active = true;
    let iteration = 0;
    const chars = 'a@b#c$d%e^f*g!h&i*j(k)l_m+n-o=p{q}r[s]t;u:v,w.x/y?z';
    let timeoutId: any;

    const targetText = (collapseOnScroll && scrolled) ? "\\" : text;

    const doScramble = () => {
      if (!active) return;

      setDisplayText(
        targetText
          .split('')
          .map((char, index) => {
            if (char === ' ') return ' ';
            if (index < iteration) {
              return targetText[index];
            }
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join('')
      );

      if (iteration < targetText.length) {
        iteration += 0.25; // Smooth decode steps
        timeoutId = setTimeout(doScramble, 30);
      }
    };

    doScramble();

    return () => {
      active = false;
      clearTimeout(timeoutId);
    };
  }, [text, trigger, scrolled, collapseOnScroll]);

  return <span className="font-sans transition-all duration-300">{displayText}</span>;
}

// QofenoLogo component — shows qofeno.png + text
function QofenoLogo({ 
  size = 36, 
  showText = true, 
  textClass = '',
  collapseOnScroll = false,
  scrolled = false
}: { 
  size?: number; 
  showText?: boolean; 
  textClass?: string;
  collapseOnScroll?: boolean;
  scrolled?: boolean;
}) {
  const [hoverTrigger, setHoverTrigger] = useState(0);

  return (
    <div 
      className="flex items-center gap-0.5 select-none"
      onMouseEnter={() => setHoverTrigger(p => p + 1)}
    >
      <img
        src="/qofeno.png"
        alt="Q"
        width={size}
        height={size}
        className={cn(
          "rounded-xl object-contain transition-all duration-500 ease-in-out",
          collapseOnScroll && scrolled ? "scale-95 shadow-md shadow-purple-500/5" : "scale-100"
        )}
        onError={(e) => {
          // Fallback gradient box if png not found
          const el = e.currentTarget;
          el.style.display = 'none';
          const next = el.nextElementSibling as HTMLElement;
          if (next) next.style.display = 'flex';
        }}
      />
      <div
        style={{ display: 'none', width: size, height: size }}
        className="bg-gradient-to-tr from-purple-600 to-pink-500 rounded-xl items-center justify-center shadow-lg"
      >
        <FontAwesomeIcon icon={faTools} className="text-white" style={{ fontSize: size * 0.5 }} />
      </div>
      {showText && (
        <span className={cn('font-extrabold tracking-tight text-[#0F0A1E] select-none', textClass)}>
          <ScrambleText 
            text="ofeno" 
            trigger={hoverTrigger} 
            scrolled={scrolled}
            collapseOnScroll={collapseOnScroll}
          />
        </span>
      )}
    </div>
  );
}

const prefersReduced = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

const getPageVariants = (page: string) => {
  const noAnimationPages = ['tools', 'profile', 'settings', 'whats-new', 'blog', 'dashboard'];
  if (prefersReduced || noAnimationPages.includes(page)) {
    return {
      initial: { opacity: 1, y: 0, scale: 1, filter: 'none' },
      animate: { opacity: 1, y: 0, scale: 1, filter: 'none', transition: { duration: 0 } },
      exit: { opacity: 1, y: 0, scale: 1, filter: 'none', transition: { duration: 0 } }
    };
  }
  return PAGE_VARIANTS;
};

type AppNotification = {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  link?: string;
};

function relativeTime(input?: string | null) {
  if (!input) return 'just now';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return 'just now';
  const diff = Date.now() - date.getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'just now';
  if (min < 60) return `${min} min ago`;
  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

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
  const [openFooterCol, setOpenFooterCol] = useState<string | null>(null);

  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Real states for notification preferences inside the Preferences Dialog
  const [prefAppUpdates, setPrefAppUpdates] = useState(true);
  const [prefMarketing, setPrefMarketing] = useState(false);
  const [prefSecurityAlerts, setPrefSecurityAlerts] = useState(true);

  const appTools = tools.length > 0 ? tools : FALLBACK_TOOLS;

  const setActiveTab = (page: string) => {
    if (page.startsWith('/')) {
      const urlObj = new URL(page, window.location.origin);
      const route = parseRoute(urlObj.pathname, urlObj.search);
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

  // Native CSS transition for theme switch
  useEffect(() => {
    const isDark = theme === 'dark';
    document.documentElement.style.filter = isDark 
      ? 'invert(1) hue-rotate(180deg)' 
      : 'invert(0) hue-rotate(0deg)';
  }, [theme]);

  useEffect(() => {
    const syncRoute = () => {
      const route = parseRoute(window.location.pathname, window.location.search);
      if (route.page === 'tool' && route.toolSlug) {
        setCurrentToolSlug(route.toolSlug);
        localStorage.setItem('selected_tool_id', route.toolSlug);
      }
      // Redirect /upgrade → /checkout/pro
      if (window.location.pathname === '/upgrade') {
        window.history.replaceState({}, '', '/checkout/pro');
        setActiveTabState('payment');
        return;
      }
      if (window.location.pathname.startsWith('/dashboard')) {
        let redirectUrl = '/profile';
        if (window.location.pathname === '/dashboard/billing') redirectUrl = '/settings?tab=billing';
        else if (window.location.pathname === '/dashboard/favorites') redirectUrl = '/profile#favorites';
        else if (window.location.pathname === '/dashboard/history') redirectUrl = '/profile#history';
        
        window.history.replaceState({}, '', redirectUrl);
        const nextRoute = parseRoute(redirectUrl, redirectUrl.includes('?') ? redirectUrl.substring(redirectUrl.indexOf('?')) : '');
        setActiveTabState(nextRoute.page);
        return;
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
    if (['profile', 'settings', 'payment'].includes(route.page) && !isAuthenticated) {
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

  useEffect(() => {
    let cancelled = false;
    let subscription: any = null;

    const loadNotifications = async () => {
      if (!user?.id) {
        setNotifications([]);
        return;
      }
      try {
        const resp = await databases.listDocuments(DATABASE_ID, 'notifications', [
          Query.equal('user_id', user.id),
          Query.orderDesc('created_at'),
          Query.limit(20),
        ]);
        const localReadNotifs = JSON.parse(localStorage.getItem('qofeno_read_notifs') || '[]');
        // Dedup by title to prevent duplicate welcome notifications
        const seenTitles = new Set<string>();
        const dedupedDocs = (resp.documents || []).filter((doc: any) => {
          const t = String(doc.title || '');
          if (seenTitles.has(t)) return false;
          seenTitles.add(t);
          return true;
        });
        setNotifications(dedupedDocs.map((doc: any) => {
          const isReadLocal = localReadNotifs.includes(doc.$id);
          return {
            id: doc.$id,
            title: String(doc.title || 'Notification'),
            message: String(doc.message || ''),
            time: relativeTime(doc.created_at || doc.$createdAt),
            read: Boolean(doc.read) || isReadLocal,
            link: doc.link || undefined,
          };
        }));
      } catch {
        if (!cancelled) setNotifications([]);
      }
    };

    void loadNotifications();

    if (user?.id) {
      const channel = `databases.${DATABASE_ID}.collections.notifications.documents`;
      try {
        subscription = realtime.subscribe(channel, (event: any) => {
          const doc = event?.payload;
          if (!doc || doc.user_id !== user.id) return;
          void loadNotifications();
        });
      } catch (err) {
        console.error("Realtime subscription failed", err);
      }
    }

    return () => {
      cancelled = true;
      try {
        if (typeof subscription === 'function') {
          subscription();
        } else if (subscription && typeof subscription.close === 'function') {
          subscription.close();
        }
      } catch {}
    };
  }, [user?.id]);

  const markNotificationRead = async (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => n.id === notificationId ? { ...n, read: true } : n));
    try {
      const arr = JSON.parse(localStorage.getItem('qofeno_read_notifs') || '[]');
      if (!arr.includes(notificationId)) {
        arr.push(notificationId);
        localStorage.setItem('qofeno_read_notifs', JSON.stringify(arr));
      }
    } catch {}
    try {
      await databases.updateDocument(DATABASE_ID, 'notifications', notificationId, { read: true });
    } catch {}
  };

  const markAllNotificationsRead = async () => {
    const unread = notifications.filter((n) => !n.read);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      const arr = JSON.parse(localStorage.getItem('qofeno_read_notifs') || '[]');
      for (const n of unread) {
        if (!arr.includes(n.id)) {
          arr.push(n.id);
        }
      }
      localStorage.setItem('qofeno_read_notifs', JSON.stringify(arr));
    } catch {}
    for (const notif of unread) {
      try {
        await databases.updateDocument(DATABASE_ID, 'notifications', notif.id, { read: true });
      } catch {}
    }
    toast.success('All notifications marked as read');
  };

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
                 <button onClick={() => setShowPreferences(false)} className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 font-bold"><FontAwesomeIcon icon={faXmark} className="w-5 h-5"/></button>
                 <h3 className="text-xl font-black text-[#0F0A1E] mb-6 flex items-center gap-2"><FontAwesomeIcon icon={faGear} className="w-5 h-5 text-purple-600" /> Preferences</h3>
                 
                 <div className="space-y-6 overflow-y-auto pr-1 flex-1 font-sans">
                   <div className="space-y-3">
                     <label className="text-xs font-black text-neutral-500 uppercase tracking-widest block">Theme</label>
                     <div className="grid grid-cols-3 gap-2">
                       <button onClick={() => { setTheme('light'); toast.success("Theme updated to Light"); }} className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer", theme === 'light' ? "border-purple-600 bg-purple-50 text-purple-600" : "border-neutral-200 hover:border-purple-300 text-neutral-500")}><FontAwesomeIcon icon={faSun} className="w-5 h-5" /><span className="text-xs font-bold font-sans">Light</span></button>
                       <button onClick={() => { setTheme('dark'); toast.success("Theme updated to Dark"); }} className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer", theme === 'dark' ? "border-purple-600 bg-purple-50 text-purple-600" : "border-neutral-200 hover:border-purple-300 text-neutral-500")}><FontAwesomeIcon icon={faMoon} className="w-5 h-5" /><span className="text-xs font-bold font-sans">Dark</span></button>
                       <button onClick={() => { setTheme('system'); toast.success("Theme updated to System"); }} className={cn("flex flex-col items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer", theme === 'system' ? "border-purple-600 bg-purple-50 text-purple-600" : "border-neutral-200 hover:border-purple-300 text-neutral-500")}><FontAwesomeIcon icon={faDesktop} className="w-5 h-5" /><span className="text-xs font-bold font-sans">System</span></button>
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
          <QofenoLogo size={38} showText={true} textClass="text-xl md:text-2xl font-sans" collapseOnScroll={true} scrolled={navbarScrolled} />
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
                      {(tool.addedAt ? (Date.now() - new Date(tool.addedAt).getTime() < 7 * 24 * 60 * 60 * 1000) : tool.isNew) ? (
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
                       <FontAwesomeIcon icon={faSearch} className="w-3.5 h-3.5" /> Search all tools
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
                <FontAwesomeIcon icon={faBell} className="w-5 h-5" />
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
                            void markAllNotificationsRead();
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
                              void markNotificationRead(notif.id);
                              if (notif.link) {
                                setShowNotifications(false);
                                setActiveTab(notif.link);
                              }
                            }}
                            className={cn(
                              "p-4 border-b border-neutral-50 last:border-0 hover:bg-neutral-50 cursor-pointer transition-colors relative", 
                              !notif.read ? "bg-purple-50/30 font-bold" : "text-neutral-500"
                            )}
                          >
                            {!notif.read && <span className="absolute top-4 right-4 w-1.5 h-1.5 bg-purple-600 rounded-full" />}
                            <p className="text-xs text-[#0F0A1E] mb-1 pr-4 leading-tight">{notif.title}</p>
                            {notif.message ? <p className="text-[11px] text-neutral-500 mb-1 pr-4 leading-tight">{notif.message}</p> : null}
                            <p className="text-[10px] text-neutral-400 font-medium">{notif.time}</p>
                          </div>
                        ))
                      ) : (
                        <div className="p-6 text-center text-xs text-neutral-400">No notifications yet.</div>
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
                        <FontAwesomeIcon icon={faGear} className="w-3.5 h-3.5" /> Notification Settings
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
              <FontAwesomeIcon icon={faMagnifyingGlass} className="w-4 h-4" />
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
                                <FontAwesomeIcon icon={faFilePdf} className="w-4 h-4" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-xs text-[#0F0A1E] truncate flex items-center gap-2">
                                  {tool.name}
                                  {tool.isPopular && <span className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1 bg-amber-100 text-amber-700 uppercase tracking-widest"><FontAwesomeIcon icon={faStar} className="w-2.5 h-2.5" /> Popular</span>}
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
                              <FontAwesomeIcon icon={faFilePdf} className="w-3.5 h-3.5 text-neutral-400 group-hover:text-purple-600" />
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
                              <FontAwesomeIcon icon={faStar} className="w-3.5 h-3.5" />
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
              className="p-2 text-neutral-600 hover:text-purple-600 cursor-pointer relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FontAwesomeIcon icon={faBell} className="w-5 h-5" />
              {notifications.some(n => !n.read) && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>
            <button 
              className="p-2 text-neutral-600 hover:text-purple-600 cursor-pointer"
              onClick={() => setActiveTab('tools')}
            >
              <FontAwesomeIcon icon={faMagnifyingGlass} className="w-5 h-5" />
            </button>
            <button 
              className="p-2 text-neutral-600 hover:text-purple-600 cursor-pointer"
              onClick={() => setIsMobileNavOpen(true)}
            >
              <FontAwesomeIcon icon={faBars} className="w-6 h-6" />
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="fixed top-[74px] right-3 left-3 z-[70] bg-white shadow-2xl rounded-2xl border border-neutral-200/70 overflow-hidden"
                >
                  <div className="p-3 border-b border-neutral-100 flex items-center justify-between">
                    <h4 className="font-bold text-[#0F0A1E] text-sm">Notifications</h4>
                    {notifications.some(n => !n.read) && (
                      <button
                        onClick={() => void markAllNotificationsRead()}
                        className="text-[10px] uppercase font-bold tracking-widest text-purple-600"
                      >
                        Mark all
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.length ? notifications.map((notif) => (
                      <button
                        key={notif.id}
                        onClick={() => {
                          void markNotificationRead(notif.id);
                          if (notif.link) setActiveTab(notif.link);
                          setShowNotifications(false);
                        }}
                        className={cn(
                          "w-full text-left p-3 border-b border-neutral-50 last:border-0",
                          !notif.read ? "bg-purple-50/40" : "bg-white"
                        )}
                      >
                        <p className="text-xs font-bold text-[#0F0A1E]">{notif.title}</p>
                        {notif.message ? <p className="text-[11px] text-neutral-500 mt-1">{notif.message}</p> : null}
                        <p className="text-[10px] text-neutral-400 mt-1">{notif.time}</p>
                      </button>
                    )) : <div className="p-4 text-center text-xs text-neutral-400">No notifications yet.</div>}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
                <FontAwesomeIcon icon={faChevronDown} className="w-3 h-3 text-neutral-500" />
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
                      onClick={() => { setShowProfileMenu(false); setActiveTab('profile'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer mb-1"
                    >
                      <FontAwesomeIcon icon={faUser} className="w-4 h-4" /> Profile
                    </button>
                    <button 
                      onClick={() => { setShowProfileMenu(false); setActiveTab('settings'); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer mb-1"
                    >
                      <FontAwesomeIcon icon={faGear} className="w-4 h-4" /> Settings
                    </button>
                    <button 
                      onClick={() => { setShowProfileMenu(false); setShowPreferences(true); }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer mb-1"
                    >
                      <FontAwesomeIcon icon={faSliders} className="w-4 h-4" /> Preferences
                    </button>
                    <button 
                      onClick={() => {
                        setShowProfileMenu(false);
                        void handleLogout();
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <FontAwesomeIcon icon={faRightFromBracket} className="w-4 h-4" /> Logout
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
            initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: prefersReduced ? 0 : 0.2 }}
            className="lg:hidden fixed inset-0 z-[100] bg-[#0F0A1E]/40 backdrop-blur-sm"
            onClick={() => setIsMobileNavOpen(false)}
          >
            <motion.div 
              initial={prefersReduced ? { x: 0 } : { x: '100%' }}
              animate={{ x: 0 }}
              exit={prefersReduced ? { x: 0 } : { x: '100%' }}
              transition={prefersReduced ? { duration: 0 } : { type: "spring", stiffness: 350, damping: 35 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute top-0 right-0 bottom-0 w-full max-w-[320px] bg-white shadow-2xl flex flex-col p-6"
            >
              <div className="flex items-center justify-between mb-10">
                <div 
                  className="font-black text-xl tracking-tight text-[#0F0A1E] flex items-center gap-1.5 cursor-pointer"
                  onClick={() => { setIsMobileNavOpen(false); setActiveTab('home'); }}
                >
                  <QofenoLogo size={32} showText={true} textClass="text-xl" />
                </div>
                <button 
                  onClick={() => setIsMobileNavOpen(false)}
                  className="p-2 text-neutral-500 bg-neutral-100 rounded-full hover:bg-neutral-200 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faXmark} className="w-5 h-5" />
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
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => { setIsMobileNavOpen(false); setActiveTab(item.id); }}
                    className={cn(
                      "text-left py-3.5 px-4 rounded-xl font-bold text-base transition-colors",
                      activeTab === item.id ? "bg-purple-50 text-purple-600" : "text-neutral-700 hover:bg-neutral-50"
                    )}
                  >
                    {item.label}
                  </button>
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
              variants={getPageVariants(activeTab)}
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
              {activeTab === 'dashboard' && <Profile />}  {/* dashboard redirects to profile */}
              {activeTab === 'profile' && <Profile />}
              {activeTab === 'settings' && <SettingsPage />}
              {activeTab === 'coming-soon' && <ComingSoon onBack={() => setActiveTab('home')} />}
              {activeTab === 'terms' && <Terms />}
              {activeTab === 'policy' && <Policy />}
              {activeTab === 'cookies' && <Cookies />}
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
                    <FontAwesomeIcon icon={faCheckCircle} className="w-14 h-14 text-green-500 mx-auto animate-bounce" />
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
        
        {/* Newsletter Subscription Row */}
        <div className="max-w-7xl mx-auto border-b border-white/5 pb-12 mb-12 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h3 className="text-lg font-black text-white">Subscribe to our newsletter</h3>
            <p className="text-xs text-purple-200/50 mt-1 font-semibold">Get weekly updates on new tools, product improvements, and fix timelines.</p>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); toast.success("Subscribed successfully! Thank you."); }} className="flex gap-2 w-full lg:w-auto">
            <input 
              type="email" 
              required 
              placeholder="Enter your email" 
              className="bg-white/5 border border-purple-950/50 focus:border-purple-500 focus:bg-white/10 outline-none rounded-xl text-xs font-bold text-white px-4 py-3 w-full lg:w-64 placeholder-neutral-500 transition-all"
            />
            <button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs uppercase tracking-wider px-5 py-3 rounded-xl transition-all cursor-pointer whitespace-nowrap">
              Subscribe
            </button>
          </form>
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-6 gap-8 lg:gap-12 font-sans mb-16">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4 cursor-pointer" onClick={() => setActiveTab('home')}>
              <QofenoLogo size={32} showText={true} textClass="text-xl text-white" />
            </div>
            <p className="text-purple-200/60 max-w-sm text-sm leading-relaxed mb-8 font-medium">
              Every tool you'll ever need — PDF, image, video, AI, developer, and more. Built by Mohd Zaheer Uddin.
            </p>
            <div className="flex items-center gap-4">
              <a href="https://github.com/MohdZaheerU" target="_blank" rel="noopener noreferrer" className="text-neutral-500 hover:text-white hover:scale-115 transition-all w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                <FontAwesomeIcon icon={faGithub} className="w-5 h-5" />
              </a>
              <button onClick={() => setActiveTab('coming-soon')} className="text-neutral-500 hover:text-[#1DA1F2] hover:scale-115 transition-all w-10 h-10 rounded-full bg-white/5 flex items-center justify-center cursor-pointer">
                <FontAwesomeIcon icon={faXTwitter} className="w-5 h-5" />
              </button>
              <button onClick={() => setActiveTab('coming-soon')} className="text-neutral-500 hover:text-[#0A66C2] hover:scale-115 transition-all w-10 h-10 rounded-full bg-white/5 flex items-center justify-center cursor-pointer">
                <FontAwesomeIcon icon={faLinkedin} className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Tools Column */}
          <div className="border-b border-white/5 lg:border-0 pb-4 lg:pb-0">
            <h4 
              onClick={() => setOpenFooterCol(openFooterCol === 'tools' ? null : 'tools')}
              className="font-bold text-sm text-purple-200 uppercase tracking-widest mb-0 lg:mb-6 flex justify-between items-center cursor-pointer select-none lg:pointer-events-none"
            >
              <span>Tools</span>
              <span className="lg:hidden">{openFooterCol === 'tools' ? '−' : '+'}</span>
            </h4>
            <ul className={cn("space-y-3.5 text-neutral-400 text-xs font-semibold mt-4 lg:mt-0 transition-all", openFooterCol === 'tools' ? 'block' : 'hidden lg:block')}>
              <li><button onClick={() => { setActiveTab('tools'); }} className="hover:text-white transition-colors cursor-pointer text-left">Browse All Tools</button></li>
              <li><button onClick={() => { localStorage.setItem('selected_category_filter', 'PDF & Documents'); setActiveTab('tools'); }} className="hover:text-white transition-colors cursor-pointer text-left">PDF Tools</button></li>
              <li><button onClick={() => { localStorage.setItem('selected_category_filter', 'Image Tools'); setActiveTab('tools'); }} className="hover:text-white transition-colors cursor-pointer text-left">Image Tools</button></li>
              <li><button onClick={() => { localStorage.setItem('selected_category_filter', 'Video Tools'); setActiveTab('tools'); }} className="hover:text-white transition-colors cursor-pointer text-left">Video Tools</button></li>
              <li><button onClick={() => { localStorage.setItem('selected_category_filter', 'Developer Tools'); setActiveTab('tools'); }} className="hover:text-white transition-colors cursor-pointer text-left">Developer Tools</button></li>
              <li><button onClick={() => { localStorage.setItem('selected_category_filter', 'Writing Tools'); setActiveTab('tools'); }} className="hover:text-white transition-colors cursor-pointer text-left">Writing Tools</button></li>
            </ul>
          </div>

          {/* Product Column */}
          <div className="border-b border-white/5 lg:border-0 pb-4 lg:pb-0">
            <h4 
              onClick={() => setOpenFooterCol(openFooterCol === 'product' ? null : 'product')}
              className="font-bold text-sm text-purple-200 uppercase tracking-widest mb-0 lg:mb-6 flex justify-between items-center cursor-pointer select-none lg:pointer-events-none"
            >
              <span>Product</span>
              <span className="lg:hidden">{openFooterCol === 'product' ? '−' : '+'}</span>
            </h4>
            <ul className={cn("space-y-3.5 text-neutral-400 text-xs font-semibold mt-4 lg:mt-0 transition-all", openFooterCol === 'product' ? 'block' : 'hidden lg:block')}>
              <li><button onClick={() => setActiveTab('pricing')} className="hover:text-white transition-colors cursor-pointer text-left">Pricing</button></li>
              <li><button onClick={() => setActiveTab('whats-new')} className="hover:text-white transition-colors cursor-pointer text-left">What's New</button></li>
              <li><button onClick={() => goToProCheckout()} className="hover:text-white transition-colors cursor-pointer text-left">Upgrade to Pro</button></li>
            </ul>
          </div>

          {/* Company Column */}
          <div className="border-b border-white/5 lg:border-0 pb-4 lg:pb-0">
            <h4 
              onClick={() => setOpenFooterCol(openFooterCol === 'company' ? null : 'company')}
              className="font-bold text-sm text-purple-200 uppercase tracking-widest mb-0 lg:mb-6 flex justify-between items-center cursor-pointer select-none lg:pointer-events-none"
            >
              <span>Company</span>
              <span className="lg:hidden">{openFooterCol === 'company' ? '−' : '+'}</span>
            </h4>
            <ul className={cn("space-y-3.5 text-neutral-400 text-xs font-semibold mt-4 lg:mt-0 transition-all", openFooterCol === 'company' ? 'block' : 'hidden lg:block')}>
              <li><button onClick={() => setActiveTab('about')} className="hover:text-white transition-colors cursor-pointer text-left">About Qofeno</button></li>
              <li><button onClick={() => setActiveTab('contact')} className="hover:text-white transition-colors cursor-pointer text-left">Contact Support</button></li>
            </ul>
          </div>
          
          {/* Legal Column */}
          <div className="border-b border-white/5 lg:border-0 pb-4 lg:pb-0">
            <h4 
              onClick={() => setOpenFooterCol(openFooterCol === 'legal' ? null : 'legal')}
              className="font-bold text-sm text-purple-200 uppercase tracking-widest mb-0 lg:mb-6 flex justify-between items-center cursor-pointer select-none lg:pointer-events-none"
            >
              <span>Legal</span>
              <span className="lg:hidden">{openFooterCol === 'legal' ? '−' : '+'}</span>
            </h4>
            <ul className={cn("space-y-3.5 text-neutral-400 text-xs font-semibold mt-4 lg:mt-0 transition-all", openFooterCol === 'legal' ? 'block' : 'hidden lg:block')}>
              <li><button onClick={() => setActiveTab('policy')} className="hover:text-white transition-colors cursor-pointer text-left">Privacy Policy</button></li>
              <li><button onClick={() => setActiveTab('terms')} className="hover:text-white transition-colors cursor-pointer text-left">Terms of Service</button></li>
              <li><button onClick={() => setActiveTab('cookies')} className="hover:text-white transition-colors cursor-pointer text-left">Cookie Policy</button></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-10 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-medium tracking-tight">
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} Qofeno. Built by Mohd Zaheer Uddin.</span>
            <div className="flex items-center gap-3">
              <a href="https://github.com/MohdZaheerU" target="_blank" rel="noopener noreferrer" className="text-neutral-400 hover:text-white transition-colors">
                <FontAwesomeIcon icon={faGithub} className="text-base" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <CookieConsentBanner onNavigate={(page) => setActiveTab(page)} />
    </Layout>
    </TooltipProvider>
  );
}
