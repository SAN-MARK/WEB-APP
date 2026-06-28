import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { QrCode, Camera, AlertCircle, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react';

interface QRScannerProps {
  onScanSuccess: (description: string, location: string) => void;
  onClose: () => void;
}

interface DemoTag {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
}

const DEMO_TAGS: DemoTag[] = [
  {
    id: 'FB-TAG-2091',
    name: 'Silver Keychain set with Honda Car Remote',
    category: 'Keys',
    description: 'Metallic FindBack Ring, 3 Keys, Black Honda Key FOB, scanned near T. Nagar Metro Gate A entrance.',
    location: 'T. Nagar Community Hub'
  },
  {
    id: 'FB-TAG-9043',
    name: 'Premium Tan Leather Wallet',
    category: 'Wallet',
    description: 'Tan leather bifold wallet with SBI debit card, passport photo of a student, and a Chennai transport card.',
    location: 'Adyar Hub, Chennai'
  },
  {
    id: 'FB-TAG-7712',
    name: 'Bose QuietComfort Noise-Cancelling Earbuds',
    category: 'Electronics',
    description: 'Matte black Bose charging case with single left earbud inside. Found near Velachery bypass road.',
    location: 'Velachery Recovery Hub'
  },
  {
    id: 'FB-TAG-5521',
    name: 'Blue Padded Backpack containing Office Files',
    category: 'Documents',
    description: 'Waterproof blue laptop bag containing educational certificates, standard stationary items, and a Chennai Metro card.',
    location: 'Anna Nagar West Hub'
  }
];

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose }) => {
  const [cameraActive, setCameraActive] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const [scannerError, setScannerError] = useState('');
  const [scannedTag, setScannedTag] = useState<DemoTag | null>(null);

  const qrRegionId = "findback-html5qr-reader";
  const html5QrRef = useRef<Html5Qrcode | null>(null);

  interface CameraDevice {
    id: string;
    label: string;
  }

  // Handle Demo Scan simulation
  const handleSimulateScan = (tag: DemoTag) => {
    setScannedTag(tag);
    setTimeout(() => {
      onScanSuccess(tag.description, tag.location);
    }, 1500);
  };

  // Start Camera Scanning using html5-qrcode
  const startCamera = async () => {
    try {
      setScannerError('');
      
      // Get list of available cameras
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        const deviceId = selectedCameraId || devices[0].id;
        setSelectedCameraId(deviceId);
        setHasPermission(true);

        // Initialize instance
        const html5Qrcode = new Html5Qrcode(qrRegionId);
        html5QrRef.current = html5Qrcode;

        await html5Qrcode.start(
          deviceId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // Check if tag decodes to a custom simulated string or fallback
            console.log("Scanned QR Text Successfully:", decodedText);
            // Auto populate item detail
            onScanSuccess(
              decodedText || "FindBack Custom QR Tag - Decoded Smart Ledger Description",
              "Chennai Central Hub"
            );
            // Stop scanning
            stopCamera();
          },
          (errorMessage) => {
            // Keep scanning, ignore common frame noise errors
          }
        );
        setCameraActive(true);
      } else {
        setScannerError('No camera devices detected on this computer.');
      }
    } catch (err: any) {
      console.warn("Camera init warning (common in iframe/sandbox preview):", err);
      setHasPermission(false);
      setScannerError('Camera access denied or blocked by iframe security constraints.');
    }
  };

  const stopCamera = async () => {
    if (html5QrRef.current && html5QrRef.current.isScanning) {
      try {
        await html5QrRef.current.stop();
        html5QrRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    setCameraActive(false);
  };

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (html5QrRef.current && html5QrRef.current.isScanning) {
        html5QrRef.current.stop().catch(err => console.error("Unmount stop error:", err));
      }
    };
  }, []);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden font-sans max-w-lg mx-auto my-4">
      {/* Header */}
      <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center border border-cyan-400">
            <QrCode className="w-4.5 h-4.5 text-cyan-400" />
          </div>
          <div>
            <h3 className="font-display font-black text-xs uppercase tracking-widest text-cyan-400">
              FindBack Smart Tag Reader
            </h3>
            <p className="text-[9px] text-slate-300 font-medium uppercase tracking-wider">
              Scan barcode tags to auto-fill lost item files
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest"
        >
          ✕ Close
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Main interactive UI switcher */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          
          {/* Camera View Area */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-blue-900" />
                Live Camera Input
              </h4>
              {cameraActive && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </div>

            <div className="relative border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50 overflow-hidden flex flex-col items-center justify-center min-h-[220px]">
              
              {/* html5-qrcode element container */}
              <div 
                id={qrRegionId} 
                className={`w-full max-w-[280px] h-full ${cameraActive ? 'block' : 'hidden'}`}
              />

              {!cameraActive && !scannedTag && (
                <div className="p-4 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center mx-auto">
                    <QrCode className="w-6 h-6 text-blue-900" />
                  </div>
                  <p className="text-xs text-slate-500 max-w-[180px] mx-auto leading-relaxed">
                    Initiate camera to scan standard 2D physical tag QR codes.
                  </p>
                  <button
                    onClick={startCamera}
                    className="bg-blue-900 hover:bg-blue-950 text-white font-bold py-2 px-4 rounded-xl text-[10px] uppercase tracking-widest cursor-pointer shadow-md inline-flex items-center gap-1.5"
                  >
                    Start Real Camera
                  </button>
                </div>
              )}

              {/* Success Visual Overlay */}
              {scannedTag && (
                <div className="absolute inset-0 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-white text-center space-y-3 animate-fade-in z-50">
                  <div className="w-14 h-14 bg-emerald-500/20 rounded-full flex items-center justify-center border border-emerald-400">
                    <CheckCircle2 className="w-9 h-9 text-emerald-400" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-emerald-400 font-black text-xs uppercase tracking-widest">Tag Found!</p>
                    <p className="font-mono text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 inline-block">
                      {scannedTag.id}
                    </p>
                  </div>
                  <p className="text-[11px] text-slate-300 max-w-[200px] leading-relaxed">
                    Auto-populating database item with <span className="text-white font-bold">{scannedTag.name}</span>.
                  </p>
                </div>
              )}
            </div>

            {/* Error messaging */}
            {scannerError && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 flex items-start gap-2 text-[10px] text-amber-800 leading-normal font-medium">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <div>
                  <p className="font-bold uppercase tracking-wider">Environment Info</p>
                  <p>{scannerError}</p>
                </div>
              </div>
            )}

            {cameraActive && (
              <button
                onClick={stopCamera}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl text-[10px] uppercase tracking-widest cursor-pointer border border-slate-200"
              >
                Stop Camera Feed
              </button>
            )}
          </div>

          {/* Interactive Tag Simulator */}
          <div className="space-y-3 border-t md:border-t-0 md:border-l border-slate-100 pt-4 md:pt-0 md:pl-5">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-900" />
                Demo Tag Simulator
              </h4>
              <span className="text-[9px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded uppercase border border-blue-100">
                Sandbox Mode
              </span>
            </div>

            <p className="text-[10px] text-slate-500 leading-relaxed">
              No physical barcode tag to scan right now? Click any of our demo Chennai transport & baggage tags below to simulate a real-time QR tag sync:
            </p>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {DEMO_TAGS.map((tag) => (
                <div
                  key={tag.id}
                  onClick={() => handleSimulateScan(tag)}
                  className="p-2.5 bg-slate-50 border border-slate-200 hover:border-blue-900 rounded-xl cursor-pointer transition-all text-left group hover:bg-blue-50/20"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-mono text-[9px] font-bold text-slate-400 group-hover:text-blue-900">
                      {tag.id}
                    </span>
                    <span className="text-[9px] font-extrabold uppercase text-blue-800 tracking-wider">
                      {tag.category}
                    </span>
                  </div>
                  <h5 className="text-[11px] font-black text-slate-800 uppercase mt-0.5 tracking-tight group-hover:text-blue-950">
                    {tag.name}
                  </h5>
                  <p className="text-[9px] text-slate-500 line-clamp-1 mt-0.5">
                    {tag.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Informative footer tip */}
        <div className="pt-4 border-t border-slate-100 text-[10.5px] text-slate-400 leading-relaxed">
          <span className="font-bold text-slate-600">How it works:</span> FindBack tags are distributed across bus depots, metro hubs, and taxi counters. Scanning instantly retrieves ownership ledger hashes to fast-track recoveries.
        </div>
      </div>
    </div>
  );
};
