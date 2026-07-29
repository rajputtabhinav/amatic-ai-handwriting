import { createClient } from '@supabase/supabase-js'
import { logger } from './logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL && 
  process.env.NEXT_PUBLIC_SUPABASE_URL !== 'your_supabase_url_here' 
    ? process.env.NEXT_PUBLIC_SUPABASE_URL 
    : 'https://placeholder.supabase.co'

const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== 'your_supabase_anon_key_here'
    ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2MDAwMDAwMDAsImV4cCI6MTkxNTM1OTk5OX0.placeholder'

if (supabaseUrl === 'https://placeholder.supabase.co') {
  logger.warn('Supabase not configured - using placeholder values')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side client with service role key (for admin operations)
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY && 
  process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your_supabase_service_role_key_here'
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTYwMDAwMDAwMCwiZXhwIjoxOTE1MzU5OTk5fQ.placeholder'

export const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export function createClientInstance() {
  return supabase
}

export { createClientInstance as createClient }
