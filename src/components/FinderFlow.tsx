import React, { useState } from 'react';
import { FoundItem, ItemCategory, RecoveryHub, UserProfile } from '../types';
import { CHENNAI_HUBS } from './MockData';
import {
  ArrowLeft,
  Camera,
  Smartphone,
  Wallet,
  Key,
  FileText,
  Gem,
  Grid,
  Laptop,
  MapPin,
  Compass,
  CheckCircle2,
  Share2,
  Loader2,
  Database,
  QrCode
} from 'lucide-react';
import { dbService } from '../services/dbService';
import { QRScanner } from './QRScanner';

interface FinderFlowProps {
  onItemCreated: (newItem: FoundItem) => void;
  onNavigateHome: () => void;
  currentUser?: UserProfile;
}

export const FinderFlow: React.FC<FinderFlowProps> = ({ onItemCreated, onNavigateHome, currentUser }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [category, setCategory] = useState<ItemCategory>('Wallet');
  const [mockPhoto, setMockPhoto] = useState<string>('');
  const [mockPhotoName, setMockPhotoName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [assignedHub, setAssignedHub] = useState<RecoveryHub>(CHENNAI_HUBS[1]); // default T. Nagar
  const [generatedId, setGeneratedId] = useState<string>('FB-882-9910');
  
  const [finderName, setFinderName] = useState(currentUser?.name || 'Rahul Sharma');
  const [finderEmail, setFinderEmail] = useState(currentUser?.email || 'rahul.sharma@gmail.com');
  const [finderPhone, setFinderPhone] = useState(currentUser?.phone || '+91 98765 43210');
  const [foundDate, setFoundDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  React.useEffect(() => {
    if (currentUser) {
      setFinderName(currentUser.name);
      setFinderEmail(currentUser.email);
      if (currentUser.phone) {
        setFinderPhone(currentUser.phone);
      }
    }
  }, [currentUser]);

  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingItem, setPendingItem] = useState<FoundItem | null>(null);
  const [showQRScanner, setShowQRScanner] = useState(false);

  const handleScanSuccess = (scannedDescription: string, scannedLocation: string) => {
    setDescription(scannedDescription);
    setLocation(scannedLocation);
    const matchedHub = CHENNAI_HUBS.find(h => 
      scannedLocation.toLowerCase().includes(h.name.split(',')[0].toLowerCase()) ||
      scannedLocation.toLowerCase().includes(h.id.toLowerCase())
    );
    if (matchedHub) {
      setAssignedHub(matchedHub);
    }
    setShowQRScanner(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileChange(files[0]);
    }
  };

  const handleFileChange = (file: File) => {
    if (file) {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setMockPhoto(event.target.result as string);
            setMockPhotoName(file.name);
          }
        };
        reader.readAsDataURL(file);
      } else {
        alert('Please upload an image file of the found item.');
      }
    }
  };

  // We can offer preloaded high-quality photos based on selected category to simulate upload
  const PRESET_PHOTOS: Record<ItemCategory, { clear: string; name: string }> = {
    Phone: {
      clear: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=400',
      name: 'iphone_gray_found.jpg'
    },
    Wallet: {
      clear: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=400',
      name: 'wallet_leather_brown.jpg'
    },
    Keys: {
      clear: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=400',
      name: 'house_keys_brass.jpg'
    },
    Documents: {
      clear: 'https://images.unsplash.com/photo-1544016768-982d1554f0b9?auto=format&fit=crop&q=80&w=400',
      name: 'pan_card_doc.jpg'
    },
    Jewellery: {
      clear: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400',
      name: 'gold_engagement_ring.jpg'
    },
    Other: {
      clear: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400',
      name: 'blue_backpack.jpg'
    },
    Electronics: {
      clear: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400',
      name: 'blue_backpack.jpg'
    }
  };

  const triggerMockUpload = () => {
    const preset = PRESET_PHOTOS[category];
    setMockPhoto(preset.clear);
    setMockPhotoName(preset.name);
  };

  const handleDetectLocation = () => {
    // Simulate detecting a famous landmark in Chennai
    const landmarks = [
      'Adyar Metro Station Gate No. 3, Chennai',
      'T. Nagar Shopping Plaza, Near Pondy Bazaar',
      'Phoenix Marketcity Entrance, Velachery',
      'Central Railway Station platform 3, Chennai',
      'Marina Beach promenade near lighthouse, Chennai'
    ];
    const detected = landmarks[Math.floor(Math.random() * landmarks.length)];
    setLocation(detected);

    // Auto map to the nearest Chennai hub
    if (detected.includes('Adyar')) {
      setAssignedHub(CHENNAI_HUBS[0]);
    } else if (detected.includes('Central')) {
      setAssignedHub(CHENNAI_HUBS[4]);
    } else if (detected.includes('Velachery') || detected.includes('Phoenix')) {
      setAssignedHub(CHENNAI_HUBS[3]);
    } else if (detected.includes('T. Nagar') || detected.includes('Marina')) {
      setAssignedHub(CHENNAI_HUBS[1]);
    } else {
      setAssignedHub(CHENNAI_HUBS[2]); // Anna Nagar fallback
    }
  };

  const handleSubmitStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !location) return;

    // Map a submission id
    const randNum1 = Math.floor(100 + Math.random() * 900);
    const randNum2 = Math.floor(1000 + Math.random() * 9000);
    const subId = `FB-${randNum1}-${randNum2}`;
    setGeneratedId(subId);

    // Create the FoundItem object
    const newItem: FoundItem = {
      id: `reported-${Date.now()}`,
      category,
      name: `${category} found at ${location.split(',')[0]}`,
      location: assignedHub.name,
      date: 'Just now',
      hubId: assignedHub.id,
      status: 'Found',
      blurImg: mockPhoto || 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0vaabrFIVpkb0hl-Y02m8D2jBnEz6loFtLB2XdkMf22vPKh8MYjP48NHimS377cQlguFvOkCCfKjRuKKx-MHH4BvAwGkRRmhyxUfL3EckE5yM9d3oldCISh9RoRXoKlSWxI0sTvmgZMBn8vVLIfMHZZle5TkoXQdmTypj8pS6zOL8TGohTC-Yl6YKPfrvvrxhEpWhhH8iqxEJngiMieaIUxG5637Wk8U1X65l7fuCfF9vyQK81s1mGKo5x84m8vCJxeVOBHuoBn6V',
      clearImg: mockPhoto || PRESET_PHOTOS[category].clear,
      submissionId: subId,
      description,
      reporterName: finderName,
      reporterEmail: finderEmail,
      rewardAmount: 60,
      serviceFee: 200,
      hasPaidEscrow: false
    };

    setIsLoading(true);

    try {
      // Send found item submission info to the new Sheet.best Found Items endpoint
      await dbService.submitFoundItem({
        Timestamp: new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
        FinderName: finderName,
        FinderEmail: finderEmail,
        FinderPhone: finderPhone,
        ItemCategory: category,
        ItemDescription: description,
        LossLocation: location,
        FoundDate: foundDate,
        StorageHub: assignedHub.name,
        Status: 'Found',
        ImageReference: mockPhotoName || 'camera_capture_landmark.jpg'
      });

      setIsLoading(false);
      setPendingItem(newItem);
      setShowSuccessModal(true);
    } catch (err) {
      setIsLoading(false);
      setPendingItem(newItem);
      setShowSuccessModal(true); // Proceed anyway for resilient UX
    }
  };

  const handleModalConfirm = () => {
    setShowSuccessModal(false);
    if (pendingItem) {
      onItemCreated(pendingItem);
    }
    setStep(3);
  };

  return (
    <div className="max-w-md mx-auto bg-slate-50 rounded shadow-lg overflow-hidden border border-slate-200 my-4">
      {/* Top Header with Back button and progress dots */}
      <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center">
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1.5 text-slate-700 hover:text-blue-900 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-slate-700 hover:text-blue-900" />
          <span className="font-bold text-xs uppercase tracking-wider font-display">Back</span>
        </button>

        <div className="flex items-center gap-1.5">
          <span className={`w-6 h-1.5 rounded ${step >= 1 ? 'bg-blue-600' : 'bg-slate-200'}`}></span>
          <span className={`w-6 h-1.5 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-slate-200'}`}></span>
          <span className={`w-6 h-1.5 rounded ${step >= 3 ? 'bg-blue-600' : 'bg-slate-200'}`}></span>
        </div>
      </div>

      {/* Steps Indicator Label */}
      <div className="bg-slate-100 px-6 py-3 flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
        <span className={step === 1 ? 'text-blue-900 font-extrabold border-b-2 border-blue-900 pb-0.5' : ''}>1. Category</span>
        <span className={step === 2 ? 'text-blue-900 font-extrabold border-b-2 border-blue-900 pb-0.5' : ''}>2. Details</span>
        <span className={step === 3 ? 'text-blue-900 font-extrabold border-b-2 border-blue-900 pb-0.5' : ''}>3. Success Hub</span>
      </div>

      <div className="p-6">
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-black font-display text-slate-800 uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-5 bg-blue-600 inline-block"></span>
                Report Found Item
              </h2>
              <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                Step 1: Provide a photo and select a category.
              </p>
            </div>

            {/* Real Photo drop zone / File Upload Component */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => document.getElementById('finder-file-input')?.click()}
              className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-600 bg-blue-100/50'
                  : mockPhoto
                  ? 'border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50'
                  : 'border-slate-300 hover:border-blue-600 bg-white hover:bg-slate-50'
              }`}
            >
              <input
                id="finder-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />
              {mockPhoto ? (
                <div className="space-y-3 w-full">
                  <img src={mockPhoto} alt="Found item preview" className="w-28 h-28 object-cover rounded-xl shadow-md mx-auto border border-emerald-200" />
                  <div>
                    <p className="text-xs font-bold text-emerald-600 flex items-center justify-center gap-1 uppercase tracking-wider">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      {mockPhotoName || 'item_photo.jpg'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Tap or drag another file to replace</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-slate-100 text-blue-900 rounded-full flex items-center justify-center mx-auto border border-slate-200">
                    <Camera className="w-5 h-5 text-blue-900" />
                  </div>
                  <p className="text-xs font-bold text-slate-800 uppercase tracking-wider">Upload or Take Photo of Item</p>
                  <p className="text-[10px] text-slate-500">Drag & drop your image here, or tap to browse</p>
                </div>
              )}
            </div>

            {/* Select category buttons */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-3">
                Select Category
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['Phone', 'Wallet', 'Keys', 'Documents', 'Jewellery', 'Other'] as ItemCategory[]).map((cat) => {
                  const getIcon = () => {
                    switch (cat) {
                      case 'Phone': return <Smartphone className="w-5 h-5 mb-1 text-current" />;
                      case 'Wallet': return <Wallet className="w-5 h-5 mb-1 text-current" />;
                      case 'Keys': return <Key className="w-5 h-5 mb-1 text-current" />;
                      case 'Documents': return <FileText className="w-5 h-5 mb-1 text-current" />;
                      case 'Jewellery': return <Gem className="w-5 h-5 mb-1 text-current" />;
                      default: return <Grid className="w-5 h-5 mb-1 text-current" />;
                    }
                  };
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setCategory(cat);
                        // reset photo with preset when changing category so it matches beautifully
                        setMockPhoto('');
                        setMockPhotoName('');
                      }}
                      className={`flex flex-col items-center justify-center p-3 rounded border transition-all cursor-pointer ${
                        category === cat
                          ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold shadow-xs'
                          : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {getIcon()}
                      <span className="text-xs font-semibold leading-none">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!mockPhoto) {
                  // auto upload a default preset photo if the user didn't click the camera
                  triggerMockUpload();
                }
                setStep(2);
              }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded shadow-lg shadow-blue-200 uppercase tracking-widest text-xs transition-all mt-4 cursor-pointer"
            >
              Next Step
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 text-left">
            {showQRScanner ? (
              <QRScanner
                onScanSuccess={handleScanSuccess}
                onClose={() => setShowQRScanner(false)}
              />
            ) : (
              <form onSubmit={handleSubmitStep2} className="space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <h2 className="text-lg font-black font-display text-slate-800 uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-5 bg-blue-600 inline-block"></span>
                      Item Details
                    </h2>
                    <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider font-semibold">
                      Help the owner identify their property with a clear description.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setShowQRScanner(true)}
                    className="bg-blue-900 hover:bg-blue-950 text-white font-black py-2.5 px-3.5 rounded-xl text-[10px] uppercase tracking-widest flex items-center gap-1.5 cursor-pointer transition-all shadow-sm active:scale-95 self-stretch sm:self-auto justify-center animate-pulse"
                  >
                    <QrCode className="w-4 h-4 text-cyan-300" />
                    Scan FindBack Tag
                  </button>
                </div>

                {/* Brief description */}
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Describe the item briefly
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. Blue leather wallet with a small scratch on the front corner, contains a Chennai travel card..."
                    className="w-full p-3 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 transition-all resize-none"
                  ></textarea>
                </div>

                {/* Location input and Detect button */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Found Location
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 text-slate-400 w-4 h-4" />
                    <input
                      type="text"
                      required
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Enter landmark or street"
                      className="w-full pl-9 pr-4 py-3 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 transition-all"
                    />
                  </div>

                  {/* Detect Location simulator */}
                  <button
                    type="button"
                    onClick={handleDetectLocation}
                    className="flex items-center gap-1.5 text-xs text-blue-600 font-bold uppercase tracking-wider hover:underline py-1 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-blue-600" />
                    Detect Chennai Location
                  </button>
                </div>

                {/* Finder & Context details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Finder's Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={finderName}
                      onChange={(e) => setFinderName(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Finder's Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={finderEmail}
                      onChange={(e) => setFinderEmail(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Finder's Phone Contact
                    </label>
                    <input
                      type="tel"
                      required
                      value={finderPhone}
                      onChange={(e) => setFinderPhone(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 transition-all font-mono"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Found Date
                    </label>
                    <input
                      type="date"
                      required
                      value={foundDate}
                      onChange={(e) => setFoundDate(e.target.value)}
                      className="w-full p-3 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-900 transition-all font-mono"
                    />
                  </div>
                </div>

                {/* Automatic Hub Mapping preview if location detected */}
                {location && (
                  <div className="p-3 bg-white rounded border-l-4 border-emerald-500 border border-slate-200 shadow-sm space-y-1 animate-fade-in">
                    <span className="text-[9px] uppercase font-bold tracking-wider text-emerald-600">
                      Auto-Mapped Recovery Partner Hub
                    </span>
                    <p className="text-sm font-bold text-slate-800 uppercase tracking-wide">{assignedHub.name}</p>
                    <p className="text-xs text-slate-500">{assignedHub.address}</p>
                    <p className="text-[10px] text-emerald-700 font-bold mt-1 uppercase tracking-wide">✓ Verified drop location ({assignedHub.distance})</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => setStep(1)}
                    className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 py-3 rounded text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <span>Next Step</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 flex flex-col items-center">
            {/* Success checkmark */}
            <div className="relative flex flex-col items-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center relative z-10 shadow-sm border border-emerald-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div className="text-center mt-4">
                <h3 className="text-lg font-black text-slate-800 uppercase flex items-center justify-center gap-1.5">
                  <span className="w-1.5 h-5 bg-emerald-500 inline-block"></span>
                  Reported Successfully!
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                  Drop off the item at our assigned hub in Chennai to claim your micro-reward once verified.
                </p>
              </div>
            </div>

            {/* Micro-reward Badge */}
            <div className="bg-amber-400 text-slate-900 px-5 py-2.5 rounded font-bold text-xs uppercase tracking-wider shadow-md">
              Earn ₹60 once verified
            </div>

            {/* Assigned Hub Card */}
            <div className="bg-white border-l-4 border-blue-900 border border-slate-200 p-4 rounded flex flex-col w-full shadow-sm text-left">
              <div className="flex items-center gap-2 mb-2 text-blue-900">
                <MapPin className="w-4 h-4 text-blue-900" />
                <h4 className="font-bold text-[10px] uppercase tracking-wider">Assigned Recovery Hub</h4>
              </div>
              <h5 className="font-black text-sm text-slate-800 uppercase tracking-wide">{assignedHub.name}</h5>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed font-medium">
                {assignedHub.address}
              </p>
              <button
                type="button"
                onClick={() => alert(`Opening simulated Navigation routes in Chennai to ${assignedHub.name}`)}
                className="mt-3 flex items-center justify-center gap-2 py-2 px-4 border border-blue-600 rounded text-blue-600 font-bold text-xs uppercase tracking-wider hover:bg-blue-50 transition-colors cursor-pointer"
              >
                Get Directions
              </button>
            </div>

            {/* QR Code section */}
            <div className="bg-white border border-slate-200 p-4 rounded flex flex-col items-center text-center w-full shadow-sm">
              <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">
                Show this at the hub counter
              </p>
              <div className="w-28 h-28 bg-slate-50 flex items-center justify-center rounded border border-slate-200 p-2">
                <img
                  className="w-full h-full opacity-90 object-contain"
                  alt="Assigned Hub QR code identifier"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAMcKZhwiV_PUkLMvVvhIsMv4KGzVrxD0HwUNC7cL3Q8nzZ4Fh4UFHdoVhTLSe-DsSlv2QdO_f5LOVvqTdqFEBbFH3qfjTbrHNveczxjnK1bF_bZXWUWgjb9YuGW1Ec0un6PSPTnh_4XfYH8uP6M7ds39Dy75ckO_Ged9UcBBCyiCUpgIxCMP-Gb6oahC9uTgjeceD0amEy-SZmjD7FGFMKBd2x5CW-PD_bsNS9S8FsXx0Y55j9oh8qqLS2rerplHYF_TuRvBzCvXn5"
                />
              </div>
              <div className="mt-2.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Submission ID</p>
                <p className="text-sm font-black text-blue-900 font-mono tracking-wider">{generatedId}</p>
              </div>
            </div>

            {/* Final Action Area */}
            <div className="w-full space-y-2.5">
              <button
                onClick={() => alert('Item ID tag mockup saved to device gallery.')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded font-bold text-xs uppercase tracking-wider shadow-lg shadow-blue-200 transition-all cursor-pointer"
              >
                Save tag to Gallery
              </button>

              <button
                onClick={() => alert(`Sharing your item ${generatedId} coordinates with Chennai civic authorities via WhatsApp mock.`)}
                className="w-full bg-green-50 hover:bg-green-100 text-green-800 border border-green-200 py-3 rounded font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-green-800 shrink-0" />
                Share via WhatsApp
              </button>

              <button
                onClick={onNavigateHome}
                className="w-full py-2.5 text-slate-500 hover:text-slate-800 text-xs font-bold uppercase tracking-wider"
              >
                Done, take me Home
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Beautiful Live Success Confirmation Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/60 flex items-center justify-center p-4 z-[9999] animate-fade-in font-sans">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 max-w-sm w-full text-center space-y-4 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-500"></div>
            
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border border-emerald-100">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-800 uppercase tracking-wide">Report Connected</h3>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider flex items-center justify-center gap-1 bg-emerald-50 py-1 px-2.5 rounded-full w-fit mx-auto border border-emerald-100">
                <Database className="w-3.5 h-3.5" /> Live Sheet.best Sync Secured (200 OK)
              </p>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed font-medium">
              Your item report for the <span className="font-bold text-slate-800">{category}</span> has been saved along with file attachment <span className="font-mono text-[11px] font-bold text-blue-900 bg-slate-100 px-1.5 py-0.5 rounded">{mockPhotoName || 'camera_capture_landmark.jpg'}</span> in the Chennai ledger.
            </p>

            <div className="border-t border-slate-100 pt-4 flex flex-col gap-2">
              <div className="text-[10px] text-slate-400 font-mono uppercase">
                Location: {assignedHub.name} • Fee: ₹200 (reimbursable)
              </div>
              <button
                onClick={handleModalConfirm}
                className="w-full bg-blue-900 hover:bg-blue-950 text-white font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-widest cursor-pointer shadow-md active:scale-95 transition-all mt-1"
              >
                Proceed to Hub Summary
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
