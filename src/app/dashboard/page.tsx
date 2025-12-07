"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

// Composants du dashboard
import { SectionTitle } from "@/components/dashboard/SectionTitle";
import { StatCard } from "@/components/dashboard/StatCard";
import { TalentCard } from "@/components/dashboard/TalentCard";
import { TipCard } from "@/components/dashboard/TipCard";
import { ActionCard } from "@/components/dashboard/ActionCard";
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

// Données fictives pour les talents recommandés
const RECOMMENDED_TALENTS = [
  {
    name: "Marie Dupont",
    specialty: "Graphiste",
    tags: ["Miniatures YouTube", "Logos", "Branding"],
    avatarInitial: "M",
    rating: 4.9
  },
  {
    name: "Lucas Martin",
    specialty: "Monteur vidéo",
    tags: ["Montage court", "TikTok", "Reels"],
    avatarInitial: "L",
    rating: 4.8
  },
  {
    name: "Sophie Bernard",
    specialty: "Motion Designer",
    tags: ["Animations", "Intros", "Transitions"],
    avatarInitial: "S",
    rating: 4.7
  },
  {
    name: "Thomas Petit",
    specialty: "Graphiste",
    tags: ["Thumbnails", "Bannières", "Overlays"],
    avatarInitial: "T",
    rating: 4.9
  },
  {
    name: "Emma Leroy",
    specialty: "Monteur vidéo",
    tags: ["Documentaire", "Vlogs", "Long format"],
    avatarInitial: "E",
    rating: 4.6
  },
  {
    name: "Hugo Moreau",
    specialty: "Motion Designer",
    tags: ["3D", "VFX", "After Effects"],
    avatarInitial: "H",
    rating: 4.8
  }
];

