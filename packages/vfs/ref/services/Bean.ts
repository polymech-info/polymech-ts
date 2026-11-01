import { DirectoryService } from '../applications/ControlFreak/services/Directory';
import { IObjectLiteral } from '../interfaces/index';
import { IResourceDriven } from '../interfaces/Resource';
import { EResourceType, FileResource } from '../interfaces/Resource';
import { IServiceConfiguration } from '../interfaces/Service';
import { ResourceQuery } from '../resource/Query';
import { write } from '../io/file';

const io = {
	parse: JSON.parse,
	serialize: JSON.stringify
};

export class BeanService extends DirectoryService {
	public config: IServiceConfiguration;
	constructor(config: IServiceConfiguration | null) {
		super(config ? config.resourceConfiguration : {} as IResourceDriven);
		this.config = config;
	}

	async getMetaData(scope, path, request?: any) {
		if (!request) {
			console.error('----no request');
		}
		return io.parse(await this.get(scope + '://' + path, false, false, false, request) as string);
	}

	public removeGroup($scope, $path) { }

	public setContent($scopeName: string, $path: string, $content: string) { }

	async _updateItemMetaData(scope: string = 'user_devices', path: string = 'House/WebCam.meta.json', dataPath: string = '/inputs', query: IObjectLiteral = {}, value: IObjectLiteral = {}) {
		const resource: ResourceQuery = new ResourceQuery(await this.getMetaData(scope, path, this._getRequest(arguments)));
		const data = resource.set('', dataPath.replace('/', ''), query, value);
		const dst = this.resolvePath(scope, path, this._getRequest(arguments));
		write(dst, io.serialize(data, null, 4), this.WRITE_MODE);
		return data;
	}
	async getItems(path: string, scope: string, options: any) {
		return null;
	}
	async _ls(mount: string, _path: string, options: any, recursive: boolean = false): Promise<any> {
		try {
			const resource = this.getResourceByTypeAndName(EResourceType.FILE_PROXY, mount);
			if (resource) {
				let root = this.resolveAbsolute(resource as FileResource);
				root = this._resolveUserMount(mount, this._getRequest(arguments), root);
				const nodes = await this.getItems(root, mount, {});
				return { items: nodes };
			} else {
				console.warn('cant find resource for ' + mount);
			}
		} catch (e) {
			console.error('ls error ', e);
		}
	}
}
