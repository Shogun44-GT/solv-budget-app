import { useState, useRef, useEffect } from 'react'
import api from '../../services/api'
import { useAuthStore } from '../../store/authStore'

interface Message { role: 'user' | 'assistant'; text: string }

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

const SUGGESTIONS = [
  'Où est-ce que je dépense trop ?',
  'Comment réduire mes courses ?',
  'Suis-je en bonne voie ce mois-ci ?',
]

export default function SolvChat() {
  const [open, setOpen]       = useState(false)
  const [input, setInput]     = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', text: 'Salut ! Je suis Solv 👋 Pose-moi une question sur ton budget.' },
  ])
  const user     = useAuthStore(s => s.user)
  const isMobile = useIsMobile()
  const endRef   = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, open])

  const send = async (text: string) => {
    if (!text.trim() || loading) return
    setInput('')
    setMessages(m => [...m, { role: 'user', text }])
    setLoading(true)
    try {
      const { data } = await api.post('/api/v1/recommendations/chat', {
        message: text,
        budget_context: { city: user?.city || 'Paris' },
      })
      setMessages(m => [...m, { role: 'assistant', text: data.response }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', text: 'Désolé, je suis indisponible pour le moment.' }])
    } finally {
      setLoading(false)
    }
  }

  const btnBottom  = isMobile ? 90  : 24
  const drawerBottom = isMobile ? 0  : 90
  const drawerRight  = isMobile ? 0  : 24
  const drawerLeft   = isMobile ? 0  : 'auto'
  const drawerRadius = isMobile ? '20px 20px 0 0' : '20px'

  return (
    <>
      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: btnBottom, right: 20, zIndex: 200,
          width: 52, height: 52, borderRadius: '50%',
          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
          border: 'none', cursor: 'pointer', fontSize: 22,
          boxShadow: '0 4px 20px rgba(99,102,241,0.5)',
          transition: 'transform 0.2s, box-shadow 0.2s, bottom 0.2s',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,0.65)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';   e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.5)' }}
      >
        {open ? '✕' : '💬'}
      </button>

      {/* Drawer */}
      {open && (
        <div style={{
          position: 'fixed',
          bottom: drawerBottom, right: drawerRight, left: drawerLeft,
          zIndex: 199, display: 'flex', justifyContent: 'flex-end',
        }}>
          <div style={{
            width: '100%', maxWidth: 400, height: 480,
            background: '#0f0f23', border: '1px solid rgba(99,102,241,0.25)',
            borderRadius: drawerRadius,
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 -8px 40px rgba(0,0,0,0.5)',
            animation: 'fadeUp 0.3s ease both',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💬</div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 800, color: 'white' }}>Demande à Solv</p>
                  <p style={{ fontSize: 11, color: '#22c55e' }}>● En ligne</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} style={{ background: 'transparent', border: 'none', color: '#475569', fontSize: 20, cursor: 'pointer' }}>×</button>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {messages.map((m, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{
                    maxWidth: '80%', padding: '10px 14px',
                    borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: m.role === 'user' ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.06)',
                    border: m.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.08)',
                    fontSize: 13, color: 'white', lineHeight: 1.5,
                    animation: 'fadeUp 0.2s ease both',
                  }}>
                    {m.text}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', gap: 4, padding: '10px 14px' }}>
                  {[0,1,2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#6366f1', animation: `ping 1.2s ${i * 0.2}s ease infinite` }} />)}
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div style={{ padding: '0 16px 10px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {SUGGESTIONS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    style={{ fontSize: 11, padding: '5px 12px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', cursor: 'pointer', transition: 'all 0.18s' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.22)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.12)' }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div style={{ padding: '10px 14px 16px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', gap: 8 }}>
              <input
                value={input} onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send(input)}
                placeholder="Pose ta question..."
                style={{ flex: 1, padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 13, outline: 'none' }}
              />
              <button onClick={() => send(input)} disabled={loading || !input.trim()}
                style={{ padding: '10px 16px', borderRadius: 14, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', fontSize: 14, cursor: 'pointer', opacity: loading || !input.trim() ? 0.5 : 1, transition: 'opacity 0.2s' }}>
                ↑
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
