import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSliders, faBell, faLock, faCreditCard, faSpinner, faLaptop, 
  faArrowRightFromBracket, faStar, faTriangleExclamation
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
  const [activeSubTab, setActiveSubTab] = useState<'notifications' | 'security' | 'billing'>('notifications');
  
  // Notification States
  const [notifyUpdates, setNotifyUpdates] = useState(true);
  const [notifyUsage, setNotifyUsage] = useState(true);
  const [notifySecurity, setNotifySecurity] = useState(true);
  const [savingNotify, setSavingNotify] = useState(false);

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
    if (tabParam === 'billing' || tabParam === 'security' || tabParam === 'notifications') {
      setActiveSubTab(tabParam as any);
    }
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
              { id: 'billing', label: 'Plans & Billing', icon: faCreditCard }
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
                            {user?.plan === 'pro' ? 'Qofeno PRO' : user?.plan === 'teams' ? 'Qofeno TEAMS' : 'Qofeno Free'}
                          </h3>
                          {user?.plan !== 'free' && (
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

          </div>

        </div>

      </div>

    </div>
  );
}
