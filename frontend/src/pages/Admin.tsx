import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import AdminSidebar from "@/components/AdminSidebar";
import { authAPI, productAPI, orderAPI, wishlistAPI, couponAPI } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash2, Package, ShoppingBag, Edit, Heart, LayoutDashboard, Tag, ToggleLeft, ToggleRight, Percent, IndianRupee, Star, Menu } from "lucide-react";

type Product = { _id: string; name: string; description: string | null; price: number; category: string; imageUrl: string | null; inStock: boolean; discount: number; highlighted: boolean };
type Coupon = { _id: string; code: string; discountType: "percent" | "flat"; discountValue: number; minOrderValue: number; maxUses: number | null; usedCount: number; isActive: boolean; expiresAt: string | null };
type Order = { _id: string; customerName: string; customerPhone: string; customerAddress: string; total: number; paymentMethod: string; status: string; transactionId: string | null; createdAt: string; items: any };
type WishlistItem = { _id: string; userId: { email: string } | null; sessionId: string | null; productId: { _id: string; name: string; price: number; imageUrl: string }; createdAt: string };

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [authChecked, setAuthChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlists, setWishlists] = useState<WishlistItem[]>([]);
  const [lastWishlistCount, setLastWishlistCount] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", price: "", category: "milk", imageUrl: "" });
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ id: "", name: "", description: "", price: "", category: "milk", imageUrl: "", inStock: true, discount: "0" });
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponForm, setCouponForm] = useState({ code: "", discountType: "percent" as "percent" | "flat", discountValue: "", minOrderValue: "0", maxUses: "", expiresAt: "" });
  const [couponDialogOpen, setCouponDialogOpen] = useState(false);
  const [pricingProduct, setPricingProduct] = useState<Product | null>(null);
  const [pricingForm, setPricingForm] = useState({ price: "", discount: "" });
  const [pricingDialogOpen, setPricingDialogOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const deliveredOrders = orders.filter((o) => o.status === "delivered").length;
  const deliveredRate = orders.length ? Math.round((deliveredOrders / orders.length) * 100) : 0;
  const averageOrderValue = orders.length ? totalRevenue / orders.length : 0;
  const totalItemsSold = orders.reduce((sum, order) => {
    const lineItems = Array.isArray(order.items) ? order.items : [];
    return sum + lineItems.reduce((s, item) => s + (item.quantity || 0), 0);
  }, 0);
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
  const recentWishlist = wishlists.slice(0, 5);
  const topProducts = (() => {
    const tally: Record<string, { name: string; quantity: number }> = {};
    orders.forEach((order) => {
      const lineItems = Array.isArray(order.items) ? order.items : [];
      lineItems.forEach((item: any) => {
        if (!item?.name) return;
        tally[item.name] = tally[item.name]
          ? { name: item.name, quantity: tally[item.name].quantity + (item.quantity || 0) }
          : { name: item.name, quantity: item.quantity || 0 };
      });
    });
    return Object.values(tally).sort((a, b) => b.quantity - a.quantity).slice(0, 3);
  })();

  useEffect(() => {
    // Require admin token only
    const adminToken = localStorage.getItem("kshira_admin_token");

    if (!adminToken) {
      setIsAdmin(false);
      setAuthChecked(true);
      navigate("/admin-login");
      return;
    }

    setIsAdmin(true);
    setAuthChecked(true);
    load();
  }, []);

  const load = async () => {
    try {
      const { data: p } = await productAPI.getAll();
      setProducts(p || []);
      const { data: o } = await orderAPI.getAll();
      setOrders(o || []);
      try {
        const { data: w } = await wishlistAPI.getAllAdmin();
        setWishlists(w || []);
      } catch (wishlistError: any) {
        console.error("Failed to load wishlist:", wishlistError.response?.data);
        setWishlists([]);
      }
      const { data: c } = await couponAPI.getAll();
      setCoupons(c || []);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  // Poll for new wishlist additions
  useEffect(() => {
    if (!isAdmin) return;

    const pollInterval = setInterval(async () => {
      try {
        const { data: w } = await wishlistAPI.getAllAdmin();
        const currentCount = w?.length || 0;
        
        if (currentCount > lastWishlistCount && lastWishlistCount > 0) {
          // New wishlist item added
          const newItem = w?.[0];
          if (newItem?.productId?.name) {
            toast.success(`❤️ ${newItem.userId.email} added ${newItem.productId.name} to wishlist!`);
          }
        }
        
        setLastWishlistCount(currentCount);
        setWishlists(w || []);
      } catch (error) {
        console.error("Failed to poll wishlist:", error);
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(pollInterval);
  }, [isAdmin, lastWishlistCount]);

  const addProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(form.price);
    if (!form.name || isNaN(price)) { toast.error("Name and price required"); return; }
    try {
      await productAPI.create({
        name: form.name,
        description: form.description || null,
        price,
        category: form.category,
        imageUrl: form.imageUrl || null,
      });
      toast.success("Product added");
      setForm({ name: "", description: "", price: "", category: "milk", imageUrl: "" });
      setAddDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message);
    }
  };

  const deleteProduct = async (id: string) => {
    try {
      await productAPI.delete(id);
      toast.success("Deleted");
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message);
    }
  };

  const openEditDialog = (product: Product) => {
    setEditForm({
      id: product._id,
      name: product.name,
      description: product.description || "",
      price: String(product.price),
      category: product.category,
      imageUrl: product.imageUrl || "",
      inStock: product.inStock,
      discount: String(product.discount || 0),
    });
    setEditDialogOpen(true);
  };

  const openPricingDialog = (product: Product) => {
    setPricingProduct(product);
    setPricingForm({ price: String(product.price), discount: String(product.discount || 0) });
    setPricingDialogOpen(true);
  };

  const savePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricingProduct) return;
    try {
      await productAPI.update(pricingProduct._id, {
        price: parseFloat(pricingForm.price),
        discount: parseFloat(pricingForm.discount) || 0,
      });
      toast.success("Pricing updated");
      setPricingDialogOpen(false);
      load();
    } catch (e: any) { toast.error(e.response?.data?.error || e.message); }
  };

  const createCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await couponAPI.create({
        code: couponForm.code,
        discountType: couponForm.discountType,
        discountValue: parseFloat(couponForm.discountValue),
        minOrderValue: parseFloat(couponForm.minOrderValue) || 0,
        maxUses: couponForm.maxUses ? parseInt(couponForm.maxUses) : null,
        expiresAt: couponForm.expiresAt || null,
      });
      toast.success("Coupon created");
      setCouponDialogOpen(false);
      setCouponForm({ code: "", discountType: "percent", discountValue: "", minOrderValue: "0", maxUses: "", expiresAt: "" });
      load();
    } catch (e: any) { toast.error(e.response?.data?.error || e.message); }
  };

  const toggleCoupon = async (id: string) => {
    try { await couponAPI.toggle(id); load(); } catch (e: any) { toast.error(e.message); }
  };

  const deleteCoupon = async (id: string) => {
    try { await couponAPI.delete(id); toast.success("Deleted"); load(); } catch (e: any) { toast.error(e.message); }
  };

  const updateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const price = parseFloat(editForm.price);
    if (!editForm.name || isNaN(price)) { toast.error("Name and price required"); return; }
    try {
      await productAPI.update(editForm.id, {
        name: editForm.name,
        description: editForm.description || null,
        price,
        category: editForm.category,
        imageUrl: editForm.imageUrl || null,
        inStock: editForm.inStock,
        discount: parseFloat(editForm.discount) || 0,
      });
      toast.success("Product updated");
      setEditDialogOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message);
    }
  };

  const toggleHighlight = async (id: string) => {
    try {
      await productAPI.toggleHighlight(id);
      setProducts((prev) => prev.map((p) => p._id === id ? { ...p, highlighted: !p.highlighted } : p));
      toast.success("Product highlight updated!");
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Failed to update");
    }
  };

  const updateOrderStatus = async (id: string, status: string) => {
    try {
      await orderAPI.updateStatus(id, status);
      load();
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message);
    }
  };

  const logout = () => {
    localStorage.removeItem("kshira_admin_token");
    navigate("/admin-login");
  };

  if (!authChecked) return <Layout><div className="container pt-40">Loading...</div></Layout>;

  if (!isAdmin) {
    return (
      <Layout>
        <div className="container pt-40 pb-20 max-w-xl text-center">
          <h1 className="font-display text-3xl font-bold mb-4">Admin access required</h1>
          <p className="text-muted-foreground mb-6">
            Your account doesn't have admin role yet. Please sign up as a new user (first user becomes admin) or use the "Make Me Admin" button on the login page.
          </p>
          <Button onClick={logout} variant="outline">Sign out</Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout hideNavbar>
      <div className="flex flex-1 min-h-full">
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onLogout={logout}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar */}
          <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border sticky top-0 bg-background z-30">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="font-display font-semibold text-lg">Admin Panel</span>
          </div>

        <main className="flex-1 p-4 md:p-8 pb-12 lg:mt-8">
          <div className="max-w-6xl mx-auto">
            {activeTab === "dashboard" && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-[#0f172a] via-[#111e3a] to-[#1e3a8a] text-white rounded-3xl p-5 md:p-8 border border-white/10 shadow-2xl">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
                    <div>
                      <p className="text-sm uppercase tracking-[0.3em] text-white/70">Kshira Insights</p>
                      <h1 className="font-display text-3xl md:text-4xl font-bold mt-2">Welcome back, Admin</h1>
                      <p className="text-white/70 mt-2 max-w-2xl">
                        Monitor live orders, revenue, and wishlist love from your customers. Data refreshes automatically every few seconds.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 w-full lg:min-w-[260px] lg:w-auto">
                      <div className="bg-white/10 rounded-2xl p-4">
                        <p className="text-xs uppercase tracking-wider text-white/70">Revenue</p>
                        <p className="text-3xl font-bold">₹{totalRevenue.toFixed(0)}</p>
                        <p className="text-[11px] text-white/60">Avg order ₹{averageOrderValue.toFixed(0)}</p>
                      </div>
                      <div className="bg-white/10 rounded-2xl p-4">
                        <p className="text-xs uppercase tracking-wider text-white/70">Delivery rate</p>
                        <p className="text-3xl font-bold">{deliveredRate}%</p>
                        <p className="text-[11px] text-white/60">{deliveredOrders} of {orders.length} delivered</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Products</p>
                        <p className="font-display text-3xl font-bold">{products.length}</p>
                      </div>
                      <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                        <Package className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Inventory curated across milk and dairy lines.</p>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Orders</p>
                        <p className="font-display text-3xl font-bold">{orders.length}</p>
                      </div>
                      <div className="w-11 h-11 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">{pendingOrders} pending • {totalItemsSold} items sold</p>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Wishlist Love</p>
                        <p className="font-display text-3xl font-bold">{wishlists.length}</p>
                      </div>
                      <div className="w-11 h-11 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center">
                        <Heart className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Latest add • {recentWishlist[0]?.userId?.email ?? "Guest"}</p>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Order Value</p>
                        <p className="font-display text-3xl font-bold">₹{averageOrderValue.toFixed(0)}</p>
                      </div>
                      <div className="w-11 h-11 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center">
                        <LayoutDashboard className="w-5 h-5" />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-3">Performance over last {orders.length || 0} orders.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 bg-card border border-border rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <h2 className="font-display text-2xl font-bold">Recent Orders</h2>
                        <p className="text-muted-foreground text-sm">Latest {recentOrders.length} orders placed</p>
                      </div>
                      <span className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">Live feed</span>
                    </div>
                    {recentOrders.length === 0 ? (
                      <div className="text-center py-12 text-muted-foreground">No orders yet.</div>
                    ) : (
                      <div className="space-y-4">
                        {recentOrders.map((order) => (
                          <div key={order._id} className="flex flex-wrap items-center justify-between gap-3 border border-border/60 rounded-2xl p-4">
                            <div>
                              <p className="font-semibold">{order.customerName}</p>
                              <p className="text-xs text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-display text-xl font-bold">₹{Number(order.total).toFixed(0)}</p>
                              <p className="text-xs uppercase tracking-wider text-muted-foreground">{order.status}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="space-y-6">
                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                      <h2 className="font-display text-xl font-bold mb-3">Top Products</h2>
                      {topProducts.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Sales data will appear after orders are placed.</p>
                      ) : (
                        <div className="space-y-3">
                          {topProducts.map((product) => (
                            <div key={product.name} className="flex items-center justify-between">
                              <div className="font-semibold">{product.name}</div>
                              <div className="text-sm text-muted-foreground">{product.quantity} sold</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
                      <h2 className="font-display text-xl font-bold mb-3">Latest Wishlist</h2>
                      {recentWishlist.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No wishlist activity yet.</p>
                      ) : (
                        <div className="space-y-3">
                          {recentWishlist.map((item) => (
                            <div key={item._id} className="flex items-center justify-between">
                              <div>
                                <p className="font-semibold">{item.productId.name}</p>
                                <p className="text-xs text-muted-foreground">{item.userId?.email ?? "Guest"}</p>
                              </div>
                              <span className="text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "products" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h1 className="font-display text-2xl sm:text-4xl font-bold">Products</h1>
                  <Button onClick={() => setAddDialogOpen(true)} className="bg-gradient-gold text-primary hover:opacity-90 font-semibold w-full sm:w-auto">
                    + Add Product
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {products.map((p) => (
                    <div key={p._id} className={`bg-card border rounded-2xl p-4 flex gap-3 ${p.highlighted ? "border-yellow-400 shadow-[0_0_0_1px_rgba(250,204,21,0.4)]" : "border-border"}`}>
                      <div className="relative">
                        <img src={p.imageUrl || "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200"}
                          alt={p.name} className="w-20 h-20 rounded-lg object-cover" />
                        {p.highlighted && (
                          <span className="absolute -top-1.5 -left-1.5 bg-yellow-400 text-yellow-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full">FEATURED</span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{p.name}</div>
                        <div className="text-xs text-muted-foreground capitalize">{p.category}</div>
                        <div className="font-display font-bold mt-1">₹{Number(p.price).toFixed(0)}</div>
                        <div className="text-xs text-muted-foreground">{p.inStock ? "In Stock" : "Out of Stock"}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button
                          size="icon" variant="ghost"
                          className={`h-8 w-8 ${p.highlighted ? "text-yellow-500" : "text-muted-foreground"}`}
                          title={p.highlighted ? "Remove from featured" : "Mark as featured"}
                          onClick={() => toggleHighlight(p._id)}
                        >
                          <Star className={`w-4 h-4 ${p.highlighted ? "fill-current" : ""}`} />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEditDialog(p)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost" className="text-destructive h-8 w-8" onClick={() => deleteProduct(p._id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="space-y-6">
                <h1 className="font-display text-2xl sm:text-4xl font-bold">Orders</h1>
                {orders.length === 0 && <div className="text-center py-12 text-muted-foreground">No orders yet.</div>}
                {orders.map((o) => (
                  <div key={o._id} className="bg-card border border-border rounded-2xl p-4 md:p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                      <div className="min-w-0">
                        <div className="font-display text-base md:text-lg font-bold truncate">{o.customerName}</div>
                        <div className="text-xs md:text-sm text-muted-foreground">{o.customerPhone} • {new Date(o.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-display text-xl md:text-2xl font-bold">₹{Number(o.total).toFixed(0)}</div>
                        <div className="text-xs uppercase tracking-wider text-muted-foreground">{o.paymentMethod}</div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">{o.customerAddress}</div>
                    {o.transactionId && <div className="text-xs">Txn: <code>{o.transactionId}</code></div>}
                    <div className="text-sm mt-3 space-y-1">
                      {(o.items as any[]).map((i: any, idx: number) => (
                        <div key={idx}>• {i.name} × {i.quantity}</div>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      {["pending", "confirmed", "delivered"].map((s) => (
                        <Button key={s} size="sm" variant={o.status === s ? "default" : "outline"}
                          onClick={() => updateOrderStatus(o._id, s)}
                          className={o.status === s ? "bg-gradient-gold text-primary" : ""}>
                          {s}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "pricing" && (
              <div className="space-y-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h1 className="font-display text-2xl sm:text-4xl font-bold">Pricing & Coupons</h1>
                    <p className="text-muted-foreground mt-1">Manage product prices, discounts and coupon codes</p>
                  </div>
                  <Button onClick={() => setCouponDialogOpen(true)} className="bg-gradient-gold text-primary hover:opacity-90 font-semibold w-full sm:w-auto">
                    <Tag className="w-4 h-4 mr-2" /> + New Coupon
                  </Button>
                </div>

                {/* Product Pricing */}
                <div>
                  <h2 className="font-display text-2xl font-bold mb-4">Product Pricing</h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((p) => {
                      const discountedPrice = p.discount > 0 ? p.price * (1 - p.discount / 100) : p.price;
                      return (
                        <div key={p._id} className="bg-card border border-border rounded-2xl p-4">
                          <div className="flex items-start gap-3">
                            <img src={p.imageUrl || "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200"}
                              alt={p.name} className="w-14 h-14 rounded-xl object-cover" />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate">{p.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="font-bold text-lg">₹{Number(p.price).toFixed(0)}</span>
                                {p.discount > 0 && (
                                  <>
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">{p.discount}% OFF</span>
                                    <span className="text-sm text-green-600 font-semibold">→ ₹{discountedPrice.toFixed(0)}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="w-full mt-3 gap-2" onClick={() => openPricingDialog(p)}>
                            <Edit className="w-3 h-3" /> Edit Price & Discount
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Coupons */}
                <div>
                  <h2 className="font-display text-2xl font-bold mb-4">Coupon Codes</h2>
                  {coupons.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border border-dashed border-border rounded-2xl">
                      No coupons yet. Create one to get started.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {coupons.map((c) => (
                        <div key={c._id} className="bg-card border border-border rounded-2xl p-4 flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                              <Tag className="w-5 h-5 text-accent" />
                            </div>
                            <div>
                              <p className="font-mono font-bold text-lg">{c.code}</p>
                              <p className="text-xs text-muted-foreground">
                                {c.discountType === "percent" ? `${c.discountValue}% off` : `₹${c.discountValue} off`}
                                {c.minOrderValue > 0 && ` • Min ₹${c.minOrderValue}`}
                                {c.maxUses && ` • ${c.usedCount}/${c.maxUses} used`}
                                {!c.maxUses && ` • ${c.usedCount} used`}
                                {c.expiresAt && ` • Expires ${new Date(c.expiresAt).toLocaleDateString()}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                              c.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                            }`}>
                              {c.isActive ? "Active" : "Inactive"}
                            </span>
                            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => toggleCoupon(c._id)}>
                              {c.isActive ? <ToggleRight className="w-5 h-5 text-green-600" /> : <ToggleLeft className="w-5 h-5 text-muted-foreground" />}
                            </Button>
                            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteCoupon(c._id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "wishlist" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h1 className="font-display text-2xl sm:text-4xl font-bold">Wishlist</h1>
                  <div className="text-sm text-muted-foreground">{wishlists.length} total items</div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0">
                      <Heart className="w-5 h-5 fill-current" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Total Wishlisted</p>
                      <p className="font-display text-3xl font-bold">{wishlists.length}</p>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unique Products</p>
                      <p className="font-display text-3xl font-bold">
                        {new Set(wishlists.map((w) => w.productId?._id ?? w.productId?.name)).size}
                      </p>
                    </div>
                  </div>
                  <div className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-full bg-green-100 text-green-600 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Unique Users</p>
                      <p className="font-display text-3xl font-bold">
                        {new Set(wishlists.map((w) => w.userId?.email ?? w.sessionId)).size}
                      </p>
                    </div>
                  </div>
                </div>

                {wishlists.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-100 to-rose-100 flex items-center justify-center mb-6">
                      <Heart className="w-12 h-12 text-pink-300" />
                    </div>
                    <h2 className="font-display text-2xl font-bold mb-2">No wishlist items yet</h2>
                    <p className="text-muted-foreground">Items added to wishlist by customers will appear here</p>
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {wishlists.map((w) => (
                      <div key={w._id} className="bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                        {/* Product image */}
                        <div className="relative h-44 bg-gradient-to-br from-pink-50 to-rose-50">
                          {w.productId?.imageUrl ? (
                            <img
                              src={w.productId.imageUrl}
                              alt={w.productId.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Heart className="w-14 h-14 text-pink-300 fill-current" />
                            </div>
                          )}
                          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-bold shadow">
                            ₹{w.productId?.price}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="p-4 space-y-2">
                          <div className="font-semibold text-lg leading-tight truncate">{w.productId?.name}</div>
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 ${
                              w.userId?.email
                                ? "bg-gradient-to-br from-blue-400 to-indigo-500"
                                : "bg-gradient-to-br from-gray-400 to-gray-500"
                            }`}>
                              {w.userId?.email?.[0]?.toUpperCase() ?? "G"}
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {w.userId?.email ?? (
                                <span className="italic">Guest · {w.sessionId?.slice(0, 8)}</span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground pt-1">
                            Added on {new Date(w.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
        </div>
      </div>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={addProduct} className="space-y-4">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
            <div><Label>Price (₹)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></div>
            <div><Label>Category</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="milk">Milk</option>
                <option value="dairy">Dairy</option>
              </select>
            </div>
            <div><Label>Image URL (optional)</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-gradient-gold text-primary hover:opacity-90 font-semibold">Add Product</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <form onSubmit={updateProduct} className="space-y-4">
            <div><Label>Name</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Price (₹)</Label><Input type="number" step="0.01" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} required /></div>
              <div><Label>Discount (%)</Label><Input type="number" min="0" max="100" value={editForm.discount} onChange={(e) => setEditForm({ ...editForm, discount: e.target.value })} placeholder="0" /></div>
            </div>
            <div><Label>Category</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}>
                <option value="milk">Milk</option>
                <option value="dairy">Dairy</option>
              </select>
            </div>
            <div><Label>Image URL (optional)</Label><Input value={editForm.imageUrl} onChange={(e) => setEditForm({ ...editForm, imageUrl: e.target.value })} /></div>
            <div><Label>Description</Label><Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} /></div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="in_stock" checked={editForm.inStock} onChange={(e) => setEditForm({ ...editForm, inStock: e.target.checked })} />
              <Label htmlFor="in_stock">In Stock</Label>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-gradient-gold text-primary hover:opacity-90 font-semibold">Update Product</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Pricing Dialog */}
      <Dialog open={pricingDialogOpen} onOpenChange={setPricingDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Pricing — {pricingProduct?.name}</DialogTitle>
          </DialogHeader>
          <form onSubmit={savePricing} className="space-y-4">
            <div className="bg-secondary/40 rounded-xl p-4 text-sm space-y-1">
              <p className="text-muted-foreground">Current price: <strong>₹{pricingProduct?.price}</strong></p>
              {(pricingProduct?.discount ?? 0) > 0 && (
                <p className="text-green-600">Current discount: <strong>{pricingProduct?.discount}%</strong> → ₹{((pricingProduct?.price || 0) * (1 - (pricingProduct?.discount || 0) / 100)).toFixed(0)}</p>
              )}
            </div>
            <div>
              <Label className="flex items-center gap-1"><IndianRupee className="w-4 h-4" /> New Price (₹)</Label>
              <Input type="number" step="0.01" min="1" value={pricingForm.price} onChange={(e) => setPricingForm({ ...pricingForm, price: e.target.value })} required />
            </div>
            <div>
              <Label className="flex items-center gap-1"><Percent className="w-4 h-4" /> Discount (0–100%)</Label>
              <Input type="number" min="0" max="100" value={pricingForm.discount} onChange={(e) => setPricingForm({ ...pricingForm, discount: e.target.value })} placeholder="0" />
              {parseFloat(pricingForm.discount) > 0 && parseFloat(pricingForm.price) > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  Discounted price: ₹{(parseFloat(pricingForm.price) * (1 - parseFloat(pricingForm.discount) / 100)).toFixed(0)}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPricingDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-gradient-gold text-primary hover:opacity-90 font-semibold">Save Pricing</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Coupon Dialog */}
      <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Coupon Code</DialogTitle>
          </DialogHeader>
          <form onSubmit={createCoupon} className="space-y-4">
            <div>
              <Label>Coupon Code</Label>
              <Input value={couponForm.code} onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })} placeholder="e.g. SAVE20" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Discount Type</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  value={couponForm.discountType} onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value as "percent" | "flat" })}>
                  <option value="percent">Percentage (%)</option>
                  <option value="flat">Flat Amount (₹)</option>
                </select>
              </div>
              <div>
                <Label>Value ({couponForm.discountType === "percent" ? "%" : "₹"})</Label>
                <Input type="number" min="1" value={couponForm.discountValue} onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })} required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Min Order Value (₹)</Label>
                <Input type="number" min="0" value={couponForm.minOrderValue} onChange={(e) => setCouponForm({ ...couponForm, minOrderValue: e.target.value })} />
              </div>
              <div>
                <Label>Max Uses (blank = unlimited)</Label>
                <Input type="number" min="1" value={couponForm.maxUses} onChange={(e) => setCouponForm({ ...couponForm, maxUses: e.target.value })} placeholder="Unlimited" />
              </div>
            </div>
            <div>
              <Label>Expiry Date (optional)</Label>
              <Input type="date" value={couponForm.expiresAt} onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCouponDialogOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-gradient-gold text-primary hover:opacity-90 font-semibold">Create Coupon</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
