"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractRequest_1 = require("./AbstractRequest");
class PagesRequest extends AbstractRequest_1.default {
    constructor(client, config) {
        super(client, config);
        this.entityPath = 'pages';
        this.prefix = 'sra_';
        this.handlerParams = {};
        this.params = {};
    }
    buildUrl() {
        let url = super.buildUrl();
        url = url + (this.handlerParams.id ? `${this.handlerParams.id}/` : '');
        return url;
    }
    forParentPage(parentId) {
        this.params.parent_id = parentId;
        return this;
    }
    setParams() {
        this.params = Object.assign(Object.assign({}, this.params), { language: this.config.language, sl: this.config.language, lang_code: this.config.language });
        if (this.handlerParams.orderBy) {
            this.params.sort_by = this.handlerParams.orderBy;
        }
        if (this.handlerParams.order) {
            this.params.sort_order = this.handlerParams.order;
        }
    }
}
exports.default = PagesRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUGFnZXNSZXF1ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9jc2NhcnQvYXBpLXJlcXVlc3QvUGFnZXNSZXF1ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsdURBQStDO0FBRS9DLE1BQXFCLFlBQWEsU0FBUSx5QkFBZTtJQU12RCxZQUFZLE1BQXFCLEVBQUUsTUFBYztRQUMvQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBTnZCLGVBQVUsR0FBVyxPQUFPLENBQUM7UUFDN0IsV0FBTSxHQUFXLE1BQU0sQ0FBQTtRQU1yQixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBRVMsUUFBUTtRQUNoQixJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDM0IsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXZFLE9BQU8sR0FBRyxDQUFBO0lBQ1osQ0FBQztJQUVNLGFBQWEsQ0FBQyxRQUFnQjtRQUNuQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsR0FBRyxRQUFRLENBQUM7UUFFakMsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRVMsU0FBUztRQUNqQixJQUFJLENBQUMsTUFBTSxtQ0FDTixJQUFJLENBQUMsTUFBTSxLQUNkLFFBQVEsRUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFDaEMsRUFBRSxFQUFVLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUNoQyxTQUFTLEVBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQ2pDLENBQUE7UUFFRCxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFO1lBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1NBQ2xEO1FBRUQsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRTtZQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztTQUNuRDtJQUNILENBQUM7Q0FDRjtBQXpDRCwrQkF5Q0MifQ==