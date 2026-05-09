import { useAlternatives } from '../../hooks/useRecommendations'
import type { Alternative } from '../../services/recommendations'
import Spinner from '../shared/Spinner'
import EmptyState from '../shared/EmptyState'

const EFFORT_STYLE = {
  faible: { label: 'Facile', color: 'text-green-400', bg: 'bg-green-500/15' },
  moyen:  { label: 'Moyen',  color: 'text-orange-400', bg: 'bg-orange-500/15' },
  élevé:  { label: 'Effort', color: 'text-red-400',    bg: 'bg-red-500/15' },
}

const fmt = (n: number) => `${n} €`

function AlternativeCard({ alt }: { alt: Alternative }) {
  const effort = EFFORT_STYLE[alt.effort] ?? EFFORT_STYLE.moyen
  return (
    <div className="flex gap-3 bg-white/[0.03] rounded-xl border border-white/[0.06] p-3 hover:border-white/[0.12] transition">
      <div className="shrink-0 text-center min-w-[56px] px-2 py-1.5 rounded-lg bg-green-500/15 text-green-400 font-extrabold text-sm">
        -{fmt(alt.saving_euros)}
        {alt.saving_min && alt.saving_max && (
          <p className="text-[9px] font-normal text-green-500/70">{alt.saving_min}–{alt.saving_max}€</p>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <p className="font-semibold text-sm">{alt.label}</p>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${effort.bg} ${effort.color}`}>
            {effort.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">{alt.description}</p>
        {alt.url && (
          <a href={alt.url} target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-indigo-400 hover:text-indigo-300 mt-1 inline-block transition">
            En savoir plus →
          </a>
        )}
      </div>
    </div>
  )
}

interface Props { categories: string[] }

export default function AlternativesPanel({ categories }: Props) {
  const { data, isLoading } = useAlternatives(categories)

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>
  if (!data || Object.keys(data.categories).length === 0) {
    return <EmptyState icon="💡" title="Aucune recommandation disponible" description="Importe des transactions pour recevoir des conseils personnalisés." />
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-500">Profil détecté : <span className="text-indigo-400 font-semibold capitalize">{data.profile}</span></p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Économie potentielle</p>
          <p className="text-lg font-extrabold text-green-400">+{data.total_potential_saving} €<span className="text-xs font-normal text-gray-500">/mois</span></p>
        </div>
      </div>

      {/* Alternatives par catégorie */}
      {Object.entries(data.categories).map(([cat, alts]) => (
        <div key={cat}>
          <p className="text-sm font-bold capitalize mb-2 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block" />
            {cat}
          </p>
          <div className="space-y-2">
            {alts.map((alt, i) => <AlternativeCard key={i} alt={alt} />)}
          </div>
        </div>
      ))}
    </div>
  )
}
