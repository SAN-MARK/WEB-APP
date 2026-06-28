import React, { useState } from 'react';
import { FoundItem } from '../types';
import { X, RefreshCw, CheckCircle2, ClipboardCheck } from 'lucide-react';

interface AdminHubProps {
  items: FoundItem[];
  onApproveProof: (itemId: string) => void;
  onRejectProof: (itemId: string) => void;
  onSettleUPI: (itemId: string) => void;
}

export const AdminHub: React.FC<AdminHubProps> = ({
  items,
  onApproveProof,
  onRejectProof,
  onSettleUPI
}) => {
  const [activeTab, setActiveTab] = useState<'claims' | 'inventory'>('claims');
  const [selectedItemForUPI, setSelectedItemForUPI] = useState<FoundItem | null>(null);
  const [isProcessingUPI, setIsProcessingUPI] = useState(false);

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
        <div className="bg-white border border-slate-200 p-3.5 rounded text-center shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Items</p>
          <p className="text-xl font-black text-blue-900 mt-1 font-mono">{totalInInventory}</p>
        </div>
        <div className="bg-white border border-slate-200 p-3.5 rounded text-center shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Pending Proofs</p>
          <p className="text-xl font-black text-amber-500 mt-1 font-mono">{totalPendingVerify}</p>
        </div>
        <div className="bg-white border border-slate-200 p-3.5 rounded text-center shadow-sm">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Settled Claims</p>
          <p className="text-xl font-black text-emerald-600 mt-1 font-mono">{totalClaimed}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t">
        <button
          onClick={() => {
            setActiveTab('claims');
            setSelectedItemForUPI(null);
          }}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
            activeTab === 'claims'
              ? 'border-blue-900 text-blue-900 font-black'
              : 'border-transparent text-slate-500 hover:text-blue-900'
          }`}
        >
          Active Claims ({pendingClaims.length + approvedPendingPayment.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('inventory');
            setSelectedItemForUPI(null);
          }}
          className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-all cursor-pointer ${
            activeTab === 'inventory'
              ? 'border-blue-900 text-blue-900 font-black'
              : 'border-transparent text-slate-500 hover:text-blue-900'
          }`}
        >
          Live Inventory ({items.length})
        </button>
      </div>

      {/* UPI QR Payment Modal Simulation */}
      {selectedItemForUPI && (
        <div className="bg-white p-5 border border-slate-200 rounded shadow-lg space-y-4 animate-fade-in">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <h4 className="font-display font-black text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-blue-600"></span>
              Simulate UPI Escrow Release
            </h4>
            <button
              onClick={() => setSelectedItemForUPI(null)}
              className="text-slate-400 hover:text-red-500 font-bold cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex flex-col items-center text-center space-y-3">
            <p className="text-xs text-slate-500 leading-relaxed uppercase tracking-wider font-semibold">
              Scan BharatQR to pay platform fee and release finder's 30% micro-reward automatically.
            </p>

            {/* UPI QR Code representation */}
            <div className="p-3 bg-slate-50 rounded border border-slate-200 relative">
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
              <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Payable Amount</p>
              <p className="text-xl font-black text-blue-900 font-mono">₹{selectedItemForUPI.serviceFee}</p>
              <p className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 uppercase tracking-wider">
                ✓ Includes ₹{selectedItemForUPI.rewardAmount} finder reward
              </p>
            </div>
          </div>

          <button
            onClick={handleSettleSubmit}
            disabled={isProcessingUPI}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-widest rounded shadow-lg shadow-blue-200 transition-all cursor-pointer flex items-center justify-center gap-1.5"
          >
            {isProcessingUPI ? 'Securing Escrow Settlement...' : 'Simulate UPI Payment Success'}
          </button>
        </div>
      )}

      {/* Tabs content */}
      {activeTab === 'claims' && !selectedItemForUPI && (
        <div className="space-y-4">
          <h3 className="font-display font-black text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
            <span className="w-1.5 h-4 bg-blue-600"></span>
            Pending Reviews ({pendingClaims.length + approvedPendingPayment.length})
          </h3>

          {/* Pending Reviews list */}
          {pendingClaims.map((item) => (
            <div
              key={item.id}
              className="bg-white border border-slate-200 rounded p-4 space-y-4 shadow-sm"
            >
              {/* Item Info Header */}
              <div className="flex gap-3 pb-3 border-b border-slate-100">
                <div className="w-12 h-12 rounded overflow-hidden shrink-0 border border-slate-200 bg-slate-50">
                  <img src={item.clearImg} className="w-full h-full object-cover" alt="Item preview" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide">{item.name}</h4>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Hub Location: {item.location}</p>
                  <p className="text-[10px] text-blue-900 font-black uppercase tracking-wider font-mono">Sub ID: {item.submissionId}</p>
                </div>
              </div>

              {/* Submitter details and proof */}
              {item.proof && (
                <div className="space-y-2.5 text-xs text-slate-600 bg-slate-50 p-3 rounded border border-slate-100">
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-wider">
                    <div>
                      <p className="text-slate-400">Claimant Name:</p>
                      <p className="text-slate-800 font-black">{item.proof.fullName}</p>
                    </div>
                    <div>
                      <p className="text-slate-400">Mobile Contact:</p>
                      <p className="text-slate-800 font-black font-mono">{item.proof.mobileNumber}</p>
                    </div>
                  </div>

                  <div className="pt-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Submitted Proof Detail:</p>
                    <p className="italic text-slate-700 bg-white p-2.5 rounded border border-slate-200 mt-1 leading-relaxed text-xs">
                      "{item.proof.proofDetail}"
                    </p>
                  </div>

                  <div className="pt-1 flex items-center gap-1.5 text-emerald-600 font-bold text-[10px] uppercase tracking-wider">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Aadhaar Identity verified securely on platform
                  </div>
                </div>
              )}

              {/* Approve/Reject Action triggers */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleReject(item.id)}
                  className="w-full py-2 border border-red-500 text-red-500 rounded text-xs font-bold uppercase tracking-wider hover:bg-red-50 transition-colors cursor-pointer"
                >
                  Reject Claim
                </button>
                <button
                  onClick={() => handleApprove(item.id)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center justify-center gap-1"
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
              className="bg-amber-50 border border-amber-200 rounded p-4 space-y-4 shadow-sm"
            >
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded border border-amber-200">
                    Awaiting Settlement
                  </span>
                  <h4 className="font-black text-sm text-slate-800 uppercase tracking-wide mt-2">{item.name}</h4>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">Claimant: {item.proof?.fullName}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider">Service Fee</p>
                  <p className="text-sm font-black text-blue-900 font-mono">₹{item.serviceFee}</p>
                </div>
              </div>

              <div className="text-xs text-amber-900 leading-relaxed bg-white/70 p-3 rounded border border-amber-200">
                <p className="font-bold uppercase tracking-wider text-[10px]">Chennai Hub Escrow status:</p>
                <p className="mt-0.5 font-medium">Proof matches. Once claimant settles service fee of ₹{item.serviceFee} via UPI, the reward of <strong>₹{item.rewardAmount} (30%)</strong> releases to finder <strong>{item.reporterName}</strong> instantly.</p>
              </div>

              <button
                onClick={() => triggerUPISettlement(item)}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold uppercase tracking-widest shadow-md transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                Trigger UPI QR Settlement
              </button>
            </div>
          ))}

          {pendingClaims.length === 0 && approvedPendingPayment.length === 0 && (
            <div className="py-12 text-center bg-white border border-slate-200 rounded p-6">
              <ClipboardCheck className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mt-2">All claims processed!</p>
              <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider">
                There are no pending owner verification requests at Chennai hubs currently.
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'inventory' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-display font-black text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-blue-600"></span>
              Live Inventory Registry
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">All Chennai locations</span>
          </div>

          <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {items.map((item) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex gap-3 items-center">
                    <div className="w-10 h-10 rounded overflow-hidden border border-slate-200 bg-slate-50 shrink-0">
                      <img src={item.clearImg} className="w-full h-full object-cover" alt="preview" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wide leading-none">{item.name}</h4>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{item.location}</p>
                      <p className="text-[10px] text-slate-500 font-medium">Finder: {item.reporterName}</p>
                    </div>
                  </div>

                  <div className="text-right flex flex-col items-end gap-1 shrink-0">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border ${
                      item.status === 'Claimed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : item.status === 'Under verification' || item.status === 'Awaiting Approval'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      {item.status}
                    </span>
                    <span className="text-[9px] font-bold font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {item.submissionId}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
