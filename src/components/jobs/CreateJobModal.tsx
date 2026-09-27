import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  MapPin,
  MessageSquare,
  Mic,
  MicOff,
  Plus,
  Repeat,
  Sparkles,
  User,
  Users,
  Wand2,
  X,
  Zap,
  Paperclip,
  Upload,
  Trash2,
  Image as ImageIcon,
  FileCheck,
  Bot,
  Volume2,
  VolumeX,
  Globe,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { JobPriority, JobStatus } from '../../types';

export const CreateJobModal: React.FC = () => {
  const {
    isCreateJobOpen,
    setIsCreateJobOpen,
    createJob,
    customers,
    users,
    currentUser,
    jobTypes,
    jobs,
    setSelectedJobId,
  } = useApp();

  const getInitialFormData = () => {
    const defaultCustomer = customers[0];
    const defaultSite = defaultCustomer?.sites[0];
    const defaultAssignee = users.find((u) => u.role === 'engineer') || users[0];
    const nextNum = jobs.length + 101;
    const autoJobId = `JR-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;
    const todayStr = new Date().toISOString().split('T')[0];

    return {
      jobId: autoJobId,
      title: '',
      description: '',
      jobType: jobTypes[0] || 'Service',
      priority: 'normal' as JobPriority,
      customerId: defaultCustomer?.id || '',
      siteId: defaultSite?.id || '',
      contactPerson: defaultSite?.contactPerson || defaultCustomer?.contactPerson || '',
      contactNumber: defaultSite?.mobile || defaultCustomer?.mobile || '',
      assignedToId: defaultAssignee?.id || '',
      additionalAssigneeIds: [] as string[],
      startDate: todayStr,
      dueDate: todayStr,
      dueTime: '17:00',
      estimatedDuration: '3 Hours',
      notes: '',
      // Reminder options
      reminderEnabled: true,
      sevenDaysBefore: true,
      threeDaysBefore: true,
      oneDayBefore: true,
      morningOfDueDate: true,
      twoHoursBefore: true,
      atDueTime: true,
      overdueAlert: true,
      overdueIntervalHours: 2,
      // Recurring
      isRecurring: false,
      recurringFrequency: 'monthly' as 'daily' | 'weekly' | 'monthly' | 'quarterly',
    };
  };

  const [formData, setFormData] = useState(getInitialFormData);
  const [attachments, setAttachments] = useState<
    { name: string; url: string; fileType: 'image' | 'pdf' | 'document'; size: string }[]
  >([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [chatGptLang, setChatGptLang] = useState<'hi-IN' | 'en-US' | 'mr-IN' | 'bn-IN' | 'gu-IN'>('hi-IN');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [aiFeedback, setAiFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const speakText = (text: string, langCode: string = 'hi-IN') => {
    if (!soundEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langCode;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  };

  // Reset form when modal opens to ensure a fresh job ID and clean fields
  useEffect(() => {
    if (isCreateJobOpen) {
      setFormData(getInitialFormData());
      setAttachments([]);
      setAiPrompt('');
      setAiFeedback(null);
      setIsListening(false);
    }
  }, [isCreateJobOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const fileUrl = reader.result as string;
        let fileType: 'image' | 'pdf' | 'document' = 'document';
        if (file.type.startsWith('image/')) {
          fileType = 'image';
        } else if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          fileType = 'pdf';
        }

        const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
        setAttachments((prev) => [
          ...prev,
          {
            name: file.name,
            url: fileUrl,
            fileType,
            size: `${sizeInMb} MB`,
          },
        ]);
      };
      reader.readAsDataURL(file);
    });

    e.target.value = '';
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAiAutoFill = async (overridePrompt?: string) => {
    const text = (overridePrompt || aiPrompt).trim();
    if (!text) {
      setAiFeedback({
        type: 'error',
        message: 'Kripya bataiye ki kis employee ko kya kaam assign karna hai.',
      });
      return;
    }

    setIsAiLoading(true);
    setAiFeedback(null);

    try {
      const res = await fetch('/api/ai/parse-job-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, users, customers, jobTypes }),
      });

      const json = await res.json();
      if ((json.success || json.status === 'ok') && json.data) {
        const parsed = json.data;

        setFormData((prev) => {
          let updatedCustId = prev.customerId;
          let updatedSiteId = prev.siteId;
          let contactP = prev.contactPerson;
          let contactN = prev.contactNumber;

          if (parsed.matchedCustomerId) {
            const foundCust = customers.find((c) => c.id === parsed.matchedCustomerId);
            if (foundCust) {
              updatedCustId = foundCust.id;
              const foundSite = parsed.matchedSiteId
                ? foundCust.sites.find((s) => s.id === parsed.matchedSiteId) || foundCust.sites[0]
                : foundCust.sites[0];
              updatedSiteId = foundSite?.id || '';
              contactP = foundSite?.contactPerson || foundCust.contactPerson || '';
              contactN = foundSite?.mobile || foundCust.mobile || '';
            }
          }

          return {
            ...prev,
            title: parsed.title || prev.title,
            description: parsed.description || prev.description,
            priority: (parsed.priority as JobPriority) || prev.priority,
            jobType: parsed.jobType || prev.jobType,
            assignedToId: parsed.matchedUserId || prev.assignedToId,
            customerId: updatedCustId,
            siteId: updatedSiteId,
            contactPerson: contactP,
            contactNumber: contactN,
            startDate: parsed.startDate || prev.startDate,
            dueDate: parsed.dueDate || prev.dueDate,
            dueTime: parsed.dueTime || prev.dueTime,
            estimatedDuration: parsed.estimatedDuration || prev.estimatedDuration,
          };
        });

        const assignedEngineer = users.find((u) => u.id === parsed.matchedUserId);
        const successMsg = `⚡ ChatGPT Auto-Filled! ${
          assignedEngineer ? `Assigned to ${assignedEngineer.name} (${assignedEngineer.designation})` : ''
        } • Title & Detailed Scope generated!`;

        setAiFeedback({
          type: 'success',
          message: successMsg,
        });

        // ChatGPT Spoken Voice Output in user's selected language
        const spoken = chatGptLang === 'en-US'
          ? `Job assigned to ${assignedEngineer?.name || 'team'}. Title and complete technical checklist auto-filled by ChatGPT.`
          : `जॉब ${assignedEngineer?.name || 'इंजीनियर'} को असाइन कर दिया गया है। टाइटल और पूरा विवरण चैटजीपीटी द्वारा भर दिया गया है।`;
        speakText(spoken, chatGptLang);
      } else {
        setAiFeedback({
          type: 'error',
          message: json.message || 'Could not parse job details. Please try again.',
        });
      }
    } catch (err) {
      console.error(err);
      setAiFeedback({
        type: 'error',
        message: 'Server error parsing job. Please check your connection.',
      });
    } finally {
      setIsAiLoading(false);
    }
  };

  const toggleVoiceInput = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice speech recognition is not supported in this browser. You can type in the ChatGPT prompt box directly.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = chatGptLang;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setAiFeedback({
          type: 'success',
          message: chatGptLang === 'en-US'
            ? '🎙️ Listening... Speak engineer name, work details, customer and deadline...'
            : '🎙️ चैटजीपीटी सुन रहा है... बोलिए किस इंजीनियर को क्या काम और कब तक देना है...',
        });
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setAiPrompt(transcript);
        handleAiAutoFill(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        setAiFeedback({
          type: 'error',
          message: `Voice error: ${event.error || 'could not capture speech'}. Please type instead.`,
        });
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === formData.customerId) || customers[0];
  const availableSites = selectedCustomer?.sites || [];

  const handleCustomerChange = (customerId: string) => {
    const cust = customers.find((c) => c.id === customerId);
    const firstSite = cust?.sites[0];
    setFormData((prev) => ({
      ...prev,
      customerId,
      siteId: firstSite?.id || '',
      contactPerson: firstSite?.contactPerson || cust?.contactPerson || '',
      contactNumber: firstSite?.mobile || cust?.mobile || '',
    }));
  };

  const handleSiteChange = (siteId: string) => {
    const site = availableSites.find((s) => s.id === siteId);
    setFormData((prev) => ({
      ...prev,
      siteId,
      contactPerson: site?.contactPerson || prev.contactPerson,
      contactNumber: site?.mobile || prev.contactNumber,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      alert('Please enter a job title');
      return;
    }

    const effectiveCustomerId = formData.customerId || customers[0]?.id || '';
    const selectedCust = customers.find((c) => c.id === effectiveCustomerId) || customers[0];
    const effectiveSiteId = formData.siteId || selectedCust?.sites[0]?.id || '';
    const effectiveAssigneeId =
      formData.assignedToId ||
      users.find((u) => u.role === 'engineer')?.id ||
      users[0]?.id ||
      '';

    const newJob = createJob({
      jobId: formData.jobId,
      title: formData.title.trim(),
      description: formData.description.trim(),
      jobType: formData.jobType,
      priority: formData.priority,
      customerId: effectiveCustomerId,
      siteId: effectiveSiteId,
      contactPerson: formData.contactPerson || selectedCust?.contactPerson || '',
      contactNumber: formData.contactNumber || selectedCust?.mobile || '',
      assignedToId: effectiveAssigneeId,
      additionalAssigneeIds: formData.additionalAssigneeIds,
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      dueDate: formData.dueDate || new Date().toISOString().split('T')[0],
      dueTime: formData.dueTime || '17:00',
      estimatedDuration: formData.estimatedDuration || '2 Hours',
      status: 'assigned',
      attachments: attachments.map((att) => ({
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: att.name,
        fileType: att.fileType,
        url: att.url,
        uploadedBy: currentUser?.name || 'Admin',
        uploadedAt: new Date().toISOString(),
        size: att.size,
      })),
      notes: formData.notes
        ? [
            {
              id: `note_${Date.now()}`,
              authorId: 'system',
              authorName: 'Initial Dispatch Note',
              content: formData.notes,
              createdAt: new Date().toISOString(),
            },
          ]
        : [],
      reminderConfig: {
        enabled: formData.reminderEnabled,
        triggers: {
          sevenDaysBefore: formData.sevenDaysBefore,
          threeDaysBefore: formData.threeDaysBefore,
          oneDayBefore: formData.oneDayBefore,
          morningOfDueDate: formData.morningOfDueDate,
          twoHoursBefore: formData.twoHoursBefore,
          atDueTime: formData.atDueTime,
          overdueAlert: formData.overdueAlert,
        },
        overdueIntervalHours: Number(formData.overdueIntervalHours) || 2,
      },
      recurringConfig: formData.isRecurring
        ? {
            enabled: true,
            frequency: formData.recurringFrequency,
          }
        : undefined,
    });

    setIsCreateJobOpen(false);
    setSelectedJobId(newJob.id);
  };

  if (!isCreateJobOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-stone-900">Create New Job Assignment</h2>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                {formData.jobId}
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Assign task to field engineer and auto-generate WhatsApp reminders with direct token authentication.
            </p>
          </div>
          <button
            onClick={() => setIsCreateJobOpen(false)}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* ChatGPT 4o Smart Auto-Fill Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50/70 to-emerald-50/80 border-2 border-emerald-300 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                    <span>ChatGPT 4o Job Assignment &amp; Voice Auto-Fill</span>
                    <span className="px-1.5 py-0.2 rounded text-[10px] font-black uppercase bg-emerald-600 text-white font-mono">
                      ChatGPT
                    </span>
                  </h4>
                  <p className="text-[11px] text-stone-600">
                    Mic par click karke boliye ya text likhiye — ChatGPT title, description aur engineer auto-fill karega aur voice me bolkar batayega!
                  </p>
                </div>
              </div>

              {/* Language Switcher & Voice Speaker Mute/Unmute */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <div className="flex items-center gap-1 bg-white/90 border border-emerald-200 rounded-xl px-2 py-1 text-[11px] font-semibold text-stone-700">
                  <Globe className="w-3 h-3 text-emerald-600" />
                  <select
                    value={chatGptLang}
                    onChange={(e) => setChatGptLang(e.target.value as any)}
                    className="bg-transparent text-[11px] font-semibold text-stone-800 focus:outline-none cursor-pointer"
                  >
                    <option value="hi-IN">हिन्दी (Hindi)</option>
                    <option value="en-US">English</option>
                    <option value="mr-IN">मराठी (Marathi)</option>
                    <option value="bn-IN">বাংলা (Bengali)</option>
                    <option value="gu-IN">ગુજરાતી (Gujarati)</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                    soundEnabled
                      ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                      : 'bg-white border-stone-200 text-stone-400'
                  }`}
                  title={soundEnabled ? 'ChatGPT Voice Output On' : 'ChatGPT Voice Output Muted'}
                >
                  {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Input + Voice Mic + Submit */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAiAutoFill();
                    }
                  }}
                  placeholder={
                    chatGptLang === 'en-US'
                      ? 'e.g. Assign urgent oxygen plant compressor repair to engineer for Apollo Hospital tomorrow 10 AM'
                      : 'e.g. Rahul ko Apollo Hospital me oxygen compressor pressure check ke liye kal subah 10 baje assign karo'
                  }
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-white border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs text-stone-900 shadow-2xs placeholder:text-stone-400"
                />
                {aiPrompt && (
                  <button
                    type="button"
                    onClick={() => setAiPrompt('')}
                    className="absolute right-3 top-3 text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Voice Mic Button */}
              <button
                type="button"
                onClick={toggleVoiceInput}
                className={`px-3 py-2.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs font-bold text-xs ${
                  isListening
                    ? 'bg-red-600 text-white ring-4 ring-red-200 animate-pulse'
                    : 'bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-700'
                }`}
                title={isListening ? 'Stop Listening' : 'Click to Speak to ChatGPT (Voice Input)'}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4 animate-bounce" />
                    <span className="text-[11px] hidden sm:inline">Listening...</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4 text-emerald-600" />
                    <span className="text-[11px] hidden sm:inline">बोलें</span>
                  </>
                )}
              </button>

              {/* Auto Fill Button */}
              <button
                type="button"
                disabled={isAiLoading}
                onClick={() => handleAiAutoFill()}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 active:scale-98 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer whitespace-nowrap"
              >
                {isAiLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ChatGPT Writing...</span>
                  </>
                ) : (
                  <>
                    <Bot className="w-4 h-4" />
                    <span>ChatGPT Auto-Fill</span>
                  </>
                )}
              </button>
            </div>

            {/* Quick Click-to-Test Prompts */}
            <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
              <span className="text-[10px] font-bold text-stone-500">Quick Test:</span>
              <button
                type="button"
                onClick={() => {
                  const firstEng = users.find((u) => u.role === 'engineer')?.name || 'Service Engineer';
                  const p = `${firstEng} ko Apex Hospital me oxygen compressor pressure check ke liye kal subah 10 baje assign karo`;
                  setAiPrompt(p);
                  handleAiAutoFill(p);
                }}
                className="px-2 py-0.5 rounded-lg bg-white/80 hover:bg-white text-stone-700 text-[10px] font-medium border border-emerald-200 transition-colors cursor-pointer"
              >
                ⚡ {users.find((u) => u.role === 'engineer')?.name || 'Engineer'} – Apex Oxygen Compressor Check
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = 'Apollo Hospital ICU central gas pipeline urgent breakdown repair kal 2 baje assign karo';
                  setAiPrompt(p);
                  handleAiAutoFill(p);
                }}
                className="px-2 py-0.5 rounded-lg bg-white/80 hover:bg-white text-stone-700 text-[10px] font-medium border border-emerald-200 transition-colors cursor-pointer"
              >
                ⚡ Apollo Hospital – ICU Gas Pipeline Repair
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = 'XYZ Industries Ltd plant 1 air dryer preventive maintenance visit assign karo';
                  setAiPrompt(p);
                  handleAiAutoFill(p);
                }}
                className="px-2 py-0.5 rounded-lg bg-white/80 hover:bg-white text-stone-700 text-[10px] font-medium border border-emerald-200 transition-colors cursor-pointer"
              >
                ⚡ XYZ Industries – Air Dryer Preventive Visit
              </button>
            </div>

            {/* AI Feedback Banner */}
            {aiFeedback && (
              <div
                className={`p-2.5 rounded-xl text-xs font-semibold flex items-center justify-between ${
                  aiFeedback.type === 'success'
                    ? 'bg-emerald-100/90 text-emerald-900 border border-emerald-300'
                    : 'bg-red-100 text-red-900 border border-red-300'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {aiFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{aiFeedback.message}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setAiFeedback(null)}
                  className="text-stone-500 hover:text-stone-800 ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Basic Job Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 pb-1">
              Job Information
            </h3>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Job Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Preventive Maintenance – PSA Oxygen Generator #2"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-stone-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">Job Type</label>
                <select
                  value={formData.jobType}
                  onChange={(e) => setFormData({ ...formData, jobType: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 bg-white"
                >
                  {jobTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value as JobPriority })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 bg-white font-medium"
                >
                  <option value="urgent" className="text-red-600 font-bold">Urgent (Immediate SLA)</option>
                  <option value="high" className="text-amber-700 font-bold">High Priority</option>
                  <option value="normal">Normal</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">Estimated Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 4 Hours / 1 Day"
                  value={formData.estimatedDuration}
                  onChange={(e) => setFormData({ ...formData, estimatedDuration: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">Job Description &amp; Scope</label>
              <textarea
                rows={2}
                placeholder="Detail the technical tasks, equipment model numbers, checklist items..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 text-xs text-stone-900"
              />
            </div>
          </div>

          {/* Customer & Location */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 pb-1">
              Customer &amp; Site Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Customer / Client <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.customerId}
                  onChange={(e) => handleCustomerChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 bg-white font-semibold"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.city})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Site / Facility Location <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.siteId}
                  onChange={(e) => handleSiteChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-800 bg-white"
                >
                  {availableSites.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.siteName}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-50 p-3 rounded-xl border border-stone-100">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">Site Contact Person</label>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({ ...formData, contactPerson: e.target.value })}
                  placeholder="e.g. Dr. Vivek / Mr. Rakesh"
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-1">Contact Phone Number</label>
                <input
                  type="text"
                  value={formData.contactNumber}
                  onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })}
                  placeholder="+91 98999 11112"
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 text-xs text-stone-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Assignee & Deadlines */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-stone-400 border-b border-stone-100 pb-1">
              Assignment &amp; Deadlines
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Primary Assigned Engineer <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.assignedToId}
                  onChange={(e) => setFormData({ ...formData, assignedToId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 font-semibold bg-white"
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} — {u.designation} ({u.whatsapp})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-emerald-700 font-medium mt-1">
                  Will receive WhatsApp alert with 1-click login token link immediately.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Target Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white font-semibold"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-800 mb-1">
                  Due Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formData.dueTime}
                  onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Automatic Reminder Engine Schedule */}
          <div className="space-y-3 bg-emerald-50/50 p-4 rounded-xl border border-emerald-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-950">
                  Automatic WhatsApp Reminder Schedule
                </span>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-emerald-900 font-semibold cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.reminderEnabled}
                  onChange={(e) => setFormData({ ...formData, reminderEnabled: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span>Enable Automated Reminders</span>
              </label>
            </div>

            {formData.reminderEnabled && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-stone-700 pt-2 border-t border-emerald-200/60">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.sevenDaysBefore}
                    onChange={(e) => setFormData({ ...formData, sevenDaysBefore: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>7 Days Before</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.threeDaysBefore}
                    onChange={(e) => setFormData({ ...formData, threeDaysBefore: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>3 Days Before</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.oneDayBefore}
                    onChange={(e) => setFormData({ ...formData, oneDayBefore: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>1 Day Before</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.morningOfDueDate}
                    onChange={(e) => setFormData({ ...formData, morningOfDueDate: e.target.checked })}
                    className="rounded text-emerald-600"
                  />
                  <span>Morning of Due Date</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.twoHoursBefore}
                    onChange={(e) => setFormData({ ...formData, twoHoursBefore: e.target.checked })}
                    className="rounded text-emerald-600 font-semibold text-amber-900"
                  />
                  <span>2 Hours Before (Critical)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.atDueTime}
                    onChange={(e) => setFormData({ ...formData, atDueTime: e.target.checked })}
                    className="rounded text-emerald-600 font-semibold text-red-900"
                  />
                  <span>At Due Time</span>
                </label>
              </div>
            )}
          </div>

          {/* Attachments Section */}
          <div className="space-y-3 bg-stone-50/70 p-4 rounded-xl border border-stone-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-stone-900">
                  Job Attachments (Photos, Invoices, Service Sheets, PDFs)
                </span>
              </div>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Files</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {attachments.length === 0 ? (
              <p className="text-[11px] text-stone-500 italic">
                No files attached yet. Field engineers will also be able to add site photos and completion proofs later.
              </p>
            ) : (
              <div className="space-y-2">
                {attachments.map((att, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white border border-stone-200 text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {att.fileType === 'image' ? (
                        <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                      )}
                      <span className="font-semibold text-stone-800 truncate max-w-[200px] sm:max-w-xs">
                        {att.name}
                      </span>
                      <span className="text-[10px] text-stone-400 shrink-0">({att.size})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(idx)}
                      className="p-1 rounded-md text-red-600 hover:bg-red-50 cursor-pointer transition-colors"
                      title="Remove file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recurring Option */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-stone-50 border border-stone-200">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-stone-500" />
              <div>
                <div className="text-xs font-semibold text-stone-800">Recurring Job Schedule</div>
                <div className="text-[10px] text-stone-500">
                  Automatically regenerate next cycle upon completion
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isRecurring}
                onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
                className="rounded text-emerald-600"
              />
              {formData.isRecurring && (
                <select
                  value={formData.recurringFrequency}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurringFrequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'quarterly',
                    })
                  }
                  className="px-2 py-1 rounded text-xs border border-stone-200 bg-white"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              )}
            </div>
          </div>

          {/* Footer CTAs */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateJobOpen(false)}
              className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Create Job &amp; Dispatch Reminder</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
