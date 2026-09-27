/**
 * Date and time formatting utilities
 */

export function formatDateDisplay(dateStr?: string | null): string {
  if (!dateStr) return '';
  try {
    // If it's YYYY-MM-DD, parse year, month, day to avoid timezone offset shifts
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateStr || '';
  }
}

export function formatDateTime(dateStr?: string | null, timeStr?: string | null): string {
  const formattedDate = formatDateDisplay(dateStr);
  if (!formattedDate) return '';
  if (!timeStr) return formattedDate;
  return `${formattedDate} at ${timeStr}`;
}

export function isDateOverdue(dateStr?: string | null, timeStr?: string | null): boolean {
  if (!dateStr) return false;
  try {
    const target = new Date(`${dateStr}T${timeStr || '18:00'}`);
    return !isNaN(target.getTime()) && target < new Date();
  } catch {
    return false;
  }
}
