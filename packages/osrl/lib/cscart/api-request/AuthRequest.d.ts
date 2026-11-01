import Config from '../config/Config';
import AbstractRequest from './AbstractRequest';
import { AxiosInstance } from 'axios';
declare class AuthRequest extends AbstractRequest {
    entityPath: string;
    prefix: string;
    handlerParams: any;
    params: any;
    constructor(client: AxiosInstance, config: Config);
    login(email: string, password: string): Promise<import("axios").AxiosResponse<any>>;
    loginWithEkey(ekey: string): Promise<import("axios").AxiosResponse<any>>;
    socialLogin(provider: string, idToken: string, clientId: string): Promise<import("axios").AxiosResponse<any>>;
    restorePassword(email: string): Promise<import("axios").AxiosResponse<any>>;
}
export default AuthRequest;
