import { useEffect, useState } from "react";

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  in_stock: boolean;
  highlighted?: boolean;
};

export type CartItem = Product & { quantity: number };

const KEY = "kshira_cart_v1";
const listeners = new Set<() => void>();

const read = (): CartItem[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
const write = (items: CartItem[]) => {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
};

export const cart = {
  get: read,
  add(p: Product) {
    const items = read();
    const existing = items.find((i) => i.id === p.id);
    if (existing) {
      existing.quantity += 1;
    } else {
      items.push({ ...p, quantity: 1 });
    }
    write(items);
  },
  setQty(id: string, qty: number) {
    let items = read().map((i) => (i.id === id ? { ...i, quantity: qty } : i));
    items = items.filter((i) => i.quantity > 0);
    write(items);
  },
  remove(id: string) { write(read().filter((i) => i.id !== id)); },
  clear() { write([]); },
};

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(read);
  useEffect(() => {
    const fn = () => setItems(read());
    listeners.add(fn);
    return () => { listeners.delete(fn); };
  }, []);
  const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const count = items.reduce((s, i) => s + i.quantity, 0);
  const addToCart = (p: Product) => cart.add(p);
  return { items, total, count, addToCart };
}
