import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AlertCircle,
  Banknote,
  Building2,
  Calendar,
  Check,
  CheckCheck,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  Eye,
  FileCheck,
  FileText,
  FileUp,
  HelpCircle,
  Image as ImageIcon,
  Mail,
  MessageSquare,
  Paperclip,
  Phone,
  Plus,
  RotateCcw,
  Save,
  Send,
  Sparkles,
  Trash2,
  Upload,
  User,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, Job, PaymentDocumentAttachment, ClientPaymentReminder } from '../../types';
import {
  formatIndianCurrency,
  generateClientPaymentWhatsAppUrl,
  generateGmailComposeUrl,
  generateMailtoUrl,
  generatePaymentEmail,
  generatePaymentWhatsAppMessage,
} from '../../utils/paymentReminderEngine';

export const ClientPaymentReminderModal: React.FC = () => {
  const {
    isPaymentReminderOpen,
    setIsPaymentReminderOpen,
    activeCustomerForPaymentReminder,
    activeJobForPaymentReminder,
    editingPaymentReminder,
    setEditingPaymentReminder,
    paymentReminders,
    addPaymentReminder,
    updatePaymentReminder,
    customers,
    jobs,
    companySettings,
    currentUser,
    sendWhatsAppMessage,
    sendPaymentReminderEmail,
  } = useApp();

  // Saved reminder reference if editing or already saved
  const [savedReminderId, setSavedReminderId] = useState<string | null>(null);

  // Selected entities
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  // Editable fields
  const [customerName, setCustomerName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [clientCcEmails, setClientCcEmails] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState<number>(25000);
  const [paidAmount, setPaidAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [tone, setTone] = useState<'gentle' | 'due_today' | 'urgent'>('gentle');
  const [language, setLanguage] = useState<'en' | 'hinglish' | 'hi'>('hinglish');
  const [customNote, setCustomNote] = useState('');

  // Attached Documents System
  const [documents, setDocuments] = useState<PaymentDocumentAttachment[]>([]);
  const [previewDocument, setPreviewDocument] = useState<PaymentDocumentAttachment | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Channel Tabs: WhatsApp, Email, or Documents
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'email' | 'documents'>('whatsapp');

  // Feedback states
  const [isCopied, setIsCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [sentSuccessMsg, setSentSuccessMsg] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const pendingAmount = Math.max(0, Number(amount || 0) - Number(paidAmount || 0));

  // Sync state when modal opens or active targets change
  useEffect(() => {
    if (!isPaymentReminderOpen) {
      setSentSuccessMsg(null);
      setSaveSuccessMsg(null);
      return;
    }

    // A. If an existing reminder was passed for editing
    if (editingPaymentReminder) {
      setSavedReminderId(editingPaymentReminder.id);
      setSelectedCustomerId(editingPaymentReminder.customerId || '');
      setCustomerName(editingPaymentReminder.customerName || '');
      setContactPerson(editingPaymentReminder.contactPerson || '');
      setContactMobile(editingPaymentReminder.contactMobile || '');
      setContactEmail(editingPaymentReminder.contactEmail || '');
      setClientCcEmails(editingPaymentReminder.clientCcEmails || '');
      setSelectedJobId(editingPaymentReminder.jobId || '');
      setInvoiceNumber(editingPaymentReminder.invoiceNumber || '');
      setAmount(editingPaymentReminder.totalAmount || 0);
      setPaidAmount(editingPaymentReminder.paidAmount || 0);
      setDueDate(editingPaymentReminder.dueDate || '');
      setCustomNote(editingPaymentReminder.notes || '');
      setDocuments(Array.isArray(editingPaymentReminder.documents) ? editingPaymentReminder.documents : []);
      return;
    }

    // B. Check if there is an existing saved reminder for the target job or customer
    let matchedReminder: ClientPaymentReminder | undefined;
    if (activeJobForPaymentReminder) {
      matchedReminder = paymentReminders.find((r) => r.jobId === activeJobForPaymentReminder.id);
    } else if (activeCustomerForPaymentReminder) {
      matchedReminder = paymentReminders.find((r) => r.customerId === activeCustomerForPaymentReminder.id);
    }

    if (matchedReminder) {
      setSavedReminderId(matchedReminder.id);
      setSelectedCustomerId(matchedReminder.customerId || '');
      setCustomerName(matchedReminder.customerName || '');
      setContactPerson(matchedReminder.contactPerson || '');
      setContactMobile(matchedReminder.contactMobile || '');
      setContactEmail(matchedReminder.contactEmail || '');
      setClientCcEmails(matchedReminder.clientCcEmails || '');
      setSelectedJobId(matchedReminder.jobId || '');
      setInvoiceNumber(matchedReminder.invoiceNumber || '');
      setAmount(matchedReminder.totalAmount || 0);
      setPaidAmount(matchedReminder.paidAmount || 0);
      setDueDate(matchedReminder.dueDate || '');
      setCustomNote(matchedReminder.notes || '');
      setDocuments(Array.isArray(matchedReminder.documents) ? matchedReminder.documents : []);
      return;
    }

    // C. Brand new reminder creation / prefill
    setSavedReminderId(null);
    setDocuments([]);

    let targetCustomer = activeCustomerForPaymentReminder;
    if (!targetCustomer && activeJobForPaymentReminder) {
      targetCustomer = customers.find((c) => c.id === activeJobForPaymentReminder.customerId) || null;
    }
    if (!targetCustomer && customers.length > 0) {
      targetCustomer = customers[0];
    }

    if (targetCustomer) {
      setSelectedCustomerId(targetCustomer.id);
      setCustomerName(targetCustomer.companyName || '');
      setContactPerson(targetCustomer.contactPerson || '');
      setContactMobile(targetCustomer.whatsapp || targetCustomer.mobile || '');
      setContactEmail(targetCustomer.email || '');
      setClientCcEmails('');
    }

    if (activeJobForPaymentReminder) {
      setSelectedJobId(activeJobForPaymentReminder.id);
      setInvoiceNumber(
        activeJobForPaymentReminder.jobId
          ? `INV-${activeJobForPaymentReminder.jobId.replace('JR-', '')}`
          : `INV-${Date.now().toString().slice(-4)}`
      );
      if (activeJobForPaymentReminder.dueDate) {
        setDueDate(activeJobForPaymentReminder.dueDate);
      }
      if (activeJobForPaymentReminder.title.toLowerCase().includes('payment')) {
        setAmount(35000);
      }
    } else if (targetCustomer) {
      const customerJobs = jobs.filter((j) => j.customerId === targetCustomer.id);
      if (customerJobs.length > 0) {
        setSelectedJobId(customerJobs[0].id);
        setInvoiceNumber(`INV-${customerJobs[0].jobId.replace('JR-', '')}`);
      } else {
        setSelectedJobId('');
        setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
      }
    }
  }, [isPaymentReminderOpen, activeCustomerForPaymentReminder, activeJobForPaymentReminder, editingPaymentReminder, customers, jobs, paymentReminders]);

  // When customer dropdown changes, auto-fill all corresponding details
  const handleCustomerChange = (custId: string) => {
    setSelectedCustomerId(custId);
    const cust = customers.find((c) => c.id === custId);
    if (!cust) return;

    setCustomerName(cust.companyName || '');
    setContactPerson(cust.contactPerson || '');
    setContactMobile(cust.whatsapp || cust.mobile || '');
    setContactEmail(cust.email || '');

    // Check for customer's jobs
    const custJobs = jobs.filter((j) => j.customerId === cust.id);
    if (custJobs.length > 0) {
      setSelectedJobId(custJobs[0].id);
      setInvoiceNumber(`INV-${custJobs[0].jobId.replace('JR-', '')}`);
    } else {
      setSelectedJobId('');
      setInvoiceNumber(`INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`);
    }
  };

  // When job dropdown changes, auto-fill job info & reference
  const handleJobChange = (jobId: string) => {
    setSelectedJobId(jobId);
    if (!jobId) return;
    const j = jobs.find((x) => x.id === jobId);
    if (j) {
      setInvoiceNumber(`INV-${j.jobId.replace('JR-', '')}`);
      if (j.dueDate) setDueDate(j.dueDate);
      if (j.contactPerson) setContactPerson(j.contactPerson);
      if (j.contactNumber) setContactMobile(j.contactNumber);
    }
  };

  // Current active customer object
  const currentCustomer = useMemo(() => {
    const found = customers.find((c) => c.id === selectedCustomerId);
    if (found) return found;
    return {
      id: selectedCustomerId || 'cust_custom',
      companyName: customerName || 'Valued Client',
      contactPerson: contactPerson || 'Manager',
      mobile: contactMobile || '+91 98999 11111',
      whatsapp: contactMobile || '+91 98999 11111',
      email: contactEmail || 'client@example.com',
      address: 'Delhi NCR',
      city: 'Delhi',
      state: 'Delhi',
      customerType: 'Commercial',
      sites: [],
      createdAt: '',
    };
  }, [customers, selectedCustomerId, customerName, contactPerson, contactMobile, contactEmail]);

  // Current active job object
  const currentJob = useMemo(() => {
    return jobs.find((j) => j.id === selectedJobId);
  }, [jobs, selectedJobId]);

  // Context for template generation
  const reminderContext = useMemo(() => {
    return {
      customer: currentCustomer,
      job: currentJob,
      contactPerson,
      contactMobile,
      contactEmail,
      clientCcEmails,
      invoiceNumber: invoiceNumber || 'INV-2026-0101',
      amount: pendingAmount,
      dueDate,
      tone,
      language,
      companySettings,
      customNote,
      documents,
    };
  }, [
    currentCustomer,
    currentJob,
    contactPerson,
    contactMobile,
    contactEmail,
    clientCcEmails,
    invoiceNumber,
    pendingAmount,
    dueDate,
    tone,
    language,
    companySettings,
    customNote,
    documents,
  ]);

  // Generated WhatsApp & Email Content
  const whatsappMessage = useMemo(() => {
    return generatePaymentWhatsAppMessage(reminderContext);
  }, [reminderContext]);

  const emailData = useMemo(() => {
    return generatePaymentEmail(reminderContext);
  }, [reminderContext]);

  const whatsappWebUrl = useMemo(() => {
    return generateClientPaymentWhatsAppUrl(contactMobile, whatsappMessage);
  }, [contactMobile, whatsappMessage]);

  const gmailWebUrl = useMemo(() => {
    return generateGmailComposeUrl(emailData.recipientEmail, emailData.subject, emailData.body, clientCcEmails);
  }, [emailData, clientCcEmails]);

  const mailtoUrl = useMemo(() => {
    return generateMailtoUrl(emailData.recipientEmail, emailData.subject, emailData.body, clientCcEmails);
  }, [emailData, clientCcEmails]);

  // Copy handler
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Process files from input or dropzone
  const processFiles = (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    fileList.forEach((file: File) => {
      if (file.size > 25 * 1024 * 1024) {
        alert(`File "${file.name}" exceeds 25MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (!dataUrl) return;

        const extension = file.name.split('.').pop()?.toLowerCase() || '';
        let fileType: PaymentDocumentAttachment['fileType'] = 'other';
        if (['pdf'].includes(extension)) fileType = 'pdf';
        else if (['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'bmp'].includes(extension)) fileType = 'image';
        else if (['doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'csv'].includes(extension)) fileType = 'document';

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

        setDocuments((prev) => {
          const filtered = prev.filter((d) => d.name !== newDoc.name);
          const nextDocs = [...filtered, newDoc];
          if (savedReminderId) {
            updatePaymentReminder(savedReminderId, { documents: nextDocs });
          }
          return nextDocs;
        });

        setSaveSuccessMsg(`Attached document: "${file.name}" (दस्तावेज़ जुड़ गया). Click "Save Reminder" to store permanently.`);
        setTimeout(() => setSaveSuccessMsg(null), 5000);
      };

      reader.onerror = () => {
        alert(`Failed to read file "${file.name}". Please try another file.`);
      };

      reader.readAsDataURL(file);
    });
  };

  // Robust File Upload Handler (works on desktop, mobile & iframes)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (fileList && fileList.length > 0) {
      const filesArray = Array.from(fileList);
      processFiles(filesArray);
    }
    // Delay clearing value so browser read is not interrupted
    setTimeout(() => {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 400);
  };

  // Attach a ready-made sample invoice with 1 click
  const handleAttachSampleInvoice = () => {
    const invNo = invoiceNumber.trim() || 'INV-2026-0101';
    const cName = customerName.trim() || 'Valued Client';
    const dateStr = dueDate || new Date().toISOString().split('T')[0];
    const dueAmt = pendingAmount || amount || 25000;
    
    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" width="700" height="900" viewBox="0 0 700 900">
      <rect width="700" height="900" fill="#ffffff"/>
      <rect x="0" y="0" width="700" height="12" fill="#059669"/>
      <rect x="35" y="35" width="630" height="80" rx="10" fill="#f0fdf4" stroke="#bbf7d0" stroke-width="1.5"/>
      <text x="55" y="70" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="#065f46">${companySettings.companyName || 'SERVICE &amp; MAINTENANCE PRO'}</text>
      <text x="55" y="95" font-family="Arial, sans-serif" font-size="12" fill="#047857">Official Tax Invoice • Payment Due Summary</text>
      <text x="470" y="70" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#1f2937">INVOICE: #${invNo}</text>
      <text x="470" y="95" font-family="Arial, sans-serif" font-size="12" fill="#4b5563">Date: ${dateStr}</text>
      <rect x="35" y="135" width="630" height="80" rx="8" fill="#f9fafb" stroke="#e5e7eb"/>
      <text x="55" y="165" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#6b7280">BILLED TO:</text>
      <text x="55" y="190" font-family="Arial, sans-serif" font-size="14" font-weight="bold" fill="#111827">${cName}</text>
      <text x="380" y="165" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#6b7280">CONTACT:</text>
      <text x="380" y="190" font-family="Arial, sans-serif" font-size="12" fill="#374151">${contactPerson || 'Accounts Dept'} • ${contactMobile || 'N/A'}</text>
      <rect x="35" y="235" width="630" height="35" fill="#059669"/>
      <text x="55" y="258" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff">DESCRIPTION / SERVICE DETAILS</text>
      <text x="520" y="258" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#ffffff">AMOUNT (INR)</text>
      <rect x="35" y="270" width="630" height="50" fill="#ffffff" stroke="#e5e7eb"/>
      <text x="55" y="300" font-family="Arial, sans-serif" font-size="12" fill="#1f2937">Commercial Job &amp; Service Maintenance Charges (${invNo})</text>
      <text x="520" y="300" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#111827">₹${amount.toLocaleString('en-IN')}</text>
      <rect x="35" y="340" width="630" height="110" rx="8" fill="#f0fdf4" stroke="#86efac"/>
      <text x="55" y="370" font-family="Arial, sans-serif" font-size="13" font-weight="bold" fill="#065f46">PAYMENT SUMMARY</text>
      <text x="55" y="400" font-family="Arial, sans-serif" font-size="12" fill="#374151">Total Bill: ₹${amount.toLocaleString('en-IN')}  |  Paid: ₹${paidAmount.toLocaleString('en-IN')}</text>
      <text x="55" y="430" font-family="Arial, sans-serif" font-size="15" font-weight="bold" fill="#dc2626">BALANCE DUE: ₹${dueAmt.toLocaleString('en-IN')}</text>
      <text x="440" y="430" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#047857">Due Date: ${dateStr}</text>
      <rect x="35" y="470" width="630" height="100" rx="8" fill="#f8fafc" stroke="#e2e8f0"/>
      <text x="55" y="500" font-family="Arial, sans-serif" font-size="12" font-weight="bold" fill="#1e293b">BANK REMITTANCE DETAILS:</text>
      <text x="55" y="525" font-family="Arial, sans-serif" font-size="12" fill="#334155">Bank: ${companySettings.bankName || 'HDFC Bank'}  |  A/C: ${companySettings.bankAccountNumber || '50200012345678'}</text>
      <text x="55" y="550" font-family="Arial, sans-serif" font-size="12" fill="#334155">IFSC: ${companySettings.bankIfsc || 'HDFC0001234'}  |  UPI: ${companySettings.upiId || 'company@upi'}</text>
      <text x="350" y="860" font-family="Arial, sans-serif" font-size="11" fill="#9ca3af" text-anchor="middle">This is a computer generated invoice document. For queries, contact ${companySettings.phone || ''}.</text>
    </svg>`;

    const dataUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgContent)}`;
    const sampleDoc: PaymentDocumentAttachment = {
      id: `doc_sample_${Date.now()}`,
      name: `${invNo}_Invoice_Copy.svg`,
      fileType: 'document',
      dataUrl,
      size: '12 KB',
      uploadedAt: new Date().toISOString(),
    };

    setDocuments((prev) => {
      const filtered = prev.filter((d) => d.name !== sampleDoc.name);
      const nextDocs = [...filtered, sampleDoc];
      if (savedReminderId) {
        updatePaymentReminder(savedReminderId, { documents: nextDocs });
      }
      return nextDocs;
    });

    setSaveSuccessMsg(`Attached sample invoice document: "${sampleDoc.name}". Click "Save Reminder" to store.`);
    setTimeout(() => setSaveSuccessMsg(null), 5000);
  };

  // Remove document
  const handleRemoveDocument = (docId: string) => {
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  // Import photos / files from linked job if available
  const handleImportJobDocuments = () => {
    if (!currentJob) return;
    const addedDocs: PaymentDocumentAttachment[] = [];

    if (Array.isArray(currentJob.photos) && currentJob.photos.length > 0) {
      currentJob.photos.forEach((photoUrl: string, idx: number) => {
        addedDocs.push({
          id: `doc_job_${currentJob.id}_photo_${idx}_${Date.now()}`,
          name: `Job_${currentJob.jobId}_Photo_${idx + 1}.jpg`,
          fileType: 'image',
          dataUrl: photoUrl,
          size: 'Job Attached Photo',
          uploadedAt: new Date().toISOString(),
        });
      });
    }

    if (addedDocs.length > 0) {
      setDocuments((prev) => [...prev, ...addedDocs]);
      setSaveSuccessMsg(`Imported ${addedDocs.length} job attachment(s)! Click "Save Reminder" to store.`);
    } else {
      setSaveSuccessMsg('No photos or documents attached to the selected job.');
    }
  };

  // Download document
  const handleDownloadDoc = (doc: PaymentDocumentAttachment) => {
    if (!doc.dataUrl) return;
    const a = document.createElement('a');
    a.href = doc.dataUrl;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Core Save Logic: Saves all details and documents to state, storage & server
  const handleSaveReminder = (options?: { silent?: boolean }): string => {
    if (!customerName.trim()) {
      alert('Please enter or select a customer name');
      return '';
    }
    if (!invoiceNumber.trim()) {
      alert('Please enter an invoice number');
      return '';
    }
    if (!contactEmail.trim() && !contactMobile.trim()) {
      alert('Please enter at least an email address or WhatsApp mobile number');
      return '';
    }

    setIsSaving(true);

    const status =
      pendingAmount <= 0
        ? 'paid'
        : paidAmount > 0
        ? 'partially_paid'
        : new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0))
        ? 'overdue'
        : 'pending';

    const reminderPayload = {
      customerId: selectedCustomerId || `cust_manual_${Date.now()}`,
      customerName: customerName.trim(),
      contactPerson: contactPerson.trim(),
      contactMobile: contactMobile.trim(),
      contactEmail: contactEmail.trim(),
      clientCcEmails: clientCcEmails.trim(),
      jobId: selectedJobId || undefined,
      jobTitle: currentJob?.title || undefined,
      invoiceNumber: invoiceNumber.trim(),
      totalAmount: Number(amount),
      paidAmount: Number(paidAmount || 0),
      pendingAmount,
      dueDate,
      status,
      emailSubject: emailData.subject,
      emailDraft: emailData.body,
      whatsappDraft: whatsappMessage,
      documents,
      notes: customNote.trim() || undefined,
      remindersCount: 0,
    };

    let targetId = savedReminderId;

    if (savedReminderId) {
      updatePaymentReminder(savedReminderId, reminderPayload);
    } else {
      // Check if an existing reminder with this invoice exists
      const existing = paymentReminders.find((r) => r.invoiceNumber === invoiceNumber.trim());
      if (existing) {
        updatePaymentReminder(existing.id, reminderPayload);
        targetId = existing.id;
        setSavedReminderId(existing.id);
      } else {
        targetId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        addPaymentReminder({
          ...reminderPayload,
        });
        setSavedReminderId(targetId);
      }
    }

    setIsSaving(false);

    if (!options?.silent) {
      setSaveSuccessMsg(
        `✅ Client Payment Reminder #${invoiceNumber} for ${customerName} saved successfully (${documents.length} document(s) attached)! You can send anytime via Email or WhatsApp.`
      );
      setTimeout(() => setSaveSuccessMsg(null), 6000);
    }

    return targetId || '';
  };

  // Direct WhatsApp Cloud API Send
  const handleSendViaWhatsAppApi = async () => {
    if (!contactMobile) {
      alert('Please enter a WhatsApp number');
      return;
    }

    // Auto-save first
    const remId = handleSaveReminder({ silent: true });

    setIsSending(true);
    try {
      await sendWhatsAppMessage(
        contactMobile,
        whatsappMessage,
        currentJob?.id || 'payment_reminder',
        currentCustomer.id,
        'CLIENT_PAYMENT_REMINDER'
      );

      if (remId) {
        updatePaymentReminder(remId, {
          remindersCount: ((paymentReminders.find((r) => r.id === remId)?.remindersCount || 0) + 1),
          lastReminderSentAt: new Date().toISOString(),
          lastReminderChannel: 'whatsapp',
        });
      }

      setSentSuccessMsg(`WhatsApp Payment Reminder successfully sent to ${customerName} (${contactMobile})!`);
      setTimeout(() => setSentSuccessMsg(null), 5000);
    } catch (err: any) {
      setSentSuccessMsg('Error sending WhatsApp: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  // Direct Email Send API
  const handleSendViaEmailApi = async () => {
    if (!contactEmail) {
      alert('Please enter a recipient email address');
      return;
    }

    // Auto-save first
    const remId = handleSaveReminder({ silent: true });

    setIsSending(true);
    try {
      const res = await sendPaymentReminderEmail({
        toEmail: contactEmail,
        ccEmail: clientCcEmails,
        subject: emailData.subject,
        body: emailData.body,
        customerName: customerName || currentCustomer.companyName,
        invoiceNumber,
        amount: pendingAmount,
        jobId: currentJob?.id,
        customerId: currentCustomer.id,
        reminderId: remId || undefined,
        documents,
      });

      if (remId) {
        updatePaymentReminder(remId, {
          remindersCount: ((paymentReminders.find((r) => r.id === remId)?.remindersCount || 0) + 1),
          lastReminderSentAt: new Date().toISOString(),
          lastReminderChannel: 'email',
        });
      }

      setSentSuccessMsg(res.message || `Payment Reminder email dispatched to ${contactEmail}!`);
      setTimeout(() => setSentSuccessMsg(null), 5000);
    } catch (err: any) {
      setSentSuccessMsg('Error sending email: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  // 1-Click Gmail Send: Auto-saves and opens Gmail compose
  const handleSendViaGmail = () => {
    handleSaveReminder({ silent: true });
    window.open(gmailWebUrl, '_blank', 'noopener,noreferrer');
    setSentSuccessMsg(`Opened Gmail Web Compose for ${customerName} with documents list & draft pre-filled!`);
    setTimeout(() => setSentSuccessMsg(null), 4500);
  };

  // 1-Click WhatsApp Web Send: Auto-saves and opens WhatsApp
  const handleSendViaWhatsAppWeb = () => {
    handleSaveReminder({ silent: true });
    window.open(whatsappWebUrl, '_blank', 'noopener,noreferrer');
    setSentSuccessMsg(`Opened WhatsApp Web for ${customerName} (${contactMobile}) with pre-filled reminder!`);
    setTimeout(() => setSentSuccessMsg(null), 4500);
  };

  if (!isPaymentReminderOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-inner">
              <CreditCard className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                  Client Payment Reminder (क्लाइंट पेमेंट रिमाइंडर)
                </h2>
                {savedReminderId ? (
                  <span className="bg-emerald-400/25 border border-emerald-300/40 text-emerald-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                    Saved in Ledger
                  </span>
                ) : (
                  <span className="bg-amber-400/25 border border-amber-300/40 text-amber-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                    Auto-Fill Ready
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Save client details &amp; documents once. Send payment reminders anytime via WhatsApp or Email without re-typing.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setIsPaymentReminderOpen(false);
              setEditingPaymentReminder(null);
            }}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert Banners */}
        {saveSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-xs text-emerald-900 flex items-center justify-between shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button
              onClick={() => setSaveSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {sentSuccessMsg && (
          <div className="bg-teal-50 border-b border-teal-200 px-5 py-2.5 text-xs text-teal-900 flex items-center justify-between shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2 font-semibold">
              <Sparkles className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{sentSuccessMsg}</span>
            </div>
            <button
              onClick={() => setSentSuccessMsg(null)}
              className="text-teal-700 hover:text-teal-900 text-xs font-bold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Body: Split Screen Form & Live Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
          {/* Left Column: Form & Document Upload (6 Cols) */}
          <div className="lg:col-span-6 p-4 sm:p-5 space-y-4 overflow-y-auto">
            {/* Customer Selection & Client Name */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                  Select Client / Customer (ग्राहक चुनें):
                </span>
                <span className="text-[10px] text-stone-400 font-normal">Auto-fills contact info</span>
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleCustomerChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 font-semibold text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    🏢 {c.companyName} ({c.contactPerson} • {c.city})
                  </option>
                ))}
              </select>
            </div>

            {/* Editable Company / Client Name */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Client / Company Name (बिलिंग नाम):
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Apex Health Systems Pvt Ltd"
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            {/* Associated Job / Service Order */}
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-teal-600" />
                  Associated Job / Work Order (जॉब/कार्य):
                </span>
                <span className="text-[10px] text-stone-400 font-normal">Optional</span>
              </label>
              <select
                value={selectedJobId}
                onChange={(e) => handleJobChange(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              >
                <option value="">-- None (General Outstanding Bill / Retainer) --</option>
                {jobs
                  .filter((j) => !selectedCustomerId || j.customerId === selectedCustomerId)
                  .map((j) => (
                    <option key={j.id} value={j.id}>
                      📋 {j.jobId}: {j.title} ({j.status.toUpperCase()})
                    </option>
                  ))}
              </select>
            </div>

            {/* Contact Person & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <User className="w-3 h-3 text-stone-500" />
                  Contact Person:
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Dr. Vivek Malhotra"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  WhatsApp Number:
                </label>
                <input
                  type="text"
                  value={contactMobile}
                  onChange={(e) => setContactMobile(e.target.value)}
                  placeholder="+91 98999 11111"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Email Address & CC Emails */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-blue-600" />
                  Client Email Address:
                </label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="client@company.com"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-purple-600" />
                    CC Emails (Optional):
                  </span>
                  <span className="text-[10px] text-stone-400 font-normal">Comma-separated</span>
                </label>
                <input
                  type="text"
                  value={clientCcEmails}
                  onChange={(e) => setClientCcEmails(e.target.value)}
                  placeholder="accounts@client.com, gm@client.com"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Invoice Number, Total Amount & Paid Amount */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-stone-50 p-3 rounded-xl border border-stone-200">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-amber-600" />
                  Invoice / Bill No:
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-2026-0101"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Banknote className="w-3 h-3 text-emerald-600" />
                    Total Bill (₹):
                  </span>
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="0"
                  step="500"
                  placeholder="25000"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-blue-600" />
                    Paid So Far (₹):
                  </span>
                </label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  min="0"
                  step="500"
                  placeholder="0"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-bold text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Outstanding Balance & Due Date Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
              <div className="flex flex-col justify-center">
                <span className="text-[11px] font-bold text-emerald-900">
                  Pending Balance to Collect:
                </span>
                <span className="text-base font-extrabold text-emerald-800 font-mono">
                  {formatIndianCurrency(pendingAmount)}
                </span>
                <span className="text-[10px] text-emerald-700">
                  {pendingAmount <= 0
                    ? 'Fully Paid'
                    : paidAmount > 0
                    ? `Partially Paid (${formatIndianCurrency(paidAmount)} paid)`
                    : 'Full payment pending'}
                </span>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-purple-600" />
                  Payment Due Date:
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Dedicated Hidden File Input triggered programmatically by ref */}
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="application/pdf,image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,*/*"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              tabIndex={-1}
            />

            {/* DOCUMENT ATTACHMENT SECTION (Core User Request) */}
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-stone-800">
                    Attached Documents &amp; Bills (दस्तावेज़ और इनवॉइस कॉपी):
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {documents.length} File{documents.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {currentJob && (
                    <button
                      type="button"
                      onClick={handleImportJobDocuments}
                      className="px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                      title="Attach completion photos and files from this job"
                    >
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      <span>Attach Job Docs</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleAttachSampleInvoice}
                    className="px-2 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                    title="Generate a sample bill copy"
                  >
                    <Sparkles className="w-3 h-3 text-teal-600" />
                    <span>Attach Sample Bill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-2xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Upload Document / Bill</span>
                  </button>
                </div>
              </div>

              {/* Document List & Dropzone */}
              {documents.length === 0 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDragging(false);
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      processFiles(e.dataTransfer.files);
                    }
                  }}
                  className={`block border-2 border-dashed ${
                    isDragging ? 'border-emerald-600 bg-emerald-50' : 'border-stone-300 hover:border-emerald-500 bg-white'
                  } rounded-xl p-4 text-center cursor-pointer transition-colors relative`}
                  role="button"
                  tabIndex={0}
                >
                  <Upload className="w-6 h-6 text-emerald-600 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-stone-800">
                    Click here to attach Invoice PDF, Bill, Work Order, or Photo
                  </p>
                  <p className="text-[10px] text-stone-500 mt-0.5">
                    Supports PDF, JPG, PNG, DOCX, XLSX (up to 25MB). Documents stay saved with this reminder.
                  </p>
                  <div className="mt-2.5 flex items-center justify-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 px-3 py-1 rounded-lg border border-emerald-300 transition-colors">
                      <Plus className="w-3 h-3 text-emerald-700" />
                      Browse Files from Device
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAttachSampleInvoice();
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1 rounded-lg border border-teal-200 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      Attach Sample Bill
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-stone-200 text-xs shadow-2xs group hover:border-emerald-300 transition-colors"
                    >
                      <div className="flex items-center gap-2 truncate mr-2">
                        {doc.fileType === 'pdf' ? (
                          <div className="w-6 h-6 rounded bg-red-100 text-red-700 flex items-center justify-center font-bold text-[10px] shrink-0">
                            PDF
                          </div>
                        ) : doc.fileType === 'image' ? (
                          <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                            <ImageIcon className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className="truncate">
                          <p className="font-semibold text-stone-900 truncate text-[11px]">{doc.name}</p>
                          <p className="text-[10px] text-stone-400">{doc.size || 'Attached file'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {doc.dataUrl && (
                          <button
                            type="button"
                            onClick={() => setPreviewDocument(doc)}
                            className="p-1 rounded text-stone-500 hover:text-stone-900 hover:bg-stone-100 cursor-pointer"
                            title="Preview Document"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {doc.dataUrl && (
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc(doc)}
                            className="p-1 rounded text-stone-500 hover:text-emerald-700 hover:bg-stone-100 cursor-pointer"
                            title="Download Document"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveDocument(doc.id)}
                          className="p-1 rounded text-stone-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                          title="Remove Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-1 py-1.5 px-2.5 rounded-lg border border-dashed border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-800 text-[11px] font-bold text-center cursor-pointer transition-colors flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-emerald-700" />
                      <span>+ Add Another File / Receipt</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleAttachSampleInvoice}
                      className="py-1.5 px-2.5 rounded-lg border border-teal-200 bg-teal-50 hover:bg-teal-100 text-teal-800 text-[11px] font-bold text-center cursor-pointer transition-colors flex items-center justify-center gap-1"
                      title="Attach sample invoice"
                    >
                      <Sparkles className="w-3 h-3 text-teal-600" />
                      <span>Sample Bill</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Reminder Tone & Language */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Reminder Urgency / Tone:
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setTone('gentle')}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                      tone === 'gentle'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 shadow-2xs'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    🌱 Gentle
                  </button>
                  <button
                    type="button"
                    onClick={() => setTone('due_today')}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                      tone === 'due_today'
                        ? 'bg-amber-50 border-amber-500 text-amber-900 shadow-2xs'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    ⏰ Due Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setTone('urgent')}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                      tone === 'urgent'
                        ? 'bg-red-50 border-red-500 text-red-900 shadow-2xs'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    🚨 Overdue
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1">
                  Message Language:
                </label>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => setLanguage('hinglish')}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                      language === 'hinglish'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    Hinglish
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                      language === 'en'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    English
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('hi')}
                    className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer text-center ${
                      language === 'hi'
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                        : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                    }`}
                  >
                    हिन्दी
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Notes / Instructions */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Special Instructions / Remarks (Optional):
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Please deduct 2% TDS and email deduction certificate."
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            {/* PRIMARY SAVE ACTION BUTTON (Directly fixes User Issue 1) */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleSaveReminder()}
                disabled={isSaving}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
              >
                <Save className="w-4 h-4 text-amber-300" />
                <span>
                  {savedReminderId
                    ? 'Save Updated Client Details & Documents (अपडेट सेव करें)'
                    : 'Save Client Payment Reminder (डिटेल्स और डाक्यूमेंट्स सेव करें)'}
                </span>
              </button>
              <p className="text-[11px] text-stone-500 text-center mt-1.5">
                Saving will store this client reminder and all attached documents permanently so you can send anytime.
              </p>
            </div>
          </div>

          {/* Right Column: Live Real-Time Preview & Action Dispatches (6 Cols) */}
          <div className="lg:col-span-6 p-4 sm:p-5 bg-stone-50 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Channel Selector Toggle */}
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center bg-stone-200/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveChannel('whatsapp')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeChannel === 'whatsapp'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveChannel('email')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeChannel === 'email'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email Draft</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveChannel('documents')}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeChannel === 'documents'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-stone-700 hover:text-stone-900'
                    }`}
                  >
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>Docs ({documents.length})</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    handleCopy(activeChannel === 'whatsapp' ? whatsappMessage : emailData.body)
                  }
                  className="flex items-center gap-1 text-xs text-stone-600 hover:text-stone-900 bg-white border border-stone-200 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer shadow-2xs"
                  title="Copy full message to clipboard"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              {/* WHATSAPP TAB PREVIEW */}
              {activeChannel === 'whatsapp' && (
                <div className="space-y-3">
                  {/* Recipient badge */}
                  <div className="flex items-center justify-between text-[11px] text-stone-500 bg-emerald-50/50 border border-emerald-200/60 px-3 py-1.5 rounded-lg">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Recipient: <strong>{contactPerson || currentCustomer.contactPerson}</strong> (
                      {contactMobile || 'No WhatsApp'})
                    </span>
                    <span className="font-mono text-emerald-800 font-bold">wa.me ready</span>
                  </div>

                  {/* WhatsApp Bubble Preview */}
                  <div className="bg-[#EFEAE2] p-3 sm:p-4 rounded-xl border border-stone-300/80 shadow-inner font-sans text-xs">
                    <div className="bg-white rounded-xl rounded-tl-xs p-3.5 shadow-sm border border-stone-200/80 space-y-2 whitespace-pre-wrap leading-relaxed text-stone-800 max-h-72 overflow-y-auto">
                      {whatsappMessage}
                      <div className="text-[10px] text-stone-400 text-right flex items-center justify-end gap-1 pt-1">
                        <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* EMAIL TAB PREVIEW */}
              {activeChannel === 'email' && (
                <div className="space-y-3">
                  {/* Recipient & Subject Header */}
                  <div className="bg-white p-3 rounded-xl border border-stone-200 space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400 font-bold w-14">To:</span>
                      <span className="font-medium text-stone-900 bg-stone-100 px-2 py-0.5 rounded font-mono text-[11px] truncate">
                        {emailData.recipientEmail || 'No Email configured for client'}
                      </span>
                    </div>
                    {clientCcEmails && (
                      <div className="flex items-center gap-2">
                        <span className="text-stone-400 font-bold w-14">CC:</span>
                        <span className="font-medium text-stone-700 bg-stone-50 px-2 py-0.5 rounded font-mono text-[11px] truncate">
                          {clientCcEmails}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400 font-bold w-14">Subject:</span>
                      <span className="font-bold text-stone-900 truncate">{emailData.subject}</span>
                    </div>
                    {documents.length > 0 && (
                      <div className="flex items-center gap-2 text-emerald-800 bg-emerald-50 px-2 py-1 rounded text-[11px]">
                        <Paperclip className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="font-medium truncate">
                          {documents.length} document(s) attached: {documents.map((d) => d.name).join(', ')}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Email Body Preview */}
                  <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 font-mono text-[11px] leading-relaxed text-stone-800 whitespace-pre-wrap max-h-72 overflow-y-auto shadow-inner">
                    {emailData.body}
                  </div>
                </div>
              )}

              {/* DOCUMENTS TAB PREVIEW */}
              {activeChannel === 'documents' && (
                <div className="space-y-3">
                  <div className="bg-white p-3.5 rounded-xl border border-stone-200 text-xs space-y-2">
                    <h3 className="font-bold text-stone-900 flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-purple-600" />
                      <span>Attached Documents Overview ({documents.length})</span>
                    </h3>
                    <p className="text-[11px] text-stone-500">
                      These files are saved with this payment reminder and attached to email notifications and WhatsApp logs.
                    </p>

                    {documents.length === 0 ? (
                      <p className="text-xs text-stone-400 italic py-4 text-center">
                        No documents attached yet. Click "Upload Document / Bill" on the left to add.
                      </p>
                    ) : (
                      <div className="space-y-2 pt-1">
                        {documents.map((doc, idx) => (
                          <div
                            key={doc.id}
                            className="p-2.5 rounded-lg border border-stone-200 bg-stone-50 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="text-[10px] font-bold text-stone-400">#{idx + 1}</span>
                              <div className="truncate">
                                <p className="font-bold text-stone-800 truncate text-xs">{doc.name}</p>
                                <p className="text-[10px] text-stone-500">
                                  {doc.size} • {new Date(doc.uploadedAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              {doc.dataUrl && (
                                <button
                                  type="button"
                                  onClick={() => setPreviewDocument(doc)}
                                  className="px-2 py-1 rounded bg-white hover:bg-stone-100 border border-stone-200 text-stone-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Eye className="w-3 h-3" />
                                  <span>View</span>
                                </button>
                              )}
                              {doc.dataUrl && (
                                <button
                                  type="button"
                                  onClick={() => handleDownloadDoc(doc)}
                                  className="px-2 py-1 rounded bg-white hover:bg-stone-100 border border-stone-200 text-emerald-700 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
                                >
                                  <Download className="w-3 h-3" />
                                  <span>Download</span>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SEND REMINDER ACTIONS SECTION (Directly addresses User Issue 2: "aur jab chahe tab send reminder pe click kar ke mail ya whasapp pe reminder send kar sake") */}
            <div className="pt-4 border-t border-stone-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Send Reminder Now (अभी रिमाइंडर भेजें):</span>
                </span>
                <span className="text-[10px] text-stone-500">Auto-saves before dispatch</span>
              </div>

              {activeChannel === 'whatsapp' ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* 1-Click WhatsApp Web / App dispatch */}
                    <button
                      type="button"
                      onClick={handleSendViaWhatsAppWeb}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-101 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Open WhatsApp Web</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </button>

                    {/* Send via WhatsApp Business Cloud API */}
                    <button
                      type="button"
                      onClick={handleSendViaWhatsAppApi}
                      disabled={isSending || !contactMobile}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSending ? 'Sending API...' : 'Send Cloud API'}</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-stone-500 text-center">
                    Click <strong>Open WhatsApp Web</strong> to send directly from WhatsApp, or <strong>Send Cloud API</strong> to dispatch via Meta API.
                  </p>
                </div>
              ) : activeChannel === 'email' ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* 1-Click Open in Gmail Web */}
                    <button
                      type="button"
                      onClick={handleSendViaGmail}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-101 cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Open in Gmail (1-Click)</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </button>

                    {/* Open default mail client (mailto:) */}
                    <a
                      href={mailtoUrl}
                      onClick={() => handleSaveReminder({ silent: true })}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Open Mail App (Default)</span>
                    </a>
                  </div>

                  {/* Send / Record Server Email Queue */}
                  <button
                    type="button"
                    onClick={handleSendViaEmailApi}
                    disabled={isSending || !contactEmail}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-black text-white font-bold text-xs shadow-sm transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{isSending ? 'Queueing Email...' : 'Send Server Email with Attachments'}</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveChannel('whatsapp')}
                    className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Send via WhatsApp</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveChannel('email')}
                    className="py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Send via Email</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between shrink-0 text-xs flex-wrap gap-2">
          <div className="text-stone-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              Client: <strong>{customerName || currentCustomer.companyName}</strong> (
              {contactPerson || 'Authorized Contact'}) • Due: <strong>{dueDate}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleSaveReminder()}
              disabled={isSaving}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer transition-colors shadow-2xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5 text-amber-300" />
              <span>Save Reminder</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsPaymentReminderOpen(false);
                setEditingPaymentReminder(null);
              }}
              className="px-4 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-bold cursor-pointer transition-colors shadow-2xs"
            >
              Close
            </button>
          </div>
        </div>
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
