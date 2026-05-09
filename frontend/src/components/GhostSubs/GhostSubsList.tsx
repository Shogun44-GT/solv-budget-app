import { useState } from 'react'
import { useGhostSubscriptions } from '../../hooks/useTransactions'
import type { Transaction } from '../../types'
import EmptyState from '../shared/EmptyState'
import Spinner from '../shared/Spinner'

const RISK_CONFIG = {
  high:   { label: 'À ANNULER', color: '#ef4444', bg: 'bg-red-500/10 border-red-500/30' },
  medium: { label: 'À REVOIR',  color: '#f97316', bg: 'bg-orange-500/10 border-orange-500/30' },
  low:    { label: 'OK',        color: '#22c55e', bg: 'bg-green-500/10 border-green-500/30' },
}

function getRisk(tx: Transaction): 'high' | 'medium' | 'low' {
  // Logique heuristique : haut risque si montant > 20€ ou mots-clés
  if (tx.amount > 20) return 'high'
  if (tx.amount > 10) return 'medium'
  return 'low'
}

const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })

export default function GhostSubsList() {
  const { data: subs, isLoading } = useGhostSubscriptions()
  const [dismissed, setDismissed] = useState<string[]>([])

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>

  const activeSubs = (subs ?? []).filter(s => !dismissed.includes(s.id))
  const highRisk = activeSubs.filter(s => getRisk(s) === 'high')
  const totalEco = highRisk.reduce((sum, s) => sum + s.amount, 0)

  if (activeSubs.length === 0) {
    return <EmptyState icon="🎉" title="Aucun abonnement suspect !" description="Tous tes abonnements ont été traités." />
  }

  return (
    <div className="space-y-4">
      {/* Alert summary */}
      {highRisk.length > 0 && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex justify-between items-center">
          <div>
            <p className="text-sm font-bold text-red-400">Économie immédiate possible</p>
            <p className="text-xs text-gray-500 mt-0.5">En annulant {highRisk.length} abonnement{highRisk.length > 1 ? 's' : ''} à risque élevé</p>
          </div>
          <p className="text-2xl font-extrabold text-red-400">{fmt(totalEco)}<span className="text-xs font-normal text-gray-500">/mois</span></p>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {activeSubs.map(sub => {
          const risk = getRisk(sub)
          const cfg = RISK_CONFIG[risk]
          return (
            <div key={sub.id} className={`rounded-xl border p-4 ${cfg.bg}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📱</span>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-sm truncate">{sub.label}</p>
                    <p className="text-base font-extrabold ml-2 shrink-0" style={{ color: cfg.color }}>
                      {fmt(sub.amount)}<span className="text-xs font-normal text-gray-500">/mois</span>
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Abonnement détecté · Dernière transaction : {new Date(sub.date).toLocaleDateString('fr-FR')}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full border"
                      style={{ color: cfg.color, borderColor: cfg.color + '44', background: cfg.color + '18' }}>
                      {cfg.label}
                    </span>
                    <button
                      onClick={() => setDismissed(d => [...d, sub.id])}
                      className="text-xs text-gray-500 hover:text-gray-300 px-3 py-1 rounded-lg bg-white/5 border border-white/10 transition"
                    >
                      Ignorer
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Reset dismissed */}
      {dismissed.length > 0 && (
        <button onClick={() => setDismissed([])}
          className="w-full py-2 text-xs text-gray-500 rounded-xl bg-white/3 border border-white/7 hover:text-gray-300 transition">
          Réafficher les {dismissed.length} ignoré(s)
        </button>
      )}
    </div>
  )
}
