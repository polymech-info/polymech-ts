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
      acl_group_members: {
        Row: {
          created_at: string | null
          created_by: string | null
          group_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          group_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          group_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acl_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "acl_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      acl_groups: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          modified_at: string | null
          name: string
          native_type: string | null
          parent_id: string | null
          settings: Json | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          modified_at?: string | null
          name: string
          native_type?: string | null
          parent_id?: string | null
          settings?: Json | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          modified_at?: string | null
          name?: string
          native_type?: string | null
          parent_id?: string | null
          settings?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "acl_groups_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "acl_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          completed_at: string | null
          created_at: string
          group_ids: string[]
          id: string
          lang: string | null
          meta: Json
          name: string
          owner_id: string
          page_id: string | null
          page_slug: string | null
          scheduled_at: string | null
          started_at: string | null
          stats: Json
          status: string
          subject: string | null
          tracking_id: string | null
          updated_at: string
          vars: Json
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          group_ids?: string[]
          id?: string
          lang?: string | null
          meta?: Json
          name: string
          owner_id: string
          page_id?: string | null
          page_slug?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          stats?: Json
          status?: string
          subject?: string | null
          tracking_id?: string | null
          updated_at?: string
          vars?: Json
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          group_ids?: string[]
          id?: string
          lang?: string | null
          meta?: Json
          name?: string
          owner_id?: string
          page_id?: string | null
          page_slug?: string | null
          scheduled_at?: string | null
          started_at?: string | null
          stats?: Json
          status?: string
          subject?: string | null
          tracking_id?: string | null
          updated_at?: string
          vars?: Json
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          meta: Json | null
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
          meta?: Json | null
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
          meta?: Json | null
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
      contact_group_members: {
        Row: {
          added_at: string
          contact_id: string
          group_id: string
        }
        Insert: {
          added_at?: string
          contact_id: string
          group_id: string
        }
        Update: {
          added_at?: string
          contact_id?: string
          group_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_group_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "contact_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_groups: {
        Row: {
          created_at: string
          description: string | null
          id: string
          meta: Json
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          meta?: Json
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          meta?: Json
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          address: Json
          created_at: string
          emails: Json
          first_name: string | null
          id: string
          language: string | null
          last_name: string | null
          log: Json
          meta: Json
          name: string | null
          notes: string | null
          organization: string | null
          owner_id: string
          phone: string | null
          source: string | null
          status: string
          tags: string[] | null
          title: string | null
          updated_at: string
        }
        Insert: {
          address?: Json
          created_at?: string
          emails?: Json
          first_name?: string | null
          id?: string
          language?: string | null
          last_name?: string | null
          log?: Json
          meta?: Json
          name?: string | null
          notes?: string | null
          organization?: string | null
          owner_id: string
          phone?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          address?: Json
          created_at?: string
          emails?: Json
          first_name?: string | null
          id?: string
          language?: string | null
          last_name?: string | null
          log?: Json
          meta?: Json
          name?: string | null
          notes?: string | null
          organization?: string | null
          owner_id?: string
          phone?: string | null
          source?: string | null
          status?: string
          tags?: string[] | null
          title?: string | null
          updated_at?: string
        }
        Relationships: []
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
      grid_area_places: {
        Row: {
          created_at: string
          grid_area_id: string
          id: string
          place_id: string
          rank: number | null
        }
        Insert: {
          created_at?: string
          grid_area_id: string
          id?: string
          place_id: string
          rank?: number | null
        }
        Update: {
          created_at?: string
          grid_area_id?: string
          id?: string
          place_id?: string
          rank?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "grid_area_places_grid_area_id_fkey"
            columns: ["grid_area_id"]
            isOneToOne: false
            referencedRelation: "grid_areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grid_area_places_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["place_id"]
          },
        ]
      }
      grid_areas: {
        Row: {
          area_sqkm: number | null
          bbox: Json | null
          center: Json | null
          created_at: string
          geometry: Json | null
          gid: string
          id: string
          level: number
          max_dist_km: number | null
          meta: Json | null
          name: string
          region: string
          stats: Json | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          area_sqkm?: number | null
          bbox?: Json | null
          center?: Json | null
          created_at?: string
          geometry?: Json | null
          gid: string
          id?: string
          level: number
          max_dist_km?: number | null
          meta?: Json | null
          name: string
          region: string
          stats?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          area_sqkm?: number | null
          bbox?: Json | null
          center?: Json | null
          created_at?: string
          geometry?: Json | null
          gid?: string
          id?: string
          level?: number
          max_dist_km?: number | null
          meta?: Json | null
          name?: string
          region?: string
          stats?: Json | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      grid_search_runs: {
        Row: {
          created_at: string
          id: string
          parent: string | null
          request: Json
          result: Json | null
          run_id: string
          settings: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id: string
          parent?: string | null
          request: Json
          result?: Json | null
          run_id: string
          settings?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent?: string | null
          request?: Json
          result?: Json | null
          run_id?: string
          settings?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "grid_search_runs_parent_fkey"
            columns: ["parent"]
            isOneToOne: false
            referencedRelation: "grid_search_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      i18n_glossaries: {
        Row: {
          creation_time: string | null
          entry_count: number | null
          glossary_id: string
          hash: string | null
          local_created_at: string | null
          local_updated_at: string | null
          name: string
          ready: boolean | null
          source_lang: string
          target_lang: string
        }
        Insert: {
          creation_time?: string | null
          entry_count?: number | null
          glossary_id: string
          hash?: string | null
          local_created_at?: string | null
          local_updated_at?: string | null
          name: string
          ready?: boolean | null
          source_lang: string
          target_lang: string
        }
        Update: {
          creation_time?: string | null
          entry_count?: number | null
          glossary_id?: string
          hash?: string | null
          local_created_at?: string | null
          local_updated_at?: string | null
          name?: string
          ready?: boolean | null
          source_lang?: string
          target_lang?: string
        }
        Relationships: []
      }
      i18n_glossary_terms: {
        Row: {
          created_at: string | null
          id: string
          source_lang: string
          target_lang: string
          term: string
          translation: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          source_lang: string
          target_lang: string
          term: string
          translation: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          source_lang?: string
          target_lang?: string
          term?: string
          translation?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      i18n_translations: {
        Row: {
          created_at: string | null
          dst_lang: string
          dst_text: string
          id: string
          meta: Json | null
          src_lang: string
          src_text: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          dst_lang: string
          dst_text: string
          id?: string
          meta?: Json | null
          src_lang: string
          src_text: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          dst_lang?: string
          dst_text?: string
          id?: string
          meta?: Json | null
          src_lang?: string
          src_text?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      layouts: {
        Row: {
          created_at: string
          id: string
          is_predefined: boolean | null
          layout_json: Json
          meta: Json | null
          name: string
          owner_id: string
          type: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["layout_visibility"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_predefined?: boolean | null
          layout_json: Json
          meta?: Json | null
          name: string
          owner_id: string
          type?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["layout_visibility"]
        }
        Update: {
          created_at?: string
          id?: string
          is_predefined?: boolean | null
          layout_json?: Json
          meta?: Json | null
          name?: string
          owner_id?: string
          type?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["layout_visibility"]
        }
        Relationships: []
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
      marketing_emails: {
        Row: {
          campaign: string | null
          created_at: string
          email: string
          error_message: string | null
          from_address: string | null
          id: string
          lang: string | null
          last_retry_at: string | null
          meta: Json | null
          name: string | null
          page_slug: string
          retry_count: number
          sender_id: string | null
          sent_at: string | null
          status: string
          subject: string | null
          tracking_id: string | null
          unsubscribe_token: string
          unsubscribed: boolean
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          campaign?: string | null
          created_at?: string
          email: string
          error_message?: string | null
          from_address?: string | null
          id?: string
          lang?: string | null
          last_retry_at?: string | null
          meta?: Json | null
          name?: string | null
          page_slug: string
          retry_count?: number
          sender_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          tracking_id?: string | null
          unsubscribe_token?: string
          unsubscribed?: boolean
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          campaign?: string | null
          created_at?: string
          email?: string
          error_message?: string | null
          from_address?: string | null
          id?: string
          lang?: string | null
          last_retry_at?: string | null
          meta?: Json | null
          name?: string | null
          page_slug?: string
          retry_count?: number
          sender_id?: string | null
          sent_at?: string | null
          status?: string
          subject?: string | null
          tracking_id?: string | null
          unsubscribe_token?: string
          unsubscribed?: boolean
          unsubscribed_at?: string | null
          updated_at?: string
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
          is_version_of: string | null
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
          is_version_of?: string | null
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
          is_version_of?: string | null
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
            foreignKeyName: "pages_is_version_of_fkey"
            columns: ["is_version_of"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
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
      place_searches: {
        Row: {
          created_at: string
          id: string
          input_hash: string
          input_params: Json
          result_place_ids: string[]
          run_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          input_hash: string
          input_params: Json
          result_place_ids: string[]
          run_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          input_hash?: string
          input_params?: Json
          result_place_ids?: string[]
          run_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      places: {
        Row: {
          address: string | null
          city: string | null
          contacts: Json | null
          continent: string | null
          country: string | null
          created_at: string
          description: string | null
          gps_coordinates: Json | null
          media: Json | null
          meta: Json | null
          operating_hours: Json | null
          phone: string | null
          place_id: string
          raw_data: Json | null
          thumbnail: string | null
          title: string | null
          types: string[] | null
          updated_at: string
          user_id: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          contacts?: Json | null
          continent?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          gps_coordinates?: Json | null
          media?: Json | null
          meta?: Json | null
          operating_hours?: Json | null
          phone?: string | null
          place_id: string
          raw_data?: Json | null
          thumbnail?: string | null
          title?: string | null
          types?: string[] | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          contacts?: Json | null
          continent?: string | null
          country?: string | null
          created_at?: string
          description?: string | null
          gps_coordinates?: Json | null
          media?: Json | null
          meta?: Json | null
          operating_hours?: Json | null
          phone?: string | null
          place_id?: string
          raw_data?: Json | null
          thumbnail?: string | null
          title?: string | null
          types?: string[] | null
          updated_at?: string
          user_id?: string | null
          website?: string | null
        }
        Relationships: []
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
      products: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          settings: Json | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          settings?: Json | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          settings?: Json | null
          slug?: string
          updated_at?: string
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
      resource_acl: {
        Row: {
          created_at: string | null
          group_name: string | null
          id: string
          log: Json | null
          meta: Json | null
          path: string | null
          permissions: string[]
          resource_id: string
          resource_owner_id: string | null
          resource_type: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          group_name?: string | null
          id?: string
          log?: Json | null
          meta?: Json | null
          path?: string | null
          permissions?: string[]
          resource_id: string
          resource_owner_id?: string | null
          resource_type: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          group_name?: string | null
          id?: string
          log?: Json | null
          meta?: Json | null
          path?: string | null
          permissions?: string[]
          resource_id?: string
          resource_owner_id?: string | null
          resource_type?: string
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
      searches: {
        Row: {
          created_at: string
          id: string
          input_hash: string
          input_params: Json
          result_place_ids: string[]
        }
        Insert: {
          created_at?: string
          id?: string
          input_hash: string
          input_params: Json
          result_place_ids: string[]
        }
        Update: {
          created_at?: string
          id?: string
          input_hash?: string
          input_params?: Json
          result_place_ids?: string[]
        }
        Relationships: []
      }
      transactions: {
        Row: {
          buyer_email: string | null
          buyer_ip: unknown
          buyer_name: string | null
          buyer_profile: Json
          created_at: string
          currency: string
          external_checkout_id: string | null
          external_order_id: string | null
          id: string
          metadata: Json
          note: string | null
          payment_provider: string | null
          product_info: Json
          shipping_info: Json
          status: string
          total_amount: number
          updated_at: string
          user_id: string
          vendor_info: Json
        }
        Insert: {
          buyer_email?: string | null
          buyer_ip?: unknown
          buyer_name?: string | null
          buyer_profile?: Json
          created_at?: string
          currency?: string
          external_checkout_id?: string | null
          external_order_id?: string | null
          id?: string
          metadata?: Json
          note?: string | null
          payment_provider?: string | null
          product_info?: Json
          shipping_info?: Json
          status?: string
          total_amount?: number
          updated_at?: string
          user_id: string
          vendor_info?: Json
        }
        Update: {
          buyer_email?: string | null
          buyer_ip?: unknown
          buyer_name?: string | null
          buyer_profile?: Json
          created_at?: string
          currency?: string
          external_checkout_id?: string | null
          external_order_id?: string | null
          id?: string
          metadata?: Json
          note?: string | null
          payment_provider?: string | null
          product_info?: Json
          shipping_info?: Json
          status?: string
          total_amount?: number
          updated_at?: string
          user_id?: string
          vendor_info?: Json
        }
        Relationships: []
      }
      type_casts: {
        Row: {
          cast_kind: Database["public"]["Enums"]["cast_kind"]
          description: string | null
          from_type_id: string
          to_type_id: string
        }
        Insert: {
          cast_kind: Database["public"]["Enums"]["cast_kind"]
          description?: string | null
          from_type_id: string
          to_type_id: string
        }
        Update: {
          cast_kind?: Database["public"]["Enums"]["cast_kind"]
          description?: string | null
          from_type_id?: string
          to_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "type_casts_from_type_id_fkey"
            columns: ["from_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "type_casts_to_type_id_fkey"
            columns: ["to_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      type_enum_values: {
        Row: {
          id: string
          label: string
          order: number
          type_id: string
          value: string
        }
        Insert: {
          id?: string
          label: string
          order?: number
          type_id: string
          value: string
        }
        Update: {
          id?: string
          label?: string
          order?: number
          type_id?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "type_enum_values_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      type_flag_values: {
        Row: {
          bit: number
          id: string
          name: string
          type_id: string
        }
        Insert: {
          bit: number
          id?: string
          name: string
          type_id: string
        }
        Update: {
          bit?: number
          id?: string
          name?: string
          type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "type_flag_values_type_id_fkey"
            columns: ["type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      type_structure_fields: {
        Row: {
          default_value: Json | null
          field_name: string
          field_type_id: string
          id: string
          order: number
          required: boolean
          structure_type_id: string
        }
        Insert: {
          default_value?: Json | null
          field_name: string
          field_type_id: string
          id?: string
          order?: number
          required?: boolean
          structure_type_id: string
        }
        Update: {
          default_value?: Json | null
          field_name?: string
          field_type_id?: string
          id?: string
          order?: number
          required?: boolean
          structure_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "type_structure_fields_field_type_id_fkey"
            columns: ["field_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "type_structure_fields_structure_type_id_fkey"
            columns: ["structure_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
      }
      types: {
        Row: {
          created_at: string
          description: string | null
          id: string
          json_schema: Json | null
          kind: Database["public"]["Enums"]["type_kind"]
          meta: Json | null
          name: string
          owner_id: string | null
          parent_type_id: string | null
          settings: Json | null
          updated_at: string
          visibility: Database["public"]["Enums"]["type_visibility"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          json_schema?: Json | null
          kind: Database["public"]["Enums"]["type_kind"]
          meta?: Json | null
          name: string
          owner_id?: string | null
          parent_type_id?: string | null
          settings?: Json | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["type_visibility"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          json_schema?: Json | null
          kind?: Database["public"]["Enums"]["type_kind"]
          meta?: Json | null
          name?: string
          owner_id?: string | null
          parent_type_id?: string | null
          settings?: Json | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["type_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "types_parent_type_id_fkey"
            columns: ["parent_type_id"]
            isOneToOne: false
            referencedRelation: "types"
            referencedColumns: ["id"]
          },
        ]
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
      vfs_document_chunks: {
        Row: {
          chunk_index: number
          content: string
          created_at: string | null
          embedding: string | null
          id: string
          vfs_id: string
        }
        Insert: {
          chunk_index: number
          content: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          vfs_id: string
        }
        Update: {
          chunk_index?: number
          content?: string
          created_at?: string | null
          embedding?: string | null
          id?: string
          vfs_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vfs_document_chunks_vfs_id_fkey"
            columns: ["vfs_id"]
            isOneToOne: false
            referencedRelation: "vfs_index"
            referencedColumns: ["id"]
          },
        ]
      }
      vfs_index: {
        Row: {
          content: string | null
          fts: unknown
          id: string
          is_vectorized: boolean | null
          mime: string | null
          mount: string
          mtime: string | null
          name: string
          path: string
          size: number | null
          type: string
        }
        Insert: {
          content?: string | null
          fts?: unknown
          id?: string
          is_vectorized?: boolean | null
          mime?: string | null
          mount: string
          mtime?: string | null
          name: string
          path: string
          size?: number | null
          type: string
        }
        Update: {
          content?: string | null
          fts?: unknown
          id?: string
          is_vectorized?: boolean | null
          mime?: string | null
          mount?: string
          mtime?: string | null
          name?: string
          path?: string
          size?: number | null
          type?: string
        }
        Relationships: []
      }
      widget_translations: {
        Row: {
          created_at: string | null
          entity_id: string | null
          entity_type: string | null
          id: string
          meta: Json | null
          prop_path: string | null
          source_lang: string
          source_text: string | null
          source_version: number | null
          status: Database["public"]["Enums"]["translation_status"] | null
          target_lang: string
          translated_text: string | null
          updated_at: string | null
          widget_id: string | null
        }
        Insert: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          meta?: Json | null
          prop_path?: string | null
          source_lang: string
          source_text?: string | null
          source_version?: number | null
          status?: Database["public"]["Enums"]["translation_status"] | null
          target_lang: string
          translated_text?: string | null
          updated_at?: string | null
          widget_id?: string | null
        }
        Update: {
          created_at?: string | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          meta?: Json | null
          prop_path?: string | null
          source_lang?: string
          source_text?: string | null
          source_version?: number | null
          status?: Database["public"]["Enums"]["translation_status"] | null
          target_lang?: string
          translated_text?: string | null
          updated_at?: string | null
          widget_id?: string | null
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
      marketing_unsubscribed: {
        Row: {
          email: string | null
        }
        Relationships: []
      }
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
      pages_search_text: {
        Args: { rec: Database["public"]["Tables"]["pages"]["Row"] }
        Returns: unknown
      }
      pictures_search_text: {
        Args: { rec: Database["public"]["Tables"]["pictures"]["Row"] }
        Returns: unknown
      }
      posts_search_text: {
        Args: { rec: Database["public"]["Tables"]["posts"]["Row"] }
        Returns: unknown
      }
      search_pages: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          created_at: string
          id: string
          meta: Json
          owner: string
          rank: number
          slug: string
          tags: string[]
          title: string
          type: string
          updated_at: string
        }[]
      }
      search_pictures: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          created_at: string
          description: string
          id: string
          image_url: string
          rank: number
          tags: string[]
          thumbnail_url: string
          title: string
          type: string
          user_id: string
        }[]
      }
      search_posts: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          created_at: string
          description: string
          id: string
          rank: number
          title: string
          type: string
          user_id: string
        }[]
      }
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
      cast_kind: "implicit" | "explicit" | "lossy"
      category_relation_type:
        | "generalization"
        | "material_usage"
        | "domain"
        | "process_step"
        | "standard"
        | "other"
      category_visibility: "public" | "unlisted" | "private"
      collaborator_role: "viewer" | "editor" | "owner"
      layout_visibility: "public" | "private" | "listed" | "custom"
      translation_status: "draft" | "machine" | "reviewed" | "published"
      type_kind:
        | "primitive"
        | "enum"
        | "flags"
        | "structure"
        | "alias"
        | "field"
      type_visibility: "public" | "private" | "custom"
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
      cast_kind: ["implicit", "explicit", "lossy"],
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
      layout_visibility: ["public", "private", "listed", "custom"],
      translation_status: ["draft", "machine", "reviewed", "published"],
      type_kind: ["primitive", "enum", "flags", "structure", "alias", "field"],
      type_visibility: ["public", "private", "custom"],
    },
  },
} as const
