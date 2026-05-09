import AppLayout from '../components/Layout/AppLayout'
import { useMealPrep } from '../hooks/useRecommendations'
import Spinner from '../components/shared/Spinner'
import { useAuthStore } from '../store/authStore'
import type { MealPrepRecipe } from '../services/recommendations'

const DIFF_CFG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  facile:    { label: 'Facile',    color: '#22c55e', bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)'  },
  moyen:     { label: 'Moyen',     color: '#f97316', bg: 'rgba(249,115,22,0.12)', border: 'rgba(249,115,22,0.3)' },
  difficile: { label: 'Difficile', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)'  },
}

const TAG_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#22c55e', '#f97316']

export default function MealPrepPage() {
  const { data, isLoading } = useMealPrep()
  const recipes: MealPrepRecipe[] = data?.recipes ?? []
  const city = useAuthStore(s => s.user?.city)

  return (
    <AppLayout>
      <div style={{ animation: 'fadeUp 0.5s ease both', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Header */}
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: 'white', marginBottom: 4 }}>Recettes Meal Prep</h2>
          <p style={{ fontSize: 13, color: '#475569' }}>Des recettes économiques adaptées à ton profil. Moins de 2 € la portion.</p>
          {city && <p style={{ fontSize: 12, color: '#6366f1', marginTop: 6, fontWeight: 600 }}>📍 Recommandations pour {city}</p>}
        </div>

        {/* Bannière */}
        <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: '14px 18px', fontSize: 13, color: '#94a3b8', lineHeight: 1.6 }}>
          🍳 Cuisiner ces recettes coûte <strong style={{ color: '#22c55e' }}>2–3× moins cher</strong> que la livraison. Idéal le dimanche pour toute la semaine.
        </div>

        {/* Loading */}
        {isLoading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
            <Spinner size={32} />
          </div>
        )}

        {/* Empty */}
        {!isLoading && recipes.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '40vh', gap: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 56, animation: 'float 3s ease-in-out infinite' }}>🍽️</div>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'white' }}>Aucune recette disponible</p>
            <p style={{ fontSize: 13, color: '#475569' }}>Les recettes apparaissent une fois tes dépenses importées.</p>
          </div>
        )}

        {/* Recipe cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {recipes.map((recipe, i) => {
            const diff = DIFF_CFG[recipe.difficulty] ?? DIFF_CFG.facile
            const totalCost = recipe.cost_per_portion * recipe.portions

            return (
              <div key={i}
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '20px', animation: `slideIn 0.4s ease ${i * 0.07}s both`, transition: 'transform 0.18s, box-shadow 0.18s', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 28px rgba(0,0,0,0.35)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {/* Titre + coût/portion */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ flex: 1, marginRight: 14 }}>
                    <p style={{ fontSize: 16, fontWeight: 800, color: '#e2e8f0', marginBottom: 4 }}>{recipe.name}</p>
                    <p style={{ fontSize: 11, color: '#475569' }}>{recipe.prep_time} · {recipe.portions} portion{recipe.portions > 1 ? 's' : ''}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontSize: 22, fontWeight: 900, color: '#22c55e', letterSpacing: '-0.02em', lineHeight: 1, textShadow: '0 0 20px rgba(34,197,94,0.35)' }}>
                      {recipe.cost_per_portion.toFixed(2)} €
                    </p>
                    <p style={{ fontSize: 10, color: '#475569', marginTop: 3 }}>par portion</p>
                  </div>
                </div>

                {/* Ingrédients tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {recipe.ingredients.map((ing, j) => (
                    <span key={j} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', color: '#94a3b8', border: '1px solid rgba(255,255,255,0.09)' }}>
                      {ing}
                    </span>
                  ))}
                </div>

                {/* Tags colorés */}
                {recipe.tags && recipe.tags.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                    {recipe.tags.map((tag, j) => {
                      const color = TAG_COLORS[j % TAG_COLORS.length]
                      return (
                        <span key={j} style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20, color, background: `${color}18`, border: `1px solid ${color}40`, fontWeight: 600 }}>
                          {tag}
                        </span>
                      )
                    })}
                  </div>
                )}

                {/* Footer */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ fontSize: 11, fontWeight: 800, padding: '5px 14px', borderRadius: 20, color: diff.color, background: diff.bg, border: `1px solid ${diff.border}`, letterSpacing: '0.04em' }}>
                    {diff.label}
                  </span>
                  <p style={{ fontSize: 12, color: '#475569' }}>
                    Total : <strong style={{ color: '#94a3b8' }}>{totalCost.toFixed(2)} €</strong>
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </AppLayout>
  )
}
