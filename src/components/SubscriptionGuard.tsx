"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
}

export default function SubscriptionGuard({ children }: SubscriptionGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);

  // Vérifier l'abonnement directement depuis la base de données
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    // Vérifier l'abonnement depuis l'API
    async function checkSubscription() {
      try {
        const res = await fetch("/api/subscription");
        if (res.ok) {
          const data = await res.json();
          setHasSubscription(data.hasSubscription);
          
          if (!data.hasSubscription) {
            router.push("/pricing?subscription_required=true");
          }
        } else {
          // En cas d'erreur, utiliser la valeur de la session
          setHasSubscription(session?.user?.hasActiveSubscription ?? false);
          if (!session?.user?.hasActiveSubscription) {
            router.push("/pricing?subscription_required=true");
          }
        }
      } catch {
        // En cas d'erreur, utiliser la valeur de la session
        setHasSubscription(session?.user?.hasActiveSubscription ?? false);
        if (!session?.user?.hasActiveSubscription) {
          router.push("/pricing?subscription_required=true");
        }
      } finally {
        setChecking(false);
      }
    }

    checkSubscription();
  }, [session, status, router]);

  // Afficher un loader pendant la vérification
  if (status === "loading" || checking) {
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
  if (status === "unauthenticated" || !hasSubscription) {
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







