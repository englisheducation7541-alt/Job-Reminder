import React, { useState, useEffect } from 'react';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  HardDrive,
  ShieldCheck,
  Smartphone,
  Laptop,
  ArrowRight,
  ExternalLink,
  Lock,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { GoogleDriveBackupInfo } from '../../types';

export const GoogleDriveBackupModal: React.FC = () => {
  const {
    isDriveModalOpen,
    setIsDriveModalOpen,
    googleDriveState,
    driveBackups,
    fetchDriveBackups,
    connectGoogleDrive,
    disconnectGoogleDrive,
    backupToGoogleDrive,
    restoreFromGoogleDrive,
    deleteFromGoogleDrive,
    toggleGoogleDriveAutoSync,
    companySettings,
    createAppBackup,
  } = useApp();

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [confirmRestoreId, setConfirmRestoreId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    if (isDriveModalOpen && googleDriveState.isConnected) {
      fetchDriveBackups().catch(() => {});
    }
  }, [isDriveModalOpen, googleDriveState.isConnected]);

  if (!isDriveModalOpen) return null;

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 6000);
  };

  const handleConnect = async () => {
    setActionLoading('connect');
    try {
      const res = await connectGoogleDrive();
      if (res.success) {
        showFeedback('success', `Google Drive successfully linked with ${res.email || 'account'}!`);
      } else {
        showFeedback('error', res.message);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleDisconnect = async () => {
    if (window.confirm('Are you sure you want to disconnect Google Drive? Auto-sync will pause on this device.')) {
      await disconnectGoogleDrive();
      showFeedback('success', 'Google Drive disconnected.');
    }
  };

  const handleBackupNow = async () => {
    setActionLoading('backup');
    try {
      const res = await backupToGoogleDrive(false);
      if (res.success) {
        showFeedback('success', res.message);
      } else {
        showFeedback('error', res.message);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmRestore = async (fileId: string) => {
    setActionLoading(`restore_${fileId}`);
    try {
      const res = await restoreFromGoogleDrive(fileId);
      if (res.success) {
        showFeedback('success', res.message);
        setConfirmRestoreId(null);
      } else {
        showFeedback('error', res.message);
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirmDelete = async (fileId: string) => {
    setActionLoading(`delete_${fileId}`);
    try {
      const res = await deleteFromGoogleDrive(fileId);
      if (res.success) {
        showFeedback('success', 'Backup removed from Google Drive.');
        setConfirmDeleteId(null);
      } else {
        showFeedback('error', res.message);
      }
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
              <Cloud className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-900 flex items-center gap-2">
                <span>Google Drive Backup &amp; Auto-Sync</span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  Cloud
                </span>
              </h2>
              <p className="text-xs text-stone-500">
                स्वचालित बैकअप और सभी डिवाइसों (फोन, लैपटॉप) पर सेम डेटा सिंक
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDriveModalOpen(false)}
            className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Feedback Message */}
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in duration-150 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
          )}

          {/* Account Connection Card */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {googleDriveState.isConnected ? (
                googleDriveState.userPhotoUrl ? (
                  <img
                    src={googleDriveState.userPhotoUrl}
                    alt="Google Avatar"
                    className="w-11 h-11 rounded-full border-2 border-emerald-500 shadow-2xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-sm border border-emerald-200">
                    {googleDriveState.userName ? googleDriveState.userName[0].toUpperCase() : 'G'}
                  </div>
                )
              ) : (
                <div className="w-11 h-11 rounded-full bg-stone-200 text-stone-600 flex items-center justify-center">
                  <Cloud className="w-5 h-5" />
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-stone-900 text-sm">
                    {googleDriveState.isConnected
                      ? googleDriveState.userName || 'Google Account Connected'
                      : 'Google Account Not Connected'}
                  </span>
                  {googleDriveState.isConnected ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Connected
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                      Offline
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-0.5 font-mono">
                  {googleDriveState.isConnected
                    ? googleDriveState.userEmail
                    : `Recommended: ${companySettings.email || 'Your Registered Gmail ID'}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {googleDriveState.isConnected ? (
                <button
                  onClick={handleDisconnect}
                  className="px-3 py-1.5 rounded-lg border border-stone-300 hover:bg-white text-stone-700 text-xs font-medium transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={actionLoading === 'connect'}
                  className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoading === 'connect' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.24 10.285V13.4h6.887C18.2 16.143 15.645 18 12.24 18c-3.326 0-6.024-2.698-6.024-6s2.698-6 6.024-6c1.474 0 2.817.537 3.86 1.424l2.457-2.457C16.993 3.498 14.77 2.6 12.24 2.6 7.05 2.6 2.84 6.81 2.84 12s4.21 9.4 9.4 9.4c5.42 0 9.02-3.81 9.02-9.18 0-.62-.06-1.22-.17-1.795H12.24z" />
                    </svg>
                  )}
                  <span>Sign in with Google</span>
                </button>
              )}
            </div>
          </div>

          {/* Auto-Sync Configuration & Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Auto-Sync Toggle Card */}
            <div className="p-4 rounded-xl border border-stone-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RefreshCw
                    className={`w-4 h-4 ${
                      googleDriveState.autoSyncEnabled ? 'text-emerald-600 animate-spin-slow' : 'text-stone-400'
                    }`}
                  />
                  <h3 className="font-bold text-stone-900 text-xs">Auto-Sync to Drive</h3>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={googleDriveState.autoSyncEnabled}
                    onChange={(e) => toggleGoogleDriveAutoSync(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <p className="text-[11px] text-stone-500 leading-relaxed">
                When enabled, changes to jobs, customers, and team records are automatically backed up to Google Drive every 5 minutes.
              </p>

              <div className="text-[10px] text-stone-400 pt-1 border-t border-stone-100 flex items-center justify-between">
                <span>Last Cloud Sync:</span>
                <span className="font-medium text-stone-600">
                  {googleDriveState.lastBackupTime
                    ? new Date(googleDriveState.lastBackupTime).toLocaleString()
                    : 'Never synced'}
                </span>
              </div>
            </div>

            {/* Quick Actions Card */}
            <div className="p-4 rounded-xl border border-stone-200 bg-white flex flex-col justify-between space-y-3">
              <div>
                <h3 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                  <HardDrive className="w-4 h-4 text-stone-700" />
                  <span>Manual Actions</span>
                </h3>
                <p className="text-[11px] text-stone-500 mt-1">
                  Create a manual snapshot or download local copy (.json).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleBackupNow}
                  disabled={actionLoading === 'backup' || !googleDriveState.isConnected}
                  className="flex-1 py-2 px-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {actionLoading === 'backup' ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Cloud className="w-3.5 h-3.5" />
                  )}
                  <span>Backup to Drive</span>
                </button>

                <button
                  onClick={createAppBackup}
                  className="py-2 px-2.5 rounded-lg border border-stone-300 hover:bg-stone-50 text-stone-700 text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                  title="Download .json file to device"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .json</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cross-Device Sync Explanation Banner */}
          <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/60 flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
              <Laptop className="w-4 h-4" />
            </div>
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-blue-900">
                Cross-Device Profile &amp; Data Synchronization (डिवाइस सिंकिंग)
              </h4>
              <p className="text-blue-800/90 leading-relaxed text-[11px]">
                जिस कंपनी प्रोफाइल में जो Gmail ID रजिस्टर है (e.g. <strong>{companySettings.email || 'englisheducation7541@gmail.com'}</strong>),
                उसी Gmail ID से आप किसी भी अन्य फोन, कंप्यूटर या टैबलेट पर "Sign in with Google" करेंगे तो पूरा डेटा (Jobs, Clients, Team) तुरंत अपने-आप लोड और सिंक हो जाएगा।
              </p>
            </div>
          </div>

          {/* Backups List on Google Drive */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-stone-900 text-xs flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-stone-700" />
                <span>Existing Backups on Google Drive ({driveBackups.length})</span>
              </h3>
              {googleDriveState.isConnected && (
                <button
                  onClick={() => fetchDriveBackups()}
                  className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${googleDriveState.isSyncing ? 'animate-spin' : ''}`} />
                  <span>Refresh</span>
                </button>
              )}
            </div>

            {!googleDriveState.isConnected ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50">
                <Cloud className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs text-stone-600 font-medium">Google Drive is not connected yet.</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Sign in with Google to view and restore backups stored in your cloud storage.
                </p>
              </div>
            ) : driveBackups.length === 0 ? (
              <div className="p-6 text-center rounded-xl border border-dashed border-stone-200 bg-stone-50/50">
                <HardDrive className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p className="text-xs text-stone-600 font-medium">No backups found in Google Drive.</p>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Click "Backup to Drive" above to create your first cloud snapshot.
                </p>
              </div>
            ) : (
              <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100">
                {driveBackups.map((item) => (
                  <div key={item.id} className="p-3.5 hover:bg-stone-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-900 text-xs font-mono">{item.name}</span>
                        {item.name.includes('Latest_Sync') && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm bg-emerald-100 text-emerald-800">
                            Auto-Sync
                          </span>
                        )}
                        {item.size && <span className="text-[10px] text-stone-400">({item.size})</span>}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-stone-500">
                        <span>{new Date(item.modifiedTime || item.createdTime).toLocaleString()}</span>
                        {item.recordCounts && (
                          <span className="text-stone-600 font-medium">
                            • {item.recordCounts.jobs} Jobs • {item.recordCounts.users} Team • {item.recordCounts.customers} Clients
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons with User Confirmation Dialogs */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {confirmRestoreId === item.id ? (
                        <div className="flex items-center gap-1.5 bg-amber-50 p-1.5 rounded-lg border border-amber-200">
                          <span className="text-[10px] font-semibold text-amber-900">Restore this?</span>
                          <button
                            onClick={() => handleConfirmRestore(item.id)}
                            disabled={actionLoading === `restore_${item.id}`}
                            className="px-2 py-1 rounded bg-amber-600 text-white text-[10px] font-bold hover:bg-amber-700 cursor-pointer"
                          >
                            Yes
                          </button>
                          <button
                            onClick={() => setConfirmRestoreId(null)}
                            className="px-2 py-1 rounded bg-stone-200 text-stone-700 text-[10px] hover:bg-stone-300 cursor-pointer"
                          >
                            No
                          </button>
                        </div>
                      ) : confirmDeleteId === item.id ? (
                        <div className="flex items-center gap-1.5 bg-red-50 p-1.5 rounded-lg border border-red-200">
                          <span className="text-[10px] font-semibold text-red-900">Delete permanently?</span>
                          <button
                            onClick={() => handleConfirmDelete(item.id)}
                            disabled={actionLoading === `delete_${item.id}`}
                            className="px-2 py-1 rounded bg-red-600 text-white text-[10px] font-bold hover:bg-red-700 cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded bg-stone-200 text-stone-700 text-[10px] hover:bg-stone-300 cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => setConfirmRestoreId(item.id)}
                            className="px-2.5 py-1.5 rounded-lg border border-emerald-300 hover:bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Restore this backup"
                          >
                            <Upload className="w-3 h-3 text-emerald-600" />
                            <span>Restore</span>
                          </button>

                          <button
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="p-1.5 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete backup"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-stone-100 bg-stone-50/50 text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-stone-400" />
            <span>Encrypted &amp; private in your Google account</span>
          </div>
          <button
            onClick={() => setIsDriveModalOpen(false)}
            className="px-4 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
