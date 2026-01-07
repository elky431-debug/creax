"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultRole = searchParams.get("role") || "";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-creix-blue/20 bg-creix-black p-8 text-center shadow-lg">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-creix-blue/20">
            <svg
              className="h-8 w-8 text-creix-blue"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-creix-blue">
            Compte créé avec succès !
          </h2>
          <p className="mt-2 text-creix-blue/70">
            Redirection vers l&apos;abonnement...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-creix-blue/20 bg-creix-black p-8 shadow-lg">
        <h1 className="text-center text-2xl font-bold text-creix-blue">
          Créer un compte CREIX
        </h1>
        <p className="mt-2 text-center text-sm text-creix-blue/70">
          Rejoignez la communauté créateurs & graphistes
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-creix-blue">
              Type de compte
            </label>
            <div className="mt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("CREATOR")}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  role === "CREATOR"
                    ? "border-creix-blue bg-creix-blue/20 text-creix-blue"
                    : "border-creix-blue/30 text-creix-blue/70 hover:border-creix-blue/50"
                }`}
              >
                Créateur
              </button>
              <button
                type="button"
                onClick={() => setRole("DESIGNER")}
                className={`rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  role === "DESIGNER"
                    ? "border-creix-blue bg-creix-blue/20 text-creix-blue"
                    : "border-creix-blue/30 text-creix-blue/70 hover:border-creix-blue/50"
                }`}
              >
                Graphiste / Monteur
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="displayName"
              className="block text-sm font-medium text-creix-blue"
            >
              Nom affiché
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-creix-blue/30 bg-creix-black px-4 py-2 text-creix-blue placeholder-creix-blue/40 focus:border-creix-blue focus:outline-none focus:ring-1 focus:ring-creix-blue"
              placeholder="Votre nom ou pseudo"
            />
          </div>

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-creix-blue"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-creix-blue/30 bg-creix-black px-4 py-2 text-creix-blue placeholder-creix-blue/40 focus:border-creix-blue focus:outline-none focus:ring-1 focus:ring-creix-blue"
              placeholder="vous@exemple.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-creix-blue"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-creix-blue/30 bg-creix-black px-4 py-2 text-creix-blue placeholder-creix-blue/40 focus:border-creix-blue focus:outline-none focus:ring-1 focus:ring-creix-blue"
              placeholder="••••••••"
            />
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
            {loading ? "Création..." : "Créer mon compte"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-creix-blue/70">
          Déjà un compte ?{" "}
          <a href="/login" className="text-creix-blue hover:underline">
            Se connecter
          </a>
        </p>
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
