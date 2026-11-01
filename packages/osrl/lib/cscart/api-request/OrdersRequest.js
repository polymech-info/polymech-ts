"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const forOwn_1 = require("lodash/forOwn");
const snakeCase_1 = require("lodash/snakeCase");
const AbstractRequest_1 = require("./AbstractRequest");
class OrdersRequest extends AbstractRequest_1.default {
    constructor(client, config) {
        super(client, config);
        this.entityPath = 'orders';
        this.prefix = 'sra_';
        this.handlerParams = {};
        this.params = {};
    }
    buildUrl() {
        let url = super.buildUrl();
        url = url + (this.handlerParams.id ? `${this.handlerParams.id}/` : '');
        return url;
    }
    get() {
        this.params = Object.assign(Object.assign({}, this.params), { get_orders_data: true, get_children_orders_data: true });
        return super.get();
    }
    create(order) {
        let productsObject = {};
        order.products.map((product) => {
            productsObject = Object.assign(Object.assign({}, productsObject), { [product.cart_id]: product });
        });
        const { products, shippingIds, paymentId, userData, paymentInfo } = order, rest = __rest(order, ["products", "shippingIds", "paymentId", "userData", "paymentInfo"]);
        return this.post(Object.assign({ products: productsObject, shipping_ids: shippingIds, payment_id: paymentId, user_data: userData, payment_info: (0, forOwn_1.default)(paymentInfo, (value, key) => {
                delete paymentInfo[key];
                paymentInfo[(0, snakeCase_1.default)(key)] = value;
            }) }, rest));
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
exports.default = OrdersRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiT3JkZXJzUmVxdWVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvY3NjYXJ0L2FwaS1yZXF1ZXN0L09yZGVyc1JlcXVlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7OztBQUNBLDBDQUFrQztBQUNsQyxnREFBd0M7QUFHeEMsdURBQStDO0FBRS9DLE1BQXFCLGFBQWMsU0FBUSx5QkFBZTtJQU14RCxZQUFZLE1BQXFCLEVBQUUsTUFBYztRQUMvQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBTnZCLGVBQVUsR0FBVyxRQUFRLENBQUM7UUFDOUIsV0FBTSxHQUFXLE1BQU0sQ0FBQTtRQU1yQixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBRVMsUUFBUTtRQUNoQixJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDM0IsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXZFLE9BQU8sR0FBRyxDQUFBO0lBQ1osQ0FBQztJQUVNLEdBQUc7UUFDUixJQUFJLENBQUMsTUFBTSxtQ0FDTixJQUFJLENBQUMsTUFBTSxLQUNkLGVBQWUsRUFBRSxJQUFJLEVBQ3JCLHdCQUF3QixFQUFFLElBQUksR0FDL0IsQ0FBQTtRQUVELE9BQU8sS0FBSyxDQUFDLEdBQUcsRUFBRSxDQUFBO0lBQ3BCLENBQUM7SUFFTSxNQUFNLENBQUMsS0FBZ0I7UUFDNUIsSUFBSSxjQUFjLEdBQUcsRUFBRSxDQUFDO1FBRXhCLEtBQUssQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDLENBQUMsT0FBWSxFQUFFLEVBQUU7WUFDbEMsY0FBYyxtQ0FDVCxjQUFjLEtBQ2pCLENBQUMsT0FBTyxDQUFDLE9BQU8sQ0FBQyxFQUFFLE9BQU8sR0FDM0IsQ0FBQTtRQUNILENBQUMsQ0FBQyxDQUFBO1FBRUYsTUFBTSxFQUNKLFFBQVEsRUFDUixXQUFXLEVBQ1gsU0FBUyxFQUNULFFBQVEsRUFDUixXQUFXLEtBRVQsS0FBSyxFQURKLElBQUksVUFDTCxLQUFLLEVBUEgsbUVBT0wsQ0FBUSxDQUFDO1FBRVYsT0FBTyxJQUFJLENBQUMsSUFBSSxpQkFDZCxRQUFRLEVBQUUsY0FBYyxFQUN4QixZQUFZLEVBQUUsV0FBVyxFQUN6QixVQUFVLEVBQUUsU0FBUyxFQUNyQixTQUFTLEVBQUUsUUFBUSxFQUNuQixZQUFZLEVBQ1YsSUFBQSxnQkFBTSxFQUFDLFdBQVcsRUFBRSxDQUFDLEtBQUssRUFBRSxHQUFHLEVBQUUsRUFBRTtnQkFDakMsT0FBTyxXQUFXLENBQUMsR0FBRyxDQUFDLENBQUE7Z0JBRXZCLFdBQVcsQ0FBQyxJQUFBLG1CQUFTLEVBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxLQUFLLENBQUM7WUFDdEMsQ0FBQyxDQUFDLElBRUQsSUFBSSxFQUNQLENBQUE7SUFDSixDQUFDO0lBRVMsU0FBUztRQUNqQixJQUFJLENBQUMsTUFBTSxtQ0FDTixJQUFJLENBQUMsTUFBTSxLQUNkLFFBQVEsRUFBSSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFDaEMsRUFBRSxFQUFVLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxFQUNoQyxTQUFTLEVBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQ2pDLENBQUE7UUFFRCxJQUFJLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFO1lBQzlCLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxDQUFDO1NBQ2xEO1FBRUQsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssRUFBRTtZQUM1QixJQUFJLENBQUMsTUFBTSxDQUFDLFVBQVUsR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQztTQUNuRDtJQUNILENBQUM7Q0FDRjtBQWhGRCxnQ0FnRkMifQ==