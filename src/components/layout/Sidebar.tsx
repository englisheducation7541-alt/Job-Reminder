import React from 'react';
import {
  BarChart3,
  Briefcase,
  Building2,
  CalendarClock,
  CheckCircle,
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Mic,
  PhoneCall,
  Settings,
  ShieldCheck,
  Smartphone,
  Trophy,
  UserCircle,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const {
    activeTab,
    setActiveTab,
    currentUser,
    jobs,
    messageLogs,
    paymentReminders,
    setIsVoiceAssistantOpen,
    setIsApkModalOpen,
    logout,
    companySettings,
    t,
  } = useApp();

  const myAssignedJobsCount = jobs.filter(
    (j) => j.assignedToId === currentUser.id && !['completed', 'cancelled'].includes(j.status)
  ).length;

  const overdueCount = jobs.filter((j) => j.status === 'overdue').length;
  const failedMessagesCount = messageLogs.filter((m) => m.status === 'failed').length;
  const pendingPaymentsCount = paymentReminders.filter(
    (r) => r.status === 'pending' || r.status === 'overdue' || r.pendingAmount > 0
  ).length;

  const navItems = [
    {
      id: 'dashboard',
      label: t('dashboard'),
      icon: LayoutDashboard,
      roles: ['admin', 'manager', 'engineer'],
    },
    {
      id: 'my_jobs',
      label: t('my_jobs'),
      icon: Briefcase,
      badge: myAssignedJobsCount > 0 ? myAssignedJobsCount : undefined,
      badgeColor: 'bg-emerald-600 text-white',
      roles: ['admin', 'manager', 'engineer'],
      specialHighlight: currentUser.role === 'engineer',
    },
    {
      id: 'jobs',
      label: t('all_jobs'),
      icon: CalendarClock,
      badge: overdueCount > 0 ? `${overdueCount} Overdue` : undefined,
      badgeColor: 'bg-red-100 text-red-700',
      roles: ['admin', 'manager'],
    },
    {
      id: 'whatsapp',
      label: t('whatsapp'),
      icon: MessageSquare,
      badge: failedMessagesCount > 0 ? `${failedMessagesCount} Failed` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800',
      roles: ['admin', 'manager'],
    },
    {
      id: 'customers',
      label: t('customers'),
      icon: Building2,
      roles: ['admin', 'manager'],
    },
    {
      id: 'payments',
      label: 'Payment Reminders',
      icon: CreditCard,
      badge: pendingPaymentsCount > 0 ? `${pendingPaymentsCount} Due` : undefined,
      badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300 font-bold',
      roles: ['admin', 'manager'],
    },
    {
      id: 'team',
      label: t('team'),
      icon: Users,
      roles: ['admin', 'manager'],
    },
    {
      id: 'rankings',
      label: t('rankings'),
      icon: Trophy,
      badge: '6-Mo Award',
      badgeColor: 'bg-amber-100 text-amber-800 border border-amber-300 font-bold',
      roles: ['admin', 'manager', 'engineer'],
    },
    {
      id: 'reports',
      label: t('reports'),
      icon: BarChart3,
      roles: ['admin', 'manager'],
    },
    {
      id: 'company_profile',
      label: t('company_profile'),
      icon: Building2,
      roles: ['admin'],
    },
    {
      id: 'settings',
      label: t('settings'),
      icon: Settings,
      roles: ['admin'],
    },
  ];

  const visibleItems = navItems.filter((item) => item.roles.includes(currentUser.role));

  const handleNavClick = (tabId: string) => {
    setActiveTab(tabId);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-stone-900/40 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white border-r border-stone-200 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Header with Mobile Close */}
        <div className="h-16 px-4 border-b border-stone-100 flex items-center justify-between">
          <div
            onClick={() => handleNavClick('dashboard')}
            className="flex items-center gap-2 cursor-pointer min-w-0"
          >
            {companySettings?.companyLogo || companySettings?.logoUrl ? (
              <img
                src={companySettings.companyLogo || companySettings.logoUrl}
                alt="Logo"
                className="h-8 max-w-[120px] object-contain rounded-lg border border-stone-200 p-0.5 bg-white shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                {companySettings?.companyName ? companySettings.companyName.substring(0, 2).toUpperCase() : 'JR'}
              </div>
            )}
            <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 shrink-0">
              v2.4
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Identity Card */}
        <div className="p-3 mx-3 mt-3 rounded-xl bg-stone-50 border border-stone-200/70">
          <div className="flex items-center gap-2.5">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-9 h-9 rounded-lg object-cover ring-1 ring-stone-200"
            />
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-stone-900 truncate">
                {currentUser.name}
              </div>
              <div className="text-[11px] text-stone-500 truncate flex items-center gap-1">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    currentUser.active ? 'bg-emerald-500' : 'bg-stone-300'
                  }`}
                />
                <span className="capitalize">{currentUser.role}</span> • {currentUser.employeeId}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            Navigation
          </div>

          {visibleItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                    : item.specialHighlight
                    ? 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100/70'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-white'
                        : item.specialHighlight
                        ? 'text-emerald-700'
                        : 'text-stone-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          <div className="pt-3 mt-3 border-t border-stone-200/80 space-y-1">
            <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
              Tools &amp; Mobile Access
            </div>

            {/* AI Voice Assistant Trigger */}
            <button
              onClick={() => {
                setIsVoiceAssistantOpen(true);
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50/80 hover:bg-emerald-100/90 text-emerald-900 border border-emerald-200/70 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Mic className="w-4 h-4 text-emerald-700" />
                <span>AI Voice Assistant</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-600 text-white">
                MIC
              </span>
            </button>

            {/* App APK & Direct Login Link */}
            <button
              onClick={() => {
                setIsApkModalOpen(true);
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
            >
              <Smartphone className="w-4 h-4 text-stone-600" />
              <span>Get APK &amp; Login Link</span>
            </button>

            {/* Log Out */}
            <button
              onClick={() => {
                logout();
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-500" />
              <span>Log Out</span>
            </button>
          </div>
        </div>

        {/* WhatsApp Notification Status Box */}
        <div className="p-3 m-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200/60 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-emerald-900 text-[11px] mb-1">
            <Zap className="w-3.5 h-3.5 text-emerald-700" />
            <span>WhatsApp Business API</span>
          </div>
          <p className="text-[11px] text-emerald-800/90 leading-relaxed mb-2">
            Automated notifications &amp; 1-click token links active for all engineers.
          </p>
          <div className="flex items-center justify-between text-[10px] text-emerald-700 font-medium">
            <span>Provider: Meta Cloud</span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Connected
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
