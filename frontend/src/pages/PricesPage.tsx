import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import AppLayout from '../components/Layout/AppLayout'
import StoreMap from '../components/PriceCompare/StoreMap'
import Spinner from '../components/shared/Spinner'
import api from '../services/api'

interface PriceProduct {
  id: string; name: string; unit: string; category: string
  stores: Record<string, number>
  best_store: string; best_price: number; worst_price: number
  max_saving_per_purchase: number; saving_percentage: number
}

const CATEGORY_LABELS: Record<string, string> = {
  laitier:     '🥛 Laitier',
  epicerie:    '🫙 Épicerie',
  boulangerie: '🍞 Boulangerie',
  boissons:    '💧 Boissons',
  frais:       '🥚 Frais',
  boucherie:   '🥩 Boucherie',
  hygiene:     '🧴 Hygiène',
  entretien:   '🧹 Entretien',
}

const TABS = [
  { id: 'compare', icon: '💰', label: 'Comparer' },
  { id: 'map',     icon: '🗺️', label: 'Carte'    },
]

const fmt2 = (n: number) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

export default function PricesPage() {
  const [tab, setTab] = useState('compare')
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery<{ products: PriceProduct[]; categories: string[]; total_products: number }>({
    queryKey: ['prices', activeCategory],
    queryFn: () => api.get('/api/v1/prices/compare', { params: activeCategory ? { category: activeCategory } : {} }).then(r => r.data),
    staleTime: 15 * 60 * 1000,
  })

  const categories = data?.categories ?? []
  const products = (data?.products ?? []).filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase())
  )
  const totalSaving = products.reduce((s, p) => s + p.max_saving_per_purchase, 0)

  return (
    <AppLayout>
      <div style={{ animation: 'fadeUp 0.5s ease both', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: 'white', marginBottom: 4 }}>Comparateur de prix</h2>
          <p style={{ fontSize: 13, color: '#475569' }}>50 produits du quotidien · 5 enseignes · Île-de-France</p>
        </div>

        {/* Tab pills */}
        <div style={{ display: 'flex', gap: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: 5, border: '1px solid rgba(255,255,255,0.07)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10, fontSize: 13, fontWeight: 700,
                border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                background: tab === t.id ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'transparent',
                color: tab === t.id ? 'white' : '#475569',
                boxShadow: tab === t.id ? '0 4px 14px rgba(99,102,241,0.35)' : 'none',
              }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === 'compare' && (
          <>
            {/* Barre recherche */}
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 16, pointerEvents: 'none' }}>🔍</span>
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher un produit..."
                style={{ width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 13, paddingBottom: 13, borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s', accentColor: '#6366f1' }}
                onFocus={e => (e.target.style.borderColor = 'rgba(99,102,241,0.5)')}
                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
              />
            </div>

            {/* Filtres catégorie */}
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
              <button onClick={() => setActiveCategory(null)}
                style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.18s', background: !activeCategory ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.06)', color: !activeCategory ? 'white' : '#64748b', boxShadow: !activeCategory ? '0 2px 10px rgba(99,102,241,0.3)' : 'none' }}>
                Tous ({data?.total_products ?? 0})
              </button>
              {categories.map(cat => (
                <button key={cat} onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                  style={{ flexShrink: 0, padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'all 0.18s', background: activeCategory === cat ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'rgba(255,255,255,0.06)', color: activeCategory === cat ? 'white' : '#64748b', boxShadow: activeCategory === cat ? '0 2px 10px rgba(99,102,241,0.3)' : 'none' }}>
                  {CATEGORY_LABELS[cat] ?? cat}
                </button>
              ))}
            </div>

            {/* Bannière économie */}
            {!isLoading && products.length > 0 && (
              <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.18)', borderRadius: 20, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: 11, color: '#64748b', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4 }}>📍 Île-de-France</p>
                  <p style={{ fontSize: 13, color: '#94a3b8' }}>{products.length} produit{products.length > 1 ? 's' : ''} trouvé{products.length > 1 ? 's' : ''}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 11, color: '#475569', marginBottom: 4 }}>Économie max / mois</p>
                  <p style={{ fontSize: 22, fontWeight: 900, color: '#22c55e', letterSpacing: '-0.02em' }}>{fmt2(totalSaving * 4)}</p>
                </div>
              </div>
            )}

            {/* Loading */}
            {isLoading && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
                <Spinner size={32} />
              </div>
            )}

            {/* Produits */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {products.map((p, i) => (
                <div key={p.id}
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '18px', animation: `slideIn 0.35s ease ${Math.min(i, 6) * 0.04}s both`, transition: 'transform 0.18s, box-shadow 0.18s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
                >
                  {/* Nom + badge économie */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                    <div>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#e2e8f0', marginBottom: 3 }}>{p.name}</p>
                      <p style={{ fontSize: 11, color: '#475569' }}>{p.unit}</p>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#22c55e', background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)', padding: '4px 12px', borderRadius: 20, flexShrink: 0, marginLeft: 10 }}>
                      -{p.saving_percentage}%
                    </span>
                  </div>

                  {/* Grille enseignes */}
                  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Object.keys(p.stores).length}, 1fr)`, gap: 6, marginBottom: 12 }}>
                    {Object.entries(p.stores).map(([store, price]) => {
                      const isBest = store === p.best_store
                      return (
                        <div key={store} style={{ textAlign: 'center', padding: '10px 4px', borderRadius: 12, background: isBest ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isBest ? 'rgba(34,197,94,0.35)' : 'rgba(255,255,255,0.07)'}`, transition: 'all 0.2s' }}>
                          <p style={{ fontSize: 9, color: '#475569', marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{store}</p>
                          <p style={{ fontSize: 13, fontWeight: 900, color: isBest ? '#22c55e' : '#64748b' }}>{fmt2(price)}</p>
                          {isBest && <p style={{ fontSize: 9, color: '#22c55e', marginTop: 3, fontWeight: 700 }}>✓ Meilleur</p>}
                        </div>
                      )
                    })}
                  </div>

                  {/* Économie résumé */}
                  <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 14 }}>💰</span>
                    <p style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>
                      Économise <strong>{fmt2(p.max_saving_per_purchase)}</strong>/achat · ~<strong>{fmt2(p.max_saving_per_purchase * 4)}</strong>/mois
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'map' && (
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 18, animation: 'fadeUp 0.4s ease both' }}>
            <StoreMap />
          </div>
        )}
      </div>
    </AppLayout>
  )
}
