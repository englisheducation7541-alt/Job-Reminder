export type UserRole = 'admin' | 'manager' | 'engineer' | 'director';

export type JobPriority = 'low' | 'normal' | 'high' | 'urgent';

export type JobStatus =
  | 'new'
  | 'assigned'
  | 'accepted'
  | 'in_progress'
  | 'waiting_customer'
  | 'waiting_material'
  | 'waiting_approval'
  | 'on_hold'
  | 'completed'
  | 'cancelled'
  | 'overdue';

export interface User {
  id: string;
  employeeId: string;
  name: string;
  designation: string;
  mobile: string;
  whatsapp: string;
  email: string;
  department: string;
  role: UserRole;
  active: boolean;
  joiningDate: string;
  secureToken: string; // Token used for direct 1-click magic link authentication
  password?: string; // Login password configured by admin or employee profile
  avatar?: string;
}

export interface CustomerSite {
  id: string;
  customerId: string;
  siteName: string;
  address: string;
  city?: string;
  contactPerson: string;
  mobile: string;
  gpsLocation?: string;
  notes?: string;
}

export interface Customer {
  id: string;
  customerId: string;
  companyName: string;
  contactPerson: string;
  mobile: string;
  whatsapp: string;
  email: string;
  address: string;
  city: string;
  state: string;
  customerType: 'Hospital' | 'Industrial' | 'Commercial' | 'Residential' | 'Government';
  notes?: string;
  sites: CustomerSite[];
  createdAt: string;
}

export interface JobNote {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface JobAttachment {
  id: string;
  name: string;
  fileType: 'image' | 'pdf' | 'document';
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  size?: string;
}

export interface CompletionReport {
  workDone: string;
  problemFound: string;
  actionTaken: string;
  pendingWork?: string;
  materialRequired?: string;
  customerRemarks?: string;
  engineerRemarks: string;
  completionDate: string;
  completionTime: string;
  completedById: string;
  completedByName: string;
  attachments?: JobAttachment[];
}

export interface ExtensionRequest {
  id: string;
  requestedBy: string;
  currentDueDate: string;
  requestedDueDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  reviewedAt?: string;
  reviewRemarks?: string;
}

export interface RecurringConfig {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  intervalDays?: number;
  nextScheduledDate?: string;
}

export type ReminderTriggerType =
  | '7_days_before'
  | '3_days_before'
  | '1_day_before'
  | 'morning_of_due'
  | '2_hours_before'
  | 'at_due_time'
  | 'overdue_hourly'
  | 'custom';

export interface JobReminderConfig {
  enabled: boolean;
  triggers: {
    sevenDaysBefore: boolean;
    threeDaysBefore: boolean;
    oneDayBefore: boolean;
    morningOfDueDate: boolean;
    twoHoursBefore: boolean;
    atDueTime: boolean;
    overdueAlert: boolean;
  };
  overdueIntervalHours: number; // e.g. every 2 hours
}

export interface JobDailyUpdate {
  id: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  timestamp: string; // ISO string
  workProgress: string; // Progress details / work done today
  status: JobStatus; // Status at the time of update
  blockers?: string; // Any challenges, pending materials or remarks
}

export interface Job {
  id: string;
  jobId: string; // e.g. "JR-2026-0101"
  title: string;
  description: string;
  jobType: string;
  priority: JobPriority;
  customerId: string;
  siteId: string;
  contactPerson: string;
  contactNumber: string;
  assignedToId: string; // User ID
  additionalAssigneeIds?: string[];
  startDate: string; // YYYY-MM-DD
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  estimatedDuration: string; // e.g. "4 Hours"
  status: JobStatus;
  notes: JobNote[];
  dailyUpdates?: JobDailyUpdate[];
  attachments: JobAttachment[];
  reminderConfig: JobReminderConfig;
  completionReport?: CompletionReport;
  extensionRequest?: ExtensionRequest;
  recurringConfig?: RecurringConfig;
  escalated?: boolean;
  escalationLevel?: 'none' | 'manager' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface JobActivity {
  id: string;
  jobId?: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actionType:
    | 'created'
    | 'assigned'
    | 'reassigned'
    | 'accepted'
    | 'status_change'
    | 'reminder_sent'
    | 'whatsapp_sent'
    | 'note_added'
    | 'attachment_added'
    | 'attachment_deleted'
    | 'extension_requested'
    | 'extension_reviewed'
    | 'escalated'
    | 'completed'
    | 'cancelled'
    | 'deleted'
    | 'employee_added'
    | 'employee_updated'
    | 'employee_deleted'
    | 'company_updated'
    | 'profile_updated'
    | 'password_changed'
    | 'backup_created'
    | 'data_restored'
    | 'system_update';
  description: string;
  metadata?: Record<string, any>;
}

export interface AppNotification {
  id: string;
  recipientRole?: UserRole | 'all';
  recipientUserId?: string;
  recipientId?: string;
  title: string;
  message: string;
  type:
    | 'job_assigned'
    | 'status_change'
    | 'reminder_sent'
    | 'overdue_alert'
    | 'company_updated'
    | 'employee_change'
    | 'system';
  jobId?: string;
  linkTab?: string;
  read: boolean;
  createdAt: string; // ISO format
}

export type WhatsAppDeliveryStatus = 'sent' | 'delivered' | 'read' | 'failed' | 'pending';

export interface WhatsAppMessageLog {
  id: string;
  reminderInstanceId?: string;
  jobId: string;
  jobTitle?: string;
  recipientId: string;
  recipientName: string;
  whatsappNumber: string;
  messageType: string;
  messageText: string;
  status: WhatsAppDeliveryStatus;
  provider: string;
  errorMessage?: string;
  retryCount: number;
  timestamp: string;
  directAccessUrl: string; // Secure token URL sent with the message
}

export interface ScheduledReminderInstance {
  id: string;
  jobId: string;
  jobTitle: string;
  recipientId: string;
  recipientName: string;
  recipientWhatsApp: string;
  triggerType: ReminderTriggerType;
  scheduledTime: string; // ISO string
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sentAt?: string;
  error?: string;
  retryCount: number;
}

export interface WhatsAppTemplate {
  id: string;
  code: string;
  name: string;
  category: 'Job Alerts' | 'Reminders' | 'Status Updates' | 'Summaries' | 'Escalation';
  templateText: string;
  variables: string[];
  isDefault: boolean;
}

export interface WhatsAppSettings {
  provider: 'meta_cloud' | 'twilio' | 'infobip' | 'gupshup' | 'generic_webhook';
  apiUrl: string;
  apiToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookUrl: string;
  senderName: string;
  autoSendEnabled: boolean;
  retryAttempts: number;
  openWhatsAppFallback: boolean;
}

export interface CompanySettings {
  companyName: string;
  tagline: string;
  address: string;
  contactNumber: string;
  email: string;
  website?: string;
  gstNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  accountHolderName?: string;
  accountType?: string;
  bankBranch?: string;
  upiNumber?: string;
  contactPhone?: string;
  contactEmail?: string;
  logoUrl?: string;
  companyLogo?: string;
  dailySummaryTime: string; // e.g. "08:30"
  enableDailySummary: boolean;
  unacceptedEscalationHours: number; // e.g. 2 hours
  overdueEscalationHours: number; // e.g. 4 hours
}

export type PaymentReminderStatus = 'pending' | 'partially_paid' | 'overdue' | 'paid';

export interface PaymentDocumentAttachment {
  id: string;
  name: string;
  fileType: 'pdf' | 'image' | 'document' | 'other';
  dataUrl?: string; // base64 or storage url
  size?: string;
  uploadedAt: string;
}

export interface ClientPaymentReminder {
  id: string;
  customerId: string;
  customerName: string;
  contactPerson: string;
  contactMobile: string;
  contactEmail: string;
  clientCcEmails?: string; // Comma-separated CC emails saved once
  jobId?: string;
  jobTitle?: string;
  invoiceNumber: string;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  dueDate: string; // YYYY-MM-DD
  status: PaymentReminderStatus;
  
