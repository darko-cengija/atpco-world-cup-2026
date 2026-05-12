# USA Firebase Setup

Working project id used by the repo defaults: `atpco-world-cup-2026`.

1. Create a new Firebase project, separate from CRO.
2. Add a Web app and copy its config into `.env.local` using `.env.example`.
3. Enable Hosting, Firestore, Authentication with Google, Cloud Functions, and Cloud Messaging.
4. In Authentication authorized domains, include the default Hosting domains and any custom domain you add later.
5. Keep Functions in `us-central1`.
6. Configure Functions params/secrets:

```sh
firebase functions:secrets:set API_FOOTBALL_KEY --project atpco-world-cup-2026
firebase functions:secrets:set RESEND_API_KEY --project atpco-world-cup-2026
```

Set these v2 params when the Firebase CLI prompts during deploy:

```text
APP_URL=https://atpco-world-cup-2026.web.app
RESEND_FROM=World Cup 26 <your Resend sender>
ADMIN_EMAILS=darko.cengija.dc@gmail.com
```

7. Generate a Web Push certificate in Cloud Messaging and put the public VAPID key in `.env.local` as `VITE_FCM_VAPID_KEY`.
8. If using App Check, create a reCAPTCHA Enterprise key and set `VITE_FIREBASE_APPCHECK_SITE_KEY`.
9. Deploy rules first:

```sh
firebase deploy --only firestore:rules --project atpco-world-cup-2026
```

10. Seed data:

```sh
FIREBASE_PROJECT_ID=atpco-world-cup-2026 node scripts/seed-world-cup-teams.cjs --confirm
FIREBASE_PROJECT_ID=atpco-world-cup-2026 node scripts/seed-world-cup-matches.cjs --confirm
```

11. Build and deploy only the USA app:

```sh
npm run build
npm --prefix functions run build
firebase deploy --project atpco-world-cup-2026
```

12. First sign-in:

`darko.cengija.dc@gmail.com` is the bootstrap admin email. Sign in with Google, finish onboarding, then use the invite screen for everyone else.

13. US iPhone smoke test:

- Open the invite link in Safari.
- Add to Home Screen.
- Launch from the Home Screen icon.
- Sign in with the invited Google account.
- Complete profile setup.
- Enable push notifications from the chat prompt.
- Send a chat message and verify another user receives a notification.
