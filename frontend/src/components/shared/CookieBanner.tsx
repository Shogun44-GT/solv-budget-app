import { useState, useEffect } from 'react'

const CONSENT_KEY = 'coachbudget_consent_v1'

export default function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (!stored) setVisible(true)
  }, [])

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ functional: true, analytics: false, date: new Date().toISOString() }))
    setVisible(false)
  }

  const refuse = () => {
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ functional: true, analytics: false, date: new Date().toISOString() }))
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-20 sm:bottom-4 left-4 right-4 z-50 max-w-lg mx-auto">
      <div className="bg-gray-900 border border-white/15 rounded-2xl p-4 shadow-2xl backdrop-blur">
        <p className="text-sm font-semibold mb-1">🍪 Politique de cookies</p>
        <p className="text-xs text-gray-400 mb-3 leading-relaxed">
          Nous utilisons uniquement des cookies <strong className="text-gray-300">fonctionnels</strong> (session JWT locale). Aucun cookie publicitaire ou analytique tiers.
        </p>
        <div className="flex gap-2">
          <button onClick={accept}
            className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition">
            Accepter
          </button>
          <button onClick={refuse}
            className="flex-1 py-2 rounded-xl bg-white/5 border border-white/10 text-sm text-gray-400 hover:text-white transition">
            Fonctionnel uniquement
          </button>
        </div>
      </div>
    </div>
  )
}
