import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "@/lib/api";
import { toast } from "sonner";
import { Lock, User } from "lucide-react";

export default function AdminLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await authAPI.adminLogin({ username, password });
      localStorage.setItem("kshira_admin_token", data.token);
      toast.success("Welcome, Admin!");
      navigate("/admin");
    } catch (e: any) {
      toast.error(e.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-gold flex items-center justify-center mx-auto mb-4 shadow-gold">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">Admin Panel</h1>
          <p className="text-muted-foreground text-sm mt-1">Kshira Dairy — Restricted Access</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-elegant">
          <form onSubmit={submit} className="space-y-5">
            {/* Username */}
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Admin username"
                required
                autoComplete="username"
                className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-background text-sm outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Admin password"
                required
                autoComplete="current-password"
                className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-background text-sm outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-gold text-primary font-semibold py-3 rounded-xl hover:opacity-90 transition disabled:opacity-60 shadow-gold"
            >
              {loading ? "Signing in..." : "Sign in as Admin"}
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Not an admin?{" "}
            <button onClick={() => navigate("/")} className="text-accent hover:underline">
              Go to store
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
