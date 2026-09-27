import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCheck,
  Clock,
  CreditCard,
  Edit2,
  ExternalLink,
  Eye,
  FileCode,
  MessageSquare,
  Play,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Trash2,
  Users,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { WhatsAppMessageLog, WhatsAppTemplate } from '../../types';
import { formatDateDisplay } from '../../utils/whatsappEngine';

export const WhatsAppHubView: React.FC = () => {
  const {
    currentUser,
    messageLogs,
    templates,
    addTemplate,
    updateTemplate,
    deleteTemplate,
    retryMessage,
    triggerSchedulerTick,
    users,
    jobs,
    setSelectedJobId,
    openBulkJobReminders,
    openPaymentReminderModal,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'logs' | 'templates'>('logs');
  const [logFilter, setLogFilter] = useState<'all' | 'delivered' | 'read' | 'failed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLog, setSelectedLog] = useState<WhatsAppMessageLog | null>(null);
  const [briefingSuccess, setBriefingSuccess] = useState(false);

  // Template CRUD states
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<WhatsAppTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<WhatsAppTemplate | null>(null);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    code: '',
    category: 'Job Alerts' as WhatsAppTemplate['category'],
    templateText: '',
    variables: ''
  });

  const canManageTemplates = ['admin', 'manager'].includes(currentUser.role);
  const isAdmin = currentUser.role === 'admin';

  // Filter logs
  const filteredLogs = messageLogs.filter((log) => {
    if (logFilter !== 'all' && log.status !== logFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        log.recipientName.toLowerCase().includes(q) ||
        log.whatsappNumber.includes(q) ||
        log.messageType.toLowerCase().includes(q) ||
        log.messageText.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleSendMorningBriefing = () => {
    triggerSchedulerTick();
    setBriefingSuccess(true);
    setTimeout(() => setBriefingSuccess(false), 3000);
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">WhatsApp Communications Center</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              API Connected
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-0.5">
            Meta Cloud API logs, automated delivery tracking, template registry, and engineer broadcast dispatches.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => openPaymentReminderModal()}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer hover:scale-101"
            title="Send Client Payment Reminder via WhatsApp & Email"
          >
            <CreditCard className="w-3.5 h-3.5 text-amber-300" />
            <span>Client Payment Reminder</span>
          </button>

          <button
            onClick={() => openBulkJobReminders()}
            className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            title="Send bulk WhatsApp reminders for all pending/upcoming jobs of an employee or manager at once"
          >
            <Send className="w-3.5 h-3.5 text-emerald-700" />
            <span>Send Job Reminders</span>
          </button>

          <button
            onClick={handleSendMorningBriefing}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
            title="Trigger automated check and scheduler dispatch for all jobs"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{briefingSuccess ? 'Scheduler Check Dispatched!' : 'Run Reminder Scheduler Now'}</span>
          </button>
        </div>
      </div>

      {/* Hub Tabs */}
      <div className="flex items-center gap-3 border-b border-stone-200 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'logs'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Message Logs &amp; Delivery ({messageLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('templates')}
          className={`py-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeSubTab === 'templates'
              ? 'border-emerald-600 text-emerald-700'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileCode className="w-4 h-4" />
          <span>Approved Templates ({templates.length})</span>
        </button>
      </div>

      {/* Sub-tab 1: Message Logs */}
      {activeSubTab === 'logs' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-stone-200">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search logs by engineer name, phone, message type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-stone-200 text-xs focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
            </div>

            <div className="flex items-center gap-1.5">
              {(['all', 'delivered', 'read', 'failed'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setLogFilter(filter)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize cursor-pointer transition-colors ${
                    logFilter === filter
                      ? 'bg-stone-900 text-white shadow-2xs'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Logs Table */}
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-stone-600">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Recipient Engineer</th>
                    <th className="px-4 py-3">Message Type</th>
                    <th className="px-4 py-3">Message Excerpt</th>
                    <th className="px-4 py-3">Delivery Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-12 text-center text-stone-400">
                        No WhatsApp logs matching filter.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => {
                      const targetJob = jobs.find((j) => j.id === log.jobId);
                      return (
                        <tr key={log.id} className="hover:bg-stone-50/80 transition-colors">
                          <td className="px-4 py-3.5 whitespace-nowrap text-stone-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-bold text-stone-900">{log.recipientName}</div>
                            <div className="font-mono text-[11px] text-stone-400">{log.whatsappNumber}</div>
                          </td>

                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-emerald-800">{log.messageType}</div>
                            {targetJob && (
                              <button
                                onClick={() => setSelectedJobId(targetJob.id)}
                                className="text-[10px] text-stone-500 hover:text-emerald-700 font-mono underline cursor-pointer"
                              >
                                {targetJob.jobId}
                              </button>
                            )}
                          </td>

                          <td className="px-4 py-3.5 max-w-xs truncate text-stone-600">
                            {log.messageText}
                          </td>

                          <td className="px-4 py-3.5 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold ${
                                log.status === 'read'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : log.status === 'delivered'
                                  ? 'bg-cyan-50 text-cyan-700 border border-cyan-200'
                                  : log.status === 'sent'
                                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {log.status === 'read' ? (
                                <CheckCheck className="w-3 h-3 text-emerald-600" />
                              ) : log.status === 'delivered' ? (
                                <CheckCheck className="w-3 h-3 text-cyan-600" />
                              ) : log.status === 'sent' ? (
                                <Check className="w-3 h-3 text-blue-500" />
                              ) : (
                                <AlertCircle className="w-3 h-3 text-red-600" />
                              )}
                              <span className="capitalize">{log.status}</span>
                            </span>
                            {log.errorMessage && (
                              <div className="text-[10px] text-red-600 mt-0.5">{log.errorMessage}</div>
                            )}
                          </td>

                          <td className="px-4 py-3.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {log.status === 'failed' && (
                                <button
                                  onClick={() => retryMessage(log.id)}
                                  className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-900 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                                  title="Retry dispatch via WhatsApp API"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Retry</span>
                                </button>
                              )}
                              <button
                                onClick={() => setSelectedLog(log)}
                                className="p-1.5 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 cursor-pointer"
                                title="Inspect Full WhatsApp Message"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Sub-tab 2: Approved WhatsApp Templates */}
      {activeSubTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-stone-200">
            <div>
              <h3 className="font-bold text-stone-900 text-sm">WhatsApp Notification Templates</h3>
              <p className="text-xs text-stone-500">
                Templates used for automated reminders, dispatch briefings, escalations, and status confirmations.
              </p>
            </div>
            {canManageTemplates && (
              <button
                onClick={() => {
                  setTemplateForm({
                    name: '',
                    code: `CUSTOM_${Date.now().toString().slice(-4)}`,
                    category: 'Job Alerts',
                    templateText: '🔔 *JOB NOTIFICATION*\n\nHello {engineer_name},\nJob #{job_id}: {job_title}\nDue: {deadline_date} at {deadline_time}\nSite: {site_name}\n\n👉 Access Profile: {login_link}',
                    variables: 'engineer_name, job_id, job_title, deadline_date, deadline_time, site_name, login_link',
                  });
                  setIsAddingTemplate(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Template</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="p-5 rounded-2xl bg-white border border-stone-200 shadow-xs space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <h3 className="font-bold text-stone-900 text-sm">{tpl.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-stone-100 text-stone-700">
                        {tpl.category}
                      </span>
                      {canManageTemplates && (
                        <button
                          onClick={() => {
                            setTemplateToEdit(tpl);
                            setTemplateForm({
                              name: tpl.name,
                              code: tpl.code,
                              category: tpl.category,
                              templateText: tpl.templateText,
                              variables: tpl.variables.join(', '),
                            });
                          }}
                          className="p-1 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 cursor-pointer"
                          title="Edit Template"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => setTemplateToDelete(tpl)}
                          className="p-1 rounded-lg border border-stone-200 hover:bg-red-50 text-stone-400 hover:text-red-600 cursor-pointer"
                          title="Delete Template"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="font-mono text-[10px] text-stone-400 mb-2">Code: {tpl.code}</div>

                  <div className="bg-[#ECE5DD] p-3.5 rounded-xl border border-stone-200 font-sans text-xs text-stone-800 whitespace-pre-wrap leading-relaxed shadow-inner max-h-56 overflow-y-auto">
                    {tpl.templateText}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400">
                    Configured Variables:
                  </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {tpl.variables.map((v) => (
                      <span
                        key={v}
                        className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200/60"
                      >
                        {`{{${v}}}`}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Template Modal */}
      {(isAddingTemplate || templateToEdit) && (
        <div className="fixed inset-0 z-60 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <h3 className="font-bold text-stone-900 text-sm">
                {templateToEdit ? 'Edit WhatsApp Template' : 'Create WhatsApp Template'}
              </h3>
              <button
                onClick={() => {
                  setIsAddingTemplate(false);
                  setTemplateToEdit(null);
                }}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const vars = templateForm.variables
                  .split(',')
                  .map((s) => s.trim().replace(/[{}]/g, ''))
                  .filter(Boolean);

                if (templateToEdit) {
                  updateTemplate(templateToEdit.id, {
                    name: templateForm.name,
                    category: templateForm.category,
                    templateText: templateForm.templateText,
                    variables: vars,
                  });
                  setTemplateToEdit(null);
                } else {
                  addTemplate({
                    code: templateForm.code || `TPL_${Date.now().toString().slice(-4)}`,
                    name: templateForm.name,
                    category: templateForm.category,
                    templateText: templateForm.templateText,
                    variables: vars,
                    isDefault: false,
                  });
                  setIsAddingTemplate(false);
                }
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-semibold text-stone-800 mb-1">Template Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Critical Safety Alert"
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Category</label>
                  <select
                    value={templateForm.category}
                    onChange={(e) =>
                      setTemplateForm({
                        ...templateForm,
                        category: e.target.value as WhatsAppTemplate['category'],
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200 bg-white"
                  >
                    <option value="Job Alerts">Job Alerts</option>
                    <option value="Reminders">Reminders</option>
                    <option value="Status Updates">Status Updates</option>
                    <option value="Summaries">Summaries</option>
                    <option value="Escalation">Escalation</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-800 mb-1">Code / Identifier</label>
                  <input
                    type="text"
                    required
                    disabled={!!templateToEdit}
                    value={templateForm.code}
                    onChange={(e) => setTemplateForm({ ...templateForm, code: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-stone-200 bg-stone-50 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-stone-800">
                    Message Text (supports WhatsApp markdown *bold*, _italics_, `code`) *
                  </label>
                  <span className="text-[11px] text-stone-400">Click tag to insert:</span>
                </div>

                {/* Quick variable insert chips */}
                <div className="flex flex-wrap gap-1 mb-2">
                  {[
                    { tag: 'job_description', label: '+ Job Description' },
                    { tag: 'job_title', label: '+ Job Title' },
                    { tag: 'job_id', label: '+ Job ID' },
                    { tag: 'employee_name', label: '+ Engineer' },
                    { tag: 'customer_name', label: '+ Customer' },
                    { tag: 'due_date', label: '+ Due Date' },
                    { tag: 'due_time', label: '+ Due Time' },
                    { tag: 'priority', label: '+ Priority' },
                    { tag: 'direct_access_url', label: '+ Login Link' },
                  ].map(({ tag, label }) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => {
                        const insertion = tag === 'job_description' ? `\n📝 *Job Description:*\n{{${tag}}}\n` : `{{${tag}}}`;
                        setTemplateForm((prev) => ({
                          ...prev,
                          templateText: prev.templateText + (prev.templateText.endsWith('\n') ? '' : ' ') + insertion,
                          variables: Array.from(
                            new Set([...prev.variables.split(',').map((s) => s.trim()).filter(Boolean), tag])
                          ).join(', '),
                        }));
                      }}
                      className="px-2 py-0.5 rounded-md bg-stone-100 hover:bg-emerald-100 hover:text-emerald-800 text-[10px] font-medium text-stone-600 transition-colors border border-stone-200 cursor-pointer"
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <textarea
                  required
                  rows={6}
                  value={templateForm.templateText}
                  onChange={(e) => setTemplateForm({ ...templateForm, templateText: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-800 mb-1">
                  Variables (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="employee_name, job_id, job_title, job_description, customer_name, direct_access_url"
                  value={templateForm.variables}
                  onChange={(e) => setTemplateForm({ ...templateForm, variables: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-stone-200 font-mono text-[11px]"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  Supported tags: <code className="text-emerald-700 font-bold">job_description</code>, employee_name, job_id, job_title, priority, customer_name, site, due_date, due_time, direct_access_url
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingTemplate(false);
                    setTemplateToEdit(null);
                  }}
                  className="px-3.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs"
                >
                  {templateToEdit ? 'Save Changes' : 'Create Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Template Confirmation Modal */}
      {templateToDelete && (
        <div className="fixed inset-0 z-60 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 text-base">Delete Template?</h3>
                <p className="text-xs text-stone-500 font-mono">{templateToDelete.code}</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
              Are you sure you want to delete <strong>{templateToDelete.name}</strong>? Automated reminders using this template code will fall back to default template.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setTemplateToDelete(null)}
                className="px-3.5 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteTemplate(templateToDelete.id);
                  setTemplateToDelete(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-xs cursor-pointer"
              >
                Delete Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message Inspection Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-60 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-center justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-bold text-stone-900 text-sm">Dispatched WhatsApp Log</h3>
                <p className="text-xs text-stone-500">
                  Recipient: {selectedLog.recipientName} ({selectedLog.whatsappNumber})
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#ECE5DD] border border-stone-200 text-xs whitespace-pre-wrap font-sans leading-relaxed">
              {selectedLog.messageText}
            </div>

            <div className="text-xs text-stone-500 space-y-1">
              <div>Timestamp: {new Date(selectedLog.timestamp).toLocaleString()}</div>
              <div>Status: {selectedLog.status.toUpperCase()}</div>
              <div>Direct URL Token Link: <span className="font-mono text-[11px] text-emerald-700">{selectedLog.directAccessUrl}</span></div>
              {selectedLog.errorMessage && (
                <div className="text-red-600 font-semibold">Error: {selectedLog.errorMessage}</div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-1.5 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
