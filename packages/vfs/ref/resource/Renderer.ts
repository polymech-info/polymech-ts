import { EResourceType, IResource, DefaultDelimitter } from '../interfaces/Resource';
import { IDelimitter } from '../interfaces/index';
import * as io from '../io/json';
import { ResourceResolver } from '../resource/Resolver';
import * as utils from '../utils/StringUtils';
import * as _ from 'lodash';
import * as base64 from 'base-64';
// @TODO: escape & id
export class ResourceRenderer extends ResourceResolver {
	render(item: IResource): string {
		let result = '';
		let delimitter: IDelimitter = DefaultDelimitter();
		switch (item.type) {
			case EResourceType.JS_HEADER_INCLUDE: {
				// tslint:disable-next-line:quotemark
				result = "<script type='text/javascript' src='" +
					utils.replace(item.url, null, this.relativeVariables, delimitter)
					+ "'></script>\n";
				break;
			}
			case EResourceType.JS_HEADER_SCRIPT_TAG: {
				result = '<script type="application/javascript">\n';
				result += utils.replace(io.read(utils.replace(item.url, null, this.absoluteVariables, delimitter)),
					null,
					this.relativeVariables,
					delimitter);
				result += '</script>';
				break;
			}
			case EResourceType.CSS: {
				const rel = 'stylesheet';
				// tslint:disable-next-line:quotemark
				result = "<link rel='" + rel + "' id='css_" + base64.encode(item.url) + "' href='" + utils.replace(item.url, null, this.relativeVariables, delimitter) + "'  type='text/css' />\n";
				break;
			}
		}
		return result;
	}
	renderHeader(): string {
		let resourceItems = [];
		_.each(JSON.parse(io.read(this.configPath)).items, (item: IResource) => {
			if (item.enabled) {
				const resolved = this.render(item);
				if (resolved && resolved.length) {
					resourceItems.push(resolved);
				}
			}
		});
		return resourceItems.join('');
	}
}
