"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Vérifier si le token est valide
  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setValidating(false);
        return;
      }

      try {
        const res = await fetch(`/api/auth/reset-password?token=${token}`);
        setTokenValid(res.ok);
      } catch {
        setTokenValid(false);
      } finally {
        setValidating(false);
      }
    }

    validateToken();
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Le mot de passe doit contenir au moins 8 caractères");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  // Chargement
  if (validating) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-creix-blue/20 bg-creix-black p-8 shadow-lg text-center">
          <div className="animate-spin h-8 w-8 border-2 border-creix-cyan border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  // Token invalide ou manquant
  if (!token || !tokenValid) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-red-500/30 bg-creix-black p-8 shadow-lg text-center">
          <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Lien invalide</h1>
          <p className="text-gray-400 mb-6">
            Ce lien de réinitialisation est invalide ou a expiré.
          </p>
          <Link 
            href="/forgot-password"
            className="inline-block px-6 py-3 bg-creix-cyan text-black font-semibold rounded-full hover:bg-creix-cyan/90 transition"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  // Succès
  if (success) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-emerald-500/30 bg-creix-black p-8 shadow-lg text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Mot de passe modifié !</h1>
          <p className="text-gray-400 mb-6">
            Votre mot de passe a été réinitialisé avec succès.
          </p>
          <p className="text-sm text-gray-500">
            Redirection vers la connexion...
          </p>
        </div>
      </div>
    );
  }

  // Formulaire
  return (
    <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-creix-blue/20 bg-creix-black p-8 shadow-lg">
        <h1 className="text-center text-2xl font-bold text-creix-blue">
          Nouveau mot de passe
        </h1>
        <p className="mt-2 text-center text-sm text-creix-blue/70">
          Choisissez un nouveau mot de passe sécurisé
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-creix-blue"
            >
              Nouveau mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="mt-1 w-full rounded-lg border border-creix-blue/30 bg-creix-black px-4 py-2 text-creix-blue placeholder-creix-blue/40 focus:border-creix-blue focus:outline-none focus:ring-1 focus:ring-creix-blue"
              placeholder="••••••••"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum 8 caractères</p>
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-creix-blue"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-creix-blue/30 bg-creix-black px-4 py-2 text-creix-blue placeholder-creix-blue/40 focus:border-creix-blue focus:outline-none focus:ring-1 focus:ring-creix-blue"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-creix-blue px-4 py-3 font-semibold text-creix-black transition hover:bg-creix-blueDark disabled:opacity-50"
          >
            {loading ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-creix-black flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-creix-cyan border-t-transparent rounded-full"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}




