import { clsx } from 'clsx'

type RiskLevel = 'safe' | 'warning' | 'critical'

const CONFIG = {
  safe:     { label: 'SEREIN',    classes: 'bg-green-500/20 text-green-400 border-green-500/40' },
  warning:  { label: 'ATTENTION', classes: 'bg-orange-500/20 text-orange-400 border-orange-500/40' },
  critical: { label: 'CRITIQUE',  classes: 'bg-red-500/20 text-red-400 border-red-500/40' },
}

export function getRiskLevel(score: number): RiskLevel {
  if (score >= 70) return 'critical'
  if (score >= 40) return 'warning'
  return 'safe'
}

export function getRiskColor(level: RiskLevel) {
  return { safe: '#22c55e', warning: '#f97316', critical: '#ef4444' }[level]
}

interface Props { score: number; className?: string }

export default function RiskBadge({ score, className }: Props) {
  const level = getRiskLevel(score)
  const { label, classes } = CONFIG[level]
  return (
    <span className={clsx('text-[11px] font-bold px-3 py-1 rounded-full border tracking-widest', classes, className)}>
      {label}
    </span>
  )
}
