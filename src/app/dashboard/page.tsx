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
  mission: { id: string; title: string; type: string };
  designer: { id: string; displayName: string; avatarUrl: string | null };
};

type ProposalCounts = { total: number; pending: number; accepted: number; rejected: number };

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <DashboardContent />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-[#0a0a0b] flex items-center justify-center">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-[3px] border-[#1a1a1f] border-t-violet-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-[3px] border-[#1a1a1f] border-b-cyan-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '0.8s' }} />
      </div>
    </div>
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

  useEffect(() => {
    if (searchParams.get("billing") === "success") {
      signIn(undefined, { redirect: false });
      router.replace("/dashboard");
    }
  }, [searchParams, router]);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) { router.push("/login?callbackUrl=/dashboard"); return; }
        const data = await res.json();
        setUser(data.user);
      } catch { router.push("/login?callbackUrl=/dashboard"); }
      finally { setLoading(false); }
    }
    fetchUser();
  }, [router]);

  useEffect(() => {
    if (!user || user.role !== "CREATOR") return;
    async function fetchData() {
      try {
        const [propRes, missRes] = await Promise.all([
          fetch("/api/proposals/received"),
          fetch("/api/missions/my")
        ]);
        if (propRes.ok) {
          const data = await propRes.json();
          setRecentProposals(data.proposals?.slice(0, 4) || []);
          setProposalCounts(data.counts || { total: 0, pending: 0, accepted: 0, rejected: 0 });
        }
        if (missRes.ok) {
          const data = await missRes.json();
          setMissionCount(data.missions?.length || 0);
        }
      } catch (e) { console.error(e); }
    }
    fetchData();
  }, [user]);

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff === 0) return "Aujourd'hui";
    if (diff === 1) return "Hier";
    if (diff < 7) return `Il y a ${diff}j`;
    return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  }

  if (loading) return <LoadingScreen />;
  if (!user) return null;

  const isCreator = user.role === "CREATOR";
  const initial = (user.displayName || user.email).charAt(0).toUpperCase();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bonjour" : hour < 18 ? "Bon après-midi" : "Bonsoir";

  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-[#0a0a0b] text-white overflow-hidden">
        {/* Background Effects */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-[40%] -left-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-br from-violet-600/[0.07] via-fuchsia-600/[0.05] to-transparent blur-[100px]" />
          <div className="absolute -bottom-[40%] -right-[20%] w-[80%] h-[80%] rounded-full bg-gradient-to-tl from-cyan-600/[0.07] via-blue-600/[0.05] to-transparent blur-[100px]" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMiI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
          
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 lg:mb-14">
            <div className="flex items-center gap-5">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-violet-600 via-fuchsia-500 to-cyan-500 opacity-60 blur group-hover:opacity-100 transition duration-500" />
                <div className="relative h-16 w-16 rounded-2xl bg-[#12121a] flex items-center justify-center text-2xl font-bold bg-gradient-to-br from-violet-500 to-cyan-500 text-transparent bg-clip-text">
                  {initial}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-white/40">{greeting} 👋</p>
                <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
                  {user.displayName || user.email}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/profile" className="group relative px-5 py-2.5 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-white/[0.05] border border-white/[0.08] rounded-xl group-hover:bg-white/[0.08] group-hover:border-white/[0.12] transition-all" />
                <span className="relative flex items-center gap-2 text-sm font-medium text-white/70 group-hover:text-white transition-colors">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profil
                </span>
              </Link>
              <Link href="/messages" className="group relative px-5 py-2.5 rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl opacity-90 group-hover:opacity-100 transition-opacity" />
                <div className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-600 rounded-xl blur-xl opacity-50 group-hover:opacity-70 transition-opacity" />
                <span className="relative flex items-center gap-2 text-sm font-semibold text-white">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  Messages
                </span>
              </Link>
            </div>
          </header>

          {/* Bento Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5 mb-10 lg:mb-14">
            
            {/* Welcome Card - Large */}
            <div className="md:col-span-2 relative group">
              <div className="absolute -inset-[1px] rounded-3xl bg-gradient-to-r from-violet-600/50 via-fuchsia-600/50 to-cyan-600/50 opacity-0 group-hover:opacity-100 blur transition duration-500" />
              <div className="relative h-full rounded-3xl bg-gradient-to-br from-[#16161f] to-[#0f0f14] border border-white/[0.06] p-6 lg:p-8 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-violet-600/10 to-transparent rounded-full blur-2xl" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs font-medium text-white/60 mb-4">
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    {isCreator ? "Créateur de contenu" : "Designer / Monteur"}
                  </div>
                  <h2 className="text-xl lg:text-2xl font-bold text-white mb-2">
                    Bienvenue sur votre espace
                  </h2>
                  <p className="text-white/50 text-sm lg:text-base mb-6 max-w-md">
                    {isCreator 
                      ? "Gérez vos missions, trouvez des talents et collaborez efficacement."
                      : "Découvrez des opportunités et développez votre activité."}
                  </p>
                  <Link href={isCreator ? "/missions/create" : "/missions"} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors">
                    {isCreator ? "Créer une mission" : "Explorer les missions"}
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* Subscription Card */}
            <div className="relative group">
              <div className={`absolute -inset-[1px] rounded-3xl opacity-0 group-hover:opacity-100 blur transition duration-500 ${user.hasSubscription ? 'bg-emerald-500/50' : 'bg-orange-500/50'}`} />
              <div className="relative h-full rounded-3xl bg-gradient-to-br from-[#16161f] to-[#0f0f14] border border-white/[0.06] p-6 overflow-hidden">
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl ${user.hasSubscription ? 'bg-emerald-600/10' : 'bg-orange-600/10'}`} />
                <div className="relative">
                  <div className={`h-12 w-12 rounded-2xl mb-4 flex items-center justify-center ${user.hasSubscription ? 'bg-emerald-500/10' : 'bg-orange-500/10'}`}>
                    {user.hasSubscription ? (
                      <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">Abonnement</p>
                  <p className={`text-2xl font-bold ${user.hasSubscription ? 'text-emerald-400' : 'text-orange-400'}`}>
                    {user.hasSubscription ? "Pro ✨" : "Gratuit"}
                  </p>
                  <Link href="/pricing" className={`mt-4 inline-flex text-sm font-medium transition-colors ${user.hasSubscription ? 'text-emerald-400/70 hover:text-emerald-400' : 'text-orange-400/70 hover:text-orange-400'}`}>
                    {user.hasSubscription ? "Gérer →" : "Passer Pro →"}
                  </Link>
                </div>
              </div>
            </div>

            {/* Stats Card */}
            <div className="relative group">
              <div className="absolute -inset-[1px] rounded-3xl bg-violet-500/50 opacity-0 group-hover:opacity-100 blur transition duration-500" />
              <div className="relative h-full rounded-3xl bg-gradient-to-br from-[#16161f] to-[#0f0f14] border border-white/[0.06] p-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full blur-2xl" />
                <div className="relative">
                  <div className="h-12 w-12 rounded-2xl bg-violet-500/10 mb-4 flex items-center justify-center">
                    <svg className="h-6 w-6 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <p className="text-xs font-medium text-white/40 uppercase tracking-wider mb-1">
                    {isCreator ? "Missions actives" : "Propositions"}
                  </p>
                  <p className="text-3xl font-bold text-white">{isCreator ? missionCount : proposalCounts.total}</p>
                  <Link href={isCreator ? "/missions/my" : "/my-proposals"} className="mt-4 inline-flex text-sm font-medium text-violet-400/70 hover:text-violet-400 transition-colors">
                    Voir tout →
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <section className="mb-10 lg:mb-14">
            <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-3">
              <span className="h-1 w-1 rounded-full bg-cyan-500" />
              Actions rapides
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isCreator ? (
                <>
                  <ActionCard
                    href="/missions/create"
                    icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />}
                    title="Nouvelle mission"
                    description="Publiez un projet et recevez des propositions"
                    gradient="from-violet-600 to-fuchsia-600"
                  />
                  <ActionCard
                    href="/search"
                    icon={<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />}
                    title="Trouver un talent"
                    description="Explorez les profils de designers"
                    gradient="from-cyan-600 to-blue-600"
                  />
                  <ActionCard
                    href="/proposals"
                    icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />}
                    title="Propositions"
                    description={`${proposalCounts.pending} en attente de réponse`}
                    gradient="from-amber-600 to-orange-600"
                    badge={proposalCounts.pending > 0 ? proposalCounts.pending : undefined}
                  />
                </>
              ) : (
                <>
                  <ActionCard
                    href="/missions"
                    icon={<path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />}
                    title="Missions disponibles"
                    description="Trouvez des projets qui vous correspondent"
                    gradient="from-violet-600 to-fuchsia-600"
                  />
                  <ActionCard
                    href="/my-proposals"
                    icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    title="Mes propositions"
                    description="Suivez l'état de vos candidatures"
                    gradient="from-cyan-600 to-blue-600"
                  />
                  <ActionCard
                    href="/profile"
                    icon={<path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />}
                    title="Mon profil"
                    description="Optimisez votre présentation"
                    gradient="from-emerald-600 to-teal-600"
                  />
                </>
              )}
            </div>
          </section>

          {/* Recent Proposals (Creators only) */}
          {isCreator && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-semibold text-white flex items-center gap-3">
                  <span className="h-1 w-1 rounded-full bg-fuchsia-500" />
                  Dernières propositions
                </h2>
                {proposalCounts.total > 0 && (
                  <Link href="/proposals" className="text-sm font-medium text-white/40 hover:text-white transition-colors">
                    Tout voir →
                  </Link>
                )}
              </div>

              {recentProposals.length > 0 ? (
                <div className="grid gap-3">
                  {recentProposals.map((p) => (
                    <Link key={p.id} href="/proposals" className="group relative">
                      <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-violet-600/30 to-cyan-600/30 opacity-0 group-hover:opacity-100 blur transition duration-300" />
                      <div className={`relative flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                        p.status === "PENDING" 
                          ? "bg-amber-500/[0.03] border-amber-500/20 hover:border-amber-500/40" 
                          : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                      }`}>
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-sm font-bold text-white shrink-0 overflow-hidden">
                          {p.designer.avatarUrl ? (
                            <Image src={p.designer.avatarUrl} alt="" width={44} height={44} className="h-full w-full object-cover" />
                          ) : p.designer.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-medium text-white truncate">{p.designer.displayName}</p>
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              p.status === "PENDING" ? "bg-amber-500/20 text-amber-400" :
                              p.status === "ACCEPTED" ? "bg-emerald-500/20 text-emerald-400" :
                              "bg-red-500/20 text-red-400"
                            }`}>
                              {p.status === "PENDING" ? "En attente" : p.status === "ACCEPTED" ? "Acceptée" : "Refusée"}
                            </span>
                          </div>
                          <p className="text-sm text-white/40 truncate">{p.mission.title}</p>
                        </div>
                        <div className="text-right shrink-0">
                          {p.price && <p className="font-semibold text-emerald-400">{p.price} €</p>}
                          <p className="text-xs text-white/30">{formatDate(p.createdAt)}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-10 text-center">
                  <div className="h-16 w-16 rounded-2xl bg-white/[0.03] mx-auto mb-4 flex items-center justify-center">
                    <svg className="h-8 w-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-white/60 font-medium mb-1">Aucune proposition pour le moment</p>
                  <p className="text-sm text-white/30 mb-5">Créez une mission pour recevoir des candidatures</p>
                  <Link href="/missions/create" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Créer une mission
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* Quick Links Footer */}
          <section className="pt-6 border-t border-white/[0.04]">
            <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
              {[
                { href: "/pricing", label: "💎 Tarifs" },
                { href: "/messages", label: "💬 Messages" },
                { href: "/profile", label: "👤 Profil" },
                { href: isCreator ? "/missions/my" : "/missions", label: "📋 Missions" },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/[0.06] text-white/50 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.1] transition-all">
                  {link.label}
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>
    </SubscriptionGuard>
  );
}

function ActionCard({ href, icon, title, description, gradient, badge }: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  badge?: number;
}) {
  return (
    <Link href={href} className="group relative">
      <div className={`absolute -inset-[1px] rounded-2xl bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-50 blur transition duration-500`} />
      <div className="relative h-full rounded-2xl bg-gradient-to-br from-[#16161f] to-[#0f0f14] border border-white/[0.06] p-5 lg:p-6 group-hover:border-white/[0.12] transition-all overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${gradient} opacity-[0.03] group-hover:opacity-[0.08] rounded-full blur-2xl transition-opacity`} />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {icon}
              </svg>
            </div>
            {badge !== undefined && badge > 0 && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 text-xs font-semibold text-amber-400">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                {badge}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-white mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-white/60 transition-all">{title}</h3>
          <p className="text-sm text-white/40">{description}</p>
        </div>
      </div>
    </Link>
  );
}
