import { useState, useCallback } from 'react'
import { CATEGORY_META, type TransactionCategory } from '../../types'
import { useWhatIf } from '../../hooks/usePrediction'
import Spinner from '../shared/Spinner'

interface Props {
  budgetId: string
  categoryTotals: Record<string, number>
  onResultChange?: (data: any) => void
}

const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export default function WhatIfSimulator({ budgetId, categoryTotals, onResultChange }: Props) {
  const [reductions, setReductions] = useState<Record<string, number>>({})
  const { mutate, data, isPending, reset } = useWhatIf()

  const simulate = useCallback(() => {
    if (Object.keys(reductions).length === 0) return
    mutate({ budgetId, reductions }, {
      onSuccess: (result) => onResultChange?.(result),
    })
  }, [budgetId, reductions, mutate, onResultChange])

  const resetAll = () => {
    setReductions({})
    reset()
    onResultChange?.(null)
  }

  const totalSavings = Object.entries(reductions).reduce(
    (s, [cat, pct]) => s + (categoryTotals[cat] || 0) * pct / 100, 0
  )

  const variableCategories = Object.entries(categoryTotals)
    .filter(([cat]) => cat !== 'loyer')
    .sort(([, a], [, b]) => b - a)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-sm text-gray-400">
        🎛️ Bouge les curseurs pour voir l'impact en temps réel sur ton solde.
      </div>

      {/* Impact summary */}
      {totalSavings > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-center">
            <p className="text-[10px] text-gray-500 mb-1">ÉCONOMIES SIMULÉES</p>
            <p className="text-xl font-extrabold text-green-400">{fmt(totalSavings)}</p>
          </div>
          {data && (
            <div className={`p-3 rounded-xl text-center border ${data.simulated_overdraft_date ? 'bg-red-500/10 border-red-500/20' : 'bg-green-500/10 border-green-500/20'}`}>
              <p className="text-[10px] text-gray-500 mb-1">NOUVEAU SOLDE</p>
              <p className={`text-xl font-extrabold ${data.simulated_overdraft_date ? 'text-red-400' : 'text-green-400'}`}>
                {fmt(data.simulated_end_balance)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sliders */}
      <div className="space-y-3">
        {variableCategories.map(([cat, amount]) => {
          const meta = CATEGORY_META[cat as TransactionCategory] ?? CATEGORY_META.autre
          const pct = reductions[cat] || 0
          const saved = amount * pct / 100
          return (
            <div key={cat} className="bg-white/[0.04] rounded-xl border border-white/[0.07] p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold">{meta.icon} {meta.label}</span>
                <div className="text-right">
                  <span className="text-sm text-gray-400 line-through mr-1">{fmt(amount)}</span>
                  {pct > 0 && (
                    <span className="text-sm font-bold text-green-400">
                      → {fmt(amount - saved)}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600 w-6">0%</span>
                <input
                  type="range" min={0} max={100} step={5} value={pct}
                  onChange={(e) => setReductions(r => ({ ...r, [cat]: +e.target.value }))}
                  className="flex-1 cursor-pointer accent-indigo-500"
                />
                <span className="text-xs text-gray-600 w-8 text-right">100%</span>
                <span className={`text-xs font-bold w-12 text-center px-2 py-0.5 rounded-md ${pct > 0 ? 'bg-green-500/15 text-green-400' : 'bg-white/5 text-gray-600'}`}>
                  -{pct}%
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Result message */}
      {data && (
        <div className={`p-4 rounded-xl border ${data.simulated_overdraft_date ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
          <p className="font-bold text-sm mb-1">
            {data.simulated_overdraft_date ? '🚨 Encore en découvert' : '✅ Ce scénario évite le découvert !'}
          </p>
          <p className="text-xs text-gray-400">
            {data.simulated_overdraft_date
              ? `Découvert encore prévu le ${new Date(data.simulated_overdraft_date).toLocaleDateString('fr-FR')}.`
              : `Tu terminerais le mois avec ${fmt(data.simulated_end_balance)} 🎉`}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={simulate}
          disabled={Object.keys(reductions).length === 0 || isPending}
          className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isPending ? <><Spinner size={16} /> Calcul...</> : '🔮 Simuler'}
        </button>
        <button onClick={resetAll} className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition">
          Reset
        </button>
      </div>
    </div>
  )
}
