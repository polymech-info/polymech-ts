import { AxiosInstance } from 'axios';
import Config from '../config/Config';
import AbstractRequest from './AbstractRequest';
export default class PagesRequest extends AbstractRequest {
    entityPath: string;
    prefix: string;
    handlerParams: any;
    params: any;
    constructor(client: AxiosInstance, config: Config);
    protected buildUrl(): string;
    forParentPage(parentId: number): this;
    protected setParams(): void;
}
