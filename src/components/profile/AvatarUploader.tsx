"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";

type Props = {
  currentAvatarUrl: string | null;
  displayName: string;
  onAvatarChange?: (newUrl: string | null) => void;
};

type CropState = {
  url: string;
  file: File;
  imgW: number;
  imgH: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function AvatarUploader({ currentAvatarUrl, displayName, onAvatarChange }: Props) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(currentAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop modal
  const [crop, setCrop] = useState<CropState | null>(null);
  const [zoom, setZoom] = useState(1.2);
  const [pan, setPan] = useState({ x: 0, y: 0 }); // px in crop viewport coords
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const initials = displayName.slice(0, 2).toUpperCase();

  const CROP_SIZE = 320; // UI viewport (px)
  const OUTPUT_SIZE = 512; // uploaded avatar size

  const baseScale = useMemo(() => {
    if (!crop) return 1;
    return Math.max(CROP_SIZE / crop.imgW, CROP_SIZE / crop.imgH);
  }, [crop]);

  const overallScale = baseScale * zoom;

  // Keep pan within bounds so the image always covers the crop square
  useEffect(() => {
    if (!crop) return;
    const dispW = crop.imgW * overallScale;
    const dispH = crop.imgH * overallScale;
    const maxX = Math.max(0, (dispW - CROP_SIZE) / 2);
    const maxY = Math.max(0, (dispH - CROP_SIZE) / 2);
    setPan((p) => ({
      x: clamp(p.x, -maxX, maxX),
      y: clamp(p.y, -maxY, maxY)
    }));
  }, [crop, overallScale]);

  function closeCrop() {
    setError(null);
    setZoom(1.2);
    setPan({ x: 0, y: 0 });
    setDragging(false);
    dragStartRef.current = null;
    setCrop((prev) => {
      if (prev?.url) URL.revokeObjectURL(prev.url);
      return null;
    });
    // Reset l'input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadCroppedAvatar() {
    if (!crop) return;
    setUploading(true);
    setError(null);

    try {
      const imgEl = imgRef.current;
      if (!imgEl) {
        throw new Error("Image non chargée");
      }

      // Map crop viewport -> source rect in image coordinates
      const sx = (-CROP_SIZE / 2 - pan.x) / overallScale + crop.imgW / 2;
      const sy = (-CROP_SIZE / 2 - pan.y) / overallScale + crop.imgH / 2;
      const sSize = CROP_SIZE / overallScale;

      const canvas = document.createElement("canvas");
      canvas.width = OUTPUT_SIZE;
      canvas.height = OUTPUT_SIZE;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        throw new Error("Canvas non supporté");
      }

      // Background (jpeg has no alpha)
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      ctx.drawImage(
        imgEl,
        sx,
        sy,
        sSize,
        sSize,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE
      );

      const blob: Blob = await new Promise((resolve, reject) => {
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error("Impossible d'exporter l'image"))),
          "image/jpeg",
          0.88
        );
      });

      const croppedFile = new File([blob], `avatar.jpg`, { type: "image/jpeg" });

      const formData = new FormData();
      formData.append("file", croppedFile);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'upload");
      }

      setAvatarUrl(data.avatarUrl);
      onAvatarChange?.(data.avatarUrl);
      closeCrop();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur lors de l'upload");
      setUploading(false);
    }
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    try {
      // Open crop modal
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        setCrop({
          url,
          file,
          imgW: img.naturalWidth || 1,
          imgH: img.naturalHeight || 1
        });
        setZoom(1.2);
        setPan({ x: 0, y: 0 });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setError("Impossible de lire l'image");
      };
      img.src = url;
    } catch {
      setError("Erreur réseau");
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

      {/* Crop modal */}
      {crop && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg rounded-3xl border border-white/[0.10] bg-[#0a0a0a] p-6 shadow-2xl shadow-black/60">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">Ajuster votre photo</h3>
                <p className="text-sm text-white/50">Déplacez et zoomez pour recadrer.</p>
              </div>
              <button
                type="button"
                onClick={closeCrop}
                className="rounded-xl border border-white/[0.12] bg-white/[0.03] px-3 py-2 text-sm font-semibold text-white/85 hover:bg-white/[0.06]"
              >
                Fermer
              </button>
            </div>

            <div className="flex flex-col items-center gap-5">
              <div
                className="relative overflow-hidden rounded-3xl border border-white/[0.10] bg-black"
                style={{ width: CROP_SIZE, height: CROP_SIZE }}
                onPointerDown={(ev) => {
                  (ev.currentTarget as HTMLDivElement).setPointerCapture(ev.pointerId);
                  setDragging(true);
                  dragStartRef.current = { x: ev.clientX, y: ev.clientY, panX: pan.x, panY: pan.y };
                }}
                onPointerMove={(ev) => {
                  if (!dragging || !dragStartRef.current) return;
                  const dx = ev.clientX - dragStartRef.current.x;
                  const dy = ev.clientY - dragStartRef.current.y;
                  setPan({ x: dragStartRef.current.panX + dx, y: dragStartRef.current.panY + dy });
                }}
                onPointerUp={() => {
                  setDragging(false);
                  dragStartRef.current = null;
                }}
              >
                <img
                  ref={(el) => {
                    imgRef.current = el;
                  }}
                  src={crop.url}
                  alt="Aperçu"
                  className="absolute left-1/2 top-1/2 select-none"
                  draggable={false}
                  style={{
                    width: crop.imgW,
                    height: crop.imgH,
                    transform: `translate(-50%, -50%) scale(${overallScale}) translate(${pan.x / overallScale}px, ${pan.y / overallScale}px)`,
                    transformOrigin: "center",
                    willChange: "transform"
                  }}
                />

                {/* Soft vignette */}
                <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),inset_0_40px_80px_rgba(0,0,0,0.55)]" />
              </div>

              <div className="w-full">
                <div className="flex items-center justify-between text-xs text-white/55 mb-2">
                  <span>Zoom</span>
                  <span>{zoom.toFixed(2)}x</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-cyan-400"
                />
              </div>

              <div className="flex w-full gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setZoom(1.2);
                    setPan({ x: 0, y: 0 });
                  }}
                  disabled={uploading}
                  className="flex-1 rounded-xl border border-white/[0.12] bg-white/[0.03] py-3 text-sm font-semibold text-white/90 transition hover:bg-white/[0.06] disabled:opacity-50"
                >
                  Réinitialiser
                </button>
                <button
                  type="button"
                  onClick={uploadCroppedAvatar}
                  disabled={uploading}
                  className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3 text-sm font-bold text-slate-900 transition hover:shadow-lg hover:shadow-cyan-500/20 disabled:opacity-50"
                >
                  {uploading ? "Upload..." : "Enregistrer"}
                </button>
              </div>

              {error && (
                <p className="w-full text-xs text-red-400">{error}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

















































