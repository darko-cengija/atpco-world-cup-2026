// World Cup 26 — Account, Onboarding, Invite, PWA install canvas.
// Composes screens-login/profile/invites/pwa onto a Design Canvas of phone
// artboards. Each artboard wraps a Phone in a centered paper background so
// the canvas reads as a sheet of mockups.

const ART_W = 420;
const ART_H = 884;

function PhoneArt({ children }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#e6dcc5',
      backgroundImage: `radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
                        radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px)`,
      backgroundSize: '3px 3px, 7px 7px',
      backgroundPosition: '0 0, 1.5px 1.5px',
    }}>{children}</div>
  );
}

function App() {
  return (
    <DesignCanvas>
      {/* ─────────── INTRO ─────────── */}
      <DCSection
        id="intro"
        title="Account · Onboarding · Invites · Install"
        subtitle="Extending the Match Ticket direction into every entry-point surface. Every screen is 390×844 inside the standard phone shell; chrome (top bar / back header / bottom nav) and primitives (TKButton, TKInput, TKBanner, TKToast, TKAvatar) are inherited from the design system. No new tokens."
      >
        <DCArtboard id="legend" label="Legend · what's where" width={520} height={620}>
          <div className="board">
            <div className="board-eyebrow">★ Map · 00</div>
            <div className="board-title">In this canvas</div>
            <hr className="board-divider" />
            <div className="vstack" style={{ gap: 14 }}>
              {[
                ['01 · Login',            '4 screens — default, loading, error, iOS in-app browser (with copied confirmation).'],
                ['02 · Onboarding',       '2 screens — Set Up Profile with emoji picker, and the same with Google photo selected.'],
                ['03 · Profile',          '4 screens — saved (clean), dirty, saving, save-error.'],
                ['04 · Invites · admin',  '5 screens — loading, empty, populated list, validation error, post-action toast.'],
                ['05 · PWA install',      '6 screens — native prompt (idle + preparing), iOS Safari A2HS, iOS other (with copied), manual Chrome, full-screen "App Installed".'],
              ].map(([h, b]) => (
                <div key={h} style={{
                  padding: '10px 12px', borderRadius: 8,
                  border: `1px dashed ${C3.ink20}`,
                }}>
                  <div style={{
                    fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
                    letterSpacing: 1.6, textTransform: 'uppercase',
                    fontWeight: 600,
                  }}>{h}</div>
                  <div style={{
                    fontFamily: C3.sans, fontSize: 12.5, color: C3.ink70,
                    marginTop: 4, lineHeight: 1.5, textWrap: 'pretty',
                  }}>{b}</div>
                </div>
              ))}
              <div style={{
                marginTop: 4, padding: '10px 12px',
                background: 'rgba(168,57,43,0.08)',
                border: `1px solid rgba(168,57,43,0.25)`,
                borderRadius: 8,
                fontFamily: C3.sans, fontSize: 12, color: C3.ink, lineHeight: 1.45,
              }}>
                <b>System note · </b>Every paper sheet on this canvas should read like a stamped ticket. The Continue with Google button uses the brand-correct G inside an ink-fill primary — the only place colorful brand artwork lives in the system.
              </div>
            </div>
          </div>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 01 · LOGIN ─────────── */}
      <DCSection
        id="login"
        title="01 · Login"
        subtitle="Single-screen, no chrome. The same paper season-pass anchors every state. Continue with Google is the only primary action across the system. iOS in-app browser blocks Google sign-in entirely — the copy-link fallback is required."
      >
        <DCArtboard id="login-default" label="Default · invite-only sign-in" width={ART_W} height={ART_H}>
          <PhoneArt><LoginDefault /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="login-loading" label="Loading · returning from Google redirect" width={ART_W} height={ART_H}>
          <PhoneArt><LoginLoading /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="login-error" label="Error · sign-in failed (retry)" width={ART_W} height={ART_H}>
          <PhoneArt><LoginError /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="login-inapp" label="iOS in-app browser · open in Safari" width={ART_W} height={ART_H}>
          <PhoneArt><LoginInAppBrowser /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="login-inapp-copied" label="iOS in-app browser · link copied" width={ART_W} height={ART_H}>
          <PhoneArt><LoginInAppBrowser copied /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 02 · ONBOARDING ─────────── */}
      <DCSection
        id="onboarding"
        title="02 · Onboarding · Set Up Profile"
        subtitle="One-step welcome after first sign-in. Emoji-first picker, optional Google photo, app-name input. Saves into the existing Profile shell."
      >
        <DCArtboard id="onb-emoji" label="Emoji avatar selected (default)" width={ART_W} height={ART_H}>
          <PhoneArt><ProfileOnboarding /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="onb-google" label="Using Google photo" width={ART_W} height={ART_H}>
          <PhoneArt><ProfileOnboarding usingGooglePhoto /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 03 · PROFILE ─────────── */}
      <DCSection
        id="profile"
        title="03 · Your Profile"
        subtitle="Back-headed sub-page reachable from the avatar in the top bar. Save button cycles disabled → enabled → loading → success. Admin-only Invite Player link lives at the bottom of the page, above Sign Out."
      >
        <DCArtboard id="prof-saved" label="Saved · clean state (no changes)" width={ART_W} height={ART_H}>
          <PhoneArt><ProfileExisting state="saved" /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="prof-dirty" label="Dirty · changes pending" width={ART_W} height={ART_H}>
          <PhoneArt><ProfileExisting state="dirty" /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="prof-saving" label="Saving · request in flight" width={ART_W} height={ART_H}>
          <PhoneArt><ProfileExisting state="saving" /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="prof-success" label="Just saved · success flash" width={ART_W} height={ART_H}>
          <PhoneArt><ProfileExisting state="success" /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="prof-error" label="Save error · retry banner" width={ART_W} height={ART_H}>
          <PhoneArt><ProfileExisting state="error" /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 04 · INVITES ─────────── */}
      <DCSection
        id="invites"
        title="04 · Invites · admin only"
        subtitle="Reached via Invite Player on the Profile page. Add-invite card at top, paper roster below. Status pill differentiates Joined / Invite sent / Sent 2× / Waiting. Row actions: resend, copy install link, delete. Validation errors show inline; confirmations come back as a bottom-anchored toast."
      >
        <DCArtboard id="inv-loading" label="Loading roster" width={ART_W} height={ART_H}>
          <PhoneArt>
            <InvitesScreen formState="disabled" listState="loading" />
          </PhoneArt>
        </DCArtboard>
        <DCArtboard id="inv-empty" label="Empty · no one invited yet" width={ART_W} height={ART_H}>
          <PhoneArt>
            <InvitesScreen formState="disabled" listState="empty" />
          </PhoneArt>
        </DCArtboard>
        <DCArtboard id="inv-populated" label="Populated · mixed statuses" width={ART_W} height={ART_H}>
          <PhoneArt>
            <InvitesScreen
              formState="disabled"
              formAppName=""
              formEmail=""
              listState="populated"
            />
          </PhoneArt>
        </DCArtboard>
        <DCArtboard id="inv-error-invalid" label="Validation · bad email" width={ART_W} height={ART_H}>
          <PhoneArt>
            <InvitesScreen
              formAppName="Mira"
              formEmail="mira@@nope"
              formState="invalid"
              formError="Enter a valid email address."
              listState="populated"
            />
          </PhoneArt>
        </DCArtboard>
        <DCArtboard id="inv-error-dup" label="Validation · already invited" width={ART_W} height={ART_H}>
          <PhoneArt>
            <InvitesScreen
              formAppName="Ana"
              formEmail="ana@example.com"
              formState="invalid"
              formError="That address is already invited."
              listState="populated"
            />
          </PhoneArt>
        </DCArtboard>
        <DCArtboard id="inv-toast-sent" label="Toast · invite sent" width={ART_W} height={ART_H}>
          <PhoneArt>
            <InvitesScreen
              formState="disabled"
              listState="populated"
              toast={{ tone: 'success', text: 'Invite sent · pass issued to lena@example.com' }}
            />
          </PhoneArt>
        </DCArtboard>
        <DCArtboard id="inv-toast-copy" label="Toast · install link copied" width={ART_W} height={ART_H}>
          <PhoneArt>
            <InvitesScreen
              formState="disabled"
              listState="populated"
              toast={{ tone: 'notice', text: 'Link copied. Send it however you like.' }}
            />
          </PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 05 · PWA INSTALL ─────────── */}
      <DCSection
        id="pwa"
        title="05 · PWA install surfaces"
        subtitle="Bottom-anchored install sheets that ride over a dimmed home view, plus a full-screen post-install state. Triggered the first time the app is opened in a browser tab — and again after a user dismisses without installing for 7 days. Behaviour branches on platform: native beforeinstallprompt, iOS Safari, iOS other browser, fallback for Chrome that suppressed its prompt."
      >
        <DCArtboard id="pwa-native" label="Native prompt · install / later" width={ART_W} height={ART_H}>
          <PhoneArt><InstallNative stage="idle" /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="pwa-native-prep" label="Native prompt · preparing" width={ART_W} height={ART_H}>
          <PhoneArt><InstallNative stage="preparing" /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="pwa-ios-safari" label="iOS Safari · Add to Home Screen" width={ART_W} height={ART_H}>
          <PhoneArt><InstallIOSSafari /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="pwa-ios-other" label="iOS other browser · copy link" width={ART_W} height={ART_H}>
          <PhoneArt><InstallIOSOther /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="pwa-ios-other-copied" label="iOS other browser · link copied" width={ART_W} height={ART_H}>
          <PhoneArt><InstallIOSOther copied /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="pwa-manual-chrome" label="Manual · Chrome menu fallback" width={ART_W} height={ART_H}>
          <PhoneArt><InstallManualChrome /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="pwa-installed" label="Full-screen · app installed" width={ART_W} height={ART_H}>
          <PhoneArt><InstallSuccess /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── HANDOFF NOTES ─────────── */}
      <DCSection
        id="notes"
        title="Handoff notes"
        subtitle="Behaviour the developer needs that isn't visible in the static mockups."
      >
        <DCArtboard id="notes-card" label="Behaviours · gotchas · constants" width={680} height={780}>
          <div className="board">
            <div className="board-eyebrow">★ Handoff · 06</div>
            <div className="board-title">What to wire up</div>
            <hr className="board-divider" />
            <div className="vstack" style={{ gap: 14 }}>
              <NoteBlock heading="01 · Login flow"
                bullets={[
                  'Default → tap Continue with Google → redirect to Google. On return, render Loading state until the auth callback resolves.',
                  'Loading state holds for at least 400ms even on fast returns — prevents flash and gives the spinner a chance.',
                  'Detect iOS in-app browser via UA (Instagram, FBAN/FBAV, LinkedIn, Threads, Messenger). Show Open-in-Safari variant instead of the Continue button — never let Google sign-in fail here.',
                  'Copy link uses navigator.clipboard if available, falls back to a textarea selection. Show the green confirmation for 2.5s then return to the default copy state.',
                  'Error state renders any non-redirect failure. Surface the Google error code in the mono footnote only — never in the body copy.',
                ]} />
              <NoteBlock heading="02–03 · Profile"
                bullets={[
                  'First-time users land on the onboarding screen instead of the existing-profile shell. After Save & Continue, route to Home; not back to Login.',
                  'Name field: 2–24 characters, no leading/trailing whitespace, must be unique within the pool. Server returns 409 → show inline errorText.',
                  'Emoji picker has 12 options (shared.jsx · EMOJI_AVATARS). Add more sparingly; keep grid at multiples of 6 so it stays one or two rows tall.',
                  'Use Google photo toggles between emoji and the user\'s Google profile image. Picker visually mutes (greyed border, no selection) when photo is active.',
                  'Save Changes is disabled when the form is pristine. After success, flash the green success state for 1200ms then drop back to disabled "Saved".',
                ]} />
              <NoteBlock heading="04 · Invites"
                bullets={[
                  'Admin gate: only users with role=admin see the Invite Player button on Profile and the Invites screen itself. Non-admins hitting the URL get a 404 paper card.',
                  'Email validation: client-side regex + server-side dedupe. Both errors render inline in the email field. Invite button stays disabled until both inputs are valid.',
                  'Resend resets the row status to "Sent 2×" (or 3×, 4×… in mono). After 3 resends the resend icon disables and shows a Waiting for invite pill.',
                  'Copy install link uses the same clipboard helper as Login. Toast surfaces below the bottom nav with a 3s auto-dismiss.',
                  'Toasts: success = green, notice = ink, error = stamp. Only one toast at a time — new toast replaces the old, not stacks.',
                ]} />
              <NoteBlock heading="05 · PWA install"
                bullets={[
                  'Frequency cap: show the sheet at most once per 7 days, and never on the first session (let them see the app first). Persist dismissal in localStorage.',
                  'Platform branching: window.matchMedia("(display-mode: standalone)") suppresses everything. Otherwise — Android Chrome with deferredPrompt → native variant; iOS Safari → A2HS; iOS other → copy link; everything else → manual Chrome.',
                  'Preparing / opening states are usually 1–3 frames long. Don\'t skip them — they signal the install request is real.',
                  'The full-screen "App Installed" state appears only on the original tab after the user confirms the installer. Continue in browser dismisses it without re-prompting for 30 days.',
                  'No marketing copy. No emoji. The benefits list stays three lines max.',
                ]} />
            </div>
          </div>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

function NoteBlock({ heading, bullets }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 8,
      border: `1px dashed ${C3.ink20}`,
    }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
        letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 600,
        marginBottom: 8,
      }}>★ {heading}</div>
      <ul style={{ margin: 0, paddingLeft: 18,
        fontFamily: C3.sans, fontSize: 12.5, color: C3.ink, lineHeight: 1.55 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ marginBottom: 4, textWrap: 'pretty' }}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
