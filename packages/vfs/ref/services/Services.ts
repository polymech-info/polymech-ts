import { IServiceConfiguration } from '../interfaces/Service';
import { JSONFileService } from './JSONFile';
import * as _ from 'lodash';
export class NodeService extends JSONFileService {
	public method = 'XIDE_NodeJS_Service';
	public config: IServiceConfiguration;
	public deviceServerPort = 9998;
	public setDeviceServerPort(port: number) {
		this.deviceServerPort = port;
	}
	public methods(): any {
		return this.toMethods(['ls', 'stop', 'start']);
	}
	public ls() {
		const args = arguments;
		const request = this._getRequest(args);
		let items = this.readConfig()['items'];
		if (request) {
			items = _.map(items, (item: any) => {
				item.host = request.host.split(':')[0];
				if (item.name === 'Device Control Server') {
					item.port = this.deviceServerPort;
				}
				return item;
			});
		}
		return items;
	}
}
