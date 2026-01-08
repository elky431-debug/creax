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
  const formRef = useRef<HTMLFormElement>(null);
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
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-white/10 border-t-cyan-500 animate-spin" />
          <div
            className="absolute inset-0 h-12 w-12 rounded-full border-2 border-emerald-500/20 border-b-emerald-500 animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1.2s" }}
          />
        </div>
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
      <div className="min-h-screen bg-black relative overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[650px] bg-gradient-to-b from-cyan-500/[0.08] via-emerald-500/[0.035] to-transparent blur-[110px]" />
          <div className="absolute -bottom-56 left-0 w-[700px] h-[700px] bg-gradient-to-tr from-emerald-500/[0.06] via-cyan-500/[0.02] to-transparent blur-[120px]" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black" />
        </div>

        <div className="relative text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/15 border border-emerald-500/20">
            <svg className="h-8 w-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Mission publiée !</h2>
          <p className="text-white/60">
            Les graphistes/monteurs peuvent maintenant postuler.
          </p>
          <p className="text-sm text-white/40 mt-4">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <SubscriptionGuard allowedRoles={["CREATOR"]}>
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] bg-gradient-to-b from-cyan-500/[0.08] via-emerald-500/[0.035] to-transparent blur-[110px]" />
        <div className="absolute -bottom-56 left-0 w-[700px] h-[700px] bg-gradient-to-tr from-emerald-500/[0.06] via-cyan-500/[0.02] to-transparent blur-[120px]" />
        <div className="absolute -bottom-56 right-0 w-[700px] h-[700px] bg-gradient-to-tl from-cyan-500/[0.06] via-emerald-500/[0.02] to-transparent blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black" />
      </div>

      <div className="relative z-10 mx-auto max-w-3xl px-4 py-10 pb-28">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-4 transition"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour au dashboard
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] border border-white/10 px-4 py-2 mb-4 backdrop-blur-sm">
            <svg className="h-4 w-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">Nouvelle mission</span>
          </div>
          <h1 className="text-4xl font-black text-white">Créer une mission</h1>
          <p className="mt-2 text-white/50">
            Décrivez votre besoin pour trouver le talent idéal.
          </p>
        </div>

        {/* Formulaire */}
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Titre */}
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/12 via-transparent to-emerald-500/12" />
            <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0a] border border-white/[0.08]" />
            <div className="relative p-6">
            <label className="block text-sm font-medium text-white mb-2">
              Nom de la mission <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Miniature YouTube pour vidéo gaming"
              maxLength={100}
              className="w-full rounded-xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
            />
            <p className="mt-2 text-xs text-white/35">{title.length}/100 caractères</p>
            </div>
          </div>

          {/* Description */}
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
            <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0a] border border-white/[0.08]" />
            <div className="relative p-6">
            <label className="block text-sm font-medium text-white mb-2">
              Description détaillée <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez ce que vous voulez, votre style, les références visuelles, les contraintes techniques..."
              rows={6}
              className="w-full rounded-xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none resize-none transition-colors"
            />
            <p className="mt-2 text-xs text-white/35">Minimum 10 caractères</p>
            </div>
          </div>

          {/* Exemples / Références visuelles */}
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
            <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0a] border border-white/[0.08]" />
            <div className="relative p-6">
            <label className="block text-sm font-medium text-white mb-2">
              Exemples de miniatures à reproduire <span className="text-slate-500">(optionnel)</span>
            </label>
            <p className="text-xs text-white/45 mb-4">
              Ajoutez des exemples de miniatures ou designs que vous aimez et souhaitez reproduire. Cela aide le graphiste à comprendre votre style. <span className="text-cyan-400">Maximum 6 images.</span>
            </p>

            {/* Grille d'images de référence */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
              {references.map((ref, index) => (
                <div key={index} className="relative group aspect-video rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.08]">
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
                      className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/90 text-white hover:bg-red-500 transition shadow-lg shadow-red-500/25"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                  {/* Badge numéro */}
                  <div className="absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-xs font-black text-slate-900 ring-2 ring-black/40">
                    {index + 1}
                  </div>
                </div>
              ))}

              {/* Bouton ajouter */}
              {references.length < 6 && (
                <button
                  type="button"
                  onClick={() => referenceInputRef.current?.click()}
                  className="aspect-video rounded-xl border-2 border-dashed border-white/[0.14] bg-white/[0.02] flex flex-col items-center justify-center gap-2 text-white/50 hover:border-cyan-500/50 hover:text-cyan-300 hover:bg-white/[0.04] transition cursor-pointer"
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
            <div className="rounded-2xl bg-cyan-500/10 border border-cyan-500/20 p-4 flex items-start gap-3">
              <svg className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-cyan-300">
                <strong>Conseil :</strong> Ajoutez des miniatures de YouTubers que vous admirez, des designs qui vous inspirent, ou des exemples de ce que vous aimeriez obtenir. Plus vous êtes précis, meilleur sera le résultat !
              </p>
            </div>
            </div>
          </div>

          {/* Type de mission */}
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
            <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0a] border border-white/[0.08]" />
            <div className="relative p-6">
            <label className="block text-sm font-medium text-white mb-3">
              Type de mission <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {MISSION_TYPES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    type === option.value
                      ? "border-cyan-500/40 bg-cyan-500/15 text-cyan-200 shadow-lg shadow-cyan-500/10"
                      : "border-white/[0.10] bg-white/[0.03] text-white/70 hover:bg-white/[0.05] hover:border-white/[0.16]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            </div>
          </div>

          {/* Deadline */}
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
            <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0a] border border-white/[0.08]" />
            <div className="relative p-6">
            <label className="block text-sm font-medium text-white mb-2">
              Deadline souhaitée <span className="text-slate-500">(optionnel)</span>
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              min={new Date().toISOString().split("T")[0]}
              className="w-full rounded-xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
            />
            </div>
          </div>

          {/* Budget */}
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
            <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0a] border border-white/[0.08]" />
            <div className="relative p-6">
            <label className="block text-sm font-medium text-white mb-3">
              Budget <span className="text-slate-500">(optionnel)</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {BUDGET_RANGES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBudgetRange(option.value)}
                  className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                    budgetRange === option.value
                      ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-200 shadow-lg shadow-emerald-500/10"
                      : "border-white/[0.10] bg-white/[0.03] text-white/70 hover:bg-white/[0.05] hover:border-white/[0.16]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {budgetRange === "CUSTOM" && (
              <div className="mt-4">
                <label className="block text-xs text-white/50 mb-1">
                  Montant en euros
                </label>
                <input
                  type="number"
                  value={budgetCustom}
                  onChange={(e) => setBudgetCustom(e.target.value)}
                  placeholder="150"
                  min="1"
                  className="w-full rounded-xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 text-sm text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
                />
              </div>
            )}
            </div>
          </div>

          {/* Pièces jointes */}
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
            <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0a] border border-white/[0.08]" />
            <div className="relative p-6">
            <label className="block text-sm font-medium text-white mb-3">
              Pièces jointes <span className="text-slate-500">(optionnel)</span>
            </label>
            <p className="text-xs text-white/45 mb-4">
              Ajoutez des références visuelles, exemples ou documents. Max 10 Mo par fichier.
            </p>

            {/* Zone de drop */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="rounded-2xl border-2 border-dashed border-white/[0.14] bg-white/[0.02] p-7 text-center cursor-pointer transition hover:border-white/[0.20] hover:bg-white/[0.04]"
            >
              <svg className="mx-auto h-10 w-10 text-white/35 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <p className="text-sm text-white/55">
                Cliquez pour ajouter des fichiers
              </p>
              <p className="text-xs text-white/35 mt-1">
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
                    className="flex items-center gap-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] p-3"
                  >
                    {att.preview ? (
                      <img
                        src={att.preview}
                        alt={att.file.name}
                        className="h-10 w-10 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/[0.08]">
                        <svg className="h-5 w-5 text-white/45" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{att.file.name}</p>
                      <p className="text-xs text-white/35">
                        {(att.file.size / 1024 / 1024).toFixed(2)} Mo
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeAttachment(index)}
                      className="flex h-9 w-9 items-center justify-center rounded-xl text-white/45 hover:bg-white/[0.06] hover:text-white transition"
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
          </div>

          {/* Erreur */}
          {error && (
            <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Boutons */}
          <div className="h-2" />
        </form>
      </div>

      {/* Sticky action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-xl border-t border-white/[0.06]" />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
        <div className="relative mx-auto max-w-3xl px-4 py-4 flex gap-3">
          <button
            type="button"
            disabled={loading}
            onClick={() => {
              formRef.current?.requestSubmit();
            }}
            className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-4 text-sm font-bold text-slate-900 transition hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 rounded-full border-2 border-slate-900/30 border-t-slate-900 animate-spin" />
                Publication...
              </span>
            ) : (
              "Publier la mission"
            )}
          </button>
          <Link
            href="/dashboard"
            className="rounded-xl border border-white/[0.12] bg-white/[0.03] px-8 py-4 text-sm font-semibold text-white/90 transition hover:bg-white/[0.06]"
          >
            Annuler
          </Link>
        </div>
      </div>
    </div>
    </SubscriptionGuard>
  );
}

