// PWA INSTALL surfaces — Match Ticket system.
// Bottom-anchored install prompts (5 variants) + full-screen "installed" state.

// ─────────────────────────── Dim background phone — shows the prompt
// floating over a paused/blurred app view.
function DimmedHome() {
  return (
    <div style={{
      flex: 1, ...paperTexture(C3.paper),
      filter: 'saturate(0.85) brightness(0.96)',
      position: 'relative',
    }}>
      <div style={{ opacity: 0.55 }}>
        <C3Header />
        <C3Hero />
        <C3Match m={MATCHES[0]} />
      </div>
      {/* dim wash */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(15,58,53,0) 0%, rgba(15,58,53,0.25) 60%, rgba(15,58,53,0.45) 100%)',
        pointerEvents: 'none',
      }} />
    </div>
  );
}

// ─────────────────────────── Install prompt sheet
// Ticket-styled paper card pinned to the bottom of the phone, with a
// small "drag" indicator and dashed top tear.
function InstallSheet({ children }) {
  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 0,
      ...paperTexture(C3.ticket),
      borderTopLeftRadius: 20, borderTopRightRadius: 20,
      boxShadow: '0 -18px 40px rgba(20,10,0,0.32)',
      borderTop: `1.5px dashed ${C3.ink20}`,
      padding: '10px 16px 20px',
      fontFamily: C3.sans,
    }}>
      <div style={{ display: 'grid', placeItems: 'center', marginBottom: 6 }}>
        <span style={{ width: 36, height: 4, borderRadius: 2,
          background: C3.ink20 }} />
      </div>
      {children}
    </div>
  );
}

// Header block reused by every install sheet
function InstallHeader({ eyebrow, title, onClose = true }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start',
      justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <LogoMark size={38} />
        <div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
            letterSpacing: 2, textTransform: 'uppercase', fontWeight: 600,
          }}>★ {eyebrow}</div>
          <div style={{
            fontFamily: C3.display, fontSize: 19, color: C3.ink,
            lineHeight: 1.1, letterSpacing: -0.2, marginTop: 3,
            textWrap: 'pretty',
          }}>{title}</div>
        </div>
      </div>
      {onClose && (
        <button style={{
          width: 32, height: 32, borderRadius: 6,
          border: `1px solid ${C3.ink20}`,
          background: 'transparent', color: C3.ink70,
          display: 'grid', placeItems: 'center', cursor: 'pointer',
          flexShrink: 0, padding: 0,
        }}>
          <span style={{ width: 16, height: 16 }}>{ICONS.close}</span>
        </button>
      )}
    </div>
  );
}

