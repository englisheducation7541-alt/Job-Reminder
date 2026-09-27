/**
 * Data Import / Export / Backup Utility
 * Provides JSON and Excel/CSV data exports and state backup/restore for Admin.
 */

import { User, Job, Customer, WhatsAppMessageLog, JobActivity, CompanySettings, WhatsAppSettings, WhatsAppTemplate, AppNotification } from '../types';

export interface AppBackupPayload {
  version: string;
  backupDate: string;
  exportedBy: string;
  companySettings: CompanySettings;
  whatsappSettings: WhatsAppSettings;
  users: User[];
  customers: Customer[];
  jobTypes: string[];
  jobs: Job[];
  templates: WhatsAppTemplate[];
  messageLogs: WhatsAppMessageLog[];
  activities: JobActivity[];
  notifications?: AppNotification[];
}

/**
 * Trigger browser file download
 */
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

/**
 * Export full state as JSON file
 */
export function exportStateAsJson(payload: AppBackupPayload, filenamePrefix: string = 'job-reminder-export') {
  const dateStr = new Date().toISOString().split('T')[0];
  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
  downloadBlob(blob, `${filenamePrefix}-${dateStr}.json`);
}

/**
 * Escape field for CSV
 */
function csvEscape(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Export tabular data as structured CSV file (Excel-compatible)
 */
export function exportDataAsCsv(payload: AppBackupPayload) {
  const dateStr = new Date().toISOString().split('T')[0];
  let csv = '';

  // 1. Jobs Table
  csv += '=== JOBS MASTER ===\n';
  csv += ['Job ID', 'Title', 'Customer', 'Site', 'Job Type', 'Priority', 'Status', 'Assigned To', 'Due Date', 'Due Time', 'Created At'].map(csvEscape).join(',') + '\n';
  payload.jobs.forEach((j) => {
    const assignee = payload.users.find((u) => u.id === j.assignedToId)?.name || j.assignedToId;
    const customer = payload.customers.find((c) => c.id === j.customerId);
    const site = customer?.sites.find((s) => s.id === j.siteId);
    const customerDisplayName = (j as any).customerName || customer?.companyName || j.customerId;
    const siteDisplayName = (j as any).siteName || site?.siteName || j.siteId;
    csv += [
      j.jobId,
      j.title,
      customerDisplayName,
      siteDisplayName,
      j.jobType,
      j.priority,
      j.status,
      assignee,
      j.dueDate,
      j.dueTime || '18:00',
      j.createdAt,
    ].map(csvEscape).join(',') + '\n';
  });

  csv += '\n=== EMPLOYEES & TEAM ===\n';
  csv += ['Employee ID', 'Name', 'Designation', 'Department', 'Role', 'WhatsApp', 'Email', 'Active'].map(csvEscape).join(',') + '\n';
  payload.users.forEach((u) => {
    csv += [
      u.employeeId,
      u.name,
      u.designation,
      u.department,
      u.role,
      u.whatsapp,
      u.email,
      u.active ? 'Active' : 'Inactive',
    ].map(csvEscape).join(',') + '\n';
  });

  csv += '\n=== CUSTOMERS & SITES ===\n';
  csv += ['Customer Name', 'City', 'Contact Person', 'Mobile', 'Type', 'Sites Count'].map(csvEscape).join(',') + '\n';
  payload.customers.forEach((c) => {
    csv += [
      c.companyName,
      c.city,
      c.contactPerson,
      c.mobile,
      c.customerType,
      c.sites?.length || 0,
    ].map(csvEscape).join(',') + '\n';
  });

  csv += '\n=== WHATSAPP REMINDER LOGS ===\n';
  csv += ['Date & Time', 'Recipient', 'WhatsApp Number', 'Message Type', 'Job ID', 'Status'].map(csvEscape).join(',') + '\n';
  payload.messageLogs.forEach((l) => {
    csv += [
      l.timestamp,
      l.recipientName,
      l.whatsappNumber,
      l.messageType,
      l.jobId,
      l.status,
    ].map(csvEscape).join(',') + '\n';
  });

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `job-reminder-report-${dateStr}.csv`);
}

/**
 * Validate imported JSON backup file
 */
export function validateBackupJson(jsonString: string): { valid: boolean; error?: string; data?: AppBackupPayload } {
  try {
    const data = JSON.parse(jsonString);
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'File does not contain valid JSON object.' };
    }
    if (!Array.isArray(data.jobs) || !Array.isArray(data.users)) {
      return { valid: false, error: 'Backup file missing required jobs or users collections.' };
    }
    return { valid: true, data: data as AppBackupPayload };
  } catch (err: any) {
    return { valid: false, error: err?.message || 'Failed to parse JSON file.' };
  }
}
