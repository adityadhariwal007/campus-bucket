import type { Metadata } from "next";
export function pageMetadata(path: string, title: string, description: string, privatePage = false): Metadata {
  return {
    title: { absolute: `${title} | Campus Bucket` }, description, alternates: { canonical: path },
    openGraph: { title: `${title} | Campus Bucket`, description, url: path, siteName: "Campus Bucket", type: "website", locale: "en_IN", images: [{ url: "/social-preview.png", width: 1200, height: 630, alt: "Campus Bucket — Campus life. Sorted." }] },
    twitter: { card: "summary_large_image", title: `${title} | Campus Bucket`, description, images: ["/social-preview.png"] },
    ...(privatePage ? { robots: { index: false, follow: false } } : {}),
  };
}
