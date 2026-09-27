import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  Laptop,
  QrCode,
  Share2,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AppApkModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppApkModal: React.FC<AppApkModalProps> = ({ isOpen, onClose }) => {
  const { directLoginUrl, companySettings } = useApp();
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'install' | 'apk' | 'share'>('install');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installStatus, setInstallStatus] = useState<'idle' | 'installing' | 'installed'>('idle');

  // Listen for browser PWA install event
  useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  if (!isOpen) return null;

  const handleInstallPwa = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setInstallStatus('installed');
      }
      setDeferredPrompt(null);
    } else {
      // Guide instructions for Android / iOS
      alert(
        'To install directly on Android:\n1. Tap the 3 dots menu (⋮) in Chrome.\n2. Tap "Install app" or "Add to Home screen".\n\nTo install on iPhone/iPad:\n1. Tap the Share button in Safari.\n2. Tap "Add to Home Screen".'
      );
    }
  };

  const copyUrl = () => {
    navigator.clipboard.writeText(directLoginUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const shareViaWhatsApp = () => {
    const msg = `👋 *Job Reminder — Team Portal Access*\n\nAccess your assigned jobs, log completion reports, and view tasks:\n🔗 ${directLoginUrl}\n\n👉 *Login allowed strictly with your registered Mobile Number or Gmail ID*.`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const downloadApkConfig = () => {
    const pwaConfig = {
      packageId: 'com.jobreminder.app',
      name: 'Job Reminder',
      shortName: 'JobReminder',
      description: 'Professional B2B SaaS job and reminder management system',
      startUrl: directLoginUrl,
      display: 'standalone',
      themeColor: '#059669',
      backgroundColor: '#ffffff',
      iconUrl: `${window.location.origin}/icon.svg`,
      generatedAt: new Date().toISOString(),
      instructions: 'Upload this package to PWABuilder.com or run with Bubblewrap CLI: npx @bubblewrap/cli build',
    };

    const blob = new Blob([JSON.stringify(pwaConfig, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'job-reminder-android-apk-manifest.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // QR Code generator URL using public standard API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    directLoginUrl
  )}&bgcolor=ffffff&color=059669&margin=6`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-5 border-b border-stone-200 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-stone-900 text-base">
                App APK &amp; Team Direct Login Link
              </h3>
              <p className="text-xs text-stone-500">
                Install as a mobile app or share login links with your field engineers
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

        {/* Navigation Tabs */}
        <div className="flex border-b border-stone-200 px-6 bg-stone-50/60 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('install')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'install'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Install on Android / iOS</span>
          </button>

          <button
            onClick={() => setActiveTab('share')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'share'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Direct Login Link &amp; QR</span>
          </button>

          <button
            onClick={() => setActiveTab('apk')}
            className={`py-3 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'apk'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-stone-500 hover:text-stone-800'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Standalone APK Build</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-5">
          {/* TAB 1: INSTALL APP DIRECTLY */}
          {activeTab === 'install' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-900 space-y-2">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Instant Mobile App Installation (WebAPK)</span>
                </div>
                <p>
                  Job Reminder is configured as a Progressive Web App (PWA). When installed, it behaves like a native Android APK: no browser URL bar, instant offline-ready access, and an app icon on your home screen.
                </p>
              </div>

              <div className="border border-stone-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <img src="/icon.svg" alt="App Icon" className="w-12 h-12 rounded-xl shadow-xs" />
                    <div>
                      <div className="font-bold text-stone-900 text-sm">Job Reminder</div>
                      <div className="text-xs text-stone-500">Version 1.2.0 • Field Operations Portal</div>
                    </div>
                  </div>
                  <button
                    onClick={handleInstallPwa}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Install App</span>
                  </button>
                </div>

                {/* Step by step guide */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-stone-100 text-xs text-stone-600">
                  <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                    <div className="font-semibold text-stone-900 flex items-center gap-1">
                      <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>On Android (Chrome / Edge)</span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Tap the 3 dots (⋮) in Chrome &gt; Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.
                    </p>
                  </div>
                  <div className="p-3 bg-stone-50 rounded-xl space-y-1">
                    <div className="font-semibold text-stone-900 flex items-center gap-1">
                      <Laptop className="w-3.5 h-3.5 text-emerald-600" />
                      <span>On iPhone / iPad (Safari)</span>
                    </div>
                    <p className="text-[11px] text-stone-500">
                      Tap the Share button in Safari &gt; Scroll and tap <strong>"Add to Home Screen"</strong>.
                    </p>
                  </div>
                </div>

                {/* Hindi Step-by-Step Instructions */}
                <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-200/80 text-xs space-y-1.5 text-emerald-950">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    <span>एंड्रॉइड फोन में ऐप इनस्टॉल करने का आसान तरीका:</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-900 font-medium">
                    <li>अपने Android फोन में Google Chrome ब्राउज़र में ऐप का लिंक खोलें।</li>
                    <li>ऊपर दाईं तरफ <strong>3 डॉट्स (⋮)</strong> के मेन्यू पर टैप करें।</li>
                    <li>मेन्यू में <strong>"Install app"</strong> (या <strong>"Add to Home screen"</strong>) पर क्लिक करें।</li>
                    <li>पॉपअप में <strong>"Install"</strong> दबाएं। ऐप आपके फोन की स्क्रीन पर ऐप आइकॉन बन जाएगा!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SHARE LOGIN LINK & QR CODE */}
          {activeTab === 'share' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-stone-50 border border-stone-200">
                <div className="bg-white p-2 rounded-xl shadow-xs border border-stone-200 shrink-0">
                  <img src={qrCodeUrl} alt="Direct Login QR Code" className="w-28 h-28" />
                </div>
                <div className="space-y-1.5 text-center sm:text-left">
                  <div className="text-xs font-bold uppercase tracking-wider text-stone-500">
                    Scan with Phone Camera
                  </div>
                  <h4 className="text-sm font-bold text-stone-900">Direct Team Login Portal</h4>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Field engineers can point their phone camera at this QR code to immediately open the login screen on their mobile device.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-600 mb-1">
                  Universal Direct Login Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={directLoginUrl}
                    className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-xl text-stone-800 font-mono select-all"
                  />
                  <button
                    onClick={copyUrl}
                    className="px-3 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <button
                onClick={shareViaWhatsApp}
                className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Share Direct Login Link via WhatsApp</span>
              </button>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Security Enforcement:</strong> Only team members whose mobile number or Gmail ID is registered in the Team Directory can log in through this link.
                </span>
              </div>
            </div>
          )}

          {/* TAB 3: STANDALONE APK BUILD */}
          {activeTab === 'apk' && (
            <div className="space-y-4 text-xs text-stone-700">
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
                <div className="font-bold text-stone-900 text-sm flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-emerald-600" />
                  <span>Build Standalone Android APK (.apk)</span>
                </div>
                <p className="text-stone-600 leading-relaxed">
                  You can package this web application into a standard signed <strong>.apk</strong> or <strong>.aab</strong> file for internal sideloading or MDM enterprise distribution:
                </p>
              </div>

              <div className="space-y-2.5">
                <div className="p-3 rounded-xl border border-stone-200 bg-white flex items-center justify-between">
                  <div>
                    <div className="font-bold text-stone-900">PWABuilder Android Export</div>
                    <div className="text-[11px] text-stone-500">
                      Generate ready-to-install signed APK in 30 seconds
                    </div>
                  </div>
                  <a
                    href={`https://www.pwabuilder.com/?url=${encodeURIComponent(directLoginUrl)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1"
                  >
                    <span>Generate APK</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="p-3 rounded-xl border border-stone-200 bg-white flex items-center justify-between">
                  <div>
                    <div className="font-bold text-stone-900">Download APK Manifest &amp; Config</div>
                    <div className="text-[11px] text-stone-500">
                      TWA configuration for Google Bubblewrap CLI
                    </div>
                  </div>
                  <button
                    onClick={downloadApkConfig}
                    className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download JSON</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-stone-200 hover:bg-stone-300 text-stone-800 text-xs font-semibold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
