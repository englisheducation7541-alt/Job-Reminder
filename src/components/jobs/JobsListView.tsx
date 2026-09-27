import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  CreditCard,
  Download,
  Edit2,
  Eye,
  Filter,
  Grid,
  List,
  MapPin,
  MessageSquare,
  MoreVertical,
  Plus,
  Search,
  Send,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Job, JobPriority, JobStatus } from '../../types';
import { downloadCSV, getPriorityBadgeClass, getStatusBadgeClass } from '../../utils/formatters';
import { formatDateDisplay, formatStatusLabel } from '../../utils/whatsappEngine';

export const JobsListView: React.FC = () => {
  const {
    jobs,
    currentUser,
    jobTypes,
    users,
    customers,
    setSelectedJobId,
    setIsCreateJobOpen,
    openBulkJobReminders,
    openPaymentReminderModal,
    openEditJobModal,
    deleteJob,
    openSendWhatsAppModal,
    updateJobStatus,
    getUserById,
    getCustomerById,
    getSiteById,
  } = useApp();

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [jobToDelete, setJobToDelete] = useState<Job | null>(null);

  const canManage = ['admin', 'manager'].includes(currentUser.role);
  const isAdmin = currentUser.role === 'admin';

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const customer = getCustomerById(job.customerId);
      const site = getSiteById(job.customerId, job.siteId);
      const assignee = getUserById(job.assignedToId);

      // Search match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId = job.jobId.toLowerCase().includes(query);
        const matchesTitle = job.title.toLowerCase().includes(query);
        const matchesCustomer = customer?.companyName.toLowerCase().includes(query);
        const matchesSite = site?.siteName.toLowerCase().includes(query);
        const matchesAssignee = assignee?.name.toLowerCase().includes(query);
        const matchesType = job.jobType.toLowerCase().includes(query);

        if (!matchesId && !matchesTitle && !matchesCustomer && !matchesSite && !matchesAssignee && !matchesType) {
          return false;
        }
      }

      // Filter matches
      if (statusFilter !== 'all' && job.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && job.priority !== priorityFilter) return false;
      if (typeFilter !== 'all' && job.jobType !== typeFilter) return false;
      if (assigneeFilter !== 'all' && job.assignedToId !== assigneeFilter) return false;
      if (customerFilter !== 'all' && job.customerId !== customerFilter) return false;

      return true;
    });
  }, [
    jobs,
    searchTerm,
    statusFilter,
    priorityFilter,
    typeFilter,
    assigneeFilter,
    customerFilter,
    getCustomerById,
    getSiteById,
    getUserById,
  ]);

  const handleExportCSV = () => {
    const exportData = filteredJobs.map((j) => {
      const cust = getCustomerById(j.customerId);
      const site = getSiteById(j.customerId, j.siteId);
      const assignee = getUserById(j.assignedToId);
      return {
        'Job ID': j.jobId,
        Title: j.title,
        Type: j.jobType,
        Priority: j.priority,
        Customer: cust?.companyName || '',
        Site: site?.siteName || '',
        'Assigned Engineer': assignee?.name || '',
        'Due Date': j.dueDate,
        'Due Time': j.dueTime,
        Status: j.status,
        Created: j.createdAt,
      };
    });
    downloadCSV(`JobReminder_Jobs_${new Date().toISOString().split('T')[0]}.csv`, exportData);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setTypeFilter('all');
    setAssigneeFilter('all');
    setCustomerFilter('all');
  };

  const hasActiveFilters =
    searchTerm ||
    statusFilter !== 'all' ||
    priorityFilter !== 'all' ||
    typeFilter !== 'all' ||
    assigneeFilter !== 'all' ||
    customerFilter !== 'all';

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">Jobs Directory</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Search, filter, assign and dispatch WhatsApp reminders across all company jobs.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Export filtered records to CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <div className="flex items-center rounded-xl border border-stone-200 p-1 bg-stone-50">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                viewMode === 'table' ? 'bg-white shadow-xs text-emerald-700 font-bold' : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs cursor-pointer ${
                viewMode === 'grid' ? 'bg-white shadow-xs text-emerald-700 font-bold' : 'text-stone-500 hover:text-stone-800'
              }`}
              title="Card Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
          </div>

          {['admin', 'manager'].includes(currentUser.role) && (
            <>
              <button
                onClick={() => openPaymentReminderModal()}
                className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer hover:scale-101"
                title="Send Client Payment Reminder via WhatsApp & Email with auto-filled details"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-300" />
                <span>Payment Reminder</span>
              </button>

              <button
                onClick={() => openBulkJobReminders()}
                className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all cursor-pointer"
                title="Send WhatsApp reminders for all pending/upcoming jobs of a selected employee or manager at once"
              >
                <Send className="w-3.5 h-3.5 text-emerald-700" />
                <span>Send Job Reminders</span>
              </button>

              <button
                onClick={() => setIsCreateJobOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create Job</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Multi-Filter Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Job ID, title, customer, site, or assignee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-stone-900 placeholder:text-stone-400"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="assigned">Assigned</option>
            <option value="accepted">Accepted</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_customer">Waiting Customer</option>
            <option value="waiting_material">Waiting Material</option>
            <option value="waiting_approval">Waiting Approval</option>
            <option value="on_hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>

          {/* Job Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Job Types</option>
            {jobTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>

          {/* Customer Filter */}
          <select
            value={customerFilter}
            onChange={(e) => setCustomerFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.companyName}
              </option>
            ))}
          </select>

          {/* Assignee Filter */}
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs text-stone-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          >
            <option value="all">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role})
              </option>
            ))}
          </select>

          {/* Clear Button */}
          {hasActiveFilters ? (
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          ) : (
            <div className="flex items-center justify-center text-stone-400 text-xs">
              {filteredJobs.length} jobs matched
            </div>
          )}
        </div>
      </div>

      {/* Jobs Results Display */}
      {viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-stone-600">
              <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Job ID &amp; Title</th>
                  <th className="px-4 py-3">Client &amp; Site</th>
                  <th className="px-4 py-3">Assigned To</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Quick Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-stone-400">
                      No matching jobs found. Try adjusting your search query.
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => {
                    const customer = getCustomerById(job.customerId);
                    const site = getSiteById(job.customerId, job.siteId);
                    const assignee = getUserById(job.assignedToId);

                    return (
                      <tr
                        key={job.id}
                        className="hover:bg-stone-50/80 transition-colors group cursor-pointer"
                        onClick={() => setSelectedJobId(job.id)}
                      >
                        <td className="px-4 py-3.5">
                          <div className="font-mono text-[11px] font-bold text-emerald-800">
                            {job.jobId}
                          </div>
                          <div className="font-semibold text-stone-900 group-hover:text-emerald-700 transition-colors max-w-xs truncate">
                            {job.title}
                          </div>
                          <div className="text-[11px] text-stone-400 font-medium">
                            {job.jobType} • Est. {job.estimatedDuration}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="font-semibold text-stone-900 truncate max-w-xs">
                            {customer?.companyName || 'N/A'}
                          </div>
                          <div className="text-[11px] text-stone-500 truncate max-w-xs">
                            {site?.siteName || 'Site Location'}
                          </div>
                        </td>

                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2">
                            <img
                              src={assignee?.avatar}
                              alt={assignee?.name}
                              className="w-6 h-6 rounded-full object-cover ring-1 ring-stone-200 shrink-0"
                            />
                            <div className="min-w-0">
                              <div className="font-medium text-stone-900 truncate">{assignee?.name}</div>
                              <div className="text-[10px] text-stone-400 truncate">{assignee?.designation}</div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <div
                            className={`font-semibold ${
                              job.status === 'overdue' ? 'text-red-700 font-bold' : 'text-stone-900'
                            }`}
                          >
                            {formatDateDisplay(job.dueDate)}
                          </div>
                          <div className="text-[11px] text-stone-500 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-stone-400" />
                            <span>{job.dueTime}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded text-[11px] uppercase border ${getPriorityBadgeClass(
                              job.priority
                            )}`}
                          >
                            {job.priority}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-md text-xs font-semibold border ${getStatusBadgeClass(
                              job.status
                            )}`}
                          >
                            {formatStatusLabel(job.status)}
                          </span>
                        </td>

                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => openSendWhatsAppModal(job)}
                              className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                              title="Send WhatsApp Reminder"
                            >
                              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                              <span>WhatsApp</span>
                            </button>

                            {canManage && (
                              <button
                                onClick={() => openEditJobModal(job)}
                                className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 cursor-pointer"
                                title="Edit Job Details"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isAdmin && (
                              <button
                                onClick={() => setJobToDelete(job)}
                                className="p-1.5 rounded-lg border border-stone-200 hover:bg-red-50 text-stone-400 hover:text-red-600 cursor-pointer"
                                title="Delete Job"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedJobId(job.id)}
                              className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 cursor-pointer"
                              title="Inspect Details"
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
        </div>
      ) : (
        /* Grid / Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => {
            const customer = getCustomerById(job.customerId);
            const site = getSiteById(job.customerId, job.siteId);
            const assignee = getUserById(job.assignedToId);

            return (
              <div
                key={job.id}
                onClick={() => setSelectedJobId(job.id)}
                className="bg-white p-5 rounded-2xl border border-stone-200 hover:border-emerald-400 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="font-mono text-xs font-bold text-emerald-800">
                      {job.jobId}
                    </div>
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

                  <h3 className="font-bold text-stone-900 text-sm mb-1 leading-snug line-clamp-2">
                    {job.title}
                  </h3>
                  <p className="text-xs text-stone-500 mb-3 line-clamp-2">{job.description}</p>

                  <div className="space-y-1.5 text-xs text-stone-600 mb-4 bg-stone-50 p-3 rounded-xl border border-stone-100">
                    <div className="font-semibold text-stone-900 truncate">
                      {customer?.companyName}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-stone-500 truncate">
                      <MapPin className="w-3 h-3 text-stone-400 shrink-0" />
                      <span className="truncate">{site?.siteName}</span>
                    </div>
                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/50 text-[11px]">
                      <span className="text-stone-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        Due: {formatDateDisplay(job.dueDate)} {job.dueTime}
                      </span>
                      <span className="font-medium text-stone-700">{job.jobType}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={assignee?.avatar}
                      alt={assignee?.name}
                      className="w-6 h-6 rounded-full object-cover ring-1 ring-stone-200 shrink-0"
                    />
                    <span className="text-xs font-medium text-stone-800 truncate">
                      {assignee?.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openSendWhatsAppModal(job)}
                      className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    {canManage && (
                      <button
                        onClick={() => openEditJobModal(job)}
                        className="p-1 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 cursor-pointer"
                        title="Edit Job"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => setJobToDelete(job)}
                        className="p-1 rounded-lg border border-stone-200 hover:bg-red-50 text-stone-400 hover:text-red-600 cursor-pointer"
                        title="Delete Job"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Job Confirmation Modal */}
      {jobToDelete && (
        <div className="fixed inset-0 z-60 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">Delete Job?</h3>
                <p className="text-xs text-stone-500 font-mono">{jobToDelete.jobId}</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
              Are you sure you want to permanently delete <strong>{jobToDelete.title}</strong>? All linked attachments, timeline notes, and logs will be removed.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setJobToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteJob(jobToDelete.id);
                  setJobToDelete(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
