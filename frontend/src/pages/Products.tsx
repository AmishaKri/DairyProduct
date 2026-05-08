import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "@/components/Layout";
import ProductCard from "@/components/ProductCard";
import { productAPI } from "@/lib/api";
import type { Product } from "@/lib/cart-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Products() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [params, setParams] = useSearchParams();
  const cat = params.get("cat") || "";

  const cats = [
    { id: "", key: "all" },
    { id: "milk", key: "milk" },
    { id: "dairy", key: "dairy" },
  ];

  useEffect(() => {
    productAPI.getAll(cat).then(({ data }) => {
      // Map MongoDB response to frontend Product type
      const mappedProducts = (data || []).map((p: any) => ({
        id: p._id,
        name: p.name,
        description: p.description,
        price: p.price,
        category: p.category,
        image_url: p.imageUrl,
        in_stock: p.inStock,
      }));
      setProducts(mappedProducts);
    });
  }, [cat]);

  return (
    <Layout>
      <section className="pt-32 pb-12 bg-gradient-hero text-white">
        <div className="container">
          <h1 className="font-display text-5xl md:text-6xl font-bold animate-fade-in-up">{t("products.title")}</h1>
          <p className="text-white/70 mt-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
            {t("products.subtitle")}
          </p>
        </div>
      </section>
      <section className="py-12">
        <div className="container">
          <div className="flex gap-2 mb-8 flex-wrap">
            {cats.map((c) => (
              <Button key={c.id} variant={cat === c.id ? "default" : "outline"}
                onClick={() => setParams(c.id ? { cat: c.id } : {})}
                className={cn(cat === c.id && "bg-gradient-gold text-primary hover:opacity-90")}>
                {t(`products.categories.${c.key}`)}
              </Button>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
          {products.length === 0 && (
            <div className="text-center py-20 text-muted-foreground">{t("products.noProducts")}</div>
          )}
        </div>
      </section>
    </Layout>
  );
}
