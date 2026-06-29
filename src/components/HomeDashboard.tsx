import React, { useState, useEffect } from 'react';
import { apiRouter, LiveIdentityVerification } from '../services/apiRouter';
import { dbService } from '../services/dbService';
import { baseFetch, API_ENDPOINTS } from '../config/apiConfig';
import { UserProfile, FoundItem } from '../types';
import { NotificationController } from './NotificationController';
import { SearchDashboard } from './SearchDashboard';
import { 
  Bell, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  RefreshCw, 
  FileText, 
  Upload, 
  Camera, 
  TrendingUp, 
  Wallet, 
  MapPin, 
  Sparkles, 
  Clock, 
  ArrowRight,
  ShieldAlert,
  UserCheck
} from 'lucide-react';

interface HomeDashboardProps {
  user: UserProfile;
  items: FoundItem[];
  onStartFlow: (role: 'finder' | 'owner') => void;
  setActiveRole: (role: 'finder' | 'owner' | 'admin') => void;
  setCurrentScreen: (screen: 'welcome' | 'home' | 'search' | 'report' | 'rewards' | 'admin') => void;
  handleClaimSubmitted: (updatedItems: any[]) => void;
  handleApproveProof: (itemId: string) => void;
  handleSettleUPI: (itemId: string) => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  user,
  items,
  onStartFlow,
  setActiveRole,
  setCurrentScreen,
  handleClaimSubmitted,
  handleApproveProof,
  handleSettleUPI
}) => {
  // Reactive verification states
  const [verificationStatus, setVerificationStatus] = useState<string>('Not Submitted');
  const [userVerificationRowIndex, setUserVerificationRowIndex] = useState<number>(-1);
  const [verificationDetails, setVerificationDetails] = useState<LiveIdentityVerification | null>(null);
  const [isPolling, setIsPolling] = useState<boolean>(false);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  // History / Modal States
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyLogs, setHistoryLogs] = useState<{ action: string; time: string; status: string }[]>([]);

  // Re-submission form states
  const [showResubmitForm, setShowResubmitForm] = useState<boolean>(false);
  const [resubmitName, setResubmitName] = useState<string>(user.name);
  const [resubmitIdType, setResubmitIdType] = useState<string>('Aadhaar');
  const [resubmitIdNumber, setResubmitIdNumber] = useState<string>('');
  const [resubmitFile, setResubmitFile] = useState<boolean>(false);
  const [resubmitFileName, setResubmitFileName] = useState<string>('');
  const [resubmitFilePreview, setResubmitFilePreview] = useState<string>('');
  const [dragActive, setDragActive] = useState<boolean>(false);

  // Focus effect state for rejected alert focus
  const [isRejectedFocused, setIsRejectedFocused] = useState<boolean>(false);

  // Fetch the verification status from Sheet.best
  const checkVerificationStatus = async () => {
    setIsPolling(true);
    try {
      const data = await apiRouter.fetchIdentityVerifications();
      const match = data.find(
        (v) => (v.UserEmail || '').trim().toLowerCase() === user.email.trim().toLowerCase()
      );

      if (match) {
        const index = data.indexOf(match);
        setUserVerificationRowIndex(index);
        setVerificationDetails(match);
        const status = match.VerificationStatus || 'Submitted';
        setVerificationStatus(status);

        // Populate history logs based on current state
        const logs = [
          {
            action: 'Account Created',
            time: 'Just Now',
            status: 'Completed'
          }
        ];
        if (status === 'Submitted') {
          logs.unshift({
            action: 'Submitted Identity Documents',
            time: match.Timestamp || 'Just Now',
            status: 'Awaiting Operator Review'
          });
        } else if (status === 'Verified') {
          logs.unshift({
            action: 'Identity Verification Checked',
            time: 'Just Now',
            status: 'Approved'
          }, {
            action: 'Submitted Identity Documents',
            time: match.Timestamp || 'Previously',
            status: 'Submitted'
          });
        } else if (status === 'Rejected') {
          logs.unshift({
            action: 'Identity Verification Checked',
            time: 'Just Now',
            status: 'Flagged / Rejected'
          }, {
            action: 'Submitted Identity Documents',
            time: match.Timestamp || 'Previously',
            status: 'Rejected'
          });
        }
        setHistoryLogs(logs);
      } else {
        setVerificationStatus('Not Submitted');
        setUserVerificationRowIndex(-1);
        setVerificationDetails(null);
        setHistoryLogs([
          {
            action: 'Account Registered',
            time: 'Onboarding',
            status: 'Pending Verification'
          }
        ]);
      }
    } catch (err) {
      console.error('Error fetching verification status:', err);
    } finally {
      setIsPolling(false);
    }
  };

  // Poll status every 5 seconds
  useEffect(() => {
    checkVerificationStatus();
    const interval = setInterval(() => {
      checkVerificationStatus();
    }, 5000);

    return () => clearInterval(interval);
  }, [user.email]);

  // Handle click on Bell notification button
  const handleBellClick = () => {
    if (verificationStatus === 'Rejected') {
      // Focus on the rejected panel
      setIsRejectedFocused(true);
      setTimeout(() => setIsRejectedFocused(false), 2000);
      
      // Also open history modal to keep flow interactive
      setShowHistoryModal(true);
    } else {
      setShowHistoryModal(true);
    }
  };

  // Re-submit flow
  const handleClearAndShowForm = async () => {
    setIsUpdating(true);
    try {
      if (userVerificationRowIndex >= 0) {
        // Set state back to "Not Submitted" in the live sheet to clear the rejection
        await apiRouter.updateIdentityVerificationStatus(userVerificationRowIndex, 'Not Submitted');
      }
      setVerificationStatus('Not Submitted');
      setShowResubmitForm(true);
    } catch (err) {
      console.error('Error resetting verification status:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleResubmitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resubmitIdNumber.trim()) {
      alert('Please fill in your ID Document number.');
      return;
    }
    if (!resubmitFile) {
      alert('Please upload a valid Aadhaar or Gov ID Document photo.');
      return;
    }

    setIsUpdating(true);
    try {
      const payload = {
        Timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        UserEmail: user.email,
        FullName: resubmitName,
        IDType: resubmitIdType,
        IDNumber: resubmitIdNumber,
        VerificationStatus: 'Submitted',
        ReviewNotes: 'Re-submitted proof documents',
        DocumentLink: resubmitFileName || 'mock_aadhaar_card_proof.pdf'
      };

      if (userVerificationRowIndex >= 0) {
        // Row exists, patch the whole row or update it
        await baseFetch(`${API_ENDPOINTS.IDENTITY_VERIFICATION}/${userVerificationRowIndex}`, {
          method: 'PUT',
          body: payload
        });
      } else {
        // Row doesn't exist, create it
        await dbService.submitIdentityVerification(payload);
      }

      await checkVerificationStatus();
      setShowResubmitForm(false);
      setResubmitIdNumber('');
      setResubmitFile(false);
      setResubmitFileName('');
    } catch (err) {
      console.error('Failed to submit identity verification:', err);
    } finally {
      setIsUpdating(false);
    }
  };

  // Mock File Drag & Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setResubmitFile(true);
      setResubmitFileName(file.name);
      setResubmitFilePreview(URL.createObjectURL(file));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setResubmitFile(true);
      setResubmitFileName(file.name);
      setResubmitFilePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Embedded Mini Header for Desktop Home screen */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100 text-blue-600 font-bold uppercase">
            {user.name.charAt(0)}
          </div>
          <div className="text-left">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Citizen Console</p>
            <h3 className="text-xs font-black uppercase text-slate-800 leading-tight">{user.name}</h3>
          </div>
        </div>

        {/* Dynamic Status Badges and Reactive Bell Button */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">ID VERIFICATION STATUS</span>
            <span className={`inline-block text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md mt-0.5 border ${
              verificationStatus === 'Verified'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : verificationStatus === 'Rejected'
                ? 'bg-red-50 border-red-200 text-red-700'
                : 'bg-amber-50 border-amber-200 text-amber-700'
            }`}>
              {verificationStatus}
            </span>
          </div>

          {/* Verification Status-Driven Bell active state */}
          <button
            onClick={handleBellClick}
            id="bell-notification-button"
            className={`p-2.5 rounded-xl cursor-pointer relative transition-all border ${
              verificationStatus === 'Verified'
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-600 border-emerald-200 shadow-md shadow-emerald-500/10'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <Bell className={`w-4.5 h-4.5 ${verificationStatus === 'Verified' ? 'animate-bounce' : ''}`} />
            
            {/* Pulsing indicator */}
            <span className={`absolute top-1 right-1 w-2.5 h-2.5 rounded-full border border-white ${
              verificationStatus === 'Verified'
                ? 'bg-emerald-500 animate-pulse'
                : 'bg-amber-500'
            }`}></span>
          </button>
        </div>
      </div>

      {/* Real-time Notification Controller */}
      <NotificationController currentUser={user} items={items} />

      {/* IMMEDIATE REJECTION ALERT IN THE CENTER OF HOME DASHBOARD */}
      {verificationStatus === 'Rejected' && (
        <div 
          id="rejection-alert-panel"
          className={`bg-red-50 border-2 ${
            isRejectedFocused ? 'border-red-600 ring-4 ring-red-100 scale-[1.02]' : 'border-red-200'
          } rounded-2xl p-6 shadow-xl space-y-4 text-left transition-all duration-300 transform`}
        >
          <div className="flex gap-4 items-start">
            <div className="p-3 bg-red-100 text-red-700 rounded-xl border border-red-200 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black uppercase text-red-800 tracking-wide">Identity Verification Failed</h4>
              <p className="text-xs text-red-700 font-bold leading-relaxed">
                Sorry, your submission could not be verified. Please submit the real proof of ownership to proceed.
              </p>
              {verificationDetails?.ReviewNotes && (
                <div className="bg-red-100/50 p-2.5 rounded-lg border border-red-200/50 mt-2 font-mono text-[10px] text-red-800">
                  <span className="font-bold">OPERATOR NOTES:</span> "{verificationDetails.ReviewNotes}"
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-2 justify-end border-t border-red-200/40">
            <button
              onClick={handleClearAndShowForm}
              disabled={isUpdating}
              className="px-5 py-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-extrabold uppercase tracking-widest text-[10px] rounded-xl transition-all cursor-pointer shadow-lg shadow-red-600/10 flex items-center gap-1.5"
            >
              {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              Re-submit Proof
            </button>
          </div>
        </div>
      )}

      {/* RE-SUBMISSION UPLOAD DIALOG FORM */}
      {showResubmitForm && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl space-y-4 text-left animate-fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-display font-black text-xs text-slate-800 uppercase tracking-widest">Re-Submit Identity Verification</h4>
            <button onClick={() => setShowResubmitForm(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-all cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleResubmitSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Applicant Full Name</label>
              <input
                type="text"
                value={resubmitName}
                onChange={(e) => setResubmitName(e.target.value)}
                placeholder="Rahul Sharma"
                className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-100"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Government ID Type</label>
                <select
                  value={resubmitIdType}
                  onChange={(e) => setResubmitIdType(e.target.value)}
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white"
                >
                  <option value="Aadhaar">Aadhaar Card (UIDAI)</option>
                  <option value="Driver License">Driver License</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Voter ID">Voter ID</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">ID Number (Confidential)</label>
                <input
                  type="text"
                  value={resubmitIdNumber}
                  onChange={(e) => setResubmitIdNumber(e.target.value)}
                  placeholder="•••• •••• 5519"
                  className="w-full p-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-100 font-mono"
                  required
                />
              </div>
            </div>

            {/* Document Drag & Drop Area */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Upload Real Proof Documents (Aadhaar/ID Card)</label>
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => document.getElementById('resubmit-file-input')?.click()}
                className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-blue-600 bg-blue-100/50'
                    : resubmitFile
                    ? 'border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50'
                    : 'border-slate-300 hover:border-blue-600 bg-white hover:bg-slate-50'
                }`}
              >
                <input
                  type="file"
                  id="resubmit-file-input"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                />
                {resubmitFile ? (
                  <div className="space-y-2">
                    {resubmitFilePreview ? (
                      <img src={resubmitFilePreview} alt="Preview" className="w-16 h-16 object-cover rounded shadow mx-auto border border-slate-200" />
                    ) : (
                      <FileText className="w-8 h-8 text-emerald-600 mx-auto" />
                    )}
                    <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      {resubmitFileName || 'Document_uploaded.jpg'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Camera className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs text-slate-600 font-bold uppercase tracking-wider">Click or drag files here</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wide">Supports JPG, PNG, PDF (Max 5MB)</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResubmitForm(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdating}
                className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
              >
                {isUpdating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                Submit Verification
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Main Home Screen Grid (Extracted Layout from App.tsx) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left">
        {/* Left & Center Main Workspace: Maps, Cards, Handover Info */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Interactive Found CTA card */}
          <div className="bg-gradient-to-r from-blue-900 to-blue-950 text-white p-6 rounded-2xl border-l-8 border-amber-400 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="space-y-2 text-left">
              <span className="text-[9px] font-black tracking-widest text-cyan-400 uppercase">Handover Incentive Program</span>
              <h3 className="font-display font-black text-xl leading-tight uppercase">
                Discovered Lost Passenger Luggage?
              </h3>
              <p className="text-slate-300 text-xs leading-relaxed max-w-md">
                Safely tag and deposit found articles at any local depot. Receive an instant <span className="text-amber-400 font-black">₹60 reward</span> direct to your UPI wallet on claim settlement!
              </p>
            </div>
            <button
              onClick={() => onStartFlow('finder')}
              className="px-6 py-3.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-900 font-extrabold uppercase tracking-widest text-xs rounded-xl transition-all shrink-0 cursor-pointer shadow-lg shadow-amber-400/20"
            >
              Report found item
            </button>
          </div>

          {/* Coverage Map Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-display font-black text-sm text-slate-800 uppercase flex items-center gap-2">
                <span className="w-1.5 h-5 bg-blue-600 inline-block"></span>
                Nearest Chennai Hub Network
              </h4>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-semibold">5 Active drop zones</span>
            </div>
            
            {/* Interactive map centered on Chennai */}
            <div className="shadow-md rounded-2xl overflow-hidden border border-slate-200">
              <SearchDashboard
                items={items}
                onClaimSubmitted={handleClaimSubmitted}
                onSimulateApproveClaim={handleApproveProof}
                onSimulatePayment={handleSettleUPI}
                currentUser={user}
                onlyShowMap={true}
              />
            </div>
          </div>
        </div>

        {/* Right side Dashboard Sidebar panel (Profile status, Recents, Stats) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Your Recent Items Ledger */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-left">
            <h4 className="font-display font-black text-xs text-slate-800 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <span className="w-1.5 h-4 bg-blue-600"></span>
              Activity Tracker
            </h4>

            <div className="space-y-3">
              {(() => {
                const userEmailLower = (user.email || '').trim().toLowerCase();
                const userItems = items.filter(item => {
                  const finderEmail = (item.reporterEmail || '').trim().toLowerCase();
                  return finderEmail === userEmailLower && item.status !== 'Settled';
                });

                if (userItems.length === 0) {
                  return (
                    <div className="text-center py-6">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No active dispatches</p>
                      <p className="text-[9px] text-slate-500 mt-1 uppercase font-semibold">Your reporter ledger is empty.</p>
                    </div>
                  );
                }

                return userItems.map((item) => {
                  const isVerifiedOrReady = item.status === 'Verified' || item.status === 'Ready for Claim';
                  const isSettled = item.status === 'Settled';
                  
                  let badgeText = item.status;
                  let badgeColor = "text-amber-700 bg-amber-50 border-amber-200 font-semibold";

                  if (isVerifiedOrReady || isSettled) {
                    badgeColor = "text-emerald-700 bg-emerald-50 border-emerald-200 font-extrabold";
                  } else {
                    badgeText = "Awaiting Admin Verification";
                  }

                  return (
                    <div key={item.id} className="bg-slate-50 rounded-xl border border-slate-150 p-3 flex items-center justify-between shadow-xs">
                      <div className="flex gap-3 items-center min-w-0">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 flex items-center justify-center">
                          <img 
                            src={item.clearImg || 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=100&auto=format&fit=crop&q=60'} 
                            className="w-full h-full object-cover" 
                            alt={item.name} 
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=100&auto=format&fit=crop&q=60';
                            }}
                          />
                        </div>
                        <div className="min-w-0 text-left">
                          <h5 className="font-black text-xs text-slate-800 uppercase truncate">{item.name || `${item.category} Found`}</h5>
                          <p className="text-[9px] font-mono text-slate-400 mt-0.5 truncate">{item.location}</p>
                        </div>
                      </div>
                      <span className={`text-[8px] uppercase tracking-wider shrink-0 px-2 py-1 rounded-md border text-center ${badgeColor}`}>
                        {badgeText}
                      </span>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {/* Chennai Recovery Hub quick statistics */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 text-left">
            <h4 className="font-display font-black text-xs text-slate-800 uppercase flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <span className="w-1.5 h-4 bg-emerald-600"></span>
              Chennai Node Stats
            </h4>
            
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
                <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Reports Logged</span>
                <span className="text-lg font-black text-blue-900 font-mono block mt-1">{items.length + 3}</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
                <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider">Escrow Disbursed</span>
                <span className="text-lg font-black text-emerald-600 font-mono block mt-1">₹14,580</span>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* REACTIVE BELL ACTION HISTORY LOGS MODAL */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative text-left animate-fade-in space-y-4">
            <button 
              onClick={() => setShowHistoryModal(false)}
              className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-display font-black text-xs text-slate-800 uppercase tracking-widest">Chennai Hub Operations Log</h4>
                <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold mt-0.5">Real-time status history of your submitted profile</p>
              </div>
            </div>

            <div className="space-y-4 py-2">
              {historyLogs.map((log, i) => (
                <div key={i} className="flex gap-3 items-start">
                  <div className="relative h-full flex flex-col items-center shrink-0">
                    <div className={`w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center z-10 ${
                      log.status.includes('Approved') || log.status.includes('Completed')
                        ? 'bg-emerald-500 border-emerald-500'
                        : log.status.includes('Rejected')
                        ? 'bg-red-500 border-red-500'
                        : 'bg-amber-500 border-amber-500'
                    }`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                    </div>
                    {i < historyLogs.length - 1 && (
                      <div className="w-0.5 bg-slate-200 flex-grow absolute top-3.5 bottom-0"></div>
                    )}
                  </div>
                  <div className="text-xs leading-relaxed">
                    <p className="font-black uppercase text-slate-800 tracking-wide">{log.action}</p>
                    <p className="text-[10px] text-slate-500 font-medium">{log.time}</p>
                    <span className={`inline-block text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md mt-1 border ${
                      log.status.includes('Approved') || log.status.includes('Completed')
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : log.status.includes('Rejected')
                        ? 'bg-red-50 border-red-100 text-red-700'
                        : 'bg-amber-50 border-amber-100 text-amber-700'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 text-center">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer"
              >
                Dismiss Logs
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
