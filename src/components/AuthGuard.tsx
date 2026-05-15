import { Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { TicketSpinner } from '@/components/TicketMark'

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <TicketSpinner label="Loading" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}
