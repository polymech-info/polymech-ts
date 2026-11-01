export interface Failure {
    success: 'OK';
}
export interface Success {
    failed: 'FAILED';
}
export type Response = Failure & Success;
export interface Action {
    can_act: boolean;
    id: number;
    count?: number;
    hidden?: boolean;
}
export interface Poster {
    description: string;
    extras: string;
    user_id: number;
}
export interface Person {
    avatar_template: string;
    id: number;
    username: string;
}
export interface Participant extends Person {
    post_count: number;
}
export interface Link {
    url: string;
    internal: boolean;
    reflection: boolean;
    title: string;
    clicks: number;
}
/**
 * Update a Topic Timestamp
 * https://docs.discourse.org/#tag/Topics/paths/~1t~1{id}~1change-timestamp/put
 */
export interface TopicUpdateTimestampRequest {
    timestamp: number;
}
export type TopicUpdateTimestampResponse = Response;
/**
 * Update a Post
 * https://docs.discourse.org/#tag/Posts/paths/~1posts~1{id}.json/put
 */
export interface PostUpdateResponse {
    post: PostUpdateItem;
}
export interface TopicUpdateBasicTopic {
    fancy_title: string;
    id: number;
    posts_count: number;
    slug: string;
    title: string;
}
export interface TopicUpdateResponse {
    basic_topic: TopicUpdateBasicTopic;
}
export interface PostUpdateItem {
    actions_summary: Array<Action>;
    admin: boolean;
    avatar_template: string;
    avg_time: object;
    can_delete: boolean;
    can_edit: boolean;
    can_recover: boolean;
    can_view_edit_history: boolean;
    can_wiki: boolean;
    cooked: string;
    created_at: string;
    deleted_at: object;
    display_username: string;
    draft_sequence: number;
    edit_reason: object;
    hidden_reason_id: object;
    hidden: boolean;
    id: number;
    incoming_link_count: number;
    moderator: boolean;
    name: string;
    post_number: number;
    post_type: number;
    primary_group_flair_bg_color: object;
    primary_group_flair_color: object;
    primary_group_flair_url: object;
    primary_group_name: object;
    quote_count: number;
    reads: number;
    reply_count: number;
    reply_to_post_number: object;
    score: number;
    staff: boolean;
    topic_id: number;
    topic_slug: string;
    trust_level: number;
    updated_at: string;
    user_deleted: boolean;
    user_id: number;
    user_title: object;
    username: string;
    version: number;
    wiki: boolean;
    yours: boolean;
}
export interface PostUpdateRequest {
    post: {
        raw: string;
        raw_old?: string;
        edit_reason?: string;
        cooked?: string;
    };
}
export interface TagsResponse {
    tags: Tag[];
    extras: TagsExtras;
}
export interface TagsExtras {
    categories: any[];
}
export interface Tag {
    count: number;
    description: null;
    id: string;
    name: string;
    pm_only: boolean;
    target_tag: null;
    text: string;
}
/** https://docs.discourse.org/#tag/Categories/paths/~1categories.json/get */
export interface CategoriesResponse {
    category_list: {
        can_create_category: boolean;
        can_create_topic: boolean;
        categories: Category[];
        draft_key: string;
        draft_sequence: number;
        draft: boolean;
    };
}
export interface Category {
    background_url: string;
    can_edit: boolean;
    color: string;
    description_excerpt: string;
    description_text: string;
    description: string;
    has_children: boolean;
    id: number;
    logo_url: string;
    name: string;
    notification_level: string;
    permission: number;
    position: number;
    post_count: number;
    read_restricted: boolean;
    slug: string;
    text_color: string;
    topic_count: number;
    topic_template: string;
    topic_url: string;
    topics_all_time: number;
    topics_day: number;
    topics_month: number;
    topics_week: number;
    topics_year: number;
}
/**
 * Get Single Topic
 * https://docs.discourse.org/#tag/Topics/paths/~1t~1{id}.json/get
 */
