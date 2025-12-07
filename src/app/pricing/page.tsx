"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscriptionRequired = searchParams.get("subscription_required") === "true";
  const [loading, setLoading] = useState<"creator" | "designer" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPlan, setHoveredPlan] = useState<"creator" | "designer" | null>(null);

  async function handleSubscribe(plan: "creator" | "designer") {
    if (status !== "authenticated") {
      router.push(`/signup?role=${plan === "creator" ? "CREATOR" : "DESIGNER"}`);
      return;
    }

    setLoading(plan);
    setError(null);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }

      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#000] relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0">
        {/* Main gradient orbs */}
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-cyan-500/10 via-purple-500/5 to-emerald-500/10 rounded-full blur-3xl" />
        
        {/* Floating particles effect */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* Subtle noise texture */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }} />
      </div>

      {subscriptionRequired && (
        <div className="relative z-20 bg-gradient-to-r from-orange-500/20 via-amber-500/20 to-orange-500/20 border-b border-orange-500/30 backdrop-blur-sm p-4 text-center">
          <span className="inline-flex items-center gap-3 text-white">
            <span className="text-2xl">🔒</span>
            <span className="font-semibold">Abonnement requis pour accéder à la plateforme</span>
            <span className="text-white/60">— Choisissez votre plan ci-dessous pour continuer</span>
          </span>
        </div>
      )}

      {error && (
        <div className="relative z-20 bg-red-500/10 border-b border-red-500/20 backdrop-blur-sm p-4 text-center text-red-400 text-sm">
          <span className="inline-flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </span>
        </div>
      )}

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 md:py-24">
        {/* Header */}
        <div className="text-center mb-20">
          {/* Animated badge */}
          <div className="inline-flex items-center gap-3 rounded-full bg-white/[0.03] border border-white/[0.08] px-5 py-2.5 mb-8 backdrop-blur-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-400"></span>
            </span>
            <span className="text-sm font-medium text-white/70">Offres de lancement · Places limitées</span>
            <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
              </svg>
              HOT
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight leading-[1.1]">
            Des prix{" "}
            <span className="relative">
              <span className="relative z-10 bg-gradient-to-r from-cyan-400 via-emerald-300 to-cyan-400 bg-clip-text text-transparent bg-[length:200%_auto] animate-gradient">
                imbattables
              </span>
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 10C50 2 150 2 198 10" stroke="url(#underline-gradient)" strokeWidth="3" strokeLinecap="round"/>
                <defs>
                  <linearGradient id="underline-gradient" x1="0" y1="0" x2="200" y2="0">
                    <stop stopColor="#22d3ee"/>
                    <stop offset="0.5" stopColor="#34d399"/>
                    <stop offset="1" stopColor="#22d3ee"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
          </h1>
          <p className="text-xl text-white/50 max-w-xl mx-auto leading-relaxed">
            Rejoignez la communauté CREAX. Zéro commission, zéro surprise.
          </p>
        </div>

        {/* Plans */}
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 max-w-4xl mx-auto">
          {/* Plan Créateur */}
          <div
            className="group relative"
            onMouseEnter={() => setHoveredPlan("creator")}
            onMouseLeave={() => setHoveredPlan(null)}
          >
            {/* Animated border gradient */}
            <div className={`absolute -inset-[2px] rounded-[28px] bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500 bg-[length:200%_auto] transition-opacity duration-150 ${hoveredPlan === "creator" ? "opacity-100 animate-gradient" : "opacity-0"}`} />
            
            {/* Card */}
            <div className="relative h-full rounded-[26px] bg-[#0c0c0c] border border-white/[0.08] overflow-hidden">
              {/* Inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              
              {/* Promo ribbon */}
              <div className="absolute top-6 -right-8 rotate-45 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold py-1 px-10 shadow-lg">
                -50%
              </div>

              <div className="relative p-8 md:p-10">
                {/* Tag */}
                <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  <span className="text-xs font-medium text-cyan-400">Pour les créateurs</span>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-white mb-2">Créateur</h2>
                <p className="text-white/40 text-sm mb-8">Trouvez les meilleurs talents</p>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-6xl font-bold text-white tracking-tight">4,99</span>
                  <span className="text-2xl text-white/30">€</span>
                  <span className="text-white/30">/mois</span>
                </div>
                <div className="flex items-center gap-3 mb-10">
                  <span className="text-sm text-white/30 line-through">9,99€</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">ÉCONOMISEZ 5€</span>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-10">
                  {[
                    { icon: "🔍", text: "Recherche illimitée de talents" },
                    { icon: "💬", text: "Messagerie sécurisée" },
                    { icon: "📊", text: "Dashboard de gestion" },
                    { icon: "🔔", text: "Notifications en temps réel" },
                    { icon: "⭐", text: "Support prioritaire" }
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-lg">{f.icon}</span>
                      <span className="text-white/70 text-sm">{f.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleSubscribe("creator")}
                  disabled={loading !== null}
                  className="relative w-full h-14 rounded-2xl font-bold text-sm overflow-hidden transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500" />
                  <div className="absolute inset-[2px] rounded-[14px] bg-[#0c0c0c] group-hover:bg-transparent transition-colors duration-150" />
                  <span className="relative z-10 bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent group-hover:text-slate-900 transition-colors duration-150 font-bold">
                    {loading === "creator" ? "Redirection..." : "Commencer maintenant"}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Plan Designer */}
          <div
            className="group relative"
            onMouseEnter={() => setHoveredPlan("designer")}
            onMouseLeave={() => setHoveredPlan(null)}
          >
            {/* Animated border gradient */}
            <div className={`absolute -inset-[2px] rounded-[28px] bg-gradient-to-r from-emerald-500 via-cyan-400 to-emerald-500 bg-[length:200%_auto] transition-opacity duration-150 ${hoveredPlan === "designer" ? "opacity-100 animate-gradient" : "opacity-0"}`} />
            
            {/* Card */}
            <div className="relative h-full rounded-[26px] bg-[#0c0c0c] border border-white/[0.08] overflow-hidden">
              {/* Inner glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
              
              {/* Promo ribbon */}
              <div className="absolute top-6 -right-8 rotate-45 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold py-1 px-10 shadow-lg">
                -50%
              </div>

              <div className="relative p-8 md:p-10">
                {/* Tag */}
                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span className="text-xs font-medium text-emerald-400">Pour les designers</span>
                </div>

                {/* Title */}
                <h2 className="text-3xl font-bold text-white mb-2">Designer</h2>
                <p className="text-white/40 text-sm mb-8">Développez votre clientèle</p>

                {/* Price */}
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-6xl font-bold text-white tracking-tight">9,99</span>
                  <span className="text-2xl text-white/30">€</span>
                  <span className="text-white/30">/mois</span>
                </div>
                <div className="flex items-center gap-3 mb-10">
                  <span className="text-sm text-white/30 line-through">19,99€</span>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">ÉCONOMISEZ 10€</span>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-10">
                  {[
                    { icon: "🎨", text: "Portfolio public optimisé" },
                    { icon: "📩", text: "Demandes de créateurs qualifiés" },
                    { icon: "💬", text: "Messagerie & historique" },
                    { icon: "📈", text: "Statistiques de profil" },
                    { icon: "🚀", text: "Mise en avant premium" }
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="text-lg">{f.icon}</span>
                      <span className="text-white/70 text-sm">{f.text}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button
                  onClick={() => handleSubscribe("designer")}
                  disabled={loading !== null}
                  className="relative w-full h-14 rounded-2xl font-bold text-sm overflow-hidden transition-transform duration-150 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-cyan-500" />
                  <div className="absolute inset-[2px] rounded-[14px] bg-[#0c0c0c] group-hover:bg-transparent transition-colors duration-150" />
                  <span className="relative z-10 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent group-hover:text-slate-900 transition-colors duration-150 font-bold">
                    {loading === "designer" ? "Redirection..." : "Commencer maintenant"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-20 text-center">
          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
            {[
              { icon: "🔒", text: "Paiement 100% sécurisé" },
              { icon: "⚡", text: "Activation instantanée" },
              { icon: "🔄", text: "Annulation en 1 clic" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-white/40">
                <span>{item.icon}</span>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
          
          {/* Stripe badge */}
          <div className="inline-flex items-center gap-2 text-white/20 text-xs">
            <span>Propulsé par</span>
            <svg className="h-5" viewBox="0 0 60 25" fill="currentColor">
              <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.02 1.04-.06 1.48zm-3.67-3.14c0-1.42-.6-3.28-2.37-3.28-1.72 0-2.5 1.86-2.6 3.28h4.97zM40.95 20.3c-1.44 0-2.32-.7-2.91-1.18l-.02 5.22-3.45.74V5.57h3.45v1.29c.6-.5 1.51-1.29 2.98-1.29 2.63 0 5.27 2.16 5.27 7.05 0 5.57-2.67 7.68-5.32 7.68zm-.77-11.44c-.98 0-1.57.36-1.97.79l.04 5.56c.34.35.89.69 1.93.69 1.49 0 2.46-1.62 2.46-3.51 0-1.99-.97-3.53-2.46-3.53zM28.24 5.57h3.45v14.43h-3.45V5.57zm0-5.57h3.45v3.35h-3.45V0zM25.3 5.57h3.44V20h-3.44v-1.31c-.8.67-1.93 1.61-3.68 1.61-2.78 0-4.09-2.16-4.09-4.94V5.57h3.45v8.56c0 1.7.65 2.48 1.92 2.48 1.04 0 1.67-.52 2.4-1.15V5.57zm-12.78 0l-.1 2.02c-.24-.04-.45-.06-.65-.06-1.33 0-2.62.72-2.93 2.05V20H5.39V5.57h3.42v1.86c.74-1.38 2.02-2.16 3.71-2.16V5.57zM4.45 8.66H2.35V5.57h2.1V2.32L7.9 1.58v4h2.76v3.08H7.9v6.53c0 .9.38 1.31 1.17 1.31.42 0 .84-.11 1.2-.23l.8 2.87a6.14 6.14 0 0 1-2.77.56c-2.45 0-3.85-1.3-3.85-3.9V8.66z"/>
            </svg>
          </div>
        </div>
      </div>

      {/* CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
