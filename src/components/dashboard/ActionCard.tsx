/**
 * Grande carte d'action pour le dashboard
 */
import type { ReactNode } from "react";

type ActionCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
  buttonLabel: string;
  buttonHref: string;
  variant?: "primary" | "secondary";
};

export function ActionCard({
  icon,
  title,
  description,
  buttonLabel,
  buttonHref,
  variant = "secondary"
}: ActionCardProps) {
  const isPrimary = variant === "primary";

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border p-6 shadow-xl transition-all duration-150 ${
        isPrimary
          ? "bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border-cyan-500/30 hover:border-cyan-400/50"
          : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
      }`}
    >
      {/* Icône */}
      <div
        className={`mb-4 inline-flex h-14 w-14 items-center justify-center rounded-xl ${
          isPrimary ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-800 text-slate-300"
        }`}
      >
        {icon}
      </div>

      {/* Titre */}
      <h3 className="text-lg font-bold text-white">{title}</h3>

      {/* Description */}
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>

      {/* Bouton */}
      <a
        href={buttonHref}
        className={`mt-6 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-200 ${
          isPrimary
            ? "bg-cyan-500 text-slate-900 hover:bg-cyan-400 shadow-lg shadow-cyan-500/25"
            : "bg-slate-800 text-white hover:bg-slate-700"
        }`}
      >
        {buttonLabel}
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    </div>
  );
}






















