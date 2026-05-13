import { useEffect, useState } from "react";
import { wishlistAPI } from "./api";

export type WishlistItem = {
  _id: string;
  productId: string;
  userId: string;
  createdAt: string;
};

const KEY = "kshira_wishlist_v1";
const SESSION_KEY = "kshira_session_id";
const listeners = new Set<() => void>();

// Get or create a persistent guest session ID
const getSessionId = (): string => {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
};

const read = (): WishlistItem[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};
const write = (items: WishlistItem[]) => {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
};

export const wishlist = {
  get: read,
  async add(productId: string) {
    const token = localStorage.getItem("kshira_token");
    const authenticated = !!token;

    // Update local state first
    const items = read();
    const existing = items.find((i) => i.productId === productId);
    if (existing) return;

    const newItem: WishlistItem = {
      _id: crypto.randomUUID(),
      productId,
      userId: "current",
      createdAt: new Date().toISOString(),
    };

    write([...items, newItem]);

    // Always sync to DB — authenticated users use userId, guests use sessionId
    try {
      if (authenticated) {
        try {
          await wishlistAPI.add(productId);
        } catch (authErr: any) {
          // Token expired/invalid — fall back to sessionId
          if (authErr.response?.status === 401) {
            await wishlistAPI.add(productId, getSessionId());
          } else if (authErr.response?.status !== 400) {
            console.error("Failed to add to wishlist:", authErr);
          }
        }
      } else {
        await wishlistAPI.add(productId, getSessionId());
      }
    } catch (e: any) {
      if (e.response?.status !== 400) {
        console.error("Failed to add to wishlist:", e);
      }
    }
  },
  async remove(productId: string) {
    const token = localStorage.getItem("kshira_token");
    const authenticated = !!token;

    // Update local state first
    const items = read();
    const existing = items.find((i) => i.productId === productId);
    if (!existing) return;

    const updatedItems = items.filter((i) => i.productId !== productId);
    write(updatedItems);

    // Always sync to DB
    try {
      if (authenticated) {
        try {
          await wishlistAPI.remove(productId);
        } catch (authErr: any) {
          if (authErr.response?.status === 401) {
            await wishlistAPI.remove(productId, getSessionId());
          } else if (authErr.response?.status !== 404) {
            console.error("Failed to remove from wishlist:", authErr);
          }
        }
      } else {
        await wishlistAPI.remove(productId, getSessionId());
      }
    } catch (e: any) {
      if (e.response?.status !== 404) {
        console.error("Failed to remove from wishlist:", e);
      }
    }
  },
  has(productId: string): boolean {
    return read().some((i) => i.productId === productId);
  },
  async syncFromAPI() {
    const token = localStorage.getItem("kshira_token");
    if (!token) {
      return; // Silently return without any API call
    }
    
    try {
      // Double-check token before making API call
      const tokenCheck = localStorage.getItem("kshira_token");
      if (!tokenCheck) {
        return; // Silently return without any API call
      }
      
      const { data } = await wishlistAPI.getAll();
      if (data) {
        const items = data.map((p: any) => ({
          _id: crypto.randomUUID(),
          productId: p._id,
          userId: "current",
          createdAt: new Date().toISOString(),
        }));
        write(items);
      }
    } catch (e) {
      // Completely silence all errors - no console logging
    }
  },
};

export function useWishlist() {
  const [items, setItems] = useState<WishlistItem[]>(read);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check authentication status and sync only if authenticated
  useEffect(() => {
    const fn = () => setItems(read());
    listeners.add(fn);
    
    // Check authentication status first
    const token = localStorage.getItem("kshira_token");
    const authenticated = !!token;
    setIsAuthenticated(authenticated);
    
    // Only sync if user is authenticated
    if (authenticated) {
      wishlist.syncFromAPI().then(() => setItems(read()));
    }
    
    return () => { listeners.delete(fn); };
  }, []);

  // Listen for authentication changes
  useEffect(() => {
    const handleAuthChange = (e: StorageEvent) => {
      if (e.key === 'kshira_token') {
        const token = localStorage.getItem("kshira_token");
        const authenticated = !!token;
        setIsAuthenticated(authenticated);
        
        if (authenticated) {
          wishlist.syncFromAPI().then(() => setItems(read()));
        } else {
          // Clear wishlist when logged out
          setItems([]);
        }
      }
    };

    // Also listen for custom auth events
    const handleCustomAuthChange = () => {
      const token = localStorage.getItem("kshira_token");
      const authenticated = !!token;
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        wishlist.syncFromAPI().then(() => setItems(read()));
      } else {
        setItems([]);
      }
    };

    window.addEventListener('storage', handleAuthChange);
    window.addEventListener('auth-change', handleCustomAuthChange);
    
    return () => {
      window.removeEventListener('storage', handleAuthChange);
      window.removeEventListener('auth-change', handleCustomAuthChange);
    };
  }, []);

  const count = items.length;
  const productIds = items.map((i) => i.productId);

  const addToWishlist = async (productId: string) => {
    await wishlist.add(productId);
  };

  const removeFromWishlist = async (productId: string) => {
    await wishlist.remove(productId);
  };

  const isInWishlist = (productId: string) => {
    return wishlist.has(productId);
  };

  return { items, count, productIds, addToWishlist, removeFromWishlist, isInWishlist };
}
