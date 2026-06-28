import React, { useState, useEffect } from 'react';
import { FoundItem } from '../types';
import { X, RefreshCw, CheckCircle2, ClipboardCheck, User, ShieldCheck, Check, Ban, ExternalLink, FileText, Package, Lock } from 'lucide-react';
import { dbService } from '../services/dbService';

interface AdminHubProps {
  items: FoundItem[];
  onApproveProof: (itemId: string) => void;
  onRejectProof: (itemId: string) => void;
  onSettleUPI: (itemId: string) => void;
}

interface LiveIdentityVerification {
  Timestamp?: string;
  UserEmail?: string;
  FullName?: string;
  IDType?: string;
  IDNumber?: string;
  VerificationStatus?: string;
  ReviewNotes?: string;
  DocumentLink?: string;
}

interface LiveFoundItem {
  Timestamp?: string;
  FinderName?: string;
  FinderEmail?: string;
  FinderPhone?: string;
  ItemCategory?: string;
  ItemDescription?: string;
  LossLocation?: string;
  FoundDate?: string;
  StorageHub?: string;
  Status?: string;
  ImageReference?: string;
}

export const AdminHub: React.FC<AdminHubProps> = ({
  items,
  onApproveProof,
  onRejectProof,
  onSettleUPI
}) => {
  const [activeTab, setActiveTab] = useState<'claims' | 'verifications' | 'inventory'>('claims');
  const [selectedItemForUPI, setSelectedItemForUPI] = useState<FoundItem | null>(null);
  const [isProcessingUPI, setIsProcessingUPI] = useState(false);

  // Live Sheet Data states
  const [liveVerifications, setLiveVerifications] = useState<LiveIdentityVerification[]>([]);
  const [liveFoundItems, setLiveFoundItems] = useState<LiveFoundItem[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(false);
  const [loadingFoundItems, setLoadingFoundItems] = useState(false);
  const [updatingIndex, setUpdatingIndex] = useState<number | null>(null);
  const [updatingItemIndex, setUpdatingItemIndex] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Fetch functions
  const loadLiveVerifications = async () => {
    setLoadingVerifications(true);
    setErrorMsg('');
    try {
      const data = await dbService.fetchIdentityVerifications();
      setLiveVerifications(data);
    } catch (err) {
      setErrorMsg('Failed to pull live identity verifications.');
    } finally {
      setLoadingVerifications(false);
    }
  };

  const loadLiveFoundItems = async () => {
    setLoadingFoundItems(true);
    setErrorMsg('');
    try {
      const data = await dbService.fetchFoundItems();
      setLiveFoundItems(data);
    } catch (err) {
      setErrorMsg('Failed to pull live found items.');
    } finally {
      setLoadingFoundItems(false);
    }
  };

  useEffect(() => {
    loadLiveVerifications();
    loadLiveFoundItems();
  }, []);

  // Update operations
  const handleUpdateVerification = async (index: number, newStatus: 'Verified' | 'Rejected') => {
    setUpdatingIndex(index);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const ok = await dbService.updateIdentityVerificationStatus(index, newStatus);
      if (ok) {
        setLiveVerifications(prev => {
          const next = [...prev];
          if (next[index]) {
            next[index].VerificationStatus = newStatus;
          }
          return next;
        });
        setSuccessMsg(`Identity marked as ${newStatus} successfully!`);
      } else {
        throw new Error('Update failed on server.');
      }
    } catch (err) {
      setErrorMsg('Failed to update verification status. Please try again.');
    } finally {
      setUpdatingIndex(null);
    }
  };

  const handleUpdateItemStatus = async (index: number, newStatus: string) => {
    setUpdatingItemIndex(index);
    setErrorMsg('');
    setSuccessMsg('');
    try {
      const ok = await dbService.updateFoundItemStatus(index, newStatus);
      if (ok) {
        setLiveFoundItems(prev => {
          const next = [...prev];
          if (next[index]) {
            next[index].Status = newStatus;
          }
          return next;
        });
        setSuccessMsg(`Found item status updated to "${newStatus}"!`);
      } else {
        throw new Error('Update failed on server.');
      }
    } catch (err) {
      setErrorMsg('Failed to update found item status. Please try again.');
    } finally {
      setUpdatingItemIndex(null);
    }
  };

  const maskIdentityNumber = (idNum?: string) => {
    if (!idNum) return '[Aadhaar Redacted]';
    const trimmed = idNum.trim();
    if (trimmed.length > 4) {
      return `•••• •••• ${trimmed.substring(trimmed.length - 4)}`;
    }
    return '[Aadhaar Redacted]';
  };

  // Filter items that have claims submitted
  const pendingClaims = items.filter((item) => item.status === 'Under verification' && item.proof);
  const approvedPendingPayment = items.filter((item) => item.status === 'Awaiting Approval' && item.proof);

  // Statistics
  const totalInInventory = items.length;
  const totalClaimed = items.filter((item) => item.status === 'Claimed').length;
  const totalPendingVerify = pendingClaims.length;

  const handleApprove = (itemId: string) => {
    onApproveProof(itemId);
  };

  const handleReject = (itemId: string) => {
    onRejectProof(itemId);
  };

  const triggerUPISettlement = (item: FoundItem) => {
    setSelectedItemForUPI(item);
  };

  const handleSettleSubmit = () => {
    if (!selectedItemForUPI) return;
    setIsProcessingUPI(true);
    setTimeout(() => {
      onSettleUPI(selectedItemForUPI.id);
      setIsProcessingUPI(false);
      setSelectedItemForUPI(null);
    }, 1500); // simulate 1.5 seconds banking settlement
  };

  return (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-center shadow-lg">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Items</p>
          <p className="text-xl font-black text-white mt-1 font-mono">{liveFoundItems.length || totalInInventory}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-center shadow-lg">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Identity Verifications</p>
          <p className="text-xl font-black text-cyan-400 mt-1 font-mono">{liveVerifications.length}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-xl text-center shadow-lg">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Claims</p>
          <p className="text-xl font-black text-emerald-400 mt-1 font-mono">{pendingClaims.length + approvedPendingPayment.length}</p>
        </div>
      </div>

      {/* Notifications banner */}
      {(errorMsg || successMsg) && (
        <div className="space-y-2">
          {errorMsg && (
            <div className="bg-red-950/80 text-red-200 border border-red-800/50 p-3 rounded-xl text-xs font-bold text-center uppercase tracking-wider">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="bg-emerald-950/80 text-emerald-200 border border-emerald-800/50 p-3 rounded-xl text-xs font-bold text-center uppercase tracking-wider">
              {successMsg}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950 rounded-xl overflow-hidden shadow-lg">
        <button
          onClick={() => {
            setActiveTab('claims');
            setSelectedItemForUPI(null);
          }}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
            activeTab === 'claims'
              ? 'border-cyan-400 text-white font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Claims Escrow ({pendingClaims.length + approvedPendingPayment.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('verifications');
            setSelectedItemForUPI(null);
          }}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
            activeTab === 'verifications'
              ? 'border-cyan-400 text-white font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Identity Verifications ({liveVerifications.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('inventory');
            setSelectedItemForUPI(null);
          }}
          className={`flex-1 py-3 text-[10px] font-black uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-cyan-400 text-white font-black'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          Live Registry ({liveFoundItems.length})
        </button>
      </div>

      {/* UPI QR Payment Modal Simulation */}
      {selectedItemForUPI && (
        <div className="bg-slate-900 p-5 border border-slate-800 rounded-xl shadow-2xl space-y-4 animate-fade-in text-slate-100">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h4 className="font-display font-black text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-cyan-400 inline-block"></span>
              Simulate UPI Escrow Release
            </h4>
            <button
              onClick={() => setSelectedItemForUPI(null)}
              className="text-slate-400 hover:text-red-400 font-bold cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col items-center text-center space-y-3">
            <p className="text-[10px] text-slate-400 leading-relaxed uppercase tracking-wider font-bold">
              Scan BharatQR to pay platform fee and release finder's 30% micro-reward automatically.
            </p>

            {/* UPI QR Code representation */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 relative">
              <img
                className={`w-32 h-32 object-contain ${isProcessingUPI ? 'opacity-30 blur-xs' : ''}`}
                alt="BharatQR UPI Escrow Code"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMcKZhwiV_PUkLMvVvhIsMv4KGzVrxD0HwUNC7cL3Q8nzZ4Fh4UFHdoVhTLSe-DsSlv2QdO_f5LOVvqTdqFEBbFH3qfjTbrHNveczxjnK1bF_bZXWUWgjb9YuGW1Ec0un6PSPTnh_4XfYH8uP6M7ds39Dy75ckO_Ged9UcBBCyiCUpgIxCMP-Gb6oahC9uTgjeceD0amEy-SZmjD7FGFMKBd2x5CW-PD_bsNS9S8FsXx0Y55j9oh8qqLS2rerplHYF_TuRvBzCvXn5"
              />
              {isProcessingUPI && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                  <RefreshCw className="w-8 h-8 text-blue-900 animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">Payable Amount</p>
              <p className="text-xl font-black text-cyan-400 font-mono">₹{selectedItemForUPI.serviceFee}</p>
              <p className="text-[10px] text-emerald-400 font-bold bg-emerald-950/50 px-2.5 py-1 rounded-lg border border-emerald-800/40 uppercase tracking-wider">
                ✓ Includes ₹{selectedItemForUPI.rewardAmount} finder reward
              </p>
            </div>
          </div>

          <button
            onClick={handleSettleSubmit}
            disabled={isProcessingUPI}
            className="w-full py-3.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-black text-xs uppercase tracking-widest rounded-xl shadow-lg shadow-cyan-950/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isProcessingUPI ? 'Securing Escrow Settlement...' : 'Simulate UPI Payment Success'}
          </button>
        </div>
      )}

      {/* Tabs content */}
      {activeTab === 'claims' && !selectedItemForUPI && (
        <div className="space-y-4">
          <h3 className="font-display font-black text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
            <span className="w-1.5 h-4 bg-cyan-400 inline-block"></span>
            Pending Reviews ({pendingClaims.length + approvedPendingPayment.length})
          </h3>

          {/* Pending Reviews list */}
          {pendingClaims.map((item) => (
            <div
              key={item.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4 shadow-lg text-slate-100"
            >
              {/* Item Info Header */}
              <div className="flex gap-3 pb-3 border-b border-slate-800">
                <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-800 bg-slate-950">
                  <img src={item.clearImg} className="w-full h-full object-cover" alt="Item preview" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-white uppercase tracking-wide">{item.name}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Hub Location: {item.location}</p>
                  <p className="text-[10px] text-cyan-400 font-black uppercase tracking-wider font-mono">Sub ID: {item.submissionId}</p>
                </div>
              </div>

              {/* Submitter details and proof */}
              {item.proof && (
                <div className="space-y-2.5 text-xs text-slate-300 bg-slate-950 p-3 rounded-xl border border-slate-800/60">
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <div>
                      <p className="text-slate-500">Claimant Name:</p>
                      <p className="text-white font-black">{item.proof.fullName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Mobile Contact:</p>
                      <p className="text-white font-black font-mono">{item.proof.mobileNumber}</p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Submitted Proof Detail:</p>
                    <p className="italic text-slate-300 bg-slate-900 p-2.5 rounded-lg border border-slate-800 mt-1 leading-relaxed text-xs">
                      "{item.proof.proofDetail}"
                    </p>
                  </div>

                  <div className="pt-1 flex items-center gap-1.5 text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Aadhaar Identity verified securely on platform
                  </div>
                </div>
              )}

              {/* Approve/Reject Action triggers */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleReject(item.id)}
                  className="w-full py-2 border border-red-500 text-red-400 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-red-950/20 transition-colors cursor-pointer"
                >
                  Reject Claim
                </button>
                <button
                  onClick={() => handleApprove(item.id)}
                  className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1"
                >
                  Approve Proof
                </button>
              </div>
            </div>
          ))}

          {/* Approved pending UPI settlements list */}
          {approvedPendingPayment.map((item) => (
            <div
              key={item.id}
              className="bg-amber-950/40 border border-amber-800/40 rounded-xl p-4 space-y-4 shadow-lg text-slate-100"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-200 bg-amber-900/40 px-2.5 py-1 rounded-md border border-amber-800/40">
                    Awaiting Settlement
                  </span>
                  <h4 className="font-black text-sm text-white uppercase tracking-wide mt-2">{item.name}</h4>
                  <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Claimant: {item.proof?.fullName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-500 uppercase tracking-wider">Service Fee</p>
                  <p className="text-sm font-black text-cyan-400 font-mono">₹{item.serviceFee}</p>
                </div>
              </div>

              <div className="text-xs text-amber-200 leading-relaxed bg-slate-950 p-3 rounded-lg border border-amber-800/30">
                <p className="font-bold uppercase tracking-wider text-[10px]">Chennai Hub Escrow status:</p>
                <p className="mt-0.5 font-medium">Proof matches. Once claimant settles service fee of ₹{item.serviceFee} via UPI, the reward of <strong>₹{item.rewardAmount} (30%)</strong> releases to finder <strong>{item.reporterName}</strong> instantly.</p>
              </div>

              <button
                onClick={() => triggerUPISettlement(item)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold uppercase tracking-widest shadow-md transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                Trigger UPI QR Settlement
              </button>
            </div>
          ))}

          {pendingClaims.length === 0 && approvedPendingPayment.length === 0 && (
            <div className="py-12 text-center bg-slate-900 border border-slate-800 rounded-xl p-6">
              <ClipboardCheck className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-xs font-bold uppercase tracking-wider text-white mt-2">All claims processed!</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                There are no pending owner verification requests at Chennai hubs currently.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Identity Verifications Tab */}
      {activeTab === 'verifications' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-cyan-400 inline-block"></span>
              Live Identity Verification Console
            </h3>
            <button
              onClick={loadLiveVerifications}
              disabled={loadingVerifications}
              className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${loadingVerifications ? 'animate-spin' : ''}`} /> Reload
            </button>
          </div>

          {loadingVerifications ? (
            <div className="py-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mt-2">Pulling rows from live Sheet.best ledger...</p>
            </div>
          ) : liveVerifications.length === 0 ? (
            <div className="py-12 text-center bg-slate-900 border border-slate-800 rounded-xl p-6">
              <FileText className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-xs font-bold uppercase tracking-wider text-white mt-2">No Verification Rows Found</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                The live identity spreadsheet is currently empty or loading failed.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {liveVerifications.map((row, index) => (
                <div
                  key={index}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 shadow-lg text-slate-100"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-sm text-white">{row.FullName || 'Anonymous Citizen'}</h4>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">{row.UserEmail}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider border ${
                      row.VerificationStatus === 'Verified'
                        ? 'bg-emerald-950/60 text-emerald-400 border-emerald-800/40'
                        : row.VerificationStatus === 'Rejected'
                        ? 'bg-red-950/60 text-red-400 border-red-800/40'
                        : 'bg-amber-950/60 text-amber-400 border-amber-800/40'
                    }`}>
                      {row.VerificationStatus || 'Under Review'}
                    </span>
                  </div>

                  <div className="bg-slate-950 border border-slate-800/80 p-3 rounded-lg text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-2 text-[10px] uppercase font-bold tracking-wider">
                      <div>
                        <span className="text-slate-500 block">ID Type:</span>
                        <span className="text-white">{row.IDType || 'Aadhaar'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">ID Number (Masked):</span>
                        <span className="text-cyan-400 font-mono">{maskIdentityNumber(row.IDNumber)}</span>
                      </div>
                    </div>

                    {row.ReviewNotes && (
                      <div className="pt-1.5 border-t border-slate-800">
                        <span className="text-[9px] text-slate-500 uppercase font-bold block">Review Notes:</span>
                        <p className="text-slate-300 italic text-[11px] mt-0.5">"{row.ReviewNotes}"</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-1">
                    {row.DocumentLink && (
                      <a
                        href={row.DocumentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider text-center flex items-center justify-center gap-1 cursor-pointer transition-all border border-slate-700"
                      >
                        <ExternalLink className="w-3 h-3" /> View Asset
                      </a>
                    )}
                    <button
                      onClick={() => handleUpdateVerification(index, 'Rejected')}
                      disabled={updatingIndex === index}
                      className="flex-1 py-2 border border-red-500/50 hover:bg-red-950/30 text-red-400 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1"
                    >
                      {updatingIndex === index ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />} Reject
                    </button>
                    <button
                      onClick={() => handleUpdateVerification(index, 'Verified')}
                      disabled={updatingIndex === index}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all flex items-center justify-center gap-1"
                    >
                      {updatingIndex === index ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />} Approve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Found Items Live Registry Tab */}
      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-white flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-cyan-400 inline-block"></span>
              Live Found Items Ledger
            </h3>
            <button
              onClick={loadLiveFoundItems}
              disabled={loadingFoundItems}
              className="text-[10px] font-bold text-slate-400 hover:text-white uppercase tracking-wider flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${loadingFoundItems ? 'animate-spin' : ''}`} /> Reload
            </button>
          </div>

          {loadingFoundItems ? (
            <div className="py-12 text-center bg-slate-900 border border-slate-800 rounded-xl">
              <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
              <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mt-2">Pulling records from live Sheet.best ledger...</p>
            </div>
          ) : liveFoundItems.length === 0 ? (
            <div className="py-12 text-center bg-slate-900 border border-slate-800 rounded-xl p-6">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-xs font-bold uppercase tracking-wider text-white mt-2">No Live Items Logged</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider">
                The live found items spreadsheet is currently empty or loading failed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {liveFoundItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3.5 shadow-lg text-slate-100"
                >
                  <div className="flex gap-3 pb-2 border-b border-slate-800/80">
                    <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0 border border-slate-800 bg-slate-950 flex items-center justify-center">
                      <img
                        src={item.ImageReference || 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=100&auto=format&fit=crop&q=60'}
                        className="w-full h-full object-cover"
                        alt="preview"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1540553016722-983e48a2cd10?w=100&auto=format&fit=crop&q=60';
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-black text-xs text-white uppercase tracking-wide">{item.ItemCategory || 'Uncategorized'}</h4>
                        <span className="text-[8px] font-mono text-slate-400">{item.Timestamp ? item.Timestamp.split(',')[0] : ''}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5 italic">"{item.ItemDescription}"</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-stretch">
                    <div className="flex-1 grid grid-cols-2 gap-2 text-[10px] uppercase font-bold tracking-wider bg-slate-950 p-2.5 rounded-lg border border-slate-800/50">
                      <div>
                        <span className="text-slate-500 block">Loss Location:</span>
                        <span className="text-white">{item.LossLocation || 'Chennai City'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Storage Hub:</span>
                        <span className="text-white">{item.StorageHub || 'Central Hub'}</span>
                      </div>
                      <div className="pt-1.5 border-t border-slate-900 col-span-2">
                        <span className="text-slate-500 block">Finder details:</span>
                        <span className="text-slate-300 font-medium">{item.FinderName} • {item.FinderPhone}</span>
                      </div>
                    </div>

                    {/* Item QR Column */}
                    <div className="flex flex-col items-center justify-center bg-slate-950 border border-slate-800/50 p-2 rounded-lg shrink-0 w-24 text-center">
                      <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mb-1">Item QR</span>
                      <div className="p-1 bg-white rounded">
                        <img
                          src={`https://quickchart.io/qr?text=https://findback-app-url.com/item/${encodeURIComponent(item.id || item.submissionId || `api-${index}`)}&size=200`}
                          alt="Item QR"
                          className="w-14 h-14 object-contain"
                        />
                      </div>
                      <span className="text-[7px] text-slate-400 font-mono mt-1 select-all">{item.id || item.submissionId || `api-${index}`}</span>
                    </div>
                  </div>

                  {/* Dropdown status switcher utility */}
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Update Ledger Status:</span>
                    <div className="flex items-center gap-2">
                      {updatingItemIndex === index && (
                        <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
                      )}
                      <select
                        value={item.Status || 'Under Review'}
                        onChange={(e) => handleUpdateItemStatus(index, e.target.value)}
                        disabled={updatingItemIndex !== null}
                        className="p-1.5 px-3 rounded-lg text-[10px] font-black border border-slate-800 bg-slate-950 text-white cursor-pointer uppercase font-mono focus:ring-1 focus:ring-cyan-400 focus:outline-none"
                      >
                        <option value="Under Review">Under Review</option>
                        <option value="Match Found">Match Found</option>
                        <option value="Claimed">Claimed</option>
                        <option value="Available">Available</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
