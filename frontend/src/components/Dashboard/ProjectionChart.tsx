import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ReferenceLine, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import type { ProjectionPoint } from '../../types'

interface Props {
  data: ProjectionPoint[]
  whatIfData?: ProjectionPoint[]
  riskColor: string
  budgetAmount: number
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl p-3 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">Jour {label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-bold">
          {p.name === 'actuel' ? 'Rythme actuel' : 'What-If'} : {Math.round(p.value).toLocaleString('fr-FR')} €
        </p>
      ))}
    </div>
  )
}

export default function ProjectionChart({ data, whatIfData, riskColor }: Props) {
  const chartData = data.map((p, i) => ({
    jour: p.day,
    actuel: p.balance,
    whatif: whatIfData?.[i]?.balance,
  }))

  return (
    <div className="bg-white/[0.03] rounded-2xl border border-white/[0.06] p-4">
      <p className="text-xs text-gray-500 mb-4">Projection du solde sur 30 jours</p>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -10, bottom: 0 }}>
          <defs>
            <linearGradient id="gradActuel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={riskColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={riskColor} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="gradWhatIf" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
          <XAxis dataKey="jour" tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false} />
          <YAxis tick={{ fill: '#475569', fontSize: 9 }} tickLine={false} axisLine={false}
            tickFormatter={(v) => `${v}€`} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} />
          <Area type="monotone" dataKey="actuel" name="actuel"
            stroke={riskColor} fill="url(#gradActuel)" strokeWidth={2} dot={false} />
          {whatIfData && (
            <Area type="monotone" dataKey="whatif" name="whatif"
              stroke="#22c55e" fill="url(#gradWhatIf)" strokeWidth={2}
              strokeDasharray="5 3" dot={false} />
          )}
        </AreaChart>
      </ResponsiveContainer>
      {whatIfData && (
        <div className="flex gap-4 justify-center mt-2 text-[10px] text-gray-500">
          <span><span style={{ color: riskColor }}>—</span> Rythme actuel</span>
          <span><span className="text-green-500">- -</span> Scénario What-If</span>
        </div>
      )}
    </div>
  )
}
