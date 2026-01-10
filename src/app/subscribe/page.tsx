"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";

function SubscribeContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cancelled, setCancelled] = useState(false);
  const [checkingSubscription, setCheckingSubscription] = useState(true);
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(null);

  // Vérifier si paiement annulé
  useEffect(() => {
    if (searchParams.get("billing") === "cancelled") {
      setCancelled(true);
    }
  }, [searchParams]);

  // Rediriger vers login si non connecté
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/subscribe");
    }
  }, [status, router]);

  // Vérifier l'abonnement (DB) et rediriger vers /dashboard si déjà actif
  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelledRequest = false;

    async function check() {
      setCheckingSubscription(true);
      try {
        const res = await fetch("/api/subscription/check", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const active = data?.hasActiveSubscription === true;
          if (!cancelledRequest) {
            setHasActiveSubscription(active);
          }
          if (active) {
            window.location.replace("/dashboard");
            return;
          }
        } else {
          // Fallback token (peut être stale mais mieux que bloquer l'UI)
          if (!cancelledRequest) {
            setHasActiveSubscription(session?.user?.hasActiveSubscription ?? false);
          }
        }
      } catch {
        if (!cancelledRequest) {
          setHasActiveSubscription(session?.user?.hasActiveSubscription ?? false);
        }
      } finally {
        if (!cancelledRequest) setCheckingSubscription(false);
      }
    }

    check();
    return () => {
      cancelledRequest = true;
    };
  }, [status, session]);

  async function handleSubscribe() {
    if (!session?.user?.role) return;

    setLoading(true);
    setError("");

    try {
      // Déterminer le plan selon le rôle
      const plan = session.user.role === "CREATOR" ? "creator" : "designer";

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

      // Rediriger vers Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (status === "loading" || (status === "authenticated" && checkingSubscription)) {
    return (
      <div className="min-h-screen bg-creix-black flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-creix-cyan border-t-transparent rounded-full"></div>
      </div>
    );
  }

  // Si pas de session ou déjà abonné, ne rien afficher (redirection en cours)
  if (!session || hasActiveSubscription === true) {
    return null;
  }

  const isCreator = session.user?.role === "CREATOR";
  const planName = isCreator ? "Créateur" : "Graphiste / Monteur";
  const planPrice = isCreator ? "9,99" : "14,99";
  const planDescription = isCreator
    ? "Publiez vos missions et trouvez les meilleurs talents pour vos projets créatifs."
    : "Accédez aux missions des créateurs et développez votre activité freelance.";

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        {/* Message principal */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-creix-cyan/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-creix-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Activez votre abonnement
          </h1>
          <p className="text-gray-400">
            Pour accéder à CREIX, activez votre abonnement.
          </p>
        </div>

        {/* Carte abonnement unique */}
        <div className="rounded-2xl border-2 border-creix-cyan bg-gradient-to-b from-creix-cyan/10 to-transparent p-8 shadow-lg">
          <div className="text-center">
            {/* Badge rôle */}
            <span className="inline-block px-3 py-1 bg-creix-cyan/20 text-creix-cyan text-sm font-medium rounded-full mb-4">
              {planName}
            </span>

            {/* Prix */}
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">{planPrice}€</span>
              <span className="text-gray-400">/mois</span>
            </div>

            {/* Description */}
            <p className="text-gray-400 text-sm mb-6">
              {planDescription}
            </p>

            {/* Avantages */}
            <ul className="text-left space-y-3 mb-8">
              <li className="flex items-center gap-3 text-gray-300">
                <svg className="w-5 h-5 text-creix-cyan flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Accès illimité à la plateforme
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <svg className="w-5 h-5 text-creix-cyan flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Messagerie sécurisée
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <svg className="w-5 h-5 text-creix-cyan flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {isCreator ? "Publiez des missions illimitées" : "Proposez sur toutes les missions"}
              </li>
              <li className="flex items-center gap-3 text-gray-300">
                <svg className="w-5 h-5 text-creix-cyan flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Paiements sécurisés via Stripe
              </li>
            </ul>

            {/* Message paiement annulé */}
            {cancelled && (
              <div className="mb-4 rounded-lg bg-yellow-500/10 p-3 text-center text-sm text-yellow-400">
                Paiement annulé. Vous pouvez réessayer quand vous le souhaitez.
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
                {error}
              </div>
            )}

            {/* Bouton */}
            <button
              onClick={handleSubscribe}
              disabled={loading}
              className="group w-full rounded-xl bg-gradient-to-r from-cyan-500 via-cyan-400 to-cyan-500 px-6 py-4 font-semibold text-black transition-all duration-300 hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Redirection vers Stripe...</span>
                  </>
                ) : (
                  <>
                    <span>S&apos;abonner maintenant</span>
                    <svg className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </div>
            </button>

            <p className="mt-4 text-xs text-gray-500">
              Paiement sécurisé par Stripe. Résiliable à tout moment.
            </p>

            {/* Conseils (sans inquiéter l'utilisateur) */}
            <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-left">
              <p className="text-xs font-semibold text-white/80 mb-2">
                À savoir
              </p>
              <ul className="space-y-2 text-xs text-gray-400">
                <li className="flex gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>
                    Pour une activation immédiate, effectuez le paiement depuis ce bouton et avec le même email que votre compte CREIX.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>
                    Une fois le paiement validé, vous serez redirigé automatiquement vers votre dashboard.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-cyan-400">•</span>
                  <span>
                    Si l’accès ne s’active pas immédiatement, rafraîchissez la page ou reconnectez-vous : l’activation peut prendre quelques secondes.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bouton déconnexion */}
        <div className="mt-6 text-center">
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubscribePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-creix-black flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-creix-cyan border-t-transparent rounded-full"></div>
      </div>
    }>
      <SubscribeContent />
    </Suspense>
  );
}

