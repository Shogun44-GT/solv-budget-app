import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'
import Spinner from '../shared/Spinner'

interface PriceProduct {
  id: string; name: string; unit: string; category: string
  stores: Record<string, number>
  best_store: string; best_price: number; worst_price: number
  max_saving_per_purchase: number; saving_percentage: number
}

const fmt2 = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

const CATEGORY_LABELS: Record<string, string> = {
  laitier: '🥛 Laitier', epicerie: '🫙 Épicerie', boulangerie: '🍞 Boulangerie',
  boissons: '💧 Boissons', frais: '🥚 Frais', boucherie: '🥩 Boucherie',
  hygiene: '🧴 Hygiène', entretien: '🧹 Entretien',
}

export default function PriceCompareGrid() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery<{ products: PriceProduct[]; categories: string[]; total_products: number }>({
    queryKey: ['prices', activeCategory],
    queryFn: () => api.get('/api/v1/prices/compare', { params: activeCategory ? { category: activeCategory } : {} }).then(r => r.data),
    staleTime: 15 * 60 * 1000,
  })

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>

  const categories = data?.categories ?? []
  const products = (data?.products ?? []).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )
  const totalSaving = products.reduce((s, p) => s + p.max_saving_per_purchase, 0)

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher un produit..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500 transition"
        />
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">🔍</span>
      </div>

      {/* Category filters */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button onClick={() => setActiveCategory(null)}
          className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${!activeCategory ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
          Tous ({data?.total_products ?? 0})
        </button>
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
            className={`shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${activeCategory === cat ? 'bg-indigo-600 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}>
            {CATEGORY_LABELS[cat] ?? cat}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex justify-between items-center">
        <div>
          <p className="text-xs text-gray-400">📍 Comparatif Île-de-France</p>
          <p className="text-xs text-gray-500">{products.length} produit{products.length > 1 ? 's' : ''}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Économie max (Lidl vs Monoprix)</p>
          <p className="text-base font-extrabold text-green-400">{fmt2(totalSaving * 4)}<span className="text-xs font-normal text-gray-500">/mois</span></p>
        </div>
      </div>

      {/* Products */}
      <div className="space-y-3">
        {products.map(p => (
          <div key={p.id} className="bg-white/[0.04] rounded-xl border border-white/[0.07] p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="font-semibold text-sm">{p.name}</p>
                <p className="text-xs text-gray-500">{p.unit}</p>
              </div>
              <span className="text-[10px] font-bold text-green-400 bg-green-500/15 px-2 py-0.5 rounded-full ml-2 shrink-0">
                -{p.saving_percentage}%
              </span>
            </div>

            {/* Store grid */}
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${Object.keys(p.stores).length}, 1fr)` }}>
              {Object.entries(p.stores).map(([store, price]) => {
                const isBest = store === p.best_store
                return (
                  <div key={store} className={`text-center p-2 rounded-lg border ${isBest ? 'bg-green-500/15 border-green-500/30' : 'bg-white/[0.03] border-white/[0.05]'}`}>
                    <p className="text-[9px] text-gray-500 mb-1 truncate">{store}</p>
                    <p className={`font-extrabold text-xs ${isBest ? 'text-green-400' : 'text-gray-400'}`}>{fmt2(price)}</p>
                    {isBest && <p className="text-[8px] text-green-500 mt-0.5">✓</p>}
                  </div>
                )
              })}
            </div>

            <div className="mt-2 flex items-center gap-1.5 bg-green-500/8 rounded-lg px-3 py-1.5">
              <span className="text-xs">💰</span>
              <p className="text-xs text-green-400">
                Max {fmt2(p.max_saving_per_purchase)}/achat · ~{fmt2(p.max_saving_per_purchase * 4)}/mois
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
