"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "next-auth/react";
import SubscriptionGuard from "@/components/SubscriptionGuard";

type ProfileResponse = {
  user: { hasSubscription: boolean };
};

function DangerOnly({ hasSubscription }: { hasSubscription: boolean }) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);

  useEffect(() => {
    async function checkCancellation() {
      if (!hasSubscription) return;
      try {
        const res = await fetch("/api/subscription?stripe=1");
        if (res.ok) {
          const data = await res.json();
          setCancelAtPeriodEnd(data.subscription?.cancelAtPeriodEnd || false);
          setPeriodEnd(data.subscription?.currentPeriodEnd || null);
        }
      } catch {
        // ignore
      }
    }
    checkCancellation();
  }, [hasSubscription]);

  async function handleCancelSubscription() {
    setCancelLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscription/cancel", { method: "POST" });
      if (res.ok) {
        setShowCancelModal(false);
        window.location.reload();
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erreur lors de l'annulation");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (confirmText !== "SUPPRIMER") return;
    setDeleteLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", { method: "DELETE" });
      if (res.ok) {
        await signOut({ callbackUrl: "/" });
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Erreur lors de la suppression");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-red-500/25 bg-red-500/5 backdrop-blur-xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
        <h2 className="text-lg font-semibold text-red-200 mb-2">Zone de danger</h2>
        <p className="text-sm text-white/55 mb-6">Ces actions sont irréversibles. Procédez avec précaution.</p>

        <div className="space-y-4">
          {hasSubscription && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/10">
              <div>
                <h3 className="text-sm font-medium text-white">
                  {cancelAtPeriodEnd ? "Résiliation programmée" : "Résilier mon abonnement"}
                </h3>
                <p className="text-xs text-white/35 mt-1">
                  {cancelAtPeriodEnd && periodEnd
                    ? `Votre abonnement prendra fin le ${new Date(periodEnd).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
                    : "Votre abonnement restera actif jusqu'à la fin de la période en cours."}
                </p>
              </div>
              {cancelAtPeriodEnd ? (
                <span className="rounded-xl bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-200 border border-orange-500/20">
                  ✓ Résiliation confirmée
                </span>
              ) : (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="rounded-xl border border-orange-500/25 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-200 transition hover:bg-orange-500/15"
                >
                  Résilier
                </button>
              )}
            </div>
          )}

          <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/10">
            <div>
              <h3 className="text-sm font-medium text-white">Supprimer mon compte</h3>
              <p className="text-xs text-white/35 mt-1">Toutes vos données seront définitivement supprimées.</p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
            >
              Supprimer le compte
            </button>
          </div>
        </div>
      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-black/80 border border-white/10 backdrop-blur-xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
            <h3 className="text-xl font-bold text-white mb-4">Annuler l'abonnement ?</h3>
            <p className="text-sm text-white/55 mb-6">
              Êtes-vous sûr de vouloir annuler votre abonnement ? Vous conserverez l'accès jusqu'à la fin de votre période de facturation actuelle.
            </p>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/[0.06]"
              >
                Annuler
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="flex-1 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-orange-400 disabled:opacity-50"
              >
                {cancelLoading ? "Annulation..." : "Confirmer l'annulation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-black/80 border border-white/10 backdrop-blur-xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
            <h3 className="text-xl font-bold text-red-200 mb-4">Supprimer le compte</h3>
            <p className="text-sm text-white/55 mb-4">
              Cette action est <strong className="text-white">irréversible</strong>. Toutes vos données seront définitivement supprimées.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-white/70 mb-2">
                Tapez <span className="text-red-400 font-bold">SUPPRIMER</span> pour confirmer
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-red-400/60 focus:ring-2 focus:ring-red-500/20"
                placeholder="SUPPRIMER"
              />
            </div>

            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText("");
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/[0.06]"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || confirmText !== "SUPPRIMER"}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? "Suppression..." : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default function DangerSettingsPage() {
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

          <h1 className="text-3xl font-black tracking-tight text-white mb-6">Zone de danger</h1>
          {loading ? (
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          ) : (
            <DangerOnly hasSubscription={hasSubscription} />
          )}
        </div>
      </div>
    </SubscriptionGuard>
  );
}


