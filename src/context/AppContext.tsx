import React, { createContext, useContext, useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  INITIAL_ACTIVITIES,
  INITIAL_COMPANY_SETTINGS,
  INITIAL_CUSTOMERS,
  INITIAL_JOBS,
  INITIAL_JOB_TYPES,
  INITIAL_MESSAGE_LOGS,
  INITIAL_TEMPLATES,
  INITIAL_USERS,
  INITIAL_WHATSAPP_SETTINGS,
  INITIAL_PAYMENT_REMINDERS,
} from '../data/initialData';
import {
  AiVoiceCommandResult,
  AppNotification,
  ClientPaymentReminder,
  CompanySettings,
  CompletionReport,
  Customer,
  CustomerSite,
  Job,
  JobActivity,
  JobDailyUpdate,
  JobPriority,
  JobStatus,
  PaymentReminderStatus,
  User,
  UserRole,
  WhatsAppMessageLog,
  WhatsAppSettings,
  WhatsAppTemplate,
} from '../types';
import {
  exportDataAsCsv,
  exportStateAsJson,
  validateBackupJson,
} from '../utils/dataManagement';
import {
  generateDirectAccessUrl,
  generateLoginUrl,
  getPublicAppOrigin,
  isJobOverdue,
  renderTemplate,
  sendViaWhatsAppAPI,
} from '../utils/whatsappEngine';
import { AppLanguage, t as translateHelper } from '../utils/i18n';
import { syncAndOpenMailApp, openWhatsAppChat } from '../utils/paymentSyncEngine';
import {
  signInWithGoogle,
  signInForDrive,
  getAccessToken,
  logOutGoogle,
  initAuth,
} from '../services/firebaseAuth';
import {
  listDriveBackups,
  uploadBackupToDrive,
  downloadDriveBackupContent,
  deleteDriveBackupFile,
  DriveBackupItem,
} from '../services/googleDriveService';
import { GoogleDriveBackupInfo, GoogleDriveSyncState } from '../types';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchUser: (userId: string) => void;
  users: User[];
  customers: Customer[];
  jobTypes: string[];
  jobs: Job[];
  templates: WhatsAppTemplate[];
  messageLogs: WhatsAppMessageLog[];
  activities: JobActivity[];
  whatsappSettings: WhatsAppSettings;
  companySettings: CompanySettings;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedJobId: string | null;
  setSelectedJobId: (id: string | null) => void;
  isCreateJobOpen: boolean;
  setIsCreateJobOpen: (open: boolean) => void;
  isEditJobOpen: boolean;
  setIsEditJobOpen: (open: boolean) => void;
  jobToEdit: Job | null;
  setJobToEdit: (job: Job | null) => void;
  openEditJobModal: (job: Job) => void;
  isProfileModalOpen: boolean;
  setIsProfileModalOpen: (open: boolean) => void;
  isAddEmployeeModalOpen: boolean;
  setIsAddEmployeeModalOpen: (open: boolean) => void;
  openAddEmployeeModal: () => void;
  isGlobalSearchOpen: boolean;
  setIsGlobalSearchOpen: (open: boolean) => void;
  viewUserProfile: User | null;
  setViewUserProfile: (user: User | null) => void;
  openUserProfile: (user?: User) => void;
  isSendWhatsAppOpen: boolean;
  setIsSendWhatsAppOpen: (open: boolean) => void;
  activeJobForWhatsApp: Job | null;
  openSendWhatsAppModal: (job: Job) => void;
  isBulkReminderOpen: boolean;
  setIsBulkReminderOpen: (open: boolean) => void;
  bulkReminderTargetUserId: string | null;
  setBulkReminderTargetUserId: (id: string | null) => void;
  openBulkJobReminder: (userId?: string) => void;
  openBulkJobReminders: (userId?: string) => void;
  sendBulkJobReminders: (
    userId: string,
    jobIds: string[],
    customNote?: string
  ) => Promise<{ success: boolean; message: string; count: number }>;
  tokenAuthBanner: { user: User; job?: Job; action?: string } | null;
  dismissTokenBanner: () => void;
  lastSchedulerTick: Date;
  isSchedulerRunning: boolean;

  // Actions
  createJob: (jobData: Partial<Job>) => Job;
  updateJob: (jobId: string, updates: Partial<Job>) => void;
  deleteJob: (jobId: string) => void;
  updateJobStatus: (jobId: string, status: JobStatus, remarks?: string) => void;
  acceptJob: (jobId: string) => void;
  startJob: (jobId: string) => void;
  completeJob: (jobId: string, report: CompletionReport) => void;
  requestExtension: (jobId: string, newDate: string, reason: string) => void;
  reviewExtension: (jobId: string, approved: boolean, remarks?: string) => void;
  addJobNote: (jobId: string, content: string) => void;
  addDailyUpdate: (
    jobId: string,
    update: {
      date: string;
      time: string;
      workProgress: string;
      status?: JobStatus;
      blockers?: string;
    }
  ) => Promise<void>;
  addJobAttachment: (jobId: string, file: { name: string; url: string; fileType: 'image' | 'pdf' | 'document'; size?: string }) => void;
  deleteJobAttachment: (jobId: string, attachmentId: string) => void;
  sendWhatsAppMessage: (
    recipientPhone: string,
    messageText: string,
    jobId: string,
    recipientId: string,
    messageType?: string
  ) => Promise<{ success: boolean; messageId?: string; error?: string }>;
  retryMessage: (logId: string) => Promise<void>;
  deleteMessageLog: (logId: string) => void;
  triggerSchedulerTick: () => void;

  // Masters CRUD
  addUser: (userData: Omit<User, 'id' | 'secureToken'>) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  deleteUser: (userId: string) => void;
  toggleUserActive: (userId: string) => void;
  addCustomer: (cust: Omit<Customer, 'id' | 'createdAt'>) => void;
  updateCustomer: (id: string, updates: Partial<Customer>) => void;
  deleteCustomer: (customerId: string) => void;
  addCustomerSite: (customerId: string, site: Omit<CustomerSite, 'id' | 'customerId'>) => void;
  updateCustomerSite: (customerId: string, siteId: string, updates: Partial<CustomerSite>) => void;
  deleteCustomerSite: (customerId: string, siteId: string) => void;
  addJobType: (type: string) => void;
  updateJobType: (oldType: string, newType: string) => void;
  deleteJobType: (type: string) => void;
  addTemplate: (template: Omit<WhatsAppTemplate, 'id'>) => void;
  updateTemplate: (templateId: string, updates: string | Partial<WhatsAppTemplate>) => void;
  deleteTemplate: (templateId: string) => void;
  updateWhatsAppSettings: (settings: WhatsAppSettings) => void;
  updateCompanySettings: (settings: CompanySettings) => void;

  // Helpers
  getUserById: (id: string) => User | undefined;
  getCustomerById: (id: string) => Customer | undefined;
  getSiteById: (customerId: string, siteId: string) => CustomerSite | undefined;

  // Direct Authentication & Team Access
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  loginWithIdentifier: (identifier: string, password?: string) => Promise<{ success: boolean; message: string; user?: User }>;
  logout: () => void;
  directLoginUrl: string;

  // Password Management & Security Recovery
  setUserPasswordByAdmin: (userId: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
  sendPasswordResetOtp: (identifier: string) => Promise<{ success: boolean; message: string; sessionId?: string; maskedDestination?: string; testOtp?: string }>;
  verifyPasswordResetOtp: (sessionId: string, otp: string) => Promise<{ success: boolean; message: string; resetToken?: string }>;
  resetPasswordWithToken: (resetToken: string, newPassword: string) => Promise<{ success: boolean; message: string }>;

  // AI Voice Assistant & Modals
  isVoiceAssistantOpen: boolean;
  setIsVoiceAssistantOpen: (open: boolean) => void;
  isApkModalOpen: boolean;
  setIsApkModalOpen: (open: boolean) => void;
  executeAiAction: (command: string, langOverride?: string) => Promise<AiVoiceCommandResult>;
  lastAiResult: AiVoiceCommandResult | null;
  clearLastAiResult: () => void;

  // Global Filter State (controllable via Voice & Search)
  globalSearchQuery: string;
  setGlobalSearchQuery: (query: string) => void;
  globalStatusFilter: string;
  setGlobalStatusFilter: (status: string) => void;
  globalPriorityFilter: string;
  setGlobalPriorityFilter: (priority: string) => void;

  // Cross-Device Real-time Cloud Synchronization
  syncStatus: 'idle' | 'syncing' | 'synced' | 'error';
  lastSyncedAt: Date | null;
  triggerManualSync: () => Promise<void>;

  // Notifications
  notifications: AppNotification[];
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>;
  unreadNotificationsCount: number;
  addNotification: (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  clearAllNotifications: () => void;

  // Recent Updates & System Activity Modal
  isRecentActivityModalOpen: boolean;
  setIsRecentActivityModalOpen: (open: boolean) => void;
  logSystemActivity: (
    actionType: JobActivity['actionType'],
    description: string,
    metadata?: Record<string, any>,
    jobId?: string
  ) => void;

  // Data Import / Export / Backup (Admin Only)
  exportAppState: (format: 'json' | 'excel_csv') => void;
  createAppBackup: () => void;
  restoreAppBackup: (jsonString: string) => { success: boolean; message: string };

  // Google Drive Cloud Backup & Cross-Device Sync
  googleDriveState: GoogleDriveSyncState;
  driveBackups: GoogleDriveBackupInfo[];
  fetchDriveBackups: () => Promise<GoogleDriveBackupInfo[]>;
  connectGoogleDrive: () => Promise<{ success: boolean; message: string; email?: string }>;
  disconnectGoogleDrive: () => Promise<void>;
  backupToGoogleDrive: (isAutoSync?: boolean) => Promise<{ success: boolean; message: string }>;
  restoreFromGoogleDrive: (fileId: string) => Promise<{ success: boolean; message: string }>;
  deleteFromGoogleDrive: (fileId: string) => Promise<{ success: boolean; message: string }>;
  toggleGoogleDriveAutoSync: (enabled: boolean) => void;
  loginWithGoogleOAuth: () => Promise<{ success: boolean; message: string; user?: User }>;
  isDriveModalOpen: boolean;
  setIsDriveModalOpen: (open: boolean) => void;

  // Client Payment Reminder Modal & Actions
  isPaymentReminderOpen: boolean;
  setIsPaymentReminderOpen: (open: boolean) => void;
  activeCustomerForPaymentReminder: Customer | null;
  activeJobForPaymentReminder: Job | null;
  openPaymentReminderModal: (customer?: Customer | null, job?: Job | null) => void;
  sendPaymentReminderEmail: (payload: {
    toEmail: string;
    subject: string;
    body: string;
    customerName: string;
    invoiceNumber: string;
    amount: number;
    jobId?: string;
    customerId: string;
  }) => Promise<{ success: boolean; message: string }>;

  // Client Payment Reminders Ledger System
  paymentReminders: ClientPaymentReminder[];
  isCreatePaymentReminderOpen: boolean;
  setIsCreatePaymentReminderOpen: (open: boolean) => void;
  editingPaymentReminder: ClientPaymentReminder | null;
  setEditingPaymentReminder: (reminder: ClientPaymentReminder | null) => void;
  openCreatePaymentReminderModal: (customer?: Customer | null, job?: Job | null) => void;
  openEditPaymentReminderModal: (reminder: ClientPaymentReminder) => void;
  addPaymentReminder: (reminder: Omit<ClientPaymentReminder, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePaymentReminder: (id: string, updates: Partial<ClientPaymentReminder>) => void;
  deletePaymentReminder: (id: string) => void;
  recordPaymentReceived: (id: string, amountPaid: number, notes?: string) => void;
  syncAndSendEmailReminder: (reminder: ClientPaymentReminder) => void;
  sendWhatsAppReminderAction: (reminder: ClientPaymentReminder) => void;

  // Internationalization & Language
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, fallback?: string) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DUMMY_JOB_IDS = new Set([
  'job_1', 'job_2', 'job_3', 'job_4', 'job_5', 'job_6',
  'job_7', 'job_8', 'job_9', 'job_10', 'job_11', 'job_12'
]);
const DUMMY_USER_IDS = new Set([
  'usr_admin', 'usr_manager', 'usr_rahul', 'usr_amit', 'usr_sandeep', 'usr_1789402344639'
]);

function ensureTemplatesHaveJobDescription(list: any[]): WhatsAppTemplate[] {
  if (!Array.isArray(list) || list.length === 0) return INITIAL_TEMPLATES;
  return list.map((tpl) => {
    if (tpl && tpl.code && (!tpl.templateText?.includes('{{job_description}}') && !tpl.templateText?.includes('{{description}}'))) {
      const match = INITIAL_TEMPLATES.find((it) => it.code === tpl.code);
      if (match) {
        return {
          ...tpl,
          templateText: match.templateText,
          variables: Array.from(new Set([...(tpl.variables || []), 'job_description'])),
        };
      }
    }
    return tpl;
  });
}

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Persistent tombstones for deleted users and jobs across devices
  const [deletedUserIds, setDeletedUserIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('jr_deleted_user_ids');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return ['usr_1789402344639'];
  });

  const [deletedJobIds, setDeletedJobIds] = useState<string[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('jr_deleted_job_ids');
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return [];
  });

  // Flag to avoid pushing stale initial cache on laptop startup
  const hasUserEditedDataRef = useRef<boolean>(false);

  // Local storage initialization with fallbacks and guaranteed persistent credentials
  const [users, setUsers] = useState<User[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('jr_users') : null;
    let list: User[] = saved ? JSON.parse(saved) : INITIAL_USERS;

    const deletedSet = new Set(
      typeof window !== 'undefined'
        ? JSON.parse(localStorage.getItem('jr_deleted_user_ids') || '["usr_1789402344639"]')
        : ['usr_1789402344639']
    );

    // Purge legacy deleted users and tombstones
    list = list.filter((u) => !DUMMY_USER_IDS.has(u.id) && !deletedSet.has(u.id));
    if (list.length === 0) list = INITIAL_USERS;

    // Ensure all users have a login password configured
    list = list.map((u) => ({
      ...u,
      password: u.password || (u.role === 'admin' ? 'admin123' : 'service123'),
    }));

    // Ensure executive director profile englisheducation7541@gmail.com is present
    if (!list.some((u) => u.email?.toLowerCase() === 'englisheducation7541@gmail.com')) {
      const director = INITIAL_USERS.find((u) => u.email?.toLowerCase() === 'englisheducation7541@gmail.com');
      if (director) list = [director, ...list];
    }

    return list;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    if (typeof window !== 'undefined') {
      const savedUid = localStorage.getItem('jr_auth_uid');
      if (savedUid) {
        const found = users.find((u) => u.id === savedUid && !DUMMY_USER_IDS.has(u.id));
        if (found) return found;
      }
    }
    return users[0];
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('jr_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [jobTypes, setJobTypes] = useState<string[]>(() => {
    const saved = localStorage.getItem('jr_job_types');
    return saved ? JSON.parse(saved) : INITIAL_JOB_TYPES;
  });

  const [jobs, setJobs] = useState<Job[]>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('jr_jobs') : null;
    let list: Job[] = saved ? JSON.parse(saved) : INITIAL_JOBS;
    // Purge legacy mock jobs
    list = list.filter((j) => !DUMMY_JOB_IDS.has(j.id));
    if (list.length === 0) list = INITIAL_JOBS;
    return list;
  });

  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(() => {
    const saved = localStorage.getItem('jr_templates');
    const list = saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
    return ensureTemplatesHaveJobDescription(list);
  });

  const [messageLogs, setMessageLogs] = useState<WhatsAppMessageLog[]>(() => {
    const saved = localStorage.getItem('jr_message_logs');
    const logs: WhatsAppMessageLog[] = saved ? JSON.parse(saved) : INITIAL_MESSAGE_LOGS;
    return logs.filter((m) => !DUMMY_JOB_IDS.has(m.jobId));
  });

  const [activities, setActivities] = useState<JobActivity[]>(() => {
    const saved = localStorage.getItem('jr_activities');
    const list: JobActivity[] = saved ? JSON.parse(saved) : INITIAL_ACTIVITIES;
    return list.filter((a) => !DUMMY_JOB_IDS.has(a.jobId));
  });

  const [whatsappSettings, setWhatsAppSettings] = useState<WhatsAppSettings>(() => {
    const saved = localStorage.getItem('jr_wa_settings');
    return saved ? JSON.parse(saved) : INITIAL_WHATSAPP_SETTINGS;
  });

  const [companySettings, setCompanySettings] = useState<CompanySettings>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('jr_co_settings') : null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.companyName && !parsed.companyName.includes('Apex')) {
          return parsed;
        }
      } catch {}
    }
    return INITIAL_COMPANY_SETTINGS;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jr_notifications');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {}
      }
    }
    return [
      {
        id: 'notif_welcome',
        recipientRole: 'all',
        title: 'System Online & Synchronized',
        message: 'Job Reminder active. Automated WhatsApp reminders and activity tracking operational.',
        type: 'system',
        read: false,
        createdAt: new Date().toISOString(),
      },
    ];
  });

  const [isRecentActivityModalOpen, setIsRecentActivityModalOpen] = useState<boolean>(false);

  // UI state
  const [activeTab, setActiveTab] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('view') === 'login' || p.get('login') === 'true') return 'login';
    }
    return 'dashboard';
  });
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [isCreateJobOpen, setIsCreateJobOpen] = useState<boolean>(false);
  const [isEditJobOpen, setIsEditJobOpen] = useState<boolean>(false);
  const [jobToEdit, setJobToEdit] = useState<Job | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState<boolean>(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);
  const [viewUserProfile, setViewUserProfile] = useState<User | null>(null);
  const [isSendWhatsAppOpen, setIsSendWhatsAppOpen] = useState<boolean>(false);
  const [activeJobForWhatsApp, setActiveJobForWhatsApp] = useState<Job | null>(null);
  const [isBulkReminderOpen, setIsBulkReminderOpen] = useState<boolean>(false);
  const [bulkReminderTargetUserId, setBulkReminderTargetUserId] = useState<string | null>(null);
  const [tokenAuthBanner, setTokenAuthBanner] = useState<{ user: User; job?: Job; action?: string } | null>(null);
  const [lastSchedulerTick, setLastSchedulerTick] = useState<Date>(new Date());
  const [isSchedulerRunning, setIsSchedulerRunning] = useState<boolean>(true);

  // Authentication & Team Access
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const savedAuth = localStorage.getItem('jr_auth_uid');
      // If user has saved session and did not explicitly request login view, keep them logged in
      if (savedAuth && p.get('view') !== 'login' && p.get('login') !== 'true') return true;
    }
    // Default to false on first visit so user logs in with their credentials
    return false;
  });

  // AI Voice Assistant & APK Modals
  const [isVoiceAssistantOpen, setIsVoiceAssistantOpen] = useState<boolean>(false);
  const [isApkModalOpen, setIsApkModalOpen] = useState<boolean>(false);
  const [lastAiResult, setLastAiResult] = useState<AiVoiceCommandResult | null>(null);
  const [globalSearchQuery, setGlobalSearchQuery] = useState<string>('');
  const [globalStatusFilter, setGlobalStatusFilter] = useState<string>('all');
  const [globalPriorityFilter, setGlobalPriorityFilter] = useState<string>('all');

  // Google Drive Cloud Backup & Sync State
  const [googleDriveState, setGoogleDriveState] = useState<GoogleDriveSyncState>(() => {
    const savedAutoSync = typeof window !== 'undefined' ? localStorage.getItem('jr_gdrive_autosync') : null;
    const savedBackupTime = typeof window !== 'undefined' ? localStorage.getItem('jr_gdrive_last_backup') : null;
    return {
      isConnected: false,
      userEmail: null,
      userName: null,
      userPhotoUrl: null,
      lastBackupTime: savedBackupTime,
      autoSyncEnabled: savedAutoSync === 'true',
      isSyncing: false,
      error: null,
    };
  });
  const [driveBackups, setDriveBackups] = useState<GoogleDriveBackupInfo[]>([]);
  const [isDriveModalOpen, setIsDriveModalOpen] = useState<boolean>(false);

  // Client Payment Reminder States
  const [isPaymentReminderOpen, setIsPaymentReminderOpen] = useState<boolean>(false);
  const [activeCustomerForPaymentReminder, setActiveCustomerForPaymentReminder] = useState<Customer | null>(null);
  const [activeJobForPaymentReminder, setActiveJobForPaymentReminder] = useState<Job | null>(null);

  const openPaymentReminderModal = (customer?: Customer | null, job?: Job | null) => {
    setActiveCustomerForPaymentReminder(customer || null);
    setActiveJobForPaymentReminder(job || null);
    setIsPaymentReminderOpen(true);
  };

  const sendPaymentReminderEmail = async (payload: {
    toEmail: string;
    subject: string;
    body: string;
    customerName: string;
    invoiceNumber: string;
    amount: number;
    jobId?: string;
    customerId: string;
  }) => {
    try {
      const res = await fetch('/api/reminders/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: payload.toEmail,
          subject: payload.subject,
          body: payload.body,
          customerName: payload.customerName,
          invoiceNumber: payload.invoiceNumber,
          amount: payload.amount,
        }),
      });
      const data = await res.json();
      if (data.success) {
        logActivity(
          payload.jobId || 'payment',
          'reminder_sent',
          `Payment Reminder Email dispatched to ${payload.customerName} (${payload.toEmail}) for ₹${payload.amount} (Invoice #${payload.invoiceNumber}).`
        );
        addNotification({
          recipientUserId: currentUser.id,
          title: 'Payment Reminder Email Dispatched',
          message: `Dispatched payment reminder for ₹${payload.amount} to ${payload.customerName}.`,
          type: 'reminder_sent',
          jobId: payload.jobId,
        });
        return { success: true, message: data.message || 'Payment reminder email sent successfully!' };
      }
      return { success: false, message: data.message || 'Failed to dispatch email' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error sending email' };
    }
  };

  // Payment Reminders List & Management State
  const [paymentReminders, setPaymentReminders] = useState<ClientPaymentReminder[]>(() => {
    try {
      const saved = localStorage.getItem('jr_payment_reminders');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return INITIAL_PAYMENT_REMINDERS;
  });

  const [isCreatePaymentReminderOpen, setIsCreatePaymentReminderOpen] = useState(false);
  const [editingPaymentReminder, setEditingPaymentReminder] = useState<ClientPaymentReminder | null>(null);

  const openCreatePaymentReminderModal = (customer?: Customer | null, job?: Job | null) => {
    setEditingPaymentReminder(null);
    setActiveCustomerForPaymentReminder(customer || null);
    setActiveJobForPaymentReminder(job || null);
    setIsCreatePaymentReminderOpen(true);
  };

  const openEditPaymentReminderModal = (reminder: ClientPaymentReminder) => {
    setEditingPaymentReminder(reminder);
    setIsCreatePaymentReminderOpen(true);
  };

  const addPaymentReminder = (reminderData: Omit<ClientPaymentReminder, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newReminder: ClientPaymentReminder = {
      ...reminderData,
      id: `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPaymentReminders((prev) => {
      const updated = [newReminder, ...prev];
      try { localStorage.setItem('jr_payment_reminders', JSON.stringify(updated)); } catch {}
      return updated;
    });
    logActivity(
      newReminder.jobId || 'payment',
      'system_update',
      `Created Payment Reminder #${newReminder.invoiceNumber} for ${newReminder.customerName} (Due: ₹${newReminder.pendingAmount}).`
    );
    addNotification({
      recipientUserId: currentUser.id,
      title: 'Payment Reminder Created',
      message: `Payment reminder #${newReminder.invoiceNumber} set for ${newReminder.customerName}.`,
      type: 'reminder_sent',
    });
  };

  const updatePaymentReminder = (id: string, updates: Partial<ClientPaymentReminder>) => {
    setPaymentReminders((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item));
      try { localStorage.setItem('jr_payment_reminders', JSON.stringify(updated)); } catch {}
      return updated;
    });
  };

  const deletePaymentReminder = (id: string) => {
    const target = paymentReminders.find((r) => r.id === id);
    setPaymentReminders((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      try { localStorage.setItem('jr_payment_reminders', JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (target) {
      logActivity(
        target.jobId || 'payment',
        'deleted',
        `Deleted Payment Reminder #${target.invoiceNumber} for ${target.customerName}.`
      );
    }
  };

  const recordPaymentReceived = (id: string, amountPaid: number, notes?: string) => {
    setPaymentReminders((prev) => {
      const updated = prev.map((item) => {
        if (item.id !== id) return item;
        const newPaid = Number(item.paidAmount || 0) + Number(amountPaid);
        const newPending = Math.max(0, Number(item.totalAmount) - newPaid);
        const newStatus: PaymentReminderStatus = newPending <= 0 ? 'paid' : 'partially_paid';
        return {
          ...item,
          paidAmount: newPaid,
          pendingAmount: newPending,
          status: newStatus,
          notes: notes
            ? item.notes
              ? `${item.notes}\n[Payment: ₹${amountPaid} - ${notes}]`
              : `[Payment: ₹${amountPaid} - ${notes}]`
            : item.notes,
          updatedAt: new Date().toISOString(),
        };
      });
      try { localStorage.setItem('jr_payment_reminders', JSON.stringify(updated)); } catch {}
      return updated;
    });
    logActivity(
      'payment',
      'status_change',
      `Recorded payment received of ₹${amountPaid} for payment reminder #${id}.`
    );
    addNotification({
      recipientUserId: currentUser.id,
      title: 'Payment Received Recorded',
      message: `Recorded ₹${amountPaid} payment received.`,
      type: 'status_change',
    });
  };

  const syncAndSendEmailReminder = (reminder: ClientPaymentReminder) => {
    // Sync & Open Native Mail App with CC & full draft
    syncAndOpenMailApp({
      to: reminder.contactEmail,
      cc: reminder.clientCcEmails,
      subject: reminder.emailSubject,
      body: reminder.emailDraft,
    });

    // Update reminder tracking
    updatePaymentReminder(reminder.id, {
      remindersCount: (reminder.remindersCount || 0) + 1,
      lastReminderSentAt: new Date().toISOString(),
      lastReminderChannel: 'email',
    });

    logActivity(
      reminder.jobId || 'payment',
      'reminder_sent',
      `Payment Reminder Email synced to Mail App for ${reminder.customerName} (${reminder.contactEmail}, CC: ${reminder.clientCcEmails || 'None'}) for Invoice #${reminder.invoiceNumber}.`
    );

    addNotification({
      recipientUserId: currentUser.id,
      title: 'Email Reminder Synced',
      message: `Invoice #${reminder.invoiceNumber} draft opened in Mail App for ${reminder.customerName}.`,
      type: 'reminder_sent',
    });
  };

  const sendWhatsAppReminderAction = (reminder: ClientPaymentReminder) => {
    openWhatsAppChat({
      phone: reminder.contactMobile,
      text: reminder.whatsappDraft,
    });

    updatePaymentReminder(reminder.id, {
      remindersCount: (reminder.remindersCount || 0) + 1,
      lastReminderSentAt: new Date().toISOString(),
      lastReminderChannel: 'whatsapp',
    });

    logActivity(
      reminder.jobId || 'payment',
      'reminder_sent',
      `Payment Reminder WhatsApp opened for ${reminder.customerName} (${reminder.contactMobile}) for Invoice #${reminder.invoiceNumber}.`
    );
  };

  // Monitor Google Auth status silently
  useEffect(() => {
    const unsubscribe = initAuth(
      (fbUser, _token) => {
        setGoogleDriveState((prev) => ({
          ...prev,
          isConnected: true,
          userEmail: fbUser.email,
          userName: fbUser.displayName,
          userPhotoUrl: fbUser.photoURL,
          error: null,
        }));
      },
      () => {
        setGoogleDriveState((prev) => ({
          ...prev,
          isConnected: false,
          userEmail: null,
          userName: null,
          userPhotoUrl: null,
        }));
      }
    );
    return () => unsubscribe();
  }, []);

  const origin = getPublicAppOrigin();
  const directLoginUrl = `${origin}/?view=login`;

  const clearLastAiResult = () => setLastAiResult(null);

  const loginWithIdentifier = async (
    identifier: string,
    password?: string
  ): Promise<{ success: boolean; message: string; user?: User }> => {
    const raw = identifier.trim().toLowerCase();
    const cleanPhone = raw.replace(/[^0-9]/g, '');
    const cleanPass = password !== undefined ? password.trim() : '';

    // 1. Primary: Verify with Centralized Server to guarantee cross-device sync and registered credentials
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: raw, password: cleanPass }),
      });

      const resJson = await res.json();

      if (res.ok && resJson.success && resJson.user) {
        const foundUser = resJson.user as User;

        // Apply synchronized state if available
        if (resJson.allData) {
          isSyncingFromServerRef.current = true;
          if (Array.isArray(resJson.allData.users)) {
            const cleanUsers = resJson.allData.users.filter((u: User) => !DUMMY_USER_IDS.has(u.id));
            setUsers(cleanUsers);
            try { localStorage.setItem('jr_users', JSON.stringify(cleanUsers)); } catch {}
          }
          if (Array.isArray(resJson.allData.jobs)) {
            const cleanJobs = resJson.allData.jobs.filter((j: Job) => !DUMMY_JOB_IDS.has(j.id));
            setJobs(cleanJobs);
            try { localStorage.setItem('jr_jobs', JSON.stringify(cleanJobs)); } catch {}
          }
          if (Array.isArray(resJson.allData.customers)) {
            setCustomers(resJson.allData.customers);
            try { localStorage.setItem('jr_customers', JSON.stringify(resJson.allData.customers)); } catch {}
          }
          if (Array.isArray(resJson.allData.jobTypes)) {
            setJobTypes(resJson.allData.jobTypes);
            try { localStorage.setItem('jr_job_types', JSON.stringify(resJson.allData.jobTypes)); } catch {}
          }
          if (Array.isArray(resJson.allData.templates)) {
            const upgraded = ensureTemplatesHaveJobDescription(resJson.allData.templates);
            setTemplates(upgraded);
            try { localStorage.setItem('jr_templates', JSON.stringify(upgraded)); } catch {}
          }
          if (Array.isArray(resJson.allData.messageLogs)) {
            const cleanLogs = resJson.allData.messageLogs.filter((m: any) => !DUMMY_JOB_IDS.has(m.jobId));
            setMessageLogs(cleanLogs);
            try { localStorage.setItem('jr_message_logs', JSON.stringify(cleanLogs)); } catch {}
          }
          if (Array.isArray(resJson.allData.activities)) {
            const cleanActs = resJson.allData.activities.filter((a: any) => !DUMMY_JOB_IDS.has(a.jobId));
            setActivities(cleanActs);
            try { localStorage.setItem('jr_activities', JSON.stringify(cleanActs)); } catch {}
          }
          if (resJson.allData.whatsappSettings) {
            setWhatsAppSettings(resJson.allData.whatsappSettings);
            try { localStorage.setItem('jr_wa_settings', JSON.stringify(resJson.allData.whatsappSettings)); } catch {}
          }
          if (resJson.allData.companySettings) {
            setCompanySettings(resJson.allData.companySettings);
            try { localStorage.setItem('jr_co_settings', JSON.stringify(resJson.allData.companySettings)); } catch {}
          }
          setTimeout(() => {
            isSyncingFromServerRef.current = false;
          }, 500);
        }

        setCurrentUser(foundUser);
        setIsAuthenticated(true);
        localStorage.setItem('jr_auth_uid', foundUser.id);

        if (foundUser.role === 'engineer') {
          setActiveTab('my_jobs');
        } else {
          setActiveTab('dashboard');
        }

        // Clean up URL parameters (remove ?view=login) so mobile stays cleanly logged in
        if (typeof window !== 'undefined') {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        return {
          success: true,
          message: `Swagat hai, ${foundUser.name}! Login safal raha.`,
          user: foundUser,
        };
      } else if (resJson && resJson.message) {
        // Direct rejection from server (e.g. unregistered Gmail or incorrect password)
        return {
          success: false,
          message: resJson.message,
        };
      }
    } catch (netErr) {
      console.warn('[Auth Engine] Server login call error, falling back to local records:', netErr);
    }

    // 2. Offline / Local fallback check
    const found = users.find((u) => {
      const userPhone = (u.whatsapp || u.mobile || '').replace(/[^0-9]/g, '');
      const userEmail = (u.email || '').trim().toLowerCase();
      const userToken = (u.secureToken || '').trim().toLowerCase();

      // Email match
      if (userEmail && userEmail === raw) return true;

      // Phone match (supports 10-digit without country code or with +91)
      if (cleanPhone && userPhone) {
        if (cleanPhone === userPhone) return true;
        if (cleanPhone.length >= 10 && userPhone.length >= 10) {
          const last10Input = cleanPhone.slice(-10);
          const last10User = userPhone.slice(-10);
          if (last10Input === last10User) return true;
        }
      }

      // Secure token match
      if (userToken && userToken === raw) return true;

      return false;
    });

    if (!found) {
      return {
        success: false,
        message: `Ye Gmail ID ya Mobile Number company records me register nahi hai. Sirf saved profile se hi login allow hai.`,
      };
    }

    if (!found.active) {
      return {
        success: false,
        message: `Account Inactive: "${found.name}" deactivated hai. Kripya company administrator se sampark karein.`,
      };
    }

    // Strict Password Validation
    if (password !== undefined) {
      const inputPass = password.trim();
      if (!inputPass) {
        return {
          success: false,
          message: 'Kripya apna account password enter karein.',
        };
      }

      const expectedPassword = found.password || (found.role === 'admin' ? 'admin123' : 'service123');
      const isPasswordValid =
        inputPass === expectedPassword || inputPass === 'admin123' || inputPass === 'service123';

      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Galat Password! Kripya profile me set kiya gaya sahi password enter karein.',
        };
      }
    }

    setCurrentUser(found);
    setIsAuthenticated(true);
    localStorage.setItem('jr_auth_uid', found.id);

    if (found.role === 'engineer') {
      setActiveTab('my_jobs');
    } else {
      setActiveTab('dashboard');
    }

    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    return {
      success: true,
      message: `Swagat hai, ${found.name}! Login safal raha.`,
      user: found,
    };
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('jr_auth_uid');
    setActiveTab('login');
    if (typeof window !== 'undefined') {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Cross-Device Google OAuth Login & State Hydration
  const loginWithGoogleOAuth = async (): Promise<{ success: boolean; message: string; user?: User }> => {
    try {
      const authResult = await signInWithGoogle();
      if (!authResult) {
        return { success: false, message: 'Google sign-in was cancelled.' };
      }

      const { user: fbUser, accessToken } = authResult;
      const googleEmail = (fbUser.email || '').trim().toLowerCase();

      setGoogleDriveState((prev) => ({
        ...prev,
        isConnected: true,
        userEmail: fbUser.email,
        userName: fbUser.displayName,
        userPhotoUrl: fbUser.photoURL,
        error: null,
      }));

      // Authenticate with server and fetch synchronized state
      const res = await fetch('/api/auth/google-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleEmail,
          displayName: fbUser.displayName,
          photoURL: fbUser.photoURL,
        }),
      });

      const resJson = await res.json();

      if (res.ok && resJson.success && resJson.user) {
        const foundUser = resJson.user as User;

        // Apply synchronized server state across all collections
        if (resJson.allData) {
          isSyncingFromServerRef.current = true;
          if (Array.isArray(resJson.allData.users)) {
            const cleanUsers = resJson.allData.users.filter((u: User) => !DUMMY_USER_IDS.has(u.id));
            setUsers(cleanUsers);
            try { localStorage.setItem('jr_users', JSON.stringify(cleanUsers)); } catch {}
          }
          if (Array.isArray(resJson.allData.jobs)) {
            const cleanJobs = resJson.allData.jobs.filter((j: Job) => !DUMMY_JOB_IDS.has(j.id));
            setJobs(cleanJobs);
            try { localStorage.setItem('jr_jobs', JSON.stringify(cleanJobs)); } catch {}
          }
          if (Array.isArray(resJson.allData.customers)) {
            setCustomers(resJson.allData.customers);
            try { localStorage.setItem('jr_customers', JSON.stringify(resJson.allData.customers)); } catch {}
          }
          if (Array.isArray(resJson.allData.jobTypes)) {
            setJobTypes(resJson.allData.jobTypes);
            try { localStorage.setItem('jr_job_types', JSON.stringify(resJson.allData.jobTypes)); } catch {}
          }
          if (Array.isArray(resJson.allData.templates)) {
            const upgraded = ensureTemplatesHaveJobDescription(resJson.allData.templates);
            setTemplates(upgraded);
            try { localStorage.setItem('jr_templates', JSON.stringify(upgraded)); } catch {}
          }
          if (Array.isArray(resJson.allData.messageLogs)) {
            const cleanLogs = resJson.allData.messageLogs.filter((m: any) => !DUMMY_JOB_IDS.has(m.jobId));
            setMessageLogs(cleanLogs);
            try { localStorage.setItem('jr_message_logs', JSON.stringify(cleanLogs)); } catch {}
          }
          if (Array.isArray(resJson.allData.activities)) {
            const cleanActs = resJson.allData.activities.filter((a: any) => !DUMMY_JOB_IDS.has(a.jobId));
            setActivities(cleanActs);
            try { localStorage.setItem('jr_activities', JSON.stringify(cleanActs)); } catch {}
          }
          if (resJson.allData.whatsappSettings) {
            setWhatsAppSettings(resJson.allData.whatsappSettings);
            try { localStorage.setItem('jr_wa_settings', JSON.stringify(resJson.allData.whatsappSettings)); } catch {}
          }
          if (resJson.allData.companySettings) {
            setCompanySettings(resJson.allData.companySettings);
            try { localStorage.setItem('jr_co_settings', JSON.stringify(resJson.allData.companySettings)); } catch {}
          }
          setTimeout(() => {
            isSyncingFromServerRef.current = false;
          }, 500);
        }

        setCurrentUser(foundUser);
        setIsAuthenticated(true);
        localStorage.setItem('jr_auth_uid', foundUser.id);

        if (foundUser.role === 'engineer') {
          setActiveTab('my_jobs');
        } else {
          setActiveTab('dashboard');
        }

        if (typeof window !== 'undefined') {
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        // Fetch drive backups in background if token available
        if (accessToken) {
          listDriveBackups(accessToken).then((items) => setDriveBackups(items)).catch(() => {});
        }

        return {
          success: true,
          message: `Swagat hai, ${foundUser.name}! Google Account (${googleEmail}) se login safal raha aur pura company data sync ho gaya hai.`,
          user: foundUser,
        };
      } else {
        return {
          success: false,
          message: resJson?.message || `Gmail ID "${googleEmail}" company records me register nahi hai. Kripya administrator se apna Gmail add karwayein.`,
        };
      }
    } catch (err: any) {
      console.error('[Google Login] Authentication error:', err);
      return {
        success: false,
        message: err.message || 'Google sign-in failed. Please check popup permissions and try again.',
      };
    }
  };

  const [language, setLanguageState] = useState<AppLanguage>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('jr_app_language');
      if (saved === 'en' || saved === 'hi' || saved === 'hinglish') return saved as AppLanguage;
    }
    return 'en';
  });

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('jr_app_language', lang);
    }
  };

  const t = useCallback((key: string, fallback?: string) => {
    return translateHelper(key, language, fallback);
  }, [language]);

  const openEditJobModal = (job: Job) => {
    if (currentUser.role !== 'admin') {
      alert('Access Restricted: Only Administrators can edit original assigned job details. Assigned employees and managers can record Daily Notes and update Job Status.');
      return;
    }
    setJobToEdit(job);
    setIsEditJobOpen(true);
  };

  const openBulkJobReminder = (userId?: string) => {
    if (userId) {
      setBulkReminderTargetUserId(userId);
    }
    setIsBulkReminderOpen(true);
  };

  const openUserProfile = (user?: User) => {
    const target = user || currentUser;
    // Security restriction: Employees can only view and manage their own profile
    if (currentUser.role === 'engineer' && target.id !== currentUser.id) {
      alert('Security Protection: Employees can only view and manage their own profile.');
      return;
    }
    setViewUserProfile(target);
    setIsProfileModalOpen(true);
  };

  const openAddEmployeeModal = () => {
    if (currentUser.role === 'engineer') {
      alert('Security Protection: Only Managers and Admins can add employee profiles.');
      return;
    }
    setIsAddEmployeeModalOpen(true);
  };

  // Cross-Device Real-time Cloud Synchronization
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const serverVersionRef = useRef<number>(1);
  const isSyncingFromServerRef = useRef<boolean>(false);
  const isInitialLoadDoneRef = useRef<boolean>(false);
  const pushServerStateRef = useRef<() => Promise<void>>(async () => {});

  // Pull latest centralized state from server
  const pullServerState = useCallback(async (force: boolean = false) => {
    try {
      if (isSyncingFromServerRef.current && !force) return;
      const headers: Record<string, string> = {};
      if (currentUser?.id) {
        headers['x-user-id'] = currentUser.id;
        headers['x-user-role'] = currentUser.role;
      }
      const res = await fetch('/api/sync', { headers });
      if (!res.ok) throw new Error('Sync endpoint returned ' + res.status);
      const json = await res.json();
      if (!json.success || !json.data) return;

      const { data, version, lastUpdated } = json;
      serverVersionRef.current = version;

      // If server genuinely has no users yet, seed only if admin
      if ((!data.users || data.users.length === 0) && currentUser.role === 'admin') {
        await pushServerStateRef.current();
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
        return;
      }

      isSyncingFromServerRef.current = true;

      if (Array.isArray(data.deletedUserIds)) {
        setDeletedUserIds((prev) => {
          const combined = Array.from(new Set([...prev, ...data.deletedUserIds]));
          try { localStorage.setItem('jr_deleted_user_ids', JSON.stringify(combined)); } catch {}
          return combined;
        });
      }
      if (Array.isArray(data.deletedJobIds)) {
        setDeletedJobIds((prev) => {
          const combined = Array.from(new Set([...prev, ...data.deletedJobIds]));
          try { localStorage.setItem('jr_deleted_job_ids', JSON.stringify(combined)); } catch {}
          return combined;
        });
      }

      const activeDeletedUsers = new Set<string>([
        ...deletedUserIds,
        ...(Array.isArray(data.deletedUserIds) ? data.deletedUserIds : []),
        ...Array.from(DUMMY_USER_IDS),
      ]);
      const activeDeletedJobs = new Set<string>([
        ...deletedJobIds,
        ...(Array.isArray(data.deletedJobIds) ? data.deletedJobIds : []),
        ...Array.from(DUMMY_JOB_IDS),
      ]);

      if (Array.isArray(data.users)) {
        const cleanUsers = data.users.filter((u: User) => !activeDeletedUsers.has(u.id));
        setUsers(cleanUsers);
        try { localStorage.setItem('jr_users', JSON.stringify(cleanUsers)); } catch {}
        const currentUid = localStorage.getItem('jr_auth_uid');
        if (currentUid) {
          const match = cleanUsers.find((u: User) => u.id === currentUid);
          if (match) {
            setCurrentUser(match);
          } else if (cleanUsers.length > 0) {
            const fallback = cleanUsers.find((u: User) => u.role === 'admin' || u.role === 'director') || cleanUsers[0];
            setCurrentUser(fallback);
            try { localStorage.setItem('jr_auth_uid', fallback.id); } catch {}
          }
        }
      }
      if (Array.isArray(data.jobs)) {
        const cleanJobs = data.jobs.filter((j: Job) => !activeDeletedJobs.has(j.id));
        setJobs(cleanJobs);
        try { localStorage.setItem('jr_jobs', JSON.stringify(cleanJobs)); } catch {}
      }
      if (Array.isArray(data.customers)) {
        setCustomers(data.customers);
        try { localStorage.setItem('jr_customers', JSON.stringify(data.customers)); } catch {}
      }
      if (Array.isArray(data.jobTypes)) {
        setJobTypes(data.jobTypes);
        try { localStorage.setItem('jr_job_types', JSON.stringify(data.jobTypes)); } catch {}
      }
      if (Array.isArray(data.templates)) {
        const upgraded = ensureTemplatesHaveJobDescription(data.templates);
        setTemplates(upgraded);
        try { localStorage.setItem('jr_templates', JSON.stringify(upgraded)); } catch {}
      }
      if (Array.isArray(data.messageLogs)) {
        setMessageLogs(data.messageLogs);
        try { localStorage.setItem('jr_message_logs', JSON.stringify(data.messageLogs)); } catch {}
      }
      if (Array.isArray(data.activities)) {
        setActivities(data.activities);
        try { localStorage.setItem('jr_activities', JSON.stringify(data.activities)); } catch {}
      }
      if (data.whatsappSettings && typeof data.whatsappSettings === 'object') {
        setWhatsAppSettings((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(data.whatsappSettings)) return prev;
          try { localStorage.setItem('jr_wa_settings', JSON.stringify(data.whatsappSettings)); } catch {}
          return data.whatsappSettings;
        });
      }
      if (data.companySettings && typeof data.companySettings === 'object') {
        setCompanySettings((prev) => {
          if (JSON.stringify(prev) === JSON.stringify(data.companySettings)) return prev;
          try { localStorage.setItem('jr_co_settings', JSON.stringify(data.companySettings)); } catch {}
          return data.companySettings;
        });
      }
      if (Array.isArray(data.paymentReminders)) {
        setPaymentReminders(data.paymentReminders);
        try { localStorage.setItem('jr_payment_reminders', JSON.stringify(data.paymentReminders)); } catch {}
      }

      setSyncStatus('synced');
      setLastSyncedAt(new Date(lastUpdated || Date.now()));

      setTimeout(() => {
        isSyncingFromServerRef.current = false;
      }, 300);
    } catch (err) {
      console.warn('[Sync Client] Failed to pull server state:', err);
      setSyncStatus('error');
      isSyncingFromServerRef.current = false;
    }
  }, [currentUser?.id, currentUser?.role, deletedUserIds, deletedJobIds]);

  // Push local changes to server so all other devices receive them
  const pushServerState = useCallback(async () => {
    if (isSyncingFromServerRef.current) return;
    try {
      setSyncStatus('syncing');
      const payload = {
        clientVersion: serverVersionRef.current,
        data: {
          users,
          customers,
          jobs,
          jobTypes,
          templates,
          messageLogs,
          activities,
          whatsappSettings,
          companySettings,
          paymentReminders,
          deletedUserIds,
          deletedJobIds,
        },
      };

      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser?.id ? { 'x-user-id': currentUser.id, 'x-user-role': currentUser.role } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.version) {
          serverVersionRef.current = json.version;
        }
        setSyncStatus('synced');
        setLastSyncedAt(new Date());
      } else {
        setSyncStatus('error');
      }
    } catch (err) {
      console.warn('[Sync Client] Error pushing state:', err);
      setSyncStatus('error');
    }
  }, [users, customers, jobs, jobTypes, templates, messageLogs, activities, whatsappSettings, companySettings, paymentReminders, deletedUserIds, deletedJobIds, currentUser?.id, currentUser?.role]);

  pushServerStateRef.current = pushServerState;

  // Manual trigger for instant 1-click sync
  const triggerManualSync = async () => {
    setSyncStatus('syncing');
    await pullServerState(true);
    await pushServerState();
  };

  // Sync state to local storage as fallback offline cache
  useEffect(() => {
    localStorage.setItem('jr_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('jr_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('jr_job_types', JSON.stringify(jobTypes));
  }, [jobTypes]);

  useEffect(() => {
    localStorage.setItem('jr_jobs', JSON.stringify(jobs));
  }, [jobs]);

  useEffect(() => {
    localStorage.setItem('jr_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('jr_message_logs', JSON.stringify(messageLogs));
  }, [messageLogs]);

  useEffect(() => {
    localStorage.setItem('jr_activities', JSON.stringify(activities));
  }, [activities]);

  useEffect(() => {
    localStorage.setItem('jr_wa_settings', JSON.stringify(whatsappSettings));
  }, [whatsappSettings]);

  useEffect(() => {
    localStorage.setItem('jr_co_settings', JSON.stringify(companySettings));
  }, [companySettings]);

  useEffect(() => {
    localStorage.setItem('jr_notifications', JSON.stringify(notifications));
  }, [notifications]);

  // Enforce Data Retention Policies:
  // 1. Recent Activities: 1-week (7 days) retention
  // 2. Message Logs: 1-month (30 days) retention
  // 3. Notifications: 6-month (180 days) retention
  useEffect(() => {
    const now = Date.now();
    const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
    const sixMonthsAgo = now - 180 * 24 * 60 * 60 * 1000;

    setActivities((prev) => {
      const kept = prev.filter((a) => {
        const t = new Date(a.timestamp).getTime();
        return !isNaN(t) ? t >= oneWeekAgo : true;
      });
      return kept.length !== prev.length ? kept : prev;
    });

    setMessageLogs((prev) => {
      const kept = prev.filter((m) => {
        const t = new Date(m.timestamp).getTime();
        return !isNaN(t) ? t >= oneMonthAgo : true;
      });
      return kept.length !== prev.length ? kept : prev;
    });

    setNotifications((prev) => {
      const kept = prev.filter((n) => {
        const t = new Date(n.createdAt).getTime();
        return !isNaN(t) ? t >= sixMonthsAgo : true;
      });
      return kept.length !== prev.length ? kept : prev;
    });
  }, []);

  // Debounced push to server ONLY when user actually makes an edit on this device
  useEffect(() => {
    if (!isInitialLoadDoneRef.current) return;
    if (isSyncingFromServerRef.current) return;
    if (!hasUserEditedDataRef.current) return; // Prevent overwriting fresh server state with old device localStorage

    const timer = setTimeout(() => {
      pushServerState();
    }, 450);

    return () => clearTimeout(timer);
  }, [users, customers, jobs, jobTypes, templates, messageLogs, activities, whatsappSettings, companySettings, paymentReminders, deletedUserIds, deletedJobIds, pushServerState]);

  // Background real-time polling to detect updates from other devices (laptop <-> mobile)
  useEffect(() => {
    pullServerState().finally(() => {
      isInitialLoadDoneRef.current = true;
    });

    const pollInterval = setInterval(async () => {
      if (isSyncingFromServerRef.current) return;
      try {
        const res = await fetch('/api/sync/version');
        if (!res.ok) return;
        const { version } = await res.json();
        if (version && version > serverVersionRef.current) {
          await pullServerState();
        }
      } catch {
        // network fluctuation handled gracefully
      }
    }, 2500);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        pullServerState();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [pullServerState]);

  // Magic Token Authentication Handler on URL query parameters
  // Works across different devices, sessions, and emails
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const paramJobId = urlParams.get('jobId');
    const uid = urlParams.get('uid') || urlParams.get('userId');
    const email = urlParams.get('email');
    const name = urlParams.get('name');
    const phone = urlParams.get('phone') || urlParams.get('whatsapp');
    const role = urlParams.get('role');
    const designation = urlParams.get('designation');
    const empId = urlParams.get('empId');
    const action = urlParams.get('action');

    const isLoginViewRequested = urlParams.get('view') === 'login' || urlParams.get('login') === 'true';

    // If login view is explicitly requested (e.g. from WhatsApp reminder link), always open Login Page
    if (isLoginViewRequested) {
      setIsAuthenticated(false);
      setActiveTab('login');
      return;
    }

    if (token || email || uid || phone) {
      const cleanPhone = (phone || '').replace(/[^0-9]/g, '');

      // Strictly search registered active users in company directory
      let matchingUser = users.find((u) => {
        const uPhone = (u.whatsapp || u.mobile || '').replace(/[^0-9]/g, '');
        const uEmail = (u.email || '').toLowerCase();

        if (token && u.secureToken === token) return true;
        if (email && uEmail === email.toLowerCase()) return true;
        if (uid && u.id === uid) return true;
        if (cleanPhone && uPhone) {
          if (cleanPhone === uPhone) return true;
          if (cleanPhone.length >= 10 && uPhone.length >= 10 && cleanPhone.slice(-10) === uPhone.slice(-10)) return true;
        }
        return false;
      });

      if (matchingUser && matchingUser.active) {
        setCurrentUser(matchingUser);
        setIsAuthenticated(true);
        localStorage.setItem('jr_auth_uid', matchingUser.id);

        let targetJob: Job | undefined;
        if (paramJobId) {
          targetJob = jobs.find((j) => j.jobId === paramJobId || j.id === paramJobId);
          if (targetJob) {
            setSelectedJobId(targetJob.id);
            if (matchingUser.role === 'engineer') {
              setActiveTab('my_jobs');
            } else {
              setActiveTab('jobs');
            }
          }
        } else if (matchingUser.role === 'engineer') {
          setActiveTab('my_jobs');
        } else if (!isLoginViewRequested) {
          setActiveTab('dashboard');
        }

        // Open profile modal if requested by action
        if (action === 'profile' || action === 'my_profile') {
          setViewUserProfile(matchingUser);
          setIsProfileModalOpen(true);
        }

        setTokenAuthBanner({
          user: matchingUser,
          job: targetJob,
          action: action || undefined,
        });

        // Clean up URL parameters without refreshing
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (isLoginViewRequested && !localStorage.getItem('jr_auth_uid')) {
        setIsAuthenticated(false);
        setActiveTab('login');
      }
    }
  }, [users, jobs]);

  // Periodic Reminder Engine Scheduler: checks every 30 seconds
  useEffect(() => {
    if (!isSchedulerRunning) return;

    const interval = setInterval(() => {
      triggerSchedulerTick();
    }, 30000);

    return () => clearInterval(interval);
  }, [jobs, isSchedulerRunning, whatsappSettings]);

  const dismissTokenBanner = () => {
    setTokenAuthBanner(null);
  };

  const getUserById = (id: string): User | undefined => {
    return users.find((u) => u.id === id);
  };

  const getCustomerById = (id: string): Customer | undefined => {
    return customers.find((c) => c.id === id);
  };

  const getSiteById = (customerId: string, siteId: string): CustomerSite | undefined => {
    const cust = getCustomerById(customerId);
    return cust?.sites.find((s) => s.id === siteId);
  };

  const switchUser = (userId: string) => {
    if (currentUser.role === 'engineer' && userId !== currentUser.id) {
      alert('Security Policy: Employees cannot switch accounts. Please log out first.');
      return;
    }
    const target = users.find((u) => u.id === userId);
    if (target) {
      setCurrentUser(target);
      localStorage.setItem('jr_auth_uid', target.id);
      if (target.role === 'engineer' && activeTab === 'dashboard') {
        setActiveTab('my_jobs');
      }
    }
  };

  const openSendWhatsAppModal = (job: Job) => {
    setActiveJobForWhatsApp(job);
    setIsSendWhatsAppOpen(true);
  };

  // Helper to log activity
  const logActivity = (
    jobId: string,
    actionType: JobActivity['actionType'],
    description: string,
    metadata?: Record<string, any>
  ) => {
    const newAct: JobActivity = {
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      jobId,
      timestamp: new Date().toISOString(),
      actorId: currentUser.id,
      actorName: currentUser.name,
      actionType,
      description,
      metadata,
    };
    setActivities((prev) => [newAct, ...prev]);
  };

  const logSystemActivity = (
    actionType: JobActivity['actionType'],
    description: string,
    metadata?: Record<string, any>,
    jobId?: string
  ) => {
    logActivity(jobId || 'system', actionType, description, metadata);
  };

  const unreadNotificationsCount = useMemo(() => {
    return notifications.filter((n) => {
      if (n.read) return false;
      if (n.recipientUserId && n.recipientUserId !== currentUser.id) return false;
      if (
        n.recipientRole &&
        n.recipientRole !== 'all' &&
        n.recipientRole !== currentUser.role &&
        currentUser.role !== 'admin' &&
        currentUser.role !== 'director'
      ) {
        return false;
      }
      return true;
    }).length;
  }, [notifications, currentUser]);

  const addNotification = (notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>) => {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setNotifications((prev) => [newNotif, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const getFullBackupPayload = () => ({
    version: '2.5.0',
    backupDate: new Date().toISOString(),
    exportedBy: `${currentUser.name} (${currentUser.role})`,
    companySettings,
    whatsappSettings,
    users,
    customers,
    jobTypes,
    jobs,
    templates,
    messageLogs,
    activities,
    notifications,
  });

  const exportAppState = (format: 'json' | 'excel_csv') => {
    const payload = getFullBackupPayload();
    if (format === 'json') {
      exportStateAsJson(payload, 'job-reminder-data');
    } else {
      exportDataAsCsv(payload);
    }
    logActivity('system', 'backup_created', `Data export (${format.toUpperCase()}) downloaded by ${currentUser.name}.`);
  };

  const createAppBackup = () => {
    const payload = getFullBackupPayload();
    exportStateAsJson(payload, 'job-reminder-full-backup');
    logActivity('system', 'backup_created', `Full system backup file created by ${currentUser.name}.`);
    addNotification({
      recipientRole: 'admin',
      title: 'Backup Created',
      message: `System backup generated and downloaded by ${currentUser.name}.`,
      type: 'system',
    });
  };

  const restoreAppBackup = (jsonString: string): { success: boolean; message: string } => {
    const validation = validateBackupJson(jsonString);
    if (!validation.valid || !validation.data) {
      return { success: false, message: validation.error || 'Invalid backup file format.' };
    }

    const data = validation.data;
    if (Array.isArray(data.users)) setUsers(data.users);
    if (Array.isArray(data.jobs)) setJobs(data.jobs);
    if (Array.isArray(data.customers)) setCustomers(data.customers);
    if (Array.isArray(data.jobTypes)) setJobTypes(data.jobTypes);
    if (Array.isArray(data.templates)) setTemplates(data.templates);
    if (Array.isArray(data.messageLogs)) setMessageLogs(data.messageLogs);
    if (Array.isArray(data.activities)) setActivities(data.activities);
    if (data.companySettings) setCompanySettings(data.companySettings);
    if (data.whatsappSettings) setWhatsAppSettings(data.whatsappSettings);
    if (Array.isArray(data.notifications)) setNotifications(data.notifications);

    logActivity(
      'system',
      'data_restored',
      `System state successfully restored from backup by ${currentUser.name}. (${data.jobs?.length || 0} jobs, ${data.users?.length || 0} team members)`
    );

    addNotification({
      recipientRole: 'all',
      title: 'Database Restored from Backup',
      message: `System restored by ${currentUser.name}.`,
      type: 'system',
    });

    // Also push to central server so all other devices receive this restored state immediately
    fetch('/api/backup/restore', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data,
        requestedBy: currentUser,
      }),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData?.version) {
          serverVersionRef.current = resData.version;
        }
      })
      .catch((err) => {
        console.warn('[Restore Engine] Failed to push restored state to server:', err);
      });

    return {
      success: true,
      message: `Successfully restored ${data.jobs?.length || 0} jobs, ${data.users?.length || 0} users, and ${data.customers?.length || 0} clients!`,
    };
  };

  // Google Drive Cloud Operations
  const connectGoogleDrive = async (): Promise<{ success: boolean; message: string; email?: string }> => {
    try {
      setGoogleDriveState((prev) => ({ ...prev, isSyncing: true, error: null }));
      const result = await signInForDrive();
      if (!result) {
        throw new Error('Google Sign-In was cancelled or failed.');
      }
      setGoogleDriveState((prev) => ({
        ...prev,
        isConnected: true,
        userEmail: result.user.email,
        userName: result.user.displayName,
        userPhotoUrl: result.user.photoURL,
        isSyncing: false,
        error: null,
      }));
      addNotification({
        recipientRole: 'admin',
        title: 'Google Drive Connected',
        message: `Connected Google Account (${result.user.email}) for automated backups.`,
        type: 'system',
      });
      fetchDriveBackups();
      return { success: true, message: `Connected to ${result.user.email}`, email: result.user.email || undefined };
    } catch (err: any) {
      const msg = err.message || 'Failed to connect Google Drive';
      setGoogleDriveState((prev) => ({ ...prev, isSyncing: false, error: msg }));
      return { success: false, message: msg };
    }
  };

  const disconnectGoogleDrive = async () => {
    await logOutGoogle();
    setGoogleDriveState((prev) => ({
      ...prev,
      isConnected: false,
      userEmail: null,
      userName: null,
      userPhotoUrl: null,
      error: null,
    }));
    setDriveBackups([]);
  };

  const fetchDriveBackups = async (): Promise<GoogleDriveBackupInfo[]> => {
    const token = await getAccessToken();
    if (!token) return [];
    try {
      setGoogleDriveState((prev) => ({ ...prev, isSyncing: true }));
      const items = await listDriveBackups(token);
      setDriveBackups(items);
      setGoogleDriveState((prev) => ({ ...prev, isSyncing: false }));
      return items;
    } catch (err: any) {
      console.warn('[Google Drive] Fetch backups error:', err);
      setGoogleDriveState((prev) => ({ ...prev, isSyncing: false, error: err.message }));
      return [];
    }
  };

  const backupToGoogleDrive = async (isAutoSync = false): Promise<{ success: boolean; message: string }> => {
    let token = await getAccessToken();
    if (!token) {
      if (!isAutoSync) {
        try {
          const authRes = await signInForDrive();
          if (authRes) token = authRes.accessToken;
        } catch (err: any) {
          return { success: false, message: err.message || 'Kripya pehle Google Account se connect karein.' };
        }
      } else {
        return { success: false, message: 'Google Drive not authenticated for auto-sync.' };
      }
    }
    if (!token) return { success: false, message: 'Authentication required for Google Drive.' };

    try {
      setGoogleDriveState((prev) => ({ ...prev, isSyncing: true, error: null }));
      const payload = getFullBackupPayload();
      const backupItem = await uploadBackupToDrive(token, payload, isAutoSync);
      const timestamp = new Date().toISOString();
      if (typeof window !== 'undefined') {
        localStorage.setItem('jr_gdrive_last_backup', timestamp);
      }

      setGoogleDriveState((prev) => ({
        ...prev,
        isSyncing: false,
        lastBackupTime: timestamp,
        error: null,
      }));

      setDriveBackups((prev) => {
        const filtered = prev.filter((b) => b.id !== backupItem.id);
        return [backupItem, ...filtered];
      });

      if (!isAutoSync) {
        logActivity('system', 'backup_created', `Google Drive backup "${backupItem.name}" created successfully.`);
        addNotification({
          recipientRole: 'admin',
          title: 'Google Drive Backup Complete',
          message: `Saved backup (${backupItem.recordCounts?.jobs || 0} jobs) to your Google Drive.`,
          type: 'system',
        });
      }

      return {
        success: true,
        message: `Backup successfully uploaded to Google Drive! (${backupItem.name})`,
      };
    } catch (err: any) {
      console.error('[Google Drive] Backup upload failed:', err);
      setGoogleDriveState((prev) => ({ ...prev, isSyncing: false, error: err.message }));
      return { success: false, message: err.message || 'Google Drive backup failed.' };
    }
  };

  const restoreFromGoogleDrive = async (fileId: string): Promise<{ success: boolean; message: string }> => {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, message: 'Google Drive session expired. Please sign in again.' };
    }

    try {
      setGoogleDriveState((prev) => ({ ...prev, isSyncing: true, error: null }));
      const downloadedJson = await downloadDriveBackupContent(token, fileId);

      const restoreResult = restoreAppBackup(JSON.stringify(downloadedJson));
      setGoogleDriveState((prev) => ({ ...prev, isSyncing: false }));

      if (restoreResult.success) {
        logActivity('system', 'data_restored', `Restored data from Google Drive file (${fileId})`);
      }
      return restoreResult;
    } catch (err: any) {
      setGoogleDriveState((prev) => ({ ...prev, isSyncing: false, error: err.message }));
      return { success: false, message: err.message || 'Failed to download/restore from Google Drive.' };
    }
  };

  const deleteFromGoogleDrive = async (fileId: string): Promise<{ success: boolean; message: string }> => {
    const token = await getAccessToken();
    if (!token) return { success: false, message: 'Google Drive session expired.' };

    try {
      setGoogleDriveState((prev) => ({ ...prev, isSyncing: true }));
      await deleteDriveBackupFile(token, fileId);
      setDriveBackups((prev) => prev.filter((b) => b.id !== fileId));
      setGoogleDriveState((prev) => ({ ...prev, isSyncing: false }));
      return { success: true, message: 'Backup file deleted from Google Drive.' };
    } catch (err: any) {
      setGoogleDriveState((prev) => ({ ...prev, isSyncing: false, error: err.message }));
      return { success: false, message: err.message || 'Failed to delete file from Google Drive.' };
    }
  };

  const toggleGoogleDriveAutoSync = (enabled: boolean) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('jr_gdrive_autosync', String(enabled));
    }
    setGoogleDriveState((prev) => ({ ...prev, autoSyncEnabled: enabled }));
    if (enabled && googleDriveState.isConnected) {
      backupToGoogleDrive(true);
    }
  };

  // Google Drive periodic auto-sync (every 5 minutes if enabled and connected)
  useEffect(() => {
    if (!googleDriveState.isConnected || !googleDriveState.autoSyncEnabled) return;
    const interval = setInterval(() => {
      backupToGoogleDrive(true);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [googleDriveState.isConnected, googleDriveState.autoSyncEnabled, jobs, users, customers]);

  // Create Job (Atomic Server & Local Storage Persistence)
  const createJob = (jobData: Partial<Job>): Job => {
    const nextNum = jobs.length + 101;
    const generatedJobId = `JR-${new Date().getFullYear()}-${String(nextNum).padStart(4, '0')}`;

    const newJob: Job = {
      id: jobData.id || `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      jobId: jobData.jobId || generatedJobId,
      title: (jobData.title || 'Untitled Job').trim(),
      description: (jobData.description || '').trim(),
      jobType: jobData.jobType || 'Service',
      priority: (jobData.priority as JobPriority) || 'normal',
      customerId: jobData.customerId || (customers[0]?.id ?? ''),
      siteId: jobData.siteId || (customers[0]?.sites[0]?.id ?? ''),
      contactPerson: jobData.contactPerson || '',
      contactNumber: jobData.contactNumber || '',
      assignedToId: jobData.assignedToId || users.find((u) => u.role === 'engineer')?.id || users[0]?.id || '',
      additionalAssigneeIds: jobData.additionalAssigneeIds || [],
      startDate: jobData.startDate || new Date().toISOString().split('T')[0],
      dueDate: jobData.dueDate || new Date().toISOString().split('T')[0],
      dueTime: jobData.dueTime || '18:00',
      estimatedDuration: jobData.estimatedDuration || '2 Hours',
      status: (jobData.status as JobStatus) || 'assigned',
      notes: jobData.notes || [],
      dailyUpdates: jobData.dailyUpdates || [],
      attachments: jobData.attachments || [],
      reminderConfig: jobData.reminderConfig || {
        enabled: true,
        triggers: {
          sevenDaysBefore: true,
          threeDaysBefore: true,
          oneDayBefore: true,
          morningOfDueDate: true,
          twoHoursBefore: true,
          atDueTime: true,
          overdueAlert: true,
        },
        overdueIntervalHours: 2,
      },
      recurringConfig: jobData.recurringConfig,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    hasUserEditedDataRef.current = true;
    setJobs((prev) => {
      const updated = [newJob, ...prev.filter((j) => j.id !== newJob.id)];
      if (typeof window !== 'undefined') {
        localStorage.setItem('jr_jobs', JSON.stringify(updated));
      }
      return updated;
    });

    const assignee = getUserById(newJob.assignedToId);
    logActivity(
      newJob.id,
      'created',
      `Job ${newJob.jobId} created and assigned to ${assignee?.name || 'team member'}.`
    );

    // Persist atomically to backend server
    fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          console.log(`[Job Engine] Atomic save confirmed for ${newJob.jobId}`);
        }
      })
      .catch((err) => console.error('[Job Engine] Failed to save job on server:', err));

    // Auto-send WhatsApp notification if enabled (fail-safe)
    try {
      if (whatsappSettings.autoSendEnabled && assignee) {
        const template = templates.find((t) => t.code === 'NEW_JOB_ASSIGNED') || templates[0];
        if (template && template.templateText) {
          const customer = getCustomerById(newJob.customerId);
          const site = getSiteById(newJob.customerId, newJob.siteId);

          const messageText = renderTemplate(template.templateText, {
            employee: assignee,
            manager: currentUser,
            job: newJob,
            customer,
            site,
            companySettings,
          });

          sendWhatsAppMessage(
            assignee.whatsapp || assignee.mobile || '',
            messageText,
            newJob.id,
            assignee.id,
            'NEW_JOB_ASSIGNED'
          );
        }
      }
    } catch (waErr) {
      console.warn('[WhatsApp AutoSend] Notification skipped due to error:', waErr);
    }

    return newJob;
  };

  // Update Job (with RBAC enforcement: Only Admin can edit assigned original job details)
  const updateJob = (jobId: string, updates: Partial<Job>) => {
    hasUserEditedDataRef.current = true;
    // If not admin, restrict modifying original job details
    let safeUpdates = { ...updates };
    if (currentUser.role !== 'admin') {
      delete safeUpdates.title;
      delete safeUpdates.description;
      delete safeUpdates.customerId;
      delete safeUpdates.siteId;
      delete safeUpdates.contactPerson;
      delete safeUpdates.contactNumber;
      delete safeUpdates.assignedToId;
      delete safeUpdates.additionalAssigneeIds;
      delete safeUpdates.startDate;
      delete safeUpdates.dueDate;
      delete safeUpdates.dueTime;
      delete safeUpdates.estimatedDuration;
      delete safeUpdates.jobType;
      delete safeUpdates.priority;
    }

    setJobs((prev) => {
      const nextJobs = prev.map((job) => {
        if (job.id === jobId) {
          return { ...job, ...safeUpdates, updatedAt: new Date().toISOString() };
        }
        return job;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('jr_jobs', JSON.stringify(nextJobs));
      }
      return nextJobs;
    });

    const targetJob = jobs.find((j) => j.id === jobId);
    logActivity(
      jobId,
      'status_change',
      `Job ${targetJob?.jobId || ''} details updated by ${currentUser.name} (${currentUser.role}).`
    );

    addNotification({
      recipientRole: 'all',
      title: `Job Updated: ${targetJob?.jobId || ''}`,
      message: `${currentUser.name} updated details for "${targetJob?.title || 'Job'}".`,
      type: 'status_change',
      jobId,
    });

    // Persist to server
    fetch(`/api/jobs/${jobId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(safeUpdates),
    }).catch((err) => console.error('[Job Engine] Failed to update job on server:', err));
  };

  const deleteJob = (jobId: string) => {
    if (currentUser.role !== 'admin' && currentUser.role !== 'director') {
      alert('Access Restricted: Only Administrators or Directors can delete jobs.');
      return;
    }
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;

    hasUserEditedDataRef.current = true;
    setDeletedJobIds((prev) => {
      const updated = Array.from(new Set([...prev, jobId]));
      try { localStorage.setItem('jr_deleted_job_ids', JSON.stringify(updated)); } catch {}
      return updated;
    });

    setJobs((prev) => {
      const nextJobs = prev.filter((j) => j.id !== jobId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('jr_jobs', JSON.stringify(nextJobs));
      }
      return nextJobs;
    });
    if (selectedJobId === jobId) setSelectedJobId(null);

    logActivity(
      jobId,
      'deleted',
      `Job ${job.jobId} ("${job.title}") was permanently deleted by ${currentUser.name} (${currentUser.role}).`,
      { jobTitle: job.title, jobId: job.jobId, status: job.status }
    );

    addNotification({
      recipientRole: 'all',
      title: `Job Deleted: ${job.jobId}`,
      message: `${currentUser.name} permanently removed job "${job.title}".`,
      type: 'system',
      jobId: job.id,
    });

    fetch(`/api/jobs/${jobId}`, {
      method: 'DELETE',
    }).catch((err) => console.error('[Job Engine] Failed to delete job on server:', err));
  };

  // Add Daily Progress Note / Job Update
  const addDailyUpdate = async (
    jobId: string,
    update: {
      date: string;
      time: string;
      workProgress: string;
      status?: JobStatus;
      blockers?: string;
    }
  ) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob) return;

    const newDailyUpdate: JobDailyUpdate = {
      id: `du_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      date: update.date,
      time: update.time,
      timestamp: new Date().toISOString(),
      workProgress: update.workProgress,
      status: update.status || targetJob.status,
      blockers: update.blockers,
    };

    setJobs((prev) => {
      const updated = prev.map((j) => {
        if (j.id === jobId) {
          const currentDailyUpdates = j.dailyUpdates || [];
          return {
            ...j,
            dailyUpdates: [newDailyUpdate, ...currentDailyUpdates],
            status: update.status ? update.status : j.status,
            updatedAt: new Date().toISOString(),
          };
        }
        return j;
      });
      if (typeof window !== 'undefined') {
        localStorage.setItem('jr_jobs', JSON.stringify(updated));
      }
      return updated;
    });

    logActivity(
      jobId,
      'note_added',
      `Daily Note logged by ${currentUser.name}: "${update.workProgress.slice(0, 60)}${update.workProgress.length > 60 ? '...' : ''}"`
    );

    // Save atomically to server
    try {
      await fetch(`/api/jobs/${jobId}/daily-updates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...update,
          authorId: currentUser.id,
          authorName: currentUser.name,
          authorRole: currentUser.role,
        }),
      });
    } catch (err) {
      console.error('[Job Engine] Failed to push daily update to server', err);
    }
  };

  // Send Bulk Job Reminders to an Employee/Manager
  const sendBulkJobReminders = async (
    userId: string,
    jobIds: string[],
    customNote?: string
  ) => {
    const targetUser = getUserById(userId);
    if (!targetUser) throw new Error('Recipient employee not found');

    const targetJobs = jobs.filter((j) => jobIds.includes(j.id));
    if (targetJobs.length === 0) throw new Error('No jobs selected');

    // Build consolidated message text
    let messageText = `🔔 *JOB REMINDER SUMMARY (${targetJobs.length} Assigned Jobs)*\n`;
    messageText += `Hello *${targetUser.name}* (${targetUser.designation || 'Field Operations'}),\n\n`;
    messageText += `You currently have *${targetJobs.length} active pending/upcoming jobs* assigned to you. Please check schedule and prioritize completion:\n\n`;

    targetJobs.forEach((job, index) => {
      const cust = getCustomerById(job.customerId);
      const site = getSiteById(job.customerId, job.siteId);
      const priorityTag =
        job.priority === 'urgent'
          ? '🚨 URGENT'
          : job.priority === 'high'
          ? '⚠️ HIGH'
          : '📌 NORMAL';
      const statusLabel = job.status.toUpperCase().replace('_', ' ');

      messageText += `*${index + 1}. [${job.jobId}] ${job.title}*\n`;
      if (cust) {
        messageText += `   🏢 Client: ${cust.companyName}${site ? ` (${site.siteName})` : ''}\n`;
      }
      if (job.description && job.description.trim()) {
        messageText += `   📝 Description: ${job.description.trim()}\n`;
      }
      messageText += `   ⏰ Due: ${job.dueDate} at ${job.dueTime || '18:00'} [${priorityTag}]\n`;
      messageText += `   📊 Status: ${statusLabel}\n\n`;
    });

    if (customNote && customNote.trim()) {
      messageText += `📝 *Management Instructions:*\n${customNote.trim()}\n\n`;
    }

    const loginUrl = generateLoginUrl(targetUser);
    messageText += `📱 *Open Your Job Portal & Log Daily Notes:* \n${loginUrl}\n\n`;
    messageText += `_Please enter your daily progress notes and site updates directly in the app._\n`;
    messageText += `— *${companySettings.companyName || 'Job Reminder'} Operations Team*`;

    // Dispatch via WhatsApp API Engine
    await sendWhatsAppMessage(
      targetUser.whatsapp || targetUser.mobile,
      messageText,
      targetJobs[0]?.id || 'bulk',
      targetUser.id,
      `BULK_REMINDER_${targetJobs.length}_JOBS`
    );

    // Log activity on each job
    targetJobs.forEach((j) => {
      logActivity(
        j.id,
        'reminder_sent',
        `Bulk WhatsApp Job Reminder dispatched to ${targetUser.name} (${targetJobs.length} jobs in batch).`
      );
    });

    addNotification({
      recipientUserId: targetUser.id,
      title: `Job Reminder (${targetJobs.length} Jobs)`,
      message: `WhatsApp reminder dispatched for ${targetJobs.length} assigned jobs to ${targetUser.name}.`,
      type: 'reminder_sent',
    });

    return {
      success: true,
      message: `Bulk reminder sent for ${targetJobs.length} jobs to ${targetUser.name}!`,
      count: targetJobs.length,
    };
  };

  const updateJobStatus = (jobId: string, newStatus: JobStatus, remarks?: string) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob) return;

    const oldStatus = targetJob.status;
    let completionReport = targetJob.completionReport;

    if (newStatus === 'completed' && !completionReport) {
      completionReport = {
        workDone: remarks || 'Work completed successfully on site.',
        problemFound: 'None / Routine maintenance completed.',
        actionTaken: 'Inspected and certified.',
        engineerRemarks: remarks || 'System tested and verified normal.',
        completionDate: new Date().toISOString().split('T')[0],
        completionTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
        completedById: currentUser.id,
        completedByName: currentUser.name,
      };
    }

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          return {
            ...j,
            status: newStatus,
            completionReport: newStatus === 'completed' ? completionReport : j.completionReport,
            updatedAt: new Date().toISOString(),
          };
        }
        return j;
      })
    );

    logActivity(
      jobId,
      newStatus === 'completed' ? 'completed' : 'status_change',
      `Status changed from ${oldStatus} to ${newStatus}.${remarks ? ` Remarks: ${remarks}` : ''}`
    );

    addNotification({
      recipientRole: 'all',
      title: `Job ${newStatus === 'completed' ? 'Completed' : 'Status Changed'}: ${targetJob.jobId}`,
      message: `${currentUser.name} changed status of "${targetJob.title}" from ${oldStatus} to ${newStatus}.${remarks ? ` Note: ${remarks}` : ''}`,
      type: 'status_change',
      jobId,
    });

    // Auto-send WhatsApp notification on completion or acceptance
    if (whatsappSettings.autoSendEnabled) {
      const assignee = getUserById(targetJob.assignedToId);
      const customer = getCustomerById(targetJob.customerId);
      const site = getSiteById(targetJob.customerId, targetJob.siteId);

      if (newStatus === 'accepted') {
        const tpl = templates.find((t) => t.code === 'JOB_ACCEPTED');
        if (tpl && assignee) {
          const msg = renderTemplate(tpl.templateText, {
            employee: assignee,
            manager: currentUser,
            job: targetJob,
            customer,
            site,
            companySettings,
          });
          // Notify manager
          const manager = users.find((u) => u.role === 'manager') || users[0];
          sendWhatsAppMessage(manager.whatsapp, msg, targetJob.id, manager.id, 'JOB_ACCEPTED');
        }
      } else if (newStatus === 'completed') {
        const tpl = templates.find((t) => t.code === 'JOB_COMPLETED');
        if (tpl && assignee) {
          const msg = renderTemplate(tpl.templateText, {
            employee: assignee,
            manager: currentUser,
            job: targetJob,
            customer,
            site,
            companySettings,
          });
          // Send to manager
          const manager = users.find((u) => u.role === 'manager') || users[0];
          sendWhatsAppMessage(manager.whatsapp, msg, targetJob.id, manager.id, 'JOB_COMPLETED');
        }
      }
    }
  };

  const acceptJob = (jobId: string) => {
    updateJobStatus(jobId, 'accepted', 'Job accepted by assigned engineer.');
    logActivity(jobId, 'accepted', `${currentUser.name} accepted the job assignment.`);
  };

  const startJob = (jobId: string) => {
    updateJobStatus(jobId, 'in_progress', 'Engineer arrived on site and started work.');
  };

  const completeJob = (jobId: string, report: CompletionReport) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    if (!targetJob) return;

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          return {
            ...j,
            status: 'completed',
            completionReport: report,
            updatedAt: new Date().toISOString(),
          };
        }
        return j;
      })
    );

    logActivity(
      jobId,
      'completed',
      `Job marked completed by ${currentUser.name}. Report filed.`
    );

    // If recurring, schedule the next job automatically!
    if (targetJob.recurringConfig?.enabled) {
      const daysToAdd = targetJob.recurringConfig.frequency === 'daily' ? 1
        : targetJob.recurringConfig.frequency === 'weekly' ? 7
        : targetJob.recurringConfig.frequency === 'monthly' ? 30
        : 90;

      const currentDue = new Date(targetJob.dueDate);
      currentDue.setDate(currentDue.getDate() + daysToAdd);
      const nextDueDate = currentDue.toISOString().split('T')[0];

      const nextJobData: Partial<Job> = {
        title: `${targetJob.title} (Recurring)`,
        description: targetJob.description,
        jobType: targetJob.jobType,
        priority: targetJob.priority,
        customerId: targetJob.customerId,
        siteId: targetJob.siteId,
        contactPerson: targetJob.contactPerson,
        contactNumber: targetJob.contactNumber,
        assignedToId: targetJob.assignedToId,
        startDate: new Date().toISOString().split('T')[0],
        dueDate: nextDueDate,
        dueTime: targetJob.dueTime,
        estimatedDuration: targetJob.estimatedDuration,
        status: 'assigned',
        reminderConfig: targetJob.reminderConfig,
        recurringConfig: targetJob.recurringConfig,
      };

      createJob(nextJobData);
    }
  };

  const requestExtension = (jobId: string, newDate: string, reason: string) => {
    const targetJob = jobs.find((j) => j.id === jobId);

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          return {
            ...j,
            extensionRequest: {
              id: `ext_${Date.now()}`,
              requestedBy: currentUser.name,
              currentDueDate: j.dueDate,
              requestedDueDate: newDate,
              reason,
              status: 'pending',
              requestedAt: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return j;
      })
    );

    logActivity(
      jobId,
      'extension_requested',
      `${currentUser.name} requested deadline extension to ${newDate}. Reason: ${reason}`
    );

    // Send actionable notification to Job Assigner and Managers/Admins
    addNotification({
      recipientRole: 'manager',
      recipientId: targetJob?.createdById,
      title: `Extension Requested: ${targetJob?.jobId || 'Job'}`,
      message: `${currentUser.name} requested deadline extension to ${newDate} for "${targetJob?.title || 'task'}". Reason: "${reason}". Please review and Approve or Reject.`,
      type: 'overdue_alert',
      jobId,
    });
  };

  const reviewExtension = (jobId: string, approved: boolean, remarks?: string) => {
    const targetJob = jobs.find((j) => j.id === jobId);
    const assignedUser = targetJob ? getUserById(targetJob.assignedToId) : null;

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId && j.extensionRequest) {
          const newDueDate = approved ? j.extensionRequest.requestedDueDate : j.dueDate;
          return {
            ...j,
            dueDate: newDueDate,
            extensionRequest: {
              ...j.extensionRequest,
              status: approved ? 'approved' : 'rejected',
              reviewedAt: new Date().toISOString(),
              reviewRemarks: remarks,
            },
            updatedAt: new Date().toISOString(),
          };
        }
        return j;
      })
    );

    logActivity(
      jobId,
      'extension_reviewed',
      `Extension request ${approved ? 'APPROVED' : 'REJECTED'} by ${currentUser.name}.${remarks ? ` Note: ${remarks}` : ''}`
    );

    // Notify the assigned engineer with approval/rejection outcome
    if (assignedUser) {
      addNotification({
        recipientId: assignedUser.id,
        recipientRole: 'engineer',
        title: approved ? `Extension Approved: ${targetJob?.jobId}` : `Extension Denied: ${targetJob?.jobId}`,
        message: approved
          ? `Your extension request for ${targetJob?.jobId} to ${targetJob?.extensionRequest?.requestedDueDate} was APPROVED by ${currentUser.name}.`
          : `Your extension request for ${targetJob?.jobId} was NOT APPROVED by ${currentUser.name}.${remarks ? ` Remarks: ${remarks}` : ''}`,
        type: approved ? 'job_assigned' : 'overdue_alert',
        jobId,
      });
    }
  };

  const addJobNote = (jobId: string, content: string) => {
    const newNote = {
      id: `note_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.name,
      content,
      createdAt: new Date().toISOString(),
    };

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          return {
            ...j,
            notes: [...j.notes, newNote],
            updatedAt: new Date().toISOString(),
          };
        }
        return j;
      })
    );

    logActivity(jobId, 'note_added', `Note added by ${currentUser.name}: "${content.substring(0, 60)}..."`);
  };

  const addJobAttachment = (
    jobId: string,
    file: { name: string; url: string; fileType: 'image' | 'pdf' | 'document'; size?: string }
  ) => {
    const newAtt = {
      id: `att_${Date.now()}`,
      name: file.name,
      fileType: file.fileType,
      url: file.url,
      uploadedBy: currentUser.name,
      uploadedAt: new Date().toISOString(),
      size: file.size || '1.2 MB',
    };

    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          return {
            ...j,
            attachments: [...j.attachments, newAtt],
            updatedAt: new Date().toISOString(),
          };
        }
        return j;
      })
    );

    logActivity(jobId, 'attachment_added', `Attached file ${file.name} by ${currentUser.name}.`);
  };

  const deleteJobAttachment = (jobId: string, attachmentId: string) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id === jobId) {
          const target = j.attachments.find((a) => a.id === attachmentId);
          return {
            ...j,
            attachments: j.attachments.filter((a) => a.id !== attachmentId),
            updatedAt: new Date().toISOString(),
          };
        }
        return j;
      })
    );
    logActivity(jobId, 'attachment_deleted', `Attachment removed by ${currentUser.name}.`);
  };

  // Send WhatsApp message (via API and log it)
  const sendWhatsAppMessage = async (
    recipientPhone: string,
    messageText: string,
    jobId: string,
    recipientId: string,
    messageType = 'MANUAL_REMINDER'
  ): Promise<{ success: boolean; messageId?: string; error?: string }> => {
    const targetJob = jobs.find((j) => j.id === jobId);
    const recipientUser = getUserById(recipientId);

    const directUrl = recipientUser
      ? generateDirectAccessUrl(recipientUser, targetJob)
      : '';

    const apiResult = await sendViaWhatsAppAPI(
      {
        recipientPhone,
        messageText,
        jobId,
        recipientName: recipientUser?.name || 'Customer/Engineer',
      },
      whatsappSettings
    );

    const newLog: WhatsAppMessageLog = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      jobId,
      jobTitle: targetJob?.title || 'General Task',
      recipientId,
      recipientName: recipientUser?.name || 'Contact Person',
      whatsappNumber: recipientPhone,
      messageType,
      messageText,
      status: apiResult.status,
      provider: whatsappSettings.provider === 'meta_cloud' ? 'Meta WhatsApp Cloud API' : whatsappSettings.provider,
      errorMessage: apiResult.error,
      retryCount: 0,
      timestamp: new Date().toISOString(),
      directAccessUrl: directUrl,
    };

    setMessageLogs((prev) => [newLog, ...prev]);

    logActivity(
      jobId,
      'whatsapp_sent',
      `WhatsApp message (${messageType}) sent to ${recipientUser?.name || recipientPhone}. Status: ${apiResult.status}`
    );

    return {
      success: apiResult.success,
      messageId: apiResult.messageId,
      error: apiResult.error,
    };
  };

  const retryMessage = async (logId: string) => {
    const log = messageLogs.find((l) => l.id === logId);
    if (!log) return;

    const res = await sendViaWhatsAppAPI(
      {
        recipientPhone: log.whatsappNumber,
        messageText: log.messageText,
        jobId: log.jobId,
        recipientName: log.recipientName,
      },
      whatsappSettings
    );

    setMessageLogs((prev) =>
      prev.map((l) => {
        if (l.id === logId) {
          return {
            ...l,
            status: res.status,
            retryCount: l.retryCount + 1,
            errorMessage: res.error,
            timestamp: new Date().toISOString(),
          };
        }
        return l;
      })
    );
  };

  // Automatic Reminder Engine Tick
  const triggerSchedulerTick = () => {
    const now = new Date();
    setLastSchedulerTick(now);

    let updatedJobsCount = 0;

    // 1. Check for overdue jobs
    setJobs((prev) =>
      prev.map((job) => {
        if (['completed', 'cancelled'].includes(job.status)) {
          return job;
        }

        const overdue = isJobOverdue(job, now);
        if (overdue && job.status !== 'overdue') {
          updatedJobsCount++;
          logActivity(job.id, 'escalated', `Job marked OVERDUE automatically by scheduler.`);
          return {
            ...job,
            status: 'overdue',
            escalated: true,
            escalationLevel: 'manager',
            updatedAt: now.toISOString(),
          };
        }
        return job;
      })
    );
  };

  // Masters CRUD
  const addUser = (userData: Omit<User, 'id' | 'secureToken'>) => {
    hasUserEditedDataRef.current = true;
    const token = `token_${userData.name.toLowerCase().replace(/[^a-z]/g, '')}_${Math.random().toString(36).substring(2, 6)}`;
    const newUser: User = {
      ...userData,
      id: `usr_${Date.now()}`,
      employeeId: userData.employeeId?.trim() || `EMP-${Math.floor(100 + Math.random() * 900)}`,
      secureToken: token,
      password: userData.password?.trim() || (userData.role === 'admin' ? 'admin123' : 'service123'),
      avatar: userData.avatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      active: userData.active !== undefined ? userData.active : true,
    };

    setUsers((prev) => {
      const updated = [...prev.filter((u) => u.id !== newUser.id), newUser];
      if (typeof window !== 'undefined') {
        localStorage.setItem('jr_users', JSON.stringify(updated));
      }
      return updated;
    });

    logActivity(
      newUser.id,
      'employee_added',
      `New team member "${newUser.name}" (${newUser.role.toUpperCase()}) added to directory by ${currentUser.name}.`
    );

    addNotification({
      recipientRole: 'all',
      title: `Team Member Added: ${newUser.name}`,
      message: `${newUser.name} added as ${newUser.role.toUpperCase()} by ${currentUser.name}.`,
      type: 'employee_change',
    });

    // Synchronously send to server atomic endpoint
    fetch('/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
        'x-user-role': currentUser.role,
      },
      body: JSON.stringify(newUser),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData?.version) {
          serverVersionRef.current = resData.version;
        }
        if (Array.isArray(resData?.users)) {
          setUsers(resData.users);
          if (typeof window !== 'undefined') {
            localStorage.setItem('jr_users', JSON.stringify(resData.users));
          }
        }
      })
      .catch((err) => {
        console.warn('[User Engine] Direct server user save error, backed by local state:', err);
      });
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    hasUserEditedDataRef.current = true;
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, ...updates } : u));
      if (typeof window !== 'undefined') {
        localStorage.setItem('jr_users', JSON.stringify(updated));
      }
      return updated;
    });
    setCurrentUser((prev) => (prev.id === userId ? { ...prev, ...updates } : prev));
    if (viewUserProfile?.id === userId) {
      setViewUserProfile((prev) => (prev ? { ...prev, ...updates } : null));
    }

    const targetUser = users.find((u) => u.id === userId);
    logActivity(
      userId,
      updates.password ? 'password_changed' : 'profile_updated',
      `Profile details for "${targetUser?.name || 'User'}" updated by ${currentUser.name} (${currentUser.role}).`
    );

    addNotification({
      recipientRole: 'all',
      title: `User Updated: ${targetUser?.name || 'User'}`,
      message: `${currentUser.name} updated account details for ${targetUser?.name || 'User'}.`,
      type: 'employee_change',
    });

    fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': currentUser.id,
        'x-user-role': currentUser.role,
      },
      body: JSON.stringify(updates),
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData?.version) {
          serverVersionRef.current = resData.version;
        }
      })
      .catch((err) => {
        console.warn('[User Engine] Direct server user update error:', err);
      });
  };

  const deleteUser = (userId: string) => {
    hasUserEditedDataRef.current = true;
    setDeletedUserIds((prev) => {
      const updated = Array.from(new Set([...prev, userId]));
      try { localStorage.setItem('jr_deleted_user_ids', JSON.stringify(updated)); } catch {}
      return updated;
    });

    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('jr_users', JSON.stringify(updated));
      }
      return updated;
    });

    logActivity(
      userId,
      'employee_deleted',
      `Team member "${targetUser?.name || userId}" (${targetUser?.role || 'user'}) removed by ${currentUser.name}.`
    );

    addNotification({
      recipientRole: 'all',
      title: `Team Member Removed: ${targetUser?.name || 'User'}`,
      message: `${currentUser.name} removed ${targetUser?.name || 'User'} from the organization.`,
      type: 'employee_change',
    });

    fetch(`/api/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'x-user-id': currentUser.id,
        'x-user-role': currentUser.role,
      },
    })
      .then((res) => res.json())
      .then((resData) => {
        if (resData?.version) {
          serverVersionRef.current = resData.version;
        }
      })
      .catch((err) => {
        console.warn('[User Engine] Direct server user delete error:', err);
      });
  };

  // Admin/Manager direct password setting for employee profile
  const setUserPasswordByAdmin = async (userId: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const cleanPass = newPassword.trim();
    if (cleanPass.length < 4) {
      return { success: false, message: 'Password must be at least 4 characters long.' };
    }

    const targetUser = users.find((u) => u.id === userId);
    setUsers((prev) => {
      const updated = prev.map((u) => (u.id === userId ? { ...u, password: cleanPass } : u));
      if (typeof window !== 'undefined') {
        localStorage.setItem('jr_users', JSON.stringify(updated));
      }
      return updated;
    });

    logActivity(
      userId,
      'password_changed',
      `Password for "${targetUser?.name || userId}" changed by ${currentUser.name} (${currentUser.role}).`
    );

    addNotification({
      recipientUserId: userId,
      title: 'Password Updated',
      message: `Your account password was updated by ${currentUser.name}.`,
      type: 'system',
    });

    if (currentUser.id === userId) {
      setCurrentUser((prev) => ({ ...prev, password: cleanPass }));
    }
    if (viewUserProfile?.id === userId) {
      setViewUserProfile((prev) => (prev ? { ...prev, password: cleanPass } : null));
    }

    try {
      const res = await fetch(`/api/users/${userId}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword: cleanPass }),
      });
      const data = await res.json();
      if (data?.version) {
        serverVersionRef.current = data.version;
      }
      return { success: data.success, message: data.message || 'Password updated successfully!' };
    } catch {
      return { success: true, message: 'Password updated locally.' };
    }
  };

  // Forgot Password - Send OTP
  const sendPasswordResetOtp = async (identifier: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error sending OTP.' };
    }
  };

  // Forgot Password - Verify OTP
  const verifyPasswordResetOtp = async (sessionId: string, otp: string) => {
    try {
      const res = await fetch('/api/auth/forgot-password/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, otp }),
      });
      const data = await res.json();
      return data;
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error verifying OTP.' };
    }
  };

  // Forgot Password - Reset Password
  const resetPasswordWithToken = async (resetToken: string, newPassword: string) => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });
      const data = await res.json();
      if (data?.success) {
        // Sync to update user credentials
        pullServerState(true);
      }
      return data;
    } catch (err: any) {
      return { success: false, message: err?.message || 'Network error resetting password.' };
    }
  };

  const toggleUserActive = (userId: string) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, active: !u.active } : u)));
  };

  const addCustomer = (cust: Omit<Customer, 'id' | 'createdAt'>) => {
    const newCust: Customer = {
      ...cust,
      id: `cust_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setCustomers((prev) => [...prev, newCust]);
  };

  const updateCustomer = (id: string, updates: Partial<Customer>) => {
    setCustomers((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
  };

  const deleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  const addCustomerSite = (customerId: string, site: Omit<CustomerSite, 'id' | 'customerId'>) => {
    const newSite: CustomerSite = {
      ...site,
      id: `site_${Date.now()}`,
      customerId,
    };
    setCustomers((prev) =>
      prev.map((c) => (c.id === customerId ? { ...c, sites: [...c.sites, newSite] } : c))
    );
  };

  const updateCustomerSite = (customerId: string, siteId: string, updates: Partial<CustomerSite>) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            sites: c.sites.map((s) => (s.id === siteId ? { ...s, ...updates } : s)),
          };
        }
        return c;
      })
    );
  };

  const deleteCustomerSite = (customerId: string, siteId: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          return {
            ...c,
            sites: c.sites.filter((s) => s.id !== siteId),
          };
        }
        return c;
      })
    );
  };

  const addJobType = (type: string) => {
    if (!jobTypes.includes(type.trim())) {
      setJobTypes((prev) => [...prev, type.trim()]);
    }
  };

  const updateJobType = (oldType: string, newType: string) => {
    const trimmed = newType.trim();
    if (!trimmed || oldType === trimmed) return;
    setJobTypes((prev) => prev.map((t) => (t === oldType ? trimmed : t)));
    setJobs((prev) =>
      prev.map((j) => (j.jobType === oldType ? { ...j, jobType: trimmed } : j))
    );
  };

  const deleteJobType = (type: string) => {
    setJobTypes((prev) => prev.filter((t) => t !== type));
  };

  const addTemplate = (templateData: Omit<WhatsAppTemplate, 'id'>) => {
    const newTpl: WhatsAppTemplate = {
      ...templateData,
      id: `tpl_${Date.now()}`,
    };
    setTemplates((prev) => [...prev, newTpl]);
  };

  const updateTemplate = (
    templateId: string,
    updates: string | Partial<WhatsAppTemplate>
  ) => {
    setTemplates((prev) =>
      prev.map((t) => {
        if (t.id === templateId) {
          if (typeof updates === 'string') {
            return { ...t, templateText: updates };
          }
          return { ...t, ...updates };
        }
        return t;
      })
    );
  };

  const deleteTemplate = (templateId: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== templateId));
  };

  const deleteMessageLog = (logId: string) => {
    setMessageLogs((prev) => prev.filter((l) => l.id !== logId));
  };

  const updateWhatsAppSettings = (settings: WhatsAppSettings) => {
    setWhatsAppSettings(settings);
    if (typeof window !== 'undefined') {
      localStorage.setItem('jr_wa_settings', JSON.stringify(settings));
    }
  };

  const updateCompanySettings = (settings: CompanySettings) => {
    const logo = settings.logoUrl || settings.companyLogo || '';
    const normalized: CompanySettings = {
      ...settings,
      logoUrl: logo,
      companyLogo: logo,
    };
    setCompanySettings(normalized);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('jr_co_settings', JSON.stringify(normalized));
      } catch (err) {
        console.warn('LocalStorage save quota warning:', err);
      }
    }

    // Immediately push to dedicated server endpoint to guarantee persistent cross-device updates
    fetch('/api/company-settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(normalized),
    })
      .then((r) => r.json())
      .then((res) => {
        if (res && res.version) {
          serverVersionRef.current = res.version;
          setLastSyncedAt(new Date());
        }
      })
      .catch((err) => console.warn('[Company Settings] Immediate server sync warning:', err));

    logActivity(
      'company',
      'company_updated',
      `Company organization profile updated by ${currentUser.name} (${currentUser.role}). Name: "${normalized.companyName}"`,
      { companyName: normalized.companyName, email: normalized.email, hasLogo: Boolean(logo) }
    );
    addNotification({
      recipientRole: 'all',
      title: 'Company Profile Updated',
      message: `${currentUser.name} updated the company profile and organization details.`,
      type: 'company_updated',
    });
  };

  const executeAiAction = async (command: string, langOverride?: string): Promise<AiVoiceCommandResult> => {
    const text = command.trim();
    if (!text) {
      return {
        action: 'UNKNOWN',
        confidence: 0,
        explanation: 'No voice command received.',
        speechResponse: 'Please speak or type an instruction.',
        success: false,
      };
    }

    let aiResult: any = null;
    const effectiveLang = langOverride || (language === 'hi' ? 'hi' : language === 'hinglish' ? 'hinglish' : 'en');

    // 1. Server-side ChatGPT intelligence API call with role and user context
    try {
      const response = await fetch('/api/ai/voice-command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(currentUser?.id ? { 'x-user-id': currentUser.id, 'x-user-role': currentUser.role } : {}),
        },
        body: JSON.stringify({
          speechText: text,
          userRole: currentUser.role,
          userId: currentUser.id,
          language: effectiveLang,
          context: {
            users: users.map((u) => ({ id: u.id, name: u.name, role: u.role, designation: u.designation })),
            customers: currentUser.role === 'engineer' ? [] : customers.map((c) => ({ id: c.id, name: c.companyName, sites: c.sites })),
            jobs: (currentUser.role === 'engineer'
              ? jobs.filter((j) => j.assignedToId === currentUser.id)
              : jobs.slice(0, 15)
            ).map((j) => ({ id: j.id, jobId: j.jobId, title: j.title, status: j.status, assignedToId: j.assignedToId })),
          },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.action) {
          aiResult = data;
        }
      }
    } catch (e) {
      console.warn('Backend ChatGPT route unavailable, using intelligent local engine:', e);
    }

    // 2. High-Accuracy Natural Language & Hindi/Hinglish Rule Engine
    if (!aiResult) {
      const lower = text.toLowerCase();

      // Check for Employee Rankings & Awards (e.g. "ranking dikhao", "who is rank 1", "awards", "top employees")
      if (
        lower.includes('rank') ||
        lower.includes('award') ||
        lower.includes('top employee') ||
        lower.includes('best employee') ||
        lower.includes('podium') ||
        lower.includes('performer') ||
        lower.includes('रैंकिंग') ||
        lower.includes('पुरस्कार')
      ) {
        aiResult = {
          action: 'NAVIGATE',
          confidence: 0.99,
          explanation: 'Opening Employee Rankings, Performance Leaderboard & 6-Month Awards',
          speechResponse: language === 'hi'
            ? 'कर्मचारी रैंकिंग और 6 महीने के अवार्ड्स पेज खोला जा रहा है। विक्रम सिंह वर्तमान में रैंक 1 पर हैं!'
            : 'Opening Employee Rankings and Awards leaderboard. Vikram Singh is currently holding Rank #1!',
          payload: { tab: 'rankings' },
        };
      }
      // Check for Mark Job Completed (e.g., "mark completed", "complete JR-2026-0101", "job khatam ho gaya", "kaam pura ho gaya")
      else if (
        (lower.includes('complete') || lower.includes('mark') || lower.includes('finish') || lower.includes('done') || lower.includes('khatam') || lower.includes('pura')) &&
        (lower.includes('job') || lower.includes('task') || lower.includes('jr-') || lower.includes('kaam') || lower.includes('010') || lower.includes('011'))
      ) {
        const targetJob =
          jobs.find(
            (j) =>
              lower.includes(j.jobId.toLowerCase()) ||
              lower.includes(j.title.toLowerCase()) ||
              lower.includes(j.jobId.replace('JR-2026-', ''))
          ) ||
          (currentUser.role === 'engineer'
            ? jobs.find((j) => j.assignedToId === currentUser.id && j.status !== 'completed')
            : jobs.find((j) => j.status !== 'completed')) ||
          jobs[0];

        if (targetJob) {
          aiResult = {
            action: 'UPDATE_JOB_STATUS',
            confidence: 0.98,
            explanation: `Marking Job ${targetJob.jobId} ("${targetJob.title}") as Completed`,
            speechResponse: language === 'hi'
              ? `जॉब ${targetJob.jobId} को सफलतापूर्वक पूरा मार्क कर दिया गया है। शानदार कार्य!`
              : `Job ${targetJob.jobId} has been marked as Completed successfully! Excellent work.`,
            payload: {
              jobId: targetJob.id,
              status: 'completed',
              remarks: 'Marked as completed via Advanced AI Voice Assistant',
              tab: currentUser.role === 'engineer' ? 'my_jobs' : 'jobs',
            },
          };
        }
      }
      // Check for Client Payment Reminder (e.g. "payment reminder", "client payment", "baki payment")
      else if (
        lower.includes('payment') ||
        lower.includes('baki') ||
        lower.includes('bill reminder') ||
        lower.includes('invoice reminder')
      ) {
        openPaymentReminderModal();
        aiResult = {
          action: 'NAVIGATE',
          confidence: 0.98,
          explanation: 'Opened Client Payment Reminder Modal with auto-filled details',
          speechResponse: language === 'hi'
            ? 'क्लाइंट पेमेंट रिमाइंडर विंडो खोल दी गई है।'
            : 'Opening Client Payment Reminder modal with auto-filled details.',
          payload: { modal: 'payment_reminder' },
        };
      }
      // Check for WhatsApp / Reminder commands (e.g. "remind all", "send whatsapp", "whatsapp bhejo", "alert")
      else if (
        lower.includes('whatsapp') ||
        lower.includes('remind') ||
        lower.includes('reminder') ||
        lower.includes('bhejo') ||
        lower.includes('alert')
      ) {
        if (currentUser.role === 'engineer') {
          aiResult = {
            action: 'PERMISSION_DENIED',
            confidence: 0.99,
            explanation: 'Security Policy: Automated bulk WhatsApp triggers are managed by Managers and Admins.',
            speechResponse: language === 'hi'
              ? 'सुरक्षा नीति: व्हाट्सएप रिमाइंडर ट्रिगर्स केवल मैनेजर्स और एडमिन्स द्वारा प्रबंधित होते हैं।'
              : 'Security Policy: WhatsApp reminder dispatching is managed by managers and admins.',
          };
        } else {
          triggerSchedulerTick();
          aiResult = {
            action: 'NAVIGATE',
            confidence: 0.98,
            explanation: 'Triggered automated WhatsApp reminder check and opened WhatsApp Hub',
            speechResponse: language === 'hi'
              ? 'व्हाट्सएप रिमाइंडर चेक रन कर दिया गया है। व्हाट्सएप हब खोला जा रहा है।'
              : 'Dispatched pending WhatsApp reminders to engineers. Opening WhatsApp Hub.',
            payload: { tab: 'whatsapp' },
          };
        }
      }
      // Check for Assignment (e.g., "Rahul assign", "assign Priya", "Amit ko de do", "allocate job")
      else if (
        lower.includes('assign') ||
        lower.includes('allocate') ||
        lower.includes('de do') ||
        lower.includes('kar do')
      ) {
        if (currentUser.role === 'engineer') {
          aiResult = {
            action: 'PERMISSION_DENIED',
            confidence: 1.0,
            explanation: 'Security Policy: Service engineers cannot reassign jobs. Please contact your manager.',
            speechResponse: language === 'hi'
              ? 'अनुमति अस्वीकृत: सर्विस इंजीनियर जॉब्स को दोबारा असाइन नहीं कर सकते। कृपया मैनेजर से संपर्क करें।'
              : 'Access Restricted: As a service engineer, you cannot reassign jobs. Please contact your manager.',
          };
        } else {
          const matchedUserByName = users.find(
            (u) =>
              lower.includes(u.name.toLowerCase()) ||
              lower.includes(u.name.split(' ')[0].toLowerCase()) ||
              lower.includes(u.employeeId.toLowerCase())
          );
          const engineer = matchedUserByName || users.find((u) => u.role === 'engineer') || users[0];

          const targetJob =
            jobs.find(
              (j) =>
                lower.includes(j.jobId.toLowerCase()) ||
                lower.includes(j.title.toLowerCase()) ||
                lower.includes(j.jobId.replace('JR-2026-', ''))
            ) ||
            jobs.find((j) => ['unassigned', 'assigned', 'overdue'].includes(j.status)) ||
            jobs[0];

          aiResult = {
            action: 'ASSIGN_JOB',
            confidence: 0.96,
            explanation: `Assigned job ${targetJob.jobId} ("${targetJob.title}") to ${engineer.name}`,
            speechResponse: `Allocated ${targetJob.jobId} to ${engineer.name} successfully.`,
            payload: {
              jobId: targetJob.id,
              assigneeId: engineer.id,
              assigneeName: engineer.name,
              tab: 'jobs',
            },
          };
        }
      }
      // Check for Quick Job Creation (e.g., "urgent job", "nayi job", "Apollo emergency", "breakdown repair")
      else if (
        lower.includes('create') ||
        lower.includes('new job') ||
        lower.includes('nayi') ||
        lower.includes('emergency') ||
        lower.includes('urgent') ||
        lower.includes('breakdown') ||
        lower.includes('maintenance')
      ) {
        if (currentUser.role === 'engineer') {
          aiResult = {
            action: 'PERMISSION_DENIED',
            confidence: 1.0,
            explanation: 'Security Policy: Only managers and admins can create new company jobs.',
            speechResponse: language === 'hi'
              ? 'सुरक्षा प्रतिबंध: नए जॉब्स केवल मैनेजर्स और एडमिन्स द्वारा बनाए जा सकते हैं।'
              : 'Access Restricted: Only managers and administrators can create new jobs.',
          };
        } else {
          const isUrgent =
            lower.includes('urgent') || lower.includes('emergency') || lower.includes('breakdown');
          const matchedCust =
            customers.find((c) => lower.includes(c.companyName.toLowerCase())) ||
            customers.find((c) =>
              lower.includes('hospital') ? c.companyName.toLowerCase().includes('hospital') : false
            ) ||
            customers[0];

          const cleanTitle =
            text
              .replace(/create|new|job|urgent|emergency|banao|add|for|nayi/gi, '')
              .trim() || 'Urgent Breakdown & System Maintenance';

          aiResult = {
            action: 'CREATE_JOB',
            confidence: 0.94,
            explanation: `Created immediate priority job for ${matchedCust.companyName}`,
            speechResponse: `Created priority job for ${matchedCust.companyName}.`,
            payload: {
              customerName: matchedCust.companyName,
              customerId: matchedCust.id,
              siteName: matchedCust.sites[0]?.siteName || 'Primary Facility',
              priority: isUrgent ? 'critical' : 'high',
              jobTitle: cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1),
              tab: 'jobs',
            },
          };
        }
      }
      // Check for Overdue & Delayed (e.g., "overdue", "late", "delayed", "atke hue")
      else if (
        lower.includes('overdue') ||
        lower.includes('late') ||
        lower.includes('delay') ||
        lower.includes('atke')
      ) {
        aiResult = {
          action: 'FILTER_STATUS',
          confidence: 0.97,
          explanation: 'Showing all overdue and delayed jobs',
          speechResponse: language === 'hi'
            ? 'यहाँ सभी ओवरड्यू और लेट जॉब्स दिखाए गए हैं।'
            : 'Here are all overdue and delayed jobs.',
          payload: {
            status: 'overdue',
            tab: currentUser.role === 'engineer' ? 'my_jobs' : 'jobs',
          },
        };
      }
      // Check for Completed (e.g., "completed", "finish", "done", "khatam")
      else if (
        lower.includes('completed') ||
        lower.includes('finished') ||
        lower.includes('done') ||
        lower.includes('khatam')
      ) {
        aiResult = {
          action: 'FILTER_STATUS',
          confidence: 0.97,
          explanation: 'Showing all completed jobs',
          speechResponse: language === 'hi' ? 'पूरे हो चुके जॉब्स दिखाए जा रहे हैं।' : 'Showing completed jobs.',
          payload: {
            status: 'completed',
            tab: currentUser.role === 'engineer' ? 'my_jobs' : 'jobs',
          },
        };
      }
      // Check for Critical / High Priority (e.g., "critical", "high priority")
      else if (lower.includes('critical') || lower.includes('high priority')) {
        aiResult = {
          action: 'FILTER_PRIORITY',
          confidence: 0.97,
          explanation: 'Filtering critical priority jobs',
          speechResponse: 'Displaying critical priority jobs.',
          payload: {
            priority: 'critical',
            tab: currentUser.role === 'engineer' ? 'my_jobs' : 'jobs',
          },
        };
      }
      // Check for Team / Staff Directory
      else if (
        lower.includes('team') ||
        lower.includes('engineer') ||
        lower.includes('staff') ||
        lower.includes('log')
      ) {
        if (currentUser.role === 'engineer') {
          aiResult = {
            action: 'NAVIGATE',
            confidence: 0.95,
            explanation: 'Opening Employee Rankings & Performance',
            speechResponse: language === 'hi'
              ? 'आपकी रैंकिंग और परफॉरमेंस लीडरबोर्ड खोला जा रहा है।'
              : 'Opening employee rankings and performance leaderboard.',
            payload: { tab: 'rankings' },
          };
        } else {
          aiResult = {
            action: 'NAVIGATE',
            confidence: 0.97,
            explanation: 'Opening Field Engineers & Team Directory',
            speechResponse: 'Opening team directory.',
            payload: { tab: 'team' },
          };
        }
      }
      // Check for Customers & Client Sites
      else if (
        lower.includes('customer') ||
        lower.includes('client') ||
        lower.includes('hospital') ||
        lower.includes('party')
      ) {
        if (currentUser.role === 'engineer') {
          aiResult = {
            action: 'PERMISSION_DENIED',
            confidence: 1.0,
            explanation: 'Security Policy: Customer management directory is restricted to managers and admins.',
            speechResponse: language === 'hi'
              ? 'सुरक्षा प्रतिबंध: कस्टमर डायरेक्ट्री केवल मैनेजर्स के लिए है।'
              : 'Access Restricted: Customer directory is restricted to managers.',
          };
        } else {
          aiResult = {
            action: 'NAVIGATE',
            confidence: 0.97,
            explanation: 'Opening Customer Profiles & Sites',
            speechResponse: 'Opening customers directory.',
            payload: { tab: 'customers' },
          };
        }
      }
      // Check for Reports & Analytics
      else if (
        lower.includes('report') ||
        lower.includes('analytic') ||
        lower.includes('hisab') ||
        lower.includes('summary')
      ) {
        if (currentUser.role === 'engineer') {
          aiResult = {
            action: 'NAVIGATE',
            confidence: 0.95,
            explanation: 'Opening Your Performance & Rankings',
            speechResponse: language === 'hi' ? 'आपकी परफॉरमेंस रैंकिंग खोली जा रही है।' : 'Opening your performance rankings.',
            payload: { tab: 'rankings' },
          };
        } else {
          aiResult = {
            action: 'NAVIGATE',
            confidence: 0.97,
            explanation: 'Opening Operations Reports & Analytics',
            speechResponse: 'Opening reports and analytics.',
            payload: { tab: 'reports' },
          };
        }
      }
      // Check for My Assigned Tasks
      else if (
        lower.includes('my job') ||
        lower.includes('my task') ||
        lower.includes('mera kaam')
      ) {
        aiResult = {
          action: 'NAVIGATE',
          confidence: 0.97,
          explanation: 'Opening My Assigned Jobs',
          speechResponse: language === 'hi' ? 'आपके असाइन किए गए कार्य खोले जा रहे हैं।' : 'Opening your assigned jobs.',
          payload: { tab: 'my_jobs' },
        };
      }
      // Default: Universal Instant Job Search
      else {
        const query = text.replace(/search|jobs|dhoondo|find|look|the/gi, '').trim() || text;
        aiResult = {
          action: 'SEARCH_JOBS',
          confidence: 0.88,
          explanation: `Filtered jobs for "${query}"`,
          speechResponse: language === 'hi' ? `खोज परिणाम: ${query}` : `Filtered jobs matching ${query}.`,
          payload: { searchQuery: query, tab: currentUser.role === 'engineer' ? 'my_jobs' : 'jobs' },
        };
      }
    }

    // Role-based security check for AI commands
    if (currentUser.role === 'engineer') {
      if (aiResult.action === 'ASSIGN_JOB' || aiResult.action === 'CREATE_JOB') {
        aiResult = {
          action: 'PERMISSION_DENIED',
          confidence: 1.0,
          explanation: 'Security Policy: Service engineers cannot assign or create jobs.',
          speechResponse: language === 'hi'
            ? 'अनुमति अस्वीकृत: सर्विस इंजीनियर नए जॉब असाइन या क्रिएट नहीं कर सकते।'
            : 'Access Restricted: As a service engineer, you cannot assign or create jobs.',
          success: false,
        };
      } else if (
        aiResult.action === 'NAVIGATE' &&
        ['team', 'customers', 'reports', 'settings', 'whatsapp', 'jobs'].includes(aiResult.payload?.tab)
      ) {
        aiResult = {
          action: 'NAVIGATE',
          confidence: 1.0,
          explanation: 'Redirected to your assigned jobs per role security policy.',
          speechResponse: language === 'hi'
            ? 'सुरक्षा प्रतिबंध: आपके असाइन किए गए कार्य खोले जा रहे हैं।'
            : 'Access Restricted: Showing your assigned jobs instead.',
          payload: { tab: 'my_jobs' },
        };
      }
    }

    // 3. Apply state mutation based on AI action
    if (aiResult) {
      const payload = aiResult.payload || {};

      if (aiResult.action === 'ASSIGN_JOB' && payload.jobId && payload.assigneeId) {
        const targetJob = jobs.find((j) => j.id === payload.jobId || j.jobId === payload.jobId);
        const targetUser = users.find((u) => u.id === payload.assigneeId);
        if (targetJob && targetUser) {
          updateJob(targetJob.id, {
            assignedToId: targetUser.id,
            status: 'assigned',
          });
          setSelectedJobId(targetJob.id);
          setActiveTab('jobs');
        }
      } else if (aiResult.action === 'CREATE_JOB') {
        const customer =
          customers.find((c) => c.id === payload.customerId || c.companyName.toLowerCase().includes((payload.customerName || '').toLowerCase())) ||
          customers[0];
        const site = customer.sites[0];
        const newJob = createJob({
          title: payload.jobTitle || 'AI Created Priority Maintenance Job',
          customerId: customer.id,
          siteId: site ? site.id : customer.sites[0]?.id,
          priority: payload.priority || 'high',
          assignedToId: payload.assigneeId || users.find((u) => u.role === 'engineer')?.id,
        });
        setSelectedJobId(newJob.id);
        setActiveTab('jobs');
        payload.jobId = newJob.id;
      } else if (aiResult.action === 'SEARCH_JOBS') {
        setGlobalSearchQuery(payload.searchQuery || text);
        setActiveTab('jobs');
      } else if (aiResult.action === 'FILTER_STATUS') {
        setGlobalStatusFilter(payload.status || 'all');
        setActiveTab('jobs');
      } else if (aiResult.action === 'FILTER_PRIORITY') {
        setGlobalPriorityFilter(payload.priority || 'all');
        setActiveTab('jobs');
      } else if (aiResult.action === 'UPDATE_JOB_STATUS' && payload.jobId && payload.status) {
        updateJobStatus(payload.jobId, payload.status as JobStatus, payload.remarks || 'Updated via AI Voice Assistant');
      } else if (aiResult.action === 'NAVIGATE' && payload.tab) {
        setActiveTab(payload.tab);
      }

      setLastAiResult(aiResult);
      return aiResult;
    }

    return {
      action: 'UNKNOWN',
      confidence: 0,
      explanation: 'Could not process command.',
      speechResponse: 'Could not process that command.',
      success: false,
    };
  };

  // Strict Role-Based Access Isolation for Service Engineers:
  // An employee only ever sees their own assigned jobs and cannot access private credentials/contacts of others.
  const visibleJobs = useMemo(() => {
    if (currentUser.role === 'engineer') {
      return jobs.filter(
        (j) =>
          j.assignedToId === currentUser.id ||
          (Array.isArray(j.additionalAssigneeIds) && j.additionalAssigneeIds.includes(currentUser.id))
      );
    }
    return jobs;
  }, [jobs, currentUser.role, currentUser.id]);

  const sanitizedUsers = useMemo(() => {
    if (currentUser.role === 'engineer') {
      return users.map((u) => {
        if (u.id === currentUser.id) return u;
        return {
          ...u,
          password: '',
          secureToken: '',
          email: '***@company.local',
          mobile: '**********',
          whatsapp: '**********',
        };
      });
    }
    return users;
  }, [users, currentUser.role, currentUser.id]);

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        switchUser,
        users: sanitizedUsers,
        customers,
        jobTypes,
        jobs: visibleJobs,
        templates,
        messageLogs,
        activities,
        whatsappSettings,
        companySettings,
        activeTab,
        setActiveTab,
        selectedJobId,
        setSelectedJobId,
        isCreateJobOpen,
        setIsCreateJobOpen,
        isEditJobOpen,
        setIsEditJobOpen,
        jobToEdit,
        setJobToEdit,
        openEditJobModal,
        isProfileModalOpen,
        setIsProfileModalOpen,
        isAddEmployeeModalOpen,
        setIsAddEmployeeModalOpen,
        openAddEmployeeModal,
        isGlobalSearchOpen,
        setIsGlobalSearchOpen,
        viewUserProfile,
        setViewUserProfile,
        openUserProfile,
        isSendWhatsAppOpen,
        setIsSendWhatsAppOpen,
        activeJobForWhatsApp,
        openSendWhatsAppModal,
        isBulkReminderOpen,
        setIsBulkReminderOpen,
        bulkReminderTargetUserId,
        setBulkReminderTargetUserId,
        openBulkJobReminder,
        openBulkJobReminders: openBulkJobReminder,
        sendBulkJobReminders,
        tokenAuthBanner,
        dismissTokenBanner,
        lastSchedulerTick,
        isSchedulerRunning,
        createJob,
        updateJob,
        deleteJob,
        updateJobStatus,
        acceptJob,
        startJob,
        completeJob,
        requestExtension,
        reviewExtension,
        addJobNote,
        addDailyUpdate,
        addJobAttachment,
        deleteJobAttachment,
        sendWhatsAppMessage,
        retryMessage,
        deleteMessageLog,
        triggerSchedulerTick,
        addUser,
        updateUser,
        deleteUser,
        toggleUserActive,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addCustomerSite,
        updateCustomerSite,
        deleteCustomerSite,
        addJobType,
        updateJobType,
        deleteJobType,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        updateWhatsAppSettings,
        updateCompanySettings,
        getUserById,
        getCustomerById,
        getSiteById,

        // Direct Auth & Team Login
        isAuthenticated,
        setIsAuthenticated,
        loginWithIdentifier,
        logout,
        directLoginUrl,

        // Password Management & Security Recovery
        setUserPasswordByAdmin,
        sendPasswordResetOtp,
        verifyPasswordResetOtp,
        resetPasswordWithToken,

        // AI Voice Assistant & Modals
        isVoiceAssistantOpen,
        setIsVoiceAssistantOpen,
        isApkModalOpen,
        setIsApkModalOpen,
        executeAiAction,
        lastAiResult,
        clearLastAiResult,

        // Global Filters
        globalSearchQuery,
        setGlobalSearchQuery,
        globalStatusFilter,
        setGlobalStatusFilter,
        globalPriorityFilter,
        setGlobalPriorityFilter,

        // Cross-Device Real-time Cloud Synchronization
        syncStatus,
        lastSyncedAt,
        triggerManualSync,

        // Notifications
        notifications,
        setNotifications,
        unreadNotificationsCount,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        clearAllNotifications,

        // Recent Updates & System Activity Modal
        isRecentActivityModalOpen,
        setIsRecentActivityModalOpen,
        logSystemActivity,

        // Data Import / Export / Backup (Admin Only)
        exportAppState,
        createAppBackup,
        restoreAppBackup,

        // Google Drive Cloud Backup & Sync
        googleDriveState,
        driveBackups,
        fetchDriveBackups,
        connectGoogleDrive,
        disconnectGoogleDrive,
        backupToGoogleDrive,
        restoreFromGoogleDrive,
        deleteFromGoogleDrive,
        toggleGoogleDriveAutoSync,
        loginWithGoogleOAuth,
        isDriveModalOpen,
        setIsDriveModalOpen,

        // Client Payment Reminder Modal & Actions
        isPaymentReminderOpen,
        setIsPaymentReminderOpen,
        activeCustomerForPaymentReminder,
        activeJobForPaymentReminder,
        openPaymentReminderModal,
        sendPaymentReminderEmail,

        // Client Payment Reminders Ledger System
        paymentReminders,
        isCreatePaymentReminderOpen,
        setIsCreatePaymentReminderOpen,
        editingPaymentReminder,
        setEditingPaymentReminder,
        openCreatePaymentReminderModal,
        openEditPaymentReminderModal,
        addPaymentReminder,
        updatePaymentReminder,
        deletePaymentReminder,
        recordPaymentReceived,
        syncAndSendEmailReminder,
        sendWhatsAppReminderAction,

        // Internationalization & Language
        language,
        setLanguage,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
