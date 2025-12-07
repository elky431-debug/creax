/**
 * Page "Mes missions" pour les créateurs
 * 
 * Affiche toutes les missions créées par le créateur
 * Permet de supprimer ou annuler des missions
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import SubscriptionGuard from "@/components/SubscriptionGuard";

type Mission = {
  id: string;
  title: string;
  description: string;
  type: string;
  status: string;
  createdAt: string;
  proposalCount: number;
  assignedFreelancer: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  } | null;
};

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  OPEN: { label: "Ouverte", color: "text-cyan-400 bg-cyan-500/20" },
  IN_PROGRESS: { label: "En cours", color: "text-yellow-400 bg-yellow-500/20" },
  COMPLETED: { label: "Terminée", color: "text-emerald-400 bg-emerald-500/20" },
  CANCELLED: { label: "Annulée", color: "text-red-400 bg-red-500/20" }
};

const TYPE_LABELS: Record<string, string> = {
  MINIATURE_YOUTUBE: "Miniature YouTube",
  MONTAGE_VIDEO: "Montage vidéo",
  DESIGN_BANNIERE: "Design bannière",
  MOTION_DESIGN: "Motion design",
  RETOUCHE_PHOTO: "Retouche photo",
  AUTRE: "Autre"
};

export default function MyMissionsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal de confirmation
  const [confirmModal, setConfirmModal] = useState<{
    type: "cancel" | "delete";
    missionId: string;
    missionTitle: string;
  } | null>(null);

  // Vérification du rôle
  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/missions/my");
      return;
    }

    if (session?.user?.role !== "CREATOR") {
      router.push("/dashboard");
      return;
    }
  }, [status, session, router]);

  // Charger les missions
  const fetchMissions = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== "ALL") params.set("status", filter);

      const res = await fetch(`/api/missions/my?${params.toString()}`);
      
      if (res.ok) {
        const data = await res.json();
        setMissions(data.missions || []);
      }
    } catch (error) {
      console.error("Erreur chargement missions:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role === "CREATOR") {
      fetchMissions();
    }
  }, [status, session, fetchMissions]);

  // Annuler une mission
  async function handleCancel() {
    if (!confirmModal || confirmModal.type !== "cancel") return;

    setActionLoading(confirmModal.missionId);
    setError(null);

    try {
      const res = await fetch(`/api/missions/${confirmModal.missionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "CANCEL" })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de l'annulation");
        return;
      }

      setSuccess("Mission annulée avec succès");
      setConfirmModal(null);
      fetchMissions();
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionLoading(null);
    }
  }

  // Supprimer une mission
  async function handleDelete() {
    if (!confirmModal || confirmModal.type !== "delete") return;

    setActionLoading(confirmModal.missionId);
    setError(null);

    try {
      const res = await fetch(`/api/missions/${confirmModal.missionId}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur lors de la suppression");
        return;
      }

      setSuccess("Mission supprimée de l'historique");
      setConfirmModal(null);
      fetchMissions();
    } catch {
      setError("Erreur réseau");
    } finally {
      setActionLoading(null);
    }
  }

  // Effacer les messages après 3 secondes
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

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
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] border border-white/10 px-4 py-2 mb-4 backdrop-blur-sm">
                <span className="text-lg">📋</span>
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">Gestion</span>
              </div>
              <h1 className="text-4xl font-black text-white mb-2">Mes missions</h1>
              <p className="text-white/50">
                Gérez et suivez toutes vos missions créées
              </p>
            </div>
            <Link
              href="/missions/create"
              className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-4 text-sm font-bold text-slate-900 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-150 hover:scale-105"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Nouvelle mission
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-emerald-400 flex items-center gap-3 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-red-400 flex items-center gap-3 backdrop-blur-sm">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            {error}
          </div>
        )}

        {/* Filtres */}
        <div className="mb-8 p-1 rounded-2xl bg-white/[0.02] border border-white/[0.06] inline-flex gap-1">
          {[
            { value: "ALL", label: "Toutes", icon: "📁" },
            { value: "OPEN", label: "Ouvertes", icon: "🟢" },
            { value: "IN_PROGRESS", label: "En cours", icon: "🔄" },
            { value: "COMPLETED", label: "Terminées", icon: "✅" },
            { value: "CANCELLED", label: "Annulées", icon: "❌" }
          ].map((opt) => (
            <button
              key={opt.value}
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

        {/* Liste des missions */}
        {missions.length > 0 ? (
          <div className="space-y-4">
            {missions.map((mission, index) => {
              const statusInfo = STATUS_LABELS[mission.status] || STATUS_LABELS.OPEN;
              
              return (
                <div
                  key={mission.id}
                  className="group relative rounded-2xl overflow-hidden transition-all duration-150 hover:scale-[1.01]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Border gradient on hover */}
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/30 via-emerald-500/20 to-cyan-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-150" />
                  <div className="absolute inset-[1px] rounded-2xl bg-[#0a0a0a]" />
                  
                  <div className="relative p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Icon */}
                      <div className="hidden lg:flex w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-white/[0.06] items-center justify-center shrink-0">
                        <span className="text-2xl">
                          {mission.type === "MINIATURE_YOUTUBE" ? "🖼️" : 
                           mission.type === "MONTAGE_VIDEO" ? "🎬" :
                           mission.type === "DESIGN_BANNIERE" ? "🎨" :
                           mission.type === "MOTION_DESIGN" ? "✨" :
                           mission.type === "RETOUCHE_PHOTO" ? "📸" : "📄"}
                        </span>
                      </div>

                      {/* Infos principales */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.color} border border-current/20`}>
                            {statusInfo.label}
                          </span>
                          <span className="text-xs text-white/30 bg-white/[0.03] px-2 py-1 rounded-lg">
                            {TYPE_LABELS[mission.type] || mission.type}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                          {mission.title}
                        </h3>
                        
                        <p className="text-sm text-white/40 line-clamp-1 mt-1">
                          {mission.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-white/30">
                          <span className="flex items-center gap-1.5">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                            </svg>
                            {new Date(mission.createdAt).toLocaleDateString("fr-FR")}
                          </span>
                          {mission.proposalCount > 0 && (
                            <span className="flex items-center gap-1.5 text-cyan-400">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
                              </svg>
                              {mission.proposalCount} proposition{mission.proposalCount > 1 ? "s" : ""}
                            </span>
                          )}
                          {mission.assignedFreelancer && (
                            <div className="flex items-center gap-2">
                              <div className="h-5 w-5 rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 overflow-hidden flex items-center justify-center text-[10px] font-bold text-slate-900">
                                {mission.assignedFreelancer.avatarUrl ? (
                                  <Image
                                    src={mission.assignedFreelancer.avatarUrl}
                                    alt=""
                                    width={20}
                                    height={20}
                                    className="h-full w-full object-cover"
                                  />
                                ) : mission.assignedFreelancer.displayName.charAt(0).toUpperCase()}
                              </div>
                              <span className="text-emerald-400">
                                {mission.assignedFreelancer.displayName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        <Link
                          href={`/missions/${mission.id}`}
                          className="rounded-xl bg-white/[0.03] border border-white/[0.08] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-white/[0.06] hover:border-white/20"
                        >
                          Voir détails
                        </Link>

                        {/* Annuler - seulement si OPEN ou IN_PROGRESS */}
                        {(mission.status === "OPEN" || mission.status === "IN_PROGRESS") && (
                          <button
                            onClick={() => setConfirmModal({
                              type: "cancel",
                              missionId: mission.id,
                              missionTitle: mission.title
                            })}
                            disabled={actionLoading === mission.id}
                            className="rounded-xl border border-orange-500/30 bg-orange-500/10 px-5 py-2.5 text-sm font-semibold text-orange-400 transition-all hover:bg-orange-500/20 disabled:opacity-50"
                          >
                            Annuler
                          </button>
                        )}

                        {/* Supprimer - seulement si COMPLETED ou CANCELLED */}
                        {(mission.status === "COMPLETED" || mission.status === "CANCELLED") && (
                          <button
                            onClick={() => setConfirmModal({
                              type: "delete",
                              missionId: mission.id,
                              missionTitle: mission.title
                            })}
                            disabled={actionLoading === mission.id}
                            className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/20 disabled:opacity-50"
                          >
                            Supprimer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10" />
            <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0a]" />
            
            <div className="relative p-16 text-center">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-white/[0.06]">
                <span className="text-4xl">📋</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">
                Aucune mission
              </h3>
              <p className="text-white/40 mb-8 max-w-sm mx-auto">
                Vous n&apos;avez pas encore créé de mission. Lancez-vous !
              </p>
              <Link
                href="/missions/create"
                className="group inline-flex items-center gap-3 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 px-8 py-4 text-base font-bold text-slate-900 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-150 hover:scale-105"
              >
                Créer ma première mission
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          </div>
        )}

        {/* Modal de confirmation */}
        {confirmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="w-full max-w-md relative rounded-3xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-transparent to-emerald-500/20" />
              <div className="absolute inset-[1px] rounded-3xl bg-[#0c0c0c]" />
              
              <div className="relative p-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${
                  confirmModal.type === "cancel" 
                    ? "bg-orange-500/20 border border-orange-500/30" 
                    : "bg-red-500/20 border border-red-500/30"
                }`}>
                  <span className="text-2xl">{confirmModal.type === "cancel" ? "⚠️" : "🗑️"}</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-3">
                  {confirmModal.type === "cancel" ? "Annuler la mission ?" : "Supprimer la mission ?"}
                </h3>
                <p className="text-white/50 mb-8">
                  {confirmModal.type === "cancel" 
                    ? `Êtes-vous sûr de vouloir annuler "${confirmModal.missionTitle}" ? Cette action est irréversible.`
                    : `Êtes-vous sûr de vouloir supprimer "${confirmModal.missionTitle}" de votre historique ?`
                  }
                </p>
                
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmModal(null)}
                    className="flex-1 rounded-xl bg-white/[0.03] border border-white/[0.08] py-4 text-sm font-semibold text-white transition-all hover:bg-white/[0.06]"
                  >
                    Non, garder
                  </button>
                  <button
                    onClick={confirmModal.type === "cancel" ? handleCancel : handleDelete}
                    disabled={!!actionLoading}
                    className={`flex-1 rounded-xl py-4 text-sm font-bold transition-all disabled:opacity-50 ${
                      confirmModal.type === "cancel"
                        ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-lg hover:shadow-orange-500/25"
                        : "bg-gradient-to-r from-red-500 to-rose-500 text-white hover:shadow-lg hover:shadow-red-500/25"
                    }`}
                  >
                    {actionLoading ? "..." : confirmModal.type === "cancel" ? "Oui, annuler" : "Oui, supprimer"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </SubscriptionGuard>
  );
}
