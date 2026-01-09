"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SubscribeSuccessPage() {
  const router = useRouter();

  useEffect(() => {
    async function syncAndRedirect() {
      try {
        // Auto-réparation: synchroniser immédiatement Stripe -> DB pour lever la paywall
        await fetch("/api/subscription/sync-now", { method: "POST" });
      } catch {
        // ignore
      } finally {
        router.replace("/dashboard");
      }
    }

    syncAndRedirect();
  }, [router]);

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        {/* Icône de succès */}
        <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          Paiement réussi
        </h1>
        
        <p className="text-gray-400 mb-6">
          Activation de votre abonnement...
        </p>

        <div className="flex justify-center">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>

        <p className="mt-6 text-sm text-gray-500">
          Redirection vers votre dashboard...
        </p>
      </div>
    </div>
  );
}

