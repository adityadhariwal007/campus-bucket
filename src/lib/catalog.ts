import type { Catalog, Category, Kit, KitItem, Product, Tier } from "./types";
export const categories: Category[] = ["Hostel", "Student", "Sports"];
export const tiers: Tier[] = ["Fresher", "Scholar", "Topper"];
export const tierCopy = {
  Fresher: "The everyday essentials.",
  Scholar: "A little more, a lot sorted.",
  Topper: "Your best campus life.",
};
const rows: [string, string, number, Category, Product["size_type"]][] = [
  ["bucket", "Everyday bucket", 199, "Hostel", null],
  ["mug", "Bath mug", 59, "Hostel", null],
  ["hanger", "Wooden hanger", 35, "Hostel", null],
  ["soap-case", "Soap case", 49, "Hostel", null],
  ["towel", "Cotton bath towel", 299, "Hostel", null],
  ["laundry-bag", "Laundry bag", 199, "Hostel", null],
  ["storage-basket", "Storage basket", 249, "Hostel", null],
  ["bedsheet", "Bedsheet set", 699, "Hostel", null],
  ["pillow", "Cloud pillow", 349, "Hostel", null],
  ["organizer", "Desk organizer", 299, "Hostel", null],
  ["lamp", "Study desk lamp", 599, "Hostel", null],
  ["basic-calculator", "Basic calculator", 199, "Student", null],
  ["register", "College register", 79, "Student", null],
  ["pens", "Pen set (2 pens)", 49, "Student", null],
  ["water-bottle", "Water bottle", 149, "Student", null],
  ["scientific-calculator", "Scientific calculator", 799, "Student", null],
  ["cap", "Campus cap", 199, "Student", "cap"],
  ["steel-bottle", "Steel bottle", 349, "Student", null],
  ["tshirt", "Campus t-shirt", 349, "Student", "shirt"],
  ["notebook", "Premium notebook", 199, "Student", null],
  ["backpack", "Everyday backpack", 999, "Student", null],
  ["insulated-bottle", "Insulated bottle", 599, "Student", null],
  ["rope", "Skipping rope", 149, "Sports", null],
  ["sports-towel", "Sports towel", 149, "Sports", null],
  ["sports-tshirt", "Performance t-shirt", 399, "Sports", "shirt"],
  ["gym-bag", "Gym bag", 599, "Sports", null],
  ["shoes", "Running shoes", 1499, "Sports", "shoe"],
  ["basketball", "Basketball", 599, "Sports", null],
  ["yoga-mat", "Yoga mat", 499, "Sports", null],
  ["socks", "Sports socks", 149, "Sports", null],
];
export const products: Product[] = rows.map(
  ([id, name, price, category, size_type], i) => ({
    id,
    name,
    price,
    category,
    size_type,
    stock: 120,
    image: `sprite:${i}`,
  }),
);
const item = (product_id: string, quantity = 1): KitItem => ({
  product_id,
  quantity,
});
const hostel = [
  item("bucket"),
  item("mug"),
  item("hanger", 6),
  item("soap-case"),
];
const hostelScholar = [
  ...hostel,
  item("towel"),
  item("laundry-bag"),
  item("storage-basket"),
];
const studentScholar = [
  item("scientific-calculator"),
  item("register", 4),
  item("cap"),
  item("steel-bottle"),
  item("tshirt"),
];
const sports = [item("rope"), item("sports-towel"), item("cap")];
const sportsScholar = [
  ...sports,
  item("sports-tshirt"),
  item("water-bottle"),
  item("gym-bag"),
];
const make = (
  type: Category,
  tier: Tier,
  price: number,
  items: KitItem[],
  description: string,
): Kit => ({
  id: `${type.toLowerCase()}-${tier.toLowerCase()}`,
  name: `${type} Kit`,
  type,
  tier,
  price,
  stock: 50,
  items,
  description,
});
export const kits: Kit[] = [
  make(
    "Hostel",
    "Fresher",
    449,
    hostel,
    "Small room. Big new beginning. Get your daily routine sorted from day one.",
  ),
  make(
    "Hostel",
    "Scholar",
    999,
    hostelScholar,
    "Your new home, made a little homier. Everyday basics with thoughtful extras.",
  ),
  make(
    "Hostel",
    "Topper",
    2499,
    [
      ...hostelScholar,
      item("bedsheet"),
      item("pillow"),
      item("organizer"),
      item("lamp"),
    ],
    "Move in, unpack, and feel at home. The full hostel setup.",
  ),
  make(
    "Student",
    "Fresher",
    499,
    [
      item("basic-calculator"),
      item("register", 2),
      item("pens"),
      item("water-bottle"),
    ],
    "From the first lecture to the last-minute assignment. Start with the essentials.",
  ),
  make(
    "Student",
    "Scholar",
    1799,
    studentScholar,
    "Ready for serious study sessions, campus days, and everything between.",
  ),
  make(
    "Student",
    "Topper",
    3299,
    [
      ...studentScholar,
      item("notebook", 2),
      item("backpack"),
      item("insulated-bottle"),
      item("tshirt"),
    ],
    "A complete study setup, with the little upgrades you will use every day.",
  ),
  make(
    "Sports",
    "Fresher",
    399,
    sports,
    "A fresh start for your fitness routine. Just grab your kit and go.",
  ),
  make(
    "Sports",
    "Scholar",
    1399,
    sportsScholar,
    "For early workouts, evening games, and finding your campus team.",
  ),
  make(
    "Sports",
    "Topper",
    2699,
    [...sportsScholar, item("shoes")],
    "The complete training kit, with running shoes to get you moving.",
  ),
];
// Combine repeated items so inventory and the contents list stay in sync.
export function mergeItems(items: KitItem[]): KitItem[] {
  const map = new Map<string, number>();
  for (const i of items)
    map.set(i.product_id, (map.get(i.product_id) || 0) + i.quantity);
  return [...map].map(([product_id, quantity]) => ({ product_id, quantity }));
}
for (const kit of kits) kit.items = mergeItems(kit.items);
kits.push({
  id: "ultimate-fresher",
  name: "Ultimate Fresher Bundle",
  type: "Bundle",
  tier: "Fresher",
  price: 1149,
  stock: 30,
  description:
    "All three Fresher kits. One happy move-in day. Save ₹198 versus buying them separately.",
  items: mergeItems(
    kits.filter((k) => k.tier === "Fresher").flatMap((k) => k.items),
  ),
});
export const seedCatalog: Catalog = { products, kits };
export const money = (n: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
export const sizes = {
  shirt: ["S", "M", "L", "XL", "XXL"],
  cap: ["S/M", "L/XL"],
  shoe: ["UK 5", "UK 6", "UK 7", "UK 8", "UK 9", "UK 10", "UK 11", "UK 12"],
};
