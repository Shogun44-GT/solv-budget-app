import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authService } from '../services/auth'
import { useAuthStore } from '../store/authStore'
import { SolvWordmark } from '../components/shared/SolvBrand'

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

export default function LoginPage() {
  const navigate = useNavigate()
  const setUser = useAuthStore((s) => s.setUser)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { user } = await authService.login(email, password)
      setUser(user)
      navigate('/dashboard')
    } catch (err: any) {
      const data = err.response?.data
      if (data?.detail && typeof data.detail === 'string') {
        setError(data.detail)
      } else {
        setError('Email ou mot de passe incorrect')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080810', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '420px', background: '#0f0f23', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '20px', padding: '36px' }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '28px', gap: 12 }}>
          <SolvWordmark />
          <p style={{ color: '#64748b', fontSize: '13px', margin: 0 }}>Connectez-vous à votre espace</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Email</label>
            <input
              type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              placeholder="vous@exemple.fr" style={inputStyle}
            />
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', fontWeight: 600, marginBottom: '6px' }}>Mot de passe</label>
            <input
              type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              placeholder="••••••••" style={inputStyle}
            />
          </div>

          {error && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '10px 14px', marginBottom: '16px', color: '#f87171', fontSize: '13px' }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit" disabled={loading}
            style={{ width: '100%', padding: '13px', borderRadius: '12px', background: loading ? '#4338ca80' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: 'white', fontWeight: 700, fontSize: '15px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer' }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: '#64748b', fontSize: '13px', marginTop: '20px' }}>
          Pas encore de compte ?{' '}
          <Link to="/register" style={{ color: '#818cf8', textDecoration: 'none' }}>S'inscrire</Link>
        </p>
      </div>
    </div>
  )
}
