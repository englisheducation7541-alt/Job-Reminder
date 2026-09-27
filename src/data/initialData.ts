import {
  ClientPaymentReminder,
  CompanySettings,
  Customer,
  Job,
  JobActivity,
  User,
  WhatsAppMessageLog,
  WhatsAppSettings,
  WhatsAppTemplate,
} from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'usr_director',
    employeeId: 'DIR-001',
    name: 'Executive Director',
    designation: 'Managing Director & Operations Head',
    mobile: '+91 7541882104',
    whatsapp: '+91 7541882104',
    email: 'englisheducation7541@gmail.com',
    department: 'Executive Board',
    role: 'admin',
    active: true,
    joiningDate: '2023-01-01',
    secureToken: 'token_director_master99',
    password: 'admin123',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  },
];

export const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust_abc',
    customerId: 'CUST-001',
    companyName: 'ABC Hospital & Medical College',
    contactPerson: 'Dr. Vivek Malhotra',
    mobile: '+91 98999 11111',
    whatsapp: '+91 98999 11111',
    email: 'facilities@abchospital.org',
    address: 'Plot 4, Knowledge Park III',
    city: 'Greater Noida',
    state: 'Uttar Pradesh',
    customerType: 'Hospital',
    notes: '24/7 Critical Facility. Wear clean PPE in plant room.',
    createdAt: '2024-01-10',
    sites: [
      {
        id: 'site_abc_1',
        customerId: 'cust_abc',
        siteName: 'Main PSA Oxygen Generation Station',
        address: 'Basement Level 2, Utility Block, ABC Hospital',
        contactPerson: 'Mr. Rakesh (Plant Supervisor)',
        mobile: '+91 98999 11112',
        gpsLocation: '28.4744, 77.5040',
        notes: 'Security gate pass required at Gate 3.',
      },
      {
        id: 'site_abc_2',
        customerId: 'cust_abc',
        siteName: 'ICU High Pressure Manifold Room',
        address: '3rd Floor, Super Specialty Tower',
        contactPerson: 'Nurse Supervisor Reena',
        mobile: '+91 98999 11113',
        gpsLocation: '28.4744, 77.5040',
        notes: 'Quiet zone between 2 PM to 4 PM.',
      },
    ],
  },
  {
    id: 'cust_xyz',
    customerId: 'CUST-002',
    companyName: 'XYZ Industries Ltd',
    contactPerson: 'Mr. Pradeep Singhania',
    mobile: '+91 98888 22222',
    whatsapp: '+91 98888 22222',
    email: 'plant.head@xyzindustries.com',
    address: 'Sector 8, IMT Manesar',
    city: 'Gurugram',
    state: 'Haryana',
    customerType: 'Industrial',
    notes: 'Safety shoes and helmet mandatory at all times.',
    createdAt: '2024-02-15',
    sites: [
      {
        id: 'site_xyz_1',
        customerId: 'cust_xyz',
        siteName: 'Plant 1 - Heavy Boiler & Air Compression Room',
        address: 'Gate 2, IMT Manesar Industrial Estate',
        contactPerson: 'Mr. Joginder Singh (Works Manager)',
        mobile: '+91 98888 22223',
        gpsLocation: '28.3588, 76.9388',
        notes: 'Permit to work (PTW) must be signed before starting.',
      },
      {
        id: 'site_xyz_2',
        customerId: 'cust_xyz',
        siteName: 'Unit 4 - Cold Storage Cryogenic Tanks',
        address: 'South Campus, Manesar',
        contactPerson: 'Mr. Tarun (Safety Officer)',
        mobile: '+91 98888 22224',
        gpsLocation: '28.3590, 76.9392',
      },
    ],
  },
  {
    id: 'cust_metro',
    customerId: 'CUST-003',
    companyName: 'Metro Medical Diagnostic Centre',
    contactPerson: 'Dr. Anita Roy',
    mobile: '+91 98777 33333',
    whatsapp: '+91 98777 33333',
    email: 'admin@metromedical.in',
    address: 'Ring Road, South Extension Part 1',
    city: 'New Delhi',
    state: 'Delhi',
    customerType: 'Hospital',
    notes: 'Premium diagnostic imaging center. Work only during maintenance windows.',
    createdAt: '2024-03-01',
    sites: [
      {
        id: 'site_metro_1',
        customerId: 'cust_metro',
        siteName: 'Main Diagnostic Block - MRI Chiller Room',
        address: 'Rear Courtyard, Metro Medical, South Ex 1',
        contactPerson: 'Mr. Arvind (Facility Engg)',
        mobile: '+91 98777 33334',
        gpsLocation: '28.5729, 77.2201',
      },
    ],
  },
  {
    id: 'cust_greenpower',
    customerId: 'CUST-004',
    companyName: 'GreenPower Renewable Solutions',
    contactPerson: 'Karan Mehra',
    mobile: '+91 98666 44444',
    whatsapp: '+91 98666 44444',
    email: 'karan@greenpowersol.com',
    address: 'DLF Cyber City, Building 10',
    city: 'Gurugram',
    state: 'Haryana',
    customerType: 'Commercial',
    createdAt: '2024-04-12',
    sites: [
      {
        id: 'site_green_1',
        customerId: 'cust_greenpower',
        siteName: 'Commercial Solar Inverter Farm 500kW',
        address: 'Tower B Rooftop, Cyber City',
        contactPerson: 'Security Control Desk',
        mobile: '+91 98666 44445',
        gpsLocation: '28.4907, 77.0894',
      },
    ],
  },
];

