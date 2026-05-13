import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import Hero from "@/components/Hero";
import Features from "@/components/Features";
import ProductCard from "@/components/ProductCard";
import { productAPI } from "@/lib/api";
import type { Product } from "@/lib/cart-store";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Cpu, Droplet, Leaf, BarChart3, Check, Clock, Truck, Shield, Heart, Star, Zap } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Index() {
  const { t } = useLanguage();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    productAPI.getAll()
      .then(({ data }) => {
        const mapped = (data || []).map((p: any) => ({
          id: p._id,
          name: p.name,
          description: p.description,
          price: p.price,
          category: p.category,
          image_url: p.imageUrl,
          in_stock: p.inStock,
          highlighted: p.highlighted || false,
        }));
        setProducts(mapped.slice(0, 8));
      })
      .catch((error) => {
        console.error("Products API error:", error);
      });
  }, []);

  const aiHighlights = [
    { icon: Cpu, key: "predictiveHarvest" },
    { icon: Droplet, key: "nutrientScan" },
    { icon: Leaf, key: "coldChain" },
  ];

  const testimonials = [
    { key: "chef" },
    { key: "soma" },
    { key: "ritu" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <Hero />

      <section className="relative overflow-hidden py-24 text-white">
        <AnimatedBackground />
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.2), transparent 35%)" }} />
        <div className="absolute inset-0 bg-[linear-gradient(120deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[length:180px_180px]" />
        <div className="container relative grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-white/10 text-xs tracking-[0.3em] uppercase text-white/70">
              <BarChart3 className="w-3.5 h-3.5" /> {t("aiSection.badge")}
            </span>
            <h2 className="font-display text-4xl md:text-5xl font-bold">
              {t("aiSection.title")}
            </h2>
            <p className="text-lg text-white/70 max-w-xl">
              {t("aiSection.subtitle")}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="glass rounded-2xl p-5">
                <p className="text-sm text-white/60">{t("aiSection.dailyBatches")}</p>
                <p className="font-display text-3xl font-bold">18,000+</p>
              </div>
              <div className="glass rounded-2xl p-5">
                <p className="text-sm text-white/60">{t("aiSection.chillRetention")}</p>
                <p className="font-display text-3xl font-bold">3.2°C</p>
              </div>
            </div>
          </div>
          <div className="grid gap-5">
            {aiHighlights.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="glass rounded-3xl p-6 flex items-start gap-4 border border-white/10 hover:border-white/30 transition"
              >
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center animate-pulse">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display text-xl font-bold">{t(`aiSection.${key}.title`)}</h3>
                    <span className="text-xs uppercase tracking-widest text-white/60">{t(`aiSection.${key}.metric`)}</span>
                  </div>
                  <p className="text-white/70 text-sm mt-1">{t(`aiSection.${key}.desc`)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Features />

      <section className="py-24 relative overflow-hidden">
        <AnimatedBackground />
        <div className="container relative z-10">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-accent font-semibold mb-3">{t("bestsellers.featured")}</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white">{t("bestsellers.title")}</h2>
              <p className="text-muted-foreground mt-3 max-w-2xl">
                {t("bestsellers.subtitle")}
              </p>
            </div>
            <Button asChild variant="outline">
              <Link to="/products">{t("bestsellers.viewAll")} <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <AnimatedBackground />
        <div className="container relative z-10">
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.3em] text-accent font-semibold mb-3">Flexible Options</p>
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">Choose Your Perfect Plan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">Flexible subscription options designed to fit your family's needs</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* One Time Purchase */}
            <div className="glass rounded-3xl p-8 border border-border hover:border-accent/50 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent to-transparent opacity-50"></div>
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-accent" />
                </div>
                <h3 className="font-display text-2xl font-bold text-white mb-2">One Time Purchase</h3>
                <p className="text-muted-foreground text-sm font-semibold">Tryout Plan</p>
                <p className="text-white/70 text-sm mt-3 leading-relaxed">Perfect for trying our service. One litre of fresh milk delivered daily.</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold text-gradient-gold">₹50</span>
                <span className="text-muted-foreground">/litre</span>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>1L fresh milk delivery</span>
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>Same-day delivery</span>
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>No commitment required</span>
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>Pay as you go</span>
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>Quality guaranteed</span>
                </li>
              </ul>
              <Button asChild variant="outline" className="w-full h-12 font-semibold">
                <Link to="/products">Order Now</Link>
              </Button>
            </div>

            {/* Weekly Plan */}
            <div className="glass rounded-3xl p-8 border-2 border-accent relative overflow-hidden hover:-translate-y-2 transition-all duration-300 shadow-gold">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-gold"></div>
              <div className="absolute top-4 right-4 bg-accent text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Popular</div>
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-gold flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-2xl font-bold text-white mb-2">Weekly Plan</h3>
                <p className="text-white/70 text-sm mt-3 leading-relaxed">Enjoy 7 days of uninterrupted fresh milk delivery with added convenience.</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold text-gradient-gold">₹350</span>
                <span className="text-muted-foreground">/week</span>
                <p className="text-green-400 text-sm mt-1">Save ₹50</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>7L milk (1L daily)</span>
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>Daily morning delivery</span>
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>Free delivery</span>
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>Flexible scheduling</span>
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>Cancel anytime</span>
                </li>
              </ul>
              <Button asChild className="w-full h-12 bg-gradient-gold text-primary hover:opacity-90 font-semibold shadow-gold">
                <Link to="/products">Subscribe Now</Link>
              </Button>
            </div>

            {/* Monthly Plan */}
            <div className="glass rounded-3xl p-8 border border-border hover:border-accent/50 transition-all duration-300 hover:-translate-y-2 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>
              <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Best Value</div>
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center mb-4">
                  <Heart className="w-6 h-6 text-green-500" />
                </div>
                <h3 className="font-display text-2xl font-bold text-white mb-2">Monthly Plan</h3>
                <p className="text-white/70 text-sm mt-3 leading-relaxed">Perfect for families. Fresh milk every day with maximum savings.</p>
              </div>
              <div className="mb-8">
                <span className="text-5xl font-bold text-gradient-gold">₹1,500</span>
                <span className="text-muted-foreground">/month</span>
                <p className="text-green-400 text-sm mt-1">Save ₹300</p>
              </div>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>30L milk (1L daily)</span>
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>Daily morning delivery</span>
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>Free delivery</span>
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>24/7 customer support</span>
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>15% off dairy products</span>
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>Free cheese pack/month</span>
                </li>
                <li className="flex items-center gap-3 text-white/80">
                  <Check className="w-5 h-5 text-accent" />
                  <span>Pause or cancel anytime</span>
                </li>
              </ul>
              <Button asChild variant="outline" className="w-full h-12 font-semibold">
                <Link to="/products">Subscribe Now</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 relative overflow-hidden">
        <AnimatedBackground />
        <div className="container relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
            <div>
              <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground">{t("testimonials.badge")}</p>
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white">{t("testimonials.title")}</h2>
            </div>
            <div className="flex gap-3">
              <button
                aria-label="Previous testimonial"
                onClick={() => setActiveTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length)}
                className="h-12 w-12 rounded-full border border-border bg-white hover:bg-primary/10 transition"
              >
                ‹
              </button>
              <button
                aria-label="Next testimonial"
                onClick={() => setActiveTestimonial((prev) => (prev + 1) % testimonials.length)}
                className="h-12 w-12 rounded-full border border-border bg-white hover:bg-primary/10 transition"
              >
                ›
              </button>
            </div>
          </div>
          <div className="overflow-hidden rounded-[32px] border border-border shadow-elegant bg-white/80 backdrop-blur">
            <div
              className="flex transition-transform duration-700"
              style={{ transform: `translateX(-${activeTestimonial * 100}%)` }}
            >
              {testimonials.map((item) => (
                <div key={item.key} className="min-w-full px-8 py-14 flex flex-col gap-6">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-primary/10 text-primary text-xs uppercase tracking-[0.3em]">{t("testimonials.aiCurated")}</span>
                    <span>{t(`testimonials.${item.key}.role`)}</span>
                  </div>
                  <p className="text-2xl md:text-3xl font-display leading-snug">"{t(`testimonials.${item.key}.quote`)}"</p>
                  <div>
                    <p className="text-lg font-semibold">{t(`testimonials.${item.key}.name`)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-2 pb-6">
              {testimonials.map((_, idx) => (
                <span
                  key={idx}
                  className={`h-2 w-10 rounded-full ${idx === activeTestimonial ? "bg-primary" : "bg-muted"}`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>
      </div>
    </Layout>
  );
}
