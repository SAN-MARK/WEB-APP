import { useState, useEffect } from 'react';
import { FoundItem, UserProfile, ItemCategory, ItemStatus } from './types';
import { INITIAL_ITEMS, CHENNAI_HUBS } from './components/MockData';
import { WelcomeScreen } from './components/WelcomeScreen';
import { FinderFlow } from './components/FinderFlow';
import { SearchDashboard } from './components/SearchDashboard';
import { AdminHub } from './components/AdminHub';
import { NotificationDrawer } from './components/NotificationDrawer';
import { NotificationController } from './components/NotificationController';
import { HomeDashboard } from './components/HomeDashboard';
import { AccountSettings } from './components/AccountSettings';
import { apiRouter } from './services/apiRouter';
import {
  Info,
  Sliders,
  Bell,
  MapPin,
  Star,
  Home,
  Search,
  PlusCircle,
  RefreshCw,
  TrendingUp,
  UserCircle,
  Settings,
  User
} from 'lucide-react';

function AvatarImage({ user, className }: { user: UserProfile; className: string }) {
  return (
    <User className={`${className} text-slate-300 bg-slate-950 p-2`} />
  );
}

function mapRowToFoundItem(row: any, index: number): FoundItem {
  const category = (row.ItemCategory || 'Other') as ItemCategory;
  const name = row['Item Name'] || row.ItemName || (row.ItemCategory ? `${row.ItemCategory} found` : 'Found Item');
  const location = row.Location || row.LossLocation || row.StorageHub || 'Chennai';
  const description = row.Description || row.ItemDescription || '';
  const date = row['Date Found'] || row.FoundDate || 'Today';
  const statusRaw = row.Status || 'Available';
  
  let status: ItemStatus = 'Found';
  if (statusRaw === 'Under Review' || statusRaw === 'Under verification' || statusRaw === 'pending') {
    status = 'Under verification';
  } else if (statusRaw === 'Awaiting Approval') {
    status = 'Awaiting Approval';
  } else if (statusRaw === 'Claimed') {
    status = 'Claimed';
  } else if (statusRaw === 'Dropped at Hub') {
    status = 'Dropped at Hub';
  }

  const PRESET_BLUR_PHOTOS: Record<ItemCategory, string> = {
    Phone: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEpAJ-lhGR1WUgvwPr9auHDvcd1LyF6YwaDZnU8IjVl6MWqR0RaYRqEh11ZbEqcK61EtM9D2fYNdFMCbh2dCCVYCNRe82fxfIymhLSX-q1DWtrktuakxUWxHJUcvJMQo1DlOx-hxgAUHynMU5GxmRnVWWtsIbVYJDwzS8cPAmQH2NZSQyyLQ_jQoAf8MqojgALDFriP-7bYxcIXGRoOiu8bzAbUwKgGQ2c3IppvM3iTTK_ghch0yojVd9ikBeB2MEuPo6JeCbzOOCQ',
    Wallet: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0vaabrFIVpkb0hl-Y02m8D2jBnEz6loFtLB2XdkMf22vPKh8MYjP48NHimS377cQlguFvOkCCfKjRuKKx-MHH4BvAwGkRRmhyxUfL3EckE5yM9d3oldCISh9RoRXoKlSWxI0sTvmgZMBn8vVLIfMHZZle5TkoXQdmTypj8pS6zOL8TGohTC-Yl6YKPfrvvrxhEpWhhH8iqxEJngiMieaIUxG5637Wk8U1X65l7fuCfF9vyQK81s1mGKo5x84m8vCJxeVOBHuoBn6V',
    Keys: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDitxzszzX07L52mpJg5CYLz1BpxRVyD2Cm1u1FuUzSqoqC1AOYf-NEeIg9612Km-KaEBGHn7-Q51sGOZBWUkI20USfUb1VvK-wjz_7PRhLRufvoWsrNfQAR_gFHOEstHy2fQZPXxGLJ7UOMf08kOvGi8-WaDe8zshGM8VAbo7xoUNDZ5JL7Y6NI8fZYYtQNj0TlKBjmJg0nb9brZEmwZYYcsCJ5mAF_x2HUYy_JtZJx5sd745LgbWlkt3PPZvlovTkZ--bbfT04JWn',
    Documents: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEpAJ-lhGR1WUgvwPr9auHDvcd1LyF6YwaDZnU8IjVl6MWqR0RaYRqEh11ZbEqcK61EtM9D2fYNdFMCbh2dCCVYCNRe82fxfIymhLSX-q1DWtrktuakxUWxHJUcvJMQo1DlOx-hxgAUHynMU5GxmRnVWWtsIbVYJDwzS8cPAmQH2NZSQyyLQ_jQoAf8MqojgALDFriP-7bYxcIXGRoOiu8bzAbUwKgGQ2c3IppvM3iTTK_ghch0yojVd9ikBeB2MEuPo6JeCbzOOCQ',
    Jewellery: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDitxzszzX07L52mpJg5CYLz1BpxRVyD2Cm1u1FuUzSqoqC1AOYf-NEeIg9612Km-KaEBGHn7-Q51sGOZBWUkI20USfUb1VvK-wjz_7PRhLRufvoWsrNfQAR_gFHOEstHy2fQZPXxGLJ7UOMf08kOvGi8-WaDe8zshGM8VAbo7xoUNDZ5JL7Y6NI8fZYYtQNj0TlKBjmJg0nb9brZEmwZYYcsCJ5mAF_x2HUYy_JtZJx5sd745LgbWlkt3PPZvlovTkZ--bbfT04JWn',
    Other: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEpAJ-lhGR1WUgvwPr9auHDvcd1LyF6YwaDZnU8IjVl6MWqR0RaYRqEh11ZbEqcK61EtM9D2fYNdFMCbh2dCCVYCNRe82fxfIymhLSX-q1DWtrktuakxUWxHJUcvJMQo1DlOx-hxgAUHynMU5GxmRnVWWtsIbVYJDwzS8cPAmQH2NZSQyyLQ_jQoAf8MqojgALDFriP-7bYxcIXGRoOiu8bzAbUwKgGQ2c3IppvM3iTTK_ghch0yojVd9ikBeB2MEuPo6JeCbzOOCQ',
    Electronics: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCEpAJ-lhGR1WUgvwPr9auHDvcd1LyF6YwaDZnU8IjVl6MWqR0RaYRqEh11ZbEqcK61EtM9D2fYNdFMCbh2dCCVYCNRe82fxfIymhLSX-q1DWtrktuakxUWxHJUcvJMQo1DlOx-hxgAUHynMU5GxmRnVWWtsIbVYJDwzS8cPAmQH2NZSQyyLQ_jQoAf8MqojgALDFriP-7bYxcIXGRoOiu8bzAbUwKgGQ2c3IppvM3iTTK_ghch0yojVd9ikBeB2MEuPo6JeCbzOOCQ'
  };

  const PRESET_PHOTOS: Record<ItemCategory, string> = {
    Phone: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&q=80&w=400',
    Wallet: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=400',
    Keys: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=400',
    Documents: 'https://images.unsplash.com/photo-1544016768-982d1554f0b9?auto=format&fit=crop&q=80&w=400',
    Jewellery: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&q=80&w=400',
    Other: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400',
    Electronics: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400'
  };

  return {
    id: row.id || `api-${index}`,
    category,
    name,
    location,
    date,
    hubId: row.hubId || 'tnagar',
    status,
    blurImg: row.blurImg || PRESET_BLUR_PHOTOS[category],
    clearImg: row.clearImg || PRESET_PHOTOS[category],
    submissionId: row.submissionId || `FB-SUB-${index}`,
    description,
    reporterName: row.FinderName || 'Anonymous Finder',
    reporterEmail: row.FinderEmail || '',
    rewardAmount: Number(row.RewardAmount || row.rewardAmount || 60),
    hasPaidEscrow: row.hasPaidEscrow === 'true' || row.hasPaidEscrow === true || false,
    serviceFee: Number(row.ServiceFee !== undefined ? row.ServiceFee : (row.serviceFee !== undefined ? row.serviceFee : Math.round(Number(row.RewardAmount || row.rewardAmount || 60) * 0.3))),
    proof: row.OwnerProof ? {
      fullName: 'Owner',
      mobileNumber: '',
      proofDetail: row.OwnerProof,
      submittedAt: 'Just now',
      status: 'pending'
    } : undefined
  };
}

