"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type SubscriptionData = {
  status: string;
  currentPeriodEnd: string;
  isTrial: boolean;
  cancelAtPeriodEnd?: boolean;
} | null;

export default function PricingSection() {
  const { data: session, status } = useSession();
  const [subscription, setSubscription] = useState<SubscriptionData>(null);
  const [loading, setLoading] = useState(true);

  const userRole = session?.user?.role as "CREATOR" | "DESIGNER" | undefined;

  useEffect(() => {
    async function fetchSubscription() {
      if (status === "loading") return;
      if (!session?.user) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch("/api/subscription");
        if (res.ok) {
          const data = await res.json();
          if (data.hasSubscription) {
            setSubscription(data.subscription);
          }
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchSubscription();
  }, [session, status]);

  const isLoggedIn = status === "authenticated";

  // Afficher le loader pendant le chargement
  if (status === "loading" || loading) {
    return <PricingCards userRole={undefined} subscription={null} isLoggedIn={false} />;
  }

  return <PricingCards userRole={userRole} subscription={subscription} isLoggedIn={isLoggedIn} />;
}

function PricingCards({ 
  userRole, 
  subscription,
  isLoggedIn
}: { 
  userRole: "CREATOR" | "DESIGNER" | undefined;
  subscription: SubscriptionData;
  isLoggedIn: boolean;
}) {
  const hasActiveSubscription = subscription && 
    (subscription.status === "active" || subscription.status === "trialing");

  return (
    <section className="relative py-20 md:py-32 px-4 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.03] to-transparent" />
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[600px] bg-gradient-to-r from-cyan-500/10 via-emerald-500/5 to-cyan-500/10 rounded-full blur-3xl" />
      </div>
      
      <div className="relative z-10 max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] border border-white/10 px-4 py-2 mb-6">
            <span className="text-lg">💎</span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">
              {hasActiveSubscription ? "Mon abonnement" : "Tarification simple"}
            </span>
          </div>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6">
            {hasActiveSubscription ? (
              <>Vous êtes <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">abonné</span></>
            ) : (
              <>Un prix unique, <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">tout inclus</span></>
            )}
          </h2>
          <p className="text-white/50 text-lg max-w-2xl mx-auto leading-relaxed">
            {hasActiveSubscription 
              ? "Profitez de toutes les fonctionnalités de CREIX avec votre abonnement actif."
              : "Pas de frais cachés, pas de commission sur vos projets. Juste un abonnement simple pour accéder à toutes les fonctionnalités."
            }
          </p>
        </div>
        
        {/* Cards */}
        <div className="flex justify-center">
          <div className={`grid gap-6 ${hasActiveSubscription || (userRole && !hasActiveSubscription) ? 'grid-cols-1 max-w-md' : 'sm:grid-cols-2 max-w-3xl'}`}>
            
            {/* Si abonné, afficher la carte de son abonnement */}
            {hasActiveSubscription && subscription ? (
              <SubscriptionCard 
                role={userRole!} 
                subscription={subscription} 
              />
            ) : (
              <>
                {/* Créateurs - caché si l'utilisateur est un designer */}
                {(!userRole || userRole === "CREATOR") && (
                  <CreatorPricingCard isLoggedIn={isLoggedIn} />
                )}
                
                {/* Designers - caché si l'utilisateur est un créateur */}
                {(!userRole || userRole === "DESIGNER") && (
                  <DesignerPricingCard isLoggedIn={isLoggedIn} />
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Bottom CTA */}
        {!hasActiveSubscription && (
          <div className="text-center mt-12">
            <a
              href="/pricing"
              className="group inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors"
            >
              <span className="font-medium">Voir tous les détails</span>
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// Carte d'abonnement actif
function SubscriptionCard({ 
  role, 
  subscription 
}: { 
  role: "CREATOR" | "DESIGNER";
  subscription: NonNullable<SubscriptionData>;
}) {
  const isCreator = role === "CREATOR";
  const features = isCreator 
    ? ["Accès illimité aux talents", "Messagerie directe", "Paiements sécurisés", "Support prioritaire"]
    : ["Visibilité maximale", "Portfolio intégré", "Demandes qualifiées", "Paiements sécurisés"];

  const periodEnd = new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  });

  return (
    <div className="group relative rounded-3xl overflow-hidden">
      {/* Border gradient - always visible for subscribers */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isCreator ? 'from-cyan-500/50 via-cyan-500/30' : 'from-emerald-500/50 via-emerald-500/30'} to-transparent`} />
      <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0a]" />
      
      {/* Status badge */}
      <div className={`absolute top-4 right-4 z-10 ${
        subscription.cancelAtPeriodEnd 
          ? 'bg-orange-500' 
          : subscription.isTrial 
            ? 'bg-cyan-500' 
            : 'bg-emerald-500'
      } text-white text-[10px] font-bold py-1 px-3 rounded-full`}>
        {subscription.cancelAtPeriodEnd 
          ? "Résiliation programmée" 
          : subscription.isTrial 
            ? "Période d'essai" 
            : "✓ Actif"
        }
      </div>
      
      <div className="relative p-8 sm:p-10">
        {/* Icon */}
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${isCreator ? 'from-cyan-500/20 to-cyan-500/5 border-cyan-500/20' : 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20'} border flex items-center justify-center mb-6`}>
          <span className="text-2xl">{isCreator ? "🎬" : "🎨"}</span>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">
          {isCreator ? "Abonnement Créateur" : "Abonnement Designer"}
        </h3>
        <p className="text-white/40 text-sm mb-6">
          {isCreator ? "Pour les créateurs de contenu" : "Pour les graphistes & monteurs"}
        </p>
        
        {/* Price */}
        <div className="flex items-baseline gap-1 mb-2">
          <span className={`text-5xl font-black bg-gradient-to-r ${isCreator ? 'from-cyan-400 to-emerald-400' : 'from-emerald-400 to-cyan-400'} bg-clip-text text-transparent`}>
            {isCreator ? "4,99" : "9,99"}
          </span>
          <span className="text-xl font-bold text-white/50">€</span>
          <span className="text-white/30 ml-1">/mois</span>
        </div>
        
        {/* Period info */}
        <div className={`flex items-center gap-2 mb-6 p-3 rounded-lg ${
          subscription.cancelAtPeriodEnd 
            ? 'bg-orange-500/10 border border-orange-500/20' 
            : 'bg-white/[0.03] border border-white/10'
        }`}>
          <svg className={`w-4 h-4 ${subscription.cancelAtPeriodEnd ? 'text-orange-400' : 'text-white/50'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className={`text-sm ${subscription.cancelAtPeriodEnd ? 'text-orange-300' : 'text-white/60'}`}>
            {subscription.cancelAtPeriodEnd 
              ? `Accès jusqu'au ${periodEnd}`
              : subscription.isTrial 
                ? `Essai jusqu'au ${periodEnd}`
                : `Renouvellement le ${periodEnd}`
            }
          </span>
        </div>
        
        {/* Features */}
        <ul className="space-y-3 mb-8">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-white/60">
              <svg className={`w-5 h-5 ${isCreator ? 'text-cyan-400' : 'text-emerald-400'} flex-shrink-0`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
        
        {/* CTA */}
        <a 
          href="/profile" 
          className={`block w-full text-center py-3.5 rounded-xl ${
            subscription.cancelAtPeriodEnd 
              ? 'bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20' 
              : `bg-gradient-to-r ${isCreator ? 'from-cyan-500 to-emerald-500' : 'from-emerald-500 to-cyan-500'} text-black`
          } font-semibold transition-all`}
        >
          {subscription.cancelAtPeriodEnd ? "Gérer mon abonnement" : "Voir mon profil"}
        </a>
      </div>
    </div>
  );
}

// Carte pricing Créateurs
function CreatorPricingCard({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    if (!isLoggedIn) {
      router.push("/signup?role=CREATOR");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "creator" })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="group relative rounded-3xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/50 via-cyan-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
      <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0a]" />
      
      <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold py-1 px-3 rounded-full">
        -50%
      </div>
      
      <div className="relative p-8 sm:p-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 border border-cyan-500/20 flex items-center justify-center mb-6">
          <span className="text-2xl">🎬</span>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">Créateurs</h3>
        <p className="text-white/40 text-sm mb-6">Pour les créateurs de contenu</p>
        
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-5xl font-black bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">4,99</span>
          <span className="text-xl font-bold text-white/50">€</span>
          <span className="text-white/30 ml-1">/mois</span>
        </div>
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-white/30 line-through">9,99€</span>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">ÉCONOMISEZ 5€</span>
        </div>
        
        <ul className="space-y-3 mb-8">
          {["Accès illimité aux talents", "Messagerie directe", "Paiements sécurisés via Stripe"].map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-white/60">
              <svg className="w-5 h-5 text-cyan-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
        
        <button 
          onClick={handleSubscribe}
          disabled={loading}
          className="block w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-black font-semibold hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? "Chargement..." : "S'abonner maintenant"}
        </button>
      </div>
    </div>
  );
}

// Carte pricing Designers
function DesignerPricingCard({ isLoggedIn }: { isLoggedIn?: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    if (!isLoggedIn) {
      router.push("/signup?role=DESIGNER");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: "designer" })
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="group relative rounded-3xl overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/50 via-emerald-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
      <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0a]" />
      
      <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold py-1 px-3 rounded-full">
        -50%
      </div>
      
      <div className="relative p-8 sm:p-10">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center mb-6">
          <span className="text-2xl">🎨</span>
        </div>
        
        <h3 className="text-xl font-bold text-white mb-2">Designers</h3>
        <p className="text-white/40 text-sm mb-6">Pour les graphistes & monteurs</p>
        
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-5xl font-black bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">9,99</span>
          <span className="text-xl font-bold text-white/50">€</span>
          <span className="text-white/30 ml-1">/mois</span>
        </div>
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm text-white/30 line-through">19,99€</span>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">ÉCONOMISEZ 10€</span>
        </div>
        
        <ul className="space-y-3 mb-8">
          {["Visibilité maximale", "Portfolio intégré", "Paiements sécurisés via Stripe"].map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-sm text-white/60">
              <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </li>
          ))}
        </ul>
        
        <button 
          onClick={handleSubscribe}
          disabled={loading}
          className="block w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 text-black font-semibold hover:opacity-90 transition-all disabled:opacity-50"
        >
          {loading ? "Chargement..." : "S'abonner maintenant"}
        </button>
      </div>
    </div>
  );
}

