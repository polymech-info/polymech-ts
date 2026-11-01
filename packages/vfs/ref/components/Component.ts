// similar as ApplicationBase, we have routes and services.
import { ApplicationBase } from '../applications/Base';
import { BaseService } from '../services/Base';
import { IServiceConfiguration } from '../interfaces/Service';
import * as Router from 'koa-router';
export interface IComponent {
	application: ApplicationBase;
	label(): string;
	services(config: IServiceConfiguration): BaseService[];
	routes(): Router[];
	destroy(): void;
}
export class Component implements IComponent {
	application: ApplicationBase;
	serviceConfig: IServiceConfiguration;
	destroy(): void { }
	constructor(application: ApplicationBase, serviceConfig: IServiceConfiguration) {
		this.application = application;
		this.serviceConfig = serviceConfig;
	}
	label(): string {
		return "Component";
	}
	services(config: IServiceConfiguration): BaseService[] {
		return [];
	}
	routes(): Router[] {
		return [];
	}
}
