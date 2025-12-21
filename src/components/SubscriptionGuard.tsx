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
  // Vérifier l'authentification et le rôle (pas l'abonnement pour l'instant)
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Si des rôles sont spécifiés, vérifier que l'utilisateur a le bon rôle
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = session?.user?.role as "CREATOR" | "DESIGNER" | undefined;
      if (userRole && !allowedRoles.includes(userRole)) {
        router.push("/dashboard");
      }
    }
  }, [session, status, router, allowedRoles]);

  // Afficher un loader pendant la vérification
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







