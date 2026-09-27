import React, { useState, useMemo } from 'react';
import {
  Bot,
  Sparkles,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Zap,
  TrendingUp,
  User,
  Shield,
  ChevronRight,
  ListTodo,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Job, User as UserType } from '../../types';

interface AiDailyBriefingCardProps {
  userJobs: Job[];
  role: string;
}

export const AiDailyBriefingCard: React.FC<AiDailyBriefingCardProps> = ({ userJobs, role }) => {
  const { currentUser, users, language, setSelectedJobId } = useApp();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [customBriefingVersion, setCustomBriefingVersion] = useState(0);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Compute pending metrics
  const stats = useMemo(() => {
    const pendingJobs = userJobs.filter(
      (j) => !['completed', 'cancelled'].includes(j.status)
    );
    const overdue = pendingJobs.filter((j) => j.status === 'overdue');
    const highPriority = pendingJobs.filter(
      (j) => j.priority === 'urgent' || j.priority === 'high'
    );
    const scheduledToday = pendingJobs.filter((j) => j.dueDate === todayStr);
    const inProgress = pendingJobs.filter((j) => j.status === 'in_progress');
    const waitingMaterialOrCust = pendingJobs.filter(
      (j) => j.status === 'waiting_material' || j.status === 'waiting_customer'
    );

    return {
      totalPending: pendingJobs.length,
      overdueCount: overdue.length,
      highPriorityCount: highPriority.length,
      todayCount: scheduledToday.length,
      inProgressCount: inProgress.length,
      waitingCount: waitingMaterialOrCust.length,
      overdueList: overdue.slice(0, 3),
      todayList: scheduledToday.slice(0, 3),
      highPriorityList: highPriority.slice(0, 3),
    };
  }, [userJobs, todayStr]);

  // Handle manual AI refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setCustomBriefingVersion((v) => v + 1);
      setIsRefreshing(false);
    }, 600);
  };

  // Generate role-specific description based on currentLanguage
  const briefing = useMemo(() => {
    const isEngineer = role === 'engineer';

    if (language === 'hi') {
      // HINDI VERSION
      if (isEngineer) {
        return {
          title: `आज का व्यक्तिगत कार्य योजना (Action Plan)`,
          badge: 'एआई कार्य सारांश',
          statusSummary: `आपके पास कुल ${stats.totalPending} सक्रिय कार्य (Pending Jobs) हैं, जिनमें से ${stats.todayCount} आज के लिए निर्धारित हैं और ${stats.overdueCount} समय-सीमा पार कर चुके हैं।`,
          priorityAction:
            stats.overdueCount > 0
              ? `प्राथमिकता: सबसे पहले ओवरड्यू कार्य "${stats.overdueList[0]?.title || 'आवश्यक कार्य'}" पर तत्काल विजिट करें और ग्राहक से संपर्क कर आज ही समाधान करें।`
              : stats.todayCount > 0
              ? `प्राथमिकता: आज का मुख्य कार्य "${stats.todayList[0]?.title || 'निर्धारित कार्य'}" समय पर पूर्ण करें।`
              : `सभी नियमित कार्य प्रगति पर हैं। साइट पर कार्य शुरू करने के बाद 'Daily Notes' अपडेट करना न भूलें।`,
          recommendedSteps: [
            stats.overdueCount > 0
              ? `1. ओवरड्यू कार्य (${stats.overdueCount}) का स्टेटस तुरंत अपडेट करें या सामग्री आवश्यकता नोट करें।`
              : `1. आज के निर्धारित जॉब्स (${stats.todayCount}) के ग्राहक से साइट विज़िट समय कन्फर्म करें।`,
            `2. कार्य प्रगति के फोटो या रिपोर्ट जॉब डिटेल सेक्शन में अपलोड करें।`,
            `3. साइट कार्य पूर्ण होते ही 'Mark Completed' करके कस्टमर साइन-ऑफ लें।`,
          ],
        };
      } else {
        // Admin / Manager / Director
        return {
          title: `दैनिक संचालन विश्लेषण एवं कार्य योजना (Executive Briefing)`,
          badge: 'एआई ऑपरेशन्स गाइडेंस',
          statusSummary: `कंपनी में वर्तमान में कुल ${stats.totalPending} कार्य लंबित (Pending) हैं। ${stats.overdueCount} कार्य ओवरड्यू हैं और ${stats.highPriorityCount} उच्च प्राथमिकता (High/Urgent) में हैं। ${stats.todayCount} कार्य आज निष्पादित होने हैं।`,
          priorityAction:
            stats.overdueCount > 0
              ? `तत्काल प्रशासनिक कार्रवाई: ${stats.overdueCount} ओवरड्यू कार्यों पर संबंधित फील्ड इंजीनियरों से तुरंत संपर्क करें। स्पेयर पार्ट्स या ग्राहक अप्रूवल से जुड़े ब्लॉकर सुलझाएं।`
              : stats.highPriorityCount > 0
              ? `उच्च प्राथमिकता फोकस: ${stats.highPriorityCount} अर्जेंट जॉब्स पर नज़र रखें और सुनिश्चित करें कि आज शाम 6 बजे से पहले प्रगति रिपोर्ट दर्ज हो।`
              : `संचालन सुचारू है। सभी सक्रिय असाइनमेंट्स सही समय-सीमा के भीतर प्रगति पर हैं।`,
          recommendedSteps: [
            `1. ओवरड्यू एवं अर्जेंट जॉब्स वाले इंजीनियरों को बल्क व्हाट्सएप रिमाइंडर प्रेषित करें।`,
            `2. आज की साइट विजिट्स (${stats.todayCount}) के लिए मटेरियल उपलब्धता सुनिश्चित करें।`,
            `3. शाम को 'Employee Rankings' और कंपलीशन रेश्यो का मूल्यांकन करें।`,
          ],
        };
      }
    } else if (language === 'hinglish') {
      // HINGLISH VERSION
      if (isEngineer) {
        return {
          title: `Aaj Ka Personal Work Action Plan`,
          badge: 'AI Work Summary',
          statusSummary: `Aapke paas total ${stats.totalPending} pending jobs hain. Jinme se ${stats.todayCount} aaj scheduled hain aur ${stats.overdueCount} overdue hain.`,
          priorityAction:
            stats.overdueCount > 0
              ? `Top Priority: Sabse pehle overdue job "${stats.overdueList[0]?.title || 'Pending Task'}" ko resolve karein aur customer site pe timely update dein.`
              : stats.todayCount > 0
              ? `Top Priority: Aaj ke assigned job "${stats.todayList[0]?.title || 'Scheduled Task'}" ko time pe execute karein.`
              : `Sabhi jobs track par hain. Work start karne ke baad app me Daily Progress Note zaroor update karein.`,
          recommendedSteps: [
            stats.overdueCount > 0
              ? `1. Overdue jobs (${stats.overdueCount}) ka immediate status update karein.`
              : `1. Aaj ke scheduled jobs (${stats.todayCount}) ke clients ko advance call karein.`,
            `2. Site visit ke baad attachments aur report photo upload karein.`,
            `3. Kaam complete hone par 'Mark Completed' par click karein.`,
          ],
        };
      } else {
        return {
          title: `Operations AI Briefing & Today's Action Plan`,
          badge: 'Smart Operations',
          statusSummary: `Total company pipeline me ${stats.totalPending} pending jobs hain. ${stats.overdueCount} overdue, ${stats.highPriorityCount} urgent/high priority, aur ${stats.todayCount} jobs aaj execute hone hain.`,
          priorityAction:
            stats.overdueCount > 0
              ? `Immediate Operational Focus: ${stats.overdueCount} overdue jobs delay me hain. Assigned field engineers se follow-up karein aur customer escalation rokne ke liye action lein.`
              : stats.highPriorityCount > 0
              ? `Focus on High Priority: ${stats.highPriorityCount} critical jobs aaj monitor karein aur timely delivery ensure karein.`
              : `Company operations track par chal rahe hain. Field staff workload balanced hai.`,
          recommendedSteps: [
            `1. Field team ko pending tasks ke liye WhatsApp reminders check karein.`,
            `2. Critical client sites (${stats.todayCount}) ka status midday track karein.`,
            `3. Completed jobs ka review karein aur daily verification close karein.`,
          ],
        };
      }
    } else {
      // ENGLISH DEFAULT
      if (isEngineer) {
        return {
          title: `Personal Daily Action Plan & Priorities`,
          badge: 'AI Field Briefing',
          statusSummary: `You have ${stats.totalPending} active jobs in your queue. ${stats.todayCount} are scheduled for today, and ${stats.overdueCount} require immediate overdue resolution.`,
          priorityAction:
            stats.overdueCount > 0
              ? `Immediate Priority: Expedite overdue job "${stats.overdueList[0]?.title || 'Critical Job'}" to prevent customer escalation.`
              : stats.todayCount > 0
              ? `Today's Priority: Execute today's scheduled job "${stats.todayList[0]?.title || 'Scheduled Job'}" on site.`
              : `All assignments are on track. Remember to log daily progress notes after commencing on-site service.`,
          recommendedSteps: [
            stats.overdueCount > 0
              ? `1. Resolve or submit an extension request for the ${stats.overdueCount} overdue job(s).`
              : `1. Confirm client arrival time for the ${stats.todayCount} job(s) scheduled today.`,
            `2. Upload site photos, receipts, or test reports into job attachments.`,
            `3. Submit completion report upon customer sign-off.`,
          ],
        };
      } else {
        return {
          title: `Executive Operational Briefing & Action Plan`,
          badge: 'AI Operations Command',
          statusSummary: `Organization has ${stats.totalPending} total pending jobs across all engineers. ${stats.overdueCount} are overdue, ${stats.highPriorityCount} are high/urgent priority, and ${stats.todayCount} are scheduled for completion today.`,
          priorityAction:
            stats.overdueCount > 0
              ? `Critical Management Action: Coordinate with assigned technicians on ${stats.overdueCount} overdue jobs to clear site bottlenecks or dispatch replacement materials.`
              : stats.highPriorityCount > 0
              ? `High Priority Oversight: Monitor ${stats.highPriorityCount} critical client service tickets to ensure adherence to service SLAs.`
              : `Operational flow is steady. Field staff assignments are proceeding within scheduled targets.`,
          recommendedSteps: [
            `1. Dispatch automated WhatsApp reminder batches for pending and overdue technicians.`,
            `2. Review material and customer approval holds across field tickets.`,
            `3. Check end-of-day closure rates and update engineer monthly performance rankings.`,
          ],
        };
      }
    }
  }, [role, stats, language, customBriefingVersion]);

  return (
    <div className="bg-gradient-to-br from-stone-900 via-stone-850 to-stone-900 text-white rounded-2xl border border-stone-800 p-5 sm:p-6 shadow-md relative overflow-hidden">
      {/* Background Subtle Accent Orb */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-800/80 relative z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5 text-emerald-100" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-black tracking-tight text-white">
                {briefing.title}
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                ChatGPT 4o
              </span>
            </div>
            <p className="text-xs text-stone-400 mt-0.5">
              {role === 'engineer'
                ? `Personalized ChatGPT briefing for ${currentUser.name} (${currentUser.designation})`
                : `Organization-wide operational intelligence for ${currentUser.name} (${currentUser.role})`}
            </p>
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-stone-800/80 hover:bg-stone-700/80 text-stone-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border border-stone-700/60 shrink-0"
          title="Refresh ChatGPT operational briefing"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          <span>{isRefreshing ? 'ChatGPT Analyzing...' : 'Refresh Briefing'}</span>
        </button>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-5 relative z-10">
        {/* Left 2 Cols: Executive Summary & Priority Action */}
        <div className="lg:col-span-2 space-y-4">
          {/* Status Sentence */}
          <div className="text-xs sm:text-sm text-stone-200 leading-relaxed font-medium bg-stone-800/40 p-3.5 rounded-xl border border-stone-800">
            {briefing.statusSummary}
          </div>

          {/* Priority Action Callout Box */}
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-start gap-3">
            <Zap className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400">
                Today's Recommended Action
              </span>
              <p className="text-xs sm:text-sm font-semibold text-stone-100 leading-relaxed">
                {briefing.priorityAction}
              </p>
            </div>
          </div>

          {/* Step-by-step checklist */}
          <div className="space-y-2 pt-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center gap-1.5">
              <ListTodo className="w-3.5 h-3.5 text-stone-400" />
              <span>Operational Action Checklist</span>
            </div>
            <div className="space-y-1.5">
              {briefing.recommendedSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="text-xs text-stone-300 flex items-start gap-2 bg-stone-800/30 px-3 py-2 rounded-lg border border-stone-800/60"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Quick Pending Work Breakdown Cards */}
        <div className="space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 flex items-center justify-between">
            <span>Pending Work Metrics</span>
            <span className="text-emerald-400">{stats.totalPending} Total</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-2 text-xs">
            {/* Overdue */}
            <div className="p-3 rounded-xl bg-red-950/30 border border-red-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-stone-300 font-medium">Overdue Jobs</span>
              </div>
              <span className="font-mono font-black text-red-400 text-sm">
                {stats.overdueCount}
              </span>
            </div>

            {/* Scheduled Today */}
            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-stone-300 font-medium">Scheduled Today</span>
              </div>
              <span className="font-mono font-black text-blue-400 text-sm">
                {stats.todayCount}
              </span>
            </div>

            {/* Urgent / High */}
            <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-stone-300 font-medium">High / Urgent</span>
              </div>
              <span className="font-mono font-black text-amber-400 text-sm">
                {stats.highPriorityCount}
              </span>
            </div>

            {/* In Progress */}
            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-900/40 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span className="text-stone-300 font-medium">In Progress</span>
              </div>
              <span className="font-mono font-black text-emerald-400 text-sm">
                {stats.inProgressCount}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
