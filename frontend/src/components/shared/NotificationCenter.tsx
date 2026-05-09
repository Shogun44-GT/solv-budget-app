import { useState } from 'react'
import { useNotifications } from '../../hooks/useRecommendations'
import type { Notification } from '../../services/recommendations'
import { useNavigate } from 'react-router-dom'

const URGENCY_STYLE = {
  critical: { bg: 'bg-red-500/12 border-red-500/30',    icon: '🚨', dot: 'bg-red-500' },
  warning:  { bg: 'bg-orange-500/12 border-orange-500/30', icon: '⚠️', dot: 'bg-orange-500' },
  info:     { bg: 'bg-blue-500/12 border-blue-500/30',   icon: '💡', dot: 'bg-blue-500' },
}

const ACTION_ROUTES: Record<string, string> = {
  open_recommendations: '/dashboard',
  open_whatif:          '/whatif',
  open_prices:          '/prices',
}

export default function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const { data, markRead } = useNotifications()
  const navigate = useNavigate()

  const notifications = data?.notifications ?? []
  const unread = notifications.filter(n => !n.is_read)

  const handleClick = (n: Notification) => {
    if (!n.is_read) markRead.mutate(n.id)
    if (n.action && ACTION_ROUTES[n.action]) {
      navigate(ACTION_ROUTES[n.action])
      setOpen(false)
    }
  }

  return (
    <div className="relative">
      {/* Bell button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-xl hover:bg-white/8 transition"
      >
        <span className="text-xl">🔔</span>
        {unread.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-red-500 text-[9px] font-bold flex items-center justify-center">
            {unread.length > 9 ? '9+' : unread.length}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-12 z-40 w-80 bg-gray-900 border border-white/12 rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-white/8 flex justify-between items-center">
              <span className="font-bold text-sm">Notifications</span>
              {unread.length > 0 && (
                <span className="text-xs text-gray-500">{unread.length} non lue{unread.length > 1 ? 's' : ''}</span>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-10 text-gray-500 text-sm">
                  <p className="text-3xl mb-2">🔔</p>
                  Aucune notification
                </div>
              ) : (
                notifications.map(n => {
                  const style = URGENCY_STYLE[n.urgency]
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition ${!n.is_read ? 'bg-white/[0.02]' : ''}`}
                    >
                      <div className="flex gap-3 items-start">
                        <span className="text-lg shrink-0 mt-0.5">{style.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <p className={`text-sm font-semibold ${!n.is_read ? 'text-white' : 'text-gray-400'}`}>
                              {n.title}
                            </p>
                            {!n.is_read && <div className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${style.dot}`} />}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.body}</p>
                          <p className="text-[10px] text-gray-600 mt-1">
                            {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
