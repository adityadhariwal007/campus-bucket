import type { Metadata } from "next";
import {
  Bricolage_Grotesque,
  Instrument_Sans,
  Instrument_Serif,
} from "next/font/google";
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});
const body = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});
const serif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: "italic",
  variable: "--font-serif",
  display: "swap",
});
import "./globals.css";
import { StoreProvider } from "@/components/store";
import { Shell } from "@/components/shell";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  metadataBase: new URL("https://campusbucket.live"),
  alternates: { canonical: "/" },
  openGraph: { title: "Campus Bucket | Campus life. Sorted.", description: "Hostel, study and sports essentials, packed for your next chapter.", url: "/", siteName: "Campus Bucket", locale: "en_IN", type: "website", images: [{ url: "/social-preview.png", width: 1200, height: 630, alt: "Campus Bucket — Campus life. Sorted." }] },
  twitter: { card: "summary_large_image", title: "Campus Bucket | Campus life. Sorted.", description: "Hostel, study and sports essentials, packed for your next chapter.", images: ["/social-preview.png"] },
  title: {
    default: "Campus Bucket | Your campus life, sorted.",
    template: "%s | Campus Bucket",
  },
  description:
    "Ready-made hostel, student, and sports kits for your first chapter of college. Pick a kit, choose your tier, and get campus ready.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en-IN"
      className={`${display.variable} ${body.variable} ${serif.variable}`}
    >
      <body>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
