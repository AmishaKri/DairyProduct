import { LayoutDashboard, Package, ShoppingBag, Heart, LogOut, Tag, X } from "lucide-react";

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function AdminSidebar({ activeTab, onTabChange, onLogout, isOpen = false, onClose }: AdminSidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "products", label: "Products", icon: Package },
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "wishlist", label: "Wishlist", icon: Heart },
    { id: "pricing", label: "Pricing & Coupons", icon: Tag },
  ];

  const handleTabChange = (id: string) => {
    onTabChange(id);
    onClose?.();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar — drawer on mobile, static on desktop */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-64 z-50 bg-background border-r border-border p-4 flex flex-col
          transition-transform duration-300 ease-in-out
          lg:static lg:translate-x-0 lg:z-auto lg:min-h-full lg:shrink-0
          ${isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"}
        `}
      >
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Admin Panel</h1>
            <p className="text-sm text-muted-foreground">Kshira Dairy</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleTabChange(item.id)}
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
          LOGOUT
        </button>
      </aside>
    </>
  );
}
