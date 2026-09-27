import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  FileSpreadsheet,
  FileCode,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  HardDrive,
  Cloud,
  Laptop,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DataBackupCard: React.FC = () => {
  const {
    currentUser,
    exportAppState,
    createAppBackup,
    restoreAppBackup,
    googleDriveState,
    connectGoogleDrive,
    backupToGoogleDrive,
    toggleGoogleDriveAutoSync,
    setIsDriveModalOpen,
    companySettings,
  } = useApp();
  const [restoreStatus, setRestoreStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });
  const [driveActionLoading, setDriveActionLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // STRICT ACCESS CHECK: Only admin can view or use Data Management
  if (currentUser.role !== 'admin') {
    return null;
  }

  const handleExportJson = () => {
    exportAppState('json');
  };

  const handleExportCsv = () => {
    exportAppState('excel_csv');
  };

  const handleFullBackup = () => {
    createAppBackup();
  };

  const handleDriveBackup = async () => {
    setDriveActionLoading(true);
    try {
      const res = await backupToGoogleDrive(false);
      setRestoreStatus({
        type: res.success ? 'success' : 'error',
        message: res.message,
      });
      setTimeout(() => setRestoreStatus({ type: 'idle', message: '' }), 5000);
    } finally {
      setDriveActionLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      if (!window.confirm('Caution: Restoring a backup will overwrite current system data with the backup snapshot. Do you wish to continue?')) {
        if (e.target) e.target.value = '';
        return;
      }

      const result = restoreAppBackup(content);
      if (result.success) {
        setRestoreStatus({
          type: 'success',
          message: result.message || 'System data successfully restored from backup snapshot.',
        });
      } else {
        setRestoreStatus({
          type: 'error',
          message: result.message || 'Failed to restore backup. Invalid format.',
        });
      }
      setTimeout(() => setRestoreStatus({ type: 'idle', message: '' }), 5000);
    };

    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  return (
    <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stone-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-stone-900 text-sm">
              Data Management, Google Drive &amp; Backup
            </h2>
            <p className="text-[11px] text-stone-500">
              Admin tools for cloud auto-sync, Google Drive backups, and cross-device recovery.
            </p>
          </div>
        </div>

        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 self-start sm:self-auto">
          <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
          <span>Admin Only</span>
        </span>
      </div>

      {/* Google Drive Featured Card */}
      <div className="p-5 rounded-2xl border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-50/50 via-white to-stone-50 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-stone-900 text-sm">Google Drive Cloud Auto-Sync &amp; Backup</h3>
                {googleDriveState.isConnected ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Connected
                  </span>
                ) : (
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-stone-200 text-stone-600">
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs text-stone-500 mt-0.5">
                {googleDriveState.isConnected ? (
                  <>
                    Account: <span className="font-mono font-medium text-stone-700">{googleDriveState.userEmail}</span>
                  </>
                ) : (
                  `Auto-backup jobs and team data to your registered Google Drive (${companySettings.email || 'englisheducation7541@gmail.com'})`
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            {googleDriveState.isConnected ? (
              <button
                onClick={() => setIsDriveModalOpen(true)}
                className="px-3 py-1.5 rounded-xl border border-stone-300 hover:bg-white text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Manage Drive Backups</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => connectGoogleDrive()}
                className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
              >
                <Cloud className="w-3.5 h-3.5" />
                <span>Connect Google Drive</span>
              </button>
            )}
          </div>
        </div>

        {/* Sync Controls & Info */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-emerald-100/60">
          <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-stone-200/80">
            <div>
              <div className="text-xs font-bold text-stone-800">Auto-Sync to Drive</div>
              <div className="text-[10px] text-stone-400">Syncs changes automatically</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={googleDriveState.autoSyncEnabled}
                onChange={(e) => toggleGoogleDriveAutoSync(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-stone-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          <div className="p-3 rounded-xl bg-white border border-stone-200/80 flex flex-col justify-between">
            <span className="text-[10px] text-stone-400">Last Drive Backup</span>
            <span className="text-xs font-medium text-stone-700 mt-1">
              {googleDriveState.lastBackupTime
                ? new Date(googleDriveState.lastBackupTime).toLocaleString()
                : 'Not backed up yet'}
            </span>
          </div>

          <div className="flex items-center">
            <button
              onClick={handleDriveBackup}
              disabled={driveActionLoading}
              className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${driveActionLoading ? 'animate-spin' : ''}`} />
              <span>{driveActionLoading ? 'Saving...' : 'Backup to Drive Now'}</span>
            </button>
          </div>
        </div>

        {/* Cross-device info banner */}
        <div className="flex items-start gap-2 p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/60 text-[11px] text-emerald-900">
          <Laptop className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <span>
            <strong>Cross-Device Sync:</strong> किसी भी डिवाइस पर <strong>{companySettings.email || 'englisheducation7541@gmail.com'}</strong> से लॉगिन करने पर गूगल ड्राइव और सेंट्रल सर्वर से सेम डेटा स्वतः लोड हो जाएगा।
          </span>
        </div>
      </div>

      {/* Status Banner */}
      {restoreStatus.type !== 'idle' && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
            restoreStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {restoreStatus.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{restoreStatus.message}</span>
        </div>
      )}

      {/* Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 1. Full Backup */}
        <div className="p-4 rounded-xl border border-stone-200/90 bg-stone-50/50 flex flex-col justify-between space-y-3">
          <div>
            <div className="w-7 h-7 rounded-lg bg-stone-900 text-white flex items-center justify-center mb-2">
              <HardDrive className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-stone-900 text-xs">Download Local (.json)</h3>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
              Creates a local timestamped snapshot file of jobs, users, templates, and company profile.
            </p>
          </div>

          <button
            onClick={handleFullBackup}
            className="w-full py-2 px-3 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Backup (.json)</span>
          </button>
        </div>

        {/* 2. Export CSV / Excel */}
        <div className="p-4 rounded-xl border border-stone-200/90 bg-stone-50/50 flex flex-col justify-between space-y-3">
          <div>
            <div className="w-7 h-7 rounded-lg bg-emerald-700 text-white flex items-center justify-center mb-2">
              <FileSpreadsheet className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-stone-900 text-xs">Export Data (CSV / Excel)</h3>
            <p className="text-[11px] text-stone-500 mt-1 leading-relaxed">
              Downloads human-readable tables for all jobs, employees, and client sites ready for Excel.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              className="flex-1 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>CSV (Excel)</span>
            </button>
            <button
              onClick={handleExportJson}
              className="py-2 px-2.5 rounded-xl border border-stone-300 hover:bg-white text-stone-700 text-xs font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer"
              title="Export raw JSON"
            >
              <FileCode className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* 3. Import & Restore */}
        <div className="p-4 rounded-xl border border-amber-200/80 bg-amber-50/30 flex flex-col justify-between space-y-3">
          <div>
            <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center mb-2">
              <Upload className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-stone-900 text-xs">Import Local Backup</h3>
            <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
              Restore previously saved backup snapshot from your phone or PC disk.
            </p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full py-2 px-3 rounded-xl border border-amber-300 bg-white hover:bg-amber-50 text-amber-900 text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-amber-600" />
            <span>Select File to Restore</span>
          </button>
        </div>
      </div>
    </div>
  );
};

