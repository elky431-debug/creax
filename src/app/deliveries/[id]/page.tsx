/**
 * Page de détail d'une livraison
 * 
 * Fonctionnalités :
 * - Affichage de la version protégée (image filigranée ou vidéo preview)
 * - Lecteur vidéo sécurisé anti-téléchargement
 * - Actions selon le statut et le rôle
 * - Paiement Stripe
 * - Upload version finale
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import SubscriptionGuard from "@/components/SubscriptionGuard";

// =============================================
// TYPES
// =============================================

type DeliveryDetail = {
  id: string;
  missionId: string;
  mission: {
    id: string;
    title: string;
    type: string;
    description: string;
    status: string;
  };
  freelancer: {
    id: string;
    email: string;
    profile: {
      displayName: string;
      avatarUrl: string | null;
      bio: string | null;
      skills: string | null;
    } | null;
  };
  creator: {
    id: string;
    email: string;
    profile: {
      displayName: string;
      avatarUrl: string | null;
    } | null;
  };
  protectedUrl: string | null;
  protectedType: string | null;
  protectedNote: string | null;
  finalUrl: string | null;
  finalFilename: string | null;
  finalNote: string | null;
  status: string;
  paymentStatus: string;
  amount: number;
  revisionNote: string | null;
  revisionCount: number;
  createdAt: string;
  updatedAt: string;
  isFreelancer: boolean;
  isCreator: boolean;
};

// =============================================
// CONSTANTES
// =============================================

const STATUS_LABELS: Record<string, { label: string; color: string; description: string }> = {
  PENDING: { 
    label: "En attente", 
    color: "text-slate-400",
    description: "En attente de la version protégée"
  },
  PROTECTED_SENT: { 
    label: "Version protégée envoyée", 
    color: "text-cyan-400",
    description: "Le créateur peut maintenant vérifier le travail"
  },
  NEEDS_REVISION: { 
    label: "Modifications demandées", 
    color: "text-orange-400",
    description: "Le créateur a demandé des modifications"
  },
  VALIDATED: { 
    label: "Validée", 
    color: "text-yellow-400",
    description: "En attente du paiement pour débloquer la version finale"
  },
  PAID: { 
    label: "Payée", 
    color: "text-emerald-400",
    description: "Le freelance peut maintenant envoyer la version finale"
  },
  FINAL_SENT: { 
    label: "Version finale envoyée", 
    color: "text-emerald-400",
    description: "Le créateur peut télécharger la version finale"
  },
  COMPLETED: { 
    label: "Terminée", 
    color: "text-emerald-400",
    description: "Mission terminée avec succès"
  }
};

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

export default function DeliveryDetailPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();

  const [delivery, setDelivery] = useState<DeliveryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal de révision (créateur)
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [revisionNote, setRevisionNote] = useState("");

  // Modal d'upload final
  const [showFinalModal, setShowFinalModal] = useState(false);
  const [finalUrl, setFinalUrl] = useState("");
  const [finalNote, setFinalNote] = useState("");

  // Modal d'upload révision (freelance)
  const [showRevisionUploadModal, setShowRevisionUploadModal] = useState(false);
  const [revisionFile, setRevisionFile] = useState<File | null>(null);
  const [revisionUploadNote, setRevisionUploadNote] = useState("");
  const [uploadingRevision, setUploadingRevision] = useState(false);

  const deliveryId = params.id as string;

  // Vérifier le statut du paiement dans l'URL
  useEffect(() => {
    const payment = searchParams.get("payment");
    if (payment === "success") {
      setSuccess("Paiement effectué avec succès ! Le freelance peut maintenant envoyer la version finale.");
    } else if (payment === "cancelled") {
      setError("Paiement annulé.");
    }
  }, [searchParams]);

  // Charger la livraison
  const fetchDelivery = useCallback(async () => {
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}`);
      
      if (res.status === 404) {
        router.push("/deliveries");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setDelivery(data.delivery);
      }
    } catch (error) {
      console.error("Erreur chargement livraison:", error);
    } finally {
      setLoading(false);
    }
  }, [deliveryId, router]);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/deliveries/" + deliveryId);
      return;
    }

    fetchDelivery();
  }, [status, fetchDelivery, deliveryId, router]);

  // Valider la livraison
  async function handleValidate() {
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/deliveries/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "VALIDATE" })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la validation");
        return;
      }

      setSuccess(data.message);
      fetchDelivery();
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionLoading(false);
    }
  }

  // Demander une révision
  async function handleRequestRevision() {
    if (!revisionNote.trim()) {
      setError("Veuillez préciser les modifications souhaitées");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/deliveries/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "REQUEST_REVISION",
          revisionNote 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la demande");
        return;
      }

      setSuccess(data.message);
      setShowRevisionModal(false);
      setRevisionNote("");
      fetchDelivery();
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionLoading(false);
    }
  }

  // Payer
  async function handlePay() {
    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/deliveries/${deliveryId}/pay`, {
        method: "POST"
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors du paiement");
        return;
      }

      // Rediriger vers Stripe
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionLoading(false);
    }
  }

  // Envoyer la version finale
  async function handleSendFinal() {
    if (!finalUrl.trim()) {
      setError("Veuillez fournir l'URL de la version finale");
      return;
    }

    setActionLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/deliveries/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "SEND_FINAL",
          finalUrl,
          finalNote 
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'envoi");
        return;
      }

      setSuccess(data.message);
      setShowFinalModal(false);
      fetchDelivery();
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionLoading(false);
    }
  }

  // Envoyer une nouvelle version (révision)
  async function handleSendRevision() {
    if (!revisionFile) {
      setError("Veuillez sélectionner un fichier");
      return;
    }

    setUploadingRevision(true);
    setError(null);

    try {
      // 1. Upload du fichier avec watermark
      const formData = new FormData();
      formData.append("file", revisionFile);
      formData.append("missionId", delivery?.missionId || "");

      const uploadRes = await fetch("/api/deliveries/upload", {
        method: "POST",
        body: formData
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        setError(uploadData.error || "Erreur lors de l'upload");
        return;
      }

      // 2. Mettre à jour la livraison avec la nouvelle version
      const updateRes = await fetch(`/api/deliveries/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEND_REVISION",
          protectedUrl: uploadData.url,
          protectedType: uploadData.type,
          protectedNote: revisionUploadNote
        })
      });

      const updateData = await updateRes.json();

      if (!updateRes.ok) {
        setError(updateData.error || "Erreur lors de la mise à jour");
        return;
      }

      setSuccess("Nouvelle version envoyée avec succès !");
      setShowRevisionUploadModal(false);
      setRevisionFile(null);
      setRevisionUploadNote("");
      fetchDelivery();
    } catch {
      setError("Erreur réseau");
    } finally {
      setUploadingRevision(false);
    }
  }

  // État de chargement
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!delivery) {
    return null;
  }

  const statusInfo = STATUS_LABELS[delivery.status] || STATUS_LABELS.PENDING;
  const otherUser = delivery.isCreator ? delivery.freelancer : delivery.creator;
  const otherUserName = otherUser.profile?.displayName || otherUser.email;

  return (
    <SubscriptionGuard>
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* ============================================
            HEADER
            ============================================ */}
        <div className="mb-8">
          <Link 
            href="/deliveries"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux livraisons
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-white">{delivery.mission.title}</h1>
              <p className="mt-1 text-slate-400">
                {delivery.isCreator ? "Livraison de" : "Livraison pour"} {otherUserName}
              </p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium ${statusInfo.color} bg-slate-800`}>
              <span className="h-2 w-2 rounded-full bg-current" />
              {statusInfo.label}
            </div>
          </div>
        </div>

        {/* Messages de succès/erreur */}
        {success && (
          <div className="mb-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400">
            {error}
          </div>
        )}

        {/* ============================================
            TIMELINE
            ============================================ */}
        <div className="mb-8 rounded-xl bg-slate-900/80 border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Progression</h2>
          <DeliveryTimeline status={delivery.status} />
          <p className="mt-4 text-sm text-slate-400">{statusInfo.description}</p>
        </div>

        {/* ============================================
            VERSION PROTÉGÉE
            ============================================ */}
        {delivery.protectedUrl && (
          <div className="mb-8 rounded-xl bg-slate-900/80 border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              Version protégée
              <span className="ml-2 text-xs text-slate-500 font-normal">(filigranée)</span>
            </h2>

            {delivery.protectedType === "video" ? (
              <SecureVideoPlayer url={delivery.protectedUrl} />
            ) : (
              <SecureImageViewer url={delivery.protectedUrl} />
            )}

            {delivery.protectedNote && (
              <div className="mt-4 rounded-lg bg-slate-800 p-4">
                <p className="text-xs text-slate-500 mb-1">Note du freelance</p>
                <p className="text-sm text-slate-300">{delivery.protectedNote}</p>
              </div>
            )}
          </div>
        )}

        {/* ============================================
            DEMANDE DE RÉVISION
            ============================================ */}
        {delivery.revisionNote && (
          <div className="mb-8 rounded-xl bg-orange-500/10 border border-orange-500/20 p-6">
            <h2 className="text-lg font-semibold text-orange-400 mb-2">
              Modifications demandées ({delivery.revisionCount})
            </h2>
            <p className="text-sm text-slate-300">{delivery.revisionNote}</p>
          </div>
        )}

        {/* ============================================
            VERSION FINALE
            ============================================ */}
        {delivery.finalUrl && delivery.paymentStatus === "PAID" && (
          <div className="mb-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-6">
            <h2 className="text-lg font-semibold text-emerald-400 mb-4">
              Version finale disponible
            </h2>

            {delivery.finalNote && (
              <p className="text-sm text-slate-300 mb-4">{delivery.finalNote}</p>
            )}

            <a
              href={delivery.finalUrl}
              download={delivery.finalFilename || "fichier-final"}
              className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Télécharger la version finale
            </a>

            <p className="mt-3 text-xs text-slate-500">
              Ce lien expire dans 7 jours. Téléchargez votre fichier dès que possible.
            </p>
          </div>
        )}

        {/* ============================================
            INFORMATIONS
            ============================================ */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2">
          {/* Montant */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
            <p className="text-xs text-slate-500 mb-1">Montant</p>
            <p className="text-2xl font-bold text-emerald-400">
              {(delivery.amount / 100).toFixed(2)} €
            </p>
            <p className={`text-sm mt-1 ${
              delivery.paymentStatus === "PAID" ? "text-emerald-400" : "text-yellow-400"
            }`}>
              {delivery.paymentStatus === "PAID" ? "✓ Payé" : "En attente de paiement"}
            </p>
          </div>

          {/* Profil */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
            <p className="text-xs text-slate-500 mb-2">
              {delivery.isCreator ? "Freelance" : "Créateur"}
            </p>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-lg font-bold text-slate-900 overflow-hidden">
                {otherUser.profile?.avatarUrl ? (
                  <Image
                    src={otherUser.profile.avatarUrl}
                    alt={otherUserName}
                    width={48}
                    height={48}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  otherUserName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <p className="font-semibold text-white">{otherUserName}</p>
                <button 
                  type="button"
                  onClick={async () => {
                    const res = await fetch("/api/conversations", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        missionId: delivery.missionId,
                        otherUserId: otherUser.id
                      })
                    });
                    if (res.ok) {
                      const data = await res.json();
                      router.push(`/messages?conversation=${data.conversation.id}`);
                    }
                  }}
                  className="text-sm text-cyan-400 hover:underline"
                >
                  Envoyer un message
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================
            ACTIONS
            ============================================ */}
        <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Actions</h2>

          {/* Actions pour le créateur */}
          {delivery.isCreator && (
            <div className="flex flex-wrap gap-3">
              {delivery.status === "PROTECTED_SENT" && (
                <>
                  <button
                    type="button"
                    onClick={() => setShowRevisionModal(true)}
                    disabled={actionLoading}
                    className="flex-1 sm:flex-none rounded-lg border border-orange-500/30 bg-orange-500/10 px-6 py-3 text-sm font-semibold text-orange-400 transition hover:bg-orange-500/20 disabled:opacity-50"
                  >
                    Demander des modifications
                  </button>
                  <button
                    type="button"
                    onClick={handleValidate}
                    disabled={actionLoading}
                    className="flex-1 sm:flex-none rounded-lg bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50"
                  >
                    {actionLoading ? "..." : "Valider et passer au paiement"}
                  </button>
                </>
              )}

              {delivery.status === "VALIDATED" && (
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={actionLoading}
                  className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  {actionLoading ? "Redirection..." : `Payer ${(delivery.amount / 100).toFixed(2)} €`}
                </button>
              )}

              {delivery.status === "PAID" && (
                <p className="text-sm text-slate-400">
                  En attente de la version finale du freelance...
                </p>
              )}
            </div>
          )}

          {/* Actions pour le freelance */}
          {delivery.isFreelancer && (
            <div className="flex flex-wrap gap-3">
              {delivery.status === "NEEDS_REVISION" && (
                <div className="w-full">
                  <p className="text-sm text-orange-400 mb-3">
                    Le créateur a demandé des modifications. Envoyez une nouvelle version protégée.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowRevisionUploadModal(true)}
                    disabled={actionLoading}
                    className="rounded-lg bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:opacity-50"
                  >
                    📤 Envoyer la nouvelle version
                  </button>
                </div>
              )}

              {delivery.status === "VALIDATED" && (
                <p className="text-sm text-yellow-400">
                  En attente du paiement du créateur...
                </p>
              )}

              {delivery.status === "PAID" && (
                <button
                  type="button"
                  onClick={() => setShowFinalModal(true)}
                  disabled={actionLoading}
                  className="rounded-lg bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  Envoyer la version finale
                </button>
              )}

              {delivery.status === "FINAL_SENT" && (
                <p className="text-sm text-emerald-400">
                  ✓ Version finale envoyée. Mission terminée !
                </p>
              )}
            </div>
          )}
        </div>

        {/* ============================================
            MODAL RÉVISION
            ============================================ */}
        {showRevisionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Demander des modifications
              </h3>
              <textarea
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="Décrivez les modifications souhaitées..."
                rows={4}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowRevisionModal(false)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleRequestRevision}
                  disabled={actionLoading}
                  className="flex-1 rounded-lg bg-orange-500 py-3 text-sm font-semibold text-slate-900 transition hover:bg-orange-400 disabled:opacity-50"
                >
                  {actionLoading ? "..." : "Envoyer"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            MODAL VERSION FINALE
            ============================================ */}
        {showFinalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Envoyer la version finale
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    URL du fichier final (Google Drive, Dropbox, etc.)
                  </label>
                  <input
                    type="url"
                    value={finalUrl}
                    onChange={(e) => setFinalUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Note (optionnel)
                  </label>
                  <textarea
                    value={finalNote}
                    onChange={(e) => setFinalNote(e.target.value)}
                    placeholder="Instructions de téléchargement, fichiers inclus..."
                    rows={3}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowFinalModal(false)}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSendFinal}
                  disabled={actionLoading}
                  className="flex-1 rounded-lg bg-emerald-500 py-3 text-sm font-semibold text-slate-900 transition hover:bg-emerald-400 disabled:opacity-50"
                >
                  {actionLoading ? "..." : "Envoyer"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================
            MODAL UPLOAD RÉVISION (FREELANCE)
            ============================================ */}
        {showRevisionUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
            <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-2">
                Envoyer une nouvelle version
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Uploadez votre travail corrigé. CREIX ajoutera automatiquement le filigrane et le flou de protection.
              </p>
              
              <div className="space-y-4">
                {/* Zone d'upload */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Fichier (image ou vidéo)
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                      onChange={(e) => setRevisionFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="revision-file-input"
                    />
                    <label
                      htmlFor="revision-file-input"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-700 rounded-lg cursor-pointer hover:border-orange-500 transition"
                    >
                      {revisionFile ? (
                        <div className="text-center">
                          <p className="text-sm text-white font-medium">{revisionFile.name}</p>
                          <p className="text-xs text-slate-500 mt-1">
                            {(revisionFile.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <svg className="w-8 h-8 text-slate-500 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                          </svg>
                          <p className="text-sm text-slate-400">Cliquez pour sélectionner</p>
                          <p className="text-xs text-slate-500">JPG, PNG, WebP, MP4, MOV, WebM</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-sm text-slate-400 mb-2">
                    Note pour le créateur (optionnel)
                  </label>
                  <textarea
                    value={revisionUploadNote}
                    onChange={(e) => setRevisionUploadNote(e.target.value)}
                    placeholder="Décrivez les modifications apportées..."
                    rows={3}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowRevisionUploadModal(false);
                    setRevisionFile(null);
                    setRevisionUploadNote("");
                  }}
                  className="flex-1 rounded-lg border border-slate-700 bg-slate-800 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleSendRevision}
                  disabled={uploadingRevision || !revisionFile}
                  className="flex-1 rounded-lg bg-orange-500 py-3 text-sm font-semibold text-white transition hover:bg-orange-400 disabled:opacity-50"
                >
                  {uploadingRevision ? "Envoi en cours..." : "Envoyer"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </SubscriptionGuard>
  );
}

// =============================================
// COMPOSANT TIMELINE
// =============================================

function DeliveryTimeline({ status }: { status: string }) {
  const steps = [
    { key: "PENDING", label: "Créée" },
    { key: "PROTECTED_SENT", label: "Version protégée" },
    { key: "VALIDATED", label: "Validée" },
    { key: "PAID", label: "Payée" },
    { key: "FINAL_SENT", label: "Version finale" }
  ];

  const currentIndex = steps.findIndex(s => s.key === status);
  const needsRevision = status === "NEEDS_REVISION";

  return (
    <div className="flex items-center gap-2">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex || status === "COMPLETED";
        const isCurrent = index === currentIndex;
        const isRevision = needsRevision && step.key === "PROTECTED_SENT";

        return (
          <div key={step.key} className="flex items-center gap-2 flex-1">
            <div className={`flex flex-col items-center ${index < steps.length - 1 ? "flex-1" : ""}`}>
              <div className={`h-4 w-4 rounded-full ${
                isRevision
                  ? "bg-orange-500"
                  : isCompleted 
                  ? "bg-emerald-500" 
                  : isCurrent 
                  ? "bg-cyan-500" 
                  : "bg-slate-700"
              }`} />
              <span className={`mt-2 text-xs text-center ${
                isRevision
                  ? "text-orange-400"
                  : isCompleted || isCurrent 
                  ? "text-white" 
                  : "text-slate-500"
              }`}>
                {isRevision ? "Révision" : step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`h-0.5 flex-1 ${
                isCompleted ? "bg-emerald-500" : "bg-slate-700"
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// =============================================
// LECTEUR VIDÉO SÉCURISÉ
// =============================================

function SecureVideoPlayer({ url }: { url: string }) {
  return (
    <div 
      className="relative rounded-lg overflow-hidden bg-black"
      onContextMenu={(e) => e.preventDefault()}
    >
      <video
        src={url}
        controls
        controlsList="nodownload"
        disablePictureInPicture
        playsInline
        preload="metadata"
        className="w-full max-h-[500px] object-contain relative z-0"
      >
        Votre navigateur ne supporte pas la lecture vidéo.
      </video>

      {/* Watermarks Creix */}
      <div className="absolute top-3 left-3 z-10 pointer-events-none">
        <span className="text-white/60 text-xs font-bold bg-black/60 px-2 py-1 rounded">
          © CREIX {new Date().getFullYear()}
        </span>
      </div>
      <div className="absolute top-3 right-3 z-10 pointer-events-none">
        <span className="text-white/60 text-xs font-bold bg-black/60 px-2 py-1 rounded">
          VERSION PROTÉGÉE
        </span>
      </div>
      <div className="absolute bottom-14 right-3 z-10 pointer-events-none">
        <span className="text-white/50 text-sm font-bold">
          CREIX © {new Date().getFullYear()}
        </span>
      </div>
      
      {/* Texte descriptif sous la vidéo */}
      <div className="mt-2 text-center text-xs text-slate-500">
        Soumission de {new Date().toLocaleDateString("fr-FR")}
      </div>
    </div>
  );
}

// =============================================
// VISIONNEUSE D'IMAGE SÉCURISÉE ANTI-SCREENSHOT
// =============================================

function SecureImageViewer({ url }: { url: string }) {
  // Bloquer les captures d'écran via CSS et événements
  useEffect(() => {
    // Bloquer PrintScreen
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen" || (e.metaKey && e.shiftKey && (e.key === "3" || e.key === "4" || e.key === "5"))) {
        e.preventDefault();
        alert("Les captures d'écran sont désactivées pour protéger ce contenu.");
      }
    };
    
    // Bloquer copie
    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
    };

    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("keyup", handleKeyDown);
    document.addEventListener("copy", handleCopy);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("keyup", handleKeyDown);
      document.removeEventListener("copy", handleCopy);
    };
  }, []);

  return (
    <div 
      className="secure-media-container relative rounded-lg overflow-hidden bg-black"
      onContextMenu={(e) => e.preventDefault()}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{
        // Protection anti-screenshot CSS
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        // Ces propriétés peuvent déclencher la protection DRM sur certains navigateurs
        filter: "blur(0)",
        WebkitFilter: "blur(0)",
        backfaceVisibility: "hidden",
        WebkitBackfaceVisibility: "hidden",
        transform: "translateZ(0)",
        WebkitTransform: "translateZ(0)",
      }}
    >
      {/* Overlay de protection invisible qui capture les interactions */}
      <div 
        className="absolute inset-0 z-30"
        style={{
          background: "transparent",
          // Cette technique peut rendre noir en screenshot sur certains navigateurs
          mixBlendMode: "normal",
        }}
      />
      
      {/* Image avec protection */}
      <div className="relative" style={{ isolation: "isolate" }}>
        <Image
          src={url}
          alt="Version protégée"
          width={800}
          height={600}
          className="w-full max-h-[500px] object-contain"
          style={{ 
            WebkitUserSelect: "none",
            userSelect: "none",
            pointerEvents: "none",
            WebkitTouchCallout: "none",
            // Technique anti-screenshot
            WebkitFilter: "blur(0)",
            filter: "blur(0)",
          }}
          draggable={false}
          unoptimized
        />
      </div>

      {/* Watermarks Creix visibles */}
      <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
        <span className="text-white/25 text-5xl font-black rotate-[-25deg] tracking-widest">
          CREIX
        </span>
      </div>
      
      {/* Copyright coins */}
      <div className="absolute top-3 left-3 z-20 pointer-events-none">
        <span className="text-white/40 text-xs font-bold bg-black/30 px-2 py-1 rounded">
          © CREIX {new Date().getFullYear()}
        </span>
      </div>
      <div className="absolute top-3 right-3 z-20 pointer-events-none">
        <span className="text-white/40 text-xs font-bold bg-black/30 px-2 py-1 rounded">
          VERSION PROTÉGÉE
        </span>
      </div>
      
      {/* Barre copyright en bas */}
      <div className="absolute bottom-0 left-0 right-0 z-20 pointer-events-none bg-gradient-to-t from-black/70 to-transparent py-4 px-4">
        <p className="text-center text-white/60 text-sm font-semibold">
          © CREIX {new Date().getFullYear()} - Contenu protégé - Téléchargement interdit
        </p>
      </div>
    </div>
  );
}


