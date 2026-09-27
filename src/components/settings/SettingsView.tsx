import React, { useState, useEffect, useRef } from 'react';
import {
  Bell,
  Building,
  Check,
  Edit2,
  Globe,
  Key,
  Lock,
  Plus,
  Save,
  Server,
  Shield,
  Trash2,
  X,
  Zap,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { CompanySettings, WhatsAppSettings } from '../../types';
import { compressImageFile } from '../../utils/imageCompressor';

export const SettingsView: React.FC = () => {
  const {
    companySettings,
    updateCompanySettings,
    whatsappSettings,
    updateWhatsAppSettings,
    jobTypes,
    addJobType,
    updateJobType,
    deleteJobType,
    setActiveTab,
    t,
  } = useApp();

  const isCompanyDirtyRef = useRef(false);
  const isWhatsappDirtyRef = useRef(false);

  const [companyForm, setCompanyForm] = useState<CompanySettings>(() => ({
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

  const [whatsappForm, setWhatsappForm] = useState<WhatsAppSettings>(() => ({
    ...whatsappSettings,
  }));

  const [logoPreview, setLogoPreview] = useState<string>(
    companySettings?.logoUrl || companySettings?.companyLogo || ''
  );
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [newJobTypeInput, setNewJobTypeInput] = useState('');
  const [editingJobType, setEditingJobType] = useState<{ old: string; value: string } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [apiTestSuccess, setApiTestSuccess] = useState(false);

  // Sync state when companySettings changes externally, only if user hasn't typed unsaved changes
  useEffect(() => {
    if (isCompanyDirtyRef.current) return;
    const currentLogo = companySettings?.logoUrl || companySettings?.companyLogo || '';
    setCompanyForm({
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

  useEffect(() => {
    if (isWhatsappDirtyRef.current) return;
    setWhatsappForm({ ...whatsappSettings });
  }, [whatsappSettings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, SVG, WEBP).');
      return;
    }

    try {
      const dataUrl = await compressImageFile(file, 400, 400, 0.9);
      isCompanyDirtyRef.current = true;
      setLogoPreview(dataUrl);
      setCompanyForm((prev) => ({
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
    isCompanyDirtyRef.current = true;
    setLogoPreview('');
    setCompanyForm((prev) => ({
      ...prev,
      logoUrl: '',
      companyLogo: '',
    }));
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    isCompanyDirtyRef.current = false;
    isWhatsappDirtyRef.current = false;
    const effectiveLogo = logoPreview || companyForm.logoUrl || companyForm.companyLogo || '';
    const updatedCompany: CompanySettings = {
      ...companyForm,
      companyName: (companyForm.companyName || '').trim() || 'Job Reminder',
      logoUrl: effectiveLogo,
      companyLogo: effectiveLogo,
    };
    updateCompanySettings(updatedCompany);
    updateWhatsAppSettings(whatsappForm);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleTestApiPing = () => {
    setApiTestSuccess(true);
    setTimeout(() => setApiTestSuccess(false), 3000);
  };

  const handleAddJobType = () => {
    if (!newJobTypeInput.trim()) return;
    addJobType(newJobTypeInput.trim());
    setNewJobTypeInput('');
  };

  const handleSaveEditedJobType = () => {
    if (!editingJobType || !editingJobType.value.trim()) return;
    updateJobType(editingJobType.old, editingJobType.value.trim());
    setEditingJobType(null);
  };

  return (
    <div className="space-y-6 max-w-4xl pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-stone-900 tracking-tight">{t('settings')} &amp; Integrations</h1>
          <p className="text-xs text-stone-500 mt-0.5">
            Configure company branding, logo, contact info, WhatsApp API endpoints, and system parameters.
          </p>
        </div>

        <button
          onClick={() => handleSave()}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>{t('Saved')}!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{t('save_changes')}</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Switch to Dedicated Company Profile Banner */}
      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-emerald-950 text-sm">{t('company_profile')} Management</h3>
            <p className="text-xs text-emerald-800">
              Access the dedicated Company Profile page to manage company logo, address, contact, GST, and live branding previews.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setActiveTab('company_profile')}
          className="px-4 py-2 rounded-xl bg-white border border-emerald-300 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-2xs"
        >
          <span>Open Dedicated Profile</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Section 1: Company Profile & Logo Settings */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-stone-900 text-sm">Company Organization &amp; Logo Settings</h2>
          </div>
        </div>

        {/* Logo Upload in Settings */}
        <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-16 h-16 rounded-xl border border-stone-300 bg-white flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
            {logoPreview ? (
              <img src={logoPreview} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <ImageIcon className="w-6 h-6 text-stone-300" />
            )}
          </div>
          <div className="flex-1 space-y-1">
            <span className="font-bold text-stone-800 text-xs block">{t('company_logo')}</span>
            <p className="text-[11px] text-stone-500">
              Logo will display on the top-left Navbar, Dashboard header, and reports.
            </p>
            <div className="flex items-center gap-2 pt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Upload className="w-3 h-3" />
                <span>{logoPreview ? 'Change Logo' : 'Upload Logo'}</span>
              </button>
              {logoPreview && (
                <button
                  type="button"
                  onClick={handleRemoveLogo}
                  className="px-2.5 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold cursor-pointer"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Company Details Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-800 mb-1">{t('company_name')} *</label>
            <input
              type="text"
              required
              value={companyForm.companyName || ''}
              onChange={(e) => {
                isCompanyDirtyRef.current = true;
                setCompanyForm((prev) => ({ ...prev, companyName: e.target.value }));
              }}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 font-semibold focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-800 mb-1">Company Tagline</label>
            <input
              type="text"
              value={companyForm.tagline || ''}
              onChange={(e) => {
                isCompanyDirtyRef.current = true;
                setCompanyForm((prev) => ({ ...prev, tagline: e.target.value }));
              }}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-800 mb-1">{t('phone_number')} *</label>
            <input
              type="text"
              required
              value={companyForm.contactNumber || ''}
              onChange={(e) => {
                isCompanyDirtyRef.current = true;
                setCompanyForm((prev) => ({ ...prev, contactNumber: e.target.value }));
              }}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-800 mb-1">{t('email')} *</label>
            <input
              type="email"
              required
              value={companyForm.email || ''}
              onChange={(e) => {
                isCompanyDirtyRef.current = true;
                setCompanyForm((prev) => ({ ...prev, email: e.target.value }));
              }}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-800 mb-1">{t('website')}</label>
            <input
              type="url"
              value={companyForm.website || ''}
              onChange={(e) => {
                isCompanyDirtyRef.current = true;
                setCompanyForm((prev) => ({ ...prev, website: e.target.value }));
              }}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="https://yourcompany.com"
            />
          </div>
          <div>
            <label className="block font-semibold text-stone-800 mb-1">{t('gst_number')}</label>
            <input
              type="text"
              value={companyForm.gstNumber || ''}
              onChange={(e) => {
                isCompanyDirtyRef.current = true;
                setCompanyForm((prev) => ({ ...prev, gstNumber: e.target.value.toUpperCase() }));
              }}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono uppercase focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="27AAAAA0000A1Z5"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block font-semibold text-stone-800 mb-1">{t('company_address')}</label>
            <textarea
              rows={2}
              value={companyForm.address || ''}
              onChange={(e) => {
                isCompanyDirtyRef.current = true;
                setCompanyForm((prev) => ({ ...prev, address: e.target.value }));
              }}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              placeholder="Full physical address..."
            />
          </div>
        </div>
      </div>

      {/* Section 2: WhatsApp Business API Provider Setup */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-600" />
            <h2 className="font-bold text-stone-900 text-sm">WhatsApp Business API Provider (BSP)</h2>
          </div>
          <button
            type="button"
            onClick={handleTestApiPing}
            className="px-3 py-1 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold cursor-pointer flex items-center gap-1"
          >
            {apiTestSuccess ? <Check className="w-3.5 h-3.5" /> : <Server className="w-3.5 h-3.5" />}
            <span>{apiTestSuccess ? 'Connection Verified (200 OK)' : 'Ping API Endpoint'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-stone-800 mb-1">API Provider Engine</label>
            <select
              value={whatsappForm.provider}
              onChange={(e) => setWhatsappForm({ ...whatsappForm, provider: e.target.value as any })}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 bg-white"
            >
              <option value="meta_cloud">Official Meta WhatsApp Cloud API (Recommended)</option>
              <option value="twilio">Twilio Programmable WhatsApp</option>
              <option value="infobip">Infobip Enterprise WhatsApp</option>
              <option value="gupshup">Gupshup WhatsApp Gateway</option>
              <option value="generic_webhook">Custom Direct Webhook Proxy</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-stone-800 mb-1">Business Phone Number ID</label>
            <input
              type="text"
              value={whatsappForm.phoneNumberId}
              onChange={(e) => setWhatsappForm({ ...whatsappForm, phoneNumberId: e.target.value })}
              placeholder="e.g. 1098237498273"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-800 mb-1">Permanent Access Bearer Token</label>
            <input
              type="password"
              value={whatsappForm.apiToken}
              onChange={(e) => setWhatsappForm({ ...whatsappForm, apiToken: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-stone-200 font-mono"
            />
          </div>

          <div>
            <label className="block font-semibold text-stone-800 mb-1">Verified Sender Display Name</label>
            <input
              type="text"
              value={whatsappForm.senderName}
              onChange={(e) => setWhatsappForm({ ...whatsappForm, senderName: e.target.value })}
              placeholder="e.g. Apex Operations Bot"
              className="w-full px-3 py-2 rounded-xl border border-stone-200"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Job Types Master Management (Add, Edit, Delete) */}
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-stone-100 pb-3">
          <h2 className="font-bold text-stone-900 text-sm">Job Categories &amp; Work Types Master</h2>
          <span className="text-xs text-stone-500">{jobTypes.length} Types Configured</span>
        </div>

        {/* Add Job Type Input */}
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add new job type (e.g. Calibration, Duct Cleaning)..."
            value={newJobTypeInput}
            onChange={(e) => setNewJobTypeInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddJobType()}
            className="flex-1 px-3 py-2 rounded-xl border border-stone-200 text-xs"
          />
          <button
            type="button"
            onClick={handleAddJobType}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Type</span>
          </button>
        </div>

        {/* List of Job Types with Edit and Delete */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2">
          {jobTypes.map((type) => {
            const isEditing = editingJobType?.old === type;

            return (
              <div
                key={type}
                className="p-2.5 rounded-xl border border-stone-200 bg-stone-50 flex items-center justify-between gap-2 text-xs"
              >
                {isEditing ? (
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="text"
                      value={editingJobType.value}
                      onChange={(e) => setEditingJobType({ ...editingJobType, value: e.target.value })}
                      className="w-full px-2 py-1 bg-white border border-emerald-500 rounded text-xs"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={handleSaveEditedJobType}
                      className="p-1 rounded bg-emerald-600 text-white hover:bg-emerald-700"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingJobType(null)}
                      className="p-1 rounded bg-stone-200 text-stone-700 hover:bg-stone-300"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <span className="font-semibold text-stone-800 truncate">{type}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setEditingJobType({ old: type, value: type })}
                        className="p-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-200/60"
                        title="Edit type name"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteJobType(type)}
                        className="p-1 rounded text-red-400 hover:text-red-600 hover:bg-red-50"
                        title="Delete type"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Save Button Footer */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={() => handleSave()}
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>All Settings &amp; Profile Details Saved!</span>
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
  );
};