export default function App() {
  // Persistence state
  const [items, setItems] = useState<FoundItem[]>(() => {
    const saved = localStorage.getItem('findback_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  // Pull and Sync items from live Sheet.best API
  useEffect(() => {
    const syncItems = async () => {
      try {
        console.log("Syncing items from live Sheet.best Found Items API...");
        const liveRows = await apiRouter.fetchFoundItems();
        if (liveRows && liveRows.length > 0) {
          const mappedItems = liveRows.map((row, i) => mapRowToFoundItem(row, i));
          setItems((prev) => {
            const existingIds = new Set(mappedItems.map(item => item.id));
            const remainingLocal = prev.filter(item => !existingIds.has(item.id) && !item.id.startsWith('api-') && !item.id.startsWith('reported-'));
            return [...mappedItems, ...remainingLocal];
          });
        }
      } catch (error) {
        console.error("Failed to sync items with live Sheet.best API:", error);
      }
    };
    syncItems();
  }, []);

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('findback_user');
    return saved
      ? JSON.parse(saved)
      : {
          name: 'Sanjeev Kumar',
          email: 'iamheresanjeev@gmail.com',
          avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAT1fC-30ox59euXgQKm-BDmqTSUP4em7OCuo2ucolhgUXj8-Qk_GrbXbXWUvh1YIy6SJnrodb_biiQfDUfzx4MrheXBoiONSaH62QImMlFnVeRAVxwojptdqtPy9tPfUDKz0MLXR1bYK08eXCJmIFmhA4FpS8425FH4HEeFty-nuVAj1C-8zfD0IsHmNOKvmoqgIw2TXW95w9wU9gQiV0CzKDav8qVVoS0l6a2L7HLwnhP6xGSvfUT7ixs5BJQD9EEinA49bhz9-n7',
          balance: 120, // pre-loaded reward points
          reportedCount: 2,
          claimedCount: 1
        };
  });

  const [activeRole, setActiveRole] = useState<'finder' | 'owner' | 'admin'>('owner');
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'home' | 'search' | 'report' | 'rewards' | 'admin'>(() => {
    const saved = localStorage.getItem('findback_user');
    return saved ? 'home' : 'welcome';
  });
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    const saved = localStorage.getItem('findback_isAdminLoggedIn');
    return saved === 'true';
  });

  const [autoClaimItemId, setAutoClaimItemId] = useState<string | null>(null);

  // Show dynamic banner notifications
  const showBanner = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 5000);
  };

  // Deep-linking URL Parser hook
  useEffect(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    const hash = window.location.hash;
    
    let matchedId = '';
    
    // 1. Path match: /item/[ITEM_ID]
    const pathMatch = path.match(/\/item\/([^/]+)/);
    if (pathMatch) {
      matchedId = pathMatch[1];
    }
    
    // 2. Hash match: #/item/[ITEM_ID]
    if (!matchedId) {
      const hashMatch = hash.match(/#\/item\/([^/]+)/);
      if (hashMatch) {
        matchedId = hashMatch[1];
      }
    }
    
    // 3. Query string match: ?item=[ITEM_ID] or ?itemId=[ITEM_ID]
    if (!matchedId) {
      const urlParams = new URLSearchParams(search);
      matchedId = urlParams.get('item') || urlParams.get('itemId') || '';
    }
    
    if (matchedId) {
      const foundItem = items.find(i => i.id === matchedId || i.submissionId === matchedId);
      if (foundItem) {
        // Switch screens and auto-start claim wizard
        setCurrentScreen('search');
        setActiveRole('owner');
        setAutoClaimItemId(foundItem.id);
        showBanner(`✓ Deep-linked to item ${foundItem.name}! Opening verification flow...`);
        
        try {
          // Clear deep-link path safely in browser address bar without reload
          window.history.replaceState({}, document.title, window.location.origin);
        } catch (e) {
          console.error('History replacement state error:', e);
        }
      }
    }
  }, [items]);

  const isProd = typeof import.meta !== 'undefined' && (import.meta as any).env ? !!(import.meta as any).env.PROD : false;

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Sync to local storage on changes
  useEffect(() => {
    localStorage.setItem('findback_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('findback_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('findback_isAdminLoggedIn', String(isAdminLoggedIn));
  }, [isAdminLoggedIn]);

  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  const refreshUnreadCount = async () => {
    if (!user || !user.email) return;
    try {
      const liveData = await apiRouter.fetchNotifications();
      const localStored = localStorage.getItem('findback_notifications_local');
      const localList = localStored ? JSON.parse(localStored) : [];
      const combined = [...liveData, ...localList];
      const userEmailLower = user.email.toLowerCase().trim();
      const filtered = combined.filter(n => {
        if (!n.UserID) return false;
        const uid = n.UserID.toLowerCase().trim();
        return uid === userEmailLower || uid === 'all';
      });
      // Deduplicate
      const seen = new Set<string>();
      const deduped = [];
      for (const item of filtered) {
        const key = `${item.Message}_${item.Timestamp}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(item);
        }
      }
      const count = deduped.filter(n => n.ReadStatus === 'false' || !n.ReadStatus || n.ReadStatus === false).length;
      setUnreadCount(count);
    } catch (e) {
      console.warn('[API Warning] refreshUnreadCount error:', e);
    }
  };

  useEffect(() => {
    if (user && user.email) {
      refreshUnreadCount();
      const interval = setInterval(refreshUnreadCount, 15000); // Check every 15 seconds
      return () => clearInterval(interval);
    }
  }, [user]);

  // Sum up pending service fees for items reported by this user that are not yet claimed
  const pendingServiceFeeTotal = items
    .filter(item => (item.reporterEmail || '').trim().toLowerCase() === user.email.trim().toLowerCase() && item.status !== 'Claimed')
    .reduce((sum, item) => sum + (item.serviceFee || 0), 0);

  // Onboarding Login entry callback
  const handleLogin = (name: string, email: string, phone: string, avatarUrl?: string) => {
    setIsAdminLoggedIn(false);
    setUser((prev) => ({
      ...prev,
      name,
      email,
      phone,
      avatarUrl: avatarUrl || ''
    }));
  };

  const handleUpdateUser = (updatedUser: Partial<UserProfile>) => {
    setUser((prev) => {
      const next = { ...prev, ...updatedUser };
      localStorage.setItem('findback_user', JSON.stringify(next));
      return next;
    });
  };

  const handleAdminLogin = (name: string, email: string) => {
    setIsAdminLoggedIn(true);
    setUser((prev) => ({
      ...prev,
      name,
      email,
      phone: 'Admin Operator',
      avatarUrl: '' // Reset to empty to trigger dynamic fallback letter avatar!
    }));
    setActiveRole('admin');
    setCurrentScreen('admin');
    showBanner(`Logged in successfully as Administrator ${name}`);
  };

  // Onboarding role selection callback
  const handleStartFlow = (role: 'finder' | 'owner') => {
    setIsAdminLoggedIn(false);
    setActiveRole(role);
    if (role === 'finder') {
      setCurrentScreen('report');
    } else {
      setCurrentScreen('home');
    }
    showBanner(`Successfully signed in to FindBack Chennai as ${role === 'finder' ? 'Finder' : 'Owner'}`);
  };

  // 1. Finder Flow submit callback
  const handleItemCreated = (newItem: FoundItem) => {
    setItems((prev) => [newItem, ...prev]);
    setUser((prev) => ({
      ...prev,
      reportedCount: prev.reportedCount + 1
    }));
    showBanner(`Item "${newItem.name}" added to Chennai database and mapped to Hub successfully!`);
  };

  // 2. Owner Claim Form submit callback
  const handleClaimSubmitted = (itemId: string, fullName: string, mobile: string, proofDetail: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: 'Under verification',
              proof: {
                fullName,
                mobileNumber: mobile,
                proofDetail,
                submittedAt: new Date().toLocaleDateString(),
                status: 'pending'
              }
            }
          : item
      )
    );
    showBanner(`Proof of Ownership submitted for review at Chennai Center.`);
  };

  // 3. Admin: Approve proof callback
  const handleApproveProof = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: 'Awaiting Approval',
              proof: item.proof ? { ...item.proof, status: 'approved' } : undefined
            }
          : item
      )
    );
    showBanner('Claim proof approved! Mapped item is awaiting UPI release settlement.');
  };

  // 3. Admin: Reject proof callback
  const handleRejectProof = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: 'Found',
              proof: undefined
            }
          : item
      )
    );
    showBanner('Claim proof rejected due to mismatched credentials. Item returned to inventory.');
  };

  // 3. Admin: Settle UPI escrow payment release
  const handleSettleUPI = (itemId: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? {
              ...item,
              status: 'Claimed',
              hasPaidEscrow: true
            }
          : item
      )
    );

    // Find the item to give 30% micro-reward to finder (simulated balance increase)
    const matchedItem = items.find((item) => item.id === itemId);
    const reward = matchedItem ? matchedItem.rewardAmount : 60;

    setUser((prev) => ({
      ...prev,
      balance: prev.balance + reward,
      claimedCount: prev.claimedCount + 1
    }));

    showBanner(`🎉 UPI settlement complete! Finder received ₹${reward} micro-reward.`);
  };

  // Quick reset to clear demo state
  const handleResetDemo = () => {
    localStorage.removeItem('findback_items');
    localStorage.removeItem('findback_user');
    localStorage.removeItem('findback_isAdminLoggedIn');
    window.location.reload();
  };

  return (
    <div className="w-screen h-screen bg-[#090d16] text-slate-800 font-sans overflow-hidden select-none flex items-center justify-center">
      
      {/* Dynamic Toast Notification Banner */}
      {notificationMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[340px] md:w-[400px] bg-slate-900 text-white p-3.5 rounded shadow-2xl z-[999] text-xs font-bold flex items-center gap-2 border-l-4 border-amber-400 animate-fade-in">
          <Info className="text-amber-400 w-5 h-5 shrink-0" />
          <span className="flex-1 leading-tight">{notificationMsg}</span>
        </div>
      )}

      {isDesktop ? (
        /* ==========================================
           DESKTOP VIEWPORT / MULTI-COLUMN INTERFACE 
           ========================================== */
        <div className="w-full h-full flex overflow-hidden bg-slate-950">
          
          {/* Sophisticated Left Sidebar Utility Panel */}
          <aside className="w-80 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-full p-6 text-white select-none">
            
            <div className="space-y-6">
              {/* App Brand Header */}
              <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setCurrentScreen('home')}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-b from-blue-950 to-blue-900 flex items-center justify-center border border-slate-700 relative overflow-hidden shadow-inner">
                  <div className="absolute inset-0.5 rounded-full border border-slate-500/40 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-cyan-400 filter drop-shadow-[0_0_2px_rgba(34,211,238,0.8)] animate-pulse" />
                  </div>
                </div>
                <div>
                  <span className="font-display font-black text-xl text-white tracking-tighter uppercase block">FindBack</span>
                  <span className="text-[9px] font-mono font-bold tracking-widest text-cyan-400 block uppercase">Chennai Hub Ledger</span>
                </div>
              </div>

              {/* Sophisticated Google User Session Profile Banner */}
              <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 flex flex-col items-center text-center space-y-3 shadow-inner">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-amber-400 relative shadow-lg flex items-center justify-center">
                    <AvatarImage user={user} className="w-full h-full text-xl" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-emerald-500 w-4 h-4 rounded-full border-2 border-slate-900 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-wide text-white uppercase">{user.name}</h4>
                  <p className="text-[10px] text-cyan-300 font-mono font-medium truncate max-w-[220px]">{user.email}</p>
                  <span className="inline-block bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mt-1.5">
                    Google Authorized
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 w-full pt-1.5 border-t border-slate-800">
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/60 text-center">
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Reported</p>
                    <p className="text-sm font-black text-white font-mono mt-0.5">{user.reportedCount}</p>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/60 text-center">
                    <p className="text-[8px] text-slate-500 font-bold uppercase tracking-wider">Rewards</p>
                    <p className="text-sm font-black text-amber-400 font-mono mt-0.5">₹{user.balance}</p>
                  </div>
                </div>
              </div>

              {/* Sidebar Navigation Links */}
              {currentScreen !== 'welcome' && (
                <nav className="space-y-1">
                  <p className="text-[9px] font-black tracking-widest text-slate-500 uppercase px-3 mb-2">Navigation</p>
                  
                  <button
                    onClick={() => setCurrentScreen('home')}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                      currentScreen === 'home'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Home className={`w-4 h-4 ${currentScreen === 'home' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Home Dashboard</span>
                  </button>

                  <button
                    onClick={() => setCurrentScreen('search')}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                      currentScreen === 'search'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Search className={`w-4 h-4 ${currentScreen === 'search' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Search Ledger</span>
                  </button>

                  <button
                    onClick={() => setCurrentScreen('report')}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                      currentScreen === 'report'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <PlusCircle className={`w-4 h-4 ${currentScreen === 'report' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Report Lost Tag</span>
                  </button>

                  <button
                    onClick={() => setCurrentScreen('rewards')}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                      currentScreen === 'rewards'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Star className={`w-4 h-4 ${currentScreen === 'rewards' ? 'text-white' : 'text-slate-400'}`} />
                    <span>My Rewards</span>
                  </button>

                  <button
                    onClick={() => setCurrentScreen('settings')}
                    className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                      currentScreen === 'settings'
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                    }`}
                  >
                    <Settings className={`w-4 h-4 ${currentScreen === 'settings' ? 'text-white' : 'text-slate-400'}`} />
                    <span>Account Settings</span>
                  </button>

                  {isAdminLoggedIn && activeRole === 'admin' && (
                    <button
                      onClick={() => setCurrentScreen('admin')}
                      className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all text-left cursor-pointer ${
                        currentScreen === 'admin'
                          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                      }`}
                    >
                      <Sliders className={`w-4 h-4 ${currentScreen === 'admin' ? 'text-white' : 'text-slate-400'}`} />
                      <span>Hub Operator Console</span>
                    </button>
                  )}
                </nav>
              )}
            </div>

            {/* Sidebar Bottom Controls & PERSPECTIVE SWITCHER */}
            <div className="space-y-4">
              {!isProd && (
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-xs">
                  <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                    <Sliders className="w-3.5 h-3.5" />
                    PERSPECTIVE SIMULATOR
                  </span>
                  <div className={`grid ${isAdminLoggedIn ? 'grid-cols-3' : 'grid-cols-2'} gap-1 bg-slate-900 rounded p-0.5 border border-slate-800`}>
                    {((isAdminLoggedIn ? ['owner', 'finder', 'admin'] : ['owner', 'finder']) as ('owner' | 'finder' | 'admin')[]).map((role) => (
                      <button
                        key={role}
                        onClick={() => {
                          setActiveRole(role);
                          if (currentScreen === 'welcome') {
                            setCurrentScreen('home');
                          } else if (role === 'admin') {
                            setCurrentScreen('admin');
                          } else if (role === 'finder') {
                            setCurrentScreen('report');
                          } else {
                            setCurrentScreen('home');
                          }
                          showBanner(`Switched to "${role.toUpperCase()}" workflow perspective.`);
                        }}
                        className={`px-1.5 py-1 rounded-[6px] text-[8px] uppercase font-black tracking-tight text-center transition-all cursor-pointer ${
                          activeRole === role ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Diagnostic Footer */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-[9px] text-slate-400 font-mono">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>99.98% UPTIME</span>
                  </div>
                  <span>5 HUBS ACTIVE</span>
                </div>
                <button
                  onClick={handleResetDemo}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer border border-slate-700/50"
                >
                  Reset Chennai Ledger Database
                </button>
              </div>
            </div>
          </aside>

          {/* Desktop Right side Content Frame */}
          <main className="flex-grow h-full flex flex-col bg-slate-50 overflow-hidden">
            
            {/* Desktop Top Header Bar */}
            <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-8 shrink-0 shadow-sm">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black font-display text-slate-900 uppercase tracking-tight">
                  {currentScreen === 'welcome' && 'Welcome Onboarding'}
                  {currentScreen === 'home' && 'FindBack Chennai Dashboard'}
                  {currentScreen === 'search' && 'Interactive Recovery Ledger'}
                  {currentScreen === 'report' && 'Submit Lost Item Drop-off'}
                  {currentScreen === 'rewards' && 'Civic Rewards Ledger'}
                  {currentScreen === 'admin' && 'Hub Operator Console'}
                </h1>
                <span className="text-[10px] bg-blue-100 text-blue-800 border border-blue-200 font-black tracking-wider uppercase px-2 py-0.5 rounded-md">
                  Perspective: {activeRole}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[9px] text-slate-400 uppercase font-bold">Reward Balance</p>
                  <p className="text-sm font-black text-emerald-600 font-mono">₹{user.balance}</p>
                </div>
                <button
                  onClick={() => setIsNotificationDrawerOpen(true)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 p-2 rounded-xl relative cursor-pointer"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-600 rounded-full border border-white animate-pulse"></span>
                  )}
                </button>
              </div>
            </header>

            {/* Desktop Content Body Area */}
            <div className="flex-grow momentum-scroll p-8 bg-slate-50 select-text">
              
              {currentScreen === 'welcome' && (
                <div className="max-w-md mx-auto my-12">
                  <WelcomeScreen
                    onStartFlow={handleStartFlow}
                    onLogin={handleLogin}
                    onAdminLogin={handleAdminLogin}
                  />
                </div>
              )}

              {currentScreen === 'home' && (
                <HomeDashboard
                  user={user}
                  items={items}
                  onStartFlow={handleStartFlow}
                  setActiveRole={setActiveRole}
                  setCurrentScreen={setCurrentScreen}
                  handleClaimSubmitted={handleClaimSubmitted}
                  handleApproveProof={handleApproveProof}
                  handleSettleUPI={handleSettleUPI}
                />
              )}

              {currentScreen === 'search' && (
                <div className="max-w-5xl mx-auto">
                  <SearchDashboard
                    items={items}
                    onClaimSubmitted={handleClaimSubmitted}
                    onSimulateApproveClaim={handleApproveProof}
                    onSimulatePayment={handleSettleUPI}
                    currentUser={user}
                    autoClaimItemId={autoClaimItemId}
                    onClearAutoClaim={() => setAutoClaimItemId(null)}
                  />
                </div>
              )}

              {currentScreen === 'report' && (
                <div className="max-w-xl mx-auto">
                  <FinderFlow
                    onItemCreated={handleItemCreated}
                    onNavigateHome={() => setCurrentScreen('home')}
                    currentUser={user}
                  />
                </div>
              )}

              {currentScreen === 'rewards' && (
                <div className="max-w-xl mx-auto space-y-6">
                  <div className="bg-blue-900 text-white p-6 rounded-2xl border-l-4 border-amber-400 shadow-md text-center">
                    <Star className="w-10 h-10 text-amber-400 fill-amber-400 mx-auto" />
                    <h3 className="font-display font-black text-lg mt-1.5 uppercase tracking-wider">FindBack Civic Wallet</h3>
                    <p className="text-blue-200 text-[11px] uppercase tracking-wider font-semibold">Chennai Hub Ledger Balance</p>

                    <div className="mt-4 pt-4 border-t border-blue-800">
                      <p className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">Withdrawal Account</p>
                      <p className="text-3xl font-black text-amber-400 mt-1 font-mono">₹{user.balance}</p>
                      <p className="text-[10px] text-emerald-400 font-bold mt-1.5 uppercase tracking-wider">✓ Active Auto-payout to {user.email.split('@')[0]}@okaxis</p>
                    </div>
                  </div>

                  {/* Pending Service Fee Card */}
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-left shadow-sm flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-400 text-slate-900 rounded-xl">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-display font-black text-sm text-slate-800 uppercase tracking-wider">
                          Pending Service Fee: ₹{pendingServiceFeeTotal}
                        </h4>
                        <p className="text-[10px] text-slate-600 uppercase tracking-wide mt-0.5">
                          Calculated 30% on active reported items
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Profile Statistics */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 text-left space-y-3.5 shadow-sm">
                    <h4 className="font-display font-black text-xs text-slate-800 uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-4 bg-blue-600"></span>
                      Chennai Civic Records
                    </h4>
                    <div className="grid grid-cols-2 gap-4 divide-x divide-slate-200">
                      <div className="text-center">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Articles Reported</p>
                        <p className="text-xl font-black text-blue-900 mt-0.5 font-mono">{user.reportedCount}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Escrows Settled</p>
                        <p className="text-xl font-black text-blue-900 mt-0.5 font-mono">{user.claimedCount}</p>
                      </div>
                    </div>
                  </div>

                  {/* Payout channels list */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-5 text-left space-y-3.5 shadow-sm">
                    <h4 className="font-display font-black text-xs uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                      <span className="w-1.5 h-4 bg-emerald-500"></span>
                      Reward Settlements History
                    </h4>
                    <div className="divide-y divide-slate-100 text-xs text-slate-600">
                      <div className="py-2.5 flex justify-between">
                        <div>
                          <p className="font-bold text-slate-800">Tan Leather Wallet finder reward</p>
                          <p className="text-[10px] text-slate-400 font-mono">Completed • {user.email.split('@')[0]}@okaxis</p>
                        </div>
                        <span className="font-black text-emerald-600 shrink-0 font-mono">+₹60</span>
                      </div>
                      <div className="py-2.5 flex justify-between">
                        <div>
                          <p className="font-bold text-slate-800">Honda Key Fob locator reward</p>
                          <p className="text-[10px] text-slate-400 font-mono">Completed • {user.email.split('@')[0]}@okaxis</p>
                        </div>
                        <span className="font-black text-emerald-600 shrink-0 font-mono">+₹60</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {currentScreen === 'admin' && (
                <div className="max-w-5xl mx-auto space-y-6">
                  <AdminHub
                    items={items}
                    onApproveProof={handleApproveProof}
                    onRejectProof={handleRejectProof}
                    onSettleUPI={handleSettleUPI}
                  />
                </div>
              )}

              {currentScreen === 'settings' && (
                <div className="max-w-4xl mx-auto">
                  <AccountSettings
                    user={user}
                    onUpdateUser={handleUpdateUser}
                    showBanner={showBanner}
                  />
                </div>
              )}

            </div>
          </main>

        </div>
      ) : (
        /* ==========================================
           MOBILE PORTRAIT MODE / RIGID VIEWSTRUCTURE 
           ========================================== */
        <div className="w-full max-w-[480px] h-screen bg-slate-50 flex flex-col shadow-2xl relative border-x border-slate-800 overflow-hidden mx-auto">
          
          {/* Onboarding Mode Switcher for easily testing perspectives */}
          {!isProd && (
            <div className="bg-slate-900 text-slate-300 px-3 py-2 flex items-center justify-between gap-1.5 text-[10px] font-bold tracking-wider uppercase border-b-2 border-slate-800 shrink-0 select-none z-50">
              <span className="text-amber-400 flex items-center gap-1 font-display">
                <Sliders className="w-3 h-3" />
                Role:
              </span>
              <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700">
                {((isAdminLoggedIn ? ['owner', 'finder', 'admin'] : ['owner', 'finder']) as ('owner' | 'finder' | 'admin')[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setActiveRole(role);
                      if (currentScreen === 'welcome') {
                        setCurrentScreen('home');
                      } else if (role === 'admin') {
                        setCurrentScreen('admin');
                      } else if (role === 'finder') {
                        setCurrentScreen('report');
                      } else {
                        setCurrentScreen('home');
                      }
                      showBanner(`Switched view to "${role.toUpperCase()}".`);
                    }}
                    className={`px-2 py-0.5 rounded text-[8px] uppercase font-bold transition-all cursor-pointer ${
                      activeRole === role ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sticky Header Top App Bar */}
          {currentScreen !== 'welcome' && (
            <header className="sticky top-0 w-full z-40 bg-blue-900 text-white flex justify-between items-center px-4 py-3 border-b-4 border-amber-400 shrink-0 shadow-md select-none">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-gradient-to-b from-blue-950 to-blue-900 flex items-center justify-center border border-slate-700 relative overflow-hidden">
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                </div>
                <span className="font-display font-black text-base text-white tracking-tighter uppercase">FindBack</span>
              </div>

              {/* Dynamic Google User Session Portrait */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsNotificationDrawerOpen(true)}
                  className="text-white p-1 hover:bg-blue-800 rounded relative cursor-pointer"
                >
                  <Bell className="w-4.5 h-4.5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </button>
                <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-amber-400 relative shrink-0 flex items-center justify-center">
                  <AvatarImage user={user} className="w-full h-full text-xs" />
                </div>
              </div>
            </header>
          )}

          {/* Main Independent Touch Scrolling stage */}
          <main className="flex-grow momentum-scroll px-4 pt-4 pb-24 bg-slate-50 select-text">
            
            {currentScreen === 'welcome' && (
              <WelcomeScreen
                onStartFlow={handleStartFlow}
                onLogin={handleLogin}
                onAdminLogin={handleAdminLogin}
              />
            )}

            {currentScreen === 'home' && (
              <HomeDashboard
                user={user}
                items={items}
                onStartFlow={handleStartFlow}
                setActiveRole={setActiveRole}
                setCurrentScreen={setCurrentScreen}
                handleClaimSubmitted={handleClaimSubmitted}
                handleApproveProof={handleApproveProof}
                handleSettleUPI={handleSettleUPI}
              />
            )}

            {currentScreen === 'search' && (
              <SearchDashboard
                items={items}
                onClaimSubmitted={handleClaimSubmitted}
                onSimulateApproveClaim={handleApproveProof}
                onSimulatePayment={handleSettleUPI}
                currentUser={user}
                autoClaimItemId={autoClaimItemId}
                onClearAutoClaim={() => setAutoClaimItemId(null)}
              />
            )}

            {currentScreen === 'report' && (
              <FinderFlow
                onItemCreated={handleItemCreated}
                onNavigateHome={() => setCurrentScreen('home')}
                currentUser={user}
              />
            )}

            {currentScreen === 'rewards' && (
              <div className="space-y-5 animate-fade-in text-left">
                <div className="bg-blue-900 text-white p-5 rounded-2xl border-l-4 border-amber-400 shadow-md text-center">
                  <Star className="w-9 h-9 text-amber-400 fill-amber-400 mx-auto" />
                  <h3 className="font-display font-black text-base mt-1.5 uppercase tracking-wider">FindBack Civic Wallet</h3>
                  <p className="text-blue-200 text-[10px]">Chennai Ledger rewards balance</p>

                  <div className="mt-4 pt-3 border-t border-blue-800 text-center">
                    <p className="text-[9px] uppercase font-bold text-blue-300 tracking-wider">Withdrawable</p>
                    <p className="text-2xl font-black text-amber-400 mt-1 font-mono">₹{user.balance}</p>
                    <p className="text-[8px] text-emerald-400 font-bold mt-1.5 uppercase tracking-wider">✓ Instant UPI auto-settle</p>
                  </div>
                </div>

                {/* Pending Service Fee Card */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-left shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-400 text-slate-900 rounded-lg">
                      <TrendingUp className="w-4.5 h-4.5" />
                    </div>
                    <div>
                      <h4 className="font-display font-black text-xs text-slate-800 uppercase tracking-wider">
                        Pending Service Fee: ₹{pendingServiceFeeTotal}
                      </h4>
                      <p className="text-[9px] text-slate-600 uppercase tracking-wide mt-0.5">
                        Calculated 30% on active reported items
                      </p>
                    </div>
                  </div>
                </div>

                {/* Profile Statistics */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left space-y-3 shadow-sm">
                  <h4 className="font-display font-black text-[11px] text-slate-800 uppercase flex items-center gap-1.5">
                    <span className="w-1 h-3.5 bg-blue-600 inline-block"></span>
                    Civic Stats
                  </h4>
                  <div className="grid grid-cols-2 gap-2 divide-x divide-slate-100">
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Reported</p>
                      <p className="text-lg font-black text-blue-900 mt-0.5 font-mono">{user.reportedCount}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Settled</p>
                      <p className="text-lg font-black text-blue-900 mt-0.5 font-mono">{user.claimedCount}</p>
                    </div>
                  </div>
                </div>

                {/* Payout channels list */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 text-left space-y-3 shadow-sm">
                  <h4 className="font-display font-black text-[11px] uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                    <span className="w-1 h-3.5 bg-emerald-500 inline-block"></span>
                    Settlements History
                  </h4>
                  <div className="divide-y divide-slate-100 text-[11px] text-slate-600">
                    <div className="py-2 flex justify-between">
                      <div>
                        <p className="font-bold text-slate-800">Tan Wallet reward</p>
                        <p className="text-[9px] text-slate-400 font-mono">Completed</p>
                      </div>
                      <span className="font-black text-emerald-600 shrink-0 font-mono">+₹60</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentScreen === 'admin' && (
              <AdminHub
                items={items}
                onApproveProof={handleApproveProof}
                onRejectProof={handleRejectProof}
                onSettleUPI={handleSettleUPI}
              />
            )}

            {currentScreen === 'settings' && (
              <AccountSettings
                user={user}
                onUpdateUser={handleUpdateUser}
                showBanner={showBanner}
              />
            )}

          </main>

          {/* Sticky Footer */}
          <footer className="sticky bottom-12 w-full bg-slate-900 text-[8px] font-mono py-2 px-3 text-slate-400 shrink-0 flex justify-between items-center border-t border-slate-800 select-none z-40">
            <div className="flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
              <span>LIVE FEED STATUS: LIVE</span>
            </div>
            <div>UPTIME: 99.98%</div>
          </footer>

          {/* Sticky Bottom Navigation Bar (Visual 2) */}
          {currentScreen !== 'welcome' && (
            <nav className="absolute bottom-0 left-0 w-full flex justify-around items-center px-4 py-2 bg-white border-t border-slate-200 z-50 shadow-xl shrink-0 select-none">
              <button
                onClick={() => setCurrentScreen('home')}
                className={`flex flex-col items-center justify-center p-1.5 px-3 transition-all text-center rounded cursor-pointer ${
                  currentScreen === 'home'
                    ? 'text-blue-900 font-bold border-b-2 border-blue-900'
                    : 'text-slate-500 hover:text-blue-900'
                }`}
              >
                <Home className={`w-4.5 h-4.5 ${currentScreen === 'home' ? 'text-blue-900 fill-blue-900' : 'text-slate-500'}`} />
                <span className="text-[8px] font-bold mt-0.5 font-display uppercase tracking-wider">Home</span>
              </button>

              <button
                onClick={() => setCurrentScreen('search')}
                className={`flex flex-col items-center justify-center p-1.5 px-3 transition-all text-center rounded cursor-pointer ${
                  currentScreen === 'search'
                    ? 'text-blue-900 font-bold border-b-2 border-blue-900'
                    : 'text-slate-500 hover:text-blue-900'
                }`}
              >
                <Search className={`w-4.5 h-4.5 ${currentScreen === 'search' ? 'text-blue-900' : 'text-slate-500'}`} />
                <span className="text-[8px] font-bold mt-0.5 font-display uppercase tracking-wider">Search</span>
              </button>

              <button
                onClick={() => setCurrentScreen('report')}
                className={`flex flex-col items-center justify-center p-1.5 px-3 transition-all text-center rounded cursor-pointer ${
                  currentScreen === 'report'
                    ? 'text-blue-900 font-bold border-b-2 border-blue-900'
                    : 'text-slate-500 hover:text-blue-900'
                }`}
              >
                <PlusCircle className={`w-4.5 h-4.5 ${currentScreen === 'report' ? 'text-blue-900 fill-blue-900' : 'text-slate-500'}`} />
                <span className="text-[8px] font-bold mt-0.5 font-display uppercase tracking-wider">Report</span>
              </button>

              <button
                onClick={() => setCurrentScreen('rewards')}
                className={`flex flex-col items-center justify-center p-1.5 px-3 transition-all text-center rounded cursor-pointer ${
                  currentScreen === 'rewards'
                    ? 'text-blue-900 font-bold border-b-2 border-blue-900'
                    : 'text-slate-500 hover:text-blue-900'
                }`}
              >
                <Star className={`w-4.5 h-4.5 ${currentScreen === 'rewards' ? 'text-blue-900 fill-blue-900' : 'text-slate-500'}`} />
                <span className="text-[8px] font-bold mt-0.5 font-display uppercase tracking-wider">Rewards</span>
              </button>

              <button
                onClick={() => setCurrentScreen('settings')}
                className={`flex flex-col items-center justify-center p-1.5 px-3 transition-all text-center rounded cursor-pointer ${
                  currentScreen === 'settings'
                    ? 'text-blue-900 font-bold border-b-2 border-blue-900'
                    : 'text-slate-500 hover:text-blue-900'
                }`}
              >
                <Settings className={`w-4.5 h-4.5 ${currentScreen === 'settings' ? 'text-blue-900' : 'text-slate-500'}`} />
                <span className="text-[8px] font-bold mt-0.5 font-display uppercase tracking-wider">Settings</span>
              </button>
            </nav>
          )}

          <NotificationDrawer
            isOpen={isNotificationDrawerOpen}
            onClose={() => {
              setIsNotificationDrawerOpen(false);
              refreshUnreadCount();
            }}
            currentUser={user}
            onNavigateToItem={(itemId) => {
              setCurrentScreen('search');
              showBanner(`Navigated to detail for item: ${itemId}`);
            }}
          />

        </div>
      )}

    </div>
  );
}
