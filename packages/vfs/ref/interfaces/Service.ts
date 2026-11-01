import { IResourceDriven } from '../interfaces/Resource';
import { Application } from '../interfaces/Application';

export interface IServiceConfiguration {
	resourceConfiguration: IResourceDriven;
	application: Application;
}

export function create(config: IResourceDriven, application: Application): IServiceConfiguration {
	return {
		resourceConfiguration: config,
		application: application
	};
}
