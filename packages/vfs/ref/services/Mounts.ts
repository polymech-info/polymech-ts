import { JSONFileService } from './JSONFile';
export class MountService extends JSONFileService {
	public method = 'XApp_Resource_Service';
	public root: string;
	constructor(path: string) {
		super(path);
		this.configPath = path;
		this.root = '';
	}
	public ls() {
		return this.readConfig()['items'];
	}
	methods() {
		return this.toMethods(['ls']);
	}
}
