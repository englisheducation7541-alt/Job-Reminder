import React, { useMemo, useState } from 'react';
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
  Mail,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Sparkles,
  Trash2,
  TrendingDown,
  TrendingUp,
  User,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClientPaymentReminder, PaymentReminderStatus } from '../../types';
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
    syncAndSendEmailReminder,
    sendWhatsAppReminderAction,
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

  // Copied feedback
  const [copiedDraftId, setCopiedDraftId] = useState<string | null>(null);
  const [sentToastMsg, setSentToastMsg] = useState<string | null>(null);

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
    setSentToastMsg(`Opened Web Gmail compose for ${rem.customerName} with CC & draft!`);
    setTimeout(() => setSentToastMsg(null), 4500);
  };

  const handleSendWhatsAppSync = (rem: ClientPaymentReminder) => {
    sendWhatsAppReminderAction(rem);
    setSentToastMsg(`WhatsApp chat opened for ${rem.customerName}!`);
    setTimeout(() => setSentToastMsg(null), 4500);
  };

  const handleCopyDraft = (rem: ClientPaymentReminder) => {
    const fullText = `Subject: ${rem.emailSubject}\n\nTo: ${rem.contactEmail}\nCC: ${rem.clientCcEmails || 'None'}\n\n${rem.emailDraft}`;
    navigator.clipboard.writeText(fullText);
    setCopiedDraftId(rem.id);
    setTimeout(() => setCopiedDraftId(null), 2500);
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

      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Client Payment Reminders &amp; Ledger
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              Auto Mail Sync + CC
            </span>
          </div>
          <p className="text-xs sm:text-sm text-stone-500 mt-1 max-w-2xl leading-relaxed">
            Configure invoices once with recipient &amp; CC emails. When you click <strong>Send Reminder</strong>, all details and drafts sync directly into your mail app without re-typing.
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
        {/* Total Outstanding */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Total Outstanding
            </span>
            <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-red-600 mt-2">
            {formatIndianCurrency(metrics.totalOutstanding)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1 flex items-center gap-1.5">
            <span>Across <strong>{metrics.clientsWithDuesCount}</strong> active clients</span>
          </div>
        </div>

        {/* Total Received / Collected */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Total Collected
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-2">
            {formatIndianCurrency(metrics.totalReceived)}
          </div>
          <div className="text-[11px] text-emerald-700 font-semibold mt-1">
            {metrics.collectionRate}% of total billed collected
          </div>
        </div>

        {/* Overdue Payments */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Past Due Date
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-800 mt-2">
            {formatIndianCurrency(metrics.overdueAmount)}
          </div>
          <div className="text-[11px] text-amber-700 font-semibold mt-1">
            {metrics.overdueCount} {metrics.overdueCount === 1 ? 'invoice overdue' : 'invoices overdue'}
          </div>
        </div>

        {/* Total Invoiced Volume */}
        <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Total Invoiced
            </span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <FileCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-stone-900 mt-2">
            {formatIndianCurrency(metrics.totalInvoiced)}
          </div>
          <div className="text-[11px] text-stone-500 mt-1">
            {paymentReminders.length} total tracked invoices
          </div>
        </div>
      </div>

      {/* Filter, Search & Status Tabs Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-xs space-y-3.5">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-semibold no-scrollbar">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              statusFilter === 'all'
                ? 'bg-stone-900 text-white font-bold shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            All Reminders ({paymentReminders.length})
          </button>

          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white font-bold shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Pending Dues ({paymentReminders.filter((r) => r.status === 'pending').length})
          </button>

          <button
            onClick={() => setStatusFilter('overdue')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              statusFilter === 'overdue'
                ? 'bg-red-600 text-white font-bold shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Overdue ({paymentReminders.filter((r) => r.status === 'overdue' || (r.dueDate < todayStr && r.pendingAmount > 0)).length})
          </button>

          <button
            onClick={() => setStatusFilter('partially_paid')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              statusFilter === 'partially_paid'
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Partially Paid ({paymentReminders.filter((r) => r.status === 'partially_paid').length})
          </button>

          <button
            onClick={() => setStatusFilter('paid')}
            className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer shrink-0 ${
              statusFilter === 'paid'
                ? 'bg-emerald-600 text-white font-bold shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Fully Settled ({paymentReminders.filter((r) => r.status === 'paid' || r.pendingAmount === 0).length})
          </button>
        </div>

        {/* Search & Sort Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-stone-100">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by client name, invoice number, contact person, email or CC..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-stone-500 font-medium">Sort:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="due_date_asc">📅 Due Date (Earliest First)</option>
              <option value="due_date_desc">📅 Due Date (Latest First)</option>
              <option value="amount_desc">💰 Outstanding Balance (High to Low)</option>
              <option value="amount_asc">💰 Outstanding Balance (Low to High)</option>
              <option value="client_name">🏢 Client Name (A - Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reminders List (Job-like Section View) */}
      {filteredReminders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-8 sm:p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
            <CreditCard className="w-7 h-7" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-base font-bold text-stone-900">No Payment Reminders Found</h3>
            <p className="text-xs text-stone-500 mt-1 leading-relaxed">
              {searchTerm || statusFilter !== 'all'
                ? 'No payment reminders match your active search or filter criteria. Try resetting filters.'
                : 'You have not created any client payment reminders yet. Click the button below to configure your first reminder with auto-draft and CC sync.'}
            </p>
          </div>
          <div>
            <button
              onClick={handleOpenCreateModal}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs cursor-pointer transition-all hover:scale-101"
            >
              <Plus className="w-4 h-4" />
              <span>Create Client Payment Reminder</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReminders.map((reminder) => {
            const isExpanded = expandedDraftId === reminder.id;
            const percentPaid =
              reminder.totalAmount > 0
                ? Math.min(100, Math.round(((reminder.paidAmount || 0) / reminder.totalAmount) * 100))
                : 0;

            const isPastDue = reminder.dueDate && reminder.dueDate < todayStr && reminder.pendingAmount > 0;

            return (
              <div
                key={reminder.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:border-emerald-300/80 transition-all"
              >
                {/* Main Card Header & Row */}
                <div className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Column: Client & Invoice Info */}
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-800 shrink-0 mt-0.5">
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

                  {/* Right Column: 1-Click Action Buttons */}
                  <div className="flex items-center gap-2 flex-wrap self-end lg:self-center">
                    {/* Primary Button: Send Email (Direct Mail App Sync with CC) */}
                    <button
                      onClick={() => handleSendEmailSync(reminder)}
                      className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer hover:scale-101"
                      title="Sync directly into Mail App with CC & full draft"
                    >
                      <Mail className="w-4 h-4 text-amber-300" />
                      <span>Send Email Reminder</span>
                    </button>

                    {/* Secondary Email Option: Gmail Web */}
                    <button
                      onClick={() => handleSendGmailSync(reminder)}
                      className="p-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 cursor-pointer transition-colors"
                      title="Open in Gmail Web with CC & Draft"
                    >
                      <ExternalLink className="w-4 h-4 text-stone-600" />
                    </button>

                    {/* WhatsApp Action */}
                    {reminder.contactMobile && (
                      <button
                        onClick={() => handleSendWhatsAppSync(reminder)}
                        className="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                        title="Send via WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </button>
                    )}

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
                      title="Edit Reminder & Draft"
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
                          <span>Customize Draft</span>
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
    </div>
  );
};
