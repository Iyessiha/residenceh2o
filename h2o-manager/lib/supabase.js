import { createBrowserClient } from '@supabase/ssr'

const noop = () => {}
const noopPromise = () => Promise.resolve({ data: null, error: null })

// Safe no-op client for build time when env vars are not yet available
const buildTimeClient = {
  auth: {
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    signOut: noopPromise,
    signInWithPassword: noopPromise,
    updateUser: noopPromise,
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: noop } } }),
  },
  from: () => ({
    select: () => ({ order: () => Promise.resolve({ data: [], error: null }), data: [], error: null }),
    insert: () => noopPromise(),
    update: () => ({ eq: () => noopPromise() }),
    delete: () => ({ eq: () => noopPromise() }),
  }),
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return buildTimeClient
  return createBrowserClient(url, key)
}
