"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractRequest_1 = require("./AbstractRequest");
class ProfileRequest extends AbstractRequest_1.default {
    constructor(client, config) {
        super(client, config);
        this.entityPath = 'profile';
        this.prefix = 'sra_';
        this.handlerParams = {};
        this.params = {};
    }
    buildUrl() {
        if (this.handlerParams.isProfileFields) {
            return this.config.apiUrl + 'sra_profile_fields/';
        }
        return super.buildUrl();
    }
    form() {
        this.handlerParams.form = true;
        return this;
    }
    forAddProfile() {
        if (!this.handlerParams.form) {
            throw new Error('Please specify form method first');
        }
        this.handlerParams.isProfileFields = true;
        this.params.location = 'profile';
        this.params.action = 'add';
        return this;
    }
    forUpdateProfile() {
        if (!this.handlerParams.form) {
            throw new Error('Please specify form method first');
        }
        this.handlerParams.isProfileFields = true;
        this.params.location = 'profile';
        this.params.action = 'update';
        return this;
    }
    forAddOrder() {
        if (!this.handlerParams.form) {
            throw new Error('Please specify form method first');
        }
        this.handlerParams.isProfileFields = true;
        this.params.location = 'checkout';
        this.params.action = 'add';
        return this;
    }
    forUpdateOrder() {
        if (!this.handlerParams.form) {
            throw new Error('Please specify form method first');
        }
        this.handlerParams.isProfileFields = true;
        this.params.location = 'checkout';
        this.params.action = 'update';
        return this;
    }
    update(profile) {
        return this.client.put(this.buildUrl() + '1', profile);
    }
    create(profile) {
        return this.post(profile);
    }
    setParams() {
        this.params = Object.assign(Object.assign({}, this.params), { language: this.config.language, sl: this.config.language, lang_code: this.config.language });
    }
}
exports.default = ProfileRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiUHJvZmlsZVJlcXVlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2NzY2FydC9hcGktcmVxdWVzdC9Qcm9maWxlUmVxdWVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUdBLHVEQUErQztBQUUvQyxNQUFxQixjQUFlLFNBQVEseUJBQWU7SUFNekQsWUFBWSxNQUFxQixFQUFFLE1BQWM7UUFDL0MsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtRQU52QixlQUFVLEdBQVcsU0FBUyxDQUFBO1FBQzlCLFdBQU0sR0FBVyxNQUFNLENBQUE7UUFNckIsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVTLFFBQVE7UUFDaEIsSUFBSSxJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsRUFBRTtZQUN0QyxPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLHFCQUFxQixDQUFBO1NBQ2xEO1FBRUQsT0FBTyxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUE7SUFDekIsQ0FBQztJQUVNLElBQUk7UUFDVCxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksR0FBRyxJQUFJLENBQUM7UUFFL0IsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRU0sYUFBYTtRQUNsQixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUU7WUFDNUIsTUFBTSxJQUFJLEtBQUssQ0FBQyxrQ0FBa0MsQ0FBQyxDQUFBO1NBQ3BEO1FBRUQsSUFBSSxDQUFDLGFBQWEsQ0FBQyxlQUFlLEdBQUcsSUFBSSxDQUFDO1FBQzFDLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUFJLFNBQVMsQ0FBQztRQUNsQyxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBTSxLQUFLLENBQUM7UUFFOUIsT0FBTyxJQUFJLENBQUE7SUFDYixDQUFDO0lBRU0sZ0JBQWdCO1FBQ3JCLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRTtZQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUE7U0FDcEQ7UUFFRCxJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7UUFDMUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUksU0FBUyxDQUFDO1FBQ2xDLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFNLFFBQVEsQ0FBQztRQUVqQyxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFTSxXQUFXO1FBQ2hCLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRTtZQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUE7U0FDcEQ7UUFFRCxJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7UUFDMUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUksVUFBVSxDQUFDO1FBQ25DLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFNLEtBQUssQ0FBQztRQUU5QixPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFTSxjQUFjO1FBQ25CLElBQUksQ0FBQyxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRTtZQUM1QixNQUFNLElBQUksS0FBSyxDQUFDLGtDQUFrQyxDQUFDLENBQUE7U0FDcEQ7UUFFRCxJQUFJLENBQUMsYUFBYSxDQUFDLGVBQWUsR0FBRyxJQUFJLENBQUM7UUFDMUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEdBQUksVUFBVSxDQUFDO1FBQ25DLElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFNLFFBQVEsQ0FBQztRQUVqQyxPQUFPLElBQUksQ0FBQTtJQUNiLENBQUM7SUFFRCxNQUFNLENBQUMsT0FBWTtRQUVqQixPQUFPLElBQUksQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUNwQixJQUFJLENBQUMsUUFBUSxFQUFFLEdBQUcsR0FBRyxFQUNyQixPQUFPLENBQ1IsQ0FBQTtJQUNILENBQUM7SUFFTSxNQUFNLENBQUMsT0FBWTtRQUV4QixPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLENBQUE7SUFDM0IsQ0FBQztJQUVTLFNBQVM7UUFDakIsSUFBSSxDQUFDLE1BQU0sbUNBQ04sSUFBSSxDQUFDLE1BQU0sS0FDZCxRQUFRLEVBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQ2hDLEVBQUUsRUFBVSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFDaEMsU0FBUyxFQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUNqQyxDQUFBO0lBQ0gsQ0FBQztDQUNGO0FBL0ZELGlDQStGQyJ9