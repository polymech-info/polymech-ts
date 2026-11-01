"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractRequest_1 = require("./AbstractRequest");
class WishlistRequest extends AbstractRequest_1.default {
    constructor(client, config) {
        super(client, config);
        this.entityPath = 'wish_list';
        this.prefix = 'sra_';
        this.handlerParams = {};
        this.params = {};
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
                requestProducts[product.product_id] = Object.assign(Object.assign({}, product), { amount: 1 });
            });
        }
        else {
            requestProducts = {
                [products.product_id]: Object.assign(Object.assign({}, products), { amount: 1 })
            };
        }
        return this.post({
            products: requestProducts
        });
    }
    remove() {
        return this.delete();
    }
    setParams() {
        this.params = Object.assign(Object.assign({}, this.params), { language: this.config.language, sl: this.config.language, lang_code: this.config.language });
    }
}
exports.default = WishlistRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiV2lzaGxpc3RSZXF1ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9jc2NhcnQvYXBpLXJlcXVlc3QvV2lzaGxpc3RSZXF1ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0EsdURBQStDO0FBRS9DLE1BQXFCLGVBQWdCLFNBQVEseUJBQWU7SUFNMUQsWUFBWSxNQUFxQixFQUFFLE1BQWM7UUFDL0MsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtRQU52QixlQUFVLEdBQVcsV0FBVyxDQUFDO1FBQ2pDLFdBQU0sR0FBVyxNQUFNLENBQUM7UUFNdEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVTLFFBQVE7UUFDaEIsSUFBSSxHQUFHLEdBQUcsS0FBSyxDQUFDLFFBQVEsRUFBRSxDQUFDO1FBQzNCLEdBQUcsR0FBRyxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQztRQUV2RSxPQUFPLEdBQUcsQ0FBQTtJQUNaLENBQUM7SUFLTSxHQUFHLENBQUMsUUFBOEQ7UUFDdkUsSUFBSSxlQUFlLEdBQVEsRUFBRSxDQUFDO1FBRTlCLElBQUksS0FBSyxDQUFDLE9BQU8sQ0FBQyxRQUFRLENBQUMsRUFBRTtZQUMzQixRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBWSxFQUFFLEVBQUU7Z0JBQzVCLGVBQWUsQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLG1DQUM5QixPQUFPLEtBQ1YsTUFBTSxFQUFFLENBQUMsR0FDVixDQUFDO1lBQ0osQ0FBQyxDQUFDLENBQUE7U0FDSDthQUFNO1lBQ0wsZUFBZSxHQUFHO2dCQUNoQixDQUFDLFFBQVEsQ0FBQyxVQUFVLENBQUMsa0NBQ2hCLFFBQVEsS0FDWCxNQUFNLEVBQUUsQ0FBQyxHQUNWO2FBQ0YsQ0FBQztTQUNIO1FBRUQsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDO1lBQ2YsUUFBUSxFQUFFLGVBQWU7U0FDMUIsQ0FBQyxDQUFBO0lBQ0osQ0FBQztJQUVNLE1BQU07UUFDWCxPQUFPLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQTtJQUN0QixDQUFDO0lBRVMsU0FBUztRQUNqQixJQUFJLENBQUMsTUFBTSxtQ0FDTixJQUFJLENBQUMsTUFBTSxLQUNkLFFBQVEsRUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFDaEMsRUFBRSxFQUFVLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUNoQyxTQUFTLEVBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQ2pDLENBQUE7SUFDSCxDQUFDO0NBQ0Y7QUExREQsa0NBMERDIn0=