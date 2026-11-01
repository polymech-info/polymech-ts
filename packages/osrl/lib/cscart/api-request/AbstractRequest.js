"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const qs_1 = require("qs");
class AbstractRequest {
    constructor(client, config) {
        this.config = config;
        this.client = client;
    }
    buildUrl() {
        const url = this.config.apiUrl + (this.prefix ? this.prefix : '') + this.entityPath + '/';
        console.log('url', url);
        return url;
    }
    setParams() {
    }
    get() {
        this.setParams();
        return this.client.get(this.buildUrl(), {
            params: Object.assign({}, this.params),
            paramsSerializer: (params) => {
                return (0, qs_1.stringify)(params);
            }
        });
    }
    post(data = {}) {
        this.setParams();
        return this.client.post(this.buildUrl(), data, {
            params: Object.assign({}, this.params),
            paramsSerializer: (params) => {
                return (0, qs_1.stringify)(params);
            }
        });
    }
    put(data = {}) {
        this.setParams();
        return this.client.put(this.buildUrl(), data, {
            params: Object.assign({}, this.params),
            paramsSerializer: (params) => {
                return (0, qs_1.stringify)(params);
            }
        });
    }
    delete() {
        this.setParams();
        return this.client.delete(this.buildUrl());
    }
    limit(limit) {
        this.params = Object.assign(Object.assign({}, this.params), { items_per_page: limit });
        return this;
    }
    page(page) {
        this.params = Object.assign(Object.assign({}, this.params), { page: page });
        return this;
    }
    byCompany(companyId) {
        if (!this.isMethodAllowed(['products'])) {
            throw new Error(`Can\'t get company for ${this.entityPath} entity`);
        }
        this.params = Object.assign(Object.assign({}, this.params), { company_id: companyId });
        return this;
    }
    withProducts() {
        if (!this.isMethodAllowed(['categories'])) {
            throw new Error(`Can\'t get company for ${this.entityPath} entity`);
        }
        return this;
    }
    one(id) {
        this.handlerParams.id = id;
        return this;
    }
    search(query) {
        this.handlerParams.search = query;
        return this;
    }
    asc() {
        this.handlerParams.order = 'asc';
        return this;
    }
    desc() {
        this.handlerParams.order = 'desc';
        return this;
    }
    orderBy(orderBy) {
        this.handlerParams.orderBy = orderBy;
        return this;
    }
    setIconSize(size) {
        if (!this.params.icon_sizes) {
            this.params.icon_sizes = {
                main_pair: [],
                image_pairs: []
            };
        }
        this.params.icon_sizes.main_pair.push(size);
        this.params.icon_sizes.image_pairs.push(size);
        return this;
    }
    isMethodAllowed(allowed) {
        return allowed.indexOf(this.entityPath) !== -1;
    }
}
exports.default = AbstractRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQWJzdHJhY3RSZXF1ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9jc2NhcnQvYXBpLXJlcXVlc3QvQWJzdHJhY3RSZXF1ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBQUEsMkJBQThCO0FBSzlCLE1BQThCLGVBQWU7SUFTM0MsWUFBc0IsTUFBcUIsRUFBRSxNQUFjO1FBQ3pELElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO1FBQ3JCLElBQUksQ0FBQyxNQUFNLEdBQUcsTUFBTSxDQUFDO0lBQ3ZCLENBQUM7SUFFUyxRQUFRO1FBQ2hCLE1BQU0sR0FBRyxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLFVBQVUsR0FBRyxHQUFHLENBQUM7UUFDMUYsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLEVBQUUsR0FBRyxDQUFDLENBQUM7UUFDeEIsT0FBTyxHQUFHLENBQUM7SUFDYixDQUFDO0lBRVMsU0FBUztJQUNuQixDQUFDO0lBRUQsR0FBRztRQUNELElBQUksQ0FBQyxTQUFTLEVBQUUsQ0FBQTtRQUVoQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUNwQixJQUFJLENBQUMsUUFBUSxFQUFFLEVBQ2Y7WUFDRSxNQUFNLG9CQUNELElBQUksQ0FBQyxNQUFNLENBQ2Y7WUFDRCxnQkFBZ0IsRUFBRSxDQUFDLE1BQVcsRUFBRSxFQUFFO2dCQUNoQyxPQUFPLElBQUEsY0FBUyxFQUFDLE1BQU0sQ0FBQyxDQUFBO1lBQzFCLENBQUM7U0FDRixDQUNGLENBQUE7SUFDSCxDQUFDO0lBRUQsSUFBSSxDQUFDLE9BQVksRUFBRTtRQUNqQixJQUFJLENBQUMsU0FBUyxFQUFFLENBQUE7UUFFaEIsT0FBTyxJQUFJLENBQUMs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