import { useMealPrep } from '../../hooks/useRecommendations'
import Spinner from '../shared/Spinner'

const DIFFICULTY_STYLE = {
  facile: { label: 'Facile', color: 'text-green-400', bg: 'bg-green-500/15' },
  moyen:  { label: 'Moyen',  color: 'text-orange-400', bg: 'bg-orange-500/15' },
}

export default function MealPrepList() {
  const { data, isLoading } = useMealPrep()

  if (isLoading) return <div className="flex justify-center py-8"><Spinner /></div>

  const recipes = data?.recipes ?? []

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-sm text-gray-400">
        🍳 Cuisiner ces recettes te coûte <strong className="text-green-400">2–3× moins cher</strong> que la livraison. Idéal le dimanche pour toute la semaine.
      </div>

      {/* Recipe cards */}
      <div className="grid gap-3">
        {recipes.map((recipe, i) => {
          const diff = DIFFICULTY_STYLE[recipe.difficulty as keyof typeof DIFFICULTY_STYLE] ?? DIFFICULTY_STYLE.facile
          const totalCost = recipe.cost_per_portion * recipe.portions
          return (
            <div key={i} className="bg-white/[0.04] rounded-2xl border border-white/[0.07] p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-bold text-sm">{recipe.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{recipe.prep_time} · {recipe.portions} portions</p>
                </div>
                <div className="text-right shrink-0 ml-3">
                  <p className="text-lg font-extrabold text-green-400">{recipe.cost_per_portion.toFixed(2)} €</p>
                  <p className="text-[10px] text-gray-500">par portion</p>
                </div>
              </div>

              {/* Ingrédients */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {recipe.ingredients.map((ing, j) => (
                  <span key={j} className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] text-gray-400">
                    {ing}
                  </span>
                ))}
              </div>

              {/* Footer */}
              <div className="flex justify-between items-center">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${diff.bg} ${diff.color}`}>
                  {diff.label}
                </span>
                <p className="text-xs text-gray-500">
                  Coût total : <strong className="text-gray-300">{totalCost.toFixed(2)} €</strong>
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
