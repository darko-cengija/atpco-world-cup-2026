import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Copy, Download, MoreVertical, RotateCw, Share, X } from 'lucide-react'
import {
  getInstallPlatform,
  getInstallUrl,
  isMobileLike,
  isStandalone,
  stripInstallQueryParam,
  useBeforeInstallPrompt,
  type InstallPlatform,
} from '@/lib/pwa'

const DISMISS_KEY = 'pwa_install_prompt_dismissed_at'
const INVITE_INSTALL_KEY = 'pwa_install_requested_from_link'
const DISMISS_TTL = 14 * 24 * 60 * 60 * 1000
const installRequestedOnPageLoad =
  typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('install') === '1'

type PromptState = 'hidden' | 'install' | 'ios-safari' | 'ios-other' | 'manual'

function recentlyDismissed() {
  const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0)
  return dismissedAt > 0 && Date.now() - dismissedAt < DISMISS_TTL
}

function linkRequestedInstall() {
  if (typeof window === 'undefined') return false
  const params = new URLSearchParams(window.location.search)
  return installRequestedOnPageLoad || params.get('install') === '1'
}

function installRequestIsActive() {
  return linkRequestedInstall() || sessionStorage.getItem(INVITE_INSTALL_KEY) === '1'
}

function visibleStateForPlatform(platform: InstallPlatform): PromptState {
  if (platform === 'ios-safari') return 'ios-safari'
  if (platform === 'ios-other') return 'ios-other'
  return 'install'
}

