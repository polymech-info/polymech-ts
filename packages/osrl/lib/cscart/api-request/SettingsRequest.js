"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractRequest_1 = require("./AbstractRequest");
class SettingsRequest extends AbstractRequest_1.default {
    constructor(client, config) {
        super(client, config);
        this.entityPath = 'storefront';
        this.prefix = 'sra_';
        this.handlerParams = {};
        this.params = {};
    }
    setParams() {
        this.params = Object.assign(Object.assign({}, this.params), { language: this.config.language, sl: this.config.language, lang_code: this.config.language });
    }
}
exports.default = SettingsRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiU2V0dGluZ3NSZXF1ZXN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2xpYi9jc2NhcnQvYXBpLXJlcXVlc3QvU2V0dGluZ3NSZXF1ZXN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7O0FBR0EsdURBQStDO0FBRS9DLE1BQXFCLGVBQWdCLFNBQVEseUJBQWU7SUFNMUQsWUFBWSxNQUFxQixFQUFFLE1BQWM7UUFDL0MsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtRQU52QixlQUFVLEdBQVcsWUFBWSxDQUFBO1FBQ2pDLFdBQU0sR0FBVyxNQUFNLENBQUE7UUFNckIsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVTLFNBQVM7UUFDakIsSUFBSSxDQUFDLE1BQU0sbUNBQ04sSUFBSSxDQUFDLE1BQU0sS0FDZCxRQUFRLEVBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQ2hDLEVBQUUsRUFBVSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFDaEMsU0FBUyxFQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUNqQyxDQUFBO0lBQ0gsQ0FBQztDQUNGO0FBcEJELGtDQW9CQyJ9