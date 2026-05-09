import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useBudgets, useCreateBudget } from '../hooks/useBudgets'
import { useTransactions, useDeleteTransactions } from '../hooks/useTransactions'
import { usePrediction } from '../hooks/usePrediction'
import CSVImport from '../components/Dashboard/CSVImport'
import AppLayout from '../components/Layout/AppLayout'
import Spinner from '../components/shared/Spinner'
import { useStreak } from '../components/shared/StreakOnboarding'
import { recommendationService } from '../services/recommendations'
import { useBadgeUnlock } from '../components/shared/BadgeSystem'
import type { Recommendation, CSVImportResponse } from '../types'

function useDailyPhrase(params: { budget_amount: number; total_spent: number; daily_rate: number; days_elapsed: number; top_category: string; top_amount: number; city: string } | null) {
  const [phrase, setPhrase] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  useEffect(() => {
    if (!params || !params.budget_amount) return
    const today = new Date().toISOString().slice(0, 10)
    const cacheKey = `solv_phrase_${today}`
    const cached = localStorage.getItem(cacheKey)
    if (cached) { setPhrase(cached); return }
    setLoading(true)
    recommendationService.getDailyPhrase(params)
      .then(p => { setPhrase(p); localStorage.setItem(cacheKey, p) })
      .catch(() => {})
      .finally(() => setLoading(false))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params?.budget_amount, params?.total_spent])
  return { phrase, loading }
}

interface Mood  { main: string; glow: string; ring: string }
interface Phrase { text: string; emoji: string; mood: 'great' | 'warning' | 'critical' }
interface Insight { icon: string; text: string; action: string }
interface CatMeta { icon: string; label: string; color: string; bg: string }

const CAT_META: Record<string, CatMeta> = {
  loyer:       { icon: '🏠', label: 'Loyer',        color: '#94a3b8', bg: '#94a3b815' },
  courses:     { icon: '🛒', label: 'Courses',       color: '#34d399', bg: '#34d39915' },
  transport:   { icon: '🚗', label: 'Transport',     color: '#60a5fa', bg: '#60a5fa15' },
  resto:       { icon: '🍔', label: 'Restauration',  color: '#f97316', bg: '#f9731615' },
  abonnements: { icon: '📱', label: 'Abonnements',   color: '#a78bfa', bg: '#a78bfa15' },
  shopping:    { icon: '🛍️', label: 'Shopping',      color: '#f472b6', bg: '#f472b615' },
  sante:       { icon: '💊', label: 'Santé',         color: '#2dd4bf', bg: '#2dd4bf15' },
  autre:       { icon: '📦', label: 'Autre',         color: '#64748b', bg: '#64748b15' },
}

const MOOD_COLORS: Record<string, Mood> = {
  great:    { main: '#22c55e', glow: 'rgba(34,197,94,0.15)',   ring: 'rgba(34,197,94,0.4)'  },
  warning:  { main: '#f97316', glow: 'rgba(249,115,22,0.15)',  ring: 'rgba(249,115,22,0.4)' },
  critical: { main: '#ef4444', glow: 'rgba(239,68,68,0.15)',   ring: 'rgba(239,68,68,0.4)'  },
}

const MONTHS_FR = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

const fmt  = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const fmt2 = (n: number) => n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 })

