import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Contact from "./pages/Contact";
import Checkout from "./pages/Checkout";
import OrderSuccess from "./pages/OrderSuccess";
import Admin from "./pages/Admin";
import AdminLogin from "./pages/AdminLogin";
import Wishlist from "./pages/Wishlist";
import OAuthCallback from "./pages/OAuthCallback";
import OAuthLogin from "./pages/OAuthLogin";
import NotFound from "./pages/NotFound";
import { Navigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

function ProtectedAdminRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem("kshira_admin_token");
  if (!token) return <Navigate to="/admin-login" replace />;
  try {
    const decoded: any = jwtDecode(token);
    if (decoded.type !== "admin" || decoded.exp * 1000 < Date.now())
      return <Navigate to="/admin-login" replace />;
  } catch {
    return <Navigate to="/admin-login" replace />;
  }
  return <>{children}</>;
}

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:id" element={<ProductDetail />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success" element={<OrderSuccess />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedAdminRoute><Admin /></ProtectedAdminRoute>} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/oauth-login" element={<OAuthLogin />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
