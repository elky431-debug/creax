"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import SubscriptionGuard from "@/components/SubscriptionGuard";

type UserProfile = {
  id: string;
  email: string;
  role: string;
  profile: {
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    skills: string | null;
    portfolioUrl: string | null;
    rate: string | null;
    contentTypes: string | null;
    needs: string | null;
  } | null;
};

function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [contactLoadingId, setContactLoadingId] = useState<string | null>(null);
  
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [roleFilter, setRoleFilter] = useState(searchParams.get("role") || "");

  async function handleContact(userId: string) {
    setContactLoadingId(userId);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: userId })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.conversation?.id) {
        router.push(`/messages?conversation=${data.conversation.id}`);
        return;
      }
      alert(data?.error || "Impossible d'ouvrir la conversation");
    } catch {
      alert("Erreur réseau lors de l'ouverture de la conversation");
    } finally {
      setContactLoadingId(null);
    }
  }

  // Vérifier l'auth et charger les résultats initiaux
  useEffect(() => {
    async function init() {
      try {
        const profileRes = await fetch("/api/profile");
        if (!profileRes.ok) {
          router.push("/login?callbackUrl=/search");
          return;
        }
        
        // Charger les utilisateurs
        await fetchUsers();
      } catch {
        router.push("/login?callbackUrl=/search");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [router]);

  async function fetchUsers() {
    setSearching(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (roleFilter) params.set("role", roleFilter);
      
      const res = await fetch(`/api/search?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } finally {
      setSearching(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    fetchUsers();
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative">
          <div className="h-12 w-12 rounded-full border-2 border-white/10 border-t-cyan-500 animate-spin" />
          <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-emerald-500/20 border-b-emerald-500 animate-spin" style={{ animationDirection: "reverse", animationDuration: "1.2s" }} />
        </div>
      </div>
    );
  }

  return (
    <SubscriptionGuard>
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Background (glow + grid) */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] bg-gradient-to-b from-cyan-500/[0.08] via-emerald-500/[0.035] to-transparent blur-[110px]" />
        <div className="absolute -bottom-56 left-0 w-[700px] h-[700px] bg-gradient-to-tr from-emerald-500/[0.06] via-cyan-500/[0.02] to-transparent blur-[120px]" />
        <div className="absolute -bottom-56 right-0 w-[700px] h-[700px] bg-gradient-to-tl from-cyan-500/[0.06] via-emerald-500/[0.02] to-transparent blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px"
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/10 to-black" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/[0.03] border border-white/10 px-4 py-2 mb-4 backdrop-blur-sm">
            <svg className="h-4 w-4 text-cyan-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-white/70">Talents</span>
          </div>
          <h1 className="text-4xl font-black text-white">Recherche</h1>
          <p className="mt-2 text-white/50">
            Trouvez le graphiste ou monteur idéal pour vos projets
          </p>
        </div>

        {/* Filtres */}
        <form onSubmit={handleSubmit} className="mb-8 sticky top-16 z-20">
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.10] p-5 backdrop-blur-xl shadow-xl shadow-black/40">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <svg className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Nom, compétences, type de contenu…"
                  className="w-full rounded-xl border border-white/[0.10] bg-white/[0.03] pl-12 pr-4 py-3 text-sm text-white placeholder-white/30 focus:border-cyan-500/50 focus:outline-none transition-colors"
                />
              </div>
              <div className="relative w-full lg:w-[260px]">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full appearance-none rounded-xl border border-white/[0.10] bg-white/[0.03] px-4 py-3 pr-10 text-sm text-white focus:border-cyan-500/50 focus:outline-none transition-colors"
                >
                  <option value="">Tous les profils</option>
                  <option value="DESIGNER">Graphistes / Monteurs</option>
                  <option value="CREATOR">Créateurs de contenu</option>
                </select>
                <svg className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              <button
                type="submit"
                disabled={searching}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-8 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-cyan-500/20 transition-all hover:shadow-cyan-500/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
              >
                {searching ? (
                  <>
                    <div className="h-4 w-4 rounded-full border-2 border-slate-900/30 border-t-slate-900 animate-spin" />
                    Recherche…
                  </>
                ) : (
                  <>
                    Rechercher
                    <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Résultats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="group relative rounded-2xl overflow-hidden transition-all duration-150 hover:-translate-y-1"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-[1px] rounded-2xl bg-[#0a0a0a] border border-white/[0.08]" />
              <div className="relative p-6">
              {/* Header */}
              <div className="flex items-start gap-4 mb-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-lg font-bold text-slate-900 overflow-hidden">
                  {user.profile?.avatarUrl ? (
                    <Image
                      src={user.profile.avatarUrl}
                      alt={user.profile?.displayName || "Avatar"}
                      width={48}
                      height={48}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (user.profile?.displayName || user.email).charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white truncate">
                    {user.profile?.displayName || user.email}
                  </h3>
                  <div className="mt-1 inline-flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider border ${
                      user.role === "CREATOR"
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                        : "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${user.role === "CREATOR" ? "bg-emerald-400" : "bg-cyan-400"} animate-pulse`} />
                      {user.role === "CREATOR" ? "Créateur" : "Designer"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              {user.profile?.bio && (
                <p className="text-sm text-slate-400 line-clamp-2 mb-4">
                  {user.profile.bio}
                </p>
              )}

              {/* Infos spécifiques */}
              <div className="space-y-2 mb-4">
                {user.role === "CREATOR" ? (
                  <>
                    {user.profile?.contentTypes && (
                      <p className="text-xs text-slate-500">
                        <span className="text-slate-400">Contenus:</span> {user.profile.contentTypes}
                      </p>
                    )}
                    {user.profile?.needs && (
                      <p className="text-xs text-slate-500">
                        <span className="text-slate-400">Besoins:</span> {user.profile.needs}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    {user.profile?.skills && (
                      <p className="text-xs text-slate-500">
                        <span className="text-slate-400">Compétences:</span> {user.profile.skills}
                      </p>
                    )}
                    {user.profile?.rate && (
                      <p className="text-xs text-slate-500">
                        <span className="text-slate-400">Tarifs:</span> {user.profile.rate}
                      </p>
                    )}
                  </>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <a
                  href={`/profile/${user.id}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/[0.12] bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/[0.06]"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Profil
                </a>
                <button
                  type="button"
                  onClick={() => handleContact(user.id)}
                  disabled={contactLoadingId === user.id}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-900 transition hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {contactLoadingId === user.id ? "Ouverture..." : "Contacter"}
                </button>
              </div>
              </div>
            </div>
          ))}
        </div>

        {/* Aucun résultat */}
        {users.length === 0 && !searching && (
          <div className="relative rounded-3xl overflow-hidden mt-10">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/12 via-transparent to-emerald-500/12" />
            <div className="absolute inset-[1px] rounded-3xl bg-[#0a0a0a]" />
            <div className="relative p-14 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/[0.04] border border-white/[0.08]">
              <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Aucun profil trouvé</h3>
            <p className="mt-2 text-sm text-white/40">
              Essayez d'élargir vos critères de recherche
            </p>
            </div>
          </div>
        )}
      </div>
    </div>
    </SubscriptionGuard>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">Chargement...</div>}>
      <SearchContent />
    </Suspense>
  );
}