export interface TopicResponse {
    actions_summary: Array<Action>;
    archetype: string;
    archived: boolean;
    bookmarked: object;
    category_id: number;
    chunk_size: number;
    closed: boolean;
    created_at: string;
    deleted_at: object;
    deleted_by: object;
    details: TopicDetails;
    draft_key: string;
    draft_sequence: object;
    draft: object;
    fancy_title: string;
    has_summary: boolean;
    highest_post_number: number;
    id: number;
    last_posted_at: object;
    like_count: number;
    participant_count: number;
    pinned_at: string;
    pinned_globally: boolean;
    pinned_until: object;
    pinned: boolean;
    posts_count: number;
    reply_count: number;
    slug: string;
    tags: string[];
    title: string;
    unpinned: object;
    user_id: number;
    views: number;
    visible: boolean;
    word_count: object;
    post_stream: {
        posts: Array<PostItem>;
        stream: Array<object>;
    };
    timeline_lookup: [
        {
            '0': Array<object>;
        }
    ];
}
export interface TopicDetails {
    auto_close_at: object;
    auto_close_based_on_last_post: boolean;
    auto_close_hours: object;
    can_flag_topic: boolean;
    created_by: Person;
    last_poster: Person;
    notification_level: number;
    participants: Array<Participant>;
    suggested_topics: Array<TopicItem>;
}
export interface TopicItem {
    archetype: string;
    archived: boolean;
    bookmarked: object;
    bumped_at: string;
    bumped: boolean;
    category_id: number;
    closed: boolean;
    created_at: string;
    excerpt: string;
    fancy_title: string;
    has_summary: boolean;
    highest_post_number: number;
    id: number;
    image_url: string;
    last_posted_at: string;
    last_poster_username: string;
    like_count: number;
    liked: object;
    pinned_globally: boolean;
    pinned: boolean;
    posters: Array<Poster>;
    posts_count: number;
    reply_count: number;
    slug: string;
    title: string;
    unpinned: boolean;
    unseen: boolean;
    views: number;
    visible: boolean;
}
/**
 * Get Topics for Category
 * https://docs.discourse.org/#tag/Categories/paths/~1c~1{id}.json/get
 */
export interface CategoryResponse {
    users: Person[];
    topic_list: {
        can_create_topic: boolean;
        draft: boolean;
        draft_key: string;
        draft_sequence: number;
        per_page: number;
        topics: Array<TopicItem>;
    };
}
/**
 * Whole Post Information
 * As returned by getting a single Post
 * https://docs.discourse.org/#tag/Posts/paths/~1posts~1{id}.json/get
 */
export interface PostResponse {
    actions_summary: Array<Action>;
    admin: boolean;
    avatar_template: string;
    avg_time: object;
    can_delete: boolean;
    can_edit: boolean;
    can_recover: boolean;
    can_view_edit_history: boolean;
    can_wiki: boolean;
    cooked: string;
    created_at: string;
    deleted_at: object;
    display_username: string;
    edit_reason: object;
    hidden_reason_id: object;
    hidden: boolean;
    id: number;
    incoming_link_count: number;
    moderator: boolean;
    name: string;
    post_number: number;
    post_type: number;
    primary_group_flair_bg_color: object;
    primary_group_flair_color: object;
    primary_group_flair_url: object;
    primary_group_name: object;
    quote_count: number;
    raw: string;
    reads: number;
    reply_count: number;
    reply_to_post_number: object;
    score: number;
    staff: boolean;
    topic_id: number;
    topic_slug: string;
    trust_level: number;
    updated_at: string;
    user_deleted: boolean;
    user_id: number;
    user_title: object;
    username: string;
    version: number;
    wiki: boolean;
    yours: boolean;
}
export interface ICreateUserResponse {
    success: boolean;
    active: boolean;
    message: string;
    user_id: number;
    password: string;
}
/**
 * Get the Posts of a Topic
 * https://docs.discourse.org/#tag/Topics/paths/~1t~1{id}~1posts.json/get
 */
export interface PostsResponse {
    post_stream: {
        posts: Array<PostItem>;
    };
    id: number;
}
/**
 * Partial Post Information
 * As returned by a listing
 */
