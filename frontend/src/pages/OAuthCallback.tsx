import { useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    console.log("OAuthCallback - token:", token);
    console.log("OAuthCallback - error:", error);
    
    if (token) {
      // 1️⃣ Check for buy now intent FIRST — it carries product state for checkout
      const buyNowIntent = localStorage.getItem("kshira_buynow_intent");
      if (buyNowIntent) {
        try {
          const intent = JSON.parse(buyNowIntent);
          console.log("Parsed intent:", intent);
          // Check if intent is recent (within 5 minutes)
          if (intent.timestamp && Date.now() - intent.timestamp < 5 * 60 * 1000) {
            console.log("Intent is recent, redirecting to checkout");
            localStorage.removeItem("kshira_buynow_intent");
            // Also clear the generic redirect since we’re handling it here
            localStorage.removeItem("kshira_oauth_redirect");

            toast.success("Logged in with Google! Redirecting to checkout...");

            // Redirect to checkout with the stored product info
            navigate("/checkout", {
              state: {
                product: {
                  id: intent.productId,
                  name: intent.productName,
                  price: intent.productPrice,
                  image_url: intent.productImage,
                  category: intent.productCategory,
                  description: null,
                  in_stock: true,
                },
                quantity: intent.quantity || 1,
                purchaseType: intent.purchaseType || "one-time",
                selectedSize: intent.selectedSize || "1L",
              }
            });
            return;
          } else {
            console.log("Intent expired, removing it");
            localStorage.removeItem("kshira_buynow_intent");
          }
        } catch (e) {
          console.error("Error parsing intent:", e);
          localStorage.removeItem("kshira_buynow_intent");
        }
      }

      // 2️⃣ Fallback: generic OAuth redirect path
      const redirectPath = localStorage.getItem("kshira_oauth_redirect");
      if (redirectPath) {
        localStorage.removeItem("kshira_oauth_redirect");
        toast.success("Logged in with Google!");
        navigate(redirectPath);
        return;
      }

      // 3️⃣ Default fallback
      toast.success("Logged in with Google!");
      navigate("/products");
    } else if (error) {
      console.error("OAuth error:", error);
      toast.error("Login failed: " + error);
      navigate("/oauth-login?error=" + encodeURIComponent(error));
    } else {
      // No token or error, redirect to login
      navigate("/oauth-login");
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto"></div>
        <p className="text-muted-foreground">Completing authentication...</p>
        <p className="text-xs text-muted-foreground mt-2">Please wait while we log you in</p>
      </div>
    </div>
  );
}
