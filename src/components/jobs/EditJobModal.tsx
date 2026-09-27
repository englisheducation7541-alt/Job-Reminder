import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Calendar,
  Clock,
  Save,
  Trash2,
  X,
  Building,
  User,
  Tag,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  FileText,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Job, JobPriority, JobStatus } from '../../types';

export const EditJobModal: React.FC = () => {
  const {
    isEditJobOpen,
    setIsEditJobOpen,
    jobToEdit,
    setJobToEdit,
    setSelectedJobId,
    updateJob,
    deleteJob,
    customers,
    users,
    jobTypes,
    currentUser,
  } = useApp();

  const [form, setForm] = useState({
    title: '',
    description: '',
    jobType: '',
    priority: 'medium' as JobPriority,
    customerId: '',
    siteId: '',
    contactPerson: '',
    contactNumber: '',
    assignedToId: '',
    additionalAssigneeIds: [] as string[],
    startDate: '',
    dueDate: '',
    dueTime: '17:00',
    estimatedDuration: '2 Hours',
    status: 'pending' as JobStatus,
    reminderHoursBefore: 2,
    enableWhatsAppReminders: true,
  });

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (jobToEdit) {
      setForm({
        title: jobToEdit.title,
        description: jobToEdit.description,
        jobType: jobToEdit.jobType,
        priority: jobToEdit.priority,
        customerId: jobToEdit.customerId,
        siteId: jobToEdit.siteId,
        contactPerson: jobToEdit.contactPerson || '',
        contactNumber: jobToEdit.contactNumber || '',
        assignedToId: jobToEdit.assignedToId,
        additionalAssigneeIds: jobToEdit.additionalAssigneeIds || [],
        startDate: jobToEdit.startDate,
        dueDate: jobToEdit.dueDate,
        dueTime: jobToEdit.dueTime,
        estimatedDuration: jobToEdit.estimatedDuration,
        status: jobToEdit.status,
        reminderHoursBefore: jobToEdit.reminderConfig?.reminderHoursBefore ?? 2,
        enableWhatsAppReminders: jobToEdit.reminderConfig?.enableWhatsAppReminders ?? true,
      });
      setConfirmDelete(false);
      setSaveSuccess(false);
    }
  }, [jobToEdit, isEditJobOpen]);

  if (!isEditJobOpen || !jobToEdit) return null;

  if (currentUser.role !== 'admin') {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
        <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 p-6 space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">
              Only Admin Can Edit Job Details
            </h3>
            <p className="text-xs text-stone-600 mt-2 leading-relaxed">
              Once a job is assigned, employees and managers cannot modify original job specifications, customer site, schedule, or assignees.
            </p>
            <p className="text-xs text-emerald-800 font-semibold mt-1">
              You can post Daily Notes &amp; update Job Status directly in the Job Details view.
            </p>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsEditJobOpen(false);
                setJobToEdit(null);
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-stone-200 text-stone-700 text-xs font-semibold hover:bg-stone-50 cursor-pointer"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditJobOpen(false);
                setSelectedJobId(jobToEdit.id);
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileText className="w-4 h-4" />
              <span>Open Job &amp; Daily Notes</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const selectedCustomer = customers.find((c) => c.id === form.customerId);
  const availableSites = selectedCustomer ? selectedCustomer.sites : [];

  const handleCustomerChange = (custId: string) => {
    const cust = customers.find((c) => c.id === custId);
    setForm((prev) => ({
      ...prev,
      customerId: custId,
      siteId: cust && cust.sites.length > 0 ? cust.sites[0].id : '',
      contactPerson: cust?.contactPerson || '',
      contactNumber: cust?.mobile || cust?.whatsapp || '',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;

    updateJob(jobToEdit.id, {
      title: form.title.trim(),
      description: form.description.trim(),
      jobType: form.jobType,
      priority: form.priority,
      customerId: form.customerId,
      siteId: form.siteId,
      contactPerson: form.contactPerson.trim(),
      contactNumber: form.contactNumber.trim(),
      assignedToId: form.assignedToId,
      additionalAssigneeIds: form.additionalAssigneeIds,
      startDate: form.startDate,
      dueDate: form.dueDate,
      dueTime: form.dueTime,
      estimatedDuration: form.estimatedDuration,
      status: form.status,
      reminderConfig: {
        ...jobToEdit.reminderConfig,
        reminderHoursBefore: Number(form.reminderHoursBefore),
        enableWhatsAppReminders: form.enableWhatsAppReminders,
      },
    });

    setSaveSuccess(true);
    setTimeout(() => {
      setIsEditJobOpen(false);
      setJobToEdit(null);
    }, 600);
  };

  const handleDeleteJob = () => {
    deleteJob(jobToEdit.id);
    setIsEditJobOpen(false);
    setJobToEdit(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-stone-900 flex items-center justify-center text-white font-mono text-xs font-bold shadow-xs">
              EDIT
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900">Edit Job Details</h2>
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {jobToEdit.jobId}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Update job specifications, client site, assignee and status
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsEditJobOpen(false)}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Job updated successfully!</span>
            </div>
          )}

          {/* Job Title */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Job Title *</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 font-medium focus:outline-emerald-600"
              placeholder="e.g. Preventive Maintenance – Oxygen Plant Compressor"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block font-semibold text-stone-700 mb-1">Description / Scope of Work</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-stone-900 focus:outline-emerald-600 resize-none"
              placeholder="Detailed instructions for the engineer..."
            />
          </div>

          {/* Type, Priority, Status Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Job Type</label>
              <select
                value={form.jobType}
                onChange={(e) => setForm({ ...form, jobType: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600 bg-white"
              >
                {jobTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value as JobPriority })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600 bg-white capitalize"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical / Urgent</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as JobStatus })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600 bg-white capitalize font-semibold"
              >
                <option value="pending">Pending Acceptance</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Customer & Site */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Customer / Client</label>
              <select
                value={form.customerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600 bg-white"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.companyName} ({c.city})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Site / Branch Location</label>
              <select
                value={form.siteId}
                onChange={(e) => setForm({ ...form, siteId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600 bg-white"
              >
                {availableSites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.siteName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Site Contact Person & Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Site Contact Person</label>
              <input
                type="text"
                value={form.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600"
                placeholder="e.g. Mr. Sharma"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Site Phone / Mobile</label>
              <input
                type="tel"
                value={form.contactNumber}
                onChange={(e) => setForm({ ...form, contactNumber: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600 font-mono"
                placeholder="+91 98765 43210"
              />
            </div>
          </div>

          {/* Assigned Engineer */}
          <div className="pt-2">
            <label className="block font-semibold text-stone-700 mb-1">Primary Assigned Engineer</label>
            <select
              value={form.assignedToId}
              onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600 bg-white font-medium"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} — {u.designation} ({u.role})
                </option>
              ))}
            </select>
          </div>

          {/* Dates & Times */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">Due Date *</label>
              <input
                type="date"
                required
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Due Time *</label>
              <input
                type="time"
                required
                value={form.dueTime}
                onChange={(e) => setForm({ ...form, dueTime: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600 font-mono"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Estimated Duration</label>
              <input
                type="text"
                value={form.estimatedDuration}
                onChange={(e) => setForm({ ...form, estimatedDuration: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600"
                placeholder="e.g. 3 Hours"
              />
            </div>
          </div>

          {/* WhatsApp Reminder Settings */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
            <div>
              <span className="font-bold text-stone-900 block">WhatsApp Auto Reminders</span>
              <span className="text-[11px] text-stone-500">
                Send 1-click token reminder {form.reminderHoursBefore} hours before deadline
              </span>
            </div>
            <input
              type="checkbox"
              checked={form.enableWhatsAppReminders}
              onChange={(e) => setForm({ ...form, enableWhatsAppReminders: e.target.checked })}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Delete Danger Zone */}
          {currentUser.role === 'admin' && (
            <div className="p-3.5 rounded-xl bg-red-50/60 border border-red-200 flex items-center justify-between">
              <div>
                <span className="font-bold text-red-950 block">Delete This Job</span>
                <span className="text-[11px] text-red-700">
                  Permanently delete this task and all activity records
                </span>
              </div>
              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-1.5 rounded-lg border border-red-300 text-red-700 hover:bg-red-100 font-semibold cursor-pointer"
                >
                  Delete Job
                </button>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDeleteJob}
                    className="px-3 py-1.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 cursor-pointer shadow-xs"
                  >
                    Confirm Delete
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1.5 rounded-lg border border-stone-300 text-stone-600 hover:bg-stone-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t border-stone-200">
            <button
              type="button"
              onClick={() => setIsEditJobOpen(false)}
              className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 font-semibold cursor-pointer hover:bg-stone-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Job Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
