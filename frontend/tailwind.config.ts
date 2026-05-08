import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: { center: true, padding: "1.5rem", screens: { "2xl": "1400px" } },
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: { DEFAULT: "hsl(var(--muted))", foreground: "hsl(var(--muted-foreground))" },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
          glow: "hsl(var(--accent-glow))",
        },
        popover: { DEFAULT: "hsl(var(--popover))", foreground: "hsl(var(--popover-foreground))" },
        card: { DEFAULT: "hsl(var(--card))", foreground: "hsl(var(--card-foreground))" },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { "0%": { opacity: "0", transform: "translateY(20px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "fade-in-up": { "0%": { opacity: "0", transform: "translateY(40px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "scale-in": { "0%": { opacity: "0", transform: "scale(0.95)" }, "100%": { opacity: "1", transform: "scale(1)" } },
        "float": { "0%, 100%": { transform: "translateY(0)" }, "50%": { transform: "translateY(-12px)" } },
        "shimmer": { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px hsl(var(--accent) / 0.4)" },
          "50%": { boxShadow: "0 0 40px hsl(var(--accent) / 0.7)" },
        },
        "spin-slow": { from: { transform: "rotate(0deg)" }, to: { transform: "rotate(360deg)" } },
        "blob": { "0%,100%": { borderRadius: "60% 40% 30% 70% / 60% 30% 70% 40%" }, "50%": { borderRadius: "30% 60% 70% 40% / 50% 60% 30% 60%" } },
        "drift": { "0%": { transform: "translateX(0) translateY(0) scale(1)" }, "33%": { transform: "translateX(30px) translateY(-20px) scale(1.05)" }, "66%": { transform: "translateX(-20px) translateY(10px) scale(0.95)" }, "100%": { transform: "translateX(0) translateY(0) scale(1)" } },
        "particle": { "0%": { opacity: "0", transform: "translateY(0) scale(0)" }, "20%": { opacity: "1" }, "100%": { opacity: "0", transform: "translateY(-120px) scale(1)" } },
        "gradient-shift": { "0%,100%": { backgroundPosition: "0% 50%" }, "50%": { backgroundPosition: "100% 50%" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.6s ease-out forwards",
        "fade-in-up": "fade-in-up 0.8s ease-out forwards",
        "scale-in": "scale-in 0.4s ease-out forwards",
        "float": "float 6s ease-in-out infinite",
        "shimmer": "shimmer 3s linear infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "spin-slow": "spin-slow 20s linear infinite",
        "blob": "blob 8s ease-in-out infinite",
        "drift": "drift 12s ease-in-out infinite",
        "particle": "particle 4s ease-out infinite",
        "gradient-shift": "gradient-shift 8s ease infinite",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} as Config;
