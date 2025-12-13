/**
 * Page "Mes propositions" pour les graphistes/monteurs
 * 
 * Fonctionnalités :
 * - Voir toutes les propositions envoyées
 * - Statut : En attente / Acceptée / Refusée
 * - Si acceptée : bouton pour envoyer le travail + contacter le créateur
 * - Notifications visuelles pour les changements de statut
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

type MyProposal = {
  id: string;
  message: string;
  price: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  mission: {
    id: string;
    title: string;
    type: string;
    status: string;
    description: string;
    budgetCustom: number | null;
    assignedFreelancerId: string | null;
    creator: {
      id: string;
      displayName: string;
      avatarUrl: string | null;
    };
  };
  hasDelivery: boolean;
  deliveryId: string | null;
  deliveryStatus: string | null;
};

// =============================================
// CONSTANTES
// =============================================

const STATUS_CONFIG: Record<string, { 
  label: string; 
  color: string; 
  bg: string; 
  icon: string;
  description: string;
}> = {
  PENDING: { 
    label: "En attente", 
    color: "text-yellow-400", 
    bg: "bg-yellow-500/20",
    icon: "⏳",
    description: "Le créateur n'a pas encore répondu à votre proposition"
  },
  ACCEPTED: { 
    label: "Acceptée", 
    color: "text-emerald-400", 
    bg: "bg-emerald-500/20",
    icon: "✅",
    description: "Félicitations ! Vous pouvez maintenant envoyer votre travail"
  },
  REJECTED: { 
    label: "Refusée", 
    color: "text-red-400", 
    bg: "bg-red-500/20",
    icon: "❌",
    description: "Le créateur a choisi un autre profil pour cette mission"
  },
  WITHDRAWN: { 
    label: "Retirée", 
    color: "text-slate-400", 
    bg: "bg-slate-500/20",
    icon: "↩️",
    description: "Vous avez retiré cette proposition"
  }
};

const TYPE_LABELS: Record<string, string> = {
  MINIATURE_YOUTUBE: "Miniature YouTube",
  MONTAGE_VIDEO: "Montage vidéo",
  DESIGN_BANNIERE: "Design bannière",
  MOTION_DESIGN: "Motion design",
  RETOUCHE_PHOTO: "Retouche photo",
  AUTRE: "Autre"
};

const FILTER_OPTIONS = [
  { value: "ALL", label: "Toutes" },
  { value: "PENDING", label: "En attente" },
  { value: "ACCEPTED", label: "Acceptées" },
  { value: "REJECTED", label: "Refusées" }
];

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

export default function MyProposalsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [proposals, setProposals] = useState<MyProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  // Compteurs
  const counts = {
    total: proposals.length,
    pending: proposals.filter(p => p.status === "PENDING").length,
    accepted: proposals.filter(p => p.status === "ACCEPTED").length,
    rejected: proposals.filter(p => p.status === "REJECTED").length
  };

  // Vérifier l'authentification
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/my-proposals");
      return;
    }

    if (session?.user?.role !== "DESIGNER") {
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  // Charger les propositions
  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchProposals() {
      try {
        const res = await fetch("/api/proposals/my");
        
        if (res.ok) {
          const data = await res.json();
          setProposals(data.proposals || []);
        }

        // Marquer les propositions comme vues (notification disparaît)
        fetch("/api/proposals/mark-viewed", { method: "POST" }).then(() => {
          // Rafraîchir immédiatement le compteur dans le header
          window.dispatchEvent(new Event("refresh-notifications"));
        }).catch(() => {});
      } catch (error) {
        console.error("Erreur chargement propositions:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProposals();
  }, [status]);

  // Filtrer les propositions
  const filteredProposals = filter === "ALL" 
    ? proposals 
    : proposals.filter(p => p.status === filter);

  // Formater la date
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "À l'instant";
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

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
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* ============================================
            HEADER
            ============================================ */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Mes propositions</h1>
          <p className="mt-2 text-slate-400">
            Suivez l'état de vos candidatures et envoyez votre travail quand elles sont acceptées
          </p>
        </div>

        {/* ============================================
            COMPTEURS
            ============================================ */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-4">
            <p className="text-2xl font-bold text-white">{counts.total}</p>
            <p className="text-sm text-slate-400">Total</p>
          </div>
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/20 p-4">
            <p className="text-2xl font-bold text-yellow-400">{counts.pending}</p>
            <p className="text-sm text-yellow-400/70">En attente</p>
          </div>
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4">
            <p className="text-2xl font-bold text-emerald-400">{counts.accepted}</p>
            <p className="text-sm text-emerald-400/70">Acceptées</p>
          </div>
          <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4">
            <p className="text-2xl font-bold text-red-400">{counts.rejected}</p>
            <p className="text-sm text-red-400/70">Refusées</p>
          </div>
        </div>

        {/* ============================================
            FILTRES
            ============================================ */}
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                filter === opt.value
                  ? "bg-cyan-500 text-slate-900"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {opt.label}
              {opt.value === "ACCEPTED" && counts.accepted > 0 && (
                <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-xs text-slate-900">
                  {counts.accepted}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ============================================
            LISTE DES PROPOSITIONS
            ============================================ */}
        {filteredProposals.length > 0 ? (
          <div className="space-y-4">
            {filteredProposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                formatDate={formatDate}
              />
            ))}
          </div>
        ) : (
          /* État vide */
          <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
              <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">
              {filter === "ALL" 
                ? "Aucune proposition envoyée" 
                : `Aucune proposition ${STATUS_CONFIG[filter]?.label.toLowerCase()}`}
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              {filter === "ALL"
                ? "Parcourez les missions disponibles et proposez vos services aux créateurs."
                : "Essayez de changer le filtre pour voir d'autres propositions."}
            </p>
            {filter === "ALL" && (
              <Link
                href="/missions"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Voir les missions disponibles
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
    </SubscriptionGuard>
  );
}

// =============================================
// COMPOSANT CARTE DE PROPOSITION
// =============================================

type ProposalCardProps = {
  proposal: MyProposal;
  formatDate: (date: string) => string;
};

function ProposalCard({ proposal, formatDate }: ProposalCardProps) {
  const statusConfig = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.PENDING;
  const isAccepted = proposal.status === "ACCEPTED";
  const isAssigned = proposal.mission.assignedFreelancerId !== null;
  const canSendWork = isAccepted && !proposal.hasDelivery;
  const hasDeliveryInProgress = proposal.hasDelivery && proposal.deliveryStatus !== "COMPLETED";

  return (
    <div className={`rounded-xl border p-6 transition-all ${
      isAccepted 
        ? "bg-emerald-500/5 border-emerald-500/30" 
        : proposal.status === "PENDING"
        ? "bg-slate-900/80 border-yellow-500/20"
        : "bg-slate-900/80 border-slate-800"
    }`}>
      {/* Badge statut en haut */}
      {isAccepted && !proposal.hasDelivery && (
        <div className="mb-4 rounded-lg bg-emerald-500/20 border border-emerald-500/30 p-3 flex items-center gap-3">
          <span className="text-2xl">🎉</span>
          <div>
            <p className="font-semibold text-emerald-400">Proposition acceptée !</p>
            <p className="text-sm text-emerald-400/70">Vous pouvez maintenant envoyer votre travail</p>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-start gap-6">
        {/* Infos mission */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-4">
            {/* Avatar créateur */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-lg font-bold text-slate-900 overflow-hidden">
              {proposal.mission.creator.avatarUrl ? (
                <Image
                  src={proposal.mission.creator.avatarUrl}
                  alt={proposal.mission.creator.displayName}
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              ) : (
                proposal.mission.creator.displayName.charAt(0).toUpperCase()
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-white">{proposal.mission.title}</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusConfig.bg} ${statusConfig.color}`}>
                  {statusConfig.icon} {statusConfig.label}
                </span>
              </div>

              <p className="text-sm text-slate-400">
                Par <span className="text-cyan-400">{proposal.mission.creator.displayName}</span>
                <span className="mx-2">•</span>
                {TYPE_LABELS[proposal.mission.type]}
              </p>

              <p className="mt-2 text-sm text-slate-500 line-clamp-2">
                {proposal.mission.description}
              </p>

              {/* Message de la proposition */}
              <div className="mt-3 rounded-lg bg-slate-800/50 p-3">
                <p className="text-xs text-slate-500 mb-1">Votre message</p>
                <p className="text-sm text-slate-300 line-clamp-2">{proposal.message}</p>
              </div>

              {/* Infos supplémentaires */}
              <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                {proposal.price && (
                  <span className="flex items-center gap-1 text-emerald-400 font-semibold">
                    {proposal.price} € proposé
                  </span>
                )}
                {proposal.mission.budgetCustom && (
                  <span className="text-slate-500">
                    Budget mission : {proposal.mission.budgetCustom} €
                  </span>
                )}
                <span className="text-slate-500">
                  Envoyée {formatDate(proposal.createdAt)}
                </span>
              </div>

              {/* Statut de la livraison si existante */}
              {proposal.hasDelivery && (
                <div className="mt-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-3">
                  <p className="text-sm text-cyan-400">
                    📦 Livraison en cours - 
                    <Link href={`/deliveries/${proposal.deliveryId}`} className="ml-1 underline">
                      Voir les détails
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 lg:w-52 shrink-0">
          {/* Boutons selon le statut */}
          {canSendWork && (
            <Link
              href={`/deliveries/send/${proposal.mission.id}`}
              className="flex items-center justify-center gap-2 rounded-lg bg-emerald-500 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              Envoyer mon travail
            </Link>
          )}

          {hasDeliveryInProgress && (
            <Link
              href={`/deliveries/${proposal.deliveryId}`}
              className="flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Voir la livraison
            </Link>
          )}

          {/* Bouton contacter (toujours visible si accepté) */}
          {isAccepted && (
            <button
              type="button"
              onClick={async () => {
                const res = await fetch("/api/conversations", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    missionId: proposal.mission.id,
                    otherUserId: proposal.mission.creator.id
                  })
                });
                if (res.ok) {
                  const data = await res.json();
                  window.location.href = `/messages?conversation=${data.conversation.id}`;
                }
              }}
              className="flex items-center justify-center gap-2 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-4 py-3 text-sm font-semibold text-cyan-400 transition hover:bg-cyan-500/20"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Contacter le créateur
            </button>
          )}

          {/* Voir la mission */}
          <Link
            href={`/missions/${proposal.mission.id}`}
            className="flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-white transition"
          >
            Voir la mission →
          </Link>

          {/* Message d'info selon statut */}
          {proposal.status === "PENDING" && (
            <p className="text-xs text-center text-slate-500">
              Le créateur examine votre proposition...
            </p>
          )}

          {proposal.status === "REJECTED" && (
            <p className="text-xs text-center text-slate-500">
              Ne vous découragez pas, d'autres missions vous attendent !
            </p>
          )}
        </div>
      </div>
    </div>
  );
}


