import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Clock,
  User,
  Shield,
  Briefcase,
  Key,
  FileText,
  Paperclip,
  Send,
  Building,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JobActivity } from '../../types';

interface RecentActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialSelectedActivity?: JobActivity | null;
}

export const RecentActivityModal: React.FC<RecentActivityModalProps> = ({
  isOpen,
  onClose,
  initialSelectedActivity,
}) => {
  const { activities, setSelectedJobId, t } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [detailedActivity, setDetailedActivity] = useState<JobActivity | null>(null);

  useEffect(() => {
    if (initialSelectedActivity && isOpen) {
      setDetailedActivity(initialSelectedActivity);
    }
  }, [initialSelectedActivity, isOpen]);

  const filteredActivities = useMemo(() => {
    return activities.filter((act) => {
      // Search filter
      const q = searchQuery.toLowerCase().trim();
      if (q) {
        const matchesDesc = act.description?.toLowerCase().includes(q);
        const matchesActor = act.actorName?.toLowerCase().includes(q);
        const matchesAction = act.actionType?.toLowerCase().includes(q);
        if (!matchesDesc && !matchesActor && !matchesAction) return false;
      }

      // Category filter
      if (filterCategory === 'jobs') {
        return ['created', 'assigned', 'reassigned', 'accepted', 'status_change', 'completed', 'cancelled', 'deleted'].includes(act.actionType);
      }
      if (filterCategory === 'team') {
        return ['employee_added', 'employee_updated', 'employee_deleted', 'profile_updated'].includes(act.actionType);
      }
      if (filterCategory === 'security') {
        return ['password_changed'].includes(act.actionType);
      }
      if (filterCategory === 'reminders') {
        return ['reminder_sent', 'whatsapp_sent'].includes(act.actionType);
      }
      if (filterCategory === 'company') {
        return ['company_updated', 'backup_created', 'data_restored', 'system_update'].includes(act.actionType);
      }

      return true;
    });
  }, [activities, searchQuery, filterCategory]);

  if (!isOpen) return null;

  const getActivityIcon = (type: JobActivity['actionType']) => {
    switch (type) {
      case 'employee_added':
      case 'employee_updated':
      case 'employee_deleted':
      case 'profile_updated':
        return <User className="w-4 h-4 text-purple-600" />;
      case 'password_changed':
        return <Key className="w-4 h-4 text-amber-600" />;
      case 'company_updated':
      case 'backup_created':
      case 'data_restored':
        return <Building className="w-4 h-4 text-indigo-600" />;
      case 'reminder_sent':
      case 'whatsapp_sent':
        return <Send className="w-4 h-4 text-emerald-600" />;
      case 'note_added':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'attachment_added':
      case 'attachment_deleted':
        return <Paperclip className="w-4 h-4 text-teal-600" />;
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'escalated':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Briefcase className="w-4 h-4 text-stone-600" />;
    }
  };

  const getActivityBadge = (type: JobActivity['actionType']) => {
    switch (type) {
      case 'employee_added':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">Team Added</span>;
      case 'employee_updated':
      case 'profile_updated':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-50 text-purple-700">Profile Update</span>;
      case 'employee_deleted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Team Removed</span>;
      case 'password_changed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Password Reset</span>;
      case 'company_updated':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800">Company Settings</span>;
      case 'reminder_sent':
      case 'whatsapp_sent':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Reminder</span>;
      case 'completed':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">Completed</span>;
      case 'created':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">Job Created</span>;
      case 'deleted':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Deleted</span>;
      case 'backup_created':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-100 text-teal-800">Backup</span>;
      case 'data_restored':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-100 text-cyan-800">Restore</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">{type.replace(/_/g, ' ')}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-stone-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-200 flex items-center justify-between bg-stone-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Clock className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-stone-900">
                Recent Updates &amp; System Activity
              </h2>
              <p className="text-xs text-stone-500">
                Audit trail across Admin, Manager, Employee, and Director actions (1-week retention)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter and Search Bar */}
        <div className="p-3 sm:p-4 border-b border-stone-100 bg-white flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by action, person, job, or description..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Quick Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto shrink-0 pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'All Activities' },
              { id: 'jobs', label: 'Jobs' },
              { id: 'team', label: 'Team' },
              { id: 'reminders', label: 'Reminders' },
              { id: 'company', label: 'Organization' },
              { id: 'security', label: 'Security' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilterCategory(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  filterCategory === tab.id
                    ? 'bg-stone-900 text-white'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Feed List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-2.5 divide-y divide-stone-100">
          {filteredActivities.length === 0 ? (
            <div className="text-center py-16">
              <Clock className="w-10 h-10 text-stone-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-stone-600">No activity records found</p>
              <p className="text-xs text-stone-400 mt-1">Activities are retained for 1 week.</p>
            </div>
          ) : (
            filteredActivities.map((act) => {
              const date = new Date(act.timestamp);
              const formattedDate = !isNaN(date.getTime())
                ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                : 'Recent';
              const formattedTime = !isNaN(date.getTime())
                ? date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={act.id}
                  onClick={() => {
                    if (act.jobId && act.jobId !== 'system' && act.jobId !== 'company') {
                      setSelectedJobId(act.jobId);
                      onClose();
                    }
                  }}
                  className={`pt-3 first:pt-0 p-2 rounded-xl transition-all flex items-start justify-between gap-3 ${
                    act.jobId && act.jobId !== 'system' && act.jobId !== 'company'
                      ? 'hover:bg-stone-50/80 cursor-pointer group'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-stone-100 border border-stone-200 flex items-center justify-center shrink-0 mt-0.5">
                      {getActivityIcon(act.actionType)}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        {getActivityBadge(act.actionType)}
                        <span className="text-xs font-bold text-stone-900 group-hover:text-emerald-700 transition-colors">
                          {act.description}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 text-[11px] text-stone-500">
                        <span className="font-medium text-stone-700">Actor: {act.actorName || 'System'}</span>
                        <span>•</span>
                        <span>{formattedDate} at {formattedTime}</span>
                        {act.metadata?.jobTitle && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-emerald-700">Ref: {act.metadata.jobTitle}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDetailedActivity(act);
                      }}
                      className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 hover:border-emerald-300 text-stone-700 hover:text-emerald-700 text-[11px] font-semibold transition-all cursor-pointer shadow-2xs"
                    >
                      Full Details
                    </button>
                    <div className="text-[11px] font-mono text-stone-400 text-right">
                      {formattedTime}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs text-stone-500">
          <div>
            Showing <strong className="text-stone-800">{filteredActivities.length}</strong> of{' '}
            <strong className="text-stone-800">{activities.length}</strong> recorded activities
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-stone-900 text-white font-bold hover:bg-stone-800 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Full Details Nested Inspection Modal */}
        {detailedActivity && (
          <div className="fixed inset-0 z-60 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl border border-stone-200 max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    {getActivityIcon(detailedActivity.actionType)}
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">Activity Full Details</h3>
                    <p className="text-[11px] text-stone-400 font-mono">ID: {detailedActivity.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setDetailedActivity(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200/80 space-y-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Description / Change Summary
                    </span>
                    <span className="font-semibold text-stone-900 text-sm mt-0.5 block">
                      {detailedActivity.description}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-[10px] font-bold text-stone-400">Action Type:</span>
                    {getActivityBadge(detailedActivity.actionType)}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Performed By (Actor)
                    </span>
                    <span className="font-bold text-stone-900 mt-1 block">
                      {detailedActivity.actorName || 'System'}
                    </span>
                    <span className="text-[11px] text-stone-500 capitalize">
                      {detailedActivity.actorRole || 'automated'}
                    </span>
                  </div>

                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Exact Timestamp
                    </span>
                    <span className="font-bold text-stone-900 mt-1 block font-mono text-[11px]">
                      {new Date(detailedActivity.timestamp).toLocaleDateString()}
                    </span>
                    <span className="text-[11px] text-stone-500 font-mono">
                      {new Date(detailedActivity.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {detailedActivity.metadata && Object.keys(detailedActivity.metadata).length > 0 && (
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">
                      Updated Fields &amp; Parameters
                    </span>
                    <div className="max-h-36 overflow-y-auto bg-white p-2.5 rounded-lg border border-stone-200 font-mono text-[11px] text-stone-700 whitespace-pre-wrap">
                      {JSON.stringify(detailedActivity.metadata, null, 2)}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                {detailedActivity.jobId &&
                detailedActivity.jobId !== 'system' &&
                detailedActivity.jobId !== 'company' ? (
                  <button
                    onClick={() => {
                      setSelectedJobId(detailedActivity.jobId!);
                      setDetailedActivity(null);
                      onClose();
                    }}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Open Linked Job &rarr;
                  </button>
                ) : (
                  <div />
                )}

                <button
                  onClick={() => setDetailedActivity(null)}
                  className="px-4 py-2 rounded-xl bg-stone-900 text-white font-semibold text-xs hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  Close Details
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
