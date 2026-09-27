import {
  CompanySettings,
  Customer,
  CustomerSite,
  Job,
  User,
  WhatsAppMessageLog,
  WhatsAppSettings,
  WhatsAppTemplate,
} from '../types';

/**
 * Helper to ensure links shared to WhatsApp, SMS, or other devices/Gmail accounts
 * use the public Shared App URL (ais-pre-) rather than the developer's private container (ais-dev-).
 * In Google AI Studio, ais-dev-* links return 404 to any user other than the workspace owner.
 */
export function getPublicAppOrigin(): string {
  if (typeof window === 'undefined') return 'https://jobreminder.app';
  let origin = window.location.origin;
  if (origin.includes('ais-dev-')) {
    origin = origin.replace('ais-dev-', 'ais-pre-');
  }
  return origin;
}

/**
 * Generates the login page access link for WhatsApp reminders.
 * User requirement: "whatsapp reminder me jo link send hoga wo login page ka link hona chahiye."
 */
export function generateLoginUrl(user?: User): string {
  const origin = getPublicAppOrigin();
  if (user && (user.whatsapp || user.mobile)) {
    const cleanPhone = cleanPhoneNumber(user.whatsapp || user.mobile);
    return `${origin}/?view=login&phone=${cleanPhone}`;
  }
  return `${origin}/?view=login`;
}

export function generateDirectAccessUrl(
  user?: User,
  job?: Job,
  action: 'view_job' | 'profile' = 'view_job'
): string {
  // Always return the login page link for WhatsApp reminders
  return generateLoginUrl(user);
}

export function generateProfileAccessUrl(user?: User): string {
  return generateLoginUrl(user);
}

/**
 * Replaces all template placeholders like {{employee_name}}, {{job_title}}, {{due_date}}, etc.
 */
export function renderTemplate(
  templateText: string,
  context: {
    employee?: User;
    manager?: User;
    job?: Job;
    customer?: Customer;
    site?: CustomerSite;
    companySettings?: CompanySettings;
    customVars?: Record<string, string>;
  }
): string {
  const { employee, manager, job, customer, site, companySettings, customVars } = context;

  const directUrl = employee
    ? generateDirectAccessUrl(employee, job, job ? 'view_job' : 'profile')
    : (typeof window !== 'undefined' ? window.location.href : 'https://jobreminder.app');

  const profileUrl = employee
    ? generateProfileAccessUrl(employee)
    : directUrl;

  const jobDesc = (job?.description || '').trim();

  const replacements: Record<string, string> = {
    employee_name: employee ? employee.name : 'Team Member',
    engineer_name: employee ? employee.name : 'Team Member',
    manager_name: manager ? manager.name : 'Operations Manager',
    job_id: job ? job.jobId : 'JR-0000',
    job_title: job ? job.title : 'General Task',
    job_description: jobDesc || 'Standard procedures apply',
    description: jobDesc || 'Standard procedures apply',
    job_desc: jobDesc || 'Standard procedures apply',
    task_description: jobDesc || 'Standard procedures apply',
    details: jobDesc || 'Standard procedures apply',
    customer_name: customer ? customer.companyName : 'Valued Client',
    site: site ? `${site.siteName} (${site.address})` : 'Client Site',
    site_name: site ? site.siteName : 'Client Site',
    site_address: site ? site.address : 'On site',
    due_date: job ? formatDateDisplay(job.dueDate) : 'Today',
    deadline_date: job ? formatDateDisplay(job.dueDate) : 'Today',
    due_time: job ? job.dueTime : '18:00',
    deadline_time: job ? job.dueTime : '18:00',
    priority: job ? capitalize(job.priority) : 'Normal',
    status: job ? formatStatusLabel(job.status) : 'Assigned',
    direct_access_url: directUrl,
    login_link: directUrl,
    login_url: directUrl,
    url: directUrl,
    profile_url: profileUrl,
    company_name: companySettings ? companySettings.companyName : 'Job Reminder',
    ...(customVars || {}),
  };

  let rendered = templateText;
  Object.entries(replacements).forEach(([key, val]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    rendered = rendered.replace(regex, val);
  });

  // If the job has a description and it is not already included in the rendered text,
  // automatically include it right before the login link or before the footer.
  if (jobDesc && !rendered.toLowerCase().includes(jobDesc.toLowerCase())) {
    const formattedDesc = `📝 *Job Description:*\n${jobDesc}\n\n`;
    if (rendered.includes('👉 *Login')) {
      rendered = rendered.replace('👉 *Login', `${formattedDesc}👉 *Login`);
    } else if (rendered.includes('👉')) {
      rendered = rendered.replace('👉', `${formattedDesc}👉`);
    } else if (rendered.includes(directUrl)) {
      rendered = rendered.replace(directUrl, `${formattedDesc}${directUrl}`);
    } else if (rendered.includes('— *')) {
      rendered = rendered.replace('— *', `${formattedDesc}— *`);
    } else if (rendered.includes('*Job Reminder*')) {
      rendered = rendered.replace('*Job Reminder*', `${formattedDesc}*Job Reminder*`);
    } else {
      rendered = `${rendered.trim()}\n\n${formattedDesc.trim()}`;
    }
  }

  return rendered;
}

