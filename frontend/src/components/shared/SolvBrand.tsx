const GRAD_ID = 'solv-grad'
const CLIP_ID = 'solv-clip'

interface LogoProps { size?: number }

export function SolvLogo({ size = 36 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ flexShrink: 0 }}>
      <defs>
        <linearGradient id={GRAD_ID} x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <clipPath id={CLIP_ID}>
          <rect width="36" height="36" rx="10" />
        </clipPath>
        <style>{`
          @keyframes solvDash {
            from { stroke-dashoffset: 60; opacity: 0; }
            to   { stroke-dashoffset: 0;  opacity: 1; }
          }
          .solv-arc {
            stroke-dasharray: 60;
            stroke-dashoffset: 60;
            animation: solvDash 0.7s cubic-bezier(0.34,1.56,0.64,1) forwards;
          }
          .solv-arc-1 { animation-delay: 0s; }
          .solv-arc-2 { animation-delay: 0.18s; }
        `}</style>
      </defs>

      {/* Background */}
      <rect width="36" height="36" rx="10" fill="#0f0f23" />
      <rect width="36" height="36" rx="10" fill={`url(#${GRAD_ID})`} fillOpacity="0.18" />

      {/* Animated S arcs */}
      <g clipPath={`url(#${CLIP_ID})`}>
        {/* Top arc of S */}
        <path
          className="solv-arc solv-arc-1"
          d="M 22 10 A 6 6 0 0 0 10 14 C 10 18 18 18 18 22 A 7 7 0 0 1 10 27"
          stroke={`url(#${GRAD_ID})`}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
        />
        {/* Bottom arc of S */}
        <path
          className="solv-arc solv-arc-2"
          d="M 14 26 A 6.5 6.5 0 0 0 26 22 C 26 18 18 18 18 14 A 6 6 0 0 1 26 10"
          stroke={`url(#${GRAD_ID})`}
          strokeWidth="2.8"
          strokeLinecap="round"
          fill="none"
          opacity="0.8"
        />
      </g>

      {/* White dot — "v" of Solv */}
      <circle cx="27" cy="27" r="3.5" fill="white" opacity="0.95" />
      <circle cx="27" cy="27" r="2" fill={`url(#${GRAD_ID})`} />
    </svg>
  )
}

export function SolvWordmark() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <SolvLogo size={36} />
      <div>
        <p style={{
          fontSize: 15,
          fontWeight: 900,
          letterSpacing: '-0.04em',
          background: 'linear-gradient(135deg, white 30%, #c4b5fd)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1.15,
          margin: 0,
        }}>
          Solv
        </p>
        <p style={{ fontSize: 10, color: '#475569', marginTop: 1, lineHeight: 1 }}>
          Maîtrise ton argent
        </p>
      </div>
    </div>
  )
}

export function SolvWordmarkCompact() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <SolvLogo size={28} />
      <span style={{
        fontSize: 13,
        fontWeight: 900,
        letterSpacing: '-0.04em',
        background: 'linear-gradient(135deg, white 30%, #c4b5fd)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        Solv
      </span>
    </div>
  )
}
