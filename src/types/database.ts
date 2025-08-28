export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      barracas: {
        Row: {
          id: string // UUID format
          name: string
          barraca_number: string | null
          location: string
          coordinates: Json
          typical_hours: string
          description: string
          photos: Json // { horizontal: string[]; vertical: string[] }
          menu_preview: string[]
          contact: Json
          amenities: string[]
          weather_dependent: boolean
          partnered: boolean
          weekend_hours_enabled: boolean
          weekend_hours_schedule: Json | null
          manual_status: string | null
          special_admin_override: boolean
          special_admin_override_expires: string | null
          rating: number | null
          cta_buttons: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string // UUID format
          name: string
          barraca_number?: string | null
          location: string
          coordinates: Json
          typical_hours: string
          description: string
          photos: Json // { horizontal: string[]; vertical: string[] }
          menu_preview: string[]
          contact: Json
          amenities: string[]
          weather_dependent?: boolean
          partnered?: boolean
          weekend_hours_enabled?: boolean
          weekend_hours_schedule?: Json | null
          manual_status?: string | null
          special_admin_override?: boolean
          special_admin_override_expires?: string | null
          rating?: number | null
          cta_buttons?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string // UUID format
          name?: string
          barraca_number?: string | null
          location?: string
          coordinates?: Json
          typical_hours?: string
          description?: string
          photos?: Json // { horizontal: string[]; vertical: string[] }
          menu_preview?: string[]
          contact?: Json
          amenities?: string[]
          weather_dependent?: boolean
          partnered?: boolean
          weekend_hours_enabled?: boolean
          weekend_hours_schedule?: Json | null
          manual_status?: string | null
          special_admin_override?: boolean
          special_admin_override_expires?: string | null
          rating?: number | null
          cta_buttons?: Json
          created_at?: string
          updated_at?: string
        }
      }
      admin_users: {
        Row: {
          id: string
          email: string
          password_hash: string
          role: string
          name: string | null
          last_login: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          role: string
          name?: string | null
          last_login?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          password_hash?: string
          role?: string
          name?: string | null
          last_login?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      email_subscriptions: {
        Row: {
          id: string
          email: string
          subscribed_at: string
          preferences: Json
          is_active: boolean
          unsubscribe_token: string
        }
        Insert: {
          id?: string
          email: string
          subscribed_at?: string
          preferences?: Json
          is_active?: boolean
          unsubscribe_token?: string
        }
        Update: {
          id?: string
          email?: string
          subscribed_at?: string
          preferences?: Json
          is_active?: boolean
          unsubscribe_token?: string
        }
      }
      stories: {
        Row: {
          id: string
          barraca_id: string // UUID format
          media_url: string
          media_type: string
          caption: string | null
          duration: number | null
          created_at: string
          expires_at: string
          is_active: boolean
        }
        Insert: {
          id?: string
          barraca_id: string // UUID format
          media_url: string
          media_type: string
          caption?: string | null
          duration?: number | null
          created_at?: string
          expires_at?: string
          is_active?: boolean
        }
        Update: {
          id?: string
          barraca_id?: string // UUID format
          media_url?: string
          media_type?: string
          caption?: string | null
          duration?: number | null
          created_at?: string
          expires_at?: string
          is_active?: boolean
        }
      }
      visitor_analytics: {
        Row: {
          id: string
          visitor_id: string
          first_visit: string
          last_visit: string
          visit_count: number
          user_agent: string | null
          referrer: string | null
          country: string | null
          city: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          visitor_id: string
          first_visit?: string
          last_visit?: string
          visit_count?: number
          user_agent?: string | null
          referrer?: string | null
          country?: string | null
          city?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          visitor_id?: string
          first_visit?: string
          last_visit?: string
          visit_count?: number
          user_agent?: string | null
          referrer?: string | null
          country?: string | null
          city?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      weather_cache: {
        Row: {
          id: string
          location: string
          temperature: number | null
          feels_like: number | null
          humidity: number | null
          wind_speed: number | null
          wind_direction: number | null
          description: string | null
          icon: string | null
          beach_conditions: string | null
          cached_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          location: string
          temperature?: number | null
          feels_like?: number | null
          humidity?: number | null
          wind_speed?: number | null
          wind_direction?: number | null
          description?: string | null
          icon?: string | null
          beach_conditions?: string | null
          cached_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          location?: string
          temperature?: number | null
          feels_like?: number | null
          humidity?: number | null
          wind_speed?: number | null
          wind_direction?: number | null
          description?: string | null
          icon?: string | null
          beach_conditions?: string | null
          cached_at?: string
          expires_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_nearby_barracas: {
        Args: {
          user_lat: number
          user_lng: number
          radius_km?: number
          limit_count?: number
        }
        Returns: {
          id: string // UUID format
          name: string
          location: string
          is_open: boolean
          distance_km: number
        }[]
      }
      search_barracas: {
        Args: {
          search_query: string
          location_filter?: string
          open_only?: boolean
          limit_count?: number
        }
        Returns: {
          id: string // UUID format
          name: string
          location: string
          is_open: boolean
          rank: number
        }[]
      }
      cleanup_expired_stories: {
        Args: {}
        Returns: void
      }
      cleanup_expired_weather: {
        Args: {}
        Returns: void
      }
      is_barraca_open_now: {
        Args: {
          barraca_id_param: string // UUID format
          check_time?: string
        }
        Returns: boolean
      }
      is_weekend_hours_active: {
        Args: {
          barraca_id_param: string // UUID format
          check_time?: string
        }
        Returns: boolean
      }
      set_weekend_hours: {
        Args: {
          barraca_id_param: string // UUID format
          friday_open?: string
          friday_close?: string
          saturday_open?: string
          saturday_close?: string
          sunday_open?: string
          sunday_close?: string
        }
        Returns: void
      }
      disable_weekend_hours: {
        Args: {
          barraca_id_param: string // UUID format
        }
        Returns: void
      }
      special_admin_open_barraca: {
        Args: {
          barraca_id_param: string // UUID format
          duration_hours?: number
        }
        Returns: boolean
      }
      special_admin_close_barraca: {
        Args: {
          barraca_id_param: string // UUID format
        }
        Returns: boolean
      }
      get_special_admin_overrides: {
        Args: {}
        Returns: {
          barraca_id: string // UUID format
          barraca_name: string
          override_expires: string
          hours_remaining: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}