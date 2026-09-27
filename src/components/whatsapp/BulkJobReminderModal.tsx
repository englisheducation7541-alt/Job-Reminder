import React, { useState, useMemo, useEffect } from 'react';
import {
  AlertCircle,
  Building,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Copy,
  ExternalLink,
  Filter,
  Layers,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Job, User } from '../../types';
import { generateLoginUrl, generateWhatsAppWebUrl } from '../../utils/whatsappEngine';
import { formatDateDisplay } from '../../utils/dateUtils';

export const BulkJobReminderModal: React.FC = () => {
  const {
    isBulkReminderOpen,
    setIsBulkReminderOpen,
    bulkReminderTargetUserId,
    setBulkReminderTargetUserId,
    jobs,
    users,
    customers,
    companySettings,
    getCustomerById,
    getSiteById,
    sendBulkJobReminders,
  } = useApp();

  // List of team members (engineers and managers)
  const eligibleRecipients = useMemo(() => {
    return users.filter((u) => u.active);
  }, [users]);

  // Selected recipient state
  const [selectedUserId, setSelectedUserId] = useState<string>('');

  useEffect(() => {
    if (bulkReminderTargetUserId) {
      setSelectedUserId(bulkReminderTargetUserId);
    } else if (eligibleRecipients.length > 0 && !selectedUserId) {
      // Pick first user that has pending jobs, or fallback to first user
      const userWithJobs = eligibleRecipients.find((u) => {
        const count = jobs.filter(
          (j) =>
            (j.assignedToId === u.id || j.additionalAssigneeIds?.includes(u.id)) &&
            j.status !== 'completed' &&
            j.status !== 'cancelled'
        ).length;
        return count > 0;
      });
      setSelectedUserId(userWithJobs ? userWithJobs.id : eligibleRecipients[0].id);
    }
  }, [isBulkReminderOpen, bulkReminderTargetUserId, eligibleRecipients]);

  const selectedUser = useMemo(() => {
    return users.find((u) => u.id === selectedUserId) || eligibleRecipients[0];
  }, [users, selectedUserId, eligibleRecipients]);

  // All pending/active jobs assigned to the selected user
  const userPendingJobs = useMemo(() => {
    if (!selectedUser) return [];
    return jobs.filter(
      (j) =>
        (j.assignedToId === selectedUser.id || j.additionalAssigneeIds?.includes(selectedUser.id)) &&
        j.status !== 'completed' &&
        j.status !== 'cancelled'
    ).sort((a, b) => {
      // Sort by due date ascending
      const dateA = `${a.dueDate} ${a.dueTime || '18:00'}`;
      const dateB = `${b.dueDate} ${b.dueTime || '18:00'}`;
      return dateA.localeCompare(dateB);
    });
  }, [jobs, selectedUser]);

  // Selected job IDs for bulk reminder
  const [selectedJobIds, setSelectedJobIds] = useState<string[]>([]);
  const [customNote, setCustomNote] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  // When userPendingJobs changes, select all by default
  useEffect(() => {
    setSelectedJobIds(userPendingJobs.map((j) => j.id));
  }, [userPendingJobs]);

  const toggleJobSelection = (jobId: string) => {
    setSelectedJobIds((prev) =>
      prev.includes(jobId) ? prev.filter((id) => id !== jobId) : [...prev, jobId]
    );
  };

  const handleSelectAll = () => {
    setSelectedJobIds(userPendingJobs.map((j) => j.id));
  };

  const handleDeselectAll = () => {
    setSelectedJobIds([]);
  };

  // Selected jobs list
  const selectedJobs = useMemo(() => {
    return userPendingJobs.filter((j) => selectedJobIds.includes(j.id));
  }, [userPendingJobs, selectedJobIds]);

  // Generated WhatsApp Message Text
  const generatedMessage = useMemo(() => {
    if (!selectedUser) return '';

    const count = selectedJobs.length;
    let text = `🔔 *JOB REMINDER NOTIFICATION (${count} Assigned Jobs)*\n`;
    text += `Hello *${selectedUser.name}* (${selectedUser.designation || 'Field Operations'}),\n\n`;
    text += `You currently have *${count} active pending/upcoming jobs* assigned to you. Please check your schedule and prioritize completion:\n\n`;

    selectedJobs.forEach((job, index) => {
      const cust = getCustomerById(job.customerId);
      const site = getSiteById(job.customerId, job.siteId);
      const priorityTag =
        job.priority === 'urgent'
          ? '🚨 URGENT'
          : job.priority === 'high'
          ? '⚠️ HIGH'
          : '📌 NORMAL';
      const statusLabel = job.status.toUpperCase().replace('_', ' ');

      text += `*${index + 1}. [${job.jobId}] ${job.title}*\n`;
      if (cust) {
        text += `   🏢 Client: ${cust.companyName}${site ? ` (${site.siteName})` : ''}\n`;
      }
      if (job.description && job.description.trim()) {
        text += `   📝 Description: ${job.description.trim()}\n`;
      }
      text += `   ⏰ Due: ${job.dueDate} at ${job.dueTime || '18:00'} [${priorityTag}]\n`;
      text += `   📊 Status: ${statusLabel}\n\n`;
    });

    if (customNote.trim()) {
      text += `📝 *Management Instructions:*\n${customNote.trim()}\n\n`;
    }

    const loginUrl = generateLoginUrl(selectedUser);
    text += `📱 *Staff Login Link (स्टाफ लॉगिन लिंक):* \n${loginUrl}\n\n`;
    text += `_कृपया अपने रजिस्टर्ड मोबाइल नंबर या ईमेल से लॉगिन करके जॉब की डिटेल्स और डेली नोट्स दर्ज करें।_\n`;
    text += `— *${companySettings.companyName || 'Job Reminder'} Operations Team*`;

    return text;
  }, [selectedUser, selectedJobs, customNote, companySettings, getCustomerById, getSiteById]);

  if (!isBulkReminderOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendViaWhatsAppWeb = () => {
    if (!selectedUser) return;
    const url = generateWhatsAppWebUrl(selectedUser.whatsapp || selectedUser.mobile, generatedMessage);
    window.open(url, '_blank');
  };

  const handleDispatchSystem = async () => {
    if (!selectedUser || selectedJobs.length === 0) return;
    setIsSending(true);
    try {
      await sendBulkJobReminders(selectedUser.id, selectedJobIds, customNote);
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        setIsBulkReminderOpen(false);
        setBulkReminderTargetUserId(null);
      }, 1800);
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch bulk reminders');
    } finally {
      setIsSending(false);
    }
  };

  const overdueCount = userPendingJobs.filter((j) => {
    const dueDateTime = new Date(`${j.dueDate}T${j.dueTime || '18:00'}`);
    return dueDateTime < new Date() && j.status !== 'completed';
  }).length;

  const urgentCount = userPendingJobs.filter(
    (j) => j.priority === 'urgent' || j.priority === 'high'
  ).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <Send className="w-4 h-4 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Send Job Reminders (Bulk Dispatch)</h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 border border-emerald-300/30 text-[10px] font-semibold text-emerald-100">
                  Batch WhatsApp Mode
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/80">
                Send a consolidated reminder for all pending &amp; upcoming jobs of a selected employee or manager at once
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsBulkReminderOpen(false);
              setBulkReminderTargetUserId(null);
            }}
            className="p-1.5 rounded-xl text-white/80 hover:text-white hover:bg-white/10 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* 1. Recipient Selector Card */}
          <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-700" />
                <span>Select Employee or Manager to Remind:</span>
              </label>
              <span className="text-[11px] text-stone-500">
                Showing engineers &amp; managers with active workload
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {eligibleRecipients.map((emp) => {
                const empPendingCount = jobs.filter(
                  (j) =>
                    (j.assignedToId === emp.id || j.additionalAssigneeIds?.includes(emp.id)) &&
                    j.status !== 'completed' &&
                    j.status !== 'cancelled'
                ).length;

                const isSelected = emp.id === selectedUser?.id;

                return (
                  <button
                    key={emp.id}
                    type="button"
                    onClick={() => setSelectedUserId(emp.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2.5 ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-500/20 shadow-xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={emp.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=047857&color=fff`}
                        alt={emp.name}
                        className="w-8 h-8 rounded-full object-cover border border-stone-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="font-bold text-xs text-stone-900 truncate">
                          {emp.name}
                        </div>
                        <div className="text-[10px] text-stone-500 capitalize truncate">
                          {emp.role} • {emp.designation || 'Field Staff'}
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                        empPendingCount > 0
                          ? isSelected
                            ? 'bg-emerald-600 text-white'
                            : 'bg-stone-200 text-stone-700'
                          : 'bg-stone-100 text-stone-400'
                      }`}
                    >
                      {empPendingCount} Jobs
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Recipient Workload Stats Bar */}
          {selectedUser && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Total Active Jobs
                </span>
                <div className="text-xl font-extrabold text-stone-900 mt-0.5">
                  {userPendingJobs.length}
                </div>
                <span className="text-[10px] text-stone-500">
                  {selectedJobs.length} selected for reminder
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">
                  Urgent / High
                </span>
                <div className="text-xl font-extrabold text-amber-700 mt-0.5">
                  {urgentCount}
                </div>
                <span className="text-[10px] text-stone-500">Require immediate focus</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-stone-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">
                  Overdue Jobs
                </span>
                <div className="text-xl font-extrabold text-red-600 mt-0.5">
                  {overdueCount}
                </div>
                <span className="text-[10px] text-stone-500">Past target date</span>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                  WhatsApp Contact
                </span>
                <div className="text-xs font-bold text-emerald-950 font-mono mt-1 truncate">
                  {selectedUser.whatsapp || selectedUser.mobile || 'No Phone Registered'}
                </div>
                <span className="text-[10px] text-emerald-700 font-medium">1-Click Direct Token Link</span>
              </div>
            </div>
          )}

          {/* 3. Jobs Selection Checklist (Supports 10+ Jobs smoothly) */}
          <div className="space-y-2.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-200 pb-2">
              <div>
                <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-emerald-700" />
                  <span>
                    Select Jobs to Include in Bulk Reminder ({selectedJobs.length} of {userPendingJobs.length} selected)
                  </span>
                </h4>
                <p className="text-[11px] text-stone-500">
                  Especially designed for users with 10+ jobs — check/uncheck specific tasks as needed
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAll}
                  className="px-2.5 py-1 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  Select All ({userPendingJobs.length})
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAll}
                  className="px-2.5 py-1 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>

            {userPendingJobs.length === 0 ? (
              <div className="text-center py-8 bg-stone-50 rounded-2xl border border-stone-200 text-xs text-stone-500">
                🎉 No active or pending jobs assigned to {selectedUser?.name}. All caught up!
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto rounded-2xl border border-stone-200 divide-y divide-stone-100 bg-white">
                {userPendingJobs.map((job) => {
                  const isChecked = selectedJobIds.includes(job.id);
                  const cust = getCustomerById(job.customerId);
                  const site = getSiteById(job.customerId, job.siteId);
                  const isOverdue =
                    new Date(`${job.dueDate}T${job.dueTime || '18:00'}`) < new Date();

                  return (
                    <div
                      key={job.id}
                      onClick={() => toggleJobSelection(job.id)}
                      className={`p-3 flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isChecked ? 'bg-emerald-50/30 hover:bg-emerald-50/50' : 'hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleJobSelection(job.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs font-bold text-emerald-800">
                              {job.jobId}
                            </span>
                            <span className="font-semibold text-xs text-stone-900 truncate">
                              {job.title}
                            </span>
                            {job.priority === 'urgent' && (
                              <span className="px-1.5 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                                Urgent
                              </span>
                            )}
                            {job.priority === 'high' && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                High
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-0.5 flex-wrap">
                            {cust && (
                              <span className="truncate">
                                🏢 {cust.companyName} {site ? `(${site.siteName})` : ''}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-stone-400" />
                              <span>Due: {formatDateDisplay(job.dueDate)} at {job.dueTime || '18:00'}</span>
                              {isOverdue && (
                                <span className="text-red-600 font-bold ml-1">(Overdue)</span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-700">
                          {job.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. Optional Custom Instructions / Remarks */}
          <div>
            <label className="block text-xs font-bold text-stone-800 mb-1">
              Add Custom Management Instructions / Remarks (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. Please complete the Apollo Hospital job by 1 PM and report back on compressor pressure."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
            />
          </div>

          {/* 5. Live WhatsApp Message Preview Bubble */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>Live Consolidated WhatsApp Reminder Preview ({selectedJobs.length} Jobs)</span>
              </span>

              <button
                type="button"
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy Text'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#ECE5DD] border border-stone-300 font-sans shadow-inner max-h-72 overflow-y-auto">
              <div className="max-w-xl bg-white rounded-2xl rounded-tl-xs p-4 shadow-sm text-xs text-stone-900">
                <div className="whitespace-pre-wrap leading-relaxed font-sans text-[12px]">
                  {generatedMessage}
                </div>
                <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-stone-400">
                  <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handleSendViaWhatsAppWeb}
            disabled={selectedJobs.length === 0}
            className="px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed"
            title="Open native WhatsApp Web or mobile app with prefilled text"
          >
            <ExternalLink className="w-4 h-4 text-emerald-700" />
            <span>Open in WhatsApp Web / App</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsBulkReminderOpen(false);
                setBulkReminderTargetUserId(null);
              }}
              className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleDispatchSystem}
              disabled={isSending || sendSuccess || selectedJobs.length === 0}
              className={`px-5 py-2 rounded-xl text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                sendSuccess
                  ? 'bg-emerald-600'
                  : isSending
                  ? 'bg-emerald-400 cursor-wait'
                  : 'bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {sendSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Bulk Reminders Dispatched!</span>
                </>
              ) : isSending ? (
                <span>Dispatching {selectedJobs.length} Jobs...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Dispatch All {selectedJobs.length} Reminders Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
