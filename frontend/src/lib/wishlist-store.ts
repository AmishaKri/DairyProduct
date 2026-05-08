import { useEffect, useState } from "react";
import { wishlistAPI } from "./api";

export type WishlistItem = {
  _id: string;
  productId: string;
  userId: string;
  createdAt: string;
};

const KEY = "kshira_wishlist_v1";
const listeners = new Set<() => void>();

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
    
    // Only sync with server if authenticated
    if (authenticated) {
      try {
        await wishlistAPI.add(productId);
      } catch (e) {
        // If API call fails, revert local change
        const currentItems = read().filter((i) => i.productId !== productId);
        write(currentItems);
        
        // Only log non-401 errors
        if (e.response?.status !== 401) {
          console.error("Failed to add to wishlist:", e);
        }
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
    
    // Remove from local state
    const updatedItems = items.filter((i) => i.productId !== productId);
    write(updatedItems);
    
    // Only sync with server if authenticated
    if (authenticated) {
      try {
        await wishlistAPI.remove(productId);
      } catch (e) {
        // If API call fails, revert local change
        write(items);
        
        // Only log non-401 errors
        if (e.response?.status !== 401) {
          console.error("Failed to remove from wishlist:", e);
        }
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
