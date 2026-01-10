"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import SubscriptionGuard from "@/components/SubscriptionGuard";

type ProfileResponse = {
  user: { hasSubscription: boolean };
};

function SubscriptionOnly({ hasSubscription }: { hasSubscription: boolean }) {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<{
    status: string;
    currentPeriodEnd: string;
    isTrial: boolean;
    cancelAtPeriodEnd?: boolean;
  } | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch("/api/subscription?stripe=1");
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.subscription);
        }
      } catch {
        // ignore
      }
    }
    fetchSubscription();
  }, []);

  async function handleManageSubscription() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
      <h2 className="text-lg font-semibold text-white mb-4">Abonnement</h2>

      {hasSubscription && subscription ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className={`h-3 w-3 rounded-full ${
                subscription.cancelAtPeriodEnd
                  ? "bg-orange-500"
                  : subscription.status === "active"
                    ? "bg-emerald-500"
                    : subscription.status === "trialing"
                      ? "bg-cyan-500"
                      : "bg-yellow-500"
              }`}
            />
            <span className="text-sm text-white">
              {subscription.cancelAtPeriodEnd && "Résiliation programmée"}
              {!subscription.cancelAtPeriodEnd && subscription.status === "active" && "Abonnement actif"}
              {subscription.status === "trialing" && "Période d'essai"}
              {subscription.status === "past_due" && "Paiement en retard"}
              {subscription.status === "canceled" && !subscription.cancelAtPeriodEnd && "Annulé"}
            </span>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
              <p className="text-sm text-orange-200">
                Votre abonnement prendra fin le{" "}
                <span className="font-medium text-white">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </span>
                . Vous conservez l'accès jusqu'à cette date.
              </p>
            </div>
          )}

          {subscription.isTrial && (
            <p className="text-sm text-white/55">
              Votre période d'essai se termine le{" "}
              <span className="text-white font-medium">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </span>
            </p>
          )}

          {!subscription.isTrial && (
            <p className="text-sm text-white/55">
              Prochain renouvellement le{" "}
              <span className="text-white font-medium">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </span>
            </p>
          )}

          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/[0.06] disabled:opacity-50"
          >
            {loading ? "Chargement..." : "Gérer mon abonnement"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-white/55">
            Vous n'avez pas d'abonnement actif. Souscrivez pour accéder à toutes les fonctionnalités.
          </p>
          <Link
            href="/pricing"
            className="inline-block rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-cyan-500/15 transition hover:from-cyan-400 hover:to-emerald-400"
          >
            Voir les offres
          </Link>
        </div>
      )}
    </div>
  );
}

export default function SubscriptionSettingsPage() {
  const [hasSubscription, setHasSubscription] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (res.ok) {
          const data: ProfileResponse = await res.json();
          setHasSubscription(Boolean(data.user?.hasSubscription));
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute top-44 -left-40 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-48 -right-40 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_45%)]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-10">
          <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white mb-6">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux réglages
          </Link>

          <h1 className="text-3xl font-black tracking-tight text-white mb-6">Abonnement</h1>
          {loading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          ) : (
            <SubscriptionOnly hasSubscription={hasSubscription} />
          )}
        </div>
      </div>
    </SubscriptionGuard>
  );
}


