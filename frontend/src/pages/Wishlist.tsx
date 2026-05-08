import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { productAPI } from "@/lib/api";
import { useWishlist } from "@/lib/wishlist-store";
import { cart, type Product } from "@/lib/cart-store";
import { Heart, ShoppingBag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function Wishlist() {
  const { productIds, removeFromWishlist } = useWishlist();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    let isMounted = true;

    if (productIds.length === 0) {
      setProducts([]);
      return;
    }

    const fetchProducts = async () => {
      const results = await Promise.allSettled(productIds.map((id) => productAPI.getById(id)));
      const mapped = results
        .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value?.data)
        .map((r) => r.value.data)
        .map((p: any) => ({
          ...p,
          id: p._id,
          image_url: p.imageUrl,
          in_stock: p.inStock,
        }));

      if (isMounted) {
        setProducts(mapped as Product[]);
      }
    };

    fetchProducts();

    return () => { isMounted = false; };
  }, [JSON.stringify(productIds)]);

  const handleRemove = (productId: string) => {
    removeFromWishlist(productId);
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
                {productIds.length === 0 ? "Your wishlist is empty" : `${productIds.length} items saved`}
              </p>
            </div>
          </div>
        </div>
      </section>
      <section className="py-12">
        <div className="container">
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mb-8">
                <Heart className="w-16 h-16 text-pink-300" />
              </div>
              <h2 className="font-display text-3xl font-bold mb-3">Your wishlist is empty</h2>
              <p className="text-muted-foreground mb-8 max-w-md">Start adding products you love by clicking the heart icon on any product</p>
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
                        {p.in_stock ? <span className="text-green-600">In Stock</span> : <span className="text-red-600">Out of Stock</span>}
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
