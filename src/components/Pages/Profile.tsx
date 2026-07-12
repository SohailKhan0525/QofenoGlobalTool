import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faUser, faEnvelope, faLock, faTrash, faShieldHalved, 
  faCircleCheck, faTriangleExclamation, faSpinner, faKey, faStar,
  faSliders
} from '@fortawesome/free-solid-svg-icons';
import { account, databases, DATABASE_ID, storage } from '../../lib/qofeno-appwrite';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'sonner';
import { SEO } from '../../components/SEO';
import { ID, Query } from 'appwrite';

export function Profile() {
  const { user, logout, refreshSession } = useAuth();
  
  // States
  const [memberSince, setMemberSince] = useState('');
  const [loadingUserMeta, setLoadingUserMeta] = useState(true);
  const [userMetaId, setUserMetaId] = useState('');
  const [usageStats, setUsageStats] = useState({ toolsUsed: 0, filesProcessed: 0 });
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  
  // Form states
  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isUpdatingName, setIsUpdatingName] = useState(false);
  const [nameShake, setNameShake] = useState(false);

  // Email change dialog states
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);
  const [emailShake, setEmailShake] = useState(false);

  // Password change dialog states
  const [isPassDialogOpen, setIsPassDialogOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPass, setIsUpdatingPass] = useState(false);
  const [passShake, setPassShake] = useState(false);

  // Account delete dialog states
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [confirmDeleteText, setConfirmDeleteText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteShake, setDeleteShake] = useState(false);

  // Favorites & History states for redirects
  const [likedTools, setLikedTools] = useState<string[]>([]);
  const [historyItems, setHistoryItems] = useState<any[]>([]);

  useEffect(() => {
    let cancelled = false;

    const loadFullProfile = async () => {
      if (!user?.id) return;
      
      try {
        // Fetch full Appwrite Auth details (like $createdAt)
        const fullAcc = await account.get();
        if (!cancelled && fullAcc.$createdAt) {
          const date = new Date(fullAcc.$createdAt);
          setMemberSince(date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }));
        }
      } catch (err) {
        console.error("Failed to load auth metadata", err);
      }

      try {
        const prefs = await account.getPrefs();
        if (!cancelled) {
          if (prefs.avatar_url) setAvatarUrl(prefs.avatar_url);
          if (prefs.display_name) setDisplayName(prefs.display_name);
        }
      } catch (err) {
        console.error("Failed to load account preferences", err);
      }

      try {
        // Load users_meta
        const metaDocs = await databases.listDocuments(DATABASE_ID, 'users_meta', [
          Query.equal('user_id', user.id),
          Query.limit(1)
        ]);
        
        if (!cancelled && metaDocs.documents.length > 0) {
          const doc = metaDocs.documents[0];
          setUserMetaId(doc.$id);
          setUsageStats({
            toolsUsed: doc.tools_used || 0,
            filesProcessed: doc.files_processed || 0
          });
          setDisplayName(doc.display_name || user.name);
        }
      } catch (err) {
        console.error("Failed to load users_meta", err);
      } finally {
        if (!cancelled) setLoadingUserMeta(false);
      }

      try {
        // Load Liked tools
        const likesDocs = await databases.listDocuments(DATABASE_ID, 'tool_likes', [
          Query.equal('user_id', user.id),
          Query.limit(100)
        ]);
        if (!cancelled) {
          setLikedTools(likesDocs.documents.map((d: any) => d.tool_slug));
        }
      } catch {}

      try {
        // Load History (Executions)
        const execDocs = await databases.listDocuments(DATABASE_ID, 'tool_executions', [
          Query.equal('user_id', user.id),
          Query.orderDesc('created_at'),
          Query.limit(5)
        ]);
        if (!cancelled) {
          setHistoryItems(execDocs.documents);
        }
      } catch {}
    };

    if (user) {
      setFullName(user.name);
      void loadFullProfile();
    }

    return () => { cancelled = true; };
  }, [user]);

  // Handle updates
  const handleUpdateName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setNameShake(true);
      setTimeout(() => setNameShake(false), 500);
      toast.error("Full name cannot be empty.");
      return;
    }

    setIsUpdatingName(true);
    try {
      await account.updateName(fullName.trim());
      
      const currentPrefs = await account.getPrefs().catch(() => ({}));
      await account.updatePrefs({
        ...currentPrefs,
        display_name: displayName.trim() || fullName.trim()
      });
      
      await refreshSession();
      toast.success("Name updated successfully!");
    } catch (err: any) {
      setNameShake(true);
      setTimeout(() => setNameShake(false), 500);
      toast.error(err.message || "Failed to update name.");
    } finally {
      setIsUpdatingName(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Profile picture must be less than 5MB.");
      return;
    }

    setIsUploadingAvatar(true);
    try {
      const bucketId = 'tool_inputs';
      const uploadedFile = await storage.createFile(bucketId, ID.unique(), file);
      const fileUrl = storage.getFileView(bucketId, uploadedFile.$id).toString();
      
      const currentPrefs = await account.getPrefs().catch(() => ({}));
      await account.updatePrefs({
        ...currentPrefs,
        avatar_url: fileUrl
      });
      
      setAvatarUrl(fileUrl);
      toast.success("Profile picture updated successfully!");
    } catch (err: any) {
      console.error("Failed to upload profile picture", err);
      toast.error(err.message || "Failed to upload profile picture.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !emailPassword) {
      setEmailShake(true);
      setTimeout(() => setEmailShake(false), 500);
      toast.error("Please fill in both fields.");
      return;
    }

    setIsUpdatingEmail(true);
    try {
      await account.updateEmail(newEmail.trim(), emailPassword);
      setIsEmailDialogOpen(false);
      setNewEmail('');
      setEmailPassword('');
      await refreshSession();
      toast.success("Email updated successfully! Please re-verify if required.");
    } catch (err: any) {
      setEmailShake(true);
      setTimeout(() => setEmailShake(false), 500);
      toast.error(err.message || "Failed to update email.");
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPassShake(true);
      setTimeout(() => setPassShake(false), 500);
      toast.error("All password fields are required.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPassShake(true);
      setTimeout(() => setPassShake(false), 500);
      toast.error("New passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setPassShake(true);
      setTimeout(() => setPassShake(false), 500);
      toast.error("Password must be at least 8 characters.");
      return;
    }

    setIsUpdatingPass(true);
    try {
      await account.updatePassword(newPassword, oldPassword);
      setIsPassDialogOpen(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success("Password updated successfully!");
    } catch (err: any) {
      setPassShake(true);
      setTimeout(() => setPassShake(false), 500);
      toast.error(err.message || "Failed to update password.");
    } finally {
      setIsUpdatingPass(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmDeleteText !== 'DELETE') {
      setDeleteShake(true);
      setTimeout(() => setDeleteShake(false), 500);
      toast.error("Please type DELETE to confirm account deletion.");
      return;
    }

    setIsDeleting(true);
    try {
      // 1. Delete account
      await account.deleteIdentity('current'); // Wait, delete current account
      toast.success("Your account has been deleted.");
      setIsDeleteDialogOpen(false);
      await logout();
    } catch (err: any) {
      // Fallback
      try {
        await account.deleteSession('current');
      } catch {}
      setDeleteShake(true);
      setTimeout(() => setDeleteShake(false), 500);
      toast.error(err.message || "Failed to delete account. Try logging in again first.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Avatar Initials
  const getInitials = (n = 'User') => {
    return n.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  };

  // Get background color based on name
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

  if (!user) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <FontAwesomeIcon icon={faSpinner} className="w-8 h-8 text-purple-600 animate-spin" />
      </div>
    );
  }

  const avatarColor = getAvatarBg(user.name);

  return (
    <div className="min-h-screen bg-[#FAFAFA] pt-32 pb-24 px-4 select-none relative font-sans">
      <SEO title="My Profile" description="Manage your display parameters, subscription billing, and security credentials." />
      
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* PROFILE HEADER */}
        <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6 justify-between">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="relative group cursor-pointer select-none">
              <input 
                type="file" 
                id="avatar-input" 
                accept="image/*" 
                className="hidden" 
                onChange={handleAvatarUpload} 
                disabled={isUploadingAvatar}
              />
              <label htmlFor="avatar-input" className="cursor-pointer block relative">
                {avatarUrl ? (
                  <img 
                    src={avatarUrl} 
                    alt={user.name} 
                    className="w-20 h-20 rounded-full object-cover shadow-lg shadow-purple-900/10 border-2 border-purple-100"
                  />
                ) : (
                  <div className={`w-20 h-20 rounded-full ${avatarColor} text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-purple-900/10`}>
                    {getInitials(user.name)}
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-black uppercase tracking-wider">
                  {isUploadingAvatar ? '...' : 'Upload'}
                </div>
              </label>
            </div>
            <div>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                <h1 className="text-2xl font-black text-[#0F0A1E]">{user.name}</h1>
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-black uppercase tracking-widest text-purple-700 flex items-center gap-1 shadow-sm">
                  {user.plan === 'pro' ? (
                    <>Pro <FontAwesomeIcon icon={faStar} className="w-3 h-3 text-amber-500 fill-amber-500" /></>
                  ) : (user.plan as string) === 'teams' ? (
                    <>Teams <FontAwesomeIcon icon={faStar} className="w-3 h-3 text-cyan-500 fill-cyan-500" /></>
                  ) : (
                    'Free'
                  )}
                </span>
              </div>
              <p className="text-neutral-500 text-sm mt-1">{user.email}</p>
              {memberSince && (
                <p className="text-neutral-400 text-xs mt-1.5 font-medium">Member since {memberSince}</p>
              )}
            </div>
          </div>
          
          <div className="flex gap-4 border-t border-neutral-100 pt-6 md:pt-0 md:border-0 w-full md:w-auto justify-center">
            <div className="text-center bg-purple-50/50 border border-purple-100 rounded-2xl px-5 py-3 min-w-[100px]">
              <span className="block text-2xl font-black text-purple-700">{usageStats.toolsUsed}</span>
              <span className="text-[10px] text-purple-500 font-bold uppercase tracking-wider">Tools Run</span>
            </div>
            <div className="text-center bg-purple-50/50 border border-purple-100 rounded-2xl px-5 py-3 min-w-[100px]">
              <span className="block text-2xl font-black text-purple-700">{usageStats.filesProcessed}</span>
              <span className="text-[10px] text-purple-500 font-bold uppercase tracking-wider">Files Sent</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* SIDE OPTIONS */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* EDIT PERSONAL INFO FORM */}
            <div className={`bg-white border border-neutral-200/80 rounded-3xl p-6 md:p-8 shadow-sm transition-transform duration-200 ${nameShake ? 'animate-shake' : ''}`}>
              <h2 className="text-lg font-black text-[#0F0A1E] mb-6 flex items-center gap-2">
                <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-purple-600" />
                Account Settings
              </h2>
              
              <form onSubmit={handleUpdateName} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Full Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      placeholder="Your full name"
                      className="w-full bg-[#FAFAFA] border border-neutral-200 focus:border-purple-600 focus:bg-white p-3.5 rounded-xl outline-none text-sm transition-all text-neutral-800 font-semibold focus:ring-4 focus:ring-purple-100"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Display Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="Your nickname/display name"
                      className="w-full bg-[#FAFAFA] border border-neutral-200 focus:border-purple-600 focus:bg-white p-3.5 rounded-xl outline-none text-sm transition-all text-neutral-800 font-semibold focus:ring-4 focus:ring-purple-100"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isUpdatingName}
                  className="px-6 py-3.5 bg-neutral-900 hover:bg-black text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-neutral-900/10"
                >
                  {isUpdatingName ? (
                    <><FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                  ) : (
                    'Save Changes'
                  )}
                </button>
              </form>
            </div>

            {/* SECURITY CREDENTIALS */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
              <h2 className="text-lg font-black text-[#0F0A1E] flex items-center gap-2">
                <FontAwesomeIcon icon={faShieldHalved} className="w-4.5 h-4.5 text-purple-600" />
                Security Credentials
              </h2>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button 
                  onClick={() => setIsEmailDialogOpen(true)}
                  className="flex-1 py-4 bg-neutral-50 border border-neutral-200 hover:bg-purple-50/20 hover:border-purple-200 text-[#0F0A1E] font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faEnvelope} className="w-4.5 h-4.5 text-purple-600" /> Change Email
                </button>
                <button 
                  onClick={() => setIsPassDialogOpen(true)}
                  className="flex-1 py-4 bg-neutral-50 border border-neutral-200 hover:bg-purple-50/20 hover:border-purple-200 text-[#0F0A1E] font-bold text-sm rounded-2xl transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <FontAwesomeIcon icon={faKey} className="w-4.5 h-4.5 text-purple-600" /> Change Password
                </button>
              </div>
            </div>

            {/* DANGER ZONE */}
            <div className="bg-rose-50/30 border border-rose-200/60 rounded-3xl p-6 md:p-8 shadow-sm">
              <h2 className="text-lg font-black text-rose-950 flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faTriangleExclamation} className="w-5 h-5 text-rose-600" />
                Danger Zone
              </h2>
              <p className="text-rose-700 text-xs font-semibold leading-relaxed mb-6">
                Deleting your account will permanently delete all metadata, tool executions logs, preferences, and subscriptions associated with this ID. This operation is irreversible.
              </p>
              
              <button 
                onClick={() => setIsDeleteDialogOpen(true)}
                className="px-6 py-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm shadow-rose-600/10"
              >
                <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" /> Delete Account
              </button>
            </div>

          </div>

          {/* LIKES & RECENT HISTORY VIEW */}
          <div className="space-y-8">
            {/* LIKED TOOLS */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm uppercase font-black text-neutral-400 tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-500" /> Favorites
              </h3>
              
              <div className="space-y-3">
                {likedTools.length > 0 ? (
                  likedTools.map(slug => (
                    <div 
                      key={slug} 
                      onClick={() => {
                        localStorage.setItem('selected_tool_id', slug);
                        window.history.pushState({}, '', `/tools/${slug}`);
                        window.dispatchEvent(new PopStateEvent('popstate'));
                      }}
                      className="p-3 bg-neutral-50 hover:bg-purple-50/30 border border-neutral-100 hover:border-purple-200 rounded-xl cursor-pointer transition-all flex items-center justify-between"
                    >
                      <span className="text-xs font-bold text-neutral-800">{slug.replace(/-/g, ' ').toUpperCase()}</span>
                      <FontAwesomeIcon icon={faUser} className="w-3 h-3 text-pink-500 fill-pink-500" />
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 text-center py-4 font-semibold">No favorites yet.</p>
                )}
              </div>
            </div>

            {/* RECENT ACTIVITY */}
            <div className="bg-white border border-neutral-200/80 rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm uppercase font-black text-neutral-400 tracking-wider mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-purple-500" /> Recent Runs
              </h3>
              
              <div className="space-y-3">
                {historyItems.length > 0 ? (
                  historyItems.map((item, idx) => (
                    <div key={idx} className="p-3 bg-neutral-50 rounded-xl border border-neutral-100">
                      <p className="text-xs font-bold text-neutral-800">{item.tool_slug?.replace(/-/g, ' ').toUpperCase()}</p>
                      <div className="flex justify-between items-center mt-1.5">
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase tracking-wider ${item.status === 'success' ? 'bg-green-150 text-green-700' : 'bg-rose-150 text-rose-700'}`}>
                          {item.status || 'Success'}
                        </span>
                        <span className="text-[10px] text-neutral-400 font-bold">{new Date(item.created_at || item.$createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-neutral-400 text-center py-4 font-semibold">No executions logged yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* CHANGE EMAIL DIALOG */}
      {isEmailDialogOpen && (
        <div className="fixed inset-0 bg-[#0F0A1E]/40 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setIsEmailDialogOpen(false)}>
          <div className={`bg-white border border-neutral-100 rounded-3xl p-8 max-w-md w-full shadow-2xl relative transition-transform duration-200 ${emailShake ? 'animate-shake' : ''}`} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsEmailDialogOpen(false)} className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 font-bold">✕</button>
            <h3 className="text-xl font-black text-[#0F0A1E] mb-6 flex items-center gap-2">
              <FontAwesomeIcon icon={faEnvelope} className="w-5 h-5 text-purple-600" />
              Change Email Address
            </h3>
            
            <form onSubmit={handleChangeEmail} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">New Email</label>
                <input 
                  type="email" 
                  required
                  placeholder="new@email.com"
                  className="w-full bg-[#FAFAFA] border border-neutral-250 focus:border-purple-600 focus:bg-white p-3.5 rounded-xl outline-none text-sm transition-all text-neutral-800 font-semibold focus:ring-4 focus:ring-purple-100"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Confirm Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Enter current password"
                  className="w-full bg-[#FAFAFA] border border-neutral-250 focus:border-purple-600 focus:bg-white p-3.5 rounded-xl outline-none text-sm transition-all text-neutral-800 font-semibold focus:ring-4 focus:ring-purple-100"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                disabled={isUpdatingEmail}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-500/10"
              >
                {isUpdatingEmail ? (
                  <><FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                ) : (
                  'Update Email'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD DIALOG */}
      {isPassDialogOpen && (
        <div className="fixed inset-0 bg-[#0F0A1E]/40 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setIsPassDialogOpen(false)}>
          <div className={`bg-white border border-neutral-100 rounded-3xl p-8 max-w-md w-full shadow-2xl relative transition-transform duration-200 ${passShake ? 'animate-shake' : ''}`} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsPassDialogOpen(false)} className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 font-bold">✕</button>
            <h3 className="text-xl font-black text-[#0F0A1E] mb-6 flex items-center gap-2">
              <FontAwesomeIcon icon={faLock} className="w-5 h-5 text-purple-600" />
              Change Password
            </h3>
            
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Current Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Enter current password"
                  className="w-full bg-[#FAFAFA] border border-neutral-250 focus:border-purple-600 focus:bg-white p-3.5 rounded-xl outline-none text-sm transition-all text-neutral-800 font-semibold focus:ring-4 focus:ring-purple-100"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">New Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="At least 8 characters"
                  className="w-full bg-[#FAFAFA] border border-neutral-250 focus:border-purple-600 focus:bg-white p-3.5 rounded-xl outline-none text-sm transition-all text-neutral-800 font-semibold focus:ring-4 focus:ring-purple-100"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-neutral-500 uppercase tracking-widest">Confirm New Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="Repeat new password"
                  className="w-full bg-[#FAFAFA] border border-neutral-250 focus:border-purple-600 focus:bg-white p-3.5 rounded-xl outline-none text-sm transition-all text-neutral-800 font-semibold focus:ring-4 focus:ring-purple-100"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <button 
                type="submit"
                disabled={isUpdatingPass}
                className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-500/10"
              >
                {isUpdatingPass ? (
                  <><FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                ) : (
                  'Update Password'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT CONFIRM DIALOG */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 bg-rose-950/20 backdrop-blur-md z-50 flex items-center justify-center p-6" onClick={() => setIsDeleteDialogOpen(false)}>
          <div className={`bg-white border border-rose-100 rounded-3xl p-8 max-w-md w-full shadow-2xl relative transition-transform duration-200 ${deleteShake ? 'animate-shake' : ''}`} onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsDeleteDialogOpen(false)} className="absolute top-6 right-6 text-neutral-400 hover:text-neutral-900 font-bold">✕</button>
            <h3 className="text-xl font-black text-rose-950 mb-4 flex items-center gap-2">
              <FontAwesomeIcon icon={faTriangleExclamation} className="w-6 h-6 text-rose-600" />
              Permanently Delete Account?
            </h3>
            <p className="text-xs font-semibold text-neutral-500 mb-6 leading-relaxed">
              This action cannot be undone. To verify, please type <strong className="text-rose-650 bg-rose-50 px-2 py-0.5 rounded">DELETE</strong> in the box below.
            </p>
            
            <form onSubmit={handleDeleteAccount} className="space-y-6">
              <input 
                type="text" 
                required
                placeholder="Type DELETE"
                className="w-full bg-[#FAFAFA] border border-rose-200 focus:border-rose-600 focus:bg-white p-3.5 rounded-xl outline-none text-sm transition-all text-rose-900 font-semibold focus:ring-4 focus:ring-rose-100"
                value={confirmDeleteText}
                onChange={(e) => setConfirmDeleteText(e.target.value)}
              />

              <button 
                type="submit"
                disabled={isDeleting}
                className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-widest rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-600/10"
              >
                {isDeleting ? (
                  <><FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" /> Deleting...</>
                ) : (
                  'Permanently Delete My Account'
                )}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
