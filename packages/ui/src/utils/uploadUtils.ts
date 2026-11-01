/**
 * Upload Utility Functions
 */

import { getAuthToken, serverUrl } from '@/lib/db';

// Helper to upload internal video
export const uploadInternalVideo = async (
    file: File,
    userId: string,
    onProgress?: (progress: number) => void
): Promise<{ dbId: string; thumbnailUrl: string; meta: any }> => {
    const token = await getAuthToken();

    return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        const title = file.name.replace(/\.[^/.]+$/, '');

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${serverUrl}/api/videos/upload?userId=${userId}&title=${encodeURIComponent(title)}&preset=original`);
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable && onProgress) {
                const percent = Math.round((e.loaded / e.total) * 100);
                onProgress(percent);
            }
        };

        xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 202) {
                try {
                    const data = JSON.parse(xhr.responseText);
                    resolve(data);
                } catch (e) {
                    reject(new Error('Invalid response'));
                }
            } else {
                try {
                    const err = JSON.parse(xhr.responseText);
                    reject(new Error(err.error || 'Upload failed'));
                } catch {
                    reject(new Error(`Upload failed with status ${xhr.status}`));
                }
            }
        };

        xhr.onerror = () => reject(new Error('Network error'));
        xhr.send(formData);
    });
};
