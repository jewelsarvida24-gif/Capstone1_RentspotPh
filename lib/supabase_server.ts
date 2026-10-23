<<<<<<< HEAD
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function createFallbackClient() {
  const emptyQuery = () => ({ data: [], error: null });

  return {
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: async () => ({ data: null, error: null }),
          order: () => ({ data: [] }),
          ilike: () => ({ data: [] }),
        }),
        order: () => ({ data: [] }),
        ilike: () => ({ data: [] }),
      }),
      insert: async () => ({ data: null, error: null }),
      update: () => ({ eq: () => ({ data: null, error: null }) }),
      delete: () => ({ eq: () => ({ data: null, error: null }) }),
    }),
    rpc: emptyQuery,
  } as any;
}

export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return createFallbackClient();
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
=======
// lib/supabase_server.ts
// Server Supabase client — used in Server Components, Route Handlers,
// and Server Actions. Reads/writes the auth session via Next.js cookies,
// so it must be awaited: `const supabase = await createClient();`

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment variables.'
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
>>>>>>> origin/sarvida-pr
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
<<<<<<< HEAD
          // Server Components cannot always write cookies.
=======
          // setAll can be called from a Server Component where cookies
          // can't be written. Safe to ignore if you have middleware
          // refreshing the session (see note in README below).
>>>>>>> origin/sarvida-pr
        }
      },
    },
  });
<<<<<<< HEAD
}
=======
}
>>>>>>> origin/sarvida-pr
