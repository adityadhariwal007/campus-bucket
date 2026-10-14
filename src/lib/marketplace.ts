export const marketCategories = [
  "Books & course gear",
  "Electronics",
  "Hostel essentials",
  "Cycles",
  "Sports",
  "Clothing",
  "Other",
] as const;
export const marketConditions = [
  "Like new",
  "Good",
  "Used",
  "Needs repair",
] as const;
export const meetingPlaces = [
  "Campus cafeteria entrance",
  "Library entrance",
  "Another public campus spot",
];
export type MarketListing = {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  defects: string;
  price: number;
  previous_price: number | null;
  course: string;
  available_until: string | null;
  photos: string[];
  status: string;
  created_at: string;
  published_at: string | null;
  seller_name: string;
  verification_kind: string;
  handovers: number;
  interest_count?: number;
  moderation_note?: string;
};
export type MarketMember = {
  user_id: string;
  display_name: string;
  verification: string;
  verification_kind: string;
  batch: string;
  programme: string;
  roll_number: string;
  review_note: string;
  email_alerts: boolean;
};
export type MarketStatus = {
  verified: boolean;
  member: MarketMember | null;
  email_eligible: boolean;
  admin: boolean;
  email_configured: boolean;
};
export type MarketThread = {
  id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  title: string;
  other_name: string;
  last_message: string;
  updated_at: string;
  seller_confirmed: boolean;
  buyer_confirmed: boolean;
  blocked: boolean;
  blocked_by_me: boolean;
};
export type MarketMessage = {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
};
export type MarketMeetup = {
  id: string;
  proposed_by: string;
  place: string;
  meet_at: string;
  status: string;
};
export type MarketContact = { user_id: string; phone: string };
export function secondLook(
  listing: Pick<MarketListing, "status" | "published_at">,
  now = Date.now(),
) {
  return (
    listing.status === "active" &&
    !!listing.published_at &&
    now - new Date(listing.published_at).getTime() >= 7 * 86400000
  );
}
export function suggestedPrice(price: number) {
  return Math.max(0, Math.floor(price * 0.9));
}
export function validateMarketListing(data: {
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  defects: string;
  course: string;
  photos: unknown[];
}) {
  if (data.title.trim().length < 5 || data.title.length > 100)
    throw new Error("Use a title of 5–100 characters.");
  if (data.description.trim().length < 20 || data.description.length > 2000)
    throw new Error("Describe the item in 20–2,000 characters.");
  if (
    !(marketCategories as readonly string[]).includes(data.category) ||
    !(marketConditions as readonly string[]).includes(data.condition)
  )
    throw new Error("Choose a category and condition.");
  if (!Number.isInteger(data.price) || data.price < 0 || data.price > 200000)
    throw new Error("Enter a whole-rupee price between ₹0 and ₹2,00,000.");
  if (data.defects.length < 2 || data.defects.length > 500)
    throw new Error("Describe any defects, or write ‘None known’.");
  if (data.course.length > 80)
    throw new Error("Keep the course/semester tag under 80 characters.");
  if (data.photos.length < 1 || data.photos.length > 4)
    throw new Error("Add 1–4 photos of the actual item.");
}
export function isThaparEmail(email: string) {
  return /^[^\s@]+@thapar\.edu$/i.test(email.trim());
}
export function campusMeetingTime(value: string) {
  if (!/^\d{4}-\d\d-\d\dT\d\d:\d\d$/.test(value))
    throw new Error("Choose a valid meeting date and time.");
  const time = new Date(value + "+05:30");
  if (
    !Number.isFinite(time.getTime()) ||
    new Date(time.getTime() + 330 * 60000).toISOString().slice(0, 16) !== value
  )
    throw new Error("Choose a valid meeting date and time.");
  return time.toISOString();
}
export function displayMeetingTime(value: string) {
  return (
    new Date(value).toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      dateStyle: "medium",
      timeStyle: "short",
    }) + " IST"
  );
}
