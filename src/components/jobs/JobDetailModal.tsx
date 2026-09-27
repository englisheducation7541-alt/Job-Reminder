import React, { useState, useRef } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Calendar,
  Camera,
  Check,
  CheckCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit2,
  ExternalLink,
  Eye,
  FileCheck,
  FileDown,
  FileText,
  HelpCircle,
  History,
  Image as ImageIcon,
  MapPin,
  MessageSquare,
  Paperclip,
  Phone,
  Plus,
  Printer,
  RotateCcw,
  Send,
  Trash2,
  Upload,
  UserCheck,
  X,
  NotebookPen,
  ShieldCheck,
  Download,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CompletionReport, JobStatus } from '../../types';
import { getPriorityBadgeClass, getStatusBadgeClass } from '../../utils/formatters';
import { formatDateDisplay, formatStatusLabel, generateDirectAccessUrl } from '../../utils/whatsappEngine';

export const JobDetailModal: React.FC = () => {
  const {
    selectedJobId,
    setSelectedJobId,
    jobs,
    currentUser,
    users,
    customers,
    activities,
    updateJobStatus,
    acceptJob,
    startJob,
    completeJob,
    requestExtension,
    reviewExtension,
    addJobNote,
    addDailyUpdate,
    addJobAttachment,
    deleteJobAttachment,
    openEditJobModal,
    deleteJob,
    openUserProfile,
    openSendWhatsAppModal,
    openPaymentReminderModal,
    getUserById,
    getCustomerById,
    getSiteById,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'details' | 'daily_updates' | 'timeline' | 'notes' | 'attachments' | 'report'>('details');
  const [newNote, setNewNote] = useState('');
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [selectedImageForLightbox, setSelectedImageForLightbox] = useState<string | null>(null);
  const [confirmDeleteJob, setConfirmDeleteJob] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Daily Progress Notes Form State
  const [dailyDate, setDailyDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dailyTime, setDailyTime] = useState(() =>
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  );
  const [dailyProgress, setDailyProgress] = useState('');
  const [dailyStatus, setDailyStatus] = useState<JobStatus | ''>('');
  const [dailyBlockers, setDailyBlockers] = useState('');
  const [isDailySaving, setIsDailySaving] = useState(false);
  const [dailySavedToast, setDailySavedToast] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const completionPhotoRef = useRef<HTMLInputElement>(null);

  // Completion Form State
  const [completionData, setCompletionData] = useState<CompletionReport>({
    workDone: '',
    problemFound: '',
    actionTaken: '',
    pendingWork: 'None',
    materialRequired: 'None',
    customerRemarks: 'Verified satisfactory performance.',
    engineerRemarks: '',
    completionDate: new Date().toISOString().split('T')[0],
    completionTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
    completedById: currentUser.id,
    completedByName: currentUser.name,
  });

  // Extension Form State
  const [extDate, setExtDate] = useState('');
  const [extReason, setExtReason] = useState('');

  if (!selectedJobId) return null;

  const job = jobs.find((j) => j.id === selectedJobId);
  if (!job) return null;

  const customer = getCustomerById(job.customerId);
  const site = getSiteById(job.customerId, job.siteId);
  const assignee = getUserById(job.assignedToId);
  const jobActivities = activities.filter((a) => a.jobId === job.id);

  const isAssignedToCurrent = job.assignedToId === currentUser.id || job.additionalAssigneeIds?.includes(currentUser.id);
  const canManage = ['admin', 'manager'].includes(currentUser.role);

  const handleNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addJobNote(job.id, newNote.trim());
    setNewNote('');
  };

  const handleDailyUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dailyProgress.trim()) {
      alert('Please enter today\'s progress update notes.');
      return;
    }
    setIsDailySaving(true);
    try {
      await addDailyUpdate(job.id, {
        date: dailyDate,
        time: dailyTime,
        workProgress: dailyProgress.trim(),
        status: dailyStatus ? (dailyStatus as JobStatus) : undefined,
        blockers: dailyBlockers.trim() || undefined,
      });
      setDailyProgress('');
      setDailyBlockers('');
      setDailySavedToast(true);
      setTimeout(() => setDailySavedToast(false), 2500);
    } catch (err: any) {
      alert(err.message || 'Failed to save daily update');
    } finally {
      setIsDailySaving(false);
    }
  };

  const handleCompleteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!completionData.workDone.trim()) {
      alert('Please specify the work done.');
      return;
    }
    completeJob(job.id, {
      ...completionData,
      completedById: currentUser.id,
      completedByName: currentUser.name,
    });
    setShowCompleteForm(false);
    setActiveTab('report');
  };

  const handleExtensionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extDate || !extReason.trim()) return;
    requestExtension(job.id, extDate, extReason.trim());
    setShowExtensionModal(false);
    setExtReason('');
  };

  const handleDeviceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const fileList = Array.from(files) as File[];

    fileList.forEach((file: File) => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      const fileType: 'image' | 'pdf' | 'document' = isImage ? 'image' : isPdf ? 'pdf' : 'document';
      const sizeStr = file.size > 1024 * 1024
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
        : `${Math.round(file.size / 1024)} KB`;

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (dataUrl) {
          addJobAttachment(job.id, {
            name: file.name,
            fileType,
            size: sizeStr,
            url: dataUrl,
          });
        }
      };
      reader.readAsDataURL(file);
    });

    setIsUploading(false);
    if (e.target) e.target.value = '';
  };

  const handleCompletionFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const fileType: 'image' | 'pdf' | 'document' = isImage ? 'image' : isPdf ? 'pdf' : 'document';
    const sizeStr = file.size > 1024 * 1024
      ? `${(file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(file.size / 1024)} KB`;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        addJobAttachment(job.id, {
          name: `Completion_${file.name}`,
          fileType,
          size: sizeStr,
          url: dataUrl,
        });
      }
    };
    reader.readAsDataURL(file);
    if (e.target) e.target.value = '';
  };

  const handleDeleteJob = () => {
    deleteJob(job.id);
    setSelectedJobId(null);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      {/* Hidden File Inputs for Device & Camera Uploads */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        onChange={handleDeviceFileUpload}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleDeviceFileUpload}
        className="hidden"
      />
      <input
        ref={completionPhotoRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleCompletionFileUpload}
        className="hidden"
      />

      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-stone-50/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">
              {job.jobId}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900 line-clamp-1">{job.title}</h2>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusBadgeClass(
                    job.status
                  )}`}
                >
                  {formatStatusLabel(job.status)}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-[11px] uppercase border font-bold ${getPriorityBadgeClass(
                    job.priority
                  )}`}
                >
                  {job.priority}
                </span>
              </div>
              <div className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                <span>{customer?.companyName}</span>
                <span>•</span>
                <span>{site?.siteName}</span>
                <span>•</span>
                <span className="font-semibold text-stone-700">Due: {formatDateDisplay(job.dueDate)} at {job.dueTime}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser.role === 'admin' ? (
              <button
                onClick={() => openEditJobModal(job)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Edit Job Details (Admin Only)"
              >
                <Edit2 className="w-3.5 h-3.5 text-stone-600" />
                <span>Edit Job</span>
              </button>
            ) : (
              <span
                className="px-2.5 py-1.5 rounded-xl bg-stone-100 border border-stone-200 text-stone-500 text-xs font-medium flex items-center gap-1.5"
                title="Only Administrator can modify original job details once assigned. Assigned staff can record Daily Notes and update status."
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>Specs Locked (Admin Only)</span>
              </span>
            )}

            <button
              onClick={() => openSendWhatsAppModal(job)}
              className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
              title="Open WhatsApp Reminder Composer"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
              <span>WhatsApp Reminder</span>
            </button>

            {['admin', 'manager'].includes(currentUser.role) && (
              <button
                onClick={() => openPaymentReminderModal(customer, job)}
                className="px-3 py-1.5 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                title="Send Client Payment Reminder via WhatsApp & Email"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-700" />
                <span>Client Payment Reminder</span>
              </button>
            )}

            {currentUser.role === 'admin' && (
              !confirmDeleteJob ? (
                <button
                  onClick={() => setConfirmDeleteJob(true)}
                  className="p-1.5 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                  title="Delete Job"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleDeleteJob}
                    className="px-2.5 py-1 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-700 cursor-pointer"
                  >
                    Confirm Delete
                  </button>
                  <button
                    onClick={() => setConfirmDeleteJob(false)}
                    className="px-2 py-1 rounded-lg border border-stone-200 text-stone-600 text-xs cursor-pointer hover:bg-stone-100"
                  >
                    No
                  </button>
                </div>
              )
            )}

            <button
              onClick={() => setSelectedJobId(null)}
              className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Status Bar */}
        <div className="px-6 py-2.5 bg-emerald-50/40 border-b border-stone-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-stone-500 font-medium">Quick Status Action:</span>
            {job.status === 'assigned' && (
              <button
                onClick={() => acceptJob(job.id)}
                className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer shadow-2xs"
              >
                Accept Job
              </button>
            )}

            {job.status === 'accepted' && (
              <button
                onClick={() => startJob(job.id)}
                className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold cursor-pointer shadow-2xs"
              >
                Start Work (In Progress)
              </button>
            )}

            {['in_progress', 'accepted', 'assigned', 'overdue'].includes(job.status) && (
              <button
                onClick={() => setShowCompleteForm(true)}
                className="px-3 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer shadow-2xs flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Completed &amp; File Report</span>
              </button>
            )}

            {/* Quick Extension Request */}
            {!['completed', 'cancelled'].includes(job.status) && !job.extensionRequest && (
              <button
                onClick={() => setShowExtensionModal(true)}
                className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 font-medium cursor-pointer"
              >
                Request Extension
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-stone-400">Assigned Engineer:</span>
            <button
              onClick={() => assignee && openUserProfile(assignee)}
              className="font-semibold text-emerald-800 hover:text-emerald-950 hover:underline flex items-center gap-1 cursor-pointer"
              title="Click to view full engineer profile and workload"
            >
              <span>{assignee?.name || 'Unassigned'}</span>
              <ExternalLink className="w-3 h-3 text-emerald-600" />
            </button>
            {assignee?.mobile && (
              <a
                href={`tel:${assignee.mobile}`}
                className="p-1 rounded-md text-emerald-700 hover:bg-emerald-100"
                title="Call Engineer"
              >
                <Phone className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>

        {/* Pending Extension Request Alert */}
        {job.extensionRequest && job.extensionRequest.status === 'pending' && (
          <div className="px-6 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Extension Requested:</strong> {job.extensionRequest.requestedBy} requested extension to{' '}
                <strong>{formatDateDisplay(job.extensionRequest.requestedDueDate)}</strong> (Reason: "{job.extensionRequest.reason}")
              </span>
            </div>
            {canManage && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => reviewExtension(job.id, true, 'Approved by manager')}
                  className="px-2.5 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-semibold cursor-pointer"
                >
                  Approve
                </button>
                <button
                  onClick={() => reviewExtension(job.id, false, 'Denied due to customer SLA')}
                  className="px-2.5 py-0.5 rounded bg-red-600 hover:bg-red-700 text-white font-semibold cursor-pointer"
                >
                  Reject
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="px-6 border-b border-stone-200 flex gap-6 text-xs font-semibold shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 border-b-2 transition-colors cursor-pointer shrink-0 ${
              activeTab === 'details'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Job Details
          </button>
          <button
            onClick={() => setActiveTab('daily_updates')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'daily_updates'
                ? 'border-emerald-600 text-emerald-700 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <NotebookPen className="w-3.5 h-3.5 text-emerald-600" />
            <span>Daily Notes &amp; Progress</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              {job.dailyUpdates?.length || 0}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'timeline'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Activity Timeline ({jobActivities.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 border-b-2 transition-colors cursor-pointer ${
              activeTab === 'notes'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            Notes &amp; Logs ({job.notes.length})
          </button>
          <button
            onClick={() => setActiveTab('attachments')}
            className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'attachments'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5" />
            <span>Attachments ({job.attachments.length})</span>
          </button>
          {job.completionReport && (
            <button
              onClick={() => setActiveTab('report')}
              className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 text-emerald-700 ${
                activeTab === 'report' ? 'border-emerald-600 font-bold' : 'border-transparent hover:text-emerald-800'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Completion Report</span>
            </button>
          )}
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Description */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400 mb-1.5">
                  Job Scope &amp; Technical Description
                </h4>
                <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs text-stone-800 leading-relaxed">
                  {job.description || 'No detailed technical description provided for this job.'}
                </div>
              </div>

              {/* Location & Client Information Card */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-stone-200 bg-white space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                      Client &amp; Facility
                    </h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-stone-100 font-semibold text-stone-600">
                      {customer?.customerType}
                    </span>
                  </div>
                  <div>
                    <div className="font-bold text-stone-900 text-sm">{customer?.companyName}</div>
                    <div className="text-xs text-stone-600 mt-1 flex items-start gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <strong>{site?.siteName}</strong>
                        <div className="text-stone-500 text-[11px]">{site?.address || customer?.address}</div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-stone-400">Site Contact: </span>
                      <span className="font-semibold text-stone-800">{job.contactPerson || site?.contactPerson}</span>
                    </div>
                    {job.contactNumber && (
                      <a
                        href={`tel:${job.contactNumber}`}
                        className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        <span>{job.contactNumber}</span>
                      </a>
                    )}
                  </div>

                  {site?.gpsLocation && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.gpsLocation)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-semibold mt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open Location in Google Maps</span>
                    </a>
                  )}
                </div>

                {/* Assignment & Schedule Specs */}
                <div className="p-4 rounded-xl border border-stone-200 bg-white space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Assignment &amp; Timing
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-500">Lead Engineer:</span>
                      <span className="font-semibold text-stone-900">{assignee?.name}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-500">Scheduled Date:</span>
                      <span className="font-semibold text-stone-900">{formatDateDisplay(job.dueDate)}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-500">Target Time:</span>
                      <span className="font-semibold text-stone-900">{job.dueTime}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-500">Estimated Duration:</span>
                      <span className="font-semibold text-stone-900">{job.estimatedDuration}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-stone-100">
                      <span className="text-stone-500">Job Classification:</span>
                      <span className="font-semibold text-stone-900">{job.jobType}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-stone-500">Automated WhatsApp Reminders:</span>
                      <span className="font-semibold text-emerald-700">
                        {job.reminderConfig.enabled ? 'Active' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Progress Updates Quick Section in Details Tab */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <NotebookPen className="w-4 h-4 text-emerald-700" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-stone-900">
                      Daily Progress Notes / Site Updates ({job.dailyUpdates?.length || 0})
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('daily_updates')}
                    className="text-xs text-emerald-700 hover:text-emerald-800 font-bold cursor-pointer hover:underline"
                  >
                    View All &amp; Log More →
                  </button>
                </div>

                {/* Quick Add Form */}
                <form onSubmit={handleDailyUpdateSubmit} className="space-y-3 bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-stone-800">
                      Post Today's Progress Update
                    </span>
                    <span className="text-[11px] text-stone-400">
                      Signed as: <strong className="text-stone-700">{currentUser.name}</strong> ({currentUser.role})
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                    <div>
                      <label className="block text-[11px] text-stone-500 mb-0.5 font-medium">Date</label>
                      <input
                        type="date"
                        value={dailyDate}
                        onChange={(e) => setDailyDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs bg-stone-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-500 mb-0.5 font-medium">Time</label>
                      <input
                        type="time"
                        value={dailyTime}
                        onChange={(e) => setDailyTime(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs bg-stone-50"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-stone-500 mb-0.5 font-medium">Status Update</label>
                      <select
                        value={dailyStatus}
                        onChange={(e) => setDailyStatus(e.target.value as JobStatus)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs bg-stone-50"
                      >
                        <option value="">Keep current ({job.status})</option>
                        <option value="in_progress">In Progress</option>
                        <option value="on_hold">On Hold</option>
                        <option value="pending_parts">Pending Parts</option>
                        <option value="accepted">Accepted</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      placeholder="Enter daily progress, technical work performed today, parts replaced..."
                      value={dailyProgress}
                      onChange={(e) => setDailyProgress(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-200 text-xs placeholder:text-stone-400 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-600"
                      required
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
                    <input
                      type="text"
                      placeholder="Blockers / Site delays (optional, e.g. Customer site locked)"
                      value={dailyBlockers}
                      onChange={(e) => setDailyBlockers(e.target.value)}
                      className="w-full sm:flex-1 px-2.5 py-1.5 rounded-lg border border-stone-200 text-xs placeholder:text-stone-400"
                    />

                    <button
                      type="submit"
                      disabled={isDailySaving || !dailyProgress.trim()}
                      className="w-full sm:w-auto px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs transition-colors shrink-0"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isDailySaving ? 'Saving...' : 'Save Daily Note'}</span>
                    </button>
                  </div>

                  {dailySavedToast && (
                    <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Daily note saved successfully!</span>
                    </div>
                  )}
                </form>

                {/* Latest 2 Daily Updates Preview */}
                {job.dailyUpdates && job.dailyUpdates.length > 0 && (
                  <div className="space-y-2 pt-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                      Recent Daily Logs
                    </span>
                    <div className="space-y-2">
                      {job.dailyUpdates.slice(0, 2).map((du) => (
                        <div key={du.id} className="p-3 rounded-xl bg-white border border-stone-200 text-xs shadow-2xs">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-stone-900">{du.authorName}</span>
                              <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 capitalize">
                                {du.authorRole}
                              </span>
                            </div>
                            <span className="text-[11px] font-mono text-stone-500">
                              {du.date} at {du.time}
                            </span>
                          </div>
                          <p className="text-stone-700 whitespace-pre-wrap">{du.workProgress}</p>
                          {du.blockers && (
                            <div className="mt-1.5 p-1.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-[11px]">
                              ⚠️ <strong>Blocker:</strong> {du.blockers}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dedicated Daily Notes & Progress Updates Tab */}
          {activeTab === 'daily_updates' && (
            <div className="space-y-6">
              {/* Add Daily Note Form */}
              <div className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-3">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm flex items-center gap-2">
                      <NotebookPen className="w-4 h-4 text-emerald-700" />
                      <span>Record Daily Progress / Site Update</span>
                    </h3>
                    <p className="text-xs text-stone-500 mt-0.5">
                      Assigned employees and managers can record date-stamped progress notes, delays, and status changes.
                    </p>
                  </div>
                  <div className="text-xs text-stone-600 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 shrink-0">
                    Posting as: <strong className="text-stone-900">{currentUser.name}</strong> ({currentUser.role})
                  </div>
                </div>

                <form onSubmit={handleDailyUpdateSubmit} className="space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Log Date *
                      </label>
                      <input
                        type="date"
                        value={dailyDate}
                        onChange={(e) => setDailyDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Log Time *
                      </label>
                      <input
                        type="time"
                        value={dailyTime}
                        onChange={(e) => setDailyTime(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                        required
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-stone-700 mb-1">
                        Update Job Status (Optional)
                      </label>
                      <select
                        value={dailyStatus}
                        onChange={(e) => setDailyStatus(e.target.value as JobStatus)}
                        className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs bg-stone-50 focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      >
                        <option value="">Keep current status ({job.status})</option>
                        <option value="in_progress">In Progress</option>
                        <option value="on_hold">On Hold</option>
                        <option value="pending_parts">Pending Parts</option>
                        <option value="accepted">Accepted</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Daily Work Progress Details *
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Describe what tasks you executed today, equipment inspected, observations, customer interactions..."
                      value={dailyProgress}
                      onChange={(e) => setDailyProgress(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs placeholder:text-stone-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-stone-700 mb-1">
                      Site Blockers / Delays / Dependencies (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Waiting for power outage clearance, customer representative was unavailable, etc."
                      value={dailyBlockers}
                      onChange={(e) => setDailyBlockers(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs placeholder:text-stone-400 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    {dailySavedToast ? (
                      <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Daily note saved successfully!</span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-stone-400">
                        All daily updates are permanently date-stamped and synced to server.
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={isDailySaving || !dailyProgress.trim()}
                      className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>{isDailySaving ? 'Saving...' : 'Save Daily Note'}</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Reverse Chronological List of Daily Updates */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Daily Progress Log History ({job.dailyUpdates?.length || 0})
                  </h4>
                </div>

                {!job.dailyUpdates || job.dailyUpdates.length === 0 ? (
                  <div className="text-center py-10 bg-stone-50 rounded-2xl border border-stone-200 text-stone-400 text-xs space-y-2">
                    <NotebookPen className="w-8 h-8 mx-auto text-stone-300" />
                    <p className="font-semibold text-stone-600">No Daily Notes Recorded Yet</p>
                    <p className="text-[11px]">Use the form above to record your first daily site update.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {job.dailyUpdates.map((du, index) => (
                      <div
                        key={du.id || index}
                        className="p-4 rounded-2xl bg-white border border-stone-200 shadow-2xs space-y-2.5 transition-all hover:border-emerald-200"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stone-100 pb-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center">
                              {du.authorName ? du.authorName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-xs text-stone-900">
                                {du.authorName}
                              </div>
                              <div className="text-[10px] text-stone-500 capitalize">
                                {du.authorRole}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            {du.status && (
                              <span className="px-2 py-0.5 rounded-md bg-stone-100 font-semibold text-[10px] uppercase tracking-wider text-stone-700">
                                {du.status.replace('_', ' ')}
                              </span>
                            )}
                            <div className="flex items-center gap-1 text-stone-500 font-mono text-[11px] bg-stone-50 px-2 py-0.5 rounded-md border border-stone-200">
                              <Calendar className="w-3 h-3 text-stone-400" />
                              <span>{du.date}</span>
                              <Clock className="w-3 h-3 text-stone-400 ml-1" />
                              <span>{du.time}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-xs text-stone-800 whitespace-pre-wrap leading-relaxed">
                          {du.workProgress}
                        </div>

                        {du.blockers && (
                          <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-xs flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-semibold">Blocker / Dependency:</strong> {du.blockers}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="text-xs text-stone-500 mb-2">
                Chronological audit timeline of all creation, assignment, automated WhatsApp reminders, and status changes.
              </div>
              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-stone-200">
                {jobActivities.map((act) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-6 top-0.5 w-4 h-4 rounded-full bg-white border-2 border-emerald-600 shadow-2xs" />
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-stone-900">{act.actorName}</div>
                      <div className="text-[10px] text-stone-400">
                        {new Date(act.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-xs text-stone-700 mt-1 bg-stone-50 p-2.5 rounded-xl border border-stone-100">
                      {act.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <form onSubmit={handleNoteSubmit} className="space-y-2">
                <textarea
                  rows={2}
                  placeholder="Add site update, problem diagnostic, or operational remarks..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer shadow-xs"
                  >
                    Post Note
                  </button>
                </div>
              </form>

              <div className="space-y-3 pt-2">
                {job.notes.length === 0 ? (
                  <div className="text-center py-6 text-xs text-stone-400">No notes posted yet.</div>
                ) : (
                  job.notes.map((n) => (
                    <div key={n.id} className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-xs">
                      <div className="flex items-center justify-between font-semibold text-stone-900 mb-1">
                        <span>{n.authorName}</span>
                        <span className="text-[10px] text-stone-400 font-normal">
                          {new Date(n.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-stone-700 whitespace-pre-wrap">{n.content}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Attachments */}
          {activeTab === 'attachments' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-stone-50 p-4 rounded-2xl border border-stone-200">
                <div>
                  <h4 className="text-xs font-bold text-stone-900">Upload Site Photos &amp; Documents</h4>
                  <p className="text-[11px] text-stone-500">
                    Take live camera photos from phone, or upload diagnostic reports &amp; service sheets from device.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="Take photo using device camera"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Take Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-800 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    title="Choose photos or files from this device"
                  >
                    <Upload className="w-4 h-4 text-stone-600" />
                    <span>Device Files</span>
                  </button>
                </div>
              </div>

              {/* Drag-and-drop dropzone button */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-200 hover:border-emerald-500 rounded-2xl p-6 text-center cursor-pointer transition-colors bg-white hover:bg-emerald-50/20 group"
              >
                <div className="w-10 h-10 rounded-2xl bg-stone-100 group-hover:bg-emerald-100 text-stone-600 group-hover:text-emerald-700 flex items-center justify-center mx-auto mb-2 transition-colors">
                  <Paperclip className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-stone-800">
                  Click or tap here to upload files / photos from your device
                </p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Supports JPG, PNG, WEBP, PDF, DOC, XLS (Up to 10MB each)
                </p>
              </div>

              {/* Attachments List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                {job.attachments.length === 0 ? (
                  <div className="col-span-2 text-center py-8 text-xs text-stone-400 bg-stone-50 rounded-2xl border border-stone-200">
                    No attachments uploaded for this job yet. Tap "Take Photo" or "Device Files" above.
                  </div>
                ) : (
                  job.attachments.map((att) => (
                    <div
                      key={att.id}
                      className="p-3 rounded-2xl border border-stone-200 bg-white flex items-center justify-between gap-3 hover:border-emerald-300 transition-colors shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {att.fileType === 'image' ? (
                          <div
                            onClick={() => setSelectedImageForLightbox(att.url)}
                            className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 shrink-0 border border-stone-200 cursor-pointer group relative"
                            title="Click to view full photo"
                          >
                            <img
                              src={att.url}
                              alt={att.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="font-semibold text-stone-900 text-xs truncate" title={att.name}>
                            {att.name}
                          </div>
                          <div className="text-[10px] text-stone-500 mt-0.5">
                            {att.size} • by {att.uploadedBy}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {att.fileType === 'image' ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setSelectedImageForLightbox(att.url)}
                              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold cursor-pointer flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                            <a
                              href={att.url}
                              download={att.name || 'job-attachment'}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Download to device"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </a>
                          </>
                        ) : (
                          <>
                            <a
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span>View</span>
                            </a>
                            <a
                              href={att.url}
                              download={att.name || 'document'}
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                              title="Download to device"
                            >
                              <Download className="w-3 h-3" />
                              <span>Download</span>
                            </a>
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => deleteJobAttachment(job.id, att.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                          title="Remove attachment"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Completion Report View */}
          {activeTab === 'report' && job.completionReport && (
            <div className="space-y-5 bg-white p-6 rounded-2xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between border-b border-stone-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm">Official Job Completion Certificate</h3>
                    <p className="text-[11px] text-stone-500">
                      Closed on {formatDateDisplay(job.completionReport.completionDate)} at {job.completionReport.completionTime} by {job.completionReport.completedByName}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="font-bold uppercase tracking-wider text-stone-400 text-[10px]">Work Done</span>
                  <p className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-stone-800">
                    {job.completionReport.workDone}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold uppercase tracking-wider text-stone-400 text-[10px]">Problem Diagnostic</span>
                  <p className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-stone-800">
                    {job.completionReport.problemFound || 'Routine inspection / none'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold uppercase tracking-wider text-stone-400 text-[10px]">Corrective Action Taken</span>
                  <p className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-stone-800">
                    {job.completionReport.actionTaken}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="font-bold uppercase tracking-wider text-stone-400 text-[10px]">Pending Work / Next Cycle</span>
                  <p className="p-3 rounded-xl bg-stone-50 border border-stone-100 text-stone-800">
                    {job.completionReport.pendingWork || 'None. Fully restored.'}
                  </p>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <span className="font-bold uppercase tracking-wider text-stone-400 text-[10px]">Customer Remarks</span>
                  <p className="p-3 rounded-xl bg-emerald-50/50 border border-emerald-100 text-emerald-900 font-medium">
                    "{job.completionReport.customerRemarks || 'Satisfactory'}"
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Complete Form Drawer */}
        {showCompleteForm && (
          <div className="fixed inset-0 z-60 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-bold text-stone-900 text-base">File Job Completion Report</h3>
                <button
                  onClick={() => setShowCompleteForm(false)}
                  className="text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCompleteSubmit} className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Technical Work Done <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Describe tasks completed, component test results, calibrations..."
                    value={completionData.workDone}
                    onChange={(e) => setCompletionData({ ...completionData, workDone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">Problem Found</label>
                    <input
                      type="text"
                      placeholder="e.g. Clogged intake filter / low refrigerant"
                      value={completionData.problemFound}
                      onChange={(e) => setCompletionData({ ...completionData, problemFound: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">Action Taken</label>
                    <input
                      type="text"
                      placeholder="e.g. Replaced filter cartridge and re-tested"
                      value={completionData.actionTaken}
                      onChange={(e) => setCompletionData({ ...completionData, actionTaken: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">Pending Work (if any)</label>
                    <input
                      type="text"
                      value={completionData.pendingWork}
                      onChange={(e) => setCompletionData({ ...completionData, pendingWork: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-stone-800 mb-1">Material Required</label>
                    <input
                      type="text"
                      value={completionData.materialRequired}
                      onChange={(e) => setCompletionData({ ...completionData, materialRequired: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Customer Remarks</label>
                  <input
                    type="text"
                    value={completionData.customerRemarks}
                    onChange={(e) => setCompletionData({ ...completionData, customerRemarks: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs"
                  />
                </div>

                {/* Upload completion photo / signed report */}
                <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-stone-900 block">Attach Completion Photo / Signed Work Order</span>
                    <span className="text-[10px] text-stone-500">Capture site equipment photo or signed customer sheet</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => completionPhotoRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>Attach Photo</span>
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowCompleteForm(false)}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                  >
                    Submit &amp; Complete Job
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Full Resolution Photo Lightbox Modal */}
        {selectedImageForLightbox && (
          <div
            onClick={() => setSelectedImageForLightbox(null)}
            className="fixed inset-0 z-70 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-zoom-out"
          >
            <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
              <button
                type="button"
                onClick={() => setSelectedImageForLightbox(null)}
                className="absolute -top-10 right-0 p-2 text-white/80 hover:text-white cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
              <img
                src={selectedImageForLightbox}
                alt="Enlarged view"
                className="max-h-[85vh] max-w-full rounded-2xl object-contain shadow-2xl border border-white/10"
              />
              <div className="mt-2 text-center text-xs text-stone-300">
                Tap anywhere to close lightbox
              </div>
            </div>
          </div>
        )}

        {/* Extension Request Drawer */}
        {showExtensionModal && (
          <div className="fixed inset-0 z-60 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 space-y-4">
              <div className="flex items-center justify-between border-b border-stone-100 pb-3">
                <h3 className="font-bold text-stone-900 text-base">Request Deadline Extension</h3>
                <button
                  onClick={() => setShowExtensionModal(false)}
                  className="text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleExtensionSubmit} className="space-y-3 text-xs">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    New Requested Deadline <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={extDate}
                    onChange={(e) => setExtDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-800 mb-1">
                    Reason for Extension <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="e.g. Waiting for spare gasket from warehouse / site power shutdown..."
                    value={extReason}
                    onChange={(e) => setExtReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                  <button
                    type="button"
                    onClick={() => setShowExtensionModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                  >
                    Send Request to Manager
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
