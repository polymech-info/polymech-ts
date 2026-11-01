"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CsCartApiSdk = void 0;
const axios_1 = require("axios");
const js_base64_1 = require("js-base64");
const Config_1 = require("./config/Config");
const AuthRequest_1 = require("./api-request/AuthRequest");
const CartRequest_1 = require("./api-request/CartRequest");
const CategoriesRequest_1 = require("./api-request/CategoriesRequest");
const LayoutsRequest_1 = require("./api-request/LayoutsRequest");
const ProductsRequest_1 = require("./api-request/ProductsRequest");
const PagesRequest_1 = require("./api-request/PagesRequest");
const OrdersRequest_1 = require("./api-request/OrdersRequest");
const SettlementsRequest_1 = require("./api-request/SettlementsRequest");
const WishlistRequest_1 = require("./api-request/WishlistRequest");
const ProfileRequest_1 = require("./api-request/ProfileRequest");
const SettingsRequest_1 = require("./api-request/SettingsRequest");
const TestimonialsRequest_1 = require("./api-request/TestimonialsRequest");
const VendorsRequest_1 = require("./api-request/VendorsRequest");
const NotificationRequest_1 = require("./api-request/NotificationRequest");
class CsCartApiSdk {
    constructor(config) {
        this.config = new Config_1.default(config);
        this.client = axios_1.default.create({
            baseURL: this.config.apiUrl,
            timeout: this.config.timeout ? this.config.timeout : 8000,
            headers: {
                'Cache-Control': 'no-cache',
                'Storefront-Api-Access-Key': this.config.apiKey,
            },
        });
        this.client.interceptors.request.use(conf => {
            const newConf = Object.assign({}, conf);
            newConf.headers.common['Storefront-Api-Access-Key'] = this.config.apiKey;
            newConf.headers.common['Cache-Control'] = 'no-cache';
            newConf.params = Object.assign(Object.assign({}, newConf.params), { client: this.config.client });
            if (this.config.userToken) {
                // newConf.headers.common.Authorization = `Basic ${Base64.encode(this.config.userToken)}:`;
                newConf.headers.common.Authorization = `Basic ${js_base64_1.Base64.encode(this.config.username + ':' + this.config.apiKey)}`;
            }
            return newConf;
        });
    }
    get products() {
        return new ProductsRequest_1.default(this.client, this.config);
    }
    get pages() {
        return new PagesRequest_1.default(this.client, this.config);
    }
    get categories() {
        return new CategoriesRequest_1.default(this.client, this.config);
    }
    get auth() {
        return new AuthRequest_1.default(this.client, this.config);
    }
    get layouts() {
        return new LayoutsRequest_1.default(this.client, this.config);
    }
    get orders() {
        return new OrdersRequest_1.default(this.client, this.config);
    }
    get settlements() {
        return new SettlementsRequest_1.default(this.client, this.config);
    }
    get cart() {
        return new CartRequest_1.default(this.client, this.config);
    }
    get wishlist() {
        return new WishlistRequest_1.default(this.client, this.config);
    }
    get profile() {
        return new ProfileRequest_1.default(this.client, this.config);
    }
    get settings() {
        return new SettingsRequest_1.default(this.client, this.config);
    }
    get testimonials() {
        return new TestimonialsRequest_1.default(this.client, this.config);
    }
    get vendors() {
        return new VendorsRequest_1.default(this.client, this.config);
    }
    get notifications() {
        return new NotificationRequest_1.default(this.client, this.config);
    }
    getConfig() {
        return this.config;
    }
    getClient() {
        return this.client;
    }
    setLanguage(language) {
        this.config.language = language;
    }
    setClientId(id) {
        this.config.client = id;
    }
    setUserToken(token) {
        this.config.userToken = token;
    }
}
exports.CsCartApiSdk = CsCartApiSdk;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvbGliL2NzY2FydC9pbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSxpQ0FBeUI7QUFDekIseUNBQWtDO0FBR2xDLDRDQUFvQztBQUVwQywyREFBbUQ7QUFDbkQsMkRBQTBEO0FBQzFELHVFQUErRDtBQUMvRCxpRUFBeUQ7QUFDekQsbUVBQTJEO0FBQzNELDZEQUFxRDtBQUNyRCwrREFBdUQ7QUFDdkQseUVBQWlFO0FBQ2pFLG1FQUEyRDtBQUMzRCxpRUFBeUQ7QUFDekQsbUVBQTJEO0FBQzNELDJFQUFtRTtBQUNuRSxpRUFBeUQ7QUFDekQsMkVBQW1FO0FBRW5FLE1BQWEsWUFBWTtJQUl2QixZQUFZLE1BQWU7UUFDekIsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLGdCQUFNLENBQUMsTUFBTSxDQUFDLENBQUM7UUFDakMsSUFBSSxDQUFDLE1BQU0sR0FBRyxlQUFLLENBQUMsTUFBTSxDQUFDO1lBQ3pCLE9BQU8sRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU07WUFDM0IsT0FBTyxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxDQUFDLENBQUMsSUFBSTtZQUN6RCxPQUFPLEVBQUU7Z0JBQ1AsZUFBZSxFQUFFLFVBQVU7Z0JBQzNCLDJCQUEyQixFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTTthQUNoRDtTQUNGLENBQUMsQ0FBQztRQUVILElBQUksQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLE9BQU8sQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7WUFDMUMsTUFBTSxPQUFPLHFCQUFRLElBQUksQ0FBRSxDQUFDO1lBRTVCLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLDJCQUEyQixDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFN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