/**
 * Carte pour afficher un talent recommandé (graphiste/monteur)
 */
type TalentCardProps = {
  name: string;
  specialty: string;
  tags: string[];
  avatarInitial: string;
  rating?: number;
};

export function TalentCard({ name, specialty, tags, avatarInitial, rating }: TalentCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-slate-900/60 border border-slate-800 p-5 shadow-lg shadow-black/20 transition-all duration-150 hover:border-cyan-500/40 hover:shadow-cyan-500/5 hover:-translate-y-1">
      {/* Header avec avatar */}
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-emerald-500 text-xl font-bold text-slate-900">
          {avatarInitial}
        </div>

        <div className="flex-1 min-w-0">
          {/* Nom */}
          <h3 className="font-semibold text-white truncate">{name}</h3>
          
          {/* Spécialité */}
          <p className="text-sm text-cyan-400">{specialty}</p>

          {/* Rating */}
          {rating && (
            <div className="mt-1 flex items-center gap-1">
              <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm text-slate-400">{rating.toFixed(1)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="mt-4 flex flex-wrap gap-2">
        {tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-300"
          >
            {tag}
          </span>
        ))}
      </div>

      {/* Bouton */}
      <a
        href="/search"
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-cyan-500 hover:text-slate-900"
      >
        Voir le profil
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
        </svg>
      </a>
    </div>
  );
}






















