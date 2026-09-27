import React, { useState, useEffect } from 'react';
import {
  Building2,
  Calendar,
  Check,
  CreditCard,
  FileText,
  HelpCircle,
  Mail,
  MessageSquare,
  Phone,
  RotateCcw,
  Sparkles,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClientPaymentReminder } from '../../types';
import {
  formatIndianCurrency,
  generateDefaultPaymentEmailDraft,
  generateDefaultPaymentSubject,
  generateDefaultWhatsAppDraft,
} from '../../utils/paymentSyncEngine';

interface CreatePaymentReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  reminderToEdit?: ClientPaymentReminder | null;
}

export const CreatePaymentReminderModal: React.FC<CreatePaymentReminderModalProps> = ({
  isOpen,
  onClose,
  reminderToEdit,
}) => {
  const {
    customers,
    jobs,
    companySettings,
    addPaymentReminder,
    updatePaymentReminder,
    activeCustomerForPaymentReminder,
    activeJobForPaymentReminder,
  } = useApp();

  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [clientCcEmails, setClientCcEmails] = useState('');

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [totalAmount, setTotalAmount] = useState<number>(25000);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });

  const [emailSubject, setEmailSubject] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [whatsappDraft, setWhatsappDraft] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'email_draft' | 'whatsapp_draft'>('details');

  const pendingAmount = Math.max(0, Number(totalAmount || 0) - Number(paidAmount || 0));

  // Initialize or reset form
  useEffect(() => {
    if (!isOpen) return;

    if (reminderToEdit) {
      setSelectedCustomerId(reminderToEdit.customerId || '');
      setCustomerName(reminderToEdit.customerName || '');
      setContactPerson(reminderToEdit.contactPerson || '');
      setContactMobile(reminderToEdit.contactMobile || '');
      setContactEmail(reminderToEdit.contactEmail || '');
      setClientCcEmails(reminderToEdit.clientCcEmails || '');
      setInvoiceNumber(reminderToEdit.invoiceNumber || '');
      setSelectedJobId(reminderToEdit.jobId || '');
      setTotalAmount(reminderToEdit.totalAmount || 0);
      setPaidAmount(reminderToEdit.paidAmount || 0);
      setDueDate(reminderToEdit.dueDate || '');
      setEmailSubject(reminderToEdit.emailSubject || '');
      setEmailDraft(reminderToEdit.emailDraft || '');
      setWhatsappDraft(reminderToEdit.whatsappDraft || '');
      return;
    }

    // New reminder creation
    let targetCustomer = activeCustomerForPaymentReminder;
    if (!targetCustomer && activeJobForPaymentReminder) {
      targetCustomer = customers.find((c) => c.id === activeJobForPaymentReminder.customerId) || null;
    }
    if (!targetCustomer && customers.length > 0) {
      targetCustomer = customers[0];
    }

    const defaultInv = activeJobForPaymentReminder
      ? `INV-${activeJobForPaymentReminder.jobId.replace('JR-', '')}`
      : `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const cName = targetCustomer?.companyName || '';
    const cPerson = targetCustomer?.contactPerson || '';
    const cPhone = targetCustomer?.whatsapp || targetCustomer?.mobile || '';
    const cEmail = targetCustomer?.email || '';
    const cCc = ''; // Can be filled by user and saved

    const initTotal = 25000;
    const initPaid = 0;
    const initPending = initTotal - initPaid;

    setSelectedCustomerId(targetCustomer?.id || '');
    setCustomerName(cName);
    setContactPerson(cPerson);
    setContactMobile(cPhone);
    setContactEmail(cEmail);
    setClientCcEmails(cCc);
    setInvoiceNumber(defaultInv);
    setSelectedJobId(activeJobForPaymentReminder?.id || '');
    setTotalAmount(initTotal);
    setPaidAmount(initPaid);

    const defaultDue = new Date();
    defaultDue.setDate(defaultDue.getDate() + 7);
    const dueStr = defaultDue.toISOString().split('T')[0];
    setDueDate(dueStr);

    // Auto-generate drafts
    const subj = generateDefaultPaymentSubject(defaultInv, cName, companySettings.companyName);
    const draft = generateDefaultPaymentEmailDraft({
      customerName: cName,
      contactPerson: cPerson,
      invoiceNumber: defaultInv,
      totalAmount: initTotal,
      paidAmount: initPaid,
      pendingAmount: initPending,
      dueDate: dueStr,
      jobTitle: activeJobForPaymentReminder?.title,
      companySettings,
    });
    const wa = generateDefaultWhatsAppDraft({
      customerName: cName,
      contactPerson: cPerson,
      invoiceNumber: defaultInv,
      pendingAmount: initPending,
      dueDate: dueStr,
      companySettings,
    });

    setEmailSubject(subj);
    setEmailDraft(draft);
    setWhatsappDraft(wa);
  }, [isOpen, reminderToEdit, activeCustomerForPaymentReminder, activeJobForPaymentReminder, customers, companySettings]);

  // Handle customer dropdown change
  const handleCustomerSelect = (custId: string) => {
    setSelectedCustomerId(custId);
    const cust = customers.find((c) => c.id === custId);
    if (!cust) return;

    const newCustName = cust.companyName;
    const newPerson = cust.contactPerson || '';
    const newMobile = cust.whatsapp || cust.mobile || '';
    const newEmail = cust.email || '';

    setCustomerName(newCustName);
    setContactPerson(newPerson);
    setContactMobile(newMobile);
    setContactEmail(newEmail);

    // Check customer jobs
    const custJobs = jobs.filter((j) => j.customerId === cust.id);
    const linkedJob = custJobs[0];
    const newInv = linkedJob
      ? `INV-${linkedJob.jobId.replace('JR-', '')}`
      : `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    setInvoiceNumber(newInv);
    if (linkedJob) setSelectedJobId(linkedJob.id);

    // Regenerate drafts with new client details
    const subj = generateDefaultPaymentSubject(newInv, newCustName, companySettings.companyName);
    const draft = generateDefaultPaymentEmailDraft({
      customerName: newCustName,
      contactPerson: newPerson,
      invoiceNumber: newInv,
      totalAmount,
      paidAmount,
      pendingAmount: Math.max(0, totalAmount - paidAmount),
      dueDate,
      jobTitle: linkedJob?.title,
      companySettings,
    });
    const wa = generateDefaultWhatsAppDraft({
      customerName: newCustName,
      contactPerson: newPerson,
      invoiceNumber: newInv,
      pendingAmount: Math.max(0, totalAmount - paidAmount),
      dueDate,
      companySettings,
    });

    setEmailSubject(subj);
    setEmailDraft(draft);
    setWhatsappDraft(wa);
  };

  const handleRegenerateDrafts = () => {
    const linkedJob = jobs.find((j) => j.id === selectedJobId);
    const subj = generateDefaultPaymentSubject(invoiceNumber, customerName, companySettings.companyName);
    const draft = generateDefaultPaymentEmailDraft({
      customerName,
      contactPerson,
      invoiceNumber,
      totalAmount,
      paidAmount,
      pendingAmount,
      dueDate,
      jobTitle: linkedJob?.title,
      companySettings,
    });
    const wa = generateDefaultWhatsAppDraft({
      customerName,
      contactPerson,
      invoiceNumber,
      pendingAmount,
      dueDate,
      companySettings,
    });

    setEmailSubject(subj);
    setEmailDraft(draft);
    setWhatsappDraft(wa);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('Please enter or select a customer name');
      return;
    }
    if (!invoiceNumber.trim()) {
      alert('Please enter an invoice number');
      return;
    }
    if (!contactEmail.trim() && !contactMobile.trim()) {
      alert('Please enter at least an email address or mobile number');
      return;
    }

    const linkedJob = jobs.find((j) => j.id === selectedJobId);
    const status =
      pendingAmount <= 0
        ? 'paid'
        : paidAmount > 0
        ? 'partially_paid'
        : new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
        ? 'overdue'
        : 'pending';

    if (reminderToEdit) {
      updatePaymentReminder(reminderToEdit.id, {
        customerId: selectedCustomerId,
        customerName: customerName.trim(),
        contactPerson: contactPerson.trim(),
        contactMobile: contactMobile.trim(),
        contactEmail: contactEmail.trim(),
        clientCcEmails: clientCcEmails.trim(),
        jobId: selectedJobId || undefined,
        jobTitle: linkedJob?.title || undefined,
        invoiceNumber: invoiceNumber.trim(),
        totalAmount: Number(totalAmount),
        paidAmount: Number(paidAmount),
        pendingAmount,
        dueDate,
        status,
        emailSubject: emailSubject.trim(),
        emailDraft: emailDraft.trim(),
        whatsappDraft: whatsappDraft.trim(),
      });
    } else {
      addPaymentReminder({
        customerId: selectedCustomerId || `cust_manual_${Date.now()}`,
        customerName: customerName.trim(),
        contactPerson: contactPerson.trim(),
        contactMobile: contactMobile.trim(),
        contactEmail: contactEmail.trim(),
        clientCcEmails: clientCcEmails.trim(),
        jobId: selectedJobId || undefined,
        jobTitle: linkedJob?.title || undefined,
        invoiceNumber: invoiceNumber.trim(),
        totalAmount: Number(totalAmount),
        paidAmount: Number(paidAmount),
        pendingAmount,
        dueDate,
        status,
        emailSubject: emailSubject.trim(),
        emailDraft: emailDraft.trim(),
        whatsappDraft: whatsappDraft.trim(),
        remindersCount: 0,
      });
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-850 via-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <CreditCard className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {reminderToEdit ? 'Edit Client Payment Reminder' : 'Create Client Payment Reminder'}
              </h2>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Pre-configure invoice dues, recipient &amp; CC emails, and saved email draft for 1-click dispatch.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-stone-200 bg-stone-50/70 px-5 pt-2 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'details'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>1. Client &amp; Invoice Info</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('email_draft')}
            className={`pb-2.5 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'email_draft'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-emerald-700" />
            <span>2. Email Draft &amp; CC Settings</span>
            <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
              Auto-Synced
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('whatsapp_draft')}
            className={`pb-2.5 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'whatsapp_draft'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
            <span>3. WhatsApp Draft</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Select Existing Customer or Custom */}
              <div>
                <label className="block text-xs font-bold text-stone-800 mb-1.5 flex items-center justify-between">
                  <span>Select Client / Customer</span>
                  <span className="text-[11px] font-normal text-stone-500">
                    Auto-fills contact person, phone, email &amp; CC
                  </span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="">-- Choose registered customer (or type custom below) --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      🏢 {c.companyName} ({c.city}) — Contact: {c.contactPerson}
                    </option>
                  ))}
                </select>
              </div>

              {/* Company Name & Contact Person */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Client Company Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Apex Health Systems"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Contact Person Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={contactPerson}
                      onChange={(e) => setContactPerson(e.target.value)}
                      placeholder="e.g. Dr. Rajesh Sharma"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Mobile and Primary Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    WhatsApp / Mobile Number
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="tel"
                      value={contactMobile}
                      onChange={(e) => setContactMobile(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Primary Email (To:) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="e.g. billing@apexhealth.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* CC Emails Field (One-time saved with reminder) */}
              <div className="p-3.5 bg-emerald-50/60 border border-emerald-200/80 rounded-xl space-y-1">
                <label className="block text-xs font-bold text-emerald-950 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Saved CC Emails (सीसी ईमेल पते)</span>
                  </span>
                  <span className="text-[10px] text-emerald-700 font-semibold">
                    1-Time Saved • Direct Sync to Mail App
                  </span>
                </label>
                <input
                  type="text"
                  value={clientCcEmails}
                  onChange={(e) => setClientCcEmails(e.target.value)}
                  placeholder="accounts@apexhealth.com, finance@apexhealth.com, director@apexhealth.com"
                  className="w-full px-3 py-2 rounded-lg border border-emerald-300 bg-white text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 font-medium"
                />
                <p className="text-[11px] text-emerald-800">
                  💡 <strong>सुविधा:</strong> ये ईमेल आईडी एक बार सेव होने के बाद जब भी आप "Send Reminder" पर क्लिक करेंगे, यह अपने आप आपके मेल ऐप / Gmail के <strong>CC</strong> फील्ड में सिंक हो जाएगी।
                </p>
              </div>

              {/* Invoice & Amounts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-stone-100">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Invoice / Ref Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      placeholder="e.g. INV-2026-0042"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Total Invoiced Amount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Paid Amount So Far (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  />
                </div>
              </div>

              {/* Outstanding Balance Banner & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Payment Due Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                {/* Linked Job / Service Work Order */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Linked Job / Work Order (Optional)
                  </label>
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white text-xs font-semibold text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="">-- None / General Maintenance Bill --</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.jobId} — {j.title} ({j.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Balance Summary Box */}
              <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider block">
                    Calculated Outstanding Balance
                  </span>
                  <div className="text-lg font-black text-emerald-800 mt-0.5">
                    {formatIndianCurrency(pendingAmount)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-stone-500 block">Status Preview</span>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      pendingAmount <= 0
                        ? 'bg-emerald-100 text-emerald-800'
                        : paidAmount > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {pendingAmount <= 0 ? 'Fully Paid' : paidAmount > 0 ? 'Partially Paid' : 'Payment Pending'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SAVED EMAIL DRAFT */}
          {activeTab === 'email_draft' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-stone-600">
                  This email subject and draft is saved with this reminder. You will <strong>never need to re-type it</strong>.
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateDrafts}
                  className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset with Bank Details</span>
                </button>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  required
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="e.g. Payment Reminder: Invoice #INV-2026-0042 for Apex Health Systems"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              {/* CC reminder info */}
              <div className="text-xs bg-stone-50 px-3 py-2 rounded-lg border border-stone-200 text-stone-700 flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                <span>
                  <strong>Recipient (To):</strong> {contactEmail || '(Not set yet)'} &bull;{' '}
                  <strong>CC:</strong> {clientCcEmails || '(No CC specified)'}
                </span>
              </div>

              {/* Email Body Draft */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Full Email Body Draft (मेल का स्थायी ड्राफ्ट)
                </label>
                <textarea
                  rows={13}
                  value={emailDraft}
                  onChange={(e) => setEmailDraft(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-200 font-mono text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 leading-relaxed resize-y"
                  placeholder="Enter the complete email draft including banking instructions..."
                />
              </div>
            </div>
          )}

          {/* TAB 3: WHATSAPP DRAFT */}
          {activeTab === 'whatsapp_draft' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-stone-600">
                  Pre-configured WhatsApp template with bold headings, invoice details, and bank account info.
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateDrafts}
                  className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset WhatsApp Draft</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  WhatsApp Message Draft
                </label>
                <textarea
                  rows={12}
                  value={whatsappDraft}
                  onChange={(e) => setWhatsappDraft(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-200 font-mono text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 leading-relaxed resize-y"
                />
              </div>
            </div>
          )}

          {/* Footer Buttons */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>

            <div className="flex items-center gap-2">
              {activeTab !== 'email_draft' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('email_draft')}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  Next: Review Email Draft &rarr;
                </button>
              )}

              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>{reminderToEdit ? 'Save Changes' : 'Save Payment Reminder'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
