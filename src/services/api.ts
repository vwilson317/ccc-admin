const API_BASE = '/api'

export interface SupabaseRequest {
  action: 'select' | 'insert' | 'update' | 'delete'
  table: string
  data?: any
  filters?: any
}

export const supabaseApi = async (request: SupabaseRequest) => {
  try {
    const response = await fetch(`${API_BASE}/supabase-api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API call failed:', error)
    throw error
  }
}

// Convenience functions for common operations
export const fetchData = async (table: string, filters?: any) => {
  return supabaseApi({
    action: 'select',
    table,
    filters,
  })
}

export const insertData = async (table: string, data: any) => {
  return supabaseApi({
    action: 'insert',
    table,
    data,
  })
}

export const updateData = async (table: string, data: any, filters: any) => {
  return supabaseApi({
    action: 'update',
    table,
    data,
    filters,
  })
}

export const deleteData = async (table: string, filters: any) => {
  return supabaseApi({
    action: 'delete',
    table,
    filters,
  })
}
