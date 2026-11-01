import { AxiosInstance } from 'axios';
import Config from '../config/Config';
import AbstractRequest from './AbstractRequest';
export default class TestimonialsRequest extends AbstractRequest {
    entityPath: string;
    prefix: string;
    handlerParams: any;
    params: any;
    constructor(client: AxiosInstance, config: Config);
    forProduct(objectId: number): this;
    forCategory(objectId: number): this;
    forArticle(objectId: number): this;
    forOrder(objectId: number): this;
    forStorefront(objectId: number): this;
    forVendor(objectId: number): this;
    protected forItem(objectId: number, objectType: IObjectType): void;
    create(object_id: number, object_type: IObjectType, name: string, rating_value?: number, message?: string): Promise<import("axios").AxiosResponse<any>>;
    protected setParams(): void;
}
type IObjectType = 'P' | 'C' | 'A' | 'O' | 'E' | 'M';
export {};
