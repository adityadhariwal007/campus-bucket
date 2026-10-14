import Link from "next/link";
import { IconArrowUpRight, IconBucket } from "@tabler/icons-react";
export const metadata = {
  title: { absolute: "Page not found | Campus Bucket" },
  description: "This page has moved or does not exist. Return to Campus Bucket or explore hostel, study and sports kits.",
  robots: { index: false, follow: false },
  alternates: { canonical: null },
};
export default function NotFound() {
  return <section className="container page lost-page">
    <div className="lost-number" aria-hidden="true">4<IconBucket stroke={1} />4</div>
    <span className="eyebrow">A SMALL DETOUR</span>
    <h1>This wasn't on<br /><em>the packing list.</em></h1>
    <p>The page may have moved, or the link took a wrong turn. Your next chapter is still right here.</p>
    <div className="row"><Link href="/" className="button primary">Back to campus <IconArrowUpRight size={18} /></Link><Link href="/kits" className="text-link">Explore the kits ↗</Link></div>
  </section>;
}
