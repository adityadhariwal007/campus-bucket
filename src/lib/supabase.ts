import { createBrowserClient } from "@supabase/ssr";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const configured = !!(url && key);
export const supabase = configured
  ? createBrowserClient(url!, key!, {
      global: {
        fetch: (input, init) => {
          const target = new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
          if (typeof window !== "undefined" && ["campusbucket.live", "www.campusbucket.live"].includes(window.location.hostname) && target.origin === new URL(url!).origin && ["/auth/v1/signup", "/auth/v1/recover"].includes(target.pathname)) {
            target.pathname = target.pathname.replace("/auth/v1/", "/api/account/");
            return fetch(`${window.location.origin}${target.pathname}${target.search}`, init);
          }
          return fetch(input, init);
        },
      },
      cookieOptions: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    })
  : null;
