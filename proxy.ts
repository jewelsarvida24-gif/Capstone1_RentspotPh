import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // If Supabase env vars are not set, skip creating the client
  // so the dev server can run without throwing.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    console.warn(
      "NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY is not set; skipping Supabase proxy."
    );

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
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value);
          });

          supabaseResponse = NextResponse.next({ request });

          cookiesToSet.forEach(({ name, value, options }) => {
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  const secureAdminPath =
    pathname.startsWith("/admin") && !pathname.startsWith("/admin/auth");

  const secureSysadminPath =
    pathname.startsWith("/sysadmin") &&
    !pathname.startsWith("/sysadmin/auth");

  const secureRenterPath =
  pathname.startsWith("/renter") &&
  !pathname.startsWith("/renter/auth");

  // =========================================================
  // NOT LOGGED IN
  // =========================================================

  if (!user && (secureRenterPath || secureAdminPath || secureSysadminPath)) {
    // Admin and SysAdmin both sign in at /admin/auth/login
    const redirectTarget =
      secureSysadminPath || secureAdminPath
        ? "/admin/auth/login"
        : "/renter/auth/login";

    return NextResponse.redirect(new URL(redirectTarget, request.url));
  }

  // =========================================================
  // LOGGED IN — ADMIN AND SYSADMIN PAGES
  // The proxy only checks that you are signed in. The role (staff_roles)
  // and MFA are checked on the server by requireStaff() in each
  // page/layout, so nothing to do here.
  // =========================================================

  // =========================================================
  // LOGGED IN — RENTER AREA AND RENTER LOGIN/REGISTER (unchanged)
  // =========================================================

  if (
    user &&
    (secureRenterPath ||
      pathname.startsWith("/renter/auth/login") ||
      pathname.startsWith("/renter/auth/register"))
  ) {
    const { data: profile } = await supabase
      .from("tbl_users")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const role = profile?.role;

    if (secureRenterPath) {
      if (role !== "customer") {
        return NextResponse.redirect(
          new URL(
            role === "sysadmin"
              ? "/sysadmin/admins"
              : role === "admin"
                ? "/admin/dashboard"
                : "/guest/browse",
            request.url
          )
        );
      }
    }

    if (
      pathname.startsWith("/renter/auth/login") ||
      pathname.startsWith("/renter/auth/register")
    ) {
      if (role === "sysadmin") {
        return NextResponse.redirect(
          new URL("/sysadmin/admins", request.url)
        );
      }

      if (role === "admin") {
        return NextResponse.redirect(
          new URL("/admin/dashboard", request.url)
        );
      }

      if (role === "customer") {
        return NextResponse.redirect(
          new URL("/renter/dashboard", request.url)
        );
      }
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};