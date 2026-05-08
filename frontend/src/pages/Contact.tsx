import Layout from "@/components/Layout";
import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Contact() {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `Hi! I'm ${form.name} (${form.email}). ${form.message}`;
    window.open(`https://wa.me/919876543210?text=${encodeURIComponent(text)}`, "_blank");
    toast.success("Opening WhatsApp...");
  };

  return (
    <Layout>
      <section className="pt-32 pb-12 bg-gradient-hero text-white">
        <div className="container text-center">
          <h1 className="font-display text-5xl md:text-6xl font-bold animate-fade-in-up">{t("contact.title")}</h1>
          <p className="text-white/70 mt-3 max-w-xl mx-auto">{t("contact.subtitle")}</p>
        </div>
      </section>
      <section className="py-16">
        <div className="container grid md:grid-cols-2 gap-12 max-w-5xl">
          <div className="space-y-6">
            {[
              { icon: Mail, key: "email", value: "hello@kshira.com" },
              { icon: Phone, key: "phone", value: "+91 98765 43210" },
              { icon: MapPin, key: "address", value: "Dairy Farm Lane, Pune, India" },
              { icon: MessageCircle, key: "whatsapp", value: "+91 98765 43210" },
            ].map((c) => (
              <div key={c.key} className="flex items-start gap-4 p-5 rounded-2xl bg-card border border-border">
                <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shrink-0">
                  <c.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground">{t(`contact.info.${c.key}`)}</div>
                  <div className="font-medium">{c.value}</div>
                </div>
              </div>
            ))}
          </div>
          <form onSubmit={submit} className="bg-card rounded-2xl p-6 border border-border space-y-4 shadow-soft">
            <div>
              <Label htmlFor="n">{t("contact.form.name")}</Label>
              <Input id="n" required maxLength={100} value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="e">{t("contact.form.email")}</Label>
              <Input id="e" type="email" required maxLength={255} value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="m">{t("contact.form.message")}</Label>
              <Textarea id="m" required rows={5} maxLength={1000} value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })} />
            </div>
            <Button type="submit" className="w-full bg-gradient-gold text-primary hover:opacity-90 font-semibold" size="lg">
              {t("contact.form.submit")}
            </Button>
          </form>
        </div>
      </section>
    </Layout>
  );
}
