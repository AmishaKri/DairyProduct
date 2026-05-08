import { LayoutDashboard, Package, ShoppingBag, Heart, LogOut, Tag } from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
}

export default function AdminSidebar({ activeTab, onTabChange, onLogout }: AdminSidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "pricing", label: "Pricing & Coupons", icon: Tag },
  ];

  return (
    <aside className="w-64 p-4 flex flex-col min-h-full">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
        <p className="text-sm text-muted-foreground">Kshira Dairy</p>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? "bg-gradient-gold text-primary font-semibold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      <button
        onClick={onLogout}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors mt-4"
      >
        <LogOut className="w-5 h-5" />
        Logout
      </button>
    </aside>
  );
}
