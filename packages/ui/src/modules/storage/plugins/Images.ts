import { toast } from 'sonner';
import { translate } from '@/i18n';
import { getMimeCategory } from '@/modules/storage/helpers';
import { vfsSelectionToWizardImages } from '@/modules/storage/vfsWizardBridge';
import type { FileBrowserPluginContext, VfsPanelPlugin } from '@/modules/storage/plugins/types';

/**
 * Toggle image-related file-browser plugins without touching the panel.
 * Add more flags here as new image actions ship (e.g. `sendToEditor: true`).
 */
export const IMAGES_PLUGINS = {
    /** Ribbon/context: “Open with AI” → `/wizard` with VFS-backed `initialImages`. */
    openWithAi: true,
} as const;

function contributeOpenWithAi(ctx: FileBrowserPluginContext) {
    if (!ctx.sessionUser) {
        return undefined;
    }

    const canOpenWithAi =
        ctx.selected.length > 0 && ctx.selected.every((n) => getMimeCategory(n) === 'image');

    const openWithAi = () => {
        if (!ctx.sessionUser) {
            toast.error(translate('Please sign in to use the AI wizard'));
            return;
        }
        if (!canOpenWithAi) return;
        const initialImages = vfsSelectionToWizardImages(ctx.mount, ctx.selected, ctx.accessToken);
        ctx.setWizardReturnPath(`${window.location.pathname}${window.location.search}`);
        ctx.navigate('/wizard', { state: { initialImages } });
    };

    return { canOpenWithAi, openWithAi };
}

/** Image-focused VFS panel plugins (extend with more entries as needed). */
export const imageVfsPlugins: VfsPanelPlugin[] = [
    {
        id: 'images.open-with-ai',
        isEnabled: () => IMAGES_PLUGINS.openWithAi,
        contribute: contributeOpenWithAi,
    },
];
