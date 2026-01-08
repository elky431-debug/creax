"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

type PortfolioImage = {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
};

type UserProfile = {
  id: string;
  email: string;
  role: string;
  createdAt: string;
  profile: {
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
    skills: string | null;
    portfolioUrl: string | null;
    rate: string | null;
    availability: string | null;
    contentTypes: string | null;
    needs: string | null;
    portfolioImages?: PortfolioImage[];
  } | null;
};

export default function PublicProfilePage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [contactLoading, setContactLoading] = useState(false);

  async function handleContact(targetUserId: string) {
    setContactLoading(true);
    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherUserId: targetUserId })
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.conversation?.id) {
        router.push(`/messages?conversation=${data.conversation.id}`);
        return;
      }
      alert(data?.error || "Impossible d'ouvrir la conversation");
    } catch {
      alert("Erreur réseau lors de l'ouverture de la conversation");
    } finally {
      setContactLoading(false);
    }
  }

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/users/${userId}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError("Utilisateur introuvable");
          } else if (res.status === 401) {
            router.push("/login?callbackUrl=/profile/" + userId);
            return;
          } else {
            setError("Erreur lors du chargement du profil");
          }
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch {
        setError("Erreur de connexion");
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [userId, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            {error || "Profil introuvable"}
          </h1>
          <Link
            href="/search"
            className="text-cyan-400 hover:underline"
          >
            ← Retour à la recherche
          </Link>
        </div>
      </div>
    );
  }

  const isDesigner = user.role === "DESIGNER";
  const profile = user.profile;
  const displayName = profile?.displayName || user.email;
  const initials = displayName.slice(0, 2).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="mx-auto max-w-4xl px-4 py-10">
        {/* Bouton retour */}
        <Link
          href="/search"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white mb-8 transition"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Retour à la recherche
        </Link>

        {/* Header du profil */}
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-900/50 border border-slate-800 p-8 mb-8">
          <div className="flex flex-col sm:flex-row gap-6 items-start">
            {/* Avatar */}
            {profile?.avatarUrl ? (
              <div className="relative h-24 w-24 shrink-0 rounded-2xl overflow-hidden">
                <Image
                  src={profile.avatarUrl}
                  alt={displayName}
                  fill
                  className="object-cover"
                  sizes="96px"
                />
              </div>
            ) : (
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 text-3xl font-bold text-slate-900">
                {initials}
              </div>
            )}

            {/* Infos principales */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{displayName}</h1>
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  isDesigner 
                    ? "bg-emerald-500/20 text-emerald-400" 
                    : "bg-cyan-500/20 text-cyan-400"
                }`}>
                  {isDesigner ? "Graphiste / Monteur" : "Créateur de contenu"}
                </span>
              </div>

              {profile?.bio && (
                <p className="text-slate-400 mb-4 max-w-2xl">{profile.bio}</p>
              )}

              {/* Infos rapides */}
              <div className="flex flex-wrap gap-4 text-sm">
                {profile?.availability && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {profile.availability}
                  </div>
                )}
                {isDesigner && profile?.rate && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <svg className="h-4 w-4 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {profile.rate}
                  </div>
                )}
                <div className="flex items-center gap-2 text-slate-400">
                  <svg className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Membre depuis {new Date(user.createdAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
                </div>
              </div>
            </div>

            {/* Bouton contacter */}
            <button
              type="button"
              onClick={() => handleContact(user.id)}
              disabled={contactLoading}
              className="shrink-0 flex items-center gap-2 rounded-xl bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              {contactLoading ? "Ouverture..." : "Contacter"}
            </button>
          </div>
        </div>

        {/* Contenu spécifique au rôle */}
        <div className="grid gap-6 md:grid-cols-2">
          {isDesigner ? (
            <>
              {/* Compétences */}
              {profile?.skills && (
                <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    Compétences
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.split(",").map((skill, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Portfolio unifié */}
              <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 md:col-span-2">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Portfolio
                </h2>

                {/* Images du portfolio */}
                {profile?.portfolioImages && profile.portfolioImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {profile.portfolioImages.map((img) => (
                      <PortfolioImageCard key={img.id} image={img} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 mb-4">Aucune création ajoutée pour le moment.</p>
                )}

                {/* Lien externe (si renseigné) */}
                {profile?.portfolioUrl && (
                  <a
                    href={profile.portfolioUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-3 rounded-lg bg-slate-800 p-4 text-sm text-white transition hover:bg-slate-700 group ${
                      profile?.portfolioImages && profile.portfolioImages.length > 0 ? "mt-6" : ""
                    }`}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/20">
                      <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{profile.portfolioUrl}</p>
                      <p className="text-xs text-slate-400">Voir le portfolio externe</p>
                    </div>
                    <svg className="h-5 w-5 text-slate-500 group-hover:text-white transition" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                )}
              </div>

              {/* Tarifs */}
              {profile?.rate && (
                <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6 md:col-span-2">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Tarifs indicatifs
                  </h2>
                  <p className="text-slate-300">{profile.rate}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Les tarifs peuvent varier selon le projet. Contactez directement pour un devis personnalisé.
                  </p>
                </div>
              )}
            </>
          ) : (
            <>
              {/* Types de contenu */}
              {profile?.contentTypes && (
                <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Types de contenu
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {profile.contentTypes.split(",").map((type, index) => (
                      <span
                        key={index}
                        className="rounded-full bg-slate-800 px-4 py-2 text-sm text-slate-300"
                      >
                        {type.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Besoins */}
              {profile?.needs && (
                <div className="rounded-xl bg-slate-900/80 border border-slate-800 p-6">
                  <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Besoins recherchés
                  </h2>
                  <p className="text-slate-300">{profile.needs}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* CTA final */}
        <div className="mt-8 rounded-xl bg-gradient-to-r from-cyan-900/40 to-emerald-900/40 border border-cyan-500/20 p-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-2">
            Intéressé par ce profil ?
          </h3>
          <p className="text-slate-400 mb-6">
            Envoyez un message pour démarrer une collaboration
          </p>
          <button
            type="button"
            onClick={() => handleContact(user.id)}
            disabled={contactLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-cyan-500 px-8 py-3 text-sm font-semibold text-slate-900 transition hover:bg-cyan-400 disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {contactLoading ? "Ouverture..." : `Contacter ${displayName}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// Composant pour afficher une image du portfolio avec lightbox
function PortfolioImageCard({ image }: { image: PortfolioImage }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="group relative aspect-square rounded-xl overflow-hidden bg-slate-800 cursor-pointer"
      >
        <Image
          src={image.url}
          alt={image.title || "Portfolio image"}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw"
        />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
          <svg 
            className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
          </svg>
        </div>
      </button>

      {/* Lightbox */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setIsOpen(false)}
        >
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div 
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={image.url}
              alt={image.title || "Portfolio image"}
              width={1200}
              height={800}
              className="rounded-xl object-contain w-full h-auto max-h-[80vh]"
            />
            {(image.title || image.description) && (
              <div className="mt-4 text-center">
                {image.title && (
                  <h3 className="text-lg font-semibold text-white">{image.title}</h3>
                )}
                {image.description && (
                  <p className="text-sm text-slate-400 mt-1">{image.description}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

