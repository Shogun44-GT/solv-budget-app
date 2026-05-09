import { clsx } from 'clsx'

interface Props {
  label: string
  value: string
  sub?: string
  color?: string
  className?: string
}

export default function StatCard({ label, value, sub, color, className }: Props) {
  return (
    <div className={clsx('text-center px-4', className)}>
      <p className="text-[10px] text-gray-500 tracking-widest uppercase mb-1">{label}</p>
      <p className="text-lg font-extrabold" style={color ? { color } : {}}>
        {value}
      </p>
      {sub && <p className="text-[10px] text-gray-500 mt-0.5">{sub}</p>}
    </div>
  )
}
