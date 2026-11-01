import type { FileBrowserPluginContext, VfsPanelPlugin, VfsPanelPluginContribution } from '@/modules/storage/plugins/types';
import { imageVfsPlugins } from '@/modules/storage/plugins/Images';

/** All registered plugins (image, future: audio, code, …). Order matters on key collision — last wins. */
export const vfsPanelPlugins: VfsPanelPlugin[] = [...imageVfsPlugins];

export type { FileBrowserPluginContext, VfsPanelPlugin, VfsPanelPluginContribution } from '@/modules/storage/plugins/types';
export { IMAGES_PLUGINS, imageVfsPlugins } from '@/modules/storage/plugins/Images';

/**
 * Merge enabled plugin contributions into one partial {@link VfsPanelActionSpec} overlay.
 */
export function mergeVfsPluginContributions(ctx: FileBrowserPluginContext): VfsPanelPluginContribution {
    const out: VfsPanelPluginContribution = {};
    for (const plugin of vfsPanelPlugins) {
        if (!plugin.isEnabled()) continue;
        const contribution = plugin.contribute(ctx);
        if (contribution) {
            Object.assign(out, contribution);
        }
    }
    return out;
}
