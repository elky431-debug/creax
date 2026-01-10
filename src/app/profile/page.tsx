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
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[520px] w-[920px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-44 -left-40 h-[420px] w-[420px] rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-48 -right-40 h-[520px] w-[520px] rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_45%)]" />
      </div>

      <div className="relative mx-auto max-w-4xl px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black tracking-tight text-white">
            <span className="bg-gradient-to-r from-white via-white to-white/70 bg-clip-text text-transparent">
              Mon profil
            </span>
          </h1>
          <p className="mt-2 text-white/55">
            Gérez vos informations publiques et optimisez votre visibilité.
          </p>
        </div>

        {/* Formulaire */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Info compte */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
            <h2 className="text-lg font-semibold text-white mb-4">Informations du compte</h2>
            
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white/40"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Type de compte
                </label>
                <input
                  type="text"
                  value={isCreator ? "Créateur de contenu" : "Graphiste / Monteur"}
                  disabled
                  className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-2.5 text-sm text-white/40"
                />
              </div>
            </div>
          </div>

          {/* Photo de profil */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
            <h2 className="text-lg font-semibold text-white mb-4">Photo de profil</h2>
            <AvatarUploader
              currentAvatarUrl={user.profile?.avatarUrl || null}
              displayName={displayName || user.email}
            />
          </div>

          {/* Profil public */}
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
            <h2 className="text-lg font-semibold text-white mb-4">Profil public</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Nom affiché *
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Votre nom ou pseudo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Bio
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Décrivez-vous en quelques lignes..."
                />
                <p className="mt-1 text-xs text-white/35">{bio.length}/500 caractères</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">
                  Disponibilité
                </label>
                <input
                  type="text"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
                  placeholder="Temps plein, temps partiel, en soirée..."
                />
              </div>
            </div>
          </div>

          {/* Champs spécifiques au rôle */}
          {isCreator ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
              <h2 className="text-lg font-semibold text-white mb-4">Informations créateur</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    Types de contenu
                  </label>
                  <input
                    type="text"
                    value={contentTypes}
                    onChange={(e) => setContentTypes(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
                    placeholder="YouTube, TikTok, Twitch, Instagram..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    Vos besoins
                  </label>
                  <textarea
                    value={needs}
                    onChange={(e) => setNeeds(e.target.value)}
                    rows={3}
                    className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
                    placeholder="Miniatures, montages vidéo, identité visuelle..."
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
              <h2 className="text-lg font-semibold text-white mb-4">Informations graphiste / monteur</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    Compétences
                  </label>
                  <input
                    type="text"
                    value={skills}
                    onChange={(e) => setSkills(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
                    placeholder="Montage vidéo, miniatures, motion design, After Effects..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    Portfolio
                  </label>
                  <input
                    type="url"
                    value={portfolioUrl}
                    onChange={(e) => setPortfolioUrl(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
                    placeholder="https://behance.net/votre-portfolio"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/70 mb-1">
                    Tarifs
                  </label>
                  <input
                    type="text"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
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
            <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4 text-sm text-red-200">
              {error}
            </div>
          )}
          {message && (
            <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              {message}
            </div>
          )}

          {/* Boutons */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-8 py-3 text-sm font-bold text-slate-900 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer les modifications"}
            </button>
            <a
              href="/dashboard"
              className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/[0.06]"
            >
              Retour au dashboard
            </a>
          </div>
        </form>

        {/* Section Mot de passe */}
        <ChangePasswordSection />

        {/* Section Abonnement */}
        <SubscriptionSection hasSubscription={user.hasSubscription} />

        {/* Zone de danger */}
        <DangerZone hasSubscription={user.hasSubscription} />

        {/* Bouton Déconnexion */}
        <div className="mt-8 pt-8 border-t border-white/10">
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 px-6 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/15 hover:border-red-500/40"
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
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [periodEnd, setPeriodEnd] = useState<string | null>(null);

  // Vérifier si l'abonnement est déjà en cours de résiliation
  useEffect(() => {
    async function checkCancellation() {
      if (!hasSubscription) return;
      try {
        // Inclure Stripe uniquement ici (page profil) pour récupérer cancel_at_period_end
        const res = await fetch("/api/subscription?stripe=1");
        if (res.ok) {
          const data = await res.json();
          setCancelAtPeriodEnd(data.subscription?.cancelAtPeriodEnd || false);
          setPeriodEnd(data.subscription?.currentPeriodEnd || null);
        }
      } catch {
        // Ignorer
      }
    }
    checkCancellation();
  }, [hasSubscription]);

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
      <div className="mt-8 rounded-2xl border border-red-500/25 bg-red-500/5 backdrop-blur-xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
        <h2 className="text-lg font-semibold text-red-200 mb-2">Zone de danger</h2>
        <p className="text-sm text-white/55 mb-6">
          Ces actions sont irréversibles. Procédez avec précaution.
        </p>

        <div className="space-y-4">
          {/* Annuler l'abonnement */}
          {hasSubscription && (
            <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/10">
              <div>
                <h3 className="text-sm font-medium text-white">
                  {cancelAtPeriodEnd ? "Résiliation programmée" : "Résilier mon abonnement"}
                </h3>
                <p className="text-xs text-white/35 mt-1">
                  {cancelAtPeriodEnd && periodEnd
                    ? `Votre abonnement prendra fin le ${new Date(periodEnd).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`
                    : "Votre abonnement restera actif jusqu'à la fin de la période en cours."
                  }
                </p>
              </div>
              {cancelAtPeriodEnd ? (
                <span className="rounded-xl bg-orange-500/15 px-4 py-2 text-sm font-semibold text-orange-200 border border-orange-500/20">
                  ✓ Résiliation confirmée
                </span>
              ) : (
                <button
                  onClick={() => setShowCancelModal(true)}
                  className="rounded-xl border border-orange-500/25 bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-200 transition hover:bg-orange-500/15"
                >
                  Résilier
                </button>
              )}
            </div>
          )}

          {/* Supprimer le compte */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-black/30 border border-white/10">
            <div>
              <h3 className="text-sm font-medium text-white">Supprimer mon compte</h3>
              <p className="text-xs text-white/35 mt-1">
                Toutes vos données seront définitivement supprimées.
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="rounded-xl border border-red-500/25 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:bg-red-500/15"
            >
              Supprimer le compte
            </button>
          </div>
        </div>
      </div>

      {/* Modal Annulation abonnement */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-2xl bg-black/80 border border-white/10 backdrop-blur-xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
            <h3 className="text-xl font-bold text-white mb-4">Annuler l'abonnement ?</h3>
            <p className="text-sm text-white/55 mb-6">
              Êtes-vous sûr de vouloir annuler votre abonnement ? Vous conserverez l'accès jusqu'à la fin de votre période de facturation actuelle.
            </p>
            
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/[0.06]"
              >
                Annuler
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="flex-1 rounded-xl bg-orange-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-orange-400 disabled:opacity-50"
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
          <div className="w-full max-w-md rounded-2xl bg-black/80 border border-white/10 backdrop-blur-xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.65)]">
            <h3 className="text-xl font-bold text-red-200 mb-4">Supprimer le compte</h3>
            <p className="text-sm text-white/55 mb-4">
              Cette action est <strong className="text-white">irréversible</strong>. Toutes vos données seront définitivement supprimées :
            </p>
            <ul className="text-sm text-white/55 mb-6 space-y-1">
              <li>• Votre profil et portfolio</li>
              <li>• Vos missions et propositions</li>
              <li>• Vos messages et conversations</li>
              <li>• Votre abonnement (sans remboursement)</li>
            </ul>

            <div className="mb-4">
              <label className="block text-sm font-medium text-white/70 mb-2">
                Tapez <span className="text-red-400 font-bold">SUPPRIMER</span> pour confirmer
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-red-400/60 focus:ring-2 focus:ring-red-500/20"
                placeholder="SUPPRIMER"
              />
            </div>
            
            {error && (
              <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/25 text-sm text-red-200">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setConfirmText("");
                }}
                className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-sm font-semibold text-white/90 hover:bg-white/[0.06]"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || confirmText !== "SUPPRIMER"}
                className="flex-1 rounded-xl bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed"
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

// Composant pour changer le mot de passe
function ChangePasswordSection() {
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

    // Validation côté client
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

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Erreur lors du changement" });
        return;
      }

      setMessage({ type: "success", text: "Mot de passe modifié avec succès !" });
      // Réinitialiser le formulaire
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
    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
          <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-semibold text-white">Modifier mon mot de passe</h2>
          <p className="text-sm text-white/55">Changez votre mot de passe de connexion</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Mot de passe actuel */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">
            Mot de passe actuel *
          </label>
          <div className="relative">
            <input
              type={showPasswords ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20 pr-10"
              placeholder="Votre mot de passe actuel"
            />
          </div>
        </div>

        {/* Nouveau mot de passe */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">
            Nouveau mot de passe *
          </label>
          <input
            type={showPasswords ? "text" : "password"}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-xl border border-white/10 bg-black/35 px-4 py-2.5 text-sm text-white placeholder-white/25 outline-none focus:border-cyan-400/60 focus:ring-2 focus:ring-cyan-500/20"
            placeholder="Minimum 8 caractères"
          />
          <p className="text-xs text-white/35 mt-1">
            Le mot de passe doit contenir au moins 8 caractères
          </p>
        </div>

        {/* Confirmer le nouveau mot de passe */}
        <div>
          <label className="block text-sm font-medium text-white/70 mb-1">
            Confirmer le nouveau mot de passe *
          </label>
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

        {/* Toggle afficher les mots de passe */}
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

        {/* Messages */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-emerald-500/10 border border-emerald-500/25 text-emerald-200"
              : "bg-red-500/10 border border-red-500/25 text-red-200"
          }`}>
            {message.text}
          </div>
        )}

        {/* Bouton */}
        <button
          type="submit"
          disabled={loading || !currentPassword || !newPassword || !confirmPassword}
          className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-cyan-500/20 transition hover:from-cyan-400 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-900/30 border-t-slate-900" />
              Modification...
            </span>
          ) : (
            "Modifier mon mot de passe"
          )}
        </button>
      </form>
    </div>
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
        } else {
          // Si erreur, considérer comme non configuré
          setBankInfo({ isConfigured: false });
        }
      } catch {
        // En cas d'erreur, considérer comme non configuré
        setBankInfo({ isConfigured: false });
      } finally {
        setLoading(false);
      }
    }
    fetchBankInfo();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <span className="text-white/55">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl border p-6 backdrop-blur-xl shadow-[0_30px_90px_rgba(0,0,0,0.55)] ${
      bankInfo?.isConfigured 
        ? "bg-emerald-500/5 border-emerald-500/25" 
        : "bg-orange-500/5 border-orange-500/25"
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
            <h2 className="text-lg font-semibold text-white">Paramètres de paiement</h2>
            <p className={`text-sm ${bankInfo?.isConfigured ? "text-emerald-400" : "text-orange-400"}`}>
              {bankInfo?.isConfigured ? "Compte bancaire configuré" : "Configuration requise"}
            </p>
          </div>
        </div>
      </div>

      {bankInfo?.isConfigured ? (
        <div className="space-y-3 mb-4">
          <div className="rounded-xl border border-white/10 bg-black/30 p-3">
            <p className="text-xs text-white/35 mb-1">Titulaire</p>
            <p className="text-sm text-white font-medium">{bankInfo.bankAccountHolder || "—"}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-white/35 mb-1">Banque</p>
              <p className="text-sm text-white">{bankInfo.bankName || "—"}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/30 p-3">
              <p className="text-xs text-white/35 mb-1">IBAN</p>
              <p className="text-sm text-white font-mono">****</p>
            </div>
          </div>
          <p className="text-xs text-white/35">
            Vos informations bancaires sont sécurisées et chiffrées.
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <p className="text-sm text-white/55 mb-3">
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
        className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
          bankInfo?.isConfigured 
            ? "border border-white/10 bg-white/[0.03] text-white/90 hover:bg-white/[0.06]" 
            : "bg-gradient-to-r from-cyan-500 to-emerald-500 text-slate-900 hover:from-cyan-400 hover:to-emerald-400 shadow-lg shadow-cyan-500/15"
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
    cancelAtPeriodEnd?: boolean;
  } | null>(null);

  useEffect(() => {
    async function fetchSubscription() {
      try {
      // Inclure Stripe uniquement ici (page profil) pour récupérer cancel_at_period_end
      const res = await fetch("/api/subscription?stripe=1");
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
    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]">
      <h2 className="text-lg font-semibold text-white mb-4">Abonnement</h2>

      {hasSubscription && subscription ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${
              subscription.cancelAtPeriodEnd ? "bg-orange-500" :
              subscription.status === "active" ? "bg-emerald-500" :
              subscription.status === "trialing" ? "bg-cyan-500" :
              "bg-yellow-500"
            }`} />
            <span className="text-sm text-white">
              {subscription.cancelAtPeriodEnd && "Résiliation programmée"}
              {!subscription.cancelAtPeriodEnd && subscription.status === "active" && "Abonnement actif"}
              {subscription.status === "trialing" && "Période d'essai"}
              {subscription.status === "past_due" && "Paiement en retard"}
              {subscription.status === "canceled" && !subscription.cancelAtPeriodEnd && "Annulé"}
            </span>
          </div>

          {subscription.cancelAtPeriodEnd && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
              <p className="text-sm text-orange-300">
                Votre abonnement prendra fin le{" "}
                <span className="font-medium text-white">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "long",
                    year: "numeric"
                  })}
                </span>
                . Vous conservez l'accès jusqu'à cette date.
              </p>
            </div>
          )}

          {subscription.isTrial && (
            <p className="text-sm text-white/55">
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
            <p className="text-sm text-white/55">
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
            className="rounded-xl border border-white/10 bg-white/[0.03] px-6 py-2.5 text-sm font-semibold text-white/90 transition hover:bg-white/[0.06] disabled:opacity-50"
          >
            {loading ? "Chargement..." : "Gérer mon abonnement"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-white/55">
            Vous n'avez pas d'abonnement actif. Souscrivez pour accéder à toutes les fonctionnalités.
          </p>
          <a
            href="/pricing"
            className="inline-block rounded-xl bg-gradient-to-r from-cyan-500 to-emerald-500 px-6 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-cyan-500/15 transition hover:from-cyan-400 hover:to-emerald-400"
          >
            Voir les offres
          </a>
        </div>
      )}
    </div>
  );
}

