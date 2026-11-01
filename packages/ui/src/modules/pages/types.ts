
export interface Page {
    id: string;
    title: string;
    slug: string;
    content?: any;
    owner?: string;
    parent?: string | null;
    parent_page?: {
        title: string;
        slug: string;
    } | null;
    type?: string | null;
    tags?: string[] | null;
    is_public: boolean;
    visible: boolean;
    created_at?: string;
    updated_at: string;
    meta?: any;
    category_paths?: {
        id: string;
        name: string;
        slug: string;
    }[][];
    categories?: { // Legacy/fallback support
        id: string;
        name: string;
        slug: string;
    }[];
}

export interface UserProfile {
    id: string;
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
}