export function cleanPhoneNumber(phone: string): string {
  // Strip spaces, dashes, plus signs, brackets
  return phone.replace(/[^0-9]/g, '');
}

/**
 * Creates a direct wa.me fallback link so anyone can click "Open WhatsApp"
 * to immediately send the message via native WhatsApp or WhatsApp Web.
 */
export function generateWhatsAppWebUrl(phoneNumber: string, messageText: string): string {
  const cleanPhone = cleanPhoneNumber(phoneNumber);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`;
}

/**
 * Formats a date string nicely (e.g. 2026-09-11 -> 11 Sep 2026)
 */
export function formatDateDisplay(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    new: 'New',
    assigned: 'Assigned',
    accepted: 'Accepted',
    in_progress: 'In Progress',
    waiting_customer: 'Waiting for Customer',
    waiting_material: 'Waiting for Material',
    waiting_approval: 'Waiting for Approval',
    on_hold: 'On Hold',
    completed: 'Completed',
    cancelled: 'Cancelled',
    overdue: 'Overdue',
  };
  return labels[status] || status;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Simulates sending via official WhatsApp Business API (Meta Cloud API / Twilio / etc.)
 */
export async function sendViaWhatsAppAPI(
  payload: {
    recipientPhone: string;
    messageText: string;
    jobId: string;
    recipientName: string;
  },
  settings: WhatsAppSettings
): Promise<{
  success: boolean;
  messageId: string;
  status: 'sent' | 'delivered' | 'failed';
  error?: string;
}> {
  // Simulating API latency and validation
  await new Promise((resolve) => setTimeout(resolve, 800));

  const cleanPhone = cleanPhoneNumber(payload.recipientPhone);
  if (!cleanPhone || cleanPhone.length < 8) {
    return {
      success: false,
      messageId: `err_${Date.now()}`,
      status: 'failed',
      error: 'Invalid recipient WhatsApp phone number format.',
    };
  }

  // Simulate success with realistic WhatsApp Business Message ID
  const fakeId = `wamid.HBgM${cleanPhone}FBG${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

  return {
    success: true,
    messageId: fakeId,
    status: 'sent',
  };
}

/**
 * Checks if a specific job deadline has passed relative to now
 */
export function isJobOverdue(job: Job, currentTime = new Date()): boolean {
  if (['completed', 'cancelled'].includes(job.status)) {
    return false;
  }
  const [hours, minutes] = (job.dueTime || '18:00').split(':').map(Number);
  const dueDateTime = new Date(`${job.dueDate}T${String(hours).padStart(2, '0')}:${String(minutes || 0).padStart(2, '0')}:00`);
  return currentTime.getTime() > dueDateTime.getTime();
}

/**
 * Evaluates pending reminder schedules for a job
 */
export function checkTriggerDue(
  triggerType: string,
  job: Job,
  currentTime = new Date()
): boolean {
  if (!job.reminderConfig.enabled) return false;
  if (['completed', 'cancelled'].includes(job.status)) return false;

  const [dueHours, dueMinutes] = (job.dueTime || '18:00').split(':').map(Number);
  const due = new Date(`${job.dueDate}T${String(dueHours).padStart(2, '0')}:${String(dueMinutes || 0).padStart(2, '0')}:00`);
  const now = currentTime.getTime();
  const dueMs = due.getTime();
  const diffHours = (dueMs - now) / (1000 * 60 * 60);

  switch (triggerType) {
    case '7_days_before':
      return job.reminderConfig.triggers.sevenDaysBefore && diffHours <= 7 * 24 && diffHours > 6 * 24;
    case '3_days_before':
      return job.reminderConfig.triggers.threeDaysBefore && diffHours <= 3 * 24 && diffHours > 2 * 24;
    case '1_day_before':
      return job.reminderConfig.triggers.oneDayBefore && diffHours <= 24 && diffHours > 20;
    case 'morning_of_due': {
      if (!job.reminderConfig.triggers.morningOfDueDate) return false;
      const todayDateStr = currentTime.toISOString().split('T')[0];
      return job.dueDate === todayDateStr && currentTime.getHours() >= 8 && diffHours > 2;
    }
    case '2_hours_before':
      return job.reminderConfig.triggers.twoHoursBefore && diffHours <= 2 && diffHours > 0;
    case 'at_due_time':
      return job.reminderConfig.triggers.atDueTime && Math.abs(diffHours) <= 0.25; // within 15 minutes of deadline
    case 'overdue_hourly':
      return job.reminderConfig.triggers.overdueAlert && diffHours < 0;
    default:
      return false;
  }
}
