import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'

export default function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()

  if (user && !user.onboardingComplete) {
    return <Navigate to="/profile" replace />
  }

  return <>{children}</>
}
