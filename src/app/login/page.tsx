"use client";

import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-creix-blue/20 bg-creix-black p-8 shadow-lg">
        <h1 className="text-center text-2xl font-bold text-creix-blue">
          Connexion à CREIX
        </h1>
        <p className="mt-2 text-center text-sm text-creix-blue/70">
          Accédez à votre espace créateur ou graphiste
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          {error && (
            <div className="rounded-lg bg-red-500/10 p-3 text-center text-sm text-red-400">
              {error}
            </div>
          )}

          {forgotSuccess && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-center">
              <p className="text-sm text-emerald-400 font-medium">✓ Email envoyé !</p>
              <p className="text-xs text-emerald-400/70 mt-1">
                Vérifiez votre boîte mail pour réinitialiser votre mot de passe.
              </p>
            </div>
          )}

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
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-creix-blue"
              >
                Mot de passe
              </label>
              <button 
                type="button"
                onClick={handleForgotPassword}
                disabled={forgotLoading}
                className="text-xs text-creix-blue/70 hover:text-creix-blue hover:underline disabled:opacity-50"
              >
                {forgotLoading ? "Envoi..." : "Mot de passe oublié ?"}
              </button>
            </div>
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-creix-blue px-4 py-3 font-semibold text-creix-black transition hover:bg-creix-blueDark disabled:opacity-50"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-creix-blue/70">
          Pas encore de compte ?{" "}
          <a href="/signup" className="text-creix-blue hover:underline">
            Créer un compte
          </a>
        </p>
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
