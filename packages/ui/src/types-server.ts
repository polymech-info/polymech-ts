export type FeedPostList = FeedPost[]

export interface FeedPost {
    id: string
    user_id: string
    title: string
    description?: string
    created_at: string
    updated_at: string
    settings: Settings
    meta: Meta
    pictures: Picture[]
    likes_count: number
    comments_count: number
    author: Author
}

export interface Settings {
    visibility: string
}

export interface Meta { }

export interface Picture {
    id: string
    meta: Meta2
    tags: any
    type: string
    flags: any[]
    title: string
    post_id: string
    user_id: string
    visible: boolean
    position: number
    image_url: string
    parent_id?: string
    created_at: string
    updated_at: string
    description?: string
    is_selected: boolean
    likes_count: number
    thumbnail_url?: string
    organization_id: any
    responsive: Responsive
    job?: Job
}

export interface Job {
    id: string
    status: string
    progress: number
    resultUrl?: string
    error?: any
}

export interface Meta2 {
    status?: string
    tracks?: Track[]
    duration?: number
    created_at?: string
    aspect_ratio?: string
    mux_asset_id?: string
    mux_upload_id?: string
    mux_playback_id?: string
    max_stored_frame_rate?: number
    max_stored_resolution?: string
}

export interface Track {
    id: string
    refs: number
    tags: Tags
    type: string
    index: number
    level: number
    width: number
    height: number
    pix_fmt: string
    profile: string
    bit_rate: number
    duration: number
    rotation?: number
    timecode: string
    codec_tag: string
    max_width: number
    nb_frames: number
    start_pts: number
    time_base: string
    codec_name: string
    codec_type: string
    max_height: number
    start_time: number
    coded_width: number
    color_range: string
    color_space: string
    disposition: Disposition
    duration_ts: number
    field_order: string
    coded_height: number
    has_b_frames: number
    max_bit_rate: string
    r_frame_rate: string
    avg_frame_rate: string
    color_transfer: string
    max_frame_rate: number
    nb_read_frames: string
    side_data_list?: SideDataList[]
    chroma_location: string
    codec_long_name: string
    codec_time_base: string
    color_primaries: string
    nb_read_packets: string
    codec_tag_string: string
    bits_per_raw_sample: any
    sample_aspect_ratio: string
    display_aspect_ratio: string
    is_avc?: string
    nal_length_size?: number
}

export interface Tags {
    rotate?: string
    language: string
    handler_name?: string
    creation_time?: string
    encoder?: string
}

export interface Disposition {
    dub: number
    forced: number
    lyrics: number
    comment: number
    default: number
    karaoke: number
    original: number
    attached_pic: number
    clean_effects: number
    visual_impaired: number
    hearing_impaired: number
    timed_thumbnails: number
}

export interface SideDataList {
    rotation: number
    displaymatrix: string
    side_data_type: string
}

export interface Responsive {
    img: Img
    sources: Source[]
}

export interface Img {
    src: string
    width: number
    height: number
    format: string
}

export interface Source {
    type: string
    srcset: string
}

export interface Author {
    user_id: string
    username: string
    display_name: string
}

export type EventType = 'category' | 'post' | 'page' | 'system' | string;

export interface AppEvent {
    type: EventType;
    kind: 'cache' | 'system' | 'chat' | 'other';
    action: 'create' | 'update' | 'delete';
    id?: string | null;
    data: any;
    timestamp: number;
}
