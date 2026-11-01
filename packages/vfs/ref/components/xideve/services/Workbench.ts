import { RpcMethod } from '../../../services/Base';
import { BeanService } from './../../../services/Bean';
import * as AnyPromise from 'any-promise';
//import *  from '../export/Exporter';
export class WorkbenchService extends BeanService {
	// implement Base#method
	public method = 'XApp_XIDE_Workbench_Service';
	// implement VFS#ls
	@RpcMethod
	async getInfo(path: string) {
		return new AnyPromise((resolve, reject) => {
			resolve({
				"themeDefaultSet": null,
				"dojoOptions": null,
				"widgetPalette": null,
				"userInfo": {
					"email": "noemail@noemail.com",
					"isLocalInstall": false,
					"userDisplayName": "A",
					"userId": "A"
				},
				"workbenchState": {
					"activeEditor": null,
					"editors": [],
					"nhfo": [],
					"project": null,
					"id": "",
					"Fields": [],
					"admin": {
						"settings": [{
							"id": "driverView",
							"value": {
								"basic": {
									"showHeader": false,
									"selection": { "selected": ["9627cb05-2f23-8846-0721-5abcc7d3afbb"] },
									"toolbar": false,
									"properties": true
								},
								"conditionalProcess": {
									"showHeader": false,
									"selection": { "selected": [] },
									"toolbar": true,
									"properties": true
								},
								"basicVariables": {
									"showHeader": false,
									"selection": { "selected": [] },
									"toolbar": false,
									"properties": true
								}
							}
						}, { "id": "theme", "value": "blue" }]
					}
				},
				"project": null,
				"id": "",
				"Fields": []
			});
		});
	}

	//
	// ─── DECORATORS ─────────────────────────────────────────────────────────────────
	//
	public getRpcMethods(): string[] {
		throw new Error("Should be implemented by decorator");
	}

	methods() {
		const methods = this.getRpcMethods();
		return this.toMethods(methods);
	}
}
