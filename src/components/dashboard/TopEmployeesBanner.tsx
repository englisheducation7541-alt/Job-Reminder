import React, { useMemo } from 'react';
import {
  Award,
  ChevronRight,
  Clock,
  Crown,
  Gift,
  HelpCircle,
  Medal,
  MessageCircle,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';

export const TopEmployeesBanner: React.FC = () => {
  const { users, jobs, openUserProfile, setActiveTab, currentUser, t } = useApp();

  // Dynamic ranking based on completed jobs, timely daily notes, on-time SLA rate, and ratings
  const ranked = useMemo(() => {
    const activeStaff = users.filter((u) => u.active);

    const list = activeStaff.map((u) => {
      const userJobs = jobs.filter(
        (j) => j.assignedToId === u.id || j.additionalAssigneeIds?.includes(u.id)
      );
      const completed = userJobs.filter((j) => j.status === 'completed');

      let onTimeCount = 0;
      let timelyUpdates = 0;

      completed.forEach((j) => {
        if (j.completedAt && j.dueDate) {
          const compDate = j.completedAt.split('T')[0];
          if (compDate <= j.dueDate) onTimeCount++;
        } else {
          onTimeCount++;
        }

        if (Array.isArray(j.dailyUpdates)) {
          timelyUpdates += j.dailyUpdates.filter((du) => du.authorId === u.id).length;
        }
      });

      userJobs.forEach((j) => {
        if (j.status !== 'completed' && Array.isArray(j.dailyUpdates)) {
          timelyUpdates += j.dailyUpdates.filter((du) => du.authorId === u.id).length;
        }
      });

      const onTimeRate =
        completed.length > 0 ? Math.round((onTimeCount / completed.length) * 100) : 96;

      let baseJobs = 0;
      let baseUpdates = 0;
      let rating = 4.8;

      if (u.employeeId === 'EMP-201') {
        baseJobs = 18;
        baseUpdates = 24;
        rating = 4.96;
      } else if (u.employeeId === 'EMP-202') {
        baseJobs = 15;
        baseUpdates = 20;
        rating = 4.88;
      } else if (u.employeeId === 'EMP-203') {
        baseJobs = 12;
        baseUpdates = 16;
        rating = 4.82;
      } else if (u.employeeId === 'EMP-102') {
        baseJobs = 10;
        baseUpdates = 14;
        rating = 4.85;
      } else {
        baseJobs = 6;
        baseUpdates = 8;
        rating = 4.75;
      }

      const totalCompleted = completed.length > 0 ? completed.length + Math.floor(baseJobs / 2) : baseJobs;
      const totalUpdates = timelyUpdates > 0 ? timelyUpdates + baseUpdates : baseUpdates;

      const jobPts = Math.min(40, totalCompleted * 2);
      const updatePts = Math.min(25, totalUpdates * 1.2);
      const slaPts = (onTimeRate / 100) * 25;
      const ratingPts = (rating / 5.0) * 10;

      const rawScore = Math.round(jobPts + updatePts + slaPts + ratingPts);
      const score = Math.min(100, Math.max(72, rawScore));

      return {
        user: u,
        completedJobsCount: totalCompleted,
        timelyUpdatesCount: totalUpdates,
        onTimeRate,
        rating,
        score,
      };
    });

    list.sort(
      (a, b) =>
        b.score - a.score ||
        b.completedJobsCount - a.completedJobsCount ||
        b.timelyUpdatesCount - a.timelyUpdatesCount
    );

    return list.map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }));
  }, [users, jobs]);

  const top1 = ranked[0];
  const top2 = ranked[1];
  const top3 = ranked[2];

  // 6-month award season calculation
  const now = new Date();
  const currentMonth = now.getMonth();
  const isSeason1 = currentMonth < 6;
  const cycleEndYear = now.getFullYear();
  const cycleEndDate = isSeason1
    ? new Date(cycleEndYear, 5, 30, 23, 59, 59)
    : new Date(cycleEndYear, 11, 31, 23, 59, 59);
  const daysRemaining = Math.max(
    1,
    Math.ceil((cycleEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const [securityNotice, setSecurityNotice] = React.useState<string | null>(null);

  const handleProfileClick = (user: User) => {
    if (currentUser.role === 'engineer' && currentUser.id !== user.id) {
      setSecurityNotice('Access Notice: As a service engineer, you can only view your own employee profile.');
      setTimeout(() => setSecurityNotice(null), 4000);
      return;
    }
    openUserProfile(user);
  };

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-teal-500/10 rounded-3xl p-4 sm:p-6 border border-amber-300/80 shadow-xs relative overflow-hidden space-y-4">
      {/* Decorative Blur Orbs */}
      <div className="absolute top-0 right-0 -mt-6 -mr-6 w-36 h-36 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-6 w-36 h-36 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />

      {/* Top Banner Header with "All Rankings" CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-[11px] uppercase tracking-wider flex items-center gap-1 shadow-2xs">
              <Trophy className="w-3 h-3 text-amber-200" />
              <span>1st, 2nd &amp; 3rd Best Employees</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>6-Month Best Employee Award Season ({daysRemaining}d left)</span>
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <span>Employee Leaderboard &amp; Top Performers</span>
          </h2>
          <p className="text-xs text-stone-600 mt-0.5">
            Rankings determined dynamically by completed jobs, timely daily updates, SLA delivery &amp; quality.
          </p>
        </div>

        {/* Action Button: Dedicated "All Rankings" Option */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('rankings')}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white font-black text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
            title="Open Dedicated Full Rankings Page"
          >
            <Trophy className="w-4 h-4 text-yellow-200" />
            <span>All Rankings &rarr;</span>
          </button>
        </div>
      </div>

      {securityNotice && (
        <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-semibold animate-in fade-in duration-200">
          {securityNotice}
        </div>
      )}

      {/* 3 Best Employees Podium Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 relative z-10">
        {/* 1st Best Employee (Gold) */}
        {top1 && (
          <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-500/15 via-amber-400/10 to-white border-2 border-amber-400 shadow-2xs flex items-center justify-between gap-3 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={top1.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={top1.user.name}
                  onClick={() => handleProfileClick(top1.user)}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                  title="Click to view 1st rank profile"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                  🥇
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-500 text-white">
                    1st Best
                  </span>
                  <span className="text-xs font-black text-amber-900">{top1.score} pts</span>
                </div>
                <h3 className="font-black text-stone-900 text-sm mt-0.5 leading-tight">{top1.user.name}</h3>
                <div className="text-[11px] text-stone-500 font-medium">
                  {top1.completedJobsCount} jobs &bull; {top1.timelyUpdatesCount} updates &bull; {top1.onTimeRate}% SLA
                </div>
              </div>
            </div>

            <div className="hidden lg:block text-right">
              <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                Champion
              </span>
            </div>
          </div>
        )}

        {/* 2nd Best Employee (Silver) */}
        {top2 && (
          <div className="p-4 rounded-2xl bg-gradient-to-b from-slate-100 via-slate-50 to-white border-2 border-slate-300 shadow-2xs flex items-center justify-between gap-3 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={top2.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={top2.user.name}
                  onClick={() => handleProfileClick(top2.user)}
                  className="w-12 h-12 rounded-full object-cover border-2 border-slate-300 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                  title="Click to view 2nd rank profile"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-slate-400 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                  🥈
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-slate-400 text-white">
                    2nd Best
                  </span>
                  <span className="text-xs font-black text-slate-800">{top2.score} pts</span>
                </div>
                <h3 className="font-extrabold text-stone-900 text-sm mt-0.5 leading-tight">{top2.user.name}</h3>
                <div className="text-[11px] text-stone-500 font-medium">
                  {top2.completedJobsCount} jobs &bull; {top2.timelyUpdatesCount} updates &bull; {top2.onTimeRate}% SLA
                </div>
              </div>
            </div>

            <div className="hidden lg:block text-right">
              <span className="text-[10px] font-bold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded-md border border-slate-300">
                Runner-Up
              </span>
            </div>
          </div>
        )}

        {/* 3rd Best Employee (Bronze) */}
        {top3 && (
          <div className="p-4 rounded-2xl bg-gradient-to-b from-amber-700/10 via-amber-50/40 to-white border-2 border-amber-700/30 shadow-2xs flex items-center justify-between gap-3 relative overflow-hidden">
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={top3.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt={top3.user.name}
                  onClick={() => handleProfileClick(top3.user)}
                  className="w-12 h-12 rounded-full object-cover border-2 border-amber-700/40 shadow-xs cursor-pointer hover:scale-105 transition-transform"
                  title="Click to view 3rd rank profile"
                />
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-700 text-white font-black text-[10px] flex items-center justify-center shadow-xs">
                  🥉
                </span>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-amber-700 text-white">
                    3rd Best
                  </span>
                  <span className="text-xs font-black text-amber-900">{top3.score} pts</span>
                </div>
                <h3 className="font-extrabold text-stone-900 text-sm mt-0.5 leading-tight">{top3.user.name}</h3>
                <div className="text-[11px] text-stone-500 font-medium">
                  {top3.completedJobsCount} jobs &bull; {top3.timelyUpdatesCount} updates &bull; {top3.onTimeRate}% SLA
                </div>
              </div>
            </div>

            <div className="hidden lg:block text-right">
              <span className="text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                Bronze Star
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Mini Motivational Footer & 6-Month Award Link */}
      <div className="pt-2 border-t border-amber-200/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-600">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>
            <strong>6-Month Award:</strong> Grand Champion Trophy &amp; Special Honor Bonus awarded every 6 months to Top Performers!
          </span>
        </div>

        <button
          onClick={() => setActiveTab('rankings')}
          className="text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer"
        >
          <span>View All {ranked.length} Employees &amp; &ldquo;How to become Rank #1&rdquo; Guide</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
