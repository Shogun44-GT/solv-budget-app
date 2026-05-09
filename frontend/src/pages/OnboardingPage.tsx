import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreateBudget } from '../hooks/useBudgets'
import Spinner from '../components/shared/Spinner'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { mutate, isPending } = useCreateBudget()
  const [amount, setAmount] = useState('')

  const handleStart = () => {
    const total = parseFloat(amount)
    if (!total || total <= 0) return
    const now = new Date()
    mutate(
      { month: now.getMonth() + 1, year: now.getFullYear(), total_amount: total },
      { onSuccess: () => navigate('/dashboard') }
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="text-6xl mb-6">🎯</div>
        <h1 className="text-2xl font-extrabold mb-2">Bienvenue !</h1>
        <p className="text-gray-400 text-sm mb-8 max-w-sm mx-auto">
          Pour commencer, dis-moi quel est ton budget disponible ce mois-ci (après charges fixes si tu veux les exclure).
        </p>

        <div className="bg-white/[0.04] rounded-2xl border border-white/[0.08] p-6 text-left space-y-4 mb-6">
          <label className="block text-sm font-medium text-gray-300">💳 Budget mensuel disponible</label>
          <div className="relative">
            <input
              type="number" value={amount} onChange={e => setAmount(e.target.value)}
              placeholder="1200" onKeyDown={e => e.key === 'Enter' && handleStart()}
              className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/6 border border-white/12 text-white text-xl font-bold placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 font-extrabold text-lg">€</span>
          </div>
          <p className="text-xs text-gray-600">Tu pourras importer ton relevé bancaire juste après.</p>
        </div>

        <button onClick={handleStart} disabled={isPending || !amount}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 font-bold text-base transition hover:opacity-90 disabled:opacity-40 flex items-center justify-center gap-2">
          {isPending ? <><Spinner size={18}/> Création...</> : 'Commencer mon analyse →'}
        </button>
      </div>
    </div>
  )
}
