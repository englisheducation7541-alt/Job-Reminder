import React, { useState, useEffect } from 'react';
import {
  Check,
  CheckCheck,
  CheckCircle,
  Copy,
  ExternalLink,
  FileText,
  Key,
  MessageSquare,
  Send,
  Sparkles,
  Smartphone,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  generateDirectAccessUrl,
  generateWhatsAppWebUrl,
  renderTemplate,
} from '../../utils/whatsappEngine';

export const SendWhatsAppModal: React.FC = () => {
  const {
    isSendWhatsAppOpen,
    setIsSendWhatsAppOpen,
    activeJobForWhatsApp,
    templates,
    companySettings,
    getUserById,
    getCustomerById,
    getSiteById,
    sendWhatsAppMessage,
  } = useApp();

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(templates[0]?.id || '');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  if (!isSendWhatsAppOpen || !activeJobForWhatsApp) return null;

  const job = activeJobForWhatsApp;
  const customer = getCustomerById(job.customerId);
  const site = getSiteById(job.customerId, job.siteId);
  const assignee = getUserById(job.assignedToId);

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) || templates[0];

  // Render preview body
  const previewBody =
    selectedTemplateId === 'custom'
      ? (customMessage.trim() ||
        `🔔 *Job Reminder: ${job.title} (${job.jobId})*\n\nHello ${assignee?.name || 'Engineer'},\n\n📌 *Job:* ${job.title}\n🆔 *Job ID:* ${job.jobId}\n🏢 *Customer:* ${customer?.companyName || 'Client'}\n📍 *Location:* ${site ? `${site.siteName} (${site.address})` : 'Client Site'}\n📅 *Due Date:* ${job.dueDate}\n⏰ *Due Time:* ${job.dueTime || '18:00'}\n🚨 *Priority:* ${job.priority.toUpperCase()}\n${job.description ? `📝 *Job Description:*\n${job.description.trim()}\n\n` : ''}👉 *Login Link:*\n${generateDirectAccessUrl(assignee, job)}\n\n— *${companySettings.companyName || 'Job Reminder'} Operations Team*`)
      : renderTemplate(selectedTemplate ? selectedTemplate.templateText : '', {
          employee: assignee,
          job,
          customer,
          site,
          companySettings,
        });

  const webWhatsAppUrl = assignee
    ? generateWhatsAppWebUrl(assignee.whatsapp, previewBody)
    : '#';

  const handleSend = async () => {
    if (!assignee) return;
    setIsSending(true);

    await sendWhatsAppMessage(
      assignee.whatsapp,
      previewBody,
      job.id,
      assignee.id,
      selectedTemplate?.name || 'Manual Notification'
    );

    setIsSending(false);
    setSentSuccess(true);
    setTimeout(() => {
      setSentSuccess(false);
      setIsSendWhatsAppOpen(false);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Send WhatsApp Reminder</h3>
              <p className="text-[11px] text-emerald-100">
                Dispatches via WhatsApp Business API with 1-Click Direct Token Link
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsSendWhatsAppOpen(false)}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Target Job & Recipient Card */}
          <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-stone-400 font-medium">Job Reference:</span>
              <div className="font-bold text-stone-900 flex items-center gap-1.5 mt-0.5">
                <span className="font-mono text-emerald-700">{job.jobId}</span>
                <span className="truncate">{job.title}</span>
              </div>
            </div>
            <div>
              <span className="text-stone-400 font-medium">Recipient Engineer:</span>
              <div className="font-bold text-stone-900 flex items-center gap-2 mt-0.5">
                <img
                  src={assignee?.avatar}
                  alt={assignee?.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
                <span>{assignee?.name}</span>
                <span className="font-mono text-emerald-700 font-normal">({assignee?.whatsapp})</span>
              </div>
            </div>

            {/* Job Description row */}
            <div className="sm:col-span-2 pt-2 border-t border-stone-200/80">
              <span className="text-stone-400 font-medium flex items-center gap-1 text-[11px]">
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                Job Description (Included in WhatsApp message):
              </span>
              <p className="mt-0.5 text-stone-800 text-[11px] bg-white p-2 rounded-lg border border-stone-200/70 font-sans leading-relaxed">
                {job.description?.trim() ? job.description.trim() : (
                  <span className="italic text-stone-400 font-normal">No additional description entered for this job.</span>
                )}
              </p>
            </div>
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-xs font-semibold text-stone-800 mb-1.5">
              Select Approved WhatsApp Message Template
            </label>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs font-medium text-stone-900 bg-white"
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.category.toUpperCase()})
                </option>
              ))}
              <option value="custom">Custom Dynamic Message...</option>
            </select>
          </div>

          {selectedTemplateId === 'custom' && (
            <div>
              <label className="block text-xs font-semibold text-stone-800 mb-1">
                Custom Message Content
              </label>
              <textarea
                rows={4}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Type your WhatsApp notification..."
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs"
              />
            </div>
          )}

          {/* Live Mobile WhatsApp Chat Preview */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-400">
                Live WhatsApp Message Preview
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Token link embedded automatically
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#ECE5DD] border border-stone-300 font-sans shadow-inner">
              <div className="max-w-md bg-white rounded-2xl rounded-tl-xs p-3.5 shadow-sm text-xs text-stone-900 relative">
                <div className="whitespace-pre-wrap leading-relaxed font-sans text-[12px]">
                  {previewBody}
                </div>
                <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-stone-400">
                  <span>{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
                  <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Direct Link Information */}
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-xs text-emerald-900">
            <Key className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">1-Click Direct Token Login Guarantee:</span>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                The embedded link allows {assignee?.name} to open this job instantly from WhatsApp on mobile without logging in.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex flex-wrap items-center justify-between gap-3">
          <a
            href={webWhatsAppUrl}
            target="_blank"
            rel="noreferrer"
            className="px-3 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Open in WhatsApp Web client"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open in WhatsApp Web</span>
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSendWhatsAppOpen(false)}
              className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || sentSuccess}
              className={`px-5 py-2 rounded-xl text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                sentSuccess
                  ? 'bg-emerald-600'
                  : isSending
                  ? 'bg-emerald-400 cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
              }`}
            >
              {sentSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Message Sent Successfully!</span>
                </>
              ) : isSending ? (
                <span>Dispatching via API...</span>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Dispatch WhatsApp API</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
