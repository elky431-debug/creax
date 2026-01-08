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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <SubscriptionGuard>
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-6xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Recherche de talents</h1>
          <p className="mt-2 text-slate-400">
            Trouvez le graphiste ou monteur idéal pour vos projets
          </p>
        </div>

        {/* Filtres */}
        <form onSubmit={handleSubmit} className="mb-8 rounded-xl bg-slate-900/80 border border-slate-800 p-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher par nom, compétence, type de contenu..."
              className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-3 text-sm text-white focus:border-cyan-500 focus:outline-none"
            >
              <option value="">Tous les profils</option>
              <option value="DESIGNER">Graphistes / Monteurs</option>
              <option value="CREATOR">Créateurs de contenu</option>
            </select>
            <button
              type="submit"
              disabled={searching}
              className="rounded-lg bg-cyan-500 px-8 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              {searching ? "Recherche..." : "Rechercher"}
            </button>
          </div>
        </form>

        {/* Résultats */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {users.map((user) => (
            <div
              key={user.id}
              className="group rounded-xl bg-slate-900/80 border border-slate-800 p-6 transition-all hover:border-cyan-500/40"
            >
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
                  <p className="text-sm text-cyan-400">
                    {user.role === "CREATOR" ? "Créateur de contenu" : "Graphiste / Monteur"}
                  </p>
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
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
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {contactLoadingId === user.id ? "Ouverture..." : "Contacter"}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Aucun résultat */}
        {users.length === 0 && !searching && (
          <div className="rounded-xl bg-slate-900/50 border border-slate-800 p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-800">
              <svg className="h-8 w-8 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">Aucun profil trouvé</h3>
            <p className="mt-2 text-sm text-slate-400">
              Essayez d'élargir vos critères de recherche
            </p>
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
