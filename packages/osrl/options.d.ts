import { IProfile } from '@plastichub/osr-commons';
import { IOptions } from './types';
export declare const parseProfile: (profilePath: string, profile: IProfile, options: IOptions, rel?: string) => IProfile;
export declare const parse: (options: IOptions, argv: any) => IOptions;