export const INITIAL_JOB_TYPES: string[] = [
  'Service',
  'Installation',
  'Maintenance',
  'Breakdown',
  'Site Visit',
  'Inspection',
  'Material Follow-up',
  'Quotation Follow-up',
  'Payment Follow-up',
  'Customer Follow-up',
  'Internal Task',
  'Other',
];

export const INITIAL_TEMPLATES: WhatsAppTemplate[] = [
  {
    id: 'tpl_new_assigned',
    code: 'NEW_JOB_ASSIGNED',
    name: 'New Job Assigned',
    category: 'Job Alerts',
    templateText: `🔔 *Job Reminder: New Job Assigned ({{job_id}})*

Hello {{employee_name}},

You have been assigned a new job by {{manager_name}}.

📌 *Job:* {{job_title}}
🆔 *Job ID:* {{job_id}}
🏢 *Customer:* {{customer_name}}
📍 *Location:* {{site}}
📅 *Due Date:* {{due_date}}
⏰ *Due Time:* {{due_time}}
🚨 *Priority:* {{priority}}
📝 *Job Description:*
{{job_description}}

👉 *Login to view & accept:*
{{direct_access_url}}

Please review and accept within 2 hours.
Thank you!
— *Job Reminder Team*`,
    variables: [
      'employee_name',
      'manager_name',
      'job_title',
      'job_id',
      'customer_name',
      'site',
      'due_date',
      'due_time',
      'priority',
      'job_description',
      'direct_access_url',
    ],
    isDefault: true,
  },
  {
    id: 'tpl_job_accepted',
    code: 'JOB_ACCEPTED',
    name: 'Job Accepted Confirmation',
    category: 'Status Updates',
    templateText: `✅ *Job Reminder: Job Accepted ({{job_id}})*

Hello {{manager_name}},

Engineer {{employee_name}} has accepted Job *{{job_title}}* ({{job_id}}).

🏢 Customer: {{customer_name}}
📅 Deadline: {{due_date}} at {{due_time}}
Current Status: Accepted & Scheduled.
📝 *Job Description:*
{{job_description}}

👉 *Login to view portal:*
{{direct_access_url}}`,
    variables: ['manager_name', 'employee_name', 'job_title', 'job_id', 'customer_name', 'due_date', 'due_time', 'job_description', 'direct_access_url'],
    isDefault: true,
  },
  {
    id: 'tpl_reminder_before',
    code: 'REMINDER_BEFORE_DEADLINE',
    name: 'Reminder Before Deadline',
    category: 'Reminders',
    templateText: `⏰ *Job Reminder: Upcoming Deadline ({{job_id}})*

Hello {{employee_name}},

This is a timely reminder for your assigned job:

📌 *Job:* {{job_title}} ({{job_id}})
🏢 *Customer:* {{customer_name}}
📍 *Location:* {{site}}
📅 *Deadline:* {{due_date}} at {{due_time}}
🚨 *Priority:* {{priority}}
📝 *Job Description:*
{{job_description}}

👉 *Login to update status:*
{{direct_access_url}}

Thank you,
*Job Reminder*`,
    variables: ['employee_name', 'job_title', 'job_id', 'customer_name', 'site', 'due_date', 'due_time', 'priority', 'job_description', 'direct_access_url'],
    isDefault: true,
  },
  {
    id: 'tpl_due_today',
    code: 'DUE_TODAY',
    name: 'Due Today Morning Alert',
    category: 'Reminders',
    templateText: `☀️ *Job Reminder: Due Today ({{job_id}})*

Good morning {{employee_name}},

You have a job due TODAY:

📌 *Job:* {{job_title}}
🆔 *Job ID:* {{job_id}}
🏢 *Customer:* {{customer_name}}
⏰ *Due Time:* {{due_time}} today
📍 *Location:* {{site}}
📝 *Job Description:*
{{job_description}}

👉 *Login to start & update work:*
{{direct_access_url}}

*Job Reminder*`,
    variables: ['employee_name', 'job_title', 'job_id', 'customer_name', 'due_time', 'site', 'job_description', 'direct_access_url'],
    isDefault: true,
  },
  {
    id: 'tpl_due_2hours',
    code: 'DUE_IN_2_HOURS',
    name: 'Due in 2 Hours Critical Alert',
    category: 'Reminders',
    templateText: `⚠️ *Job Reminder: Due in 2 Hours ({{job_id}})*

Hello {{employee_name}},

Job *{{job_title}}* ({{job_id}}) at *{{customer_name}}* is due in *2 HOURS* (at {{due_time}}).

Status: {{status}}
📝 *Job Description:*
{{job_description}}

👉 *Login to submit completion report:*
{{direct_access_url}}`,
    variables: ['employee_name', 'job_title', 'job_id', 'customer_name', 'due_time', 'status', 'job_description', 'direct_access_url'],
    isDefault: true,
  },
  {
    id: 'tpl_deadline_reached',
    code: 'DEADLINE_REACHED',
    name: 'Deadline Reached Alert',
    category: 'Reminders',
    templateText: `🛑 *Job Reminder: Deadline Reached ({{job_id}})*

Hello {{employee_name}},

The deadline for *{{job_title}}* ({{job_id}}) has been reached ({{due_time}}).

📝 *Job Description:*
{{job_description}}

👉 *Login to submit report or update:*
{{direct_access_url}}`,
    variables: ['employee_name', 'job_title', 'job_id', 'due_time', 'job_description', 'direct_access_url'],
    isDefault: true,
  },
  {
    id: 'tpl_job_overdue',
    code: 'JOB_OVERDUE',
    name: 'Job Overdue Escalation Alert',
    category: 'Escalation',
    templateText: `🚨 *Job Reminder: Overdue Escalation ({{job_id}})*

ATTENTION {{employee_name}} & {{manager_name}},

Job *{{job_title}}* ({{job_id}}) for *{{customer_name}}* is now OVERDUE!
Original deadline was: {{due_date}} at {{due_time}}.

Priority: {{priority}}
Current Status: {{status}}
📝 *Job Description:*
{{job_description}}

👉 *Login immediately to update:*
{{direct_access_url}}`,
    variables: ['employee_name', 'manager_name', 'job_title', 'job_id', 'customer_name', 'due_date', 'due_time', 'priority', 'status', 'job_description', 'direct_access_url'],
    isDefault: true,
  },
  {
    id: 'tpl_job_completed',
    code: 'JOB_COMPLETED',
    name: 'Job Completed Notification',
    category: 'Status Updates',
    templateText: `🎉 *Job Reminder: Job Completed ({{job_id}})*

Job *{{job_title}}* ({{job_id}}) for *{{customer_name}}* has been marked COMPLETED by {{employee_name}}.

📅 Completed On: {{due_date}}
📝 *Job Description:*
{{job_description}}

👉 *Login to view completion report:*
{{direct_access_url}}

Thank you for your service!
*Job Reminder*`,
    variables: ['job_title', 'job_id', 'customer_name', 'employee_name', 'due_date', 'job_description', 'direct_access_url'],
    isDefault: true,
  },
  {
    id: 'tpl_job_reassigned',
    code: 'JOB_REASSIGNED',
    name: 'Job Reassigned Notice',
    category: 'Job Alerts',
    templateText: `🔄 *Job Reminder: Job Reassigned ({{job_id}})*

Hello {{employee_name}},

Job *{{job_title}}* ({{job_id}}) at *{{customer_name}}* has been assigned to you by {{manager_name}}.

📅 Deadline: {{due_date}} at {{due_time}}
📍 Location: {{site}}
📝 *Job Description:*
{{job_description}}

👉 *Login to view & accept:*
{{direct_access_url}}`,
    variables: ['employee_name', 'job_title', 'job_id', 'customer_name', 'manager_name', 'due_date', 'due_time', 'site', 'job_description', 'direct_access_url'],
    isDefault: true,
  },
  {
    id: 'tpl_job_cancelled',
    code: 'JOB_CANCELLED',
    name: 'Job Cancelled Notice',
    category: 'Status Updates',
    templateText: `❌ *JOB CANCELLED*

Hello {{employee_name}},

Job *{{job_title}}* ({{job_id}}) for *{{customer_name}}* has been CANCELLED by management.

No further action is required on this task.
{{direct_access_url}}`,
    variables: ['employee_name', 'job_title', 'job_id', 'customer_name', 'direct_access_url'],
    isDefault: true,
  },
  {
    id: 'tpl_daily_pending',
    code: 'DAILY_PENDING_JOBS',
    name: 'Daily Pending Jobs Summary',
    category: 'Summaries',
    templateText: `📋 *DAILY PENDING JOBS — {{employee_name}}*

Good morning {{employee_name}},

Here is your daily task list:
You have active jobs scheduled today.

Open your Mobile My Jobs dashboard to view, navigate and complete:
{{direct_access_url}}

Have a productive day!
*Job Reminder*`,
    variables: ['employee_name', 'direct_access_url'],
    isDefault: true,
  },
  {
    id: 'tpl_daily_summary',
    code: 'DAILY_TEAM_SUMMARY',
    name: 'Daily Team Summary for Managers',
    category: 'Summaries',
    templateText: `📊 *DAILY TEAM SUMMARY — {{company_name}}*

Date: Today
Total Active Jobs: 14
Pending: 4 | In Progress: 3 | Overdue: 2 | Completed: 5

🚨 *Urgent & Overdue Attention:*
- JR-2026-0104: Breakdown – Oxygen Plant Compressor (Overdue)
- JR-2026-0101: Preventive Maintenance – PSA Oxygen Plant (Due Today)

View live operations dashboard:
{{direct_access_url}}`,
    variables: ['company_name', 'direct_access_url'],
    isDefault: true,
  },
];

