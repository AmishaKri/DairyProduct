import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart, cart } from "@/lib/cart-store";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

export default function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { items, total } = useCart();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Your Cart</SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <ShoppingBag className="w-16 h-16 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto -mx-6 px-6 space-y-3 my-4">
              {items.map((i) => (
                <div key={i.id} className="flex gap-3 p-3 rounded-xl bg-secondary/50">
                  <img src={i.image_url || "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200"}
                    alt={i.name} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm truncate">{i.name}</div>
                    <div className="text-xs text-muted-foreground">₹{i.price} each</div>
                    <div className="flex items-center gap-2 mt-2">
                      <Button size="icon" variant="outline" className="h-7 w-7"
                        onClick={() => cart.setQty(i.id, i.quantity - 1)}><Minus className="w-3 h-3" /></Button>
                      <span className="text-sm w-6 text-center">{i.quantity}</span>
                      <Button size="icon" variant="outline" className="h-7 w-7"
                        onClick={() => cart.setQty(i.id, i.quantity + 1)}><Plus className="w-3 h-3" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 ml-auto text-destructive"
                        onClick={() => cart.remove(i.id)}><Trash2 className="w-3 h-3" /></Button>
                    </div>
                  </div>
                  <div className="font-semibold text-sm">₹{(i.price * i.quantity).toFixed(0)}</div>
                </div>
              ))}
            </div>
            <div className="border-t pt-4 space-y-3">
              <div className="flex justify-between font-display text-xl font-bold">
                <span>Total</span><span>₹{total.toFixed(0)}</span>
              </div>
              <Button asChild className="w-full bg-gradient-gold text-primary hover:opacity-90 font-semibold" size="lg"
                onClick={() => onOpenChange(false)}>
                <Link to="/checkout">Proceed to Checkout</Link>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
