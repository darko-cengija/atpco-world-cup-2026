import { useState, useCallback, useEffect, useRef } from 'react'
import { httpsCallable } from 'firebase/functions'
import { deleteInstallations, getInstallations } from 'firebase/installations'
import {
  deleteToken as deleteMessagingToken,
  getToken as getMessagingTokenFromFirebase,
  onMessage,
  type MessagePayload,
} from 'firebase/messaging'
import { app, functions, getAppMessaging } from '@/firebase'
import { useAuth } from '@/contexts/AuthContext'

const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY as string
const SERVICE_WORKER_READY_TIMEOUT_MS = 10000
const FIREBASE_DEFAULT_VAPID_KEY = 'BDOU99-h67HcA6JeFXHbSNMu7e2yNNu3RzoMj8TM4W88jITfq7ZmPvIM1Iv-4_l2LxQcYwhqby2xGpWwzjfAnG4'
const FIREBASE_PUSH_DATABASES = [
  'firebase-messaging-database',
  'firebase-installations-database',
  'fcm_token_details_db',
  'fcm_vapid_details_db',
]

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'
export type PushRegistrationStatus =
  | 'idle'
  | 'permission-needed'
  | 'permission-denied'
  | 'registering'
  | 'registered'
  | 'unsupported'
  | 'error'

interface RegisterPushTokenResponse {
  success: boolean
  tokenCount: number
  tokenPreview: string
}

interface SendTestPushResponse {
  tokenCount: number
  activeTokenCount: number
  staleTokenCount: number
  successCount: number
  failureCount: number
}

interface PushRegistrationState {
  status: PushRegistrationStatus
  error: string | null
  tokenCount: number | null
  tokenPreview: string | null
}

function currentPermission(): PushPermission {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported'
  return Notification.permission as PushPermission
}

function withTimeout<T>(promise: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => reject(new Error(message)), ms)
    promise.then(
      (value) => {
        window.clearTimeout(timer)
        resolve(value)
      },
      (error) => {
        window.clearTimeout(timer)
        reject(error)
      },
    )
  })
}

function errorMessage(err: unknown): string {
  const maybeError = err as { code?: string; message?: string } | null
  const code = maybeError?.code ?? ''
  const message = maybeError?.message ?? ''

  if (code.includes('unsupported-browser')) return 'This browser cannot create Firebase push tokens.'
  if (code.includes('permission-blocked')) return 'Notifications are blocked for this app.'
  if (code.includes('invalid-vapid-key')) return 'The Firebase web push key is not valid for this project.'
  if (code.includes('token-subscribe-failed')) return `Firebase could not register this device: ${message}`
  if (message) return message
  return 'Push notification registration failed.'
}

function isTokenSubscribeFailure(err: unknown): boolean {
  const maybeError = err as { code?: string; message?: string } | null
  const code = maybeError?.code ?? ''
  const message = maybeError?.message ?? ''
  return code.includes('token-subscribe-failed') || message.includes('token-subscribe-failed')
}

async function resetPushSubscription(registration: ServiceWorkerRegistration): Promise<boolean> {
  const subscription = await registration.pushManager.getSubscription()
  if (!subscription) return false
  return subscription.unsubscribe()
}

function deleteIndexedDb(name: string): Promise<boolean> {
  if (!('indexedDB' in window)) return Promise.resolve(false)

  return new Promise((resolve) => {
    let settled = false
    const timer = window.setTimeout(() => {
      if (settled) return
      settled = true
      resolve(false)
    }, 1500)

    const finish = (result: boolean) => {
      if (settled) return
      settled = true
      window.clearTimeout(timer)
      resolve(result)
    }

    const request = indexedDB.deleteDatabase(name)
    request.onsuccess = () => finish(true)
    request.onerror = () => finish(false)
    request.onblocked = () => finish(false)
  })
}

async function resetFirebasePushState(
  messaging: Awaited<ReturnType<typeof getAppMessaging>>,
  registration: ServiceWorkerRegistration,
) {
  await resetPushSubscription(registration)

  if (messaging) {
    try {
      await deleteMessagingToken(messaging)
    } catch (err) {
      console.warn('Unable to delete cached FCM token before retrying.', err)
    }
  }

  try {
    await deleteInstallations(getInstallations(app))
  } catch (err) {
    console.warn('Unable to delete Firebase Installation before retrying.', err)
  }

  await Promise.all(FIREBASE_PUSH_DATABASES.map((name) => deleteIndexedDb(name)))
}

async function getMessagingToken(
  messaging: Awaited<ReturnType<typeof getAppMessaging>>,
  registration: ServiceWorkerRegistration,
  vapidKey: string,
): Promise<string> {
  if (!messaging) throw new Error('Firebase Messaging is not supported on this device.')
  return getMessagingTokenFromFirebase(messaging, { vapidKey, serviceWorkerRegistration: registration })
}

async function registerToken(): Promise<RegisterPushTokenResponse> {
  if (!VAPID_KEY) throw new Error('Missing Firebase web push key.')

  const messaging = await getAppMessaging()
  if (!messaging) throw new Error('Firebase Messaging is not supported on this device.')

  const registration = await withTimeout(
    navigator.serviceWorker.ready,
    SERVICE_WORKER_READY_TIMEOUT_MS,
    'The app service worker was not ready in time.',
  )
  let token: string
  try {
    token = await getMessagingToken(messaging, registration, VAPID_KEY)
  } catch (err) {
    if (!isTokenSubscribeFailure(err)) throw err

    await resetFirebasePushState(messaging, registration)
    try {
      token = await getMessagingToken(messaging, registration, VAPID_KEY)
    } catch (retryErr) {
      if (!isTokenSubscribeFailure(retryErr)) throw retryErr

      await resetFirebasePushState(messaging, registration)
      console.warn('Configured FCM web push key failed; retrying with Firebase default VAPID key.', retryErr)
      token = await getMessagingToken(messaging, registration, FIREBASE_DEFAULT_VAPID_KEY)
    }
  }
  if (!token) throw new Error('Firebase did not return a push token.')

  const callable = httpsCallable<{ token: string }, RegisterPushTokenResponse>(functions, 'registerPushToken')
  const result = await callable({ token })
  if (!result.data.success) throw new Error('The server did not accept the push token.')

  return result.data
}

