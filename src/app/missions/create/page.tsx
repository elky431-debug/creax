"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import SubscriptionGuard from "@/components/SubscriptionGuard";

const MISSION_TYPES = [
  { value: "MINIATURE_YOUTUBE", label: "Miniature YouTube" },
  { value: "MONTAGE_VIDEO", label: "Montage vidéo" },
  { value: "DESIGN_BANNIERE", label: "Design bannière" },
  { value: "MOTION_DESIGN", label: "Motion design" },
  { value: "RETOUCHE_PHOTO", label: "Retouche photo" },
  { value: "AUTRE", label: "Autre" }
];

const BUDGET_RANGES = [
  { value: "LESS_THAN_20", label: "Moins de 20€" },
  { value: "BETWEEN_20_50", label: "20€ - 50€" },
  { value: "BETWEEN_50_150", label: "50€ - 150€" },
  { value: "MORE_THAN_150", label: "Plus de 150€" },
  { value: "CUSTOM", label: "Budget personnalisé" }
];

type AttachmentPreview = {
  file: File;
  preview: string;
};

type ReferencePreview = {
  file: File;
  preview: string;
};

export default function CreateMissionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState("");
  const [deadline, setDeadline] = useState("");
  const [budgetRange, setBudgetRange] = useState("");
  const [budgetCustom, setBudgetCustom] = useState("");
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [references, setReferences] = useState<ReferencePreview[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Rediriger si pas connecté ou pas créateur
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    router.push("/login?callbackUrl=/missions/create");
    return null;
  }

  // Gestion des fichiers
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: AttachmentPreview[] = [];

    Array.from(files).forEach((file) => {
      // Vérifier la taille (10 Mo max)
      if (file.size > 10 * 1024 * 1024) {
        setError(`Le fichier ${file.name} est trop volumineux (max 10 Mo)`);
        return;
      }

      // Créer une preview pour les images
      let preview = "";
      if (file.type.startsWith("image/")) {
        preview = URL.createObjectURL(file);
      }

      newAttachments.push({ file, preview });
    });

    setAttachments((prev) => [...prev, ...newAttachments]);

    // Reset l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => {
      const newList = [...prev];
      // Révoquer l'URL de preview si elle existe
      if (newList[index].preview) {
        URL.revokeObjectURL(newList[index].preview);
      }
      newList.splice(index, 1);
      return newList;
    });
  }

  // Gestion des images de référence
  function handleReferenceSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;

    const newReferences: ReferencePreview[] = [];

    Array.from(files).forEach((file) => {
      // Vérifier que c'est une image
      if (!file.type.startsWith("image/")) {
        setError(`Le fichier ${file.name} n'est pas une image`);
        return;
      }

      // Vérifier la taille (5 Mo max pour les références)
      if (file.size > 5 * 1024 * 1024) {
        setError(`L'image ${file.name} est trop volumineuse (max 5 Mo)`);
        return;
      }

      // Limite de 6 références
      if (references.length + newReferences.length >= 6) {
        setError("Vous pouvez ajouter maximum 6 images de référence");
        return;
      }

      const preview = URL.createObjectURL(file);
      newReferences.push({ file, preview });
    });

    setReferences((prev) => [...prev, ...newReferences]);

    // Reset l'input
    if (referenceInputRef.current) {
      referenceInputRef.current.value = "";
    }
  }

  function removeReference(index: number) {
    setReferences((prev) => {
      const newList = [...prev];
      URL.revokeObjectURL(newList[index].preview);
      newList.splice(index, 1);
      return newList;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // Validation
    if (!title.trim()) {
      setError("Veuillez remplir le titre de la mission");
      return;
    }
    if (title.length < 3 || title.length > 100) {
      setError("Le titre doit contenir entre 3 et 100 caractères");
      return;
    }
    if (!description.trim()) {
      setError("Veuillez remplir la description de la mission");
      return;
    }
    if (description.length < 10) {
      setError("La description doit contenir au moins 10 caractères");
      return;
    }
    if (!type) {
      setError("Veuillez sélectionner un type de mission");
      return;
    }

    setLoading(true);

    try {
      // Créer la mission
      const res = await fetch("/api/missions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          type,
          deadline: deadline || null,
          budgetRange: budgetRange || null,
          budgetCustom: budgetRange === "CUSTOM" && budgetCustom ? parseInt(budgetCustom) : null
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la création de la mission");
        setLoading(false);
        return;
      }

      const missionId = data.mission.id;

      // Upload des pièces jointes
      for (const attachment of attachments) {
        const formData = new FormData();
        formData.append("file", attachment.file);
        formData.append("missionId", missionId);
        formData.append("type", "attachment");

        await fetch("/api/missions/attachments", {
          method: "POST",
          body: formData
        });
      }

      // Upload des images de référence
      for (const reference of references) {
        const formData = new FormData();
        formData.append("file", reference.file);
        formData.append("missionId", missionId);
        formData.append("type", "reference");

        await fetch("/api/missions/attachments", {
          method: "POST",
          body: formData
        });
      }

      setSuccess(true);

      // Rediriger après 2 secondes
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch {
      setError("Erreur réseau lors de la création de la mission");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
            <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Mission publiée !</h2>
          <p className="text-slate-400">
            Les graphistes/monteurs peuvent maintenant postuler.
          </p>
          <p className="text-sm text-slate-500 mt-4">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionGuard>
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-4 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour au dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Créer une mission</h1>
          <p className="mt-2 text-slate-400">
            Décrivez votre besoin pour trouver le talent idéal.
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Titre */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
            <label className="block text-sm font-medium text-white mb-2">
              Nom de la mission <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Miniature YouTube pour vidéo gaming"
              maxLength={100}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <p className="mt-2 text-xs text-slate-500">{title.length}/100 caractères</p>
          </div>

          {/* Description */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
            <label className="block text-sm font-medium text-white mb-2">
              Description détaillée <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez ce que vous voulez, votre style, les références visuelles, les contraintes techniques..."
              rows={6}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
            />
            <p className="mt-2 text-xs text-slate-500">Minimum 10 caractères</p>
          </div>

          {/* Exemples / Références visuelles */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
            <label className="block text-sm font-medium text-white mb-2">
              Exemples de miniatures à reproduire <span className="text-slate-500">(optionnel)</span>
            </label>
            <p className="text-xs text-slate-400 mb-4">
              Ajoutez des exemples de miniatures ou designs que vous aimez et souhaitez reproduire. Cela aide le graphiste à comprendre votre style. <span className="text-cyan-400">Maximum 6 images.</span>
            </p>

            {/* Grille d'images de référence */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {references.map((ref, index) => (
                <div key={index} className="relative group aspect-video rounded-lg overflow-hidden bg-slate-800">
                  <Image
                    src={ref.preview}
                    alt={`Référence ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                  {/* Overlay avec bouton supprimer */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      onClick={() => removeReference(index)}
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-400 transition"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {/* Badge numéro */}
                  <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-xs font-bold text-slate-900">
                    {index + 1}
                  </div>
                </div>
              ))}

              {/* Bouton ajouter */}
              {references.length < 6 && (
                <button
                  type="button"
                  onClick={() => referenceInputRef.current?.click()}
                  className="aspect-video rounded-lg border-2 border-dashed border-slate-700 flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-cyan-500 hover:text-cyan-400 hover:bg-slate-800/50 transition cursor-pointer"
                >
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span className="text-xs font-medium">Ajouter</span>
                </button>
              )}
            </div>

            <input
              ref={referenceInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleReferenceSelect}
              className="hidden"
            />

            {/* Conseil */}
            <div className="rounded-lg bg-cyan-500/10 border border-cyan-500/20 p-3 flex items-start gap-3">
              <svg className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-cyan-300">
                <strong>Conseil :</strong> Ajoutez des miniatures de YouTubers que vous admirez, des designs qui vous inspirent, ou des exemples de ce que vous aimeriez obtenir. Plus vous êtes précis, meilleur sera le résultat !
              </p>
            </div>
          </div>

          {/* Type de mission */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
            <label className="block text-sm font-medium text-white mb-3">
              Type de mission <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MISSION_TYPES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                    type === option.value
                      ? "border-cyan-500 bg-cyan-500/20 text-cyan-400"
                      : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Deadline */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
            <label className="block text-sm font-medium text-white mb-2">
              Deadline souhaitée <span className="text-slate-500">(optionnel)</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Budget */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
            <label className="block text-sm font-medium text-white mb-3">
              Budget <span className="text-slate-500">(optionnel)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BUDGET_RANGES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBudgetRange(option.value)}
                  className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                    budgetRange === option.value
                      ? "border-emerald-500 bg-emerald-500/20 text-emerald-400"
                      : "border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {budgetRange === "CUSTOM" && (
              <div className="mt-4">
                <label className="block text-xs text-slate-400 mb-1">
                  Montant en euros
                </label>
                <input
                  type="number"
                  value={budgetCustom}
                  onChange={(e) => setBudgetCustom(e.target.value)}
                  placeholder="150"
                  min="1"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Pièces jointes */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
            <label className="block text-sm font-medium text-white mb-3">
              Pièces jointes <span className="text-slate-500">(optionnel)</span>
            </label>
            <p className="text-xs text-slate-400 mb-4">
              Ajoutez des références visuelles, exemples ou documents. Max 10 Mo par fichier.
            </p>

            {/* Zone de drop */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="rounded-xl border-2 border-dashed border-slate-700 p-6 text-center cursor-pointer transition hover:border-slate-600 hover:bg-slate-800/50"
            >
              <svg className="mx-auto h-10 w-10 text-slate-500 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-sm text-slate-400">
                Cliquez pour ajouter des fichiers
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Images, PDF, vidéos
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf,video/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Liste des fichiers */}
            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((att, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-lg bg-slate-800 p-3"
                  >
                    {att.preview ? (
                      <img
                        src={att.preview}
                        alt={att.file.name}
                        className="h-10 w-10 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded bg-slate-700">
                        <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{att.file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(att.file.size / 1024 / 1024).toFixed(2)} Mo
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-700 hover:text-white transition"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Erreur */}
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-cyan-500 py-4 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Publication...
                </span>
              ) : (
                "Publier la mission"
              )}
            </button>
            <Link
              href="/dashboard"
              className="rounded-xl border border-slate-700 bg-slate-800 px-8 py-4 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Annuler
            </Link>
          </div>
        </form>
      </div>
    </div>
    </SubscriptionGuard>
  );
}

