/**
 * Page des missions disponibles pour les graphistes/monteurs
 * 
 * Fonctionnalités :
 * - Affichage de toutes les missions ouvertes
 * - Filtrage par type, budget, recherche textuelle
 * - Tri par date (récentes/anciennes)
 * - Possibilité de proposer ses services via un modal
 * 
 * Accessible uniquement aux utilisateurs avec rôle DESIGNER
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

type Mission = {
  id: string;
  title: string;
  description: string;
  type: string;
  deadline: string | null;
  budgetRange: string | null;
  budgetCustom: number | null;
  status: string;
  createdAt: string;
  creator: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  referenceImages: string[];
  hasProposed: boolean;
  proposalStatus: string | null;
  proposalCount: number;
};

type Filters = {
  query: string;
  type: string;
  budget: string;
  sort: string;
};

// =============================================
// CONSTANTES
// =============================================

const MISSION_TYPES = [
  { value: "ALL", label: "Tous les types" },
  { value: "MINIATURE_YOUTUBE", label: "Miniature YouTube" },
  { value: "MONTAGE_VIDEO", label: "Montage vidéo" },
  { value: "DESIGN_BANNIERE", label: "Design bannière" },
  { value: "MOTION_DESIGN", label: "Motion design" },
  { value: "RETOUCHE_PHOTO", label: "Retouche photo" },
  { value: "AUTRE", label: "Autre" }
];

const BUDGET_RANGES = [
  { value: "ALL", label: "Tous les budgets" },
  { value: "LESS_THAN_50", label: "< 50 €" },
  { value: "BETWEEN_50_150", label: "50 – 150 €" },
  { value: "BETWEEN_150_300", label: "150 – 300 €" },
  { value: "MORE_THAN_300", label: "> 300 €" }
];

const SORT_OPTIONS = [
  { value: "recent", label: "Plus récentes" },
  { value: "oldest", label: "Plus anciennes" }
];

// Labels pour afficher le type de mission
const TYPE_LABELS: Record<string, string> = {
  MINIATURE_YOUTUBE: "Miniature YouTube",
  MONTAGE_VIDEO: "Montage vidéo",
  DESIGN_BANNIERE: "Design bannière",
  MOTION_DESIGN: "Motion design",
  RETOUCHE_PHOTO: "Retouche photo",
  AUTRE: "Autre"
};

// Labels pour afficher le budget
const BUDGET_LABELS: Record<string, string> = {
  LESS_THAN_20: "< 20 €",
  BETWEEN_20_50: "20 – 50 €",
  BETWEEN_50_150: "50 – 150 €",
  MORE_THAN_150: "> 150 €",
  CUSTOM: "Personnalisé"
};

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

export default function MissionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // États
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    query: "",
    type: "ALL",
    budget: "ALL",
    sort: "recent"
  });

  // Modal de proposition
  const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
  const [proposalMessage, setProposalMessage] = useState("");
  const [proposalPrice, setProposalPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [proposalSuccess, setProposalSuccess] = useState(false);

  // Vérification du rôle et redirection si nécessaire
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/missions");
      return;
    }

    // Vérifier le rôle côté client (sera aussi vérifié côté serveur)
    if (session?.user?.role === "CREATOR") {
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  // Fonction pour charger les missions
  const fetchMissions = useCallback(async () => {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (filters.query) params.set("q", filters.query);
      if (filters.type !== "ALL") params.set("type", filters.type);
      if (filters.budget !== "ALL") params.set("budget", filters.budget);
      params.set("sort", filters.sort);

      const res = await fetch(`/api/missions/available?${params.toString()}`);
      
      if (res.status === 403) {
        // L'utilisateur n'est pas un designer, rediriger
        router.push("/dashboard");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions || []);
      }
    } catch (error) {
      console.error("Erreur chargement missions:", error);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  }, [filters, router]);

  // Charger les missions au montage et quand les filtres changent
  useEffect(() => {
    if (status === "authenticated") {
      fetchMissions();
    }
  }, [status, fetchMissions]);

  // Réinitialiser les filtres
  function resetFilters() {
    setFilters({
      query: "",
      type: "ALL",
      budget: "ALL",
      sort: "recent"
    });
  }

  // Ouvrir le modal de proposition
  function openProposalModal(mission: Mission) {
    setSelectedMission(mission);
    setProposalMessage("");
    setProposalPrice("");
    setProposalError(null);
    setProposalSuccess(false);
  }

  // Fermer le modal
  function closeProposalModal() {
    setSelectedMission(null);
    setProposalMessage("");
    setProposalPrice("");
    setProposalError(null);
    setProposalSuccess(false);
  }

  // Soumettre une proposition
  async function submitProposal() {
    if (!selectedMission) return;
    if (proposalMessage.length < 10) {
      setProposalError("Votre message doit contenir au moins 10 caractères");
      return;
    }

    setSubmitting(true);
    setProposalError(null);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: selectedMission.id,
          message: proposalMessage,
          price: proposalPrice ? parseInt(proposalPrice) : null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setProposalError(data.error || "Erreur lors de l'envoi de la proposition");
        return;
      }

      setProposalSuccess(true);

      // Mettre à jour la mission dans la liste
      setMissions((prev) =>
        prev.map((m) =>
          m.id === selectedMission.id
            ? { ...m, hasProposed: true, proposalStatus: "PENDING" }
            : m
        )
      );

      // Fermer le modal après 2 secondes
      setTimeout(() => {
        closeProposalModal();
      }, 2000);
    } catch {
      setProposalError("Erreur réseau lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  }

  // Formater le budget pour l'affichage
  function formatBudget(mission: Mission): string {
    if (mission.budgetCustom) {
      return `${mission.budgetCustom} €`;
    }
    if (mission.budgetRange) {
      return BUDGET_LABELS[mission.budgetRange] || "Non précisé";
    }
    return "Budget non précisé";
  }

  // Formater la deadline
  function formatDeadline(deadline: string | null): string {
    if (!deadline) return "Pas de deadline";
    const date = new Date(deadline);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Deadline dépassée";
    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Demain";
    if (diffDays <= 7) return `Dans ${diffDays} jours`;
    
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  // État de chargement initial
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
      <div className="mx-auto max-w-7xl px-4 py-10">
        {/* ============================================
            HEADER
            ============================================ */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Missions disponibles</h1>
          <p className="mt-2 text-slate-400">
            Découvrez les missions postées par les créateurs et proposez vos services.
          </p>
          {missions.length > 0 && (
            <p className="mt-1 text-sm text-cyan-400">
              {missions.length} mission{missions.length > 1 ? "s" : ""} trouvée{missions.length > 1 ? "s" : ""}
            </p>
          )}
        </div>

        {/* ============================================
            FILTRES ET RECHERCHE
            ============================================ */}
        <div className="mb-8 rounded-xl bg-slate-900/80 border border-slate-800 p-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Recherche textuelle */}
            <div className="lg:col-span-2">
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Rechercher
              </label>
              <input
                type="text"
                value={filters.query}
                onChange={(e) => setFilters((f) => ({ ...f, query: e.target.value }))}
                placeholder="Rechercher une mission (titre, description…)"
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Filtre par type */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Type de mission
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                {MISSION_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Filtre par budget */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Budget
              </label>
              <select
                value={filters.budget}
                onChange={(e) => setFilters((f) => ({ ...f, budget: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                {BUDGET_RANGES.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Ligne 2 : Tri + Boutons */}
          <div className="mt-4 flex flex-wrap items-end gap-4">
            {/* Tri par date */}
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">
                Trier par
              </label>
              <select
                value={filters.sort}
                onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
                className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-3 ml-auto">
              {/* Bouton réinitialiser */}
              <button
                type="button"
                onClick={resetFilters}
                className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                Réinitialiser
              </button>

              {/* Bouton appliquer (déclenche le fetch via useEffect) */}
              <button
                type="button"
                onClick={fetchMissions}
                disabled={searching}
                className="rounded-lg bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50"
              >
                {searching ? "Recherche..." : "Appliquer"}
              </button>
            </div>
          </div>
        </div>

        {/* ============================================
            LISTE DES MISSIONS
            ============================================ */}
        {missions.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {missions.map((mission) => (
              <MissionCard
                key={mission.id}
                mission={mission}
                onPropose={() => openProposalModal(mission)}
                formatBudget={formatBudget}
                formatDeadline={formatDeadline}
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
              Aucune mission ne correspond à vos critères
            </h3>
            <p className="mt-2 text-sm text-slate-400">
              Essayez d'élargir vos filtres ou revenez plus tard
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-6 rounded-lg bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}

        {/* ============================================
            MODAL DE PROPOSITION
            ============================================ */}
        {selectedMission && (
          <ProposalModal
            mission={selectedMission}
            message={proposalMessage}
            setMessage={setProposalMessage}
            price={proposalPrice}
            setPrice={setProposalPrice}
            onClose={closeProposalModal}
            onSubmit={submitProposal}
            submitting={submitting}
            error={proposalError}
            success={proposalSuccess}
            formatBudget={formatBudget}
          />
        )}
      </div>
    </div>
    </SubscriptionGuard>
  );
}

// =============================================
// COMPOSANT CARTE DE MISSION
// =============================================

type MissionCardProps = {
  mission: Mission;
  onPropose: () => void;
  formatBudget: (mission: Mission) => string;
  formatDeadline: (deadline: string | null) => string;
};

function MissionCard({ mission, onPropose, formatBudget, formatDeadline }: MissionCardProps) {
  return (
    <div className="group rounded-xl bg-slate-900/80 border border-slate-800 p-6 transition-all hover:border-cyan-500/40 flex flex-col">
      {/* Header avec créateur */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-sm font-bold text-slate-900 overflow-hidden">
          {mission.creator.avatarUrl ? (
            <Image
              src={mission.creator.avatarUrl}
              alt={mission.creator.displayName}
              width={40}
              height={40}
              className="h-full w-full object-cover"
            />
          ) : (
            mission.creator.displayName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-white truncate">
            {mission.creator.displayName}
          </p>
          <p className="text-xs text-slate-500">Créateur</p>
        </div>
        {/* Badge type */}
        <span className="shrink-0 rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-cyan-400">
          {TYPE_LABELS[mission.type] || mission.type}
        </span>
      </div>

      {/* Titre */}
      <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
        {mission.title}
      </h3>

      {/* Description (extrait) */}
      <p className="text-sm text-slate-400 line-clamp-3 mb-4 flex-1">
        {mission.description}
      </p>

      {/* Images de référence (si présentes) */}
      {mission.referenceImages.length > 0 && (
        <div className="flex gap-2 mb-4">
          {mission.referenceImages.slice(0, 3).map((url, index) => (
            <div key={index} className="relative h-16 w-16 rounded-lg overflow-hidden bg-slate-800">
              <Image
                src={url}
                alt={`Référence ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </div>
          ))}
          {mission.referenceImages.length > 3 && (
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-slate-800 text-xs text-slate-400">
              +{mission.referenceImages.length - 3}
            </div>
          )}
        </div>
      )}

      {/* Infos : Budget + Deadline */}
      <div className="flex flex-wrap gap-3 mb-4 text-sm">
        <div className="flex items-center gap-1.5 text-emerald-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatBudget(mission)}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span>{formatDeadline(mission.deadline)}</span>
        </div>
        {mission.proposalCount > 0 && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>{mission.proposalCount} proposition{mission.proposalCount > 1 ? "s" : ""}</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 mt-auto pt-4 border-t border-slate-800">
        <Link
          href={`/missions/${mission.id}`}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          Détails
        </Link>
        
        {mission.hasProposed ? (
          <div className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold ${
            mission.proposalStatus === "ACCEPTED"
              ? "bg-emerald-500/20 text-emerald-400"
              : mission.proposalStatus === "REJECTED"
              ? "bg-red-500/20 text-red-400"
              : "bg-yellow-500/20 text-yellow-400"
          }`}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {mission.proposalStatus === "ACCEPTED"
              ? "Acceptée"
              : mission.proposalStatus === "REJECTED"
              ? "Refusée"
              : "En attente"}
          </div>
        ) : (
          <button
            type="button"
            onClick={onPropose}
            className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Proposer
          </button>
        )}
      </div>
    </div>
  );
}

// =============================================
// COMPOSANT MODAL DE PROPOSITION
// =============================================

type ProposalModalProps = {
  mission: Mission;
  message: string;
  setMessage: (msg: string) => void;
  price: string;
  setPrice: (price: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
  success: boolean;
  formatBudget: (mission: Mission) => string;
};

function ProposalModal({
  mission,
  message,
  setMessage,
  price,
  setPrice,
  onClose,
  onSubmit,
  submitting,
  error,
  success,
  formatBudget
}: ProposalModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div
        className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Bouton fermer */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {success ? (
          /* État de succès */
          <div className="text-center py-8">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Proposition envoyée !</h3>
            <p className="text-sm text-slate-400">
              Le créateur a été notifié et vous recevrez une réponse bientôt.
            </p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-white">Proposer mes services</h2>
              <p className="mt-1 text-sm text-slate-400">
                Pour la mission : <span className="text-cyan-400">{mission.title}</span>
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Budget indicatif : {formatBudget(mission)}
              </p>
            </div>

            {/* Formulaire */}
            <div className="space-y-4">
              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Votre message de présentation <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Présentez-vous, expliquez pourquoi vous êtes le bon choix pour cette mission, mentionnez vos expériences similaires..."
                  rows={5}
                  maxLength={2000}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
                />
                <p className="mt-1 text-xs text-slate-500">{message.length}/2000 caractères (min. 10)</p>
              </div>

              {/* Prix proposé */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Prix proposé (optionnel)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="Ex: 75"
                    min="1"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Laissez vide pour négocier plus tard
                </p>
              </div>

              {/* Erreur */}
              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Boutons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={submitting || message.length < 10}
                  className="flex-1 rounded-lg bg-cyan-500 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Envoi..." : "Envoyer ma proposition"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
