async function sendTestPush(): Promise<SendTestPushResponse> {
  const callable = httpsCallable<void, SendTestPushResponse>(functions, 'sendTestPushToCurrentUser')
  const result = await callable()
  return result.data
}

async function showForegroundNotification(payload: MessagePayload) {
  if (Notification.permission !== 'granted') return

  const registration = await withTimeout(
    navigator.serviceWorker.ready,
    SERVICE_WORKER_READY_TIMEOUT_MS,
    'The app service worker was not ready in time.',
  )
  const title = payload.data?.title ?? payload.notification?.title ?? 'Argy-Bargy'
  const body = payload.data?.body ?? payload.notification?.body ?? ''
  const type = payload.data?.type

  await registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/badge-icon.png',
    tag: type === 'chat' ? `chat-${Date.now()}` : `match-${payload.data?.matchId ?? payload.messageId ?? ''}`,
    data: { url: payload.data?.url ?? '/' },
  })
}

function registeredState(data: RegisterPushTokenResponse): PushRegistrationState {
  return {
    status: 'registered',
    error: null,
    tokenCount: data.tokenCount,
    tokenPreview: data.tokenPreview,
  }
}

export function usePushNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState<PushPermission>(currentPermission)
  const [registration, setRegistration] = useState<PushRegistrationState>({
    status:
      permission === 'unsupported'
        ? 'unsupported'
        : permission === 'denied'
          ? 'permission-denied'
          : 'idle',
    error: permission === 'denied' ? 'Notifications are blocked.' : null,
    tokenCount: null,
    tokenPreview: null,
  })
  const [testResult, setTestResult] = useState<SendTestPushResponse | null>(null)
  const [testError, setTestError] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const registeringRef = useRef(false)

  const registerCurrentDevice = useCallback(async () => {
    if (!user || registeringRef.current) return null
    if (permission === 'unsupported') {
      setRegistration((prev) => ({ ...prev, status: 'unsupported', error: 'Notifications are not supported here.' }))
      return null
    }
    if (permission === 'denied') {
      setRegistration((prev) => ({ ...prev, status: 'permission-denied', error: 'Notifications are blocked.' }))
      return null
    }
    if (Notification.permission !== 'granted') {
      setRegistration((prev) => ({ ...prev, status: 'permission-needed', error: null }))
      return null
    }

    registeringRef.current = true
    setRegistration((prev) => ({ ...prev, status: 'registering', error: null }))

    try {
      const result = await registerToken()
      const nextState = registeredState(result)
      setRegistration(nextState)
      return result
    } catch (err) {
      console.error('Push token registration failed', err)
      const message = errorMessage(err)
      setRegistration((prev) => ({
        ...prev,
        status: message.includes('not supported') ? 'unsupported' : 'error',
        error: message,
      }))
      return null
    } finally {
      registeringRef.current = false
    }
  }, [permission, user])

  useEffect(() => {
    if (permission === 'granted' && user && registration.status === 'idle') {
      void registerCurrentDevice()
    }
  }, [permission, registerCurrentDevice, registration.status, user])

  useEffect(() => {
    if (permission !== 'granted' || !user) return

    let unsubscribe: (() => void) | undefined
    let mounted = true

    getAppMessaging()
      .then((messaging) => {
        if (!mounted || !messaging) return
        unsubscribe = onMessage(messaging, (payload) => {
          void showForegroundNotification(payload).catch((err) => {
            console.warn('Unable to show foreground push notification.', err)
          })
        })
      })
      .catch((err) => {
        console.warn('Unable to listen for foreground push notifications.', err)
      })

    return () => {
      mounted = false
      unsubscribe?.()
    }
  }, [permission, user])

  const requestAndRegister = useCallback(async () => {
    if (!user || permission === 'unsupported' || permission === 'denied') return null
    const perm = await Notification.requestPermission()
    setPermission(perm as PushPermission)
    if (perm !== 'granted') {
      setRegistration((prev) => ({
        ...prev,
        status: perm === 'denied' ? 'permission-denied' : 'permission-needed',
        error: perm === 'denied' ? 'Notifications are blocked for this app.' : null,
      }))
      return null
    }
    return registerCurrentDevice()
  }, [permission, registerCurrentDevice, user])

  const sendTestNotification = useCallback(async () => {
    setTesting(true)
    setTestError(null)
    setTestResult(null)
    try {
      const result = await sendTestPush()
      setTestResult(result)
      setRegistration((prev) => (
        prev.status === 'registered'
          ? { ...prev, tokenCount: result.activeTokenCount }
          : prev
      ))
      return result
    } catch (err) {
      console.error('Test push failed', err)
      setTestError(errorMessage(err))
      return null
    } finally {
      setTesting(false)
    }
  }, [])

  return {
    permission,
    registration,
    requestAndRegister,
    registerCurrentDevice,
    sendTestNotification,
    testResult,
    testError,
    testing,
  }
}
