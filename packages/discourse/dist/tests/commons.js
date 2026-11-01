process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = '0';
import { Discourser } from '../src/lib/discourse/index.js';
export const getDiscourseConfig = () => {
    return {
        host: process.env.DISCOURSE_HOST || 'https://forum.polymech.info',
        key: process.env.DISCOURSE_API_KEY || 'e8b4adf4770b85cf94ea5e0aacb517ad25ddeb338efa3946559c06c2cdbab2e8',
        username: process.env.DISCOURSE_USERNAME || 'jerom',
        rateLimitConcurrency: 1
    };
};
export const getClient = () => {
    const config = getDiscourseConfig();
    return new Discourser(config);
};
//# sourceMappingURL=commons.js.map