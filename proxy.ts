import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // If Supabase env vars are not set, skip creating the client so the dev server can run without throwing.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    // eslint-disable-next-line no-console
    console.warn('NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set; skipping Supabase middleware.');
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const secureAdminPath = pathname.startsWith('/admin') && !pathname.startsWith('/admin/auth');
  const secureSysadminPath = pathname.startsWith('/sysadmin') && !pathname.startsWith('/sysadmin/auth');
  const secureRenterPath = pathname.startsWith('/renter');

  if (!user && (secureRenterPath || secureAdminPath || secureSysadminPath)) {
    const redirectTarget = secureSysadminPath ? '/sysadmin/auth/login' : secureAdminPath ? '/admin/auth/login' : '/auth/login';
    return NextResponse.redirect(new URL(redirectTarget, request.url));
  }

  if (user && (secureAdminPath || secureSysadminPath || pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register') || pathname.startsWith('/admin/auth/login') || pathname.startsWith('/sysadmin/auth/login'))) {
    const { data: profile } = await supabase
      .from('tbl_users')
      .select('role')
      .eq('user_id', user.id)
      .single();

    const role = profile?.role;

    if (secureSysadminPath && !pathname.startsWith('/sysadmin/auth/login')) {
      if (role !== 'sysadmin') {
        return NextResponse.redirect(new URL(role === 'admin' ? '/admin/dashboard' : '/renter/my-rentals', request.url));
      }
    }

    if (secureAdminPath && !pathname.startsWith('/admin/auth/login')) {
      if (role !== 'admin' && role !== 'sysadmin') {
        return NextResponse.redirect(new URL('/renter/my-rentals', request.url));
      }
    }

    if (secureRenterPath) {
      if (role !== 'customer') {
        return NextResponse.redirect(new URL(role === 'sysadmin' ? '/sysadmin' : role === 'admin' ? '/admin/dashboard' : '/guest/browse', request.url));
      }
    }

    if (pathname.startsWith('/auth/login') || pathname.startsWith('/auth/register') || pathname.startsWith('/admin/auth/login') || pathname.startsWith('/sysadmin/auth/login')) {
      if (role === 'sysadmin') {
        return NextResponse.redirect(new URL('/sysadmin', request.url));
      }
      if (role === 'admin') {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
      if (role === 'customer') {
        return NextResponse.redirect(new URL('/renter/my-rentals', request.url));
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
