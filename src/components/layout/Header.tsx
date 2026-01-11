"use client";

import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

type UserProfile = {
  avatarUrl: string | null;
  displayName: string;
};

export function Header() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [proposalCount, setProposalCount] = useState(0);
  const [dismissedUnreadBaseline, setDismissedUnreadBaseline] = useState(0);
  const [dismissedProposalBaseline, setDismissedProposalBaseline] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [missionsMenuOpen, setMissionsMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const missionsMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Restore dismissed baselines (client-only)
  useEffect(() => {
    try {
      const storedUnread = Number(localStorage.getItem("creix:dismissedUnreadBaseline") || "0");
      const storedProposals = Number(localStorage.getItem("creix:dismissedProposalBaseline") || "0");
      setDismissedUnreadBaseline(Number.isFinite(storedUnread) ? storedUnread : 0);
      setDismissedProposalBaseline(Number.isFinite(storedProposals) ? storedProposals : 0);
    } catch {
      // ignore
    }
  }, []);

  const displayedUnreadCount = Math.max(0, unreadCount - dismissedUnreadBaseline);
  const displayedProposalCount = Math.max(0, proposalCount - dismissedProposalBaseline);

  function dismissUnreadNow() {
    try {
      localStorage.setItem("creix:dismissedUnreadBaseline", String(unreadCount));
    } catch {
      // ignore
    }
    setDismissedUnreadBaseline(unreadCount);
  }

  function dismissProposalsNow() {
    try {
      localStorage.setItem("creix:dismissedProposalBaseline", String(proposalCount));
    } catch {
      // ignore
    }
    setDismissedProposalBaseline(proposalCount);
  }

  // Fermer le menu quand on clique ailleurs
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (missionsMenuRef.current && !missionsMenuRef.current.contains(event.target as Node)) {
        setMissionsMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
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
          const nextUnread = data.unreadCount || 0;
          setUnreadCount(nextUnread);
          // If counts decreased (read elsewhere), keep baseline in sync
          setDismissedUnreadBaseline((prev) => {
            const next = Math.min(prev, nextUnread);
            if (next !== prev) {
              try {
                localStorage.setItem("creix:dismissedUnreadBaseline", String(next));
              } catch {
                // ignore
              }
            }
            return next;
          });
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
          const nextCount = data.count || 0;
          setProposalCount(nextCount);
          // If counts decreased (handled/accepted elsewhere), keep baseline in sync
          setDismissedProposalBaseline((prev) => {
            const next = Math.min(prev, nextCount);
            if (next !== prev) {
              try {
                localStorage.setItem("creix:dismissedProposalBaseline", String(next));
              } catch {
                // ignore
              }
            }
            return next;
          });
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
          const nextUnread = data.unreadCount || 0;
          setUnreadCount(nextUnread);
          setDismissedUnreadBaseline((prev) => {
            const next = Math.min(prev, nextUnread);
            if (next !== prev) {
              try {
                localStorage.setItem("creix:dismissedUnreadBaseline", String(next));
              } catch {
                // ignore
              }
            }
            return next;
          });
        }
        if (proposalRes.ok) {
          const data = await proposalRes.json();
          const nextCount = data.count || 0;
          setProposalCount(nextCount);
          setDismissedProposalBaseline((prev) => {
            const next = Math.min(prev, nextCount);
            if (next !== prev) {
              try {
                localStorage.setItem("creix:dismissedProposalBaseline", String(next));
              } catch {
                // ignore
              }
            }
            return next;
          });
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

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const missionsActive = pathname.startsWith("/missions") || pathname.startsWith("/proposals") || pathname.startsWith("/deliveries");
  const navGradientText =
    "bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent";

  return (
    <header className="sticky top-0 z-50">
      {/* Solid black header */}
      <div className="absolute inset-0 bg-creix-black border-b border-creix-blue/20" />
      {/* Soft depth */}
      <div className="absolute inset-0 pointer-events-none shadow-[0_10px_40px_rgba(0,0,0,0.45)]" />
      {/* Accent line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-creix-blue/25" />

      <div className="relative mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        {/* Logo */}
        <Link href="/" className="group flex items-center gap-2.5 shrink-0">
          <div className="relative">
            <div className="absolute -inset-1 rounded-xl bg-creix-blue/20 opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100" />
            <Image
              src="/logo.png"
              alt="CREIX"
              width={40}
              height={40}
              className="relative rounded-xl shadow-lg shadow-creix-blue/10 transition-transform duration-300 group-hover:scale-105"
            />
          </div>
          <span className={`text-lg font-bold tracking-tight ${navGradientText} md:text-xl`}>
            CREIX
          </span>
        </Link>

        {/* Desktop Navigation - visible sur tablette et plus */}
        <nav className="hidden items-center gap-1 sm:flex">
          <Link 
            href="/pricing" 
            className={`relative px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 rounded-full border ${
              isActive("/pricing")
                ? "text-creix-blue bg-creix-blue/10 border-creix-blue/25"
                : "text-creix-blue/90 border-transparent hover:text-creix-blue hover:bg-creix-blue/10"
            }`}
          >
            <span className={`relative z-10 ${navGradientText}`}>Tarifs</span>
          </Link>

          {isLoggedIn ? (
            <>
              {/* Menu Missions & Propositions */}
              <div className="relative" ref={missionsMenuRef}>
                <button
                  onClick={() => setMissionsMenuOpen(!missionsMenuOpen)}
                  className={`relative flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 rounded-full border ${
                    missionsActive
                      ? "text-creix-blue bg-creix-blue/10 border-creix-blue/25"
                      : "text-creix-blue/90 border-transparent hover:text-creix-blue hover:bg-creix-blue/10"
                  }`}
                >
                  <svg className="h-4 w-4 hidden sm:block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span className={navGradientText}>Missions</span>
                  <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${missionsMenuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {displayedProposalCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-lg shadow-red-500/30 ring-2 ring-creix-black">
                      {displayedProposalCount > 9 ? "9+" : displayedProposalCount}
                    </span>
                  )}
                </button>

                {/* Dropdown menu */}
                {missionsMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 origin-top-right animate-slide-in-from-top-2 rounded-2xl border border-creix-blue/20 bg-creix-black p-1.5 shadow-2xl shadow-black/60">
                    {userRole === "CREATOR" ? (
                      <>
                        <Link
                          href="/missions/my"
                          onClick={() => setMissionsMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-creix-blue/90 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                        >
                          <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Mes missions
                        </Link>
                        <Link
                          href="/proposals"
                          onClick={() => {
                            setMissionsMenuOpen(false);
                            dismissProposalsNow(); // hide immediately on click (and persist)
                          }}
                          className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-creix-blue/90 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                        >
                          <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Propositions reçues
                          {displayedProposalCount > 0 && (
                            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                              {displayedProposalCount > 9 ? "9+" : displayedProposalCount}
                            </span>
                          )}
                        </Link>
                        <div className="my-1.5 border-t border-creix-blue/10" />
                        <Link
                          href="/deliveries"
                          onClick={() => setMissionsMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-creix-blue/90 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                        >
                          <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-creix-blue/90 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                        >
                          <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Missions disponibles
                        </Link>
                        <Link
                          href="/missions/assigned"
                          onClick={() => setMissionsMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-creix-blue/90 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                        >
                          <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Mes missions assignées
                        </Link>
                        <Link
                          href="/my-proposals"
                          onClick={() => {
                            setMissionsMenuOpen(false);
                            dismissProposalsNow(); // hide immediately on click (and persist)
                          }}
                          className="relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-creix-blue/90 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                        >
                          <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Mes propositions
                          {displayedProposalCount > 0 && (
                            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                              {displayedProposalCount > 9 ? "9+" : displayedProposalCount}
                            </span>
                          )}
                        </Link>
                        <div className="my-1.5 border-t border-creix-blue/10" />
                        <Link
                          href="/deliveries"
                          onClick={() => setMissionsMenuOpen(false)}
                          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-creix-blue/90 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                        >
                          <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                onClick={dismissUnreadNow} // hide immediately on click (and persist)
                className={`relative flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 rounded-full border ${
                  isActive("/messages")
                    ? "text-creix-blue bg-creix-blue/10 border-creix-blue/25"
                    : "text-creix-blue/90 border-transparent hover:text-creix-blue hover:bg-creix-blue/10"
                }`}
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className={`hidden sm:inline ${navGradientText}`}>Messages</span>
                {displayedUnreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white shadow-lg shadow-red-500/30 ring-2 ring-creix-black">
                    {displayedUnreadCount > 9 ? "9+" : displayedUnreadCount}
                  </span>
                )}
              </Link>

              <Link 
                href="/dashboard" 
                className={`px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 rounded-full border ${
                  isActive("/dashboard")
                    ? "text-creix-blue bg-creix-blue/10 border-creix-blue/25"
                    : "text-creix-blue/90 border-transparent hover:text-creix-blue hover:bg-creix-blue/10"
                }`}
              >
                <span className={`hidden sm:inline ${navGradientText}`}>Dashboard</span>
                <svg className="h-4 w-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </Link>

              <Link
                href="/settings"
                className={`px-2.5 sm:px-3.5 py-2 text-xs sm:text-sm font-semibold transition-all duration-200 rounded-full border ${
                  isActive("/settings")
                    ? "text-creix-blue bg-creix-blue/10 border-creix-blue/25"
                    : "text-creix-blue/90 border-transparent hover:text-creix-blue hover:bg-creix-blue/10"
                }`}
              >
                <span className={`hidden sm:inline ${navGradientText}`}>Réglages</span>
                <svg className="h-4 w-4 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.983 13.321a1.341 1.341 0 100-2.683 1.341 1.341 0 000 2.683z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.6 13.321a8.2 8.2 0 00.05-1.321 8.2 8.2 0 00-.05-1.321l-1.89-.311a6.67 6.67 0 00-.745-1.795l1.114-1.57a8.32 8.32 0 00-1.87-1.87l-1.57 1.114a6.67 6.67 0 00-1.795-.745l-.311-1.89A8.2 8.2 0 0012 3.35a8.2 8.2 0 00-1.321.05l-.311 1.89a6.67 6.67 0 00-1.795.745L7.003 4.92a8.32 8.32 0 00-1.87 1.87l1.114 1.57a6.67 6.67 0 00-.745 1.795l-1.89.311A8.2 8.2 0 003.35 12c0 .45.02.89.05 1.321l1.89.311c.17.63.424 1.23.745 1.795l-1.114 1.57c.54.72 1.15 1.33 1.87 1.87l1.57-1.114c.565.321 1.165.575 1.795.745l.311 1.89c.431.03.87.05 1.321.05.45 0 .89-.02 1.321-.05l.311-1.89a6.67 6.67 0 001.795-.745l1.57 1.114c.72-.54 1.33-1.15 1.87-1.87l-1.114-1.57c.321-.565.575-1.165.745-1.795l1.89-.311z" />
                </svg>
              </Link>

              <Link
                href="/profile"
                className={`group ml-1 sm:ml-2 flex items-center gap-2 rounded-full pl-1 pr-2 sm:pr-3 py-1 text-[10px] sm:text-xs font-semibold uppercase tracking-wide transition-all duration-300 hover:scale-[1.02] ${
                  isActive("/profile")
                    ? "bg-creix-blue/10 text-creix-blue shadow-lg shadow-creix-blue/10 ring-1 ring-creix-blue/25"
                    : "bg-creix-blue/10 text-creix-blue shadow-lg shadow-creix-blue/10 ring-1 ring-creix-blue/20 hover:bg-creix-blue/15"
                }`}
              >
                {profile?.avatarUrl ? (
                  <div className="relative h-6 w-6 sm:h-7 sm:w-7 rounded-full overflow-hidden ring-2 ring-creix-black/25 shadow-sm">
                    <Image
                      src={profile.avatarUrl}
                      alt="Mon profil"
                      fill
                      className="object-cover"
                      sizes="28px"
                    />
                  </div>
                ) : (
                  <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-creix-black/20 text-[10px] sm:text-[11px] font-bold ring-2 ring-creix-black/25">
                    {(profile?.displayName || session?.user?.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className={`hidden sm:inline ${navGradientText}`}>Profil</span>
              </Link>
            </>
          ) : (
            <>
              <Link 
                href="/login" 
                className={`px-4 py-2 text-sm font-semibold transition-all duration-200 rounded-full border ${
                  isActive("/login")
                    ? "text-creix-blue bg-creix-blue/10 border-creix-blue/25"
                    : "text-creix-blue/90 border-transparent hover:text-creix-blue hover:bg-creix-blue/10"
                }`}
              >
                <span className={navGradientText}>Connexion</span>
              </Link>
              <Link
                href="/signup"
                className="ml-2 rounded-full border border-creix-blue/30 bg-creix-blue/10 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-creix-blue shadow-lg shadow-creix-blue/10 transition-all duration-300 hover:bg-creix-blue/15 hover:shadow-creix-blue/20 hover:scale-[1.02]"
              >
                <span className={navGradientText}>Créer un compte</span>
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Navigation - seulement sur très petit écran */}
        <div className="flex items-center gap-3 sm:hidden" ref={mobileMenuRef}>
          {/* Tarifs link visible on mobile */}
          <Link 
            href="/pricing" 
            className={`text-sm font-semibold transition-colors ${navGradientText}`}
          >
            Tarifs
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-creix-blue/10 text-creix-blue transition-colors hover:bg-creix-blue/15"
            aria-label="Menu"
          >
            <svg 
              className={`h-5 w-5 transition-transform duration-200 ${mobileMenuOpen ? "rotate-90 opacity-0" : ""}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg 
              className={`absolute h-5 w-5 transition-transform duration-200 ${mobileMenuOpen ? "" : "-rotate-90 opacity-0"}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            {(displayedUnreadCount > 0 || displayedProposalCount > 0) && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {(displayedUnreadCount + displayedProposalCount) > 9 ? "9+" : displayedUnreadCount + displayedProposalCount}
              </span>
            )}
          </button>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 mx-4 origin-top animate-slide-in-from-top-2 rounded-2xl border border-creix-blue/20 bg-creix-black p-2 shadow-2xl shadow-black/60">
              {isLoggedIn ? (
                <>
                  {/* User profile header */}
                  <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                    {profile?.avatarUrl ? (
                      <div className="relative h-10 w-10 rounded-full overflow-hidden ring-2 ring-creix-blue/30">
                        <Image
                          src={profile.avatarUrl}
                          alt="Mon profil"
                          fill
                          className="object-cover"
                          sizes="40px"
                        />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-creix-blue/20 text-sm font-bold text-creix-blue">
                        {(profile?.displayName || session?.user?.email || "U").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-semibold text-creix-blue">{profile?.displayName || "Mon compte"}</p>
                      <p className="text-xs text-creix-blue/50">{session?.user?.email}</p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-creix-blue/90 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                  >
                    <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </Link>

                  <div className="my-2 border-t border-creix-blue/10" />
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-creix-blue/50">Missions</p>
                  
                  {userRole === "CREATOR" ? (
                    <>
                      <Link
                        href="/missions/my"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-creix-blue/90 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                      >
                        <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Mes missions
                      </Link>
                      <Link
                        href="/proposals"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          dismissProposalsNow(); // hide immediately on click (and persist)
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-creix-blue/90 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                      >
                        <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Propositions reçues
                        {displayedProposalCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                            {displayedProposalCount > 9 ? "9+" : displayedProposalCount}
                          </span>
                        )}
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/missions"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-creix-blue/90 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                      >
                        <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Missions disponibles
                      </Link>
                      <Link
                        href="/missions/assigned"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-creix-blue/90 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                      >
                        <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mes missions assignées
                      </Link>
                      <Link
                        href="/my-proposals"
                        onClick={() => {
                          setMobileMenuOpen(false);
                          dismissProposalsNow(); // hide immediately on click (and persist)
                        }}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-creix-blue/90 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                      >
                        <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Mes propositions
                        {displayedProposalCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                            {displayedProposalCount > 9 ? "9+" : displayedProposalCount}
                          </span>
                        )}
                      </Link>
                    </>
                  )}

                  <Link
                    href="/deliveries"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-creix-blue/90 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                  >
                    <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Livraisons
                  </Link>

                  <div className="my-2 border-t border-creix-blue/10" />

                  <Link
                    href="/messages"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      dismissUnreadNow(); // hide immediately on click (and persist)
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-creix-blue/90 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                  >
                    <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Messages
                    {displayedUnreadCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
                        {displayedUnreadCount > 9 ? "9+" : displayedUnreadCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-creix-blue/90 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                  >
                    <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Mon profil
                  </Link>

                  <Link
                    href="/settings"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-creix-blue/90 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                  >
                    <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.983 13.321a1.341 1.341 0 100-2.683 1.341 1.341 0 000 2.683z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.6 13.321a8.2 8.2 0 00.05-1.321 8.2 8.2 0 00-.05-1.321l-1.89-.311a6.67 6.67 0 00-.745-1.795l1.114-1.57a8.32 8.32 0 00-1.87-1.87l-1.57 1.114a6.67 6.67 0 00-1.795-.745l-.311-1.89A8.2 8.2 0 0012 3.35a8.2 8.2 0 00-1.321.05l-.311 1.89a6.67 6.67 0 00-1.795.745L7.003 4.92a8.32 8.32 0 00-1.87 1.87l1.114 1.57a6.67 6.67 0 00-.745 1.795l-1.89.311A8.2 8.2 0 003.35 12c0 .45.02.89.05 1.321l1.89.311c.17.63.424 1.23.745 1.795l-1.114 1.57c.54.72 1.15 1.33 1.87 1.87l1.57-1.114c.565.321 1.165.575 1.795.745l.311 1.89c.431.03.87.05 1.321.05.45 0 .89-.02 1.321-.05l.311-1.89a6.67 6.67 0 001.795-.745l1.57 1.114c.72-.54 1.33-1.15 1.87-1.87l-1.114-1.57c.321-.565.575-1.165.745-1.795l1.89-.311z" />
                    </svg>
                    Réglages
                  </Link>

                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      void (async () => {
                        const { signOut } = await import("next-auth/react");
                        await signOut({ callbackUrl: "/login" });
                      })();
                    }}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-red-400 transition-all duration-150 hover:bg-red-500/10"
                  >
                    <svg className="h-5 w-5 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 11-4 0v-1m0-8V7a2 2 0 114 0v1" />
                    </svg>
                    Se déconnecter
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-creix-blue transition-all duration-150 hover:bg-creix-blue/10"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border border-creix-blue/30 bg-creix-blue/10 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-creix-blue shadow-lg shadow-creix-blue/10 transition-all duration-300"
                  >
                    Créer un compte
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

