import { useState, useCallback, useEffect } from 'react'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { getToken } from 'firebase/messaging'
import { db, getAppMessaging } from '@/firebase'
import { useAuth } from '@/contexts/AuthContext'

const VAPID_KEY = import.meta.env.VITE_FCM_VAPID_KEY as string

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported'

function currentPermission(): PushPermission {
  if (!('Notification' in window) || !('serviceWorker' in navigator)) return 'unsupported'
  return Notification.permission as PushPermission
}

async function registerToken(userId: string) {
  try {
    const messaging = await getAppMessaging()
    if (!messaging) return
    const registration = await navigator.serviceWorker.ready
    const token = await getToken(messaging, { vapidKey: VAPID_KEY, serviceWorkerRegistration: registration })
    if (!token) return
    await setDoc(doc(db, 'pushTokens', userId), { [token]: serverTimestamp() }, { merge: true })
  } catch (err) {
    console.error('Push token registration failed', err)
  }
}

export function usePushNotifications() {
  const { user } = useAuth()
  const [permission, setPermission] = useState<PushPermission>(currentPermission)

  useEffect(() => {
    if (permission === 'granted' && user) {
      registerToken(user.uid)
    }
  }, [user, permission])

  const requestAndRegister = useCallback(async () => {
    if (!user || permission === 'unsupported' || permission === 'denied') return
    const perm = await Notification.requestPermission()
    setPermission(perm as PushPermission)
    if (perm !== 'granted') return
    await registerToken(user.uid)
  }, [user, permission])

  return { permission, requestAndRegister }
}
