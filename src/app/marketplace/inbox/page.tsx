import { Suspense } from "react";
import { InboxPage } from "@/components/market/inbox";
import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata(
  "/marketplace/inbox",
  "Thapar Market inbox",
  "Private conversations and agreed campus meetups for student resale.",
  true,
);
export default function Page() {
  return (
    <Suspense fallback={<p role="status">Opening inbox…</p>}>
      <InboxPage />
    </Suspense>
  );
}
