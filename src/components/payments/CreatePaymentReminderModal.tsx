import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Calendar,
  Check,
  CreditCard,
  Download,
  Eye,
  FileText,
  HelpCircle,
  Image as ImageIcon,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClientPaymentReminder, PaymentDocumentAttachment } from '../../types';
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

  const [documents, setDocuments] = useState<PaymentDocumentAttachment[]>([]);
  const [previewDocument, setPreviewDocument] = useState<PaymentDocumentAttachment | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [emailSubject, setEmailSubject] = useState('');
  const [emailDraft, setEmailDraft] = useState('');
  const [whatsappDraft, setWhatsappDraft] = useState('');
  const [activeTab, setActiveTab] = useState<'details' | 'documents' | 'email_draft' | 'whatsapp_draft'>('details');

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
      setDocuments(Array.isArray(reminderToEdit.documents) ? reminderToEdit.documents : []);
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
    const cCc = '';

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
    setDocuments([]);

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
      documents: [],
    });
    const wa = generateDefaultWhatsAppDraft({
      customerName: cName,
      contactPerson: cPerson,
      invoiceNumber: defaultInv,
      pendingAmount: initPending,
      dueDate: dueStr,
      companySettings,
      documents: [],
    });

    setEmailSubject(subj);
    setEmailDraft(draft);
    setWhatsappDraft(wa);
  }, [isOpen, reminderToEdit, activeCustomerForPaymentReminder, activeJobForPaymentReminder, customers, companySettings]);

  // Handle file uploads
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

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

        setDocuments((prev) => [...prev, newDoc]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== id));
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

  // Import photos from linked job
  const handleImportJobDocuments = () => {
    const linkedJob = jobs.find((j) => j.id === selectedJobId);
    if (!linkedJob) return;
    const addedDocs: PaymentDocumentAttachment[] = [];

    if (Array.isArray(linkedJob.photos) && linkedJob.photos.length > 0) {
      linkedJob.photos.forEach((photoUrl: string, idx: number) => {
        addedDocs.push({
          id: `doc_job_${linkedJob.id}_photo_${idx}_${Date.now()}`,
          name: `Job_${linkedJob.jobId}_Photo_${idx + 1}.jpg`,
          fileType: 'image',
          dataUrl: photoUrl,
          size: 'Job Photo',
          uploadedAt: new Date().toISOString(),
        });
      });
    }

    if (addedDocs.length > 0) {
      setDocuments((prev) => [...prev, ...addedDocs]);
    }
  };

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
      documents,
    });
    const wa = generateDefaultWhatsAppDraft({
      customerName: newCustName,
      contactPerson: newPerson,
      invoiceNumber: newInv,
      pendingAmount: Math.max(0, totalAmount - paidAmount),
      dueDate,
      companySettings,
      documents,
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
      documents,
    });
    const wa = generateDefaultWhatsAppDraft({
      customerName,
      contactPerson,
      invoiceNumber,
      pendingAmount,
      dueDate,
      companySettings,
      documents,
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
        documents,
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
        documents,
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
                Pre-configure invoice dues, recipient &amp; CC emails, and attached documents for 1-click dispatch.
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
        <div className="flex items-center gap-2 border-b border-stone-200 bg-stone-50/70 px-5 pt-2 text-xs font-semibold flex-wrap">
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
            onClick={() => setActiveTab('documents')}
            className={`pb-2.5 px-2 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'border-emerald-600 text-emerald-800 font-bold'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Paperclip className="w-3.5 h-3.5 text-purple-600" />
            <span>2. Documents &amp; Bills ({documents.length})</span>
            {documents.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-800 text-[10px] font-bold">
                Attached
              </span>
            )}
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
            <span>3. Email Draft &amp; CC</span>
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
            <span>4. WhatsApp Draft</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* TAB 1: DETAILS */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Quick Customer Picker */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span>Quick Select from Customer Directory:</span>
                  <span className="text-[10px] text-stone-400 font-normal">Auto-fills email, phone &amp; CC</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => handleCustomerSelect(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-medium text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                >
                  <option value="">-- Choose Existing Client (or fill custom below) --</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      🏢 {c.companyName} ({c.contactPerson} &bull; {c.city})
                    </option>
                  ))}
                </select>
              </div>

              {/* Customer Name & Linked Job */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Client / Company Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Apex Health Systems Pvt Ltd"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Linked Job / Work Order (Optional)
                  </label>
                  <select
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  >
                    <option value="">-- No specific job (General Outstanding Balance) --</option>
                    {jobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        📋 {j.jobId}: {j.title} ({j.status})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Contact Person & Mobile */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                      placeholder="e.g. Dr. Vivek Malhotra"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Contact Mobile / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={contactMobile}
                      onChange={(e) => setContactMobile(e.target.value)}
                      placeholder="+91 98999 11111"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs font-mono text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>
              </div>

              {/* Email Address & CC Emails */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">
                    Primary Recipient Email <span className="text-stone-400 font-normal">(To)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="accounts@apexhealth.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                    <span>Client CC Emails (Auto-Synced to Mail)</span>
                    <span className="text-[10px] text-stone-400 font-normal">Comma-separated</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-purple-600 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={clientCcEmails}
                      onChange={(e) => setClientCcEmails(e.target.value)}
                      placeholder="finance@client.com, gm@client.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                    />
                  </div>
                </div>
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

              {/* Pending Amount & Due Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-emerald-50/70 p-4 rounded-xl border border-emerald-200">
                <div className="flex flex-col justify-center">
                  <span className="text-xs font-bold text-emerald-950">Pending Due Balance:</span>
                  <span className="text-xl font-black text-emerald-800 font-mono tracking-tight">
                    {formatIndianCurrency(pendingAmount)}
                  </span>
                  <span className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                    {pendingAmount <= 0 ? 'Fully Paid' : paidAmount > 0 ? 'Partially Paid' : 'Payment Pending'}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-emerald-950 mb-1">
                    Payment Due Date <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-emerald-700 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="date"
                      required
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-emerald-300 bg-white text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DOCUMENTS & ATTACHMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-xs font-bold text-stone-800">
                    Attached Invoices, Bills, &amp; Work Proofs ({documents.length})
                  </h3>
                  <p className="text-[11px] text-stone-500">
                    Documents saved here will be stored in the ledger and referenced in your email &amp; WhatsApp reminders.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {selectedJobId && (
                    <button
                      type="button"
                      onClick={handleImportJobDocuments}
                      className="px-2.5 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      <span>Attach Job Docs</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Document</span>
                  </button>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />

              {documents.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-stone-300 hover:border-emerald-500 rounded-xl p-8 text-center cursor-pointer bg-stone-50 transition-colors"
                >
                  <Upload className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                  <p className="text-xs font-bold text-stone-700">
                    Click to attach Invoices, Signed Work Orders, or Payment Receipts
                  </p>
                  <p className="text-[11px] text-stone-400 mt-1">
                    Supports PDF, Images, Word documents, Spreadsheets up to 15MB.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between bg-stone-50 px-3.5 py-2.5 rounded-xl border border-stone-200 text-xs group hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 truncate mr-2">
                        {doc.fileType === 'pdf' ? (
                          <div className="w-7 h-7 rounded bg-red-100 text-red-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                            PDF
                          </div>
                        ) : doc.fileType === 'image' ? (
                          <div className="w-7 h-7 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-7 h-7 rounded bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-bold text-stone-900 truncate">{doc.name}</p>
                          <p className="text-[10px] text-stone-500">{doc.size || 'Attached'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {doc.dataUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewDocument(doc)}
                            className="p-1.5 rounded-lg text-stone-600 hover:bg-white hover:text-stone-900 border border-transparent hover:border-stone-200 cursor-pointer"
                            title="Preview Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {doc.dataUrl && (
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc(doc)}
                            className="p-1.5 rounded-lg text-stone-600 hover:bg-white hover:text-emerald-700 border border-transparent hover:border-stone-200 cursor-pointer"
                            title="Download"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(doc.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:bg-white hover:text-red-600 border border-transparent hover:border-red-100 cursor-pointer"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EMAIL DRAFT */}
          {activeTab === 'email_draft' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs text-stone-600">
                  This email is synced to your mail app whenever you click <strong>Send Reminder</strong>.
                </div>
                <button
                  type="button"
                  onClick={handleRegenerateDrafts}
                  className="px-2.5 py-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Regenerate with Current Info</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  Email Subject Line
                </label>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
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
                  Full Email Body Draft
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

          {/* TAB 4: WHATSAPP DRAFT */}
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

      {/* Embedded Document Preview Modal */}
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
