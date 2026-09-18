// lib/supabase/client.ts — browser-side Supabase client
import { createBrowserClient } from '@supabase/ssr';

function createFallbackClient() {
  const emptyQuery = () => ({ data: [], error: null });

  return {
    auth: {
      signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => undefined } },
      }),
    },
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }), maybeSingle: async () => ({ data: null, error: null }) }), ilike: () => ({ data: [] }), order: () => ({ data: [] }) }),
      insert: async () => ({ data: null, error: null }),
      upsert: async () => ({ data: null, error: null }),
      update: () => ({ eq: () => ({ data: null, error: null }) }),
      delete: () => ({ eq: () => ({ data: null, error: null }) }),
    }),
    rpc: emptyQuery,
  } as any;
}

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return createFallbackClient();
  }

  return createBrowserClient(url, anonKey);
}