import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser, faShieldHalved, faSliders, faBell, faCreditCard,
  faLock, faTriangleExclamation, faSpinner, faCheck, faLaptop,
  faSun, faMoon, faDesktop, faEye, faEyeSlash, faDownload,
  faRotateRight, faCalendar, faCircleCheck,
  faArrowUpRightFromSquare, faEnvelope, faRightToBracket, faXmark,
  faCircleInfo
} from '@fortawesome/free-solid-svg-icons';
import { account, databases, DATABASE_ID } from '../../lib/qofeno-appwrite';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { SEO } from '../../components/SEO';
import { Query } from 'appwrite';
import { PlanBadge } from '../PlanBadge';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

type SettingsTab = 'profile' | 'account' | 'appearance' | 'notifications' | 'billing' | 'privacy' | 'danger';

type Session = {
  $id: string;
  osName: string;
  clientName: string;
  clientVersion: string;
  ip: string;
  country: string;
  current: boolean;
  $createdAt: string;
};

type SubscriptionDoc = {
  plan: string;
  status: string;
  payment_provider: string;
  payment_sub_id: string;
  current_period_end: string;
  current_period_start: string;
  cancelled_at: string | null;
};

type UserMetaDoc = {
  $id?: string;
  plan: string;
  plan_expires_at: string | null;
  payment_ref: string | null;
  tools_used: number;
  files_processed: number;
  storage_used: number;
  created_at: string;
};

/* ─── Reusable primitives ─────────────────────────────── */

function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
        checked ? 'bg-purple-600' : 'bg-neutral-200',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      )}
    >
      <span className={cn(
        'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200',
        checked ? 'translate-x-5' : 'translate-x-0'
      )} />
    </button>
  );
}

