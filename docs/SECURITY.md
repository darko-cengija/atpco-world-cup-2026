# Security Notes

## Firebase App Check

Firebase App Check can be registered for the USA web app using reCAPTCHA Enterprise.

Provider:
- reCAPTCHA Enterprise

Production domains:
- atpco-world-cup-2026.web.app
- atpco-world-cup-2026.firebaseapp.com

Frontend config:
- `VITE_FIREBASE_APPCHECK_SITE_KEY`
- The site key is client-facing and is not a secret.
- Do not commit `.env` files or App Check debug tokens.

Suggested rollout state:
- App Check is initialized in the frontend when `VITE_FIREBASE_APPCHECK_SITE_KEY` is set.
- Start Cloud Firestore in Monitoring mode.
- Keep enforcement disabled until metrics stay clean for real users.

Before enforcing:
- Verify App Check -> APIs shows expected traffic.
- Confirm Cloud Firestore remains near 100% verified.
- Check for unverified requests from real users and devices.
- Review the Cloud Functions-specific enforcement path before enforcing Functions.
