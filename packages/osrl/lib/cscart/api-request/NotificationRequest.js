"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractRequest_1 = require("./AbstractRequest");
class NotificationRequest extends AbstractRequest_1.default {
    constructor(client, config) {
        super(client, config);
        this.entityPath = 'unviewed_notifications';
        this.prefix = 'sra_';
        this.handlerParams = {};
        this.params = {};
    }
    /**
     * Mark user notifications as viewed
     *
     * @param lastNotificationDate - all notifications before specified time will be marked as viewed
     */
    markAsViewed(lastNotificationDate) {
        return this.client.get(this.buildUrl() + 'mark_as_viewed', {
            params: Object.assign(Object.assign({}, this.params), { time: lastNotificationDate })
        });
    }
    setParams() {
        this.params = Object.assign(Object.assign({}, this.params), { language: this.config.language, sl: this.config.language, lang_code: this.config.language });
    }
}
exports.default = NotificationRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiTm90aWZpY2F0aW9uUmVxdWVzdC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9saWIvY3NjYXJ0L2FwaS1yZXF1ZXN0L05vdGlmaWNhdGlvblJlcXVlc3QudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFHQSx1REFBK0M7QUFFL0MsTUFBcUIsbUJBQW9CLFNBQVEseUJBQWU7SUFNOUQsWUFBWSxNQUFxQixFQUFFLE1BQWM7UUFDL0MsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLENBQUMsQ0FBQTtRQU52QixlQUFVLEdBQVcsd0JBQXdCLENBQUM7UUFDOUMsV0FBTSxHQUFXLE1BQU0sQ0FBQztRQU10QixJQUFJLENBQUMsYUFBYSxHQUFHLEVBQUUsQ0FBQztRQUN4QixJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztJQUNuQixDQUFDO0lBRUQ7Ozs7T0FJRztJQUNILFlBQVksQ0FBQyxvQkFBNEI7UUFDdkMsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEdBQUcsQ0FDcEIsSUFBSSxDQUFDLFFBQVEsRUFBRSxHQUFHLGdCQUFnQixFQUNsQztZQUNFLE1BQU0sa0NBQ0QsSUFBSSxDQUFDLE1BQU0sS0FDZCxJQUFJLEVBQUUsb0JBQW9CLEdBQzNCO1NBQ0YsQ0FDRixDQUFBO0lBQ0gsQ0FBQztJQUVTLFNBQVM7UUFDakIsSUFBSSxDQUFDLE1BQU0sbUNBQ04sSUFBSSxDQUFDLE1BQU0sS0FDZCxRQUFRLEVBQUksSUFBSSxDQUFDLE1BQU0sQ0FBQyxRQUFRLEVBQ2hDLEVBQUUsRUFBVSxJQUFJLENBQUMsTUFBTSxDQUFDLFFBQVEsRUFDaEMsU0FBUyxFQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsUUFBUSxHQUNqQyxDQUFBO0lBQ0gsQ0FBQztDQUNGO0FBckNELHNDQXFDQyJ9