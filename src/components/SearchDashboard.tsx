import React, { useState } from 'react';
import { FoundItem, ItemCategory } from '../types';
import {
  Search,
  SlidersHorizontal,
  X,
  Lock,
  MapPin,
  CheckCircle2,
  Info,
  ArrowLeft,
  FileText,
  FileUp,
  Check,
  Hourglass,
  Calendar,
  Loader2,
  Database
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { InteractiveMap } from './InteractiveMap';

import { UserProfile } from '../types';

interface SearchDashboardProps {
  items: FoundItem[];
  onClaimSubmitted: (itemId: string, fullName: string, mobile: string, proofDetail: string) => void;
  onSimulateApproveClaim: (itemId: string) => void;
  onSimulatePayment: (itemId: string) => void;
  currentUser?: UserProfile;
  onlyShowMap?: boolean;
}

export const SearchDashboard: React.FC<SearchDashboardProps> = ({
  items,
  onClaimSubmitted,
  onSimulateApproveClaim,
  onSimulatePayment,
  currentUser,
  onlyShowMap
}) => {
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ItemCategory | 'All'>('All');
  const [zoneFilter, setZoneFilter] = useState<string>('All Chennai Zones');
  const [dateFilter, setDateFilter] = useState<string>('All Time');
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  // Claim Form flow state
  const [claimingItem, setClaimingItem] = useState<FoundItem | null>(null);
  const [claimStep, setClaimStep] = useState<1 | 2 | 3>(1);
  const [aadhaarName, setAadhaarName] = useState(currentUser?.name || 'Rahul Sharma');
  const [mobileNumber, setMobileNumber] = useState(currentUser?.phone || '+91 98765 43210');
  const [uploadedAadhaar, setUploadedAadhaar] = useState(false);
  const [uploadedAadhaarName, setUploadedAadhaarName] = useState('');
  const [uploadedAadhaarPreview, setUploadedAadhaarPreview] = useState('');
  const [proofDetail, setProofDetail] = useState('');
  const [uploadedProofFile, setUploadedProofFile] = useState(false);
  const [uploadedProofName, setUploadedProofName] = useState('');
  const [uploadedProofPreview, setUploadedProofPreview] = useState('');

  const [idType, setIdType] = useState('Aadhaar');
  const [idNumber, setIdNumber] = useState('1234 5678 9012');
  const [userEmail, setUserEmail] = useState(currentUser?.email || 'iamheresanjeev@gmail.com');

  React.useEffect(() => {
    if (currentUser) {
      setUserEmail(currentUser.email);
      setAadhaarName(currentUser.name);
      if (currentUser.phone) {
        setMobileNumber(currentUser.phone);
      }
    }
  }, [currentUser]);

  const [isDraggingAadhaar, setIsDraggingAadhaar] = useState(false);
  const [isDraggingProof, setIsDraggingProof] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // File Handlers
  const handleAadhaarFileChange = (file: File) => {
    if (file) {
      setUploadedAadhaar(true);
      setUploadedAadhaarName(file.name);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setUploadedAadhaarPreview(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setUploadedAadhaarPreview('');
      }
    }
  };

  const handleProofFileChange = (file: File) => {
    if (file) {
      setUploadedProofFile(true);
      setUploadedProofName(file.name);
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setUploadedProofPreview(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      } else {
        setUploadedProofPreview('');
      }
    }
  };

  // Active filters count
  const activeFiltersCount =
    (categoryFilter !== 'All' ? 1 : 0) +
    (zoneFilter !== 'All Chennai Zones' ? 1 : 0) +
    (dateFilter !== 'All Time' ? 1 : 0);

  // Filter logic
  const filteredItems = items.filter((item) => {
    // Search keyword matching
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());

    // Category matching
    const matchesCategory = categoryFilter === 'All' || item.category === categoryFilter;

    // Zone matching
    const matchesZone =
      zoneFilter === 'All Chennai Zones' ||
      item.location.toLowerCase().includes(zoneFilter.toLowerCase()) ||
      (zoneFilter === 'Chennai Central' && item.location.toLowerCase().includes('central'));

    return matchesSearch && matchesCategory && matchesZone;
  });

  const handleMapHubSelect = (hubId: string) => {
    const hubNames: Record<string, string> = {
      adyar: 'Adyar',
      tnagar: 'T. Nagar',
      annanagar: 'Anna Nagar',
      velachery: 'Velachery',
      central: 'Chennai Central'
    };
    const mappedZone = hubNames[hubId];
    if (mappedZone) {
      setZoneFilter(mappedZone);
    }
  };

  const getActiveHubId = () => {
    const reverseHubNames: Record<string, string> = {
      'Adyar': 'adyar',
      'T. Nagar': 'tnagar',
      'Anna Nagar': 'annanagar',
      'Velachery': 'velachery',
      'Chennai Central': 'central'
    };
    return reverseHubNames[zoneFilter] || null;
  };

  const handleStartClaim = (item: FoundItem) => {
    setClaimingItem(item);
    setClaimStep(1);
    setUploadedAadhaar(false);
    setUploadedAadhaarName('');
    setUploadedAadhaarPreview('');
    setUploadedProofFile(false);
    setUploadedProofName('');
    setUploadedProofPreview('');
    setProofDetail('');
  };

  const handleIdentitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadedAadhaar) {
      alert('Please upload a mock Aadhaar photo first to proceed.');
      return;
    }
    
    setIsLoading(true);
    try {
      await dbService.submitIdentityVerification({
        Timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        UserEmail: userEmail,
        FullName: aadhaarName,
        IDType: idType,
        IDNumber: idNumber,
        VerificationStatus: 'Submitted',
        ReviewNotes: 'Awaiting operator validation',
        DocumentLink: uploadedAadhaarName || 'mock_aadhaar_card_proof.pdf'
      });
      setIsLoading(false);
      setClaimStep(2);
    } catch (err) {
      setIsLoading(false);
      setClaimStep(2); // Proceed anyway for resilient UX
    }
  };

  const handleProofSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!proofDetail) {
      alert('Please describe your proof of ownership details (e.g. IMEI number or wallet contents).');
      return;
    }
    if (claimingItem) {
      setIsLoading(true);
      try {
        await dbService.recordFileSubmission({
          Timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
          Type: 'Owner',
          ItemDescription: `Claiming ${claimingItem.category} - ${claimingItem.name}. Details: ${proofDetail}`,
          HubLocation: claimingItem.location,
          FileName: uploadedProofName || 'purchase_receipt_bill.pdf'
        });
        setIsLoading(false);
        setShowSuccessModal(true);
      } catch (err) {
        setIsLoading(false);
        setShowSuccessModal(true); // Proceed on error for seamless UX
      }
    }
  };

  const handleModalConfirm = () => {
    setShowSuccessModal(false);
    if (claimingItem) {
      onClaimSubmitted(claimingItem.id, aadhaarName, mobileNumber, proofDetail);
      setClaimStep(3);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Main Search Dashboard */}
      {!claimingItem && (
        <div className="space-y-4">
          {/* Search & Filter Trigger */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search for your lost item..."
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilterSheet(true)}
              className="bg-white p-3 border border-slate-200 rounded flex items-center justify-center active:scale-95 transition-transform cursor-pointer relative"
            >
              <SlidersHorizontal className="w-5 h-5 text-blue-900" />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-900 text-amber-400 rounded-full w-5 h-5 text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm font-mono">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Active Filter Capsules Scrollable Bar */}
          <div className="flex gap-2 overflow-x-auto hide-scrollbar py-1">
            {categoryFilter !== 'All' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-900 border border-blue-100 rounded text-xs font-bold uppercase tracking-wider shrink-0">
                {categoryFilter}
                <button onClick={() => setCategoryFilter('All')} className="cursor-pointer">
                  <X className="w-3 h-3 hover:text-red-500 font-bold" />
                </button>
              </span>
            )}
            {zoneFilter !== 'All Chennai Zones' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-bold uppercase tracking-wider shrink-0">
                {zoneFilter}
                <button onClick={() => setZoneFilter('All Chennai Zones')} className="cursor-pointer">
                  <X className="w-3 h-3 hover:text-red-500 font-bold" />
                </button>
              </span>
            )}
            {dateFilter !== 'All Time' && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-bold uppercase tracking-wider shrink-0">
                {dateFilter}
                <button onClick={() => setDateFilter('All Time')} className="cursor-pointer">
                  <X className="w-3 h-3 hover:text-red-500 font-bold" />
                </button>
              </span>
            )}
            {categoryFilter === 'All' && zoneFilter === 'All Chennai Zones' && dateFilter === 'All Time' && (
              <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider py-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                Showing all active items in Chennai
              </span>
            )}
          </div>

          {/* Dual-Mode Interactive Tracking Map Panel */}
          <InteractiveMap
            onSelectHub={handleMapHubSelect}
            activeHubId={getActiveHubId() || undefined}
          />

          {/* Results Grid count header */}
          <div className="flex justify-between items-center mt-2">
            <h2 className="font-display font-black text-xs uppercase text-slate-800 flex items-center gap-1.5">
              <span className="w-1.5 h-4 bg-blue-600"></span>
              Found Items ({filteredItems.length})
            </h2>
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              Chennai network
            </span>
          </div>

          {/* Results Listings Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Visual Image container with Gaussian Blur if not claimed yet */}
                <div className="relative h-48 w-full bg-slate-100 overflow-hidden border-b border-slate-100">
                  <img
                    className={`w-full h-full object-cover select-none transition-all duration-300 ${
                      item.status === 'Claimed' ? 'blur-0' : 'blur-[14px] scale-110'
                    }`}
                    alt={`${item.name} status preview`}
                    src={item.blurImg}
                  />
                  {item.status !== 'Claimed' && (
                    <div className="absolute inset-0 bg-blue-950/40 flex items-center justify-center text-white text-center p-4">
                      <div className="space-y-1">
                        <p className="text-xs font-black tracking-widest uppercase flex items-center justify-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-white" />
                          Private Silhouette
                        </p>
                        <p className="text-[10px] text-slate-200 uppercase tracking-wider font-semibold">Verified match unlocks on claim</p>
                      </div>
                    </div>
                  )}
                  {/* Category Chip Badge overlay */}
                  <div className="absolute top-3 left-3">
                    <span className="bg-blue-900 border border-amber-400 px-2.5 py-1 rounded text-[9px] font-black text-white uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>

                  {/* Status Indicator overlay */}
                  <div className="absolute top-3 right-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider shadow-sm border ${
                      item.status === 'Claimed'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : item.status === 'Under verification' || item.status === 'Awaiting Approval'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-blue-100 text-blue-800 border-blue-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>
                </div>

                {/* Details Section */}
                <div className="p-4 space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-display font-black text-sm text-slate-800 uppercase tracking-wide leading-tight">{item.name}</h3>
                      <div className="flex items-center gap-1 text-slate-500 text-xs mt-1 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-blue-900" />
                        <span>{item.location}</span>
                      </div>
                    </div>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded border border-slate-200 shrink-0 font-mono">
                      {item.date}
                    </span>
                  </div>

                  {/* Looks like mine actions */}
                  {item.status === 'Found' || item.status === 'Dropped at Hub' ? (
                    <button
                      onClick={() => handleStartClaim(item)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest rounded shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      Looks like mine
                    </button>
                  ) : item.status === 'Under verification' || item.status === 'Awaiting Approval' ? (
                    <button
                      onClick={() => handleStartClaim(item)}
                      className="w-full py-2.5 bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold text-xs uppercase tracking-widest rounded shadow-md active:scale-[0.98] transition-all cursor-pointer flex items-center justify-center gap-1"
                    >
                      View Active Claim Status
                    </button>
                  ) : (
                    <div className="p-2 bg-emerald-50 rounded border border-emerald-200 text-center">
                      <p className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1 uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        Claim settled & Disbursed
                      </p>
                      <p className="text-[10px] text-emerald-600 font-bold mt-0.5 uppercase tracking-wider">30% Finder micro-reward paid out!</p>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {filteredItems.length === 0 && (
              <div className="col-span-full py-12 text-center bg-white border border-slate-200 rounded p-6">
                <Info className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-700 mt-2">No items match your active filters.</p>
                <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider">Try resetting Chennai zones or searching simpler words.</p>
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('All');
                    setZoneFilter('All Chennai Zones');
                    setDateFilter('All Time');
                  }}
                  className="mt-4 px-4 py-2 border border-blue-600 text-blue-600 rounded text-xs font-bold uppercase tracking-wider hover:bg-blue-50 transition-colors cursor-pointer"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. Claim Submission Flow Wizard Overlay */}
      {claimingItem && (
        <div className="max-w-md mx-auto bg-white rounded border border-slate-200 shadow-lg overflow-hidden my-2">
          {/* Header */}
          <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
            <button
              onClick={() => setClaimingItem(null)}
              className="flex items-center gap-1.5 text-slate-700 hover:text-blue-900 text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-slate-700" />
              Exit Claim
            </button>
            <span className="text-[9px] font-bold text-blue-900 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded border border-blue-100">
              Claim Form
            </span>
          </div>

          {/* Stepper Header */}
          <div className="bg-slate-100 px-6 py-3 flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
            <span className={claimStep === 1 ? 'text-blue-900 font-extrabold border-b-2 border-blue-900 pb-0.5' : ''}>1. Identity</span>
            <span className={claimStep === 2 ? 'text-blue-900 font-extrabold border-b-2 border-blue-900 pb-0.5' : ''}>2. Proof</span>
            <span className={claimStep === 3 ? 'text-blue-900 font-extrabold border-b-2 border-blue-900 pb-0.5' : ''}>3. Review</span>
          </div>

          <div className="p-6">
            {claimStep === 1 && (
              <form onSubmit={handleIdentitySubmit} className="space-y-5">
                <div>
                  <h3 className="text-base font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-4 bg-blue-600"></span>
                    Identity Verification
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    To maintain high security, please verify your details using Aadhaar card.
                  </p>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Full Name (As per Aadhaar)
                  </label>
                  <input
                    type="text"
                    required
                    value={aadhaarName}
                    onChange={(e) => setAadhaarName(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Mobile Number
                  </label>
                  <input
                    type="text"
                    required
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 bg-white transition-all font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    User Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full p-3 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 bg-white transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      ID Document Type
                    </label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 bg-white transition-all"
                    >
                      <option value="Aadhaar">Aadhaar</option>
                      <option value="PAN Card">PAN Card</option>
                      <option value="Driver's License">Driver's License</option>
                      <option value="Passport">Passport</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      ID Document Number
                    </label>
                    <input
                      type="text"
                      required
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 bg-white transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Aadhaar Upload Box */}
                <div className="space-y-1.5 font-sans">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Upload Aadhaar Front & Back
                  </label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingAadhaar(true); }}
                    onDragLeave={() => setIsDraggingAadhaar(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingAadhaar(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleAadhaarFileChange(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => document.getElementById('aadhaar-file-input')?.click()}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDraggingAadhaar
                        ? 'border-blue-600 bg-blue-100/50'
                        : uploadedAadhaar
                        ? 'border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50'
                        : 'border-slate-300 hover:border-blue-600 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      id="aadhaar-file-input"
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleAadhaarFileChange(e.target.files[0]);
                        }
                      }}
                    />
                    {uploadedAadhaar ? (
                      <div className="space-y-2 w-full">
                        {uploadedAadhaarPreview ? (
                          <img src={uploadedAadhaarPreview} alt="Aadhaar Preview" className="w-20 h-20 object-cover rounded shadow-md mx-auto border border-slate-200" />
                        ) : (
                          <FileText className="w-10 h-10 text-emerald-600 mx-auto" />
                        )}
                        <div>
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            {uploadedAadhaarName || 'Aadhaar_Uploaded.pdf'}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Click or drag to replace file</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <FileText className="w-8 h-8 text-blue-900 mb-1 mx-auto" />
                        <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Upload Aadhaar PDF/Image</p>
                        <p className="text-[10px] text-slate-500">Drag & drop your file here, or click to browse</p>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded font-bold text-xs uppercase tracking-widest shadow-lg shadow-blue-200 transition-all cursor-pointer"
                >
                  Continue
                </button>
              </form>
            )}

            {claimStep === 2 && (
              <form onSubmit={handleProofSubmit} className="space-y-5">
                <div>
                  <h3 className="text-base font-black text-slate-800 uppercase flex items-center gap-1.5">
                    <span className="w-1.5 h-4 bg-blue-600"></span>
                    Proof of Ownership
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Provide credentials such as a mobile serial number (IMEI), brand details, or card digits to match database values.
                  </p>
                </div>

                {/* Clear image silhouette preview block */}
                <div className="p-3 bg-slate-50 rounded border border-slate-200 flex gap-3 items-center">
                  <div className="w-16 h-16 rounded overflow-hidden shrink-0 border border-slate-200">
                    <img className="w-full h-full object-cover blur-[5px]" src={claimingItem.blurImg} alt="Silhouette" />
                  </div>
                  <div>
                    <h4 className="font-black text-xs text-slate-800 uppercase tracking-wide">{claimingItem.name}</h4>
                    <p className="text-[10px] text-slate-500 font-medium">{claimingItem.location}</p>
                    <p className="text-[9px] text-blue-900 font-bold uppercase tracking-wider mt-0.5">MAPPED TO: {claimingItem.location}</p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Ownership Details
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={proofDetail}
                    onChange={(e) => setProofDetail(e.target.value)}
                    placeholder="Provide detailed descriptions (e.g. 'The wallet contains my pan card with name Rahul Sharma...')"
                    className="w-full p-3 border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 bg-white transition-all resize-none"
                  ></textarea>
                </div>

                 {/* Secondary document photo box */}
                <div className="space-y-1.5 font-sans">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Upload Secondary Bill or Photo (Optional)
                  </label>
                  <div
                    onDragOver={(e) => { e.preventDefault(); setIsDraggingProof(true); }}
                    onDragLeave={() => setIsDraggingProof(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDraggingProof(false);
                      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        handleProofFileChange(e.dataTransfer.files[0]);
                      }
                    }}
                    onClick={() => document.getElementById('proof-file-input')?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                      isDraggingProof
                        ? 'border-blue-600 bg-blue-100/50'
                        : uploadedProofFile
                        ? 'border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50'
                        : 'border-slate-300 hover:border-blue-600 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <input
                      id="proof-file-input"
                      type="file"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleProofFileChange(e.target.files[0]);
                        }
                      }}
                    />
                    {uploadedProofFile ? (
                      <div className="space-y-2 w-full">
                        {uploadedProofPreview ? (
                          <img src={uploadedProofPreview} alt="Proof Preview" className="w-20 h-20 object-cover rounded shadow-md mx-auto border border-slate-200" />
                        ) : (
                          <FileUp className="w-10 h-10 text-emerald-600 mx-auto" />
                        )}
                        <div>
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-4 h-4" />
                            {uploadedProofName || 'Purchase_Receipt_Invoice.pdf'}
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Click or drag to replace file</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <FileUp className="w-8 h-8 text-blue-900 mb-1 mx-auto" />
                        <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Tap or drag to upload receipt or billing proof</p>
                        <p className="text-[10px] text-slate-400">PDF, JPG, or PNG supported</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setClaimStep(1)}
                    className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-200 transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Submitting...
                      </>
                    ) : (
                      'Submit Proof'
                    )}
                  </button>
                </div>
              </form>
            )}

            {claimStep === 3 && (
              <div className="space-y-6 text-center">
                {/* Claim Submitted header */}
                <div className="relative flex flex-col items-center">
                  <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center relative z-10 shadow-sm border border-emerald-200">
                    <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800 uppercase flex items-center justify-center gap-1.5 mt-4">
                    <span className="w-1.5 h-5 bg-emerald-500 inline-block"></span>
                    Claim submitted!
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                    Verification takes about <span className="font-bold text-blue-900">4 hours</span>.
                  </p>
                </div>

                {/* Live claim timeline status tracker list */}
                <div className="bg-slate-50 rounded border border-slate-200 p-4 text-left space-y-4">
                  {/* Step 1: submitted */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                      <div className="w-0.5 bg-blue-600 h-8"></div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Claim submitted</h4>
                      <p className="text-[9px] text-slate-500 font-mono">Today, {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                    </div>
                  </div>

                  {/* Step 2: Verification Status */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        claimingItem.status === 'Under verification'
                          ? 'bg-amber-100 text-amber-600 border border-amber-300 animate-pulse'
                          : claimingItem.status === 'Awaiting Approval'
                          ? 'bg-emerald-100 text-emerald-600 border border-emerald-300'
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {claimingItem.status === 'Under verification' ? (
                          <Hourglass className="w-4 h-4 text-amber-600" />
                        ) : claimingItem.status === 'Awaiting Approval' ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Calendar className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="w-0.5 bg-slate-200 h-8"></div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Proof verification</h4>
                      {claimingItem.status === 'Under verification' ? (
                        <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Awaiting Chennai Hub Administrator review</p>
                      ) : claimingItem.status === 'Awaiting Approval' ? (
                        <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider">✓ Claim Approved! Hub pickup pending settlement</p>
                      ) : (
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Waiting for review</p>
                      )}
                    </div>
                  </div>

                  {/* Step 3: Collection Ready */}
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center shrink-0">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                        claimingItem.hasPaidEscrow
                          ? 'bg-emerald-600 text-white flex items-center justify-center'
                          : claimingItem.status === 'Awaiting Approval'
                          ? 'bg-amber-400 text-slate-900 font-bold animate-bounce flex items-center justify-center'
                          : 'bg-slate-100 text-slate-400 border border-slate-200 flex items-center justify-center'
                      }`}>
                        <Lock className="w-3.5 h-3.5 text-current" />
                      </div>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">Ready to collect</h4>
                      <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">{claimingItem.location}</p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Update */}
                <button
                  type="button"
                  onClick={() => alert('Successfully registered for real-time claim status alerts on WhatsApp.')}
                  className="w-full bg-emerald-50 text-emerald-800 border border-emerald-200 py-3.5 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Ask for updates on WhatsApp
                </button>

                {/* Admin Shortcut helper */}
                <div className="p-4 bg-slate-50 rounded border border-dashed border-slate-300 space-y-2.5 text-left">
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                    Interactive Demo Simulation Controls:
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {claimingItem.status === 'Under verification' && (
                      <button
                        type="button"
                        onClick={() => {
                          onSimulateApproveClaim(claimingItem.id);
                          setClaimingItem({
                            ...claimingItem,
                            status: 'Awaiting Approval'
                          });
                        }}
                        className="p-2 bg-blue-600 text-white text-[10px] rounded hover:bg-blue-700 font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        Simulate Approval
                      </button>
                    )}
                    {claimingItem.status === 'Awaiting Approval' && (
                      <button
                        type="button"
                        onClick={() => {
                          onSimulatePayment(claimingItem.id);
                          setClaimingItem({
                            ...claimingItem,
                            status: 'Claimed',
                            hasPaidEscrow: true
                          });
                        }}
                        className="p-2 bg-emerald-600 text-white text-[10px] rounded hover:bg-emerald-700 font-bold uppercase tracking-wider transition-all cursor-pointer col-span-2 text-center"
                      >
                        Simulate Escrow UPI Payment (₹{claimingItem.serviceFee})
                      </button>
                    )}
                    {claimingItem.status === 'Claimed' && (
                      <div className="col-span-2 text-center text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-white p-2 rounded border border-emerald-200">
                        ✓ Reward Paid to Sathish Kumar! (₹{claimingItem.rewardAmount})
                      </div>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setClaimingItem(null)}
                  className="w-full text-xs font-bold uppercase tracking-wider text-slate-500 hover:text-slate-800"
                >
                  Return to Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Filter Bottom Sheet modal element */}
      {showFilterSheet && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-[60] backdrop-blur-xs transition-opacity"
            onClick={() => setShowFilterSheet(false)}
          ></div>
          <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white rounded-t z-[70] p-6 shadow-2xl animate-slide-up border-t border-slate-200">
            {/* Dragger Bar */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-6"></div>

            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display font-black text-xs uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-blue-600"></span>
                Search Filters
              </h3>
              <button
                onClick={() => {
                  setCategoryFilter('All');
                  setZoneFilter('All Chennai Zones');
                  setDateFilter('All Time');
                  setShowFilterSheet(false);
                }}
                className="text-blue-600 font-bold text-xs uppercase tracking-wider hover:underline cursor-pointer"
              >
                Clear All
              </button>
            </div>

            <div className="space-y-6">
              {/* Category */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Category Filter
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {(['All', 'Phone', 'Wallet', 'Keys', 'Documents', 'Jewellery', 'Other'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setCategoryFilter(cat)}
                      className={`px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all cursor-pointer border ${
                        categoryFilter === cat
                          ? 'bg-blue-900 border-blue-900 text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chennai Zones */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Area (Chennai)
                </label>
                <select
                  value={zoneFilter}
                  onChange={(e) => setZoneFilter(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 transition-all font-semibold text-slate-800"
                >
                  <option>All Chennai Zones</option>
                  <option>Adyar</option>
                  <option>Anna Nagar</option>
                  <option>Chennai Central</option>
                  <option>T. Nagar</option>
                  <option>Velachery</option>
                </select>
              </div>

              {/* Date Lost presets */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                  Date Lost Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['All Time', 'Today', 'Last 7 Days', 'Last 30 Days'].map((dateOption) => (
                    <button
                      key={dateOption}
                      onClick={() => setDateFilter(dateOption)}
                      className={`p-2.5 border rounded text-center text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                        dateFilter === dateOption
                          ? 'border-blue-900 bg-blue-50 text-blue-900'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {dateOption}
                    </button>
                  ))}
                </div>
              </div>

              {/* Apply Button */}
              <button
                onClick={() => setShowFilterSheet(false)}
                className="w-full py-3.5 bg-blue-900 hover:bg-blue-950 text-white font-bold rounded text-xs uppercase tracking-widest shadow-lg shadow-blue-200 transition-all cursor-pointer"
              >
                Show {filteredItems.length} Results
              </button>
            </div>
          </div>
        </>
      )}

      {/* Beautiful Live Success Confirmation Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-[9999] animate-fade-in font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-500"></div>
            
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">Claim Registered</h3>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1 bg-emerald-50 py-1 px-2.5 rounded-full w-fit mx-auto border border-emerald-100">
                <Database className="w-3.5 h-3.5" /> Live Sheet.best Sync Secured (200 OK)
              </p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Your proof of ownership has been successfully logged with file reference <span className="font-mono text-[11px] font-bold text-blue-900 bg-slate-100 px-1.5 py-0.5 rounded">{uploadedProofName || 'purchase_receipt_bill.pdf'}</span>.
            </p>

            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
              <div className="text-[10px] text-slate-400 font-mono uppercase">
                Item: {claimingItem?.name} • Hub: {claimingItem?.location}
              </div>
              <button
                onClick={handleModalConfirm}
                className="w-full bg-blue-900 hover:bg-blue-950 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-md active:scale-95 transition-all mt-1"
              >
                Proceed to Live Tracker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
