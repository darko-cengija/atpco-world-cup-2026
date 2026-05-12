# CLAUDE.md

This is the separate USA World Cup 26 app, based on the stable CRO app but owned as its own repo, Firebase project, deployment, and work stream.

## Boundaries

- Do not edit, deploy, reset, format, or commit anything in the CRO source repo.
- This repo should target the USA Firebase project only.
- Use `us-central1` for Firebase Functions.
- Do not commit `.env`, Firebase secrets, API keys, or Resend/API-Football credentials.

## Commands

- `npm install`
- `npm run build`
- `npm --prefix functions install`
- `npm --prefix functions run build`

## Setup Notes

See `docs/USA_FIREBASE_SETUP.md` for Firebase setup, secrets, seeding, and first iPhone test flow.
