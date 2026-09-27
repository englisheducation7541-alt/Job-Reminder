import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Send,
  User,
  Briefcase,
  Building,
  Key,
  X,
  Clock,
  Shield,
  CheckCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AppNotification } from '../../types';

export const NotificationBell: React.FC = () => {
  const { notifications, setNotifications, currentUser, setSelectedJobId } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Strict role-based isolation of notifications
  const roleFilteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // If notification has a specific user recipient
      if (n.recipientId) {
        return n.recipientId === currentUser.id;
      }

      // If notification is broadcast to all roles
      if (n.recipientRole === 'all') return true;

      // Role match
      if (currentUser.role === 'admin') {
        return n.recipientRole === 'admin' || n.recipientRole === 'director';
      }
      if (currentUser.role === 'manager') {
        return n.recipientRole === 'manager';
      }
      if (currentUser.role === 'engineer') {
        return n.recipientRole === 'engineer' || n.recipientRole === 'employee';
      }
      return false;
    });
  }, [notifications, currentUser]);

  const unreadCount = useMemo(() => {
    return roleFilteredNotifications.filter((n) => !n.read).length;
  }, [roleFilteredNotifications]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) =>
      prev.map((n) => {
        // Only mark if this notification was visible to this user
        const isVisible =
          n.recipientId === currentUser.id ||
          n.recipientRole === 'all' ||
          (currentUser.role === 'admin' && (n.recipientRole === 'admin' || n.recipientRole === 'director')) ||
          (currentUser.role === 'manager' && n.recipientRole === 'manager') ||
          (currentUser.role === 'engineer' && (n.recipientRole === 'engineer' || n.recipientRole === 'employee'));

        return isVisible ? { ...n, read: true } : n;
      })
    );
  };

  const markItemAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'status_change':
      case 'job_created':
      case 'job_assigned':
        return <Briefcase className="w-3.5 h-3.5 text-blue-600" />;
      case 'job_completed':
        return <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />;
      case 'overdue':
      case 'overdue_alert':
        return <AlertTriangle className="w-3.5 h-3.5 text-red-600" />;
      case 'reminder_sent':
      case 'whatsapp_reminder':
        return <Send className="w-3.5 h-3.5 text-emerald-600" />;
      case 'employee_change':
      case 'team_updated':
        return <User className="w-3.5 h-3.5 text-purple-600" />;
      case 'company_updated':
        return <Building className="w-3.5 h-3.5 text-indigo-600" />;
      case 'password_reset':
        return <Key className="w-3.5 h-3.5 text-amber-600" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-stone-600" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-white text-stone-700 hover:text-stone-900 transition-colors cursor-pointer"
        title="Role Notifications"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center animate-pulse shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white border border-stone-200 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="p-3.5 border-b border-stone-100 bg-stone-50/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-stone-900 text-xs">Notifications</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-stone-200 text-stone-700 capitalize">
                {currentUser.role}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  <span>Mark all read</span>
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-stone-100">
            {roleFilteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-stone-400">
                <Bell className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                <p className="text-xs font-semibold text-stone-600">No notifications yet</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Private updates for your role ({currentUser.role}) will appear here.
                </p>
              </div>
            ) : (
              roleFilteredNotifications.slice(0, 15).map((item) => {
                const date = new Date(item.createdAt);
                const timeStr = !isNaN(date.getTime())
                  ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                  : 'Recent';

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      markItemAsRead(item.id);
                      if (item.jobId) {
                        setSelectedJobId(item.jobId);
                        setIsOpen(false);
                      }
                    }}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                      item.read ? 'bg-white hover:bg-stone-50/80' : 'bg-emerald-50/40 hover:bg-emerald-50/70'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 mt-0.5">
                      {getNotificationIcon(item.type)}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`text-xs font-bold truncate ${item.read ? 'text-stone-900' : 'text-emerald-950'}`}>
                          {item.title}
                        </span>
                        <span className="text-[10px] font-mono text-stone-400 shrink-0">
                          {timeStr}
                        </span>
                      </div>
                      <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
                        {item.message}
                      </p>
                    </div>

                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1.5" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2.5 bg-stone-50 border-t border-stone-100 text-center text-[11px] text-stone-400">
            Role-isolated notification stream • Kept for up to 6 months
          </div>
        </div>
      )}
    </div>
  );
};
