/**
 * Page de détails d'une mission pour les graphistes/monteurs
 * 
 * Affiche toutes les informations de la mission :
 * - Titre, description complète
 * - Type, budget, deadline
 * - Images de référence
 * - Pièces jointes
 * - Informations sur le créateur
 * - Bouton pour proposer ses services
 * 
 * Accessible uniquement aux utilisateurs avec rôle DESIGNER
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import SubscriptionGuard from "@/components/SubscriptionGuard";

// =============================================
// TYPES
// =============================================

type Attachment = {
  id: string;
  url: string;
  filename: string;
  type: "ATTACHMENT" | "REFERENCE";
};

type MissionDetails = {
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
    bio: string | null;
  };
  attachments: Attachment[];
  hasProposed: boolean;
  proposalStatus: string | null;
  proposalCount: number;
};

// =============================================
// CONSTANTES
// =============================================

const TYPE_LABELS: Record<string, string> = {
  MINIATURE_YOUTUBE: "Miniature YouTube",
  MONTAGE_VIDEO: "Montage vidéo",
  DESIGN_BANNIERE: "Design bannière",
  MOTION_DESIGN: "Motion design",
  RETOUCHE_PHOTO: "Retouche photo",
  AUTRE: "Autre"
};

const BUDGET_LABELS: Record<string, string> = {
  LESS_THAN_20: "Moins de 20 €",
  BETWEEN_20_50: "20 – 50 €",
  BETWEEN_50_150: "50 – 150 €",
  MORE_THAN_150: "Plus de 150 €",
  CUSTOM: "Personnalisé"
};

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

export default function MissionDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const missionId = params.id as string;
  const { data: session, status } = useSession();

  const [mission, setMission] = useState<MissionDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal de proposition
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [proposalMessage, setProposalMessage] = useState("");
  const [proposalPrice, setProposalPrice] = useState("");
  const [hasAcceptedPayoutPolicy, setHasAcceptedPayoutPolicy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [proposalSuccess, setProposalSuccess] = useState(false);

  // Lightbox pour les images
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Vérification du rôle
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/missions/${missionId}`);
      return;
    }

    if (session?.user?.role === "CREATOR") {
      router.push("/dashboard");
      return;
    }
  }, [status, session, router, missionId]);

  // Charger les détails de la mission
  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchMission() {
      try {
        const res = await fetch(`/api/missions/available/${missionId}`);
        
        if (res.status === 403) {
          router.push("/dashboard");
          return;
        }

        if (res.status === 404) {
          setError("Mission introuvable");
          return;
        }

        if (!res.ok) {
          setError("Erreur lors du chargement de la mission");
          return;
        }

        const data = await res.json();
        setMission(data.mission);
      } catch {
        setError("Erreur de connexion");
      } finally {
        setLoading(false);
      }
    }

    fetchMission();
  }, [status, missionId, router]);

  // Soumettre une proposition
  async function submitProposal() {
    if (!mission) return;
    if (proposalMessage.length < 10) {
      setProposalError("Votre message doit contenir au moins 10 caractères");
      return;
    }
    if (!hasAcceptedPayoutPolicy) {
      setProposalError("Vous devez accepter les conditions avant d'envoyer votre proposition.");
      return;
    }

    setSubmitting(true);
    setProposalError(null);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId: mission.id,
          message: proposalMessage,
          price: proposalPrice ? parseInt(proposalPrice) : null,
          acceptedPayoutPolicy: true
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setProposalError(data.error || "Erreur lors de l'envoi de la proposition");
        return;
      }

      setProposalSuccess(true);
      setMission((prev) =>
        prev ? { ...prev, hasProposed: true, proposalStatus: "PENDING" } : null
      );

      // Rediriger vers la messagerie après 2 secondes pour continuer la discussion
      setTimeout(() => {
        if (data.conversationId) {
          router.push(`/messages?conversation=${data.conversationId}`);
        } else {
          setShowProposalModal(false);
          setProposalSuccess(false);
        }
      }, 2000);
    } catch {
      setProposalError("Erreur réseau lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  }

  // Formater le budget
  function formatBudget(): string {
    if (!mission) return "";
    if (mission.budgetCustom) {
      return `${mission.budgetCustom} €`;
    }
    if (mission.budgetRange) {
      return BUDGET_LABELS[mission.budgetRange] || "Non précisé";
    }
    return "Budget non précisé";
  }

  // Formater la deadline
  function formatDeadline(): string {
    if (!mission?.deadline) return "Pas de deadline";
    const date = new Date(mission.deadline);
    return date.toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  }

  // Séparer les pièces jointes
  const referenceImages = mission?.attachments.filter((a) => a.type === "REFERENCE") || [];
  const otherAttachments = mission?.attachments.filter((a) => a.type === "ATTACHMENT") || [];

  // État de chargement
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  // État d'erreur
  if (error || !mission) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            {error || "Mission introuvable"}
          </h1>
          <Link href="/missions" className="text-cyan-400 hover:underline">
            ← Retour aux missions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionGuard>
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Bouton retour */}
        <Link
          href="/missions"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour aux missions
        </Link>

        {/* ============================================
            HEADER DE LA MISSION
            ============================================ */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 p-8 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Infos principales */}
            <div className="flex-1">
              {/* Badge type */}
              <span className="inline-block rounded-full bg-cyan-500/20 px-4 py-1 text-xs font-semibold text-cyan-400 mb-4">
                {TYPE_LABELS[mission.type] || mission.type}
              </span>

              {/* Titre */}
              <h1 className="text-3xl font-bold text-white mb-4">{mission.title}</h1>

              {/* Créateur */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-lg font-bold text-slate-900 overflow-hidden">
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
                <div>
                  <p className="font-semibold text-white">{mission.creator.displayName}</p>
                  <p className="text-sm text-slate-400">Créateur de contenu</p>
                </div>
                <Link
                  href={`/profile/${mission.creator.id}`}
                  className="ml-auto text-sm text-cyan-400 hover:underline"
                >
                  Voir le profil
                </Link>
              </div>

              {/* Infos rapides */}
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2">
                  <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-white">{formatBudget()}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2">
                  <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-white">{formatDeadline()}</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2">
                  <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  <span className="text-sm text-white">
                    {mission.proposalCount} proposition{mission.proposalCount > 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Bouton proposer */}
            <div className="lg:w-64 flex flex-col gap-3">
              {mission.hasProposed ? (
                <div className={`rounded-xl px-6 py-4 text-center ${
                  mission.proposalStatus === "ACCEPTED"
                    ? "bg-emerald-500/20 border border-emerald-500/30"
                    : mission.proposalStatus === "REJECTED"
                    ? "bg-red-500/20 border border-red-500/30"
                    : "bg-yellow-500/20 border border-yellow-500/30"
                }`}>
                  <svg className={`mx-auto h-8 w-8 mb-2 ${
                    mission.proposalStatus === "ACCEPTED"
                      ? "text-emerald-400"
                      : mission.proposalStatus === "REJECTED"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className={`font-semibold ${
                    mission.proposalStatus === "ACCEPTED"
                      ? "text-emerald-400"
                      : mission.proposalStatus === "REJECTED"
                      ? "text-red-400"
                      : "text-yellow-400"
                  }`}>
                    {mission.proposalStatus === "ACCEPTED"
                      ? "Proposition acceptée"
                      : mission.proposalStatus === "REJECTED"
                      ? "Proposition refusée"
                      : "Proposition envoyée"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {mission.proposalStatus === "PENDING" && "En attente de réponse"}
                  </p>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setHasAcceptedPayoutPolicy(false);
                    setShowProposalModal(true);
                  }}
                  className="rounded-xl bg-cyan-500 px-6 py-4 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 flex items-center justify-center gap-2"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Proposer mes services
                </button>
              )}

              <button
                type="button"
                onClick={async () => {
                  try {
                    // Créer ou récupérer la conversation pour cette mission
                    const res = await fetch("/api/conversations", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        missionId: mission.id,
                        otherUserId: mission.creator.id
                      })
                    });
                    const data = await res.json();
                    if (res.ok && data.conversation) {
                      router.push(`/messages?conversation=${data.conversation.id}`);
                    } else {
                      console.error("Erreur création conversation:", data);
                      alert("Erreur: " + (data.error || "Impossible de créer la conversation"));
                    }
                  } catch (err) {
                    console.error("Erreur réseau:", err);
                    alert("Erreur réseau lors de la création de la conversation");
                  }
                }}
                className="rounded-xl border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 flex items-center justify-center gap-2"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Contacter le créateur
              </button>
            </div>
          </div>
        </div>

        {/* ============================================
            DESCRIPTION
            ============================================ */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Description de la mission
          </h2>
          <div className="prose prose-invert prose-sm max-w-none">
            <p className="text-slate-300 whitespace-pre-wrap">{mission.description}</p>
          </div>
        </div>

        {/* ============================================
            IMAGES DE RÉFÉRENCE
            ============================================ */}
        {referenceImages.length > 0 && (
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Exemples / Références visuelles
            </h2>
            <p className="text-sm text-slate-400 mb-4">
              Le créateur souhaite un résultat similaire à ces exemples
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {referenceImages.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setLightboxImage(img.url)}
                  className="group relative aspect-video rounded-xl overflow-hidden bg-slate-800 cursor-pointer"
                >
                  <Image
                    src={img.url}
                    alt={img.filename}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <svg className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ============================================
            PIÈCES JOINTES
            ============================================ */}
        {otherAttachments.length > 0 && (
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Pièces jointes
            </h2>
            <div className="space-y-2">
              {otherAttachments.map((att) => (
                <a
                  key={att.id}
                  href={att.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-lg bg-slate-800 p-3 text-sm text-white hover:bg-slate-700 transition"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-700">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <span className="flex-1 truncate">{att.filename}</span>
                  <svg className="h-5 w-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* ============================================
            LIGHTBOX
            ============================================ */}
        {lightboxImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
            onClick={() => setLightboxImage(null)}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="relative max-w-4xl max-h-[90vh] w-full" onClick={(e) => e.stopPropagation()}>
              <Image
                src={lightboxImage}
                alt="Image de référence"
                width={1200}
                height={800}
                className="rounded-xl object-contain w-full h-auto max-h-[85vh]"
              />
            </div>
          </div>
        )}

        {/* ============================================
            MODAL DE PROPOSITION
            ============================================ */}
        {showProposalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div
              className="relative w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => {
                  setShowProposalModal(false);
                  setProposalError(null);
                  setProposalSuccess(false);
                  setHasAcceptedPayoutPolicy(false);
                }}
                className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-800 hover:text-white transition"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {proposalSuccess ? (
                <div className="text-center py-8">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                    <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">Proposition envoyée !</h3>
                  <p className="text-sm text-slate-400">
                    Le créateur a été notifié.
                  </p>
                  <p className="text-xs text-cyan-400 mt-2">
                    Redirection vers la messagerie...
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <h2 className="text-xl font-semibold text-white">Proposer mes services</h2>
                    <p className="mt-1 text-sm text-slate-400">
                      Pour : <span className="text-cyan-400">{mission.title}</span>
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* Conditions (obligatoire) */}
                    <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 p-4">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-500/15">
                          <svg className="h-5 w-5 text-amber-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86l-8.02 14A2 2 0 004.0 21h16a2 2 0 001.73-3.14l-8.02-14a2 2 0 00-3.46 0z" />
                          </svg>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-amber-200">
                            Important — confirmation de réception du virement
                          </p>
                          <p className="mt-1 text-xs text-amber-200/70 leading-relaxed">
                            Après avoir envoyé votre travail et reçu le virement, vous devez vous reconnecter sur CREIX pour confirmer la réception du paiement.
                            Sans confirmation dans les 24h suivant la réception, la version finale ne sera pas envoyée et vous risquez un bannissement.
                          </p>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setHasAcceptedPayoutPolicy(true)}
                              className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                                hasAcceptedPayoutPolicy
                                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                  : "bg-amber-500 text-slate-900 hover:bg-amber-400"
                              }`}
                            >
                              {hasAcceptedPayoutPolicy ? "✓ Accepté" : "J'accepte"}
                            </button>
                            {!hasAcceptedPayoutPolicy && (
                              <span className="text-[11px] text-amber-200/60">
                                Obligatoire pour envoyer la proposition
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Votre message <span className="text-red-400">*</span>
                      </label>
                      <textarea
                        value={proposalMessage}
                        onChange={(e) => setProposalMessage(e.target.value)}
                        placeholder="Présentez-vous et expliquez pourquoi vous êtes le bon choix..."
                        rows={5}
                        maxLength={2000}
                        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
                      />
                      <p className="mt-1 text-xs text-slate-500">{proposalMessage.length}/2000</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Prix proposé (optionnel)
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={proposalPrice}
                          onChange={(e) => setProposalPrice(e.target.value)}
                          placeholder="Ex: 75"
                          min="1"
                          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 pr-12 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">€</span>
                      </div>
                    </div>

                    {proposalError && (
                      <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
                        {proposalError}
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => setShowProposalModal(false)}
                        className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                      >
                        Annuler
                      </button>
                      <button
                        type="button"
                        onClick={submitProposal}
                        disabled={submitting || proposalMessage.length < 10 || !hasAcceptedPayoutPolicy}
                        className="flex-1 rounded-lg bg-cyan-500 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50"
                      >
                        {submitting ? "Envoi..." : "Envoyer"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
    </SubscriptionGuard>
  );
}






















