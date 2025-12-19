"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { PortfolioUploader } from "@/components/portfolio/PortfolioUploader";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import SubscriptionGuard from "@/components/SubscriptionGuard";

type ProfileData = {
  displayName: string;
  bio: string;
  skills: string;
  portfolioUrl: string;
  rate: string;
  contentTypes: string;
  needs: string;
  availability: string;
  avatarUrl: string | null;
  iban?: string;
  bankAccountHolder?: string;
  bankName?: string;
  bic?: string;
};

type UserData = {
  email: string;
  displayName: string;
  role: string;
  hasSubscription: boolean;
  profile: ProfileData | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [skills, setSkills] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [rate, setRate] = useState("");
  const [contentTypes, setContentTypes] = useState("");
  const [needs, setNeeds] = useState("");
  const [availability, setAvailability] = useState("");

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) {
          router.push("/login?callbackUrl=/profile");
          return;
        }
        const data = await res.json();
        setUser(data.user);

        // Pré-remplir le formulaire
        if (data.user?.profile) {
          setDisplayName(data.user.profile.displayName || "");
          setBio(data.user.profile.bio || "");
          setSkills(data.user.profile.skills || "");
          setPortfolioUrl(data.user.profile.portfolioUrl || "");
          setRate(data.user.profile.rate || "");
          setContentTypes(data.user.profile.contentTypes || "");
          setNeeds(data.user.profile.needs || "");
          setAvailability(data.user.profile.availability || "");
        } else {
          setDisplayName(data.user?.displayName || "");
        }
      } catch {
        router.push("/login?callbackUrl=/profile");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          bio,
          skills: user?.role === "CREATOR" ? undefined : skills,
          portfolioUrl: user?.role === "CREATOR" ? undefined : portfolioUrl,
          rate: user?.role === "CREATOR" ? undefined : rate,
          contentTypes: user?.role === "CREATOR" ? contentTypes : undefined,
          needs: user?.role === "CREATOR" ? needs : undefined,
          availability
        })
      });

      if (res.ok) {
        setMessage("Profil mis à jour avec succès !");
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la mise à jour");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;

  const isCreator = user.role === "CREATOR";

  return (
    <SubscriptionGuard>
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Mon profil</h1>
          <p className="mt-2 text-slate-400">
            Gérez vos informations publiques et optimisez votre visibilité.
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info compte */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Informations du compte</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Type de compte
                </label>
                <input
                  type="text"
                  value={isCreator ? "Créateur de contenu" : "Graphiste / Monteur"}
                  disabled
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-2 text-sm text-slate-400"
                />
              </div>
            </div>
          </div>

          {/* Photo de profil */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Photo de profil</h2>
            <AvatarUploader
              currentAvatarUrl={user.profile?.avatarUrl || null}
              displayName={displayName || user.email}
            />
          </div>

          {/* Profil public */}
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Profil public</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Nom affiché *
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="Votre nom ou pseudo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="Décrivez-vous en quelques lignes..."
                />
                <p className="mt-1 text-xs text-slate-500">{bio.length}/500 caractères</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">
                  Disponibilité
                </label>
                <input
                  type="text"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                  placeholder="Temps plein, temps partiel, en soirée..."
                />
              </div>
            </div>
          </div>

          {/* Champs spécifiques au rôle */}
          {isCreator ? (
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Informations créateur</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Types de contenu
                  </label>
                  <input
                    type="text"
                    value={contentTypes}
                    onChange={(e) => setContentTypes(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="YouTube, TikTok, Twitch, Instagram..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Vos besoins
                  </label>
                  <textarea
                    value={needs}
                    onChange={(e) => setNeeds(e.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="Miniatures, montages vidéo, identité visuelle..."
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">Informations graphiste / monteur</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Compétences
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="Montage vidéo, miniatures, motion design, After Effects..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Portfolio
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="https://behance.net/votre-portfolio"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">
                    Tarifs
                  </label>
                  <input
                    type="text"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
                    placeholder="À partir de 50€/miniature, 200€/montage..."
                  />
                </div>
              </div>
            </div>
          )}

          {/* Portfolio pour les designers */}
          {!isCreator && <PortfolioUploader />}

          {/* Paramètres de paiement pour les designers */}
          {!isCreator && <PaymentSettingsSection />}

          {/* Messages */}
          {error && (
            <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-400">
              {message}
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-cyan-500 px-8 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
            <a
              href="/dashboard"
              className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Retour au dashboard
            </a>
          </div>
        </form>

        {/* Section Abonnement */}
        <SubscriptionSection hasSubscription={user.hasSubscription} />

        {/* Zone de danger */}
        <DangerZone hasSubscription={user.hasSubscription} />

        {/* Bouton Déconnexion */}
        <div className="mt-8 pt-8 border-t border-slate-800">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-6 py-3 text-sm font-semibold text-red-400 transition hover:bg-red-500/20 hover:border-red-500/50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Se déconnecter
          </button>
        </div>
      </div>
    </div>
    </SubscriptionGuard>
  );
}

// Composant Zone de danger
function DangerZone({ hasSubscription }: { hasSubscription: boolean }) {
  const router = useRouter();
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleCancelSubscription() {
    setCancelLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/subscription/cancel", {
        method: "POST"
      });
      if (res.ok) {
        setShowCancelModal(false);
        window.location.reload();
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de l'annulation");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (confirmText !== "SUPPRIMER") return;
    
    setDeleteLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "DELETE"
      });
      if (res.ok) {
        await signOut({ callbackUrl: "/" });
      } else {
        const data = await res.json();
        setError(data.error || "Erreur lors de la suppression");
      }
    } catch {
      setError("Erreur réseau");
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <>
      <div className="mt-8 rounded-xl bg-red-950/30 border border-red-500/20 p-6">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Zone de danger</h2>
        <p className="text-sm text-slate-400 mb-6">
          Ces actions sont irréversibles. Procédez avec précaution.
        </p>

        <div className="space-y-4">
          {/* Annuler l'abonnement */}
          {hasSubscription && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-800">
              <div>
                <h3 className="text-sm font-medium text-white">Mettre fin à mon abonnement</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Votre abonnement restera actif jusqu'à la fin de la période en cours.
                </p>
              </div>
              <button
                onClick={() => setShowCancelModal(true)}
                className="rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-400 transition hover:bg-orange-500/20"
              >
                Annuler l'abonnement
              </button>
            </div>
          )}

          {/* Supprimer le compte */}
          <div className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-800">
            <div>
              <h3 className="text-sm font-medium text-white">Supprimer mon compte</h3>
              <p className="text-xs text-slate-500 mt-1">
                Toutes vos données seront définitivement supprimées.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              Supprimer le compte
            </button>
          </div>
        </div>
      </div>

      {/* Modal Annulation abonnement */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-800 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Annuler l'abonnement ?</h3>
            <p className="text-sm text-slate-400 mb-6">
              Êtes-vous sûr de vouloir annuler votre abonnement ? Vous conserverez l'accès jusqu'à la fin de votre période de facturation actuelle.
            </p>
            
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="flex-1 rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
              >
                {cancelLoading ? "Annulation..." : "Confirmer l'annulation"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Suppression compte */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-xl bg-slate-900 border border-slate-800 p-6">
            <h3 className="text-xl font-bold text-red-400 mb-4">⚠️ Supprimer le compte</h3>
            <p className="text-sm text-slate-400 mb-4">
              Cette action est <strong className="text-white">irréversible</strong>. Toutes vos données seront définitivement supprimées :
            </p>
            <ul className="text-sm text-slate-400 mb-6 space-y-1">
              <li>• Votre profil et portfolio</li>
              <li>• Vos missions et propositions</li>
              <li>• Vos messages et conversations</li>
              <li>• Votre abonnement (sans remboursement)</li>
            </ul>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Tapez <span className="text-red-400 font-bold">SUPPRIMER</span> pour confirmer
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm text-white placeholder-slate-500 focus:border-red-500 focus:outline-none"
                placeholder="SUPPRIMER"
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText("");
                }}
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || confirmText !== "SUPPRIMER"}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? "Suppression..." : "Supprimer définitivement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// Composant pour les paramètres de paiement (Designers uniquement)
function PaymentSettingsSection() {
  const [bankInfo, setBankInfo] = useState<{
    isConfigured: boolean;
    bankAccountHolder?: string;
    bankName?: string;
    bic?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBankInfo() {
      try {
        const res = await fetch("/api/profile/bank");
        if (res.ok) {
          const data = await res.json();
          setBankInfo(data);
        }
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    fetchBankInfo();
  }, []);

  if (loading) {
    return (
      <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <span className="text-slate-400">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-xl border p-6 ${
      bankInfo?.isConfigured 
        ? "bg-emerald-500/5 border-emerald-500/20" 
        : "bg-orange-500/5 border-orange-500/20"
    }`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
            bankInfo?.isConfigured ? "bg-emerald-500/20" : "bg-orange-500/20"
          }`}>
            <svg className={`h-5 w-5 ${bankInfo?.isConfigured ? "text-emerald-400" : "text-orange-400"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">💳 Paramètres de paiement</h2>
            <p className={`text-sm ${bankInfo?.isConfigured ? "text-emerald-400" : "text-orange-400"}`}>
              {bankInfo?.isConfigured ? "✓ Compte bancaire configuré" : "⚠️ Configuration requise"}
            </p>
          </div>
        </div>
      </div>

      {bankInfo?.isConfigured ? (
        <div className="space-y-3 mb-4">
          <div className="bg-slate-900/50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">Titulaire</p>
            <p className="text-sm text-white font-medium">{bankInfo.bankAccountHolder || "—"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">Banque</p>
              <p className="text-sm text-white">{bankInfo.bankName || "—"}</p>
            </div>
            <div className="bg-slate-900/50 rounded-lg p-3">
              <p className="text-xs text-slate-500 mb-1">IBAN</p>
              <p className="text-sm text-white font-mono">****</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">
            Vos informations bancaires sont sécurisées et chiffrées.
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-sm text-slate-400 mb-3">
            Configurez vos informations bancaires pour recevoir vos paiements lorsque vos travaux sont acceptés et payés par les créateurs.
          </p>
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
            <p className="text-xs text-orange-300">
              <strong>Important :</strong> Sans IBAN configuré, vous ne pourrez pas recevoir vos paiements.
            </p>
          </div>
        </div>
      )}

      <a
        href="/settings/bank"
        className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition ${
          bankInfo?.isConfigured 
            ? "border border-slate-700 bg-slate-800 text-white hover:bg-slate-700" 
            : "bg-gradient-to-r from-cyan-500 to-emerald-500 text-black hover:opacity-90"
        }`}
      >
        {bankInfo?.isConfigured ? (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifier mes informations bancaires
          </>
        ) : (
          <>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Configurer mon IBAN maintenant
          </>
        )}
      </a>
    </div>
  );
}

// Composant pour la gestion de l'abonnement
function SubscriptionSection({ hasSubscription }: { hasSubscription: boolean }) {
  const [loading, setLoading] = useState(false);
  const [subscription, setSubscription] = useState<{
    status: string;
    currentPeriodEnd: string;
    isTrial: boolean;
  } | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
        const res = await fetch("/api/subscription");
        if (res.ok) {
          const data = await res.json();
          setSubscription(data.subscription);
        }
      } catch {
        // Silently fail
      }
    }
    fetchSubscription();
  }, []);

  async function handleManageSubscription() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST"
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-8 rounded-xl bg-slate-900/80 border border-slate-800 p-6">
      <h2 className="text-lg font-semibold text-white mb-4">Abonnement</h2>

      {hasSubscription && subscription ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${
              subscription.status === "active" ? "bg-emerald-500" :
              subscription.status === "trialing" ? "bg-cyan-500" :
              "bg-yellow-500"
            }`} />
            <span className="text-sm text-white">
              {subscription.status === "active" && "Abonnement actif"}
              {subscription.status === "trialing" && "Période d'essai"}
              {subscription.status === "past_due" && "Paiement en retard"}
              {subscription.status === "canceled" && "Annulé"}
            </span>
          </div>

          {subscription.isTrial && (
            <p className="text-sm text-slate-400">
              Votre période d'essai se termine le{" "}
              <span className="text-white font-medium">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </span>
            </p>
          )}

          {!subscription.isTrial && (
            <p className="text-sm text-slate-400">
              Prochain renouvellement le{" "}
              <span className="text-white font-medium">
                {new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric"
                })}
              </span>
            </p>
          )}

          <button
            onClick={handleManageSubscription}
            disabled={loading}
            className="rounded-lg border border-slate-700 bg-slate-800 px-6 py-2 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-50"
          >
            {loading ? "Chargement..." : "Gérer mon abonnement"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-slate-400">
            Vous n'avez pas d'abonnement actif. Souscrivez pour accéder à toutes les fonctionnalités.
          </p>
          <a
            href="/pricing"
            className="inline-block rounded-lg bg-cyan-500 px-6 py-2 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400"
          >
            Voir les offres
          </a>
        </div>
      )}
    </div>
  );
}
