// LOGIN surfaces — Match Ticket system.
// Four states: default, loading (post-redirect), error, iOS in-app browser.
// Shared chrome: a centered "season pass" ticket header + CTA stack below.

// ─────────────────────────── Google G glyph (brand-correct)
function GoogleG({ size = 18 }) {
  return (
    <svg viewBox="0 0 18 18" width={size} height={size} aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.12-.84 2.07-1.79 2.71v2.25h2.9c1.7-1.56 2.69-3.87 2.69-6.6z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.81 5.96-2.19l-2.9-2.25c-.81.54-1.84.86-3.06.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.33A9 9 0 0 0 9 18z"/>
      <path fill="#FBBC05" d="M3.95 10.71A5.4 5.4 0 0 1 3.66 9c0-.59.1-1.17.29-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.04l2.99-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l2.99 2.33C4.66 5.16 6.65 3.58 9 3.58z"/>
    </svg>
  );
}

// Continue-with-Google button — ink fill, white disc holding the colorful G.
// Mirrors TKButton sizes/typography so it stays in the system.
function GoogleSignInButton({ state = 'idle', label = 'Continue with Google' }) {
  const base = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    gap: 10, padding: '13px 16px', height: 48, width: '100%',
    fontFamily: C3.mono, fontSize: 11, letterSpacing: 1.6,
    textTransform: 'uppercase', fontWeight: 600,
    background: C3.ink, color: C3.ticket,
    borderRadius: 4, border: 'none', cursor: 'pointer',
    transition: 'transform 120ms',
  };
  if (state === 'pressed') { base.background = '#0a2723'; base.transform = 'translateY(1px)'; }
  if (state === 'loading') { base.cursor = 'progress'; }
  if (state === 'disabled') { base.background = C3.ink20; base.color = C3.ink50; base.cursor = 'not-allowed'; }
  return (
    <button style={base}>
      {state === 'loading'
        ? ICONS.spinner(C3.ticket, 18)
        : (
          <span style={{
            width: 26, height: 26, borderRadius: '50%',
            background: C3.ticket, display: 'grid', placeItems: 'center',
            boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.05)',
          }}><GoogleG size={16} /></span>
        )
      }
      <span>{state === 'loading' ? 'Signing you in' : label}</span>
    </button>
  );
}

// Centered "season pass" ticket — the visual anchor on every login state.
function LoginPass({ stampLabel = 'ADMIT ONE', stampNote = 'PRIVATE POOL · 2026' }) {
  return (
    <div style={{
      width: '100%', maxWidth: 300, margin: '0 auto',
      ...paperTexture(C3.ticket),
      borderRadius: 14,
      boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 14px 36px rgba(50,30,10,0.16)',
      overflow: 'hidden', position: 'relative',
      fontFamily: C3.sans,
    }}>
      {/* Top strip */}
      <div style={{ padding: '22px 22px 18px', textAlign: 'center' }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
          letterSpacing: 2.4, textTransform: 'uppercase',
        }}>★ {stampLabel} ★</div>
        <div style={{ marginTop: 14, display: 'grid', placeItems: 'center' }}>
          <LogoMark size={64} />
        </div>
        <div style={{
          fontFamily: C3.display, fontSize: 32, color: C3.ink,
          lineHeight: 1, letterSpacing: -0.4, marginTop: 14,
        }}>World Cup 26</div>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.6, textTransform: 'uppercase', marginTop: 8,
        }}>Friends pool · season pass</div>
      </div>

      {/* Notches + tear */}
      <div style={{ position: 'relative', height: 0 }}>
        <div style={{ position: 'absolute', left: -10, top: -10,
          width: 20, height: 20, borderRadius: '50%', background: C3.paper }} />
        <div style={{ position: 'absolute', right: -10, top: -10,
          width: 20, height: 20, borderRadius: '50%', background: C3.paper }} />
        <div style={{ position: 'absolute', left: 14, right: 14, top: -1,
          borderTop: `1.5px dashed ${C3.ink20}` }} />
      </div>

      {/* Bottom stub */}
      <div style={{
        padding: '12px 18px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10,
      }}>
        <div>
          <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.2, textTransform: 'uppercase' }}>Holder</div>
          <div style={{ fontFamily: C3.display, fontSize: 14, color: C3.ink,
            lineHeight: 1, marginTop: 3 }}>To be issued</div>
        </div>
        <div style={{
          padding: '5px 8px', border: `1.5px solid ${C3.stamp}`,
          color: C3.stamp, transform: 'rotate(-3deg)',
          fontFamily: C3.display, fontSize: 11, letterSpacing: 1,
          textTransform: 'uppercase', borderRadius: 3,
        }}>{stampNote}</div>
      </div>
    </div>
  );
}

// Layout helper — the column below the ticket.
function LoginBody({ children }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column',
      ...paperTexture(C3.paper) }}>
      <div style={{ padding: '8px 24px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <LogoMark size={28} />
          <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.4, textTransform: 'uppercase' }}>Pool · admit one</div>
        </div>
      </div>
      <div style={{ flex: 1, padding: '20px 24px 28px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        {children}
      </div>
    </div>
  );
}

// Mono fine-print footer used on every login state.
function LoginFootnote({ children }) {
  return (
    <div style={{
      fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
      letterSpacing: 1.2, textTransform: 'uppercase',
      textAlign: 'center', lineHeight: 1.5,
    }}>{children}</div>
  );
}

