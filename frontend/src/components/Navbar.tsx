import { useEffect, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, ShoppingBag, X, Sparkles, Heart, Search, Globe, ChevronDown, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { useWishlist } from "@/lib/wishlist-store";
import { productAPI } from "@/lib/api";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

const links = [
  { key: "home", to: "/" },
  { key: "products", to: "/products" },
  { key: "milk", to: "/products?cat=milk" },
  { key: "contact", to: "/contact" },
];

type SearchProduct = { id: string; name: string; price: number; image_url?: string | null; category?: string };

export default function Navbar({ onCartClick }: { onCartClick: () => void }) {
  const { count } = useCart();
  const { count: wishlistCount } = useWishlist();
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const searchRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchProduct[]>([]);
  const [allProducts, setAllProducts] = useState<SearchProduct[]>([]);
  const [langOpen, setLangOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    fn(); window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Fetch products when search opens
  useEffect(() => {
    if (searchOpen) {
      productAPI.getAll().then(({ data }) => {
        const mapped = (data || []).map((p: any) => ({
          id: p._id,
          name: p.name,
          price: p.price,
          image_url: p.imageUrl,
          category: p.category,
        }));
        setAllProducts(mapped);
      });
    }
  }, [searchOpen]);

  // Filter products as user types
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = allProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
    );
    setSearchResults(filtered.slice(0, 6));
  }, [searchQuery, allProducts]);

  // Close search when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <header className={cn(
      "fixed top-0 inset-x-0 z-50 transition-all duration-500",
      scrolled ? "bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-soft" : "bg-transparent"
    )}>
      <div className="container flex h-20 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-gold flex items-center justify-center shadow-gold group-hover:animate-glow-pulse transition-all">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
          </div>
          <div className="leading-tight">
            <div className="font-display font-bold text-xl tracking-tight">Kshira</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-white/80">{t("navbar.premiumDairy")}</div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.to.split("?")[0];
            return (
              <Link key={l.key} to={l.to}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors rounded-md",
                  active ? "text-white" : "text-white/70 hover:text-white"
                )}>
                {t(`navbar.${l.key}`)}
                {active && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-accent" />}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setSearchOpen(!searchOpen)} className="text-black hover:text-black/80">
            <Search className="w-5 h-5" />
          </Button>

          <div className="relative">
            <Button variant="ghost" size="icon" onClick={() => setLangOpen(!langOpen)} className="text-black hover:text-black/80">
              <Globe className="w-5 h-5" />
              <ChevronDown className="w-3 h-3 ml-1" />
            </Button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-2 bg-card border border-border rounded-lg shadow-lg py-2 min-w-[120px] z-50 animate-fade-in">
                <button
                  onClick={() => { setLanguage("en"); setLangOpen(false); }}
                  className={cn("w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors", language === "en" ? "text-accent font-medium" : "text-black")}
                >
                  English
                </button>
                <button
                  onClick={() => { setLanguage("hi"); setLangOpen(false); }}
                  className={cn("w-full px-4 py-2 text-left text-sm hover:bg-secondary transition-colors", language === "hi" ? "text-accent font-medium" : "text-black")}
                >
                  हिंदी
                </button>
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon" asChild className="relative">
            <Link to="/wishlist">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-gold text-primary text-[10px] font-bold flex items-center justify-center animate-scale-in">
                  {wishlistCount}
                </span>
              )}
            </Link>
          </Button>
          <Button variant="ghost" size="icon" onClick={onCartClick} className="relative">
            <ShoppingBag className="w-5 h-5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-gradient-gold text-primary text-[10px] font-bold flex items-center justify-center animate-scale-in">
                {count}
              </span>
            )}
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {searchOpen && (
        <div ref={searchRef} className="border-t border-border bg-background/95 backdrop-blur-xl animate-fade-in">
          <div className="container py-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder={t("navbar.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full pl-12 pr-4 py-3 rounded-lg bg-secondary border border-border text-black placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50"
              />
            </div>

            {/* Search Results Dropdown */}
            {searchQuery.trim() && (
              <div className="mt-3 rounded-lg border border-border bg-card shadow-lg overflow-hidden">
                {searchResults.length > 0 ? (
                  <div className="divide-y divide-border">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/50 cursor-pointer transition-colors"
                        onClick={() => {
                          navigate(`/products/${product.id}`);
                          setSearchOpen(false);
                          setSearchQuery("");
                        }}
                      >
                        <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center overflow-hidden shrink-0">
                          {product.image_url ? (
                            <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingCart className="w-4 h-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-black truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.category || "Product"}</p>
                        </div>
                        <div className="text-sm font-semibold text-accent">₹{product.price}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                    {t("navbar.noProductsFound")} "{searchQuery}"
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {open && (
        <div className="md:hidden bg-background/95 backdrop-blur-xl border-t border-border animate-fade-in">
          <nav className="container py-4 flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.key} to={l.to} onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-md text-sm font-medium text-white hover:bg-secondary transition-colors">
                {t(`navbar.${l.key}`)}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
