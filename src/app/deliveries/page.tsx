/**
 * Page de liste des livraisons
 * 
 * Pour les freelances : voir leurs livraisons envoyées
 * Pour les créateurs : voir les livraisons reçues
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import SubscriptionGuard from "@/components/SubscriptionGuard";

// =============================================
// TYPES
// =============================================

type Delivery = {
  id: string;
  missionId: string;
  mission: {
    id: string;
    title: string;
    type: string;
    status: string;
  };
  freelancer: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  creator: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
  protectedUrl: string | null;
  protectedType: string | null;
  status: string;
  paymentStatus: string;
  amount: number;
  revisionCount: number;
  createdAt: string;
  updatedAt: string;
};

// =============================================
// CONSTANTES
// =============================================

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PENDING: { label: "En attente", color: "text-slate-400", bg: "bg-slate-500/20" },
  PROTECTED_SENT: { label: "Version protégée envoyée", color: "text-cyan-400", bg: "bg-cyan-500/20" },
  NEEDS_REVISION: { label: "Modifications demandées", color: "text-orange-400", bg: "bg-orange-500/20" },
  VALIDATED: { label: "Validée - En attente paiement", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  PAID: { label: "Payée - En attente version finale", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  FINAL_SENT: { label: "Version finale envoyée", color: "text-emerald-400", bg: "bg-emerald-500/20" },
  COMPLETED: { label: "Terminée", color: "text-emerald-400", bg: "bg-emerald-500/20" }
};

const TYPE_LABELS: Record<string, string> = {
  MINIATURE_YOUTUBE: "Miniature",
  MONTAGE_VIDEO: "Montage vidéo",
  DESIGN_BANNIERE: "Design",
  MOTION_DESIGN: "Motion",
  RETOUCHE_PHOTO: "Retouche",
  AUTRE: "Autre"
};

// =============================================
// COMPOSANT PRINCIPAL
// =============================================

export default function DeliveriesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");

  const isCreator = session?.user?.role === "CREATOR";

  // Vérifier l'authentification
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/deliveries");
      return;
    }
  }, [status, router]);

  // Charger les livraisons
  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchDeliveries() {
      try {
        const params = new URLSearchParams();
        if (filter !== "ALL") params.set("status", filter);

        const res = await fetch(`/api/deliveries?${params.toString()}`);
        
        if (res.ok) {
          const data = await res.json();
          setDeliveries(data.deliveries || []);
        }
      } catch (error) {
        console.error("Erreur chargement livraisons:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDeliveries();
  }, [status, filter]);

  // Formater la date
  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString("fr-FR", { 
      day: "numeric", 
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  // État de chargement
  if (loading || status === "loading") {
    return (
      <div className="min-h-screen bg-[#000] flex items-center justify-center">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-emerald-500/20 border-b-emerald-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>
    );
  }

  return (
    <SubscriptionGuard>
    <div className="min-h-screen bg-[#000] relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10">
        {/* ============================================
            HEADER
            ============================================ */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] border border-white/10 px-4 py-2 mb-4 backdrop-blur-sm">
            <span className="text-lg">📦</span>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">Livraisons</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2">
            {isCreator ? "Livraisons reçues" : "Mes livraisons"}
          </h1>
          <p className="text-white/50">
            {isCreator 
              ? "Validez les travaux et effectuez les paiements pour recevoir les versions finales"
              : "Gérez vos livraisons et envoyez les versions finales après paiement"}
          </p>
        </div>

        {/* ============================================
            FILTRES
            ============================================ */}
        <div className="mb-8 p-1 rounded-2xl bg-white/[0.02] border border-white/[0.06] inline-flex gap-1 flex-wrap">
          {[
            { value: "ALL", label: "Toutes", icon: "📁" },
            { value: "PROTECTED_SENT", label: "Protégées", icon: "🔒" },
            { value: "VALIDATED", label: "Validées", icon: "✅" },
            { value: "PAID", label: "Payées", icon: "💰" },
            { value: "FINAL_SENT", label: "Finales", icon: "🎉" }
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-150 flex items-center gap-2 ${
                filter === opt.value
                  ? "bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-900 shadow-lg"
                  : "text-white/50 hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              <span className="text-sm">{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>

        {/* ============================================
            LISTE DES LIVRAISONS
            ============================================ */}
        {deliveries.length > 0 ? (
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <DeliveryCard
                key={delivery.id}
                delivery={delivery}
                isCreator={isCreator}
                formatDate={formatDate}
              />
            ))}
          </div>
        ) : (
          /* État vide */
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10" />
            <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0a]" />
            
            <div className="relative p-16 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/10 border border-white/[0.06]">
                <span className="text-4xl">📦</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Aucune livraison</h3>
              <p className="text-white/40 max-w-sm mx-auto">
                {isCreator 
                  ? "Les livraisons de vos missions apparaîtront ici."
                  : "Vos livraisons pour les missions acceptées apparaîtront ici."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </SubscriptionGuard>
  );
}

