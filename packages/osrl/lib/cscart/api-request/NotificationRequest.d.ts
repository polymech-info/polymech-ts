import { AxiosInstance } from 'axios';
import Config from '../config/Config';
import AbstractRequest from './AbstractRequest';
export default class NotificationRequest extends AbstractRequest {
    entityPath: string;
    prefix: string;
    handlerParams: any;
    params: any;
    constructor(client: AxiosInstance, config: Config);
    /**
     * Mark user notifications as viewed
     *
     * @param lastNotificationDate - all notifications before specified time will be marked as viewed
     */
    markAsViewed(lastNotificationDate: string): Promise<import("axios").AxiosResponse<any>>;
    protected setParams(): void;
}
