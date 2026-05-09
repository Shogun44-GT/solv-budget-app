import { useState, useEffect, useCallback } from 'react'

export interface Badge {
  id: string; emoji: string; name: string; desc: string; color: string; condition: string
}

export const BADGES: Badge[] = [
  { id: 'first_open',   emoji: '🌱', name: 'Premier pas',       desc: 'Tu as ouvert Solv pour la première fois',       color: '#22c55e', condition: 'always'         },
  { id: 'streak_3',     emoji: '🔥', name: 'En route',          desc: '3 jours de streak consécutifs',                 color: '#f97316', condition: 'streak_3'       },
  { id: 'streak_7',     emoji: '🔥🔥',name: 'En feu',           desc: '7 jours de streak — tu es sérieux !',           color: '#ef4444', condition: 'streak_7'       },
  { id: 'streak_30',    emoji: '💎', name: 'Légendaire',         desc: '30 jours de streak — respect total',            color: '#a78bfa', condition: 'streak_30'      },
  { id: 'ghost_hunter', emoji: '👻', name: "Chasseur d'abos",   desc: "Tu as ignoré ton premier abonnement fantôme",   color: '#8b5cf6', condition: 'ghost_dismissed'},
  { id: 'saver',        emoji: '💰', name: 'Économiseur',        desc: "Tu as simulé plus de 100€ d'économies",        color: '#fbbf24', condition: 'whatif_100'     },
  { id: 'csv_import',   emoji: '📂', name: 'Importateur',        desc: 'Tu as importé ton premier relevé bancaire',     color: '#60a5fa', condition: 'csv_imported'   },
  { id: 'budget_ok',    emoji: '✅', name: 'Maître du budget',   desc: 'Tu as terminé un mois sans découvert',          color: '#22c55e', condition: 'month_ok'       },
]

function getUnlocked(): string[] {
  try { return JSON.parse(localStorage.getItem('solv_badges') || '[]') } catch { return [] }
}

function saveUnlocked(ids: string[]) {
  localStorage.setItem('solv_badges', JSON.stringify(ids))
}

// ── Toast de badge débloqué ───────────────────────────────────
interface ToastProps { badge: Badge; onDone: () => void }
function BadgeToast({ badge, onDone }: ToastProps) {
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    setTimeout(() => setVisible(true), 50)
    const t = setTimeout(() => { setVisible(false); setTimeout(onDone, 350) }, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', bottom: 160, left: '50%', transform: `translateX(-50%) translateY(${visible ? 0 : 80}px)`,
      zIndex: 9000, opacity: visible ? 1 : 0, transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
      background: '#0f0f23', border: `1px solid ${badge.color}50`,
      borderRadius: 20, padding: '14px 20px',
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${badge.color}20`,
      minWidth: 260,
    }}>
      <span style={{ fontSize: 28 }}>{badge.emoji}</span>
      <div>
        <p style={{ fontSize: 11, color: badge.color, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 2 }}>🏆 Badge débloqué</p>
        <p style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>{badge.name}</p>
        <p style={{ fontSize: 11, color: '#64748b' }}>{badge.desc}</p>
      </div>
    </div>
  )
}

// ── Hook principal ────────────────────────────────────────────
export function useBadges() {
  const [unlocked, setUnlocked] = useState<string[]>(getUnlocked)
  const [pendingToast, setPendingToast] = useState<Badge | null>(null)

  const unlock = useCallback((id: string) => {
    setUnlocked(prev => {
      if (prev.includes(id)) return prev
      const next = [...prev, id]
      saveUnlocked(next)
      const badge = BADGES.find(b => b.id === id)
      if (badge) setPendingToast(badge)
      return next
    })
  }, [])

  return { unlocked, unlock, pendingToast, clearToast: () => setPendingToast(null) }
}

// ── Provider global (singleton via context) ───────────────────
import { createContext, useContext } from 'react'

interface BadgeCtx { unlock: (id: string) => void }
export const BadgeContext = createContext<BadgeCtx>({ unlock: () => {} })
export const useBadgeUnlock = () => useContext(BadgeContext).unlock

// ── Provider composant ────────────────────────────────────────
export function BadgeProvider({ children }: { children: React.ReactNode }) {
  const { unlocked, unlock, pendingToast, clearToast } = useBadges()

  useEffect(() => {
    if (!unlocked.includes('first_open')) unlock('first_open')
  }, [unlock, unlocked])

  return (
    <BadgeContext.Provider value={{ unlock }}>
      {children}
      {pendingToast && <BadgeToast badge={pendingToast} onDone={clearToast} />}
    </BadgeContext.Provider>
  )
}

// ── Composant carte badge ─────────────────────────────────────
export function BadgeCard({ badge, earned }: { badge: Badge; earned: boolean }) {
  return (
    <div style={{
      background: earned ? `${badge.color}0f` : 'rgba(255,255,255,0.02)',
      border: `1px solid ${earned ? badge.color + '35' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 18, padding: '16px', textAlign: 'center',
      opacity: earned ? 1 : 0.45, transition: 'all 0.3s',
    }}>
      <div style={{ fontSize: 32, marginBottom: 8, filter: earned ? 'none' : 'grayscale(1)' }}>
        {earned ? badge.emoji : '🔒'}
      </div>
      <p style={{ fontSize: 13, fontWeight: 800, color: earned ? badge.color : '#475569', marginBottom: 4 }}>{badge.name}</p>
      <p style={{ fontSize: 11, color: '#334155', lineHeight: 1.4 }}>{badge.desc}</p>
    </div>
  )
}
