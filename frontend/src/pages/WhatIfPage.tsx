import { useState, useEffect, useCallback, useRef } from 'react'
import AppLayout from '../components/Layout/AppLayout'
import ProjectionChart from '../components/Dashboard/ProjectionChart'
import { useBudgets } from '../hooks/useBudgets'
import { usePrediction, useWhatIf } from '../hooks/usePrediction'
import { getRiskColor, getRiskLevel } from '../components/shared/RiskBadge'
import Spinner from '../components/shared/Spinner'
import { useBadgeUnlock } from '../components/shared/BadgeSystem'
import { CATEGORY_META, type TransactionCategory } from '../types'

function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    let start: number | null = null
    let raf: number
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target))
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })

export default function WhatIfPage() {
  const { data: budgets } = useBudgets()
  const currentBudget = budgets?.[0]
  const { data: prediction, isLoading } = usePrediction(currentBudget?.id ?? null)
  const { mutate: simulate, data: result, isPending, reset } = useWhatIf()
  const [reductions, setReductions] = useState<Record<string, number>>({})
  const [chartData, setChartData] = useState<typeof result | null>(null)
  const [resultPop, setResultPop] = useState(false)
  const prevOverdraft = useRef<boolean | null>(null)
  const unlock = useBadgeUnlock()

  const categoryTotals = prediction?.category_totals ?? {}
  const variableCategories = Object.entries(categoryTotals)
    .filter(([cat]) => cat !== 'loyer')
    .sort(([, a], [, b]) => b - a)

  const totalSavings = Object.entries(reductions).reduce(
    (s, [cat, pct]) => s + (categoryTotals[cat] ?? 0) * pct / 100, 0
  )

  const animSavings = useCountUp(result ? Math.round(result.total_savings) : Math.round(totalSavings))
  const animBalance = useCountUp(Math.abs(Math.round(result?.simulated_end_balance ?? 0)))

  const handleSimulate = useCallback(() => {
    if (!currentBudget || Object.keys(reductions).length === 0) return
    simulate({ budgetId: currentBudget.id, reductions }, {
      onSuccess: r => {
        setChartData(r)
        const wasOverdraft = prevOverdraft.current
        const isOverdraft  = !!r.simulated_overdraft_date
        if (wasOverdraft === true && !isOverdraft) {
          setResultPop(true)
          setTimeout(() => setResultPop(false), 600)
        }
        if (r.total_savings >= 100) unlock('saver')
        prevOverdraft.current = isOverdraft
      },
    })
  }, [currentBudget, reductions, simulate, unlock])

  const handleReset = () => { setReductions({}); reset(); setChartData(null) }

  const riskColor = prediction ? getRiskColor(getRiskLevel(prediction.prediction.risk_score)) : '#6366f1'
  const hasReductions = Object.keys(reductions).length > 0

  if (isLoading) return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
        <Spinner size={32} />
      </div>
    </AppLayout>
  )

  if (!currentBudget || !prediction) return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, textAlign: 'center', animation: 'fadeUp 0.6s ease both' }}>
        <div style={{ fontSize: 64, animation: 'float 3s ease-in-out infinite' }}>🎛️</div>
        <p style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>Aucune donnée disponible</p>
        <p style={{ fontSize: 13, color: '#475569', maxWidth: 260, lineHeight: 1.6 }}>Importe d'abord tes dépenses depuis le Dashboard.</p>
      </div>
    </AppLayout>
  )

  return (
    <AppLayout>
      <div style={{ animation: 'fadeUp 0.5s ease both', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: 'white', marginBottom: 4 }}>Simulateur What-If</h2>
          <p style={{ fontSize: 13, color: '#475569' }}>Bouge les curseurs pour voir l'impact immédiat sur ton solde.</p>
        </div>

        {/* Résultats animés */}
        {(totalSavings > 0 || result) && (
          <div style={{ display: 'grid', gridTemplateColumns: result ? '1fr 1fr' : '1fr', gap: 12 }}>
            <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', borderRadius: 20, padding: '18px 20px', textAlign: 'center' }}>
              <p style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Économies simulées</p>
              <p style={{ color: '#22c55e', fontSize: 34, fontWeight: 900, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {animSavings} €
              </p>
            </div>
            {result && (
              <div style={{
                background: result.simulated_overdraft_date ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                border: `1px solid ${result.simulated_overdraft_date ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
                borderRadius: 20, padding: '18px 20px', textAlign: 'center',
                animation: resultPop ? 'popIn 0.5s cubic-bezier(0.34,1.56,0.64,1)' : undefined,
              }}>
                <p style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>Nouveau solde</p>
                <p style={{ color: result.simulated_overdraft_date ? '#ef4444' : '#22c55e', fontSize: 34, fontWeight: 900, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {result.simulated_end_balance < 0 ? '-' : '+'}{animBalance} €
                </p>
              </div>
            )}
          </div>
        )}

        {/* Graphique */}
        {chartData && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 18, animation: 'fadeUp 0.4s ease both' }}>
            <ProjectionChart
              data={prediction.prediction.projection_data}
              whatIfData={chartData.projection_data}
              riskColor={riskColor}
              budgetAmount={currentBudget.total_amount}
            />
          </div>
        )}

        {/* Sliders */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 20 }}>

          <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 14, padding: '12px 16px', marginBottom: 18, fontSize: 13, color: '#94a3b8' }}>
            🎛️ Ajuste tes dépenses par catégorie, puis appuie sur Simuler.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {variableCategories.map(([cat, amount], i) => {
              const meta = CATEGORY_META[cat as TransactionCategory] ?? CATEGORY_META.autre
              const pct  = reductions[cat] ?? 0
              const saved = amount * pct / 100
              return (
                <div key={cat}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px', animation: `slideIn 0.35s ease ${i * 0.05}s both`, transition: 'transform 0.18s, box-shadow 0.18s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>{meta.icon} {meta.label}</span>
                    <div>
                      {pct > 0 ? (
                        <>
                          <span style={{ fontSize: 12, color: '#475569', textDecoration: 'line-through', marginRight: 8 }}>{fmt(amount)}</span>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#22c55e' }}>→ {fmt(amount - saved)}</span>
                        </>
                      ) : (
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>{fmt(amount)}</span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 10, color: '#334155', width: 24, flexShrink: 0 }}>0%</span>
                    <input
                      type="range" min={0} max={100} step={5} value={pct}
                      onChange={e => setReductions(r => ({ ...r, [cat]: +e.target.value }))}
                      style={{ flex: 1, cursor: 'pointer', accentColor: '#6366f1', height: 4 }}
                    />
                    <span style={{ fontSize: 10, color: '#334155', width: 34, textAlign: 'right', flexShrink: 0 }}>100%</span>
                    <span style={{
                      fontSize: 12, fontWeight: 800, width: 48, textAlign: 'center',
                      padding: '3px 6px', borderRadius: 8, flexShrink: 0,
                      background: pct > 0 ? 'rgba(34,197,94,0.15)' : 'rgba(255,255,255,0.05)',
                      color: pct > 0 ? '#22c55e' : '#334155',
                      transition: 'all 0.2s',
                    }}>
                      -{pct}%
                    </span>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Message résultat */}
          {result && (
            <div style={{
              marginTop: 16,
              background: result.simulated_overdraft_date ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)',
              border: `1px solid ${result.simulated_overdraft_date ? 'rgba(239,68,68,0.25)' : 'rgba(34,197,94,0.25)'}`,
              borderRadius: 14, padding: '14px 16px', animation: 'fadeUp 0.3s ease both',
            }}>
              <p style={{ fontWeight: 800, fontSize: 14, marginBottom: 4, color: result.simulated_overdraft_date ? '#ef4444' : '#22c55e' }}>
                {result.simulated_overdraft_date ? '🚨 Encore en découvert' : '✅ Ce scénario évite le découvert !'}
              </p>
              <p style={{ fontSize: 12, color: '#64748b' }}>
                {result.simulated_overdraft_date
                  ? `Découvert encore prévu le ${new Date(result.simulated_overdraft_date).toLocaleDateString('fr-FR')}.`
                  : `Tu terminerais le mois avec ${fmt(result.simulated_end_balance)} 🎉`}
              </p>
            </div>
          )}

          {/* Boutons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            <button onClick={handleSimulate} disabled={!hasReductions || isPending}
              style={{
                flex: 1, padding: 13, borderRadius: 14,
                background: hasReductions ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(99,102,241,0.25)',
                border: 'none', color: 'white', fontSize: 14, fontWeight: 800,
                cursor: hasReductions && !isPending ? 'pointer' : 'not-allowed',
                opacity: !hasReductions || isPending ? 0.6 : 1,
                boxShadow: hasReductions ? '0 4px 20px rgba(99,102,241,0.4)' : 'none',
                transition: 'all 0.2s',
              }}>
              {isPending ? '⏳ Calcul...' : '🔮 Simuler'}
            </button>
            <button onClick={handleReset}
              style={{ padding: '13px 20px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#64748b', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
