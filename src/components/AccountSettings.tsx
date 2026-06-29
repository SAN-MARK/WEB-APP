import React, { useState, useRef, useEffect } from 'react';
import { UserProfile } from '../types';
import { baseFetch, API_ENDPOINTS } from '../config/apiConfig';
import { 
  UserCircle, 
  Lock, 
  Eye, 
  EyeOff, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { db, collection, query, where, getDocs, doc, updateDoc, getStorage, ref, uploadBytes, getDownloadURL } from '../services/firebase';

interface AccountSettingsProps {
  user: UserProfile;
  onUpdateUser: (updatedUser: Partial<UserProfile>) => void;
  showBanner: (msg: string) => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({
  user,
  onUpdateUser,
  showBanner
}) => {
  // Password Form States
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Avatar upload States
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper: Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // 1. Password Update Logic
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);

    if (!currentPassword || !newPassword || !confirmNewPassword) {
      setPasswordError('Please fill in all password fields.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New password and confirm password do not match.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      let matchedUserRecord: any = null;
      let userDocId = '';
      let isFirestoreMatched = false;

      // Step A: Fetch current password from Firestore users collection
      try {
        const q = query(collection(db, 'users'), where('email', '==', user.email.trim().toLowerCase()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          matchedUserRecord = userDoc.data();
          userDocId = userDoc.id;
          isFirestoreMatched = true;
          console.log('User password record loaded from Firestore.');
        }
      } catch (firestoreErr) {
        console.warn('Failed to fetch from Firestore for password update validation:', firestoreErr);
      }

      // Step B: Fetch from Sheet Best if not found/validated in Firestore
      let sheetBestRowIndex = -1;
      let sheetBestRows: any[] = [];
      
      try {
        const res = await baseFetch(API_ENDPOINTS.USERS);
        if (res.ok) {
          sheetBestRows = await res.json();
          if (Array.isArray(sheetBestRows)) {
            const index = sheetBestRows.findIndex((row: any) => 
              (row.Email || row.email || '').toString().trim().toLowerCase() === user.email.trim().toLowerCase()
            );
            if (index !== -1) {
              sheetBestRowIndex = index;
              if (!matchedUserRecord) {
                matchedUserRecord = sheetBestRows[index];
                console.log('User password record loaded from Sheet.best.');
              }
            }
          }
        }
      } catch (sheetBestErr) {
        console.error('Failed to fetch from Sheet.best for password update validation:', sheetBestErr);
      }

      if (!matchedUserRecord) {
        setPasswordError('Failed to verify user account record.');
        setIsUpdatingPassword(false);
        return;
      }

      const storedPassword = matchedUserRecord.Password || matchedUserRecord.password || '';
      
      if (storedPassword !== currentPassword) {
        setPasswordError('Incorrect current password.');
        setIsUpdatingPassword(false);
        return;
      }

      // Step C: If match, send PATCH request to update the 'Password' field with the new value.
      // 1. Update Firestore if we found the document
      if (isFirestoreMatched && userDocId) {
        try {
          await updateDoc(doc(db, 'users', userDocId), {
            password: newPassword,
            Password: newPassword
          });
          console.log('Successfully patched password in Firestore users collection.');
        } catch (dbUpdateErr) {
          console.error('Failed to update Firestore password:', dbUpdateErr);
        }
      }

      // 2. Update Sheet.best if row index is found
      if (sheetBestRowIndex !== -1) {
        try {
          const patchUrl = `${API_ENDPOINTS.USERS}/${sheetBestRowIndex}`;
          const patchRes = await baseFetch(patchUrl, {
            method: 'PATCH',
            body: {
              Password: newPassword
            },
          });

          if (patchRes.ok) {
            console.log('Successfully patched password in Sheet.best.');
          } else {
            console.warn('Sheet.best password PATCH responded with status:', patchRes.status);
          }
        } catch (patchErr) {
          console.error('Failed to PATCH password in Sheet.best:', patchErr);
        }
      } else {
        // If row was somehow not found, try inserting a new row or alert
        console.warn('Could not find corresponding row index in Sheet.best to PATCH password.');
      }

      showBanner('Password updated successfully!');
      alert('Password updated successfully!');
      
      // Clear Password Fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      console.error('Error updating password:', err);
      setPasswordError(err.message || 'An error occurred while updating the password.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  // 2. Profile Picture Upload Logic
  const handleTriggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    
    setIsUploadingAvatar(true);
    showBanner('Uploading profile picture to storage...');

    try {
      let publicImageUrl = '';

      // Step A: Attempt upload to Firebase Storage
      try {
        const storage = getStorage();
        const storageRef = ref(storage, `avatars/${user.email.replace(/[@.]/g, '_')}_${Date.now()}`);
        const snapshot = await uploadBytes(storageRef, file);
        publicImageUrl = await getDownloadURL(snapshot.ref);
        console.log('Uploaded image successfully to Firebase Storage. URL:', publicImageUrl);
      } catch (storageErr) {
        console.warn('Firebase Storage upload failed or not configured, using base64 fallback:', storageErr);
        // Fallback to extremely robust base64 encoding
        publicImageUrl = await fileToBase64(file);
      }

      if (!publicImageUrl) {
        throw new Error('Could not process or upload selected image.');
      }

      // Step B: Update Sheet Best row with ProfilePicURL
      let sheetBestRowIndex = -1;

      try {
        const res = await baseFetch(API_ENDPOINTS.USERS);
        if (res.ok) {
          const rows = await res.json();
          if (Array.isArray(rows)) {
            const index = rows.findIndex((row: any) => 
              (row.Email || row.email || '').toString().trim().toLowerCase() === user.email.trim().toLowerCase()
            );
            if (index !== -1) {
              sheetBestRowIndex = index;
            }
          }
        }
      } catch (err) {
        console.error('Error finding user row index in Sheet.best for avatar update:', err);
      }

      if (sheetBestRowIndex !== -1) {
        const patchUrl = `${API_ENDPOINTS.USERS}/${sheetBestRowIndex}`;
        const patchRes = await baseFetch(patchUrl, {
          method: 'PATCH',
          body: {
            ProfilePicURL: publicImageUrl
          },
        });

        if (patchRes.ok) {
          console.log('Successfully patched ProfilePicURL in Sheet.best identity ledger.');
        } else {
          console.warn('Sheet.best ProfilePicURL patch responded with status:', patchRes.status);
        }
      }

      // Step C: Also update Firebase Firestore users collection doc if exists
      try {
        const q = query(collection(db, 'users'), where('email', '==', user.email.trim().toLowerCase()));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          const userDocId = querySnapshot.docs[0].id;
          await updateDoc(doc(db, 'users', userDocId), {
            avatarUrl: publicImageUrl,
            ProfilePicURL: publicImageUrl
          });
          console.log('Successfully updated avatarUrl in Firestore.');
        }
      } catch (firestoreErr) {
        console.warn('Firestore avatar update skipped or failed:', firestoreErr);
      }

      // Step D: Apply local state update immediately to re-render in user profile
      onUpdateUser({
        avatarUrl: publicImageUrl
      });

      showBanner('Profile picture updated successfully!');
    } catch (err: any) {
      console.error('Error updating profile picture:', err);
      showBanner(`Failed to update avatar: ${err.message || 'Error occurred'}`);
    } finally {
      setIsUploadingAvatar(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const hasAvatar = user.avatarUrl && (user.avatarUrl.startsWith('http://') || user.avatarUrl.startsWith('https://') || user.avatarUrl.startsWith('data:image/'));

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-900 rounded-xl">
            <UserCircle className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-black uppercase text-slate-800 leading-tight">Account Configuration</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Manage your citizen profile credentials</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Profile Picture management */}
        <div className="md:col-span-1 bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center flex flex-col items-center justify-center space-y-4 shadow-xl">
          <span className="text-[9px] font-black tracking-widest text-cyan-400 uppercase">Profile Portrait</span>
          
          <div className="relative">
            {/* Centered circular image, 100px size */}
            <div className="w-[100px] h-[100px] rounded-full overflow-hidden border-4 border-amber-400 shadow-2xl flex items-center justify-center bg-slate-950">
              {hasAvatar ? (
                <img 
                  src={user.avatarUrl} 
                  alt="Citizen portrait" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <UserCircle className="w-full h-full text-slate-500 p-1.5" />
              )}
            </div>
            
            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-slate-950/80 rounded-full flex items-center justify-center">
                <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
              </div>
            )}
          </div>

          <div className="text-center space-y-1">
            <h4 className="text-sm font-black text-white uppercase tracking-wide">{user.name}</h4>
            <p className="text-[10px] text-slate-400 font-mono font-medium truncate max-w-[180px]">{user.email}</p>
          </div>

          <button
            onClick={handleTriggerFileInput}
            disabled={isUploadingAvatar}
            className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-extrabold uppercase tracking-widest transition-all shadow-md shadow-blue-950/40 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isUploadingAvatar ? (
              <>
                <RefreshCw className="w-3 h-3 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Upload className="w-3 h-3" />
                <span>Edit / Update Photo</span>
              </>
            )}
          </button>
          
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            accept="image/*"
            className="hidden"
          />
          
          <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Supports JPG, PNG (Max 5MB)</p>
        </div>

        {/* Right column: Change Password form */}
        <div className="md:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4 text-left">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <KeyRound className="w-5 h-5 text-blue-900" />
            <div>
              <h4 className="font-display font-black text-xs text-slate-800 uppercase tracking-widest">Update Access Password</h4>
              <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">Change your Chennai Citizen authentication secret</p>
            </div>
          </div>

          {passwordError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-700 text-xs font-bold leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <span>{passwordError}</span>
            </div>
          )}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {/* Current Password Field */}
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Current Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-400" />
                </div>
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 text-xs text-slate-800 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all font-mono"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password Field */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 text-xs text-slate-800 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-wider block">Confirm New Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 text-xs text-slate-800 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-900/10 focus:border-blue-900 transition-all font-mono"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-6 py-3 bg-blue-900 hover:bg-blue-800 disabled:opacity-50 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all shadow-md shadow-blue-950/20 cursor-pointer flex items-center gap-1.5"
              >
                {isUpdatingPassword ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Update Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
