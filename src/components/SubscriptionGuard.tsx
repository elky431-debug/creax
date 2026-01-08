"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  allowedRoles?: ("CREATOR" | "DESIGNER")[];
}

export default function SubscriptionGuard({ children, allowedRoles }: SubscriptionGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  // Guard léger: pas d'appel réseau (le middleware fait foi).
  // Objectif: réduire la latence perçue (évite un fetch /api/subscription/check à chaque page).
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }

    const hasActiveSubscription = session?.user?.hasActiveSubscription === true;
    if (!hasActiveSubscription) {
      router.replace("/subscribe");
      return;
    }

    // Si des rôles sont spécifiés, vérifier que l'utilisateur a le bon rôle
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = session?.user?.role as "CREATOR" | "DESIGNER" | undefined;
      if (userRole && !allowedRoles.includes(userRole)) {
        router.replace("/dashboard");
      }
    }
  }, [session, status, router, allowedRoles]);

  // Afficher un loader pendant le chargement de session
  if (status === "loading") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-cyan-500/30 rounded-full animate-spin border-t-cyan-500"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent rounded-full animate-spin border-b-purple-500" style={{ animationDirection: "reverse", animationDuration: "1.5s" }}></div>
        </div>
      </div>
    );
  }

  // Si pas connecté, ne rien afficher (redirection en cours)
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 border-4 border-cyan-500/30 rounded-full animate-spin border-t-cyan-500 mx-auto"></div>
          </div>
          <p className="text-white/60">Redirection en cours...</p>
        </div>
      </div>
    );
  }

  // Si pas d'abonnement (token), ne rien afficher (redirection en cours)
  if (session?.user?.hasActiveSubscription !== true) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="relative mb-4">
            <div className="w-16 h-16 border-4 border-cyan-500/30 rounded-full animate-spin border-t-cyan-500 mx-auto"></div>
          </div>
          <p className="text-white/60">Redirection vers abonnement...</p>
        </div>
      </div>
    );
  }

  // Vérifier le rôle si spécifié
  if (allowedRoles && allowedRoles.length > 0) {
    const userRole = session?.user?.role as "CREATOR" | "DESIGNER" | undefined;
    if (userRole && !allowedRoles.includes(userRole)) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="relative mb-4">
              <div className="w-16 h-16 border-4 border-cyan-500/30 rounded-full animate-spin border-t-cyan-500 mx-auto"></div>
            </div>
            <p className="text-white/60">Redirection en cours...</p>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}







