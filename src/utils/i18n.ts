export type AppLanguage = 'en' | 'hi' | 'hinglish';

export interface TranslationDictionary {
  [key: string]: {
    en: string;
    hi: string;
    hinglish: string;
  };
}

export const TRANSLATIONS: TranslationDictionary = {
  // Navigation & Core Menus
  dashboard: {
    en: 'Dashboard',
    hi: 'डैशबोर्ड',
    hinglish: 'Dashboard',
  },
  my_jobs: {
    en: 'My Assigned Jobs',
    hi: 'मेरे सौंपे गए कार्य',
    hinglish: 'Mere Assigned Jobs',
  },
  all_jobs: {
    en: 'All Jobs Management',
    hi: 'सभी कार्य प्रबंधन',
    hinglish: 'Sabhi Jobs',
  },
  whatsapp: {
    en: 'WhatsApp Hub & Logs',
    hi: 'व्हाट्सएप हब और लॉग',
    hinglish: 'WhatsApp Hub & Logs',
  },
  customers: {
    en: 'Customers & Sites',
    hi: 'ग्राहक और साइटें',
    hinglish: 'Customers & Sites',
  },
  team: {
    en: 'Team & Staff',
    hi: 'टीम और स्टाफ',
    hinglish: 'Team & Staff',
  },
  rankings: {
    en: 'Employee Rankings',
    hi: 'कर्मचारी रैंकिंग',
    hinglish: 'Staff Rankings',
  },
  reports: {
    en: 'Reports & Analytics',
    hi: 'रिपोर्ट और विश्लेषण',
    hinglish: 'Reports & Analytics',
  },
  company_profile: {
    en: 'Company Profile',
    hi: 'कंपनी प्रोफाइल',
    hinglish: 'Company Profile',
  },
  settings: {
    en: 'System Settings',
    hi: 'सिस्टम सेटिंग्स',
    hinglish: 'System Settings',
  },
  logout: {
    en: 'Log Out',
    hi: 'लॉग आउट',
    hinglish: 'Log Out Karein',
  },

  // Buttons & Actions
  create_job: {
    en: 'Create Job',
    hi: 'नया कार्य बनाएं',
    hinglish: 'New Job Banayein',
  },
  new_job: {
    en: 'New Job',
    hi: 'नया कार्य',
    hinglish: 'Naya Job',
  },
  send_reminder: {
    en: 'Send Reminder',
    hi: 'अनुस्मारक भेजें',
    hinglish: 'Reminder Bhejein',
  },
  bulk_reminder: {
    en: 'Bulk Reminder',
    hi: 'थोक अनुस्मारक',
    hinglish: 'Bulk Reminder',
  },
  save: {
    en: 'Save',
    hi: 'सहेजें',
    hinglish: 'Save Karein',
  },
  save_changes: {
    en: 'Save Changes',
    hi: 'परिवर्तन सहेजें',
    hinglish: 'Changes Save Karein',
  },
  cancel: {
    en: 'Cancel',
    hi: 'रद्द करें',
    hinglish: 'Cancel',
  },
  delete: {
    en: 'Delete',
    hi: 'हटाएं',
    hinglish: 'Delete Karein',
  },
  edit: {
    en: 'Edit',
    hi: 'संपादित करें',
    hinglish: 'Edit Karein',
  },
  update: {
    en: 'Update',
    hi: 'अपडेट करें',
    hinglish: 'Update Karein',
  },
  filter: {
    en: 'Filter',
    hi: 'फ़िल्टर',
    hinglish: 'Filter',
  },
  search: {
    en: 'Search',
    hi: 'खोजें',
    hinglish: 'Search',
  },
  export: {
    en: 'Export',
    hi: 'निर्यात करें',
    hinglish: 'Export Karein',
  },
  download: {
    en: 'Download',
    hi: 'डाउनलोड करें',
    hinglish: 'Download Karein',
  },
  take_photo: {
    en: 'Take Photo',
    hi: 'फ़ोटो खींचें',
    hinglish: 'Photo Kheenche',
  },
  device_files: {
    en: 'Device Files',
    hi: 'डिवाइस फ़ाइलें',
    hinglish: 'Device Files',
  },
  attach_files: {
    en: 'Attach Files',
    hi: 'फ़ाइलें संलग्न करें',
    hinglish: 'File Attach Karein',
  },
  approve: {
    en: 'Approve',
    hi: 'स्वीकृत करें',
    hinglish: 'Approve Karein',
  },
  reject: {
    en: 'Reject',
    hi: 'अस्वीकार करें',
    hinglish: 'Reject Karein',
  },
  request_extension: {
    en: 'Request Deadline Extension',
    hi: 'अंतिम तिथि विस्तार का अनुरोध करें',
    hinglish: 'Deadline Extension Request Karein',
  },
  mark_completed: {
    en: 'Mark Completed & File Report',
    hi: 'पूर्ण चिह्नित करें और रिपोर्ट फ़ाइल करें',
    hinglish: 'Mark Completed & File Report',
  },
  accept_job: {
    en: 'Accept Job',
    hi: 'कार्य स्वीकार करें',
    hinglish: 'Job Accept Karein',
  },
  start_work: {
    en: 'Start Work (In Progress)',
    hi: 'कार्य शुरू करें (प्रगति पर)',
    hinglish: 'Kaam Shuru Karein',
  },
  submit_report: {
    en: 'Submit & Complete Job',
    hi: 'सबमिट करें और कार्य पूरा करें',
    hinglish: 'Submit Karke Job Complete Karein',
  },
  close: {
    en: 'Close',
    hi: 'बंद करें',
    hinglish: 'Close Karein',
  },
  select_all: {
    en: 'Select All',
    hi: 'सभी चुनें',
    hinglish: 'Sabhi Select Karein',
  },
  deselect_all: {
    en: 'Deselect All',
    hi: 'सभी अचयनित करें',
    hinglish: 'Deselect All',
  },
  reset_defaults: {
    en: 'Reset to Defaults',
    hi: 'डिफ़ॉल्ट पर रीसेट करें',
    hinglish: 'Reset to Defaults',
  },

  // KPI Metrics & Dashboard
  total_jobs: {
    en: 'Total Jobs',
    hi: 'कुल कार्य',
    hinglish: 'Total Jobs',
  },
  due_today: {
    en: 'Due Today',
    hi: 'आज देय',
    hinglish: 'Aaj Ke Due Jobs',
  },
  overdue_jobs: {
    en: 'Overdue Jobs',
    hi: 'अतिदेय कार्य',
    hinglish: 'Overdue / Late Jobs',
  },
  completed_jobs: {
    en: 'Completed Jobs',
    hi: 'पूर्ण कार्य',
    hinglish: 'Completed Jobs',
  },
  in_progress: {
    en: 'In Progress',
    hi: 'प्रगति पर है',
    hinglish: 'Kaam Chalu Hai',
  },
  overall_completion: {
    en: 'Overall Completion',
    hi: 'समग्र पूर्णता',
    hinglish: 'Overall Completion',
  },
  active_pipeline: {
    en: 'Active Operations Pipeline',
    hi: 'सक्रिय परिचालन पाइपलाइन',
    hinglish: 'Active Jobs Pipeline',
  },
  recent_activity: {
    en: 'Recent Live Activities',
    hi: 'हाल की गतिविधियां',
    hinglish: 'Recent Live Activities',
  },
  todays_overview: {
    en: "Today's Operational Overview",
    hi: 'आज का परिचालन अवलोकन',
    hinglish: 'Aaj Ka Operations Overview',
  },
  timely_updates: {
    en: 'Timely Updates',
    hi: 'समय पर अपडेट',
    hinglish: 'Timely Updates',
  },
  on_time_rate: {
    en: 'On-Time SLA Rate',
    hi: 'समयबद्धता दर',
    hinglish: 'On-Time SLA Rate',
  },
  performance_score: {
    en: 'Performance Score',
    hi: 'प्रदर्शन स्कोर',
    hinglish: 'Performance Score',
  },

  // Statuses
  status_new: {
    en: 'New',
    hi: 'नया',
    hinglish: 'Naya',
  },
  status_assigned: {
    en: 'Assigned',
    hi: 'सौंपा गया',
    hinglish: 'Assigned',
  },
  status_accepted: {
    en: 'Accepted',
    hi: 'स्वीकार किया गया',
    hinglish: 'Accepted',
  },
  status_in_progress: {
    en: 'In Progress',
    hi: 'प्रगति पर है',
    hinglish: 'Kaam Chalu Hai',
  },
  status_completed: {
    en: 'Completed',
    hi: 'पूर्ण हुआ',
    hinglish: 'Completed',
  },
  status_overdue: {
    en: 'Overdue',
    hi: 'अतिदेय (विलंबित)',
    hinglish: 'Overdue (Late)',
  },
  status_on_hold: {
    en: 'On Hold',
    hi: 'रोका गया',
    hinglish: 'On Hold',
  },
  status_cancelled: {
    en: 'Cancelled',
    hi: 'रद्द किया गया',
    hinglish: 'Cancelled',
  },
  status_waiting_customer: {
    en: 'Waiting for Customer',
    hi: 'ग्राहक की प्रतीक्षा में',
    hinglish: 'Customer Ka Wait Hai',
  },
  status_waiting_material: {
    en: 'Waiting for Material',
    hi: 'सामग्री की प्रतीक्षा में',
    hinglish: 'Material Ka Wait Hai',
  },
  status_waiting_approval: {
    en: 'Waiting for Approval',
    hi: 'अनुमोदन की प्रतीक्षा में',
    hinglish: 'Approval Ka Wait Hai',
  },

  // Priorities
  priority_urgent: {
    en: 'Urgent',
    hi: 'अति आवश्यक',
    hinglish: 'Urgent',
  },
  priority_high: {
    en: 'High',
    hi: 'उच्च',
    hinglish: 'High',
  },
  priority_normal: {
    en: 'Normal',
    hi: 'सामान्य',
    hinglish: 'Normal',
  },
  priority_low: {
    en: 'Low',
    hi: 'कम',
    hinglish: 'Low',
  },

  // Form Fields & Labels
  company_name: {
    en: 'Company Name',
    hi: 'कंपनी का नाम',
    hinglish: 'Company Ka Naam',
  },
  company_address: {
    en: 'Company Address',
    hi: 'कंपनी का पता',
    hinglish: 'Company Ka Address',
  },
  company_logo: {
    en: 'Company Logo',
    hi: 'कंपनी का लोगो',
    hinglish: 'Company Logo',
  },
  phone_number: {
    en: 'Phone Number',
    hi: 'फ़ोन नंबर',
    hinglish: 'Phone Number',
  },
  email: {
    en: 'Email Address',
    hi: 'ईमेल पता',
    hinglish: 'Email Address',
  },
  website: {
    en: 'Website',
    hi: 'वेबसाइट',
    hinglish: 'Website',
  },
  gst_number: {
    en: 'GST Number',
    hi: 'जीएसटी नंबर',
    hinglish: 'GST Number',
  },
  job_title: {
    en: 'Job Title',
    hi: 'कार्य का शीर्षक',
    hinglish: 'Job Title',
  },
  assigned_to: {
    en: 'Assigned To',
    hi: 'किसे सौंपा गया',
    hinglish: 'Kisko Assign Kiya',
  },
  due_date: {
    en: 'Due Date',
    hi: 'अंतिम तिथि',
    hinglish: 'Due Date',
  },
  due_time: {
    en: 'Due Time',
    hi: 'अंतिम समय',
    hinglish: 'Due Time',
  },
  description: {
    en: 'Description',
    hi: 'विवरण',
    hinglish: 'Description',
  },
  priority: {
    en: 'Priority',
    hi: 'प्राथमिकता',
    hinglish: 'Priority',
  },
  status: {
    en: 'Status',
    hi: 'स्थिति',
    hinglish: 'Status',
  },
  technical_work_done: {
    en: 'Technical Work Done',
    hi: 'किया गया तकनीकी कार्य',
    hinglish: 'Technical Work Done',
  },
  problem_found: {
    en: 'Problem Found',
    hi: 'पाई गई समस्या',
    hinglish: 'Problem Found',
  },
  action_taken: {
    en: 'Action Taken',
    hi: 'की गई कार्रवाई',
    hinglish: 'Action Taken',
  },
  pending_work: {
    en: 'Pending Work (if any)',
    hi: 'लंबित कार्य (यदि कोई हो)',
    hinglish: 'Pending Work',
  },
  material_required: {
    en: 'Material Required',
    hi: 'आवश्यक सामग्री',
    hinglish: 'Material Required',
  },
  customer_remarks: {
    en: 'Customer Remarks',
    hi: 'ग्राहक की टिप्पणी',
    hinglish: 'Customer Remarks',
  },
  attached_files: {
    en: 'Attached Files',
    hi: 'संलग्न फ़ाइलें',
    hinglish: 'Attached Files',
  },
  extension_requested: {
    en: 'Extension Requested',
    hi: 'अंतिम तिथि विस्तार का अनुरोध',
    hinglish: 'Extension Requested',
  },
  notifications: {
    en: 'Notifications',
    hi: 'सूचनाएं',
    hinglish: 'Notifications',
  },
};

