import { Truck, Leaf, ShieldCheck, Clock } from "lucide-react";
import AnimatedBackground from "./AnimatedBackground";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Features() {
  const { t } = useLanguage();

  const items = [
    { icon: Leaf, key: "organic" },
    { icon: Truck, key: "delivery" },
    { icon: ShieldCheck, key: "quality" },
    { icon: Clock, key: "support" },
  ];

  return (
    <section className="py-24 bg-background relative overflow-hidden">
      <AnimatedBackground />
      <div className="container relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-sm uppercase tracking-[0.2em] text-accent font-semibold mb-3">{t("features.whyKshira")}</div>
          <h2 className="font-display text-4xl md:text-5xl font-bold">{t("features.title")}</h2>
        </div>
        <div className="grid md:grid-cols-4 gap-6">
          {items.map((f, i) => (
            <div key={f.key}
              className="group bg-card rounded-2xl p-6 border border-border hover:border-accent/50 hover:shadow-gold transition-all duration-500 animate-fade-in-up"
              style={{ animationDelay: `${i * 0.1}s`, opacity: 0 }}>
              <div className="w-12 h-12 rounded-xl bg-gradient-gold flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-xl mb-2">{t(`features.${f.key}.title`)}</h3>
              <p className="text-sm text-muted-foreground">{t(`features.${f.key}.desc`)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
