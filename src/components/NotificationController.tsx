import React, { useState, useEffect } from 'react';
import { apiRouter, LiveIdentityVerification, LiveFoundItem } from '../services/apiRouter';
import { UserProfile } from '../types';
import { 
  Bell, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  PackageSearch, 
  Sparkles, 
  X,
  Hourglass,
  BadgeAlert,
  HelpCircle,
  RefreshCw
} from 'lucide-react';

interface NotificationControllerProps {
  currentUser: UserProfile;
  items: any[];
}

interface AlertNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'alert';
  title: string;
  message: string;
  icon: any;
  timestamp: string;
}

export const NotificationController: React.FC<NotificationControllerProps> = ({ currentUser, items }) => {
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  
  // Track previous status in local storage to trigger actual change transitions
  const getStoredStatusKey = () => `findback_last_status_${currentUser.email}`;

  const fetchLiveStatusAndMatches = async (isFirstLoad = false) => {
    if (!currentUser || !currentUser.email) return;
    setIsChecking(true);
    
    try {
      // 1. Fetch live verifications and cross-reference user email
      const verifications = await apiRouter.fetchIdentityVerifications();
      const userVerification = verifications.find(v => v.UserEmail?.trim().toLowerCase() === currentUser.email.trim().toLowerCase());
      
      const currentStatus = userVerification?.VerificationStatus || 'Not Submitted';
      const lastStatus = localStorage.getItem(getStoredStatusKey()) || 'Not Submitted';
      
      setVerificationStatus(currentStatus);

      const newAlerts: AlertNotification[] = [];

      // Detect state transitions
      if (currentStatus !== lastStatus) {
        localStorage.setItem(getStoredStatusKey(), currentStatus);
        
        if (currentStatus === 'Verified') {
          newAlerts.push({
            id: `verify-success-${Date.now()}`,
            type: 'success',
            title: 'Identity Status: VERIFIED',
            message: `🎉 Great news ${currentUser.name}! Your Identity Verification has been approved by our Chennai Hub Operator. You now have full clearance to submit escrow claims.`,
            icon: ShieldCheck,
            timestamp: new Date().toLocaleTimeString()
          });
        } else if (currentStatus === 'Rejected') {
          newAlerts.push({
            id: `verify-fail-${Date.now()}`,
            type: 'warning',
            title: 'Identity Status: REJECTED',
            message: `⚠️ Action Required: Your Identity Verification request was rejected or flagged. Please check with Chennai Operator Sanjeev.`,
            icon: AlertTriangle,
            timestamp: new Date().toLocaleTimeString()
          });
        } else if (currentStatus === 'Submitted') {
          newAlerts.push({
            id: `verify-sub-${Date.now()}`,
            type: 'info',
            title: 'Identity Status: UNDER REVIEW',
            message: `🕒 Your Identity Verification document is queued for active Operator verification.`,
            icon: Hourglass,
            timestamp: new Date().toLocaleTimeString()
          });
        }
      } else if (isFirstLoad) {
        // Show current status banner on first load for feedback
        if (currentStatus === 'Verified') {
          newAlerts.push({
            id: `verify-init-${Date.now()}`,
            type: 'success',
            title: 'Chennai Hub ID Status',
            message: `✓ Your citizen identity is fully verified. Claim releases unlocked.`,
            icon: ShieldCheck,
            timestamp: new Date().toLocaleTimeString()
          });
        } else if (currentStatus === 'Submitted') {
          newAlerts.push({
            id: `verify-init-${Date.now()}`,
            type: 'info',
            title: 'Identity Verification Pending',
            message: `🕒 Awaiting operator review for ${currentUser.email}. Claims will settle upon approval.`,
            icon: Hourglass,
            timestamp: new Date().toLocaleTimeString()
          });
        } else if (currentStatus === 'Not Submitted') {
          newAlerts.push({
            id: `verify-init-${Date.now()}`,
            type: 'alert',
            title: 'ID Verification Required',
            message: `📢 Submit an Aadhaar or Gov ID during claim processes to verify ownership and unlock direct UPI auto-payout settlements.`,
            icon: BadgeAlert,
            timestamp: new Date().toLocaleTimeString()
          });
        }
      }

      // 2. Fetch live found items and check for status changes or user matches
      const foundItems = await apiRouter.fetchFoundItems();
      
      // Let's check if any live item has changed status to "Match Found" or "Claimed" and notify if it relates to categories the user cares about
      // For this user, let's look at categories they have reported, or if they searched for any categories
      // We can scan the live found items. If there are items with "Match Found", show a notification!
      const matchFoundItems = foundItems.filter(item => item.Status === 'Match Found');
      if (matchFoundItems.length > 0 && isFirstLoad) {
        newAlerts.push({
          id: `match-notify-${Date.now()}`,
          type: 'alert',
          title: 'Chennai Hub Alert',
          message: `🔍 ${matchFoundItems.length} active match(es) resolved at Hubs today. Check the recovery ledger to view status updates.`,
          icon: PackageSearch,
          timestamp: new Date().toLocaleTimeString()
        });
      }

      // Add to our list
      if (newAlerts.length > 0) {
        setNotifications(prev => [...newAlerts, ...prev].slice(0, 5)); // Keep last 5
      }

    } catch (err) {
      console.error('Error in NotificationController fetching status:', err);
    } finally {
      setIsChecking(false);
    }
  };

  // Run on mount, user change, or regular intervals (every 20 seconds)
  useEffect(() => {
    fetchLiveStatusAndMatches(true);
    
    const interval = setInterval(() => {
      fetchLiveStatusAndMatches(false);
    }, 20000);

    return () => clearInterval(interval);
  }, [currentUser.email]);

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex justify-between items-center text-xs select-none">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400 font-medium">Chennai Hub Ledger Notifications: </span>
          <span className="text-slate-300 font-bold uppercase tracking-wider">No new alerts</span>
        </div>
        <button
          onClick={() => fetchLiveStatusAndMatches(false)}
          disabled={isChecking}
          className="text-cyan-400 hover:text-cyan-300 font-black uppercase text-[10px] flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} /> check status
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 select-text text-left">
      <div className="flex justify-between items-center px-1">
        <h5 className="font-display font-black text-[10px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <span className="w-1.5 h-4 bg-cyan-400 inline-block rounded-full"></span>
          Live Citizen Inbox ({notifications.length})
        </h5>
        <button
          onClick={() => fetchLiveStatusAndMatches(false)}
          disabled={isChecking}
          className="text-slate-400 hover:text-cyan-300 transition-colors text-[9px] font-bold uppercase tracking-widest flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${isChecking ? 'animate-spin' : ''}`} /> Refresh status
        </button>
      </div>

      <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
        {notifications.map(notif => {
          const IconComponent = notif.icon;
          
          let borderTheme = 'border-blue-500 bg-blue-950/20 text-blue-100';
          let iconTheme = 'text-blue-400';
          if (notif.type === 'success') {
            borderTheme = 'border-emerald-500 bg-emerald-950/25 text-emerald-100';
            iconTheme = 'text-emerald-400';
          } else if (notif.type === 'warning') {
            borderTheme = 'border-red-500 bg-red-950/25 text-red-100';
            iconTheme = 'text-red-400';
          } else if (notif.type === 'alert') {
            borderTheme = 'border-amber-500 bg-amber-950/25 text-amber-100';
            iconTheme = 'text-amber-400';
          }

          return (
            <div 
              key={notif.id}
              className={`p-3.5 rounded-xl border-l-4 ${borderTheme} flex gap-3 shadow-md relative animate-fade-in transition-all`}
            >
              <div className="p-1.5 bg-slate-900/80 rounded-lg h-fit shrink-0 border border-slate-800">
                <IconComponent className={`w-4 h-4 ${iconTheme}`} />
              </div>
              <div className="flex-1 text-xs">
                <div className="flex justify-between items-start">
                  <h6 className="font-black uppercase text-[10px] tracking-wide text-white leading-none">
                    {notif.title}
                  </h6>
                  <span className="text-[8px] font-mono font-bold text-slate-500 leading-none">
                    {notif.timestamp}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed mt-1.5 font-medium">
                  {notif.message}
                </p>
              </div>
              <button 
                onClick={() => dismissNotification(notif.id)}
                className="text-slate-400 hover:text-white transition-colors shrink-0 cursor-pointer h-fit self-start p-1 bg-slate-900/60 rounded"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
