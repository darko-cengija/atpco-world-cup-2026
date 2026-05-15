import { useState } from 'react'
import { Bell, X } from 'lucide-react'
import { usePushNotifications } from '@/hooks/usePushNotifications'


const DISMISS_KEY = 'push_prompt_dismissed_at'
const DISMISS_TTL = 7 * 24 * 60 * 60 * 1000

export function PushPrompt() {
  const { permission, requestAndRegister } = usePushNotifications()
  const [dismissed, setDismissed] = useState(() => {
    const ts = localStorage.getItem(DISMISS_KEY)
    return !!ts && Date.now() - Number(ts) < DISMISS_TTL
  })

  if (permission !== 'default' || dismissed) return null

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    setDismissed(true)
  }

  async function enable() {
    await requestAndRegister()
  }

  return (
    <div className="mx-3 mb-3 ticket-card p-3 flex items-start gap-3">
      <div className="w-8 h-8 rounded border border-brand-border bg-brand-card flex items-center justify-center shrink-0 mt-0.5">
        <Bell size={16} className="text-brand-stamp" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display text-lg leading-none text-brand-ink">Chat notifications</p>
        <p className="text-xs text-brand-muted mt-0.5">Let me know when someone sends a message.</p>
        <div className="flex gap-2 mt-2.5">
          <button
            onClick={enable}
            className="ticket-button text-brand-bg bg-brand-accent rounded px-3 py-1.5 active:opacity-75 transition-opacity"
          >
            Enable
          </button>
          <button onClick={dismiss} className="ticket-button text-brand-muted px-3 py-1.5">
            No thanks
          </button>
        </div>
      </div>
      <button onClick={dismiss} className="text-brand-faint hover:text-brand-ink p-1 -mr-1 -mt-1 transition-colors">
        <X size={14} />
      </button>
    </div>
  )
}
