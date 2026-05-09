import AppLayout from '../components/Layout/AppLayout'
import { BADGES, BadgeCard } from '../components/shared/BadgeSystem'

function getUnlocked(): string[] {
  try { return JSON.parse(localStorage.getItem('solv_badges') || '[]') } catch { return [] }
}

export default function BadgesPage() {
  const unlocked = getUnlocked()
  const earned = BADGES.filter(b => unlocked.includes(b.id))
  const locked  = BADGES.filter(b => !unlocked.includes(b.id))

  return (
    <AppLayout>
      <div style={{ animation: 'fadeUp 0.5s ease both', display: 'flex', flexDirection: 'column', gap: 20 }}>

        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: 'white', marginBottom: 4 }}>Badges & Récompenses</h2>
          <p style={{ fontSize: 13, color: '#475569' }}>
            {earned.length}/{BADGES.length} badge{earned.length > 1 ? 's' : ''} débloqué{earned.length > 1 ? 's' : ''}
          </p>
        </div>

        {/* Barre progression */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>Progression</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa' }}>{Math.round(earned.length / BADGES.length * 100)}%</span>
          </div>
          <div style={{ height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 6, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${earned.length / BADGES.length * 100}%`, background: 'linear-gradient(90deg,#6366f1,#8b5cf6)', borderRadius: 6, transition: 'width 1s ease', boxShadow: '0 0 12px rgba(99,102,241,0.5)' }} />
          </div>
        </div>

        {/* Badges débloqués */}
        {earned.length > 0 && (
          <div>
            <p style={{ fontSize: 11, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>Débloqués</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {earned.map(b => <BadgeCard key={b.id} badge={b} earned={true} />)}
            </div>
          </div>
        )}

        {/* Badges verrouillés */}
        {locked.length > 0 && (
          <div>
            <p style={{ fontSize: 11, color: '#475569', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>À débloquer</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {locked.map(b => <BadgeCard key={b.id} badge={b} earned={false} />)}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}
