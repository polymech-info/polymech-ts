"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const AbstractRequest_1 = require("./AbstractRequest");
class AuthRequest extends AbstractRequest_1.default {
    constructor(client, config) {
        super(client, config);
        this.entityPath = 'auth_tokens';
        // prefix: string      = 'sra_';
        this.prefix = '';
        this.handlerParams = {};
        this.params = {};
    }
    login(email, password) {
        return this.post({ email, password });
    }
    loginWithEkey(ekey) {
        return this.post({ ekey });
    }
    socialLogin(provider, idToken, clientId) {
        /**
         * Workaround for separated api endpoint
         */
        const backupEntityPath = this.entityPath;
        const backupPrefix = this.prefix;
        this.entityPath = 'social_auth';
        this.prefix = 'sra_';
        const request = this.post({ provider, token_id: idToken, client_id: clientId });
        this.entityPath = backupEntityPath;
        this.prefix = backupPrefix;
        return request;
    }
    restorePassword(email) {
        /**
         * Workaround for separated api endpoint
         */
        const backupEntityPath = this.entityPath;
        const backupPrefix = this.prefix;
        this.entityPath = 'recover_password';
        this.prefix = 'sra_';
        const request = this.post({ email });
        this.entityPath = backupEntityPath;
        this.prefix = backupPrefix;
        return request;
    }
}
exports.default = AuthRequest;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiQXV0aFJlcXVlc3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvbGliL2NzY2FydC9hcGktcmVxdWVzdC9BdXRoUmVxdWVzdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOztBQUNBLHVEQUErQztBQUcvQyxNQUFNLFdBQVksU0FBUSx5QkFBZTtJQU92QyxZQUFZLE1BQXFCLEVBQUUsTUFBYztRQUMvQyxLQUFLLENBQUMsTUFBTSxFQUFFLE1BQU0sQ0FBQyxDQUFBO1FBUHZCLGVBQVUsR0FBWSxhQUFhLENBQUM7UUFDcEMsZ0NBQWdDO1FBQ2hDLFdBQU0sR0FBVyxFQUFFLENBQUM7UUFNbEIsSUFBSSxDQUFDLGFBQWEsR0FBRyxFQUFFLENBQUM7UUFDeEIsSUFBSSxDQUFDLE1BQU0sR0FBRyxFQUFFLENBQUM7SUFDbkIsQ0FBQztJQUVELEtBQUssQ0FBQyxLQUFhLEVBQUUsUUFBZ0I7UUFDbkMsT0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsS0FBSyxFQUFFLFFBQVEsRUFBRSxDQUFDLENBQUE7SUFDdkMsQ0FBQztJQUVELGFBQWEsQ0FBQyxJQUFZO1FBQ3hCLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLElBQUksRUFBRSxDQUFDLENBQUE7SUFDNUIsQ0FBQztJQUVELFdBQVcsQ0FBQyxRQUFnQixFQUFFLE9BQWUsRUFBRSxRQUFnQjtRQUM3RDs7V0FFRztRQUNILE1BQU0sZ0JBQWdCLEdBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUMxQyxNQUFNLFlBQVksR0FBUSxJQUFJLENBQUMsTUFBTSxDQUFDO1FBRXRDLElBQUksQ0FBQyxVQUFVLEdBQUcsYUFBYSxDQUFDO1FBQ2hDLElBQUksQ0FBQyxNQUFNLEdBQU8sTUFBTSxDQUFDO1FBRXpCLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUMsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFLE9BQU8sRUFBRSxTQUFTLEVBQUUsUUFBUSxFQUFFLENBQUMsQ0FBQTtRQUUvRSxJQUFJLENBQUMsVUFBVSxHQUFHLGdCQUFnQixDQUFDO1FBQ25DLElBQUksQ0FBQyxNQUFNLEdBQU8sWUFBWSxDQUFDO1FBRS9CLE9BQU8sT0FBTyxDQUFBO0lBQ2hCLENBQUM7SUFFRCxlQUFlLENBQUMsS0FBYTtRQUMzQjs7V0FFRztRQUNILE1BQU0sZ0JBQWdCLEdBQUksSUFBSSxDQUFDLFVBQVUsQ0FBQztRQUMxQyxNQUFNLFlBQVksR0FBUSxJQUFJLENBQUMsTUFBTSxDQUFDO1FBRXRDLElBQUksQ0FBQyxVQUFVLEdBQUcsa0JBQWtCLENBQUM7UUFDckMsSUFBSSxDQUFDLE1BQU0sR0FBTyxNQUFNLENBQUM7UUFFekIsTUFBTSxPQUFPLEdBQUcsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUE7UUFFcEMsSUFBSSxDQUFDLFVBQVUsR0FBRyxnQkFBZ0IsQ0FBQztRQUNuQyxJQUFJLENBQUMsTUFBTSxHQUFPLFlBQVksQ0FBQztRQUUvQixPQUFPLE9BQU8sQ0FBQTtJQUNoQixDQUFDO0NBQ0Y7QUFFRCxrQkFBZSxXQUFXLENBQUEifQ==