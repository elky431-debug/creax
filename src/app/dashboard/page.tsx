"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { signIn } from "next-auth/react";
import SubscriptionGuard from "@/components/SubscriptionGuard";

type UserData = {
  email: string;
  displayName: string;
  role: string;
  hasSubscription: boolean;
};

type RecentProposal = {
  id: string;
  message: string;
  price: number | null;
  status: string;
  createdAt: string;
  mission: {
    id: string;
    title: string;
    type: string;
  };
  designer: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
  };
};

type ProposalCounts = {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
};

// Wrapper avec Suspense pour useSearchParams
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
        </div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentProposals, setRecentProposals] = useState<RecentProposal[]>([]);
  const [proposalCounts, setProposalCounts] = useState<ProposalCounts>({ total: 0, pending: 0, accepted: 0, rejected: 0 });
  const [missionCount, setMissionCount] = useState(0);

  // Vérifier si on revient d'un paiement réussi
  useEffect(() => {
    const billing = searchParams.get("billing");
    if (billing === "success") {
      signIn(undefined, { redirect: false });
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          router.push("/login?callbackUrl=/dashboard");
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch {
        router.push("/login?callbackUrl=/dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [router]);

  // Fetch propositions reçues pour les créateurs
  useEffect(() => {
    if (!user || user.role !== "CREATOR") return;

    async function fetchProposals() {
      try {
        const res = await fetch("/api/proposals/received");
        if (res.ok) {
          const data = await res.json();
          setRecentProposals(data.proposals?.slice(0, 5) || []);
          setProposalCounts(data.counts || { total: 0, pending: 0, accepted: 0, rejected: 0 });
        }
      } catch (error) {
        console.error("Erreur chargement propositions:", error);
      }
    }

    async function fetchMissions() {
      try {
        const res = await fetch("/api/missions/my");
        if (res.ok) {
          const data = await res.json();
          setMissionCount(data.missions?.length || 0);
        }
      } catch (error) {
        console.error("Erreur chargement missions:", error);
      }
    }

    fetchProposals();
    fetchMissions();
  }, [user]);

  // Formater la date relative
  function formatRelativeDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffHours < 1) return "À l'instant";
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const isCreator = user.role === "CREATOR";
  const userInitial = (user.displayName || user.email).charAt(0).toUpperCase();
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? "Bonjour" : currentHour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-[#030303] relative">
        {/* Background subtle */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-cyan-500/[0.03] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/[0.03] rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          
          {/* Header */}
          <header className="mb-12">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-xl font-bold text-[#030303] shadow-lg shadow-cyan-500/20">
                    {userInitial}
                  </div>
                  <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-400 border-2 border-[#030303]" />
                </div>
                <div>
                  <p className="text-sm text-white/40 mb-0.5">{greeting}</p>
                  <h1 className="text-2xl font-bold text-white">{user.displayName || user.email}</h1>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Link
                  href="/profile"
                  className="h-10 px-4 rounded-xl bg-white/[0.05] border border-white/[0.08] text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.08] transition-all flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profil
                </Link>
                <Link
                  href="/messages"
                  className="h-10 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 text-sm font-semibold text-[#030303] hover:shadow-lg hover:shadow-cyan-500/20 transition-all flex items-center gap-2"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Messages
                </Link>
              </div>
            </div>
          </header>

          {/* Stats Grid */}
          <section className="mb-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Rôle */}
              <div className="col-span-2 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.06] p-5 sm:p-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      {isCreator ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.043-.025a15.994 15.994 0 011.622-3.395m3.42 3.42a15.995 15.995 0 004.764-4.648l3.876-5.814a1.151 1.151 0 00-1.597-1.597L14.146 6.32a15.996 15.996 0 00-4.649 4.763m3.42 3.42a6.776 6.776 0 00-3.42-3.42" />
                      )}
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Votre rôle</p>
                    <p className="text-lg font-semibold text-white">
                      {isCreator ? "Créateur de contenu" : "Designer / Monteur"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Abonnement */}
              <div className={`rounded-2xl p-5 sm:p-6 border ${
                user.hasSubscription 
                  ? "bg-emerald-500/[0.08] border-emerald-500/20" 
                  : "bg-orange-500/[0.08] border-orange-500/20"
              }`}>
                <div className={`h-10 w-10 rounded-lg mb-3 flex items-center justify-center ${
                  user.hasSubscription ? "bg-emerald-500/20" : "bg-orange-500/20"
                }`}>
                  {user.hasSubscription ? (
                    <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Abonnement</p>
                <p className={`text-xl font-bold ${user.hasSubscription ? "text-emerald-400" : "text-orange-400"}`}>
                  {user.hasSubscription ? "Pro" : "Inactif"}
                </p>
              </div>

              {/* Missions / Propositions */}
              <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-5 sm:p-6">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 mb-3 flex items-center justify-center">
                  <svg className="h-5 w-5 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                  {isCreator ? "Missions" : "Propositions"}
                </p>
                <p className="text-xl font-bold text-white">{isCreator ? missionCount : proposalCounts.total}</p>
              </div>
            </div>
          </section>

          {/* Actions principales */}
          <section className="mb-12">
            <h2 className="text-lg font-semibold text-white mb-4">Actions rapides</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {isCreator ? (
                <>
                  {/* Créer une mission */}
                  <Link
                    href="/missions/create"
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-transparent border border-cyan-500/20 p-6 hover:border-cyan-500/40 transition-all"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all" />
                    <div className="relative">
                      <div className="h-12 w-12 rounded-xl bg-cyan-500/20 mb-4 flex items-center justify-center">
                        <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Créer une mission</h3>
                      <p className="text-sm text-white/50 mb-4">Décrivez votre besoin et recevez des propositions</p>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-cyan-400 group-hover:gap-2 transition-all">
                        Commencer
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </Link>

                  {/* Trouver un talent */}
                  <Link
                    href="/search"
                    className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 hover:border-white/[0.12] transition-all"
                  >
                    <div className="h-12 w-12 rounded-xl bg-white/[0.05] mb-4 flex items-center justify-center">
                      <svg className="h-6 w-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Trouver un talent</h3>
                    <p className="text-sm text-white/50 mb-4">Parcourez les profils de designers et monteurs</p>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-white/60 group-hover:text-white group-hover:gap-2 transition-all">
                      Explorer
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                </>
              ) : (
                <>
                  {/* Voir les missions */}
                  <Link
                    href="/missions"
                    className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-transparent border border-cyan-500/20 p-6 hover:border-cyan-500/40 transition-all"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-all" />
                    <div className="relative">
                      <div className="h-12 w-12 rounded-xl bg-cyan-500/20 mb-4 flex items-center justify-center">
                        <svg className="h-6 w-6 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">Missions disponibles</h3>
                      <p className="text-sm text-white/50 mb-4">Trouvez des projets qui correspondent à vos compétences</p>
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-cyan-400 group-hover:gap-2 transition-all">
                        Explorer
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </span>
                    </div>
                  </Link>

                  {/* Optimiser profil */}
                  <Link
                    href="/profile"
                    className="group relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 hover:border-white/[0.12] transition-all"
                  >
                    <div className="h-12 w-12 rounded-xl bg-white/[0.05] mb-4 flex items-center justify-center">
                      <svg className="h-6 w-6 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">Optimiser mon profil</h3>
                    <p className="text-sm text-white/50 mb-4">Un profil complet attire plus de clients</p>
                    <span className="inline-flex items-center gap-1 text-sm font-medium text-white/60 group-hover:text-white group-hover:gap-2 transition-all">
                      Modifier
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </Link>
                </>
              )}
            </div>
          </section>

          {/* Propositions récentes (Créateurs) */}
          {isCreator && (
            <section className="mb-12">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">Propositions reçues</h2>
                {proposalCounts.pending > 0 && (
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-xs font-medium text-yellow-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
                    {proposalCounts.pending} en attente
                  </span>
                )}
              </div>

              {recentProposals.length > 0 ? (
                <div className="space-y-2">
                  {recentProposals.slice(0, 4).map((proposal) => (
                    <Link
                      key={proposal.id}
                      href="/proposals"
                      className={`flex items-center gap-4 p-4 rounded-xl border transition-all hover:bg-white/[0.02] ${
                        proposal.status === "PENDING"
                          ? "bg-yellow-500/[0.03] border-yellow-500/20"
                          : "bg-white/[0.02] border-white/[0.06]"
                      }`}
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 flex items-center justify-center text-sm font-bold text-[#030303] shrink-0 overflow-hidden">
                        {proposal.designer.avatarUrl ? (
                          <Image
                            src={proposal.designer.avatarUrl}
                            alt=""
                            width={40}
                            height={40}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          proposal.designer.displayName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white truncate">{proposal.designer.displayName}</p>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            proposal.status === "PENDING"
                              ? "bg-yellow-500/20 text-yellow-400"
                              : proposal.status === "ACCEPTED"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-red-500/20 text-red-400"
                          }`}>
                            {proposal.status === "PENDING" ? "En attente" : proposal.status === "ACCEPTED" ? "Acceptée" : "Refusée"}
                          </span>
                        </div>
                        <p className="text-sm text-white/40 truncate">{proposal.mission.title}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {proposal.price && (
                          <p className="font-semibold text-emerald-400">{proposal.price} €</p>
                        )}
                        <p className="text-xs text-white/30">{formatRelativeDate(proposal.createdAt)}</p>
                      </div>
                    </Link>
                  ))}
                  
                  <Link
                    href="/proposals"
                    className="flex items-center justify-center gap-2 p-3 rounded-xl border border-white/[0.06] text-sm font-medium text-white/50 hover:text-white hover:bg-white/[0.02] transition-all"
                  >
                    Voir toutes les propositions
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              ) : (
                <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
                  <div className="h-14 w-14 rounded-full bg-white/[0.05] mx-auto mb-4 flex items-center justify-center">
                    <svg className="h-7 w-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-white/60 font-medium mb-1">Aucune proposition</p>
                  <p className="text-sm text-white/30 mb-4">Créez une mission pour recevoir des candidatures</p>
                  <Link
                    href="/missions/create"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 text-sm font-medium text-[#030303] hover:bg-cyan-400 transition-all"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Créer une mission
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* Liens rapides */}
          <section className="pb-8">
            <h2 className="text-lg font-semibold text-white mb-4">Liens utiles</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Link
                href="/pricing"
                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
              >
                <div className="h-9 w-9 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-white/70">Tarifs</span>
              </Link>
              
              <Link
                href={isCreator ? "/missions/my" : "/my-proposals"}
                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
              >
                <div className="h-9 w-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <svg className="h-4 w-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-white/70">{isCreator ? "Mes missions" : "Mes propositions"}</span>
              </Link>

              <Link
                href="/messages"
                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
              >
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <svg className="h-4 w-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-white/70">Messages</span>
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
              >
                <div className="h-9 w-9 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <svg className="h-4 w-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-sm font-medium text-white/70">Paramètres</span>
              </Link>
            </div>
          </section>

        </div>
      </div>
    </SubscriptionGuard>
  );
}
