import React, { useState, useEffect } from 'react';
import { apiRouter, LiveIdentityVerification, LiveFoundItem } from '../services/apiRouter';
import { FoundItem } from '../types';
import { 
  X, 
  RefreshCw, 
  CheckCircle2, 
  User, 
  ShieldCheck, 
  Check, 
  Ban, 
  ExternalLink, 
  FileText, 
  Package, 
  Lock, 
  Sliders, 
  Mail, 
  Phone, 
  AlertCircle,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';

interface AdminDashboardProps {
  items: FoundItem[];
  onApproveProof?: (itemId: string) => void;
  onRejectProof?: (itemId: string) => void;
  onSettleUPI?: (itemId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  items,
  onApproveProof,
  onRejectProof,
  onSettleUPI
}) => {
  // Tabs: 'verifications' for Identity Verification Queue, 'ledger' for Found Items Ledger
  const [activeTab, setActiveTab] = useState<'verifications' | 'ledger'>('verifications');
  
  // Live states
  const [liveVerifications, setLiveVerifications] = useState<LiveIdentityVerification[]>([]);
  const [liveFoundItems, setLiveFoundItems] = useState<LiveFoundItem[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [loadingFoundItems, setLoadingFoundItems] = useState(false);
  const [updatingIndex, setUpdatingIndex] = useState<number | null>(null);
  const [updatingItemIndex, setUpdatingItemIndex] = useState<number | null>(null);
  
  // Alerts
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch live identity verifications
  const loadVerifications = async () => {
    setLoadingVerifications(true);
    setErrorMsg('');
    try {
      const data = await apiRouter.fetchIdentityVerifications();
      setLiveVerifications(data);
    } catch (err) {
      console.error('Error fetching verifications:', err);
      setErrorMsg('Failed to pull live identity verifications.');
    } finally {
      setLoadingVerifications(false);
    }
  };

  // Fetch live found items
  const loadFoundItems = async () => {
    setLoadingFoundItems(true);
    setErrorMsg('');
    try {
      const data = await apiRouter.fetchFoundItems();
      setLiveFoundItems(data);
    } catch (err) {
      console.error('Error fetching found items:', err);
      setErrorMsg('Failed to pull live found items.');
    } finally {
      setLoadingFoundItems(false);
    }
  };

  useEffect(() => {
    loadVerifications();
    loadFoundItems();
  }, []);

  // Update Identity Verification status (async PATCH)
  const handleUpdateVerification = async (index: number, newStatus: 'Verified' | 'Rejected') => {
    setUpdatingIndex(index);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const success = await apiRouter.updateIdentityVerificationStatus(index, newStatus);
      if (success) {
        setLiveVerifications(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index].VerificationStatus = newStatus;
          }
          return updated;
        });
        setSuccessMsg(`Identity verified status successfully set to ${newStatus}!`);
        // Auto-clear success message
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg('Failed to update verification status on Sheet.best.');
      }
    } catch (err) {
      console.error('Error updating verification status:', err);
      setErrorMsg('Error communicating with live spreadsheet service.');
    } finally {
      setUpdatingIndex(null);
    }
  };

  // Update Found Item status (async PATCH)
  const handleUpdateItemStatus = async (index: number, newStatus: string) => {
    setUpdatingItemIndex(index);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const success = await apiRouter.updateFoundItemStatus(index, newStatus);
      if (success) {
        setLiveFoundItems(prev => {
          const updated = [...prev];
          if (updated[index]) {
            updated[index].Status = newStatus;
          }
          return updated;
        });
        setSuccessMsg(`Found item status updated live to "${newStatus}"!`);
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        setErrorMsg('Failed to update found item status on Sheet.best.');
      }
    } catch (err) {
      console.error('Error updating item status:', err);
      setErrorMsg('Error communicating with found items spreadsheet.');
    } finally {
      setUpdatingItemIndex(null);
    }
  };

  // Compliance masking helper
  const maskSensitiveValue = (value?: string) => {
    if (!value) return '[Redacted]';
    const clean = value.trim();
    
    // Check if it's a mobile number (e.g. +91 98765 43210 or similar)
    if (clean.startsWith('+91') || /^\d{10}$/.test(clean.replace(/\D/g, ''))) {
      const stripped = clean.replace(/\s+/g, '');
      if (stripped.length >= 10) {
        // e.g., +91 ***** 5519
        const isCountryCode = stripped.startsWith('+91');
        const suffix = stripped.substring(stripped.length - 4);
        const prefix = isCountryCode ? '+91' : stripped.substring(0, 3);
        return `${prefix} ***** ${suffix}`;
      }
    }

    // Default masking for ID documents/numbers
    if (clean.length > 4) {
      return `•••• •••• ${clean.substring(clean.length - 4)}`;
    }
    return '••••';
  };

  // Cross-reference local found items to see if there is any custom owner claims/proofs submitted
  const getOwnerProofForLiveItem = (liveItem: LiveFoundItem) => {
    if (liveItem.OwnerProof) {
      return {
        fullName: 'Citizen Claimant',
        mobileNumber: liveItem.FinderPhone || 'N/A',
        proofDetail: liveItem.OwnerProof,
        submittedAt: 'Just now',
        status: 'pending' as const
      };
    }
    // Attempt to match by item description or category & location
    const matchedLocal = items.find(local => 
      local.category.toLowerCase() === (liveItem.ItemCategory || '').toLowerCase() ||
      (liveItem.ItemDescription || '').toLowerCase().includes(local.name.toLowerCase())
    );
    return matchedLocal?.proof || null;
  };

  return (
    <div id="admin-dashboard-container" className="space-y-6 text-slate-100 font-sans">
      
      {/* Mini Info Strip */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row justify-between items-center gap-4 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-900/40 rounded-lg border border-blue-500/30">
            <Sliders className="w-5 h-5 text-cyan-400" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-black uppercase tracking-wider text-white">Chennai Admin Management Console</h3>
            <p className="text-[10px] font-mono text-cyan-400 font-bold uppercase">Role: Hub Operator (Sanjeev Kumar)</p>
          </div>
        </div>
        
        {/* Tab triggers */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'verifications'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Identity Verifications
          </button>
          <button
            onClick={() => setActiveTab('ledger')}
            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'ledger'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Found Items Ledger
          </button>
        </div>
      </div>

      {/* Stats Quick Readout */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center shadow-lg">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Live Found Items</p>
          <p className="text-2xl font-black text-white mt-1 font-mono">{liveFoundItems.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center shadow-lg">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verification Requests</p>
          <p className="text-2xl font-black text-cyan-400 mt-1 font-mono">{liveVerifications.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center shadow-lg">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verified Accounts</p>
          <p className="text-2xl font-black text-emerald-400 mt-1 font-mono">
            {liveVerifications.filter(v => v.VerificationStatus === 'Verified').length}
          </p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-center shadow-lg">
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Under Review Items</p>
          <p className="text-2xl font-black text-amber-400 mt-1 font-mono">
            {liveFoundItems.filter(i => i.Status === 'Under Review' || i.Status === 'Under verification').length}
          </p>
        </div>
      </div>

      {/* Success / Error Banners */}
      {successMsg && (
        <div className="bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 uppercase tracking-wide">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="bg-red-950/80 border border-red-500/40 text-red-300 p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 uppercase tracking-wide">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'verifications' ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 text-left">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div>
              <h4 className="font-display font-black text-xs uppercase text-white tracking-widest">Identity Verification Queue</h4>
              <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Validate submitted citizen credentials for system claims permission</p>
            </div>
            <button
              onClick={loadVerifications}
              disabled={loadingVerifications}
              className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-widest flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingVerifications ? 'animate-spin' : ''}`} /> Reload
            </button>
          </div>

          {loadingVerifications ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mt-3">Fetching verification queue from live Sheet.best ledger...</p>
            </div>
          ) : liveVerifications.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl">
              <UserCheck className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-xs font-bold uppercase tracking-widest text-white mt-2">No verification applications</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">The live database sheet contains no identity validation records.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="py-3 px-4">Applicant</th>
                    <th className="py-3 px-4">ID Type</th>
                    <th className="py-3 px-4">ID Number (Masked)</th>
                    <th className="py-3 px-4">Submitted Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {liveVerifications.map((row, index) => {
                    const isPending = row.VerificationStatus === 'Submitted' || row.VerificationStatus === 'Under Review' || !row.VerificationStatus;
                    return (
                      <tr key={index} className="hover:bg-slate-850/40 transition-colors">
                        <td className="py-4 px-4">
                          <div className="font-bold text-white uppercase">{row.FullName || 'Anonymous Citizen'}</div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">{row.UserEmail}</div>
                        </td>
                        <td className="py-4 px-4 font-bold text-cyan-400 uppercase tracking-wider text-[10px]">
                          {row.IDType || 'Aadhaar'}
                        </td>
                        <td className="py-4 px-4 font-mono font-bold text-slate-300">
                          {maskSensitiveValue(row.IDNumber)}
                        </td>
                        <td className="py-4 px-4 text-slate-400 font-mono text-[10px]">
                          {row.Timestamp ? row.Timestamp.split(',')[0] : 'Generic Date'}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-wider border ${
                            row.VerificationStatus === 'Verified'
                              ? 'bg-emerald-950/55 border-emerald-500/50 text-emerald-400'
                              : row.VerificationStatus === 'Rejected'
                              ? 'bg-red-950/55 border-red-500/50 text-red-400'
                              : 'bg-amber-950/55 border-amber-500/50 text-amber-400'
                          }`}>
                            {row.VerificationStatus || 'Submitted'}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex gap-2 justify-end">
                            {row.DocumentLink && (
                              <a
                                href={row.DocumentLink}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg border border-slate-800 transition-colors"
                                title="View document asset"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleUpdateVerification(index, 'Rejected')}
                              disabled={updatingIndex === index}
                              className="px-3 py-1.5 border border-red-500/50 hover:bg-red-950/30 text-red-400 rounded-lg text-[10px] font-extrabold uppercase tracking-widest cursor-pointer transition-all flex items-center gap-1"
                            >
                              {updatingIndex === index ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />} Reject
                            </button>
                            <button
                              onClick={() => handleUpdateVerification(index, 'Verified')}
                              disabled={updatingIndex === index}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-extrabold uppercase tracking-widest cursor-pointer transition-all flex items-center gap-1 shadow-md shadow-emerald-900/10"
                            >
                              {updatingIndex === index ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Approve
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl space-y-4 text-left">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <div>
              <h4 className="font-display font-black text-xs uppercase text-white tracking-widest">Found Items Ledger</h4>
              <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Manage reported items, citizen recovery status, and verify matches</p>
            </div>
            <button
              onClick={loadFoundItems}
              disabled={loadingFoundItems}
              className="text-[10px] font-black text-cyan-400 hover:text-cyan-300 uppercase tracking-widest flex items-center gap-1 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingFoundItems ? 'animate-spin' : ''}`} /> Reload
            </button>
          </div>

          {loadingFoundItems ? (
            <div className="py-16 text-center">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-xs uppercase tracking-widest font-bold text-slate-400 mt-3">Fetching active ledger from live Sheet.best inventory...</p>
            </div>
          ) : liveFoundItems.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-800 rounded-xl">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-xs font-bold uppercase tracking-widest text-white mt-2">Inventory is empty</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">The live found items spreadsheet contains no records.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                    <th className="py-3 px-4">Item Detail / Category</th>
                    <th className="py-3 px-4">Location & Hub</th>
                    <th className="py-3 px-4">Finder Details</th>
                    <th className="py-3 px-4">Owner's Claim/Proof Details</th>
                    <th className="py-3 px-4 text-right">Ledger Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {liveFoundItems.map((item, index) => {
                    const localProof = getOwnerProofForLiveItem(item);
                    return (
                      <tr key={index} className="hover:bg-slate-850/40 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex gap-3 items-center">
                            <div className="w-10 h-10 rounded border border-slate-800 bg-slate-950 overflow-hidden shrink-0 flex items-center justify-center">
                              <img
                                src={item.ImageReference || 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=100&auto=format&fit=crop&q=60'}
                                className="w-full h-full object-cover"
                                alt="preview"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=100&auto=format&fit=crop&q=60';
                                }}
                              />
                            </div>
                            <div>
                              <div className="font-bold text-white uppercase tracking-wide">{item.ItemCategory || 'Uncategorized'}</div>
                              <div className="text-[10px] text-slate-300 italic mt-0.5 leading-relaxed max-w-[200px] line-clamp-2">
                                "{item.ItemDescription}"
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-300 uppercase text-[10px] font-medium leading-relaxed">
                          <div>📍 {item.LossLocation || 'Chennai City'}</div>
                          <div className="text-[9px] text-cyan-400 mt-1 font-black">🏢 {item.StorageHub || 'Central Hub'}</div>
                        </td>
                        <td className="py-4 px-4 text-[10px] leading-relaxed">
                          <div className="font-bold text-white uppercase">{item.FinderName || 'Anonymous'}</div>
                          <div className="text-[9px] text-slate-400 font-mono mt-0.5">{maskSensitiveValue(item.FinderPhone)}</div>
                          <div className="text-[8px] text-slate-500 font-mono mt-0.5">{item.Timestamp ? item.Timestamp.split(',')[0] : ''}</div>
                        </td>
                        <td className="py-4 px-4 text-[10px] max-w-[250px] leading-relaxed">
                          {localProof ? (
                            <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                              <div className="font-bold text-white uppercase flex items-center gap-1">
                                <span className="w-1 h-3 bg-cyan-400 rounded-full"></span>
                                claimant: {localProof.fullName}
                              </div>
                              <div className="text-[9px] text-slate-400 mt-1 leading-normal italic">
                                "{localProof.proofDetail}"
                              </div>
                              <div className="text-[8px] text-slate-500 mt-1 font-mono">
                                Phone: {maskSensitiveValue(localProof.mobileNumber)}
                              </div>
                            </div>
                          ) : item.Status === 'Claimed' ? (
                            <div className="text-[9px] text-emerald-400 bg-emerald-950/30 border border-emerald-900/40 p-2 rounded uppercase font-bold tracking-wider">
                              ✓ Claim complete & assets verified
                            </div>
                          ) : (
                            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider italic">
                              No claimant proof submitted
                            </div>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex flex-col items-end gap-1.5">
                            <span className={`inline-block px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border font-mono ${
                              item.Status === 'Claimed'
                                ? 'bg-emerald-950 border-emerald-500/40 text-emerald-400'
                                : item.Status === 'Match Found'
                                ? 'bg-blue-950 border-blue-500/40 text-blue-400'
                                : 'bg-amber-950 border-amber-500/40 text-amber-400'
                            }`}>
                              {item.Status || 'Under Review'}
                            </span>
                            
                            <div className="flex items-center gap-1.5 mt-1">
                              {updatingItemIndex === index && (
                                <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                              )}
                              <select
                                value={item.Status || 'Under Review'}
                                onChange={(e) => handleUpdateItemStatus(index, e.target.value)}
                                disabled={updatingItemIndex !== null}
                                className="p-1.5 rounded-lg text-[9px] font-black border border-slate-800 bg-slate-950 text-white cursor-pointer uppercase font-mono focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                              >
                                <option value="Under Review">Under Review</option>
                                <option value="Match Found">Match Found</option>
                                <option value="Claimed">Claimed</option>
                                <option value="Available">Available</option>
                              </select>
                            </div>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
