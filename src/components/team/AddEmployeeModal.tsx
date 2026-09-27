import React, { useState, useRef } from 'react';
import {
  Camera,
  CheckCircle2,
  Image as ImageIcon,
  Key,
  Link,
  Mail,
  Phone,
  Shield,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { compressImageFile } from '../../utils/imageCompressor';

const SAMPLE_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
];

export const AddEmployeeModal: React.FC = () => {
  const { isAddEmployeeModalOpen, setIsAddEmployeeModalOpen, addUser } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '',
    designation: 'Service Engineer',
    department: 'Field Engineering & Services',
    role: 'engineer' as UserRole,
    mobile: '',
    whatsapp: '',
    email: '',
    employeeId: `EMP-${Math.floor(200 + Math.random() * 700)}`,
    password: 'service123',
    avatar: SAMPLE_AVATARS[0],
  });

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isAddEmployeeModalOpen) return null;

  const handlePhoneChange = (val: string) => {
    setForm((prev) => ({
      ...prev,
      mobile: val,
      whatsapp: val,
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      setErrorMsg(null);
      const compressedDataUrl = await compressImageFile(file, 300, 300, 0.85);
      setForm((prev) => ({ ...prev, avatar: compressedDataUrl }));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to process image. Please choose another file.');
    } finally {
      setIsUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      setErrorMsg(null);
      const compressedDataUrl = await compressImageFile(file, 300, 300, 0.85);
      setForm((prev) => ({ ...prev, avatar: compressedDataUrl }));
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to process image file.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleApplyCustomUrl = () => {
    const clean = customUrl.trim();
    if (clean) {
      setForm((prev) => ({ ...prev, avatar: clean }));
      setShowUrlInput(false);
      setCustomUrl('');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanName = form.name.trim();
    if (!cleanName) {
      setErrorMsg('Employee Full Name is required.');
      return;
    }

    const cleanPhone = (form.mobile || form.whatsapp).trim();
    if (!cleanPhone) {
      setErrorMsg('WhatsApp Mobile number is required for dispatch notifications.');
      return;
    }

    setIsSubmitting(true);

    try {
      addUser({
        name: cleanName,
        designation: form.designation.trim() || 'Service Engineer',
        department: form.department.trim() || 'Field Engineering',
        role: form.role,
        mobile: cleanPhone,
        whatsapp: (form.whatsapp || cleanPhone).trim(),
        email: form.email.trim() || `${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '')}@jobreminder.io`,
        employeeId: form.employeeId.trim() || `EMP-${Math.floor(200 + Math.random() * 700)}`,
        password: form.password.trim() || 'service123',
        avatar: form.avatar,
        active: true,
      });

      setSuccessToast(`Employee profile "${cleanName}" created successfully!`);

      setTimeout(() => {
        setIsSubmitting(false);
        setSuccessToast(null);
        setIsAddEmployeeModalOpen(false);
        // Reset form
        setForm({
          name: '',
          designation: 'Service Engineer',
          department: 'Field Engineering & Services',
          role: 'engineer',
          mobile: '',
          whatsapp: '',
          email: '',
          employeeId: `EMP-${Math.floor(200 + Math.random() * 700)}`,
          password: 'service123',
          avatar: SAMPLE_AVATARS[0],
        });
      }, 900);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err?.message || 'Failed to create profile. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-stone-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center text-white shrink-0">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Register New Employee Profile</h2>
              <p className="text-xs text-emerald-100">
                Add field engineer or manager to assign jobs and automate WhatsApp task dispatch.
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsAddEmployeeModalOpen(false)}
            className="p-1.5 rounded-xl hover:bg-white/20 text-white/80 hover:text-white cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successToast && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successToast}</span>
            </div>
          )}

          {/* Full Name & Designation */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Vikram Malhotra"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-stone-900 bg-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Designation / Job Role
              </label>
              <input
                type="text"
                placeholder="e.g. Senior Service Engineer"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-stone-900 bg-white"
              />
            </div>
          </div>

          {/* Role & Department */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                System Access Role
              </label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white"
              >
                <option value="engineer">Field Engineer (Service &amp; Updates)</option>
                <option value="manager">Service Manager (Assign &amp; Review)</option>
                <option value="admin">Administrator (Full Control)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">Department</label>
              <input
                type="text"
                placeholder="Field Engineering &amp; Services"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white"
              />
            </div>
          </div>

          {/* WhatsApp / Mobile & Email */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                WhatsApp Mobile <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-emerald-600 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  placeholder="+91 98111 22334"
                  value={form.mobile}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-stone-900 bg-white font-mono"
                />
              </div>
              <p className="text-[10px] text-stone-500 mt-0.5">Used for automated WhatsApp job dispatches &amp; reminders.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">Email ID</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  placeholder="vikram@company.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs text-stone-900 bg-white"
                />
              </div>
            </div>
          </div>

          {/* Employee ID & Login Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">Employee ID</label>
              <input
                type="text"
                value={form.employeeId}
                onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-800 mb-1">
                Default Login Password
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white font-mono"
                />
              </div>
            </div>
          </div>

          {/* Profile Photo Option (Upload, Camera, or Presets) */}
          <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/90 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                Profile Photo <span className="text-stone-400 font-normal">(Optional)</span>
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowUrlInput(!showUrlInput)}
                  className="text-[11px] text-emerald-700 hover:text-emerald-900 font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <Link className="w-3 h-3" />
                  <span>{showUrlInput ? 'Hide URL' : 'Image URL'}</span>
                </button>
              </div>
            </div>

            {/* Hidden native file input for mobile camera / gallery and desktop files */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            {/* Upload & Preview Row */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              {/* Avatar Preview */}
              <div className="relative group shrink-0">
                <img
                  src={form.avatar}
                  alt={form.name || 'Employee'}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-600 shadow-sm"
                />
                {isUploadingPhoto && (
                  <div className="absolute inset-0 bg-stone-900/50 rounded-2xl flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload Drop Zone / Action Buttons */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                className="flex-1 w-full border-2 border-dashed border-stone-300 hover:border-emerald-500 rounded-2xl p-3 text-center transition-colors bg-white cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="flex items-center justify-center gap-2 text-stone-700 font-semibold text-xs">
                  <Camera className="w-4 h-4 text-emerald-600" />
                  <span>Upload Photo from Device / Camera</span>
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  Supports JPG, PNG, WEBP (auto-compressed for fast mobile loading)
                </p>
              </div>
            </div>

            {/* Optional URL input */}
            {showUrlInput && (
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="url"
                  placeholder="Paste image web link (https://...)"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="flex-1 px-3 py-1.5 rounded-xl border border-stone-200 text-xs text-stone-900 bg-white"
                />
                <button
                  type="button"
                  onClick={handleApplyCustomUrl}
                  className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold cursor-pointer"
                >
                  Apply
                </button>
              </div>
            )}

            {/* Quick Avatar Presets */}
            <div>
              <span className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
                Or pick a standard avatar:
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_AVATARS.map((av, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setForm((prev) => ({ ...prev, avatar: av }))}
                    className={`w-7 h-7 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                      form.avatar === av
                        ? 'border-emerald-600 scale-110 ring-2 ring-emerald-500/30'
                        : 'border-stone-200 opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={av} alt="Option" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="pt-4 border-t border-stone-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddEmployeeModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer disabled:opacity-60"
            >
              <UserCheck className="w-4 h-4" />
              <span>{isSubmitting ? 'Saving Profile...' : 'Save & Register Employee'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
