"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";

type UserProfile = {
  avatarUrl: string | null;
  displayName: string;
};

export function Header() {
  const { data: session, status } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [proposalCount, setProposalCount] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [missionsMenuOpen, setMissionsMenuOpen] = useState(false);
  const missionsMenuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (missionsMenuRef.current && !missionsMenuRef.current.contains(event.target as Node)) {
        setMissionsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Récupérer le nombre de messages non lus, propositions et le profil
  useEffect(() => {
    if (status !== "authenticated") return;

    async function fetchData() {
      try {
        // Récupérer les messages non lus
        const unreadRes = await fetch("/api/messages/unread");
        if (unreadRes.ok) {
          const data = await unreadRes.json();
          setUnreadCount(data.unreadCount || 0);
        }

        // Récupérer le profil pour l'avatar et le rôle
        const profileRes = await fetch("/api/profile");
        if (profileRes.ok) {
          const data = await profileRes.json();
          setProfile(data.user?.profile || null);
          setUserRole(data.user?.role || null);
        }

        // Récupérer le nombre de propositions en attente
        const proposalRes = await fetch("/api/proposals/count");
        if (proposalRes.ok) {
          const data = await proposalRes.json();
          setProposalCount(data.count || 0);
        }
      } catch {
        // Silently fail
      }
    }

    fetchData();

    // Fonction pour rafraîchir les compteurs
    async function refreshCounts() {
      try {
        const [unreadRes, proposalRes] = await Promise.all([
          fetch("/api/messages/unread"),
          fetch("/api/proposals/count")
        ]);
        
        if (unreadRes.ok) {
          const data = await unreadRes.json();
          setUnreadCount(data.unreadCount || 0);
        }
        if (proposalRes.ok) {
          const data = await proposalRes.json();
          setProposalCount(data.count || 0);
        }
      } catch {
        // Silently fail
      }
    }

    // Écouter l'événement de rafraîchissement des notifications
    window.addEventListener("refresh-notifications", refreshCounts);

    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(refreshCounts, 30000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("refresh-notifications", refreshCounts);
    };
  }, [status]);

  const isLoggedIn = status === "authenticated";

  return (
    <header className="border-b border-creax-blue/20 bg-creax-black sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo.png"
            alt="CREAX"
            width={44}
            height={44}
            className="rounded-lg"
          />
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          <Link href="/pricing" className="hover:underline text-creax-blue">
            Tarifs
          </Link>

          {isLoggedIn ? (
            <>
              {/* Menu Missions & Propositions */}
              <div className="relative" ref={missionsMenuRef}>
                <button
                  onClick={() => setMissionsMenuOpen(!missionsMenuOpen)}
                  className="relative flex items-center gap-2 text-creax-blue hover:underline"
                  >
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                      />
                    </svg>
                  <span className="hidden sm:inline">Missions</span>
                    <svg
                    className={`h-4 w-4 transition-transform ${missionsMenuOpen ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                    {proposalCount > 0 && (
                      <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-slate-900 animate-pulse">
                        {proposalCount > 9 ? "9+" : proposalCount}
                      </span>
                    )}
                </button>

                {/* Dropdown menu */}
                {missionsMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-52 rounded-lg bg-creax-black border border-creax-blue/20 shadow-lg py-2 z-50">
                    {userRole === "CREATOR" ? (
                      <>
                        <Link
                          href="/missions/my"
                          onClick={() => setMissionsMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-creax-blue hover:bg-creax-blue/10 transition"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Mes missions
                        </Link>
                        <Link
                          href="/proposals"
                          onClick={() => setMissionsMenuOpen(false)}
                          className="relative flex items-center gap-2 px-4 py-2 text-creax-blue hover:bg-creax-blue/10 transition"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Propositions reçues
                          {proposalCount > 0 && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-yellow-500 text-[10px] font-bold text-slate-900">
                              {proposalCount > 9 ? "9+" : proposalCount}
                            </span>
                          )}
                        </Link>
                        <div className="my-2 border-t border-creax-blue/10" />
                        <Link
                          href="/deliveries"
                          onClick={() => setMissionsMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-creax-blue hover:bg-creax-blue/10 transition"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          Livraisons
                  </Link>
                </>
                    ) : (
                <>
                  <Link
                    href="/missions"
                          onClick={() => setMissionsMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-creax-blue hover:bg-creax-blue/10 transition"
                  >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Missions disponibles
                        </Link>
                        <Link
                          href="/missions/assigned"
                          onClick={() => setMissionsMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-creax-blue hover:bg-creax-blue/10 transition"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                          Mes missions assignées
                  </Link>
                  <Link
                    href="/my-proposals"
                          onClick={() => setMissionsMenuOpen(false)}
                          className="relative flex items-center gap-2 px-4 py-2 text-creax-blue hover:bg-creax-blue/10 transition"
                  >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                          Mes propositions
                    {proposalCount > 0 && (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-slate-900">
                        {proposalCount > 9 ? "9+" : proposalCount}
                      </span>
                    )}
                  </Link>
                        <div className="my-2 border-t border-creax-blue/10" />
              <Link
                href="/deliveries"
                          onClick={() => setMissionsMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-creax-blue hover:bg-creax-blue/10 transition"
              >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                          Livraisons
              </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Bouton Messagerie avec notification */}
              <Link
                href="/messages"
                className="relative flex items-center gap-2 text-creax-blue hover:underline"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span className="hidden sm:inline">Messages</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <Link href="/dashboard" className="hover:underline text-creax-blue">
                Dashboard
              </Link>

              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-full bg-creax-blue px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-creax-black shadow-sm hover:bg-creax-blueDark transition"
              >
                {profile?.avatarUrl ? (
                  <div className="relative h-6 w-6 rounded-full overflow-hidden">
                    <Image
                      src={profile.avatarUrl}
                      alt="Mon profil"
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-creax-black/20 text-[10px] font-bold">
                    {(profile?.displayName || session?.user?.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline">Mon profil</span>
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline text-creax-blue">
                Connexion
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-creax-blue px-4 py-2 text-xs font-semibold uppercase tracking-wide text-creax-black shadow-sm hover:bg-creax-blueDark transition"
              >
                Créer un compte
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

