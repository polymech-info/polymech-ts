import { getAuthToken, serverUrl, apiClient } from './db';

/**
 * Uploads an image file via the server API.
 * Call sites are storage-agnostic; uploads are forwarded to VFS.
 */
export const uploadImage = async (file: File, userId: string): Promise<{ publicUrl: string, meta?: any }> => {
    if (!userId) throw new Error('User ID is required for upload');
    if (!serverUrl) throw new Error('VITE_SERVER_IMAGE_API_URL is not configured');
    const token = await getAuthToken();
    const formData = new FormData();
    formData.append('file', file);

    const headers: Record<string, string> = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${serverUrl}/api/images?forward=vfs&original=true`, {
        method: 'POST',
        headers,
        body: formData,
    });

    if (response.status === 413) {
        let detail = '';
        try {
            const body = await response.json();
            detail = body.message || '';
        } catch { /* ignore */ }
        throw new Error(detail || 'Image too big!');
    }

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Server upload failed:', errorText);
        throw new Error(`Failed to upload image via server: ${response.statusText}`);
    }

    const data = await response.json();
    return { publicUrl: data.url, meta: data.meta };
};

/**
 * Uploads generated image bytes using the same configured image upload flow.
 */
export const uploadGeneratedImageData = async (
    imageData: ArrayBuffer,
    prompt: string,
    userId: string,
): Promise<{ publicUrl: string, meta?: any }> => {
    const ts = Date.now();
    const slug = prompt.slice(0, 20).replace(/[^a-zA-Z0-9]/g, '-');
    const file = new File([imageData], `${ts}-${slug}.png`, { type: 'image/png' });
    return uploadImage(file, userId);
};

/**
 * Creates a picture record in the database via API.
 */
export const createPictureRecord = async (userId: string, file: File, publicUrl: string, meta?: any) => {
    return apiClient('/api/pictures', {
        method: 'POST',
        body: JSON.stringify({
            user_id: userId,
            title: file.name.split('.')[0] || 'Uploaded Image',
            description: null,
            image_url: publicUrl,
            type: 'image',
            meta: meta || {},
        }),
    });
};

/**
 * Uploads an image and creates a picture record in one go.
 */
export const uploadAndCreatePicture = async (file: File, userId: string) => {
    const { publicUrl, meta } = await uploadImage(file, userId);
    return await createPictureRecord(userId, file, publicUrl, meta);
};
