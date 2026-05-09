import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/Layout/AppLayout'

const BANKS = [
  { id: 'boursorama', emoji: '🏦', name: 'Boursorama Banque',  color: '#6366f1' },
  { id: 'bnp',        emoji: '🏦', name: 'BNP Paribas',        color: '#22c55e' },
  { id: 'socgen',     emoji: '🏦', name: 'Société Générale',   color: '#ef4444' },
  { id: 'ca',         emoji: '🏦', name: 'Crédit Agricole',    color: '#22c55e' },
  { id: 'revolut',    emoji: '🟣', name: 'Revolut',            color: '#a78bfa' },
  { id: 'n26',        emoji: '🟠', name: 'N26',                color: '#f97316' },
  { id: 'lydia',      emoji: '🔵', name: 'Lydia / Sumeria',    color: '#60a5fa' },
]

export default function ConnectBankPage() {
  const navigate = useNavigate()
  const [connecting, setConnecting] = useState<string | null>(null)
  const [connected,  setConnected]  = useState<string | null>(null)

  const handleConnect = (id: string) => {
    setConnecting(id)
    setTimeout(() => {
      setConnecting(null)
      setConnected(id)
      localStorage.setItem('solv_bank_connected', 'true')
      setTimeout(() => navigate('/dashboard'), 1500)
    }, 2000)
  }

  return (
    <AppLayout>
      <div style={{ animation: 'fadeUp 0.5s ease both', display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>

        {/* Header */}
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', color: 'white', marginBottom: 4 }}>Connecte ta banque</h2>
          <p style={{ fontSize: 13, color: '#475569' }}>Import automatique de tes transactions. Connexion sécurisée via Open Banking.</p>
        </div>

        {/* Badge sécurité */}
        <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 14, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔒</span>
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.5 }}>
            Connexion en lecture seule · Chiffrement TLS · Aucun stockage de credentials
          </p>
        </div>

        {/* Liste banques */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {BANKS.map((bank, i) => {
            const isConnecting = connecting === bank.id
            const isConnected  = connected  === bank.id
            return (
              <button key={bank.id}
                onClick={() => !connecting && !connected && handleConnect(bank.id)}
                disabled={!!connecting || !!connected}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: isConnected ? `${bank.color}12` : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isConnected ? bank.color + '40' : 'rgba(255,255,255,0.07)'}`,
                  borderRadius: 18, padding: '16px 18px',
                  cursor: connecting || connected ? 'default' : 'pointer',
                  animation: `slideIn 0.35s ease ${i * 0.06}s both`,
                  transition: 'all 0.2s', textAlign: 'left', width: '100%',
                }}
                onMouseEnter={e => { if (!connecting && !connected) { e.currentTarget.style.background = `${bank.color}0e`; e.currentTarget.style.borderColor = `${bank.color}35` } }}
                onMouseLeave={e => { if (!connecting && !connected) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)' } }}
              >
                <span style={{ fontSize: 26, flexShrink: 0 }}>{bank.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 14, fontWeight: 700, color: isConnected ? bank.color : '#e2e8f0' }}>{bank.name}</p>
                  {isConnected && <p style={{ fontSize: 12, color: '#22c55e', marginTop: 2 }}>✅ 47 transactions importées</p>}
                </div>
                <div style={{ flexShrink: 0 }}>
                  {isConnecting ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: `2px solid ${bank.color}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                      <span style={{ fontSize: 12, color: bank.color }}>Connexion...</span>
                    </div>
                  ) : isConnected ? (
                    <span style={{ fontSize: 20 }}>✅</span>
                  ) : (
                    <span style={{ fontSize: 13, color: '#475569', background: 'rgba(255,255,255,0.05)', padding: '5px 12px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>Connecter</span>
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Note CSV */}
        <div style={{ background: 'rgba(99,102,241,0.07)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 14, padding: '14px 16px' }}>
          <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
            💡 Préfères-tu importer un fichier CSV ? Retourne sur le Dashboard et utilise le bouton Importer.
          </p>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </AppLayout>
  )
}
