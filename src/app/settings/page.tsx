"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";

type UserData = {
  email: string;
  role: "CREATOR" | "DESIGNER" | string;
  profile: { displayName: string } | null;
};

type ProfileResponse = {
  user: UserData;
};

function SettingCard({
  title,
  description,
  href,
  icon,
  accent = "cyan"
}: {
  title: string;
  description: string;
  href?: string;
  icon: React.ReactNode;
  accent?: "cyan" | "emerald" | "amber" | "red";
}) {
  const accentClasses =
    accent === "emerald"
      ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/20"
      : accent === "amber"
        ? "bg-amber-500/10 text-amber-200 border-amber-500/20"
        : accent === "red"
          ? "bg-red-500/10 text-red-200 border-red-500/20"
          : "bg-cyan-500/10 text-cyan-200 border-cyan-500/20";

  const inner = (
    <div className="group rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)] transition hover:bg-white/[0.05]">
      <div className="flex items-start gap-4">
        <div className={`mt-0.5 rounded-2xl border ${accentClasses} p-3`}>{icon}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            <span className="text-xs text-white/35 group-hover:text-white/50 transition">→</span>
          </div>
          <p className="mt-1 text-sm text-white/55">{description}</p>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {inner}
      </Link>
    );
  }

  return inner;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          setUser(null);
          return;
        }
        const data: ProfileResponse = await res.json();
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  const displayName = useMemo(() => {
    if (!user) return "Mon compte";
    return user.profile?.displayName || user.email || "Mon compte";
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const isDesigner = user.role === "DESIGNER";

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-44 -left-40 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-48 -right-40 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_45%)]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-10">
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-white">
            <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              Réglages
            </span>
          </h1>
          <p className="mt-2 text-white/55">
            Gérez votre compte, votre sécurité et vos préférences.{" "}
            <span className="text-white/35">({displayName})</span>
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SettingCard
            title="Profil"
            description="Informations publiques, avatar, bio et visibilité."
            href="/profile"
            accent="cyan"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            }
          />

          <SettingCard
            title="Sécurité"
            description="Modifier votre mot de passe et sécuriser l’accès."
            href="/settings/security"
            accent="emerald"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            }
          />

          <SettingCard
            title="Abonnement"
            description="Statut, résiliation et gestion de votre abonnement."
            href="/settings/subscription"
            accent="amber"
            icon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />

          {isDesigner ? (
            <SettingCard
              title="Paiements (IBAN)"
              description="Configurer vos informations bancaires pour les virements."
              href="/settings/bank"
              accent="emerald"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
              }
            />
          ) : (
            <SettingCard
              title="Zone de danger"
              description="Suppression de compte et actions irréversibles."
              href="/settings/danger"
              accent="red"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.73 3z" />
                </svg>
              }
            />
          )}
        </div>

        {/* Always show danger zone as a dedicated page (even for designers) */}
        {isDesigner && (
          <div className="mt-4">
            <SettingCard
              title="Zone de danger"
              description="Suppression de compte et actions irréversibles."
              href="/settings/danger"
              accent="red"
              icon={
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.73 3z" />
                </svg>
              }
            />
          </div>
        )}

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-5">
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full rounded-xl border border-red-500/25 bg-red-500/10 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
  );
}


