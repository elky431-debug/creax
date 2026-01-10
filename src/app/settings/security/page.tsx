"use client";

import Link from "next/link";
import { useState } from "react";
import SubscriptionGuard from "@/components/SubscriptionGuard";

function ChangePasswordOnly() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPasswords, setShowPasswords] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Les nouveaux mots de passe ne correspondent pas" });
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Le nouveau mot de passe doit contenir au moins 8 caractères" });
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Erreur lors du changement" });
        return;
      }

      setMessage({ type: "success", text: "Mot de passe modifié avec succès !" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setMessage({ type: "error", text: "Erreur de connexion au serveur" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
          <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Sécurité</h2>
          <p className="text-sm text-white/55">Modifier votre mot de passe</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Mot de passe actuel *</label>
          <input
            type={showPasswords ? "text" : "password"}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
            placeholder="Votre mot de passe actuel"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Nouveau mot de passe *</label>
          <input
            type={showPasswords ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
            placeholder="Minimum 8 caractères"
          />
          <p className="text-xs text-white/35 mt-1">Le mot de passe doit contenir au moins 8 caractères</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">Confirmer le nouveau mot de passe *</label>
          <input
            type={showPasswords ? "text" : "password"}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
            placeholder="Retapez le nouveau mot de passe"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="showPasswords"
            checked={showPasswords}
            onChange={(e) => setShowPasswords(e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-black/40 text-cyan-500 focus:ring-cyan-500/30"
          />
          <label htmlFor="showPasswords" className="text-sm text-white/55">
            Afficher les mots de passe
          </label>
        </div>

        {message && (
          <div
            className={`p-3 rounded-xl text-sm ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-200"
                : "bg-red-500/10 border border-red-500/25 text-red-200"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Modification..." : "Modifier le mot de passe"}
        </button>
      </form>
    </div>
  );
}

export default function SecuritySettingsPage() {
  return (
    <SubscriptionGuard>
      <div className="min-h-screen bg-black relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute top-44 -left-40 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-48 -right-40 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_45%)]" />
        </div>

        <div className="relative mx-auto max-w-4xl px-4 py-10">
          <Link href="/settings" className="inline-flex items-center gap-2 text-sm text-white/55 hover:text-white mb-6">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Retour aux réglages
          </Link>

          <h1 className="text-3xl font-black tracking-tight text-white mb-6">Sécurité</h1>
          <ChangePasswordOnly />
        </div>
      </div>
    </SubscriptionGuard>
  );
}


