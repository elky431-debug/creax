"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    // Si pas connecté, rediriger vers login
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Si connecté mais pas d'abonnement actif, rediriger vers pricing
    if (session && !session.user.hasActiveSubscription) {
      router.push("/pricing?subscription_required=true");
    }
  }, [session, status, router]);

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

  // Si pas connecté ou pas d'abonnement, ne rien afficher (redirection en cours)
  if (status === "unauthenticated" || (session && !session.user.hasActiveSubscription)) {
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

  return <>{children}</>;
}






