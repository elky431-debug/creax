"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface SubscriptionGuardProps {
  children: React.ReactNode;
  allowedRoles?: ("CREATOR" | "DESIGNER")[];
}

export default function SubscriptionGuard({ children, allowedRoles }: SubscriptionGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSubscription, setHasSubscription] = useState<boolean | null>(null);

  // Vérifier auth + abonnement (DB) + rôle
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    let cancelled = false;

    async function checkSubscription() {
      setChecking(true);
      try {
        const res = await fetch("/api/subscription/check", { cache: "no-store" });
        if (res.ok) {
          const data = await res.json();
          const active = data?.hasActiveSubscription === true;
          if (!cancelled) {
            setHasSubscription(active);
          }
          if (!active) {
            router.push("/subscribe");
            return;
          }
        } else {
          const fallback = session?.user?.hasActiveSubscription === true;
          if (!cancelled) {
            setHasSubscription(fallback);
          }
          if (!fallback) {
            router.push("/subscribe");
            return;
          }
        }
      } catch {
        const fallback = session?.user?.hasActiveSubscription === true;
        if (!cancelled) {
          setHasSubscription(fallback);
        }
        if (!fallback) {
          router.push("/subscribe");
          return;
        }
      } finally {
        if (!cancelled) setChecking(false);
      }
    }

    checkSubscription();

    // Si des rôles sont spécifiés, vérifier que l'utilisateur a le bon rôle
    if (allowedRoles && allowedRoles.length > 0) {
      const userRole = session?.user?.role as "CREATOR" | "DESIGNER" | undefined;
      if (userRole && !allowedRoles.includes(userRole)) {
        router.push("/dashboard");
      }
    }
    return () => {
      cancelled = true;
    };
  }, [session, status, router, allowedRoles]);

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

  // Si pas d'abonnement, ne rien afficher (redirection en cours)
  if (hasSubscription === false) {
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







