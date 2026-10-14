export function contentSecurityPolicy(nonce: string, development = false) {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${development ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
    "img-src 'self' https: data: blob:",
    "font-src 'self'",
    `connect-src 'self' https://accounts.google.com/gsi/ https://zbdezzafnqwmqmdxdmmo.supabase.co wss://zbdezzafnqwmqmdxdmmo.supabase.co${development ? " ws://localhost:*" : ""}`,
    "frame-src 'self' https://accounts.google.com/",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    ...(development ? [] : ["upgrade-insecure-requests"]),
  ].join("; ");
}
export const securityHeaders = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Strict-Transport-Security": "max-age=31536000",
};
export function safeNext(value: string | null) {
  return value === "checkout"
    ? "/checkout"
    : value === "admin"
      ? "/admin"
      : "/orders";
}

export function loginDestination(isAdmin: boolean, next: string | null) {
  return isAdmin ? "/admin" : safeNext(next === "admin" ? null : next);
}