// Numbered step list used in iOS A2HS instructions.
function StepList({ steps }) {
  return (
    <ol style={{
      margin: '6px 0 12px', padding: 0,
      listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {steps.map((step, i) => (
        <li key={i} style={{
          display: 'flex', alignItems: 'flex-start', gap: 10,
        }}>
          <span style={{
            width: 22, height: 22, borderRadius: '50%',
            background: C3.ink, color: C3.ticket,
            display: 'grid', placeItems: 'center', flexShrink: 0,
            fontFamily: C3.mono, fontSize: 10, fontWeight: 700,
            letterSpacing: 0,
          }}>{i + 1}</span>
          <div style={{ flex: 1, paddingTop: 1 }}>
            <div style={{
              fontFamily: C3.sans, fontSize: 13, color: C3.ink,
              lineHeight: 1.4, textWrap: 'pretty',
            }}>
              {step.body}
              {step.glyph && (
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  justifyContent: 'center', verticalAlign: '-3px',
                  width: 22, height: 22, marginInline: 4,
                  borderRadius: 4, border: `1px solid ${C3.ink20}`,
                  background: C3.paper, color: C3.ink,
                }}>{step.glyph}</span>
              )}
            </div>
            {step.hint && (
              <div style={{ fontFamily: C3.mono, fontSize: 9,
                color: C3.ink50, letterSpacing: 1.2, textTransform: 'uppercase',
                marginTop: 3 }}>{step.hint}</div>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

// iOS-style "Share" glyph (small square + up-arrow)
const ShareGlyph = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
    <path d="M12 4v11M12 4l-3 3M12 4l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M6 11v8a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
  </svg>
);
const PlusGlyph = (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
    <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

// Frame factory — every install screen is a Phone showing the dimmed home
// and a bottom-anchored sheet.
function InstallPhone({ children }) {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <DimmedHome />
        {children}
      </div>
    </Phone>
  );
}

// ─────────────────────────── 1) Native install — idle
function InstallNative({ stage = 'idle' }) {
  // stage: idle | preparing | opening
  return (
    <InstallPhone>
      <InstallSheet>
        <InstallHeader eyebrow="Install" title="Install World Cup 26" />
        <div style={{
          fontFamily: C3.sans, fontSize: 12.5, color: C3.ink70,
          lineHeight: 1.5, textWrap: 'pretty', marginBottom: 14,
        }}>
          Pin the app to your Home Screen so you don't sign in every time.
          Works offline · sends pick reminders.
        </div>

        <ul style={{ margin: 0, padding: 0, listStyle: 'none',
          display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
          {[
            'One-tap launch from Home Screen',
            'Push reminders before kick-off',
            'Works on the go · cached fixtures',
          ].map(t => (
            <li key={t} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              fontFamily: C3.sans, fontSize: 12, color: C3.ink,
            }}>
              <span style={{ width: 14, height: 14, color: '#1f6a4d' }}>
                {ICONS.check}
              </span>
              {t}
            </li>
          ))}
        </ul>

        <div style={{ display: 'flex', gap: 8 }}>
          <TKButton variant="quiet" size="md" block>Later</TKButton>
          <TKButton
            variant="primary" size="md" block
            trailing={stage === 'idle' ? '→' : null}
            state={stage === 'preparing' || stage === 'opening' ? 'loading' : 'idle'}
          >
            {stage === 'preparing' ? 'Preparing' :
             stage === 'opening'   ? 'Opening installer' :
                                     'Install'}
          </TKButton>
        </div>
      </InstallSheet>
    </InstallPhone>
  );
}

// ─────────────────────────── 2) iOS Safari — Add to Home Screen
function InstallIOSSafari({ done = false }) {
  return (
    <InstallPhone>
      <InstallSheet>
        <InstallHeader eyebrow="iOS Safari" title="Add to Home Screen" />
        <div style={{
          fontFamily: C3.sans, fontSize: 12.5, color: C3.ink70,
          lineHeight: 1.5, textWrap: 'pretty', marginBottom: 8,
        }}>
          Safari doesn't auto-install. Three quick taps and you're done.
        </div>
        <StepList steps={[
          { body: <span>Tap the Share button {ShareGlyph} at the bottom of Safari.</span>,
            hint: 'Square with up arrow' },
          { body: <span>Scroll the share sheet and pick <b>Add to Home Screen</b> {PlusGlyph}.</span> },
          { body: <span>Confirm the name <b>"World Cup 26"</b>, then tap <b>Add</b>.</span>,
            hint: 'Top-right of the dialog' },
        ]} />
        <TKButton
          variant={done ? 'success' : 'primary'} size="md" block
          icon={done ? null : null}
          state={done ? 'success' : 'idle'}
          trailing={done ? null : '→'}
        >{done ? 'Got it' : 'Got it'}</TKButton>
      </InstallSheet>
    </InstallPhone>
  );
}

// ─────────────────────────── 3) iOS Other browser — open in Safari
function InstallIOSOther({ copied = false }) {
  return (
    <InstallPhone>
      <InstallSheet>
        <InstallHeader
          eyebrow={copied ? 'Link copied' : 'Open in Safari'}
          title={copied ? 'Paste in Safari' : 'Switch to Safari to install'}
        />
        <div style={{
          fontFamily: C3.sans, fontSize: 12.5, color: C3.ink70,
          lineHeight: 1.5, textWrap: 'pretty', marginBottom: 14,
        }}>
          {copied
            ? 'Link copied. Open Safari and paste it in the address bar — then use Add to Home Screen.'
            : 'iOS only lets Safari install web apps. Copy the link and open it in Safari.'}
        </div>

        {copied && (
          <div style={{
            padding: '10px 12px',
            background: 'rgba(31,106,77,0.12)',
            border: `1px solid rgba(31,106,77,0.35)`,
            borderRadius: 6, marginBottom: 12,
            fontFamily: C3.mono, fontSize: 10.5, color: '#1f6a4d',
            letterSpacing: 0.4, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <span style={{ width: 14, height: 14 }}>{ICONS.check}</span>
            <span style={{ flex: 1, minWidth: 0,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              https://wc26.app/i/x83f-92
            </span>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8 }}>
          <TKButton variant="quiet" size="md" block>Got it</TKButton>
          <TKButton
            variant={copied ? 'secondary' : 'primary'}
            size="md" block
            icon={copied ? ICONS.check : ICONS.send}
            state={copied ? 'success' : 'idle'}
          >{copied ? 'Copied' : 'Copy link'}</TKButton>
        </div>
      </InstallSheet>
    </InstallPhone>
  );
}

// ─────────────────────────── 4) Manual Chrome — "no automatic prompt"
function InstallManualChrome() {
  return (
    <InstallPhone>
      <InstallSheet>
        <InstallHeader eyebrow="Chrome · Android" title="Install from menu" />
        <div style={{
          fontFamily: C3.sans, fontSize: 12.5, color: C3.ink70,
          lineHeight: 1.5, textWrap: 'pretty', marginBottom: 14,
        }}>
          Chrome did not show the automatic install prompt this session.
          You can still pin the app manually from the browser menu.
        </div>
        <StepList steps={[
          { body: <span>Tap the <b>⋮ menu</b> in the top-right of Chrome.</span> },
          { body: <span>Pick <b>Install app</b> or <b>Add to Home screen</b>.</span> },
          { body: <span>Confirm <b>Install</b>. The icon appears on your Home Screen.</span> },
        ]} />
        <div style={{ display: 'flex', gap: 8 }}>
          <TKButton variant="quiet" size="md" block>Later</TKButton>
          <TKButton variant="primary" size="md" block trailing="→">Try again</TKButton>
        </div>
      </InstallSheet>
    </InstallPhone>
  );
}

// ─────────────────────────── 5) Full-screen "App Installed"
function InstallSuccess() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, ...paperTexture(C3.paper),
        display: 'flex', flexDirection: 'column',
        padding: '24px 24px 28px', position: 'relative' }}>

        {/* Logo header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <LogoMark size={32} />
          <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.4, textTransform: 'uppercase' }}>Pool · admit one</div>
        </div>

        {/* Stamped success ticket */}
        <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
          <div style={{
            width: '100%', maxWidth: 300, position: 'relative',
            ...paperTexture(C3.ticket),
            borderRadius: 14,
            boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 18px 40px rgba(50,30,10,0.18)',
            padding: '28px 22px 22px', textAlign: 'center',
          }}>
            {/* big stamp */}
            <div style={{
              position: 'absolute', top: 18, right: -18,
              padding: '6px 14px', border: `2.5px solid ${C3.stamp}`,
              color: C3.stamp, transform: 'rotate(8deg)',
              fontFamily: C3.display, fontSize: 16, letterSpacing: 1.5,
              textTransform: 'uppercase', borderRadius: 4,
              background: 'rgba(246,239,219,0.65)',
            }}>Installed</div>

            <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 2.4, textTransform: 'uppercase',
              marginBottom: 14 }}>★ Status</div>

            <div style={{ display: 'grid', placeItems: 'center',
              marginBottom: 16 }}>
              <div style={{
                width: 64, height: 64, borderRadius: 14,
                background: C3.ink, color: C3.ticket,
                display: 'grid', placeItems: 'center',
                boxShadow: '0 6px 18px rgba(15,58,53,0.28)',
              }}>
                <span style={{ width: 32, height: 32 }}>{ICONS.check}</span>
              </div>
            </div>

            <div style={{ fontFamily: C3.display, fontSize: 28,
              color: C3.ink, lineHeight: 1, letterSpacing: -0.3,
              textWrap: 'pretty' }}>App Installed</div>

            <div style={{ fontFamily: C3.sans, fontSize: 13,
              color: C3.ink70, marginTop: 10, lineHeight: 1.5,
              textWrap: 'pretty' }}>
              Close this tab and open the <b>World Cup 26</b> icon
              from your Home Screen.
            </div>

            <div style={{
              marginTop: 18, padding: '10px 14px',
              border: `1.5px dashed ${C3.ink20}`, borderRadius: 8,
              fontFamily: C3.mono, fontSize: 9, color: C3.ink70,
              letterSpacing: 1.2, textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span>Receipt</span>
              <span>WC26 · 2026.PASS · ✓</span>
            </div>
          </div>
        </div>

        <div>
          <TKButton variant="quiet" size="md" block>Continue in browser</TKButton>
        </div>
      </div>
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

Object.assign(window, {
  DimmedHome, InstallSheet, InstallHeader, StepList,
  InstallNative, InstallIOSSafari, InstallIOSOther,
  InstallManualChrome, InstallSuccess,
});
