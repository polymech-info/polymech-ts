"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const querystring_1 = require("querystring");
const AbstractRequest_1 = require("./AbstractRequest");
class VendorsRequest extends AbstractRequest_1.default {
    constructor(client, config) {
        super(client, config);
        this.entityPath = 'vendors';
        this.prefix = 'sra_';
        this.handlerParams = {};
        this.params = {};
    }
    buildUrl() {
        let url = super.buildUrl();
        url = url + (this.handlerParams.id ? `${this.handlerParams.id}/` : '');
        return url;
    }
    getForm() {
        this.entityPath = 'vendor_registration';
        this.setParams();
        return this.client.get(super.buildUrl(), {
            params: Object.assign({}, this.params),
            paramsSerializer: (params) => {
                return (0, querystring_1.stringify)(params);
            }
        });
    }
    create(data) {
        this.entityPath = 'vendor_registration';
        this.setParams();
        return this.client.post(super.buildUrl(), data);
    }
    setParams() {
        this.params = Object.assign(Object.assign({}, this.params), { language: this.config.language, sl: this.config.language, lang_code: this.config.language });
        if (this.handlerParams.orderBy) {
            this.params.sort_by = this.handlerParams.orderBy;
        }
        if (this.handlerParams.order) {
            this.params.sort_order = this.handlerParams.order;
        }
        if (this.handlerParams.search) {
            this.params.q = this.handlerParams.search;
        }
    }
}
exports.default = VendorsRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiVmVuZG9yc1JlcXVlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2NzY2FydC9hcGktcmVxdWVzdC9WZW5kb3JzUmVxdWVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLDZDQUF1QztBQUd2Qyx1REFBK0M7QUFFL0MsTUFBcUIsY0FBZSxTQUFRLHlCQUFlO0lBTXpELFlBQVksTUFBcUIsRUFBRSxNQUFjO1FBQy9DLEtBQUssQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFOdkIsZUFBVSxHQUFlLFNBQVMsQ0FBQztRQUNuQyxXQUFNLEdBQW1CLE1BQU0sQ0FBQTtRQU03QixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBRVMsUUFBUTtRQUNoQixJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDM0IsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXZFLE9BQU8sR0FBRyxDQUFBO0lBQ1osQ0FBQztJQUVELE9BQU87UUFDTCxJQUFJLENBQUMsVUFBVSxHQUFTLHFCQUFxQixDQUFDO1FBQzlDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtRQUVoQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUNwQixLQUFLLENBQUMsUUFBUSxFQUFFLEVBQ2hCO1lBQ0UsTUFBTSxvQkFDRCxJQUFJLENBQUMsTUFBTSxDQUNmO1lBQ0QsZ0JBQWdCLEVBQUUsQ0FBQyxNQUFXLEVBQUUsRUFBRTtnQkFDaEMsT0FBTyxJQUFBLHVCQUFTLEVBQUMsTUFBTSxDQUFDLENBQUE7WUFDMUIsQ0FBQztTQUNGLENBQ0YsQ0FBQTtJQUNILENBQUM7SUFFRCxNQUFNLENBQUMsSUFBUztRQUNkLElBQUksQ0FBQyxVQUFVLEdBQUcscUJBQXFCLENBQUM7UUFDeEMsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFBO1FBRWhCLE9BQU8sSUFBSSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQ3JCLEtBQUssQ0FBQyxRQUFRLEVBQUUsRUFDaEIsSUFBSSxDQUNMLENBQUE7SUFDSCxDQUFDO0lBRVMsU0FBUztRQUNqQixJQUFJLENBQUMsTUFBTSxtQ0FDTixJQUFJLENBQUMsTUFBTSxLQUNkLFFBQVEsRUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFDaEMsRUFBRSxFQUFVLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUNoQyxTQUFTLEVBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQ2pDLENBQUE7UUFFRCxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFO1lBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1NBQ2xEO1FBRUQsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRTtZQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztTQUNuRDtRQUVELElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQUU7WUFDN0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxNQUFNLENBQUM7U0FDM0M7SUFDSCxDQUFDO0NBQ0Y7QUFsRUQsaUNBa0VDIn0=