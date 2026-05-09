export const notificationService = {
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  },

  async registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return null
    try {
      return await navigator.serviceWorker.register('/sw.js')
    } catch {
      return null
    }
  },

  async scheduleLocal(title: string, body: string, delayMs = 0) {
    const granted = await this.requestPermission()
    if (!granted) return
    setTimeout(() => {
      new Notification(title, { body, icon: '/favicon.svg', tag: 'solv-budget' })
    }, delayMs)
  },

  scheduleEvening() {
    const now = new Date()
    const evening = new Date()
    evening.setHours(20, 0, 0, 0)
    if (now > evening) evening.setDate(evening.getDate() + 1)
    const delay = evening.getTime() - now.getTime()
    const streak = parseInt(localStorage.getItem('solv_streak') || '0', 10)
    this.scheduleLocal(
      streak > 0 ? `🔥 Streak de ${streak} jours en danger !` : "💰 Solv t'attend",
      streak > 0 ? 'Ouvre Solv avant minuit pour garder ton streak.' : 'Consulte ton budget du jour.',
      delay
    )
  },

  sendBudgetAlert(pct: number) {
    if (pct >= 80) {
      this.scheduleLocal(
        '⚠️ Budget à ' + Math.round(pct) + '%',
        'Tu approches la limite. Regarde tes dépenses.',
        0
      )
    }
  },
}