// Labels pour les types de mission
const TYPE_LABELS: Record<string, string> = {
  MINIATURE_YOUTUBE: "Miniature",
  MONTAGE_VIDEO: "Montage",
  DESIGN_BANNIERE: "Design",
  MOTION_DESIGN: "Motion",
  RETOUCHE_PHOTO: "Retouche",
  AUTRE: "Autre"
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentProposals, setRecentProposals] = useState<RecentProposal[]>([]);
  const [proposalCounts, setProposalCounts] = useState<ProposalCounts>({ total: 0, pending: 0, accepted: 0, rejected: 0 });

  // Fetch user data (logique existante conservée)
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
    fetchProposals();
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

  // État de chargement
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-20">
          <div className="flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <span className="ml-3 text-slate-400">Chargement...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const isCreator = user.role === "CREATOR";
  const userInitial = (user.displayName || user.email).charAt(0).toUpperCase();

  return (
    <SubscriptionGuard>
    <div className="min-h-screen bg-slate-950">
      {/* ============================================
          SECTION 1 - HERO / EN-TÊTE
          ============================================ */}
      <section className="relative overflow-hidden border-b border-slate-800/50 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
        {/* Background decoratif */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-cyan-500/10 via-transparent to-transparent" />
        <div className="absolute top-0 right-0 h-96 w-96 rounded-full bg-cyan-500/5 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            {/* Titre et sous-titre */}
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-2xl font-bold text-slate-900 shadow-lg shadow-cyan-500/25">
                {userInitial}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Tableau de bord</h1>
                <p className="mt-1 text-lg text-slate-400">
                  Bonjour, <span className="text-cyan-400">{user.displayName || user.email}</span>
                </p>
              </div>
            </div>

            {/* Boutons d'action rapide */}
            <div className="flex flex-wrap gap-3">
              <a
                href="/profile"
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-800/50 px-5 py-2.5 text-sm font-semibold text-white backdrop-blur transition-all duration-200 hover:border-slate-600 hover:bg-slate-800"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Mon profil
              </a>
              <a
                href="/messages"
                className="inline-flex items-center gap-2 rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-cyan-500/25 transition-all duration-200 hover:bg-cyan-400"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                Messagerie
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Contenu principal */}
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 space-y-16">

        {/* ============================================
            SECTION 2 - VUE D'ENSEMBLE REDESIGNÉE
            ============================================ */}
        <section>
          <SectionTitle 
            title="Vue d'ensemble" 
            subtitle="Votre activité en un coup d'œil"
          />
          
          {/* Bento Grid Layout */}
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
            
            {/* Carte Profil - Grande */}
            <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-500/20 via-cyan-500/10 to-transparent border border-cyan-500/20 p-6">
              <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-cyan-600 text-2xl font-bold text-white shadow-lg shadow-cyan-500/30">
                  {userInitial}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400 mb-1">
                    {isCreator ? "Créateur de contenu" : "Graphiste / Monteur"}
                  </p>
                  <h3 className="text-xl font-bold text-white mb-2">{user.displayName || user.email}</h3>
                  <p className="text-sm text-slate-400 mb-4">
                    {isCreator 
                      ? "Trouvez les meilleurs talents pour vos projets créatifs"
                      : "Proposez vos services aux créateurs de contenu"}
                  </p>
                  <Link
                    href="/profile"
                    className="inline-flex items-center gap-2 text-sm font-medium text-cyan-400 hover:text-cyan-300 transition"
                  >
                    Voir mon profil
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
                  </Link>
                </div>
              </div>
            </div>

            {/* Carte Abonnement */}
            <div className={`relative overflow-hidden rounded-3xl p-6 ${
              user.hasSubscription 
                ? "bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/20" 
                : "bg-gradient-to-br from-orange-500/20 via-orange-500/10 to-transparent border border-orange-500/20"
            }`}>
              <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl ${
                user.hasSubscription ? "bg-emerald-500/20" : "bg-orange-500/20"
              }`} />
              <div className="relative">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4 ${
                  user.hasSubscription 
                    ? "bg-emerald-500/20 text-emerald-400" 
                    : "bg-orange-500/20 text-orange-400"
                }`}>
                  {user.hasSubscription ? (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  ) : (
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  )}
                </div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Abonnement</p>
                <p className={`text-2xl font-bold mb-3 ${
                  user.hasSubscription ? "text-emerald-400" : "text-orange-400"
                }`}>
                  {user.hasSubscription ? "Actif" : "Inactif"}
                </p>
                <Link
                  href="/pricing"
                  className={`text-sm font-medium transition ${
                    user.hasSubscription 
                      ? "text-emerald-400 hover:text-emerald-300" 
                      : "text-orange-400 hover:text-orange-300"
                  }`}
                >
                  {user.hasSubscription ? "Gérer →" : "Activer →"}
                </Link>
              </div>
            </div>

            {/* Stats rapides pour Créateurs */}
            {isCreator ? (
              <>
                {/* Missions actives */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-6 hover:border-slate-700 transition">
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 mb-4">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Missions</p>
                    <p className="text-2xl font-bold text-white mb-3">{proposalCounts.total || 0}</p>
                    <Link href="/missions/my" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition">
                      Voir mes missions →
                    </Link>
                  </div>
                </div>

                {/* Propositions en attente */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-6 hover:border-slate-700 transition">
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-yellow-500/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-yellow-500/20 text-yellow-400 mb-4">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">En attente</p>
                    <p className="text-2xl font-bold text-white mb-3">
                      {proposalCounts.pending || 0}
                      {proposalCounts.pending > 0 && (
                        <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                      )}
                    </p>
                    <Link href="/proposals" className="text-sm font-medium text-yellow-400 hover:text-yellow-300 transition">
                      Voir les propositions →
                    </Link>
                  </div>
                </div>

                {/* Messagerie */}
                <div className="md:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-slate-900/50 border border-slate-800 p-6 hover:border-slate-700 transition">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />
                  <div className="relative flex items-center gap-6">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-500/20 text-blue-400">
                      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white mb-1">Messagerie</h3>
                      <p className="text-sm text-slate-400">Échangez avec vos graphistes et monteurs</p>
                    </div>
                    <Link
                      href="/messages"
                      className="inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:bg-blue-400 transition"
                    >
                      Ouvrir
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </Link>
                  </div>
                </div>
              </>
            ) : (
              /* Stats pour Designers */
              <>
                {/* Missions disponibles */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-6 hover:border-slate-700 transition">
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 mb-4">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Opportunités</p>
                    <p className="text-2xl font-bold text-white mb-3">Nouvelles</p>
                    <Link href="/missions" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition">
                      Explorer →
                    </Link>
                  </div>
                </div>

                {/* Mes propositions */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-6 hover:border-slate-700 transition">
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 mb-4">
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Propositions</p>
                    <p className="text-2xl font-bold text-white mb-3">Envoyées</p>
                    <Link href="/my-proposals" className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition">
                      Suivre →
                    </Link>
                  </div>
                </div>

                {/* Livraisons */}
                <div className="relative overflow-hidden rounded-3xl bg-slate-900/80 border border-slate-800 p-6 hover:border-slate-700 transition">
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-pink-500/10 rounded-full blur-2xl" />
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-pink-500/20 text-pink-400 mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Livraisons</p>
                    <p className="text-2xl font-bold text-white mb-3">En cours</p>
                    <Link href="/deliveries" className="text-sm font-medium text-pink-400 hover:text-pink-300 transition">
                      Gérer →
                    </Link>
                  </div>
                </div>

                {/* Messagerie */}
                <div className="md:col-span-3 lg:col-span-1 relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-slate-900/50 border border-slate-800 p-6 hover:border-slate-700 transition">
                  <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />
                  <div className="relative">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-500/20 text-blue-400 mb-4">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Messages</p>
                    <p className="text-lg font-bold text-white mb-3">Discussions</p>
                    <Link
                      href="/messages"
                      className="inline-flex items-center gap-2 text-sm font-medium text-blue-400 hover:text-blue-300 transition"
                    >
                      Ouvrir la messagerie →
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>
        </section>

        {/* ============================================
            SECTION 3 - ACTIONS PRINCIPALES
            ============================================ */}
        <section>
          <SectionTitle 
            title="Actions rapides" 
            subtitle="Les fonctionnalités essentielles pour développer vos projets"
          />
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Action principale - Créer mission (créateur) ou Voir missions (designer) */}
            {isCreator ? (
              <ActionCard
                variant="primary"
                icon={
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                }
                title="Créer une mission"
                description="Publiez une nouvelle mission pour trouver le graphiste ou monteur idéal. Décrivez votre besoin, fixez votre budget et recevez des candidatures."
                buttonLabel="Créer une mission"
                buttonHref="/missions/create"
              />
            ) : (
              /* Pour les designers : optimiser le profil */
              <ActionCard
                variant="secondary"
                icon={
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                }
                title="Optimiser votre profil"
                description="Un profil complet augmente fortement vos chances d'être sélectionné. Ajoutez vos compétences, votre portfolio et vos tarifs."
                buttonLabel="Compléter mon profil"
                buttonHref="/profile"
              />
            )}

            {/* Action secondaire */}
            {isCreator ? (
              <ActionCard
                variant="secondary"
                icon={
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                }
                title="Trouver un graphiste / monteur"
                description="Utilisez la recherche avancée pour découvrir des profils adaptés à votre univers, vos besoins et votre budget."
                buttonLabel="Accéder à la recherche de talents"
                buttonHref="/search"
              />
            ) : (
              /* Pour les designers : accès aux missions disponibles */
              <ActionCard
                variant="primary"
                icon={
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                }
                title="Missions disponibles"
                description="Parcourez les missions postées par les créateurs de contenu. Filtrez par type, budget et proposez vos services."
                buttonLabel="Voir les missions"
                buttonHref="/missions"
              />
            )}
          </div>

          {/* Action tertiaire pour les créateurs - Profil */}
          {isCreator && (
            <div className="mt-6">
              <ActionCard
                variant="secondary"
                icon={
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                }
                title="Optimiser votre profil"
                description="Un profil complet augmente fortement vos chances de collaborations de qualité."
                buttonLabel="Compléter mon profil"
                buttonHref="/profile"
              />
            </div>
          )}
        </section>

        {/* ============================================
            SECTION 4 - TALENTS RECOMMANDÉS
            ============================================ */}
        {isCreator && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white">Graphistes / monteurs recommandés</h2>
                <p className="mt-1 text-sm text-slate-400">Découvrez des talents qui correspondent à vos besoins</p>
              </div>
              <a
                href="/search"
                className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300"
              >
                Voir tous les talents
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {RECOMMENDED_TALENTS.map((talent) => (
                <TalentCard
                  key={talent.name}
                  name={talent.name}
                  specialty={talent.specialty}
                  tags={talent.tags}
                  avatarInitial={talent.avatarInitial}
                  rating={talent.rating}
                />
              ))}
            </div>
          </section>
        )}

        {/* ============================================
            SECTION 5 - PROPOSITIONS REÇUES (créateurs) ou PROPOSITIONS ENVOYÉES (designers)
            ============================================ */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-white">
                {isCreator ? "Propositions reçues" : "Vos propositions"}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {isCreator ? "Candidatures des graphistes pour vos missions" : "Suivez l'état de vos candidatures"}
              </p>
            </div>
            {isCreator && proposalCounts.pending > 0 && (
              <Link
                href="/proposals"
                className="inline-flex items-center gap-2 rounded-full bg-yellow-500/20 px-4 py-2 text-sm font-semibold text-yellow-400 transition hover:bg-yellow-500/30"
              >
                <span className="flex h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                {proposalCounts.pending} en attente
              </Link>
            )}
          </div>

          {isCreator && recentProposals.length > 0 ? (
            <div className="space-y-3">
              {/* Liste des propositions récentes */}
              {recentProposals.slice(0, 3).map((proposal) => (
                <Link
                  key={proposal.id}
                  href="/proposals"
                  className={`block rounded-xl border p-4 transition-all hover:border-cyan-500/40 ${
                    proposal.status === "PENDING" 
                      ? "bg-yellow-500/5 border-yellow-500/30" 
                      : "bg-slate-900/80 border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-sm font-bold text-slate-900 overflow-hidden">
                      {proposal.designer.avatarUrl ? (
                        <Image
                          src={proposal.designer.avatarUrl}
                          alt={proposal.designer.displayName}
                          width={48}
                          height={48}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        proposal.designer.displayName.charAt(0).toUpperCase()
                      )}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-white truncate">{proposal.designer.displayName}</p>
                        {proposal.status === "PENDING" && (
                          <span className="flex h-2 w-2 rounded-full bg-yellow-400 animate-pulse" />
                        )}
                        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          proposal.status === "PENDING" 
                            ? "bg-yellow-500/20 text-yellow-400" 
                            : proposal.status === "ACCEPTED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }`}>
                          {proposal.status === "PENDING" ? "En attente" : proposal.status === "ACCEPTED" ? "Acceptée" : "Refusée"}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 truncate">
                        Pour : <span className="text-cyan-400">{proposal.mission.title}</span>
                        <span className="mx-2">•</span>
                        {TYPE_LABELS[proposal.mission.type]}
                      </p>
                    </div>

                    {/* Prix et date */}
                    <div className="text-right shrink-0">
                      {proposal.price && (
                        <p className="font-semibold text-emerald-400">{proposal.price} €</p>
                      )}
                      <p className="text-xs text-slate-500">{formatRelativeDate(proposal.createdAt)}</p>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Lien voir toutes */}
              <Link
                href="/proposals"
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-900/50 p-4 text-sm font-medium text-cyan-400 transition hover:bg-slate-800"
              >
                Voir toutes les propositions ({proposalCounts.total})
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          ) : (
            /* État vide */
            <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
                <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white">
                {isCreator ? "Aucune proposition reçue" : "Aucune proposition envoyée"}
              </h3>
              <p className="mt-2 text-sm text-slate-400">
                {isCreator 
                  ? "Publiez une mission pour recevoir des candidatures de graphistes et monteurs."
                  : "Parcourez les missions disponibles et proposez vos services aux créateurs."}
              </p>
              <a
                href={isCreator ? "/missions/create" : "/missions"}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-200 hover:bg-cyan-400"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {isCreator ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  )}
                </svg>
                {isCreator ? "Créer une mission" : "Voir les missions"}
              </a>
            </div>
          )}
        </section>

        {/* ============================================
            SECTION 6 - CONSEILS / TIPS
            ============================================ */}
        <section className="pb-10">
          <SectionTitle 
            title="Conseils pour mieux collaborer" 
            subtitle="Optimisez vos échanges avec les graphistes et monteurs"
          />
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <TipCard
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              }
              title="Comment bien briefer"
              description="Un brief clair et détaillé permet d'obtenir un résultat proche de vos attentes. Incluez des références visuelles, le ton souhaité et les contraintes techniques."
            />
            <TipCard
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              title="Fixer un budget adapté"
              description="Renseignez-vous sur les tarifs du marché. Un budget réaliste attire les meilleurs talents et garantit un travail de qualité."
            />
            <TipCard
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              }
              title="Communiquer efficacement"
              description="Répondez rapidement aux messages, donnez des retours constructifs et soyez précis dans vos demandes de modifications."
            />
          </div>
        </section>

      </div>
    </div>
    </SubscriptionGuard>
  );
}
