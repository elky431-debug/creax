/**
 * Page des missions assignées au freelance
 * 
 * Affiche les missions où le freelance a été sélectionné
 * avec possibilité d'envoyer une livraison
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import SubscriptionGuard from "@/components/SubscriptionGuard";

// =============================================
// TYPES
// =============================================

type AssignedMission = {
  id: string;
  title: string;
  type: string;
  description: string;
  status: string;
  budgetCustom: number | null;
  deadline: string | null;
  creator: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  delivery: {
    id: string;
    status: string;
    paymentStatus: string;
    amount: number;
  } | null;
  hasDelivery: boolean;
  createdAt: string;
  updatedAt: string;
};

// =============================================
// CONSTANTES
// =============================================

const DELIVERY_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "text-slate-400" },
  PROTECTED_SENT: { label: "Version protégée envoyée", color: "text-cyan-400" },
  NEEDS_REVISION: { label: "Modifications demandées", color: "text-orange-400" },
  VALIDATED: { label: "Validée - En attente paiement", color: "text-yellow-400" },
  PAID: { label: "Payée - Envoyez la version finale", color: "text-emerald-400" },
  FINAL_SENT: { label: "Version finale envoyée", color: "text-emerald-400" },
  COMPLETED: { label: "Terminée", color: "text-emerald-400" }
};

const TYPE_LABELS: Record<string, string> = {
  MINIATURE_YOUTUBE: "Miniature",
  MONTAGE_VIDEO: "Montage vidéo",
  DESIGN_BANNIERE: "Design",
  MOTION_DESIGN: "Motion",
  RETOUCHE_PHOTO: "Retouche",
  AUTRE: "Autre"
};

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

export default function AssignedMissionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const gradientText =
    "bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent";

  const [missions, setMissions] = useState<AssignedMission[]>([]);
  const [loading, setLoading] = useState(true);

  // Vérifier l'authentification
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/missions/assigned");
      return;
    }

    if (session?.user?.role !== "DESIGNER") {
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  // Charger les missions
  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchMissions() {
      try {
        const res = await fetch("/api/missions/assigned");
        
        if (res.ok) {
          const data = await res.json();
          setMissions(data.missions || []);
        }
      } catch (error) {
        console.error("Erreur chargement missions:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMissions();
  }, [status]);

  // État de chargement
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <SubscriptionGuard allowedRoles={["DESIGNER"]}>
    <div className="relative min-h-screen bg-slate-950">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-16 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[110px]" />
        <div className="absolute left-[12%] top-[30%] h-[520px] w-[520px] rounded-full bg-emerald-500/10 blur-[110px]" />
        <div className="absolute right-[12%] top-[40%] h-[560px] w-[560px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_50%)]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/55">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Missions assignées
          </p>
          <h1 className="mt-4 text-4xl font-extrabold tracking-tight text-white">
            Mes missions{" "}
            <span className={gradientText}>en cours</span>
          </h1>
          <p className="mt-2 text-sm text-white/45">
            Missions où vous avez été sélectionné - envoyez vos livraisons ici
          </p>
        </div>

        {/* Liste des missions */}
        {missions.length > 0 ? (
          <div className="space-y-4">
            {missions.map((mission) => (
              <MissionCard key={mission.id} mission={mission} />
            ))}
          </div>
        ) : (
          /* État vide */
          <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-12 text-center backdrop-blur">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/15 to-emerald-400/10 ring-1 ring-white/[0.06]">
              <svg className="h-8 w-8 text-white/55" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Aucune mission assignée</h3>
            <p className="mt-2 text-sm text-white/45">
              Proposez vos services sur les missions disponibles pour être sélectionné.
            </p>
            <Link
              href="/missions"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 px-6 py-3 text-sm font-bold text-slate-900 transition hover:brightness-110"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Voir les missions disponibles
            </Link>
          </div>
        )}
      </div>
    </div>
    </SubscriptionGuard>
  );
}

// =============================================
// COMPOSANT CARTE MISSION
// =============================================

