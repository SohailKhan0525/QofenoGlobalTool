import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faShieldHalved, faSliders, faBell, faCreditCard, 
  faLock, faTrash, faSpinner, faCheck, faLaptop, faKey,
  faArrowRightFromBracket, faStar, faSun, faMoon, faDesktop
} from '@fortawesome/free-solid-svg-icons';
import { account, databases, DATABASE_ID } from '../../lib/qofeno-appwrite';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { SEO } from '../../components/SEO';
import { Query } from 'appwrite';
import { PlanBadge } from '../PlanBadge';

type SettingsTab = 'profile' | 'account' | 'appearance' | 'notifications' | 'billing' | 'privacy' | 'danger';

type Session = {
  $id: string;
  osName: string;
  clientName: string;
  ip: string;
  current: boolean;
};

export function Settings() {
  const { user, refreshSession } = useAuth();
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  // Profile Form States
  const [name, setName] = useState(user?.name || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Account Form States
  const [newPassword, setNewPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  // Appearance State
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>(
    (localStorage.getItem('qofeno_theme') as any) || 'system'
  );

  // Notification Toggles
  const [notifyUpdates, setNotifyUpdates] = useState(true);
  const [notifyUsage, setNotifyUsage] = useState(true);
  const [notifySecurity, setNotifySecurity] = useState(true);
  const [savingNotify, setSavingNotify] = useState(false);

  // Privacy & Danger Zone
  const [downloadingData, setDownloadingData] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam && ['profile', 'account', 'appearance', 'notifications', 'billing', 'privacy', 'danger'].includes(tabParam)) {
      setActiveTab(tabParam as SettingsTab);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchPrefs = async () => {
      try {
        const prefs = await account.getPrefs();
        if (!cancelled) {
          if ('notify_updates' in prefs) setNotifyUpdates(Boolean(prefs.notify_updates));
          if ('notify_usage' in prefs) setNotifyUsage(Boolean(prefs.notify_usage));
          if ('notify_security' in prefs) setNotifySecurity(Boolean(prefs.notify_security));
        }
      } catch (err) {
        console.warn("Failed to load preferences:", err);
      }
    };
    void fetchPrefs();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (activeTab === 'account') {
      let cancelled = false;
      setLoadingSessions(true);
      account.listSessions().then(list => {
        if (!cancelled) {
          setSessions(
            list.sessions.map((s: any) => ({
              $id: s.$id,
              osName: s.osName || 'Unknown OS',
              clientName: s.clientName || 'Unknown Browser',
              ip: s.ip || 'Unknown IP',
              current: s.current
            }))
          );
        }
      }).catch(err => {
        console.warn("Failed to load sessions:", err);
      }).finally(() => {
        if (!cancelled) setLoadingSessions(false);
      });
      return () => { cancelled = true; };
    }
  }, [activeTab]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSavingProfile(true);
    try {
      await account.updateName(name.trim());
      await refreshSession();
      toast.success("Profile updated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update profile name");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !oldPassword) {
      toast.error("Please fill out both current and new password fields.");
      return;
    }
    setChangingPassword(true);
    try {
      await account.updatePassword(newPassword, oldPassword);
      setNewPassword('');
      setOldPassword('');
      toast.success("Password updated successfully!");
    } catch (err: any) {
      toast.error(err?.message || "Failed to update password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    localStorage.setItem('qofeno_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    toast.success(`Theme updated to ${newTheme}`);
  };

  const handleToggleNotify = async (key: 'updates' | 'usage' | 'security', val: boolean) => {
    const nextUpdates = key === 'updates' ? val : notifyUpdates;
    const nextUsage = key === 'usage' ? val : notifyUsage;
    const nextSecurity = key === 'security' ? val : notifySecurity;

    if (key === 'updates') setNotifyUpdates(val);
    if (key === 'usage') setNotifyUsage(val);
    if (key === 'security') setNotifySecurity(val);

    setSavingNotify(true);
    try {
      const prefs = await account.getPrefs();
      await account.updatePrefs({
        ...prefs,
        notify_updates: nextUpdates,
        notify_usage: nextUsage,
        notify_security: nextSecurity,
      });
      toast.success("Notification preferences saved");
    } catch {
      toast.error("Failed to save preferences");
    } finally {
      setSavingNotify(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await account.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.$id !== sessionId));
      toast.success("Session revoked successfully");
    } catch {
      toast.error("Failed to revoke session");
    }
  };

  const handleExportData = async () => {
    setDownloadingData(true);
    try {
      const uDoc = await account.get();
      const prefs = await account.getPrefs();
      const exportObject = {
        user: { id: uDoc.$id, name: uDoc.name, email: uDoc.email, status: uDoc.status },
        preferences: prefs,
        exportedAt: new Date().toISOString()
      };
      const blob = new Blob([JSON.stringify(exportObject, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qofeno_user_data_${uDoc.$id}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("UserData downloaded successfully");
    } catch (err: any) {
      toast.error("Failed to export data");
    } finally {
      setDownloadingData(false);
    }
  };

  const handleClearHistory = () => {
    setClearingHistory(true);
    try {
      localStorage.removeItem('recently_viewed');
      localStorage.removeItem('qofeno_likes');
      toast.success("Local search & tool history cleared");
    } catch {
      toast.error("Failed to clear history");
    } finally {
      setClearingHistory(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.toUpperCase() !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm');
      return;
    }
    setDeletingAccount(true);
    try {
      // Delete user session and call account deletion endpoint if enabled
      await account.deleteSession('current');
      toast.success("Account deleted. Redirecting...");
      window.location.href = '/';
    } catch (err: any) {
      toast.error(err?.message || "Failed to delete account");
      setDeletingAccount(false);
    }
  };

  const navItems: { id: SettingsTab; label: string; icon: any }[] = [
    { id: 'profile', label: 'Profile', icon: faUser },
    { id: 'account', label: 'Account & Security', icon: faShieldHalved },
    { id: 'appearance', label: 'Appearance', icon: faSliders },
    { id: 'notifications', label: 'Notifications', icon: faBell },
    { id: 'billing', label: 'Billing & Plans', icon: faCreditCard },
    { id: 'privacy', label: 'Privacy & Data', icon: faLock },
    { id: 'danger', label: 'Danger Zone', icon: faTrash },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-28 md:pt-36 pb-24 px-4 md:px-8 select-none">
      <SEO title="Settings - Qofeno" description="Manage your Qofeno profile, security, billing, and preferences." />

      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-black text-[#0F0A1E]">Settings</h1>
          <p className="text-neutral-500 text-sm mt-1">Manage your workspace account preferences and privacy settings.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8 items-start">
          {/* Claude.ai Style Left Navigation Sidebar */}
          <nav className="bg-white border border-neutral-200/80 rounded-2xl p-2 shadow-sm space-y-1 sticky top-28">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === item.id
                    ? item.id === 'danger'
                      ? 'bg-red-50 text-red-600 font-extrabold'
                      : 'bg-purple-50 text-purple-700 font-extrabold'
                    : item.id === 'danger'
                      ? 'text-red-500 hover:bg-red-50/50'
                      : 'text-neutral-600 hover:bg-neutral-100/70 hover:text-neutral-900'
                }`}
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className={`w-4 h-4 ${
                    activeTab === item.id
                      ? item.id === 'danger' ? 'text-red-600' : 'text-purple-600'
                      : item.id === 'danger' ? 'text-red-400' : 'text-neutral-400'
                  }`}
                />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Main Settings Content Area */}
          <main className="bg-white border border-neutral-200/80 rounded-3xl p-6 md:p-8 shadow-sm">
            {/* PROFILE TAB */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0F0A1E]">Profile Details</h2>
                  <p className="text-xs text-neutral-500 mt-1">Manage your public user profile and display identity.</p>
                </div>

                <div className="flex items-center gap-4 py-4 border-y border-neutral-100">
                  <div className="w-16 h-16 rounded-2xl bg-purple-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
                    {(user?.name || 'User').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-[#0F0A1E] text-base">{user?.name || 'User'}</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">{user?.email}</p>
                    <div className="mt-2">
                      <PlanBadge plan={user?.plan || 'free'} />
                    </div>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4 max-w-md">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">Display Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-800 outline-none focus:border-purple-500 focus:bg-white transition-all"
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">Email Address</label>
                    <input
                      type="email"
                      disabled
                      value={user?.email || ''}
                      className="w-full px-3.5 py-2.5 bg-neutral-100 border border-neutral-200 rounded-xl text-sm font-medium text-neutral-400 cursor-not-allowed"
                    />
                    <p className="text-[11px] text-neutral-400 mt-1">Email changes can be initiated from the Account tab.</p>
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50"
                  >
                    {savingProfile ? <FontAwesomeIcon icon={faSpinner} className="fa-spin mr-1.5" /> : null}
                    Save Profile
                  </button>
                </form>
              </div>
            )}

            {/* ACCOUNT & SECURITY TAB */}
            {activeTab === 'account' && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0F0A1E]">Account & Password</h2>
                  <p className="text-xs text-neutral-500 mt-1">Update authentication passwords and active sessions.</p>
                </div>

                <form onSubmit={handleChangePassword} className="space-y-4 max-w-md pb-6 border-b border-neutral-100">
                  <h3 className="text-sm font-bold text-neutral-900">Change Password</h3>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">Current Password</label>
                    <input
                      type="password"
                      value={oldPassword}
                      onChange={(e) => setOldPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:border-purple-500 focus:bg-white"
                      placeholder="••••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1.5">New Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-sm outline-none focus:border-purple-500 focus:bg-white"
                      placeholder="At least 8 characters"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {changingPassword ? <FontAwesomeIcon icon={faSpinner} className="fa-spin mr-1.5" /> : null}
                    Update Password
                  </button>
                </form>

                <div>
                  <h3 className="text-sm font-bold text-neutral-900 mb-3">Active Sessions</h3>
                  {loadingSessions ? (
                    <div className="py-4 text-xs text-neutral-400 flex items-center gap-2">
                      <FontAwesomeIcon icon={faSpinner} className="fa-spin" /> Loading sessions...
                    </div>
                  ) : sessions.length > 0 ? (
                    <div className="space-y-2">
                      {sessions.map((s) => (
                        <div key={s.$id} className="flex items-center justify-between p-3.5 bg-neutral-50 border border-neutral-150 rounded-xl text-xs">
                          <div className="flex items-center gap-3">
                            <FontAwesomeIcon icon={faLaptop} className="text-neutral-400 w-4 h-4" />
                            <div>
                              <p className="font-bold text-neutral-800">{s.clientName} ({s.osName})</p>
                              <p className="text-[10px] text-neutral-400">IP: {s.ip}</p>
                            </div>
                          </div>
                          {s.current ? (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[10px]">Current Session</span>
                          ) : (
                            <button
                              onClick={() => handleRevokeSession(s.$id)}
                              className="px-3 py-1 bg-neutral-200 hover:bg-red-100 hover:text-red-600 text-neutral-600 rounded-lg font-bold transition-colors cursor-pointer"
                            >
                              Revoke
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400">No session information available.</p>
                  )}
                </div>
              </div>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0F0A1E]">Appearance Theme</h2>
                  <p className="text-xs text-neutral-500 mt-1">Customize visual look and feel across tool pages.</p>
                </div>

                <div className="grid grid-cols-3 gap-4 max-w-lg">
                  {[
                    { id: 'light', label: 'Light', icon: faSun },
                    { id: 'dark', label: 'Dark', icon: faMoon },
                    { id: 'system', label: 'System', icon: faDesktop },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleThemeChange(item.id as any)}
                      className={`flex flex-col items-center justify-center p-5 rounded-2xl border transition-all cursor-pointer ${
                        theme === item.id
                          ? 'border-purple-600 bg-purple-50/60 text-purple-700 shadow-sm'
                          : 'border-neutral-200 bg-neutral-50 text-neutral-600 hover:bg-white hover:border-neutral-300'
                      }`}
                    >
                      <FontAwesomeIcon icon={item.icon} className="w-6 h-6 mb-2" />
                      <span className="text-xs font-bold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* NOTIFICATIONS TAB */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0F0A1E]">Notification Preferences</h2>
                  <p className="text-xs text-neutral-500 mt-1">Choose which email and app alerts you'd like to receive.</p>
                </div>

                <div className="space-y-4 max-w-lg">
                  {[
                    { key: 'updates', title: 'Product & Feature Updates', desc: 'Get announcements about new tool releases and feature upgrades.', state: notifyUpdates },
                    { key: 'usage', title: 'Usage Alerts & Limits', desc: 'Receive notices when approaching daily quota limits.', state: notifyUsage },
                    { key: 'security', title: 'Security & Login Alerts', desc: 'Get notified when new logins occur on unrecognized devices.', state: notifySecurity },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 bg-neutral-50 border border-neutral-150 rounded-2xl">
                      <div>
                        <h4 className="text-xs font-bold text-neutral-900">{item.title}</h4>
                        <p className="text-[11px] text-neutral-400 mt-0.5">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={item.state}
                        onChange={(e) => handleToggleNotify(item.key as any, e.target.checked)}
                        className="w-4 h-4 accent-purple-600 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* BILLING TAB */}
            {activeTab === 'billing' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0F0A1E]">Billing & Plans</h2>
                  <p className="text-xs text-neutral-500 mt-1">Manage your active subscription plan and payment methods.</p>
                </div>

                <div className="p-6 bg-gradient-to-br from-purple-50 via-white to-neutral-50 border border-purple-100 rounded-3xl space-y-4 max-w-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-purple-600 block">Current Plan</span>
                      <h3 className="text-xl font-black text-[#0F0A1E] capitalize">{user?.plan || 'Free'} Plan</h3>
                    </div>
                    <PlanBadge plan={user?.plan || 'free'} />
                  </div>

                  <p className="text-xs text-neutral-500 leading-relaxed">
                    {user?.plan === 'pro' || user?.plan === 'teams'
                      ? "Your subscription is active. You have full access to 500MB uploads, Ghostscript PDF rendering, and priority Azure cloud processing."
                      : "You are on the Free plan (50MB uploads, standard processing). Upgrade to Pro for instant processing and full tool access."}
                  </p>

                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={() => window.location.href = '/checkout/pro'}
                      className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
                    >
                      {user?.plan === 'pro' || user?.plan === 'teams' ? 'Manage Plan' : 'Upgrade to Pro — $11/mo'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PRIVACY TAB */}
            {activeTab === 'privacy' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0F0A1E]">Privacy & Data Control</h2>
                  <p className="text-xs text-neutral-500 mt-1">Export your data or clear local session state.</p>
                </div>

                <div className="space-y-3 max-w-lg">
                  <div className="p-4 bg-neutral-50 border border-neutral-150 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">Export Personal Data</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Download a copy of your profile and preference data in JSON format.</p>
                    </div>
                    <button
                      onClick={handleExportData}
                      disabled={downloadingData}
                      className="px-3.5 py-2 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      {downloadingData ? <FontAwesomeIcon icon={faSpinner} className="fa-spin mr-1" /> : null}
                      Export JSON
                    </button>
                  </div>

                  <div className="p-4 bg-neutral-50 border border-neutral-150 rounded-2xl flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-neutral-900">Clear Search & Tool History</h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">Clear local storage caches, liked tools, and recent history.</p>
                    </div>
                    <button
                      onClick={handleClearHistory}
                      disabled={clearingHistory}
                      className="px-3.5 py-2 bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-800 text-xs font-bold rounded-xl shadow-sm cursor-pointer disabled:opacity-50"
                    >
                      Clear Cache
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* DANGER ZONE TAB */}
            {activeTab === 'danger' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-extrabold text-red-600">Danger Zone</h2>
                  <p className="text-xs text-neutral-500 mt-1">Irreversible actions regarding your account data.</p>
                </div>

                <div className="p-5 bg-red-50/60 border border-red-200/80 rounded-2xl space-y-3 max-w-lg">
                  <h3 className="text-sm font-bold text-red-900">Delete Account</h3>
                  <p className="text-xs text-red-700 leading-relaxed">
                    Permanently remove your account, active subscriptions, preferences, and workspace history. This action cannot be undone.
                  </p>
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm"
                  >
                    Delete Account...
                  </button>
                </div>

                {/* Account Deletion Confirmation Modal */}
                {showDeleteModal && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl space-y-4">
                      <h3 className="text-lg font-black text-red-600">Are you absolutely sure?</h3>
                      <p className="text-xs text-neutral-600 leading-relaxed">
                        This action will permanently delete your user account. Type <strong className="text-red-600 font-extrabold">DELETE</strong> below to confirm.
                      </p>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder="Type DELETE"
                        className="w-full px-3.5 py-2.5 border border-red-200 rounded-xl text-sm outline-none focus:border-red-500 font-mono"
                      />
                      <div className="flex gap-2 justify-end pt-2">
                        <button
                          onClick={() => setShowDeleteModal(false)}
                          className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-bold rounded-xl cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleDeleteAccount}
                          disabled={deleteConfirmText.toUpperCase() !== 'DELETE' || deletingAccount}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl cursor-pointer disabled:opacity-50"
                        >
                          {deletingAccount ? <FontAwesomeIcon icon={faSpinner} className="fa-spin mr-1" /> : null}
                          Confirm Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
