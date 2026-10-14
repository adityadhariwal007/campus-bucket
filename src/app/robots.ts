import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/login", "/orders", "/cart", "/checkout", "/order-success", "/api/"] }, sitemap: "https://campusbucket.live/sitemap.xml" };
}