// ─────────────────────────── 1) DEFAULT LOGIN
function LoginDefault() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <LoginBody>
        <div style={{ paddingTop: 28 }}>
          <LoginPass />
        </div>
        <div>
          <div style={{
            fontFamily: C3.sans, fontSize: 14, color: C3.ink70,
            textAlign: 'center', lineHeight: 1.55,
            textWrap: 'pretty', maxWidth: 280, margin: '0 auto 18px',
          }}>
            Invite-only. Sign in with your Google account to claim your pass.
          </div>
          <GoogleSignInButton />
          <div style={{ height: 18 }} />
          <LoginFootnote>
            By signing in you accept the pool rules.<br/>
            One Google account per holder.
          </LoginFootnote>
        </div>
      </LoginBody>
    </Phone>
  );
}

// ─────────────────────────── 2) LOADING / RETURN FROM GOOGLE
function LoginLoading() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <LoginBody>
        <div style={{ paddingTop: 28 }}>
          <LoginPass stampLabel="VALIDATING" stampNote="PROCESSING" />
        </div>
        <div>
          <div style={{
            padding: '18px 16px',
            border: `1.5px dashed ${C3.ink20}`, borderRadius: 8,
            background: C3.ticket,
            display: 'flex', alignItems: 'center', gap: 14,
            marginBottom: 18,
          }}>
            <div style={{ width: 28, height: 28, flexShrink: 0,
              display: 'grid', placeItems: 'center' }}>
              {ICONS.spinner(C3.ink, 28)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: C3.display, fontSize: 18,
                color: C3.ink, lineHeight: 1.1 }}>Finishing sign-in</div>
              <div style={{ fontFamily: C3.sans, fontSize: 12,
                color: C3.ink70, marginTop: 4, lineHeight: 1.45 }}>
                One moment while Google sends you back to the app.
              </div>
            </div>
          </div>
          <LoginFootnote>
            Don't refresh · this usually takes &lt; 5 seconds
          </LoginFootnote>
        </div>
      </LoginBody>
    </Phone>
  );
}

// ─────────────────────────── 3) ERROR
function LoginError() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <LoginBody>
        <div style={{ paddingTop: 28 }}>
          <LoginPass />
        </div>
        <div>
          <div style={{ marginBottom: 14 }}>
            <TKBanner
              tone="error"
              title="Sign-in didn't complete"
              body="Google returned an error. Check your connection and try again. If this keeps happening, ask the admin to re-issue your invite."
            />
          </div>
          <GoogleSignInButton label="Try again" />
          <div style={{ height: 12 }} />
          <TKButton variant="quiet" size="sm" block>Use a different Google account</TKButton>
          <div style={{ height: 14 }} />
          <LoginFootnote>Error code · auth/redirect_uri_mismatch</LoginFootnote>
        </div>
      </LoginBody>
    </Phone>
  );
}

// ─────────────────────────── 4) iOS IN-APP BROWSER
// Two phones: instructions + Copy link, then the copied confirmation.
function LoginInAppBrowser({ copied = false }) {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <LoginBody>
        <div style={{ paddingTop: 22 }}>
          <LoginPass stampLabel="OPEN IN SAFARI" stampNote="NOT THIS WINDOW" />
        </div>
        <div>
          <div style={{
            padding: '14px 14px',
            border: `1.5px solid ${C3.ink20}`, borderRadius: 8,
            background: C3.ticket, marginBottom: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 8 }}>
              <span style={{ width: 18, height: 18, color: C3.stamp }}>
                {ICONS.alert}
              </span>
              <div style={{ fontFamily: C3.mono, fontSize: 9,
                color: C3.stamp, letterSpacing: 1.4, textTransform: 'uppercase',
                fontWeight: 600 }}>Google blocks sign-in here</div>
            </div>
            <div style={{ fontFamily: C3.sans, fontSize: 12.5,
              color: C3.ink, lineHeight: 1.5, textWrap: 'pretty' }}>
              You opened World Cup 26 from inside another app (Messages,
              Instagram, etc). Google sign-in doesn't work in this browser.
              Open the link in Safari to continue.
            </div>
          </div>

          {copied ? (
            <React.Fragment>
              <div style={{
                padding: '12px 14px',
                background: '#1f6a4d', color: C3.ticket,
                borderRadius: 4, display: 'flex', alignItems: 'center',
                gap: 10, marginBottom: 10,
              }}>
                <span style={{ width: 18, height: 18, flexShrink: 0 }}>{ICONS.check}</span>
                <div style={{ fontFamily: C3.sans, fontSize: 13, lineHeight: 1.35 }}>
                  <div style={{ fontWeight: 600 }}>Link copied.</div>
                  <div style={{ opacity: 0.85, fontSize: 12 }}>Open Safari and paste it in the address bar.</div>
                </div>
              </div>
              <TKButton variant="secondary" size="md" block icon={ICONS.check}>Copied</TKButton>
            </React.Fragment>
          ) : (
            <TKButton variant="primary" size="md" block trailing="→" icon={ICONS.send}>
              Copy link
            </TKButton>
          )}

          <div style={{ height: 14 }} />
          <LoginFootnote>
            Tap · · · in this app's toolbar, then "Open in Safari"
          </LoginFootnote>
        </div>
      </LoginBody>
    </Phone>
  );
}

Object.assign(window, {
  GoogleG, GoogleSignInButton, LoginPass,
  LoginDefault, LoginLoading, LoginError, LoginInAppBrowser,
});
