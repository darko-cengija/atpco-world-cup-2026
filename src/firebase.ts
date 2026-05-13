import { initializeApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check'
import { browserLocalPersistence, getAuth, GoogleAuthProvider, setPersistence } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getFunctions } from 'firebase/functions'
import { getMessaging, isSupported } from 'firebase/messaging'
import { FIREBASE_FUNCTIONS_REGION, configuredAppCheckHosts, firebaseConfig } from '@/firebaseConfig'

export const app = initializeApp(firebaseConfig)

const appCheckSiteKey = import.meta.env.VITE_FIREBASE_APPCHECK_SITE_KEY as string | undefined
const appCheckDebugToken = import.meta.env.VITE_FIREBASE_APPCHECK_DEBUG_TOKEN as string | undefined
const appCheckProductionHosts = configuredAppCheckHosts()
const isAppCheckHost =
  typeof window !== 'undefined' && appCheckProductionHosts.has(window.location.hostname.toLowerCase())

if (appCheckDebugToken && typeof self !== 'undefined') {
  const appCheckGlobal = self as typeof self & {
    FIREBASE_APPCHECK_DEBUG_TOKEN?: string | boolean
  }
  appCheckGlobal.FIREBASE_APPCHECK_DEBUG_TOKEN =
    appCheckDebugToken === 'true' ? true : appCheckDebugToken
}

export const appCheck =
  appCheckSiteKey && (isAppCheckHost || appCheckDebugToken)
    ? initializeAppCheck(app, {
        provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true,
      })
    : null

export const auth = getAuth(app)
export const authPersistenceReady = setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.error('Failed to configure Firebase Auth persistence.', error)
})
export const db = getFirestore(app)
export const functions = getFunctions(app, FIREBASE_FUNCTIONS_REGION)
export const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({ prompt: 'select_account' })

export async function getAppMessaging() {
  const supported = await isSupported()
  if (!supported) return null
  return getMessaging(app)
}
