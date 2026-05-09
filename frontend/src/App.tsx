import { useState, useEffect, useCallback } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import ErrorBoundary       from './components/shared/ErrorBoundary'
import CookieBanner        from './components/shared/CookieBanner'
import SplashScreen        from './components/shared/SplashScreen'
import SolvChat            from './components/shared/SolvChat'
import { OnboardingTutorial } from './components/shared/StreakOnboarding'
import { BadgeProvider }   from './components/shared/BadgeSystem'
import { notificationService } from './services/notifications'
import LoginPage           from './pages/LoginPage'
import RegisterPage        from './pages/RegisterPage'
import OnboardingPage      from './pages/OnboardingPage'
import DashboardPage       from './pages/DashboardPage'
import WhatIfPage          from './pages/WhatIfPage'
import GhostsPage          from './pages/GhostsPage'
import PricesPage          from './pages/PricesPage'
import MealPrepPage        from './pages/MealPrepPage'
import SettingsPage        from './pages/SettingsPage'
import BadgesPage          from './pages/BadgesPage'
import ConnectBankPage     from './pages/ConnectBankPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false)
  const [onboardingDone, setOnboardingDone] = useState(
    () => localStorage.getItem('solv_onboarding_done') === '1'
  )

  const handleSplashDone = useCallback(() => {
    localStorage.setItem('solv_launched', '1')
    setSplashDone(true)
  }, [])

  const finishOnboarding = useCallback(() => {
    localStorage.setItem('solv_onboarding_done', '1')
    setOnboardingDone(true)
  }, [])

  useEffect(() => {
    notificationService.registerServiceWorker()
    notificationService.scheduleEvening()
  }, [])

  if (!splashDone) return <SplashScreen onDone={handleSplashDone} />

  return (
    <ErrorBoundary>
      <BadgeProvider>
        {!onboardingDone && <OnboardingTutorial onFinish={finishOnboarding} />}
        <Routes>
          <Route path="/login"        element={<LoginPage />} />
          <Route path="/register"     element={<RegisterPage />} />
          <Route path="/onboarding"   element={<PrivateRoute><OnboardingPage /></PrivateRoute>} />
          <Route path="/dashboard"    element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/whatif"       element={<PrivateRoute><WhatIfPage /></PrivateRoute>} />
          <Route path="/ghosts"       element={<PrivateRoute><GhostsPage /></PrivateRoute>} />
          <Route path="/prices"       element={<PrivateRoute><PricesPage /></PrivateRoute>} />
          <Route path="/mealprep"     element={<PrivateRoute><MealPrepPage /></PrivateRoute>} />
          <Route path="/settings"     element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
          <Route path="/badges"       element={<PrivateRoute><BadgesPage /></PrivateRoute>} />
          <Route path="/connect-bank" element={<PrivateRoute><ConnectBankPage /></PrivateRoute>} />
          <Route path="*"             element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <SolvChat />
        <CookieBanner />
      </BadgeProvider>
    </ErrorBoundary>
  )
}
