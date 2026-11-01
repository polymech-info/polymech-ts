import { AxiosInstance } from 'axios';
import Config from '../config/Config';
export default abstract class AbstractRequest {
    abstract entityPath: string;
    abstract prefix: string;
    protected requestUrl: string;
    protected config: Config;
    protected client: AxiosInstance;
    abstract handlerParams: any;
    abstract params: any;
    protected constructor(client: AxiosInstance, config: Config);
    protected buildUrl(): string;
    protected setParams(): void;
    get(): Promise<import("axios").AxiosResponse<any>>;
    post(data?: any): Promise<import("axios").AxiosResponse<any>>;
    put(data?: any): Promise<import("axios").AxiosResponse<any>>;
    delete(): Promise<import("axios").AxiosResponse<any>>;
    limit(limit: number): this;
    page(page: number): this;
    byCompany(companyId: number): this;
    withProducts(): this;
    one(id: number | string): this;
    search(query: string): this;
    asc(): this;
    desc(): this;
    orderBy(orderBy: string): this;
    setIconSize(size: [number, number]): this;
    private isMethodAllowed;
}
