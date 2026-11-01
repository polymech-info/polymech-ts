export interface IConvertedFileMeta {
    photoData: Blob;
    objectUrl: string;
    name: string;
    type: string;
}
export interface IUploadedFileMeta {
    downloadUrl: string;
    contentType?: string | null;
    fullPath: string;
    name: string;
    type: string;
    size: number;
    timeCreated: string;
    updated: string;
    data: any;
}
export type IModerationStatus = 'draft' | 'awaiting-moderation' | 'rejected' | 'accepted';
export interface IModerable {
    moderation: IModerationStatus;
    _createdBy?: string;
    _id?: string;
}
export type ISODateString = string;
export interface IUserState {
    user?: IUser;
}
export interface IUser {
    _authID: string;
    _lastActive?: ISODateString;
    userName: string;
    displayName: string;
    moderation: IModerationStatus;
    verified: boolean;
    badges?: IUserBadges;
    coverImages: IUploadedFileMeta[] | IConvertedFileMeta[];
    links: IExternalLink[];
    userRoles?: string[];
    about?: string | null;
    DHSite_id?: number;
    DHSite_mention_name?: string;
    country?: string | null;
    year?: ISODateString;
    stats?: IUserStats;
    /** keep a map of all howto ids that a user has voted as useful */
    votedUsefulHowtos?: {
        [howtoId: string]: boolean;
    };
    /** keep a map of all Research ids that a user has voted as useful */
    votedUsefulResearch?: {
        [researchId: string]: boolean;
    };
    notifications?: INotification[];
}
interface IUserBadges {
    verified: boolean;
}
interface IExternalLink {
    url: string;
    label: 'email' | 'website' | 'discord' | 'bazar' | 'forum' | 'social media' | 'facebook' | 'instagram' | 'github' | 'linkedin' | 'map' | 'forum' | 'marketplace' | 'other' | 'other-2';
}
/**
 * Track the ids and moderation status as summary for user stats
 */
interface IUserStats {
    userCreatedHowtos: {
        [id: string]: IModerationStatus;
    };
    userCreatedResearch: {
        [id: string]: IModerationStatus;
    };
    userCreatedEvents: {
        [id: string]: IModerationStatus;
    };
}
export type IUserDB = IUser;
export interface INotification {
    _id: string;
    _created: string;
    triggeredBy: {
        displayName: string;
        userId: string;
    };
    relevantUrl?: string;
    type: NotificationType;
    read: boolean;
}
export type NotificationType = 'new_comment' | 'howto_useful' | 'new_comment_research' | 'research_useful';
export type PlasticTypeLabel = 'pet' | 'hdpe' | 'pvc' | 'ldpe' | 'pp' | 'ps' | 'other';
export type MachineBuilderXpLabel = 'electronics' | 'machining' | 'welding' | 'assembling' | 'mould-making' | 'development';
export type WorkspaceType = 'shredder' | 'sheetpress' | 'extrusion' | 'injection' | 'mix' | 'machine shop' | 'service' | 'educational' | 'supplier' | '3dprint';
export type TOSR_User_Type = 'Precious Plastic' | 'OSR-Plastic' | 'Unknown' | 'User Contact' | 'Crawler' | 'Fablab' | 'OSE' | 'Meetup';
export interface IPlasticType {
    label: PlasticTypeLabel;
    number: string;
    imageSrc?: string;
}
export interface IProfileType {
    label: string;
    imageSrc?: string;
    cleanImageSrc?: string;
    cleanImageVerifiedSrc?: string;
    textLabel?: string;
}
export interface IWorkspaceType {
    label: WorkspaceType;
    imageSrc?: string;
    textLabel?: string;
    subText?: string;
}
export interface IMAchineBuilderXp {
    label: MachineBuilderXpLabel;
}
export interface IOpeningHours {
    day: string;
    openFrom: string;
    openTo: string;
}
/**
 * PP users can have a bunch of custom meta fields depending on profile type
 */
export interface IUserPP extends IUser {
    profileType: string;
    workspaceType?: WorkspaceType | null;
    mapPinDescription?: string | null;
    openingHours?: IOpeningHours[];
    collectedPlasticTypes?: PlasticTypeLabel[] | null;
    machineBuilderXp?: IMAchineBuilderXp[] | null;
    isExpert?: boolean | null;
    isV4Member?: boolean | null;
}
export type IUserPPDB = IUserPP;
export interface IGeoLocation {
    lng: number;
    lat: number;
}
export interface IOA_UserDetail {
    lastActive: Date;
    profilePicUrl: string;
    shortDescription: string;
    heroImageUrl: string;
    name: string;
    profileUrl: string;
}
export interface IGeo_Administrative {
    name: string;
    description: string;
    isoName: string;
    order: number;
    adminLevel: number;
    isoCode: string;
    wikidataId: string;
    geonameId: number;
}
export interface IGeo_Informative {
    name: string;
    description: string;
    order: number;
    isoCode: string;
    wikidataId: string;
    geonameId: number;
}
export interface IGeo_LocalityInfo {
    administrative: IGeo_Administrative[];
    informative: IGeo_Informative[];
}
export interface IGeo {
    latitude: number;
    longitude: number;
    continent: string;
    lookupSource: string;
    continentCode: string;
    localityLanguageRequested: string;
    city: string;
    countryName: string;
    postcode: string;
    countryCode: string;
    principalSubdivision: string;
    principalSubdivisionCode: string;
    plusCode: string;
    locality: string;
    localityInfo: IGeo_LocalityInfo;
}
export interface IUrl {
    name: string;
    url: string;
}
export interface IOA_Service {
    welding: boolean;
    assembling: boolean;
    machining: boolean;
    electronics: boolean;
    molds: boolean;
}
export interface IImage {
    url: string;
}
export interface IOSRUserData {
    urls: IUrl[];
    description: string;
    services: IOA_Service[];
    title: string;
    images: IImage[];
    jsError?: boolean;
}
export interface I_OSR_USER {
    _created: Date;
    location: IGeoLocation;
    _modified: Date;
    _id: string;
    detail: IOA_UserDetail;
    type: string;
    _deleted: boolean;
    moderation: string;
    geo: IGeo;
    data: IOSRUserData;
}
export interface I_USER_SHORT {
    name: string;
    email: string;
    bazar: string;
    web: string;
    social: string;
    censored: string;
    lastActive: Date;
    ig: string;
}
export type IProduct = {
    slug: string;
    name: string;
    category: string;
    code: string;
    forum?: string;
    forumCategory?: string;
    version?: string;
    cart_id?: string;
};
export interface IDiscourseUser {
    id: number;
    username: string;
    name: string;
    avatar_template: string;
    active: boolean;
    admin: boolean;
    moderator: boolean;
    last_seen_at: any;
    last_emailed_at: string;
    created_at: string;
    last_seen_age: any;
    last_emailed_age: number;
    created_at_age: number;
    trust_level: number;
    manual_locked_trust_level: any;
    flag_level: number;
    title: any;
    time_read: number;
    staged: boolean;
    days_visited: number;
    posts_read_count: number;
    topics_entered: number;
    post_count: number;
}
export * from './types_kbot.js';
export * from './types_common.js';
