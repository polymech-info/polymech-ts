"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractRequest_1 = require("./AbstractRequest");
class CategoriesRequest extends AbstractRequest_1.default {
    constructor(client, config) {
        super(client, config);
        this.entityPath = 'categories';
        this.prefix = 'sra_';
        this.handlerParams = {};
        this.params = {};
    }
    buildUrl() {
        let url = super.buildUrl();
        return url + (this.handlerParams.id ? `${this.handlerParams.id}/` : '');
    }
    withSubcategories() {
        this.params = Object.assign(Object.assign({}, this.params), { get_subcategories: 'Y', 
            /**
             * @deprecated
             */
            subcategories: 'Y' });
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
exports.default = CategoriesRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2F0ZWdvcmllc1JlcXVlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2NzY2FydC9hcGktcmVxdWVzdC9DYXRlZ29yaWVzUmVxdWVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUdBLHVEQUErQztBQUUvQyxNQUFxQixpQkFBa0IsU0FBUSx5QkFBZTtJQU01RCxZQUFZLE1BQXFCLEVBQUUsTUFBYztRQUMvQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBTnZCLGVBQVUsR0FBVyxZQUFZLENBQUM7UUFDbEMsV0FBTSxHQUFXLE1BQU0sQ0FBQTtRQU1yQixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBRVMsUUFBUTtRQUNoQixJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDMUIsT0FBTyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQTtJQUN6RSxDQUFDO0lBRU0saUJBQWlCO1FBQ3RCLElBQUksQ0FBQyxNQUFNLG1DQUNOLElBQUksQ0FBQyxNQUFNLEtBQ2QsaUJBQWlCLEVBQUUsR0FBRztZQUN0Qjs7ZUFFRztZQUNILGFBQWEsRUFBRSxHQUFHLEdBQ25CLENBQUE7UUFFRCxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFUyxTQUFTO1FBQ2pCLElBQUksQ0FBQyxNQUFNLG1DQUNOLElBQUksQ0FBQyxNQUFNLEtBQ2QsUUFBUSxFQUFJLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUNoQyxFQUFFLEVBQVUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQ2hDLFNBQVMsRUFBRyxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FDakMsQ0FBQTtRQUVELElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUU7WUFDOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7U0FDbEQ7UUFFRCxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFO1lBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO1NBQ25EO0lBQ0gsQ0FBQztDQUNGO0FBOUNELG9DQThDQyJ9