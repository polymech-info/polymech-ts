export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          owner_id: string | null
          slug: string
          updated_at: string
          visibility: Database["public"]["Enums"]["category_visibility"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_id?: string | null
          slug: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["category_visibility"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          slug?: string
          updated_at?: string
          visibility?: Database["public"]["Enums"]["category_visibility"]
        }
        Relationships: []
      }
      category_relations: {
        Row: {
          child_category_id: string
          created_at: string
          parent_category_id: string
          relation_type: Database["public"]["Enums"]["category_relation_type"]
        }
        Insert: {
          child_category_id: string
          created_at?: string
          parent_category_id: string
          relation_type: Database["public"]["Enums"]["category_relation_type"]
        }
        Update: {
          child_category_id?: string
          created_at?: string
          parent_category_id?: string
          relation_type?: Database["public"]["Enums"]["category_relation_type"]
        }
        Relationships: [
          {
            foreignKeyName: "category_relations_child_category_id_fkey"
            columns: ["child_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "category_relations_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_pictures: {
        Row: {
          added_at: string
          collection_id: string
          id: string
          picture_id: string
        }
        Insert: {
          added_at?: string
          collection_id: string
          id?: string
          picture_id: string
        }
        Update: {
          added_at?: string
          collection_id?: string
          id?: string
          picture_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_pictures_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_pictures_picture_id_fkey"
            columns: ["picture_id"]
            isOneToOne: false
            referencedRelation: "pictures"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_posts: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          post_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          post_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_posts_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_posts_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          content: Json | null
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          layout: Json | null
          name: string
          slug: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          layout?: Json | null
          name: string
          slug: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          layout?: Json | null
          name?: string
          slug?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number | null
          parent_comment_id: string | null
          picture_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          picture_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          picture_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_parent_fk"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      context_definitions: {
        Row: {
          created_at: string | null
          default_filters: Json
          default_templates: Json
          description: string | null
          display_name: string
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_filters?: Json
          default_templates?: Json
          description?: string | null
          display_name: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_filters?: Json
          default_templates?: Json
          description?: string | null
          display_name?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      filter_usage_logs: {
        Row: {
          context: string
          created_at: string | null
          error_message: string | null
          filters_applied: string[] | null
          id: string
          input_length: number
          model: string
          output_length: number
          processing_time_ms: number
          provider: string
          success: boolean
          template_id: string | null
          user_id: string | null
        }
        Insert: {
          context: string
          created_at?: string | null
          error_message?: string | null
          filters_applied?: string[] | null
          id?: string
          input_length: number
          model: string
          output_length: number
          processing_time_ms: number
          provider: string
          success: boolean
          template_id?: string | null
          user_id?: string | null
        }
        Update: {
          context?: string
          created_at?: string | null
          error_message?: string | null
          filters_applied?: string[] | null
          id?: string
          input_length?: number
          model?: string
          output_length?: number
          processing_time_ms?: number
          provider?: string
          success?: boolean
          template_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "filter_usage_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "user_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      likes: {
        Row: {
          created_at: string
          id: string
          picture_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          picture_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          picture_id?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_collaborators: {
        Row: {
          created_at: string
          id: string
          page_id: string
          role: Database["public"]["Enums"]["collaborator_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_id: string
          role?: Database["public"]["Enums"]["collaborator_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_id?: string
          role?: Database["public"]["Enums"]["collaborator_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_collaborators_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          is_public: boolean
          meta: Json | null
          owner: string
          parent: string | null
          slug: string
          tags: string[] | null
          title: string
          type: string | null
          updated_at: string
          visible: boolean
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          is_public?: boolean
          meta?: Json | null
          owner: string
          parent?: string | null
          slug: string
          tags?: string[] | null
          title: string
          type?: string | null
          updated_at?: string
          visible?: boolean
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          is_public?: boolean
          meta?: Json | null
          owner?: string
          parent?: string | null
          slug?: string
          tags?: string[] | null
          title?: string
          type?: string | null
          updated_at?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pages_parent_fkey"
            columns: ["parent"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pictures: {
        Row: {
          created_at: string
          description: string | null
          flags: string[] | null
          id: string
          image_url: string
          is_selected: boolean
          likes_count: number | null
          meta: Json | null
          organization_id: string | null
          parent_id: string | null
          position: number | null
          post_id: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          type: string | null
          updated_at: string
          user_id: string
          visible: boolean
        }
        Insert: {
          created_at?: string
          description?: string | null
          flags?: string[] | null
          id?: string
          image_url: string
          is_selected?: boolean
          likes_count?: number | null
          meta?: Json | null
          organization_id?: string | null
          parent_id?: string | null
          position?: number | null
          post_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          type?: string | null
          updated_at?: string
          user_id: string
          visible?: boolean
        }
        Update: {
          created_at?: string
          description?: string | null
          flags?: string[] | null
          id?: string
          image_url?: string
          is_selected?: boolean
          likes_count?: number | null
          meta?: Json | null
          organization_id?: string | null
          parent_id?: string | null
          position?: number | null
          post_id?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          type?: string | null
          updated_at?: string
          user_id?: string
          visible?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "pictures_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pictures_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "pictures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pictures_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          meta: Json | null
          settings: Json | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          meta?: Json | null
          settings?: Json | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          meta?: Json | null
          settings?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          aimlapi_api_key: string | null
          avatar_url: string | null
          bio: string | null
          bria_api_key: string | null
          created_at: string
          display_name: string | null
          google_api_key: string | null
          huggingface_api_key: string | null
          id: string
          openai_api_key: string | null
          pages: Json | null
          replicate_api_key: string | null
          settings: Json | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          aimlapi_api_key?: string | null
          avatar_url?: string | null
          bio?: string | null
          bria_api_key?: string | null
          created_at?: string
          display_name?: string | null
          google_api_key?: string | null
          huggingface_api_key?: string | null
          id?: string
          openai_api_key?: string | null
          pages?: Json | null
          replicate_api_key?: string | null
          settings?: Json | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          aimlapi_api_key?: string | null
          avatar_url?: string | null
          bio?: string | null
          bria_api_key?: string | null
          created_at?: string
          display_name?: string | null
          google_api_key?: string | null
          huggingface_api_key?: string | null
          id?: string
          openai_api_key?: string | null
          pages?: Json | null
          replicate_api_key?: string | null
          settings?: Json | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      provider_configs: {
        Row: {
          base_url: string
          created_at: string | null
          display_name: string
          id: string
          is_active: boolean | null
          models: Json
          name: string
          rate_limits: Json | null
          settings: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          base_url: string
          created_at?: string | null
          display_name: string
          id?: string
          is_active?: boolean | null
          models?: Json
          name: string
          rate_limits?: Json | null
          settings?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          base_url?: string
          created_at?: string | null
          display_name?: string
          id?: string
          is_active?: boolean | null
          models?: Json
          name?: string
          rate_limits?: Json | null
          settings?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          created_at?: string
          id?: string
          permission: Database["public"]["Enums"]["app_permission"]
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["app_permission"]
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      user_filter_configs: {
        Row: {
          context: string
          created_at: string | null
          custom_filters: Json | null
          default_templates: string[] | null
          id: string
          is_default: boolean | null
          model: string
          provider: string
          updated_at: string | null
          user_id: string | null
          variables: Json | null
        }
        Insert: {
          context: string
          created_at?: string | null
          custom_filters?: Json | null
          default_templates?: string[] | null
          id?: string
          is_default?: boolean | null
          model?: string
          provider?: string
          updated_at?: string | null
          user_id?: string | null
          variables?: Json | null
        }
        Update: {
          context?: string
          created_at?: string | null
          custom_filters?: Json | null
          default_templates?: string[] | null
          id?: string
          is_default?: boolean | null
          model?: string
          provider?: string
          updated_at?: string | null
          user_id?: string | null
          variables?: Json | null
        }
        Relationships: []
      }
      user_organizations: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_organizations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_secrets: {
        Row: {
          aimlapi_api_key: string | null
          bria_api_key: string | null
          created_at: string
          google_api_key: string | null
          huggingface_api_key: string | null
          is_admin: boolean | null
          openai_api_key: string | null
          replicate_api_key: string | null
          settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          aimlapi_api_key?: string | null
          bria_api_key?: string | null
          created_at?: string
          google_api_key?: string | null
          huggingface_api_key?: string | null
          is_admin?: boolean | null
          openai_api_key?: string | null
          replicate_api_key?: string | null
          settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          aimlapi_api_key?: string | null
          bria_api_key?: string | null
          created_at?: string
          google_api_key?: string | null
          huggingface_api_key?: string | null
          is_admin?: boolean | null
          openai_api_key?: string | null
          replicate_api_key?: string | null
          settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_templates: {
        Row: {
          context: string
          created_at: string | null
          description: string | null
          filters: string[] | null
          format: string | null
          id: string
          is_public: boolean | null
          model: string
          name: string
          prompt: string
          provider: string
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          context: string
          created_at?: string | null
          description?: string | null
          filters?: string[] | null
          format?: string | null
          id?: string
          is_public?: boolean | null
          model?: string
          name: string
          prompt: string
          provider?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          context?: string
          created_at?: string | null
          description?: string | null
          filters?: string[] | null
          format?: string | null
          id?: string
          is_public?: boolean | null
          model?: string
          name?: string
          prompt?: string
          provider?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      wizard_sessions: {
        Row: {
          created_at: string
          generated_image_url: string | null
          id: string
          input_images: string[] | null
          prompt: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          generated_image_url?: string | null
          id?: string
          input_images?: string[] | null
          prompt?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          generated_image_url?: string | null
          id?: string
          input_images?: string[] | null
          prompt?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      authorize: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_permission: {
        Args: {
          _permission: Database["public"]["Enums"]["app_permission"]
          _user_id: string
        }
        Returns: boolean
      }
      is_page_collaborator: { Args: { _page_id: string }; Returns: boolean }
      is_page_owner: { Args: { _page_id: string }; Returns: boolean }
    }
    Enums: {
      app_permission:
        | "pictures.read"
        | "pictures.create"
        | "pictures.update"
        | "pictures.delete"
        | "collections.read"
        | "collections.create"
        | "collections.update"
        | "collections.delete"
        | "comments.read"
        | "comments.create"
        | "comments.update"
        | "comments.delete"
        | "organization.manage"
      app_role: "owner" | "admin" | "member" | "viewer"
      category_relation_type:
        | "generalization"
        | "material_usage"
        | "domain"
        | "process_step"
        | "standard"
        | "other"
      category_visibility: "public" | "unlisted" | "private"
      collaborator_role: "viewer" | "editor" | "owner"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_permission: [
        "pictures.read",
        "pictures.create",
        "pictures.update",
        "pictures.delete",
        "collections.read",
        "collections.create",
        "collections.update",
        "collections.delete",
        "comments.read",
        "comments.create",
        "comments.update",
        "comments.delete",
        "organization.manage",
      ],
      app_role: ["owner", "admin", "member", "viewer"],
      category_relation_type: [
        "generalization",
        "material_usage",
        "domain",
        "process_step",
        "standard",
        "other",
      ],
      category_visibility: ["public", "unlisted", "private"],
      collaborator_role: ["viewer", "editor", "owner"],
    },
  },
} as const