/**
 * Universal lookup helper that supports exact keys, lowercase snake_case, and raw English strings.
 */
export function t(key: string, lang: AppLanguage = 'en', fallback?: string): string {
  if (!key) return '';

  // 1. Direct key match
  if (TRANSLATIONS[key] && TRANSLATIONS[key][lang]) {
    return TRANSLATIONS[key][lang];
  }

  // 2. Normalized key match (e.g. 'Company Profile' -> 'company_profile')
  const normalized = key.trim().toLowerCase().replace(/[\s\/-]+/g, '_');
  if (TRANSLATIONS[normalized] && TRANSLATIONS[normalized][lang]) {
    return TRANSLATIONS[normalized][lang];
  }

  // 3. Reverse lookup by English value
  for (const itemKey of Object.keys(TRANSLATIONS)) {
    if (TRANSLATIONS[itemKey].en.toLowerCase() === key.trim().toLowerCase()) {
      return TRANSLATIONS[itemKey][lang] || TRANSLATIONS[itemKey].en;
    }
  }

  // 4. Return fallback or original key
  return fallback || key;
}

/**
 * Localized WhatsApp Message generator supporting English, Hindi, and Hinglish.
 */
export function formatLocalizedMessage(
  type: 'NEW_JOB' | 'REMINDER' | 'OVERDUE' | 'COMPLETED' | 'EXTENSION_REQUEST' | 'EXTENSION_APPROVED' | 'EXTENSION_REJECTED',
  params: {
    employeeName: string;
    jobTitle: string;
    jobId: string;
    customerName: string;
    siteName: string;
    dueDate: string;
    dueTime: string;
    priority: string;
    companyName?: string;
    directLink?: string;
    reason?: string;
    remarks?: string;
  },
  lang: AppLanguage = 'en'
): string {
  const {
    employeeName,
    jobTitle,
    jobId,
    customerName,
    siteName,
    dueDate,
    dueTime,
    priority,
    companyName = 'Job Reminder',
    directLink,
    reason,
    remarks,
  } = params;

  // HINDI LOCALIZATION
  if (lang === 'hi') {
    switch (type) {
      case 'NEW_JOB':
        return `📋 *नया कार्य सौंपा गया - ${companyName}*
नमस्ते *${employeeName}*,
आपको एक नया कार्य सौंपा गया है:
*कार्य ID:* ${jobId}
*शीर्षक:* ${jobTitle}
*ग्राहक:* ${customerName}${siteName ? ` (${siteName})` : ''}
*प्राथमिकता:* ${priority.toUpperCase()}
*अंतिम तिथि:* ${dueDate} समय ${dueTime || '18:00'}

कृपया समय पर कार्य पूरा करें और दैनिक प्रगति रिपोर्ट सबमिट करें।
${directLink ? `कार्य विवरण और रिपोर्ट लिंक: ${directLink}` : ''}`;

      case 'REMINDER':
        return `⏰ *कार्य अनुस्मारक - ${companyName}*
नमस्ते *${employeeName}*,
यह आपके लंबित कार्य का अनुस्मारक है:
*कार्य ID:* ${jobId} - *${jobTitle}*
*ग्राहक:* ${customerName}${siteName ? ` (${siteName})` : ''}
*अंतिम समय:* ${dueDate} ${dueTime || '18:00'}
*प्राथमिकता:* ${priority.toUpperCase()}

कृपया समय पर कार्य पूर्ण कर रिपोर्ट सबमिट करें।
${directLink ? `कार्य लिंक: ${directLink}` : ''}`;

      case 'OVERDUE':
        return `🚨 *अतिदेय कार्य चेतावनी (OVERDUE) - ${companyName}*
नमस्ते *${employeeName}*,
कार्य *${jobId}* (${jobTitle}) की देय तिथि (${dueDate}) समाप्त हो चुकी है और यह अभी भी लंबित है।
कृपया तुरंत स्थिति अपडेट करें या कार्य पूरा करके रिपोर्ट दर्ज करें।
${directLink ? `तुरंत रिपोर्ट फ़ाइल करें: ${directLink}` : ''}`;

      case 'COMPLETED':
        return `✅ *कार्य सफलतापूर्वक पूर्ण हुआ - ${companyName}*
कार्य *${jobId}* (${jobTitle}) को *${employeeName}* द्वारा सफलतापूर्वक पूरा कर लिया गया है।
ग्राहक: ${customerName}${siteName ? ` (${siteName})` : ''}
पूर्णता रिपोर्ट सिस्टम में दर्ज कर दी गई है।`;

      case 'EXTENSION_REQUEST':
        return `⏳ *अंतिम तिथि विस्तार अनुरोध - ${companyName}*
कर्मचारी *${employeeName}* ने कार्य *${jobId}* (${jobTitle}) के लिए *${dueDate}* तक विस्तार का अनुरोध किया है।
कारण: "${reason || 'साइट कार्य प्रगति पर'}"
कृपया सिस्टम में जाकर स्वीकृति या अस्वीकृति दें।
${directLink ? `अनुमोदन लिंक: ${directLink}` : ''}`;

      case 'EXTENSION_APPROVED':
        return `✅ *अंतिम तिथि विस्तार स्वीकृत - ${companyName}*
नमस्ते *${employeeName}*, कार्य *${jobId}* के लिए आपका अनुरोध स्वीकृत कर दिया गया है।
नई अंतिम तिथि: *${dueDate}*।`;

      case 'EXTENSION_REJECTED':
        return `❌ *अंतिम तिथि विस्तार अस्वीकृत - ${companyName}*
नमस्ते *${employeeName}*, कार्य *${jobId}* के लिए आपका विस्तार अनुरोध अस्वीकार कर दिया गया है।
कारण/टिप्पणी: "${remarks || 'ग्राहक समय सीमा अपरिवर्तित'}"।`;
    }
  }

  // HINGLISH LOCALIZATION
  if (lang === 'hinglish') {
    switch (type) {
      case 'NEW_JOB':
        return `📋 *Naya Job Assign Kiya Gaya - ${companyName}*
Namaste *${employeeName}*,
Aapko ek naya task assign kiya gaya hai:
*Job ID:* ${jobId}
*Title:* ${jobTitle}
*Customer:* ${customerName}${siteName ? ` (${siteName})` : ''}
*Priority:* ${priority.toUpperCase()}
*Due Date:* ${dueDate} at ${dueTime || '18:00'}

Kripya time par complete karein aur daily progress report submit karein.
${directLink ? `Job Details & Report Link: ${directLink}` : ''}`;

      case 'REMINDER':
        return `⏰ *Job Reminder Notification - ${companyName}*
Namaste *${employeeName}*,
Aapke pending task ka reminder:
*Job ID:* ${jobId} - *${jobTitle}*
*Customer:* ${customerName}${siteName ? ` (${siteName})` : ''}
*Due Date:* ${dueDate} at ${dueTime || '18:00'}
*Priority:* ${priority.toUpperCase()}

Kripya time par complete karein aur site report submit karein.
${directLink ? `Direct Access: ${directLink}` : ''}`;

      case 'OVERDUE':
        return `🚨 *Overdue Job Alert (Urgent Attention) - ${companyName}*
Namaste *${employeeName}*,
Aapka job *${jobId}* (${jobTitle}) due date (${dueDate}) cross kar chuka hai aur abhi bhi pending hai.
Kripya turant status update karein ya completion report submit karein.
${directLink ? `Report File Karein: ${directLink}` : ''}`;

      case 'COMPLETED':
        return `✅ *Job Successfully Completed - ${companyName}*
Job *${jobId}* (${jobTitle}) ko *${employeeName}* ne complete kar diya hai.
Customer: ${customerName}${siteName ? ` (${siteName})` : ''}
Completion report system me record ho gayi hai.`;

      case 'EXTENSION_REQUEST':
        return `⏳ *Deadline Extension Request - ${companyName}*
Employee *${employeeName}* ne job *${jobId}* (${jobTitle}) ke liye *${dueDate}* tak extension maanga hai.
Reason: "${reason || 'Work in progress'}"
Kripya system me login karke Approve ya Reject karein.
${directLink ? `Review Link: ${directLink}` : ''}`;

      case 'EXTENSION_APPROVED':
        return `✅ *Extension Approved - ${companyName}*
Namaste *${employeeName}*, job *${jobId}* ke liye aapki deadline extension approve ho gayi hai.
New Due Date: *${dueDate}*`;

      case 'EXTENSION_REJECTED':
        return `❌ *Extension Rejected - ${companyName}*
Namaste *${employeeName}*, job *${jobId}* ka extension request reject ho gaya hai.
Remarks: "${remarks || 'SLA deadline unchanged'}"`;
    }
  }

  // DEFAULT ENGLISH
  switch (type) {
    case 'NEW_JOB':
      return `📋 *New Job Assigned - ${companyName}*
Hello *${employeeName}*,
A new task has been assigned to you:
*Job ID:* ${jobId}
*Title:* ${jobTitle}
*Customer:* ${customerName}${siteName ? ` (${siteName})` : ''}
*Priority:* ${priority.toUpperCase()}
*Due Date:* ${dueDate} at ${dueTime || '18:00'}

Please complete on time and file your daily progress updates.
${directLink ? `Direct Access & Report Link: ${directLink}` : ''}`;

    case 'REMINDER':
      return `⏰ *Job Reminder Notification - ${companyName}*
Hello *${employeeName}*,
Friendly reminder regarding your assigned job:
*Job ID:* ${jobId} - *${jobTitle}*
*Customer:* ${customerName}${siteName ? ` (${siteName})` : ''}
*Deadline:* ${dueDate} at ${dueTime || '18:00'} [${priority.toUpperCase()}]

Please prioritize completion and file the work report.
${directLink ? `Direct Access: ${directLink}` : ''}`;

    case 'OVERDUE':
      return `🚨 *Overdue Job Alert - Urgent Attention - ${companyName}*
Hello *${employeeName}*,
Job *${jobId}* (${jobTitle}) was due on ${dueDate} and is currently OVERDUE.
Please submit an immediate status update or complete the job report.
${directLink ? `File Completion Report: ${directLink}` : ''}`;

    case 'COMPLETED':
      return `✅ *Job Successfully Completed - ${companyName}*
Job *${jobId}* (${jobTitle}) was marked completed by *${employeeName}*.
Customer: ${customerName}${siteName ? ` (${siteName})` : ''}
Completion report and site attachments have been logged.`;

    case 'EXTENSION_REQUEST':
      return `⏳ *Deadline Extension Requested - ${companyName}*
Staff member *${employeeName}* requested an extension for job *${jobId}* (${jobTitle}) to *${dueDate}*.
Reason: "${reason || 'Pending tasks'}"
Please review and Approve or Reject in the system.
${directLink ? `Review Link: ${directLink}` : ''}`;

    case 'EXTENSION_APPROVED':
      return `✅ *Deadline Extension Approved - ${companyName}*
Hello *${employeeName}*, your deadline extension for job *${jobId}* was approved to *${dueDate}*.`;

    case 'EXTENSION_REJECTED':
      return `❌ *Deadline Extension Denied - ${companyName}*
Hello *${employeeName}*, your extension request for job *${jobId}* was denied. Reason: ${remarks || 'Deadline unchanged'}.`;
  }
}
