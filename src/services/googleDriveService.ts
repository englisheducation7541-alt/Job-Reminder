export interface DriveBackupItem {
  id: string;
  name: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  description?: string;
  properties?: Record<string, string>;
  recordCounts?: {
    jobs: number;
    customers: number;
    users: number;
  };
}

/**
 * List existing Job Reminder backup files from the user's Google Drive.
 */
export async function listDriveBackups(accessToken: string): Promise<DriveBackupItem[]> {
  try {
    const query = encodeURIComponent("name contains 'JobReminder_' and trashed = false");
    const fields = encodeURIComponent('files(id,name,size,createdTime,modifiedTime,description,properties)');
    const url = `https://www.googleapis.com/drive/v3/files?q=${query}&fields=${fields}&orderBy=modifiedTime desc&pageSize=30`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Google Drive API error: ${res.status}`);
    }

    const data = await res.json();
    const files: any[] = data.files || [];

    return files.map((f) => {
      let recordCounts: { jobs: number; customers: number; users: number } | undefined;
      if (f.properties?.jobsCount) {
        recordCounts = {
          jobs: parseInt(f.properties.jobsCount || '0', 10),
          customers: parseInt(f.properties.customersCount || '0', 10),
          users: parseInt(f.properties.usersCount || '0', 10),
        };
      } else if (f.description && f.description.includes('jobs:')) {
        try {
          const match = f.description.match(/jobs: (\d+), users: (\d+), customers: (\d+)/);
          if (match) {
            recordCounts = {
              jobs: parseInt(match[1], 10),
              users: parseInt(match[2], 10),
              customers: parseInt(match[3], 10),
            };
          }
        } catch {}
      }

      return {
        id: f.id,
        name: f.name,
        size: f.size ? formatBytes(parseInt(f.size, 10)) : undefined,
        createdTime: f.createdTime,
        modifiedTime: f.modifiedTime,
        description: f.description,
        properties: f.properties,
        recordCounts,
      };
    });
  } catch (error: any) {
    console.error('[Google Drive] Failed to list backups:', error);
    throw error;
  }
}

/**
 * Upload a complete system backup snapshot to Google Drive.
 */
export async function uploadBackupToDrive(
  accessToken: string,
  backupPayload: any,
  isAutoSync = false
): Promise<DriveBackupItem> {
  try {
    const timestamp = new Date().toISOString();
    const formattedDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const formattedTime = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }).replace(':', '-');

    const fileName = isAutoSync
      ? 'JobReminder_Latest_Sync.json'
      : `JobReminder_Backup_${formattedDate}_${formattedTime}.json`;

    const jobsCount = Array.isArray(backupPayload.jobs) ? backupPayload.jobs.length : 0;
    const usersCount = Array.isArray(backupPayload.users) ? backupPayload.users.length : 0;
    const customersCount = Array.isArray(backupPayload.customers) ? backupPayload.customers.length : 0;

    const description = `Job Reminder ${isAutoSync ? 'Auto-Sync Snapshot' : 'Full Backup'} • jobs: ${jobsCount}, users: ${usersCount}, customers: ${customersCount} • ${new Date().toLocaleString()}`;

    // If auto-sync, check if JobReminder_Latest_Sync.json already exists to update it in place
    let existingFileId: string | null = null;
    if (isAutoSync) {
      try {
        const query = encodeURIComponent("name = 'JobReminder_Latest_Sync.json' and trashed = false");
        const checkRes = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id)`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (checkRes.ok) {
          const checkData = await checkRes.json();
          if (checkData.files && checkData.files.length > 0) {
            existingFileId = checkData.files[0].id;
          }
        }
      } catch {}
    }

    const metadata = {
      name: fileName,
      description,
      mimeType: 'application/json',
      properties: {
        app: 'JobReminder',
        backupType: isAutoSync ? 'auto_sync' : 'manual_snapshot',
        timestamp,
        jobsCount: String(jobsCount),
        usersCount: String(usersCount),
        customersCount: String(customersCount),
      },
    };

    const boundary = '-------job_reminder_backup_boundary_' + Date.now();
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      JSON.stringify(backupPayload, null, 2) +
      closeDelimiter;

    let uploadUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    let method = 'POST';

    if (existingFileId) {
      uploadUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`;
      method = 'PATCH';
    }

    const res = await fetch(uploadUrl, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to upload to Google Drive: ${res.status}`);
    }

    const uploaded = await res.json();
    return {
      id: uploaded.id,
      name: uploaded.name || fileName,
      createdTime: uploaded.createdTime || timestamp,
      modifiedTime: uploaded.modifiedTime || timestamp,
      description,
      recordCounts: {
        jobs: jobsCount,
        users: usersCount,
        customers: customersCount,
      },
    };
  } catch (error: any) {
    console.error('[Google Drive] Backup upload error:', error);
    throw error;
  }
}

/**
 * Fetch and parse backup JSON content from a Google Drive file.
 */
export async function downloadDriveBackupContent(accessToken: string, fileId: string): Promise<any> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to download file from Google Drive: ${res.status}`);
    }

    const json = await res.json();
    return json;
  } catch (error: any) {
    console.error('[Google Drive] Download error:', error);
    throw error;
  }
}

/**
 * Delete a backup file from Google Drive.
 * (Note: Caller must enforce user confirmation dialog before calling this per Workspace Guidelines).
 */
export async function deleteDriveBackupFile(accessToken: string, fileId: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok && res.status !== 204) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.message || `Failed to delete file from Google Drive: ${res.status}`);
    }

    return true;
  } catch (error: any) {
    console.error('[Google Drive] Delete error:', error);
    throw error;
  }
}

/**
 * Format raw byte numbers into readable KB/MB string.
 */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
