import { AxiosInstance } from 'axios';
import Config from '../config/Config';
import AbstractRequest from './AbstractRequest';
export default class SettlementsRequest extends AbstractRequest {
    entityPath: string;
    prefix: string;
    handlerParams: any;
    params: any;
    constructor(client: AxiosInstance, config: Config);
    protected buildUrl(): string;
    getForm(orderId: number): Promise<import("axios").AxiosResponse<any>>;
    hookUrl(url: string): Promise<import("axios").AxiosResponse<any>>;
    create(data: INewSettlement): Promise<import("axios").AxiosResponse<any>>;
    protected setParams(): void;
}
interface INewSettlement {
    orderId: number;
    repay?: boolean;
    [others: string]: any;
}
export {};
