import { Plus, Heart, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cart, type Product } from "@/lib/cart-store";
import { wishlist } from "@/lib/wishlist-store";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const FALLBACK = "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&q=80";

export default function ProductCard({ product, index = 0 }: { product: Product; index?: number }) {
  const [isWishlisted, setIsWishlisted] = useState(false);

  useEffect(() => {
    setIsWishlisted(wishlist.has(product.id));
  }, [product.id]);

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (isWishlisted) {
      await wishlist.remove(product.id);
      setIsWishlisted(false);
      toast.success("Removed from wishlist");
    } else {
      await wishlist.add(product.id);
      setIsWishlisted(true);
      toast.success("Added to wishlist");
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    cart.add(product);
    toast.success(`${product.name} added`);
  };

  return (
    <Link to={`/products/${product.id}`}>
      <div
        className="group bg-gradient-card rounded-2xl overflow-hidden border border-border shadow-soft hover:shadow-elegant transition-all duration-500 hover:-translate-y-2 animate-fade-in-up cursor-pointer"
        style={{ animationDelay: `${index * 0.08}s`, opacity: 0 }}
      >
        <div className="aspect-square overflow-hidden bg-secondary relative">
          <img
            src={product.image_url || FALLBACK}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {product.highlighted && (
            <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-gold text-primary text-[10px] font-bold uppercase tracking-wider shadow-gold">
              <Star className="w-2.5 h-2.5 fill-current" /> Featured
            </div>
          )}
          {!product.highlighted && (
            <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-background/80 backdrop-blur text-[10px] uppercase tracking-wider font-semibold">
              {product.category}
            </div>
          )}
          <Button
            size="icon"
            variant="ghost"
            className={`absolute top-3 right-3 h-8 w-8 rounded-full bg-background/80 backdrop-blur hover:bg-background ${isWishlisted ? "text-red-500" : "text-muted-foreground"}`}
            onClick={handleWishlistToggle}
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
          </Button>
        </div>
        <div className="p-5 space-y-3">
          <div>
            <h3 className="font-display font-bold text-lg leading-tight">{product.name}</h3>
            {product.description && (
              <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{product.description}</p>
            )}
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="font-display text-2xl font-bold">
              ₹{Number(product.price).toFixed(0)}
            </div>
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="bg-gradient-gold text-primary hover:opacity-90 font-semibold shadow-gold"
            >
              <Plus className="w-4 h-4 mr-1" /> Add
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
