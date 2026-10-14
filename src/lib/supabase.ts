import { createBrowserClient } from "@supabase/ssr";
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
export const configured = !!(url && key);
export const supabase = configured
  ? createBrowserClient(url!, key!, {
      cookieOptions: {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      },
    })
  : null;
