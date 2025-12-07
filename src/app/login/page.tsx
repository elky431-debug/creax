"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-creax-blue/20 bg-creax-black p-8 shadow-lg">
        <h1 className="text-center text-2xl font-bold text-creax-blue">
          Connexion à CREAX
        </h1>
        <p className="mt-2 text-center text-sm text-creax-blue/70">
          Accédez à votre espace créateur ou graphiste
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-creax-blue"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-creax-blue/30 bg-creax-black px-4 py-2 text-creax-blue placeholder-creax-blue/40 focus:border-creax-blue focus:outline-none focus:ring-1 focus:ring-creax-blue"
              placeholder="vous@exemple.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-creax-blue"
            >
              Mot de passe
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-creax-blue/30 bg-creax-black px-4 py-2 text-creax-blue placeholder-creax-blue/40 focus:border-creax-blue focus:outline-none focus:ring-1 focus:ring-creax-blue"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-creax-blue px-4 py-3 font-semibold text-creax-black transition hover:bg-creax-blueDark disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-creax-blue/70">
          Pas encore de compte ?{" "}
          <a href="/signup" className="text-creax-blue hover:underline">
            Créer un compte
          </a>
        </p>
      </div>
    </div>
  );
}
