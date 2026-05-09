interface Props {
  value: number   // 0-100
  color?: string
  height?: number
  className?: string
}

export default function ProgressBar({ value, color = '#6366f1', height = 4, className }: Props) {
  return (
    <div className={className} style={{ height, background: 'rgba(255,255,255,0.08)', borderRadius: height }}>
      <div
        style={{
          height: '100%',
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color,
          borderRadius: height,
          transition: 'width 0.6s ease',
        }}
      />
    </div>
  )
}
