import { useState, useRef, useEffect, useCallback } from "react";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart, cart } from "@/lib/cart-store";
import { orderAPI } from "@/lib/api";
import { useNavigate, Link, useSearchParams, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { Shield, ChevronDown, Lock, MapPin, Loader2, Chrome } from "lucide-react";
import { cn } from "@/lib/utils";
import PaymentModal from "@/components/PaymentModal";

const SHOP_PHONE = "919876543210";
const FALLBACK_IMG = "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=100&q=80";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh",
];

const schema = z.object({
  firstName: z.string().trim().min(2, "First name is required"),
  lastName: z.string().trim().min(1, "Last name is required"),
  address: z.string().trim().min(5, "Address is required"),
  apartment: z.string().trim().min(1, "Apartment / flat number is required"),
  city: z.string().trim().min(2, "City is required"),
  state: z.string().trim().min(2, "State is required"),
  pinCode: z.string().trim().regex(/^\d{6}$/, "Enter valid 6-digit PIN"),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile number"),
});

export default function Checkout() {
  const { items, total } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  // Check if product was passed from Buy Now
  const productState = location.state as { 
    product?: any; 
    quantity?: number; 
    purchaseType?: string; 
    selectedSize?: string 
  };
  
  // Use product from Buy Now or cart items
  const checkoutItems = productState?.product 
    ? [{ ...productState.product, quantity: productState.quantity || 1 }]
    : items;
  
  const checkoutTotal = productState?.product 
    ? (productState.product.price * (productState.quantity || 1))
    : total;
  const [submitting, setSubmitting] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [billingOption, setBillingOption] = useState<"same" | "different">("same");
  const [form, setForm] = useState({
    firstName: "", lastName: "", address: "", apartment: "",
    city: "", state: "Delhi", pinCode: "", phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Address autocomplete
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [addrLoading, setAddrLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) { toast.error("Geolocation not supported by your browser"); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const data = await res.json();
          const a = data.address || {};
          const street = [a.road, a.suburb, a.neighbourhood, a.quarter].filter(Boolean).join(", ");
          const city = a.city || a.town || a.village || a.county || "";
          const state = a.state || "";
          const pin = a.postcode || "";
          const matchedState = INDIAN_STATES.find((s) => s.toLowerCase() === state.toLowerCase()) || state;
          setForm((f) => ({
            ...f,
            address: street || data.display_name?.split(",")[0] || f.address,
            city: city || f.city,
            state: matchedState || f.state,
            pinCode: pin || f.pinCode,
          }));
          setErrors((e) => ({ ...e, address: "", city: "", pinCode: "" }));
          toast.success("📍 Location detected and address filled!");
        } catch {
          toast.error("Could not fetch address from your location");
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED)
          toast.error("Location permission denied. Please allow it in browser settings and try again.");
        else
          toast.error("Could not get your location. Try again.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // Trigger location popup on mount
  useEffect(() => { detectLocation(); }, []);

  const fetchSuggestions = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.length < 4) { setSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      setAddrLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&addressdetails=1&limit=6&countrycodes=in`,
          { headers: { "Accept-Language": "en" } }
        );
        const data = await res.json();
        setSuggestions(data || []);
        setShowSuggestions((data || []).length > 0);
      } catch { setSuggestions([]); }
      finally { setAddrLoading(false); }
    }, 400);
  }, []);

  const selectSuggestion = (item: any) => {
    const a = item.address || {};
    const street = [a.road, a.suburb, a.neighbourhood, a.quarter].filter(Boolean).join(", ");
    const city = a.city || a.town || a.village || a.county || "";
    const state = a.state || "";
    const pin = a.postcode || "";
    const matchedState = INDIAN_STATES.find((s) => s.toLowerCase() === state.toLowerCase()) || state;
    setForm((f) => ({
      ...f,
      address: street || item.display_name.split(",")[0],
      city,
      state: matchedState || f.state,
      pinCode: pin,
    }));
    setErrors((e) => ({ ...e, address: "", city: "", pinCode: "" }));
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const set = (key: string, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  if (checkoutItems.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
          <div className="text-6xl">🛒</div>
          <h1 className="font-display text-3xl font-bold">Your cart is empty</h1>
          <Button asChild className="bg-gradient-gold text-primary">
            <Link to="/products">Shop products</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const validateForm = () => {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((i) => { errs[i.path[0] as string] = i.message; });
      setErrors(errs);
      toast.error("Please fill all required fields correctly");
      return false;
    }
    return true;
  };

  const openPayment = () => {
    if (!validateForm()) return;
    setPaymentOpen(true);
  };

  const placeOrder = async (paymentMethod: string, txnId?: string) => {
    setPaymentOpen(false);
    setSubmitting(true);
    try {
      const fullAddress = `${form.address}${form.apartment ? ", " + form.apartment : ""}, ${form.city}, ${form.state} - ${form.pinCode}`;
      const { data } = await orderAPI.create({
        customerName: `${form.firstName} ${form.lastName}`,
        customerPhone: form.phone,
        customerAddress: fullAddress,
        items: checkoutItems,
        total: checkoutTotal,
        paymentMethod: "cashfree",
        transactionId: txnId || null,
      });

      const itemsText = checkoutItems.map((i) => `• ${i.name} × ${i.quantity} = ₹${(i.price * i.quantity).toFixed(0)}`).join("%0A");
      const msg =
        `*New Order #${data._id.slice(0, 8)}*%0A%0A` +
        `*Customer:* ${form.firstName} ${form.lastName}%0A` +
        `*Phone:* ${form.phone}%0A` +
        `*Address:* ${fullAddress}%0A%0A` +
        `*Items:*%0A${itemsText}%0A%0A` +
        `*Total:* ₹${checkoutTotal.toFixed(0)}%0A` +
        `*Payment:* ${paymentMethod.toUpperCase()}` +
        (txnId ? `%0A*Txn ID:* ${txnId}` : "");
      window.open(`https://wa.me/${SHOP_PHONE}?text=${msg}`, "_blank");

      cart.clear();
      toast.success("Order placed successfully!");
      navigate(`/order-success?id=${data._id}`);
    } catch (e: any) {
      toast.error(e.response?.data?.error || e.message || "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  const shippingReady = form.address && form.city && form.state && form.pinCode;

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_440px] min-h-screen">

          {/* ── Left: Form ── */}
          <div className="px-6 md:px-12 py-10 lg:border-r border-border space-y-8">

            {/* Brand */}
            <div className="flex items-center gap-2 mb-2">
              <span className="font-display text-2xl font-bold text-gradient-gold">Kshira</span>
              <span className="text-muted-foreground text-sm">/ Checkout</span>
            </div>

            {/* Steps */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link to="/cart" className="hover:text-accent">Cart</Link>
              <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
              <span className="text-foreground font-semibold">Information</span>
              <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
              <span>Shipping</span>
              <ChevronDown className="w-3 h-3 rotate-[-90deg]" />
              <span>Payment</span>
            </div>

            
            {/* Delivery */}
            <div className="space-y-4">
              <h2 className="font-semibold text-lg text-foreground">Delivery</h2>

              {/* Country */}
              <div className="relative">
                <label className="absolute top-2 left-3 text-xs text-muted-foreground">Country/Region</label>
                <select className="w-full pt-6 pb-2 px-3 border border-border rounded-xl bg-background text-sm appearance-none focus:ring-2 focus:ring-accent/50 outline-none">
                  <option>India</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <label className="absolute top-2 left-3 text-xs text-muted-foreground">First name <span className="text-red-500">*</span></label>
                  <Input
                    value={form.firstName}
                    onChange={(e) => set("firstName", e.target.value)}
                    className={cn("pt-6 pb-2 h-auto rounded-xl", errors.firstName && "border-red-500")}
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div className="relative">
                  <label className="absolute top-2 left-3 text-xs text-muted-foreground">Last name <span className="text-red-500">*</span></label>
                  <Input
                    value={form.lastName}
                    onChange={(e) => set("lastName", e.target.value)}
                    className={cn("pt-6 pb-2 h-auto rounded-xl", errors.lastName && "border-red-500")}
                  />
                  {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                </div>
              </div>

              {/* Address with live autocomplete */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground font-medium">Address <span className="text-red-500">*</span></span>
                <button
                  type="button"
                  onClick={detectLocation}
                  disabled={locating}
                  className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 font-semibold disabled:opacity-60 transition"
                >
                  {locating
                    ? <><Loader2 className="w-3 h-3 animate-spin" /> Detecting...</>
                    : <><MapPin className="w-3 h-3" /> Use My Location</>}
                </button>
              </div>
              <div className="relative" ref={wrapperRef}>
                <label className="absolute top-2 left-3 text-xs text-muted-foreground z-10"></label>
                <div className="relative">
                  <Input
                    value={form.address}
                    onChange={(e) => { set("address", e.target.value); fetchSuggestions(e.target.value); }}
                    onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                    autoComplete="off"
                    className={cn("pt-6 pb-2 h-auto rounded-xl pr-10", errors.address && "border-red-500")}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {addrLoading
                      ? <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                      : <MapPin className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}

                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-lg overflow-hidden">
                    {suggestions.map((item, i) => {
                      const a = item.address || {};
                      const city = a.city || a.town || a.village || a.county || "";
                      const state = a.state || "";
                      const pin = a.postcode || "";
                      const line1 = [a.road, a.suburb, a.neighbourhood].filter(Boolean).join(", ") || item.display_name.split(",")[0];
                      const line2 = [city, state, pin].filter(Boolean).join(", ");
                      return (
                        <button
                          key={i}
                          type="button"
                          onMouseDown={() => selectSuggestion(item)}
                          className="w-full flex items-start gap-3 px-4 py-3 hover:bg-accent/10 transition text-left border-b border-border/50 last:border-0"
                        >
                          <MapPin className="w-4 h-4 text-accent mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{line1}</p>
                            {line2 && <p className="text-xs text-muted-foreground truncate">{line2}</p>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Apartment */}
              <div className="relative">
                <label className="absolute top-2 left-3 text-xs text-muted-foreground">
                  Apartment / Flat / Floor <span className="text-red-500">*</span>
                </label>
                <Input
                  value={form.apartment}
                  onChange={(e) => set("apartment", e.target.value)}
                  placeholder="e.g. Flat 2B, 3rd Floor"
                  className={cn("pt-6 pb-2 h-auto rounded-xl", errors.apartment && "border-red-500")}
                />
                {errors.apartment && <p className="text-red-500 text-xs mt-1">{errors.apartment}</p>}
              </div>

              {/* City / State / PIN */}
              <div className="grid grid-cols-3 gap-3">
                <div className="relative">
                  <label className="absolute top-2 left-3 text-xs text-muted-foreground">City <span className="text-red-500">*</span></label>
                  <Input
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    className={cn("pt-6 pb-2 h-auto rounded-xl", errors.city && "border-red-500")}
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>
                <div className="relative">
                  <label className="absolute top-2 left-3 text-xs text-muted-foreground">State <span className="text-red-500">*</span></label>
                  <select
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                    className="w-full pt-6 pb-2 px-3 border border-border rounded-xl bg-background text-sm appearance-none focus:ring-2 focus:ring-accent/50 outline-none"
                  >
                    {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                <div className="relative">
                  <label className="absolute top-2 left-3 text-xs text-muted-foreground">PIN code <span className="text-red-500">*</span></label>
                  <Input
                    value={form.pinCode}
                    onChange={(e) => set("pinCode", e.target.value)}
                    maxLength={6}
                    className={cn("pt-6 pb-2 h-auto rounded-xl", errors.pinCode && "border-red-500")}
                  />
                  {errors.pinCode && <p className="text-red-500 text-xs mt-1">{errors.pinCode}</p>}
                </div>
              </div>

              {/* Phone */}
              <div className="relative">
                <label className="absolute top-2 left-3 text-xs text-muted-foreground">Phone <span className="text-red-500">*</span></label>
                <Input
                  value={form.phone}
                  onChange={(e) => set("phone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  className={cn("pt-6 pb-2 h-auto rounded-xl", errors.phone && "border-red-500")}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>

            {/* Shipping Method */}
            <div className="space-y-3">
              <h2 className="font-semibold text-lg text-foreground">Shipping method</h2>
              {shippingReady ? (
                <div className="border border-accent/40 rounded-xl p-4 flex items-center justify-between bg-accent/5">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-accent flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                    </div>
                    <span className="text-sm font-medium">Standard Delivery (2–4 days)</span>
                  </div>
                  <span className="text-sm font-bold text-green-500">Free</span>
                </div>
              ) : (
                <div className="border border-border rounded-xl p-4 bg-secondary/30">
                  <p className="text-sm text-muted-foreground text-center">Enter your shipping address to view available shipping methods.</p>
                </div>
              )}
            </div>

            {/* Payment */}
            <div className="space-y-3">
              <div>
                <h2 className="font-semibold text-lg text-foreground">Payment</h2>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Lock className="w-3 h-3" /> All transactions are secure and encrypted.
                </p>
              </div>
              <div className="border-2 border-accent/50 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between p-4 bg-accent/5">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full border-2 border-accent flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-accent" />
                    </div>
                    <span className="text-sm font-medium">Cashfree Payments (UPI, Cards, Int'l cards, Wallets)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded bg-[#097939] text-white text-[10px] font-bold tracking-wide">UPI</span>
                    <span className="px-2 py-0.5 rounded bg-[#1A1F71] text-white text-[10px] font-bold tracking-wide">VISA</span>
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200">
                      <span className="w-3 h-3 rounded-full bg-[#EB001B] block" />
                      <span className="w-3 h-3 rounded-full bg-[#F79E1B] block -ml-1.5" />
                    </span>
                    <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground border border-border">+11</span>
                  </div>
                </div>
                <div className="px-4 py-3 border-t border-border/50 bg-secondary/20">
                  <p className="text-xs text-muted-foreground">You'll be redirected to Cashfree Payments (UPI, Cards, Int'l cards, Wallets) to complete your purchase.</p>
                </div>
              </div>
            </div>

            {/* Billing Address */}
            <div className="space-y-3">
              <h2 className="font-semibold text-lg text-foreground">Billing address</h2>
              <div className="border border-border rounded-xl overflow-hidden">
                <label
                  className={cn("flex items-center gap-3 p-4 cursor-pointer transition", billingOption === "same" && "bg-accent/5 border-l-2 border-l-accent")}
                  onClick={() => setBillingOption("same")}
                >
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", billingOption === "same" ? "border-accent" : "border-border")}>
                    {billingOption === "same" && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                  </div>
                  <span className="text-sm font-medium">Same as shipping address</span>
                </label>
                <div className="border-t border-border" />
                <label
                  className={cn("flex items-center gap-3 p-4 cursor-pointer transition", billingOption === "different" && "bg-accent/5 border-l-2 border-l-accent")}
                  onClick={() => setBillingOption("different")}
                >
                  <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", billingOption === "different" ? "border-accent" : "border-border")}>
                    {billingOption === "different" && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                  </div>
                  <span className="text-sm font-medium">Use a different billing address</span>
                </label>
              </div>
            </div>

            {/* Pay Now */}
            <Button
              onClick={openPayment}
              disabled={submitting}
              size="lg"
              className="w-full h-14 bg-accent text-primary hover:opacity-90 font-bold text-base rounded-xl"
            >
              {submitting ? "Placing order..." : "Pay now"}
            </Button>

            {/* Footer Links */}
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t border-border">
              <Link to="/contact" className="hover:text-accent">Refund policy</Link>
              <Link to="/contact" className="hover:text-accent">Shipping</Link>
              <Link to="/contact" className="hover:text-accent">Privacy policy</Link>
              <Link to="/contact" className="hover:text-accent">Terms of service</Link>
              <Link to="/contact" className="hover:text-accent">Contact</Link>
            </div>
          </div>

          {/* ── Right: Order Summary ── */}
          <div className="bg-secondary/30 px-6 md:px-10 py-10 space-y-6 border-t lg:border-t-0 border-border">
            <div className="space-y-4">
              {checkoutItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={item.image_url || FALLBACK_IMG}
                      alt={item.name}
                      className="w-20 h-20 rounded-xl object-cover border border-border shadow-sm"
                    />
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-gold text-primary text-xs font-bold flex items-center justify-center shadow-md">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {productState?.purchaseType === 'subscription' ? 'Subscription' : 'One Time Purchase'}
                    </p>
                    <p className="text-xs text-muted-foreground">₹{item.price.toFixed(2)}/unit</p>
                    {productState?.selectedSize && (
                      <p className="text-xs text-accent font-medium">Size: {productState.selectedSize}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-sm text-foreground">₹{(item.price * item.quantity).toFixed(2)}</span>
                    <p className="text-xs text-muted-foreground">Subtotal</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-border pt-4 space-y-3 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal</span>
                <span className="text-foreground font-medium">₹{checkoutTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span className="flex items-center gap-1">Shipping <Shield className="w-3 h-3" /></span>
                {shippingReady
                  ? <span className="text-green-500 font-medium">Free</span>
                  : <span className="italic">Enter shipping address</span>
                }
              </div>
            </div>

            <div className="border-t border-border pt-4 flex justify-between items-center">
              <span className="font-bold text-lg">Total</span>
              <div className="text-right">
                <span className="text-xs text-muted-foreground mr-1">INR</span>
                <span className="font-bold text-2xl text-gradient-gold">₹{checkoutTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <PaymentModal
        open={paymentOpen}
        onClose={() => setPaymentOpen(false)}
        total={checkoutTotal}
        phone={form.phone || "0000000000"}
        onSuccess={placeOrder}
      />
    </Layout>
  );
}
