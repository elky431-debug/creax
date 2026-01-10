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
                  href="/profile"
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
    <div className="min-h-screen bg-black">
      {/* Minimal background (no orbs/particles) */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.10]"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.07) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.07) 1px, transparent 1px)",
          backgroundSize: "56px 56px"
        }}
      />

      {subscriptionRequired && (
        <div className="border-b border-cyan-500/20 bg-cyan-500/5">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 text-sm text-white/80">
            <svg className="h-4 w-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="font-semibold text-white">Abonnement requis</span>
            <span className="text-white/55">Choisissez un plan pour continuer.</span>
          </div>
        </div>
      )}

      {error && (
        <div className="border-b border-red-500/20 bg-red-500/10">
          <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3 text-sm text-red-300">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}

      <div className="relative mx-auto max-w-5xl px-4 py-14 md:py-18">
        <div className="mb-10 md:mb-12">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.03] px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/65">
            Tarifs
          </div>
          <h1 className="mt-5 text-4xl sm:text-5xl font-black tracking-tight text-white">
            Un abonnement,{" "}
            <span className="text-cyan-300">tout inclus</span>
          </h1>
          <p className="mt-3 max-w-2xl text-base sm:text-lg leading-relaxed text-white/55">
            Zéro commission sur vos projets. Résiliable à tout moment.
          </p>
        </div>

        <div className={`grid gap-4 ${showCreatorPlan && showDesignerPlan ? "md:grid-cols-2" : "md:grid-cols-1"} `}>
          {showCreatorPlan && (
            <div className="rounded-3xl border border-white/[0.10] bg-white/[0.02] p-7 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">Créateurs</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Créateur</h2>
                  <p className="mt-1 text-sm text-white/45">Publiez des missions et trouvez des talents.</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white">4,99€</div>
                  <div className="text-sm text-white/35">par mois</div>
                </div>
              </div>

              <ul className="mt-7 space-y-3 text-sm text-white/60">
                {[
                  "Recherche illimitée de talents",
                  "Messagerie intégrée",
                  "Dashboard de gestion",
                  "Notifications"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe("creator")}
                disabled={loading !== null}
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl bg-cyan-500 px-5 py-3.5 text-sm font-bold text-black transition hover:bg-cyan-400 disabled:opacity-50"
              >
                {loading === "creator" ? "Redirection..." : "Choisir ce plan"}
              </button>
            </div>
          )}

          {showDesignerPlan && (
            <div className="rounded-3xl border border-white/[0.10] bg-white/[0.02] p-7 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300/80">Graphistes & monteurs</p>
                  <h2 className="mt-2 text-2xl font-bold text-white">Designer</h2>
                  <p className="mt-1 text-sm text-white/45">Recevez des demandes qualifiées et échangez rapidement.</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-black text-white">9,99€</div>
                  <div className="text-sm text-white/35">par mois</div>
                </div>
              </div>

              <ul className="mt-7 space-y-3 text-sm text-white/60">
                {[
                  "Portfolio public optimisé",
                  "Demandes de créateurs qualifiés",
                  "Messagerie & historique",
                  "Statistiques de profil"
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3">
                    <svg className="h-5 w-5 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe("designer")}
                disabled={loading !== null}
                className="mt-8 inline-flex w-full items-center justify-center rounded-xl border border-white/[0.14] bg-white/[0.03] px-5 py-3.5 text-sm font-bold text-white/90 transition hover:bg-white/[0.06] disabled:opacity-50"
              >
                {loading === "designer" ? "Redirection..." : "Choisir ce plan"}
              </button>
            </div>
          )}
        </div>

        <div className="mt-10 flex flex-col gap-3 text-sm text-white/45">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/70" />
            Annulation en 1 clic
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/70" />
            Zéro commission sur vos projets
          </div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-300/70" />
            Support rapide
          </div>
        </div>
      </div>
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
