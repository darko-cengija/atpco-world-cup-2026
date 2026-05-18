import { useState } from 'react'
import { AlertCircle, Bell, CheckCircle2, Loader2, X } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'


const DISMISS_KEY = 'push_prompt_dismissed_at'

function hasCompletedPrompt() {
  return localStorage.getItem(DISMISS_KEY) !== null
}

export function PushPrompt() {
  const {
    permission,
    registration,
    requestAndRegister,
    registerCurrentDevice,
  } = usePushNotifications()
  const [dismissed, setDismissed] = useState(hasCompletedPrompt)
  const [showReady, setShowReady] = useState(false)

  const showPrompt = permission === 'default' && !dismissed
  const showRegistrationStatus =
    registration.status === 'registering'
    || registration.status === 'error'
    || registration.status === 'unsupported'
    || registration.status === 'permission-denied'
    || registration.status === 'registered'
  const showStatus =
    (!dismissed && showRegistrationStatus)
    || showReady

  if (!showPrompt && !showStatus) return null

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setDismissed(true)
    setShowReady(false)
  }

  async function enable() {
    const result = await requestAndRegister()
    if (result) setShowReady(true)
  }

  async function retry() {
    const result = await registerCurrentDevice()
    if (result) setShowReady(true)
  }

  const isBusy = registration.status === 'registering'
  const isReady = registration.status === 'registered'
  const isError =
    registration.status === 'error'
    || registration.status === 'unsupported'
    || registration.status === 'permission-denied'
  const title = isError ? 'Notifications need attention' : isReady ? 'Notifications enabled' : 'Notifications'
  const body = isError
    ? registration.error ?? 'Push notification registration failed.'
    : isReady
      ? `Registered ${registration.tokenCount ?? 1} device token${registration.tokenPreview ? ` · ${registration.tokenPreview}` : ''}`
      : 'Match reminders and chat alerts.'

  return (
    <div className="mx-3 mb-3 ticket-card p-3 flex items-start gap-3">
      <div className="w-8 h-8 rounded border border-brand-border bg-brand-card flex items-center justify-center shrink-0 mt-0.5">
        {isBusy ? (
          <Loader2 size={16} className="animate-spin text-brand-stamp" />
        ) : isReady ? (
          <CheckCircle2 size={16} className="text-emerald-700" />
        ) : isError ? (
          <AlertCircle size={16} className="text-brand-stamp" />
        ) : (
          <Bell size={16} className="text-brand-stamp" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-lg leading-none text-brand-ink">{title}</p>
        <p className="text-xs text-brand-muted mt-0.5">{body}</p>
        <div className="flex gap-2 mt-2.5">
          {showPrompt && (
            <button
              onClick={enable}
              disabled={isBusy}
              className="ticket-button text-brand-bg bg-brand-accent rounded px-3 py-1.5 active:opacity-75 transition-opacity disabled:opacity-60"
            >
              {isBusy ? 'Enabling...' : 'Enable'}
            </button>
          )}
          {isError && permission === 'granted' && (
            <button
              onClick={retry}
              disabled={isBusy}
              className="ticket-button text-brand-bg bg-brand-accent rounded px-3 py-1.5 active:opacity-75 transition-opacity disabled:opacity-60"
            >
              Retry
            </button>
          )}
          <button onClick={dismiss} className="ticket-button text-brand-muted px-3 py-1.5">
            {showPrompt ? 'No thanks' : 'Done'}
          </button>
        </div>
      </div>
      <button onClick={dismiss} className="text-brand-faint hover:text-brand-ink p-1 -mr-1 -mt-1 transition-colors">
        <X size={14} />
      </button>
    </div>
  )
}
