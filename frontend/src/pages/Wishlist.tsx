import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { wishlistAPI, productAPI } from "@/lib/api";
import { wishlist as wishlistStore, useWishlist } from "@/lib/wishlist-store";
import { cart, type Product } from "@/lib/cart-store";
import { Heart, ShoppingBag, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const mapProduct = (p: any): Product => ({
  ...p,
  id: p._id,
  image_url: p.imageUrl,
  in_stock: p.inStock,
});

export default function Wishlist() {
  const { removeFromWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const isAuthenticated = !!localStorage.getItem("kshira_token");

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const run = async () => {
      if (!isAuthenticated) {
        // Guest user — load from localStorage only
        const localItems = wishlistStore.get();
        if (localItems.length === 0) {
          if (isMounted) { setProducts([]); setLoading(false); }
          return;
        }
        const results = await Promise.allSettled(
          localItems.map((item) => productAPI.getById(item.productId))
        );
        const mapped = results
          .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value?.data)
          .map((r) => mapProduct(r.value.data));
        if (isMounted) { setProducts(mapped); setLoading(false); }
        return;
      }

      // Logged-in user — fetch from DB
      try {
        const { data } = await wishlistAPI.getAll();
        const apiProducts = data as any[];

        if (apiProducts.length === 0) {
          // DB empty — check localStorage for unsynced items
          const localItems = wishlistStore.get();
          if (localItems.length > 0) {
            await Promise.allSettled(
              localItems.map((item) => wishlistAPI.add(item.productId))
            );
            const { data: freshData } = await wishlistAPI.getAll();
            if (isMounted) setProducts((freshData as any[]).map(mapProduct));
            return;
          }
        }

        if (isMounted) setProducts(apiProducts.map(mapProduct));
      } catch {
        // API failed — fall back to localStorage
        const localItems = wishlistStore.get();
        if (localItems.length > 0) {
          const results = await Promise.allSettled(
            localItems.map((item) => productAPI.getById(item.productId))
          );
          const mapped = results
            .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value?.data)
            .map((r) => mapProduct(r.value.data));
          if (isMounted) setProducts(mapped);
        } else {
          if (isMounted) setProducts([]);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    run();
    return () => { isMounted = false; };
  }, [isAuthenticated]);

  const handleRemove = async (productId: string) => {
    await removeFromWishlist(productId);
    setProducts((prev) => prev.filter((p) => p.id !== productId));
    toast.success("Removed from wishlist");
  };

  return (
    <Layout>
      <section className="pt-32 pb-12 bg-gradient-hero text-white">
        <div className="container">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Heart className="w-8 h-8 text-pink-300 fill-current" />
            </div>
            <div>
              <h1 className="font-display text-5xl md:text-6xl font-bold animate-fade-in-up">My Wishlist</h1>
              <p className="text-white/70 mt-1 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                {loading ? "Loading..." : products.length === 0 ? "Your wishlist is empty" : `${products.length} items saved`}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <Loader2 className="w-12 h-12 animate-spin text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Loading your wishlist...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mb-8">
                <Heart className="w-16 h-16 text-pink-300" />
              </div>
              <h2 className="font-display text-3xl font-bold mb-3">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-8 max-w-md">
                Start adding products you love by clicking the heart icon on any product
              </p>
              <Link to="/products">
                <Button className="bg-gradient-gold text-primary hover:opacity-90 font-semibold">
                  <ShoppingBag className="w-4 h-4 mr-2" /> Browse Products
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((p) => (
                <div key={p.id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="relative">
                    <img
                      src={p.image_url || "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400"}
                      alt={p.name}
                      className="w-full h-64 object-cover"
                    />
                    <button
                      onClick={() => handleRemove(p.id)}
                      className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors shadow-md"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="p-5">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">{p.category}</div>
                    <h3 className="font-display text-xl font-bold mb-2">{p.name}</h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{p.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="font-display text-2xl font-bold">₹{p.price}</div>
                      <div className="text-xs text-muted-foreground">
                        {p.in_stock
                          ? <span className="text-green-600">In Stock</span>
                          : <span className="text-red-600">Out of Stock</span>}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button
                        className="flex-1 bg-gradient-gold text-primary hover:opacity-90 font-semibold"
                        onClick={() => { cart.add(p); toast.success(`${p.name} added to cart`); }}
                      >
                        Add to Cart
                      </Button>
                      <Button
                        variant="outline"
                        className="flex-shrink-0"
                        onClick={() => handleRemove(p.id)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </Layout>
  );
}
