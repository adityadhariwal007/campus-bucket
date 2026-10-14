import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { contentSecurityPolicy, securityHeaders } from "@/lib/security";
// Edge middleware is retained for the Cloudflare adapter; proxy.ts uses the Node runtime.
export async function middleware(request: NextRequest) {
  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(
    nonce,
    process.env.NODE_ENV === "development",
  );
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  let response = NextResponse.next({ request: { headers } });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (url && key && request.nextUrl.pathname.startsWith("/admin")) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (values) => {
          values.forEach(({ name, value }) => request.cookies.set(name, value));
          headers.set("cookie", request.cookies.toString());
          response = NextResponse.next({ request: { headers } });
          values.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    });
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      const redirect = NextResponse.redirect(
        new URL("/login?next=admin", request.url),
      );
      response.cookies
        .getAll()
        .forEach((cookie) => redirect.cookies.set(cookie));
      response = redirect;
    }
  }
  response.headers.set("Content-Security-Policy", csp);
  Object.entries(securityHeaders).forEach(([name, value]) =>
    response.headers.set(name, value),
  );
  // A per-response nonce and private auth cookies must never enter a shared HTML cache.
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: ["/((?!_next/static|_next/image|images/|favicon.ico).*)"],
};
