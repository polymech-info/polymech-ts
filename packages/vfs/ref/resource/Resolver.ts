import { IResourceDriven } from '../interfaces/Resource';
export class ResourceResolver implements IResourceDriven {
	configPath: string;
	relativeVariables: any;
	absoluteVariables: any;
	constructor(path: string, relativeVariables: any, absoluteVariables: any) {
		this.configPath = path;
		this.relativeVariables = relativeVariables;
		this.absoluteVariables = absoluteVariables;
	}
}
