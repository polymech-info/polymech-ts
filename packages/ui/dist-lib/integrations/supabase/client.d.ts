import { Database } from './types';
export declare const supabase: import('@supabase/supabase-js').SupabaseClient<Database, "public", "public", {
    Tables: {
        collection_pictures: {
            Row: {
                added_at: string;
                collection_id: string;
                id: string;
                picture_id: string;
            };
            Insert: {
                added_at?: string;
                collection_id: string;
                id?: string;
                picture_id: string;
            };
            Update: {
                added_at?: string;
                collection_id?: string;
                id?: string;
                picture_id?: string;
            };
            Relationships: [{
                foreignKeyName: "collection_pictures_collection_id_fkey";
                columns: ["collection_id"];
                isOneToOne: false;
                referencedRelation: "collections";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "collection_pictures_picture_id_fkey";
                columns: ["picture_id"];
                isOneToOne: false;
                referencedRelation: "pictures";
                referencedColumns: ["id"];
            }];
        };
        collection_posts: {
            Row: {
                collection_id: string;
                created_at: string;
                id: string;
                post_id: string;
            };
            Insert: {
                collection_id: string;
                created_at?: string;
                id?: string;
                post_id: string;
            };
            Update: {
                collection_id?: string;
                created_at?: string;
                id?: string;
                post_id?: string;
            };
            Relationships: [{
                foreignKeyName: "collection_posts_collection_id_fkey";
                columns: ["collection_id"];
                isOneToOne: false;
                referencedRelation: "collections";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "collection_posts_post_id_fkey";
                columns: ["post_id"];
                isOneToOne: false;
                referencedRelation: "posts";
                referencedColumns: ["id"];
            }];
        };
        collections: {
            Row: {
                content: import('./types').Json | null;
                created_at: string;
                description: string | null;
                id: string;
                is_public: boolean;
                layout: import('./types').Json | null;
                name: string;
                slug: string;
                updated_at: string;
                user_id: string;
            };
            Insert: {
                content?: import('./types').Json | null;
                created_at?: string;
                description?: string | null;
                id?: string;
                is_public?: boolean;
                layout?: import('./types').Json | null;
                name: string;
                slug: string;
                updated_at?: string;
                user_id: string;
            };
            Update: {
                content?: import('./types').Json | null;
                created_at?: string;
                description?: string | null;
                id?: string;
                is_public?: boolean;
                layout?: import('./types').Json | null;
                name?: string;
                slug?: string;
                updated_at?: string;
                user_id?: string;
            };
            Relationships: [];
        };
        comment_likes: {
            Row: {
                comment_id: string;
                created_at: string;
                id: string;
                user_id: string;
            };
            Insert: {
                comment_id: string;
                created_at?: string;
                id?: string;
                user_id: string;
            };
            Update: {
                comment_id?: string;
                created_at?: string;
                id?: string;
                user_id?: string;
            };
            Relationships: [];
        };
        comments: {
            Row: {
                content: string;
                created_at: string;
                id: string;
                likes_count: number | null;
                parent_comment_id: string | null;
                picture_id: string;
                updated_at: string;
                user_id: string;
            };
            Insert: {
                content: string;
                created_at?: string;
                id?: string;
                likes_count?: number | null;
                parent_comment_id?: string | null;
                picture_id: string;
                updated_at?: string;
                user_id: string;
            };
            Update: {
                content?: string;
                created_at?: string;
                id?: string;
                likes_count?: number | null;
                parent_comment_id?: string | null;
                picture_id?: string;
                updated_at?: string;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "comments_parent_fk";
                columns: ["parent_comment_id"];
                isOneToOne: false;
                referencedRelation: "comments";
                referencedColumns: ["id"];
            }];
        };
        context_definitions: {
            Row: {
                created_at: string | null;
                default_filters: import('./types').Json;
                default_templates: import('./types').Json;
                description: string | null;
                display_name: string;
                icon: string | null;
                id: string;
                is_active: boolean | null;
                name: string;
                updated_at: string | null;
            };
            Insert: {
                created_at?: string | null;
                default_filters?: import('./types').Json;
                default_templates?: import('./types').Json;
                description?: string | null;
                display_name: string;
                icon?: string | null;
                id?: string;
                is_active?: boolean | null;
                name: string;
                updated_at?: string | null;
            };
            Update: {
                created_at?: string | null;
                default_filters?: import('./types').Json;
                default_templates?: import('./types').Json;
                description?: string | null;
                display_name?: string;
                icon?: string | null;
                id?: string;
                is_active?: boolean | null;
                name?: string;
                updated_at?: string | null;
            };
            Relationships: [];
        };
        filter_usage_logs: {
            Row: {
                context: string;
                created_at: string | null;
                error_message: string | null;
                filters_applied: string[] | null;
                id: string;
                input_length: number;
                model: string;
                output_length: number;
                processing_time_ms: number;
                provider: string;
                success: boolean;
                template_id: string | null;
                user_id: string | null;
            };
            Insert: {
                context: string;
                created_at?: string | null;
                error_message?: string | null;
                filters_applied?: string[] | null;
                id?: string;
                input_length: number;
                model: string;
                output_length: number;
                processing_time_ms: number;
                provider: string;
                success: boolean;
                template_id?: string | null;
                user_id?: string | null;
            };
            Update: {
                context?: string;
                created_at?: string | null;
                error_message?: string | null;
                filters_applied?: string[] | null;
                id?: string;
                input_length?: number;
                model?: string;
                output_length?: number;
                processing_time_ms?: number;
                provider?: string;
                success?: boolean;
                template_id?: string | null;
                user_id?: string | null;
            };
            Relationships: [{
                foreignKeyName: "filter_usage_logs_template_id_fkey";
                columns: ["template_id"];
                isOneToOne: false;
                referencedRelation: "user_templates";
                referencedColumns: ["id"];
            }];
        };
        likes: {
            Row: {
                created_at: string;
                id: string;
                picture_id: string;
                user_id: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                picture_id: string;
                user_id: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                picture_id?: string;
                user_id?: string;
            };
            Relationships: [];
        };
        organizations: {
            Row: {
                created_at: string;
                id: string;
                name: string;
                slug: string;
                updated_at: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                name: string;
                slug: string;
                updated_at?: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                name?: string;
                slug?: string;
                updated_at?: string;
            };
            Relationships: [];
        };
        page_collaborators: {
            Row: {
                created_at: string;
                id: string;
                page_id: string;
                role: Database["public"]["Enums"]["collaborator_role"];
                user_id: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                page_id: string;
                role?: Database["public"]["Enums"]["collaborator_role"];
                user_id: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                page_id?: string;
                role?: Database["public"]["Enums"]["collaborator_role"];
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "page_collaborators_page_id_fkey";
                columns: ["page_id"];
                isOneToOne: false;
                referencedRelation: "pages";
                referencedColumns: ["id"];
            }];
        };
        pages: {
            Row: {
                content: import('./types').Json | null;
                created_at: string;
                id: string;
                is_public: boolean;
                owner: string;
                parent: string | null;
                slug: string;
                tags: string[] | null;
                title: string;
                type: string | null;
                updated_at: string;
                visible: boolean;
            };
            Insert: {
                content?: import('./types').Json | null;
                created_at?: string;
                id?: string;
                is_public?: boolean;
                owner: string;
                parent?: string | null;
                slug: string;
                tags?: string[] | null;
                title: string;
                type?: string | null;
                updated_at?: string;
                visible?: boolean;
            };
            Update: {
                content?: import('./types').Json | null;
                created_at?: string;
                id?: string;
                is_public?: boolean;
                owner?: string;
                parent?: string | null;
                slug?: string;
                tags?: string[] | null;
                title?: string;
                type?: string | null;
                updated_at?: string;
                visible?: boolean;
            };
            Relationships: [{
                foreignKeyName: "pages_parent_fkey";
                columns: ["parent"];
                isOneToOne: false;
                referencedRelation: "pages";
                referencedColumns: ["id"];
            }];
        };
        pictures: {
            Row: {
                created_at: string;
                description: string | null;
                flags: string[] | null;
                id: string;
                image_url: string;
                is_selected: boolean;
                likes_count: number | null;
                meta: import('./types').Json | null;
                organization_id: string | null;
                parent_id: string | null;
                position: number | null;
                post_id: string | null;
                tags: string[] | null;
                thumbnail_url: string | null;
                title: string;
                type: string | null;
                updated_at: string;
                user_id: string;
                visible: boolean;
            };
            Insert: {
                created_at?: string;
                description?: string | null;
                flags?: string[] | null;
                id?: string;
                image_url: string;
                is_selected?: boolean;
                likes_count?: number | null;
                meta?: import('./types').Json | null;
                organization_id?: string | null;
                parent_id?: string | null;
                position?: number | null;
                post_id?: string | null;
                tags?: string[] | null;
                thumbnail_url?: string | null;
                title: string;
                type?: string | null;
                updated_at?: string;
                user_id: string;
                visible?: boolean;
            };
            Update: {
                created_at?: string;
                description?: string | null;
                flags?: string[] | null;
                id?: string;
                image_url?: string;
                is_selected?: boolean;
                likes_count?: number | null;
                meta?: import('./types').Json | null;
                organization_id?: string | null;
                parent_id?: string | null;
                position?: number | null;
                post_id?: string | null;
                tags?: string[] | null;
                thumbnail_url?: string | null;
                title?: string;
                type?: string | null;
                updated_at?: string;
                user_id?: string;
                visible?: boolean;
            };
            Relationships: [{
                foreignKeyName: "pictures_organization_id_fkey";
                columns: ["organization_id"];
                isOneToOne: false;
                referencedRelation: "organizations";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pictures_parent_id_fkey";
                columns: ["parent_id"];
                isOneToOne: false;
                referencedRelation: "pictures";
                referencedColumns: ["id"];
            }, {
                foreignKeyName: "pictures_post_id_fkey";
                columns: ["post_id"];
                isOneToOne: false;
                referencedRelation: "posts";
                referencedColumns: ["id"];
            }];
        };
        posts: {
            Row: {
                created_at: string | null;
                description: string | null;
                id: string;
                meta: import('./types').Json | null;
                settings: import('./types').Json | null;
                title: string;
                updated_at: string | null;
                user_id: string;
            };
            Insert: {
                created_at?: string | null;
                description?: string | null;
                id?: string;
                meta?: import('./types').Json | null;
                settings?: import('./types').Json | null;
                title: string;
                updated_at?: string | null;
                user_id: string;
            };
            Update: {
                created_at?: string | null;
                description?: string | null;
                id?: string;
                meta?: import('./types').Json | null;
                settings?: import('./types').Json | null;
                title?: string;
                updated_at?: string | null;
                user_id?: string;
            };
            Relationships: [];
        };
        profiles: {
            Row: {
                aimlapi_api_key: string | null;
                avatar_url: string | null;
                bio: string | null;
                bria_api_key: string | null;
                created_at: string;
                display_name: string | null;
                google_api_key: string | null;
                huggingface_api_key: string | null;
                id: string;
                openai_api_key: string | null;
                pages: import('./types').Json | null;
                replicate_api_key: string | null;
                settings: import('./types').Json | null;
                updated_at: string;
                user_id: string;
                username: string | null;
            };
            Insert: {
                aimlapi_api_key?: string | null;
                avatar_url?: string | null;
                bio?: string | null;
                bria_api_key?: string | null;
                created_at?: string;
                display_name?: string | null;
                google_api_key?: string | null;
                huggingface_api_key?: string | null;
                id?: string;
                openai_api_key?: string | null;
                pages?: import('./types').Json | null;
                replicate_api_key?: string | null;
                settings?: import('./types').Json | null;
                updated_at?: string;
                user_id: string;
                username?: string | null;
            };
            Update: {
                aimlapi_api_key?: string | null;
                avatar_url?: string | null;
                bio?: string | null;
                bria_api_key?: string | null;
                created_at?: string;
                display_name?: string | null;
                google_api_key?: string | null;
                huggingface_api_key?: string | null;
                id?: string;
                openai_api_key?: string | null;
                pages?: import('./types').Json | null;
                replicate_api_key?: string | null;
                settings?: import('./types').Json | null;
                updated_at?: string;
                user_id?: string;
                username?: string | null;
            };
            Relationships: [];
        };
        provider_configs: {
            Row: {
                base_url: string;
                created_at: string | null;
                display_name: string;
                id: string;
                is_active: boolean | null;
                models: import('./types').Json;
                name: string;
                rate_limits: import('./types').Json | null;
                settings: import('./types').Json | null;
                updated_at: string | null;
                user_id: string | null;
            };
            Insert: {
                base_url: string;
                created_at?: string | null;
                display_name: string;
                id?: string;
                is_active?: boolean | null;
                models?: import('./types').Json;
                name: string;
                rate_limits?: import('./types').Json | null;
                settings?: import('./types').Json | null;
                updated_at?: string | null;
                user_id?: string | null;
            };
            Update: {
                base_url?: string;
                created_at?: string | null;
                display_name?: string;
                id?: string;
                is_active?: boolean | null;
                models?: import('./types').Json;
                name?: string;
                rate_limits?: import('./types').Json | null;
                settings?: import('./types').Json | null;
                updated_at?: string | null;
                user_id?: string | null;
            };
            Relationships: [];
        };
        role_permissions: {
            Row: {
                created_at: string;
                id: string;
                permission: Database["public"]["Enums"]["app_permission"];
                role: Database["public"]["Enums"]["app_role"];
            };
            Insert: {
                created_at?: string;
                id?: string;
                permission: Database["public"]["Enums"]["app_permission"];
                role: Database["public"]["Enums"]["app_role"];
            };
            Update: {
                created_at?: string;
                id?: string;
                permission?: Database["public"]["Enums"]["app_permission"];
                role?: Database["public"]["Enums"]["app_role"];
            };
            Relationships: [];
        };
        user_filter_configs: {
            Row: {
                context: string;
                created_at: string | null;
                custom_filters: import('./types').Json | null;
                default_templates: string[] | null;
                id: string;
                is_default: boolean | null;
                model: string;
                provider: string;
                updated_at: string | null;
                user_id: string | null;
                variables: import('./types').Json | null;
            };
            Insert: {
                context: string;
                created_at?: string | null;
                custom_filters?: import('./types').Json | null;
                default_templates?: string[] | null;
                id?: string;
                is_default?: boolean | null;
                model?: string;
                provider?: string;
                updated_at?: string | null;
                user_id?: string | null;
                variables?: import('./types').Json | null;
            };
            Update: {
                context?: string;
                created_at?: string | null;
                custom_filters?: import('./types').Json | null;
                default_templates?: string[] | null;
                id?: string;
                is_default?: boolean | null;
                model?: string;
                provider?: string;
                updated_at?: string | null;
                user_id?: string | null;
                variables?: import('./types').Json | null;
            };
            Relationships: [];
        };
        user_organizations: {
            Row: {
                created_at: string;
                id: string;
                organization_id: string;
                role: string;
                updated_at: string;
                user_id: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                organization_id: string;
                role?: string;
                updated_at?: string;
                user_id: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                organization_id?: string;
                role?: string;
                updated_at?: string;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "user_organizations_organization_id_fkey";
                columns: ["organization_id"];
                isOneToOne: false;
                referencedRelation: "organizations";
                referencedColumns: ["id"];
            }];
        };
        user_roles: {
            Row: {
                created_at: string;
                id: string;
                organization_id: string | null;
                role: Database["public"]["Enums"]["app_role"];
                updated_at: string;
                user_id: string;
            };
            Insert: {
                created_at?: string;
                id?: string;
                organization_id?: string | null;
                role: Database["public"]["Enums"]["app_role"];
                updated_at?: string;
                user_id: string;
            };
            Update: {
                created_at?: string;
                id?: string;
                organization_id?: string | null;
                role?: Database["public"]["Enums"]["app_role"];
                updated_at?: string;
                user_id?: string;
            };
            Relationships: [{
                foreignKeyName: "user_roles_user_id_fkey";
                columns: ["user_id"];
                isOneToOne: false;
                referencedRelation: "profiles";
                referencedColumns: ["user_id"];
            }];
        };
        user_secrets: {
            Row: {
                aimlapi_api_key: string | null;
                bria_api_key: string | null;
                created_at: string;
                google_api_key: string | null;
                huggingface_api_key: string | null;
                is_admin: boolean | null;
                openai_api_key: string | null;
                replicate_api_key: string | null;
                settings: import('./types').Json | null;
                updated_at: string;
                user_id: string;
            };
            Insert: {
                aimlapi_api_key?: string | null;
                bria_api_key?: string | null;
                created_at?: string;
                google_api_key?: string | null;
                huggingface_api_key?: string | null;
                is_admin?: boolean | null;
                openai_api_key?: string | null;
                replicate_api_key?: string | null;
                settings?: import('./types').Json | null;
                updated_at?: string;
                user_id: string;
            };
            Update: {
                aimlapi_api_key?: string | null;
                bria_api_key?: string | null;
                created_at?: string;
                google_api_key?: string | null;
                huggingface_api_key?: string | null;
                is_admin?: boolean | null;
                openai_api_key?: string | null;
                replicate_api_key?: string | null;
                settings?: import('./types').Json | null;
                updated_at?: string;
                user_id?: string;
            };
            Relationships: [];
        };
        user_templates: {
            Row: {
                context: string;
                created_at: string | null;
                description: string | null;
                filters: string[] | null;
                format: string | null;
                id: string;
                is_public: boolean | null;
                model: string;
                name: string;
                prompt: string;
                provider: string;
                updated_at: string | null;
                usage_count: number | null;
                user_id: string | null;
            };
            Insert: {
                context: string;
                created_at?: string | null;
                description?: string | null;
                filters?: string[] | null;
                format?: string | null;
                id?: string;
                is_public?: boolean | null;
                model?: string;
                name: string;
                prompt: string;
                provider?: string;
                updated_at?: string | null;
                usage_count?: number | null;
                user_id?: string | null;
            };
            Update: {
                context?: string;
                created_at?: string | null;
                description?: string | null;
                filters?: string[] | null;
                format?: string | null;
                id?: string;
                is_public?: boolean | null;
                model?: string;
                name?: string;
                prompt?: string;
                provider?: string;
                updated_at?: string | null;
                usage_count?: number | null;
                user_id?: string | null;
            };
            Relationships: [];
        };
        wizard_sessions: {
            Row: {
                created_at: string;
                generated_image_url: string | null;
                id: string;
                input_images: string[] | null;
                prompt: string;
                status: string;
                updated_at: string;
                user_id: string;
            };
            Insert: {
                created_at?: string;
                generated_image_url?: string | null;
                id?: string;
                input_images?: string[] | null;
                prompt?: string;
                status?: string;
                updated_at?: string;
                user_id: string;
            };
            Update: {
                created_at?: string;
                generated_image_url?: string | null;
                id?: string;
                input_images?: string[] | null;
                prompt?: string;
                status?: string;
                updated_at?: string;
                user_id?: string;
            };
            Relationships: [];
        };
    };
    Views: { [_ in never]: never; };
    Functions: {
        authorize: {
            Args: {
                _role: Database["public"]["Enums"]["app_role"];
                _user_id: string;
            };
            Returns: boolean;
        };
        has_permission: {
            Args: {
                _permission: Database["public"]["Enums"]["app_permission"];
                _user_id: string;
            };
            Returns: boolean;
        };
        is_page_collaborator: {
            Args: {
                _page_id: string;
            };
            Returns: boolean;
        };
        is_page_owner: {
            Args: {
                _page_id: string;
            };
            Returns: boolean;
        };
    };
    Enums: {
        app_permission: "pictures.read" | "pictures.create" | "pictures.update" | "pictures.delete" | "collections.read" | "collections.create" | "collections.update" | "collections.delete" | "comments.read" | "comments.create" | "comments.update" | "comments.delete" | "organization.manage";
        app_role: "owner" | "admin" | "member" | "viewer";
        collaborator_role: "viewer" | "editor" | "owner";
    };
    CompositeTypes: { [_ in never]: never; };
}, {
    PostgrestVersion: "13.0.5";
}>;
