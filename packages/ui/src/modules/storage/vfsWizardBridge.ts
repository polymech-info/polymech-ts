import type { ImageFile } from '@/components/ImageWizard/types';
import type { INode } from '@/modules/storage/types';
import { vfsUrl } from '@/modules/storage/helpers';

/** Carried on {@link ImageFile.meta} so wizard save paths can write back to VFS instead of buckets. */
export type VfsWizardSourceMeta = { vfs: { mount: string; path: string } };

/**
 * Build {@link ImageFile} rows for `/wizard` from the current VFS selection.
 * Uses the same authenticated GET URL shape as the file browser preview.
 */
/** New filename next to the source (same directory), e.g. `shots/a.png` → `shots/a-iter-1730000000000.png`. */
export function nextIterationVfsPath(sourcePath: string): string {
    const clean = sourcePath.replace(/^\/+/, '');
    const lastSlash = clean.lastIndexOf('/');
    const dir = lastSlash >= 0 ? clean.slice(0, lastSlash) : '';
    const base = lastSlash >= 0 ? clean.slice(lastSlash + 1) : clean;
    const dot = base.lastIndexOf('.');
    const ext = dot >= 0 ? base.slice(dot) : '.png';
    const stem = dot >= 0 ? base.slice(0, dot) : base;
    const name = `${stem}-iter-${Date.now()}${ext}`;
    return dir ? `${dir}/${name}` : name;
}

export function vfsSelectionToWizardImages(mount: string, nodes: INode[], accessToken?: string): ImageFile[] {
    return nodes.map((node, i) => {
        const tokenParam = accessToken ? `token=${encodeURIComponent(accessToken)}` : '';
        const base = vfsUrl('get', mount, node.path);
        let url = tokenParam ? `${base}?${tokenParam}` : base;
        if (node.mtime) {
            url += (url.includes('?') ? '&' : '?') + `t=${node.mtime}`;
        }
        return {
            id: `vfs:${mount}:${node.path}`,
            src: url,
            title: node.name,
            selected: i === 0,
            meta: { vfs: { mount, path: node.path } } satisfies VfsWizardSourceMeta,
        };
    });
}
