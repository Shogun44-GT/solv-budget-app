import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/auth'
import { useAuthStore } from '../store/authStore'
import { SolvLogo } from '../components/shared/SolvBrand'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 16px',
  borderRadius: '12px',
  background: '#1e1b4b',
  border: '1px solid rgba(99,102,241,0.3)',
  color: '#ffffff',
  fontSize: '15px',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const [form, setForm] = useState({ email: '', password: '', full_name: '', city: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { user } = await authService.register(form.email, form.password, form.full_name, form.city)
      setUser(user)
      navigate('/onboarding')
    } catch (err: any) {
      const data = err.response?.data
      if (data?.detail) {
        if (Array.isArray(data.detail)) {
          const first = data.detail[0]
          const field = first?.loc?.[first.loc.length - 1] ?? 'champ'
          setError(`${field} : ${first?.msg ?? 'Valeur invalide'}`)
        } else if (typeof data.detail === 'string') {
          setError(data.detail)
        } else {
          setError("Erreur lors de l'inscription")
        }
      } else {
        setError('Impossible de contacter le serveur.')
      }
    } finally {
      setLoading(false)
    }
  }

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }))

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080810', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#0f0f23', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '20px', padding: '36px' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px', gap: 12 }}>
          <SolvLogo size={48} />
          <h1 style={{ color: 'white', fontSize: '20px', fontWeight: 800, margin: 0 }}>Créer un compte</h1>
        </div>

        <form onSubmit={handleSubmit}>
          {[
            { field: 'full_name', label: 'Prénom & Nom',             placeholder: 'Joan Mballa',     type: 'text',     required: false },
            { field: 'email',     label: 'Email',                     placeholder: 'vous@exemple.fr', type: 'email',    required: true  },
            { field: 'city',      label: 'Ville',                     placeholder: 'Rungis',          type: 'text',     required: false },
            { field: 'password',  label: 'Mot de passe (8 car. min)', placeholder: '••••••••',        type: 'password', required: true  },
          ].map(({ field, label, placeholder, type, required }) => (
            <div key={field} style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>
                {label}
              </label>
              <input
                type={type}
                value={(form as any)[field]}
                onChange={set(field)}
                required={required}
                minLength={field === 'password' ? 8 : undefined}
                placeholder={placeholder}
                style={inputStyle}
              />
            </div>
          ))}

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', color: '#f87171', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', padding: '13px', borderRadius: '12px', background: loading ? '#4338ca80' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 700, fontSize: '15px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginTop: '20px' }}>
          Déjà un compte ?{' '}
          <Link to="/login" style={{ color: '#818cf8', textDecoration: 'none' }}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
