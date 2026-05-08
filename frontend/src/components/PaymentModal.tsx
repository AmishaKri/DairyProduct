import { useState, useEffect } from "react";
import { X, ChevronRight, QrCode, CreditCard, Building2, Wallet, ArrowLeftRight, Star, Check, Tag, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { couponAPI, paymentAPI } from "@/lib/api";
import { toast } from "sonner";

const SHOP_UPI = "kshira@paytm";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  total: number;
  phone: string;
  onSuccess: (method: string, txnId?: string) => void;
}

type Tab = "qr" | "upi" | "card" | "netbanking" | "wallets" | "rtgs";

const BANKS = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra Bank", "Punjab National Bank", "Bank of Baroda", "Canara Bank", "Union Bank of India", "Yes Bank"];
const WALLETS = [
  { name: "Paytm", color: "#00BAF2", letter: "P" },
  { name: "PhonePe", color: "#5f259f", letter: "Ph" },
  { name: "Amazon Pay", color: "#FF9900", letter: "A" },
  { name: "Mobikwik", color: "#14b8a6", letter: "M" },
];

export default function PaymentModal({ open, onClose, total, phone, onSuccess }: PaymentModalProps) {
  const [tab, setTab] = useState<Tab>("qr");
  const [upiId, setUpiId] = useState("");
  const [upiVerified, setUpiVerified] = useState(false);
  const [upiVerifying, setUpiVerifying] = useState(false);
  const [cardNo, setCardNo] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [selectedWallet, setSelectedWallet] = useState("");
  const [coupon, setCoupon] = useState("");
  const [couponApplied, setCouponApplied] = useState<{ code: string; discount: number } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [timer, setTimer] = useState(297);
  const finalTotal = couponApplied ? Math.max(total - couponApplied.discount, 0) : total;

  const upiUrl = `upi://pay?pa=${SHOP_UPI}&pn=Kshira%20Dairy&am=${finalTotal.toFixed(2)}&cu=INR&tn=Order`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(upiUrl)}&ecc=M`;

  // Countdown timer for QR
  useEffect(() => {
    if (!open || tab !== "qr") return;
    setTimer(297);
    const id = setInterval(() => setTimer((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [open, tab]);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const verifyUpi = async () => {
    if (!upiId.includes("@")) return;
    setUpiVerifying(true);
    await new Promise((r) => setTimeout(r, 1200));
    setUpiVerifying(false);
    setUpiVerified(true);
  };

  const applyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await couponAPI.validate(coupon, total);
      setCouponApplied({ code: data.coupon.code, discount: data.discount });
      toast.success(`Coupon applied! You save ₹${data.discount}`);
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Invalid coupon");
      setCouponApplied(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(null);
    setCoupon("");
  };

  const loadRazorpayScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const pay = async (preferredMethod?: string, extra?: string) => {
    setProcessing(true);
    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) { toast.error("Razorpay failed to load. Check your internet."); return; }

      const { data: rzpOrder } = await paymentAPI.createOrder(finalTotal);

      const methodMap: Record<string, string> = {
        upi: "upi", card: "card", netbanking: "netbanking",
        wallet: "wallet", qr: "upi", rtgs: "netbanking",
      };

      const options: any = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        order_id: rzpOrder.id,
        name: "Kshira Dairy",
        description: "Order Payment",
        theme: { color: "#1a6b35" },
        prefill: { contact: phone },
        modal: { ondismiss: () => { setProcessing(false); toast.info("Payment cancelled"); } },
        handler: async (response: any) => {
          try {
            const { data } = await paymentAPI.verify(response);
            if (data.success) {
              if (couponApplied) await couponAPI.apply(couponApplied.code).catch(() => {});
              toast.success("Payment successful!");
              onSuccess(preferredMethod || "razorpay", data.paymentId);
            }
          } catch {
            toast.error("Payment verification failed. Contact support.");
          } finally {
            setProcessing(false);
          }
        },
      };

      if (preferredMethod && methodMap[preferredMethod]) {
        options.method = methodMap[preferredMethod];
      }
      if (preferredMethod === "upi" && extra) options.prefill.vpa = extra;
      if (preferredMethod === "netbanking" && extra) options.prefill.bank = extra;
      if (preferredMethod === "wallet" && extra) options.prefill.wallet = extra.toLowerCase();

      const rzp = new (window as any).Razorpay(options);
      rzp.on("payment.failed", (res: any) => {
        toast.error(res.error?.description || "Payment failed");
        setProcessing(false);
      });
      rzp.open();
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Could not initiate payment");
      setProcessing(false);
    }
  };

  const formatCard = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">

        {/* ── Left Panel ── */}
        <div className="bg-[#1a6b35] text-white w-full md:w-64 flex-shrink-0 flex flex-col p-6 relative">
          <button onClick={onClose} className="absolute top-3 right-3 text-white/60 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>

          {/* Badge */}
          <div className="flex items-center gap-2 mb-6 bg-white/10 rounded-xl px-3 py-2 text-xs">
            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
            Serving customers since 6 months with Cashfree
          </div>

          {/* Brand */}
          <div className="flex flex-col items-center text-center flex-1">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-2xl font-bold mb-3">K</div>
            <h3 className="font-bold text-xl mb-1">Kshira Dairy</h3>
            <button
              className="w-full bg-white/20 hover:bg-white/30 transition rounded-xl px-5 py-3 font-bold text-lg flex items-center justify-center gap-2">
              {couponApplied ? (
                <span className="flex items-center gap-2">
                  <span className="line-through text-white/50 text-base">₹{total.toFixed(0)}</span>
                  <span>₹{finalTotal.toFixed(0)}</span>
                </span>
              ) : (
                <span>₹{total.toFixed(0)}</span>
              )}
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Coupon */}
            <div className="w-full mt-6">
              <div className="flex justify-between text-xs text-white/70 mb-2">
                <span>Offers and Coupons</span>
                <span className="text-yellow-300">1 Offer Available ›</span>
              </div>
              {couponApplied ? (
                <div className="flex items-center justify-between bg-white/10 rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Tag className="w-4 h-4 text-yellow-300" />
                    <span className="font-semibold text-yellow-300">{couponApplied.code}</span>
                    <span className="text-white/70">-₹{couponApplied.discount}</span>
                  </div>
                  <button onClick={removeCoupon} className="text-white/50 hover:text-white text-xs">✕ Remove</button>
                </div>
              ) : (
                <div className="flex rounded-xl overflow-hidden border border-white/20">
                  <input
                    value={coupon}
                    onChange={(e) => setCoupon(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                    placeholder="Have a coupon? Paste here"
                    className="flex-1 bg-white/10 px-3 py-2 text-sm text-white placeholder-white/40 outline-none"
                  />
                  <button onClick={applyCoupon} disabled={couponLoading}
                    className="bg-white/20 hover:bg-white/30 px-3 text-xs font-semibold disabled:opacity-50 flex items-center gap-1">
                    {couponLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : "APPLY"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-xs text-white/50">
            Secured by <span className="text-white font-semibold">Cashfree Payments</span>
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              Payment Options for <span className="font-semibold text-gray-800">+91 {phone.slice(-10)}</span>
            </p>
            <button className="text-sm text-[#1a6b35] font-semibold hover:underline">Change</button>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Tab list (left nav) */}
            <div className="w-48 flex-shrink-0 border-r border-gray-100 py-2 hidden md:flex flex-col">
              {([
                { id: "qr", icon: QrCode, label: "QR Code" },
                { id: "upi", icon: () => <span className="text-[10px] font-extrabold text-[#097939]">UPI</span>, label: "Pay by UPI ID" },
                { id: "card", icon: CreditCard, label: "Card" },
                { id: "netbanking", icon: Building2, label: "Net Banking" },
                { id: "wallets", icon: Wallet, label: "Wallets" },
                { id: "rtgs", icon: ArrowLeftRight, label: "RTGS / NEFT / IMPS" },
              ] as { id: Tab; icon: any; label: string }[]).map(({ id, icon: Icon, label }) => (
                <button
                  key={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm text-left transition-all",
                    tab === id
                      ? "bg-green-50 border-r-2 border-[#1a6b35] text-[#1a6b35] font-semibold"
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{label}</span>
                  <ChevronRight className="w-3 h-3 ml-auto opacity-40" />
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-5">

              {/* QR Tab */}
              {tab === "qr" && (
                <div className="flex flex-col items-center gap-4">
                  <div className="border-2 border-gray-100 rounded-2xl p-4 flex flex-col items-center gap-3">
                    <img src={qrSrc} alt="UPI QR" className="rounded-xl" width={180} height={180} />
                    <p className="text-xs text-gray-500">
                      Expires in <span className={cn("font-semibold", timer < 60 ? "text-red-500" : "text-orange-500")}>{fmt(timer)} mins</span>
                    </p>
                    {couponApplied && (
                      <p className="text-xs text-green-600 font-semibold">✓ Coupon applied: -₹{couponApplied.discount}</p>
                    )}
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500 mb-2">Scan and pay with</p>
                    <div className="flex items-center justify-center gap-3">
                      {[
                        { bg: "#FF6600", label: "Pp", title: "PhonePe" },
                        { bg: "#472878", label: "t", title: "Paytm" },
                        { bg: "#007DC3", label: "Bh", title: "Bharat" },
                      ].map((app) => (
                        <div key={app.title} title={app.title}
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
                          style={{ backgroundColor: app.bg }}>
                          {app.label}
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">or other UPI apps</p>
                  </div>
                  <button
                    onClick={() => pay("qr")}
                    disabled={processing}
                    className="w-full bg-[#1a6b35] hover:bg-[#145228] text-white font-semibold py-3 rounded-xl transition"
                  >
                    {processing ? "Processing..." : `I've completed the payment — ₹${finalTotal.toFixed(0)}`}
                  </button>
                </div>
              )}

              {/* UPI ID Tab */}
              {tab === "upi" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Pay by UPI ID</h3>
                  <div className="flex gap-2">
                    <input
                      value={upiId}
                      onChange={(e) => { setUpiId(e.target.value); setUpiVerified(false); }}
                      placeholder="Enter UPI ID (e.g. name@upi)"
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a6b35]/30 focus:border-[#1a6b35]"
                    />
                    <button
                      onClick={verifyUpi}
                      disabled={upiVerifying || !upiId.includes("@")}
                      className="bg-[#1a6b35] text-white px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                    >
                      {upiVerifying ? "..." : "Verify"}
                    </button>
                  </div>
                  {upiVerified && (
                    <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 rounded-xl px-4 py-3">
                      <Check className="w-4 h-4" /> UPI ID verified successfully
                    </div>
                  )}
                  <div className="text-xs text-gray-400 space-y-1">
                    <p>• Make sure your UPI app is open</p>
                    <p>• You'll receive a payment request on your UPI app</p>
                  </div>
                  <button
                    onClick={() => pay("upi", upiId)}
                    disabled={!upiVerified || processing}
                    className="w-full bg-[#1a6b35] hover:bg-[#145228] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
                  >
                    {processing ? "Processing..." : `Pay ₹${finalTotal.toFixed(0)}`}
                  </button>
                </div>
              )}

              {/* Card Tab */}
              {tab === "card" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Credit / Debit Card</h3>
                  <div className="flex justify-end gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded bg-[#1A1F71] text-white text-[10px] font-bold">VISA</span>
                    <span className="flex items-center px-1.5 py-0.5 rounded bg-gray-100 border border-gray-200">
                      <span className="w-3 h-3 rounded-full bg-[#EB001B] block" />
                      <span className="w-3 h-3 rounded-full bg-[#F79E1B] block -ml-1.5" />
                    </span>
                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold">Rupay</span>
                  </div>
                  <input value={cardNo} onChange={(e) => setCardNo(formatCard(e.target.value))}
                    placeholder="Card Number"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a6b35]/30 focus:border-[#1a6b35] font-mono tracking-widest" />
                  <input value={cardName} onChange={(e) => setCardName(e.target.value)}
                    placeholder="Name on Card"
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a6b35]/30 focus:border-[#1a6b35]" />
                  <div className="grid grid-cols-2 gap-3">
                    <input value={cardExpiry} onChange={(e) => setCardExpiry(formatExpiry(e.target.value))}
                      placeholder="MM/YY"
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a6b35]/30 focus:border-[#1a6b35]" />
                    <input value={cardCvv} onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
                      placeholder="CVV" type="password"
                      className="border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#1a6b35]/30 focus:border-[#1a6b35]" />
                  </div>
                  <button
                    onClick={() => pay("card")}
                    disabled={!cardNo || !cardName || !cardExpiry || !cardCvv || processing}
                    className="w-full bg-[#1a6b35] hover:bg-[#145228] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
                  >
                    {processing ? "Processing..." : `Pay ₹${finalTotal.toFixed(0)}`}
                  </button>
                </div>
              )}

              {/* Net Banking Tab */}
              {tab === "netbanking" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Net Banking</h3>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {BANKS.map((bank) => (
                      <label key={bank}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition",
                          selectedBank === bank ? "border-[#1a6b35] bg-green-50" : "border-gray-200 hover:bg-gray-50"
                        )}>
                        <input type="radio" className="accent-[#1a6b35]" checked={selectedBank === bank}
                          onChange={() => setSelectedBank(bank)} />
                        <span className="text-sm text-gray-700">{bank}</span>
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={() => pay("netbanking", selectedBank)}
                    disabled={!selectedBank || processing}
                    className="w-full bg-[#1a6b35] hover:bg-[#145228] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
                  >
                    {processing ? "Processing..." : `Pay ₹${finalTotal.toFixed(0)}`}
                  </button>
                </div>
              )}

              {/* Wallets Tab */}
              {tab === "wallets" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">Wallets</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {WALLETS.map((w) => (
                      <button key={w.name} onClick={() => setSelectedWallet(w.name)}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl border transition",
                          selectedWallet === w.name ? "border-[#1a6b35] bg-green-50" : "border-gray-200 hover:bg-gray-50"
                        )}>
                        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: w.color }}>{w.letter}</div>
                        <span className="text-sm font-medium text-gray-700">{w.name}</span>
                        {selectedWallet === w.name && <Check className="w-4 h-4 text-[#1a6b35] ml-auto" />}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => pay("wallet", selectedWallet)}
                    disabled={!selectedWallet || processing}
                    className="w-full bg-[#1a6b35] hover:bg-[#145228] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition"
                  >
                    {processing ? "Processing..." : `Pay ₹${finalTotal.toFixed(0)} via ${selectedWallet || "Wallet"}`}
                  </button>
                </div>
              )}

              {/* RTGS/NEFT/IMPS Tab */}
              {tab === "rtgs" && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-800">RTGS / NEFT / IMPS</h3>
                  <div className="bg-gray-50 rounded-2xl p-4 space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Account Name</span>
                      <span className="font-semibold">Kshira Dairy</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Account Number</span>
                      <span className="font-mono font-semibold">1234567890</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">IFSC Code</span>
                      <span className="font-mono font-semibold">SBIN0001234</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Bank</span>
                      <span className="font-semibold">State Bank of India</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount</span>
                      <span className="font-bold text-[#1a6b35]">₹{total.toFixed(0)}</span>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400">Transfer the exact amount and confirm below. Your order will be processed after verification.</p>
                  <button
                    onClick={() => pay("rtgs")}
                    disabled={processing}
                    className="w-full bg-[#1a6b35] hover:bg-[#145228] text-white font-semibold py-3 rounded-xl transition"
                  >
                    {processing ? "Processing..." : `I've completed the transfer — ₹${finalTotal.toFixed(0)}`}
                  </button>
                </div>
              )}

              {/* Mobile tab switcher */}
              <div className="flex md:hidden flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                {([
                  { id: "qr", label: "QR" },
                  { id: "upi", label: "UPI" },
                  { id: "card", label: "Card" },
                  { id: "netbanking", label: "Bank" },
                  { id: "wallets", label: "Wallet" },
                  { id: "rtgs", label: "RTGS" },
                ] as { id: Tab; label: string }[]).map(({ id, label }) => (
                  <button key={id} onClick={() => setTab(id)}
                    className={cn("px-3 py-1 rounded-full text-xs font-semibold border transition",
                      tab === id ? "bg-[#1a6b35] text-white border-transparent" : "border-gray-200 text-gray-600")}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