function useCountUp(target: number, duration = 1200, delay = 0): number {
  const [value, setValue] = useState(0)
  useEffect(() => {
    let start: number | null = null
    let raf: number
    const timeout = setTimeout(() => {
      const step = (ts: number) => {
        if (!start) start = ts
        const progress = Math.min((ts - start) / duration, 1)
        setValue(Math.round((1 - Math.pow(1 - progress, 3)) * target))
        if (progress < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, delay)
    return () => { clearTimeout(timeout); cancelAnimationFrame(raf) }
  }, [target, duration, delay])
  return value
}

function getPhrase(balance: number, projectedEnd: number, riskPct: number, expectedPct: number, dailyRate: number, todayDay: number): Phrase {
  if (projectedEnd < 0 && dailyRate > 0) {
    const daysToOverdraft = Math.floor(balance / dailyRate)
    return { text: `À ce rythme tu seras à découvert le ${todayDay + daysToOverdraft} du mois. Il faut agir.`, emoji: '🚨', mood: 'critical' }
  }
  if (riskPct < expectedPct) {
    const saved = Math.round(expectedPct - riskPct)
    return { text: `Tu dépenses ${saved}% moins vite que prévu. Tu termines le mois avec ${fmt(projectedEnd)} d'avance. Continue 🔥`, emoji: '💪', mood: 'great' }
  }
  return { text: `Tu es légèrement au-dessus du rythme. Surveille tes dépenses resto cette semaine.`, emoji: '👀', mood: 'warning' }
}

function insightsFromRecs(recs: Record<string, Recommendation[]>): Insight[] {
  const catIcons: Record<string, string> = { loyer: '🏠', courses: '🛒', transport: '🚗', resto: '🍔', abonnements: '📱', shopping: '🛍️', sante: '💊', autre: '📦' }
  return Object.entries(recs).slice(0, 3).flatMap(([cat, list]) =>
    list.slice(0, 1).map(r => ({ icon: catIcons[cat] ?? '💡', text: r.description, action: `Économise ${r.saving_euros}€` }))
  )
}

function PulsingDot({ color }: { color: string }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', width: 10, height: 10 }}>
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.4 }} />
      <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color }} />
    </span>
  )
}

