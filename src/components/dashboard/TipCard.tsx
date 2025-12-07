/**
 * Carte pour afficher un conseil/tip
 */
import type { ReactNode } from "react";

type TipCardProps = {
  icon: ReactNode;
  title: string;
  description: string;
};

export function TipCard({ icon, title, description }: TipCardProps) {
  return (
    <div className="group rounded-xl bg-slate-900/40 border border-slate-800/50 p-5 transition-all duration-150 hover:bg-slate-900/60 hover:border-slate-700">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
        {icon}
      </div>
      <h3 className="font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">{description}</p>
    </div>
  );
}






















