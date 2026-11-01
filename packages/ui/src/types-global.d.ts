import { FeedPost } from './types-server';

declare global {
    interface Window {
        __INITIAL_STATE__?: {
            feed?: FeedPost[];
            profile?: any; // We can strictly type this later if needed
            post?: any;
            siteHomePage?: any;
        };
    }
}

export { };
