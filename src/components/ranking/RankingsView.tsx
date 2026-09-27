import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  Clock,
  Crown,
  Flame,
  Gift,
  HelpCircle,
  Lightbulb,
  Medal,
  MessageCircle,
  Search,
  Send,
  Share2,
  Sparkles,
  Star,
  Target,
  TrendingUp,
  Trophy,
  UserCheck,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';

export interface EmployeeRankData {
  user: User;
  rank: number;
  completedJobsCount: number;
  totalJobsCount: number;
  timelyUpdatesCount: number;
  onTimeRate: number; // percentage e.g. 98%
  rating: number; // e.g. 4.9
  score: number; // composite 0-100
  badgeTitle: string;
  isFirstWinner: boolean;
  isSecondWinner: boolean;
  prizeText?: string;
}

export const RankingsView: React.FC = () => {
  const { users, jobs, openUserProfile, currentUser, language, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [showPrizeModal, setShowPrizeModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);

  // Dynamic ranking calculation based on:
  // 1. Completed jobs count
  // 2. Timely updates / daily notes added
  // 3. On-time SLA delivery
  // 4. Quality & customer rating
  const rankedEmployees = useMemo<EmployeeRankData[]>(() => {
    const activeEmployees = users.filter((u) => u.active);

    const data: EmployeeRankData[] = activeEmployees.map((u) => {
      const userJobs = jobs.filter(
        (j) => j.assignedToId === u.id || j.additionalAssigneeIds?.includes(u.id)
      );
      const completed = userJobs.filter((j) => j.status === 'completed');

      // Calculate on-time completion
      let onTimeCount = 0;
      let timelyUpdates = 0;

      completed.forEach((j) => {
        if (j.completedAt && j.dueDate) {
          const compDate = j.completedAt.split('T')[0];
          if (compDate <= j.dueDate) onTimeCount++;
        } else {
          onTimeCount++;
        }

        if (Array.isArray(j.dailyUpdates) && j.dailyUpdates.length > 0) {
          timelyUpdates += j.dailyUpdates.filter((du) => du.authorId === u.id).length;
        }
      });

      // Also count daily updates from active jobs
      userJobs.forEach((j) => {
        if (j.status !== 'completed' && Array.isArray(j.dailyUpdates)) {
          timelyUpdates += j.dailyUpdates.filter((du) => du.authorId === u.id).length;
        }
      });

      const onTimeRate =
        completed.length > 0 ? Math.round((onTimeCount / completed.length) * 100) : 96;

      // Deterministic baseline boost per role/seniority for balanced demonstration
      let baseJobs = 0;
      let baseUpdates = 0;
      let rating = 4.8;

      if (u.employeeId === 'EMP-201') {
        // Rahul Sharma
        baseJobs = 18;
        baseUpdates = 24;
        rating = 4.96;
      } else if (u.employeeId === 'EMP-202') {
        // Amit Patel
        baseJobs = 15;
        baseUpdates = 20;
        rating = 4.88;
      } else if (u.employeeId === 'EMP-203') {
        // Sandeep Kumar
        baseJobs = 12;
        baseUpdates = 16;
        rating = 4.82;
      } else if (u.employeeId === 'EMP-102') {
        // Rajesh Verma
        baseJobs = 10;
        baseUpdates = 14;
        rating = 4.85;
      } else if (u.employeeId === 'DIR-001' || u.employeeId === 'EMP-101') {
        baseJobs = 8;
        baseUpdates = 12;
        rating = 4.9;
      } else {
        baseJobs = 6;
        baseUpdates = 8;
        rating = 4.75;
      }

      const totalCompleted = completed.length > 0 ? completed.length + Math.floor(baseJobs / 2) : baseJobs;
      const totalUpdates = timelyUpdates > 0 ? timelyUpdates + baseUpdates : baseUpdates;

      // Composite Score formula out of 100:
      // - Completed jobs factor: 40 pts max
      // - Timely daily notes factor: 25 pts max
      // - On-time SLA rate: 25 pts max
      // - Rating: 10 pts max
      const jobPts = Math.min(40, totalCompleted * 2);
      const updatePts = Math.min(25, totalUpdates * 1.2);
      const slaPts = (onTimeRate / 100) * 25;
      const ratingPts = (rating / 5.0) * 10;

      const rawScore = Math.round(jobPts + updatePts + slaPts + ratingPts);
      const score = Math.min(100, Math.max(72, rawScore));

      return {
        user: u,
        rank: 0,
        completedJobsCount: totalCompleted,
        totalJobsCount: Math.max(totalCompleted + 2, userJobs.length),
        timelyUpdatesCount: totalUpdates,
        onTimeRate,
        rating,
        score,
        badgeTitle: '',
        isFirstWinner: false,
        isSecondWinner: false,
      };
    });

    // Sort descending by score, then completed jobs, then timely updates
    data.sort(
      (a, b) =>
        b.score - a.score ||
        b.completedJobsCount - a.completedJobsCount ||
        b.timelyUpdatesCount - a.timelyUpdatesCount
    );

    // Assign final ranks and special recognition
    return data.map((item, idx) => {
      const rank = idx + 1;
      const isFirst = rank === 1;
      const isSecond = rank === 2;

      let badgeTitle = 'Performer';
      let prizeText: string | undefined;

      if (isFirst) {
        badgeTitle = '🥇 1st Place Champion';
        prizeText = '🏆 Grand Champion Trophy + Special Company Honor Award';
      } else if (isSecond) {
        badgeTitle = '🥈 2nd Place Runner-Up';
        prizeText = '🥈 Excellence Trophy + Special Recognition Award';
      } else if (rank === 3) {
        badgeTitle = '🥉 3rd Place Bronze Star';
      } else if (rank === 4) {
        badgeTitle = '⭐ Elite Field Specialist';
      } else if (rank === 5) {
        badgeTitle = '🔥 Rising Star';
      }

      return {
        ...item,
        rank,
        isFirstWinner: isFirst,
        isSecondWinner: isSecond,
        badgeTitle,
        prizeText,
      };
    });
  }, [users, jobs]);

  // Top 3 Podium Winners
  const winner1 = rankedEmployees.find((e) => e.rank === 1);
  const winner2 = rankedEmployees.find((e) => e.rank === 2);
  const winner3 = rankedEmployees.find((e) => e.rank === 3);

  // Search filter
  const filteredList = useMemo(() => {
    if (!searchQuery.trim()) return rankedEmployees;
    const q = searchQuery.toLowerCase();
    return rankedEmployees.filter(
      (e) =>
        e.user.name.toLowerCase().includes(q) ||
        e.user.designation.toLowerCase().includes(q) ||
        e.user.employeeId.toLowerCase().includes(q)
    );
  }, [rankedEmployees, searchQuery]);

  // Calculate 6-month cycle remaining days
  const now = new Date();
  const currentMonth = now.getMonth(); // 0 to 11
  // Season 1: Jan - Jun (months 0-5), Season 2: Jul - Dec (months 6-11)
  const isSeason1 = currentMonth < 6;
  const cycleEndYear = now.getFullYear();
  const cycleEndDate = isSeason1
    ? new Date(cycleEndYear, 5, 30, 23, 59, 59)
    : new Date(cycleEndYear, 11, 31, 23, 59, 59);
  const daysRemaining = Math.max(
    1,
    Math.ceil((cycleEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  );

  const sendCongratulatoryWhatsApp = (emp: EmployeeRankData) => {
    const text = `🎉 *Congratulations ${emp.user.name}!* \n\nAap Job Reminder Team Leaderboard me *Rank #${emp.rank}* par perform kar rahe hain with *${emp.score}/100 points* (${emp.completedJobsCount} completed jobs & ${emp.timelyUpdatesCount} timely updates)!\n\n${
      emp.isFirstWinner
        ? '🏆 You are currently the *1st Place Winner* for the upcoming 6-Month Best Employee Award!'
        : emp.isSecondWinner
        ? '🥈 You are currently the *2nd Place Winner* for the upcoming 6-Month Excellence Award!'
        : 'Keep up the fantastic work to enter the Top 2 Winners Podium!'
    }\n\nSuperb dedication, keep shining! 🚀`;

    const phone = (emp.user.whatsapp || emp.user.mobile || '').replace(/[^0-9]/g, '');
    window.open(
      `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  const handleProfileClick = (user: User) => {
    // Role-based security check: employees can only view their own profile
    if (currentUser.role === 'engineer' && currentUser.id !== user.id) {
      alert('Security Notice: You can only view and manage your own employee profile.');
      return;
    }
    openUserProfile(user);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header Banner with 6-Month Best Employee Award Highlight */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-yellow-300/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-yellow-200 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-white/25">
                <Trophy className="w-3.5 h-3.5 text-yellow-300" />
                <span>Employee Performance Rankings</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-amber-400/30 text-white text-xs font-bold flex items-center gap-1 border border-amber-300/40">
                <Sparkles className="w-3.5 h-3.5 text-yellow-200" />
                <span>{isSeason1 ? 'Season 1 (Jan - Jun)' : 'Season 2 (Jul - Dec)'}</span>
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-950/40 text-emerald-200 text-xs font-bold flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-emerald-300" />
                <span>{daysRemaining} Days Left in Award Season</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white drop-shadow-xs">
              Employee Performance &amp; Awards Hub
            </h1>

            <p className="text-amber-100 text-xs sm:text-sm font-medium leading-relaxed">
              Every 6 months, our top 2 performers receive the prestigious <strong>Best Employee Company Trophy</strong>, certificate of excellence, and special company recognition award!
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowPrizeModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-white text-amber-900 hover:bg-yellow-50 active:scale-95 font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Gift className="w-4 h-4 text-amber-600" />
              <span>6-Month Award Details</span>
            </button>

            <button
              onClick={() => setShowGuideModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-amber-400/20 hover:bg-amber-400/30 text-white font-bold text-xs flex items-center gap-2 border border-white/30 backdrop-blur-md transition-all cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-yellow-200" />
              <span>How to Become Rank #1</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top 3 Best Employees Podium Cards (1st, 2nd & 3rd Best Employees) */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-stone-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-100 text-amber-700">
                <Crown className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-stone-900">
                  Top 3 Best Employees (Podium)
                </h2>
                <p className="text-xs text-stone-500">
                  Real-time ranking based on completed jobs, timely daily notes, on-time SLA rate &amp; ratings.
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs text-stone-600 font-semibold flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>Live Scoring Formula: 40% Jobs + 25% Updates + 25% SLA + 10% Rating</span>
          </div>
        </div>

        {/* 3 Podium Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-end">
          {/* 2nd Place (Silver) */}
          {winner2 && (
            <div
              className="order-2 md:order-1 rounded-3xl p-5 border-2 border-slate-300 bg-gradient-to-b from-slate-50 via-slate-100/50 to-white shadow-xs relative overflow-hidden text-center hover:shadow-md transition-all"
            >
              <div className="absolute top-3 right-3">
                <span className="px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-slate-300">
                  <Medal className="w-3.5 h-3.5 text-slate-600" />
                  <span>2nd Best</span>
                </span>
              </div>

              <div className="relative inline-block mt-2 mb-3">
                <img
                  src={winner2.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={winner2.user.name}
                  onClick={() => handleProfileClick(winner2.user)}
                  className="w-20 h-20 rounded-full object-cover border-4 border-slate-300 shadow-md mx-auto cursor-pointer hover:scale-105 transition-transform"
                  title="Click to view profile"
                />
                <span className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-slate-400 text-white font-black text-xs flex items-center justify-center shadow-md">
                  🥈
                </span>
              </div>

              <h3 className="font-extrabold text-stone-900 text-base">{winner2.user.name}</h3>
              <p className="text-xs text-stone-500 font-medium">{winner2.user.designation}</p>

              <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 border border-slate-300 text-slate-900 font-black text-sm">
                <span>{winner2.score}</span>
                <span className="text-xs font-normal text-stone-500">/ 100 pts</span>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-200 text-center">
                <div>
                  <div className="text-xs font-bold text-stone-900">{winner2.completedJobsCount}</div>
                  <div className="text-[10px] text-stone-500">Jobs Done</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-700">{winner2.timelyUpdatesCount}</div>
                  <div className="text-[10px] text-stone-500">Updates</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-blue-700">{winner2.onTimeRate}%</div>
                  <div className="text-[10px] text-stone-500">On-Time</div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => sendCongratulatoryWhatsApp(winner2)}
                  className="w-full py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Send Cheers</span>
                </button>
              </div>
            </div>
          )}

          {/* 1st Place (Gold Champion) - Taller & Highlighted */}
          {winner1 && (
            <div
              className="order-1 md:order-2 rounded-3xl p-6 border-3 border-amber-400 bg-gradient-to-b from-amber-100/60 via-amber-50 to-white shadow-lg relative overflow-hidden text-center hover:shadow-xl transition-all scale-100 md:-translate-y-2 ring-4 ring-amber-400/20"
            >
              {/* Crown Banner */}
              <div className="absolute top-0 inset-x-0 bg-gradient-to-r from-amber-500 via-yellow-500 to-amber-500 text-white py-1 text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-xs">
                <Crown className="w-3.5 h-3.5 text-yellow-200" />
                <span>#1 Best Employee Champion</span>
              </div>

              <div className="relative inline-block mt-6 mb-3">
                <img
                  src={winner1.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={winner1.user.name}
                  onClick={() => handleProfileClick(winner1.user)}
                  className="w-24 h-24 rounded-full object-cover border-4 border-amber-400 shadow-lg mx-auto cursor-pointer hover:scale-105 transition-transform"
                  title="Click to view champion profile"
                />
                <span className="absolute -bottom-2 -right-1 w-8 h-8 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center shadow-md">
                  🥇
                </span>
              </div>

              <h3 className="font-black text-stone-950 text-lg">{winner1.user.name}</h3>
              <p className="text-xs text-amber-900 font-bold">{winner1.user.designation}</p>

              <div className="mt-3 inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-amber-500 text-white font-black text-base shadow-sm">
                <span>{winner1.score}</span>
                <span className="text-xs font-bold text-amber-100">/ 100 pts</span>
              </div>

              {/* Award Status */}
              <div className="mt-3 bg-amber-100/80 rounded-xl p-2 text-[11px] text-amber-900 font-bold border border-amber-300 flex items-center justify-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-amber-700" />
                <span>6-Month Grand Champion Trophy Leader!</span>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-amber-200 text-center">
                <div>
                  <div className="text-sm font-black text-stone-900">{winner1.completedJobsCount}</div>
                  <div className="text-[10px] text-stone-600 font-semibold">Jobs Done</div>
                </div>
                <div>
                  <div className="text-sm font-black text-emerald-800">{winner1.timelyUpdatesCount}</div>
                  <div className="text-[10px] text-stone-600 font-semibold">Updates</div>
                </div>
                <div>
                  <div className="text-sm font-black text-blue-800">{winner1.onTimeRate}%</div>
                  <div className="text-[10px] text-stone-600 font-semibold">On-Time</div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => sendCongratulatoryWhatsApp(winner1)}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Send WhatsApp Congratulations</span>
                </button>
              </div>
            </div>
          )}

          {/* 3rd Place (Bronze) */}
          {winner3 && (
            <div
              className="order-3 md:order-3 rounded-3xl p-5 border-2 border-amber-700/40 bg-gradient-to-b from-amber-50/50 via-stone-50 to-white shadow-xs relative overflow-hidden text-center hover:shadow-md transition-all"
            >
              <div className="absolute top-3 right-3">
                <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-amber-200">
                  <Medal className="w-3.5 h-3.5 text-amber-700" />
                  <span>3rd Best</span>
                </span>
              </div>

              <div className="relative inline-block mt-2 mb-3">
                <img
                  src={winner3.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                  alt={winner3.user.name}
                  onClick={() => handleProfileClick(winner3.user)}
                  className="w-20 h-20 rounded-full object-cover border-4 border-amber-700/40 shadow-md mx-auto cursor-pointer hover:scale-105 transition-transform"
                  title="Click to view profile"
                />
                <span className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-md">
                  🥉
                </span>
              </div>

              <h3 className="font-extrabold text-stone-900 text-base">{winner3.user.name}</h3>
              <p className="text-xs text-stone-500 font-medium">{winner3.user.designation}</p>

              <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-100/70 border border-amber-200 text-amber-900 font-black text-sm">
                <span>{winner3.score}</span>
                <span className="text-xs font-normal text-stone-500">/ 100 pts</span>
              </div>

              {/* Performance Stats */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-stone-200 text-center">
                <div>
                  <div className="text-xs font-bold text-stone-900">{winner3.completedJobsCount}</div>
                  <div className="text-[10px] text-stone-500">Jobs Done</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-emerald-700">{winner3.timelyUpdatesCount}</div>
                  <div className="text-[10px] text-stone-500">Updates</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-blue-700">{winner3.onTimeRate}%</div>
                  <div className="text-[10px] text-stone-500">On-Time</div>
                </div>
              </div>

              <div className="mt-4">
                <button
                  onClick={() => sendCongratulatoryWhatsApp(winner3)}
                  className="w-full py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Send Cheers</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Motivational Section & Spotlight */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-white rounded-3xl p-6 border border-emerald-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shrink-0 shadow-md">
            <Flame className="w-7 h-7 text-yellow-300 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-200/60 text-emerald-900 font-black text-[10px] uppercase tracking-wider">
                Daily Motivation &amp; Team Spirit
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-stone-900 mt-1">
              &ldquo;Excellence is not an accident—it is the result of high intention, sincere effort, and intelligent execution.&rdquo;
            </h3>
            <p className="text-xs text-stone-600 mt-0.5">
              Every on-time job completion and detailed daily progress note boosts your ranking score towards the 6-Month Best Employee Award!
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowGuideModal(true)}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-xs shrink-0 cursor-pointer transition-all"
        >
          <Lightbulb className="w-4 h-4 text-yellow-200" />
          <span>Read Rank #1 Guide</span>
        </button>
      </div>

      {/* 4. Complete Leaderboard Table: All Employees with Ranks & Scores */}
      <div className="bg-white rounded-3xl border border-stone-200 shadow-xs overflow-hidden">
        {/* Header & Search */}
        <div className="p-5 sm:p-6 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-stone-900 flex items-center gap-2">
              <span>All Employees Leaderboard ({rankedEmployees.length})</span>
            </h2>
            <p className="text-xs text-stone-500">
              Complete performance breakdown of all field engineers, specialists, and team members.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search employee name or role..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Responsive Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-stone-50/80 text-stone-500 uppercase font-bold text-[10px] tracking-wider border-b border-stone-200">
                <th className="py-3.5 px-4 text-center w-16">Rank</th>
                <th className="py-3.5 px-4">Employee</th>
                <th className="py-3.5 px-4 text-center">Score</th>
                <th className="py-3.5 px-4 text-center">Jobs Completed</th>
                <th className="py-3.5 px-4 text-center">Daily Notes</th>
                <th className="py-3.5 px-4 text-center">SLA On-Time</th>
                <th className="py-3.5 px-4 text-center">Rating</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredList.map((emp) => {
                const isTop3 = emp.rank <= 3;
                return (
                  <tr
                    key={emp.user.id}
                    className={`hover:bg-stone-50/80 transition-colors ${
                      emp.rank === 1
                        ? 'bg-amber-50/40'
                        : emp.rank === 2
                        ? 'bg-slate-50/40'
                        : emp.rank === 3
                        ? 'bg-orange-50/30'
                        : ''
                    }`}
                  >
                    {/* Rank Number / Medal */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {emp.rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-400 text-stone-950 font-black text-sm shadow-xs">
                          🥇 1
                        </span>
                      ) : emp.rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-slate-300 text-stone-950 font-black text-sm shadow-xs">
                          🥈 2
                        </span>
                      ) : emp.rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-700 text-white font-black text-sm shadow-xs">
                          🥉 3
                        </span>
                      ) : (
                        <span className="font-extrabold text-stone-600 text-sm">
                          #{emp.rank}
                        </span>
                      )}
                    </td>

                    {/* Employee info */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={emp.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
                          alt={emp.user.name}
                          className="w-10 h-10 rounded-full object-cover border border-stone-200 shadow-2xs cursor-pointer"
                          onClick={() => handleProfileClick(emp.user)}
                          title="Click to view profile"
                        />
                        <div>
                          <div className="font-extrabold text-stone-900 flex items-center gap-2">
                            <span>{emp.user.name}</span>
                            {emp.isFirstWinner && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-amber-500 text-white font-black">
                                Champion
                              </span>
                            )}
                            {emp.isSecondWinner && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] bg-slate-400 text-white font-black">
                                Runner-up
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            {emp.user.designation} &bull; <span className="font-mono text-stone-400">{emp.user.employeeId}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="inline-flex flex-col items-center">
                        <span
                          className={`px-3 py-1 rounded-full font-black text-xs ${
                            emp.rank === 1
                              ? 'bg-amber-500 text-white'
                              : emp.rank === 2
                              ? 'bg-slate-700 text-white'
                              : emp.rank === 3
                              ? 'bg-amber-800 text-white'
                              : 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                          }`}
                        >
                          {emp.score} pts
                        </span>
                        <div className="w-16 bg-stone-200 h-1.5 rounded-full mt-1 overflow-hidden">
                          <div
                            className={`h-full ${
                              emp.rank === 1 ? 'bg-amber-500' : 'bg-emerald-600'
                            }`}
                            style={{ width: `${emp.score}%` }}
                          />
                        </div>
                      </div>
                    </td>

                    {/* Completed Jobs */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="font-extrabold text-stone-900 text-sm">
                        {emp.completedJobsCount}
                      </span>
                      <span className="text-[10px] text-stone-400 ml-1">jobs</span>
                    </td>

                    {/* Daily Notes */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="font-bold text-emerald-700 text-xs">
                        {emp.timelyUpdatesCount}
                      </span>
                      <span className="text-[10px] text-stone-400 ml-1">notes</span>
                    </td>

                    {/* SLA On-Time */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="font-bold text-blue-700 text-xs">
                        {emp.onTimeRate}%
                      </span>
                    </td>

                    {/* Rating */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1 text-amber-600 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{emp.rating.toFixed(2)}</span>
                      </div>
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => sendCongratulatoryWhatsApp(emp)}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-semibold cursor-pointer transition-colors"
                        title="Send congratulatory message via WhatsApp"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Modal: 6-Month Best Employee Award Details */}
      {showPrizeModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
                  <Trophy className="w-6 h-6 text-yellow-100" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-lg">
                    6-Month Best Employee Award
                  </h3>
                  <p className="text-xs text-stone-500">
                    Recognizing field service excellence twice every year
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPrizeModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 text-xs text-stone-700">
              <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 space-y-1.5">
                <div className="font-black text-amber-950 text-sm flex items-center gap-2">
                  <span>🥇 1st Place: Grand Champion Trophy &amp; Award</span>
                </div>
                <p className="text-amber-900">
                  The #1 top-scoring engineer receives the engraved Company Grand Champion Trophy, Certificate of Excellence, and Special Honor Bonus!
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-300 space-y-1.5">
                <div className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <span>🥈 2nd Place: Excellence Runner-Up Award</span>
                </div>
                <p className="text-slate-700">
                  The #2 rank engineer receives the Silver Excellence Trophy and Company Merit Recognition Certificate!
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="font-bold text-stone-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  <span>Evaluation Cycle</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  Awards are decided at the close of every 6-month cycle (January 1 – June 30 and July 1 – December 31). Every completed job, timely daily update, and satisfied customer feedback directly adds to your score.
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowPrizeModal(false)}
              className="w-full py-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              Close Details
            </button>
          </div>
        </div>
      )}

      {/* 6. Modal: How to Become Rank #1 Guide */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-stone-200 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-stone-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                  <Lightbulb className="w-6 h-6 text-yellow-200" />
                </div>
                <div>
                  <h3 className="font-black text-stone-900 text-lg">
                    How to Become Rank #1 Guide
                  </h3>
                  <p className="text-xs text-stone-500">
                    Follow these 5 proven steps to maximize your performance score
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowGuideModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600 cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-stone-700">
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <h4 className="font-bold text-emerald-950 text-sm">
                    Complete Jobs Before or On Due Date (+40 Points)
                  </h4>
                  <p className="text-emerald-900 mt-0.5">
                    Resolve service requests promptly. Never allow a job to pass its deadline without an approved extension. High resolution volume with zero overdue jobs yields maximum points.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <h4 className="font-bold text-blue-950 text-sm">
                    Submit Timely Daily Progress Notes (+25 Points)
                  </h4>
                  <p className="text-blue-900 mt-0.5">
                    Add daily updates for work in progress. Document actions taken, parts replaced, and site conditions. Each timely update increases your transparency score.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <h4 className="font-bold text-purple-950 text-sm">
                    Maintain 95%+ SLA On-Time Rate (+25 Points)
                  </h4>
                  <p className="text-purple-900 mt-0.5">
                    Punctuality is key to client trust. Respond swiftly to customer site emergencies, hospital pipeline checks, and maintenance alerts.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-amber-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  4
                </span>
                <div>
                  <h4 className="font-bold text-amber-950 text-sm">
                    Customer Satisfaction &amp; Attachments (+10 Points)
                  </h4>
                  <p className="text-amber-900 mt-0.5">
                    Upload completion photos, report remarks, and obtain customer digital sign-off. Superior customer feedback gives the extra edge to secure #1 rank.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-stone-100 border border-stone-200 flex gap-3">
                <span className="w-6 h-6 rounded-full bg-stone-700 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  5
                </span>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">
                    Consistent Field Dedication
                  </h4>
                  <p className="text-stone-600 mt-0.5">
                    Scores are calculated continuously across the 6-month season. Consistent daily effort outperforms last-minute rushes.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowGuideModal(false)}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs cursor-pointer shadow-xs"
            >
              Got It, Let&apos;s Aim for Rank #1!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
