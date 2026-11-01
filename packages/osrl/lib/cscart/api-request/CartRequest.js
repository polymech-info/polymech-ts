"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mapValues_1 = require("lodash/mapValues");
const keyBy_1 = require("lodash/keyBy");
const AbstractRequest_1 = require("./AbstractRequest");
class CartRequest extends AbstractRequest_1.default {
    constructor(client, config) {
        super(client, config);
        this.entityPath = 'cart_content';
        this.prefix = 'sra_';
        this.handlerParams = {};
        this.params = {};
    }
    withShippings(ids) {
        this.params = Object.assign(Object.assign({}, this.params), { calculate_shipping: 'A' });
        if (ids && ids.length) {
            this.params = Object.assign(Object.assign({}, this.params), { shipping_ids: ids });
        }
        return this;
    }
    buildUrl() {
        let url = super.buildUrl();
        url = url + (this.handlerParams.id ? `${this.handlerParams.id}/` : '');
        return url;
    }
    add(products) {
        let requestProducts = {};
        if (Array.isArray(products)) {
            products.map((product) => {
                if (product.product_options && product.product_options.length) {
                    product.product_options = (0, mapValues_1.default)((0, keyBy_1.default)(product.product_options, 'id'), 'value');
                }
                requestProducts[product.product_id] = Object.assign({}, product);
            });
        }
        else {
            requestProducts = {
                [products.product_id]: Object.assign(Object.assign({}, products), { product_options: products.product_options ? (0, mapValues_1.default)((0, keyBy_1.default)(products.product_options, 'id'), 'value') : undefined })
            };
        }
        return this.post({
            products: requestProducts
        });
    }
    update(product) {
        return this.put(Object.assign(Object.assign({}, product), { product_options: product.product_options ? (0, mapValues_1.default)((0, keyBy_1.default)(product.product_options, 'id'), 'value') : undefined }));
    }
    saveUserData(userData) {
        return this.put({
            user_data: userData
        });
    }
    setParams() {
        this.params = Object.assign(Object.assign({}, this.params), { language: this.config.language, sl: this.config.language, lang_code: this.config.language });
    }
}
exports.default = CartRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQ2FydFJlcXVlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2NzY2FydC9hcGktcmVxdWVzdC9DYXJ0UmVxdWVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLGdEQUF3QztBQUN4Qyx3Q0FBZ0M7QUFHaEMsdURBQStDO0FBRS9DLE1BQU0sV0FBWSxTQUFRLHlCQUFlO0lBTXZDLFlBQVksTUFBcUIsRUFBRSxNQUFjO1FBQy9DLEtBQUssQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFOdkIsZUFBVSxHQUFXLGNBQWMsQ0FBQTtRQUNuQyxXQUFNLEdBQVcsTUFBTSxDQUFBO1FBTXJCLElBQUksQ0FBQyxhQUFhLEdBQUcsRUFBRSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxNQUFNLEdBQUcsRUFBRSxDQUFDO0lBQ25CLENBQUM7SUFFRCxhQUFhLENBQUMsR0FBbUI7UUFDL0IsSUFBSSxDQUFDLE1BQU0sbUNBQ04sSUFBSSxDQUFDLE1BQU0sS0FDZCxrQkFBa0IsRUFBRSxHQUFHLEdBQ3hCLENBQUE7UUFFRCxJQUFJLEdBQUcsSUFBSSxHQUFHLENBQUMsTUFBTSxFQUFFO1lBQ3JCLElBQUksQ0FBQyxNQUFNLG1DQUNOLElBQUksQ0FBQyxNQUFNLEtBQ2QsWUFBWSxFQUFFLEdBQUcsR0FDbEIsQ0FBQTtTQUNGO1FBRUQsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRVMsUUFBUTtRQUNoQixJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUE7UUFDMUIsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXZFLE9BQU8sR0FBRyxDQUFBO0lBQ1osQ0FBQztJQUVELEdBQUcsQ0FBQyxRQUFzRDtRQUN4RCxJQUFJLGVBQWUsR0FBUSxFQUFFLENBQUM7UUFFOUIsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsQ0FBQyxFQUFFO1lBQzNCLFFBQVEsQ0FBQyxHQUFHLENBQUMsQ0FBQyxPQUFZLEVBQUUsRUFBRTtnQkFDNUIsSUFBSSxPQUFPLENBQUMsZUFBZSxJQUFJLE9BQU8sQ0FBQyxlQUFlLENBQUMsTUFBTSxFQUFFO29CQUM3RCxPQUFPLENBQUMsZUFBZSxHQUFHLElBQUEsbUJBQVMsRUFBQyxJQUFBLGVBQUssRUFBQyxPQUFPLENBQUMsZUFBZSxFQUFFLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFBO2lCQUNuRjtnQkFDRCxlQUFlLENBQUMsT0FBTyxDQUFDLFVBQVUsQ0FBQyxxQkFBTyxPQUFPLENBQUMsQ0FBQztZQUNyRCxDQUFDLENBQUMsQ0FBQTtTQUNIO2FBQU07WUFDTCxlQUFlLEdBQUc7Z0JBQ2hCLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxrQ0FDaEIsUUFBUSxLQUNYLGVBQWUsRUFBRSxRQUFRLENBQUMsZUFBZSxDQUFDLENBQUMsQ0FBQyxJQUFBLG1CQUFTLEVBQUMsSUFBQSxlQUFLLEVBQUMsUUFBUSxDQUFDLGVBQWUsRUFBRSxJQUFJLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsU0FBUyxHQUNsSDthQUNGLENBQUM7U0FDSDtRQUVELE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQztZQUNmLFFBQVEsRUFBRSxlQUFlO1NBQzFCLENBQUMsQ0FBQTtJQUNKLENBQUM7SUFFRCxNQUFNLENBQUMsT0FBWTtRQUNqQixPQUFPLElBQUksQ0FBQyxHQUFHLGlDQUNWLE9BQU8sS0FDVixlQUFlLEVBQUUsT0FBTyxDQUFDLGVBQWUsQ0FBQyxDQUFDLENBQUMsSUFBQSxtQkFBUyxFQUFDLElBQUEsZUFBSyxFQUFDLE9BQU8sQ0FBQyxlQUFlLEVBQUUsSUFBSSxDQUFDLEVBQUUsT0FBTyxDQUFDLENBQUMsQ0FBQyxDQUFDLFNBQVMsSUFDL0csQ0FBQTtJQUNKLENBQUM7SUFFRCxZQUFZLENBQUMsUUFBYTtRQUN4QixPQUFPLElBQUksQ0FBQyxHQUFHLENBQUM7WUFDZCxTQUFTLEVBQUUsUUFBUTtTQUNwQixDQUFDLENBQUE7SUFDSixDQUFDO0lBRVMsU0FBUztRQUNqQixJQUFJLENBQUMsTUFBTSxtQ0FDTixJQUFJLENBQUMsTUFBTSxLQUNkLFFBQVEsRUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFDaEMsRUFBRSxFQUFVLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUNoQyxTQUFTLEVBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQ2pDLENBQUE7SUFDSCxDQUFDO0NBQ0Y7QUFXRCxrQkFBZSxXQUFXLENBQUEifQ==