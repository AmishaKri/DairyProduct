export default function AnimatedBackground() {
  const particles = Array.from({ length: 18 });

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Morphing blobs */}
      <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-amber-400/20 blur-[120px] animate-blob" />
      <div className="absolute top-1/2 -right-40 w-[480px] h-[480px] bg-sky-400/15 blur-[120px] animate-blob [animation-delay:3s]" />
      <div className="absolute -bottom-20 left-1/3 w-[400px] h-[400px] bg-yellow-300/20 blur-[100px] animate-blob [animation-delay:6s]" />

      {/* Drifting orbs */}
      <div className="absolute top-24 left-[10%] w-40 h-40 rounded-full bg-gradient-to-br from-amber-200/30 to-yellow-400/10 blur-2xl animate-drift" />
      <div className="absolute bottom-32 right-[15%] w-52 h-52 rounded-full bg-gradient-to-br from-blue-300/20 to-sky-200/10 blur-2xl animate-drift [animation-delay:5s]" />
      <div className="absolute top-1/3 left-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-orange-200/30 to-amber-100/10 blur-xl animate-drift [animation-delay:2s]" />

      {/* Animated grid lines */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Floating dairy particles */}
      {particles.map((_, i) => (
        <span
          key={i}
          className="absolute text-lg select-none animate-particle opacity-0"
          style={{
            left: `${5 + (i * 5.3) % 92}%`,
            bottom: `${5 + (i * 7.1) % 40}%`,
            animationDelay: `${(i * 0.8) % 6}s`,
            animationDuration: `${4 + (i % 4)}s`,
          }}
        >
          {["🥛", "🧈", "✨", "❄️", "💧", "🌿", "⭐"][i % 7]}
        </span>
      ))}

      {/* Radial glow center */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(250,204,21,0.08)_0%,_transparent_70%)]" />
    </div>
  );
}
