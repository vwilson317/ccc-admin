import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

// Helper function to validate URL
const isValidUrl = (url: string): boolean => {
  if (!url || url.includes('your_') || url === 'your_default_supabase_project_url' || url.includes('placeholder')) {
    return false
  }
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

// Helper function to validate API key
const isValidApiKey = (key: string): boolean => {
  return !(!key || key.includes('your_') || key === 'your_default_supabase_anon_key' || key.includes('placeholder'))
}

// Environment configuration
const getEnvironmentConfig = () => {
  const env = import.meta.env.VITE_APP_ENV || 'dev'
  
  const configs = {
    dev: {
      url: import.meta.env.VITE_SUPABASE_URL_DEV || import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_DEV || import.meta.env.VITE_SUPABASE_ANON_KEY,
      schema: 'public'
    },
    qa: {
      url: import.meta.env.VITE_SUPABASE_URL_QA || import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_QA || import.meta.env.VITE_SUPABASE_ANON_KEY,
      schema: 'public'
    },
    uat: {
      url: import.meta.env.VITE_SUPABASE_URL_UAT || import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_UAT || import.meta.env.VITE_SUPABASE_ANON_KEY,
      schema: 'public'
    },
    prod: {
      url: import.meta.env.VITE_SUPABASE_URL_PROD || import.meta.env.VITE_SUPABASE_URL,
      anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY_PROD || import.meta.env.VITE_SUPABASE_ANON_KEY,
      schema: 'public'
    }
  }
  
  return configs[env as keyof typeof configs] || configs.dev
}

const config = getEnvironmentConfig()
const currentEnv = import.meta.env.VITE_APP_ENV || 'dev'

// Check if we have valid Supabase configuration
const hasValidSupabaseConfig = isValidUrl(config.url) && isValidApiKey(config.anonKey)

// Create a mock client for development when Supabase is not configured
const createMockSupabaseClient = () => {
  console.warn('⚠️ Using mock Supabase client - database operations will not work')
  console.warn('To connect to Supabase, please update your .env file with valid credentials')
  
  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      upsert: () => Promise.resolve({ data: null, error: null }),
    }),
    auth: {
      signUp: () => Promise.resolve({ data: null, error: null }),
      signIn: () => Promise.resolve({ data: null, error: null }),
      signOut: () => Promise.resolve({ error: null }),
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: null } }),
    },
    channel: () => ({
      on: () => ({ subscribe: () => {} }),
    }),
    removeChannel: () => {},
  }
}

// Create Supabase client or mock client
export const supabase = hasValidSupabaseConfig 
  ? createClient<Database>(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      }
    })
  : createMockSupabaseClient() as any

// Environment info for debugging
export const environmentInfo = {
  environment: currentEnv,
  schema: 'public',
  url: config.url,
  isDevelopment: currentEnv === 'dev',
  isQA: currentEnv === 'qa',
  isUAT: currentEnv === 'uat',
  isProduction: currentEnv === 'prod',
  hasValidConfig: hasValidSupabaseConfig
}

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any, context: string) => {
  if (!hasValidSupabaseConfig) {
    console.warn(`Mock Supabase operation in ${context} - no real database connection`)
    return
  }
  
  console.error(`Supabase error in ${context} (${environmentInfo.environment}):`, error)
  
  if (error?.code === 'PGRST116') {
    // No data found - this is often expected, so just log and return
    console.log(`No data found in ${context}`)
    return
  }
  
  if (error?.code === 'PGRST301') {
    throw new Error('Database connection error')
  }
  
  throw new Error(error?.message || 'An unexpected error occurred')
}

// Connection health check
export const checkSupabaseConnection = async (): Promise<boolean> => {
  if (!hasValidSupabaseConfig) {
    console.warn('⚠️ Supabase not configured - using mock data')
    return false
  }
  
  try {
    const { data, error } = await supabase
      .from('barracas')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error(`Supabase connection check failed (${environmentInfo.environment}):`, error)
      return false
    }
    
    console.log(`✅ Connected to Supabase ${environmentInfo.environment} environment (${environmentInfo.schema} schema)`)
    return true
  } catch (error) {
    console.error(`Supabase connection check failed (${environmentInfo.environment}):`, error)
    return false
  }
}

// Real-time subscription helpers
export const subscribeToBarracas = (callback: (payload: any) => void) => {
  if (!hasValidSupabaseConfig) {
    console.warn('⚠️ Real-time subscriptions not available - Supabase not configured')
    return { unsubscribe: () => {} }
  }
  
  return supabase
    .channel(`barracas-changes-${environmentInfo.schema}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: environmentInfo.schema,
        table: 'barracas'
      },
      callback
    )
    .subscribe()
}

export const subscribeToStories = (callback: (payload: any) => void) => {
  if (!hasValidSupabaseConfig) {
    console.warn('⚠️ Real-time subscriptions not available - Supabase not configured')
    return { unsubscribe: () => {} }
  }
  
  return supabase
    .channel(`stories-changes-${environmentInfo.schema}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: environmentInfo.schema,
        table: 'stories'
      },
      callback
    )
    .subscribe()
}

// Cleanup function for subscriptions
export const unsubscribeFromChannel = (subscription: any) => {
  if (subscription && hasValidSupabaseConfig) {
    supabase.removeChannel(subscription)
  }
}

// Environment-specific logging
export const logEnvironmentInfo = () => {
  console.log('🌍 Environment Configuration:', {
    environment: environmentInfo.environment,
    schema: environmentInfo.schema,
    isDevelopment: environmentInfo.isDevelopment,
    isProduction: environmentInfo.isProduction,
    hasValidSupabaseConfig: environmentInfo.hasValidConfig
  })
  
  if (!hasValidSupabaseConfig) {
    console.warn('⚠️ To enable database functionality, please:')
    console.warn('1. Create a Supabase project at https://supabase.com')
    console.warn('2. Update your .env file with your project URL and API key')
    console.warn('3. Restart the development server')
  }
}