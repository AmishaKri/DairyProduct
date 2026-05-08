import { useState, ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";
import CartDrawer from "./CartDrawer";

type LayoutProps = {
  children: ReactNode;
  hideNavbar?: boolean;
  hideFooter?: boolean;
};

export default function Layout({ children, hideNavbar = false, hideFooter = false }: LayoutProps) {
  const [cartOpen, setCartOpen] = useState(false);
  return (
    <div className="min-h-screen flex flex-col">
      {!hideNavbar && (
        <>
          <Navbar onCartClick={() => setCartOpen(true)} />
          <CartDrawer open={cartOpen} onOpenChange={setCartOpen} />
        </>
      )}
      <main className="flex-1 flex flex-col">{children}</main>
      {!hideFooter && <Footer />}
    </div>
  );
}
