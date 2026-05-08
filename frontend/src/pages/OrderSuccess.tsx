import Layout from "@/components/Layout";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useSearchParams } from "react-router-dom";

export default function OrderSuccess() {
  const [params] = useSearchParams();
  const id = params.get("id") || "";
  return (
    <Layout>
      <div className="container pt-40 pb-20 text-center max-w-xl">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-gold flex items-center justify-center mb-6 animate-scale-in shadow-gold">
          <CheckCircle2 className="w-10 h-10 text-primary" />
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 animate-fade-in-up">Order Placed!</h1>
        <p className="text-muted-foreground mb-2 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
          Thank you for your order. We've notified our team via WhatsApp.
        </p>
        {id && <p className="text-sm text-muted-foreground mb-8">Order ID: <code className="font-mono">{id.slice(0, 8)}</code></p>}
        <Button asChild className="bg-gradient-gold text-primary"><Link to="/products">Continue shopping</Link></Button>
      </div>
    </Layout>
  );
}
