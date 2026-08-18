import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Guard: during SSR build, env vars might be empty strings
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''

  return createBrowserClient(url, key)
}
