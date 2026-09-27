import React, { useState, useRef } from 'react';
import {
  Briefcase,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Edit2,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Lock,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  Send,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { User, UserRole } from '../../types';
import { generateDirectAccessUrl, generateLoginUrl, generateProfileAccessUrl } from '../../utils/whatsappEngine';
import { compressImageFile } from '../../utils/imageCompressor';

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
];

export const UserProfileModal: React.FC = () => {
  const {
    isProfileModalOpen,
    setIsProfileModalOpen,
    viewUserProfile,
    currentUser,
    updateUser,
    setUserPasswordByAdmin,
    openBulkJobReminders,
    jobs,
    setSelectedJobId,
    setActiveTab,
  } = useApp();

  const [isEditing, setIsEditing] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Admin password reset state
  const [isAdminResetOpen, setIsAdminResetOpen] = useState(false);
  const [adminNewPass, setAdminNewPass] = useState('');
  const [adminResetFeedback, setAdminResetFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isResettingPass, setIsResettingPass] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

  const targetUser = viewUserProfile || currentUser;

  const [form, setForm] = useState({
    name: targetUser.name,
    designation: targetUser.designation,
    department: targetUser.department || 'Field Engineering & Services',
    whatsapp: targetUser.whatsapp,
    mobile: targetUser.mobile,
    email: targetUser.email,
    avatar: targetUser.avatar,
    employeeId: targetUser.employeeId,
    password: targetUser.password || (targetUser.role === 'admin' ? 'admin123' : 'service123'),
  });

  const [showViewPassword, setShowViewPassword] = useState(false);

  // Sync state if user changes
  React.useEffect(() => {
    if (targetUser) {
      setForm({
        name: targetUser.name,
        designation: targetUser.designation,
        department: targetUser.department || 'Field Engineering & Services',
        whatsapp: targetUser.whatsapp,
        mobile: targetUser.mobile,
        email: targetUser.email,
        avatar: targetUser.avatar,
        employeeId: targetUser.employeeId,
        password: targetUser.password || (targetUser.role === 'admin' ? 'admin123' : 'service123'),
      });
      setIsEditing(false);
    }
  }, [targetUser, isProfileModalOpen]);

  if (!isProfileModalOpen || !targetUser) return null;

  const userJobs = jobs.filter((j) => j.assignedToId === targetUser.id);
  const activeJobs = userJobs.filter((j) => !['completed', 'cancelled'].includes(j.status));
  const completedJobs = userJobs.filter((j) => j.status === 'completed');
  const overdueJobs = userJobs.filter((j) => j.status === 'overdue');

  const directJobLink = generateDirectAccessUrl(targetUser, activeJobs[0] || jobs[0]);
  const directProfileLink = generateProfileAccessUrl(targetUser);

  const handleCopyLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const compressed = await compressImageFile(file, 300, 300, 0.85);
      setForm((prev) => ({ ...prev, avatar: compressed }));
      updateUser(targetUser.id, { avatar: compressed });
    } catch (err: any) {
      console.error('Error compressing profile photo:', err);
    } finally {
      setIsUploadingPhoto(false);
      if (photoInputRef.current) photoInputRef.current.value = '';
    }
  };

  const handleAdminResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = adminNewPass.trim();
    if (clean.length < 4) {
      setAdminResetFeedback({ type: 'error', text: 'Password must be at least 4 characters long.' });
      return;
    }

    setIsResettingPass(true);
    setAdminResetFeedback(null);

    const result = await setUserPasswordByAdmin(targetUser.id, clean);
    setIsResettingPass(false);

    if (result.success) {
      setAdminResetFeedback({
        type: 'success',
        text: `Password successfully updated to: ${clean}`,
      });
      setForm((prev) => ({ ...prev, password: clean }));
    } else {
      setAdminResetFeedback({
        type: 'error',
        text: result.message || 'Failed to update employee password.',
      });
    }
  };

  const generateRandomPassword = () => {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
    let rand = '';
    for (let i = 0; i < 4; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const newPass = `pass#${rand}`;
    setAdminNewPass(newPass);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUser(targetUser.id, {
      name: form.name.trim(),
      designation: form.designation.trim(),
      department: form.department.trim(),
      whatsapp: form.whatsapp.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      avatar: form.avatar,
      employeeId: form.employeeId.trim(),
      password: form.password.trim() || targetUser.password || 'service123',
    });
    setSaveSuccess(true);
    setIsEditing(false);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-stone-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-stone-200 bg-gradient-to-r from-emerald-50 via-teal-50/50 to-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-600/20">
              <UserIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-stone-900">
                  {targetUser.id === currentUser.id ? 'My Personal Profile' : `${targetUser.name}'s Profile`}
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${
                    targetUser.role === 'admin'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : targetUser.role === 'manager'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}
                >
                  {targetUser.role}
                </span>
              </div>
              <p className="text-xs text-stone-500">
                Employee details, registered WhatsApp contact &amp; direct 1-click access token
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {['admin', 'manager', 'director'].includes(currentUser.role) && activeJobs.length > 0 && (
              <button
                type="button"
                onClick={() => openBulkJobReminders(targetUser.id)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
                title={`Send WhatsApp reminders for all ${activeJobs.length} active jobs assigned to ${targetUser.name}`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>Remind ({activeJobs.length})</span>
              </button>
            )}

            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-stone-600" />
                <span>Edit Profile</span>
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="px-3 py-1.5 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
            )}
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {saveSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Profile details updated successfully!</span>
            </div>
          )}

          {/* User Profile Card */}
          <div className="p-5 rounded-2xl bg-stone-50 border border-stone-200 flex flex-col sm:flex-row items-center sm:items-start gap-5">
            <div className="relative group shrink-0">
              <img
                src={form.avatar || targetUser.avatar}
                alt={targetUser.name}
                className="w-24 h-24 rounded-2xl object-cover ring-2 ring-emerald-500/30 shadow-md"
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="absolute inset-0 rounded-2xl bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-[11px] font-semibold cursor-pointer"
                title="Upload Photo from Device"
              >
                <Camera className="w-5 h-5 mb-0.5" />
                <span>Change</span>
              </button>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left space-y-1.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-lg font-bold text-stone-900">{targetUser.name}</h3>
                  <p className="text-xs text-stone-600 font-medium">{targetUser.designation}</p>
                </div>
                <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-stone-200/80 text-stone-800 font-bold self-center sm:self-auto">
                  {targetUser.employeeId}
                </span>
              </div>

              <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-stone-600">
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-stone-400" />
                  <span>{targetUser.department || 'Field Operations'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                  <span>Joined: {targetUser.joiningDate || '2024'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-emerald-700 font-semibold">Active Staff</span>
                </div>
              </div>
            </div>
          </div>

          {/* Edit Form or View Details */}
          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-4 bg-white p-5 rounded-2xl border border-stone-200 text-xs">
              <h4 className="font-bold text-stone-900 text-sm border-b border-stone-100 pb-2">
                Edit Contact &amp; Employment Details
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Employee ID *</label>
                  <input
                    type="text"
                    required
                    value={form.employeeId}
                    onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Designation</label>
                  <input
                    type="text"
                    value={form.designation}
                    onChange={(e) => setForm({ ...form, designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Department</label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">WhatsApp Number (For Reminders) *</label>
                  <input
                    type="tel"
                    required
                    value={form.whatsapp}
                    onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Mobile Calling Number</label>
                  <input
                    type="tel"
                    value={form.mobile}
                    onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600 font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-stone-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-emerald-600"
                  />
                </div>

                {/* Profile Photo in Edit Form */}
                <div className="sm:col-span-2 p-3.5 rounded-xl bg-stone-50 border border-stone-200/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="block font-bold text-stone-800 text-xs uppercase tracking-wider">
                      Profile Photo
                    </label>
                    <button
                      type="button"
                      onClick={() => photoInputRef.current?.click()}
                      className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Upload from Device / Camera</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <img
                      src={form.avatar}
                      alt={form.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-600 shrink-0 shadow-sm"
                    />
                    <div className="flex-1 space-y-1.5">
                      <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block">
                        Or select avatar:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_AVATARS.map((av, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setForm((prev) => ({ ...prev, avatar: av }))}
                            className={`w-7 h-7 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                              form.avatar === av
                                ? 'border-emerald-600 scale-105 ring-2 ring-emerald-500/30'
                                : 'border-stone-200 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={av} alt="Avatar" className="w-full h-full object-cover" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Set Login Password (Bypass Password) */}
                <div className="sm:col-span-2 p-3.5 rounded-xl bg-amber-50/70 border border-amber-200">
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold text-stone-900 text-xs">
                      Set Login Password (Bypass Password) *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
                        let rand = '';
                        for (let i = 0; i < 4; i++) {
                          rand += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        setForm((prev) => ({ ...prev, password: `pass#${rand}` }));
                      }}
                      className="text-[11px] text-amber-800 hover:text-amber-950 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Auto-Generate</span>
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs focus:outline-emerald-600 bg-white"
                  />
                  <p className="text-[11px] text-stone-600 mt-1">
                    This password allows direct login on the login page using this profile&apos;s registered Gmail ID or mobile number.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-700 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Contact Information Card */}
              <div className="p-4 rounded-2xl bg-white border border-stone-200 space-y-3">
                <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider text-stone-400">
                  Contact Information
                </h4>
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                      WhatsApp:
                    </span>
                    <a
                      href={`https://wa.me/${(targetUser.whatsapp || targetUser.mobile || '').replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="font-mono font-bold text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <span>{targetUser.whatsapp || targetUser.mobile || 'Not Set'}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-stone-400" />
                      Mobile:
                    </span>
                    <a href={`tel:${targetUser.mobile}`} className="font-mono text-stone-800 font-semibold">
                      {targetUser.mobile}
                    </a>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-stone-400" />
                      Email:
                    </span>
                    <a href={`mailto:${targetUser.email}`} className="text-stone-800 hover:underline">
                      {targetUser.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Login Credentials & Password Card */}
              <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600" />
                    <span>Login Credentials &amp; Password</span>
                  </h4>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAdminResetOpen(!isAdminResetOpen);
                        setAdminResetFeedback(null);
                        if (!adminNewPass) generateRandomPassword();
                      }}
                      className="text-[11px] text-amber-800 hover:text-amber-950 font-bold bg-amber-100/80 hover:bg-amber-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                    >
                      <Key className="w-3 h-3" />
                      <span>{isAdminResetOpen ? 'Close Tool' : 'Admin Reset Password'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="text-[11px] text-emerald-600 hover:text-emerald-800 font-semibold"
                    >
                      Edit All
                    </button>
                  </div>
                </div>

                <p className="text-[11px] text-stone-600 leading-relaxed">
                  Sign in with registered Gmail (<code className="font-mono text-stone-800 font-bold">{targetUser.email}</code>) or mobile (<code className="font-mono text-stone-800 font-bold">{targetUser.mobile || targetUser.whatsapp}</code>).
                </p>

                <div className="flex items-center gap-2">
                  <div className="relative w-full">
                    <input
                      type={showViewPassword ? 'text' : 'password'}
                      readOnly
                      value={targetUser.password || (targetUser.role === 'admin' ? 'admin123' : 'service123')}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 font-mono text-xs text-stone-900 pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowViewPassword(!showViewPassword)}
                      className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-stone-400 hover:text-stone-700"
                    >
                      {showViewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Admin Direct Password Reset Drawer */}
                {isAdminResetOpen && (
                  <div className="mt-3 p-3.5 rounded-xl bg-white border border-amber-200 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        <span>Set New Password for {targetUser.name.split(' ')[0]}</span>
                      </span>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[10px] text-amber-700 hover:text-amber-900 font-bold hover:underline cursor-pointer"
                      >
                        Auto-Generate
                      </button>
                    </div>

                    {adminResetFeedback && (
                      <div
                        className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                          adminResetFeedback.type === 'success'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-red-50 text-red-700 border border-red-200'
                        }`}
                      >
                        {adminResetFeedback.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-red-500 shrink-0" />
                        )}
                        <span>{adminResetFeedback.text}</span>
                      </div>
                    )}

                    <form onSubmit={handleAdminResetPassword} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        placeholder="Enter new employee password"
                        value={adminNewPass}
                        onChange={(e) => setAdminNewPass(e.target.value)}
                        className="flex-1 px-3 py-2 rounded-xl border border-stone-300 font-mono text-xs text-stone-900 focus:outline-emerald-600 bg-stone-50/50"
                      />
                      <button
                        type="submit"
                        disabled={isResettingPass}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isResettingPass ? (
                          <>
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Saving...</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save Password</span>
                          </>
                        )}
                      </button>
                    </form>

                    {/* WhatsApp Quick Share after update */}
                    {adminResetFeedback?.type === 'success' && (
                      <div className="pt-2 border-t border-stone-100 flex items-center justify-between">
                        <span className="text-[11px] text-stone-500">Share updated credentials:</span>
                        <a
                          href={`https://wa.me/${(targetUser.whatsapp || targetUser.mobile || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                            `Hello ${targetUser.name},\nYour Job Reminder login password has been updated.\n\nNew Password: ${adminNewPass}\nLogin Link: ${generateLoginUrl(targetUser)}\n\nPlease keep this safe.`
                          )}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Send className="w-3 h-3 text-emerald-600" />
                          <span>Send via WhatsApp</span>
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* 1-Click Direct Token Link Card */}
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1">
                    <Key className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Direct WhatsApp Token Link</span>
                  </h4>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-200 text-emerald-800">
                    Active
                  </span>
                </div>

                <p className="text-[11px] text-emerald-900 leading-relaxed">
                  Anyone clicking this link on WhatsApp or any browser opens their profile &amp; tasks with zero password needed.
                </p>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={directProfileLink}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-emerald-300 font-mono text-[10px] text-emerald-900 select-all"
                  />
                  <button
                    onClick={() => handleCopyLink(directProfileLink)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs"
                    title="Copy direct profile link"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Performance & Workload Statistics */}
          <div className="space-y-3">
            <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider text-stone-400">
              Assigned Workload &amp; Task Metrics
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3.5 rounded-2xl bg-white border border-stone-200 shadow-2xs">
                <div className="text-2xl font-bold text-stone-900">{userJobs.length}</div>
                <div className="text-[11px] text-stone-500 font-medium">Total Jobs</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-2xs">
                <div className="text-2xl font-bold text-emerald-700">{completedJobs.length}</div>
                <div className="text-[11px] text-emerald-800 font-medium">Completed</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 shadow-2xs">
                <div className="text-2xl font-bold text-blue-700">{activeJobs.length}</div>
                <div className="text-[11px] text-blue-800 font-medium">Active / Pending</div>
              </div>
              <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 shadow-2xs">
                <div className="text-2xl font-bold text-red-700">{overdueJobs.length}</div>
                <div className="text-[11px] text-red-800 font-medium">Overdue</div>
              </div>
            </div>
          </div>

          {/* Assigned Jobs List */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wider text-stone-400">
                Current Assigned Tasks ({activeJobs.length} Active)
              </h4>
              <div className="flex items-center gap-3">
                {['admin', 'manager', 'director'].includes(currentUser.role) && activeJobs.length > 0 && (
                  <button
                    onClick={() => openBulkJobReminders(targetUser.id)}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors"
                    title="Send bulk reminders for all pending jobs"
                  >
                    <Send className="w-3 h-3 text-emerald-600" />
                    <span>Send Bulk Reminders</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    if (targetUser.role === 'engineer') {
                      setActiveTab('my_jobs');
                    } else {
                      setActiveTab('jobs');
                    }
                  }}
                  className="text-xs font-semibold text-stone-600 hover:text-emerald-700 hover:underline cursor-pointer"
                >
                  View in Directory →
                </button>
              </div>
            </div>

            {userJobs.length === 0 ? (
              <div className="text-center py-6 text-xs text-stone-400 bg-stone-50 rounded-2xl border border-stone-200">
                No jobs currently assigned to this team member.
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {userJobs.map((j) => (
                  <div
                    key={j.id}
                    onClick={() => {
                      setSelectedJobId(j.id);
                      setIsProfileModalOpen(false);
                    }}
                    className="p-3 rounded-xl bg-white border border-stone-200 hover:border-emerald-300 flex items-center justify-between cursor-pointer transition-colors shadow-2xs text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="font-mono text-emerald-800 font-bold shrink-0">{j.jobId}</span>
                      <span className="font-semibold text-stone-900 truncate">{j.title}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-stone-500 text-[11px]">Due: {j.dueDate}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          j.status === 'completed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : j.status === 'overdue'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {j.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between text-xs shrink-0">
          <span className="text-stone-500 font-mono text-[11px]">
            User ID: {targetUser.id}
          </span>
          <button
            onClick={() => setIsProfileModalOpen(false)}
            className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-black text-white font-semibold cursor-pointer transition-colors"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
