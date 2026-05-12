import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { initializeApp } from 'firebase/app'
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw'
import { APP_NAME, firebaseConfig } from './firebaseConfig'

declare const self: ServiceWorkerGlobalScope & { __WB_MANIFEST: Array<{ url: string; revision: string | null }> }

precacheAndRoute(self.__WB_MANIFEST)
cleanupOutdatedCaches()

// Take control immediately on install/activate — no waiting for old tabs to close
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))

const firebaseApp = initializeApp(firebaseConfig)

const messaging = getMessaging(firebaseApp)

onBackgroundMessage(messaging, (payload) => {
  const title = payload.data?.title ?? APP_NAME
  const body = payload.data?.body ?? ''
  const type = payload.data?.type

  self.registration.showNotification(title, {
    body,
    icon: '/icon-192.png',
    badge: '/badge-icon.png',
    tag: type === 'chat' ? `chat-${Date.now()}` : `match-${payload.data?.matchId ?? ''}`,
    data: { url: payload.data?.url ?? '/' },
  })

  if (type === 'chat') {
    const count = parseInt(payload.data?.unreadCount ?? '1', 10)
    if (!isNaN(count) && count > 0) {
      self.registration.setAppBadge?.(count)
    }
  }
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const path = (event.notification.data as { url?: string })?.url ?? '/'
  const absUrl = new URL(path, self.location.origin).href
  event.waitUntil(self.clients.openWindow(absUrl))
})
