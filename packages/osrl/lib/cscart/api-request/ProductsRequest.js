"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractRequest_1 = require("./AbstractRequest");
class ProductsRequest extends AbstractRequest_1.default {
    constructor(client, config) {
        super(client, config);
        this.entityPath = 'products';
        this.prefix = '';
        this.handlerParams = {};
        this.params = {};
    }
    buildUrl() {
        let url = super.buildUrl();
        url = url + (this.handlerParams.id ? `${this.handlerParams.id}/` : '');
        console.log('request products', url);
        return url;
    }
    forOptions(options) {
        let selected_options = {};
        options.forEach(option => selected_options[option.optionId] = option.value);
        this.params.selected_options = selected_options;
        return this;
    }
    forCategory(categoryId) {
        this.params.filter = 'Y';
        this.params.cid = categoryId;
        return this;
    }
    vendorProducts(productId) {
        this.params.vendor_products_by_product_id = productId;
        return this;
    }
    withFilters(appliedFiltersHash) {
        this.params.get_filters = true;
        this.params.features_hash = appliedFiltersHash;
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
        if (this.handlerParams.search) {
            this.params.q = this.handlerParams.search;
        }
        console.log('set params', this.params);
    }
}
exports.default = ProductsRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJvZHVjdHNSZXF1ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9jc2NhcnQvYXBpLXJlcXVlc3QvUHJvZHVjdHNSZXF1ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBRUEsdURBQStDO0FBRS9DLE1BQXFCLGVBQWdCLFNBQVEseUJBQWU7SUFNMUQsWUFBWSxNQUFxQixFQUFFLE1BQWM7UUFDL0MsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtRQU52QixlQUFVLEdBQVcsVUFBVSxDQUFDO1FBQ2hDLFdBQU0sR0FBVyxFQUFFLENBQUE7UUFNakIsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVTLFFBQVE7UUFDaEIsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzNCLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUV2RSxPQUFPLENBQUMsR0FBRyxDQUFDLGtCQUFrQixFQUFFLEdBQUcsQ0FBQyxDQUFDO1FBRXJDLE9BQU8sR0FBRyxDQUFDO0lBQ2IsQ0FBQztJQUVELFVBQVUsQ0FBQyxPQUE4QjtRQUN2QyxJQUFJLGdCQUFnQixHQUFRLEVBQUUsQ0FBQztRQUUvQixPQUFPLENBQUMsT0FBTyxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQ3ZCLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxRQUFRLENBQUMsR0FBRyxNQUFNLENBQUMsS0FBSyxDQUNqRCxDQUFDO1FBRUYsSUFBSSxDQUFDLE1BQU0sQ0FBQyxnQkFBZ0IsR0FBRyxnQkFBZ0IsQ0FBQTtRQUUvQyxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFRCxXQUFXLENBQUMsVUFBa0I7UUFDNUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDO1FBQ3pCLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxHQUFHLFVBQVUsQ0FBQztRQUU3QixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFRCxjQUFjLENBQUMsU0FBaUI7UUFDOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyw2QkFBNkIsR0FBRyxTQUFTLENBQUM7UUFFdEQsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRUQsV0FBVyxDQUFDLGtCQUEyQjtRQUNyQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsR0FBRyxJQUFJLENBQUM7UUFDL0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxhQUFhLEdBQUcsa0JBQWtCLENBQUM7UUFFL0MsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRUQsU0FBUztRQUNQLElBQUksQ0FBQyxNQUFNLG1DQUNOLElBQUksQ0FBQyxNQUFNLEtBQ2QsUUFBUSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUM5QixFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQ3hCLFNBQVMsRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsR0FDaEMsQ0FBQTtRQUVELElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUU7WUFDOUIsSUFBSSxDQUFDLE1BQU0sQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUM7U0FDbEQ7UUFFRCxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxFQUFFO1lBQzVCLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsS0FBSyxDQUFDO1NBQ25EO1FBRUQsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sRUFBRTtZQUM3QixJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQztTQUMzQztRQUNELE9BQU8sQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUN6QyxDQUFDO0NBQ0Y7QUExRUQsa0NBMEVDIn0=