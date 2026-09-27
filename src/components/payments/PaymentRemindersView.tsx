import React, { useMemo, useState, useRef } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Banknote,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  CreditCard,
  Download,
  Edit2,
  ExternalLink,
  Eye,
  FileCheck,
  FileDown,
  FileText,
  Filter,
  Image as ImageIcon,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClientPaymentReminder, PaymentDocumentAttachment, PaymentReminderStatus } from '../../types';
import {
  formatIndianCurrency,
  openInGmailWeb,
  syncAndOpenMailApp,
} from '../../utils/paymentSyncEngine';
import { CreatePaymentReminderModal } from './CreatePaymentReminderModal';
import { RecordPaymentModal } from './RecordPaymentModal';

export const PaymentRemindersView: React.FC = () => {
  const {
    paymentReminders,
    deletePaymentReminder,
    updatePaymentReminder,
    syncAndSendEmailReminder,
    sendWhatsAppReminderAction,
    sendPaymentReminderEmail,
    openPaymentReminderModal,
    currentUser,
    companySettings,
  } = useApp();

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | PaymentReminderStatus>('all');
  const [sortBy, setSortBy] = useState<'due_date_asc' | 'due_date_desc' | 'amount_desc' | 'amount_asc' | 'client_name'>('due_date_asc');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [reminderToEdit, setReminderToEdit] = useState<ClientPaymentReminder | null>(null);
  const [reminderForPaymentRecord, setReminderForPaymentRecord] = useState<ClientPaymentReminder | null>(null);
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);

  // Document preview lightbox
  const [previewDocument, setPreviewDocument] = useState<PaymentDocumentAttachment | null>(null);

  // Target reminder ID for quick document upload
  const [activeUploadReminderId, setActiveUploadReminderId] = useState<string | null>(null);
  const cardFileInputRef = useRef<HTMLInputElement>(null);

  // Active send dropdown menu per card
  const [openSendMenuId, setOpenSendMenuId] = useState<string | null>(null);

  // Feedback state
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null);
  const [sentToastMsg, setSentToastMsg] = useState<string | null>(null);
  const [isDispatchingServerEmail, setIsDispatchingServerEmail] = useState<string | null>(null);

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  const sevenDaysLater = new Date(now);
  sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
  const sevenDaysStr = sevenDaysLater.toISOString().split('T')[0];

  // Calculated KPI Metrics
  const metrics = useMemo(() => {
    let totalInvoiced = 0;
    let totalReceived = 0;
    let totalOutstanding = 0;
    let overdueCount = 0;
    let overdueAmount = 0;
    let dueSoonCount = 0;
    let dueSoonAmount = 0;
    let paidCount = 0;
    const clientIdsWithDues = new Set<string>();

    paymentReminders.forEach((r) => {
      totalInvoiced += Number(r.totalAmount || 0);
      totalReceived += Number(r.paidAmount || 0);
      const pending = Number(r.pendingAmount || 0);
      totalOutstanding += pending;

      if (r.status === 'paid' || pending <= 0) {
        paidCount++;
      } else {
        clientIdsWithDues.add(r.customerId || r.customerName);

        if (r.dueDate && r.dueDate < todayStr) {
          overdueCount++;
          overdueAmount += pending;
        } else if (r.dueDate && r.dueDate >= todayStr && r.dueDate <= sevenDaysStr) {
          dueSoonCount++;
          dueSoonAmount += pending;
        }
      }
    });

    const collectionRate = totalInvoiced > 0 ? Math.round((totalReceived / totalInvoiced) * 100) : 0;

    return {
      totalInvoiced,
      totalReceived,
      totalOutstanding,
      overdueCount,
      overdueAmount,
      dueSoonCount,
      dueSoonAmount,
      paidCount,
      clientsWithDuesCount: clientIdsWithDues.size,
      collectionRate,
    };
  }, [paymentReminders, todayStr, sevenDaysStr]);

  // Filtered & Sorted Reminders
  const filteredReminders = useMemo(() => {
    let list = [...paymentReminders];

    // Status filter
    if (statusFilter !== 'all') {
      list = list.filter((r) => r.status === statusFilter);
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      list = list.filter((r) => {
        return (
          r.customerName.toLowerCase().includes(q) ||
          r.contactPerson.toLowerCase().includes(q) ||
          r.invoiceNumber.toLowerCase().includes(q) ||
          r.contactEmail.toLowerCase().includes(q) ||
          (r.clientCcEmails && r.clientCcEmails.toLowerCase().includes(q)) ||
          r.contactMobile.includes(q) ||
          (r.jobTitle && r.jobTitle.toLowerCase().includes(q))
        );
      });
    }

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'due_date_asc') {
        return (a.dueDate || '').localeCompare(b.dueDate || '');
      }
      if (sortBy === 'due_date_desc') {
        return (b.dueDate || '').localeCompare(a.dueDate || '');
      }
      if (sortBy === 'amount_desc') {
        return (b.pendingAmount || 0) - (a.pendingAmount || 0);
      }
      if (sortBy === 'amount_asc') {
        return (a.pendingAmount || 0) - (b.pendingAmount || 0);
      }
      if (sortBy === 'client_name') {
        return a.customerName.localeCompare(b.customerName);
      }
      return 0;
    });

    return list;
  }, [paymentReminders, statusFilter, searchTerm, sortBy]);

  // Handlers
  const handleOpenCreateModal = () => {
    setReminderToEdit(null);
    setIsCreateModalOpen(true);
  };

  const handleOpenEditModal = (rem: ClientPaymentReminder) => {
    setReminderToEdit(rem);
    setIsCreateModalOpen(true);
  };

  const handleSendEmailSync = (rem: ClientPaymentReminder) => {
    syncAndSendEmailReminder(rem);
    setOpenSendMenuId(null);
    setSentToastMsg(`Direct Mail App synced with CC for ${rem.customerName}! Check your email client.`);
    setTimeout(() => setSentToastMsg(null), 4500);
  };

  const handleSendGmailSync = (rem: ClientPaymentReminder) => {
    openInGmailWeb({
      to: rem.contactEmail,
      cc: rem.clientCcEmails,
      subject: rem.emailSubject,
      body: rem.emailDraft,
    });
    setOpenSendMenuId(null);
    setSentToastMsg(`Opened Web Gmail compose for ${rem.customerName} with CC, documents & draft!`);
    setTimeout(() => setSentToastMsg(null), 4500);
  };

  const handleSendWhatsAppSync = (rem: ClientPaymentReminder) => {
    sendWhatsAppReminderAction(rem);
    setOpenSendMenuId(null);
    setSentToastMsg(`WhatsApp chat opened for ${rem.customerName}!`);
    setTimeout(() => setSentToastMsg(null), 4500);
  };

  const handleSendServerEmailDispatch = async (rem: ClientPaymentReminder) => {
    if (!rem.contactEmail) {
      alert('No contact email configured for this client');
      return;
    }

    setIsDispatchingServerEmail(rem.id);
    try {
      const res = await sendPaymentReminderEmail({
        toEmail: rem.contactEmail,
        ccEmail: rem.clientCcEmails,
        subject: rem.emailSubject,
        body: rem.emailDraft,
        customerName: rem.customerName,
        invoiceNumber: rem.invoiceNumber,
        amount: rem.pendingAmount,
        reminderId: rem.id,
        documents: rem.documents,
        customerId: rem.customerId,
      });

      setSentToastMsg(res.message || `Payment Reminder email dispatched to ${rem.contactEmail}!`);
      setTimeout(() => setSentToastMsg(null), 5000);
    } catch (err: any) {
      setSentToastMsg('Error dispatching email: ' + (err.message || 'Unknown error'));
    } finally {
      setIsDispatchingServerEmail(null);
      setOpenSendMenuId(null);
    }
  };

  const handleCopyDraft = (rem: ClientPaymentReminder) => {
    const fullText = `Subject: ${rem.emailSubject}\n\nTo: ${rem.contactEmail}\nCC: ${rem.clientCcEmails || 'None'}\n\n${rem.emailDraft}`;
    navigator.clipboard.writeText(fullText);
    setCopiedDraftId(rem.id);
    setTimeout(() => setCopiedDraftId(null), 2500);
  };

  // Quick document upload per card
  const triggerQuickDocUpload = (reminderId: string) => {
    setActiveUploadReminderId(reminderId);
    cardFileInputRef.current?.click();
  };

  const handleCardFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !activeUploadReminderId) return;

    const targetReminder = paymentReminders.find((r) => r.id === activeUploadReminderId);
    if (!targetReminder) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        let fileType: PaymentDocumentAttachment['fileType'] = 'other';
        if (['pdf'].includes(extension)) fileType = 'pdf';
        else if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(extension)) fileType = 'image';
        else if (['doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx'].includes(extension)) fileType = 'document';

        const formatSize = (bytes: number) => {
          if (bytes < 1024) return bytes + ' B';
          if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
          return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
        };

        const newDoc: PaymentDocumentAttachment = {
          id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          fileType,
          dataUrl,
          size: formatSize(file.size),
          uploadedAt: new Date().toISOString(),
        };

        const updatedDocs = [...(targetReminder.documents || []), newDoc];
        updatePaymentReminder(targetReminder.id, {
          documents: updatedDocs,
        });

        setSentToastMsg(`Document "${file.name}" saved to #${targetReminder.invoiceNumber}!`);
        setTimeout(() => setSentToastMsg(null), 4000);
      };
      reader.readAsDataURL(file);
    });

    if (cardFileInputRef.current) {
      cardFileInputRef.current.value = '';
    }
  };

  const handleDeleteCardDoc = (reminderId: string, docId: string) => {
    const targetReminder = paymentReminders.find((r) => r.id === reminderId);
    if (!targetReminder) return;
    const updatedDocs = (targetReminder.documents || []).filter((d) => d.id !== docId);
    updatePaymentReminder(reminderId, { documents: updatedDocs });
  };

  const handleDownloadDoc = (doc: PaymentDocumentAttachment) => {
    if (!doc.dataUrl) return;
    const a = document.createElement('a');
    a.href = doc.dataUrl;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const getStatusBadge = (status: PaymentReminderStatus, dueDate: string, pending: number) => {
    const isPastDue = dueDate && dueDate < todayStr && pending > 0;

    if (status === 'paid' || pending <= 0) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
          <span>Fully Paid</span>
        </span>
      );
    }
    if (status === 'partially_paid') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-blue-700" />
          <span>Partially Paid</span>
        </span>
      );
    }
    if (isPastDue || status === 'overdue') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200 flex items-center gap-1 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-red-700" />
          <span>Overdue</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-200 flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 text-amber-700" />
        <span>Payment Due</span>
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Toast Banner */}
      {sentToastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-stone-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-stone-700 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{sentToastMsg}</span>
          <button
            onClick={() => setSentToastMsg(null)}
            className="p-1 rounded text-stone-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hidden file input for card document attachment */}
      <input
        ref={cardFileInputRef}
        type="file"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.txt"
        onChange={handleCardFileSelected}
        className="hidden"
      />

      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Client Payment Reminders &amp; Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Documents &amp; 1-Click Send
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl leading-relaxed">
            Configure invoices once with client details, CC emails, and attached documents. Click <strong>Send Reminder</strong> anytime to dispatch directly via Email or WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleOpenCreateModal}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer hover:scale-101"
          >
            <Plus className="w-4 h-4 text-amber-300 stroke-[2.5]" />
            <span>Create Payment Reminder</span>
          </button>
        </div>
      </div>

      {/* Financial Analytics & KPI Dashboard Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Invoiced */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs font-bold uppercase tracking-wider">
            <span>Total Invoiced</span>
            <Banknote className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-stone-900 mt-1.5 font-mono">
            {formatIndianCurrency(metrics.totalInvoiced)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1 font-medium">
            <span>{paymentReminders.length} total reminders tracked</span>
          </div>
        </div>

        {/* Total Outstanding Dues */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-red-600 text-xs font-bold uppercase tracking-wider">
            <span>Outstanding Balance</span>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-red-600 mt-1.5 font-mono">
            {formatIndianCurrency(metrics.totalOutstanding)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1 font-medium">
            Across {metrics.clientsWithDuesCount} clients with pending dues
          </div>
        </div>

        {/* Total Received / Collected */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs font-bold uppercase tracking-wider">
            <span>Payments Received</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-emerald-700 mt-1.5 font-mono">
            {formatIndianCurrency(metrics.totalReceived)}
          </div>
          <div className="text-[11px] text-emerald-800 mt-1 font-medium flex items-center gap-1">
            <span className="font-bold">{metrics.collectionRate}%</span>
            <span>collection rate ({metrics.paidCount} paid)</span>
          </div>
        </div>

        {/* Overdue / Urgent Alert */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 text-xs font-bold uppercase tracking-wider">
            <span>Overdue Invoices</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg sm:text-2xl font-black text-amber-700 mt-1.5 font-mono">
            {formatIndianCurrency(metrics.overdueAmount)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1 font-medium">
            {metrics.overdueCount} {metrics.overdueCount === 1 ? 'bill' : 'bills'} past due date
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client, invoice, email, phone..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Status Filter Buttons */}
          <div className="flex items-center bg-stone-100 p-1 rounded-xl text-xs font-medium">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'all'
                  ? 'bg-white text-stone-900 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All ({paymentReminders.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'pending'
                  ? 'bg-white text-amber-900 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setStatusFilter('overdue')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'overdue'
                  ? 'bg-white text-red-800 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Overdue ({metrics.overdueCount})
            </button>
            <button
              onClick={() => setStatusFilter('paid')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'paid'
                  ? 'bg-white text-emerald-800 font-bold shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Paid
            </button>
          </div>

          {/* Sort By Dropdown */}
          <select
            value={sortBy}
            onChange={(e: any) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-800 focus:bg-white focus:outline-none cursor-pointer"
          >
            <option value="due_date_asc">Sort: Due Date (Earliest)</option>
            <option value="due_date_desc">Sort: Due Date (Latest)</option>
            <option value="amount_desc">Sort: Pending Amount (High to Low)</option>
            <option value="amount_asc">Sort: Pending Amount (Low to High)</option>
            <option value="client_name">Sort: Client Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Reminders Ledger List */}
      {filteredReminders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-stone-200 shadow-xs">
          <CreditCard className="w-12 h-12 text-stone-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-stone-800">No payment reminders match your filter</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Create a payment reminder with client details, documents, and CC emails to start tracking receivables.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Reminder</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReminders.map((reminder) => {
            const isExpanded = expandedDraftId === reminder.id;
            const percentPaid =
              reminder.totalAmount > 0
                ? Math.min(100, Math.round((reminder.paidAmount / reminder.totalAmount) * 100))
                : 0;
            const isPastDue = reminder.dueDate && reminder.dueDate < todayStr && reminder.pendingAmount > 0;
            const docList = Array.isArray(reminder.documents) ? reminder.documents : [];

            return (
              <div
                key={reminder.id}
                className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden transition-all hover:border-emerald-300"
              >
                {/* Main Card Header & Financial Summary */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Customer & Invoice Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 border border-emerald-100 font-black text-sm">
                      <Building2 className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-stone-900 text-base tracking-tight">
                          {reminder.customerName}
                        </h3>
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-stone-100 text-stone-700 font-bold border border-stone-200">
                          #{reminder.invoiceNumber}
                        </span>
                        {getStatusBadge(reminder.status, reminder.dueDate, reminder.pendingAmount)}
                      </div>

                      <div className="text-xs text-stone-600 flex items-center gap-3 flex-wrap">
                        {reminder.contactPerson && (
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-stone-400" />
                            <span>{reminder.contactPerson}</span>
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-stone-700 font-medium">
                          <Mail className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{reminder.contactEmail || 'No email set'}</span>
                        </span>
                        {reminder.contactMobile && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-stone-400" />
                            <span>{reminder.contactMobile}</span>
                          </span>
                        )}
                      </div>

                      {/* Saved CC Tag */}
                      {reminder.clientCcEmails && (
                        <div className="pt-0.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-900">
                            <Mail className="w-3 h-3 text-emerald-700" />
                            <span>Saved CC: {reminder.clientCcEmails}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Column: Financials & Due Date */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-8 bg-stone-50/80 p-3.5 rounded-xl border border-stone-100">
                    <div>
                      <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                        Outstanding Due
                      </div>
                      <div className="text-lg font-black text-red-600 mt-0.5">
                        {formatIndianCurrency(reminder.pendingAmount)}
                      </div>
                      <div className="text-[10px] text-stone-500 mt-0.5">
                        Paid: {formatIndianCurrency(reminder.paidAmount)} / Total: {formatIndianCurrency(reminder.totalAmount)}
                      </div>
                    </div>

                    <div className="w-32 hidden sm:block">
                      <div className="flex justify-between text-[10px] font-bold text-stone-600 mb-1">
                        <span>Settled</span>
                        <span>{percentPaid}%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-stone-200 overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            percentPaid === 100
                              ? 'bg-emerald-600'
                              : percentPaid > 0
                              ? 'bg-blue-600'
                              : 'bg-amber-500'
                          }`}
                          style={{ width: `${percentPaid}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
                        Due Date
                      </div>
                      <div className={`text-xs font-bold mt-0.5 flex items-center gap-1 ${isPastDue ? 'text-red-700' : 'text-stone-800'}`}>
                        <Calendar className="w-3.5 h-3.5 text-stone-400" />
                        <span>
                          {reminder.dueDate
                            ? new Date(reminder.dueDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Immediate'}
                        </span>
                      </div>
                      {reminder.remindersCount > 0 && (
                        <div className="text-[10px] text-emerald-800 font-semibold mt-0.5">
                          Sent {reminder.remindersCount} {reminder.remindersCount === 1 ? 'time' : 'times'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Send Actions & Management */}
                  <div className="flex items-center gap-2 flex-wrap self-end lg:self-center relative">
                    {/* Primary Button: Send Reminder Dropdown Menu */}
                    <div className="relative">
                      <button
                        onClick={() => setOpenSendMenuId(openSendMenuId === reminder.id ? null : reminder.id)}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer hover:scale-101"
                      >
                        <Send className="w-3.5 h-3.5 text-amber-300" />
                        <span>Send Reminder</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>

                      {/* Dropdown Menu with all dispatch channels */}
                      {openSendMenuId === reminder.id && (
                        <div
                          className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-2xl border border-stone-200 z-30 p-2 space-y-1 animate-in fade-in zoom-in-95"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-2 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                            Email Channels:
                          </div>

                          <button
                            onClick={() => handleSendGmailSync(reminder)}
                            className="w-full px-2.5 py-1.5 rounded-lg hover:bg-stone-50 text-left text-xs font-medium text-stone-800 flex items-center gap-2 cursor-pointer"
                          >
                            <Mail className="w-4 h-4 text-red-600" />
                            <div>
                              <p className="font-bold">1-Click Gmail Web</p>
                              <p className="text-[10px] text-stone-500">Opens Gmail with CC &amp; doc links</p>
                            </div>
                          </button>

                          <button
                            onClick={() => handleSendEmailSync(reminder)}
                            className="w-full px-2.5 py-1.5 rounded-lg hover:bg-stone-50 text-left text-xs font-medium text-stone-800 flex items-center gap-2 cursor-pointer"
                          >
                            <Mail className="w-4 h-4 text-blue-600" />
                            <div>
                              <p className="font-bold">Default Mail Client</p>
                              <p className="text-[10px] text-stone-500">Outlook / Apple Mail (mailto:)</p>
                            </div>
                          </button>

                          <button
                            onClick={() => handleSendServerEmailDispatch(reminder)}
                            disabled={isDispatchingServerEmail === reminder.id}
                            className="w-full px-2.5 py-1.5 rounded-lg hover:bg-stone-50 text-left text-xs font-medium text-stone-800 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <Send className="w-4 h-4 text-stone-700" />
                            <div>
                              <p className="font-bold">
                                {isDispatchingServerEmail === reminder.id ? 'Sending...' : 'Direct Server Email'}
                              </p>
                              <p className="text-[10px] text-stone-500">Dispatches via server with attachments</p>
                            </div>
                          </button>

                          <div className="px-2 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider border-t border-stone-100 mt-1">
                            WhatsApp Channels:
                          </div>

                          {reminder.contactMobile ? (
                            <button
                              onClick={() => handleSendWhatsAppSync(reminder)}
                              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-emerald-50 text-left text-xs font-medium text-emerald-900 flex items-center gap-2 cursor-pointer"
                            >
                              <MessageSquare className="w-4 h-4 text-emerald-600" />
                              <div>
                                <p className="font-bold">WhatsApp Web / App</p>
                                <p className="text-[10px] text-stone-500">Pre-filled formatted template</p>
                              </div>
                            </button>
                          ) : (
                            <div className="px-2.5 py-1 text-[11px] text-stone-400 italic">
                              No WhatsApp number saved
                            </div>
                          )}

                          <div className="border-t border-stone-100 mt-1 pt-1">
                            <button
                              onClick={() => {
                                handleCopyDraft(reminder);
                                setOpenSendMenuId(null);
                              }}
                              className="w-full px-2.5 py-1.5 rounded-lg hover:bg-stone-50 text-left text-xs font-medium text-stone-700 flex items-center gap-2 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-stone-500" />
                              <span>Copy Full Draft</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Record Payment Button */}
                    <button
                      onClick={() => setReminderForPaymentRecord(reminder)}
                      className="px-3 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Record payment received"
                    >
                      <Banknote className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Record Payment</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEditModal(reminder)}
                      className="p-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-600 cursor-pointer transition-colors"
                      title="Edit Reminder, Amounts, or Documents"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    {currentUser.role === 'admin' && (
                      <button
                        onClick={() => {
                          if (confirm(`Delete payment reminder for #${reminder.invoiceNumber}?`)) {
                            deletePaymentReminder(reminder.id);
                          }
                        }}
                        className="p-2 rounded-xl border border-stone-200 hover:bg-red-50 text-stone-400 hover:text-red-600 cursor-pointer transition-colors"
                        title="Delete Reminder"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Expand Draft Toggle */}
                    <button
                      onClick={() => setExpandedDraftId(isExpanded ? null : reminder.id)}
                      className="p-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-500 cursor-pointer"
                      title="View Saved Email Draft & Bank Details"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* ATTACHED DOCUMENTS STRIP ON EVERY CARD (Direct User Request) */}
                <div className="px-5 py-2.5 bg-stone-50 border-t border-stone-100 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-stone-700 flex items-center gap-1 text-[11px]">
                      <Paperclip className="w-3.5 h-3.5 text-emerald-700" />
                      <span>Documents &amp; Bills ({docList.length}):</span>
                    </span>

                    {docList.length === 0 ? (
                      <span className="text-stone-400 text-[11px] italic">No document attached yet</span>
                    ) : (
                      docList.map((doc) => (
                        <div
                          key={doc.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-stone-800 text-[11px] shadow-2xs font-medium"
                        >
                          {doc.fileType === 'pdf' ? (
                            <span className="text-red-600 font-bold text-[10px]">PDF</span>
                          ) : doc.fileType === 'image' ? (
                            <ImageIcon className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <FileText className="w-3 h-3 text-blue-600" />
                          )}
                          <span className="truncate max-w-[140px]">{doc.name}</span>

                          {doc.dataUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewDocument(doc)}
                              className="p-0.5 rounded text-stone-400 hover:text-stone-800 cursor-pointer ml-1"
                              title="Preview"
                            >
                              <Eye className="w-3 h-3" />
                            </button>
                          )}
                          {doc.dataUrl && (
                            <button
                              type="button"
                              onClick={() => handleDownloadDoc(doc)}
                              className="p-0.5 rounded text-stone-400 hover:text-emerald-700 cursor-pointer"
                              title="Download"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteCardDoc(reminder.id, doc.id)}
                            className="p-0.5 rounded text-stone-300 hover:text-red-600 cursor-pointer"
                            title="Remove Document"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerQuickDocUpload(reminder.id)}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 font-bold text-[11px] flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="w-3 h-3 text-emerald-600" />
                    <span>Attach Document</span>
                  </button>
                </div>

                {/* Expandable Section: Email Draft & Bank Details Preview */}
                {isExpanded && (
                  <div className="bg-stone-50/90 border-t border-stone-200 p-5 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-emerald-700" />
                        <span className="text-xs font-bold text-stone-900">
                          Pre-configured Email Draft (मेल का सेव किया हुआ ड्राफ्ट)
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyDraft(reminder)}
                          className="px-2.5 py-1 rounded-lg border border-stone-200 bg-white hover:bg-stone-100 text-stone-700 text-xs font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <Copy className="w-3 h-3 text-stone-500" />
                          <span>{copiedDraftId === reminder.id ? 'Copied!' : 'Copy Draft'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenEditModal(reminder)}
                          className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <Edit2 className="w-3 h-3 text-emerald-700" />
                          <span>Customize Draft &amp; Docs</span>
                        </button>
                      </div>
                    </div>

                    {/* Subject line preview */}
                    <div className="text-xs bg-white p-2.5 rounded-lg border border-stone-200">
                      <strong className="text-stone-500">Subject:</strong>{' '}
                      <span className="font-semibold text-stone-900">{reminder.emailSubject}</span>
                    </div>

                    {/* Email body preview */}
                    <div className="bg-white p-3.5 rounded-xl border border-stone-200 font-mono text-xs text-stone-800 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                      {reminder.emailDraft}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Payment Reminder Modal */}
      <CreatePaymentReminderModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setReminderToEdit(null);
        }}
        reminderToEdit={reminderToEdit}
      />

      {/* Record Payment Received Modal */}
      <RecordPaymentModal
        isOpen={!!reminderForPaymentRecord}
        onClose={() => setReminderForPaymentRecord(null)}
        reminder={reminderForPaymentRecord}
      />

      {/* Document Preview Lightbox Modal */}
      {previewDocument && (
        <div className="fixed inset-0 z-60 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-4 shadow-2xl flex flex-col max-h-[85vh]">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="truncate pr-2">
                <h3 className="font-bold text-stone-900 text-sm truncate">{previewDocument.name}</h3>
                <p className="text-[10px] text-stone-500">{previewDocument.size}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDownloadDoc(previewDocument)}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  onClick={() => setPreviewDocument(null)}
                  className="p-1 rounded-lg text-stone-400 hover:text-stone-800 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto py-4 flex items-center justify-center">
              {previewDocument.fileType === 'image' && previewDocument.dataUrl ? (
                <img
                  src={previewDocument.dataUrl}
                  alt={previewDocument.name}
                  className="max-h-[60vh] max-w-full rounded-lg object-contain shadow-sm"
                />
              ) : previewDocument.fileType === 'pdf' && previewDocument.dataUrl ? (
                <iframe
                  src={previewDocument.dataUrl}
                  title={previewDocument.name}
                  className="w-full h-[60vh] rounded-lg border border-stone-200"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-stone-300 mx-auto mb-2" />
                  <p className="text-stone-700 font-bold text-sm">{previewDocument.name}</p>
                  <p className="text-stone-400 text-xs mt-1">
                    Preview not directly supported in-line. Please click Download to view.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
