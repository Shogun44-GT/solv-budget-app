import { useEffect, useState } from 'react'

const GRAD_ID = 'splash-grad'

interface Props { onDone: () => void }

export default function SplashScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<'in' | 'out'>('in')

  useEffect(() => {
    const exit = setTimeout(() => setPhase('out'), 2000)
    const done = setTimeout(onDone, 2350)
    return () => { clearTimeout(exit); clearTimeout(done) }
  }, [onDone])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: '#080810',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      opacity: phase === 'out' ? 0 : 1,
      transition: 'opacity 0.35s ease',
      pointerEvents: 'none',
    }}>
      {/* Ambient glow */}
      <div style={{ position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Logo SVG animé */}
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginBottom: 24 }}>
        <defs>
          <linearGradient id={GRAD_ID} x1="0" y1="0" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
          <style>{`
            @keyframes drawS1 {
              from { stroke-dashoffset: 110; opacity: 0; }
              10%  { opacity: 1; }
              to   { stroke-dashoffset: 0; }
            }
            @keyframes drawS2 {
              from { stroke-dashoffset: 110; opacity: 0; }
              10%  { opacity: 1; }
              to   { stroke-dashoffset: 0; }
            }
            @keyframes dotPop {
              0%   { r: 0; opacity: 0; }
              100% { r: 6; opacity: 1; }
            }
            .s-arc-1 {
              stroke-dasharray: 110;
              stroke-dashoffset: 110;
              animation: drawS1 0.8s cubic-bezier(0.34,1,0.64,1) 0.1s forwards;
            }
            .s-arc-2 {
              stroke-dasharray: 110;
              stroke-dashoffset: 110;
              animation: drawS2 0.8s cubic-bezier(0.34,1,0.64,1) 0.35s forwards;
            }
            .s-dot {
              r: 0; opacity: 0;
              animation: dotPop 0.4s ease 0.9s forwards;
            }
          `}</style>
        </defs>
        <rect width="80" height="80" rx="22" fill="#0f0f23" />
        <rect width="80" height="80" rx="22" fill={`url(#${GRAD_ID})`} fillOpacity="0.18" />
        {/* Top arc */}
        <path className="s-arc-1"
          d="M 50 20 A 14 14 0 0 0 22 30 C 22 42 40 42 40 54 A 16 16 0 0 1 22 64"
          stroke={`url(#${GRAD_ID})`} strokeWidth="6" strokeLinecap="round" fill="none"
        />
        {/* Bottom arc */}
        <path className="s-arc-2"
          d="M 30 62 A 15 15 0 0 0 58 52 C 58 40 40 40 40 28 A 14 14 0 0 1 58 18"
          stroke={`url(#${GRAD_ID})`} strokeWidth="6" strokeLinecap="round" fill="none" opacity="0.85"
        />
        <circle className="s-dot" cx="60" cy="62" fill="white" />
      </svg>

      {/* Nom "Solv" */}
      <p style={{
        fontSize: 36, fontWeight: 900, letterSpacing: '-0.04em',
        background: 'linear-gradient(135deg, white 30%, #c4b5fd)',
        WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        animation: 'fadeUp 0.5s ease 0.5s both',
        marginBottom: 8,
      }}>
        Solv
      </p>

      {/* Tagline */}
      <p style={{
        fontSize: 13, color: '#475569',
        animation: 'fadeUp 0.5s ease 1s both',
        marginBottom: 0,
      }}>
        Maîtrise ton argent
      </p>

      {/* Barre de chargement */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.04)' }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg,#6366f1,#8b5cf6)',
          animation: 'splashProgress 1.8s cubic-bezier(0.4,0,0.2,1) 0.1s forwards',
          width: 0,
          boxShadow: '0 0 12px rgba(99,102,241,0.6)',
        }} />
      </div>

      <style>{`
        @keyframes splashProgress {
          from { width: 0; }
          to   { width: 100%; }
        }
      `}</style>
    </div>
  )
}
