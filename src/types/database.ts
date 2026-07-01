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
      comments: {
        Row: {
          id: string;
          post_id: string;
          author_name: string;
          body: string;
          is_deleted: boolean | null;
          status: "pending" | "approved" | "hidden";
          created_at: string;
        };
        Insert: {
          post_id: string;
          author_name: string;
          body: string;
          is_deleted?: boolean;
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
    };
    Views: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
