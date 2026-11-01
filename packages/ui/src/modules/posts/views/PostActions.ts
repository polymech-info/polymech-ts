import { toast } from "sonner";
import { translate } from "@/i18n";
import { generateFilename, downloadImage } from "@/utils/downloadUtils";
import { MediaItem } from "@/types";


interface PostData {
    title?: string;
    description?: string;
    created_at: string;
}

interface AuthorProfile {
    display_name: string | null;
    username: string | null;
}

export const exportMarkdown = (
    post: PostData | null,
    mediaItem: MediaItem | null,
    mediaItems: MediaItem[],
    authorProfile: AuthorProfile | null
) => {
    if (!post && !mediaItem) return;

    const title = post?.title || mediaItem?.title || 'Untitled';
    const description = post?.description || mediaItem?.description || '';
    const dateStr = post?.created_at || mediaItem?.created_at || new Date().toISOString();
    const date = new Date(dateStr).toLocaleDateString();

    // Author Details
    const authorName = authorProfile?.display_name || 'Unknown Author';
    const authorUsername = authorProfile?.username ? `@${authorProfile.username}` : '';
    const authorLine = authorUsername ? `${authorName} (${authorUsername})` : authorName;

    let mdContent = `# ${title}\n\n`;
    mdContent += `**Author:** ${authorLine}\n`;
    mdContent += `**Date:** ${date}\n\n`;
    if (description) {
        mdContent += `${description}\n\n`;
    }

    mdContent += `---\n\n`;

    mediaItems.forEach((item) => {
        const itemTitle = item.title || '';
        const itemDesc = item.description || '';

        if (itemTitle && itemTitle !== title) {
            mdContent += `## ${itemTitle}\n\n`;
        }

        // Use original image URL or a standard one
        mdContent += `![${itemTitle || 'Image'}](${item.image_url})\n\n`;

        if (itemDesc && itemDesc !== description) {
            mdContent += `${itemDesc}\n\n`;
        }

        mdContent += `---\n\n`;
    });

    // Trigger download
    const blob = new Blob([mdContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${generateFilename(title)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(translate('Markdown exported successfully'));
};

export const downloadMediaItem = async (mediaItem: MediaItem | null, isVideo: boolean) => {
    if (!mediaItem || isVideo) return; // Only download images for now
    try {
        const filename = generateFilename(mediaItem.title || 'download');
        await downloadImage(mediaItem.image_url, filename);
        toast.success(translate('Image downloaded successfully'));
    } catch (error) {
        console.error('Error downloading image:', error);
        toast.error(translate('Failed to download image'));
    }
};