interface BalanceCardProps {
  balance: number; budget: number; todayDay: number; monthDays: number
  riskPct: number; expectedPct: number; phrase: Phrase; mood: Mood; streak: number
  aiPhrase?: string | null; aiPhraseLoading?: boolean
}
function BalanceCard({ balance, budget, todayDay, monthDays, riskPct, phrase, mood, streak, aiPhrase, aiPhraseLoading }: BalanceCardProps) {
  const animBalance = useCountUp(Math.max(0, Math.round(balance)), 1400, 200)
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 100) }, [])

  return (
    <div style={{
      position: 'relative', overflow: 'hidden',
      background: `radial-gradient(ellipse at 60% 0%, ${mood.glow} 0%, #0a0a14 70%)`,
      border: `1px solid ${mood.ring}`, borderRadius: 28, padding: '32px 24px 24px',
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      opacity: visible ? 1 : 0, transition: 'all 0.7s cubic-bezier(0.34,1.56,0.64,1)',
    }}>
      <div style={{ position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: '50%', background: mood.main, filter: 'blur(80px)', opacity: 0.12, animation: 'float 4s ease-in-out infinite' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <p style={{ color: '#64748b', fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 4 }}>Solde disponible</p>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
            <span style={{ color: '#475569', fontSize: 22, fontWeight: 300 }}>€</span>
            <span style={{ fontSize: 56, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1, color: mood.main, textShadow: `0 0 40px ${mood.main}44`, fontVariantNumeric: 'tabular-nums' }}>
              {animBalance.toLocaleString('fr-FR')}
            </span>
          </div>
          <p style={{ color: '#334155', fontSize: 12, marginTop: 6 }}>sur {fmt(budget)} de budget</p>
        </div>
        <div style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 16, padding: '10px 14px', textAlign: 'center' }}>
          <p style={{ fontSize: 22 }}>🔥</p>
          <p style={{ color: '#fbbf24', fontSize: 16, fontWeight: 800, lineHeight: 1 }}>{streak}</p>
          <p style={{ color: '#92400e', fontSize: 9, letterSpacing: '0.06em' }}>JOURS</p>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ color: '#475569', fontSize: 11 }}>{riskPct.toFixed(0)}% dépensé</span>
          <span style={{ color: '#334155', fontSize: 11 }}>Jour {todayDay}/{monthDays}</span>
        </div>
        <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${Math.min(riskPct, 100)}%`, background: `linear-gradient(90deg, ${mood.main}88, ${mood.main})`, borderRadius: 6, transition: 'width 1.5s cubic-bezier(0.34,1.56,0.64,1)', boxShadow: `0 0 12px ${mood.main}66` }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <span style={{ color: '#1e293b', fontSize: 10 }}>0€</span>
          <span style={{ color: '#1e293b', fontSize: 10 }}>Objectif J{todayDay} : {fmt(budget * todayDay / monthDays)}</span>
          <span style={{ color: '#1e293b', fontSize: 10 }}>{fmt(budget)}</span>
        </div>
      </div>

      <div style={{ background: `${mood.main}10`, border: `1px solid ${mood.main}25`, borderRadius: 16, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 20, flexShrink: 0 }}>{phrase.emoji}</span>
        <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.5, margin: 0 }}>{phrase.text}</p>
      </div>

      {(aiPhrase || aiPhraseLoading) && (
        <div style={{ marginTop: 10, background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 14, padding: '12px 14px' }}>
          {aiPhraseLoading
            ? <div style={{ height: 16, borderRadius: 8, background: 'rgba(255,255,255,0.08)', animation: 'pulse 1.5s ease infinite' }} />
            : <p style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.5, fontStyle: 'italic' }}>✨ {aiPhrase}</p>
          }
        </div>
      )}
    </div>
  )
}

interface StatStripProps { dailyRate: number; daysLeft: number; projectedEnd: number }
function StatStrip({ dailyRate, daysLeft, projectedEnd }: StatStripProps) {
  const animDaily = useCountUp(Math.round(dailyRate), 1000, 600)
  const animEnd   = useCountUp(Math.abs(Math.round(projectedEnd)), 1000, 800)
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 300) }, [])
  const stats = [
    { label: 'PAR JOUR',       value: `${animDaily}€`,                                    sub: 'rythme actuel',  color: '#60a5fa' },
    { label: 'JOURS RESTANTS', value: String(daysLeft),                                    sub: 'ce mois',        color: '#a78bfa' },
    { label: 'FIN DE MOIS',    value: projectedEnd < 0 ? `-${animEnd}€` : `+${animEnd}€`, sub: 'estimation',     color: projectedEnd < 0 ? '#ef4444' : '#22c55e' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.6s ease 0.3s' }}>
      {stats.map((s, i) => (
        <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: '14px 12px', textAlign: 'center' }}>
          <p style={{ color: '#334155', fontSize: 9, letterSpacing: '0.1em', marginBottom: 6 }}>{s.label}</p>
          <p style={{ color: s.color, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{s.value}</p>
          <p style={{ color: '#1e293b', fontSize: 10, marginTop: 4 }}>{s.sub}</p>
        </div>
      ))}
    </div>
  )
}

interface CategoryListProps { catTotals: Record<string, number>; totalSpent: number }
function CategoryList({ catTotals, totalSpent }: CategoryListProps) {
  const [visible, setVisible] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 500) }, [])
  const sorted = Object.entries(catTotals).sort(([, a], [, b]) => b - a)
  const maxAmt = sorted[0]?.[1] || 1
  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 24, padding: '20px', opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)', transition: 'all 0.6s ease 0.5s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <p style={{ color: '#475569', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Où va ton argent</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <PulsingDot color="#22c55e" />
          <span style={{ color: '#22c55e', fontSize: 10, fontWeight: 600 }}>LIVE</span>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {sorted.map(([cat, amount], i) => {
          const meta = CAT_META[cat] ?? { icon: '📦', label: cat, color: '#64748b', bg: '#64748b15' }
          const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0
          const barWidth = (amount / maxAmt) * 100
          return (
            <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 14, background: meta.bg, border: '1px solid rgba(255,255,255,0.04)', animation: `slideIn 0.4s ease ${i * 0.08}s both` }}>
              <span style={{ fontSize: 20, flexShrink: 0 }}>{meta.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600 }}>{meta.label}</span>
                  <span style={{ color: 'white', fontSize: 13, fontWeight: 800 }}>{fmt2(amount)}</span>
                </div>
                <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 3, background: meta.color, width: `${barWidth}%`, transition: `width 1.2s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.1}s`, boxShadow: `0 0 8px ${meta.color}66` }} />
                </div>
              </div>
              <span style={{ color: meta.color, fontSize: 11, fontWeight: 700, background: `${meta.color}15`, padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>{pct.toFixed(0)}%</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InsightCard({ insight, index }: { insight: Insight; index: number }) {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 700 + index * 150) }, [index])
  if (dismissed) return null
  return (
    <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.05))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: '16px', opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(20px)', transition: `all 0.5s ease ${0.1 * index}s` }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        <span style={{ fontSize: 24, flexShrink: 0 }}>{insight.icon}</span>
        <div style={{ flex: 1 }}>
          <p style={{ color: '#cbd5e1', fontSize: 13, lineHeight: 1.5, marginBottom: 10 }}>{insight.text}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <button style={{ background: 'rgba(99,102,241,0.25)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc', fontSize: 12, fontWeight: 700, padding: '5px 12px', borderRadius: 20, cursor: 'pointer' }}>
              {insight.action} →
            </button>
            <button onClick={() => setDismissed(true)} style={{ background: 'transparent', border: 'none', color: '#334155', fontSize: 18, cursor: 'pointer', padding: '0 4px', lineHeight: 1 }}>×</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function NotificationBanner() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  useEffect(() => { setTimeout(() => setVisible(true), 1200) }, [])
  if (dismissed) return null
  return (
    <div style={{ background: 'linear-gradient(135deg,rgba(251,191,36,0.12),rgba(245,158,11,0.06))', border: '1px solid rgba(251,191,36,0.25)', borderRadius: 18, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.98)', transition: 'all 0.5s cubic-bezier(0.34,1.56,0.64,1)' }}>
      <span style={{ fontSize: 22, flexShrink: 0 }}>🔔</span>
      <div style={{ flex: 1 }}>
        <p style={{ color: '#fbbf24', fontSize: 12, fontWeight: 700, marginBottom: 2 }}>Alerte budget activée</p>
        <p style={{ color: '#92400e', fontSize: 11 }}>Tu recevras une notif si tu dépasses 80% du budget</p>
      </div>
      <button onClick={() => setDismissed(true)} style={{ background: 'transparent', border: 'none', color: '#92400e', fontSize: 18, cursor: 'pointer' }}>×</button>
    </div>
  )
}

export default function DashboardPage() {
  const user = useAuthStore(s => s.user)

  const { data: budgets, isLoading: budgetsLoading } = useBudgets()
  const { mutate: createBudget, isPending: creating } = useCreateBudget()
  const [budgetInput, setBudgetInput] = useState('')

  const currentBudget = budgets?.[0] ?? null
  const { data: transactions, isLoading: txLoading } = useTransactions(currentBudget?.id)
  const { data: predictionRes } = usePrediction(currentBudget?.id ?? null)
  const { mutate: deleteTransactions, isPending: deleting } = useDeleteTransactions()

  const [importResult, setImportResult] = useState<CSVImportResponse | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const unlock = useBadgeUnlock()

  const now        = new Date()
  const todayDay   = now.getDate()
  const monthDays  = currentBudget
    ? new Date(currentBudget.year, currentBudget.month, 0).getDate()
    : new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const monthLabel = `${MONTHS_FR[now.getMonth()]} ${now.getFullYear()}`
  const firstName  = user?.full_name?.split(' ')[0] ?? 'toi'
  const city       = user?.city ?? ''

  const { streak } = useStreak()

  const txList     = transactions ?? []
  const totalSpent = txList.reduce((s, t) => s + t.amount, 0)
  const budget     = currentBudget?.total_amount ?? 0
  const balance    = budget - totalSpent
  const dailyRate  = totalSpent / Math.max(todayDay, 1)
  const daysLeft   = monthDays - todayDay
  const projectedEnd = balance - dailyRate * daysLeft
  const riskPct    = budget > 0 ? (totalSpent / budget) * 100 : 0
  const expectedPct = (todayDay / monthDays) * 100
  const phrase     = getPhrase(balance, projectedEnd, riskPct, expectedPct, dailyRate, todayDay)
  const mood       = MOOD_COLORS[phrase.mood]

  const catTotals = txList.reduce<Record<string, number>>((acc, t) => {
    acc[t.category] = (acc[t.category] ?? 0) + t.amount
    return acc
  }, {})

  const insights: Insight[] = predictionRes?.recommendations
    ? insightsFromRecs(predictionRes.recommendations)
    : []

  const topCat = Object.entries(catTotals).sort(([, a], [, b]) => b - a)[0]
  const { phrase: aiPhrase, loading: phraseLoading } = useDailyPhrase(
    currentBudget && totalSpent > 0 ? {
      budget_amount: budget, total_spent: totalSpent, daily_rate: dailyRate,
      days_elapsed: todayDay, top_category: topCat?.[0] ?? 'autre',
      top_amount: topCat?.[1] ?? 0, city: city || 'Paris',
    } : null
  )

  const bankConnected = localStorage.getItem('solv_bank_connected') === 'true'

  function handleCreateBudget() {
    const amount = parseFloat(budgetInput)
    if (!amount || amount <= 0) return
    createBudget({ month: now.getMonth() + 1, year: now.getFullYear(), total_amount: amount }, { onSuccess: () => setBudgetInput('') })
  }

  if (budgetsLoading) return (
    <AppLayout>
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spinner size={32} />
      </div>
    </AppLayout>
  )

  if (!currentBudget) return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 16, textAlign: 'center', animation: 'fadeUp 0.5s ease both' }}>
        <div style={{ fontSize: 52 }}>💰</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: 'white', marginBottom: 4 }}>Définis ton budget du mois</h2>
        <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>Entre ton revenu disponible ce mois-ci pour commencer.</p>
        <div style={{ display: 'flex', gap: 8, width: '100%', maxWidth: 320 }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              type="number" value={budgetInput}
              onChange={e => setBudgetInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreateBudget()}
              placeholder="2500"
              style={{ width: '100%', padding: '12px 12px 12px 32px', borderRadius: 12, background: '#1e1b4b', border: '1px solid rgba(99,102,241,0.4)', color: 'white', fontSize: 16, fontWeight: 700, boxSizing: 'border-box', outline: 'none' }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#6366f1', fontWeight: 800 }}>€</span>
          </div>
          <button onClick={handleCreateBudget} disabled={creating || !budgetInput}
            style={{ padding: '12px 20px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', opacity: creating || !budgetInput ? 0.5 : 1 }}>
            {creating ? '...' : 'OK'}
          </button>
        </div>
      </div>
    </AppLayout>
  )

  const hasTransactions = !txLoading && txList.length > 0

  return (
    <AppLayout>
      <div style={{ animation: 'fadeUp 0.5s ease both', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* Greeting */}
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: 'white', marginBottom: 4 }}>
            Bonjour {firstName} 👋
          </h2>
          <p style={{ fontSize: 13, color: '#475569' }}>{monthLabel}{city ? ` · ${city}` : ''}</p>
        </div>

        {!hasTransactions ? (
          <div style={{ animation: 'fadeUp 0.6s ease both' }}>
            <div style={{ textAlign: 'center', padding: '32px 16px 24px' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📂</div>
              <p style={{ color: 'white', fontSize: 17, fontWeight: 800, marginBottom: 8 }}>Importe ton relevé bancaire</p>
              <p style={{ color: '#475569', fontSize: 13, lineHeight: 1.6 }}>
                {txLoading ? 'Chargement des transactions…' : 'Pour voir tes stats et prédictions, ajoute tes dépenses du mois.'}
              </p>
            </div>
            {!txLoading && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 16 }}>
                <CSVImport budgetId={currentBudget.id} onSuccess={res => { setImportResult(res); unlock('csv_import') }} />
              </div>
            )}
            {txLoading && <div style={{ display: 'flex', justifyContent: 'center', padding: 24 }}><Spinner size={28} /></div>}
          </div>
        ) : (
          <>
            <NotificationBanner />
            <BalanceCard balance={balance} budget={budget} todayDay={todayDay} monthDays={monthDays} riskPct={riskPct} expectedPct={expectedPct} phrase={phrase} mood={mood} streak={streak} aiPhrase={aiPhrase} aiPhraseLoading={phraseLoading} />
            <StatStrip dailyRate={dailyRate} daysLeft={daysLeft} projectedEnd={projectedEnd} />
            <CategoryList catTotals={catTotals} totalSpent={totalSpent} />

            {insights.length > 0 && (
              <div>
                <p style={{ color: '#334155', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>💡 Insights du jour</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {insights.map((ins, i) => <InsightCard key={i} insight={ins} index={i} />)}
                </div>
              </div>
            )}

            {importResult && (
              <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 18, padding: 16, animation: 'fadeUp 0.4s ease both' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <p style={{ color: '#22c55e', fontWeight: 700, fontSize: 13 }}>✅ {importResult.imported} transactions importées</p>
                  <button onClick={() => setImportResult(null)} style={{ background: 'none', border: 'none', color: '#334155', fontSize: 18, cursor: 'pointer' }}>×</button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6 }}>
                  {Object.entries(importResult.category_totals).map(([cat, total]) => {
                    const meta = CAT_META[cat] ?? { icon: '📦', label: cat, color: '#64748b', bg: '#64748b15' }
                    return (
                      <div key={cat} style={{ background: meta.bg, borderRadius: 10, padding: '8px 10px', textAlign: 'center' }}>
                        <p style={{ fontSize: 16 }}>{meta.icon}</p>
                        <p style={{ color: '#94a3b8', fontSize: 10, marginTop: 2 }}>{meta.label}</p>
                        <p style={{ color: 'white', fontWeight: 700, fontSize: 12 }}>{fmt(total)}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {!bankConnected && (
              <Link to="/connect-bank" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 16, padding: '12px 16px', textDecoration: 'none', transition: 'all 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.14)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.07)')}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 18 }}>🏦</span>
                  <p style={{ fontSize: 12, color: '#94a3b8' }}>Connecte ta banque pour un import automatique</p>
                </div>
                <span style={{ color: '#6366f1', fontSize: 14, fontWeight: 800 }}>→</span>
              </Link>
            )}

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 22, padding: '18px', animation: 'fadeUp 0.6s ease 0.8s both' }}>
              <p style={{ color: '#475569', fontSize: 11, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 14 }}>Dernières transactions</p>
              {txList.slice(0, 5).map((tx, i) => {
                const meta = CAT_META[tx.category] ?? { icon: '📦', color: '#64748b' }
                const dateLabel = new Date(tx.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
                return (
                  <div key={tx.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: i < Math.min(txList.length, 5) - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none', animation: `slideIn 0.3s ease ${i * 0.06}s both` }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{meta.icon}</div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: '#cbd5e1' }}>{tx.label}</p>
                      <p style={{ fontSize: 11, color: '#334155' }}>{dateLabel}</p>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 800, color: '#ef4444' }}>-{fmt2(tx.amount)}</p>
                  </div>
                )
              })}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button onClick={() => setShowImport(v => !v)} style={{ padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', fontSize: 13, cursor: 'pointer', width: '100%' }}>
                + Importer des transactions supplémentaires
              </button>
              {showImport && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 16 }}>
                  <CSVImport budgetId={currentBudget.id} onSuccess={res => { setImportResult(res); setShowImport(false); unlock('csv_import') }} />
                </div>
              )}
              {!confirmDelete ? (
                <button onClick={() => setConfirmDelete(true)} style={{ padding: 12, borderRadius: 12, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 13, cursor: 'pointer', width: '100%' }}>
                  🗑️ Supprimer toutes les transactions
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: 12, borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', fontSize: 13, cursor: 'pointer' }}>
                    Annuler
                  </button>
                  <button disabled={deleting}
                    onClick={() => deleteTransactions(currentBudget.id, { onSuccess: () => { setConfirmDelete(false); setImportResult(null); setShowImport(false) } })}
                    style={{ flex: 1, padding: 12, borderRadius: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#ef4444', fontSize: 13, fontWeight: 700, cursor: deleting ? 'wait' : 'pointer', opacity: deleting ? 0.6 : 1 }}>
                    {deleting ? 'Suppression…' : 'Confirmer'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  )
}
