/**
 * Page pour envoyer une version protégée
 * 
 * Le freelance upload son travail et CREIX ajoute automatiquement le watermark
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
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
  type: string;
  description: string;
  budgetCustom: number | null;
  creator: {
    id: string;
    profile: {
      displayName: string;
      avatarUrl: string | null;
    } | null;
  };
};

type UploadState = {
  file: File | null;
  preview: string | null;
  uploading: boolean;
  progress: number;
  error: string | null;
};

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

export default function SendDeliveryPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();

  const missionId = params.missionId as string;

  const [mission, setMission] = useState<Mission | null>(null);
  const [loading, setLoading] = useState(true);
  const [upload, setUpload] = useState<UploadState>({
    file: null,
    preview: null,
    uploading: false,
    progress: 0,
    error: null
  });
  const [note, setNote] = useState("");
  const [price, setPrice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Vérifier l'authentification
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/deliveries/send/" + missionId);
      return;
    }

    if (session?.user?.role !== "DESIGNER") {
      router.push("/dashboard");
      return;
    }
  }, [status, session, router, missionId]);

  // Charger la mission
  const fetchMission = useCallback(async () => {
    try {
      const res = await fetch(`/api/missions/${missionId}`);
      
      if (res.status === 404) {
        router.push("/dashboard");
        return;
      }

      if (res.ok) {
        const data = await res.json();
        setMission(data.mission);
        
        // Pré-remplir le prix si disponible
        if (data.mission.budgetCustom) {
          setPrice(data.mission.budgetCustom.toString());
        }
      }
    } catch (error) {
      console.error("Erreur chargement mission:", error);
    } finally {
      setLoading(false);
    }
  }, [missionId, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchMission();
    }
  }, [status, fetchMission]);

  // Gérer la sélection de fichier
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Vérifier le type
    const isImage = file.type.startsWith("image/");
    const isVideo = file.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setUpload(prev => ({ ...prev, error: "Type de fichier non supporté" }));
      return;
    }

    // Vérifier la taille (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setUpload(prev => ({ ...prev, error: "Fichier trop volumineux (max 50MB)" }));
      return;
    }

    // Créer la preview
    const preview = URL.createObjectURL(file);

    setUpload({
      file,
      preview,
      uploading: false,
      progress: 0,
      error: null
    });
  }

  // Supprimer le fichier sélectionné
  function handleRemoveFile() {
    if (upload.preview) {
      URL.revokeObjectURL(upload.preview);
    }
    setUpload({
      file: null,
      preview: null,
      uploading: false,
      progress: 0,
      error: null
    });
  }

  // Soumettre la livraison
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!upload.file) {
      setUpload(prev => ({ ...prev, error: "Veuillez sélectionner un fichier" }));
      return;
    }

    const priceNum = parseInt(price);
    if (!price || isNaN(priceNum) || priceNum <= 0) {
      setUpload(prev => ({ ...prev, error: "Veuillez indiquer un prix valide (nombre entier positif)" }));
      return;
    }

    setSubmitting(true);
    setUpload(prev => ({ ...prev, uploading: true, error: null }));

    try {
      // 1. Upload du fichier avec watermark automatique
      const formData = new FormData();
      formData.append("file", upload.file);
      formData.append("missionId", missionId);
      formData.append("mode", "protected");

      const uploadRes = await fetch("/api/deliveries/upload", {
        method: "POST",
        body: formData
      });

      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      const uploadData = await uploadRes.json();

      // 2. Créer la livraison
      const deliveryRes = await fetch("/api/deliveries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          missionId,
          protectedUrl: uploadData.url,
          protectedType: uploadData.type,
          protectedNote: note || undefined,
          amount: priceNum * 100 // Convertir en centimes
        })
      });

      if (!deliveryRes.ok) {
        const data = await deliveryRes.json();
        throw new Error(data.error || "Erreur lors de la création de la livraison");
      }

      const deliveryData = await deliveryRes.json();

      setSuccess(true);

      // Rediriger vers la page de la livraison après 2 secondes
      setTimeout(() => {
        router.push(`/deliveries/${deliveryData.delivery.id}`);
      }, 2000);

    } catch (error: any) {
      setUpload(prev => ({ 
        ...prev, 
        uploading: false, 
        error: error.message || "Erreur lors de l'envoi" 
      }));
    } finally {
      setSubmitting(false);
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

  if (!mission) {
    return null;
  }

  const creatorName = mission.creator.profile?.displayName || "Créateur";

  return (
    <SubscriptionGuard allowedRoles={["DESIGNER"]}>
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-2xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour
          </Link>

          <h1 className="text-2xl font-bold text-white">Envoyer une livraison</h1>
          <p className="mt-2 text-slate-400">
            Uploadez votre travail - CREIX ajoutera automatiquement un watermark de protection
          </p>
        </div>

        {/* Succès */}
        {success && (
          <div className="mb-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
              <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-emerald-400">Livraison envoyée !</h2>
            <p className="mt-2 text-sm text-slate-400">
              Le créateur va recevoir votre version protégée avec watermark CREIX.
            </p>
            <p className="mt-1 text-sm text-slate-500">Redirection en cours...</p>
          </div>
        )}

        {/* Infos mission */}
        <div className="mb-8 rounded-xl bg-slate-900/80 border border-slate-800 p-6">
          <h2 className="text-lg font-semibold text-white mb-2">{mission.title}</h2>
          <p className="text-sm text-slate-400 mb-4">{mission.description}</p>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-sm font-bold text-slate-900 overflow-hidden">
              {mission.creator.profile?.avatarUrl ? (
                <Image
                  src={mission.creator.profile.avatarUrl}
                  alt={creatorName}
                  width={40}
                  height={40}
                  className="h-full w-full object-cover"
                />
              ) : (
                creatorName.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{creatorName}</p>
              <p className="text-xs text-slate-500">Créateur</p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        {!success && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Zone d'upload */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Fichier à livrer
              </label>

              {!upload.file ? (
                <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-slate-700 rounded-xl bg-slate-900/50 cursor-pointer hover:border-cyan-500/50 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <svg className="w-12 h-12 mb-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className="mb-2 text-sm text-slate-400">
                      <span className="font-semibold text-cyan-400">Cliquez pour uploader</span> ou glissez-déposez
                    </p>
                    <p className="text-xs text-slate-500">
                      JPG, PNG, WebP, MP4, MOV, WebM (max 50MB)
                    </p>
                    <p className="mt-3 text-xs text-emerald-400/70">
                      ✓ Le watermark CREIX sera ajouté automatiquement
                    </p>
                  </div>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                    onChange={handleFileSelect}
                  />
                </label>
              ) : (
                <div className="relative rounded-xl bg-slate-900/80 border border-slate-800 p-4">
                  {/* Preview */}
                  <div className="relative rounded-lg overflow-hidden bg-black mb-4">
                    {upload.file.type.startsWith("image/") ? (
                      <Image
                        src={upload.preview!}
                        alt="Preview"
                        width={600}
                        height={400}
                        className="w-full max-h-64 object-contain"
                      />
                    ) : (
                      <video
                        src={upload.preview!}
                        controls
                        className="w-full max-h-64"
                      />
                    )}
                    
                    {/* Overlay watermark preview */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center transform -rotate-12">
                        <p className="text-white/30 text-2xl font-bold">CREIX</p>
                        <p className="text-white/20 text-sm">VERSION PROTÉGÉE</p>
                      </div>
                    </div>
                  </div>

                  {/* Infos fichier */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white truncate max-w-xs">
                        {upload.file.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(upload.file.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/20 transition"
                    >
                      Supprimer
                    </button>
                  </div>

                  {/* Note watermark */}
                  <div className="mt-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-3">
                    <p className="text-xs text-emerald-400">
                      ✓ Un watermark CREIX sera automatiquement ajouté pour protéger votre travail
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Prix */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Prix de la livraison (€)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={price}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    setPrice(val);
                  }}
                  placeholder="Ex: 50"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 pr-12 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500">€</span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Le créateur devra payer ce montant pour recevoir la version finale
              </p>
            </div>

            {/* Note */}
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Note pour le créateur (optionnel)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Expliquez votre travail, les choix créatifs, etc."
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
              />
            </div>

            {/* Erreur */}
            {upload.error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                {upload.error}
              </div>
            )}

            {/* Bouton submit */}
            <button
              type="submit"
              disabled={submitting || !upload.file}
              className="w-full rounded-lg bg-cyan-500 py-4 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Upload et ajout du watermark...
                </span>
              ) : (
                "Envoyer la version protégée"
              )}
            </button>

            {/* Info sécurité */}
            <div className="rounded-lg bg-slate-800/50 p-4">
              <h3 className="text-sm font-medium text-white mb-2">🛡️ Protection de votre travail</h3>
              <ul className="text-xs text-slate-400 space-y-1">
                <li>• CREIX ajoute automatiquement un watermark visible</li>
                <li>• Le créateur ne peut pas télécharger la version protégée</li>
                <li>• La version finale n'est envoyée qu'après paiement</li>
                <li>• Vous gardez le contrôle total sur votre travail</li>
              </ul>
            </div>
          </form>
        )}
      </div>
    </div>
    </SubscriptionGuard>
  );
}
