import { ArrowRight, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-milk.jpg";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();

  const stats = [
    { v: "100%", l: t("hero.stats.pureFresh") },
    { v: "24h", l: t("hero.stats.farmToDoor") },
    { v: "5★", l: t("hero.stats.customerRated") },
  ];

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-gradient-hero text-white">
      <AnimatedBackground />
      <div className="absolute inset-0 opacity-60" style={{ background: "var(--gradient-radial-gold)" }} />
      <div className="absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-accent/10 blur-3xl animate-spin-slow" />
      <div className="absolute -bottom-40 -left-40 w-[500px] h-[500px] rounded-full bg-primary-glow/30 blur-3xl" />

      <div className="container relative z-10 grid md:grid-cols-2 gap-12 items-center py-32">
        <div className="space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm">
            <Sparkles className="w-4 h-4 text-accent" />
            <span className="text-white/90">{t("hero.badge")}</span>
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.05]">
            {t("hero.title")}
          </h1>
          <p className="text-lg text-white/70 max-w-lg">
            {t("hero.subtitle")}
          </p>
          <div className="flex flex-wrap gap-4">
            <Button asChild size="lg" className="bg-gradient-gold text-primary hover:opacity-90 shadow-gold font-semibold">
              <Link to="/products">{t("hero.exploreProducts")} <ArrowRight className="ml-2 w-4 h-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 text-white bg-white/5 hover:bg-white/10">
              <Link to="/contact">{t("hero.contactUs")}</Link>
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
            {stats.map((s) => (
              <div key={s.l}>
                <div className="font-display text-3xl font-bold text-gradient-gold">{s.v}</div>
                <div className="text-xs uppercase tracking-wider text-white/60 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="absolute inset-0 bg-gradient-gold opacity-20 blur-3xl rounded-full" />
          <img
            src={heroImg}
            alt="Premium dairy milk bottle with gold accents"
            width={1536}
            height={1024}
            className="relative rounded-3xl shadow-elegant animate-float"
          />
          <div className="absolute -bottom-6 -left-6 glass rounded-2xl p-4 animate-scale-in" style={{ animationDelay: "0.8s" }}>
            <div className="text-xs text-white/60">{t("hero.bestSeller")}</div>
            <div className="font-display font-bold">{t("hero.product")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
