import React, { useState } from 'react';
import {
  Bell,
  Bot,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cloud,
  Globe,
  Key,
  LogOut,
  Menu,
  Mic,
  Plus,
  RefreshCw,
  Search,
  Send,
  Share2,
  Shield,
  Smartphone,
  Sparkles,
  Trophy,
  User,
  UserCheck,
  UserPlus,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { NotificationBell } from './NotificationBell';

interface NavbarProps {
  onToggleSidebar: () => void;
  onOpenMagicTester: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, onOpenMagicTester }) => {
  const {
    currentUser,
    users,
    switchUser,
    setIsCreateJobOpen,
    setIsAddEmployeeModalOpen,
    setIsGlobalSearchOpen,
    companySettings,
    lastSchedulerTick,
    triggerSchedulerTick,
    jobs,
    tokenAuthBanner,
    dismissTokenBanner,
    setIsVoiceAssistantOpen,
    setIsApkModalOpen,
    logout,
    syncStatus,
    lastSyncedAt,
    triggerManualSync,
    language,
    setLanguage,
    openUserProfile,
    setActiveTab,
    googleDriveState,
    setIsDriveModalOpen,
  } = useApp();

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isTicking, setIsTicking] = useState(false);

  // Global Ctrl+K shortcut to trigger Omnisearch
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setIsGlobalSearchOpen]);

  const overdueCount = jobs.filter((j) => j.status === 'overdue').length;
  const dueTodayCount = jobs.filter((j) => {
    const today = new Date().toISOString().split('T')[0];
    return j.dueDate === today && !['completed', 'cancelled'].includes(j.status);
  }).length;

  const handleManualTick = () => {
    setIsTicking(true);
    triggerSchedulerTick();
    setTimeout(() => setIsTicking(false), 800);
  };

  return (
    <header className="bg-white border-b border-stone-200 sticky top-0 z-30 shadow-xs">
      {/* Direct Magic Link Auth notification banner if authenticated via token */}
      {tokenAuthBanner && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 text-xs text-emerald-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
            <Key className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>
              <strong>1-Click Token Authenticated:</strong> Automatically signed in as{' '}
              <strong>{tokenAuthBanner.user.name}</strong> ({tokenAuthBanner.user.designation}) via direct secure reminder link.
              {tokenAuthBanner.job && (
                <span className="ml-1">
                  Opened Job: <strong>{tokenAuthBanner.job.jobId}</strong> ({tokenAuthBanner.job.title})
                </span>
              )}
            </span>
          </div>
          <button
            onClick={dismissTokenBanner}
            className="text-emerald-700 hover:text-emerald-900 font-semibold underline text-xs cursor-pointer ml-4"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
        {/* Left: App Logo & Mobile Toggle */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-1.5 sm:p-2 rounded-lg text-stone-600 hover:bg-stone-100 lg:hidden cursor-pointer"
            title="Toggle Navigation"
            aria-label="Toggle navigation"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center cursor-pointer group"
            title={companySettings?.companyName ? `${companySettings.companyName} - Dashboard` : 'Dashboard'}
          >
            {companySettings?.companyLogo || companySettings?.logoUrl ? (
              <img
                src={companySettings.companyLogo || companySettings.logoUrl}
                alt={companySettings.companyName || 'Company Logo'}
                className="h-9 w-auto max-w-[150px] max-h-9 object-contain rounded-lg bg-white border border-stone-200 shadow-2xs group-hover:border-emerald-400 transition-colors p-0.5"
              />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs group-hover:bg-emerald-700 transition-colors">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>

        {/* Right: Actions, Language Switcher, AI Assistant & Role Profile */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {/* ChatGPT AI Voice Assistant Trigger Button */}
          <button
            onClick={() => setIsVoiceAssistantOpen(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white shadow-xs text-xs font-bold cursor-pointer transition-all hover:scale-102 active:scale-98 border border-emerald-400/30"
            title="Open ChatGPT 4o Voice & Smart Assistant (Hindi / English / Any Language)"
          >
            <Bot className="w-4 h-4 text-emerald-200" />
            <span className="hidden sm:inline">ChatGPT Voice</span>
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-xl border border-stone-200 bg-stone-50 hover:bg-white text-stone-700 text-xs font-medium cursor-pointer transition-colors"
              title="Change Language / भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-semibold uppercase text-[11px]">
                {language === 'en' ? 'EN' : language === 'hi' ? 'हिन्दी' : 'Hinglish'}
              </span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white border border-stone-200 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                  Select Language
                </div>
                <button
                  onClick={() => {
                    setLanguage('en');
                    setIsLangMenuOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-stone-50 cursor-pointer ${
                    language === 'en' ? 'font-bold text-emerald-700 bg-emerald-50/50' : 'text-stone-700'
                  }`}
                >
                  <span>English</span>
                  {language === 'en' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  onClick={() => {
                    setLanguage('hi');
                    setIsLangMenuOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-stone-50 cursor-pointer ${
                    language === 'hi' ? 'font-bold text-emerald-700 bg-emerald-50/50' : 'text-stone-700'
                  }`}
                >
                  <span>हिन्दी (Hindi)</span>
                  {language === 'hi' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
                <button
                  onClick={() => {
                    setLanguage('hinglish');
                    setIsLangMenuOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs flex items-center justify-between hover:bg-stone-50 cursor-pointer ${
                    language === 'hinglish' ? 'font-bold text-emerald-700 bg-emerald-50/50' : 'text-stone-700'
                  }`}
                >
                  <span>Hinglish</span>
                  {language === 'hinglish' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              </div>
            )}
          </div>

          {/* Google Drive Cloud Sync & Backup Button */}
          <button
            onClick={() => setIsDriveModalOpen(true)}
            className={`relative w-9 h-9 rounded-xl border transition-all shadow-2xs cursor-pointer flex items-center justify-center ${
              googleDriveState.isConnected
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400'
                : 'border-stone-200 bg-stone-50 text-stone-600 hover:bg-white hover:text-emerald-700 hover:border-emerald-500'
            }`}
            title={
              googleDriveState.isConnected
                ? `Google Drive Synced (${googleDriveState.userEmail})`
                : 'Google Drive Backup & Sync'
            }
            aria-label="Google Drive Backup & Sync"
          >
            <Cloud className="w-4 h-4" />
            {googleDriveState.isConnected && (
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-600 rounded-full border-2 border-white" />
            )}
          </button>

          {/* Role-isolated Notification Bell */}
          <NotificationBell />

          {/* Small search icon */}
          <button
            onClick={() => setIsGlobalSearchOpen(true)}
            className="w-9 h-9 rounded-xl border border-stone-200 bg-stone-50 hover:bg-white hover:border-emerald-500 text-stone-600 hover:text-emerald-700 transition-all shadow-2xs cursor-pointer flex items-center justify-center"
            title="Search (Ctrl+K)"
            aria-label="Search jobs, engineers, sites"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* User Account / Role Switcher Pill */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-1.5 sm:gap-2 p-1 sm:p-1.5 sm:pl-2 rounded-lg sm:rounded-xl border border-stone-200 hover:border-stone-300 bg-stone-50 hover:bg-stone-100 transition-all cursor-pointer text-left"
            >
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg object-cover ring-1 ring-stone-200 shrink-0"
              />
              <div className="hidden md:block leading-tight pr-1">
                <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <span className="truncate max-w-[90px]">{currentUser.name}</span>
                  <span
                    className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                      currentUser.role === 'admin'
                        ? 'bg-purple-100 text-purple-800 border border-purple-200'
                        : currentUser.role === 'manager'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {currentUser.role}
                  </span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white border border-stone-200 shadow-xl py-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150">
                {/* STRICT EMPLOYEE SECURITY: Engineers cannot view or switch to other user accounts */}
                {currentUser.role === 'engineer' ? (
                  <div>
                    <div className="px-3 py-2 border-b border-stone-100 bg-stone-50/50">
                      <div className="text-xs font-bold text-stone-900">{currentUser.name}</div>
                      <div className="text-[11px] text-stone-500">{currentUser.designation} • ID: {currentUser.employeeId}</div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Shield className="w-3 h-3 text-emerald-600" />
                        <span>Field Service Employee (Private Account)</span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          openUserProfile(currentUser);
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 text-xs text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4 text-emerald-600" />
                        <span>View My Profile</span>
                      </button>
                      <button
                        onClick={() => {
                          setActiveTab('rankings');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 text-left flex items-center gap-2 text-xs text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
                      >
                        <Trophy className="w-4 h-4 text-amber-500" />
                        <span>My Ranking &amp; Performance</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Admin & Manager Switcher */
                  <div>
                    <div className="px-3 py-1.5 border-b border-stone-100">
                      <div className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                        Switch Account / Role (Admin)
                      </div>
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        Test system viewpoints as admin or manager
                      </p>
                    </div>

                    <div className="py-1 max-h-72 overflow-y-auto">
                      {users.map((u) => {
                        const isSelected = u.id === currentUser.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              switchUser(u.id);
                              setIsUserMenuOpen(false);
                            }}
                            className={`w-full px-3 py-2 text-left flex items-center gap-2.5 text-xs hover:bg-stone-50 transition-colors cursor-pointer ${
                              isSelected ? 'bg-emerald-50/70' : ''
                            }`}
                          >
                            <img
                              src={u.avatar}
                              alt={u.name}
                              className="w-6 h-6 rounded-md object-cover ring-1 ring-stone-200"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-stone-900 truncate flex items-center justify-between">
                                <span>{u.name}</span>
                                <span
                                  className={`text-[9px] uppercase px-1 rounded font-bold ${
                                    u.role === 'admin'
                                      ? 'text-purple-700 bg-purple-50'
                                      : u.role === 'manager'
                                      ? 'text-blue-700 bg-blue-50'
                                      : 'text-emerald-700 bg-emerald-50'
                                  }`}
                                >
                                  {u.role}
                                </span>
                              </div>
                              <div className="text-[10px] text-stone-500 truncate">
                                {u.designation}
                              </div>
                            </div>
                            {isSelected && <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="border-t border-stone-100 px-3 pt-2 pb-1 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-stone-500">
                    <span>Active WhatsApp:</span>
                    <span className="font-mono text-stone-700">{currentUser.whatsapp}</span>
                  </div>

                  <div className="pt-1 border-t border-stone-100">
                    <button
                      onClick={() => {
                        logout();
                        setIsUserMenuOpen(false);
                      }}
                      className="w-full py-1.5 px-2 text-left flex items-center gap-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out to Team Login Page</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

