import { useState, useEffect } from 'react'
import AppLayout from '../components/Layout/AppLayout'
import { useGhostSubscriptions } from '../hooks/useTransactions'
import Spinner from '../components/shared/Spinner'
import { useSlideOut } from '../hooks/useAnimation'
import { useBadgeUnlock } from '../components/shared/BadgeSystem'
import type { Transaction } from '../types'

function useCountUp(target: number, duration = 900): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (target === 0) { setValue(0); return }
    let start: number | null = null
    let raf: number
    const step = (ts: number) => {
      if (!start) start = ts
      const p = Math.min((ts - start) / duration, 1)
      setValue(Math.round((1 - Math.pow(1 - p, 3)) * target * 100) / 100)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return value
}

const RISK_CFG = {
  high:   { label: 'À ANNULER', color: '#ef4444', bg: 'rgba(239,68,68,0.07)',  ring: 'rgba(239,68,68,0.2)'  },
  medium: { label: 'À REVOIR',  color: '#f97316', bg: 'rgba(249,115,22,0.07)', ring: 'rgba(249,115,22,0.2)' },
  low:    { label: 'OK',        color: '#22c55e', bg: 'rgba(34,197,94,0.07)',  ring: 'rgba(34,197,94,0.2)'  },
}

const getRisk = (tx: Transaction): 'high' | 'medium' | 'low' =>
  tx.amount > 20 ? 'high' : tx.amount > 10 ? 'medium' : 'low'

const fmt = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2 })

function SubCard({ sub, cfg, index, onDismiss }: { sub: Transaction; cfg: typeof RISK_CFG[keyof typeof RISK_CFG]; index: number; onDismiss: () => void }) {
  const { sliding, slideOut } = useSlideOut()
  const handleIgnore = () => slideOut(onDismiss)
  return (
    <div
      style={{ background: cfg.bg, border: `1px solid ${cfg.ring}`, borderRadius: 20, padding: '18px', animation: `slideIn 0.35s ease ${index * 0.07}s both`, transition: 'transform 0.18s, box-shadow 0.18s, opacity 0.35s', cursor: 'default', animationFillMode: sliding ? undefined : 'both', ...(sliding ? { animation: 'slideOutLeft 0.35s ease forwards' } : {}) }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${cfg.color}18`, border: `1px solid ${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>📱</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
            <p style={{ fontSize: 14, fontWeight: 800, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, marginRight: 12 }}>{sub.label}</p>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: 18, fontWeight: 900, color: cfg.color, lineHeight: 1 }}>{fmt(sub.amount)}</p>
              <p style={{ fontSize: 10, color: '#475569', marginTop: 2 }}>/mois</p>
            </div>
          </div>
          <p style={{ fontSize: 11, color: '#475569', marginBottom: 14 }}>Détecté le {new Date(sub.date).toLocaleDateString('fr-FR')}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', padding: '4px 12px', borderRadius: 20, color: cfg.color, background: `${cfg.color}18`, border: `1px solid ${cfg.color}40` }}>{cfg.label}</span>
            <button onClick={handleIgnore}
              style={{ fontSize: 12, fontWeight: 600, color: '#64748b', padding: '6px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', transition: 'all 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.12)' }}
              onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)' }}>
              Ignorer
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function GhostsPage() {
  const { data: subs, isLoading } = useGhostSubscriptions()
  const [dismissed, setDismissed] = useState<string[]>([])
  const unlock = useBadgeUnlock()

  const activeSubs = (subs ?? []).filter(s => !dismissed.includes(s.id))
  const highRisk   = activeSubs.filter(s => getRisk(s) === 'high')
  const totalEco   = highRisk.reduce((sum, s) => sum + s.amount, 0)
  const animEco    = useCountUp(totalEco)

  return (
    <AppLayout>
      <div style={{ animation: 'fadeUp 0.5s ease both', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: 'white', marginBottom: 4 }}>Abonnements fantômes</h2>
          <p style={{ fontSize: 13, color: '#475569' }}>Paiements récurrents détectés — revois ceux que tu n'utilises plus.</p>
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size={32} />
          </div>
        )}

        {/* Empty */}
        {!isLoading && activeSubs.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '50vh', gap: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 64, animation: 'float 3s ease-in-out infinite' }}>🎉</div>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>Aucun abonnement suspect !</p>
            <p style={{ fontSize: 13, color: '#475569' }}>Tous tes abonnements ont été traités.</p>
          </div>
        )}

        {!isLoading && activeSubs.length > 0 && (
          <>
            {/* Banner économie */}
            {highRisk.length > 0 && (
              <div style={{
                background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.22)',
                borderRadius: 20, padding: '20px 22px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                animation: 'fadeUp 0.4s ease 0.1s both',
              }}>
                <div>
                  <p style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Économie immédiate</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>
                    En annulant {highRisk.length} abonnement{highRisk.length > 1 ? 's' : ''} à risque élevé
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 28, fontWeight: 900, color: '#ef4444', letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                    {animEco.toFixed(2)} €
                  </p>
                  <p style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>/ mois</p>
                </div>
              </div>
            )}

            {/* Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {activeSubs.map((sub, i) => {
                const risk = getRisk(sub)
                const cfg  = RISK_CFG[risk]
                return (
                  <SubCard key={sub.id} sub={sub} cfg={cfg} index={i}
                    onDismiss={() => {
                      unlock('ghost_hunter')
                      setDismissed(d => [...d, sub.id])
                    }}
                  />
                )
              })}
            </div>

            {/* Reset dismissed */}
            {dismissed.length > 0 && (
              <button onClick={() => setDismissed([])}
                style={{ padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#475569', fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#94a3b8')}
                onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
              >
                Réafficher les {dismissed.length} ignoré{dismissed.length > 1 ? 's' : ''}
              </button>
            )}
          </>
        )}
      </div>
    </AppLayout>
  )
}
