import { JobPriority, JobStatus } from '../types';
export { formatDateDisplay, formatDateTime, isDateOverdue } from './dateUtils';

export function getStatusBadgeClass(status: JobStatus): string {
  switch (status) {
    case 'new':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'assigned':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'accepted':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'in_progress':
      return 'bg-amber-50 text-amber-700 border-amber-300 animate-pulse';
    case 'waiting_customer':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'waiting_material':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'waiting_approval':
      return 'bg-violet-50 text-violet-700 border-violet-200';
    case 'on_hold':
      return 'bg-stone-100 text-stone-700 border-stone-300';
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    case 'cancelled':
      return 'bg-rose-50 text-rose-600 border-rose-200 line-through';
    case 'overdue':
      return 'bg-red-100 text-red-800 border-red-300 font-semibold';
    default:
      return 'bg-stone-100 text-stone-700 border-stone-200';
  }
}

export function getPriorityBadgeClass(priority: JobPriority): string {
  switch (priority) {
    case 'urgent':
      return 'bg-red-50 text-red-700 border-red-200 font-bold';
    case 'high':
      return 'bg-amber-50 text-amber-800 border-amber-200 font-medium';
    case 'normal':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'low':
      return 'bg-stone-100 text-stone-600 border-stone-200';
    default:
      return 'bg-stone-100 text-stone-700 border-stone-200';
  }
}

export function downloadCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const separator = ',';
  const keys = Object.keys(rows[0]);
  const csvContent =
    keys.join(separator) +
    '\n' +
    rows
      .map((row) => {
        return keys
          .map((k) => {
            let cell = row[k] === null || row[k] === undefined ? '' : row[k];
            cell = cell instanceof Date ? cell.toLocaleString() : cell.toString();
            cell = cell.replace(/"/g, '""');
            if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`;
            return cell;
          })
          .join(separator);
      })
      .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
