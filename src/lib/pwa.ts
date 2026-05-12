import { useEffect, useRef, useState } from 'react'

export type InstallPlatform = 'native-prompt' | 'ios-safari' | 'ios-other'

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean
}

let earlyInstallPrompt: BeforeInstallPromptEvent | null = null
const promptListeners = new Set<(event: BeforeInstallPromptEvent) => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event: Event) => {
    event.preventDefault()
    earlyInstallPrompt = event as BeforeInstallPromptEvent
    promptListeners.forEach((listener) => listener(earlyInstallPrompt!))
  })
}

export function isStandalone() {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as NavigatorWithStandalone
  return window.matchMedia('(display-mode: standalone)').matches || nav.standalone === true
}

export function isMobileLike() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 820px)').matches
}

export function isIos() {
  if (typeof window === 'undefined') return false
  const nav = window.navigator as NavigatorWithStandalone
  return /iPad|iPhone|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1)
}

export function getInstallPlatform(): InstallPlatform {
  if (typeof navigator === 'undefined' || !isIos()) return 'native-prompt'

  const ua = navigator.userAgent
  const isKnownNonSafari =
    /CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|FBAN|FBAV|Instagram|Line|LinkedInApp|Twitter|GSA|Viber|WhatsApp|MicroMessenger|KAKAOTALK|Snapchat|TikTok|Pinterest|MessengerLiteForiOS/.test(ua)
  const isSafari = /Safari/.test(ua) && /Version\//.test(ua)

  return isKnownNonSafari || !isSafari ? 'ios-other' : 'ios-safari'
}

export function iosNeedsSafari() {
  return isIos() && getInstallPlatform() === 'ios-other'
}

export function getInstallUrl() {
  if (typeof window === 'undefined') return '/?install=1'
  return `${window.location.origin}/?install=1`
}

export function stripInstallQueryParam() {
  if (typeof window === 'undefined') return

  const params = new URLSearchParams(window.location.search)
  if (!params.has('install')) return

  params.delete('install')
  const next = params.toString()
  const nextUrl = `${window.location.pathname}${next ? `?${next}` : ''}${window.location.hash}`
  window.history.replaceState({}, '', nextUrl)
}

export function useBeforeInstallPrompt() {
  const promptRef = useRef<BeforeInstallPromptEvent | null>(earlyInstallPrompt)
  const [canPrompt, setCanPrompt] = useState(Boolean(earlyInstallPrompt))

  useEffect(() => {
    const onPrompt = (event: BeforeInstallPromptEvent) => {
      promptRef.current = event
      setCanPrompt(true)
    }
    const onInstalled = () => {
      promptRef.current = null
      earlyInstallPrompt = null
      setCanPrompt(false)
    }

    promptListeners.add(onPrompt)
    window.addEventListener('appinstalled', onInstalled)

    if (earlyInstallPrompt) onPrompt(earlyInstallPrompt)

    return () => {
      promptListeners.delete(onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const triggerInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    const event = promptRef.current
    if (!event) return 'unavailable'

    await event.prompt()
    const choice = await event.userChoice
    promptRef.current = null
    earlyInstallPrompt = null
    setCanPrompt(false)
    return choice.outcome
  }

  return { canPrompt, triggerInstall }
}
