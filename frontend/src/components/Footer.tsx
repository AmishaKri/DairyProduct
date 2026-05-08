import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-primary text-primary-foreground/70 py-12 mt-24">
      <div className="container grid md:grid-cols-4 gap-8">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gradient-gold flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-bold text-xl text-white">Kshira</span>
          </div>
          <p className="text-sm">{t("footer.tagline")}</p>
        </div>
        <div>
          <div className="font-semibold text-white mb-3">{t("footer.shop")}</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/products" className="hover:text-accent">{t("footer.allProducts")}</Link></li>
            <li><Link to="/products?cat=milk" className="hover:text-accent">{t("footer.milk")}</Link></li>
            <li><Link to="/products?cat=dairy" className="hover:text-accent">{t("footer.dairy")}</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-white mb-3">{t("footer.company")}</div>
          <ul className="space-y-2 text-sm">
            <li><Link to="/contact" className="hover:text-accent">{t("footer.contact")}</Link></li>
            <li><Link to="/admin" className="hover:text-accent">Admin</Link></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold text-white mb-3">{t("footer.getInTouch")}</div>
          <p className="text-sm">hello@kshira.com</p>
          <p className="text-sm">+91 98765 43210</p>
        </div>
      </div>
      <div className="container mt-8 pt-6 border-t border-white/10 text-xs text-center">
        © 2026 Kshira Dairy. {t("footer.rights")}
      </div>
    </footer>
  );
}
