import { supabase, handleSupabaseError } from '../lib/supabase'
import type { Barraca, BarracaPhotos } from '../types'
import type { Database } from '../types/database'
import { v4 as uuidv4 } from 'uuid'


type BarracaRow = Database['public']['Tables']['barracas']['Row']
type BarracaInsert = Database['public']['Tables']['barracas']['Insert']
type BarracaUpdate = Database['public']['Tables']['barracas']['Update']
type Json = Database['public']['Tables']['barracas']['Row']['cta_buttons']

// Sorting helpers
const parseBarracaNumber = (num?: string): number => {
  if (!num) return Number.POSITIVE_INFINITY;
  const match = String(num).match(/\d+/);
  if (!match) return Number.POSITIVE_INFINITY;
  return parseInt(match[0], 10);
};

const compareBarracas = (a: Barraca, b: Barraca): number => {
  // 1) Open first
  if (a.isOpen !== b.isOpen) {
    return a.isOpen ? -1 : 1;
  }
  // 2) Partnered next
  if (a.partnered !== b.partnered) {
    return a.partnered ? -1 : 1;
  }
  // 3) Rating desc
  const aRating = a.rating || 0;
  const bRating = b.rating || 0;
  if (aRating !== bRating) {
    return bRating - aRating;
  }
  // 4) Barraca number asc
  const aNum = parseBarracaNumber(a.barracaNumber);
  const bNum = parseBarracaNumber(b.barracaNumber);
  if (aNum !== bNum) {
    return aNum - bNum;
  }
  // Stable fallback by name
  return a.name.localeCompare(b.name);
};

// Transform database row to application type
const transformBarracaFromDB = (row: BarracaRow, isOpen?: boolean | null): Barraca => ({
  id: row.id,
  name: row.name,
  barracaNumber: row.barraca_number || undefined,
  location: row.location,
  coordinates: row.coordinates as { lat: number; lng: number },
  isOpen: isOpen ?? false,
  typicalHours: row.typical_hours,
  description: row.description,
  photos: (row.photos as unknown as BarracaPhotos) || { horizontal: [], vertical: [] },
  menuPreview: row.menu_preview,
  contact: row.contact as any,
  amenities: row.amenities,
  weatherDependent: row.weather_dependent,
  partnered: row.partnered,
  weekendHoursEnabled: row.weekend_hours_enabled || false,
  weekendHours: row.weekend_hours_schedule as any,
  manualStatus: (row.manual_status as 'open' | 'closed' | 'undefined') || 'undefined',
  specialAdminOverride: row.special_admin_override || false,
  specialAdminOverrideExpires: row.special_admin_override_expires ? new Date(row.special_admin_override_expires) : null,
  rating: row.rating as 1 | 2 | 3 | undefined,
  ctaButtons: row.cta_buttons as any,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at)
})

// Transform application type to database insert
const transformBarracaToDB = (barraca: Omit<Barraca, 'id' | 'createdAt' | 'updatedAt'>): BarracaInsert => ({
  id: uuidv4(), // Generate UUID for new barracas using uuid library
  name: barraca.name,
  barraca_number: barraca.barracaNumber || null,
  location: barraca.location,
  coordinates: barraca.coordinates,
  typical_hours: barraca.typicalHours,
  description: barraca.description,
  photos: barraca.photos,
  menu_preview: barraca.menuPreview,
  contact: barraca.contact,
  amenities: barraca.amenities,
  weather_dependent: barraca.weatherDependent,
  partnered: barraca.partnered,
  weekend_hours_enabled: barraca.weekendHoursEnabled,
  special_admin_override: barraca.specialAdminOverride,
  special_admin_override_expires: barraca.specialAdminOverrideExpires?.toISOString() || null,
  rating: barraca.rating || null,
  cta_buttons: (barraca.ctaButtons as unknown as Json) || []
})

// Helper to validate UUIDs
const isValidUUID = (id: string): boolean => {
  // Simple UUID v4 regex
  return /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(id);
};

