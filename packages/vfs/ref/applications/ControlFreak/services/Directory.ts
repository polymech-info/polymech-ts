import { DirectoryService as Base } from '../../../services/Directory';
import { EResourceType, FileResource } from '../../../interfaces/Resource';
import { create as createLocalVFS } from '../../../vfs/Local';
import { EEKey  } from '../../../applications/Base';
import * as fs from 'fs';
import * as path from 'path';
export class DirectoryService extends Base {
	_userDir(userRoot: string, what: string) {
		return path.resolve(path.join(userRoot + path.sep + what));
	}
	_resolveUserMount(mount: string, request: any, _default?: string): string {
		const user = this._getUser(request);
		if (user) {
			switch (mount) {
				case 'workspace_user': {
					return this._userDir(user, 'workspace');
				}
				case 'user_drivers': {
					return this._userDir(user, 'drivers');
				}
				case 'user_devices': {
					return this._userDir(user, 'devices');
				}
				case 'user': {
					return this._userDir(user, '');
				}
			}
		}
		return _default;
	}
	public getVFS(mount: string, request?: any) {
		const resource = this.getResourceByTypeAndName(EResourceType.FILE_PROXY, mount);
		if (resource) {
			let root = this._resolveUserMount(mount, request) || this.resolveAbsolute(resource as FileResource);
			try {
				if (fs.lstatSync(root)) {
					return createLocalVFS({
						root: root,
						nopty: true
					});
				}
			} catch (e) {
				console.warn('cant get VFS for ' + mount + ' for root ' + root);
			}
		}
		return null;
	}
}
