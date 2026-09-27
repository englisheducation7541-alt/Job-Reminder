import React, { useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  MapPin,
  MessageSquare,
  Phone,
  Play,
  Sparkles,
  Upload,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getPriorityBadgeClass, getStatusBadgeClass } from '../../utils/formatters';
import { formatDateDisplay, formatStatusLabel } from '../../utils/whatsappEngine';

export const MyJobsView: React.FC = () => {
  const {
    jobs,
    currentUser,
    setSelectedJobId,
    acceptJob,
    startJob,
    getUserById,
    getCustomerById,
    getSiteById,
    openSendWhatsAppModal,
  } = useApp();

  const [filter, setFilter] = useState<'active' | 'completed' | 'all'>('active');

  const myJobs = jobs.filter((job) => {
    const isAssigned =
      job.assignedToId === currentUser.id || job.additionalAssigneeIds?.includes(currentUser.id);
    if (!isAssigned) return false;

    if (filter === 'active') {
      return !['completed', 'cancelled'].includes(job.status);
    }
    if (filter === 'completed') {
      return job.status === 'completed';
    }
    return true;
  });

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-5">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-700 to-teal-800 p-6 rounded-2xl text-white shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight">My Assigned Field Jobs</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-white/20 text-white">
              {myJobs.length} Jobs
            </span>
          </div>
          <p className="text-xs text-emerald-100 mt-1">
            Logged in as <strong>{currentUser.name}</strong> ({currentUser.designation} • {currentUser.employeeId})
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(['active', 'completed', 'all'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize cursor-pointer transition-colors ${
                filter === f
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Jobs Grid */}
      {myJobs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-stone-200 shadow-xs">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h3 className="font-bold text-stone-900 text-sm">All caught up!</h3>
          <p className="text-xs text-stone-500 mt-1">
            You have no {filter === 'active' ? 'active' : ''} jobs assigned at the moment.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {myJobs.map((job) => {
            const customer = getCustomerById(job.customerId);
            const site = getSiteById(job.customerId, job.siteId);
            const isDueToday = job.dueDate === todayStr;
            const isOverdue = job.status === 'overdue';

            return (
              <div
                key={job.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                  isOverdue
                    ? 'border-red-300 ring-1 ring-red-200'
                    : isDueToday
                    ? 'border-blue-300 ring-1 ring-blue-100'
                    : 'border-stone-200'
                }`}
              >
                <div>
                  {/* Top tags */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">
                      {job.jobId}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${getPriorityBadgeClass(
                          job.priority
                        )}`}
                      >
                        {job.priority}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${getStatusBadgeClass(
                          job.status
                        )}`}
                      >
                        {formatStatusLabel(job.status)}
                      </span>
                    </div>
                  </div>

                  <h3
                    onClick={() => setSelectedJobId(job.id)}
                    className="font-bold text-stone-900 text-sm hover:text-emerald-700 cursor-pointer line-clamp-2"
                  >
                    {job.title}
                  </h3>
                  <p className="text-xs text-stone-500 mt-1 line-clamp-2">{job.description}</p>

                  {/* Customer & Location Box */}
                  <div className="my-3 p-3 rounded-xl bg-stone-50 border border-stone-100 space-y-1.5 text-xs text-stone-700">
                    <div className="font-bold text-stone-900">{customer?.companyName}</div>
                    <div className="flex items-start gap-1 text-[11px] text-stone-600">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{site?.siteName} — {site?.address}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/50 text-[11px]">
                      <span className="text-stone-500">
                        Contact: <strong>{job.contactPerson || site?.contactPerson}</strong>
                      </span>
                      {job.contactNumber && (
                        <a
                          href={`tel:${job.contactNumber}`}
                          className="text-emerald-700 font-bold hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{job.contactNumber}</span>
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Timing & SLA */}
                  <div className="flex items-center justify-between text-xs py-1 text-stone-600">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-stone-400" />
                      <span>Due: <strong>{formatDateDisplay(job.dueDate)}</strong> at {job.dueTime}</span>
                    </span>
                    <span className="text-[11px] text-stone-400">Est. {job.estimatedDuration}</span>
                  </div>
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3 mt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedJobId(job.id)}
                    className="text-xs text-stone-600 hover:text-stone-900 font-medium underline cursor-pointer"
                  >
                    View All Details &amp; History
                  </button>

                  <div className="flex items-center gap-2">
                    {job.status === 'assigned' && (
                      <button
                        onClick={() => acceptJob(job.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-2xs"
                      >
                        Accept Task
                      </button>
                    )}

                    {job.status === 'accepted' && (
                      <button
                        onClick={() => startJob(job.id)}
                        className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer shadow-2xs"
                      >
                        Start Work
                      </button>
                    )}

                    {['in_progress', 'accepted', 'assigned', 'overdue'].includes(job.status) && (
                      <button
                        onClick={() => setSelectedJobId(job.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer shadow-2xs flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>File Report / Complete</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
