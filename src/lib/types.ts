export type Category = "Hostel" | "Student" | "Sports";
export type Tier = "Fresher" | "Scholar" | "Topper";
export type Product = {
  id: string;
  name: string;
  price: number;
  stock: number;
  category: Category;
  image: string;
  size_type: "shirt" | "cap" | "shoe" | null;
};
export type KitItem = { product_id: string; quantity: number };
export type Kit = {
  id: string;
  name: string;
  type: Category | "Bundle";
  tier: Tier;
  price: number;
  stock: number;
  description: string;
  items: KitItem[];
};
export type Catalog = { products: Product[]; kits: Kit[] };
export type CartLine = {
  key: string;
  kind: "kit" | "product";
  id: string;
  quantity: number;
  sizes: Record<string, string>;
};
export type Customer = {
  name: string;
  phone: string;
  email: string;
  delivery: "hostel" | "pickup";
  campus: string;
  address: string;
};
export type OrderItem = CartLine & {
  name: string;
  price: number;
  contents?: (KitItem & { name: string })[];
};
export const statuses = [
  "Placed",
  "Packed",
  "Out for delivery",
  "Delivered",
] as const;
export type Order = {
  id: string;
  user_id: string;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  delivery_fee: number;
  total: number;
  status: (typeof statuses)[number];
  payment_id: string;
  created_at: string;
  customer: Customer;
  request_id: string;
};
export type Account = {
  id: string;
  name: string;
  email: string;
  admin: boolean;
};
