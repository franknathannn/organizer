import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value,
              ...options,
              maxAge: options.maxAge ?? 60 * 60 * 24 * 365, // 1 year
              path: options.path ?? "/",
              sameSite: options.sameSite ?? "lax",
            });
          } catch {
            // called from a Server Component; middleware handles refresh instead
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({
              name,
              value: "",
              ...options,
              maxAge: 0,
              path: options.path ?? "/",
              sameSite: options.sameSite ?? "lax",
            });
          } catch {
            // called from a Server Component; middleware handles refresh instead
          }
        },
      },
    }
  );
}
