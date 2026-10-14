"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { seedCatalog } from "@/lib/catalog";
import { configured, supabase } from "@/lib/supabase";
import {
  contents,
  entry,
  totals,
  validateCart,
  validateCustomer,
} from "@/lib/commerce";
import type {
  Account,
  CartLine,
  Catalog,
  Customer,
  Kit,
  Order,
  Product,
} from "@/lib/types";
type DemoData = { catalog: Catalog; orders: Order[] };
const demoKey = "campus-bucket-demo-v1";
function readDemo(): DemoData {
  const raw = localStorage.getItem(demoKey);
  if (!raw) return { catalog: structuredClone(seedCatalog), orders: [] };
  const d = JSON.parse(raw);
  if (!d.catalog?.products || !d.catalog?.kits || !Array.isArray(d.orders))
    throw new Error(
      "Your demo data could not be read. Clear site storage to reset the demo.",
    );
  return d;
}
type Store = {
  catalog: Catalog;
  cart: CartLine[];
  account: Account | null;
  ready: boolean;
  error: string;
  notice: string;
  demo: boolean;
  reload: () => Promise<void>;
  add: (line: Omit<CartLine, "key">) => void;
  update: (key: string, quantity: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  signOut: () => Promise<void>;
  demoLogin: () => void;
  placeOrder: (
    customer: Customer,
    code: string,
    requestId: string,
  ) => Promise<Order>;
  getOrders: () => Promise<Order[]>;
  saveProduct: (p: Product) => Promise<void>;
  saveKit: (k: Kit) => Promise<void>;
  setStatus: (id: string, status: Order["status"]) => Promise<void>;
};
const Context = createContext<Store | null>(null);
export function StoreProvider({ children }: { children: ReactNode }) {
  const [catalog, setCatalog] = useState<Catalog>(seedCatalog),
    [cart, setCart] = useState<CartLine[]>([]),
    [account, setAccount] = useState<Account | null>(null),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const demo = !configured;
  async function reload() {
    if (!supabase) {
      setCatalog(readDemo().catalog);
      return;
    }
    const [p, k] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase
        .from("kits")
        .select("*, items:kit_items(product_id,quantity)")
        .order("price"),
    ]);
    if (p.error || k.error)
      throw new Error(p.error?.message || k.error?.message);
    setCatalog({ products: p.data!, kits: k.data! });
  }
  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const saved = JSON.parse(
          localStorage.getItem("campus-cart-v1") || "[]",
        );
        if (Array.isArray(saved))
          setCart(
            saved.filter(
              (l) =>
                l &&
                typeof l.key === "string" &&
                typeof l.id === "string" &&
                ["kit", "product"].includes(l.kind) &&
                Number.isInteger(l.quantity) &&
                l.quantity > 0 &&
                l.quantity <= 20 &&
                l.sizes &&
                typeof l.sizes === "object",
            ),
          );
        await reload();
        if (demo && sessionStorage.getItem("campus-demo-account")) {
          const stored = sessionStorage.getItem("campus-google-user");
          if (stored) {
            try {
              setAccount(JSON.parse(stored));
            } catch {
              setAccount({
                id: "demo-student",
                name: "Campus explorer",
                email: "student@example.com",
                admin: true,
              });
            }
          } else {
            setAccount({
              id: "demo-student",
              name: "Campus explorer",
              email: "student@example.com",
              admin: true,
            });
          }
        }
      } catch (e) {
        if (active) setError((e as Error).message);
      } finally {
        if (active) setReady(true);
      }
    }
    void init();
    const subscription = supabase?.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;
      setAccount(
        user
          ? {
              id: user.id,
              email: user.email || "",
              name: user.user_metadata?.name || "Student",
              admin: false,
            }
          : null,
      );
      if (user)
        setTimeout(() => {
          void supabase!
            .from("admin_users")
            .select("user_id")
            .eq("user_id", user.id)
            .maybeSingle()
            .then(({ data }) => {
              if (active)
                setAccount((old) =>
                  old?.id === user.id ? { ...old, admin: !!data } : old,
                );
            });
        }, 0);
    }).data.subscription;
    return () => {
      active = false;
      subscription?.unsubscribe();
    };
    // The client is a singleton; initialization runs once per mounted provider.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem("campus-cart-v1", JSON.stringify(cart));
      } catch {
        setError(
          "Your browser could not save your bucket. Storage may be full or blocked.",
        );
      }
  }, [cart, ready]);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(""), 3500);
    return () => clearTimeout(t);
  }, [notice]);
  function add(input: Omit<CartLine, "key">) {
    const key = `${input.kind}:${input.id}:${JSON.stringify(Object.entries(input.sizes).sort())}`;
    const existing = cart.find((l) => l.key === key);
    const next = existing
      ? cart.map((l) =>
          l.key === key ? { ...l, quantity: l.quantity + input.quantity } : l,
        )
      : [...cart, { ...input, key }];
    validateCart(next, catalog);
    setCart(next);
    setNotice("Added to your bucket");
  }
  function update(key: string, quantity: number) {
    const next = cart.map((l) => (l.key === key ? { ...l, quantity } : l));
    validateCart(next, catalog);
    setCart(next);
  }
  async function signOut() {
    if (supabase) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    }
    sessionStorage.removeItem("campus-password-recovery");
    sessionStorage.removeItem("campus-demo-account");
    sessionStorage.removeItem("campus-google-user");
    setAccount(null);
  }
  function demoLogin() {
    sessionStorage.setItem("campus-demo-account", "true");
    sessionStorage.setItem(
      "campus-google-user",
      JSON.stringify({
        id: "demo-student",
        name: "Campus explorer",
        email: "student@example.com",
        admin: true,
      }),
    );
    setAccount({
      id: "demo-student",
      name: "Campus explorer",
      email: "student@example.com",
      admin: true,
    });
  }
  async function placeOrder(
    customer: Customer,
    code: string,
    requestId: string,
  ) {
    if (!account) throw new Error("Please sign in before checking out.");
    validateCustomer(customer);
    if (supabase) {
      const { data, error } = await supabase.rpc("place_order", {
        p_lines: cart,
        p_customer: customer,
        p_code: code,
        p_request_id: requestId,
      });
      if (error) throw new Error(error.message);
      await reload().catch(() =>
        setNotice("Order saved. Refresh to see current stock."),
      );
      return data as Order;
    }
    const commit = async () => {
      const data = readDemo();
      const existing = data.orders.find(
        (o) => o.request_id === requestId && o.user_id === account.id,
      );
      if (existing) return existing;
      const needed = validateCart(cart, data.catalog);
      const amount = totals(cart, data.catalog, code, customer.delivery);
      const order: Order = {
        id: crypto.randomUUID(),
        user_id: account.id,
        items: cart.map((l) => ({
          ...l,
          name: entry(l, data.catalog)!.name,
          price: entry(l, data.catalog)!.price,
          contents: contents(l, data.catalog).map((i) => ({
            ...i,
            name: data.catalog.products.find((p) => p.id === i.product_id)!
              .name,
          })),
        })),
        ...amount,
        status: "Placed",
        payment_id: `mock_${crypto.randomUUID()}`,
        created_at: new Date().toISOString(),
        customer,
        request_id: requestId,
      };
      for (const p of data.catalog.products) p.stock -= needed[p.id] || 0;
      for (const l of cart)
        if (l.kind === "kit")
          data.catalog.kits.find((k) => k.id === l.id)!.stock -= l.quantity;
      data.orders.unshift(order);
      localStorage.setItem(demoKey, JSON.stringify(data));
      setCatalog(data.catalog);
      return order;
    };
    return navigator.locks
      ? navigator.locks.request("campus-demo-order", commit)
      : commit();
  }
  async function getOrders() {
    if (!account) return [];
    if (!supabase)
      return readDemo().orders.filter(
        (o) => account.admin || o.user_id === account.id,
      );
    // shortcut: latest 200 orders only; add pagination before a store exceeds this volume.
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    return data as Order[];
  }
  async function saveProduct(product: Product) {
    if (!account?.admin) throw new Error("Administrator access required.");
    if (supabase) {
      const { error } = await supabase.from("products").upsert(product);
      if (error) throw error;
    } else {
      const data = readDemo();
      data.catalog.products = [
        ...data.catalog.products.filter((p) => p.id !== product.id),
        product,
      ];
      localStorage.setItem(demoKey, JSON.stringify(data));
    }
    await reload();
  }
  async function saveKit(kit: Kit) {
    if (!account?.admin) throw new Error("Administrator access required.");
    if (supabase) {
      const { error } = await supabase.rpc("save_kit", { p_kit: kit });
      if (error) throw error;
    } else {
      const data = readDemo();
      data.catalog.kits = [
        ...data.catalog.kits.filter((k) => k.id !== kit.id),
        kit,
      ];
      localStorage.setItem(demoKey, JSON.stringify(data));
    }
    await reload();
  }
  async function setStatus(id: string, status: Order["status"]) {
    if (!account?.admin) throw new Error("Administrator access required.");
    if (supabase) {
      const { error } = await supabase.rpc("update_order_status", {
        p_id: id,
        p_status: status,
      });
      if (error) throw error;
    } else {
      const data = readDemo();
      const o = data.orders.find((o) => o.id === id);
      if (!o) throw new Error("Order not found.");
      o.status = status;
      localStorage.setItem(demoKey, JSON.stringify(data));
    }
  }
  return (
    <Context.Provider
      value={{
        catalog,
        cart,
        account,
        ready,
        error,
        notice,
        demo,
        reload,
        add,
        update,
        remove: (key) => setCart((c) => c.filter((l) => l.key !== key)),
        clear: () => setCart([]),
        signOut,
        demoLogin,
        placeOrder,
        getOrders,
        saveProduct,
        saveKit,
        setStatus,
      }}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          ✓ {notice}
        </div>
      )}
    </Context.Provider>
  );
}
export function useStore() {
  const store = useContext(Context);
  if (!store) throw new Error("StoreProvider missing");
  return store;
}
