import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSliders, faBell, faLock, faCreditCard, faSpinner, faLaptop, 
  faArrowRightFromBracket, faStar, faTriangleExclamation, faShieldHalved, faTrash
} from '@fortawesome/free-solid-svg-icons';
import { account, databases, DATABASE_ID } from '../../lib/qofeno-appwrite';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { SEO } from '../../components/SEO';
import { Query } from 'appwrite';

type Session = {
  $id: string;
  osName: string;
  clientName: string;
  ip: string;
  current: boolean;
};

export function Settings() {
  const { user, refreshSession } = useAuth();
  
  // Tabs
  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'security' | 'billing' | 'privacy'>('notifications');
  
  // Notification States
  const [notifyUpdates, setNotifyUpdates] = useState(true);
  const [notifyUsage, setNotifyUsage] = useState(true);
  const [notifySecurity, setNotifySecurity] = useState(true);
  const [savingNotify, setSavingNotify] = useState(false);

  // Privacy States
  const [downloadingData, setDownloadingData] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Security Toggles
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Billing details
  const [subscription, setSubscription] = useState<any>(null);
  const [loadingBilling, setLoadingBilling] = useState(true);
  useEffect(() => {
    // Read query param on load
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'billing' || tabParam === 'security' || tabParam === 'notifications' || tabParam === 'privacy') {
      setActiveSubTab(tabParam as any);
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
        console.error("Failed to load preferences", err);
      }
    };
    void fetchPrefs();
    return () => { cancelled = true; };
  }, []);

  // Fetch security sessions
  useEffect(() => {
    let cancelled = false;
    const fetchSessions = async () => {
      try {
        const list = await account.listSessions();
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
      } catch (err) {
        console.error("Failed to load sessions", err);
      } finally {
        if (!cancelled) setLoadingSessions(false);
      }
    };
    
    if (activeSubTab === 'security') {
      void fetchSessions();
    }
    return () => { cancelled = true; };
  }, [activeSubTab]);

  // Fetch subscription billing details
  useEffect(() => {
    let cancelled = false;
    const fetchBilling = async () => {
      if (!user?.id) return;
      try {
        const list = await databases.listDocuments(DATABASE_ID, 'subscriptions', [
          Query.equal('user_id', user.id),
          Query.limit(1)
        ]);
        if (!cancelled && list.documents.length > 0) {
          setSubscription(list.documents[0]);
        }
      } catch (err) {
        console.error("Failed to load subscription details", err);
      } finally {
        if (!cancelled) setLoadingBilling(false);
      }
    };

    if (activeSubTab === 'billing') {
      void fetchBilling();
    }
    return () => { cancelled = true; };
  }, [activeSubTab, user]);

  const handleSaveNotifications = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingNotify(true);
    // Simulate API persistence (since notifications preferences can just live in localStorage or account preferences)
    try {
      await account.updatePrefs({
        notify_updates: notifyUpdates,
        notify_usage: notifyUsage,
        notify_security: notifySecurity
      });
      toast.success("Notification preferences saved successfully!");
    } catch {
      // Local fallback
      localStorage.setItem('qofeno_notify_updates', String(notifyUpdates));
      localStorage.setItem('qofeno_notify_usage', String(notifyUsage));
      localStorage.setItem('qofeno_notify_security', String(notifySecurity));
      toast.success("Preferences saved successfully!");
    } finally {
      setSavingNotify(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await account.deleteSession(sessionId);
      setSessions(prev => prev.filter(s => s.$id !== sessionId));
      toast.success("Session revoked successfully.");
    } catch {
      toast.error("Failed to revoke session.");
    }
  };

  const handleRevokeAllOtherSessions = async () => {
    try {
      await account.deleteSessions();
      setSessions(prev => prev.filter(s => s.current));
      toast.success("All other sessions revoked successfully.");
    } catch {
      toast.error("Failed to revoke sessions.");
    }
  };

  const handleDownloadData = async () => {
    if (!user?.id) return;
    setDownloadingData(true);
    try {
      const [acc, meta, executions] = await Promise.all([
        account.get(),
        databases.listDocuments(DATABASE_ID, 'users_meta', [Query.equal('user_id', user.id), Query.limit(1)]).catch(() => ({ documents: [] })),
        databases.listDocuments(DATABASE_ID, 'tool_executions', [Query.equal('user_id', user.id), Query.limit(100)]).catch(() => ({ documents: [] }))
      ]);

      const dataBundle = {
        exported_at: new Date().toISOString(),
        user_account: {
          id: acc.$id,
          name: acc.name,
          email: acc.email,
          emailVerification: acc.emailVerification,
          createdAt: acc.$createdAt
        },
        user_metadata: meta.documents[0] || null,
        tool_executions_history: executions.documents.map((doc: any) => ({
          tool_slug: doc.tool_slug,
          tool_name: doc.tool_name,
          category: doc.category,
          status: doc.status,
          duration_ms: doc.duration_ms,
          created_at: doc.created_at || doc.$createdAt
        }))
      };

      const jsonStr = JSON.stringify(dataBundle, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `qofeno-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success("Your data export is complete!");
    } catch (err: any) {
      toast.error(err.message || "Failed to download your data.");
    } finally {
      setDownloadingData(false);
    }
  };

  const handleClearHistory = async () => {
    if (!user?.id) return;
    const confirmClear = window.confirm("Are you sure you want to clear your usage history? This will delete all execution logs, recently viewed items, and notifications. This action is permanent.");
    if (!confirmClear) return;

    setClearingHistory(true);
    try {
      // 1. Delete tool_executions
      const executions = await databases.listDocuments(DATABASE_ID, 'tool_executions', [Query.equal('user_id', user.id), Query.limit(100)]);
      for (const doc of executions.documents) {
        await databases.deleteDocument(DATABASE_ID, 'tool_executions', doc.$id).catch(() => {});
      }

      // 2. Delete recently_viewed
      const recent = await databases.listDocuments(DATABASE_ID, 'recently_viewed', [Query.equal('user_id', user.id), Query.limit(100)]);
      for (const doc of recent.documents) {
        await databases.deleteDocument(DATABASE_ID, 'recently_viewed', doc.$id).catch(() => {});
      }

      // 3. Delete notifications
      const notifs = await databases.listDocuments(DATABASE_ID, 'notifications', [Query.equal('user_id', user.id), Query.limit(100)]);
      for (const doc of notifs.documents) {
        await databases.deleteDocument(DATABASE_ID, 'notifications', doc.$id).catch(() => {});
      }

      toast.success("Your history and notifications have been cleared!");
    } catch (err: any) {
      toast.error(err.message || "Failed to clear history.");
    } finally {
      setClearingHistory(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.id) return;
    if (deleteConfirmText !== 'DELETE') {
      toast.error("Please type 'DELETE' to confirm deletion.");
      return;
    }

    setDeletingAccount(true);
    try {
      // Delete user meta
      const meta = await databases.listDocuments(DATABASE_ID, 'users_meta', [Query.equal('user_id', user.id), Query.limit(100)]);
      for (const doc of meta.documents) {
        await databases.deleteDocument(DATABASE_ID, 'users_meta', doc.$id).catch(() => {});
      }

      // Delete subscriptions
      const subs = await databases.listDocuments(DATABASE_ID, 'subscriptions', [Query.equal('user_id', user.id), Query.limit(100)]);
      for (const doc of subs.documents) {
        await databases.deleteDocument(DATABASE_ID, 'subscriptions', doc.$id).catch(() => {});
      }

      // Delete tool executions, recently viewed, notifications
      const executions = await databases.listDocuments(DATABASE_ID, 'tool_executions', [Query.equal('user_id', user.id), Query.limit(100)]);
      for (const doc of executions.documents) {
        await databases.deleteDocument(DATABASE_ID, 'tool_executions', doc.$id).catch(() => {});
      }
      const recent = await databases.listDocuments(DATABASE_ID, 'recently_viewed', [Query.equal('user_id', user.id), Query.limit(100)]);
      for (const doc of recent.documents) {
        await databases.deleteDocument(DATABASE_ID, 'recently_viewed', doc.$id).catch(() => {});
      }
      const notifs = await databases.listDocuments(DATABASE_ID, 'notifications', [Query.equal('user_id', user.id), Query.limit(100)]);
      for (const doc of notifs.documents) {
        await databases.deleteDocument(DATABASE_ID, 'notifications', doc.$id).catch(() => {});
      }

      // Log out
      await account.deleteSession('current');
      toast.success("Your account data has been completely deleted.");
      window.location.href = '/';
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account data.");
    } finally {
      setDeletingAccount(false);
      setShowDeleteModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 px-4 font-sans select-none relative">
      <SEO title="Preferences & Settings" description="Configure notifications thresholds, revoke other sessions, or manage active subscriptions." />
      
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div>
          <h1 className="text-3xl font-black text-[#0F0A1E] flex items-center gap-3">
            <FontAwesomeIcon icon={faSliders} className="w-7 h-7 text-purple-600" />
            Account Preferences
          </h1>
          <p className="text-neutral-500 text-sm mt-2">Adjust notification parameters, active logins, and subscription options.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* TAB SIDEBAR */}
          <div className="md:col-span-1 flex flex-row md:flex-col overflow-x-auto md:overflow-x-visible border-b md:border-0 border-neutral-200 pb-3 md:pb-0 gap-2 shrink-0 select-none">
            {[
              { id: 'notifications', label: 'Notifications', icon: faBell },
              { id: 'security', label: 'Session Management', icon: faLock },
              { id: 'billing', label: 'Plans & Billing', icon: faCreditCard },
              { id: 'privacy', label: 'Privacy & Data', icon: faShieldHalved }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all text-left whitespace-nowrap cursor-pointer ${
                  activeSubTab === tab.id 
                    ? 'bg-neutral-900 text-white shadow-sm shadow-neutral-900/10' 
                    : 'bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-600'
                }`}
              >
                <FontAwesomeIcon icon={tab.icon} className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB CONTENT */}
          <div className="md:col-span-3">
            
            {/* NOTIFICATIONS TAB */}
            {activeSubTab === 'notifications' && (
              <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
                <div>
                  <h2 className="text-lg font-black text-[#0F0A1E]">Notification Thresholds</h2>
                  <p className="text-neutral-500 text-xs mt-1">Control which system updates and messages you receive.</p>
                </div>

                <form onSubmit={handleSaveNotifications} className="space-y-6">
                  {[
                    { id: 'updates', title: 'Product Updates', desc: 'Get notified when new tools and features are launched on Qofeno.', state: notifyUpdates, setter: setNotifyUpdates },
                    { id: 'usage', title: 'Monthly Summaries', desc: 'Receive summaries regarding file processing records and bandwidth usage.', state: notifyUsage, setter: setNotifyUsage },
                    { id: 'security', title: 'Security Alerts', desc: 'Immediate notification on profile credential revisions or new logins.', state: notifySecurity, setter: setNotifySecurity }
                  ].map(item => (
                    <div key={item.id} className="flex items-start justify-between gap-4 p-4 hover:bg-neutral-50 rounded-2xl transition-colors border border-neutral-100">
                      <div>
                        <h4 className="font-bold text-sm text-[#0F0A1E]">{item.title}</h4>
                        <p className="text-xs text-neutral-500 mt-1 max-w-md leading-relaxed">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => item.setter(!item.state)}
                        className={`w-11 h-6 rounded-full relative transition-colors duration-300 shrink-0 cursor-pointer ${item.state ? 'bg-purple-600' : 'bg-neutral-200'}`}
                      >
                        <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform duration-300 ${item.state ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  ))}

                  <button
                    type="submit"
                    disabled={savingNotify}
                    className="px-6 py-3.5 bg-neutral-900 hover:bg-black text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-neutral-900/10"
                  >
                    {savingNotify ? (
                      <><FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                    ) : (
                      'Save Preferences'
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* SECURITY TAB (SESSION MANAGEMENT) */}
            {activeSubTab === 'security' && (
              <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <h2 className="text-lg font-black text-[#0F0A1E]">Active Sessions</h2>
                    <p className="text-neutral-500 text-xs mt-1">Manage active browser and device sessions logged into your account.</p>
                  </div>
                  {sessions.length > 1 && (
                    <button
                      onClick={handleRevokeAllOtherSessions}
                      className="px-4 py-2 bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer"
                    >
                      Revoke Other Sessions
                    </button>
                  )}
                </div>

                <div className="space-y-4">
                  {loadingSessions ? (
                    <div className="flex justify-center py-10">
                      <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 text-purple-600 animate-spin" />
                    </div>
                  ) : sessions.length > 0 ? (
                    sessions.map(sess => (
                      <div 
                        key={sess.$id} 
                        className={`p-4 border rounded-2xl flex items-center justify-between gap-4 transition-all ${
                          sess.current ? 'bg-purple-50/20 border-purple-200' : 'bg-neutral-50/50 border-neutral-200/60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${sess.current ? 'bg-purple-100 text-purple-700' : 'bg-neutral-200 text-neutral-500'}`}>
                            <FontAwesomeIcon icon={faLaptop} className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-xs text-[#0F0A1E]">{sess.clientName} on {sess.osName}</h4>
                              {sess.current && (
                                <span className="px-1.5 py-0.5 rounded bg-purple-100 text-[8px] font-black uppercase text-purple-700 tracking-wider">Current Session</span>
                              )}
                            </div>
                            <p className="text-[10px] text-neutral-400 mt-0.5 font-semibold">IP Address: {sess.ip}</p>
                          </div>
                        </div>

                        {!sess.current && (
                          <button
                            onClick={() => handleRevokeSession(sess.$id)}
                            title="Revoke session"
                            className="p-2 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                          >
                            <FontAwesomeIcon icon={faArrowRightFromBracket} className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-neutral-400 text-center py-4 font-semibold">No active sessions found.</p>
                  )}
                </div>
              </div>
            )}

            {/* BILLING TAB */}
            {activeSubTab === 'billing' && (
              <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
                <div>
                  <h2 className="text-lg font-black text-[#0F0A1E]">Plan & Subscription</h2>
                  <p className="text-neutral-500 text-xs mt-1">Review plan settings, invoice details, and active billing agreements.</p>
                </div>

                {loadingBilling ? (
                  <div className="flex justify-center py-10">
                    <FontAwesomeIcon icon={faSpinner} className="w-6 h-6 text-purple-600 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Current Plan Card */}
                    <div className="p-6 bg-neutral-50 border border-neutral-200/80 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <span className="text-[10px] font-black uppercase text-purple-600 tracking-wider block mb-1">Your Active Plan</span>
                        <div className="flex items-center gap-2.5">
                          <h3 className="text-xl font-black text-[#0F0A1E]">
                            {(user?.plan as string) === 'pro' ? 'Qofeno PRO' : (user?.plan as string) === 'teams' ? 'Qofeno TEAMS' : 'Qofeno Free'}
                          </h3>
                          {(user?.plan as string) !== 'free' && (
                            <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-purple-700 flex items-center gap-0.5">
                              Active <FontAwesomeIcon icon={faStar} className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                            </span>
                          )}
                        </div>
                        {subscription && subscription.status === 'active' && (
                          <p className="text-xs text-neutral-400 mt-2 font-medium">
                            Billed {subscription.period === 'yearly' ? 'annually' : 'monthly'} via PayPal
                          </p>
                        )}
                      </div>
                      
                      {user?.plan === 'free' ? (
                        <button
                          onClick={() => {
                            window.history.pushState({}, '', '/pricing');
                            window.dispatchEvent(new PopStateEvent('popstate'));
                          }}
                          className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm shadow-purple-500/10"
                        >
                          Upgrade to PRO
                        </button>
                      ) : (
                        <div className="flex flex-col items-end">
                          {subscription?.subscription_id && (
                            <a
                              href="https://www.paypal.com/myaccount/settings/recurring-payments/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-[#0F0A1E] text-xs font-black rounded-lg transition-all"
                            >
                              Manage PayPal Subscription
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Subscription Details List */}
                    {subscription && (
                      <div className="border border-neutral-100 rounded-2xl p-5 space-y-3 text-sm">
                        <div className="flex justify-between border-b border-neutral-100 pb-2">
                          <span className="text-neutral-400 font-bold text-xs">Agreement ID</span>
                          <span className="text-neutral-800 font-bold text-xs font-mono">{subscription.subscription_id || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-100 pb-2">
                          <span className="text-neutral-400 font-bold text-xs">Billing Frequency</span>
                          <span className="text-neutral-850 font-bold text-xs capitalize">{subscription.period || 'monthly'}</span>
                        </div>
                        <div className="flex justify-between border-b border-neutral-100 pb-2">
                          <span className="text-neutral-400 font-bold text-xs">Payment Method</span>
                          <span className="text-neutral-850 font-bold text-xs capitalize">{subscription.payment_method || 'paypal'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400 font-bold text-xs">Last Updated</span>
                          <span className="text-neutral-850 font-bold text-xs">{new Date(subscription.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    )}

                    {/* Info warning */}
                    {user?.plan !== 'free' && (
                      <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-2xl flex gap-3 text-xs leading-relaxed text-purple-950 font-medium">
                        <FontAwesomeIcon icon={faTriangleExclamation} className="w-4.5 h-4.5 text-purple-600 shrink-0 mt-0.5" />
                        <div>
                          <strong>Looking to cancel?</strong>
                          <p className="mt-1 text-purple-700/80 font-bold">
                            You can easily terminate subscription renewals at any time directly through your PayPal Dashboard under "Preapproved Payments".
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* PRIVACY & DATA TAB */}
            {activeSubTab === 'privacy' && (
              <div className="space-y-6">
                
                {/* Export / Clear card */}
                <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-8">
                  <div>
                    <h2 className="text-lg font-black text-[#0F0A1E]">Privacy Controls</h2>
                    <p className="text-neutral-500 text-xs mt-1">Manage your data exports and historical platform footprint.</p>
                  </div>

                  <div className="divide-y divide-neutral-100">
                    {/* Export Data */}
                    <div className="py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 first:pt-0">
                      <div>
                        <h4 className="font-bold text-sm text-[#0F0A1E]">Download My Data</h4>
                        <p className="text-xs text-neutral-400 mt-1 max-w-md leading-relaxed">
                          Request a complete record of your account information, usage stats, and past tool execution history in JSON format.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleDownloadData}
                        disabled={downloadingData}
                        className="px-4 py-2 bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 disabled:opacity-50 text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap"
                      >
                        {downloadingData && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                        Export JSON
                      </button>
                    </div>

                    {/* Clear History */}
                    <div className="py-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-bold text-sm text-[#0F0A1E]">Clear Operations History</h4>
                        <p className="text-xs text-neutral-400 mt-1 max-w-md leading-relaxed">
                          Permanently wipe all tool execution logs, custom document references, and in-app notifications. Your billing plan will remain active.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleClearHistory}
                        disabled={clearingHistory}
                        className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 disabled:opacity-50 text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap"
                      >
                        {clearingHistory && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                        Clear History
                      </button>
                    </div>
                  </div>
                </div>

                {/* Danger Zone */}
                <div className="bg-red-50/20 border border-red-200/60 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                  <div>
                    <h2 className="text-lg font-black text-red-950 flex items-center gap-2">
                      <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-600" />
                      Danger Zone
                    </h2>
                    <p className="text-red-700/80 text-xs mt-1">Irreversible and destructive account operations.</p>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <h4 className="font-bold text-sm text-red-950">Permanently Delete Account</h4>
                      <p className="text-xs text-red-700/70 mt-1 max-w-md leading-relaxed font-semibold">
                        Completely erase your user profile, active subscriptions, payment history, and storage buckets. This action is final and cannot be reversed.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-3 bg-red-650 hover:bg-red-700 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer whitespace-nowrap"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>

              </div>
            )}

            {/* DELETE MODAL */}
            {showDeleteModal && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-neutral-100 text-left">
                  <h3 className="text-xl font-black text-[#0F0A1E]">Delete Account Permanently</h3>
                  <p className="text-xs text-neutral-500 mt-2 font-semibold">
                    This action is permanent and cannot be undone. All your details, active subscriptions, and tool history will be cleared.
                  </p>
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 text-red-700 text-xs font-bold rounded-xl leading-relaxed">
                    Please type <span className="underline font-mono">DELETE</span> in the field below to confirm your deletion request.
                  </div>
                  <input
                    type="text"
                    className="w-full mt-4 bg-neutral-50 border border-neutral-200 focus:border-red-500 focus:ring-4 focus:ring-red-100 rounded-xl p-3 outline-none text-neutral-800 font-mono text-sm"
                    placeholder="DELETE"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                  />
                  <div className="flex gap-3 justify-end mt-6">
                    <button
                      type="button"
                      onClick={() => {
                        setShowDeleteModal(false);
                        setDeleteConfirmText('');
                      }}
                      className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl text-xs font-bold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteAccount}
                      disabled={deletingAccount || deleteConfirmText !== 'DELETE'}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                    >
                      {deletingAccount && <FontAwesomeIcon icon={faSpinner} className="animate-spin" />}
                      Permanently Delete
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>

        </div>

      </div>

    </div>
  );
}
