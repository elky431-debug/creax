"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<"CREATOR" | "DESIGNER">(
    defaultRole === "DESIGNER" ? "DESIGNER" : "CREATOR"
  );
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role, displayName })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
      } else {
        setSuccess(true);
        // Se connecter automatiquement puis aller sur /subscribe (paywall)
        const loginRes = await signIn("credentials", {
          email,
          password,
          redirect: false
        });

        if (loginRes?.error) {
          router.push("/login?callbackUrl=/subscribe");
        } else {
          router.push("/subscribe");
        }
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="relative flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-10">
        {/* Background glow */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-16 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[90px]" />
          <div className="absolute left-[20%] top-[35%] h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[90px]" />
          <div className="absolute right-[15%] top-[45%] h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-[100px]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_50%)]" />
        </div>

        <div className="relative w-full max-w-md">
          <div className="rounded-[26px] bg-gradient-to-r from-cyan-400/25 via-emerald-400/20 to-cyan-400/25 p-[1px] shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
            <div className="rounded-[25px] border border-white/[0.06] bg-[#0b0b0b]/90 backdrop-blur-xl">
              <div className="p-8 sm:p-9 text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400/20 to-emerald-400/10 ring-1 ring-white/[0.06]">
                  <svg className="h-7 w-7 text-emerald-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl font-extrabold tracking-tight text-white">
                  Compte créé avec succès !
                </h2>
                <p className="mt-2 text-sm text-white/45">
                  Redirection vers l&apos;abonnement...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-10">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-16 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[90px]" />
        <div className="absolute left-[20%] top-[35%] h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-[90px]" />
        <div className="absolute right-[15%] top-[45%] h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_50%)]" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Gradient border card */}
        <div className="rounded-[26px] bg-gradient-to-r from-cyan-400/25 via-emerald-400/20 to-cyan-400/25 p-[1px] shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
          <div className="rounded-[25px] border border-white/[0.06] bg-[#0b0b0b]/90 backdrop-blur-xl">
            <div className="p-8 sm:p-9">
              <div className="mb-7 text-center">
                <p className="inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/55">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                  Inscription
                </p>

                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
                  Créer un compte{" "}
                  <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    CREIX
                  </span>
                </h1>
                <p className="mt-2 text-sm text-white/45">
                  Rejoignez la communauté créateurs & graphistes.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-300">
                    {error}
                  </div>
                )}

                {/* Role */}
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">
                    Type de compte
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setRole("CREATOR")}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        role === "CREATOR"
                          ? "border-cyan-400/40 bg-cyan-400/10 text-white"
                          : "border-white/[0.10] bg-white/[0.02] text-white/60 hover:text-white/80 hover:border-white/[0.18]"
                      }`}
                    >
                      Créateur
                    </button>
                    <button
                      type="button"
                      onClick={() => setRole("DESIGNER")}
                      className={`rounded-xl border px-4 py-3 text-sm font-semibold transition ${
                        role === "DESIGNER"
                          ? "border-emerald-400/40 bg-emerald-400/10 text-white"
                          : "border-white/[0.10] bg-white/[0.02] text-white/60 hover:text-white/80 hover:border-white/[0.18]"
                      }`}
                    >
                      Graphiste / Monteur
                    </button>
                  </div>
                </div>

                {/* Display name */}
                <div>
                  <label htmlFor="displayName" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">
                    Nom affiché
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                      <svg className="h-5 w-5 text-white/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      required
                      autoComplete="name"
                      className="w-full rounded-xl border border-white/[0.10] bg-white/[0.02] pl-11 pr-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                      placeholder="Votre nom ou pseudo"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">
                    Email
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                      <svg className="h-5 w-5 text-white/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 10h18a2 2 0 002-2V8a2 2 0 00-2-2H3a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      className="w-full rounded-xl border border-white/[0.10] bg-white/[0.02] pl-11 pr-4 py-3 text-white placeholder-white/30 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                      placeholder="vous@exemple.com"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">
                    Mot de passe
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                      <svg className="h-5 w-5 text-white/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.105 0 2 .895 2 2v2a2 2 0 11-4 0v-2c0-1.105.895-2 2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V8a5 5 0 0110 0v3" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 11h12v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-white/[0.10] bg-white/[0.02] pl-11 pr-12 py-3 text-white placeholder-white/30 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-2 flex items-center rounded-lg px-2 text-white/45 transition hover:text-white/80"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.246.226-2.44.64-3.545m19.72 0A9.956 9.956 0 0122 9c0 5.523-4.477 10-10 10-.65 0-1.286-.06-1.904-.175M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-white/35">8 caractères minimum.</p>
                </div>

                {/* Confirm password */}
                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-white/60">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center">
                      <svg className="h-5 w-5 text-white/35" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.105 0 2 .895 2 2v2a2 2 0 11-4 0v-2c0-1.105.895-2 2-2z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M7 11V8a5 5 0 0110 0v3" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 11h12v8a2 2 0 01-2 2H8a2 2 0 01-2-2v-8z" />
                      </svg>
                    </div>
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="w-full rounded-xl border border-white/[0.10] bg-white/[0.02] pl-11 pr-12 py-3 text-white placeholder-white/30 outline-none transition focus:border-cyan-400/50 focus:ring-2 focus:ring-cyan-400/20"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute inset-y-0 right-2 flex items-center rounded-lg px-2 text-white/45 transition hover:text-white/80"
                      aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showConfirmPassword ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5.523 0-10-4.477-10-10 0-1.246.226-2.44.64-3.545m19.72 0A9.956 9.956 0 0122 9c0 5.523-4.477 10-10 10-.65 0-1.286-.06-1.904-.175M3 3l18 18" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.477 0 8.268 2.943 9.542 7-1.274 4.057-5.065 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 p-[1px] transition disabled:opacity-60"
                >
                  <div className="relative flex items-center justify-center gap-2 rounded-[11px] bg-[#0b0b0b] px-4 py-3 font-bold text-sm text-white transition group-hover:bg-transparent">
                    {loading ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        Création...
                      </>
                    ) : (
                      <>
                        <span className="bg-gradient-to-r from-cyan-200 via-emerald-200 to-cyan-200 bg-clip-text text-transparent group-hover:text-slate-900">
                          Créer mon compte
                        </span>
                        <svg className="h-4 w-4 text-white/60 group-hover:text-slate-900 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                      </>
                    )}
                  </div>
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-white/50">
                Déjà un compte ?{" "}
                <Link
                  href="/login"
                  className="font-semibold bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent hover:opacity-90"
                >
                  Se connecter
                </Link>
              </p>
              <p className="mt-3 text-center text-xs text-white/35">
                En créant un compte, vous acceptez les règles de la plateforme.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-creix-black flex items-center justify-center text-creix-blue">Chargement...</div>}>
      <SignupContent />
    </Suspense>
  );
}
