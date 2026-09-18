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
          // Server Components cannot always write cookies.
        }
      },
    },
  });
}