/**
 * Page des propositions reçues pour les créateurs
 * 
 * Fonctionnalités :
 * - Affichage de toutes les propositions reçues
 * - Filtrage par statut et par mission
 * - Possibilité d'accepter ou refuser une proposition
 * - Vue détaillée du profil du graphiste
 * 
 * Accessible uniquement aux utilisateurs avec rôle CREATOR
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import SubscriptionGuard from "@/components/SubscriptionGuard";

// =============================================
// TYPES
// =============================================

type Proposal = {
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
    budgetRange: string | null;
    budgetCustom: number | null;
  };
  designer: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    bio: string | null;
    skills: string | null;
    portfolioUrl: string | null;
    rate: string | null;
  };
};

type Counts = {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
};

// =============================================
// CONSTANTES
// =============================================

const STATUS_OPTIONS = [
  { value: "ALL", label: "Toutes" },
  { value: "PENDING", label: "En attente" },
  { value: "ACCEPTED", label: "Acceptées" },
  { value: "REJECTED", label: "Refusées" }
];

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "En attente", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  ACCEPTED: { label: "Acceptée", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  REJECTED: { label: "Refusée", color: "text-red-400", bg: "bg-red-500/20" },
  WITHDRAWN: { label: "Retirée", color: "text-slate-400", bg: "bg-slate-500/20" }
};

const TYPE_LABELS: Record<string, string> = {
  MINIATURE_YOUTUBE: "Miniature YouTube",
  MONTAGE_VIDEO: "Montage vidéo",
  DESIGN_BANNIERE: "Design bannière",
  MOTION_DESIGN: "Motion design",
  RETOUCHE_PHOTO: "Retouche photo",
  AUTRE: "Autre"
};

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

export default function ProposalsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // États
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [counts, setCounts] = useState<Counts>({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Modal de détails
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Vérification du rôle
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/proposals");
      return;
    }

    if (session?.user?.role !== "CREATOR") {
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  // Charger les propositions
  const fetchProposals = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "ALL") params.set("status", statusFilter);

      const res = await fetch(`/api/proposals/received?${params.toString()}`);
      
      if (res.status === 403) {
        router.push("/dashboard");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setProposals(data.proposals || []);
        setCounts(data.counts || { total: 0, pending: 0, accepted: 0, rejected: 0 });
      }
    } catch (error) {
      console.error("Erreur chargement propositions:", error);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, router]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "CREATOR") {
      fetchProposals();
      // Marquer les propositions comme vues (notification disparaît)
      fetch("/api/proposals/mark-viewed", { method: "POST" }).then(() => {
        // Rafraîchir immédiatement le compteur dans le header
        window.dispatchEvent(new Event("refresh-notifications"));
      }).catch(() => {});
    }
  }, [status, session, fetchProposals]);

  // Accepter une proposition
  async function handleAccept(proposalId: string) {
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "ACCEPTED" })
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || "Erreur lors de l'acceptation");
        return;
      }

      // Mettre à jour la liste
      setProposals((prev) =>
        prev.map((p) =>
          p.id === proposalId ? { ...p, status: "ACCEPTED" } : 
          p.mission.id === selectedProposal?.mission.id && p.status === "PENDING" ? { ...p, status: "REJECTED" } : p
        )
      );
      setCounts((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        accepted: prev.accepted + 1
      }));

      setSelectedProposal(null);
    } catch {
      setActionError("Erreur réseau");
    } finally {
      setActionLoading(false);
    }
  }

  // Refuser une proposition
  async function handleReject(proposalId: string) {
    setActionLoading(true);
    setActionError(null);

    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "REJECTED" })
      });

      const data = await res.json();

      if (!res.ok) {
        setActionError(data.error || "Erreur lors du refus");
        return;
      }

      // Mettre à jour la liste
      setProposals((prev) =>
        prev.map((p) => (p.id === proposalId ? { ...p, status: "REJECTED" } : p))
      );
      setCounts((prev) => ({
        ...prev,
        pending: Math.max(0, prev.pending - 1),
        rejected: prev.rejected + 1
      }));

      setSelectedProposal(null);
    } catch {
      setActionError("Erreur réseau");
    } finally {
      setActionLoading(false);
    }
  }

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
      <div className="min-h-screen bg-[#000] flex items-center justify-center">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-emerald-500/20 border-b-emerald-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>
    );
  }

  return (
    <SubscriptionGuard allowedRoles={["CREATOR"]}>
    <div className="min-h-screen bg-[#000] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-yellow-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10">
        {/* ============================================
            HEADER
            ============================================ */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] border border-white/10 px-4 py-2 mb-4 backdrop-blur-sm">
                <span className="text-lg">📬</span>
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">Candidatures</span>
              </div>
              <h1 className="text-4xl font-black text-white mb-2">Propositions reçues</h1>
              <p className="text-white/50">
                Gérez les candidatures des graphistes et monteurs pour vos missions
              </p>
            </div>
            <Link
              href="/missions/create"
              className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-4 text-sm font-bold text-slate-900 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-150 hover:scale-105"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Nouvelle mission
            </Link>
          </div>

          {/* Compteurs */}
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Total", value: counts.total, icon: "📊", gradient: "from-white/10 to-white/5", border: "border-white/10", textColor: "text-white" },
              { label: "En attente", value: counts.pending, icon: "⏳", gradient: "from-yellow-500/20 to-yellow-500/5", border: "border-yellow-500/20", textColor: "text-yellow-400" },
              { label: "Acceptées", value: counts.accepted, icon: "✅", gradient: "from-emerald-500/20 to-emerald-500/5", border: "border-emerald-500/20", textColor: "text-emerald-400" },
              { label: "Refusées", value: counts.rejected, icon: "❌", gradient: "from-red-500/20 to-red-500/5", border: "border-red-500/20", textColor: "text-red-400" }
            ].map((stat, i) => (
              <div key={i} className={`relative rounded-2xl overflow-hidden group`}>
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient}`} />
                <div className={`absolute inset-[1px] rounded-2xl bg-[#0a0a0a]`} />
                <div className={`relative p-5 border ${stat.border} rounded-2xl`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{stat.icon}</span>
                  </div>
                  <p className={`text-3xl font-black ${stat.textColor}`}>{stat.value}</p>
                  <p className="text-sm text-white/40 mt-1">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================
            FILTRES
            ============================================ */}
        <div className="mb-8 p-1 rounded-2xl bg-white/[0.02] border border-white/[0.06] inline-flex gap-1">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatusFilter(opt.value)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 flex items-center gap-2 ${
                statusFilter === opt.value
                  ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-900 shadow-lg"
                  : "text-white/50 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              {opt.label}
              {opt.value === "PENDING" && counts.pending > 0 && (
                <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                  statusFilter === opt.value ? "bg-slate-900/30 text-white" : "bg-yellow-500 text-slate-900"
                }`}>
                  {counts.pending}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ============================================
            LISTE DES PROPOSITIONS
            ============================================ */}
        {proposals.length > 0 ? (
          <div className="space-y-4">
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onSelect={() => setSelectedProposal(proposal)}
                formatDate={formatDate}
              />
            ))}
          </div>
        ) : (
          /* État vide */
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-yellow-500/10" />
            <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0a]" />
            
            <div className="relative p-16 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-yellow-500/10 border border-white/[0.06]">
                <span className="text-4xl">📬</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                {statusFilter === "ALL" 
                  ? "Aucune proposition reçue" 
                  : `Aucune proposition ${STATUS_LABELS[statusFilter]?.label.toLowerCase()}`}
              </h3>
              <p className="text-white/40 mb-8 max-w-sm mx-auto">
                {statusFilter === "ALL"
                  ? "Publiez une mission pour recevoir des candidatures de graphistes et monteurs."
                  : "Essayez de changer le filtre pour voir d'autres propositions."}
              </p>
              {statusFilter === "ALL" && (
                <Link
                  href="/missions/create"
                  className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-8 py-4 text-base font-bold text-slate-900 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-150 hover:scale-105"
                >
                  Créer une mission
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        )}

        {/* ============================================
            MODAL DE DÉTAILS
            ============================================ */}
        {selectedProposal && (
          <ProposalDetailModal
            proposal={selectedProposal}
            onClose={() => {
              setSelectedProposal(null);
              setActionError(null);
            }}
            onAccept={() => handleAccept(selectedProposal.id)}
            onReject={() => handleReject(selectedProposal.id)}
            loading={actionLoading}
            error={actionError}
            formatDate={formatDate}
          />
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
  proposal: Proposal;
  onSelect: () => void;
  formatDate: (date: string) => string;
};

function ProposalCard({ proposal, onSelect, formatDate }: ProposalCardProps) {
  const statusInfo = STATUS_LABELS[proposal.status] || STATUS_LABELS.PENDING;

  return (
    <div
      className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-150 hover:scale-[1.01]"
      onClick={onSelect}
    >
      {/* Border gradient on hover */}
      <div className={`absolute inset-0 transition-opacity duration-150 ${
        proposal.status === "PENDING" 
          ? "bg-gradient-to-r from-yellow-500/30 via-cyan-500/20 to-yellow-500/30 opacity-100 group-hover:opacity-100" 
          : "bg-gradient-to-r from-cyan-500/30 via-emerald-500/20 to-cyan-500/30 opacity-0 group-hover:opacity-100"
      }`} />
      <div className="absolute inset-[1px] rounded-2xl bg-[#0a0a0a]" />

      <div className="relative p-6">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          {/* Avatar du designer */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-lg font-bold text-slate-900 overflow-hidden">
            {proposal.designer.avatarUrl ? (
              <Image
                src={proposal.designer.avatarUrl}
                alt={proposal.designer.displayName}
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            ) : (
              proposal.designer.displayName.charAt(0).toUpperCase()
            )}
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="font-bold text-white group-hover:text-cyan-400 transition-colors">{proposal.designer.displayName}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.bg} ${statusInfo.color} border border-current/20`}>
                {statusInfo.label}
              </span>
              {proposal.status === "PENDING" && (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-400"></span>
                </span>
              )}
            </div>

            <p className="text-sm text-white/40 mb-2">
              Pour : <span className="text-cyan-400">{proposal.mission.title}</span>
              <span className="mx-2 text-white/20">•</span>
              <span className="text-white/30">{TYPE_LABELS[proposal.mission.type]}</span>
            </p>

            <p className="text-sm text-white/60 line-clamp-2">{proposal.message}</p>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              {proposal.price && (
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="text-lg">💰</span>
                  {proposal.price} €
                </span>
              )}
              <span className="text-white/30 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(proposal.createdAt)}
              </span>
            </div>
          </div>

          {/* Bouton voir */}
          <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white font-medium">
              Voir
              <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// =============================================
// COMPOSANT MODAL DE DÉTAILS
// =============================================

type ProposalDetailModalProps = {
  proposal: Proposal;
  onClose: () => void;
  onAccept: () => void;
  onReject: () => void;
  loading: boolean;
  error: string | null;
  formatDate: (date: string) => string;
};

function ProposalDetailModal({
  proposal,
  onClose,
  onAccept,
  onReject,
  loading,
  error,
  formatDate
}: ProposalDetailModalProps) {
  const statusInfo = STATUS_LABELS[proposal.status] || STATUS_LABELS.PENDING;
  const isPending = proposal.status === "PENDING";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-2xl rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-emerald-500/20" />
        <div className="absolute inset-[1px] rounded-3xl bg-[#0c0c0c]" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/[0.06] p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-lg font-bold text-slate-900 overflow-hidden">
                {proposal.designer.avatarUrl ? (
                  <Image
                    src={proposal.designer.avatarUrl}
                    alt={proposal.designer.displayName}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  proposal.designer.displayName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{proposal.designer.displayName}</h2>
                <p className="text-sm text-white/40">🎨 Graphiste / Monteur</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.03] border border-white/[0.08] text-white/50 hover:text-white hover:bg-white/[0.06] transition"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Corps */}
          <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Mission concernée */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
              <p className="text-xs text-white/30 uppercase tracking-widest mb-2">📋 Mission</p>
              <p className="font-bold text-white text-lg">{proposal.mission.title}</p>
              <p className="text-sm text-white/40 mt-1">{TYPE_LABELS[proposal.mission.type]}</p>
            </div>

            {/* Statut */}
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-4 py-1.5 text-sm font-semibold ${statusInfo.bg} ${statusInfo.color} border border-current/20`}>
                {statusInfo.label}
              </span>
              <span className="text-sm text-white/30">Reçue {formatDate(proposal.createdAt)}</span>
            </div>

            {/* Message */}
            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-3">💬 Message de présentation</h3>
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
                <p className="text-sm text-white/60 whitespace-pre-wrap leading-relaxed">{proposal.message}</p>
              </div>
            </div>

            {/* Prix proposé */}
            {proposal.price && (
              <div className="flex items-center gap-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-5">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <span className="text-2xl">💰</span>
                </div>
                <div>
                  <p className="text-xs text-emerald-400/70 uppercase tracking-widest">Prix proposé</p>
                  <p className="text-2xl font-black text-emerald-400">{proposal.price} €</p>
                </div>
              </div>
            )}

            {/* Infos du designer */}
            <div>
              <h3 className="text-sm font-semibold text-white/70 mb-4">👤 À propos du graphiste</h3>
              <div className="space-y-4">
                {proposal.designer.bio && (
                  <p className="text-sm text-white/50 leading-relaxed">{proposal.designer.bio}</p>
                )}
                {proposal.designer.skills && (
                  <div className="flex flex-wrap gap-2">
                    {proposal.designer.skills.split(",").map((skill, i) => (
                      <span key={i} className="rounded-xl bg-white/[0.03] border border-white/[0.08] px-3 py-1.5 text-xs text-white/60 font-medium">
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                )}
                {proposal.designer.rate && (
                  <p className="text-sm text-white/40">
                    <span className="text-white/30">Tarif habituel :</span> {proposal.designer.rate}
                  </p>
                )}
                <div className="flex gap-4">
                  <Link
                    href={`/profile/${proposal.designer.id}`}
                    className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                  >
                    Voir le profil complet →
                  </Link>
                  {proposal.designer.portfolioUrl && (
                    <a
                      href={proposal.designer.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Portfolio externe ↗
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Erreur */}
            {error && (
              <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400 flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                {error}
              </div>
            )}
          </div>

          {/* Footer avec actions */}
          <div className="border-t border-white/[0.06] p-6">
            {isPending ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onReject}
                  disabled={loading}
                  className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 py-4 text-sm font-bold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
                >
                  {loading ? "..." : "❌ Refuser"}
                </button>
                <Link
                  href={`/messages?with=${proposal.designer.id}`}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-white/[0.03] border border-white/[0.08] py-4 text-sm font-bold text-white transition hover:bg-white/[0.06]"
                >
                  💬 Contacter
                </Link>
                <button
                  type="button"
                  onClick={onAccept}
                  disabled={loading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 py-4 text-sm font-bold text-slate-900 transition hover:shadow-lg hover:shadow-emerald-500/25 disabled:opacity-50"
                >
                  {loading ? "..." : "✅ Accepter"}
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link
                  href={`/messages?with=${proposal.designer.id}`}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-4 text-sm font-bold text-slate-900 transition hover:shadow-lg hover:shadow-cyan-500/25"
                >
                  💬 Contacter le graphiste
                </Link>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl bg-white/[0.03] border border-white/[0.08] py-4 text-sm font-bold text-white transition hover:bg-white/[0.06]"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




