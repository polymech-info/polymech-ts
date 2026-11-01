import type { NavigateFunction } from 'react-router-dom';
import type { User } from "@polymech/shared";
import type { INode } from '@/modules/storage/types';
import type { VfsPanelActionSpec } from '@/modules/storage/useRegisterVfsPanelActions';

/**
 * Context passed to file-browser VFS plugins (selection, auth, navigation).
 * Keep this minimal; extend when new plugin kinds need more data.
 */
export interface FileBrowserPluginContext {
    mount: string;
    selected: INode[];
    accessToken?: string;
    sessionUser: User | undefined;
    navigate: NavigateFunction;
    /** Clears wizard stash and sets return path for `/wizard` close (see {@link useWizardContext}). */
    setWizardReturnPath: (path: string) => void;
}

/**
 * Partial overlay onto {@link VfsPanelActionSpec}. Plugins should only set keys they own;
 * later plugins in the list override earlier ones on key collision.
 */
export type VfsPanelPluginContribution = Partial<VfsPanelActionSpec>;

export interface VfsPanelPlugin {
    id: string;
    /** When false, {@link contribute} is not called. */
    isEnabled: () => boolean;
    contribute: (ctx: FileBrowserPluginContext) => VfsPanelPluginContribution | undefined;
}
