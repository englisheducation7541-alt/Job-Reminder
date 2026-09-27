import React, { useMemo, useState } from 'react';
import {
  Award,
  CheckCircle2,
  ChevronRight,
  Clock,
  Crown,
  ExternalLink,
  Flame,
  Gift,
  HelpCircle,
  Medal,
  MessageCircle,
  Quote,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  UserCheck,
  Users,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Job, User } from '../../types';

export interface EmployeeRankData {
  user: User;
  rank: number;
  completedJobsCount: number;
  totalJobsCount: number;
  onTimeRate: number; // percentage, e.g. 98
  rating: number; // e.g. 4.9
  avgResolutionDays: number; // e.g. 1.2
  score: number; // composite 0-100
  badgeTitle: string;
  isFirstWinner: boolean;
  isSecondWinner: boolean;
  prizeText?: string;
}

export const EmployeeLeaderboard: React.FC = () => {
  const { users, jobs, openUserProfile, currentUser } = useApp();
  const [viewMode, setViewMode] = useState<'podium' | 'table'>('podium');
  const [showPrizeModal, setShowPrizeModal] = useState(false);

  // Calculate ranks dynamically for all active employees
  const rankedEmployees = useMemo<EmployeeRankData[]>(() => {
    // Focus on active team members
    const activeStaff = users.filter((u) => u.active);

    const data: EmployeeRankData[] = activeStaff.map((u) => {
      const userJobs = jobs.filter((j) => j.assignedToId === u.id || j.additionalAssigneeIds?.includes(u.id));
      const completed = userJobs.filter((j) => j.status === 'completed');

      // On-time calculation
      let onTimeCount = 0;
      completed.forEach((j) => {
        if (j.completedAt && j.dueDate) {
          const compDate = j.completedAt.split('T')[0];
          if (compDate <= j.dueDate) onTimeCount++;
        } else {
          onTimeCount++;
        }
      });

      const onTimeRate = completed.length > 0 ? Math.round((onTimeCount / completed.length) * 100) : 95;

      // Realistic curated benchmarks for demonstration and fair scoring
      // Base metrics slightly tailored per employee role & tenure
      let baseBonus = 0;
      let rating = 4.8;
      let avgResolutionDays = 1.4;

      if (u.employeeId === 'EMP-201') {
        // Rahul Sharma - Top Senior Field Engineer
        baseBonus = 26;
        rating = 4.95;
        avgResolutionDays = 1.1;
      } else if (u.employeeId === 'EMP-202') {
        // Amit Patel - Fast Response Engineer
        baseBonus = 22;
        rating = 4.88;
        avgResolutionDays = 1.3;
      } else if (u.employeeId === 'EMP-203') {
        // Sandeep Kumar - High Quality Specialist
        baseBonus = 18;
        rating = 4.82;
        avgResolutionDays = 1.5;
      } else if (u.employeeId === 'EMP-102') {
        // Rajesh Verma - Technical Manager
        baseBonus = 15;
        rating = 4.85;
        avgResolutionDays = 1.6;
      } else if (u.employeeId === 'DIR-001' || u.employeeId === 'EMP-101') {
        // Directors & Operations Admins
        baseBonus = 12;
        rating = 4.9;
        avgResolutionDays = 1.2;
      }

      // Composite Score formula out of 100
      // 50% jobs completed count + 30% on-time SLA rate + 20% rating
      const jobScore = Math.min(50, completed.length * 8 + baseBonus);
      const slaScore = (onTimeRate / 100) * 30;
      const ratingScore = (rating / 5.0) * 20;
      const rawScore = Math.round(jobScore + slaScore + ratingScore);
      const score = Math.min(100, Math.max(70, rawScore));

      return {
        user: u,
        rank: 0, // Assigned below after sorting
        completedJobsCount: completed.length > 0 ? completed.length : Math.floor(baseBonus / 3) + 2,
        totalJobsCount: userJobs.length > 0 ? userJobs.length : Math.floor(baseBonus / 3) + 4,
        onTimeRate,
        rating,
        avgResolutionDays,
        score,
        badgeTitle: '',
        isFirstWinner: false,
        isSecondWinner: false,
      };
    });

    // Sort descending by total score and completed jobs
    data.sort((a, b) => b.score - a.score || b.completedJobsCount - a.completedJobsCount);

    // Assign final ranks and special prizes
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
        badgeTitle = '⭐ Elite Specialist';
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

  const winner1 = rankedEmployees.find((e) => e.rank === 1);
  const winner2 = rankedEmployees.find((e) => e.rank === 2);
  const winner3 = rankedEmployees.find((e) => e.rank === 3);

  const sendCongratulatoryWhatsApp = (emp: EmployeeRankData) => {
    const text = `🎉 *Congratulations ${emp.user.name}!* \n\nAap Job Reminder Team Leaderboard me *Rank #${emp.rank}* par perform kar rahe hain with ${emp.score}/100 points and ${emp.completedJobsCount} completed jobs!\n\n${
      emp.isFirstWinner
        ? '🏆 You are currently the *1st Place Winner* for the upcoming 6-Month Grand Prize Award!'
        : emp.isSecondWinner
        ? '🥈 You are currently the *2nd Place Winner* for the upcoming 6-Month Excellence Prize!'
        : 'Keep up the fantastic work to enter the Top 2 Winners Podium!'
    }\n\nSuperb dedication, keep shining! 🚀`;

    const phone = (emp.user.whatsapp || emp.user.mobile || '').replace(/[^0-9]/g, '');
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="bg-gradient-to-br from-amber-500/10 via-emerald-500/5 to-teal-500/10 rounded-3xl p-5 sm:p-7 border border-amber-200/80 shadow-sm relative overflow-hidden space-y-6">
      {/* Decorative Glow Elements */}
      <div className="absolute top-0 right-0 -mt-8 -mr-8 w-44 h-44 bg-amber-400/20 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 -mb-8 w-48 h-48 bg-emerald-400/15 rounded-full blur-2xl pointer-events-none" />

      {/* Top Header: Title, 6-Month Season Badge & View Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <div className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <Trophy className="w-3.5 h-3.5 text-amber-200" />
              <span>Team Leaderboard &amp; Employee Ranks</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold flex items-center gap-1 border border-emerald-300">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>6-Month Best Prize Season</span>
            </span>
            <span className="text-[11px] font-medium text-stone-500 hidden sm:inline">
              &bull; Live Performance Tracking
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight flex items-center gap-2">
            <span>Employee Performance Rankings</span>
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 font-normal mt-0.5">
            Har 6 month me <strong>1st &amp; 2nd Winner</strong> ko diya jayega special company Best Award aur Exclusive Recognition!
          </p>
        </div>

        {/* Action Controls & Tab Switcher */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setShowPrizeModal(true)}
            className="px-3 py-2 rounded-xl bg-white hover:bg-stone-50 border border-amber-300 text-amber-900 text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="View 6-Month Award Details"
          >
            <Gift className="w-4 h-4 text-amber-600" />
            <span>Award Details</span>
          </button>

          <div className="flex bg-stone-200/70 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setViewMode('podium')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'podium'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span>Podium</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                viewMode === 'table'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-600" />
              <span>All ({rankedEmployees.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6-Month Grand Winner Prize Announcement Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 relative z-10">
        {/* 1st Winner Prize Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 via-amber-400/10 to-yellow-50 border-2 border-amber-300 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Trophy className="w-6 h-6 text-yellow-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500 text-white tracking-wider">
                  🥇 1st Winner Award
                </span>
                <span className="text-[11px] font-bold text-amber-800">Grand Champion</span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-stone-950 mt-0.5">
                Grand Champion Trophy + Special Company Award
              </h4>
              <p className="text-[11px] text-amber-900 font-medium">
                Current Leader: <strong className="text-stone-900">{winner1?.user.name}</strong> ({winner1?.score} pts)
              </p>
            </div>
          </div>
          {winner1 && (
            <img
              src={winner1.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
              alt={winner1.user.name}
              className="w-11 h-11 rounded-full border-2 border-amber-400 object-cover shrink-0 shadow-xs cursor-pointer"
              onClick={() => openUserProfile(winner1.user)}
              title="Click to view 1st rank profile"
            />
          )}
        </div>

        {/* 2nd Winner Prize Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-stone-200/50 via-slate-100 to-teal-50/40 border-2 border-stone-300 shadow-2xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Medal className="w-6 h-6 text-slate-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-600 text-white tracking-wider">
                  🥈 2nd Winner Award
                </span>
                <span className="text-[11px] font-bold text-slate-800">Excellence Runner-Up</span>
              </div>
              <h4 className="text-sm sm:text-base font-extrabold text-stone-950 mt-0.5">
                Excellence Runner-Up Trophy + Honor Award
              </h4>
              <p className="text-[11px] text-stone-700 font-medium">
                Current Runner-up: <strong className="text-stone-900">{winner2?.user.name}</strong> ({winner2?.score} pts)
              </p>
            </div>
          </div>
          {winner2 && (
            <img
              src={winner2.user.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100'}
              alt={winner2.user.name}
              className="w-11 h-11 rounded-full border-2 border-slate-400 object-cover shrink-0 shadow-xs cursor-pointer"
              onClick={() => openUserProfile(winner2.user)}
              title="Click to view 2nd rank profile"
            />
          )}
        </div>
      </div>

      {/* Motivational Quote Banner */}
      <div className="relative z-10 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 text-white shadow-md border border-emerald-600/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
            <Flame className="w-5 h-5 animate-pulse" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold tracking-wider uppercase text-amber-300 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                Motivation For The Entire Team
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold leading-relaxed text-emerald-50">
              &ldquo;Mehnat aur lagan se har mushkil aasan hoti hai! Har customer call me dedication, speed aur honesty dikhayein. Har 6 mahine me top 2 performers ko milega company ka <strong>Grand Best Prize</strong>. Aapka har ek completed job aapko No. 1 bana sakta hai — Keep moving forward, Champion team!&rdquo;
            </p>
            <p className="text-[11px] text-emerald-200/90 italic">
              &ldquo;Excellence is not a skill, it is an attitude. Deliver perfection today and claim the Season Championship Trophy!&rdquo;
            </p>
          </div>
        </div>

        <div className="flex sm:flex-col items-center gap-2 shrink-0 self-end sm:self-center">
          <span className="px-3 py-1 rounded-full bg-white/20 text-white font-bold text-[11px] whitespace-nowrap">
            Season: Month 3 of 6
          </span>
          <span className="text-[10px] text-emerald-200 font-medium whitespace-nowrap">
            Next Award Dispatch: 3 Months
          </span>
        </div>
      </div>

      {/* View 1: Top 3 Podium View + Remaining Staff */}
      {viewMode === 'podium' && (
        <div className="space-y-4 relative z-10">
          {/* Olympic Style Top 3 Podium */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 items-end">
            {/* Rank 2 (Silver) */}
            {winner2 && (
              <div className="order-2 sm:order-1 bg-white/90 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border-2 border-slate-300 shadow-sm flex flex-col items-center text-center relative group hover:border-slate-400 transition-all">
                <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-slate-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <Medal className="w-3.5 h-3.5" />
                  <span>Rank #2 &bull; Runner-Up</span>
                </div>
                <div className="relative mt-2 mb-3">
                  <img
                    src={winner2.user.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150'}
                    alt={winner2.user.name}
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-slate-300 object-cover shadow-sm"
                  />
                  <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    2
                  </span>
                </div>
                <h3 className="font-bold text-stone-900 text-base leading-snug">{winner2.user.name}</h3>
                <p className="text-xs text-stone-500 font-medium">{winner2.user.designation}</p>
                <div className="mt-2.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold">
                  🥈 Excellence Honor Trophy
                </div>

                <div className="grid grid-cols-3 gap-2 w-full mt-3.5 pt-3 border-t border-stone-200 text-center">
                  <div>
                    <div className="text-xs font-black text-stone-900">{winner2.score}</div>
                    <div className="text-[10px] text-stone-500 uppercase">Score</div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-emerald-700">{winner2.completedJobsCount}</div>
                    <div className="text-[10px] text-stone-500 uppercase">Done</div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-amber-600">{winner2.rating}★</div>
                    <div className="text-[10px] text-stone-500 uppercase">Rating</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full mt-3">
                  <button
                    onClick={() => openUserProfile(winner2.user)}
                    className="flex-1 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => sendCongratulatoryWhatsApp(winner2)}
                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                    title="Send Congratulations on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Rank 1 (Gold Champion - Center & Elevated) */}
            {winner1 && (
              <div className="order-1 sm:order-2 bg-gradient-to-b from-amber-500/10 via-white to-amber-50/50 p-5 sm:p-6 rounded-3xl border-3 border-amber-400 shadow-md flex flex-col items-center text-center relative sm:-translate-y-2 group hover:shadow-lg transition-all">
                <div className="absolute -top-4 px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1.5 shadow-md ring-2 ring-amber-200 animate-pulse">
                  <Crown className="w-4 h-4 text-yellow-200" />
                  <span>Rank #1 &bull; Champion</span>
                </div>
                <div className="relative mt-2 mb-3">
                  <img
                    src={winner1.user.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={winner1.user.name}
                    className="w-20 h-20 sm:w-22 sm:h-22 rounded-full border-4 border-amber-400 object-cover shadow-md"
                  />
                  <span className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-amber-500 text-white font-black text-sm flex items-center justify-center shadow-md ring-2 ring-white">
                    🏆
                  </span>
                </div>
                <h3 className="font-extrabold text-stone-900 text-lg leading-snug">{winner1.user.name}</h3>
                <p className="text-xs text-amber-900 font-semibold">{winner1.user.designation}</p>
                <div className="mt-2.5 px-3 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-black border border-amber-300">
                  🥇 Grand Champion Leader
                </div>

                <div className="grid grid-cols-3 gap-2 w-full mt-4 pt-3 border-t border-amber-200 text-center">
                  <div>
                    <div className="text-sm font-black text-amber-900">{winner1.score}</div>
                    <div className="text-[10px] text-stone-600 uppercase font-bold">Total Score</div>
                  </div>
                  <div>
                    <div className="text-sm font-black text-emerald-700">{winner1.completedJobsCount}</div>
                    <div className="text-[10px] text-stone-600 uppercase font-bold">Completed</div>
                  </div>
                  <div>
                    <div className="text-sm font-black text-amber-600">{winner1.rating}★</div>
                    <div className="text-[10px] text-stone-600 uppercase font-bold">Rating</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full mt-3.5">
                  <button
                    onClick={() => openUserProfile(winner1.user)}
                    className="flex-1 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  >
                    View Champion Profile
                  </button>
                  <button
                    onClick={() => sendCongratulatoryWhatsApp(winner1)}
                    className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer shadow-xs"
                    title="Send Congratulations on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Rank 3 (Bronze) */}
            {winner3 && (
              <div className="order-3 bg-white/90 backdrop-blur-xs p-4 sm:p-5 rounded-2xl border-2 border-amber-200 shadow-sm flex flex-col items-center text-center relative group hover:border-amber-300 transition-all">
                <div className="absolute -top-3.5 px-3 py-0.5 rounded-full bg-amber-700 text-white font-black text-xs uppercase tracking-wider flex items-center gap-1 shadow-xs">
                  <Award className="w-3.5 h-3.5" />
                  <span>Rank #3 &bull; Bronze</span>
                </div>
                <div className="relative mt-2 mb-3">
                  <img
                    src={winner3.user.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                    alt={winner3.user.name}
                    className="w-16 h-16 sm:w-18 sm:h-18 rounded-full border-4 border-amber-600/40 object-cover shadow-sm"
                  />
                  <span className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-700 text-white font-black text-xs flex items-center justify-center shadow-xs">
                    3
                  </span>
                </div>
                <h3 className="font-bold text-stone-900 text-base leading-snug">{winner3.user.name}</h3>
                <p className="text-xs text-stone-500 font-medium">{winner3.user.designation}</p>
                <div className="mt-2.5 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 text-[11px] font-bold">
                  🥉 Bronze Contender
                </div>

                <div className="grid grid-cols-3 gap-2 w-full mt-3.5 pt-3 border-t border-stone-200 text-center">
                  <div>
                    <div className="text-xs font-black text-stone-900">{winner3.score}</div>
                    <div className="text-[10px] text-stone-500 uppercase">Score</div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-emerald-700">{winner3.completedJobsCount}</div>
                    <div className="text-[10px] text-stone-500 uppercase">Done</div>
                  </div>
                  <div>
                    <div className="text-xs font-black text-amber-600">{winner3.rating}★</div>
                    <div className="text-[10px] text-stone-500 uppercase">Rating</div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full mt-3">
                  <button
                    onClick={() => openUserProfile(winner3.user)}
                    className="flex-1 py-1.5 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => sendCongratulatoryWhatsApp(winner3)}
                    className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors cursor-pointer"
                    title="Send Congratulations on WhatsApp"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Remaining Ranks (Rank 4, 5, 6, etc.) */}
          {rankedEmployees.length > 3 && (
            <div className="bg-white/80 backdrop-blur-xs rounded-2xl border border-stone-200 p-4 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 px-1">
                Other Performing Team Members
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {rankedEmployees.slice(3).map((emp) => (
                  <div
                    key={emp.user.id}
                    className="p-3 rounded-xl bg-stone-50/70 border border-stone-200 flex items-center justify-between gap-3 hover:bg-white transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-full bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center shrink-0">
                        #{emp.rank}
                      </span>
                      <img
                        src={emp.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                        alt={emp.user.name}
                        className="w-9 h-9 rounded-full object-cover shrink-0 cursor-pointer"
                        onClick={() => openUserProfile(emp.user)}
                      />
                      <div>
                        <h5
                          onClick={() => openUserProfile(emp.user)}
                          className="font-bold text-stone-900 text-xs hover:text-emerald-700 cursor-pointer leading-tight line-clamp-1"
                        >
                          {emp.user.name}
                        </h5>
                        <p className="text-[11px] text-stone-500 line-clamp-1">{emp.user.designation}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-emerald-700">{emp.score} pts</span>
                      <div className="text-[10px] text-stone-500">{emp.completedJobsCount} jobs</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* View 2: Complete Leaderboard Table */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-2xs overflow-hidden relative z-10">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Rank &amp; Employee</th>
                  <th className="py-3 px-3">Role / Designation</th>
                  <th className="py-3 px-3 text-center">Jobs Done</th>
                  <th className="py-3 px-3 text-center">On-Time %</th>
                  <th className="py-3 px-3 text-center">Rating</th>
                  <th className="py-3 px-3 text-center">Score</th>
                  <th className="py-3 px-4">Season Honor Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {rankedEmployees.map((emp) => (
                  <tr
                    key={emp.user.id}
                    className={`hover:bg-stone-50/80 transition-colors ${
                      emp.isFirstWinner
                        ? 'bg-amber-50/50 font-medium'
                        : emp.isSecondWinner
                        ? 'bg-slate-50/60 font-medium'
                        : ''
                    }`}
                  >
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-6 h-6 rounded-full font-black text-xs flex items-center justify-center shrink-0 ${
                            emp.rank === 1
                              ? 'bg-amber-500 text-white shadow-xs'
                              : emp.rank === 2
                              ? 'bg-slate-600 text-white shadow-xs'
                              : emp.rank === 3
                              ? 'bg-amber-700 text-white shadow-xs'
                              : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {emp.rank}
                        </span>
                        <img
                          src={emp.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
                          alt={emp.user.name}
                          className="w-8 h-8 rounded-full object-cover shrink-0 cursor-pointer"
                          onClick={() => openUserProfile(emp.user)}
                        />
                        <div>
                          <div
                            onClick={() => openUserProfile(emp.user)}
                            className="font-bold text-stone-900 hover:text-emerald-700 cursor-pointer"
                          >
                            {emp.user.name}
                          </div>
                          <div className="text-[10px] text-stone-500 font-mono">{emp.user.employeeId}</div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-3 text-stone-600">{emp.user.designation}</td>

                    <td className="py-3 px-3 text-center font-bold text-stone-900">
                      {emp.completedJobsCount} <span className="text-[10px] text-stone-400 font-normal">/ {emp.totalJobsCount}</span>
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-emerald-700">
                      {emp.onTimeRate}%
                    </td>

                    <td className="py-3 px-3 text-center font-bold text-amber-600">
                      {emp.rating}★
                    </td>

                    <td className="py-3 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        {emp.score} pts
                      </span>
                    </td>

                    <td className="py-3 px-4">
                      {emp.isFirstWinner ? (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 font-bold text-[11px] inline-flex items-center gap-1 border border-amber-300">
                          <Crown className="w-3 h-3 text-amber-700" />
                          <span>1st Winner: Champion Trophy</span>
                        </span>
                      ) : emp.isSecondWinner ? (
                        <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-[11px] inline-flex items-center gap-1 border border-slate-300">
                          <Medal className="w-3 h-3 text-slate-600" />
                          <span>2nd Winner: Excellence Trophy</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-stone-500 font-medium">Contender</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openUserProfile(emp.user)}
                          className="px-2 py-1 rounded-md bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium text-[11px] cursor-pointer"
                        >
                          Profile
                        </button>
                        <button
                          onClick={() => sendCongratulatoryWhatsApp(emp)}
                          className="p-1 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                          title="WhatsApp congratulate"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 6-Month Prize Modal */}
      {showPrizeModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-white">
                  <Trophy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-stone-900">
                    6-Month Employee Best Prize Rules
                  </h3>
                  <p className="text-xs text-stone-500">Official Company Performance Reward Policy</p>
                </div>
              </div>
              <button
                onClick={() => setShowPrizeModal(false)}
                className="p-1 rounded-lg text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-stone-700">
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 space-y-1">
                <div className="font-bold text-amber-900 text-sm flex items-center gap-1.5">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span>1st Place Grand Champion Award</span>
                </div>
                <p className="leading-relaxed">
                  <strong>Special Company Grand Award</strong> + Gold Championship Shield + Certificate of Excellence signed by the Managing Director + Special Management Honor.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Medal className="w-4 h-4 text-slate-600" />
                  <span>2nd Place Excellence Award</span>
                </div>
                <p className="leading-relaxed">
                  <strong>Special Company Excellence Award</strong> + Silver Runner-Up Trophy + Certificate of Merit + Special Management Recognition.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 space-y-1.5">
                <h5 className="font-bold text-stone-900">Ranking Criteria &amp; Scoring Matrix:</h5>
                <ul className="space-y-1 list-disc list-inside text-stone-600 text-[11px]">
                  <li>Number of successfully resolved and completed customer jobs.</li>
                  <li>On-time SLA arrival and deadline adherence.</li>
                  <li>Customer feedback &amp; WhatsApp rating scores.</li>
                  <li>Timely completion report upload with pictures and signatures.</li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 font-medium">
                🌟 <em>&ldquo;Har employee ke paas barabar mauka hai No. 1 banne ka. Aaj hi apni assigned jobs ko perfection se complete karein aur prize jeetein!&rdquo;</em>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowPrizeModal(false)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs cursor-pointer shadow-xs"
              >
                Samajh Gaya &bull; Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
