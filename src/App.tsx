import { RouterProvider } from 'react-router-dom'
import { AuthProvider } from '@/contexts/AuthContext'
import { router } from '@/routes'
import { InstallAppPrompt } from '@/components/InstallAppPrompt'

export default function App() {
  return (
    <AuthProvider>
      <InstallAppPrompt />
      <RouterProvider router={router} />
    </AuthProvider>
  )
}