function SettingsRow({ label, description, children, last = false }: {
  label: string; description?: string; children: React.ReactNode; last?: boolean;
}) {
  return (
    <div className={cn('flex items-start justify-between py-5 gap-8', !last && 'border-b border-neutral-100')}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-neutral-800">{label}</p>
        {description && <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">{description}</p>}
      </div>
      <div className="flex-shrink-0 flex items-center">{children}</div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-6 pb-5 border-b border-neutral-100">
      <h2 className="text-lg font-bold text-neutral-900">{title}</h2>
      {subtitle && <p className="text-sm text-neutral-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

function SettingsInput({
  label, value, onChange, type = 'text', disabled = false, placeholder = '', hint = '', autoComplete
}: {
  label?: string; value: string; onChange?: (v: string) => void;
  type?: string; disabled?: boolean; placeholder?: string; hint?: string; autoComplete?: string;
}) {
  const [show, setShow] = useState(false);
  const isPass = type === 'password';
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-xs font-semibold text-neutral-600">{label}</label>}
      <div className="relative">
        <input
          type={isPass ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange?.(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className={cn(
            'w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-all',
            'bg-neutral-50 border-neutral-200 text-neutral-800 placeholder-neutral-300',
            'focus:border-purple-400 focus:bg-white focus:ring-3 focus:ring-purple-50',
            disabled && 'text-neutral-400 cursor-not-allowed bg-neutral-100',
            isPass && 'pr-10'
          )}
        />
        {isPass && (
          <button
            type="button"
            onClick={() => setShow(s => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <FontAwesomeIcon icon={show ? faEyeSlash : faEye} className="w-4 h-4" />
          </button>
        )}
      </div>
      {hint && <p className="text-[11px] text-neutral-400">{hint}</p>}
    </div>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'Number', pass: /[0-9]/.test(password) },
  ];
  if (!password) return null;
  const score = checks.filter(c => c.pass).length;
  const colors = ['bg-red-400', 'bg-amber-400', 'bg-green-500'];
  return (
    <div className="space-y-2 mt-2">
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors', i < score ? colors[score - 1] : 'bg-neutral-200')} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {checks.map(c => (
          <span key={c.label} className={cn('text-[11px] flex items-center gap-1', c.pass ? 'text-green-600' : 'text-neutral-400')}>
            <FontAwesomeIcon icon={faCheck} className={cn('w-2.5 h-2.5', c.pass ? 'opacity-100' : 'opacity-0')} />
            {c.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } catch { return '—'; }
}

function formatBytes(bytes: number): string {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/* ─── Main Component ──────────────────────────────────── */

export function Settings({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { user, isAuthenticated, isLoading: isAuthLoading, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Email update dialog
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [changingEmail, setChangingEmail] = useState(false);

  // Account / Security
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);

  // Appearance
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    () => (localStorage.getItem('qofeno_theme') as any) || 'system'
  );

  // Notifications (4 toggles)
  const [notifyUpdates, setNotifyUpdates] = useState(
    () => localStorage.getItem('pref_notify_updates') !== 'false'
  );
  const [notifyUsage, setNotifyUsage] = useState(
    () => localStorage.getItem('pref_notify_usage') !== 'false'
  );
  const [notifySecurity, setNotifySecurity] = useState(
    () => localStorage.getItem('pref_notify_security') !== 'false'
  );
  const [notifyNewTools, setNotifyNewTools] = useState(
    () => localStorage.getItem('pref_notify_new_tools') === 'true'
  );
  const [savingNotify, setSavingNotify] = useState(false);
  const notifyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Billing
  const [subscription, setSubscription] = useState<SubscriptionDoc | null>(null);
  const [userMeta, setUserMeta] = useState<UserMetaDoc | null>(null);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Privacy
  const [downloadingData, setDownloadingData] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);

  // Danger Zone
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      window.location.href = page;
    }
  };

  // Read URL tab param
  useEffect(() => {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (tab && ['profile', 'account', 'appearance', 'notifications', 'billing', 'privacy', 'danger'].includes(tab)) {
      setActiveTab(tab as SettingsTab);
    }
  }, []);

  // Sync name from user
  useEffect(() => {
    if (user?.name) setName(user.name);
    else if (!isAuthenticated) setName('Guest User');
  }, [user, isAuthenticated]);

  // Load notification prefs
  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    account.getPrefs().then(prefs => {
      if (cancelled) return;
      if ('notify_updates' in prefs) setNotifyUpdates(Boolean(prefs.notify_updates));
      if ('notify_usage' in prefs) setNotifyUsage(Boolean(prefs.notify_usage));
      if ('notify_security' in prefs) setNotifySecurity(Boolean(prefs.notify_security));
      if ('notify_new_tools' in prefs) setNotifyNewTools(Boolean(prefs.notify_new_tools));
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [isAuthenticated]);

  // Load sessions when user is authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      setSessions([]);
      return;
    }
    let cancelled = false;
    setLoadingSessions(true);
    account.listSessions()
      .then(list => {
        if (cancelled) return;
        if (list && list.sessions && list.sessions.length > 0) {
          setSessions(list.sessions.map((s: any) => ({
            $id: s.$id || 'current',
            osName: s.osName || 'Web Browser',
            clientName: s.clientName || (s.provider ? String(s.provider).toUpperCase() : 'Appwrite Session'),
            clientVersion: s.clientVersion || '',
            ip: s.ip || 'Client Connection',
            country: s.countryName || s.country || '',
            current: Boolean(s.current),
            $createdAt: s.$createdAt || new Date().toISOString(),
          })));
        } else {
          setSessions([{
            $id: 'current',
            osName: 'Current Desktop Browser',
            clientName: user?.isOAuth ? `${user.provider?.toUpperCase() || 'OAuth'} Active Session` : 'Qofeno Web Client',
            clientVersion: 'v2.0',
            ip: 'Active Client Session',
            country: '',
            current: true,
            $createdAt: user?.$createdAt || user?.createdAt || new Date().toISOString(),
          }]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSessions([{
            $id: 'current',
            osName: 'Current Desktop Browser',
            clientName: user?.isOAuth ? `${user.provider?.toUpperCase() || 'OAuth'} Active Session` : 'Qofeno Web Client',
            clientVersion: 'v2.0',
            ip: 'Active Client Session',
            country: '',
            current: true,
            $createdAt: user?.$createdAt || user?.createdAt || new Date().toISOString(),
          }]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingSessions(false);
      });

    return () => { cancelled = true; };
  }, [isAuthenticated, user]);

  // Load billing when Billing tab opens
  useEffect(() => {
    if (activeTab !== 'billing' || !user?.id) return;
    let cancelled = false;
    setLoadingBilling(true);
    Promise.all([
      databases.listDocuments(DATABASE_ID, 'subscriptions', [
        Query.equal('user_id', user.id),
        Query.orderDesc('$createdAt'),
        Query.limit(1),
      ]),
      databases.listDocuments(DATABASE_ID, 'users_meta', [
        Query.equal('user_id', user.id),
        Query.limit(1),
      ]),
    ]).then(([subRes, metaRes]) => {
      if (cancelled) return;
      setSubscription(subRes.documents[0] as any || null);
      setUserMeta(metaRes.documents[0] as any || null);
    }).catch(() => {}).finally(() => { if (!cancelled) setLoadingBilling(false); });
    return () => { cancelled = true; };
  }, [activeTab, user?.id]);

  // Apply theme instantly to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) root.classList.add('dark');
      else root.classList.remove('dark');
    }
  }, [theme]);

  /* ─── Handlers ──────────────────────────── */

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingProfile(true);
    try {
      if (isAuthenticated) {
        await account.updateName(name.trim());
        await refreshSession();
        toast.success('Profile updated');
      } else {
        localStorage.setItem('qofeno_guest_name', name.trim());
        toast.success('Guest display name saved');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      handleNavigate('login?redirect=/settings');
      return;
    }
    if (!newEmail.trim() || !emailPassword) {
      toast.error('Please enter your new email and current password');
      return;
    }
    setChangingEmail(true);
    try {
      await account.updateEmail(newEmail.trim(), emailPassword);
      if (userMeta?.$id) {
        await databases.updateDocument(DATABASE_ID, 'users_meta', userMeta.$id, {
          email: newEmail.trim()
        }).catch(() => {});
      }
      await refreshSession();
      setShowEmailModal(false);
      setNewEmail('');
      setEmailPassword('');
      toast.success('Email updated successfully to ' + newEmail.trim());
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update email address. Verify current password.');
    } finally {
      setChangingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      handleNavigate('login?redirect=/settings');
      return;
    }
    if (!oldPassword || !newPassword) {
      toast.error('Fill both current and new password fields');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setChangingPassword(true);
    try {
      await account.updatePassword(newPassword, oldPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully');
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleThemeChange = (t: 'light' | 'dark' | 'system') => {
    setTheme(t);
    localStorage.setItem('qofeno_theme', t);
    toast.success(`Theme switched to ${t} mode`);
    if (isAuthenticated) {
      account.getPrefs().then(prefs => account.updatePrefs({ ...prefs, theme: t })).catch(() => {});
    }
  };

  const saveNotifyPrefs = useCallback((updates: boolean, usage: boolean, security: boolean, newTools: boolean) => {
    localStorage.setItem('pref_notify_updates', String(updates));
    localStorage.setItem('pref_notify_usage', String(usage));
    localStorage.setItem('pref_notify_security', String(security));
    localStorage.setItem('pref_notify_new_tools', String(newTools));
    toast.success('Preferences saved');

    if (notifyDebounceRef.current) clearTimeout(notifyDebounceRef.current);
    notifyDebounceRef.current = setTimeout(async () => {
      if (!isAuthenticated) return;
      setSavingNotify(true);
      try {
        const prefs = await account.getPrefs();
        await account.updatePrefs({
          ...prefs,
          notify_updates: updates,
          notify_usage: usage,
          notify_security: security,
          notify_new_tools: newTools,
        });
      } catch {
        // quiet fallback
      } finally {
        setSavingNotify(false);
      }
    }, 400);
  }, [isAuthenticated]);

  const handleRevokeSession = async (sessionId: string) => {
    setRevokingSession(sessionId);
    try {
      await account.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.$id !== sessionId));
      toast.success('Session revoked');
    } catch {
      toast.error('Failed to revoke session');
    } finally {
      setRevokingSession(null);
    }
  };

  const handleExportData = async () => {
    setDownloadingData(true);
    try {
      let exportObj: any = {
        exportedAt: new Date().toISOString(),
        theme,
        notifications: {
          updates: notifyUpdates,
          usage: notifyUsage,
          security: notifySecurity,
          newTools: notifyNewTools,
        },
      };

      if (isAuthenticated) {
        const [uDoc, prefs] = await Promise.all([account.get(), account.getPrefs()]);
        exportObj.user = { id: uDoc.$id, name: uDoc.name, email: uDoc.email };
        exportObj.plan = user?.plan;
        exportObj.preferences = prefs;
        exportObj.meta = userMeta;
      } else {
        exportObj.mode = 'Guest';
      }

      const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `qofeno-settings-${Date.now()}.json` });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch {
      toast.error('Export failed');
    } finally {
      setDownloadingData(false);
    }
  };

  const handleClearHistory = () => {
    setClearingHistory(true);
    try {
      localStorage.removeItem('recently_viewed');
      localStorage.removeItem('qofeno_likes');
      toast.success('Local history and cache cleared');
    } catch {
      toast.error('Failed to clear history');
    } finally {
      setClearingHistory(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toUpperCase() !== 'DELETE') {
      toast.error('Type DELETE to confirm');
      return;
    }
    setDeletingAccount(true);
    try {
      await account.deleteSession('current');
      toast.success('Account deleted. Redirecting…');
      window.location.href = '/';
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete account');
      setDeletingAccount(false);
    }
  };

  /* ─── Nav Items ─────────────────────────── */

  const navItems: { id: SettingsTab; label: string; icon: any; danger?: boolean }[] = [
    { id: 'profile', label: 'Profile', icon: faUser },
    { id: 'account', label: 'Account & Security', icon: faShieldHalved },
    { id: 'appearance', label: 'Appearance', icon: faSliders },
    { id: 'notifications', label: 'Notifications', icon: faBell },
    { id: 'billing', label: 'Billing & Plans', icon: faCreditCard },
    { id: 'privacy', label: 'Privacy & Data', icon: faLock },
    { id: 'danger', label: 'Danger Zone', icon: faTriangleExclamation, danger: true },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-28 md:pt-36 pb-24 px-4 md:px-8">
      <SEO title="Settings — Qofeno" description="Manage your Qofeno profile, security, billing, and preferences." />

      <div className="max-w-5xl mx-auto">
        
        {/* Guest Mode Top Banner */}
        {!isAuthLoading && !isAuthenticated && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-purple-500/5 border border-purple-200/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                <FontAwesomeIcon icon={faCircleInfo} className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-neutral-900">Browsing Settings in Guest Mode</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Sign in or create a free account to sync display profile, active sessions, and subscriptions across devices.
                </p>
              </div>
            </div>
            <button
              onClick={() => handleNavigate('login?redirect=/settings')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all shadow-sm shrink-0 flex items-center gap-1.5 cursor-pointer"
            >
              <FontAwesomeIcon icon={faRightToBracket} className="w-3.5 h-3.5" />
              Sign in
            </button>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-neutral-900">Settings</h1>
          <p className="text-sm text-neutral-400 mt-1">Manage your account and workspace preferences.</p>
        </div>

        {/* Mobile Horizontal Sub-Nav */}
        <div className="md:hidden flex items-center gap-2 overflow-x-auto pb-4 mb-4 scrollbar-none">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={cn(
                'flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border',
                activeTab === item.id
                  ? item.danger
                    ? 'bg-red-50 border-red-200 text-red-600'
                    : 'bg-purple-600 border-purple-600 text-white shadow-sm'
                  : 'bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50'
              )}
            >
              <FontAwesomeIcon icon={item.icon} className="w-3.5 h-3.5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 items-start">
          {/* Desktop Left Sidebar Nav */}
          <nav className="hidden md:block bg-white border border-neutral-200/80 rounded-2xl p-2 shadow-sm sticky top-28 space-y-0.5">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left cursor-pointer',
                  activeTab === item.id
                    ? item.danger
                      ? 'bg-red-50 text-red-600 font-semibold'
                      : 'bg-purple-50 text-purple-700 font-semibold'
                    : item.danger
                      ? 'text-red-500 hover:bg-red-50/60'
                      : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                )}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className={cn(
                    'w-4 h-4 flex-shrink-0',
                    activeTab === item.id
                      ? item.danger ? 'text-red-500' : 'text-purple-600'
                      : item.danger ? 'text-red-400' : 'text-neutral-400'
                  )}
                />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Main Content Card */}
          <AnimatePresence mode="wait">
            <motion.main
              key={activeTab}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.15 }}
              className="bg-white border border-neutral-200/80 rounded-2xl p-6 md:p-8 shadow-sm min-h-[460px]"
            >

              {/* ── PROFILE ── */}
              {activeTab === 'profile' && (
                <div>
                  <SectionHeader title="Profile" subtitle="Update your display name and view account info." />

                  {/* Avatar row */}
                  <div className="flex items-center gap-4 mb-8">
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-fuchsia-600 flex items-center justify-center text-white text-xl font-bold shadow-md flex-shrink-0">
                      {(user?.name || 'Guest').slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-neutral-900">{user?.name || 'Guest User'}</p>
                      <p className="text-sm text-neutral-400">{user?.email || 'Sign in to connect email'}</p>
                      <div className="mt-1.5">
                        <PlanBadge plan={user?.plan || 'free'} />
                      </div>
                    </div>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4 max-w-sm">
                    <SettingsInput
                      label="Display Name"
                      value={name}
                      onChange={setName}
                      placeholder="Your full name"
                      autoComplete="name"
                    />
                    
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-neutral-600">Email Address</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          placeholder={isAuthenticated ? '' : 'Not signed in'}
                          className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-neutral-200 bg-neutral-100 text-neutral-500 cursor-not-allowed outline-none"
                        />
                        {isAuthenticated && (
                          user?.isOAuth ? (
                            <button
                              type="button"
                              disabled
                              title="Email address is managed by Google/GitHub login and cannot be changed here."
                              className="px-3 py-2.5 bg-neutral-100 border border-neutral-200 text-neutral-400 text-xs font-semibold rounded-xl cursor-not-allowed shrink-0 flex items-center gap-1.5 opacity-75"
                            >
                              <FontAwesomeIcon icon={faLock} className="w-3 h-3 text-neutral-400" />
                              OAuth Managed
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setShowEmailModal(true)}
                              className="px-3 py-2.5 bg-white border border-neutral-200 hover:border-purple-300 text-neutral-700 hover:text-purple-600 text-xs font-semibold rounded-xl transition-all whitespace-nowrap shrink-0 cursor-pointer"
                            >
                              Change Email
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <SettingsRow label="Member since" last>
                      <span className="text-sm text-neutral-500">
                        {isAuthenticated ? formatDate(user?.$createdAt || user?.createdAt || userMeta?.created_at || new Date().toISOString()) : 'Guest session'}
                      </span>
                    </SettingsRow>

                    <button
                      type="submit"
                      disabled={savingProfile || !name.trim()}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                      {savingProfile
                        ? <><FontAwesomeIcon icon={faSpinner} className="fa-spin mr-2" />Saving…</>
                        : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              {/* ── ACCOUNT & SECURITY ── */}
              {activeTab === 'account' && (
                <div>
                  <SectionHeader title="Account & Security" subtitle="Manage your password and active login sessions." />

                  {!isAuthenticated ? (
                    <div className="p-6 bg-neutral-50 border border-neutral-200 rounded-2xl max-w-md text-center space-y-3">
                      <FontAwesomeIcon icon={faShieldHalved} className="w-8 h-8 text-neutral-400 mx-auto" />
                      <h3 className="text-base font-bold text-neutral-800">Password & Sessions Locked</h3>
                      <p className="text-xs text-neutral-500 leading-relaxed">
                        Security controls and multi-device session management are available for registered Qofeno accounts.
                      </p>
                      <button
                        onClick={() => handleNavigate('login?redirect=/settings?tab=account')}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <FontAwesomeIcon icon={faRightToBracket} className="w-3.5 h-3.5" />
                        Sign in to access security
                      </button>
                    </div>
                  ) : (
                    <>
                      {user?.isOAuth ? (
                        <div className="p-4 bg-neutral-50 border border-neutral-200/80 rounded-2xl max-w-sm mb-10 space-y-1.5">
                          <div className="flex items-center gap-2 text-neutral-800 font-bold text-xs">
                            <FontAwesomeIcon icon={faLock} className="text-neutral-400 w-3.5 h-3.5" />
                            Password Managed by OAuth
                          </div>
                          <p className="text-xs text-neutral-500 leading-relaxed">
                            Your account is authenticated via {user.provider ? user.provider.toUpperCase() : 'Google / GitHub'} OAuth. Password changes are managed securely through your login provider.
                          </p>
                        </div>
                      ) : (
                        <form onSubmit={handleChangePassword} className="space-y-4 max-w-sm mb-10">
                          <h3 className="text-sm font-semibold text-neutral-700">Change Password</h3>
                          <SettingsInput label="Current Password" value={oldPassword} onChange={setOldPassword} type="password" placeholder="••••••••" autoComplete="current-password" />
                          <SettingsInput label="New Password" value={newPassword} onChange={setNewPassword} type="password" placeholder="At least 8 characters" autoComplete="new-password" />
                          <PasswordStrength password={newPassword} />
                          <SettingsInput label="Confirm New Password" value={confirmPassword} onChange={setConfirmPassword} type="password" placeholder="Repeat new password" autoComplete="new-password" />
                          <button
                            type="submit"
                            disabled={changingPassword || !oldPassword || !newPassword || newPassword !== confirmPassword}
                            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                          >
                            {changingPassword
                              ? <><FontAwesomeIcon icon={faSpinner} className="fa-spin mr-2" />Updating…</>
                              : 'Update Password'}
                          </button>
                        </form>
                      )}

                      <div>
                        <h3 className="text-sm font-semibold text-neutral-700 mb-4">Active Sessions</h3>
                        {loadingSessions ? (
                          <div className="flex items-center gap-2 text-sm text-neutral-400 py-4">
                            <FontAwesomeIcon icon={faSpinner} className="fa-spin" /> Loading sessions…
                          </div>
                        ) : sessions.length === 0 ? (
                          <p className="text-sm text-neutral-400">No session information available.</p>
                        ) : (
                          <div className="space-y-2">
                            {sessions.map(s => (
                              <div key={s.$id} className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-150 rounded-xl">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center flex-shrink-0">
                                    <FontAwesomeIcon icon={faLaptop} className="text-neutral-400 w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-sm font-semibold text-neutral-800 truncate">
                                      {s.clientName} {s.clientVersion && `${s.clientVersion}`} · {s.osName}
                                    </p>
                                    <p className="text-xs text-neutral-400">{s.ip}{s.country ? ` · ${s.country}` : ''} · {formatDate(s.$createdAt)}</p>
                                  </div>
                                </div>
                                {s.current ? (
                                  <span className="flex-shrink-0 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold">
                                    Current
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleRevokeSession(s.$id)}
                                    disabled={revokingSession === s.$id}
                                    className="flex-shrink-0 px-3 py-1.5 bg-white hover:bg-red-50 border border-neutral-200 hover:border-red-200 text-neutral-600 hover:text-red-600 rounded-lg text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
                                  >
                                    {revokingSession === s.$id ? <FontAwesomeIcon icon={faSpinner} className="fa-spin" /> : 'Revoke'}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── APPEARANCE ── */}
              {activeTab === 'appearance' && (
                <div>
                  <SectionHeader title="Appearance" subtitle="Choose how Qofeno looks for you. Changes apply instantly." />

                  <div className="grid grid-cols-3 gap-3 max-w-sm">
                    {([
                      { id: 'light', label: 'Light', icon: faSun },
                      { id: 'dark', label: 'Dark', icon: faMoon },
                      { id: 'system', label: 'System', icon: faDesktop },
                    ] as const).map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleThemeChange(item.id)}
                        className={cn(
                          'flex flex-col items-center justify-center gap-2.5 p-5 rounded-2xl border-2 transition-all cursor-pointer',
                          theme === item.id
                            ? 'border-purple-500 bg-purple-50/80 text-purple-700 font-semibold'
                            : 'border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:bg-neutral-50'
                        )}
                      >
                        <FontAwesomeIcon icon={item.icon} className="w-5 h-5" />
                        <span className="text-xs font-semibold">{item.label}</span>
                        {theme === item.id && (
                          <FontAwesomeIcon icon={faCircleCheck} className="w-4 h-4 text-purple-500" />
                        )}
                      </button>
                    ))}
                  </div>

                  <p className="text-xs text-neutral-400 mt-4 max-w-sm">
                    System mode automatically follows your device's light/dark preference.
                  </p>
                </div>
              )}

              {/* ── NOTIFICATIONS ── */}
              {activeTab === 'notifications' && (
                <div>
                  <SectionHeader
                    title="Notifications"
                    subtitle={savingNotify ? 'Saving…' : 'Choose which updates you receive from Qofeno.'}
                  />

                  <div className="space-y-0 max-w-lg divide-y divide-neutral-100">
                    {([
                      { key: 'updates', label: 'Product & Feature Updates', desc: 'New tool releases, feature upgrades, and announcements.', state: notifyUpdates, set: setNotifyUpdates },
                      { key: 'usage', label: 'Usage Alerts', desc: 'Notifications when you are approaching daily limits.', state: notifyUsage, set: setNotifyUsage },
                      { key: 'security', label: 'Security & Login Alerts', desc: 'Alerts for new sign-ins from unrecognized devices.', state: notifySecurity, set: setNotifySecurity },
                      { key: 'new_tools', label: 'New Tools Added', desc: 'Be the first to know when we launch new tools.', state: notifyNewTools, set: setNotifyNewTools },
                    ] as const).map((item, i, arr) => (
                      <SettingsRow key={item.key} label={item.label} description={item.desc} last={i === arr.length - 1}>
                        <Toggle
                          checked={item.state}
                          disabled={savingNotify}
                          onChange={v => {
                            item.set(v);
                            const next = {
                              updates: item.key === 'updates' ? v : notifyUpdates,
                              usage: item.key === 'usage' ? v : notifyUsage,
                              security: item.key === 'security' ? v : notifySecurity,
                              new_tools: item.key === 'new_tools' ? v : notifyNewTools,
                            };
                            saveNotifyPrefs(next.updates, next.usage, next.security, next.new_tools);
                          }}
                        />
                      </SettingsRow>
                    ))}
                  </div>
                </div>
              )}

              {/* ── BILLING ── */}
              {activeTab === 'billing' && (
                <div>
                  <SectionHeader title="Billing & Plans" subtitle="Manage your active subscription and payment details." />

                  {loadingBilling ? (
                    <div className="flex items-center gap-2 text-sm text-neutral-400 py-6">
                      <FontAwesomeIcon icon={faSpinner} className="fa-spin" /> Loading billing info…
                    </div>
                  ) : (
                    <div className="space-y-4 max-w-md">
                      {/* Plan card */}
                      <div className={cn(
                        'p-5 rounded-2xl border',
                        user?.plan === 'free' || !user?.plan
                          ? 'bg-neutral-50 border-neutral-200'
                          : 'bg-gradient-to-br from-purple-50 to-white border-purple-100'
                      )}>
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Current Plan</span>
                            <h3 className="text-xl font-bold text-neutral-900 capitalize mt-0.5">
                              {user?.plan || 'Free'}
                            </h3>
                          </div>
                          <PlanBadge plan={user?.plan || 'free'} />
                        </div>

                        {user?.plan === 'free' || !user?.plan ? (
                          <p className="text-sm text-neutral-500 leading-relaxed mb-4">
                            You are on the Free plan — 50MB file limit, standard processing, access to free tools only.
                          </p>
                        ) : (
                          <div className="space-y-2 mb-4">
                            <p className="text-sm text-neutral-600">
                              Your subscription is active. Full access to 500MB uploads, all tools, and priority Azure processing.
                            </p>
                            {subscription && (
                              <div className="mt-3 space-y-1.5">
                                <div className="flex items-center gap-2 text-xs text-neutral-500">
                                  <FontAwesomeIcon icon={faCalendar} className="w-3.5 h-3.5 text-neutral-400" />
                                  <span>Next billing: <strong className="text-neutral-700">{formatDate(subscription.current_period_end)}</strong></span>
                                </div>
                                {subscription.payment_sub_id && (
                                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                                    <FontAwesomeIcon icon={faCreditCard} className="w-3.5 h-3.5 text-neutral-400" />
                                    <span>Subscription ID: <code className="font-mono text-neutral-600">{subscription.payment_sub_id.slice(0, 20)}…</code></span>
                                  </div>
                                )}
                                {subscription.status && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className={cn(
                                      'px-2 py-0.5 rounded-full font-semibold text-[11px]',
                                      subscription.status === 'ACTIVE'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    )}>
                                      {subscription.status}
                                    </span>
                                    {subscription.payment_provider && (
                                      <span className="text-neutral-400">via {subscription.payment_provider}</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {user?.plan === 'free' || !user?.plan ? (
                            <button
                              onClick={() => handleNavigate('pricing')}
                              className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                            >
                              Upgrade to Pro — $11/mo
                            </button>
                          ) : (
                            <>
                              <a
                                href="https://www.paypal.com/billing/subscriptions"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 text-sm font-semibold rounded-xl transition-all cursor-pointer"
                              >
                                Manage via PayPal
                                <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3.5 h-3.5 text-neutral-400" />
                              </a>
                              <button
                                onClick={() => setShowCancelModal(true)}
                                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-red-50 border border-neutral-200 hover:border-red-200 text-red-600 text-sm font-semibold rounded-xl transition-all cursor-pointer"
                              >
                                Cancel Subscription
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Usage stats (from users_meta) */}
                      {userMeta && (
                        <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50">
                          <h4 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Usage This Period</h4>
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { label: 'Tools used', value: (userMeta.tools_used || 0).toLocaleString() },
                              { label: 'Files processed', value: (userMeta.files_processed || 0).toLocaleString() },
                              { label: 'Storage used', value: formatBytes(userMeta.storage_used || 0) },
                            ].map(stat => (
                              <div key={stat.label} className="text-center">
                                <p className="text-lg font-bold text-neutral-900">{stat.value}</p>
                                <p className="text-xs text-neutral-400 mt-0.5">{stat.label}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── PRIVACY & DATA ── */}
              {activeTab === 'privacy' && (
                <div>
                  <SectionHeader title="Privacy & Data" subtitle="Export your data or clear local history." />

                  <div className="space-y-0 divide-y divide-neutral-100 max-w-lg">
                    <SettingsRow label="Export Personal Data" description="Download a JSON copy of your account preferences, theme, and local metadata.">
                      <button
                        onClick={handleExportData}
                        disabled={downloadingData}
                        className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {downloadingData
                          ? <FontAwesomeIcon icon={faSpinner} className="fa-spin w-4 h-4" />
                          : <FontAwesomeIcon icon={faDownload} className="w-4 h-4 text-neutral-400" />}
                        Export JSON
                      </button>
                    </SettingsRow>

                    <SettingsRow label="Clear Local History" description="Remove liked tools, recently viewed, and cached searches from this device." last>
                      <button
                        onClick={handleClearHistory}
                        disabled={clearingHistory}
                        className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-neutral-50 border border-neutral-200 text-neutral-700 text-sm font-semibold rounded-xl transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <FontAwesomeIcon icon={faRotateRight} className="w-4 h-4 text-neutral-400" />
                        Clear Cache
                      </button>
                    </SettingsRow>
                  </div>

                  <div className="mt-6 p-4 bg-blue-50 border border-blue-100 rounded-xl max-w-lg">
                    <p className="text-xs text-blue-700 leading-relaxed">
                      <strong>Data retention:</strong> Free users — files auto-deleted after download.
                      Pro/Teams users — input files kept 6 days, result files kept 7 days.
                      We never sell or share your data. See our <button onClick={() => handleNavigate('policy')} className="underline font-semibold cursor-pointer">Privacy Policy</button>.
                    </p>
                  </div>
                </div>
              )}

              {/* ── DANGER ZONE ── */}
              {activeTab === 'danger' && (
                <div>
                  <SectionHeader title="Danger Zone" subtitle="Irreversible actions. Proceed with extreme caution." />

                  {!isAuthenticated ? (
                    <div className="p-6 bg-red-50/40 border border-red-200/70 rounded-2xl max-w-md text-center space-y-3">
                      <FontAwesomeIcon icon={faTriangleExclamation} className="w-8 h-8 text-red-500 mx-auto" />
                      <h3 className="text-base font-bold text-neutral-900">Account Deletion Unavailable</h3>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        You are currently in guest mode. Sign in to your account if you wish to manage account termination.
                      </p>
                      <button
                        onClick={() => handleNavigate('login?redirect=/settings?tab=danger')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer inline-flex items-center gap-1.5"
                      >
                        <FontAwesomeIcon icon={faRightToBracket} className="w-3.5 h-3.5" />
                        Sign in to account
                      </button>
                    </div>
                  ) : (
                    <div className="p-5 bg-red-50/60 border border-red-200 rounded-2xl space-y-3 max-w-md">
                      <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="w-4 h-4" />
                        Delete Account
                      </div>
                      <p className="text-xs text-red-600 leading-relaxed">
                        Permanently delete your account, subscriptions, preferences, and all associated data.
                        This cannot be undone.
                      </p>
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                      >
                        Delete Account…
                      </button>
                    </div>
                  )}
                </div>
              )}

            </motion.main>
          </AnimatePresence>
        </div>
      </div>

      {/* Change Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowEmailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 relative"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
                    <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-bold text-neutral-900">Change Email Address</h3>
                </div>
                <button onClick={() => setShowEmailModal(false)} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
                  <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleChangeEmail} className="space-y-4">
                <SettingsInput
                  label="New Email Address"
                  type="email"
                  value={newEmail}
                  onChange={setNewEmail}
                  placeholder="newemail@example.com"
                  autoComplete="email"
                />
                <SettingsInput
                  label="Current Password"
                  type="password"
                  value={emailPassword}
                  onChange={setEmailPassword}
                  placeholder="Confirm with current password"
                  autoComplete="current-password"
                />
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changingEmail || !newEmail || !emailPassword}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 cursor-pointer"
                  >
                    {changingEmail ? <FontAwesomeIcon icon={faSpinner} className="fa-spin mr-1.5" /> : null}
                    Update Email
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Subscription Modal */}
      <AnimatePresence>
        {showCancelModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowCancelModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">Cancel Subscription</h3>
              </div>
              <p className="text-sm text-neutral-600 leading-relaxed">
                Cancelling your subscription will keep your Pro benefits active until the end of your billing cycle ({formatDate(subscription?.current_period_end)}). Afterwards, your account will revert to the Free plan.
              </p>
              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-xl cursor-pointer"
                >
                  Keep Subscription
                </button>
                <a
                  href="https://www.paypal.com/billing/subscriptions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl inline-flex items-center gap-1.5 cursor-pointer"
                >
                  Manage on PayPal
                  <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="w-3 h-3" />
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Change Email Modal */}
      <AnimatePresence>
        {showEmailModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowEmailModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4 relative"
            >
              <button
                onClick={() => setShowEmailModal(false)}
                className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700"
              >
                <FontAwesomeIcon icon={faXmark} className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">Change Email Address</h3>
              </div>
              <form onSubmit={handleChangeEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">New Email Address</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="new@example.com"
                    className="w-full px-3.5 py-2.5 border border-neutral-200 focus:border-purple-500 rounded-xl text-sm outline-none font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-600 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={emailPassword}
                    onChange={e => setEmailPassword(e.target.value)}
                    placeholder="Enter current password"
                    className="w-full px-3.5 py-2.5 border border-neutral-200 focus:border-purple-500 rounded-xl text-sm outline-none font-medium"
                  />
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEmailModal(false)}
                    className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-xl cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={changingEmail || !newEmail.trim() || !emailPassword}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 cursor-pointer"
                  >
                    {changingEmail ? <FontAwesomeIcon icon={faSpinner} className="fa-spin mr-1.5" /> : null}
                    Update Email
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowDeleteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              onClick={e => e.stopPropagation()}
              className="bg-white max-w-md w-full rounded-2xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-base font-bold text-neutral-900">Delete your account?</h3>
              </div>
              <p className="text-sm text-neutral-500 leading-relaxed">
                This is permanent. Type <strong className="text-red-600 font-bold">DELETE</strong> below to confirm.
              </p>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="w-full px-3.5 py-2.5 border border-red-200 focus:border-red-400 rounded-xl text-sm outline-none font-mono transition-colors"
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); }}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-sm font-semibold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText.toUpperCase() !== 'DELETE' || deletingAccount}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-xl disabled:opacity-50 cursor-pointer"
                >
                  {deletingAccount ? <FontAwesomeIcon icon={faSpinner} className="fa-spin mr-1.5" /> : null}
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
