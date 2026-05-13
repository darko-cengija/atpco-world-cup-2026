import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogOut, Check, UserPlus, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'

import { AVATARS } from '@/lib/avatars'

export default function Profile() {
  const { user, firebaseUser, signOut, saveProfile, clearAuthError } = useAuth()
  const navigate = useNavigate()

  const [displayName, setDisplayName] = useState(user?.displayName ?? '')
  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(
    // Pre-select if avatar is already an emoji
    user?.avatarUrl && user.avatarUrl.startsWith('emoji:')
      ? user.avatarUrl.replace('emoji:', '')
      : null,
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isOnboarding = user && !user.onboardingComplete

  // What to show as the avatar preview
  const googlePhoto = firebaseUser?.photoURL ?? null
  const selectedAvatarUrl = selectedEmoji
    ? `emoji:${selectedEmoji}`
    : googlePhoto

  // Derive saved/dirty state from current inputs vs stored values
  const savedEmoji = user?.avatarUrl?.startsWith('emoji:')
    ? user.avatarUrl.replace('emoji:', '')
    : null
  const isDirty =
    displayName !== (user?.displayName ?? '')
    || selectedEmoji !== savedEmoji
    || (!selectedEmoji && googlePhoto !== null && user?.avatarUrl !== googlePhoto)
  const isSaved = !isDirty

  async function handleSave() {
    if (!user || !firebaseUser) return
    if (!displayName.trim()) return

    setSaving(true)
    setError(null)
    clearAuthError()

    // avatarUrl: emoji:⚽ for emoji picks, or Google photo URL, or null
    const avatarUrl = selectedAvatarUrl

    try {
      const result = await saveProfile({
        displayName: displayName.trim(),
        avatarUrl,
      })
      if (result.error) {
        setError(result.error)
        return
      }

      if (isOnboarding) {
        navigate('/')
      }
    } finally {
      setSaving(false)
    }
  }

  async function handleSignOut() {
    await signOut()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-brand-bg px-4 pt-12 pb-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-sm mx-auto"
      >
        {!isOnboarding && (
          <button onClick={() => navigate(-1)} className="text-gray-400 hover:text-white transition-colors mb-4">
            <ArrowLeft size={22} />
          </button>
        )}
        <h1 className="text-2xl font-bold text-white mb-1">
          {isOnboarding ? 'Set Up Profile' : 'Your Profile'}
        </h1>
        {isOnboarding && (
          <p className="text-gray-400 text-sm mb-6">
            This is how everyone will see you. You can change it later.
          </p>
        )}

        {/* Avatar preview */}
        <div className="flex flex-col items-center my-8">
          <div className="w-24 h-24 rounded-full bg-brand-card border-2 border-brand-border overflow-hidden flex items-center justify-center">
            {selectedEmoji ? (
              <span className="text-5xl">{selectedEmoji}</span>
            ) : selectedAvatarUrl ? (
              <img src={selectedAvatarUrl} alt="avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-4xl font-bold text-brand-accent">
                {displayName?.[0]?.toUpperCase() ?? '?'}
              </span>
            )}
          </div>
        </div>

        {/* Google photo button — shown only when an emoji is selected */}
        {googlePhoto && selectedEmoji && (
          <button
            onClick={() => setSelectedEmoji(null)}
            className="w-full py-4 rounded-xl font-semibold text-base border border-brand-border text-gray-300 hover:border-gray-500 hover:text-white transition-colors mb-4"
          >
            Use Google photo
          </button>
        )}

        {/* Emoji picker */}
        <div className="mb-6">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">
            {googlePhoto ? 'Or choose an avatar' : 'Choose an avatar'}
          </p>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                onClick={() =>
                  setSelectedEmoji((prev) => (prev === emoji ? null : emoji))
                }
                className={`text-2xl py-2 rounded-lg border transition-colors ${
                  selectedEmoji === emoji
                    ? 'border-brand-accent bg-brand-accent/10'
                    : 'border-brand-border bg-brand-card'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* Display name */}
        <div className="mb-8">
          <label className="block text-xs text-gray-500 uppercase tracking-wider mb-2">
            Your app name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Darko"
            maxLength={24}
            className="w-full bg-brand-card border border-brand-border rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-accent transition-colors"
          />
        </div>

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving || !displayName.trim() || (!isOnboarding && isSaved)}
          className={`w-full py-4 rounded-xl font-semibold text-base transition-colors ${
            !isOnboarding && isSaved
              ? 'bg-emerald-600 text-white'
              : 'bg-brand-accent text-brand-bg hover:bg-brand-accent-hover disabled:opacity-50'
          }`}
        >
          {saving ? (
            'Saving...'
          ) : !isOnboarding && isSaved ? (
            <span className="flex items-center justify-center gap-2">
              <Check size={18} /> Saved!
            </span>
          ) : isOnboarding ? (
            'Save and Continue'
          ) : (
            'Save Changes'
          )}
        </button>

        {error && (
          <p className="mt-4 text-center text-sm leading-5 text-red-400">
            {error}
          </p>
        )}

        {!isOnboarding && (
          <>
            {user?.role === 'admin' && (
              <button
                onClick={() => navigate('/invite')}
                className="w-full mt-4 py-3 text-sm text-gray-400 hover:text-white transition-colors flex items-center justify-center gap-2 border border-brand-border rounded-xl"
              >
                <UserPlus size={15} />
                Invite Player
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="w-full mt-4 py-3 text-sm text-gray-500 hover:text-red-400 transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
