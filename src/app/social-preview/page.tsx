import Image from "next/image";
import Link from "next/link";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata("/social-preview", "Social preview", "The Campus Bucket card shown when you share our website.", true);
export default function SocialPreview() {
  return <section className="container page social-preview-page">
    <span className="eyebrow">PASS IT ON</span><h1>Your next chapter,<br />worth sharing.</h1>
    <p className="lead">The Campus Bucket preview for shared links.</p>
    <Image src="/social-preview.png" width={1200} height={630} alt="Campus Bucket social card: Campus life. Sorted. Hostel, study and sports essentials." sizes="(max-width: 767px) 92vw, 1000px" priority />
    <Link href="/" className="text-link">Back to Campus Bucket ↗</Link>
  </section>;
}
