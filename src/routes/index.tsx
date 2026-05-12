import { createBrowserRouter, Navigate, Outlet, useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'

function SwNavigationHandler() {
  const navigate = useNavigate()

  // Handle cold-start case: app opened via notification with ?sw_redirect= param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get('sw_redirect')
    if (redirect) {
      window.history.replaceState({}, '', window.location.pathname)
      navigate(redirect, { replace: true })
    }
  }, [navigate])

  // Handle running-app case: SW posts a message when notification is tapped
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'navigate' && event.data?.path) {
        navigate(event.data.path)
      }
    }
    navigator.serviceWorker.addEventListener('message', handler)
    return () => navigator.serviceWorker.removeEventListener('message', handler)
  }, [navigate])

  return <Outlet />
}
import Layout from '@/screens/Layout'
import Login from '@/screens/Login'
import Home from '@/screens/Home'
import MainStandings from '@/screens/MainStandings'
import PredictionStandings from '@/screens/PredictionStandings'
import Profile from '@/screens/Profile'
import PlayersAndTeams from '@/screens/PlayersAndTeams'
import Prediction from '@/screens/Prediction'
import FinishedMatches from '@/screens/FinishedMatches'
import Invite from '@/screens/Invite'
import Chat from '@/screens/Chat'
import PlayerPage from '@/screens/PlayerPage'
import MyTeamList from '@/screens/MyTeamList'
import DrawDay from '@/screens/DrawDay'
import AuthGuard from '@/components/AuthGuard'
import OnboardingGuard from '@/components/OnboardingGuard'

function PredictionRoute() {
  const { matchId } = useParams<{ matchId: string }>()
  return <Prediction key={matchId} />
}

export const router = createBrowserRouter([
  {
    element: <SwNavigationHandler />,
    children: [
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/profile',
    element: (
      <AuthGuard>
        <Profile />
      </AuthGuard>
    ),
  },
  {
    path: '/',
    element: (
      <AuthGuard>
        <OnboardingGuard>
          <Layout />
        </OnboardingGuard>
      </AuthGuard>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: 'my-list', element: <MyTeamList /> },
      { path: 'draw', element: <DrawDay /> },
      { path: 'standings', element: <MainStandings /> },
      { path: 'predictions', element: <PredictionStandings /> },
      { path: 'players', element: <PlayersAndTeams /> },
      { path: 'match/:matchId', element: <PredictionRoute /> },
      { path: 'player/:userId', element: <PlayerPage /> },
      { path: 'chat', element: <Chat /> },
    ],
  },
  {
    path: '/invite',
    element: (
      <AuthGuard>
        <OnboardingGuard>
          <Invite />
        </OnboardingGuard>
      </AuthGuard>
    ),
  },
  {
    path: '/finished',
    element: (
      <AuthGuard>
        <OnboardingGuard>
          <FinishedMatches />
        </OnboardingGuard>
      </AuthGuard>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
  ]},
])
