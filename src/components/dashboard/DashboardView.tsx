import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Briefcase,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Eye,
  Filter,
  MessageSquare,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  TrendingUp,
  UserCheck,
  Users,
  Send,
  Building2,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Job, JobActivity, JobPriority, JobStatus } from '../../types';
import { getPriorityBadgeClass, getStatusBadgeClass } from '../../utils/formatters';
import { formatDateDisplay, formatStatusLabel } from '../../utils/whatsappEngine';
import { TopEmployeesBanner } from './TopEmployeesBanner';
import { RecentActivityModal } from './RecentActivityModal';
import { AiDailyBriefingCard } from './AiDailyBriefingCard';

type FilterTab = 'all' | 'today' | 'upcoming' | 'overdue' | 'in_progress' | 'pending';

export const DashboardView: React.FC = () => {
  const {
    jobs,
    users,
    currentUser,
    companySettings,
    activities,
    isRecentActivityModalOpen,
    setIsRecentActivityModalOpen,
    messageLogs,
    setSelectedJobId,
    setActiveTab,
    setIsCreateJobOpen,
    openBulkJobReminders,
    openPaymentReminderModal,
    setIsGlobalSearchOpen,
    openSendWhatsAppModal,
    getUserById,
    getCustomerById,
    getSiteById,
  } = useApp();

  const [activeFilter, setActiveFilter] = useState<FilterTab>('all');
  const [selectedEmployeeFilter, setSelectedEmployeeFilter] = useState<string>('all');
  const [selectedActivityForDetails, setSelectedActivityForDetails] = useState<JobActivity | null>(null);

  // Dates for reference
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  // Base scoped jobs:
  // For field engineer: strictly restricted to their own assigned jobs
  // For admin and manager: all company jobs or filtered by selected employee
  const scopedJobs = useMemo(() => {
    if (currentUser.role === 'engineer') {
      return jobs.filter(
        (j) => j.assignedToId === currentUser.id || j.additionalAssigneeIds?.includes(currentUser.id)
      );
    }
    if (selectedEmployeeFilter !== 'all') {
      return jobs.filter(
        (j) =>
          j.assignedToId === selectedEmployeeFilter ||
          j.additionalAssigneeIds?.includes(selectedEmployeeFilter)
      );
    }
    return jobs;
  }, [jobs, currentUser, selectedEmployeeFilter]);

  // Core KPIs Calculation based on scopedJobs
  const metrics = useMemo(() => {
    const totalJobs = scopedJobs.length;
    const completed = scopedJobs.filter((j) => j.status === 'completed').length;
    const inProgress = scopedJobs.filter((j) => ['in_progress', 'accepted'].includes(j.status)).length;
    const overdue = scopedJobs.filter((j) => j.status === 'overdue').length;
    const pending = scopedJobs.filter((j) =>
      ['new', 'assigned', 'waiting_customer', 'waiting_material', 'waiting_approval', 'on_hold'].includes(j.status)
    ).length;
    const todayJobs = scopedJobs.filter((j) => j.dueDate === todayStr).length;
    const upcomingJobs = scopedJobs.filter(
      (j) => j.dueDate > todayStr && !['completed', 'cancelled'].includes(j.status)
    ).length;
    const totalEmployees = users.filter((u) => u.active).length;
    const completionPercentage = totalJobs > 0 ? Math.round((completed / totalJobs) * 100) : 0;

    return {
      totalJobs,
      pending,
      inProgress,
      completed,
      overdue,
      todayJobs,
      upcomingJobs,
      totalEmployees,
      completionPercentage,
    };
  }, [scopedJobs, users, todayStr]);

  // Priority-wise job statistics
  const priorityStats = useMemo(() => {
    const priorities: {
      priority: JobPriority;
      label: string;
      colorClass: string;
      bgClass: string;
      borderClass: string;
      count: number;
      completed: number;
      inProgress: number;
      pending: number;
      overdue: number;
      percentage: number;
    }[] = [
      {
        priority: 'urgent',
        label: 'Urgent',
        colorClass: 'text-red-700',
        bgClass: 'bg-red-50',
        borderClass: 'border-red-200',
        count: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        overdue: 0,
        percentage: 0,
      },
      {
        priority: 'high',
        label: 'High',
        colorClass: 'text-amber-700',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
        count: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        overdue: 0,
        percentage: 0,
      },
      {
        priority: 'normal',
        label: 'Normal',
        colorClass: 'text-blue-700',
        bgClass: 'bg-blue-50',
        borderClass: 'border-blue-200',
        count: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        overdue: 0,
        percentage: 0,
      },
      {
        priority: 'low',
        label: 'Low',
        colorClass: 'text-stone-700',
        bgClass: 'bg-stone-100',
        borderClass: 'border-stone-200',
        count: 0,
        completed: 0,
        inProgress: 0,
        pending: 0,
        overdue: 0,
        percentage: 0,
      },
    ];

    scopedJobs.forEach((j) => {
      const p = priorities.find((item) => item.priority === j.priority);
      if (p) {
        p.count += 1;
        if (j.status === 'completed') p.completed += 1;
        else if (['in_progress', 'accepted'].includes(j.status)) p.inProgress += 1;
        else if (j.status === 'overdue') p.overdue += 1;
        else p.pending += 1;
      }
    });

    priorities.forEach((p) => {
      p.percentage = scopedJobs.length > 0 ? Math.round((p.count / scopedJobs.length) * 100) : 0;
    });

    return priorities;
  }, [scopedJobs]);

  // Employee-wise job statistics
  const employeeStats = useMemo(() => {
    return users
      .filter((u) => u.active)
      .map((user) => {
        const userJobs = jobs.filter(
          (j) => j.assignedToId === user.id || j.additionalAssigneeIds?.includes(user.id)
        );
        const total = userJobs.length;
        const completed = userJobs.filter((j) => j.status === 'completed').length;
        const inProgress = userJobs.filter((j) => ['in_progress', 'accepted'].includes(j.status)).length;
        const overdue = userJobs.filter((j) => j.status === 'overdue').length;
        const pending = userJobs.filter((j) =>
          ['new', 'assigned', 'waiting_customer', 'waiting_material', 'waiting_approval', 'on_hold'].includes(j.status)
        ).length;
        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return {
          user,
          total,
          completed,
          inProgress,
          overdue,
          pending,
          completionRate,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [users, jobs]);

  // Latest 5 recorded activities from real audit log
  const latestFiveActivities = useMemo(() => {
    return activities.slice(0, 5);
  }, [activities]);

  const formatActivityTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      if (isNaN(d.getTime())) return 'Recently';
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const getActivityBadge = (type: JobActivity['actionType']) => {
    switch (type) {
      case 'employee_added':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Team Added</span>;
      case 'employee_updated':
      case 'profile_updated':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Profile Update</span>;
      case 'employee_deleted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">Team Removed</span>;
      case 'password_changed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Password Reset</span>;
      case 'company_updated':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">Company Settings</span>;
      case 'reminder_sent':
      case 'whatsapp_sent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Reminder</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Completed</span>;
      case 'created':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">Job Created</span>;
      case 'deleted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 border border-red-200">Deleted</span>;
      case 'status_change':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Status Change</span>;
      case 'note_added':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Note Added</span>;
      case 'attachment_added':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">File Added</span>;
      case 'attachment_deleted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">File Removed</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-800 border border-stone-200">{type?.replace(/_/g, ' ') || 'Activity'}</span>;
    }
  };

  // Filtered jobs list based on scopedJobs and activeFilter
  const filteredJobs = useMemo(() => {
    return scopedJobs.filter((j) => {
      // Tab filter
      if (activeFilter === 'today') {
        return j.dueDate === todayStr;
      }
      if (activeFilter === 'upcoming') {
        return j.dueDate > todayStr && !['completed', 'cancelled'].includes(j.status);
      }
      if (activeFilter === 'overdue') {
        return j.status === 'overdue';
      }
      if (activeFilter === 'in_progress') {
        return ['in_progress', 'accepted'].includes(j.status);
      }
      if (activeFilter === 'pending') {
        return ['new', 'assigned', 'waiting_customer', 'waiting_material', 'waiting_approval', 'on_hold'].includes(j.status);
      }
      return true;
    });
  }, [scopedJobs, activeFilter, todayStr]);

  return (
    <div className="space-y-6">
      {/* Top Header with Company Branding & Overall Completion Percentage */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {companySettings?.companyLogo || companySettings?.logoUrl ? (
            <img
              src={companySettings.companyLogo || companySettings.logoUrl}
              alt={companySettings.companyName || 'Company Logo'}
              className="w-14 h-14 rounded-xl object-contain bg-white border border-stone-200 p-1 shadow-2xs shrink-0"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xl shadow-xs shrink-0">
              {(companySettings?.companyName || 'JR').substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                {companySettings?.companyName || 'Job Reminder'}
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
              {companySettings?.gstNumber && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold font-mono bg-emerald-50 text-emerald-800 border border-emerald-200">
                  GST: {companySettings.gstNumber}
                </span>
              )}
            </div>
            <div className="text-xs text-stone-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1">
              {companySettings?.tagline && (
                <span className="font-medium text-stone-700">{companySettings.tagline}</span>
              )}
              {companySettings?.contactNumber && (
                <span className="text-stone-500">📞 {companySettings.contactNumber}</span>
              )}
              {companySettings?.email && (
                <span className="text-stone-500">✉️ {companySettings.email}</span>
              )}
              {companySettings?.address && (
                <span className="text-stone-400 hidden lg:inline">📍 {companySettings.address}</span>
              )}
            </div>
          </div>
        </div>

        {/* Overall Completion Percentage Meter & Actions */}
        <div className="flex items-center gap-2.5 flex-wrap self-start md:self-auto">
          <div className="flex items-center gap-3 bg-emerald-50/70 border border-emerald-200/80 px-3.5 py-2 rounded-xl">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
              {metrics.completionPercentage}%
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950 flex items-center gap-1">
                <span>Overall Completion</span>
              </div>
              <div className="text-[11px] text-emerald-700">
                {metrics.completed} of {metrics.totalJobs} jobs closed
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin/Manager Scoped Operations Filter Bar */}
      {['admin', 'manager', 'director'].includes(currentUser.role) ? (
        <div className="bg-white p-3.5 rounded-2xl border border-stone-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-emerald-600" />
            <span className="text-xs font-bold text-stone-900">Dashboard View:</span>
            <span className="text-xs text-stone-500 hidden sm:inline">
              Filter operational statistics & daily briefing by individual employee:
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedEmployeeFilter}
              onChange={(e) => setSelectedEmployeeFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            >
              <option value="all">🏢 All Company Staff ({jobs.length} Total Jobs)</option>
              <optgroup label="Field Engineers">
                {users
                  .filter((u) => u.active && u.role === 'engineer')
                  .map((u) => {
                    const count = jobs.filter((j) => j.assignedToId === u.id || j.additionalAssigneeIds?.includes(u.id)).length;
                    return (
                      <option key={u.id} value={u.id}>
                        👤 {u.name} — {count} {count === 1 ? 'job' : 'jobs'}
                      </option>
                    );
                  })}
              </optgroup>
              <optgroup label="Managers & Administrators">
                {users
                  .filter((u) => u.active && ['admin', 'manager', 'director'].includes(u.role))
                  .map((u) => {
                    const count = jobs.filter((j) => j.assignedToId === u.id || j.additionalAssigneeIds?.includes(u.id)).length;
                    return (
                      <option key={u.id} value={u.id}>
                        🛡️ {u.name} ({u.role}) — {count} {count === 1 ? 'job' : 'jobs'}
                      </option>
                    );
                  })}
              </optgroup>
            </select>

            {selectedEmployeeFilter !== 'all' && (
              <button
                onClick={() => setSelectedEmployeeFilter('all')}
                className="px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold cursor-pointer"
                title="Reset to All Staff"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white p-3 rounded-xl border border-stone-200 shadow-2xs flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-semibold">Personal Assigned Jobs View:</span>
            <span>Displaying jobs assigned specifically to {currentUser.name} ({scopedJobs.length} active tasks)</span>
          </div>
        </div>
      )}

      {/* AI Daily Briefing Card */}
      <AiDailyBriefingCard userJobs={scopedJobs} role={currentUser.role} />

      {/* Top Section: 1st, 2nd & 3rd Best Employees Podium & 6-Month Award */}
      <TopEmployeesBanner />

      {/* Primary KPI Grid (8 Key Metrics requested: Total, Pending, In Progress, Completed, Overdue, Today's, Upcoming, Total Employees) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Jobs */}
        <div
          onClick={() => setActiveFilter('all')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeFilter === 'all'
              ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
              : 'bg-white text-stone-900 border-stone-200 hover:border-stone-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-semibold ${activeFilter === 'all' ? 'text-stone-300' : 'text-stone-500'}`}>
              Total Jobs
            </span>
            <Briefcase className={`w-3.5 h-3.5 ${activeFilter === 'all' ? 'text-stone-300' : 'text-stone-400'}`} />
          </div>
          <div className="text-xl sm:text-2xl font-black">{metrics.totalJobs}</div>
          <div className={`text-[10px] mt-0.5 ${activeFilter === 'all' ? 'text-stone-400' : 'text-stone-500'}`}>
            All records
          </div>
        </div>

        {/* Pending */}
        <div
          onClick={() => setActiveFilter('pending')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeFilter === 'pending'
              ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
              : 'bg-white text-stone-900 border-stone-200 hover:border-amber-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-semibold ${activeFilter === 'pending' ? 'text-amber-100' : 'text-stone-500'}`}>
              Pending
            </span>
            <Clock className={`w-3.5 h-3.5 ${activeFilter === 'pending' ? 'text-amber-100' : 'text-amber-500'}`} />
          </div>
          <div className={`text-xl sm:text-2xl font-black ${activeFilter === 'pending' ? 'text-white' : 'text-amber-600'}`}>
            {metrics.pending}
          </div>
          <div className={`text-[10px] mt-0.5 ${activeFilter === 'pending' ? 'text-amber-100' : 'text-stone-500'}`}>
            Awaiting action
          </div>
        </div>

        {/* In Progress */}
        <div
          onClick={() => setActiveFilter('in_progress')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeFilter === 'in_progress'
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white text-stone-900 border-stone-200 hover:border-blue-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-semibold ${activeFilter === 'in_progress' ? 'text-blue-100' : 'text-stone-500'}`}>
              In Progress
            </span>
            <TrendingUp className={`w-3.5 h-3.5 ${activeFilter === 'in_progress' ? 'text-blue-100' : 'text-blue-500'}`} />
          </div>
          <div className={`text-xl sm:text-2xl font-black ${activeFilter === 'in_progress' ? 'text-white' : 'text-blue-600'}`}>
            {metrics.inProgress}
          </div>
          <div className={`text-[10px] mt-0.5 ${activeFilter === 'in_progress' ? 'text-blue-100' : 'text-stone-500'}`}>
            Active on site
          </div>
        </div>

        {/* Completed */}
        <div
          onClick={() => setActiveFilter('all')}
          className="p-3.5 rounded-xl bg-white border border-stone-200 hover:border-emerald-300 shadow-2xs transition-all"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-stone-500">Completed</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">{metrics.completed}</div>
          <div className="text-[10px] text-emerald-600 font-medium mt-0.5">
            {metrics.completionPercentage}% resolved
          </div>
        </div>

        {/* Overdue */}
        <div
          onClick={() => setActiveFilter('overdue')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeFilter === 'overdue'
              ? 'bg-red-600 text-white border-red-600 shadow-xs'
              : metrics.overdue > 0
              ? 'bg-red-50/50 border-red-300 hover:border-red-400'
              : 'bg-white border-stone-200 hover:border-stone-300'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-[11px] font-semibold ${
                activeFilter === 'overdue' ? 'text-red-100' : 'text-red-700'
              }`}
            >
              Overdue
            </span>
            <AlertCircle
              className={`w-3.5 h-3.5 ${activeFilter === 'overdue' ? 'text-red-100' : 'text-red-600'}`}
            />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black ${
              activeFilter === 'overdue'
                ? 'text-white'
                : metrics.overdue > 0
                ? 'text-red-700'
                : 'text-stone-800'
            }`}
          >
            {metrics.overdue}
          </div>
          <div
            className={`text-[10px] mt-0.5 ${
              activeFilter === 'overdue' ? 'text-red-100' : 'text-red-600/90 font-medium'
            }`}
          >
            Requires action
          </div>
        </div>

        {/* Today's Jobs */}
        <div
          onClick={() => setActiveFilter('today')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeFilter === 'today'
              ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
              : 'bg-white text-stone-900 border-stone-200 hover:border-teal-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-semibold ${activeFilter === 'today' ? 'text-teal-100' : 'text-stone-500'}`}>
              Today&apos;s Jobs
            </span>
            <Calendar className={`w-3.5 h-3.5 ${activeFilter === 'today' ? 'text-teal-100' : 'text-teal-600'}`} />
          </div>
          <div className={`text-xl sm:text-2xl font-black ${activeFilter === 'today' ? 'text-white' : 'text-teal-700'}`}>
            {metrics.todayJobs}
          </div>
          <div className={`text-[10px] mt-0.5 ${activeFilter === 'today' ? 'text-teal-100' : 'text-stone-500'}`}>
            Due before EOD
          </div>
        </div>

        {/* Upcoming Jobs */}
        <div
          onClick={() => setActiveFilter('upcoming')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            activeFilter === 'upcoming'
              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
              : 'bg-white text-stone-900 border-stone-200 hover:border-purple-300 shadow-2xs'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className={`text-[11px] font-semibold ${activeFilter === 'upcoming' ? 'text-purple-100' : 'text-stone-500'}`}>
              Upcoming
            </span>
            <CalendarCheck className={`w-3.5 h-3.5 ${activeFilter === 'upcoming' ? 'text-purple-100' : 'text-purple-600'}`} />
          </div>
          <div className={`text-xl sm:text-2xl font-black ${activeFilter === 'upcoming' ? 'text-white' : 'text-purple-700'}`}>
            {metrics.upcomingJobs}
          </div>
          <div className={`text-[10px] mt-0.5 ${activeFilter === 'upcoming' ? 'text-purple-100' : 'text-stone-500'}`}>
            Future deadlines
          </div>
        </div>

        {/* Total Employees */}
        <div
          onClick={() => setActiveTab('team')}
          className="p-3.5 rounded-xl bg-white border border-stone-200 hover:border-stone-300 shadow-2xs transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-stone-500">Employees</span>
            <Users className="w-3.5 h-3.5 text-stone-400" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900">{metrics.totalEmployees}</div>
          <div className="text-[10px] text-stone-500 mt-0.5">Active field staff</div>
        </div>
      </div>

      {/* Completion Rate Progress Bar (Clean single-line visual indicator) */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-stone-900">Task Completion Progress</span>
            <span className="text-xs text-stone-500">
              ({metrics.completed} of {metrics.totalJobs} completed)
            </span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-stone-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" /> Completed ({metrics.completed})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500" /> In Progress ({metrics.inProgress})
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" /> Pending ({metrics.pending})
            </span>
            {metrics.overdue > 0 && (
              <span className="flex items-center gap-1 text-red-600 font-semibold">
                <span className="w-2 h-2 rounded-full bg-red-500" /> Overdue ({metrics.overdue})
              </span>
            )}
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="h-3 w-full bg-stone-100 rounded-full overflow-hidden flex">
          <div
            style={{ width: `${metrics.totalJobs > 0 ? (metrics.completed / metrics.totalJobs) * 100 : 0}%` }}
            className="bg-emerald-500 transition-all duration-500"
            title={`Completed: ${metrics.completed}`}
          />
          <div
            style={{ width: `${metrics.totalJobs > 0 ? (metrics.inProgress / metrics.totalJobs) * 100 : 0}%` }}
            className="bg-blue-500 transition-all duration-500"
            title={`In Progress: ${metrics.inProgress}`}
          />
          <div
            style={{ width: `${metrics.totalJobs > 0 ? (metrics.pending / metrics.totalJobs) * 100 : 0}%` }}
            className="bg-amber-400 transition-all duration-500"
            title={`Pending: ${metrics.pending}`}
          />
          <div
            style={{ width: `${metrics.totalJobs > 0 ? (metrics.overdue / metrics.totalJobs) * 100 : 0}%` }}
            className="bg-red-500 transition-all duration-500"
            title={`Overdue: ${metrics.overdue}`}
          />
        </div>
      </div>

      {/* Priority-Wise Breakdown & Recent Updates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Priority-Wise Job Details (1 Column on Desktop) */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Priority-Wise Job Details</span>
              </h2>
              <span className="text-[11px] text-stone-400 font-medium">{jobs.length} Total</span>
            </div>

            <div className="space-y-3">
              {priorityStats.map((p) => (
                <div
                  key={p.priority}
                  className={`p-3 rounded-xl border ${p.borderClass} ${p.bgClass}/40 flex flex-col gap-2`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${p.colorClass}`}>
                        {p.label}
                      </span>
                      <span className="text-[11px] text-stone-500 font-medium">({p.percentage}%)</span>
                    </div>
                    <div className="text-xs font-black text-stone-900">{p.count} jobs</div>
                  </div>

                  {/* Priority Mini Progress Bar */}
                  <div className="w-full bg-stone-200/70 h-1.5 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${p.count > 0 ? (p.completed / p.count) * 100 : 0}%` }}
                      className="bg-emerald-500"
                      title="Completed"
                    />
                    <div
                      style={{ width: `${p.count > 0 ? (p.inProgress / p.count) * 100 : 0}%` }}
                      className="bg-blue-500"
                      title="In Progress"
                    />
                    <div
                      style={{ width: `${p.count > 0 ? (p.overdue / p.count) * 100 : 0}%` }}
                      className="bg-red-500"
                      title="Overdue"
                    />
                  </div>

                  {/* Sub-counts */}
                  <div className="flex items-center justify-between text-[10px] text-stone-500 pt-0.5">
                    <span>{p.completed} completed</span>
                    <span>{p.inProgress} in progress</span>
                    <span>{p.pending} pending</span>
                    {p.overdue > 0 && <span className="text-red-600 font-bold">{p.overdue} overdue</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500">
            <span>Critical Jobs (Urgent + High):</span>
            <span className="font-bold text-stone-900">
              {priorityStats.filter((p) => ['urgent', 'high'].includes(p.priority)).reduce((acc, curr) => acc + curr.count, 0)} jobs
            </span>
          </div>
        </div>

        {/* Recent Updates & Activity Feed (At most 5 rows, Show More & Full Details) */}
        <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Recent Updates &amp; Activity</span>
                </h2>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Live audit trail of all changes made across the organization.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedActivityForDetails(null);
                  setIsRecentActivityModalOpen(true);
                }}
                className="text-xs text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1"
              >
                <span>Complete History ({activities.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2.5">
              {latestFiveActivities.length === 0 ? (
                <div className="text-center py-8 text-stone-400 text-xs bg-stone-50 rounded-xl border border-stone-100">
                  No recent activity recorded yet.
                </div>
              ) : (
                latestFiveActivities.map((act) => {
                  const actor = users.find((u) => u.id === act.actorId);
                  const roleLabel = actor?.role || 'user';
                  const timeFormatted = formatActivityTime(act.timestamp);

                  return (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl border border-stone-100 hover:border-stone-200 hover:bg-stone-50/70 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="mt-0.5 shrink-0">
                          {getActivityBadge(act.actionType)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-stone-800 font-medium leading-snug break-words">
                            {act.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-stone-400 mt-1">
                            <span className="font-semibold text-stone-600 flex items-center gap-1">
                              <span>By {act.actorName}</span>
                              <span className="px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 uppercase text-[9px] font-bold">
                                {roleLabel}
                              </span>
                            </span>
                            <span>•</span>
                            <span className="font-mono text-stone-400">{timeFormatted}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedActivityForDetails(act);
                            setIsRecentActivityModalOpen(true);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-700 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Full Details</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Show More Option */}
          <div className="pt-4 mt-4 border-t border-stone-100 text-center">
            <button
              type="button"
              onClick={() => {
                setSelectedActivityForDetails(null);
                setIsRecentActivityModalOpen(true);
              }}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-800 cursor-pointer inline-flex items-center gap-1 px-4 py-1.5 rounded-xl hover:bg-emerald-50 transition-colors"
            >
              <span>Show More Recent Activities ({activities.length} Total)</span>
              <span>&rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* Employee-Wise Job Details Section (Restricted to Admins, Managers & Directors) */}
      {['admin', 'manager', 'director'].includes(currentUser.role) && (
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Employee-Wise Job Details &amp; Workload</span>
              </h2>
              <p className="text-xs text-stone-500 mt-0.5">
                Breakdown of assignments, completion progress, and active tasks across all active staff.
              </p>
            </div>

            <button
              onClick={() => setActiveTab('team')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 self-start sm:self-auto cursor-pointer"
            >
              Manage Team &rarr;
            </button>
          </div>

        {/* Employee Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {employeeStats.map(({ user, total, completed, inProgress, pending, overdue, completionRate }) => (
            <div
              key={user.id}
              className="p-4 rounded-xl border border-stone-200 hover:border-emerald-300 bg-stone-50/30 hover:bg-white transition-all shadow-2xs flex flex-col justify-between gap-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <img
                    src={user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover border border-stone-200 shrink-0"
                  />
                  <div>
                    <div className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                      <span>{user.name}</span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.2 rounded font-bold ${
                          user.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === 'manager'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-stone-500">{user.designation}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-stone-900">{total}</span>
                  <div className="text-[10px] text-stone-400">jobs</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between text-[10px] text-stone-500 mb-1">
                  <span>Completion Rate</span>
                  <span className="font-bold text-stone-800">{completionRate}%</span>
                </div>
                <div className="w-full bg-stone-200 h-1.5 rounded-full overflow-hidden">
                  <div
                    style={{ width: `${completionRate}%` }}
                    className="h-full bg-emerald-500 rounded-full"
                  />
                </div>
              </div>

              {/* Status Chips */}
              <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-100">
                <span className="text-emerald-700 font-semibold">{completed} Done</span>
                <span className="text-blue-700 font-semibold">{inProgress} In Prog</span>
                <span className="text-amber-700 font-semibold">{pending} Pending</span>
                {overdue > 0 && <span className="text-red-700 font-bold">{overdue} Overdue</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
      )}

      {/* Jobs Overview List with Quick Filters */}
      <div id="jobs-table-preview" className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Table Header & Quick Filters */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold text-stone-900 flex items-center gap-2">
              <Briefcase className="w-4 h-4 text-emerald-600" />
              <span>Jobs Directory &amp; Status</span>
              <span className="text-xs font-normal text-stone-500">
                ({filteredJobs.length} {filteredJobs.length === 1 ? 'record' : 'records'})
              </span>
            </h2>
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All' },
              { id: 'today', label: "Today's" },
              { id: 'upcoming', label: 'Upcoming' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'pending', label: 'Pending' },
              { id: 'overdue', label: 'Overdue' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id as FilterTab)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeFilter === tab.id
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs List (Responsive Table / Mobile Cards) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 text-[11px] uppercase tracking-wider font-semibold text-stone-500 border-b border-stone-200">
              <tr>
                <th className="px-4 py-3">Job ID &amp; Title</th>
                <th className="px-4 py-3">Customer &amp; Site</th>
                <th className="px-4 py-3">Assignee</th>
                <th className="px-4 py-3">Deadline</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 font-normal">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                    No jobs match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredJobs.slice(0, 10).map((job) => {
                  const customer = getCustomerById(job.customerId);
                  const site = getSiteById(job.siteId);
                  const assignee = getUserById(job.assignedToId);
                  const isDueToday = job.dueDate === todayStr;

                  return (
                    <tr
                      key={job.id}
                      onClick={() => setSelectedJobId(job.id)}
                      className="hover:bg-stone-50/80 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-stone-900">{job.title}</div>
                        <div className="text-[11px] font-mono text-stone-400">{job.jobId}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-stone-800">{customer?.companyName || 'N/A'}</div>
                        <div className="text-[11px] text-stone-500 truncate max-w-[150px]">
                          {site?.siteName || customer?.city || 'Main Site'}
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <img
                            src={assignee?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=60'}
                            alt={assignee?.name}
                            className="w-5 h-5 rounded-full object-cover"
                          />
                          <span className="font-medium text-stone-800">{assignee?.name || 'Unassigned'}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className={`font-medium ${isDueToday ? 'text-teal-700 font-bold' : 'text-stone-800'}`}>
                          {job.dueDate} {isDueToday && <span className="text-[10px] bg-teal-100 text-teal-800 px-1 rounded">Today</span>}
                        </div>
                        <div className="text-[11px] text-stone-400">{job.dueTime}</div>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[10px] uppercase border font-bold ${getPriorityBadgeClass(
                            job.priority
                          )}`}
                        >
                          {job.priority}
                        </span>
                      </td>

                      <td className="px-4 py-3 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadgeClass(
                            job.status
                          )}`}
                        >
                          {formatStatusLabel(job.status)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => openSendWhatsAppModal(job)}
                            className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer transition-colors"
                            title="Send WhatsApp Reminder"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSelectedJobId(job.id)}
                            className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 cursor-pointer"
                            title="View Job Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {filteredJobs.length > 10 && (
          <div className="p-3 bg-stone-50 border-t border-stone-100 text-center">
            <button
              onClick={() => setActiveTab('jobs')}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 cursor-pointer"
            >
              View all {filteredJobs.length} jobs in Jobs Directory &rarr;
            </button>
          </div>
        )}
      </div>

      {/* Complete Recent Activity Audit Log Modal with Full Details Inspector */}
      <RecentActivityModal
        isOpen={isRecentActivityModalOpen}
        onClose={() => {
          setIsRecentActivityModalOpen(false);
          setSelectedActivityForDetails(null);
        }}
        initialSelectedActivity={selectedActivityForDetails}
      />
    </div>
  );
};