export const INITIAL_WHATSAPP_SETTINGS: WhatsAppSettings = {
  provider: 'meta_cloud',
  apiUrl: 'https://graph.facebook.com/v20.0',
  apiToken: 'EAAQ...demo_token_sec_key_masked',
  phoneNumberId: '109283746592819',
  businessAccountId: '209384756291039',
  webhookUrl: 'https://api.jobreminder.io/webhooks/whatsapp',
  senderName: 'Job Reminder Notifications',
  autoSendEnabled: true,
  retryAttempts: 3,
  openWhatsAppFallback: true,
};

export const INITIAL_COMPANY_SETTINGS: CompanySettings = {
  companyName: "Abhimanyu",
  tagline: "Assign. Remind. Track. Complete.",
  address: "Plot 12, Industrial Area Phase 1, New Delhi - 110020",
  contactNumber: "+91 7541882104",
  email: "abhimanyu.k.works@gmail.com",
  website: "https://youtube.com",
  gstNumber: "07XXXXXXXXXXXXZ5",
  bankName: "State Bank of India",
  accountNumber: "38920192847",
  ifscCode: "SBIN0001234",
  upiId: "7541882104@upi",
  dailySummaryTime: "08:30",
  enableDailySummary: true,
  unacceptedEscalationHours: 2,
  overdueEscalationHours: 4,
  logoUrl: "",
  companyLogo: "",
};

