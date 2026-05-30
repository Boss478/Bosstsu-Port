'use client';

export const uploadFileWithProgress = (
  file: File,
  folder: string,
  onProgress: (loaded: number) => void,
  signal?: AbortSignal
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);

    if (signal) {
      if (signal.aborted) {
        reject(new Error('Upload aborted'));
        return;
      }
      signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        onProgress(e.loaded);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response.url);
        } catch {
          reject(new Error('Invalid response from server'));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));

    xhr.open('POST', '/api/upload');
    xhr.send(fd);
  });
};

export const uploadFileWithRetry = async (
  file: File,
  folder: string,
  onProgress: (loaded: number) => void,
  retries = 3,
  signal?: AbortSignal
): Promise<string> => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await uploadFileWithProgress(file, folder, onProgress, signal);
    } catch (err) {
      if (err instanceof Error && err.message === 'Upload aborted') throw err;
      if (attempt === retries) throw err;
      await new Promise(res => setTimeout(res, attempt * 1000));
    }
  }
  throw new Error('Failed to upload after max retries');
};

export function clientValidateFileType(file: File, allowedTypes: string[]): boolean {
  if (!file || file.size === 0) return true;
  return allowedTypes.includes(file.type);
}
