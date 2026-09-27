/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mic, Sparkles } from 'lucide-react';
import { VoiceAssistantModal } from './components/ai/VoiceAssistantModal';
import { LoginView } from './components/auth/LoginView';
import { MagicTokenModal } from './components/common/MagicTokenModal';
import { CustomersView } from './components/customers/CustomersView';
import { DashboardView } from './components/dashboard/DashboardView';
import { CreateJobModal } from './components/jobs/CreateJobModal';
import { EditJobModal } from './components/jobs/EditJobModal';
import { JobDetailModal } from './components/jobs/JobDetailModal';
import { JobsListView } from './components/jobs/JobsListView';
import { MyJobsView } from './components/jobs/MyJobsView';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { Footer } from './components/layout/Footer';
import { AppApkModal } from './components/modals/AppApkModal';
import { UserProfileModal } from './components/profile/UserProfileModal';
import { ReportsView } from './components/reports/ReportsView';
import { SettingsView } from './components/settings/SettingsView';
import { TeamView } from './components/team/TeamView';
import { AddEmployeeModal } from './components/team/AddEmployeeModal';
import { OmniSearchModal } from './components/search/OmniSearchModal';
import { SendWhatsAppModal } from './components/whatsapp/SendWhatsAppModal';
import { BulkJobReminderModal } from './components/whatsapp/BulkJobReminderModal';
import { ClientPaymentReminderModal } from './components/reminders/ClientPaymentReminderModal';
import { PaymentRemindersView } from './components/payments/PaymentRemindersView';
import { GoogleDriveBackupModal } from './components/modals/GoogleDriveBackupModal';
import { WhatsAppHubView } from './components/whatsapp/WhatsAppHubView';
import { RankingsView } from './components/ranking/RankingsView';
import { CompanyProfileView } from './components/company/CompanyProfileView';
import { AppProvider, useApp } from './context/AppContext';

const MainLayout: React.FC = () => {
  const {
    activeTab,
    isAuthenticated,
    isVoiceAssistantOpen,
    setIsVoiceAssistantOpen,
    isApkModalOpen,
    setIsApkModalOpen,
    isGlobalSearchOpen,
    setIsGlobalSearchOpen,
  } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMagicModalOpen, setIsMagicModalOpen] = useState(false);

  // If user is not authenticated or explicitly at login view
  if (!isAuthenticated || activeTab === 'login') {
    return (
      <>
        <LoginView />
        <AppApkModal
          isOpen={isApkModalOpen}
          onClose={() => setIsApkModalOpen(false)}
        />
        <VoiceAssistantModal
          isOpen={isVoiceAssistantOpen}
          onClose={() => setIsVoiceAssistantOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-900 flex flex-col font-sans selection:bg-emerald-100 selection:text-emerald-900">
      {/* Top Navbar */}
      <Navbar
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onOpenMagicTester={() => setIsMagicModalOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar for Desktop */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content Area (Mobile & Desktop optimized) */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto w-full flex flex-col justify-between">
          <div className="flex-1">
            {activeTab === 'dashboard' && <DashboardView />}
            {activeTab === 'my_jobs' && <MyJobsView />}
            {activeTab === 'jobs' && <JobsListView />}
            {activeTab === 'whatsapp' && <WhatsAppHubView />}
            {activeTab === 'customers' && <CustomersView />}
            {activeTab === 'payments' && <PaymentRemindersView />}
            {activeTab === 'team' && <TeamView />}
            {activeTab === 'rankings' && <RankingsView />}
            {activeTab === 'reports' && <ReportsView />}
            {activeTab === 'company_profile' && <CompanyProfileView />}
            {activeTab === 'settings' && <SettingsView />}
          </div>

          <Footer />
        </main>

        {/* Floating Voice Assistant Mic Action Orb */}
        <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-40 flex items-center gap-2">
          <button
            onClick={() => setIsVoiceAssistantOpen(true)}
            className="group relative flex items-center gap-2 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-semibold text-xs shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer ring-4 ring-emerald-600/20"
            title="Click and say: Assign job, search jobs, create jobs, or do anything"
          >
            <span className="relative flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 sm:h-3 sm:w-3 bg-white"></span>
            </span>
            <Mic className="w-4 h-4 text-white" />
            <span className="hidden sm:inline">AI Voice</span>
            <span className="sm:hidden text-[11px]">AI</span>
          </button>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Visible on mobile screens) */}
      <MobileBottomNav />

      {/* Global Modals */}
      <AddEmployeeModal />
      <OmniSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
      />
      <CreateJobModal />
      <EditJobModal />
      <JobDetailModal />
      <UserProfileModal />
      <SendWhatsAppModal />
      <BulkJobReminderModal />
      <ClientPaymentReminderModal />
      <GoogleDriveBackupModal />
      <MagicTokenModal
        isOpen={isMagicModalOpen}
        onClose={() => setIsMagicModalOpen(false)}
      />
      <AppApkModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />
      <VoiceAssistantModal
        isOpen={isVoiceAssistantOpen}
        onClose={() => setIsVoiceAssistantOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
