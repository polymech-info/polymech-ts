/**
 * Download an image from a URL or data URI
 */
export const downloadImage = async (imageUrl: string, filename?: string) => {
  try {
    // If it's a data URI, download directly
    if (imageUrl.startsWith('data:')) {
      downloadFromDataUri(imageUrl, filename);
      return;
    }

    // For external URLs, fetch and download
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (!response.ok) throw new Error('Failed to fetch image');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    
    // Extract filename from URL or use provided filename
    const defaultFilename = filename || extractFilenameFromUrl(imageUrl) || 'image.jpg';
    
    downloadFromUrl(url, defaultFilename);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading image:', error);
    // Fallback: try to open image in new tab
    window.open(imageUrl, '_blank');
  }
};

/**
 * Download from data URI
 */
const downloadFromDataUri = (dataUri: string, filename?: string) => {
  const link = document.createElement('a');
  link.href = dataUri;
  link.download = filename || 'image.png';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Download from blob URL
 */
const downloadFromUrl = (url: string, filename: string) => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Extract filename from URL
 */
const extractFilenameFromUrl = (url: string): string | null => {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const filename = pathname.substring(pathname.lastIndexOf('/') + 1);
    return filename && filename.includes('.') ? filename : null;
  } catch {
    return null;
  }
};

/**
 * Generate a filename based on title and timestamp
 */
export const generateFilename = (title?: string, extension = 'jpg'): string => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const cleanTitle = title 
    ? title.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '-').toLowerCase()
    : 'image';
  
  return `${cleanTitle}-${timestamp}.${extension}`;
};