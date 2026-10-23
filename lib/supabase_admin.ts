<<<<<<< HEAD
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// A server-only Supabase client that uses the service role key.
// This is required for admin auth operations like generating signup links
// and updating user passwords without exposing secret credentials to the browser.
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable');
  }

  if (!serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
  }

  return createClient(url, serviceRoleKey, {
=======
// lib/supabase_admin.ts
// Admin Supabase client using the SERVICE ROLE key.
// This bypasses Row Level Security — never import this file into
// any 'use client' component, and never expose the service role key
// with a NEXT_PUBLIC_ prefix. Server Actions / Route Handlers only.

import "server-only";
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in your environment variables.'
    );
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
>>>>>>> origin/sarvida-pr
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
