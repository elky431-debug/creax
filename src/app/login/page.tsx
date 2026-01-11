"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const billingSuccess = searchParams.get("billing") === "success";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Fonction pour envoyer le mail de réinitialisation
  async function handleForgotPassword(e: React.MouseEvent) {
    e.preventDefault();
    
    if (!email) {
      setError("Entrez votre email d'abord");
      return;
    }

    setForgotLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      if (res.ok) {
        setForgotSuccess(true);
        // Rediriger vers la page forgot-password pour afficher le message
        window.location.href = `/forgot-password?email=${encodeURIComponent(email)}&sent=true`;
      } else {
        const data = await res.json();
        setError(data.error || "Une erreur est survenue");
      }
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
      } else {
        router.push(callbackUrl);
      }
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
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
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  Connexion
                </p>

                <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
                  Connexion à{" "}
                  <span className="bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                    CREIX
                  </span>
                </h1>
                <p className="mt-2 text-sm text-white/45">
                  Accédez à votre espace créateur ou graphiste.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-300">
                    {error}
                  </div>
                )}

                {billingSuccess && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
                    <p className="text-sm font-semibold text-emerald-300">🎉 Abonnement activé avec succès !</p>
                    <p className="mt-1 text-xs text-emerald-200/70">
                      Connectez-vous pour accéder à toutes les fonctionnalités.
                    </p>
                  </div>
                )}

                {forgotSuccess && (
                  <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
                    <p className="text-sm font-semibold text-emerald-300">✓ Email envoyé !</p>
                    <p className="mt-1 text-xs text-emerald-200/70">
                      Vérifiez votre boîte mail pour réinitialiser votre mot de passe.
                    </p>
                  </div>
                )}

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

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-white/60">
                      Mot de passe
                    </label>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      disabled={forgotLoading}
                      className="text-xs font-semibold text-white/50 transition hover:text-white/80 disabled:opacity-50"
                    >
                      {forgotLoading ? "Envoi..." : "Mot de passe oublié ?"}
                    </button>
                  </div>

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
                      autoComplete="current-password"
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
                        Connexion...
                      </>
                    ) : (
                      <>
                        <span className="bg-gradient-to-r from-cyan-200 via-emerald-200 to-cyan-200 bg-clip-text text-transparent group-hover:text-slate-900">
                          Se connecter
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
                Pas encore de compte ?{" "}
                <Link
                  href="/signup"
                  className="font-semibold bg-gradient-to-r from-cyan-400 via-emerald-400 to-cyan-400 bg-clip-text text-transparent hover:opacity-90"
                >
                  Créer un compte
                </Link>
              </p>

              <p className="mt-3 text-center text-xs text-white/35">
                En vous connectant, vous acceptez les règles de la plateforme.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-creix-black flex items-center justify-center text-creix-blue">Chargement...</div>}>
      <LoginContent />
    </Suspense>
  );
}
