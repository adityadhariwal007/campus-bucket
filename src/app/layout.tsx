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
      <head>
        <link rel="preconnect" href="https://images.unsplash.com" />
      </head>
      <body>
        <StoreProvider>
          <Shell>{children}</Shell>
        </StoreProvider>
      </body>
    </html>
  );
}
