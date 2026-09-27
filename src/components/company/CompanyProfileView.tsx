import React, { useState, useEffect, useRef } from 'react';
import {
  Building2,
  Upload,
  Check,
  Save,
  Image as ImageIcon,
  Mail,
  Phone,
  MapPin,
  Globe,
  FileText,
  Clock,
  Shield,
  Trash2,
  Sparkles,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CompanySettings } from '../../types';
import { compressImageFile } from '../../utils/imageCompressor';

export const CompanyProfileView: React.FC = () => {
  const { companySettings, updateCompanySettings, currentUser, t } = useApp();

  const isDirtyRef = useRef(false);

  const [form, setForm] = useState<CompanySettings>(() => ({
    ...companySettings,
    companyName: companySettings?.companyName || '',
    tagline: companySettings?.tagline || '',
    contactNumber: companySettings?.contactNumber || '',
    email: companySettings?.email || '',
    website: companySettings?.website || '',
    gstNumber: companySettings?.gstNumber || '',
    address: companySettings?.address || '',
    logoUrl: companySettings?.logoUrl || companySettings?.companyLogo || '',
    companyLogo: companySettings?.logoUrl || companySettings?.companyLogo || '',
  }));
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string>(
    companySettings?.logoUrl || companySettings?.companyLogo || ''
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever companySettings changes in context, but only if user has not typed unsaved edits
  useEffect(() => {
    if (isDirtyRef.current) return;
    const currentLogo = companySettings?.logoUrl || companySettings?.companyLogo || '';
    setForm({
      ...companySettings,
      companyName: companySettings?.companyName || '',
      tagline: companySettings?.tagline || '',
      contactNumber: companySettings?.contactNumber || '',
      email: companySettings?.email || '',
      website: companySettings?.website || '',
      gstNumber: companySettings?.gstNumber || '',
      address: companySettings?.address || '',
      logoUrl: currentLogo,
      companyLogo: currentLogo,
    });
    setLogoPreview(currentLogo);
  }, [companySettings]);

  // Handle Logo Upload via device file input (compressed DataURL)
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WEBP).');
      return;
    }

    try {
      const dataUrl = await compressImageFile(file, 400, 400, 0.9);
      isDirtyRef.current = true;
      setLogoPreview(dataUrl);
      setForm((prev) => ({
        ...prev,
        logoUrl: dataUrl,
        companyLogo: dataUrl,
      }));
    } catch (err) {
      console.warn('Logo compression error:', err);
    }
    if (e.target) e.target.value = '';
  };

  const handleRemoveLogo = () => {
    isDirtyRef.current = true;
    setLogoPreview('');
    setForm((prev) => ({
      ...prev,
      logoUrl: '',
      companyLogo: '',
    }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    isDirtyRef.current = false;

    const trimmedName = (form.companyName || '').trim();
    if (!trimmedName) {
      alert('Company Name is required.');
      return;
    }

    const effectiveLogo = logoPreview || form.logoUrl || form.companyLogo || '';
    const updatedSettings: CompanySettings = {
      ...form,
      companyName: trimmedName,
      logoUrl: effectiveLogo,
      companyLogo: effectiveLogo,
    };

    updateCompanySettings(updatedSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset company profile details to defaults?')) {
      isDirtyRef.current = false;
      const defaultData: CompanySettings = {
        companyName: 'Apex Precision Engineering Pvt Ltd',
        tagline: 'Assign. Remind. Track. Complete.',
        address: 'Plot 12, Industrial Area Phase 1, New Delhi - 110020',
        contactNumber: '+91 11 4567 8900',
        email: 'service@apexengg.com',
        website: 'https://apexengg.com',
        gstNumber: '07AAAAA0000A1Z5',
        logoUrl: '',
        companyLogo: '',
        dailySummaryTime: '08:30',
        enableDailySummary: true,
        unacceptedEscalationHours: 2,
        overdueEscalationHours: 4,
      };
      setForm(defaultData);
      setLogoPreview('');
      updateCompanySettings(defaultData);
      setResetSuccess(true);
      setTimeout(() => setResetSuccess(false), 3000);
    }
  };

  const isAdmin = currentUser.role === 'admin' || currentUser.role === 'director';

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-stone-200 shadow-xs max-w-xl mx-auto mt-10">
        <Shield className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-stone-900">{t('Access Denied')}</h2>
        <p className="text-xs text-stone-500 mt-1">
          Only Administrators can modify official Company Profile, logo, and organization branding.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-700 shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-stone-900 tracking-tight">{t('company_profile')}</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Manage organization name, logo, contact info, address, and GST details shown across the app.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-600 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Reset to default company details"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{t('reset_defaults')}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved &amp; Updated!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('save_changes')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {resetSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Company Profile has been reset to defaults and synced.</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Logo and Brand Identity Card */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-5">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <ImageIcon className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-stone-900 text-sm">{t('company_logo')}</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Logo Preview Box */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt={form.companyName || 'Company Logo'}
                    className="w-full h-full object-contain p-2"
                  />
                ) : (
                  <div className="text-center p-3 text-stone-400">
                    <Building2 className="w-8 h-8 mx-auto mb-1 text-stone-300" />
                    <span className="text-[10px] font-medium block">No Logo</span>
                  </div>
                )}
              </div>

              {logoPreview && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-600 text-white shadow-xs hover:bg-red-700 transition-all cursor-pointer"
                  title="Remove Logo"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Upload Controls */}
            <div className="space-y-2 flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{logoPreview ? 'Upload New Logo' : 'Upload Company Logo'}</span>
                </button>

                {logoPreview && (
                  <button
                    type="button"
                    onClick={handleRemoveLogo}
                    className="px-3 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete Logo</span>
                  </button>
                )}
              </div>

              <p className="text-[11px] text-stone-500 leading-relaxed">
                PNG, JPG or SVG formats supported. This logo will automatically replace the green button in the top navigation bar, appear on the Dashboard header, and display on every page across the application.
              </p>
            </div>
          </div>
        </div>

        {/* Section 2: Organization Contact Details */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-stone-100 pb-3">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-stone-900 text-sm">Company Contact &amp; Business Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Company Name */}
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                {t('company_name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.companyName || ''}
                onChange={(e) => {
                  isDirtyRef.current = true;
                  setForm((prev) => ({ ...prev, companyName: e.target.value }));
                }}
                placeholder="e.g. Acme Precision Engineering"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-stone-900 font-semibold"
              />
            </div>

            {/* Tagline */}
            <div>
              <label className="block font-bold text-stone-800 mb-1">Company Tagline / Slogan</label>
              <input
                type="text"
                value={form.tagline || ''}
                onChange={(e) => {
                  isDirtyRef.current = true;
                  setForm((prev) => ({ ...prev, tagline: e.target.value }));
                }}
                placeholder="e.g. Reliable Field Service & Maintenance"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-stone-900"
              />
            </div>

            {/* Contact Number */}
            <div>
              <label className="block font-bold text-stone-800 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-stone-400" />
                <span>{t('phone_number')} <span className="text-red-500">*</span></span>
              </label>
              <input
                type="text"
                required
                value={form.contactNumber || ''}
                onChange={(e) => {
                  isDirtyRef.current = true;
                  setForm((prev) => ({ ...prev, contactNumber: e.target.value }));
                }}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-stone-900 font-mono"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block font-bold text-stone-800 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-stone-400" />
                <span>{t('email')} <span className="text-red-500">*</span></span>
              </label>
              <input
                type="email"
                required
                value={form.email || ''}
                onChange={(e) => {
                  isDirtyRef.current = true;
                  setForm((prev) => ({ ...prev, email: e.target.value }));
                }}
                placeholder="e.g. operations@company.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-stone-900"
              />
            </div>

            {/* Website */}
            <div>
              <label className="block font-bold text-stone-800 mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-stone-400" />
                <span>{t('website')}</span>
              </label>
              <input
                type="url"
                value={form.website || ''}
                onChange={(e) => {
                  isDirtyRef.current = true;
                  setForm((prev) => ({ ...prev, website: e.target.value }));
                }}
                placeholder="e.g. https://www.yourcompany.com"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-stone-900"
              />
            </div>

            {/* GST Number */}
            <div>
              <label className="block font-bold text-stone-800 mb-1 flex items-center gap-1">
                <FileText className="w-3.5 h-3.5 text-stone-400" />
                <span>{t('gst_number')}</span>
              </label>
              <input
                type="text"
                value={form.gstNumber || ''}
                onChange={(e) => {
                  isDirtyRef.current = true;
                  setForm((prev) => ({ ...prev, gstNumber: e.target.value.toUpperCase() }));
                }}
                placeholder="e.g. 27AAAAA0000A1Z5"
                className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-stone-900 font-mono uppercase"
              />
            </div>

            {/* Physical Address */}
            <div className="sm:col-span-2">
              <label className="block font-bold text-stone-800 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{t('company_address')}</span>
              </label>
              <textarea
                rows={2}
                value={form.address || ''}
                onChange={(e) => {
                  isDirtyRef.current = true;
                  setForm((prev) => ({ ...prev, address: e.target.value }));
                }}
                placeholder="e.g. Plot 12, Industrial Area Phase 1, New Delhi - 110020"
                className="w-full px-3.5 py-2 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-stone-900 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Live Preview Card */}
        <div className="bg-stone-50 p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-xs uppercase tracking-wider text-stone-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Live Branding Preview (Navbar &amp; Dashboard)</span>
            </h3>
            <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Auto-Synced
            </span>
          </div>

          <div className="p-4 rounded-xl bg-white border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <img
                  src={logoPreview}
                  alt="Logo Preview"
                  className="w-12 h-12 rounded-xl object-contain border border-stone-200 p-1 bg-white shadow-2xs"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                  {form.companyName ? form.companyName.substring(0, 2).toUpperCase() : 'JR'}
                </div>
              )}
              <div>
                <div className="text-base font-extrabold text-stone-900">
                  {form.companyName || 'Job Reminder'}
                </div>
                <div className="text-xs text-stone-500">
                  {form.tagline || 'Automated Field Operations & Reminder Platform'}
                </div>
                <div className="text-[11px] text-stone-600 mt-1 flex flex-wrap gap-2">
                  {form.contactNumber && <span>📞 {form.contactNumber}</span>}
                  {form.email && <span>✉️ {form.email}</span>}
                  {form.gstNumber && <span className="font-mono bg-stone-100 px-1 rounded">GST: {form.gstNumber}</span>}
                </div>
              </div>
            </div>

            <div className="text-xs text-stone-400 bg-stone-50 px-3 py-1.5 rounded-lg border border-stone-200 font-mono">
              Footer: © {form.companyName || 'Job Reminder'} | Created by Abhimanyu
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="flex justify-end gap-3">
          <button
            type="submit"
            className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved &amp; Updated Across App!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{t('save_changes')}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
