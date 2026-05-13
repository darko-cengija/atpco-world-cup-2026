import { useState, useEffect, useMemo, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Copy, Share } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { iosNeedsSafari } from '@/lib/pwa'

export default function Login() {
  const { user, signInWithGoogle, loading, authError, clearAuthError } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)
  const needsSafari = useMemo(() => iosNeedsSafari(), [])
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current)
    }
  }, [])

  async function copyAppLink() {
    try {
      await navigator.clipboard.writeText(window.location.origin + window.location.pathname + window.location.search)
    } catch {
      // Some iOS in-app browsers block clipboard writes — the visible URL still lets the user type it.
    }
    setCopied(true)
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current)
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 2400)
  }

  useEffect(() => {
    if (!loading && user) {
      navigate('/', { replace: true })
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (authError) setError(authError)
  }, [authError])

  async function handleGoogleSignIn() {
    setError(null)
    clearAuthError()
    setSigningIn(true)
    const result = await signInWithGoogle()
    if (result.error) {
      setError(result.error)
    }
    if (result.redirecting) {
      window.setTimeout(() => setSigningIn(false), 8000)
      return
    }
    setSigningIn(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-6 text-center">
        <div className="mb-5 w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
        <h1 className="text-lg font-bold text-white">Finishing sign-in</h1>
        <p className="mt-2 max-w-xs text-sm text-gray-400">One moment while Google sends you back to the app.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-6">
      {/* Logo / title */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-12 text-center"
      >
        <img src="/logo.png" alt="World Cup 26" className="w-44 mx-auto mb-5" />
        <h1 className="text-3xl font-bold text-white">World Cup 26</h1>
        <p className="text-gray-400 mt-2 text-sm">Invite-only. Sign in with your Google account.</p>
      </motion.div>

      {/* Sign in card */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="w-full max-w-sm"
      >
        {needsSafari ? (
          <div className="rounded-2xl border border-brand-border bg-brand-card p-5 shadow-2xl shadow-black/40">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-accent/15">
                <Share size={20} className="text-brand-accent" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-white">Open in Safari</p>
                <p className="mt-1 text-xs leading-5 text-gray-400">
                  Google sign-in does not work in this browser. Copy the link, open Safari, and paste it in the address bar.
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={copyAppLink}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-brand-accent px-3 py-2 text-xs font-bold text-brand-bg transition-opacity active:opacity-75"
                  >
                    <Copy size={13} />
                    Copy link
                  </button>
                </div>
                {copied && (
                  <p role="status" aria-live="polite" className="mt-3 rounded-lg bg-emerald-400/10 px-3 py-2 text-xs font-semibold text-emerald-300">
                    Link copied. Open Safari and paste it.
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <>
            <button
              onClick={handleGoogleSignIn}
              disabled={signingIn}
              className="w-full flex items-center justify-center gap-3 bg-white text-gray-900 font-semibold py-4 px-6 rounded-xl border border-white/20 hover:bg-gray-100 active:bg-gray-200 transition-colors disabled:opacity-60"
            >
              {/* Google logo */}
              <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
              {signingIn ? 'Signing in...' : 'Continue with Google'}
            </button>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-center text-sm text-red-400"
              >
                {error}
              </motion.p>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
