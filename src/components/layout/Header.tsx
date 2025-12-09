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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const missionsMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

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
    <header className="sticky top-0 z-50 border-b border-creix-blue/10 bg-creix-black/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
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
          <span className="text-lg font-bold tracking-tight text-creix-blue transition-colors duration-300 group-hover:text-white md:text-xl">
            CREIX
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          <Link 
            href="/pricing" 
            className="relative px-4 py-2 text-sm font-medium text-creix-blue/80 transition-all duration-200 hover:text-creix-blue"
          >
            <span className="relative z-10">Tarifs</span>
            <span className="absolute inset-0 rounded-lg bg-creix-blue/0 transition-colors duration-200 hover:bg-creix-blue/10" />
          </Link>

          {isLoggedIn ? (
            <>
              {/* Menu Missions & Propositions */}
              <div className="relative" ref={missionsMenuRef}>
                <button
                  onClick={() => setMissionsMenuOpen(!missionsMenuOpen)}
                  className="relative flex items-center gap-2 px-4 py-2 text-sm font-medium text-creix-blue/80 transition-all duration-200 hover:text-creix-blue rounded-lg hover:bg-creix-blue/10"
                >
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Missions</span>
                  <svg className={`h-3.5 w-3.5 transition-transform duration-200 ${missionsMenuOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  {proposalCount > 0 && (
                    <span className="absolute -top-0.5 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-slate-900 shadow-lg shadow-amber-500/30">
                      {proposalCount > 9 ? "9+" : proposalCount}
                    </span>
                  )}
                </button>

                {/* Dropdown menu */}
                {missionsMenuOpen && (
                  <div className="absolute top-full right-0 mt-2 w-56 origin-top-right animate-slide-in-from-top-2 rounded-xl border border-creix-blue/20 bg-creix-black/95 p-1.5 shadow-xl shadow-black/40 backdrop-blur-xl">
                    {userRole === "CREATOR" ? (
                      <>
                        <Link
                          href="/missions/my"
                          onClick={() => setMissionsMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-creix-blue/80 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                        >
                          <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          Mes missions
                        </Link>
                        <Link
                          href="/proposals"
                          onClick={() => setMissionsMenuOpen(false)}
                          className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-creix-blue/80 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                        >
                          <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Propositions reçues
                          {proposalCount > 0 && (
                            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-slate-900">
                              {proposalCount > 9 ? "9+" : proposalCount}
                            </span>
                          )}
                        </Link>
                        <div className="my-1.5 border-t border-creix-blue/10" />
                        <Link
                          href="/deliveries"
                          onClick={() => setMissionsMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-creix-blue/80 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
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
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-creix-blue/80 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                        >
                          <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          Missions disponibles
                        </Link>
                        <Link
                          href="/missions/assigned"
                          onClick={() => setMissionsMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-creix-blue/80 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                        >
                          <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Mes missions assignées
                        </Link>
                        <Link
                          href="/my-proposals"
                          onClick={() => setMissionsMenuOpen(false)}
                          className="relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-creix-blue/80 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                        >
                          <svg className="h-4 w-4 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                          Mes propositions
                          {proposalCount > 0 && (
                            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-slate-900">
                              {proposalCount > 9 ? "9+" : proposalCount}
                            </span>
                          )}
                        </Link>
                        <div className="my-1.5 border-t border-creix-blue/10" />
                        <Link
                          href="/deliveries"
                          onClick={() => setMissionsMenuOpen(false)}
                          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-creix-blue/80 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
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
                className="relative flex items-center gap-2 px-4 py-2 text-sm font-medium text-creix-blue/80 transition-all duration-200 hover:text-creix-blue rounded-lg hover:bg-creix-blue/10"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>Messages</span>
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white shadow-lg shadow-rose-500/30">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <Link 
                href="/dashboard" 
                className="px-4 py-2 text-sm font-medium text-creix-blue/80 transition-all duration-200 hover:text-creix-blue rounded-lg hover:bg-creix-blue/10"
              >
                Dashboard
              </Link>

              <Link
                href="/profile"
                className="group ml-2 flex items-center gap-2 rounded-full bg-gradient-to-r from-creix-blue to-creix-blue/80 pl-1 pr-4 py-1 text-xs font-semibold uppercase tracking-wide text-creix-black shadow-lg shadow-creix-blue/20 transition-all duration-300 hover:shadow-creix-blue/40 hover:scale-[1.02]"
              >
                {profile?.avatarUrl ? (
                  <div className="relative h-7 w-7 rounded-full overflow-hidden ring-2 ring-creix-black/20">
                    <Image
                      src={profile.avatarUrl}
                      alt="Mon profil"
                      fill
                      className="object-cover"
                      sizes="28px"
                    />
                  </div>
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-creix-black/20 text-[11px] font-bold">
                    {(profile?.displayName || session?.user?.email || "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span>Mon profil</span>
              </Link>
            </>
          ) : (
            <>
              <Link 
                href="/login" 
                className="px-4 py-2 text-sm font-medium text-creix-blue/80 transition-all duration-200 hover:text-creix-blue rounded-lg hover:bg-creix-blue/10"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="ml-2 rounded-full bg-gradient-to-r from-creix-blue to-creix-blue/80 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-creix-black shadow-lg shadow-creix-blue/20 transition-all duration-300 hover:shadow-creix-blue/40 hover:scale-[1.02]"
              >
                Créer un compte
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Navigation */}
        <div className="flex items-center gap-3 md:hidden" ref={mobileMenuRef}>
          {/* Tarifs link visible on mobile */}
          <Link 
            href="/pricing" 
            className="text-sm font-medium text-creix-blue/80 transition-colors hover:text-creix-blue"
          >
            Tarifs
          </Link>

          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-creix-blue/10 text-creix-blue transition-colors hover:bg-creix-blue/20"
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
            {(unreadCount > 0 || proposalCount > 0) && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white">
                {(unreadCount + proposalCount) > 9 ? "9+" : unreadCount + proposalCount}
              </span>
            )}
          </button>

          {/* Mobile menu dropdown */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 mx-4 origin-top animate-slide-in-from-top-2 rounded-2xl border border-creix-blue/20 bg-creix-black/95 p-2 shadow-xl shadow-black/40 backdrop-blur-xl">
              {isLoggedIn ? (
                <>
                  {/* User profile header */}
                  <div className="flex items-center gap-3 px-3 py-3 mb-2 rounded-xl bg-creix-blue/5">
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
                      <p className="text-sm font-medium text-creix-blue">{profile?.displayName || "Mon compte"}</p>
                      <p className="text-xs text-creix-blue/50">{session?.user?.email}</p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-creix-blue/80 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                  >
                    <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </Link>

                  <div className="my-2 border-t border-creix-blue/10" />
                  <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-creix-blue/40">Missions</p>
                  
                  {userRole === "CREATOR" ? (
                    <>
                      <Link
                        href="/missions/my"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-creix-blue/80 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                      >
                        <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Mes missions
                      </Link>
                      <Link
                        href="/proposals"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-creix-blue/80 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                      >
                        <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Propositions reçues
                        {proposalCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-bold text-slate-900">
                            {proposalCount}
                          </span>
                        )}
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/missions"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-creix-blue/80 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                      >
                        <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Missions disponibles
                      </Link>
                      <Link
                        href="/missions/assigned"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-creix-blue/80 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                      >
                        <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Mes missions assignées
                      </Link>
                      <Link
                        href="/my-proposals"
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-creix-blue/80 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                      >
                        <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Mes propositions
                        {proposalCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-slate-900">
                            {proposalCount}
                          </span>
                        )}
                      </Link>
                    </>
                  )}

                  <Link
                    href="/deliveries"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-creix-blue/80 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                  >
                    <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    Livraisons
                  </Link>

                  <div className="my-2 border-t border-creix-blue/10" />

                  <Link
                    href="/messages"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-creix-blue/80 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                  >
                    <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    Messages
                    {unreadCount > 0 && (
                      <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">
                        {unreadCount}
                      </span>
                    )}
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm text-creix-blue/80 transition-all duration-150 hover:bg-creix-blue/10 hover:text-creix-blue"
                  >
                    <svg className="h-5 w-5 opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Mon profil
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-creix-blue transition-all duration-150 hover:bg-creix-blue/10"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-creix-blue to-creix-blue/80 px-4 py-3 text-sm font-semibold uppercase tracking-wide text-creix-black shadow-lg shadow-creix-blue/20 transition-all duration-300"
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

