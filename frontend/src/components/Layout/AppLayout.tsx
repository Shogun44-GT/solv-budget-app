import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/auth'
import NotificationCenter from '../shared/NotificationCenter'
import { StreakBadge, StreakBadgeInline } from '../shared/StreakOnboarding'

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

const NAV = [
  { to: '/dashboard', icon: '📊', label: 'Dashboard' },
  { to: '/whatif',    icon: '🎛️', label: 'What-If'   },
  { to: '/ghosts',    icon: '👻', label: 'Abos'      },
  { to: '/prices',    icon: '🏪', label: 'Prix'      },
  { to: '/mealprep',  icon: '🍳', label: 'Recettes'  },
  { to: '/settings',  icon: '⚙️', label: 'Réglages'  },
]

const FONT = "'DM Sans','Segoe UI',-apple-system,sans-serif"
const BG   = '#080810'

interface Props { children: React.ReactNode }

export default function AppLayout({ children }: Props) {
  const user     = useAuthStore(s => s.user)
  const logout   = useAuthStore(s => s.logout)
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  const handleLogout = () => { authService.logout(); logout(); navigate('/login') }

  /* ── Mobile ────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT, color: '#e2e8f0' }}>

        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(8,8,16,0.92)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="/solv-logo.svg" width="28" height="28" alt="Solv" style={{ borderRadius: 8 }} />
            <span style={{ fontSize: 15, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>Solv</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StreakBadgeInline />
            <NotificationCenter />
          </div>
        </header>

        <main style={{ padding: '16px', paddingBottom: 88 }}>
          {children}
        </main>

        <nav style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
          background: 'rgba(8,8,16,0.96)', backdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          display: 'flex', padding: '8px 0 max(12px, env(safe-area-inset-bottom))',
        }}>
          {NAV.slice(0, 5).map(({ to, icon, label }) => (
            <NavLink key={to} to={to}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, textDecoration: 'none', padding: '4px 0' }}
            >
              {({ isActive }) => (
                <>
                  <span style={{ fontSize: 20, filter: isActive ? 'none' : 'grayscale(1) opacity(0.35)', transform: isActive ? 'scale(1.15) translateY(-2px)' : 'scale(1)', transition: 'all 0.2s cubic-bezier(0.34,1.56,0.64,1)', display: 'block' }}>
                    {icon}
                  </span>
                  <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.05em', color: isActive ? '#818cf8' : '#334155', transition: 'color 0.2s' }}>
                    {label}
                  </span>
                  {isActive && <div style={{ width: 4, height: 4, borderRadius: '50%', background: '#6366f1', boxShadow: '0 0 8px #6366f1' }} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    )
  }

  /* ── Desktop ───────────────────────────────────────────────── */
  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: FONT, color: '#e2e8f0', display: 'flex' }}>

      <aside style={{
        width: 220, flexShrink: 0,
        position: 'sticky', top: 0, height: '100vh',
        background: 'rgba(255,255,255,0.02)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 12px', display: 'flex', flexDirection: 'column', overflowY: 'auto',
      }}>

        <div style={{ padding: '0 8px 20px', marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/solv-logo.svg" width="36" height="36" alt="Solv" style={{ borderRadius: 10 }} />
            <span style={{ fontSize: 18, fontWeight: 900, color: 'white', letterSpacing: '-0.03em' }}>Solv</span>
          </div>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {NAV.map(({ to, icon, label }) => (
            <NavLink key={to} to={to}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                borderRadius: 12, textDecoration: 'none', transition: 'all 0.18s',
                background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                border: `1px solid ${isActive ? 'rgba(99,102,241,0.3)' : 'transparent'}`,
                color: isActive ? '#a5b4fc' : '#475569',
                fontWeight: isActive ? 700 : 500,
                boxShadow: isActive ? '0 2px 12px rgba(99,102,241,0.15)' : 'none',
              })}
            >
              <span style={{ fontSize: 17 }}>{icon}</span>
              <span style={{ fontSize: 13 }}>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14, marginTop: 8 }}>
          <div style={{ marginBottom: 10 }}>
            <StreakBadge />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', marginBottom: 8, borderRadius: 10, background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#ec4899)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white', flexShrink: 0 }}>
              {user?.full_name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.full_name || user?.email || 'Utilisateur'}
              </p>
            </div>
            <NotificationCenter />
          </div>
          <button onClick={handleLogout}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 10, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)' }}
          >
            Déconnexion
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '32px 40px', minHeight: '100vh', overflowY: 'auto' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          {children}
        </div>
      </main>
    </div>
  )
}
