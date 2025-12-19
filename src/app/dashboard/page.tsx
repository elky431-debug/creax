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

type BankStatus = { isConfigured: boolean };

export default function DashboardPage() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <DashboardContent />
    </Suspense>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="relative">
        <div className="h-14 w-14 rounded-full border-2 border-white/10 border-t-cyan-500 animate-spin" />
        <div className="absolute inset-1.5 rounded-full border-2 border-white/5 border-b-emerald-500 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
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
  const [bankStatus, setBankStatus] = useState<BankStatus | null>(null);
  const [showBankNotification, setShowBankNotification] = useState(true);

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

  // Vérifier le statut bancaire pour les designers
  useEffect(() => {
    if (!user || user.role !== "DESIGNER") return;
    async function fetchBankStatus() {
      try {
        const res = await fetch("/api/profile/bank");
        if (res.ok) {
          const data = await res.json();
          setBankStatus(data);
        }
      } catch (e) { console.error(e); }
    }
    fetchBankStatus();
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
      <div className="min-h-screen bg-black text-white">
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-gradient-to-b from-cyan-500/[0.07] via-emerald-500/[0.03] to-transparent blur-[100px]" />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-8 lg:py-12">
          
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-xl font-bold text-black">
                {initial}
              </div>
              <div>
                <p className="text-sm text-white/40">{greeting} 👋</p>
                <h1 className="text-2xl font-bold text-white">
                  {user.displayName || user.email}
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Link href="/profile" className="h-10 px-5 rounded-full bg-white/[0.06] border border-white/[0.1] text-sm font-medium text-white/70 hover:text-white hover:bg-white/[0.1] transition-all flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profil
              </Link>
              <Link href="/messages" className="h-10 px-5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-sm font-semibold text-black hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center gap-2">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Messages
              </Link>
            </div>
          </header>

          {/* Notification IBAN pour les designers */}
          {!isCreator && bankStatus && !bankStatus.isConfigured && showBankNotification && (
            <div className="mb-8 rounded-2xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-orange-500/30 p-5 relative overflow-hidden">
              <button 
                onClick={() => setShowBankNotification(false)}
                className="absolute top-3 right-3 text-white/40 hover:text-white transition-colors"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-orange-500/20 flex items-center justify-center shrink-0">
                  <span className="text-2xl">💳</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white mb-1">
                    Configurez vos paramètres de paiement
                  </h3>
                  <p className="text-sm text-white/60 mb-3">
                    Pour recevoir vos paiements lorsque vos travaux sont validés, vous devez d&apos;abord configurer votre IBAN.
                  </p>
                  <Link 
                    href="/settings/bank"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-orange-500 to-yellow-500 text-sm font-semibold text-black hover:shadow-lg hover:shadow-orange-500/25 transition-all"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Configurer maintenant
                  </Link>
                </div>
              </div>
              
              {/* Decoration */}
              <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
            </div>
          )}

          {/* Main Grid */}
          <div className="grid lg:grid-cols-3 gap-5 mb-10">
            
            {/* Welcome Card */}
            <div className="lg:col-span-2 rounded-3xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/[0.08] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full blur-3xl" />
              
              {/* Logo flottant avec effet glow */}
              <div className="absolute -right-8 lg:right-8 top-1/2 -translate-y-1/2 opacity-20 lg:opacity-30 pointer-events-none">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-emerald-500 blur-3xl opacity-40" />
                  <Image 
                    src="/logo.png" 
                    alt="CREIX" 
                    width={200} 
                    height={200} 
                    className="relative w-40 lg:w-52 h-auto object-contain drop-shadow-2xl"
                  />
                </div>
              </div>
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-medium text-cyan-400 mb-5">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  {isCreator ? "Créateur de contenu" : "Designer / Monteur"}
                </div>
                <h2 className="text-2xl lg:text-3xl font-bold mb-3">
                  Bienvenue sur <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">CREIX</span>
                </h2>
                <p className="text-white/50 max-w-lg mb-6">
                  {isCreator 
                    ? "Trouvez les meilleurs talents pour vos projets créatifs. Publiez des missions et recevez des propositions de graphistes et monteurs qualifiés."
                    : "Découvrez des opportunités qui correspondent à vos compétences et développez votre activité avec des créateurs de contenu."}
                </p>
                <Link 
                  href={isCreator ? "/missions/create" : "/missions"} 
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-sm font-semibold text-black hover:shadow-lg hover:shadow-cyan-500/25 transition-all"
                >
                  {isCreator ? "Créer une mission" : "Explorer les missions"}
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </div>

            {/* Stats Column */}
            <div className="space-y-5">
              {/* Subscription */}
              <div className={`rounded-2xl p-5 border ${
                user.hasSubscription 
                  ? "bg-emerald-500/[0.06] border-emerald-500/20" 
                  : "bg-orange-500/[0.06] border-orange-500/20"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                    user.hasSubscription ? "bg-emerald-500/20" : "bg-orange-500/20"
                  }`}>
                    {user.hasSubscription ? (
                      <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                    )}
                  </div>
                  <Link href="/pricing" className={`text-xs font-medium ${user.hasSubscription ? "text-emerald-400" : "text-orange-400"}`}>
                    {user.hasSubscription ? "Gérer →" : "Passer Pro →"}
                  </Link>
                </div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Abonnement</p>
                <p className={`text-xl font-bold ${user.hasSubscription ? "text-emerald-400" : "text-orange-400"}`}>
                  {user.hasSubscription ? "Pro" : "Inactif"}
                </p>
              </div>

              {/* Missions/Propositions */}
              <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <Link href={isCreator ? "/missions/my" : "/my-proposals"} className="text-xs font-medium text-cyan-400">
                    Voir →
                  </Link>
                </div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
                  {isCreator ? "Missions" : "Propositions"}
                </p>
                <p className="text-xl font-bold text-white">{isCreator ? missionCount : proposalCounts.total}</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <section className="mb-10">
            <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider mb-4">Actions rapides</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {isCreator ? (
                <>
                  <ActionCard
                    href="/missions/create"
                    icon={<path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />}
                    title="Nouvelle mission"
                    description="Publiez un projet"
                    primary
                  />
                  <ActionCard
                    href="/search"
                    icon={<path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />}
                    title="Trouver un talent"
                    description="Parcourez les profils"
                  />
                  <ActionCard
                    href="/proposals"
                    icon={<path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />}
                    title="Propositions"
                    description={`${proposalCounts.pending} en attente`}
                    badge={proposalCounts.pending}
                  />
                </>
              ) : (
                <>
                  <ActionCard
                    href="/missions"
                    icon={<path strokeLinecap="round" strokeLinejoin="round" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />}
                    title="Missions disponibles"
                    description="Trouvez des projets"
                    primary
                  />
                  <ActionCard
                    href="/my-proposals"
                    icon={<path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />}
                    title="Mes propositions"
                    description="Suivez vos candidatures"
                  />
                  <ActionCard
                    href="/settings/bank"
                    icon={<path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />}
                    title="💳 Paramètres paiement"
                    description="Configurer mon IBAN"
                  />
                </>
              )}
            </div>
          </section>

          {/* Recent Proposals (Creators only) */}
          {isCreator && (
            <section className="mb-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Dernières propositions</h2>
                {proposalCounts.total > 0 && (
                  <Link href="/proposals" className="text-xs font-medium text-cyan-400 hover:text-cyan-300 transition-colors">
                    Tout voir →
                  </Link>
                )}
              </div>

              {recentProposals.length > 0 ? (
                <div className="space-y-3">
                  {recentProposals.map((p) => (
                    <Link key={p.id} href="/proposals" className={`flex items-center gap-4 p-4 rounded-2xl border transition-all hover:bg-white/[0.02] ${
                      p.status === "PENDING" 
                        ? "bg-cyan-500/[0.03] border-cyan-500/20 hover:border-cyan-500/40" 
                        : "bg-white/[0.02] border-white/[0.06] hover:border-white/[0.12]"
                    }`}>
                      <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-500 to-emerald-500 flex items-center justify-center text-sm font-bold text-black shrink-0 overflow-hidden">
                        {p.designer.avatarUrl ? (
                          <Image src={p.designer.avatarUrl} alt="" width={44} height={44} className="h-full w-full object-cover" />
                        ) : p.designer.displayName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-medium text-white truncate">{p.designer.displayName}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            p.status === "PENDING" ? "bg-cyan-500/20 text-cyan-400" :
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
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-10 text-center">
                  <div className="h-14 w-14 rounded-2xl bg-white/[0.04] mx-auto mb-4 flex items-center justify-center">
                    <svg className="h-7 w-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <p className="text-white/60 font-medium mb-1">Aucune proposition</p>
                  <p className="text-sm text-white/30 mb-5">Créez une mission pour recevoir des candidatures</p>
                  <Link href="/missions/create" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-sm font-semibold text-black hover:shadow-lg hover:shadow-cyan-500/25 transition-all">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Créer une mission
                  </Link>
                </div>
              )}
            </section>
          )}

          {/* Quick Links */}
          <section className="pt-8 border-t border-white/[0.06]">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                { href: "/pricing", label: "Tarifs", icon: "💎" },
                { href: "/messages", label: "Messages", icon: "💬" },
                { href: "/profile", label: "Profil", icon: "👤" },
                { href: isCreator ? "/missions/my" : "/missions", label: "Missions", icon: "📋" },
              ].map((link) => (
                <Link key={link.href} href={link.href} className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.06] text-sm text-white/50 hover:text-white hover:bg-white/[0.08] hover:border-white/[0.12] transition-all">
                  {link.icon} {link.label}
                </Link>
              ))}
            </div>
          </section>

        </div>
      </div>
    </SubscriptionGuard>
  );
}

function ActionCard({ href, icon, title, description, primary, badge }: {
  href: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  primary?: boolean;
  badge?: number;
}) {
  return (
    <Link href={href} className="group">
      <div className={`h-full rounded-2xl p-5 border transition-all ${
        primary 
          ? "bg-gradient-to-br from-cyan-500/10 to-emerald-500/5 border-cyan-500/20 hover:border-cyan-500/40" 
          : "bg-white/[0.03] border-white/[0.06] hover:border-white/[0.12] hover:bg-white/[0.05]"
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
            primary ? "bg-gradient-to-br from-cyan-500 to-emerald-500" : "bg-white/[0.06]"
          }`}>
            <svg className={`h-5 w-5 ${primary ? "text-black" : "text-white/60"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              {icon}
            </svg>
          </div>
          {badge !== undefined && badge > 0 && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyan-500/20 text-xs font-semibold text-cyan-400">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {badge}
            </span>
          )}
        </div>
        <h3 className={`font-semibold mb-1 ${primary ? "text-white" : "text-white/80 group-hover:text-white"} transition-colors`}>{title}</h3>
        <p className="text-sm text-white/40">{description}</p>
      </div>
    </Link>
  );
}