export const INITIAL_JOBS: Job[] = [
  {
    id: "job_1789403305179_f7yrx",
    jobId: "JR-2026-0101",
    title: "Payment Collection & Client Site Follow-up",
    description: "Contact client regarding the pending payment and service schedule.",
    jobType: "Payment Follow-up",
    priority: "high",
    customerId: "cust_abc",
    siteId: "site_abc_1",
    contactPerson: "Dr. Vivek Malhotra",
    contactNumber: "+91 98999 11111",
    assignedToId: "usr_director",
    additionalAssigneeIds: [],
    startDate: "2026-09-14",
    dueDate: "2026-09-30",
    dueTime: "17:00",
    estimatedDuration: "3 Hours",
    status: "assigned",
    notes: [],
    dailyUpdates: [],
    attachments: [],
    reminderConfig: {
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
    createdAt: "2026-09-14T16:28:25.179Z",
    updatedAt: "2026-09-14T16:28:24.415Z",
  },
];

export const INITIAL_ACTIVITIES: JobActivity[] = [
  {
    id: "act_1789897781645_993h",
    jobId: "usr_sandeep",
    timestamp: "2026-09-20T09:49:41.645Z",
    actorId: "usr_director",
    actorName: "Executive Director",
    actionType: "employee_deleted",
    description: "Team member \"Sandeep Kumar\" (engineer) removed by Executive Director.",
  },
  {
    id: "act_1789897777772_xpyq",
    jobId: "usr_amit",
    timestamp: "2026-09-20T09:49:37.772Z",
    actorId: "usr_director",
    actorName: "Executive Director",
    actionType: "employee_deleted",
    description: "Team member \"Amit Patel\" (engineer) removed by Executive Director.",
  },
  {
    id: "act_1789897773527_s6s6",
    jobId: "usr_rahul",
    timestamp: "2026-09-20T09:49:33.527Z",
    actorId: "usr_director",
    actorName: "Executive Director",
    actionType: "employee_deleted",
    description: "Team member \"Rahul Sharma\" (engineer) removed by Executive Director.",
  },
  {
    id: "act_1789897769067_3p2j",
    jobId: "usr_manager",
    timestamp: "2026-09-20T09:49:29.067Z",
    actorId: "usr_director",
    actorName: "Executive Director",
    actionType: "employee_deleted",
    description: "Team member \"Rajesh Verma\" (manager) removed by Executive Director.",
  },
  {
    id: "act_1789897764484_ypfm",
    jobId: "usr_admin",
    timestamp: "2026-09-20T09:49:24.484Z",
    actorId: "usr_director",
    actorName: "Executive Director",
    actionType: "employee_deleted",
    description: "Team member \"Sarah Jenkins\" (admin) removed by Executive Director.",
  },
];

export const INITIAL_MESSAGE_LOGS: WhatsAppMessageLog[] = [];

export const INITIAL_PAYMENT_REMINDERS: ClientPaymentReminder[] = [];
