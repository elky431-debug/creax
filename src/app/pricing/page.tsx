"use client";

import { Suspense, useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function PricingContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const subscriptionRequired = searchParams.get("subscription_required") === "true";
  const [loading, setLoading] = useState<"creator" | "designer" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPlan, setHoveredPlan] = useState<"creator" | "designer" | null>(null);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [checkingSubscription, setCheckingSubscription] = useState(true);

  // Vérifier l'abonnement de l'utilisateur
  useEffect(() => {
    async function checkSubscription() {
      if (status === "loading") return;
      
      if (status === "authenticated") {
        try {
          const res = await fetch("/api/profile");
          if (res.ok) {
            const data = await res.json();
            setHasSubscription(data.user?.hasSubscription || false);
            setUserRole(data.user?.role || null);
          }
        } catch (e) {
          console.error("Erreur vérification abonnement:", e);
        }
      }
      setCheckingSubscription(false);
    }
    checkSubscription();
  }, [status]);

  // Si l'utilisateur a déjà un abonnement, afficher un message
  if (!checkingSubscription && hasSubscription && !subscriptionRequired) {
    return (
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center px-4">
        {/* Background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] bg-gradient-to-b from-cyan-500/[0.08] via-emerald-500/[0.035] to-transparent blur-[110px]" />
          <div className="absolute -bottom-56 left-0 w-[700px] h-[700px] bg-gradient-to-tr from-emerald-500/[0.06] via-cyan-500/[0.02] to-transparent blur-[120px]" />
          <div
            className="absolute inset-0 opacity-[0.08]"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "48px 48px"
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black" />
        </div>

        <div className="relative w-full max-w-lg">
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/12 via-transparent to-cyan-500/10" />
            <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0a] border border-white/[0.10]" />
            <div className="relative p-10 text-center">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/20">
                <svg className="h-8 w-8 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black text-white mb-3">
                Abonnement actif
              </h1>
              <p className="text-white/55 mb-8 leading-relaxed">
                Votre abonnement est déjà actif. Accédez à toutes les fonctionnalités de CREIX.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-3.5 text-sm font-bold text-slate-900 transition hover:shadow-lg hover:shadow-cyan-500/20"
                >
                  Aller au Dashboard
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/settings/subscription"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.03] px-6 py-3.5 text-sm font-semibold text-white/90 transition hover:bg-white/[0.06]"
                >
                  Gérer mon abonnement
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Déterminer quel plan afficher selon le rôle
  const showCreatorPlan = !userRole || userRole === "CREATOR";
  const showDesignerPlan = !userRole || userRole === "DESIGNER";

  // Afficher un loader pendant la vérification
  if (status === "loading" || checkingSubscription) {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-white/10 border-t-cyan-500 animate-spin" />
          <p className="text-white/50">Chargement...</p>
        </div>
      </div>
    );
  }

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
            Rejoignez la communauté CREIX. Zéro commission, zéro surprise.
          </p>
        </div>

        {/* Plans */}
        <div className={`grid gap-6 ${showCreatorPlan && showDesignerPlan ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} lg:gap-8 max-w-4xl mx-auto`}>
          {/* Plan Créateur */}
          {showCreatorPlan && <div
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
                  <span className="text-6xl font-bold text-white tracking-tight">9,99</span>
                  <span className="text-2xl text-white/30">€</span>
                  <span className="text-white/30">/mois</span>
                </div>
                <div className="mb-10" />

                {/* Features */}
                <div className="space-y-4 mb-10">
                  {[
                    {
                      icon: (
                        <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35m1.1-4.15a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z" />
                        </svg>
                      ),
                      text: "Recherche illimitée de talents"
                    },
                    {
                      icon: (
                        <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      ),
                      text: "Messagerie intégrée"
                    },
                    {
                      icon: (
                        <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 15v3m4-8v8m4-5v5" />
                        </svg>
                      ),
                      text: "Dashboard de gestion"
                    },
                    {
                      icon: (
                        <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 10-12 0v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0h6z" />
                        </svg>
                      ),
                      text: "Notifications en temps réel"
                    },
                    {
                      icon: (
                        <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.809c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ),
                      text: "Support prioritaire"
                    }
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                        {f.icon}
                      </span>
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
          </div>}

          {/* Plan Designer */}
          {showDesignerPlan && <div
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
                  <span className="text-6xl font-bold text-white tracking-tight">14,99</span>
                  <span className="text-2xl text-white/30">€</span>
                  <span className="text-white/30">/mois</span>
                </div>
                <div className="mb-10" />

                {/* Features */}
                <div className="space-y-4 mb-10">
                  {[
                    {
                      icon: (
                        <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                        </svg>
                      ),
                      text: "Portfolio public optimisé"
                    },
                    {
                      icon: (
                        <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a4 4 0 01-4 4H7l-4 3V7a4 4 0 014-4h10a4 4 0 014 4v8z" />
                        </svg>
                      ),
                      text: "Demandes de créateurs qualifiés"
                    },
                    {
                      icon: (
                        <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      ),
                      text: "Messagerie & historique"
                    },
                    {
                      icon: (
                        <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 19V5m0 14h16M7 16V8m4 8V6m4 10v-4" />
                        </svg>
                      ),
                      text: "Statistiques de profil"
                    },
                    {
                      icon: (
                        <svg className="h-5 w-5 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      ),
                      text: "Mise en avant premium"
                    }
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        {f.icon}
                      </span>
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
          </div>}
        </div>

        {/* Bottom section */}
        <div className="mt-20 text-center">
          {/* Trust indicators */}
          <div className="flex flex-wrap items-center justify-center gap-8 mb-8">
            {[
              { text: "Zéro commission sur vos projets" },
              { text: "Annulation en 1 clic" },
              { text: "Support rapide" }
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-white/40">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400/60" />
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
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

export default function PricingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#000] flex items-center justify-center text-white">Chargement...</div>}>
      <PricingContent />
    </Suspense>
  );
}