  // Pre-configured custom email & message draft
  emailSubject: string;
  emailDraft: string;
  whatsappDraft: string;

  // Attached bills, invoices, POs, documents
  documents?: PaymentDocumentAttachment[];

  // Reminders tracking
  remindersCount: number;
  lastReminderSentAt?: string;
  lastReminderChannel?: 'whatsapp' | 'email' | 'both';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EscalationRule {
  id: string;
  name: string;
  triggerCondition: 'unaccepted_hours' | 'overdue_hours';
  thresholdHours: number;
  notifyRole: 'manager' | 'admin';
  enabled: boolean;
}

export interface AiVoiceCommandResult {
  action:
    | 'ASSIGN_JOB'
    | 'CREATE_JOB'
    | 'SEARCH_JOBS'
    | 'FILTER_STATUS'
    | 'FILTER_PRIORITY'
    | 'UPDATE_JOB_STATUS'
    | 'NAVIGATE'
    | 'VIEW_PROFILE'
    | 'VIEW_JOB'
    | 'GENERAL_QUERY'
    | 'PERMISSION_DENIED'
    | 'UNKNOWN';
  confidence: number;
  explanation: string;
  speechResponse: string;
  payload?: Record<string, any>;
  success?: boolean;
}

export interface GoogleDriveBackupInfo {
  id: string;
  name: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  description?: string;
  recordCounts?: {
    jobs: number;
    customers: number;
    users: number;
  };
}

export interface GoogleDriveSyncState {
  isConnected: boolean;
  userEmail: string | null;
  userName: string | null;
  userPhotoUrl: string | null;
  lastBackupTime: string | null;
  autoSyncEnabled: boolean;
  isSyncing: boolean;
  error: string | null;
}