export class BarracaService {
  // Get all barracas with pagination and optional filters (optimized)
  static async getAll(
    page: number = 1, 
    pageSize: number = 12,
    filters?: {
      query?: string;
      location?: string;
      locations?: string[];
      status?: 'all' | 'open' | 'closed';
      rating?: number;
    }
  ): Promise<{ barracas: Barraca[], total: number }> {
    try {
      console.log('🔄 Attempting to use optimized database function...');
      
      // Use the optimized database function that computes open status in a single query
      const { data, error } = await supabase.rpc('get_barracas_with_open_status', {
        page_number: page,
        page_size: pageSize,
        search_query: filters?.query || null,
        location_filter: filters?.location || null,
        location_filters: filters?.locations || null,
        status_filter: filters?.status || 'all',
        rating_filter: filters?.rating || null
      });

      if (error) {
        console.error('❌ Error with optimized function:', error);
        console.log('🔄 Falling back to original method...');
        return this.getAllFallback(page, pageSize, filters);
      }

      if (!data || data.length === 0) {
        console.log('📭 No data returned from optimized function');
        return { barracas: [], total: 0 };
      }

      console.log('✅ Optimized function successful, processing data...');

      // Transform the data (open status is already computed)
      const barracas = data.map((row: any) => {
        // Handle non-UUID IDs
        let isOpen: boolean | null = row.is_open;
        if (!isValidUUID(row.id)) {
          if (!row.partnered) {
            isOpen = null;
          } else {
            isOpen = false;
          }
          console.warn(`Non-UUID barraca id: ${row.id}`);
        }
        
        return transformBarracaFromDB(row, isOpen);
      });

      // Sort by open, partnered, rating, number
      barracas.sort(compareBarracas);

      // Get total count from the first row (all rows have the same total_count)
      const total = data[0]?.total_count || 0;

      console.log(`✅ Successfully loaded ${barracas.length} barracas (total: ${total})`);

      return {
        barracas,
        total
      };
    } catch (error) {
      console.error('❌ Error in optimized getAll:', error);
      console.log('🔄 Falling back to original method...');
      return this.getAllFallback(page, pageSize, filters);
    }
  }

