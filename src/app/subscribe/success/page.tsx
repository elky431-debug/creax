"use client";

import { useEffect, useState } from "react";
import { signIn, signOut } from "next-auth/react";

export default function SubscribeSuccessPage() {
  const [status, setStatus] = useState<"checking" | "refreshing" | "done">("checking");

  useEffect(() => {
    async function refreshSession() {
      // Attendre un peu pour que le webhook Stripe soit traité
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setStatus("refreshing");
      
      // Forcer une déconnexion puis reconnexion pour rafraîchir le token
      // On utilise signOut sans redirect, puis signIn
      await signOut({ redirect: false });
      
      // Rediriger vers login avec un message de succès
      window.location.href = "/login?billing=success";
    }

    refreshSession();
  }, []);

  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center">
        {/* Icône de succès */}
        <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
          {status === "done" ? (
            <svg className="w-10 h-10 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-emerald-400 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          )}
        </div>

        <h1 className="text-2xl font-bold text-white mb-2">
          {status === "checking" && "Paiement réussi !"}
          {status === "refreshing" && "Activation en cours..."}
          {status === "done" && "Abonnement activé !"}
        </h1>
        
        <p className="text-gray-400 mb-6">
          {status === "checking" && "Vérification de votre abonnement..."}
          {status === "refreshing" && "Mise à jour de votre session..."}
          {status === "done" && "Redirection vers votre dashboard..."}
        </p>

        <div className="flex justify-center">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    </div>
  );
}

