import { MyMarket } from "@/components/market/mine";
export const metadata = {
  title: "Your listings | Campus Bucket",
  robots: { index: false, follow: false },
};
export default function Page() {
  return <MyMarket />;
}
