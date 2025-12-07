"use client";

import { useState, useRef } from "react";
import Image from "next/image";

type Props = {
  currentAvatarUrl: string | null;
  displayName: string;
  onAvatarChange?: (newUrl: string | null) => void;
};

export function AvatarUploader({ currentAvatarUrl, displayName, onAvatarChange }: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = displayName.slice(0, 2).toUpperCase();

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'upload");
        return;
      }

      setAvatarUrl(data.avatarUrl);
      onAvatarChange?.(data.avatarUrl);
    } catch {
      setError("Erreur réseau");
    } finally {
      setUploading(false);
      // Reset l'input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  async function handleRemove() {
    if (!avatarUrl) return;
    if (!confirm("Supprimer votre photo de profil ?")) return;

    setUploading(true);
    setError(null);

    try {
      const res = await fetch("/api/profile/avatar", {
        method: "DELETE"
      });

      if (res.ok) {
        setAvatarUrl(null);
        onAvatarChange?.(null);
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la suppression");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex items-center gap-6">
      {/* Avatar */}
      <div className="relative group">
        {avatarUrl ? (
          <div className="relative h-24 w-24 rounded-2xl overflow-hidden">
            <Image
              src={avatarUrl}
              alt={displayName}
              fill
              className="object-cover"
              sizes="96px"
            />
          </div>
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-2xl font-bold text-slate-900">
            {initials}
          </div>
        )}

        {/* Overlay au hover */}
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 flex items-center justify-center rounded-2xl bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer disabled:cursor-not-allowed"
        >
          {uploading ? (
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          ) : (
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          )}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Infos et actions */}
      <div className="flex-1">
        <h3 className="text-sm font-medium text-white mb-1">Photo de profil</h3>
        <p className="text-xs text-slate-400 mb-3">
          JPG, PNG ou WebP. Max 2 Mo.
        </p>
        
        <div className="flex gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {uploading ? "Upload..." : avatarUrl ? "Changer" : "Ajouter"}
          </button>
          
          {avatarUrl && (
            <button
              onClick={handleRemove}
              disabled={uploading}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
            >
              Supprimer
            </button>
          )}
        </div>

        {/* Erreur */}
        {error && (
          <p className="mt-2 text-xs text-red-400">{error}</p>
        )}
      </div>
    </div>
  );
}




























