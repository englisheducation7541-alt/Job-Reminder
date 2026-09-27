import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Mail,
  Phone,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPasswordResetSuccess: (identifier: string) => void;
}

type ResetStep = 'request_otp' | 'verify_otp' | 'set_password' | 'done';

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  onPasswordResetSuccess,
}) => {
  const { sendPasswordResetOtp, verifyPasswordResetOtp, resetPasswordWithToken } = useApp();

  const [step, setStep] = useState<ResetStep>('request_otp');
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [maskedDestination, setMaskedDestination] = useState('');
  const [testOtp, setTestOtp] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState('');
  const [countdown, setCountdown] = useState(60);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: any;
    if (step === 'verify_otp' && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  if (!isOpen) return null;

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMessage('Please enter your registered Gmail ID or Mobile Number.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const result = await sendPasswordResetOtp(cleanId);
    setIsLoading(false);

    if (result.success && result.sessionId) {
      setSessionId(result.sessionId);
      setMaskedDestination(result.maskedDestination || cleanId);
      if (result.testOtp) {
        setTestOtp(result.testOtp);
      }
      setCountdown(60);
      setStep('verify_otp');
      setSuccessMessage('OTP has been dispatched to your registered address.');
    } else {
      setErrorMessage(result.message || 'No account found with this Gmail or Mobile number.');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanOtp = otp.trim();
    if (!cleanOtp) {
      setErrorMessage('Please enter the 6-digit OTP code.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const result = await verifyPasswordResetOtp(sessionId, cleanOtp);
    setIsLoading(false);

    if (result.success && result.resetToken) {
      setResetToken(result.resetToken);
      setStep('set_password');
      setSuccessMessage('OTP verified successfully! Now set your new password.');
    } else {
      setErrorMessage(result.message || 'Invalid OTP code. Please try again.');
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0 || isLoading) return;
    setErrorMessage(null);
    setIsLoading(true);
    const result = await sendPasswordResetOtp(identifier.trim());
    setIsLoading(false);
    if (result.success && result.sessionId) {
      setSessionId(result.sessionId);
      if (result.testOtp) setTestOtp(result.testOtp);
      setCountdown(60);
      setSuccessMessage('A fresh OTP has been sent.');
    } else {
      setErrorMessage(result.message || 'Failed to resend OTP. Please try again.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPass = newPassword.trim();
    const cleanConfirm = confirmPassword.trim();

    if (!cleanPass) {
      setErrorMessage('Please enter a new password.');
      return;
    }

    if (cleanPass.length < 4) {
      setErrorMessage('Password must be at least 4 characters long.');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setErrorMessage('Passwords do not match. Please recheck.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    const result = await resetPasswordWithToken(resetToken, cleanPass);
    setIsLoading(false);

    if (result.success) {
      setStep('done');
      setTimeout(() => {
        onPasswordResetSuccess(identifier.trim());
        onClose();
      }, 1600);
    } else {
      setErrorMessage(result.message || 'Failed to reset password. Please try again.');
    }
  };

  const handleClose = () => {
    // Reset local state on close
    setStep('request_otp');
    setIdentifier('');
    setOtp('');
    setErrorMessage(null);
    setSuccessMessage(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-white">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Reset Account Password</h3>
              <p className="text-[11px] text-emerald-100">
                {step === 'request_otp' && 'Step 1 of 3: Registered Verification'}
                {step === 'verify_otp' && 'Step 2 of 3: Enter Verification OTP'}
                {step === 'set_password' && 'Step 3 of 3: Set New Password'}
                {step === 'done' && 'Password Updated!'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/20 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {/* Progress Indicators */}
          <div className="flex items-center gap-1.5 pb-1">
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                ['request_otp', 'verify_otp', 'set_password', 'done'].includes(step)
                  ? 'bg-emerald-600'
                  : 'bg-stone-200'
              }`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                ['verify_otp', 'set_password', 'done'].includes(step)
                  ? 'bg-emerald-600'
                  : 'bg-stone-200'
              }`}
            />
            <div
              className={`h-1.5 flex-1 rounded-full transition-colors ${
                ['set_password', 'done'].includes(step) ? 'bg-emerald-600' : 'bg-stone-200'
              }`}
            />
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed font-medium">{errorMessage}</span>
            </div>
          )}

          {successMessage && step !== 'done' && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-medium">{successMessage}</span>
            </div>
          )}

          {/* Step 1: Request OTP */}
          {step === 'request_otp' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                  Enter Registered Gmail ID or Mobile Number <span className="text-red-500">*</span>
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
                    autoFocus
                    placeholder="e.g. yourname@gmail.com or 9811122334"
                    value={identifier}
                    onChange={(e) => {
                      setIdentifier(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs text-stone-900 bg-stone-50/50 hover:bg-white focus:bg-white"
                  />
                </div>
                <p className="text-[11px] text-stone-500 mt-1.5 leading-relaxed">
                  Only registered employee and supervisor profiles in the system can receive password recovery OTPs.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/90 text-[11px] text-stone-600 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  A 6-digit verification code will be dispatched immediately to your registered Gmail and WhatsApp number.
                </span>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Record...</span>
                    </>
                  ) : (
                    <>
                      <span>Send Verification OTP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 2: Verify OTP */}
          {step === 'verify_otp' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Enter 6-Digit Verification OTP <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setStep('request_otp');
                      setErrorMessage(null);
                    }}
                    className="text-[11px] text-emerald-600 hover:text-emerald-800 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <ArrowLeft className="w-3 h-3" />
                    <span>Change ID</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-900 mb-3 flex items-center justify-between">
                  <span>Sent to: <strong className="font-mono text-emerald-950">{maskedDestination}</strong></span>
                  <span className="text-emerald-700 font-medium">Valid for 10 min</span>
                </div>

                {/* Developer / Sandbox helper banner for instant testing */}
                {testOtp && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>OTP Code: <strong className="font-mono text-xs tracking-wider font-bold text-amber-950">{testOtp}</strong></span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setOtp(testOtp)}
                      className="px-2 py-0.5 rounded bg-amber-200/80 hover:bg-amber-300 text-amber-900 font-bold text-[10px] cursor-pointer"
                    >
                      Fill OTP
                    </button>
                  </div>
                )}

                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => {
                      setOtp(e.target.value.replace(/[^0-9]/g, ''));
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full text-center tracking-[0.4em] font-mono text-lg font-bold py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-stone-900 bg-white"
                  />
                </div>

                <div className="flex items-center justify-between mt-2 text-[11px]">
                  <span className="text-stone-500 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    {countdown > 0 ? `Resend code in ${countdown}s` : 'Code expired?'}
                  </span>
                  <button
                    type="button"
                    disabled={countdown > 0 || isLoading}
                    onClick={handleResendOtp}
                    className="text-emerald-700 hover:text-emerald-900 font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Resend OTP</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setStep('request_otp')}
                  className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading || otp.trim().length < 4}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying Code...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Verify &amp; Continue</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Set New Password */}
          {step === 'set_password' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoFocus
                    placeholder="Enter new password (min 4 chars)"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs text-stone-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Lock className="w-4 h-4 text-emerald-600" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter your new password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-xs text-stone-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <p className="text-[11px] text-stone-500">
                Make sure your new password is secure. You will use this password alongside your registered Gmail or mobile number to log in.
              </p>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Updating Password...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Set New Password</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Done */}
          {step === 'done' && (
            <div className="py-6 text-center space-y-3 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                <Check className="w-8 h-8 stroke-[3]" />
              </div>
              <h4 className="text-base font-bold text-stone-900">Password Reset Successfully!</h4>
              <p className="text-xs text-stone-600 max-w-xs mx-auto">
                Your new password is now active. Returning to the sign-in screen...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