// =============================================
// COMPOSANT CARTE DE LIVRAISON
// =============================================

type DeliveryCardProps = {
  delivery: Delivery;
  isCreator: boolean;
  formatDate: (date: string) => string;
};

function DeliveryCard({ delivery, isCreator, formatDate }: DeliveryCardProps) {
  const statusInfo = STATUS_LABELS[delivery.status] || STATUS_LABELS.PENDING;
  const otherUser = isCreator ? delivery.freelancer : delivery.creator;

  return (
    <Link
      href={`/deliveries/${delivery.id}`}
      className="group relative rounded-2xl overflow-hidden transition-all duration-150 hover:scale-[1.01] block"
    >
      {/* Border gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/30 via-cyan-500/20 to-emerald-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
      <div className="absolute inset-[1px] rounded-2xl bg-[#0a0a0a]" />

      <div className="relative p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Avatar */}
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-lg font-bold text-slate-900 overflow-hidden">
            {otherUser.avatarUrl ? (
              <Image
                src={otherUser.avatarUrl}
                alt={otherUser.displayName}
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            ) : (
              otherUser.displayName.charAt(0).toUpperCase()
            )}
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="font-bold text-white truncate group-hover:text-cyan-400 transition-colors">{delivery.mission.title}</h3>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.bg} ${statusInfo.color} border border-current/20`}>
                {statusInfo.label}
              </span>
            </div>

            <p className="text-sm text-white/40">
              {isCreator ? "De" : "Pour"} : <span className="text-cyan-400">{otherUser.displayName}</span>
              <span className="mx-2 text-white/20">•</span>
              <span className="text-white/30">{TYPE_LABELS[delivery.mission.type]}</span>
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="text-base">💰</span>
                {(delivery.amount / 100).toFixed(2)} €
              </span>
              {delivery.revisionCount > 0 && (
                <span className="text-orange-400 flex items-center gap-1.5">
                  <span className="text-base">🔄</span>
                  {delivery.revisionCount} révision{delivery.revisionCount > 1 ? "s" : ""}
                </span>
              )}
              <span className="text-white/30 flex items-center gap-1.5">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {formatDate(delivery.updatedAt)}
              </span>
            </div>
          </div>

          {/* Flèche */}
          <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-sm text-white font-medium">
              Voir
              <svg className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </span>
          </div>
        </div>

        {/* Timeline simplifiée */}
        <div className="mt-5 pt-5 border-t border-white/[0.06]">
          <div className="flex items-center gap-2 text-xs">
            <StepIndicator active={true} completed={true} />
            <span className="text-white/40">Créée</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
            
            <StepIndicator 
              active={["PROTECTED_SENT", "NEEDS_REVISION", "VALIDATED", "PAID", "FINAL_SENT", "COMPLETED"].includes(delivery.status)} 
              completed={["VALIDATED", "PAID", "FINAL_SENT", "COMPLETED"].includes(delivery.status)} 
            />
            <span className="text-white/40">Protégée</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
            
            <StepIndicator 
              active={["VALIDATED", "PAID", "FINAL_SENT", "COMPLETED"].includes(delivery.status)} 
              completed={["PAID", "FINAL_SENT", "COMPLETED"].includes(delivery.status)} 
            />
            <span className="text-white/40">Validée</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
            
            <StepIndicator 
              active={["PAID", "FINAL_SENT", "COMPLETED"].includes(delivery.status)} 
              completed={["FINAL_SENT", "COMPLETED"].includes(delivery.status)} 
            />
            <span className="text-white/40">Payée</span>
            <div className="flex-1 h-px bg-white/[0.06]" />
            
            <StepIndicator 
              active={["FINAL_SENT", "COMPLETED"].includes(delivery.status)} 
              completed={delivery.status === "COMPLETED"} 
            />
            <span className="text-white/40">Finale</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Indicateur d'étape
function StepIndicator({ active, completed }: { active: boolean; completed: boolean }) {
  return (
    <div className={`h-3 w-3 rounded-full transition-all ${
      completed 
        ? "bg-emerald-500 shadow-lg shadow-emerald-500/30" 
        : active 
        ? "bg-cyan-500 shadow-lg shadow-cyan-500/30" 
        : "bg-white/10"
    }`} />
  );
}


















