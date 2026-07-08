import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          const opt = {
            ...options,
            maxAge: options.maxAge ?? 60 * 60 * 24 * 365, // 1 year
            path: options.path ?? "/",
            sameSite: options.sameSite ?? "lax",
          };
          request.cookies.set({ name, value, ...opt });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...opt });
        },
        remove(name: string, options: CookieOptions) {
          const opt = {
            ...options,
            maxAge: 0,
            path: options.path ?? "/",
            sameSite: options.sameSite ?? "lax",
          };
          request.cookies.set({ name, value: "", ...opt });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: "", ...opt });
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/auth");

  const isLandingPage = request.nextUrl.pathname === "/";

  // If the user is not logged in and not on auth route or landing page, redirect to login
  if (!user && !isAuthRoute && !isLandingPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // If the user is logged in and tries to access the login page, redirect to /home
  if (user && request.nextUrl.pathname === "/login") {
    const url = request.nextUrl.clone();
    url.pathname = "/home";
    return NextResponse.redirect(url);
  }

  return response;
}
