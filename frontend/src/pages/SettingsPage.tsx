import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import AppLayout from '../components/Layout/AppLayout'
import { useAuthStore } from '../store/authStore'
import api from '../services/api'
import { notificationService } from '../services/notifications'
import type { User } from '../types'

interface SectionProps { icon: string; title: string; children: React.ReactNode }
function Section({ icon, title, children }: SectionProps) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <span style={{ fontSize: 13, fontWeight: 800, color: '#e2e8f0', letterSpacing: '-0.01em' }}>{title}</span>
      </div>
      <div style={{ padding: '18px 20px' }}>
        {children}
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const user       = useAuthStore(s => s.user)
  const updateUser = useAuthStore(s => s.updateUser)
  const logout     = useAuthStore(s => s.logout)
  const navigate   = useNavigate()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting,  setDeleting]  = useState(false)
  const [exporting, setExporting] = useState(false)
  const [notifStatus, setNotifStatus] = useState<'idle' | 'granted' | 'denied'>('idle')

  const [editingProfile, setEditingProfile] = useState(false)
  const [editName, setEditName] = useState(user?.full_name ?? '')
  const [editCity, setEditCity] = useState(user?.city ?? '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaved, setProfileSaved] = useState(false)

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const { data } = await api.patch('/api/v1/auth/profile', { full_name: editName, city: editCity })
      updateUser(data as Partial<User>)
      setEditingProfile(false)
      setProfileSaved(true)
      setTimeout(() => setProfileSaved(false), 2000)
    } finally {
      setSavingProfile(false)
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const res = await api.get('/api/v1/gdpr/export', { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data]))
      const a = document.createElement('a')
      a.href = url
      a.download = `solv_export_${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      await api.delete('/api/v1/gdpr/delete-account')
      logout()
      navigate('/login')
    } finally {
      setDeleting(false)
    }
  }

  const profileRows = [
    { label: '📧 Email', value: user?.email    },
    { label: '👤 Nom',   value: user?.full_name },
    { label: '📍 Ville', value: user?.city      },
  ]

  const privacyPoints = [
    '✅ Aucun cookie tiers — session JWT locale',
    '✅ Aucune analytics tierce en production',
    '✅ Mot de passe hashé (bcrypt), jamais transmis en clair',
    '✅ Données hébergées en Europe (RGPD)',
    '✅ Anthropic Claude API : aucune donnée personnelle transmise',
  ]

  return (
    <AppLayout>
      <div style={{ animation: 'fadeUp 0.5s ease both', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 560 }}>

        {/* Header */}
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: 'white', marginBottom: 4 }}>Paramètres & Confidentialité</h2>
          <p style={{ fontSize: 13, color: '#475569' }}>Gère tes données personnelles conformément au RGPD.</p>
        </div>

        {/* Profil */}
        <Section icon="👤" title="Mon profil">
          {!editingProfile ? (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {profileRows.map(({ label, value }, i) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 0', borderBottom: i < profileRows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                  <span style={{ fontSize: 12, color: '#475569' }}>{label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>{value || '—'}</span>
                </div>
              ))}
              <button onClick={() => { setEditName(user?.full_name ?? ''); setEditCity(user?.city ?? ''); setEditingProfile(true) }}
                style={{ marginTop: 14, padding: '10px', borderRadius: 12, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                {profileSaved ? '✅ Enregistré !' : '✏️ Modifier mon profil'}
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', marginBottom: 6, display: 'block' }}>👤 Nom complet</label>
                <input value={editName} onChange={e => setEditName(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: '#64748b', marginBottom: 6, display: 'block' }}>📍 Ville</label>
                <input value={editCity} onChange={e => setEditCity(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSaveProfile} disabled={savingProfile}
                  style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', fontSize: 13, fontWeight: 800, cursor: savingProfile ? 'wait' : 'pointer', opacity: savingProfile ? 0.7 : 1 }}>
                  {savingProfile ? '⏳ Sauvegarde…' : 'Enregistrer'}
                </button>
                <button onClick={() => setEditingProfile(false)}
                  style={{ flex: 1, padding: '11px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Annuler
                </button>
              </div>
            </div>
          )}
        </Section>

        {/* Export RGPD */}
        <Section icon="📦" title="Mes données (RGPD Art. 20)">
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, marginBottom: 16 }}>
            Exporte toutes tes données personnelles (budgets, transactions, profil) au format JSON. Tes données t'appartiennent.
          </p>
          <button onClick={handleExport} disabled={exporting}
            style={{ width: '100%', padding: '13px', borderRadius: 14, background: exporting ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', color: 'white', fontSize: 14, fontWeight: 800, cursor: exporting ? 'wait' : 'pointer', opacity: exporting ? 0.7 : 1, boxShadow: exporting ? 'none' : '0 4px 20px rgba(99,102,241,0.35)', transition: 'all 0.2s' }}
            onMouseEnter={e => !exporting && (e.currentTarget.style.boxShadow = '0 6px 28px rgba(99,102,241,0.5)')}
            onMouseLeave={e => (e.currentTarget.style.boxShadow = '0 4px 20px rgba(99,102,241,0.35)')}
          >
            {exporting ? '⏳ Préparation…' : '⬇️ Télécharger mes données'}
          </button>
        </Section>

        {/* Notifications */}
        <Section icon="🔔" title="Notifications">
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, marginBottom: 16 }}>
            Reçois une alerte à 20h si ton streak est en danger, et une notification quand tu approches 80% de ton budget.
          </p>
          <button
            onClick={async () => {
              const ok = await notificationService.requestPermission()
              setNotifStatus(ok ? 'granted' : 'denied')
            }}
            style={{ width: '100%', padding: '13px', borderRadius: 14, background: notifStatus === 'granted' ? 'rgba(34,197,94,0.15)' : notifStatus === 'denied' ? 'rgba(239,68,68,0.12)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: notifStatus === 'granted' ? '1px solid rgba(34,197,94,0.3)' : notifStatus === 'denied' ? '1px solid rgba(239,68,68,0.3)' : 'none', color: notifStatus === 'granted' ? '#22c55e' : notifStatus === 'denied' ? '#ef4444' : 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
          >
            {notifStatus === 'granted' ? '✅ Notifications activées' : notifStatus === 'denied' ? '❌ Permission refusée' : '🔔 Activer les notifications'}
          </button>
        </Section>

        {/* Reset intro */}
        <Section icon="🔄" title="Réinitialiser l'expérience">
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, marginBottom: 16 }}>
            Revoir l'animation de démarrage et le tutoriel d'introduction. Tes données ne seront pas supprimées.
          </p>
          <button
            onClick={() => {
              localStorage.removeItem('solv_launched')
              localStorage.removeItem('solv_onboarding_done')
              localStorage.removeItem('solv_badges')
              window.location.reload()
            }}
            style={{ width: '100%', padding: '13px', borderRadius: 14, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc', fontSize: 14, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.1)' }}
          >
            🎬 Revoir l'intro Solv
          </button>
        </Section>

        {/* Badges */}
        <Section icon="🏆" title="Mes badges">
          <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, marginBottom: 16 }}>
            Débloque des récompenses en utilisant Solv chaque jour.
          </p>
          <Link to="/badges" style={{ display: 'block', width: '100%', padding: '13px', borderRadius: 14, background: 'rgba(167,139,250,0.12)', border: '1px solid rgba(167,139,250,0.25)', color: '#a78bfa', fontSize: 14, fontWeight: 800, textDecoration: 'none', textAlign: 'center', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.2)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(167,139,250,0.12)' }}
          >
            Voir mes badges →
          </Link>
        </Section>

        {/* Politique confidentialité */}
        <Section icon="🔒" title="Politique de confidentialité">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
            {privacyPoints.map((pt, i) => (
              <p key={i} style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>{pt}</p>
            ))}
          </div>
          <a href="/api/v1/gdpr/privacy-policy" target="_blank"
            style={{ fontSize: 13, color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}
            onMouseEnter={e => (e.currentTarget.style.color = '#a5b4fc')}
            onMouseLeave={e => (e.currentTarget.style.color = '#818cf8')}
          >
            Lire la politique complète →
          </a>
        </Section>

        {/* Zone danger */}
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 20, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px 20px', borderBottom: '1px solid rgba(239,68,68,0.15)' }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: '#f87171', letterSpacing: '-0.01em' }}>Zone de danger</span>
          </div>
          <div style={{ padding: '18px 20px' }}>
            <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.65, marginBottom: 18 }}>
              La suppression de ton compte est <strong style={{ color: '#94a3b8' }}>irréversible</strong>. Toutes tes données (budgets, transactions, prédictions) seront effacées définitivement conformément à l'Art. 17 du RGPD.
            </p>

            {!confirmDelete ? (
              <button onClick={() => setConfirmDelete(true)}
                style={{ width: '100%', padding: '13px', borderRadius: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
              >
                🗑️ Supprimer mon compte
              </button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: 'rgba(239,68,68,0.1)', borderRadius: 12, padding: '12px 16px', textAlign: 'center' }}>
                  <p style={{ fontSize: 13, color: '#f87171', fontWeight: 700 }}>Confirmes-tu la suppression définitive ?</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleDeleteAccount} disabled={deleting}
                    style={{ flex: 1, padding: '13px', borderRadius: 14, background: '#ef4444', border: 'none', color: 'white', fontSize: 13, fontWeight: 800, cursor: deleting ? 'wait' : 'pointer', opacity: deleting ? 0.6 : 1, transition: 'all 0.2s', boxShadow: '0 4px 16px rgba(239,68,68,0.35)' }}
                    onMouseEnter={e => !deleting && (e.currentTarget.style.background = '#dc2626')}
                    onMouseLeave={e => (e.currentTarget.style.background = '#ef4444')}
                  >
                    {deleting ? '⏳ Suppression…' : 'Oui, supprimer'}
                  </button>
                  <button onClick={() => setConfirmDelete(false)}
                    style={{ flex: 1, padding: '13px', borderRadius: 14, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}
                    onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = '#94a3b8'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)' }}
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </AppLayout>
  )
}
