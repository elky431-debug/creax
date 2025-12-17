/**
 * Composant réutilisable pour les titres de section du dashboard
 */
type SectionTitleProps = {
  title: string;
  subtitle?: string;
};

export function SectionTitle({ title, subtitle }: SectionTitleProps) {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {subtitle && (
        <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
      )}
    </div>
  );
}








































