import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
  User as FirebaseUser,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, authPersistenceReady, db, functions, googleProvider } from '@/firebase'
import { isStandalone } from '@/lib/pwa'
import type { AppUser } from '@/types'

interface AuthContextValue {
  user: AppUser | null
  firebaseUser: FirebaseUser | null
  loading: boolean
  authError: string | null
  clearAuthError: () => void
  signInWithGoogle: () => Promise<{ error?: string; redirecting?: boolean }>
  saveProfile: (profile: { displayName: string; avatarUrl: string | null }) => Promise<{ error?: string }>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null)
  const [user, setUser] = useState<AppUser | null>(null)
  const [authStateReady, setAuthStateReady] = useState(false)
  const [redirectReady, setRedirectReady] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const loading = !authStateReady || !redirectReady

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          setFirebaseUser(fbUser)
          const appUser = await syncCurrentUser(fbUser)
          setUser(withEffectiveAvatar(appUser, fbUser))
          setAuthError(null)
        } else {
          setFirebaseUser(null)
          setUser(null)
        }
      } catch (err) {
        console.error(err)
        setAuthError(authErrorMessage(err))
        setFirebaseUser(null)
        setUser(null)
        await firebaseSignOut(auth)
      } finally {
        setAuthStateReady(true)
      }
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    let cancelled = false

    async function finishRedirectSignIn() {
      try {
        await authPersistenceReady
        const result = await getRedirectResult(auth)
        if (!result) return

        const appUser = await syncCurrentUser(result.user)
        if (cancelled) return

        setFirebaseUser(result.user)
        setUser(withEffectiveAvatar(appUser, result.user))
        setAuthError(null)
      } catch (err) {
        console.error(err)
        if (!cancelled) {
          setAuthError(authErrorMessage(err))
          setFirebaseUser(null)
          setUser(null)
        }
        await firebaseSignOut(auth)
      } finally {
        if (!cancelled) setRedirectReady(true)
      }
    }

    finishRedirectSignIn()
    return () => {
      cancelled = true
    }
  }, [])

  async function signInWithGoogle() {
    try {
      setAuthError(null)

      if (shouldUseRedirectSignIn()) {
        await authPersistenceReady
        await signInWithRedirect(auth, googleProvider)
        return { redirecting: true }
      }

      await authPersistenceReady
      const result = await signInWithPopup(auth, googleProvider)
      const appUser = await syncCurrentUser(result.user)
      setFirebaseUser(result.user)
      setUser(withEffectiveAvatar(appUser, result.user))
      setAuthError(null)
      return {}
    } catch (err) {
      console.error(err)
      await firebaseSignOut(auth)
      const message = authErrorMessage(err)
      setAuthError(message)
      return { error: message }
    }
  }

  async function signOut() {
    setAuthError(null)
    await firebaseSignOut(auth)
  }

  async function saveProfile(profile: { displayName: string; avatarUrl: string | null }) {
    try {
      setAuthError(null)
      const callable = httpsCallable(functions, 'updateCurrentUserProfile')
      const result = await callable(profile)
      setUser(withEffectiveAvatar(result.data as AppUser, auth.currentUser))
      return {}
    } catch (err) {
      console.error(err)
      const message = profileErrorMessage(err)
      setAuthError(message)
      return { error: message }
    }
  }

  function clearAuthError() {
    setAuthError(null)
  }

  async function refreshUser() {
    if (!firebaseUser) return
    const snap = await getDoc(doc(db, 'users', firebaseUser.uid))
    if (snap.exists()) setUser(withEffectiveAvatar(snap.data() as AppUser, firebaseUser))
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        firebaseUser,
        loading,
        authError,
        clearAuthError,
        signInWithGoogle,
        saveProfile,
        signOut,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function syncCurrentUser(fbUser: FirebaseUser): Promise<AppUser> {
  const callable = httpsCallable(functions, 'syncCurrentUser')
  const result = await callable({
    displayName: fbUser.displayName,
    photoURL: fbUser.photoURL,
  })
  return result.data as AppUser
}

function withEffectiveAvatar(appUser: AppUser, fbUser: FirebaseUser | null): AppUser {
  const savedAvatar = typeof appUser.avatarUrl === 'string' && appUser.avatarUrl.trim()
    ? appUser.avatarUrl
    : null

  return {
    ...appUser,
    avatarUrl: savedAvatar ?? fbUser?.photoURL ?? null,
  }
}

function shouldUseRedirectSignIn() {
  if (typeof window === 'undefined') return false
  if (isStandalone()) return true
  return false
}

function authErrorMessage(err: unknown) {
  const code = getErrorCode(err)

  switch (code) {
    case 'auth/popup-blocked':
      return 'The browser blocked the Google popup. Try again or open the app in Safari.'
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Google sign-in was cancelled. Try again.'
    case 'auth/unauthorized-domain':
      return 'This domain is not allowed for Google sign-in yet. Ask Darko to check Firebase settings.'
    case 'auth/network-request-failed':
      return 'The network stalled during Google sign-in. Check your connection and try again.'
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled for this app.'
    case 'functions/permission-denied':
      return 'Sign in with the Google account that received the invite.'
    case 'functions/unauthenticated':
      return 'Google sign-in did not finish. Try again.'
    default:
      return 'Sign-in failed. Try again.'
  }
}

function profileErrorMessage(err: unknown) {
  const code = getErrorCode(err)

  switch (code) {
    case 'functions/invalid-argument':
      return 'Enter a name and try again.'
    case 'functions/permission-denied':
      return 'Only an invited Google account can save this profile.'
    case 'functions/unauthenticated':
      return 'Your session expired. Sign in again.'
    case 'functions/unavailable':
    case 'functions/deadline-exceeded':
      return 'Saving stalled on the network. Check your connection and try again.'
    default:
      return 'Profile was not saved. Try again.'
  }
}

function getErrorCode(err: unknown) {
  if (typeof err === 'object' && err && 'code' in err && typeof err.code === 'string') {
    return err.code
  }
  return null
}