  // Fallback method using the original approach
  private static async getAllFallback(
    page: number = 1, 
    pageSize: number = 12,
    filters?: {
      query?: string;
      location?: string;
      locations?: string[];
      status?: 'all' | 'open' | 'closed';
      rating?: number;
    }
  ): Promise<{ barracas: Barraca[], total: number }> {
    try {
      console.log('🔄 Using fallback method...');
      
      let query = supabase.from('barracas').select('*', { count: 'exact' });

      // Apply filters
      if (filters?.query) {
        query = query.or(`name.ilike.%${filters.query}%,barraca_number.ilike.%${filters.query}%,location.ilike.%${filters.query}%`);
      }

      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters?.locations && filters.locations.length > 0) {
        const locationConditions = filters.locations.map(loc => `location.ilike.%${loc}%`).join(',');
        query = query.or(locationConditions);
      }

      if (filters?.rating) {
        query = query.eq('rating', filters.rating);
      }

      // Calculate pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Get paginated data with filters
      const { data, count, error } = await query
        .order('partnered', { ascending: false })
        .order('name')
        .range(from, to);

      if (error) {
        handleSupabaseError(error, 'getAll fallback barracas');
      }

      if (!data || data.length === 0) {
        return { barracas: [], total: count || 0 };
      }

      // Get open status for each barraca (parallelized)
      const barracasWithOpenStatus = await Promise.all((data || []).map(async (row: any) => {
        let isOpen: boolean | null = false;
        if (isValidUUID(row.id)) {
          isOpen = await BarracaService.getOpenStatus(row.id);
        } else {
          if (!row.partnered) {
            isOpen = null;
          } else {
            isOpen = false;
          }
          console.warn(`Skipping open status check for non-UUID barraca id: ${row.id}`);
        }
        return transformBarracaFromDB(row, isOpen);
      }));

      // Apply status filter after getting open status
      let filteredBarracas = barracasWithOpenStatus;
      if (filters?.status && filters.status !== 'all') {
        filteredBarracas = barracasWithOpenStatus.filter(barraca => {
          if (filters.status === 'open') {
            return barraca.isOpen === true;
          } else if (filters.status === 'closed') {
            return barraca.isOpen === false;
          }
          return true;
        });
      }

      // Sort by open, partnered, rating, number
      filteredBarracas.sort(compareBarracas);

      console.log(`✅ Fallback method loaded ${filteredBarracas.length} barracas (total: ${count || 0})`);

      return {
        barracas: filteredBarracas,
        total: count || 0
      };
    } catch (error) {
      console.error('❌ Error in fallback method:', error);
      throw error;
    }
  }

  // Get all barracas (backward compatibility)
  static async getAllUnpaginated(): Promise<Barraca[]> {
    const result = await this.getAll(1, 1000); // Large page size to get all
    return result.barracas;
  }

  // Lightweight method for grid view - only fetches essential columns
  static async getGridData(
    page: number = 1,
    pageSize: number = 12,
    filters?: {
      query?: string;
      location?: string;
      locations?: string[];
      status?: 'all' | 'open' | 'closed';
      rating?: number;
    }
  ): Promise<{ barracas: Barraca[], total: number }> {
    try {
      // Use the optimized database function but with a simpler version for grid
      const { data, error } = await supabase.rpc('get_barracas_with_open_status', {
        page_number: page,
        page_size: pageSize,
        search_query: filters?.query || null,
        location_filter: filters?.location || null,
        location_filters: filters?.locations || null,
        status_filter: filters?.status || 'all',
        rating_filter: filters?.rating || null
      });

      if (error) {
        handleSupabaseError(error, 'getGridData barracas');
      }

      if (!data || data.length === 0) {
        return { barracas: [], total: 0 };
      }

      // Transform with minimal data for grid view
      const barracas = data.map((row: any) => {
        let isOpen: boolean | null = row.is_open;
        if (!isValidUUID(row.id)) {
          if (!row.partnered) {
            isOpen = null;
          } else {
            isOpen = false;
          }
        }
        
        return transformBarracaFromDB(row, isOpen);
      });

      // Sort by open, partnered, rating, number
      barracas.sort(compareBarracas);

      const total = data[0]?.total_count || 0;

      return { barracas, total };
    } catch (error) {
      console.error('Error fetching grid data:', error);
      throw error;
    }
  }

  // Get barraca by ID
  static async getById(id: string): Promise<Barraca | null> {
    try {
      const { data, error } = await supabase
        .from('barracas')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return null // Not found
        }
        handleSupabaseError(error, 'getById barraca')
      }

      if (data) {
        let isOpen: boolean | null = false;
        if (isValidUUID(data.id)) {
          isOpen = await BarracaService.getOpenStatus(data.id);
        } else {
          if (!data.partnered) {
            isOpen = null;
          } else {
            isOpen = false;
          }
          console.warn(`Skipping open status check for non-UUID barraca id: ${data.id}`);
        }
        return transformBarracaFromDB(data, isOpen)
      }
      return null
    } catch (error) {
      console.error('Error fetching barraca by ID:', error)
      throw error
    }
  }

  // Search barracas with filters
  static async search(filters: {
    query?: string
    location?: string
    openOnly?: boolean
    limit?: number
  }): Promise<Barraca[]> {
    try {
      let query = supabase.from('barracas').select('*')

      // Apply filters - openOnly is now handled by the database function
      if (filters.location) {
        query = query.ilike('location', `%${filters.location}%`)
      }

      // For text search, use the database function for better performance
      if (filters.query) {
        const { data, error } = await supabase.rpc('search_barracas', {
          search_query: filters.query,
          location_filter: filters.location || null,
          open_only: filters.openOnly || false,
          limit_count: filters.limit || 20
        })

        if (error) {
          handleSupabaseError(error, 'search barracas')
        }

        // Get full barraca data for search results
        if (data && data.length > 0) {
          const ids = data.map((item: { id: string }) => item.id)
          const { data: fullData, error: fullError } = await supabase
            .from('barracas')
            .select('*')
            .in('id', ids)

          if (fullError) {
            handleSupabaseError(fullError, 'get full barraca data')
          }

          // Sort by search rank
        const sortedData = fullData?.sort((a: BarracaRow, b: BarracaRow) => {
          const aRank = data.find((item: { id: string; rank: number }) => item.id === a.id)?.rank || 0
          const bRank = data.find((item: { id: string; rank: number }) => item.id === b.id)?.rank || 0
          return bRank - aRank
        })

          // Get open status for each barraca
          const barracasWithOpenStatus = []
          for (const row of sortedData || []) {
            let isOpen: boolean | null = false;
            if (isValidUUID(row.id)) {
              isOpen = await BarracaService.getOpenStatus(row.id);
            } else {
              if (!row.partnered) {
                isOpen = null;
              } else {
                isOpen = false;
              }
              console.warn(`Skipping open status check for non-UUID barraca id: ${row.id}`);
            }
            barracasWithOpenStatus.push(transformBarracaFromDB(row, isOpen));
          }
          
          // Sort by partnered status first, then by search rank
          barracasWithOpenStatus.sort((a, b) => {
            if (a.partnered !== b.partnered) {
              return a.partnered ? -1 : 1;
            }
            // Within each partnered group, maintain search rank order
            const aRank = data.find((item: { id: string; rank: number }) => item.id === a.id)?.rank || 0;
            const bRank = data.find((item: { id: string; rank: number }) => item.id === b.id)?.rank || 0;
            return bRank - aRank;
          });
          
          return barracasWithOpenStatus
        }

        return []
      }

      // Regular query without text search
      if (filters.limit) {
        query = query.limit(filters.limit)
      }

      query = query.order('name')

      const { data, error } = await query

      if (error) {
        handleSupabaseError(error, 'search barracas')
      }

      // Get open status for each barraca
      const barracasWithOpenStatus = []
      for (const row of data || []) {
        let isOpen: boolean | null = false;
        if (isValidUUID(row.id)) {
          isOpen = await BarracaService.getOpenStatus(row.id);
        } else {
          if (!row.partnered) {
            isOpen = null;
          } else {
            isOpen = false;
          }
          console.warn(`Skipping open status check for non-UUID barraca id: ${row.id}`);
        }
        barracasWithOpenStatus.push(transformBarracaFromDB(row, isOpen));
      }
      return barracasWithOpenStatus
    } catch (error) {
      console.error('Error searching barracas:', error)
      throw error
    }
  }

  // Get nearby barracas using PostGIS
  static async getNearby(
    lat: number,
    lng: number,
    radiusKm: number = 5,
    limit: number = 20
  ): Promise<Barraca[]> {
    try {
      const { data, error } = await supabase.rpc('get_nearby_barracas', {
        user_lat: lat,
        user_lng: lng,
        radius_km: radiusKm,
        limit_count: limit
      })

      if (error) {
        handleSupabaseError(error, 'get nearby barracas')
      }

      // Get full barraca data
      if (data && data.length > 0) {
        const ids = data.map((item: { id: string }) => item.id)
        const { data: fullData, error: fullError } = await supabase
          .from('barracas')
          .select('*')
          .in('id', ids)

        if (fullError) {
          handleSupabaseError(fullError, 'get full nearby barraca data')
        }

        // Sort by distance
        const sortedData = fullData?.sort((a: BarracaRow, b: BarracaRow) => {
          const aDistance = data.find((item: { id: string; distance_km: number }) => item.id === a.id)?.distance_km || 0
          const bDistance = data.find((item: { id: string; distance_km: number }) => item.id === b.id)?.distance_km || 0
          return aDistance - bDistance
        })

        // Get open status for each barraca
        const barracasWithOpenStatus = []
        for (const row of sortedData || []) {
          let isOpen: boolean | null = false;
          if (isValidUUID(row.id)) {
            isOpen = await BarracaService.getOpenStatus(row.id);
          } else {
            if (!row.partnered) {
              isOpen = null;
            } else {
              isOpen = false;
            }
            console.warn(`Skipping open status check for non-UUID barraca id: ${row.id}`);
          }
          barracasWithOpenStatus.push(transformBarracaFromDB(row, isOpen));
        }
        
        // Sort by partnered status first, then by distance
        barracasWithOpenStatus.sort((a, b) => {
          if (a.partnered !== b.partnered) {
            return a.partnered ? -1 : 1;
          }
          // Within each partnered group, maintain distance order
          const aDistance = data.find((item: { id: string; distance_km: number }) => item.id === a.id)?.distance_km || 0;
          const bDistance = data.find((item: { id: string; distance_km: number }) => item.id === b.id)?.distance_km || 0;
          return aDistance - bDistance;
        });
        
        return barracasWithOpenStatus
      }

      return []
    } catch (error) {
      console.error('Error getting nearby barracas:', error)
      throw error
    }
  }

  // Create new barraca
  static async create(barraca: Omit<Barraca, 'id' | 'createdAt' | 'updatedAt'>): Promise<Barraca> {
    try {
      const barracaData = transformBarracaToDB(barraca)

      const { data, error } = await supabase
        .from('barracas')
        .insert(barracaData)
        .select()
        .single()

      if (error) {
        handleSupabaseError(error, 'create barraca')
      }

      const isOpen = await BarracaService.getOpenStatus(data.id)
      return transformBarracaFromDB(data, isOpen)
    } catch (error) {
      console.error('Error creating barraca:', error)
      throw error
    }
  }

  // Update barraca
  static async update(id: string, updates: Partial<Barraca>): Promise<Barraca> {
    try {
      const updateData: BarracaUpdate = {}

      // Map updates to database fields
      if (updates.name !== undefined) updateData.name = updates.name
      if (updates.barracaNumber !== undefined) updateData.barraca_number = updates.barracaNumber || null
      if (updates.location !== undefined) updateData.location = updates.location
      if (updates.coordinates !== undefined) updateData.coordinates = updates.coordinates
      if (updates.typicalHours !== undefined) updateData.typical_hours = updates.typicalHours
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.photos !== undefined) updateData.photos = updates.photos
      if (updates.menuPreview !== undefined) updateData.menu_preview = updates.menuPreview
      if (updates.contact !== undefined) updateData.contact = updates.contact
      if (updates.amenities !== undefined) updateData.amenities = updates.amenities
      if (updates.weatherDependent !== undefined) updateData.weather_dependent = updates.weatherDependent
      if (updates.partnered !== undefined) updateData.partnered = updates.partnered
      if (updates.weekendHoursEnabled !== undefined) updateData.weekend_hours_enabled = updates.weekendHoursEnabled
      if (updates.specialAdminOverride !== undefined) updateData.special_admin_override = updates.specialAdminOverride
      if (updates.specialAdminOverrideExpires !== undefined) {
        updateData.special_admin_override_expires = updates.specialAdminOverrideExpires
          ? updates.specialAdminOverrideExpires.toISOString()
          : null
      }
      if (updates.rating !== undefined) updateData.rating = updates.rating || null
      if (updates.ctaButtons !== undefined) updateData.cta_buttons = updates.ctaButtons as unknown as Json

      const { data, error } = await supabase
        .from('barracas')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        handleSupabaseError(error, 'update barraca')
      }

      // Handle weekend hours via RPC functions if provided in updates
      try {
        if (updates.weekendHoursEnabled !== undefined) {
          if (updates.weekendHoursEnabled) {
            const fridayOpen = updates.weekendHours?.friday?.open;
            const fridayClose = updates.weekendHours?.friday?.close;
            const saturdayOpen = updates.weekendHours?.saturday?.open;
            const saturdayClose = updates.weekendHours?.saturday?.close;
            const sundayOpen = updates.weekendHours?.sunday?.open;
            const sundayClose = updates.weekendHours?.sunday?.close;
            await BarracaService.setWeekendHours(
              id,
              fridayOpen,
              fridayClose,
              saturdayOpen,
              saturdayClose,
              sundayOpen,
              sundayClose
            );
          } else {
            await BarracaService.disableWeekendHours(id);
          }
        }
      } catch (rpcError) {
        console.warn('Weekend hours RPC failed (non-fatal):', rpcError);
      }

      const isOpen = await BarracaService.getOpenStatus(data.id)
      return transformBarracaFromDB(data, isOpen)
    } catch (error) {
      console.error('Error updating barraca:', error)
      throw error
    }
  }

  // Delete barraca
  static async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('barracas')
        .delete()
        .eq('id', id)

      if (error) {
        handleSupabaseError(error, 'delete barraca')
      }
    } catch (error) {
      console.error('Error deleting barraca:', error)
      throw error
    }
  }

  // Get barracas by location
  static async getByLocation(location: string): Promise<Barraca[]> {
    try {
      const { data, error } = await supabase
        .from('barracas')
        .select('*')
        .ilike('location', `%${location}%`)
        .order('name')

      if (error) {
        handleSupabaseError(error, 'get barracas by location')
      }

      // Get open status for each barraca
      const barracasWithOpenStatus = []
      for (const row of data || []) {
        let isOpen: boolean | null = false;
        if (isValidUUID(row.id)) {
          isOpen = await BarracaService.getOpenStatus(row.id);
        } else {
          if (!row.partnered) {
            isOpen = null;
          } else {
            isOpen = false;
          }
          console.warn(`Skipping open status check for non-UUID barraca id: ${row.id}`);
        }
        barracasWithOpenStatus.push(transformBarracaFromDB(row, isOpen));
      }
      
      // Sort by partnered status first, then by name
      barracasWithOpenStatus.sort((a, b) => {
        if (a.partnered !== b.partnered) {
          return a.partnered ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      
      return barracasWithOpenStatus
    } catch (error) {
      console.error('Error getting barracas by location:', error)
      throw error
    }
  }

  // Get open barracas - now uses database function to determine open status
  static async getOpen(): Promise<Barraca[]> {
    try {
      // Get all barracas and filter by open status using the database function
      const { data, error } = await supabase
        .from('barracas')
        .select('*')
        .order('name')

      if (error) {
        handleSupabaseError(error, 'get all barracas for open filter')
      }

      // Filter to only open barracas using the database function
      const openBarracas = []
      for (const barraca of data || []) {
        if (!isValidUUID(barraca.id)) {
          // Non-UUIDs cannot be checked for open status
          console.warn(`Skipping open status check for non-UUID barraca id: ${barraca.id}`);
          continue;
        }
        const { data: isOpenData, error: isOpenError } = await supabase.rpc('is_barraca_open_now', {
          barraca_id_param: barraca.id
        })
        
        if (isOpenError) {
          console.error('Error checking if barraca is open:', isOpenError)
          continue
        }
        
        if (isOpenData) {
          openBarracas.push(barraca)
        }
      }

      // Get open status for each barraca
      const barracasWithOpenStatus = []
      for (const row of openBarracas) {
        let isOpen: boolean | null = false;
        if (isValidUUID(row.id)) {
          isOpen = await BarracaService.getOpenStatus(row.id);
        } else {
          if (!row.partnered) {
            isOpen = null;
          } else {
            isOpen = false;
          }
          console.warn(`Skipping open status check for non-UUID barraca id: ${row.id}`);
        }
        barracasWithOpenStatus.push(transformBarracaFromDB(row, isOpen));
      }
      
      // Sort by partnered status first, then by name
      barracasWithOpenStatus.sort((a, b) => {
        if (a.partnered !== b.partnered) {
          return a.partnered ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
      
      return barracasWithOpenStatus
    } catch (error) {
      console.error('Error getting open barracas:', error)
      throw error
    }
  }

  // Get open status for a barraca using the database function
  static async getOpenStatus(barracaId: string): Promise<boolean> {
    if (!isValidUUID(barracaId)) {
      console.warn(`getOpenStatus called with non-UUID id: ${barracaId}`);
      return false;
    }
    try {
      const { data, error } = await supabase.rpc('is_barraca_open_now', {
        barraca_id_param: barracaId
      })

      if (error) {
        // Handle the specific UUID/text type mismatch error
        if (error.message && error.message.includes('operator does not exist: text = uuid')) {
          console.warn(`UUID/text type mismatch for barraca ${barracaId}, treating as closed`);
          return false;
        }
        handleSupabaseError(error, 'get open status')
      }

      return data || false
    } catch (error) {
      console.error('Error getting open status:', error)
      // If it's a type mismatch error, return false instead of throwing
      if (error instanceof Error && error.message.includes('operator does not exist: text = uuid')) {
        console.warn(`UUID/text type mismatch for barraca ${barracaId}, treating as closed`);
        return false;
      }
      throw error
    }
  }

  // Subscribe to real-time changes
  static subscribeToChanges(callback: (payload: unknown) => void) {
    return supabase
      .channel('barracas-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'barracas'
        },
        (payload: unknown) => {
          console.log('Barraca change detected:', payload)
          callback(payload)
        }
      )
      .subscribe()
  }

  // Weekend Hours Management
  static async setWeekendHours(
    barracaId: string,
    fridayOpen?: string,
    fridayClose?: string,
    saturdayOpen?: string,
    saturdayClose?: string,
    sundayOpen?: string,
    sundayClose?: string
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('set_weekend_hours', {
        barraca_id_param: barracaId,
        friday_open: fridayOpen,
        friday_close: fridayClose,
        saturday_open: saturdayOpen,
        saturday_close: saturdayClose,
        sunday_open: sundayOpen,
        sunday_close: sundayClose
      })

      if (error) {
        handleSupabaseError(error, 'set weekend hours')
      }
    } catch (error) {
      console.error('Error setting weekend hours:', error)
      throw error
    }
  }

  static async disableWeekendHours(barracaId: string): Promise<void> {
    try {
      const { error } = await supabase.rpc('disable_weekend_hours', {
        barraca_id_param: barracaId
      })

      if (error) {
        handleSupabaseError(error, 'disable weekend hours')
      }
    } catch (error) {
      console.error('Error disabling weekend hours:', error)
      throw error
    }
  }

  // Special Admin Functions
  static async specialAdminOpenBarraca(barracaId: string, durationHours: number = 24): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('special_admin_open_barraca', {
        barraca_id_param: barracaId,
        duration_hours: durationHours
      })

      if (error) {
        handleSupabaseError(error, 'special admin open barraca')
      }

      return data || false
    } catch (error) {
      console.error('Error opening barraca with special admin:', error)
      throw error
    }
  }

  static async specialAdminCloseBarraca(barracaId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('special_admin_close_barraca', {
        barraca_id_param: barracaId
      })

      if (error) {
        handleSupabaseError(error, 'special admin close barraca')
      }

      return data || false
    } catch (error) {
      console.error('Error closing barraca with special admin:', error)
      throw error
    }
  }

  static async getSpecialAdminOverrides(): Promise<Array<{
    barracaId: string;
    barracaName: string;
    overrideExpires: Date;
    hoursRemaining: number;
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_special_admin_overrides')

      if (error) {
        handleSupabaseError(error, 'get special admin overrides')
      }

      return (data || []).map((item: any) => ({
        barracaId: item.barraca_id,
        barracaName: item.barraca_name,
        overrideExpires: new Date(item.override_expires),
        hoursRemaining: item.hours_remaining
      }))
    } catch (error) {
      console.error('Error getting special admin overrides:', error)
      throw error
    }
  }

  // Get barracas with manual status (for super admin)
  static async getBarracasWithManualStatus(): Promise<Array<{
    barracaId: string;
    barracaName: string;
    location: string;
    partnered: boolean;
    manualStatus: string;
    lastUpdated: Date;
  }>> {
    try {
      const { data, error } = await supabase.rpc('get_barracas_with_manual_status');

      if (error) {
        handleSupabaseError(error, 'get barracas with manual status');
      }

      return (data || []).map((row: any) => ({
        barracaId: row.barraca_id,
        barracaName: row.barraca_name,
        location: row.location,
        partnered: row.partnered,
        manualStatus: row.manual_status,
        lastUpdated: new Date(row.last_updated)
      }));
    } catch (error) {
      console.error('Error fetching barracas with manual status:', error);
      throw error;
    }
  }

  // Set manual status for non-partnered barraca (super admin only)
  static async setManualStatus(barracaId: string, status: 'open' | 'closed' | 'undefined'): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('set_manual_barraca_status', {
        barraca_id_param: barracaId,
        status_param: status
      });

      if (error) {
        handleSupabaseError(error, 'set manual barraca status');
      }

      // Note: Firestore integration removed - no longer needed

      return data || false;
    } catch (error) {
      console.error('Error setting manual status:', error);
      throw error;
    }
  }
}