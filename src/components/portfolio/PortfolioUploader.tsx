"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";

type PortfolioImage = {
  id: string;
  url: string;
  filename: string;
  title: string | null;
  description: string | null;
  order: number;
};

export function PortfolioUploader() {
  const [images, setImages] = useState<PortfolioImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Charger les images existantes
  useEffect(() => {
    async function fetchImages() {
      try {
        const res = await fetch("/api/portfolio");
        if (res.ok) {
          const data = await res.json();
          setImages(data.images || []);
        }
      } catch {
        setError("Erreur lors du chargement du portfolio");
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, []);

  // Upload d'un fichier
  async function uploadFile(file: File) {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/portfolio", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'upload");
        return;
      }

      setImages((prev) => [...prev, data.image]);
    } catch {
      setError("Erreur réseau lors de l'upload");
    } finally {
      setUploading(false);
    }
  }

  // Gestion du drag & drop
  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFiles = files.filter((f) => f.type.startsWith("image/"));

    if (imageFiles.length > 0) {
      // Upload le premier fichier (ou tous si tu veux)
      imageFiles.forEach((file) => uploadFile(file));
    }
  }

  // Gestion du clic sur le bouton
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files && files.length > 0) {
      Array.from(files).forEach((file) => uploadFile(file));
    }
    // Reset l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  // Supprimer une image
  async function handleDelete(imageId: string) {
    if (!confirm("Supprimer cette image ?")) return;

    try {
      const res = await fetch(`/api/portfolio/${imageId}`, {
        method: "DELETE"
      });

      if (res.ok) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la suppression");
      }
    } catch {
      setError("Erreur réseau");
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
        <div className="flex items-center justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Mon Portfolio
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {images.length}/12 images • Formats : JPG, PNG, WebP, GIF • Max 5 Mo
          </p>
        </div>
      </div>

      {/* Zone de drop */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative mb-6 rounded-xl border-2 border-dashed p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-cyan-500 bg-cyan-500/10"
            : "border-slate-700 hover:border-slate-600 hover:bg-slate-800/50"
        } ${uploading ? "pointer-events-none opacity-50" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <p className="text-sm text-slate-400">Upload en cours...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-slate-800">
              <svg className="h-7 w-7 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-white">
                Glissez-déposez vos images ici
              </p>
              <p className="text-xs text-slate-500 mt-1">
                ou cliquez pour sélectionner
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Erreur */}
      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-300 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grille d'images */}
      {images.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image) => (
            <div
              key={image.id}
              className="group relative aspect-square rounded-xl overflow-hidden bg-slate-800"
            >
              <Image
                src={image.url}
                alt={image.title || "Portfolio image"}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
              />
              {/* Overlay au hover */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                <button
                  onClick={() => handleDelete(image.id)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/80 text-white hover:bg-red-500 transition"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-sm text-slate-500">
            Aucune image dans votre portfolio.
          </p>
          <p className="text-xs text-slate-600 mt-1">
            Ajoutez vos meilleures créations pour attirer les créateurs !
          </p>
        </div>
      )}
    </div>
  );
}





































