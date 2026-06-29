import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, AlertTriangle, Bell, RefreshCw, Eye } from 'lucide-react';
import { apiRouter, LiveNotification } from '../services/apiRouter';
import { UserProfile } from '../types';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onNavigateToItem?: (itemId: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  currentUser,
  onNavigateToItem
}) => {
  const [notifications, setNotifications] = useState<LiveNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync notifications from sheet and local storage backup
  const loadNotifications = async () => {
    if (!currentUser || !currentUser.email) return;
    setIsLoading(true);
    setError(null);

    try {
      // 1. Load from Live spreadsheet
      const liveData = await apiRouter.fetchNotifications();
      
      // 2. Load from local storage backup
      const localStored = localStorage.getItem('findback_notifications_local');
      const localList: LiveNotification[] = localStored ? JSON.parse(localStored) : [];

      // 3. Combine both lists
      const combined = [...liveData, ...localList];

      // 4. Filter for current user (or "all")
      const userEmailLower = currentUser.email.toLowerCase().trim();
      const filtered = combined.filter(n => {
        if (!n.UserID) return false;
        const uid = n.UserID.toLowerCase().trim();
        return uid === userEmailLower || uid === 'all' || uid === currentUser.phone?.toLowerCase().trim();
      });

      // 5. Deduplicate by message and timestamp to prevent doubles
      const seen = new Set<string>();
      const deduped: LiveNotification[] = [];
      for (const item of filtered) {
        const key = `${item.Message}_${item.Timestamp}`;
        if (!seen.has(key)) {
          seen.add(key);
          deduped.push(item);
        }
      }

      // 6. Sort by newest timestamp first (we assume standard locale string or custom)
      // Since timestamps might be custom formatted strings, we do a basic reversal or parse attempt
      deduped.sort((a, b) => {
        const timeA = a.Timestamp ? new Date(a.Timestamp).getTime() : 0;
        const timeB = b.Timestamp ? new Date(b.Timestamp).getTime() : 0;
        return timeB - timeA;
      });

      setNotifications(deduped);
    } catch (err) {
      console.error('[Notification Drawer Error]', err);
      setError('Could not fetch notifications.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, currentUser]);

  // Click a notification to read and navigate
  const handleNotificationClick = async (notif: LiveNotification, index: number) => {
    // 1. Update ReadStatus locally
    const updated = [...notifications];
    updated[index].ReadStatus = 'true';
    setNotifications(updated);

    // 2. Update in Google Sheet
    try {
      await apiRouter.markNotificationAsRead(index);
    } catch (e) {
      console.warn('[API Warning] Mark read failed on Sheet best, using local fallback.', e);
    }

    // 3. Update in local storage list backup
    const localStored = localStorage.getItem('findback_notifications_local');
    if (localStored) {
      const localList: LiveNotification[] = JSON.parse(localStored);
      const matched = localList.find(n => n.Message === notif.Message && n.Timestamp === notif.Timestamp);
      if (matched) {
        matched.ReadStatus = 'true';
        localStorage.setItem('findback_notifications_local', JSON.stringify(localList));
      }
    }

    // 4. Close drawer and navigate
    onClose();
    if (onNavigateToItem && notif.ItemID) {
      onNavigateToItem(notif.ItemID);
    }
  };

  // Mark all notifications as read
  const handleMarkAllRead = async () => {
    const updated = notifications.map(n => ({ ...n, ReadStatus: 'true' }));
    setNotifications(updated);

    // Update in local storage backup
    const localStored = localStorage.getItem('findback_notifications_local');
    if (localStored) {
      const localList: LiveNotification[] = JSON.parse(localStored);
      localList.forEach(n => n.ReadStatus = 'true');
      localStorage.setItem('findback_notifications_local', JSON.stringify(localList));
    }

    // Update all live notifications for this user on Sheet best
    try {
      // For each item that is unread, trigger PATCH
      for (let i = 0; i < notifications.length; i++) {
        if (notifications[i].ReadStatus === 'false' || !notifications[i].ReadStatus || notifications[i].ReadStatus === false) {
          apiRouter.markNotificationAsRead(i).catch(() => {});
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const getRelativeTime = (timestampString?: string) => {
    if (!timestampString) return 'Just now';
    try {
      // Simple parser for LocaleString format
      const parts = timestampString.split(',');
      if (parts.length > 1) {
        return parts[1].trim(); // Returns the time portion e.g. "10:30:15 AM"
      }
      return timestampString;
    } catch (e) {
      return 'Just now';
    }
  };

  const getIcon = (message?: string) => {
    const msg = message?.toLowerCase() || '';
    if (msg.includes('verified') || msg.includes('approved') || msg.includes('active')) {
      return <Check className="w-3.5 h-3.5 text-emerald-400" />;
    }
    if (msg.includes('rejected') || msg.includes('could not be verified')) {
      return <X className="w-3.5 h-3.5 text-red-400" />;
    }
    return <Bell className="w-3.5 h-3.5 text-amber-400" />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Drawer Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-50 cursor-pointer"
          />

          {/* Sliding Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-slate-950 text-slate-100 z-50 shadow-2xl flex flex-col border-l border-slate-800"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900 shrink-0">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-900 rounded-lg">
                  <Bell className="w-4 h-4 text-amber-400 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-display font-black text-xs uppercase tracking-widest text-white">Live Dispatches</h3>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">Chennai Hub Realtime Alerts</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white p-1 bg-slate-800 hover:bg-slate-700 rounded-lg cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Controls Bar */}
            <div className="px-4 py-2 bg-slate-900/40 border-b border-slate-800 flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
              <button
                onClick={loadNotifications}
                disabled={isLoading}
                className="hover:text-white flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Sync Live
              </button>
              {notifications.some(n => n.ReadStatus === 'false' || !n.ReadStatus || n.ReadStatus === false) && (
                <button
                  onClick={handleMarkAllRead}
                  className="hover:text-emerald-400 cursor-pointer text-[9px] font-black uppercase tracking-wider"
                >
                  Mark All as Read
                </button>
              )}
            </div>

            {/* List Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 scrollbar-none">
              {isLoading && notifications.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Loading alerts...</p>
                </div>
              ) : error && notifications.length === 0 ? (
                <div className="py-12 text-center text-red-400 text-[10px] uppercase tracking-wider font-black">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50 text-red-500" />
                  {error}
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <Bell className="w-10 h-10 text-slate-600 mx-auto opacity-40" />
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">No active alerts</p>
                  <p className="text-[9px] text-slate-500 leading-relaxed max-w-xs mx-auto uppercase font-semibold">
                    YOUR SECURITY LEDGER IS CLEAN. NEW CITIZEN DISPATCHES WILL APPEAR HERE INSTANTLY.
                  </p>
                </div>
              ) : (
                notifications.map((notif, index) => {
                  const isUnread = notif.ReadStatus === 'false' || !notif.ReadStatus || notif.ReadStatus === false;
                  return (
                    <div
                      key={index}
                      onClick={() => handleNotificationClick(notif, index)}
                      className={`p-3.5 rounded-xl border flex gap-3 transition-all relative cursor-pointer ${
                        isUnread
                          ? 'bg-slate-900/90 border-blue-900/60 shadow-lg shadow-blue-950/20 hover:border-blue-500/40'
                          : 'bg-slate-950/40 border-slate-900 opacity-60 hover:opacity-100 hover:border-slate-800'
                      }`}
                    >
                      {/* Unread indicator */}
                      {isUnread && (
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      )}

                      <div className="p-1.5 bg-slate-950 rounded-lg h-fit shrink-0 border border-slate-800">
                        {getIcon(notif.Message)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-[8px] font-mono font-black text-slate-500 uppercase tracking-widest">
                            {notif.ItemID === 'identity' ? 'Identity Dispatch' : 'Recovery Alert'}
                          </span>
                          <span className="text-[8px] font-mono text-slate-400 tracking-tight shrink-0">
                            {getRelativeTime(notif.Timestamp)}
                          </span>
                        </div>
                        <p className="text-xs text-slate-200 mt-1 font-medium leading-relaxed">
                          {notif.Message}
                        </p>
                        {notif.ItemID && notif.ItemID !== 'identity' && (
                          <span className="inline-flex items-center gap-1 mt-2 text-[8px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/20">
                            <Eye className="w-2.5 h-2.5" /> View Claimed Item
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 text-center shrink-0">
              <p className="text-[8px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                FindBack Security System • Chennai Hub Ledger v2
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
