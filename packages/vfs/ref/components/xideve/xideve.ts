import { Component } from '../Component';
import { BaseService } from '../../services/Base';
import { WorkbenchService } from '../xideve/services/Workbench';
import { LibraryService } from '../xideve/services/Library';
import { IServiceConfiguration } from '../../interfaces/Service';
import * as Router from 'koa-router';
import { IDelegate } from './Exporter';
import { IDelegate as IDelegateOptions } from './ExportOptions';
import Preview from './routes/Preview';
const d = {} as IDelegate;
const e = {} as IDelegateOptions;
export class XIDEVE extends Component {
	label(): string {
		return "xideve";
	}
	services(config: IServiceConfiguration): BaseService[] {
		return [new WorkbenchService(config), new LibraryService('')];
	}
	routes(): Router[] {
		return [Preview];
	}
};
