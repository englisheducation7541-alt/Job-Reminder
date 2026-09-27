import React from 'react';
import {
  Briefcase,
  CheckSquare,
  CreditCard,
  Home,
  MessageSquare,
  Trophy,
  Users,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const MobileBottomNav: React.FC = () => {
  const { activeTab, setActiveTab, currentUser, jobs, paymentReminders } = useApp();

  const myPendingCount = jobs.filter(
    (j) => j.assignedToId === currentUser.id && !['completed', 'cancelled'].includes(j.status)
  ).length;

  const overdueCount = jobs.filter((j) => j.status === 'overdue').length;

  const pendingPaymentsCount = paymentReminders.filter(
    (r) => r.status === 'pending' || r.status === 'overdue' || r.pendingAmount > 0
  ).length;

  return (
    <nav
      id="mobile-bottom-nav"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-1 py-1.5 flex items-center justify-around shadow-lg safe-area-bottom"
    >
      {/* 1. Dashboard */}
      <button
        onClick={() => setActiveTab('dashboard')}
        className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
          activeTab === 'dashboard'
            ? 'text-emerald-700 font-bold'
            : 'text-stone-500 hover:text-stone-800'
        }`}
        title="Dashboard"
      >
        <Home className={`w-5 h-5 ${activeTab === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">Home</span>
      </button>

      {/* 2. All Jobs (or Manager view) */}
      <button
        onClick={() => setActiveTab('jobs')}
        className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer relative ${
          activeTab === 'jobs'
            ? 'text-emerald-700 font-bold'
            : 'text-stone-500 hover:text-stone-800'
        }`}
        title="All Jobs"
      >
        <Briefcase className={`w-5 h-5 ${activeTab === 'jobs' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">Jobs</span>
        {overdueCount > 0 && (
          <span className="absolute top-0 right-2 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white animate-pulse" />
        )}
      </button>

      {/* 3. My Jobs (Engineer) */}
      <button
        onClick={() => setActiveTab('my_jobs')}
        className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer relative ${
          activeTab === 'my_jobs'
            ? 'text-emerald-700 font-bold'
            : 'text-stone-500 hover:text-stone-800'
        }`}
        title="My Jobs"
      >
        <CheckSquare className={`w-5 h-5 ${activeTab === 'my_jobs' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">My Tasks</span>
        {myPendingCount > 0 && (
          <span className="absolute top-0 right-2 px-1 py-0.2 rounded-full text-[9px] font-bold bg-emerald-600 text-white leading-tight">
            {myPendingCount}
          </span>
        )}
      </button>

      {/* 4. WhatsApp Reminders */}
      <button
        onClick={() => setActiveTab('whatsapp')}
        className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
          activeTab === 'whatsapp'
            ? 'text-emerald-700 font-bold'
            : 'text-stone-500 hover:text-stone-800'
        }`}
        title="WhatsApp Hub"
      >
        <MessageSquare className={`w-5 h-5 ${activeTab === 'whatsapp' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">WhatsApp</span>
      </button>

      {/* 5. Payment Reminders */}
      <button
        onClick={() => setActiveTab('payments')}
        className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer relative ${
          activeTab === 'payments'
            ? 'text-emerald-700 font-bold'
            : 'text-stone-500 hover:text-stone-800'
        }`}
        title="Client Payment Reminders"
      >
        <CreditCard className={`w-5 h-5 ${activeTab === 'payments' ? 'stroke-[2.5]' : 'stroke-2'}`} />
        <span className="text-[10px] mt-0.5 tracking-tight">Payment</span>
        {pendingPaymentsCount > 0 && (
          <span className="absolute top-0 right-2 px-1 py-0.2 rounded-full text-[9px] font-bold bg-amber-500 text-white leading-tight">
            {pendingPaymentsCount}
          </span>
        )}
      </button>

      {/* 6. Team (for managers/admins) or Rankings (for engineers) */}
      {currentUser.role === 'engineer' ? (
        <button
          onClick={() => setActiveTab('rankings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'rankings'
              ? 'text-amber-600 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
          title="Performance Rankings & Awards"
        >
          <Trophy className={`w-5 h-5 ${activeTab === 'rankings' ? 'stroke-[2.5] text-amber-600' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Ranks</span>
        </button>
      ) : (
        <button
          onClick={() => setActiveTab('team')}
          className={`flex flex-col items-center justify-center flex-1 py-1 rounded-xl transition-all cursor-pointer ${
            activeTab === 'team'
              ? 'text-emerald-700 font-bold'
              : 'text-stone-500 hover:text-stone-800'
          }`}
          title="Team Members"
        >
          <Users className={`w-5 h-5 ${activeTab === 'team' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          <span className="text-[10px] mt-0.5 tracking-tight">Team</span>
        </button>
      )}
    </nav>
  );
};
