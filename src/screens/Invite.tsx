import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, Send, Trash2, UserPlus, CheckCircle2, Clock } from 'lucide-react'
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { db, functions } from '@/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { getInstallUrl } from '@/lib/pwa'

interface Invite {
  id: string
  email: string
  name: string
  joined: boolean
  lastStatus?: string
  attempts?: number
}

export default function Invite() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [invites, setInvites] = useState<Invite[]>([])
  const [emailInput, setEmailInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState(false)
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const toastTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (user?.role !== 'admin') {
      navigate('/', { replace: true })
      return
    }
    load()
  }, [navigate, user?.role])

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current)
    }
  }, [])

  async function load() {
    setLoading(true)

    const [allowedSnap, usersSnap, logsSnap] = await Promise.all([
      getDocs(collection(db, 'allowedUsers')),
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'inviteLogs')),
    ])

    const joinedEmails = new Set(
      usersSnap.docs.map((d) => (d.data().email as string).toLowerCase()),
    )

    const logsByEmail = new Map(logsSnap.docs.map((d) => [d.id, d.data()]))

    const list: Invite[] = allowedSnap.docs.map((d) => {
      const data = d.data()
      const email = data.email as string
      const log = logsByEmail.get(d.id)

      return {
        id: d.id,
        email,
        name: (data.name as string | undefined) ?? '',
        joined: joinedEmails.has(email.toLowerCase()),
        lastStatus: typeof log?.lastStatus === 'string' ? log.lastStatus : undefined,
        attempts: typeof log?.attempts === 'number' ? log.attempts : undefined,
      }
    })

    list.sort((a, b) => {
      if (a.joined !== b.joined) return a.joined ? -1 : 1
      return a.email.localeCompare(b.email)
    })

    setInvites(list)
    setLoading(false)
  }

  async function handleAdd() {
    const email = emailInput.trim().toLowerCase()
    const name = nameInput.trim()

    if (!email || !email.includes('@')) {
      setError('Enter a valid email address.')
      return
    }
    if (invites.some((i) => i.email.toLowerCase() === email)) {
      setError('That address is already invited.')
      return
    }

    try {
      setAdding(true)
      setError(null)
      const sendInviteEmail = httpsCallable(functions, 'sendInviteEmail')
      await sendInviteEmail({ email, name })
      showToast('Invite sent.')
      setEmailInput('')
      setNameInput('')
      await load()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`Email was not sent: ${message}`)
    } finally {
      setAdding(false)
    }
  }

  async function handleResend(invite: Invite) {
    try {
      setBusyInviteId(invite.id)
      setError(null)
      const sendInviteEmail = httpsCallable(functions, 'sendInviteEmail')
      await sendInviteEmail({ email: invite.email, name: invite.name })
      showToast('Invite resent.')
      await load()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(`Email was not sent: ${message}`)
    } finally {
      setBusyInviteId(null)
    }
  }

  async function handleRemove(id: string) {
    await deleteDoc(doc(db, 'allowedUsers', id))
    setInvites((prev) => prev.filter((i) => i.id !== id))
  }

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(getInstallUrl())
    } catch {
      // The visible toast still tells the admin which recovery path to use.
    }
    showToast('Link copied.')
  }

  function showToast(message: string) {
    setToast(message)
    if (toastTimerRef.current !== null) window.clearTimeout(toastTimerRef.current)
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2200)
  }

  function inviteStatus(invite: Invite) {
    if (invite.joined) return 'Joined'
    if (invite.lastStatus === 'sent') return invite.attempts && invite.attempts > 1 ? `Sent ${invite.attempts}x` : 'Invite sent'
    if (invite.lastStatus) return invite.lastStatus
    return 'Waiting for invite'
  }

  if (user?.role !== 'admin') return null

  return (
    <div className="min-h-screen bg-brand-bg">
      {toast && (
        <div role="status" aria-live="polite" className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-md bg-brand-ink px-4 py-2 text-sm font-semibold text-brand-ticket shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-8 pb-4">
        <button onClick={() => navigate(-1)} className="grid h-9 w-9 place-items-center rounded-lg border border-brand-border text-brand-ink hover:border-brand-ink transition-colors">
          <ArrowLeft size={22} />
        </button>
        <div>
          <p className="ticket-meta">Admin</p>
          <h1 className="font-display text-xl leading-none text-brand-ink">Invites</h1>
        </div>
      </div>

      <div className="px-4 space-y-6 pb-10">
        {/* Add invite */}
        <div className="ticket-card p-4 space-y-3">
          <p className="ticket-meta">Invite player</p>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => { setNameInput(e.target.value); setError(null) }}
            placeholder="App name (e.g. Che)"
            className="w-full bg-brand-card border border-brand-border rounded px-4 py-3 text-brand-ink placeholder-brand-faint focus:outline-none focus:border-brand-ink transition-colors text-sm"
          />
          <div className="flex gap-2">
            <input
              type="email"
              value={emailInput}
              onChange={(e) => { setEmailInput(e.target.value); setError(null) }}
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
              placeholder="ime@gmail.com"
              className="flex-1 bg-brand-card border border-brand-border rounded px-4 py-3 text-brand-ink placeholder-brand-faint focus:outline-none focus:border-brand-ink transition-colors text-sm"
            />
            <button
              onClick={handleAdd}
              disabled={adding || !emailInput.trim()}
              className="ticket-button flex items-center gap-2 px-4 py-3 bg-brand-accent text-brand-bg rounded hover:bg-brand-accent-hover transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              <UserPlus size={16} />
              Invite
            </button>
          </div>
          {error && <p className="text-xs text-brand-stamp">{error}</p>}
        </div>

        {/* Invite list */}
        <div>
          <p className="ticket-meta mb-3">
            Invited ({invites.length})
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : invites.length === 0 ? (
            <p className="text-brand-faint text-sm text-center py-8">No one has been invited yet.</p>
          ) : (
            <div className="space-y-2">
              {invites.map((invite) => (
                <div
                  key={invite.id}
                  className="ticket-card flex items-center justify-between px-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {invite.joined ? (
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                    ) : (
                      <Clock size={16} className="text-gray-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      {invite.name ? (
                        <p className="font-display text-base leading-none text-brand-ink truncate">{invite.name}</p>
                      ) : null}
                      <p className={`text-xs truncate ${invite.name ? 'text-brand-faint' : 'text-sm text-brand-ink'}`}>
                        {invite.email}
                      </p>
                      <p className={`text-xs ${invite.joined ? 'text-emerald-700' : 'text-brand-faint'}`}>
                        {inviteStatus(invite)}
                      </p>
                    </div>
                  </div>
                  <div className="ml-3 flex shrink-0 items-center gap-2">
                    {!invite.joined && (
                      <button
                        onClick={() => handleResend(invite)}
                        disabled={busyInviteId === invite.id}
                        title="Send again"
                        aria-label="Send invite again"
                        className="text-gray-500 transition-colors hover:text-brand-accent disabled:opacity-50"
                      >
                        <Send size={16} />
                      </button>
                    )}
                    <button
                      onClick={handleCopyLink}
                      title="Copy install link"
                      aria-label="Copy install link"
                      className="text-gray-500 transition-colors hover:text-brand-accent"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => handleRemove(invite.id)}
                      className="text-gray-600 transition-colors hover:text-red-400"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
