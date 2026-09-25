// lib/supabase_client.ts
// Browser Supabase client — safe to use in 'use client' components.
// Uses the public anon key only. Session is persisted via cookies
// so the server client (supabase_server.ts) can read the same session.

import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}
