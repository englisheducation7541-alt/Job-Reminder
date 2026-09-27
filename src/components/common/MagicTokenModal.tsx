import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  Copy,
  ExternalLink,
  Key,
  Lock,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Smartphone,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { generateDirectAccessUrl } from '../../utils/whatsappEngine';

interface MagicTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MagicTokenModal: React.FC<MagicTokenModalProps> = ({ isOpen, onClose }) => {
  const { users, jobs, switchUser, setSelectedJobId, setActiveTab } = useApp();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const engineers = users.filter((u) => u.role === 'engineer');

  const handleSimulateDirectClick = (userId: string, jobId: string) => {
    switchUser(userId);
    const targetJob = jobs.find((j) => j.jobId === jobId || j.id === jobId);
    if (targetJob) {
      setSelectedJobId(targetJob.id);
    }
    setActiveTab('my_jobs');
    onClose();
  };

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                Secure 1-Click WhatsApp Direct Authentication
              </h3>
              <p className="text-xs text-stone-500">
                How field engineers bypass logins &amp; open assigned jobs directly from WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Explanation Box */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 text-xs leading-relaxed text-stone-700 space-y-2">
            <div className="font-semibold text-stone-900 flex items-center gap-1.5 text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Zero-Friction Authentication Architecture</span>
            </div>
            <p>
              When a job is assigned or a WhatsApp reminder is triggered, our system automatically embeds a
              <strong> cryptographic access token</strong> in the message link.
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-stone-200 font-mono text-[11px] text-emerald-800 break-all select-all">
              https://jobreminder.app/?token=token_rahul_eng91x&amp;jobId=JR-2026-0101
            </div>
            <p className="text-stone-500 text-[11px]">
              Upon clicking on mobile WhatsApp, the app verifies the token against the employee record,
              instantly creates an authenticated session, and routes the engineer straight to the job's
              acceptance/start screen with no login credentials required.
            </p>
          </div>

          {/* Test Action Links */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
              Interactive Simulation: Test Direct Token Links
            </div>

            <div className="grid gap-3">
              {engineers.map((engineer) => {
                const assignedJobs = jobs.filter((j) => j.assignedToId === engineer.id);
                const sampleJob = assignedJobs[0] || jobs[0];
                const tokenUrl = generateDirectAccessUrl(engineer, sampleJob);

                return (
                  <div
                    key={engineer.id}
                    className="p-3.5 rounded-xl border border-stone-200 hover:border-emerald-300 bg-white hover:bg-emerald-50/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={engineer.avatar}
                        alt={engineer.name}
                        className="w-10 h-10 rounded-lg object-cover ring-1 ring-stone-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-stone-900 text-xs flex items-center gap-2">
                          <span>{engineer.name}</span>
                          <span className="text-[10px] font-normal text-stone-500">
                            ({engineer.designation})
                          </span>
                        </div>
                        <div className="text-[11px] text-emerald-700 font-medium">
                          Assigned Target Job: <strong>{sampleJob.jobId}</strong> — {sampleJob.title}
                        </div>
                        <div className="text-[10px] text-stone-400 font-mono">
                          Token: {engineer.secureToken}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        onClick={() => copyUrl(tokenUrl, engineer.id)}
                        className="p-2 rounded-lg border border-stone-200 hover:bg-stone-100 text-stone-600 text-xs font-medium cursor-pointer flex items-center gap-1"
                        title="Copy direct token URL"
                      >
                        {copiedId === engineer.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-[11px] text-emerald-600 font-semibold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span className="text-[11px]">Copy Link</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleSimulateDirectClick(engineer.id, sampleJob.jobId)}
                        className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span>Simulate 1-Click Login</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold cursor-pointer"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
