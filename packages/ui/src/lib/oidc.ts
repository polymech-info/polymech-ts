import { UserManager, WebStorageStateStore } from 'oidc-client-ts';

const authority = import.meta.env.VITE_ZITADEL_AUTHORITY as string;
const client_id = import.meta.env.VITE_ZITADEL_CLIENT_ID as string;

export const userManager = new UserManager({
    authority,
    client_id,
    redirect_uri: window.location.origin + '/authz',
    post_logout_redirect_uri: window.location.origin + '/',
    response_type: 'code',
    scope: 'openid profile email',
    loadUserInfo: true,
    userStore: new WebStorageStateStore({ store: window.localStorage }),
});
