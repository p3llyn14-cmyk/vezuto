import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/ucet", "/objednavky", "/zakazky", "/admin"] as const;
const AUTH_PAGES = ["/prihlaseni", "/registrace"] as const;

/**
 * Refreshes the Supabase session cookie on every request and does the
 * "optimistic" redirect (session presence only, no DB round-trip — see
 * Next.js's Proxy docs). Real authorization (role checks, RLS) always
 * happens again server-side; this only avoids flashing protected UI to a
 * logged-out visitor.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase not configured yet (no project created), or unreachable: fail
  // closed rather than crash. `user` stays null, so protected routes still
  // redirect to login instead of the whole site 500ing on every request —
  // createServerClient() itself throws synchronously on a missing/invalid
  // URL, so this has to be checked before constructing the client, not just
  // around the getUser() call.
  let user = null;
  if (supabaseUrl && supabaseAnonKey) {
    try {
      const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            for (const { name, value } of cookiesToSet) {
              request.cookies.set(name, value);
            }
            response = NextResponse.next({ request });
            for (const { name, value, options } of cookiesToSet) {
              response.cookies.set(name, value, options);
            }
          },
        },
      });
      const {
        data: { user: fetchedUser },
      } = await supabase.auth.getUser();
      user = fetchedUser;
    } catch {
      user = null;
    }
  }

  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  const isAuthPage = AUTH_PAGES.some((page) => pathname.startsWith(page));

  if (!user && isProtected) {
    const redirectUrl = new URL("/prihlaseni", request.url);
    redirectUrl.searchParams.set("pokracovat", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL("/ucet", request.url));
  }

  return response;
}
