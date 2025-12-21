"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // Pré-remplir l'email depuis l'URL et vérifier si envoyé
  useEffect(() => {
    const emailParam = searchParams.get("email");
    const sentParam = searchParams.get("sent");
    if (emailParam) {
      setEmail(emailParam);
    }
    if (sentParam === "true") {
      setSuccess(true);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue");
        return;
      }

      setSuccess(true);
    } catch {
      setError("Erreur de connexion au serveur");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md flex-col justify-center px-4 py-12">
        <div className="rounded-2xl border border-emerald-500/30 bg-creix-black p-8 shadow-lg text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Email envoyé !</h1>
          <p className="text-gray-400 mb-6">
            Si un compte existe avec l&apos;adresse <span className="text-creix-cyan">{email}</span>, 
            vous recevrez un email avec les instructions pour réinitialiser votre mot de passe.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Vérifiez votre boîte de réception et vos spams.
          </p>
          <Link 
            href="/login"
            className="inline-block px-6 py-3 bg-creix-cyan text-black font-semibold rounded-full hover:bg-creix-cyan/90 transition"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-200px)] max-w-md flex-col justify-center px-4 py-12">
      <div className="rounded-2xl border border-creix-blue/20 bg-creix-black p-8 shadow-lg">
        <h1 className="text-center text-2xl font-bold text-creix-blue">
          Mot de passe oublié ?
        </h1>
        <p className="mt-2 text-center text-sm text-creix-blue/70">
          Entrez votre email pour recevoir un lien de réinitialisation
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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-creix-blue px-4 py-3 font-semibold text-creix-black transition hover:bg-creix-blueDark disabled:opacity-50"
          >
            {loading ? "Envoi en cours..." : "Envoyer le lien"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-creix-blue/70">
          <Link href="/login" className="text-creix-blue hover:underline">
            ← Retour à la connexion
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-creix-black flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-creix-cyan border-t-transparent rounded-full"></div>
      </div>
    }>
      <ForgotPasswordContent />
    </Suspense>
  );
}
