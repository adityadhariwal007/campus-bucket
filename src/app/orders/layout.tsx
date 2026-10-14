import { pageMetadata } from "@/lib/metadata";
export const metadata = pageMetadata('/orders', 'Your orders', 'Track your Campus Bucket orders from placed to delivered.', true);
export default function Layout({ children }: { children: React.ReactNode }) { return children; }
