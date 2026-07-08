export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      posts: {
        Row: {
          id: string;
          slug: string;
          title: string;
          excerpt: string | null;
          body: string | null;
          content_blocks: Json | null;
          category_id: string;
          author: string | null;
          published_at: string | null;
          read_time: string | null;
          thumbnail_url: string | null;
          image_alt: string | null;
          tags: string[] | null;
          status: "draft" | "published" | "deleted";
          featured: boolean | null;
          view_count: number | null;
          seo_title: string | null;
          meta_description: string | null;
          og_image_url: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["posts"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["posts"]["Row"]>;
      };
      categories: {
        Row: {
          id: string;
          label: string;
          href: string;
          description: string | null;
          sort_order: number | null;
          visible: boolean | null;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
      };
      tags: {
        Row: {
          id: string;
          name: string;
          slug: string;
          sort_order: number | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          sort_order?: number | null;
          created_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["tags"]["Row"]>;
      };
      spell_check_rules: {
        Row: {
          id: string;
          wrong_text: string;
          suggestion: string;
          message: string | null;
          type: "spelling" | "spacing";
          is_active: boolean;
          sort_order: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: string;
          wrong_text: string;
          suggestion: string;
          message?: string | null;
          type?: "spelling" | "spacing";
          is_active?: boolean;
          sort_order?: number | null;
          created_at?: string | null;
          updated_at?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["spell_check_rules"]["Row"]>;
      };
      comments: {
        Row: {
          id: string;
          post_id: string;
          parent_id: string | null;
          author_name: string;
          body: string;
          is_admin_reply: boolean | null;
          is_deleted: boolean | null;
          is_secret: boolean | null;
          password_hash: string | null;
          status: "pending" | "approved" | "hidden";
          created_at: string;
        };
        Insert: {
          post_id: string;
          parent_id?: string | null;
          author_name: string;
          body: string;
          is_admin_reply?: boolean;
          is_deleted?: boolean;
          is_secret?: boolean;
          password_hash?: string | null;
          status?: "pending" | "approved" | "hidden";
        };
        Update: Partial<Database["public"]["Tables"]["comments"]["Row"]>;
      };
      post_reactions: {
        Row: {
          id: string;
          post_id: string;
          post_slug: string;
          reaction_type: "like" | "watched" | "excited" | "dislike";
          client_id: string;
          visitor_id: string;
          created_at: string;
        };
        Insert: {
          post_id: string;
          post_slug: string;
          reaction_type: "like" | "watched" | "excited" | "dislike";
          client_id: string;
          visitor_id: string;
        };
        Update: Partial<Database["public"]["Tables"]["post_reactions"]["Row"]>;
      };
      page_views: {
        Row: {
          id: string;
          post_id: string | null;
          post_slug: string;
          visitor_id: string;
          viewed_at: string;
          created_at: string;
        };
        Insert: {
          post_id?: string | null;
          post_slug: string;
          visitor_id: string;
          viewed_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["page_views"]["Row"]>;
      };
      site_visits: {
        Row: {
          id: string;
          visitor_id: string;
          page_path: string;
          visit_date: string;
          visited_at: string;
        };
        Insert: {
          id?: string;
          visitor_id: string;
          page_path?: string;
          visit_date?: string;
          visited_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["site_visits"]["Row"]>;
      };
      media_assets: {
        Row: {
          id: string;
          title: string;
          url: string;
          alt: string | null;
          type: "image";
          usage: string[] | null;
          storage_path: string | null;
          file_size: number | null;
          mime_type: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["media_assets"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["media_assets"]["Row"]>;
      };
      media_files: {
        Row: {
          id: string;
          title: string;
          alt: string | null;
          original_url: string;
          webp_url: string;
          thumbnail_url: string;
          original_path: string;
          webp_path: string;
          thumbnail_path: string;
          mime_type: string;
          size_bytes: number;
          width: number | null;
          height: number | null;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          alt?: string | null;
          original_url: string;
          webp_url: string;
          thumbnail_url: string;
          original_path: string;
          webp_path: string;
          thumbnail_path: string;
          mime_type: string;
          size_bytes: number;
          width?: number | null;
          height?: number | null;
          uploaded_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["media_files"]["Row"]>;
      };
      site_settings: {
        Row: {
          id: string;
          key: string;
          value: Json;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["site_settings"]["Row"]>;
      };
      admin_users: {
        Row: {
          id: string;
          email: string;
          role: "super_admin" | "admin" | "editor";
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          role: "super_admin" | "admin" | "editor";
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["admin_users"]["Row"]>;
      };
    };
    Functions: {
      increment_post_view: {
        Args: { target_post_id: string };
        Returns: number;
      };
      list_public_comments: {
        Args: { target_post_id: string };
        Returns: Array<{
          id: string;
          post_id: string;
          parent_id: string | null;
          author_name: string;
          body: string | null;
          is_admin_reply: boolean;
          is_secret: boolean;
          status: "pending" | "approved" | "hidden";
          created_at: string;
        }>;
      };
      create_public_comment: {
        Args: {
          target_post_id: string;
          visitor_name: string;
          comment_body: string;
          secret?: boolean;
          secret_password?: string | null;
        };
        Returns: Database["public"]["Functions"]["list_public_comments"]["Returns"];
      };
      reveal_secret_comment: {
        Args: { target_comment_id: string; secret_password: string };
        Returns: Array<{
          ok: boolean;
          message: string;
          comment_id: string | null;
          body: string | null;
        }>;
      };
      delete_secret_comment: {
        Args: { target_comment_id: string; secret_password: string };
        Returns: Array<{
          ok: boolean;
          message: string;
          deleted_id: string | null;
        }>;
      };
      list_admin_comments: {
        Args: Record<string, never>;
        Returns: Array<{
          id: string;
          post_id: string;
          parent_id: string | null;
          author_name: string;
          body: string;
          is_admin_reply: boolean;
          is_secret: boolean;
          status: "pending" | "approved" | "hidden";
          created_at: string;
        }>;
      };
      admin_soft_delete_comment: {
        Args: { target_comment_id: string };
        Returns: Array<{
          ok: boolean;
          message: string;
          deleted_id: string | null;
        }>;
      };
      create_admin_comment_reply: {
        Args: { target_parent_id: string; reply_body: string };
        Returns: Database["public"]["Functions"]["list_admin_comments"]["Returns"];
      };
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
