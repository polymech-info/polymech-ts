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
const querystring_1 = require("querystring");
const AbstractRequest_1 = require("./AbstractRequest");
class SettlementsRequest extends AbstractRequest_1.default {
    constructor(client, config) {
        super(client, config);
        this.entityPath = 'settlements';
        this.prefix = 'sra_';
        this.handlerParams = {};
        this.params = {};
    }
    buildUrl() {
        let url = super.buildUrl();
        url = url + (this.handlerParams.id ? `${this.handlerParams.id}/` : '');
        return url;
    }
    getForm(orderId) {
        this.entityPath = 'order_payment';
        this.setParams();
        return this.client.get(this.buildUrl() + orderId, {
            params: Object.assign({}, this.params),
            paramsSerializer: (params) => {
                return (0, querystring_1.stringify)(params);
            }
        });
    }
    hookUrl(url) {
        return this.client.get(url);
    }
    create(data) {
        const { orderId, repay } = data, rest = __rest(data, ["orderId", "repay"]);
        return this.post(Object.assign({ order_id: orderId, repay: typeof repay !== 'undefined' ? repay : false }, rest));
    }
    setParams() {
        this.params = Object.assign(Object.assign({}, this.params), { language: this.config.language, sl: this.config.language, lang_code: this.config.language });
    }
}
exports.default = SettlementsRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGxlbWVudHNSZXF1ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9jc2NhcnQvYXBpLXJlcXVlc3QvU2V0dGxlbWVudHNSZXF1ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7QUFDQSw2Q0FBdUM7QUFHdkMsdURBQStDO0FBRS9DLE1BQXFCLGtCQUFtQixTQUFRLHlCQUFlO0lBTTdELFlBQVksTUFBcUIsRUFBRSxNQUFjO1FBQy9DLEtBQUssQ0FBQyxNQUFNLEVBQUUsTUFBTSxDQUFDLENBQUE7UUFOdkIsZUFBVSxHQUFZLGFBQWEsQ0FBQztRQUNwQyxXQUFNLEdBQWdCLE1BQU0sQ0FBQztRQU0zQixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBRVMsUUFBUTtRQUNoQixJQUFJLEdBQUcsR0FBRyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDM0IsR0FBRyxHQUFHLEdBQUcsR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxDQUFDO1FBRXZFLE9BQU8sR0FBRyxDQUFBO0lBQ1osQ0FBQztJQUVELE9BQU8sQ0FBQyxPQUFlO1FBQ3JCLElBQUksQ0FBQyxVQUFVLEdBQVMsZUFBZSxDQUFDO1FBQ3hDLElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtRQUVoQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUNwQixJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsT0FBTyxFQUN6QjtZQUNFLE1BQU0sb0JBQ0QsSUFBSSxDQUFDLE1BQU0sQ0FDZjtZQUNELGdCQUFnQixFQUFFLENBQUMsTUFBVyxFQUFFLEVBQUU7Z0JBQ2hDLE9BQU8sSUFBQSx1QkFBUyxFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQzFCLENBQUM7U0FDRixDQUNGLENBQUE7SUFDSCxDQUFDO0lBRUQsT0FBTyxDQUFDLEdBQVc7UUFDakIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQTtJQUM3QixDQUFDO0lBRU0sTUFBTSxDQUFDLElBQW9CO1FBQ2hDLE1BQU0sRUFDSixPQUFPLEVBQ1AsS0FBSyxLQUVILElBQUksRUFESCxJQUFJLFVBQ0wsSUFBSSxFQUpGLG9CQUlMLENBQU8sQ0FBQztRQUVULE9BQU8sSUFBSSxDQUFDLElBQUksaUJBQ2QsUUFBUSxFQUFFLE9BQU8sRUFDakIsS0FBSyxFQUFFLE9BQU8sS0FBSyxLQUFLLFdBQVcsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLElBQ2hELElBQUksRUFDUCxDQUFBO0lBQ0osQ0FBQztJQUVTLFNBQVM7UUFDakIsSUFBSSxDQUFDLE1BQU0sbUNBQ04sSUFBSSxDQUFDLE1BQU0sS0FDZCxRQUFRLEVBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQ2hDLEVBQUUsRUFBVSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFDaEMsU0FBUyxFQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUNqQyxDQUFBO0lBQ0gsQ0FBQztDQUNGO0FBOURELHFDQThEQyJ9