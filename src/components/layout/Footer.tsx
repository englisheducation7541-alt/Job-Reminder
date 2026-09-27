import React from 'react';
import { ShieldCheck, Heart, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Footer: React.FC = () => {
  const { companySettings } = useApp();
  const currentYear = new Date().getFullYear();
  const companyName = companySettings?.companyName || 'Job Reminder';

  return (
    <footer className="mt-10 pt-6 pb-4 border-t border-stone-200/80 text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <span className="font-semibold text-stone-700">Made with</span>
        <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline animate-pulse" />
        <span className="font-semibold text-stone-700">by XYZ</span>
        <span className="text-stone-300 hidden sm:inline">•</span>
        <span className="hidden sm:inline">
          © {currentYear} {companyName}. All rights reserved.
        </span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>System Online & Synced</span>
        </div>
        <span className="text-stone-300 hidden md:inline">•</span>
        <span className="hidden md:inline text-[11px] text-stone-400">
          Field Operations & Automated Reminders
        </span>
      </div>
    </footer>
  );
};
