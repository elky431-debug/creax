/**
 * Carte de statistique / info pour le dashboard
 */
import type { ReactNode } from "react";

type StatCardProps = {
  icon: ReactNode;
  label: string;
  value: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
};

export function StatCard({ icon, label, value, description, action }: StatCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-slate-900/80 border border-slate-800 p-6 shadow-lg shadow-black/20 transition-all duration-150 hover:border-cyan-500/40 hover:shadow-cyan-500/5">
      {/* Gradient subtil en fond */}
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent opacity-0 transition-opacity duration-150 group-hover:opacity-100" />
      
      <div className="relative">
        {/* Icône */}
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400">
          {icon}
        </div>

        {/* Label */}
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </p>

        {/* Valeur principale */}
        <p className="mt-2 text-2xl font-bold text-white">
          {value}
        </p>

        {/* Description */}
        <p className="mt-2 text-sm text-slate-400">
          {description}
        </p>

        {/* Action optionnelle */}
        {action && (
          <a
            href={action.href}
            className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-cyan-400 transition-colors hover:text-cyan-300"
          >
            {action.label}
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        )}
      </div>
    </div>
  );
}






















