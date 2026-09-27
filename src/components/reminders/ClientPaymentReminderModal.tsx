import React, { useState, useEffect, useMemo } from 'react';
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
  ExternalLink,
  FileText,
  HelpCircle,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  User,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Customer, Job } from '../../types';
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
    customers,
    jobs,
    companySettings,
    currentUser,
    sendWhatsAppMessage,
    sendPaymentReminderEmail,
  } = useApp();

  // Selected entities
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedJobId, setSelectedJobId] = useState<string>('');

  // Editable fields (all auto-filled by default)
  const [contactPerson, setContactPerson] = useState('');
  const [contactMobile, setContactMobile] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [amount, setAmount] = useState<number>(25000);
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [tone, setTone] = useState<'gentle' | 'due_today' | 'urgent'>('gentle');
  const [language, setLanguage] = useState<'en' | 'hinglish' | 'hi'>('hinglish');
  const [customNote, setCustomNote] = useState('');

  // Channel Tabs: WhatsApp or Email
  const [activeChannel, setActiveChannel] = useState<'whatsapp' | 'email'>('whatsapp');

  // Copy & Sending Feedback states
  const [isCopied, setIsCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccessMsg, setSentSuccessMsg] = useState<string | null>(null);

  // Sync state when modal opens or active targets change
  useEffect(() => {
    if (!isPaymentReminderOpen) {
      setSentSuccessMsg(null);
      return;
    }

    // 1. Determine Customer
    let targetCustomer = activeCustomerForPaymentReminder;
    if (!targetCustomer && activeJobForPaymentReminder) {
      targetCustomer = customers.find((c) => c.id === activeJobForPaymentReminder.customerId) || null;
    }
    if (!targetCustomer && customers.length > 0) {
      targetCustomer = customers[0];
    }

    if (targetCustomer) {
      setSelectedCustomerId(targetCustomer.id);
      setContactPerson(targetCustomer.contactPerson || '');
      setContactMobile(targetCustomer.whatsapp || targetCustomer.mobile || '');
      setContactEmail(targetCustomer.email || '');
    }

    // 2. Determine Job
    if (activeJobForPaymentReminder) {
      setSelectedJobId(activeJobForPaymentReminder.id);
      setInvoiceNumber(
        activeJobForPaymentReminder.jobId
          ? `INV-${activeJobForPaymentReminder.jobId.replace('JR-', '')}`
          : `INV-${Date.now().toString().slice(-4)}`
      );
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
  }, [isPaymentReminderOpen, activeCustomerForPaymentReminder, activeJobForPaymentReminder, customers, jobs]);

  // When customer dropdown changes, auto-fill all corresponding details
  const handleCustomerChange = (custId: string) => {
    setSelectedCustomerId(custId);
    const cust = customers.find((c) => c.id === custId);
    if (!cust) return;

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
    return (
      customers.find((c) => c.id === selectedCustomerId) ||
      customers[0] || {
        id: 'cust_default',
        companyName: 'Valued Client',
        contactPerson: 'Manager',
        mobile: '+91 98999 11111',
        whatsapp: '+91 98999 11111',
        email: 'client@example.com',
        address: 'Delhi NCR',
        city: 'Delhi',
        state: 'Delhi',
        customerType: 'Commercial',
        sites: [],
        createdAt: '',
      }
    );
  }, [customers, selectedCustomerId]);

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
      invoiceNumber: invoiceNumber || 'INV-2026-0101',
      amount: Number(amount) || 0,
      dueDate,
      tone,
      language,
      companySettings,
      customNote,
    };
  }, [
    currentCustomer,
    currentJob,
    contactPerson,
    contactMobile,
    contactEmail,
    invoiceNumber,
    amount,
    dueDate,
    tone,
    language,
    companySettings,
    customNote,
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
    return generateGmailComposeUrl(emailData.recipientEmail, emailData.subject, emailData.body);
  }, [emailData]);

  const mailtoUrl = useMemo(() => {
    return generateMailtoUrl(emailData.recipientEmail, emailData.subject, emailData.body);
  }, [emailData]);

  // Copy handler
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Direct WhatsApp Cloud API Send
  const handleSendViaWhatsAppApi = async () => {
    if (!contactMobile) return;
    setIsSending(true);
    try {
      await sendWhatsAppMessage(
        contactMobile,
        whatsappMessage,
        currentJob?.id || 'payment_reminder',
        currentCustomer.id,
        'CLIENT_PAYMENT_REMINDER'
      );
      setSentSuccessMsg(`WhatsApp Payment Reminder successfully sent to ${currentCustomer.companyName} (${contactMobile})!`);
    } catch (err: any) {
      setSentSuccessMsg('Error sending message: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  // Direct Email Send & Log
  const handleSendViaEmailApi = async () => {
    if (!contactEmail) return;
    setIsSending(true);
    try {
      const res = await sendPaymentReminderEmail({
        toEmail: contactEmail,
        subject: emailData.subject,
        body: emailData.body,
        customerName: currentCustomer.companyName,
        invoiceNumber,
        amount: Number(amount) || 0,
        jobId: currentJob?.id,
        customerId: currentCustomer.id,
      });
      setSentSuccessMsg(res.message || `Payment Reminder email sent to ${contactEmail}!`);
    } catch (err: any) {
      setSentSuccessMsg('Error sending email: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSending(false);
    }
  };

  if (!isPaymentReminderOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center shadow-inner">
              <CreditCard className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-base sm:text-lg tracking-tight">
                  Client Payment Reminder (क्लाइंट पेमेंट रिमाइंडर)
                </h2>
                <span className="bg-amber-400/25 border border-amber-300/40 text-amber-200 text-[10px] uppercase font-bold px-2 py-0.5 rounded-full">
                  Auto-Fill Enabled
                </span>
              </div>
              <p className="text-xs text-emerald-100/90 mt-0.5">
                Dispatch official payment reminders to clients via WhatsApp &amp; Email with 1-click auto-filled details.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsPaymentReminderOpen(false)}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert Banner */}
        {sentSuccessMsg && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2.5 text-xs text-emerald-900 flex items-center justify-between shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{sentSuccessMsg}</span>
            </div>
            <button
              onClick={() => setSentSuccessMsg(null)}
              className="text-emerald-700 hover:text-emerald-900 text-xs font-bold underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Modal Body: Split Screen Form & Live Preview */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-stone-200">
          {/* Left Column: Form & Auto-filled parameters (7 Cols) */}
          <div className="lg:col-span-6 p-4 sm:p-5 space-y-4 overflow-y-auto">
            {/* Customer Selection */}
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
                  .filter((j) => j.customerId === selectedCustomerId)
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

            {/* Email Address & Invoice Ref */}
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
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3 text-amber-600" />
                  Invoice / Bill No:
                </label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="INV-2026-0101"
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-mono font-bold text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Outstanding Amount & Due Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200">
              <div>
                <label className="block text-[11px] font-bold text-stone-700 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Banknote className="w-3 h-3 text-emerald-600" />
                    Bill Amount (₹):
                  </span>
                  <span className="font-mono font-extrabold text-xs text-emerald-700">
                    {formatIndianCurrency(Number(amount) || 0)}
                  </span>
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  min="0"
                  step="500"
                  placeholder="25000"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-xs font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
                {/* Quick amount pills */}
                <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                  {[10000, 25000, 45000, 75000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAmount(val)}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                        amount === val
                          ? 'bg-emerald-600 text-white font-bold'
                          : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
                      }`}
                    >
                      ₹{(val / 1000).toFixed(0)}k
                    </button>
                  ))}
                </div>
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
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-xs font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                />
              </div>
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

            {/* Auto-filled Bank & UPI Information Banner */}
            <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3 text-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <Banknote className="w-3.5 h-3.5 text-emerald-700" />
                  Auto-Filled Bank &amp; UPI Details ({companySettings?.companyName || 'Abhimanyu'}):
                </span>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/70 px-1.5 py-0.5 rounded">
                  Included in Message
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-emerald-900">
                <div>• Bank: <strong className="font-semibold">{companySettings?.bankName || 'State Bank of India'}</strong></div>
                <div>• A/c: <strong className="font-mono">{companySettings?.accountNumber || '38920192847'}</strong></div>
                <div>• IFSC: <strong className="font-mono">{companySettings?.ifscCode || 'SBIN0001234'}</strong></div>
                <div>• UPI ID: <strong className="font-mono text-emerald-800">{companySettings?.upiId || '7541882104@upi'}</strong></div>
              </div>
            </div>

            {/* Custom Notes / Remark */}
            <div>
              <label className="block text-[11px] font-bold text-stone-700 mb-1">
                Custom Instruction or Note (Optional):
              </label>
              <input
                type="text"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                placeholder="e.g. Please deduct 2% TDS as applicable and email deduction certificate."
                className="w-full px-3 py-1.5 rounded-xl border border-stone-200 bg-stone-50 text-xs text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Right Column: Live Real-Time Preview & Action Dispatches (6 Cols) */}
          <div className="lg:col-span-6 p-4 sm:p-5 bg-stone-50 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Channel Selector Toggle */}
              <div className="flex items-center justify-between mb-3">
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
                    <span>WhatsApp Reminder</span>
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
                    <span>Email Reminder</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(activeChannel === 'whatsapp' ? whatsappMessage : emailData.body)}
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
                      Recipient: <strong>{contactPerson || currentCustomer.contactPerson}</strong> ({contactMobile || 'No WhatsApp'})
                    </span>
                    <span className="font-mono text-emerald-800 font-bold">wa.me ready</span>
                  </div>

                  {/* WhatsApp Bubble Preview */}
                  <div className="bg-[#EFEAE2] p-3 sm:p-4 rounded-xl border border-stone-300/80 shadow-inner font-sans text-xs">
                    <div className="bg-white rounded-xl rounded-tl-xs p-3.5 shadow-sm border border-stone-200/80 space-y-2 whitespace-pre-wrap leading-relaxed text-stone-800">
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
                      <span className="font-medium text-stone-900 bg-stone-100 px-2 py-0.5 rounded font-mono text-[11px]">
                        {emailData.recipientEmail || 'No Email configured for client'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-stone-400 font-bold w-14">Subject:</span>
                      <span className="font-bold text-stone-900 truncate">
                        {emailData.subject}
                      </span>
                    </div>
                  </div>

                  {/* Email Body Preview */}
                  <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-stone-200 font-mono text-[11px] leading-relaxed text-stone-800 whitespace-pre-wrap max-h-72 overflow-y-auto shadow-inner">
                    {emailData.body}
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons at bottom of Right Column */}
            <div className="pt-4 border-t border-stone-200 space-y-2.5">
              {activeChannel === 'whatsapp' ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* 1-Click WhatsApp Web / App dispatch */}
                    <a
                      href={whatsappWebUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-101 cursor-pointer"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Open WhatsApp Web</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>

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
                    Click <strong>Open WhatsApp Web</strong> to send directly from your desktop/phone WhatsApp, or <strong>Send Cloud API</strong> to dispatch via registered Meta Business API.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {/* 1-Click Open in Gmail Web */}
                    <a
                      href={gmailWebUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-101 cursor-pointer"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Open in Gmail (1-Click)</span>
                      <ExternalLink className="w-3 h-3 opacity-70" />
                    </a>

                    {/* Open default mail client (mailto:) */}
                    <a
                      href={mailtoUrl}
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
                    <span>{isSending ? 'Queueing Email...' : 'Record & Send Email Reminder'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-stone-100 border-t border-stone-200 flex items-center justify-between shrink-0 text-xs">
          <div className="text-stone-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ready to send to: <strong>{currentCustomer.companyName}</strong> ({contactPerson || 'Authorized Contact'})</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPaymentReminderOpen(false)}
            className="px-4 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-bold cursor-pointer transition-colors shadow-2xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