export function InstallAppPrompt() {
  const { canPrompt, triggerInstall } = useBeforeInstallPrompt()
  const [visible, setVisible] = useState<PromptState>('hidden')
  const [installed, setInstalled] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [copied, setCopied] = useState(false)
  const copyTimerRef = useRef<number | null>(null)
  const platform = useMemo(() => getInstallPlatform(), [])

  useEffect(() => {
    const openedFromInstallLink = linkRequestedInstall()

    if (openedFromInstallLink) {
      sessionStorage.setItem(INVITE_INSTALL_KEY, '1')
    }
    stripInstallQueryParam()

    if (isStandalone()) {
      sessionStorage.removeItem(INVITE_INSTALL_KEY)
      return
    }

    if (!installRequestIsActive()) return

    const nextVisible = visibleStateForPlatform(platform)
    if (nextVisible !== 'install' || isMobileLike()) {
      setVisible(nextVisible)
    }
  }, [platform])

  useEffect(() => {
    if (isStandalone()) return

    const hideAfterInstall = () => {
      sessionStorage.removeItem(INVITE_INSTALL_KEY)
      localStorage.removeItem(DISMISS_KEY)
      setVisible('hidden')
      setInstalled(true)
    }

    window.addEventListener('appinstalled', hideAfterInstall)
    return () => window.removeEventListener('appinstalled', hideAfterInstall)
  }, [])

  useEffect(() => {
    if (isStandalone() || platform !== 'native-prompt' || !canPrompt) return

    const shouldShow = isMobileLike() && (!recentlyDismissed() || installRequestIsActive())
    if (shouldShow) setVisible('install')
  }, [canPrompt, platform])

  useEffect(() => {
    if (visible !== 'install' || canPrompt) return

    const timer = window.setTimeout(() => setVisible('manual'), 5000)
    return () => window.clearTimeout(timer)
  }, [canPrompt, visible])

  useEffect(() => {
    return () => {
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(DISMISS_KEY, String(Date.now()))
    sessionStorage.removeItem(INVITE_INSTALL_KEY)
    setVisible('hidden')
  }

  async function install() {
    if (!canPrompt || installing) return

    setInstalling(true)
    try {
      const outcome = await triggerInstall()
      if (outcome === 'dismissed') {
        localStorage.setItem(DISMISS_KEY, String(Date.now()))
      } else {
        localStorage.removeItem(DISMISS_KEY)
      }

      sessionStorage.removeItem(INVITE_INSTALL_KEY)
      setVisible(outcome === 'unavailable' ? 'manual' : 'hidden')
    } finally {
      setInstalling(false)
    }
  }

  async function copyInstallLink() {
    try {
      await navigator.clipboard.writeText(getInstallUrl())
    } catch {
      // Some iOS browsers reject clipboard writes; the visible instruction still
      // gives the user the manual Safari path.
    }

    setCopied(true)
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current)
    copyTimerRef.current = window.setTimeout(() => setCopied(false), 2400)
  }

  function reloadForInstallPrompt() {
    window.location.reload()
  }

  if (installed) {
    return (
      <div className="fixed inset-0 z-50 mx-auto flex max-w-[430px] flex-col items-center justify-center bg-brand-bg px-6 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded border border-emerald-700/30 bg-emerald-700/10">
          <CheckCircle2 size={34} className="text-emerald-700" />
        </div>
        <h2 className="mt-5 font-display text-3xl leading-none text-brand-ink">App Installed</h2>
        <p className="mt-3 text-sm leading-6 text-brand-muted">
          Close this tab and open the Argy-Bargy icon from your Home Screen.
        </p>
        <button
          onClick={() => setInstalled(false)}
          className="ticket-button mt-6 rounded px-4 py-2 text-brand-faint"
        >
          Continue in browser
        </button>
      </div>
    )
  }

  if (visible === 'hidden') return null

  const isIosSafari = visible === 'ios-safari'
  const isIosOther = visible === 'ios-other'
  const isManual = visible === 'manual'

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-[430px] px-3 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div className="ticket-card">
        <div className="flex items-start gap-3 p-4">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded border border-brand-border bg-brand-card">
            {isIosSafari || isIosOther ? (
              <Share size={20} className="text-brand-stamp" />
            ) : isManual ? (
              <MoreVertical size={20} className="text-brand-stamp" />
            ) : (
              <Download size={20} className="text-brand-stamp" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="font-display text-lg leading-none text-brand-ink">
              {isIosSafari ? 'Add to Home Screen' : isIosOther ? 'Open in Safari' : 'Install Argy-Bargy'}
            </p>

            {isIosSafari ? (
              <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-5 text-brand-muted">
                <li>Tap the Share icon in the toolbar.</li>
                <li>
                  Choose <span className="font-semibold text-brand-ink">Add to Home Screen</span>.
                </li>
                <li>
                  Confirm with <span className="font-semibold text-brand-ink">Add</span>.
                </li>
              </ol>
            ) : isIosOther ? (
              <p className="mt-1 text-xs leading-5 text-brand-muted">
                You can install the app only from Safari. Copy the link, open Safari, and paste it in the address bar.
              </p>
            ) : isManual ? (
              <p className="mt-1 text-xs leading-5 text-brand-muted">
                Chrome did not show the automatic install prompt. Tap the menu in the top right, then Install app.
              </p>
            ) : (
              <p className="mt-1 text-xs leading-5 text-brand-muted">
                {canPrompt
                  ? 'Add the app to your Home Screen and open it with one tap.'
                  : 'Chrome is preparing the install prompt. The button will activate shortly.'}
              </p>
            )}

            {visible === 'install' && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={install}
                  disabled={!canPrompt || installing}
                  className="ticket-button rounded bg-brand-accent px-3 py-2 text-brand-bg transition-opacity active:opacity-75 disabled:opacity-60"
                >
                  {installing ? 'Opening...' : canPrompt ? 'Install' : 'Preparing...'}
                </button>
                <button onClick={dismiss} className="ticket-button rounded px-3 py-2 text-brand-muted">
                  Later
                </button>
              </div>
            )}

            {isManual && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={reloadForInstallPrompt}
                  className="ticket-button inline-flex items-center gap-1.5 rounded bg-brand-accent px-3 py-2 text-brand-bg transition-opacity active:opacity-75"
                >
                  <RotateCw size={13} />
                  Try again
                </button>
                <button onClick={dismiss} className="ticket-button rounded px-3 py-2 text-brand-muted">
                  Later
                </button>
              </div>
            )}

            {isIosSafari && (
              <button
                onClick={dismiss}
                className="ticket-button mt-3 rounded bg-brand-accent px-3 py-2 text-brand-bg transition-opacity active:opacity-75"
              >
                Got it
              </button>
            )}

            {isIosOther && (
              <>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={copyInstallLink}
                    className="ticket-button inline-flex items-center gap-1.5 rounded bg-brand-accent px-3 py-2 text-brand-bg transition-opacity active:opacity-75"
                  >
                    <Copy size={13} />
                    Copy link
                  </button>
                  <button onClick={dismiss} className="ticket-button rounded px-3 py-2 text-brand-muted">
                    Got it
                  </button>
                </div>
                {copied && (
                  <p role="status" aria-live="polite" className="mt-3 rounded border border-emerald-700/30 bg-emerald-700/10 px-3 py-2 text-xs font-semibold text-emerald-700">
                    Link copied. Open Safari and paste it.
                  </p>
                )}
              </>
            )}
          </div>

          <button onClick={dismiss} className="-mr-1 -mt-1 p-1 text-brand-faint transition-colors hover:text-brand-ink">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
