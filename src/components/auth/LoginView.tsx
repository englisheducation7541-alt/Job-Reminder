import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Cloud,
  Copy,
  Eye,
  EyeOff,
  HelpCircle,
  KeyRound,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Radio,
  Send,
  Shield,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import { ForgotPasswordModal } from './ForgotPasswordModal';

export const LoginView: React.FC = () => {
  const {
    loginWithIdentifier,
    loginWithGoogleOAuth,
    directLoginUrl,
    setIsApkModalOpen,
    triggerManualSync,
    syncStatus,
    lastSyncedAt,
    companySettings,
  } = useApp();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [successUser, setSuccessUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);

  // Cross-device Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsGoogleLoading(true);
    try {
      const result = await loginWithGoogleOAuth();
      if (result.success && result.user) {
        setSuccessUser(result.user);
      } else {
        setErrorMessage(result.message);
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in encountered an issue.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  // Pre-fill from URL query params if provided
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const prefillId =
      params.get('email') ||
      params.get('mobile') ||
      params.get('phone') ||
      params.get('identifier');
    if (prefillId) {
      setIdentifier(prefillId);
    }
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    if (!cleanId) {
      setErrorMessage('Please enter your registered Gmail ID or Mobile Number.');
      return;
    }

    if (!cleanPass) {
      setErrorMessage('Please enter your account password.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    // Pull latest synchronized accounts and data from cloud server before verifying
    try {
      await triggerManualSync();
    } catch {
      // proceed with cached accounts if server check fails
    }

    const result = await loginWithIdentifier(cleanId, cleanPass);
    setIsLoading(false);

    if (result.success && result.user) {
      setSuccessUser(result.user);
    } else {
      setErrorMessage(result.message);
    }
  };

  const copyDirectLink = () => {
    navigator.clipboard.writeText(directLoginUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white shadow-lg shadow-emerald-700/20 ring-4 ring-emerald-600/20 mb-3 animate-in fade-in zoom-in-90 duration-300">
          <Wrench className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black tracking-tight text-stone-900 sm:text-3xl">
          Job Reminder
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-stone-600 font-medium">
          Operations, Field Service &amp; WhatsApp Reminder System
        </p>
      </div>

      {/* Main Login Card with Animated Entry */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-3xl border border-stone-200/90 space-y-6 transition-all animate-in fade-in slide-in-from-bottom-6 duration-300">
          {/* Security Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/90 border border-emerald-200/80 flex items-start gap-3 text-xs text-emerald-900 shadow-xs">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-bold block text-emerald-950">
                Authorized Access Only
              </strong>
              <span>
                Please enter your <strong>registered Gmail ID or Mobile Number</strong> along with your profile password.
              </span>
              <div className="flex items-center gap-1.5 mt-1.5 text-[11px] text-emerald-700 font-medium">
                <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Live Cloud Synced &bull; Same data across Laptop, Mobile &amp; Tablet</span>
              </div>
            </div>
          </div>

          {/* Success Transition */}
          {successUser ? (
            <div className="p-6 rounded-2xl bg-emerald-600 text-white text-center space-y-3 animate-in fade-in zoom-in-95 duration-250">
              <div className="w-12 h-12 rounded-full bg-white/20 mx-auto flex items-center justify-center">
                <Check className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">Welcome, {successUser.name}!</h3>
                <p className="text-xs text-emerald-100 mt-1">
                  Role: <span className="font-semibold uppercase">{successUser.role}</span> &bull; {successUser.designation}
                </p>
              </div>
              <p className="text-[11px] text-emerald-200 animate-pulse">
                Redirecting securely to your workspace...
              </p>
            </div>
          ) : (
            /* Login Form */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {/* Field 1: Gmail ID or Mobile Number */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-stone-700 mb-1.5">
                  Gmail ID or Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    {identifier.includes('@') ? (
                      <Mail className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Phone className="w-4 h-4 text-emerald-600" />
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="e.g. yourname@gmail.com or 9876543210"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="block w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-stone-50/50 hover:bg-white focus:bg-white"
                  />
                </div>
              </div>

              {/* Field 2: Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-stone-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPasswordModal(true)}
                    className="text-xs text-emerald-600 hover:text-emerald-800 font-semibold hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your profile password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="block w-full pl-10 pr-11 py-3 rounded-xl border border-stone-200 text-stone-900 placeholder-stone-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-stone-50/50 hover:bg-white focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Reset Success Box */}
              {resetSuccessMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5 animate-in fade-in duration-150">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{resetSuccessMessage}</span>
                </div>
              )}

              {/* Error Message Box */}
              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5 animate-in fade-in duration-150">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed font-medium">{errorMessage}</span>
                </div>
              )}

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={isLoading || isGoogleLoading}
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Verifying Credentials...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Workspace</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Or Divider */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-stone-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                  Or
                </span>
                <div className="border-t border-stone-200 w-full"></div>
              </div>

              {/* Official Google Sign-In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isGoogleLoading || isLoading}
                className="w-full py-3 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 active:bg-stone-100 text-stone-700 text-sm font-bold flex items-center justify-center gap-3 shadow-2xs hover:shadow-xs transition-all cursor-pointer disabled:opacity-50"
              >
                {isGoogleLoading ? (
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Sign in with Google</span>
              </button>

              <div className="p-2.5 rounded-xl bg-stone-50 border border-stone-200/80 text-[11px] text-stone-600 text-center leading-relaxed">
                <span>
                  Same Gmail ID (<strong>{companySettings.email || 'englisheducation7541@gmail.com'}</strong>) se kisi bhi mobile ya laptop par login karne par sabhi devices par pura live data sync hoga.
                </span>
              </div>
            </form>
          )}

          {/* Share Team Link & APK trigger */}
          <div className="pt-4 border-t border-stone-100 flex items-center justify-between gap-2 text-xs">
            <button
              type="button"
              onClick={copyDirectLink}
              className="px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 text-stone-600 font-medium flex items-center gap-1.5 cursor-pointer"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Link Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Login Link</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsApkModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-medium flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Get Mobile APK</span>
            </button>
          </div>
        </div>
      </div>

      {/* Business Highlights & Information Below */}
      <div className="mt-8 max-w-4xl mx-auto w-full px-2 sm:px-4">
        <div className="text-center mb-4">
          <span className="text-[11px] font-bold uppercase tracking-widest text-stone-500">
            Enterprise Field Operations System
          </span>
          <h2 className="text-sm sm:text-base font-bold text-stone-800 mt-0.5">
            Engineered for Industrial Maintenance, Client Sites &amp; Real-time WhatsApp Dispatch
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1 */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Zap className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-stone-900">
              Field Service Dispatch
            </h3>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Real-time job scheduling, breakdown ticket allocation, and technician dispatch with GPS coordinates.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-stone-900">
              WhatsApp Reminders
            </h3>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Automated notifications to technicians with 1-click token links for immediate on-site job updates.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-stone-900">
              SLA &amp; Overdue Engine
            </h3>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              Automated detection of delayed tasks with tiered management escalations to guarantee service delivery.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-4 rounded-2xl bg-white border border-stone-200/90 shadow-xs space-y-1.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <Shield className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-stone-900">
              Zero-Data Loss Guarantee
            </h3>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              All client profiles, service logs, and maintenance histories are permanently secured until manually deleted.
            </p>
          </div>
        </div>

        <p className="text-center text-[11px] text-stone-400 mt-6 font-medium">
          Strict Role-Based Authentication &bull; Secure Corporate Cloud &bull; Real-time Field Sync
        </p>
      </div>

      {/* Forgot Password OTP Verification & Reset Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        onPasswordResetSuccess={(resetId) => {
          setIdentifier(resetId);
          setResetSuccessMessage('Password reset successfully! You can now log in with your new password.');
          setErrorMessage(null);
        }}
      />
    </div>
  );
};
