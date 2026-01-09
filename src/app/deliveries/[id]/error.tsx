"use client";

import { useEffect } from "react";

export default function DeliveryError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log côté client pour debug (visible dans console navigateur)
    console.error("Delivery page error:", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-6">
      <div className="max-w-xl w-full rounded-2xl border border-white/[0.10] bg-white/[0.03] p-6">
        <h1 className="text-xl font-bold text-white">Erreur sur la livraison</h1>
        <p className="mt-2 text-sm text-white/60">
          Une erreur côté client est survenue. Cliquez sur “Réessayer”.
        </p>

        <div className="mt-4 rounded-xl bg-black/40 border border-white/[0.08] p-4">
          <p className="text-xs font-semibold text-white/70 mb-1">Message</p>
          <p className="text-xs text-white/60 break-words">{error.message}</p>
          {error.digest && (
            <>
              <p className="text-xs font-semibold text-white/70 mt-3 mb-1">Digest</p>
              <p className="text-xs text-white/60 break-words">{error.digest}</p>
            </>
          )}
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={reset}
            className="flex-1 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 py-3 text-sm font-bold text-slate-900"
          >
            Réessayer
          </button>
          <button
            type="button"
            onClick={() => (window.location.href = "/deliveries")}
            className="rounded-xl border border-white/[0.12] bg-white/[0.03] px-4 py-3 text-sm font-semibold text-white/90 hover:bg-white/[0.06]"
          >
            Retour
          </button>
        </div>
      </div>
    </div>
  );
}