export interface PostItem {
    accepted_answer: boolean;
    actions_summary: Array<Action>;
    admin: boolean;
    avatar_template: string;
    can_accept_answer: boolean;
    can_delete: boolean;
    can_edit: boolean;
    can_recover: boolean;
    can_unaccept_answer: boolean;
    can_view_edit_history: boolean;
    can_wiki: boolean;
    cooked: string;
    created_at: string;
    deleted_at: null;
    display_username: string;
    edit_reason: null;
    hidden: boolean;
    id: number;
    incoming_link_count: number;
    link_counts: Array<Link>;
    moderator: boolean;
    name: string;
    post_number: number;
    post_type: number;
    primary_group_flair_bg_color: null | object;
    primary_group_flair_color: null | object;
    primary_group_flair_url: null | object;
    primary_group_name: null | object;
    quote_count: number;
    read: boolean;
    readers_count: number;
    reads: number;
    reply_count: number;
    reply_to_post_number: null | number;
    reviewable_id: number;
    reviewable_score_count: number;
    reviewable_score_pending_count: number;
    score: number;
    staff: boolean;
    topic_id: number;
    topic_slug: string;
    trust_level: number;
    updated_at: string;
    user_deleted: boolean;
    user_id: number;
    user_title: null | object;
    username: string;
    version: number;
    wiki: boolean;
    yours: boolean;
}
export type Thread = {
    topic: TopicResponse;
    post: PostItem;
    replies: PostItem[];
};
/** When finding and replacing, determine replacements using a method that matches this */
export type PostModifier = (post: PostResponse) => {
    result: string;
    reason?: string;
};
/** Configuration for Discourser */
export interface IDiscourserConfig {
    /** the discourse hostname to connect to, including protocol */
    host: string;
    /** the API key to connect with */
    key: string;
    /** the username to behave as */
    username: string;
    /** the cache directory to use, if we are caching */
    cache?: string;
    /** Whether or not we should read from the cache */
    useCache?: boolean;
    /** whether or not updates should be dry (non-applying) */
    dry?: boolean;
    /** how many concurrency requests to send to the server at once */
    rateLimitConcurrency?: number;
}
export interface FetchOptions {
    /** Whether or not we should read from the cache */
    useCache?: boolean;
    /** Only applicable to fetching topics of category */
    page?: number;
    /** Any thing to init the fetch call with? */
    request?: RequestInit;
    include_subcategories?: boolean;
}
export interface FetchConfig extends FetchOptions {
    url: string;
}
export interface PostConfig extends FetchOptions {
    url: string;
    data: any;
}
export interface ISearchPost {
    id: number;
    name: string;
    username: string;
    avatar_template: string;
    created_at: Date;
    like_count: number;
    blurb: string;
    post_number: number;
    topic_id: number;
}
export interface ISearchTagsDescriptions {
}
export interface ISearchTopic {
    id: number;
    title: string;
    fancy_title: string;
    slug: string;
    posts_count: number;
    reply_count: number;
    highest_post_number: number;
    created_at: Date;
    last_posted_at: Date;
    bumped: boolean;
    bumped_at: Date;
    archetype: string;
    unseen: boolean;
    pinned: boolean;
    unpinned?: any;
    excerpt: string;
    visible: boolean;
    closed: boolean;
    archived: boolean;
    bookmarked?: any;
    liked?: any;
    tags: any[];
    tags_descriptions: ISearchTagsDescriptions;
    category_id: number;
    has_accepted_answer: boolean;
}
export interface IGroupedSearchResult {
    more_posts?: any;
    more_users?: any;
    more_categories?: any;
    term: string;
    search_log_id: number;
    more_full_page_results?: any;
    can_create_topic: boolean;
    error?: any;
    post_ids: number[];
    user_ids: any[];
    category_ids: any[];
    tag_ids: any[];
    group_ids: any[];
}
export interface ISearchResult {
    posts: ISearchPost[];
    topics: ISearchTopic[];
    users: any[];
    categories: any[];
    tags: any[];
    groups: any[];
    grouped_search_result: IGroupedSearchResult;
}
export interface IUserDetail {
    id: number;
    username: string;
    name: string;
    avatar_template: string;
    email: string;
    secondary_emails: any[];
    active: boolean;
    admin: boolean;
    moderator: boolean;
    last_seen_at: string;
    last_emailed_at: string;
    created_at: string;
    last_seen_age: number;
    last_emailed_age: number;
    created_at_age: number;
    trust_level: number;
    manual_locked_trust_level: any;
    flag_level: number;
    title: string;
    time_read: number;
    staged: boolean;
    days_visited: number;
    posts_read_count: number;
    topics_entered: number;
    post_count: number;
    associated_accounts: AssociatedAccount[];
    can_send_activation_email: boolean;
    can_activate: boolean;
    can_deactivate: boolean;
    ip_address: string;
    registration_ip_address: string;
    can_grant_admin: boolean;
    can_revoke_admin: boolean;
    can_grant_moderation: boolean;
    can_revoke_moderation: boolean;
    can_impersonate: boolean;
    like_count: number;
    like_given_count: number;
    topic_count: number;
    post_edits_count: number;
    flags_given_count: number;
    flags_received_count: number;
    private_topics_count: number;
    can_delete_all_posts: boolean;
    can_be_deleted: boolean;
    can_be_anonymized: boolean;
    can_be_merged: boolean;
    full_suspend_reason: any;
    silence_reason: any;
    penalty_counts: PenaltyCounts;
    next_penalty: string;
    primary_group_id: any;
    badge_count: number;
    warnings_received_count: number;
    user_fields: UserFields;
    bounce_score: number;
    reset_bounce_score_after: any;
    can_view_action_logs: boolean;
    can_disable_second_factor: boolean;
    can_delete_sso_record: boolean;
    api_key_count: number;
    external_ids: ExternalIds;
    single_sign_on_record: any;
    approved_by: ApprovedBy;
    suspended_by: any;
    silenced_by: any;
    tl3_requirements: Tl3Requirements;
    groups: Group[];
}
export interface AssociatedAccount {
    name: string;
    description: string;
}
export interface PenaltyCounts {
    silenced: number;
    suspended: number;
}
export interface UserFields {
    "1": string;
    "2": string;
    "3": string;
    "4": string;
    "5": string;
}
export interface ExternalIds {
    google_oauth2: string;
}
export interface ApprovedBy {
    id: number;
    username: string;
    name: string;
    avatar_template: string;
}
export interface Tl3Requirements {
    time_period: number;
    requirements_met: boolean;
    requirements_lost: boolean;
    trust_level_locked: boolean;
    on_grace_period: boolean;
    days_visited: number;
    min_days_visited: number;
    num_topics_replied_to: number;
    min_topics_replied_to: number;
    topics_viewed: number;
    min_topics_viewed: number;
    posts_read: number;
    min_posts_read: number;
    topics_viewed_all_time: number;
    min_topics_viewed_all_time: number;
    posts_read_all_time: number;
    min_posts_read_all_time: number;
    num_flagged_posts: number;
    max_flagged_posts: number;
    num_flagged_by_users: number;
    max_flagged_by_users: number;
    num_likes_given: number;
    min_likes_given: number;
    num_likes_received: number;
    min_likes_received: number;
    num_likes_received_days: number;
    min_likes_received_days: number;
    num_likes_received_users: number;
    min_likes_received_users: number;
    penalty_counts: PenaltyCounts2;
}
export interface PenaltyCounts2 {
    silenced: number;
    suspended: number;
    total: number;
}
export interface Group {
    id: number;
    automatic: boolean;
    name: string;
    display_name?: string;
    user_count: number;
    mentionable_level: number;
    messageable_level: number;
    visibility_level: number;
    primary_group: boolean;
    title: any;
    grant_trust_level?: number;
    incoming_email: any;
    has_messages: boolean;
    flair_url: any;
    flair_bg_color?: string;
    flair_color?: string;
    bio_raw?: string;
    bio_cooked?: string;
    bio_excerpt?: string;
    public_admission: boolean;
    public_exit: boolean;
    allow_membership_requests: boolean;
    full_name?: string;
    default_notification_level: number;
    membership_request_template: any;
    members_visibility_level: number;
    can_see_members: boolean;
    can_admin_group: boolean;
    publish_read_state: boolean;
    can_edit_group?: boolean;
}
export type TPostStatus = 'visible' | 'archived' | 'pinned' | 'closed';
export interface TPostStatusUpdate {
    success: string;
    topic_status_update: any;
}
export interface UserPreferencesUpdate {
    bio_raw?: string;
    website?: string;
    location?: string;
    custom_fields?: CustomFields;
    timezone?: string;
    default_calendar?: string;
    profile_background_upload_url?: string;
    card_background_upload_url?: string;
}
export interface CustomFields {
    geo_location: GeoLocation;
}
export interface GeoLocation {
    lat: string;
    lon: string;
    address: string;
    countrycode: string;
    city: string;
    state: string;
    country: string;
    postalcode: string;
    boundingbox: string[];
    type: string;
}
