import { AxiosInstance } from 'axios';
import Config from '../config/Config';
import AbstractRequest from './AbstractRequest';
export default class OrdersRequest extends AbstractRequest {
    entityPath: string;
    prefix: string;
    handlerParams: any;
    params: any;
    constructor(client: AxiosInstance, config: Config);
    protected buildUrl(): string;
    get(): Promise<import("axios").AxiosResponse<any>>;
    create(order: INewOrder): Promise<import("axios").AxiosResponse<any>>;
    protected setParams(): void;
}
interface INewOrder {
    products: Array<any>;
    shippingIds: Array<number>;
    paymentId: number;
    userData?: any;
    paymentInfo?: any;
    [others: string]: any;
}
export {};
