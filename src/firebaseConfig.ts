import type { FirebaseOptions } from 'firebase/app'

function requiredEnv(name: string): string {
  const value = import.meta.env[name] as string | undefined
  if (!value) {
    throw new Error(`Missing required Firebase env var: ${name}`)
  }
  return value
}

export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Argy-Bargy'
export const FIREBASE_FUNCTIONS_REGION =
  import.meta.env.VITE_FIREBASE_FUNCTIONS_REGION || 'us-central1'

function resolvedAuthDomain(projectId: string) {
  const configured = requiredEnv('VITE_FIREBASE_AUTH_DOMAIN')

  if (typeof window === 'undefined') return configured

  const host = window.location.hostname.toLowerCase()
  if (host === `${projectId}.web.app` || host === `${projectId}.firebaseapp.com`) {
    return host
  }

  return configured
}

const projectId = requiredEnv('VITE_FIREBASE_PROJECT_ID')

export const firebaseConfig: FirebaseOptions = {
  apiKey: requiredEnv('VITE_FIREBASE_API_KEY'),
  authDomain: resolvedAuthDomain(projectId),
  projectId,
  storageBucket: requiredEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: requiredEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: requiredEnv('VITE_FIREBASE_APP_ID'),
}

export function configuredAppCheckHosts(): Set<string> {
  const hosts = (import.meta.env.VITE_FIREBASE_APPCHECK_HOSTS as string | undefined) ?? ''
  return new Set(
    hosts
      .split(',')
      .map((host) => host.trim().toLowerCase())
      .filter(Boolean),
  )
}
