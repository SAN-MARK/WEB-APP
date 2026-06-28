import { useState, useEffect } from 'react';
import { FoundItem, UserProfile } from './types';
import { INITIAL_ITEMS, CHENNAI_HUBS } from './components/MockData';
import { WelcomeScreen } from './components/WelcomeScreen';
import { FinderFlow } from './components/FinderFlow';
import { SearchDashboard } from './components/SearchDashboard';
import { AdminHub } from './components/AdminHub';
import {
  Info,
  Sliders,
  Menu,
  Bell,
  MapPin,
  Star,
  Home,
  Search,
  PlusCircle,
  RefreshCw
} from 'lucide-react';

export default function App() {
  // Persistence state
  const [items, setItems] = useState<FoundItem[]>(() => {
    const saved = localStorage.getItem('findback_items');
    return saved ? JSON.parse(saved) : INITIAL_ITEMS;
  });

  const [user, setUser] = useState<UserProfile>(() => {
    const saved = localStorage.getItem('findback_user');
    return saved
      ? JSON.parse(saved)
      : {
          name: 'Rahul Sharma',
          email: 'rahul.sharma@gmail.com',
          avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAT1fC-30ox59euXgQKm-BDmqTSUP4em7OCuo2ucolhgUXj8-Qk_GrbXbXWUvh1YIy6SJnrodb_biiQfDUfzx4MrheXBoiONSaH62QImMlFnVeRAVxwojptdqtPy9tPfUDKz0MLXR1bYK08eXCJmIFmhA4FpS8425FH4HEeFty-nuVAj1C-8zfD0IsHmNOKvmoqgIw2TXW95w9wU9gQiV0CzKDav8qVVoS0l6a2L7HLwnhP6xGSvfUT7ixs5BJQD9EEinA49bhz9-n7',
          balance: 120, // pre-loaded reward points
          reportedCount: 2,
          claimedCount: 1
        };
  });

  const [activeRole, setActiveRole] = useState<'finder' | 'owner' | 'admin'>('owner');
  const [currentScreen, setCurrentScreen] = useState<'welcome' | 'home' | 'search' | 'report' | 'rewards' | 'admin'>('welcome');
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Sync to local storage on changes
  useEffect(() => {
    localStorage.setItem('findback_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('findback_user', JSON.stringify(user));
  }, [user]);

  // Show dynamic banner notifications
  const showBanner = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => {
      setNotificationMsg(null);
    }, 5000);
  };

  // Onboarding Login entry callback
  const handleLogin = (email: string) => {
    setUser((prev) => ({
      ...prev,
      email,
      name: email.split('@')[0].split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    }));
  };

  // Onboarding role selection callback
  const handleStartFlow = (role: 'finder' | 'owner') => {
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
    window.location.reload();
  };

  return (
    <div className="max-w-[375px] mx-auto bg-slate-50 min-h-screen relative shadow-2xl overflow-x-hidden flex flex-col border-x border-slate-300">
      
      {/* Dynamic Toast Notification Banner */}
      {notificationMsg && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 w-[340px] bg-slate-900 text-white p-3.5 rounded shadow-xl z-[999] text-xs font-bold flex items-center gap-2 border-l-4 border-amber-400 animate-fade-in">
          <Info className="text-amber-400 w-5 h-5 shrink-0" />
          <span className="flex-1 leading-tight">{notificationMsg}</span>
        </div>
      )}

      {/* Onboarding Mode Segment Switcher (Always visible in header for easily testing flows) */}
      <div className="bg-slate-900 text-slate-300 px-3 py-2 flex items-center justify-between gap-1.5 text-[10px] font-bold tracking-wider uppercase border-b-2 border-slate-800 shrink-0">
        <span className="text-amber-400 flex items-center gap-1">
          <Sliders className="w-3.5 h-3.5" />
          Test Roles:
        </span>
        <div className="flex bg-slate-800 rounded p-0.5 border border-slate-700">
          {(['owner', 'finder', 'admin'] as const).map((role) => (
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
              className={`px-2 py-0.5 rounded text-[9px] uppercase font-bold transition-all cursor-pointer ${
                activeRole === role ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Top App Bar Header Shell */}
      {currentScreen !== 'welcome' && (
        <header className="sticky top-0 w-full z-50 bg-blue-900 text-white flex justify-between items-center px-4 py-3 border-b-4 border-amber-400 shrink-0 shadow-md">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setCurrentScreen('home')}
              className="text-white p-1 hover:bg-blue-800 rounded cursor-pointer"
            >
              <Menu className="w-5 h-5 font-bold" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentScreen('home')}>
              <div className="w-8 h-8 rounded bg-gradient-to-b from-blue-950 to-blue-900 flex items-center justify-center border border-slate-700 relative overflow-hidden shadow-inner">
                <div className="absolute inset-0.5 rounded-full border border-slate-500/40 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4 text-cyan-400 filter drop-shadow-[0_0_2px_rgba(34,211,238,0.8)]" />
                </div>
              </div>
              <span className="font-display font-black text-lg text-white tracking-tighter uppercase">FindBack</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => alert('Civic broadcast alerts: Chennai Lost & Found dispatch active.')}
              className="text-white p-1 hover:bg-blue-800 rounded relative cursor-pointer"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-amber-400 rounded-full"></span>
            </button>
            <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-amber-400 relative">
              <img
                className="w-full h-full object-cover"
                alt="Logged-in User Profile Portrait"
                src={user.avatarUrl}
              />
            </div>
          </div>
        </header>
      )}

      {/* Main Container Stage Body */}
      <main className="flex-grow overflow-y-auto px-4 pt-4 pb-20">
        
        {/* Welcome Onboarding Screen */}
        {currentScreen === 'welcome' && (
          <WelcomeScreen
            onStartFlow={handleStartFlow}
            onLogin={handleLogin}
          />
        )}

        {/* Home Screen Dashboard View (Visual 2) */}
        {currentScreen === 'home' && (
          <div className="space-y-6 animate-fade-in">
            {/* Found something CTA Banner */}
            <div className="bg-blue-900 text-white p-5 rounded-lg border-l-4 border-amber-400 relative overflow-hidden shadow-md">
              <div className="relative z-10 space-y-3.5">
                <h3 className="font-display font-black text-lg leading-tight uppercase flex items-center gap-2">
                  <span className="w-1.5 h-5 bg-amber-400 inline-block"></span>
                  Found something?
                </h3>
                <p className="text-blue-100 text-xs leading-relaxed max-w-[240px]">
                  Drop it off safely at any verified local partner hub in Chennai. Earn <span className="text-amber-400 font-extrabold">₹60 reward</span> once claimed!
                </p>
                <button
                  onClick={() => {
                    setActiveRole('finder');
                    setCurrentScreen('report');
                  }}
                  className="w-full sm:w-auto px-5 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold uppercase tracking-wider text-[11px] rounded transition-all cursor-pointer shadow-lg shadow-blue-900/40"
                >
                  Report found item
                </button>
              </div>
            </div>

            {/* Nearest Recovery Hubs with Chennai mini map visualization */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-display font-black text-xs text-slate-800 uppercase flex items-center gap-1.5">
                  <span className="w-1.5 h-4 bg-blue-600"></span>
                  Nearest Recovery Hubs
                </h4>
                <button
                  onClick={() => alert('Displaying map directory of all 5 verified Chennai FindBack Recovery partner hubs.')}
                  className="text-[11px] text-blue-600 font-bold uppercase tracking-wider hover:underline"
                >
                  View All
                </button>
              </div>

              {/* Dynamic Inline Vector Map representing Chennai Hubs */}
              <div className="relative h-44 bg-slate-100 rounded overflow-hidden border border-slate-200 shadow-sm flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full text-slate-300 stroke-slate-200" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {/* Grid layout */}
                  <line x1="10" y1="0" x2="10" y2="100" strokeWidth="0.5" />
                  <line x1="30" y1="0" x2="30" y2="100" strokeWidth="0.5" />
                  <line x1="50" y1="0" x2="50" y2="100" strokeWidth="0.5" />
                  <line x1="70" y1="0" x2="70" y2="100" strokeWidth="0.5" />
                  <line x1="90" y1="0" x2="90" y2="100" strokeWidth="0.5" />
                  <line x1="0" y1="20" x2="100" y2="20" strokeWidth="0.5" />
                  <line x1="0" y1="50" x2="100" y2="50" strokeWidth="0.5" />
                  <line x1="0" y1="80" x2="100" y2="80" strokeWidth="0.5" />
                  {/* Mock Coastline for Chennai */}
                  <path d="M 90 0 C 85 40, 80 60, 82 100" fill="none" stroke="#2563eb" strokeWidth="1.5" />
                  {/* Bay of Bengal label */}
                  <text x="84" y="30" fontSize="3" className="fill-blue-500 font-bold opacity-60 rotate-90 font-mono">BAY OF BENGAL</text>
                </svg>

                {/* Chennai pins */}
                {/* Adyar */}
                <div className="absolute top-[65%] left-[55%] flex flex-col items-center">
                  <MapPin className="w-5 h-5 text-red-600 drop-shadow-sm fill-red-600" />
                  <span className="text-[7px] font-bold text-slate-800 bg-white px-1 rounded shadow-sm border border-slate-300 mt-0.5">Adyar</span>
                </div>

                {/* T Nagar */}
                <div className="absolute top-[40%] left-[45%] flex flex-col items-center">
                  <MapPin className="w-5 h-5 text-blue-600 drop-shadow-sm fill-blue-600" />
                  <span className="text-[7px] font-bold text-slate-800 bg-white px-1 rounded shadow-sm border border-slate-300 mt-0.5">T. Nagar</span>
                </div>

                {/* Anna Nagar */}
                <div className="absolute top-[25%] left-[25%] flex flex-col items-center">
                  <MapPin className="w-5 h-5 text-red-600 drop-shadow-sm fill-red-600" />
                  <span className="text-[7px] font-bold text-slate-800 bg-white px-1 rounded shadow-sm border border-slate-300 mt-0.5">Anna Nagar</span>
                </div>

                {/* Velachery */}
                <div className="absolute top-[80%] left-[35%] flex flex-col items-center">
                  <MapPin className="w-5 h-5 text-red-600 drop-shadow-sm fill-red-600" />
                  <span className="text-[7px] font-bold text-slate-800 bg-white px-1 rounded shadow-sm border border-slate-300 mt-0.5">Velachery</span>
                </div>
              </div>

              {/* Horizontally scrollable Hub Cards */}
              <div className="flex gap-3 overflow-x-auto hide-scrollbar py-1">
                {CHENNAI_HUBS.map((hub) => (
                  <div
                    key={hub.id}
                    onClick={() => alert(`Chennai Hub: ${hub.name}\nAddress: ${hub.address}`)}
                    className="border border-slate-200 bg-white p-3.5 rounded flex-shrink-0 w-48 shadow-sm hover:border-blue-600 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-blue-100 px-1.5 py-0.5 rounded text-blue-800">
                        {hub.distance}
                      </span>
                    </div>
                    <h5 className="font-display font-black text-xs text-slate-800 uppercase mt-2">{hub.name}</h5>
                    <p className="text-[10px] text-slate-500 mt-1 leading-tight font-medium">{hub.gate || 'Reception'}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Your recent items */}
            <div className="space-y-3">
              <h4 className="font-display font-black text-xs text-slate-800 uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-blue-600"></span>
                Your recent items
              </h4>

              <div className="space-y-2.5">
                {/* Simulated Recent 1 */}
                <div className="bg-white rounded border border-slate-200 border-l-4 border-amber-500 p-3 flex items-center justify-between shadow-sm">
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded overflow-hidden border border-slate-200 shrink-0 bg-slate-100 flex items-center justify-center">
                      <img src="https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" alt="Keys" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">Silver Key Set</h5>
                      <div className="flex gap-1.5 mt-1">
                        <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          LOST
                        </span>
                        <span className="text-[9px] font-black uppercase bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                          KEYS
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wider">
                    Under verification
                  </span>
                </div>

                {/* Simulated Recent 2 */}
                <div className="bg-white rounded border border-slate-200 border-l-4 border-emerald-500 p-3 flex items-center justify-between shadow-sm">
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded overflow-hidden border border-slate-200 shrink-0 bg-slate-100 flex items-center justify-center">
                      <img src="https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" alt="Wallet" />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-800">Black Leather Wallet</h5>
                      <div className="flex gap-1.5 mt-1">
                        <span className="text-[9px] font-black uppercase bg-green-100 text-green-800 px-1.5 py-0.5 rounded">
                          FOUND
                        </span>
                        <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                          ACCESSORY
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200 uppercase tracking-wider">
                    Ready for pickup
                  </span>
                </div>
              </div>
            </div>

            {/* Simulated stats reset block for demo */}
            <div className="p-4 bg-slate-100 border border-slate-200 rounded text-center space-y-2">
              <p className="text-[10px] text-slate-500 leading-tight">
                Data reported via Finders flow dynamically updates the Owner Search and Admin review lists! Use the button below to restore clean defaults at any time:
              </p>
              <button
                onClick={handleResetDemo}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-[10px] font-bold transition-colors cursor-pointer uppercase tracking-wider"
              >
                Reset In-Memory Database
              </button>
            </div>
          </div>
        )}

        {/* 1. Finder Flow: Wizard page (Step 1 -> 2 -> 3) */}
        {currentScreen === 'report' && (
          <FinderFlow
            onItemCreated={handleItemCreated}
            onNavigateHome={() => setCurrentScreen('home')}
          />
        )}

        {/* 2. Owner Flow: Search Gallery & Claim Verification Detail */}
        {currentScreen === 'search' && (
          <SearchDashboard
            items={items}
            onClaimSubmitted={handleClaimSubmitted}
            onSimulateApproveClaim={handleApproveProof}
            onSimulatePayment={handleSettleUPI}
          />
        )}

        {/* Rewards / Account Wallet Screen */}
        {currentScreen === 'rewards' && (
          <div className="space-y-6 animate-fade-in text-center">
            <div className="bg-blue-900 text-white p-6 rounded border-l-4 border-amber-400 shadow-md">
              <Star className="w-10 h-10 text-amber-400 fill-amber-400 mx-auto" />
              <h3 className="font-display font-black text-lg mt-1.5 uppercase tracking-wider">FindBack Wallet</h3>
              <p className="text-blue-200 text-[11px]">Chennai Community reward ledger</p>

              <div className="mt-4 pt-4 border-t border-blue-800">
                <p className="text-[10px] uppercase font-bold text-blue-300 tracking-wider">Available Reward Balance</p>
                <p className="text-3xl font-black text-amber-400 mt-1 font-mono">₹{user.balance}</p>
                <p className="text-[10px] text-emerald-400 font-bold mt-1 uppercase tracking-wider">✓ Instant withdrawal active via UPI ID</p>
              </div>
            </div>

            {/* Profile Statistics */}
            <div className="bg-white border border-slate-200 rounded p-4 text-left space-y-3.5 shadow-sm">
              <h4 className="font-display font-black text-xs text-slate-800 uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-blue-600"></span>
                Your Chennai Statistics
              </h4>
              <div className="grid grid-cols-2 gap-4 divide-x divide-slate-200">
                <div className="text-center">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Items Reported</p>
                  <p className="text-xl font-black text-blue-900 mt-0.5 font-mono">{user.reportedCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Claims Settled</p>
                  <p className="text-xl font-black text-blue-900 mt-0.5 font-mono">{user.claimedCount}</p>
                </div>
              </div>
            </div>

            {/* Payout channels list */}
            <div className="bg-white border border-slate-200 rounded p-4 text-left space-y-3.5 shadow-sm">
              <h4 className="font-display font-black text-xs uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-4 bg-emerald-500"></span>
                Settled Micro-rewards Payout History
              </h4>
              <div className="divide-y divide-slate-100 text-xs text-slate-600">
                <div className="py-2.5 flex justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Black Leather Wallet reward</p>
                    <p className="text-[10px] text-slate-500 font-mono">Transferred to UPI: {user.email.split('@')[0]}@okaxis</p>
                  </div>
                  <span className="font-black text-emerald-600 shrink-0 font-mono">+₹60</span>
                </div>
                <div className="py-2.5 flex justify-between">
                  <div>
                    <p className="font-bold text-slate-800">Silver Keychain finder reward</p>
                    <p className="text-[10px] text-slate-500 font-mono">Transferred to UPI: {user.email.split('@')[0]}@okaxis</p>
                  </div>
                  <span className="font-black text-emerald-600 shrink-0 font-mono">+₹60</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Admin View: Hub Operator Inventory Status and Claim approvals */}
        {currentScreen === 'admin' && (
          <div className="space-y-6 animate-fade-in">
            <div className="pb-1">
              <span className="text-[9px] font-bold uppercase tracking-wider text-blue-800 bg-blue-100 px-2 py-0.5 rounded border border-blue-200">
                Chennai Central Operations
              </span>
              <h2 className="text-lg font-black font-display text-slate-800 uppercase mt-2 flex items-center gap-1.5">
                <span className="w-1.5 h-5 bg-blue-600"></span>
                FindBack Hub Console
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Verify proofs of ownership, inspect Aadhaar matching, and coordinate UPI escrow reward disbursements.
              </p>
            </div>

            <AdminHub
              items={items}
              onApproveProof={handleApproveProof}
              onRejectProof={handleRejectProof}
              onSettleUPI={handleSettleUPI}
            />
          </div>
        )}

      </main>

      {/* Geometric Status Footer */}
      {currentScreen !== 'welcome' && (
        <footer className="bg-slate-900 text-[9px] font-mono py-2 px-3 text-slate-400 shrink-0 flex flex-wrap justify-between items-center gap-1.5 border-t border-slate-800 mb-14">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>STATUS: OPERATIONAL</span>
          </div>
          <div>UPTIME: 99.98%</div>
          <div>HUBS: 5 ACTIVE</div>
        </footer>
      )}

      {/* Bottom Floating Navigation tab bar (Visual 2) */}
      {currentScreen !== 'welcome' && (
        <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[375px] flex justify-around items-center px-4 py-2.5 bg-white border-t border-slate-200 z-50 shadow-lg shrink-0">
          <button
            onClick={() => setCurrentScreen('home')}
            className={`flex flex-col items-center justify-center p-1 px-3 transition-all text-center rounded cursor-pointer ${
              currentScreen === 'home'
                ? 'text-blue-900 font-bold border-b-2 border-blue-900 pb-0.5'
                : 'text-slate-500 hover:text-blue-900'
            }`}
          >
            <Home className={`w-5 h-5 ${currentScreen === 'home' ? 'text-blue-900 fill-blue-900' : 'text-slate-500'}`} />
            <span className="text-[9px] font-bold mt-0.5 font-display uppercase tracking-wider">Home</span>
          </button>

          <button
            onClick={() => setCurrentScreen('search')}
            className={`flex flex-col items-center justify-center p-1 px-3 transition-all text-center rounded cursor-pointer ${
              currentScreen === 'search'
                ? 'text-blue-900 font-bold border-b-2 border-blue-900 pb-0.5'
                : 'text-slate-500 hover:text-blue-900'
            }`}
          >
            <Search className={`w-5 h-5 ${currentScreen === 'search' ? 'text-blue-900' : 'text-slate-500'}`} />
            <span className="text-[9px] font-bold mt-0.5 font-display uppercase tracking-wider">Search</span>
          </button>

          <button
            onClick={() => setCurrentScreen('report')}
            className={`flex flex-col items-center justify-center p-1 px-3 transition-all text-center rounded cursor-pointer ${
              currentScreen === 'report'
                ? 'text-blue-900 font-bold border-b-2 border-blue-900 pb-0.5'
                : 'text-slate-500 hover:text-blue-900'
            }`}
          >
            <PlusCircle className={`w-5 h-5 ${currentScreen === 'report' ? 'text-blue-900 fill-blue-900' : 'text-slate-500'}`} />
            <span className="text-[9px] font-bold mt-0.5 font-display uppercase tracking-wider">Report</span>
          </button>

          <button
            onClick={() => setCurrentScreen('rewards')}
            className={`flex flex-col items-center justify-center p-1 px-3 transition-all text-center rounded cursor-pointer ${
              currentScreen === 'rewards'
                ? 'text-blue-900 font-bold border-b-2 border-blue-900 pb-0.5'
                : 'text-slate-500 hover:text-blue-900'
            }`}
          >
            <Star className={`w-5 h-5 ${currentScreen === 'rewards' ? 'text-blue-900 fill-blue-900' : 'text-slate-500'}`} />
            <span className="text-[9px] font-bold mt-0.5 font-display uppercase tracking-wider">Rewards</span>
          </button>
        </nav>
      )}

    </div>
  );
}