function MissionCard({ mission }: { mission: AssignedMission }) {
  const deliveryStatus = mission.delivery 
    ? DELIVERY_STATUS_LABELS[mission.delivery.status] 
    : null;

  const needsAction = !mission.hasDelivery || 
    mission.delivery?.status === "NEEDS_REVISION" ||
    mission.delivery?.status === "PAID";

  return (
    <div className={`group relative overflow-hidden rounded-2xl border p-6 backdrop-blur transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_60px_rgba(0,0,0,0.55)] ${
      needsAction ? "border-cyan-400/30 bg-white/[0.03]" : "border-white/[0.06] bg-white/[0.03]"
    }`}>
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
        <div className="absolute -inset-12 bg-gradient-to-r from-cyan-400/10 via-emerald-400/10 to-cyan-400/10 blur-2xl" />
      </div>
      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Infos mission */}
        <div className="flex-1 min-w-0">
          <div className="relative flex items-start gap-4">
            {/* Avatar créateur */}
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-400 via-emerald-400 to-cyan-400 text-lg font-bold text-slate-900 overflow-hidden ring-2 ring-black/20">
              {mission.creator.avatarUrl ? (
                <Image
                  src={mission.creator.avatarUrl}
                  alt={mission.creator.displayName}
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : (
                mission.creator.displayName.charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white">{mission.title}</h3>
              <p className="text-sm text-white/45">
                Par {mission.creator.displayName}
                <span className="mx-2">•</span>
                {TYPE_LABELS[mission.type]}
              </p>
              <p className="mt-2 text-sm text-white/40 line-clamp-2">{mission.description}</p>
            </div>
          </div>

          {/* Statut livraison */}
          {mission.delivery && deliveryStatus && (
            <div className="relative mt-4 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/40">Statut de la livraison</p>
                  <p className={`text-sm font-medium ${deliveryStatus.color}`}>
                    {deliveryStatus.label}
                  </p>
                </div>
                <Link
                  href={`/deliveries/${mission.delivery.id}`}
                  className="text-sm font-semibold text-cyan-300 hover:underline"
                >
                  Voir les détails →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="relative flex flex-col gap-3 lg:w-52 shrink-0">
          {/* Prix */}
          {mission.budgetCustom && (
            <div className="text-right lg:text-left">
              <p className="text-2xl font-bold text-emerald-400">{mission.budgetCustom} €</p>
              <p className="text-xs text-white/40">Budget mission</p>
            </div>
          )}

          {/* Boutons d'action */}
          {!mission.hasDelivery && (
            <Link
              href={`/deliveries/send/${mission.id}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 px-4 py-3 text-sm font-bold text-slate-900 transition hover:brightness-110"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Envoyer ma livraison
            </Link>
          )}

          {mission.delivery?.status === "NEEDS_REVISION" && (
            <Link
              href={`/deliveries/send/${mission.id}`}
              className="flex items-center justify-center gap-2 rounded-lg bg-orange-500 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-orange-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Renvoyer une version
            </Link>
          )}

          {mission.delivery?.status === "PAID" && (
            <Link
              href={`/deliveries/${mission.delivery.id}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-emerald-400"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Envoyer la version finale
            </Link>
          )}

          {mission.delivery && !["NEEDS_REVISION", "PAID"].includes(mission.delivery.status) && (
            <Link
              href={`/deliveries/${mission.delivery.id}`}
              className="flex items-center justify-center gap-2 rounded-xl border border-white/[0.10] bg-white/[0.02] px-4 py-3 text-sm font-semibold text-white/80 transition hover:border-white/[0.18] hover:bg-white/[0.04]"
            >
              Voir la livraison
            </Link>
          )}

          {/* Contact */}
          <button
            type="button"
            onClick={async () => {
              const res = await fetch("/api/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  missionId: mission.id,
                  otherUserId: mission.creator.id
                })
              });
              if (res.ok) {
                const data = await res.json();
                window.location.href = `/messages?conversation=${data.conversation.id}`;
              }
            }}
            className="flex items-center justify-center gap-2 text-sm font-semibold text-cyan-300 hover:underline"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            Contacter le créateur
          </button>
        </div>
      </div>
    </div>
  );
}





















