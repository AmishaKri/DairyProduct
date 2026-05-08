import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Chrome, ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";

export default function OAuthLogin() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const message = searchParams.get("message");
  const redirectPath = searchParams.get("redirect") || "/checkout";

  const handleGoogleLogin = () => {
    setLoading(true);
    try {
      // Store redirect path for after OAuth
      localStorage.setItem("kshira_oauth_redirect", redirectPath);
      
      const oauthUrl = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/auth/google`;
      window.location.href = oauthUrl;
    } catch (error) {
      console.error("Error initiating OAuth:", error);
      toast.error("Failed to start login. Please try again.");
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(redirectPath);
  };

  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-50 to-orange-50 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Welcome to Kshira</h1>
              <p className="text-gray-600">Sign in to continue with your order</p>
            </div>

            {/* Message */}
            {message && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-800 text-sm">{message}</p>
              </div>
            )}

            {/* Google OAuth Button */}
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-900 font-medium py-3 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Chrome className="w-5 h-5" />
              )}
              <span>{loading ? "Connecting..." : "Continue with Google"}</span>
            </Button>

            {/* Back Button */}
            <Button
              variant="outline"
              onClick={handleBack}
              className="w-full flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Shopping</span>
            </Button>

            {/* Security Note */}
            <div className="text-center text-xs text-gray-500 space-y-1">
              <p>Your information is secure and encrypted</p>
              <p>By continuing, you agree to our Terms of Service</p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
