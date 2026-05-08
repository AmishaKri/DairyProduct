import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { productAPI } from "@/lib/api";
import type { Product } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { useCart, cart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { Heart, Star, Minus, Plus, ShoppingCart, Share2, ChevronRight, Award, Shield, Truck, Zap, Chrome } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [purchaseType, setPurchaseType] = useState<"one-time" | "weekly" | "monthly">("one-time");
  const [selectedSize, setSelectedSize] = useState<string>("1L");
  const { addToCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  // No OAuth token handling needed - using frontend OAuth UI

  const milkSizes = ["500ml", "1L", "2L"];
  const dairySizes = ["500gm", "1kg", "2kg", "1 piece", "500gm pack"];
  const purchaseTypes = [
    { id: "one-time", label: "One Time Purchase" },
    { id: "weekly", label: "Weekly"},
    { id: "monthly", label: "Monthly", },
  ];

  const reviews = [
    { id: 1, name: "Rajesh Kumar", rating: 5, date: "2 days ago", comment: "Excellent quality milk! My family loves it. The freshness is unmatched.", avatar: "RK" },
    { id: 2, name: "Priya Sharma", rating: 4, date: "1 week ago", comment: "Great product, delivered on time. Would recommend to everyone.", avatar: "PS" },
    { id: 3, name: "Amit Patel", rating: 5, date: "2 weeks ago", comment: "Best dairy products I've ever had. The taste is authentic and pure.", avatar: "AP" },
  ];

  useEffect(() => {
    if (id) {
      productAPI.getById(id).then(({ data }) => {
        const mapped = {
          id: data._id,
          name: data.name,
          description: data.description,
          price: data.price,
          category: data.category,
          image_url: data.imageUrl,
          in_stock: data.inStock,
        };
        setProduct(mapped);

        // Fetch related products from same category
        productAPI.getAll(data.category).then(({ data: related }) => {
          const mappedRelated = (related || [])
            .filter((p: any) => p._id !== id)
            .map((p: any) => ({
              id: p._id,
              name: p.name,
              description: p.description,
              price: p.price,
              category: p.category,
              image_url: p.imageUrl,
              in_stock: p.inStock,
            }));
          setRelatedProducts(mappedRelated.slice(0, 4));
        });
      });
    }
  }, [id]);

  if (!product) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
        </div>
      </Layout>
    );
  }

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    toast.success(`Added ${quantity} item(s) to cart`);
  };

  const handleBuyNow = () => {
    // Store buy now intent and redirect to OAuth login page
    storeBuyNowIntent();
    const redirectUrl = `/oauth-login?message=Please sign in to continue with your order&redirect=/checkout`;
    console.log("Redirecting to OAuth login:", redirectUrl);
    navigate(redirectUrl);
  };

  const storeBuyNowIntent = () => {
    // Store product details in localStorage so we can use them after OAuth redirect
    const intent = {
      productId: product?.id,
      productName: product?.name,
      productPrice: product?.price,
      productImage: product?.image_url,
      productCategory: product?.category,
      quantity: quantity,
      purchaseType: purchaseType,
      selectedSize: selectedSize,
      timestamp: Date.now()
    };
    console.log("Storing Buy Now intent:", intent);
    localStorage.setItem("kshira_buynow_intent", JSON.stringify(intent));
    console.log("Intent stored in localStorage");
  };

  const goToCheckout = () => {
    navigate("/checkout", { 
      state: { 
        product: product,
        quantity: quantity,
        purchaseType: purchaseType,
        selectedSize: selectedSize
      } 
    });
  };

  const handleWishlist = async () => {
    if (isInWishlist(product.id)) {
      await removeFromWishlist(product.id);
      toast.success("Removed from wishlist");
    } else {
      await addToWishlist(product.id);
      toast.success("Added to wishlist");
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description || `Check out ${product.name} on Kshira Dairy`,
          url: shareUrl,
        });
        toast.success("Shared successfully");
      } catch (error) {
        toast.error("Failed to share");
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Link copied to clipboard");
      } catch (error) {
        toast.error("Failed to copy link");
      }
    }
  };

  const averageRating = reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length;

  // Calculate price based on size and purchase type
  const getSizeMultiplier = (size: string) => {
    switch (size) {
      // Milk sizes
      case "500ml": return 0.5;
      case "1L": return 1;
      case "2L": return 1.8;
      // Dairy sizes
      case "500gm": return 0.5;
      case "1kg": return 1;
      case "2kg": return 1.8;
      case "1 piece": return 1;
      case "500gm pack": return 0.5;
      default: return 1;
    }
  };

  const getDiscountedPrice = () => {
    const sizeMultiplier = getSizeMultiplier(selectedSize);
    const basePrice = product?.price || 0;
    const discountedPrice = basePrice * sizeMultiplier;
    return Math.round(discountedPrice);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <AnimatedBackground />
        <div className="container py-32 relative z-10">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
            <Link to="/" className="hover:text-accent">{t("navbar.home")}</Link>
            <ChevronRight className="w-4 h-4" />
            <Link to="/products" className="hover:text-accent">{t("navbar.products")}</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-white">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 mb-16">
            {/* Product Images */}
            <div className="space-y-4">
              <div className="relative rounded-3xl overflow-hidden bg-card border border-border aspect-square">
                <img
                  src={product.image_url || "/placeholder-product.jpg"}
                  alt={product.name}
                  className="w-full h-full object-cover animate-fade-in"
                />
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={handleWishlist}
                    className={cn(isInWishlist(product.id) && "bg-red-500 hover:bg-red-600 text-white")}
                  >
                    <Heart className={cn("w-5 h-5", isInWishlist(product.id) && "fill-current")} />
                  </Button>
                  <Button size="icon" variant="secondary" onClick={handleShare}>
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Product Details */}
            <div className="space-y-6">
              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-medium mb-3">
                  {product.category}
                </span>
                <h1 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">{product.name}</h1>
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-5 h-5",
                          i < Math.floor(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-muted-foreground text-sm">({reviews.length} reviews)</span>
                </div>
                <p className="text-3xl font-bold text-gradient-gold">₹{getDiscountedPrice()}</p>
              </div>

              <p className="text-muted-foreground leading-relaxed">{product.description}</p>

              {/* Size Selection - For milk and dairy products */}
              {(product.category === "milk" || product.category === "dairy") && (
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-white">Select Size</label>
                  <div className="flex gap-3 flex-wrap">
                    {(product.category === "milk" ? milkSizes : dairySizes).map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={cn(
                          "px-6 py-3 rounded-xl border-2 transition-all font-semibold",
                          selectedSize === size
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border bg-card text-muted-foreground hover:border-accent/50"
                        )}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Purchase Type Selection - Only for milk */}
              {product.category === "milk" && (
                <div className="space-y-3">
                  <label className="text-sm font-semibold text-white">Purchase Type</label>
                  <div className="grid grid-cols-3 gap-3">
                    {purchaseTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setPurchaseType(type.id as "one-time" | "weekly" | "monthly")}
                        className={cn(
                          "p-4 rounded-xl border-2 transition-all text-left",
                          purchaseType === type.id
                            ? "border-accent bg-accent/10 text-accent"
                            : "border-border bg-card text-muted-foreground hover:border-accent/50"
                        )}
                      >
                        <div className="font-semibold text-sm">{type.label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Features */}
              <div className="grid grid-cols-3 gap-4 py-6 border-y border-border">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center mx-auto mb-2">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Premium Quality</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center mx-auto mb-2">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">100% Organic</p>
                </div>
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center mx-auto mb-2">
                    <Truck className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Fast Delivery</p>
                </div>
              </div>

              {/* Quantity and Add to Cart */}
              <div className="flex items-center gap-4">
                <div className="flex items-center border border-border rounded-lg">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-12 w-12"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-16 text-center font-semibold text-white">{quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setQuantity(Math.min(99, quantity + 1))}
                    className="h-12 w-12"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex gap-3 flex-1">
                  <Button
                    onClick={handleAddToCart}
                    disabled={!product.in_stock}
                    className="flex-1 bg-gradient-gold text-primary hover:opacity-90 font-semibold shadow-gold h-12"
                  >
                    <ShoppingCart className="w-5 h-5 mr-2" />
                    {product.in_stock ? "Add to Cart" : "Out of Stock"}
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    disabled={!product.in_stock}
                    className="flex-1 bg-accent text-primary hover:opacity-90 font-semibold shadow-gold h-12"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Buy Now
                  </Button>
                </div>
              </div>

              <div className="text-sm text-muted-foreground">
                {product.in_stock ? (
                  <span className="text-green-400">✓ In Stock</span>
                ) : (
                  <span className="text-red-400">✗ Out of Stock</span>
                )}
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <section className="mb-16">
            <h2 className="font-display text-3xl font-bold text-white mb-8">Customer Reviews</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-1 bg-card rounded-2xl p-6 border border-border">
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-gradient-gold mb-2">{averageRating.toFixed(1)}</div>
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "w-6 h-6",
                          i < Math.floor(averageRating) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                        )}
                      />
                    ))}
                  </div>
                  <p className="text-muted-foreground">Based on {reviews.length} reviews</p>
                </div>
                <div className="space-y-3">
                  {[5, 4, 3, 2, 1].map((stars) => (
                    <div key={stars} className="flex items-center gap-3">
                      <span className="text-sm w-3">{stars}</span>
                      <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400"
                          style={{ width: `${(reviews.filter((r) => r.rating >= stars).length / reviews.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 space-y-4">
                {reviews.map((review) => (
                  <div key={review.id} className="bg-card rounded-2xl p-6 border border-border animate-fade-in">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-gold flex items-center justify-center text-primary font-bold">
                        {review.avatar}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-white">{review.name}</h4>
                            <p className="text-xs text-muted-foreground">{review.date}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={cn(
                                  "w-4 h-4",
                                  i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
                                )}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-muted-foreground">{review.comment}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* You May Also Like */}
          <section>
            <h2 className="font-display text-3xl font-bold text-white mb-8">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {relatedProducts.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
            {relatedProducts.length === 0 && (
              <p className="text-center text-muted-foreground py-12">No related products found.</p>
            )}
          </section>
        </div>
      </div>
    </Layout>
  );
}
