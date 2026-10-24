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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admin_allowlist: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      episode_terms: {
        Row: {
          episode_id: string
          term_id: string
        }
        Insert: {
          episode_id: string
          term_id: string
        }
        Update: {
          episode_id?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "episode_terms_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "episode_terms_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      episodes: {
        Row: {
          audio_url: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          duration_seconds: number | null
          embed_url: string | null
          episode_number: number | null
          id: string
          last_checked: string | null
          published_at: string | null
          published_on: string | null
          season: number | null
          show_notes: string | null
          slug: string
          source_url: string | null
          status: Database["public"]["Enums"]["entry_status"]
          summary: string | null
          title: string
          transcript: string | null
          updated_at: string
        }
        Insert: {
          audio_url?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          embed_url?: string | null
          episode_number?: number | null
          id?: string
          last_checked?: string | null
          published_at?: string | null
          published_on?: string | null
          season?: number | null
          show_notes?: string | null
          slug: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          summary?: string | null
          title: string
          transcript?: string | null
          updated_at?: string
        }
        Update: {
          audio_url?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          duration_seconds?: number | null
          embed_url?: string | null
          episode_number?: number | null
          id?: string
          last_checked?: string | null
          published_at?: string | null
          published_on?: string | null
          season?: number | null
          show_notes?: string | null
          slug?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          summary?: string | null
          title?: string
          transcript?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      event_opportunities: {
        Row: {
          event_id: string
          id: string
          opportunity_id: string
          role: string
        }
        Insert: {
          event_id: string
          id?: string
          opportunity_id: string
          role?: string
        }
        Update: {
          event_id?: string
          id?: string
          opportunity_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_opportunities_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      event_terms: {
        Row: {
          event_id: string
          term_id: string
        }
        Insert: {
          event_id: string
          term_id: string
        }
        Update: {
          event_id?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_terms_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_terms_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          apply_deadline_at: string | null
          city: string | null
          cover_image_flag: string | null
          cover_image_pending_url: string | null
          cover_image_status: string
          cover_image_url: string | null
          cover_page_title: string | null
          created_at: string
          created_by: string | null
          description: string | null
          ends_at: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          format: Database["public"]["Enums"]["event_format"] | null
          founded_year: number | null
          free_ways_in: string | null
          geocoded_at: string | null
          id: string
          image_source: string | null
          image_source_url: string | null
          image_uploaded_by: string | null
          last_checked: string | null
          latitude: number | null
          logo_image_source: string | null
          logo_image_source_url: string | null
          logo_uploaded_by: string | null
          logo_url: string | null
          longitude: number | null
          our_take: string | null
          price_info: string | null
          price_note: string | null
          profile_sources: string[]
          published_at: string | null
          registration_url: string | null
          scale_facts: Json
          slug: string
          source_url: string | null
          starts_at: string | null
          status: Database["public"]["Enums"]["entry_status"]
          story: string | null
          summary: string | null
          timezone: string | null
          tips: string[]
          title: string
          updated_at: string
          venue: string | null
          video_source_url: string | null
          video_url: string | null
          who_youll_meet: string[]
        }
        Insert: {
          apply_deadline_at?: string | null
          city?: string | null
          cover_image_flag?: string | null
          cover_image_pending_url?: string | null
          cover_image_status?: string
          cover_image_url?: string | null
          cover_page_title?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_type: Database["public"]["Enums"]["event_type"]
          format?: Database["public"]["Enums"]["event_format"] | null
          founded_year?: number | null
          free_ways_in?: string | null
          geocoded_at?: string | null
          id?: string
          image_source?: string | null
          image_source_url?: string | null
          image_uploaded_by?: string | null
          last_checked?: string | null
          latitude?: number | null
          logo_image_source?: string | null
          logo_image_source_url?: string | null
          logo_uploaded_by?: string | null
          logo_url?: string | null
          longitude?: number | null
          our_take?: string | null
          price_info?: string | null
          price_note?: string | null
          profile_sources?: string[]
          published_at?: string | null
          registration_url?: string | null
          scale_facts?: Json
          slug: string
          source_url?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          story?: string | null
          summary?: string | null
          timezone?: string | null
          tips?: string[]
          title: string
          updated_at?: string
          venue?: string | null
          video_source_url?: string | null
          video_url?: string | null
          who_youll_meet?: string[]
        }
        Update: {
          apply_deadline_at?: string | null
          city?: string | null
          cover_image_flag?: string | null
          cover_image_pending_url?: string | null
          cover_image_status?: string
          cover_image_url?: string | null
          cover_page_title?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          ends_at?: string | null
          event_type?: Database["public"]["Enums"]["event_type"]
          format?: Database["public"]["Enums"]["event_format"] | null
          founded_year?: number | null
          free_ways_in?: string | null
          geocoded_at?: string | null
          id?: string
          image_source?: string | null
          image_source_url?: string | null
          image_uploaded_by?: string | null
          last_checked?: string | null
          latitude?: number | null
          logo_image_source?: string | null
          logo_image_source_url?: string | null
          logo_uploaded_by?: string | null
          logo_url?: string | null
          longitude?: number | null
          our_take?: string | null
          price_info?: string | null
          price_note?: string | null
          profile_sources?: string[]
          published_at?: string | null
          registration_url?: string | null
          scale_facts?: Json
          slug?: string
          source_url?: string | null
          starts_at?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          story?: string | null
          summary?: string | null
          timezone?: string | null
          tips?: string[]
          title?: string
          updated_at?: string
          venue?: string | null
          video_source_url?: string | null
          video_url?: string | null
          who_youll_meet?: string[]
        }
        Relationships: []
      }
      founders: {
        Row: {
          created_at: string
          id: string
          linkedin_url: string | null
          name: string
          one_line: string | null
          photo_url: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          linkedin_url?: string | null
          name: string
          one_line?: string | null
          photo_url?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          linkedin_url?: string | null
          name?: string
          one_line?: string | null
          photo_url?: string | null
          sort_order?: number
        }
        Relationships: []
      }
      glossary_term_guides: {
        Row: {
          glossary_term_id: string
          guide_id: string
          id: string
        }
        Insert: {
          glossary_term_id: string
          guide_id: string
          id?: string
        }
        Update: {
          glossary_term_id?: string
          guide_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "glossary_term_guides_glossary_term_id_fkey"
            columns: ["glossary_term_id"]
            isOneToOne: false
            referencedRelation: "glossary_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "glossary_term_guides_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_term_relations: {
        Row: {
          from_term_id: string
          id: string
          to_term_id: string
        }
        Insert: {
          from_term_id: string
          id?: string
          to_term_id: string
        }
        Update: {
          from_term_id?: string
          id?: string
          to_term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "glossary_term_relations_from_term_id_fkey"
            columns: ["from_term_id"]
            isOneToOne: false
            referencedRelation: "glossary_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "glossary_term_relations_to_term_id_fkey"
            columns: ["to_term_id"]
            isOneToOne: false
            referencedRelation: "glossary_terms"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_term_terms: {
        Row: {
          glossary_term_id: string
          term_id: string
        }
        Insert: {
          glossary_term_id: string
          term_id: string
        }
        Update: {
          glossary_term_id?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "glossary_term_terms_glossary_term_id_fkey"
            columns: ["glossary_term_id"]
            isOneToOne: false
            referencedRelation: "glossary_terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "glossary_term_terms_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      glossary_terms: {
        Row: {
          created_at: string
          created_by: string | null
          explanation: string | null
          id: string
          last_checked: string | null
          published_at: string | null
          short_definition: string
          slug: string
          source_url: string | null
          status: Database["public"]["Enums"]["entry_status"]
          term: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          explanation?: string | null
          id?: string
          last_checked?: string | null
          published_at?: string | null
          short_definition: string
          slug: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          term: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          explanation?: string | null
          id?: string
          last_checked?: string | null
          published_at?: string | null
          short_definition?: string
          slug?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      guide_links: {
        Row: {
          entry_id: string
          entry_kind: Database["public"]["Enums"]["entry_kind"]
          guide_id: string
          id: string
          sort_order: number
        }
        Insert: {
          entry_id: string
          entry_kind: Database["public"]["Enums"]["entry_kind"]
          guide_id: string
          id?: string
          sort_order?: number
        }
        Update: {
          entry_id?: string
          entry_kind?: Database["public"]["Enums"]["entry_kind"]
          guide_id?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "guide_links_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_opportunities: {
        Row: {
          guide_id: string
          id: string
          opportunity_id: string
        }
        Insert: {
          guide_id: string
          id?: string
          opportunity_id: string
        }
        Update: {
          guide_id?: string
          id?: string
          opportunity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_opportunities_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_organisations: {
        Row: {
          guide_id: string
          id: string
          organisation_id: string
        }
        Insert: {
          guide_id: string
          id?: string
          organisation_id: string
        }
        Update: {
          guide_id?: string
          id?: string
          organisation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_organisations_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_organisations_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      guide_terms: {
        Row: {
          guide_id: string
          term_id: string
        }
        Insert: {
          guide_id: string
          term_id: string
        }
        Update: {
          guide_id?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guide_terms_guide_id_fkey"
            columns: ["guide_id"]
            isOneToOne: false
            referencedRelation: "guides"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guide_terms_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      guides: {
        Row: {
          area_id: string | null
          body: string | null
          cover_url: string | null
          created_at: string
          created_by: string | null
          id: string
          journey_step_id: string | null
          last_checked: string | null
          level: Database["public"]["Enums"]["guide_level"]
          next_step: string | null
          one_sentence: string | null
          published_at: string | null
          reading_minutes: number | null
          reviewed_by: string | null
          slug: string
          source_url: string | null
          sources: Json
          status: Database["public"]["Enums"]["entry_status"]
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          area_id?: string | null
          body?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          journey_step_id?: string | null
          last_checked?: string | null
          level?: Database["public"]["Enums"]["guide_level"]
          next_step?: string | null
          one_sentence?: string | null
          published_at?: string | null
          reading_minutes?: number | null
          reviewed_by?: string | null
          slug: string
          source_url?: string | null
          sources?: Json
          status?: Database["public"]["Enums"]["entry_status"]
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          area_id?: string | null
          body?: string | null
          cover_url?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          journey_step_id?: string | null
          last_checked?: string | null
          level?: Database["public"]["Enums"]["guide_level"]
          next_step?: string | null
          one_sentence?: string | null
          published_at?: string | null
          reading_minutes?: number | null
          reviewed_by?: string | null
          slug?: string
          source_url?: string | null
          sources?: Json
          status?: Database["public"]["Enums"]["entry_status"]
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guides_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guides_journey_step_id_fkey"
            columns: ["journey_step_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_issue_links: {
        Row: {
          entry_id: string
          entry_kind: Database["public"]["Enums"]["entry_kind"]
          id: string
          newsletter_issue_id: string
          sort_order: number
        }
        Insert: {
          entry_id: string
          entry_kind: Database["public"]["Enums"]["entry_kind"]
          id?: string
          newsletter_issue_id: string
          sort_order?: number
        }
        Update: {
          entry_id?: string
          entry_kind?: Database["public"]["Enums"]["entry_kind"]
          id?: string
          newsletter_issue_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_issue_links_newsletter_issue_id_fkey"
            columns: ["newsletter_issue_id"]
            isOneToOne: false
            referencedRelation: "newsletter_issues"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_issue_terms: {
        Row: {
          newsletter_issue_id: string
          term_id: string
        }
        Insert: {
          newsletter_issue_id: string
          term_id: string
        }
        Update: {
          newsletter_issue_id?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "newsletter_issue_terms_newsletter_issue_id_fkey"
            columns: ["newsletter_issue_id"]
            isOneToOne: false
            referencedRelation: "newsletter_issues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "newsletter_issue_terms_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_issues: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          issue_number: number | null
          last_checked: string | null
          published_at: string | null
          sent_on: string | null
          slug: string
          source_url: string | null
          status: Database["public"]["Enums"]["entry_status"]
          summary: string | null
          title: string
          updated_at: string
          web_url: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          issue_number?: number | null
          last_checked?: string | null
          published_at?: string | null
          sent_on?: string | null
          slug: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          summary?: string | null
          title: string
          updated_at?: string
          web_url?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          issue_number?: number | null
          last_checked?: string | null
          published_at?: string | null
          sent_on?: string | null
          slug?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          summary?: string | null
          title?: string
          updated_at?: string
          web_url?: string | null
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          confirmed_at: string | null
          consent_at: string
          created_at: string
          email: string
          id: string
          source: string | null
          tags: string[]
          unsubscribe_token: string
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          confirmed_at?: string | null
          consent_at?: string
          created_at?: string
          email: string
          id?: string
          source?: string | null
          tags?: string[]
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          confirmed_at?: string | null
          consent_at?: string
          created_at?: string
          email?: string
          id?: string
          source?: string | null
          tags?: string[]
          unsubscribe_token?: string
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      opportunities: {
        Row: {
          amount_max_eur: number | null
          amount_min_eur: number | null
          apply_url: string | null
          created_at: string
          created_by: string | null
          deadline_at: string | null
          description: string | null
          employment_type: string | null
          how_to_apply_steps: string[]
          id: string
          last_checked: string | null
          location: string | null
          opens_at: string | null
          published_at: string | null
          remote_ok: boolean | null
          slug: string
          source_url: string | null
          status: Database["public"]["Enums"]["entry_status"]
          summary: string | null
          tips: string[]
          title: string
          type: Database["public"]["Enums"]["opportunity_type"]
          updated_at: string
          what_you_get: string | null
          who_can_apply: string[]
        }
        Insert: {
          amount_max_eur?: number | null
          amount_min_eur?: number | null
          apply_url?: string | null
          created_at?: string
          created_by?: string | null
          deadline_at?: string | null
          description?: string | null
          employment_type?: string | null
          how_to_apply_steps?: string[]
          id?: string
          last_checked?: string | null
          location?: string | null
          opens_at?: string | null
          published_at?: string | null
          remote_ok?: boolean | null
          slug: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          summary?: string | null
          tips?: string[]
          title: string
          type: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string
          what_you_get?: string | null
          who_can_apply?: string[]
        }
        Update: {
          amount_max_eur?: number | null
          amount_min_eur?: number | null
          apply_url?: string | null
          created_at?: string
          created_by?: string | null
          deadline_at?: string | null
          description?: string | null
          employment_type?: string | null
          how_to_apply_steps?: string[]
          id?: string
          last_checked?: string | null
          location?: string | null
          opens_at?: string | null
          published_at?: string | null
          remote_ok?: boolean | null
          slug?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          summary?: string | null
          tips?: string[]
          title?: string
          type?: Database["public"]["Enums"]["opportunity_type"]
          updated_at?: string
          what_you_get?: string | null
          who_can_apply?: string[]
        }
        Relationships: []
      }
      opportunity_terms: {
        Row: {
          opportunity_id: string
          term_id: string
        }
        Insert: {
          opportunity_id: string
          term_id: string
        }
        Update: {
          opportunity_id?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_terms_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_terms_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_episodes: {
        Row: {
          episode_id: string
          id: string
          organisation_id: string
          role: string
        }
        Insert: {
          episode_id: string
          id?: string
          organisation_id: string
          role?: string
        }
        Update: {
          episode_id?: string
          id?: string
          organisation_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_episodes_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_episodes_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_events: {
        Row: {
          event_id: string
          id: string
          organisation_id: string
          role: string
        }
        Insert: {
          event_id: string
          id?: string
          organisation_id: string
          role?: string
        }
        Update: {
          event_id?: string
          id?: string
          organisation_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_events_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_opportunities: {
        Row: {
          id: string
          opportunity_id: string
          organisation_id: string
          role: string
        }
        Insert: {
          id?: string
          opportunity_id: string
          organisation_id: string
          role?: string
        }
        Update: {
          id?: string
          opportunity_id?: string
          organisation_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_opportunities_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_people: {
        Row: {
          ended_on: string | null
          id: string
          is_current: boolean
          organisation_id: string
          person_id: string
          role: string
          started_on: string | null
        }
        Insert: {
          ended_on?: string | null
          id?: string
          is_current?: boolean
          organisation_id: string
          person_id: string
          role?: string
          started_on?: string | null
        }
        Update: {
          ended_on?: string | null
          id?: string
          is_current?: boolean
          organisation_id?: string
          person_id?: string
          role?: string
          started_on?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organisation_people_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_people_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_relations: {
        Row: {
          created_at: string
          from_org_id: string
          id: string
          note: string | null
          relation: Database["public"]["Enums"]["org_relation"]
          to_org_id: string
        }
        Insert: {
          created_at?: string
          from_org_id: string
          id?: string
          note?: string | null
          relation: Database["public"]["Enums"]["org_relation"]
          to_org_id: string
        }
        Update: {
          created_at?: string
          from_org_id?: string
          id?: string
          note?: string | null
          relation?: Database["public"]["Enums"]["org_relation"]
          to_org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_relations_from_org_id_fkey"
            columns: ["from_org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_relations_to_org_id_fkey"
            columns: ["to_org_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_terms: {
        Row: {
          organisation_id: string
          term_id: string
        }
        Insert: {
          organisation_id: string
          term_id: string
        }
        Update: {
          organisation_id?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_terms_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organisation_terms_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      organisation_trials: {
        Row: {
          created_at: string
          id: string
          nct_id: string
          organisation_id: string
          phase: string | null
          refreshed_at: string
          sponsor: string | null
          start_date: string | null
          status: string | null
          title: string
        }
        Insert: {
          created_at?: string
          id?: string
          nct_id: string
          organisation_id: string
          phase?: string | null
          refreshed_at?: string
          sponsor?: string | null
          start_date?: string | null
          status?: string | null
          title: string
        }
        Update: {
          created_at?: string
          id?: string
          nct_id?: string
          organisation_id?: string
          phase?: string | null
          refreshed_at?: string
          sponsor?: string | null
          start_date?: string | null
          status?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_trials_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          brand_accent: string | null
          brand_cover_urls: Json
          brand_dark: string | null
          brand_fetch_reason: string | null
          brand_fetch_status: string | null
          brand_fetched_at: string | null
          brand_light: string | null
          brand_logo_dark_url: string | null
          brand_logo_light_url: string | null
          business_id: string | null
          city: string | null
          company_form: string | null
          contact_email: string | null
          contact_email_public: boolean
          cover_image_flag: string | null
          cover_image_pending_url: string | null
          cover_image_status: string
          cover_image_url: string | null
          cover_page_title: string | null
          created_at: string
          created_by: string | null
          description: string | null
          founded_year: number | null
          geocoded_at: string | null
          id: string
          image_source: string | null
          image_source_url: string | null
          image_uploaded_by: string | null
          last_checked: string | null
          latitude: number | null
          linkedin_url: string | null
          logo_api_image_source_url: string | null
          logo_check_error: string | null
          logo_checked_at: string | null
          logo_choice: string
          logo_image_source: string | null
          logo_image_source_url: string | null
          logo_manual_required: boolean
          logo_resolved_url: string | null
          logo_shared_from: string | null
          logo_status: string
          logo_tone: string
          logo_uploaded_by: string | null
          logo_url: string | null
          longitude: number | null
          main_business_line: string | null
          name: string
          news_feed_url: string | null
          news_fetched_at: string | null
          news_items: Json | null
          offer_chips: string[]
          openalex_id: string | null
          openalex_name: string | null
          prominence: number
          published_at: string | null
          registration_date: string | null
          registry_fetched_at: string | null
          research: Json | null
          research_fetched_at: string | null
          short_description: string | null
          slug: string
          source_url: string | null
          status: Database["public"]["Enums"]["entry_status"]
          ticket_max_eur: number | null
          ticket_min_eur: number | null
          trials_fetched_at: string | null
          type: Database["public"]["Enums"]["organisation_type"]
          updated_at: string
          video_source_url: string | null
          video_url: string | null
          website: string | null
          website_health_checked_at: string | null
          website_health_reason: string | null
          website_health_status: string | null
          website_health_title: string | null
        }
        Insert: {
          brand_accent?: string | null
          brand_cover_urls?: Json
          brand_dark?: string | null
          brand_fetch_reason?: string | null
          brand_fetch_status?: string | null
          brand_fetched_at?: string | null
          brand_light?: string | null
          brand_logo_dark_url?: string | null
          brand_logo_light_url?: string | null
          business_id?: string | null
          city?: string | null
          company_form?: string | null
          contact_email?: string | null
          contact_email_public?: boolean
          cover_image_flag?: string | null
          cover_image_pending_url?: string | null
          cover_image_status?: string
          cover_image_url?: string | null
          cover_page_title?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          founded_year?: number | null
          geocoded_at?: string | null
          id?: string
          image_source?: string | null
          image_source_url?: string | null
          image_uploaded_by?: string | null
          last_checked?: string | null
          latitude?: number | null
          linkedin_url?: string | null
          logo_api_image_source_url?: string | null
          logo_check_error?: string | null
          logo_checked_at?: string | null
          logo_choice?: string
          logo_image_source?: string | null
          logo_image_source_url?: string | null
          logo_manual_required?: boolean
          logo_resolved_url?: string | null
          logo_shared_from?: string | null
          logo_status?: string
          logo_tone?: string
          logo_uploaded_by?: string | null
          logo_url?: string | null
          longitude?: number | null
          main_business_line?: string | null
          name: string
          news_feed_url?: string | null
          news_fetched_at?: string | null
          news_items?: Json | null
          offer_chips?: string[]
          openalex_id?: string | null
          openalex_name?: string | null
          prominence?: number
          published_at?: string | null
          registration_date?: string | null
          registry_fetched_at?: string | null
          research?: Json | null
          research_fetched_at?: string | null
          short_description?: string | null
          slug: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          ticket_max_eur?: number | null
          ticket_min_eur?: number | null
          trials_fetched_at?: string | null
          type: Database["public"]["Enums"]["organisation_type"]
          updated_at?: string
          video_source_url?: string | null
          video_url?: string | null
          website?: string | null
          website_health_checked_at?: string | null
          website_health_reason?: string | null
          website_health_status?: string | null
          website_health_title?: string | null
        }
        Update: {
          brand_accent?: string | null
          brand_cover_urls?: Json
          brand_dark?: string | null
          brand_fetch_reason?: string | null
          brand_fetch_status?: string | null
          brand_fetched_at?: string | null
          brand_light?: string | null
          brand_logo_dark_url?: string | null
          brand_logo_light_url?: string | null
          business_id?: string | null
          city?: string | null
          company_form?: string | null
          contact_email?: string | null
          contact_email_public?: boolean
          cover_image_flag?: string | null
          cover_image_pending_url?: string | null
          cover_image_status?: string
          cover_image_url?: string | null
          cover_page_title?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          founded_year?: number | null
          geocoded_at?: string | null
          id?: string
          image_source?: string | null
          image_source_url?: string | null
          image_uploaded_by?: string | null
          last_checked?: string | null
          latitude?: number | null
          linkedin_url?: string | null
          logo_api_image_source_url?: string | null
          logo_check_error?: string | null
          logo_checked_at?: string | null
          logo_choice?: string
          logo_image_source?: string | null
          logo_image_source_url?: string | null
          logo_manual_required?: boolean
          logo_resolved_url?: string | null
          logo_shared_from?: string | null
          logo_status?: string
          logo_tone?: string
          logo_uploaded_by?: string | null
          logo_url?: string | null
          longitude?: number | null
          main_business_line?: string | null
          name?: string
          news_feed_url?: string | null
          news_fetched_at?: string | null
          news_items?: Json | null
          offer_chips?: string[]
          openalex_id?: string | null
          openalex_name?: string | null
          prominence?: number
          published_at?: string | null
          registration_date?: string | null
          registry_fetched_at?: string | null
          research?: Json | null
          research_fetched_at?: string | null
          short_description?: string | null
          slug?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          ticket_max_eur?: number | null
          ticket_min_eur?: number | null
          trials_fetched_at?: string | null
          type?: Database["public"]["Enums"]["organisation_type"]
          updated_at?: string
          video_source_url?: string | null
          video_url?: string | null
          website?: string | null
          website_health_checked_at?: string | null
          website_health_reason?: string | null
          website_health_status?: string | null
          website_health_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organisations_logo_shared_from_fkey"
            columns: ["logo_shared_from"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          bio: string | null
          contact_email: string | null
          contact_email_public: boolean
          created_at: string
          created_by: string | null
          expertise_note: string | null
          full_name: string
          headline: string | null
          id: string
          last_checked: string | null
          linkedin_url: string | null
          open_to: Database["public"]["Enums"]["open_to_kind"][]
          photo_url: string | null
          published_at: string | null
          slug: string
          source_url: string | null
          status: Database["public"]["Enums"]["entry_status"]
          updated_at: string
        }
        Insert: {
          bio?: string | null
          contact_email?: string | null
          contact_email_public?: boolean
          created_at?: string
          created_by?: string | null
          expertise_note?: string | null
          full_name: string
          headline?: string | null
          id?: string
          last_checked?: string | null
          linkedin_url?: string | null
          open_to?: Database["public"]["Enums"]["open_to_kind"][]
          photo_url?: string | null
          published_at?: string | null
          slug: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          updated_at?: string
        }
        Update: {
          bio?: string | null
          contact_email?: string | null
          contact_email_public?: boolean
          created_at?: string
          created_by?: string | null
          expertise_note?: string | null
          full_name?: string
          headline?: string | null
          id?: string
          last_checked?: string | null
          linkedin_url?: string | null
          open_to?: Database["public"]["Enums"]["open_to_kind"][]
          photo_url?: string | null
          published_at?: string | null
          slug?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["entry_status"]
          updated_at?: string
        }
        Relationships: []
      }
      person_episodes: {
        Row: {
          episode_id: string
          id: string
          person_id: string
          role: string
        }
        Insert: {
          episode_id: string
          id?: string
          person_id: string
          role?: string
        }
        Update: {
          episode_id?: string
          id?: string
          person_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_episodes_episode_id_fkey"
            columns: ["episode_id"]
            isOneToOne: false
            referencedRelation: "episodes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_episodes_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      person_events: {
        Row: {
          event_id: string
          id: string
          person_id: string
          role: string
        }
        Insert: {
          event_id: string
          id?: string
          person_id: string
          role?: string
        }
        Update: {
          event_id?: string
          id?: string
          person_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_events_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      person_opportunities: {
        Row: {
          id: string
          opportunity_id: string
          person_id: string
          role: string
        }
        Insert: {
          id?: string
          opportunity_id: string
          person_id: string
          role?: string
        }
        Update: {
          id?: string
          opportunity_id?: string
          person_id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_opportunities_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
        ]
      }
      person_terms: {
        Row: {
          person_id: string
          term_id: string
        }
        Insert: {
          person_id: string
          term_id: string
        }
        Update: {
          person_id?: string
          term_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "person_terms_person_id_fkey"
            columns: ["person_id"]
            isOneToOne: false
            referencedRelation: "people"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "person_terms_term_id_fkey"
            columns: ["term_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          contact_email: string | null
          id: number
          instagram_url: string | null
          linkedin_url: string | null
          podcast_themes: string[]
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          id?: number
          instagram_url?: string | null
          linkedin_url?: string | null
          podcast_themes?: string[]
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          id?: number
          instagram_url?: string | null
          linkedin_url?: string | null
          podcast_themes?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          admin_note: string | null
          consent_at: string | null
          created_at: string
          email: string | null
          entry_id: string | null
          entry_kind: Database["public"]["Enums"]["entry_kind"] | null
          id: string
          message: string | null
          name: string | null
          organisation_name: string | null
          payload: Json
          proposed_url: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["submission_status"]
          type: Database["public"]["Enums"]["submission_type"]
          updated_at: string
        }
        Insert: {
          admin_note?: string | null
          consent_at?: string | null
          created_at?: string
          email?: string | null
          entry_id?: string | null
          entry_kind?: Database["public"]["Enums"]["entry_kind"] | null
          id?: string
          message?: string | null
          name?: string | null
          organisation_name?: string | null
          payload?: Json
          proposed_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          type: Database["public"]["Enums"]["submission_type"]
          updated_at?: string
        }
        Update: {
          admin_note?: string | null
          consent_at?: string | null
          created_at?: string
          email?: string | null
          entry_id?: string | null
          entry_kind?: Database["public"]["Enums"]["entry_kind"] | null
          id?: string
          message?: string | null
          name?: string | null
          organisation_name?: string | null
          payload?: Json
          proposed_url?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["submission_status"]
          type?: Database["public"]["Enums"]["submission_type"]
          updated_at?: string
        }
        Relationships: []
      }
      systole_waitlist: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      terms: {
        Row: {
          created_at: string
          id: string
          kind: Database["public"]["Enums"]["term_kind"]
          name: string
          parent_id: string | null
          slug: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          kind: Database["public"]["Enums"]["term_kind"]
          name: string
          parent_id?: string | null
          slug: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          kind?: Database["public"]["Enums"]["term_kind"]
          name?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "terms_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "terms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_import_csv_row: {
        Args: {
          _entity: string
          _organisation_id?: string
          _tags: Json
          _values: Json
        }
        Returns: Json
      }
      asset_domain: { Args: { _url: string }; Returns: string }
      asset_on_domain: {
        Args: { _url: string; _website: string }
        Returns: boolean
      }
      entry_is_published: {
        Args: { _id: string; _kind: Database["public"]["Enums"]["entry_kind"] }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_media_asset: { Args: { _url: string }; Returns: boolean }
      public_organisations: {
        Args: never
        Returns: {
          city: string
          contact_email: string
          description: string
          founded_year: number
          id: string
          last_checked: string
          linkedin_url: string
          logo_url: string
          name: string
          published_at: string
          short_description: string
          slug: string
          source_url: string
          ticket_max_eur: number
          ticket_min_eur: number
          type: Database["public"]["Enums"]["organisation_type"]
          updated_at: string
          website: string
        }[]
      }
      public_people: {
        Args: never
        Returns: {
          bio: string
          contact_email: string
          expertise_note: string
          full_name: string
          headline: string
          id: string
          last_checked: string
          linkedin_url: string
          open_to: Database["public"]["Enums"]["open_to_kind"][]
          photo_url: string
          published_at: string
          slug: string
          source_url: string
          updated_at: string
        }[]
      }
      public_site_settings: {
        Args: never
        Returns: {
          contact_email: string
          instagram_url: string
          linkedin_url: string
          podcast_themes: string[]
        }[]
      }
    }
    Enums: {
      app_role: "admin"
      entry_kind:
        | "organisation"
        | "person"
        | "event"
        | "opportunity"
        | "episode"
        | "newsletter_issue"
        | "guide"
        | "glossary_term"
      entry_status: "draft" | "published" | "archived"
      event_format: "in_person" | "online" | "hybrid"
      event_type:
        | "conference"
        | "pitch_competition"
        | "hackathon"
        | "demo_day"
        | "meetup"
        | "workshop"
        | "volunteering"
      guide_level: "beginner" | "intermediate"
      open_to_kind:
        | "advising"
        | "mentoring"
        | "intros"
        | "investing"
        | "validation"
      opportunity_type:
        | "programme_intake"
        | "grant_call"
        | "competition"
        | "job"
      org_relation:
        | "invested_in"
        | "spun_out_of"
        | "acquired"
        | "partner_of"
        | "part_of"
      organisation_type:
        | "startup"
        | "investor"
        | "incubator"
        | "accelerator"
        | "funder"
        | "research_group"
        | "lab"
        | "hospital_innovation_unit"
        | "service_provider"
        | "university"
        | "public_agency"
        | "patient_organisation"
        | "community"
        | "care_provider"
      submission_status: "new" | "in_review" | "accepted" | "rejected" | "done"
      submission_type: "new_entry" | "correction" | "contact" | "podcast_guest"
      term_kind:
        | "field"
        | "sub_area"
        | "country"
        | "stage"
        | "area"
        | "journey_step"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin"],
      entry_kind: [
        "organisation",
        "person",
        "event",
        "opportunity",
        "episode",
        "newsletter_issue",
        "guide",
        "glossary_term",
      ],
      entry_status: ["draft", "published", "archived"],
      event_format: ["in_person", "online", "hybrid"],
      event_type: [
        "conference",
        "pitch_competition",
        "hackathon",
        "demo_day",
        "meetup",
        "workshop",
        "volunteering",
      ],
      guide_level: ["beginner", "intermediate"],
      open_to_kind: [
        "advising",
        "mentoring",
        "intros",
        "investing",
        "validation",
      ],
      opportunity_type: [
        "programme_intake",
        "grant_call",
        "competition",
        "job",
      ],
      org_relation: [
        "invested_in",
        "spun_out_of",
        "acquired",
        "partner_of",
        "part_of",
      ],
      organisation_type: [
        "startup",
        "investor",
        "incubator",
        "accelerator",
        "funder",
        "research_group",
        "lab",
        "hospital_innovation_unit",
        "service_provider",
        "university",
        "public_agency",
        "patient_organisation",
        "community",
        "care_provider",
      ],
      submission_status: ["new", "in_review", "accepted", "rejected", "done"],
      submission_type: ["new_entry", "correction", "contact", "podcast_guest"],
      term_kind: [
        "field",
        "sub_area",
        "country",
        "stage",
        "area",
        "journey_step",
      ],
    },
  },
} as const
