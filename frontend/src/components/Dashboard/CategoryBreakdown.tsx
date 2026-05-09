import { CATEGORY_META, type TransactionCategory } from '../../types'
import ProgressBar from '../shared/ProgressBar'

interface Props {
  categoryTotals: Record<string, number>
  totalSpent: number
  budgetAmount: number
}

export default function CategoryBreakdown({ categoryTotals, totalSpent, budgetAmount }: Props) {
  const sorted = Object.entries(categoryTotals)
    .sort(([, a], [, b]) => b - a)

  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-4">
      <p className="text-xs text-gray-500 mb-4">Répartition des dépenses</p>
      <div className="space-y-3">
        {sorted.map(([cat, amount]) => {
          const meta = CATEGORY_META[cat as TransactionCategory] ?? CATEGORY_META.autre
          const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0
          const ofBudget = budgetAmount > 0 ? (amount / budgetAmount) * 100 : 0
          const isOver = ofBudget > 25 && cat !== 'loyer'
          return (
            <div key={cat} className="group">
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-medium flex items-center gap-2">
                  <span>{meta.icon}</span> {meta.label}
                </span>
                <div className="flex items-center gap-2">
                  {isOver && <span className="text-[10px] text-orange-400">⚠️ Élevé</span>}
                  <span className="text-sm font-bold">{amount.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}</span>
                </div>
              </div>
              <ProgressBar value={pct} color={meta.color} height={3} />
              <p className="text-[10px] text-gray-600 mt-1">{pct.toFixed(0)}% du total</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}
