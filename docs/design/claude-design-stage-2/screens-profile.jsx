// PROFILE & ONBOARDING surfaces — Match Ticket system.
// 1) Onboarding "Set Up Profile"
// 2) Existing Profile in: saved · dirty · saving · error states
//
// Reuses TopBar/BackHeader/BottomNav, TKInput, TKButton, TKAvatar, TKBanner.

const EMOJI_AVATARS = [
  '🦊', '🐻', '🐯', '🐼', '🦁', '🐧',
  '⚡️', '🌶️', '🍋', '🎯', '🎲', '🔥',
];

// Emoji avatar picker grid — used in onboarding.
function EmojiPicker({ selected = '🦊' }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)',
      gap: 8,
    }}>
      {EMOJI_AVATARS.map(e => {
        const on = e === selected;
        return (
          <div key={e} style={{
            aspectRatio: '1 / 1',
            display: 'grid', placeItems: 'center',
            borderRadius: 8,
            border: on ? `1.5px solid ${C3.ink}` : `1.5px solid ${C3.ink20}`,
            background: on ? C3.ticket : 'transparent',
            fontSize: 22,
            boxShadow: on ? `0 0 0 3px rgba(15,58,53,0.10)` : 'none',
            position: 'relative',
          }}>
            {e}
            {on && (
              <span style={{
                position: 'absolute', top: -6, right: -6,
                width: 16, height: 16, borderRadius: '50%',
                background: C3.ink, color: C3.ticket,
                display: 'grid', placeItems: 'center',
              }}>
                <span style={{ width: 10, height: 10 }}>{ICONS.check}</span>
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Avatar preview block — big circle + small "your pass shows this" caption.
function AvatarPreview({ kind = 'emoji', emoji = '🦊', initial = 'D' }) {
  return (
    <div style={{
      padding: '18px 16px 16px',
      ...paperTexture(C3.ticket),
      borderRadius: 14,
      boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
        letterSpacing: 1.4, textTransform: 'uppercase',
      }}>★ Your pass</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 10 }}>
        <TKAvatar kind={kind} emoji={emoji} initial={initial} size={64} ring={C3.paper} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: C3.display, fontSize: 22, color: C3.ink,
            lineHeight: 1, letterSpacing: -0.2 }}>Darko</div>
          <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 6 }}>
            Holder · pool member
          </div>
        </div>
      </div>
      <div style={{
        position: 'absolute', top: 14, right: 14,
        padding: '4px 7px', border: `1.5px solid ${C3.stamp}`,
        color: C3.stamp, transform: 'rotate(4deg)',
        fontFamily: C3.display, fontSize: 9, letterSpacing: 1,
        textTransform: 'uppercase', borderRadius: 3,
      }}>Preview</div>
    </div>
  );
}

// ─────────────────────────── 1) ONBOARDING — Set Up Profile
function ProfileOnboarding({ usingGooglePhoto = false }) {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <div style={{ padding: '4px 20px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <LogoMark size={28} />
            <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 1.4, textTransform: 'uppercase' }}>
              Step 1 of 1 · welcome
            </div>
          </div>
        </div>
        <div style={{ padding: '14px 20px 6px' }}>
          <div style={{ fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
            letterSpacing: 2.4, textTransform: 'uppercase', marginBottom: 6 }}>
            ★ Set Up Profile
          </div>
          <div style={{ fontFamily: C3.display, fontSize: 32, color: C3.ink,
            lineHeight: 1, letterSpacing: -0.4 }}>
            Pick a face<br/>and a name.
          </div>
          <div style={{ fontFamily: C3.sans, fontSize: 13, color: C3.ink70,
            marginTop: 10, lineHeight: 1.5, textWrap: 'pretty', maxWidth: 320 }}>
            This is how everyone will see you in chat, picks, and the leaderboard.
            You can change it later.
          </div>
        </div>

        <div style={{ padding: '14px 20px 12px' }}>
          <AvatarPreview
            kind={usingGooglePhoto ? 'photo' : 'emoji'}
            emoji="🦊"
          />
        </div>

        <div style={{ padding: '6px 20px 8px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline',
            justifyContent: 'space-between', marginBottom: 10 }}>
            <FieldLabel>Emoji avatar</FieldLabel>
            <button style={{
              background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
              fontFamily: C3.mono, fontSize: 9, color: usingGooglePhoto ? C3.stamp : C3.ink,
              letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600,
            }}>
              {usingGooglePhoto ? '· Using Google photo' : '+ Use Google photo'}
            </button>
          </div>
          <EmojiPicker selected={usingGooglePhoto ? null : '🦊'} />
        </div>

        <div style={{ padding: '14px 20px 4px' }}>
          <TKInput
            label="Your app name"
            value="Darko"
            help="Shown to your pool. 2–24 characters."
          />
        </div>

        <div style={{ padding: '16px 20px 24px' }}>
          <TKButton variant="primary" size="lg" trailing="→" block>
            Save and continue
          </TKButton>
          <div style={{ height: 10 }} />
          <div style={{ textAlign: 'center', fontFamily: C3.mono, fontSize: 9,
            color: C3.ink50, letterSpacing: 1.2, textTransform: 'uppercase' }}>
            One pass per holder · editable later
          </div>
        </div>
      </div>
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// ─────────────────────────── 2) EXISTING PROFILE — multiple states

function ProfileBody({ state = 'saved', isAdmin = true }) {
  const dirty = state === 'dirty' || state === 'saving' || state === 'error';
  const nameValue = dirty ? 'Darko · the picker' : 'Darko';
  const inputState = state === 'error' ? 'error' : (dirty ? 'filled' : 'idle');

  let buttonNode;
  if (state === 'saved' && !dirty) {
    buttonNode = (
      <TKButton variant="primary" size="md" block state="disabled">
        Saved
      </TKButton>
    );
  } else if (state === 'saving') {
    buttonNode = <TKButton variant="primary" size="md" block state="loading">Saving</TKButton>;
  } else if (state === 'success') {
    buttonNode = <TKButton variant="primary" size="md" block state="success">Saved!</TKButton>;
  } else if (state === 'error') {
    buttonNode = <TKButton variant="primary" size="md" block trailing="→">Save changes</TKButton>;
  } else {
    // dirty
    buttonNode = <TKButton variant="primary" size="md" block trailing="→">Save changes</TKButton>;
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
      <BackHeader eyebrow="Account" title="Your Profile" />

      <div style={{ padding: '4px 20px 12px' }}>
        <AvatarPreview kind="emoji" emoji="🦊" />
      </div>

      <div style={{ padding: '4px 20px 8px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline',
          justifyContent: 'space-between', marginBottom: 10 }}>
          <FieldLabel>Emoji avatar</FieldLabel>
          <button style={{
            background: 'transparent', border: 'none', padding: 0, cursor: 'pointer',
            fontFamily: C3.mono, fontSize: 9, color: C3.ink,
            letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600,
          }}>+ Use Google photo</button>
        </div>
        <EmojiPicker selected="🦊" />
      </div>

      <div style={{ padding: '14px 20px 4px' }}>
        <TKInput
          label="Your app name"
          value={nameValue}
          state={inputState}
          errorText={state === 'error' ? "Couldn't save · check your connection and try again." : null}
          help={state !== 'error' ? '2–24 characters · visible to your pool.' : null}
        />
      </div>

      <div style={{ padding: '16px 20px 6px' }}>
        {buttonNode}
      </div>

      {state === 'error' && (
        <div style={{ padding: '0 20px 8px' }}>
          <TKBanner
            tone="error"
            title="Save failed"
            body="We couldn't reach the pool just now. Your edits are kept locally — try saving again in a moment."
            action="Retry"
          />
        </div>
      )}

      {/* Admin + Sign out */}
      <div style={{ padding: '14px 20px 4px' }}>
        <div style={{
          borderTop: `1.5px dashed ${C3.ink20}`, paddingTop: 16,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {isAdmin && (
            <button style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '14px 14px',
              background: 'transparent', border: `1.5px solid ${C3.ink}`,
              borderRadius: 6, cursor: 'pointer', width: '100%',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ width: 22, height: 22, color: C3.ink }}>
                  {ICONS.plus}
                </span>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontFamily: C3.display, fontSize: 16,
                    color: C3.ink, lineHeight: 1 }}>Invite Player</div>
                  <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
                    letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 3 }}>
                    Admin · manage pool
                  </div>
                </div>
              </div>
              <span style={{ width: 18, height: 18, color: C3.ink70 }}>
                {ICONS.chevronRight}
              </span>
            </button>
          )}

          <button style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 14px',
            background: 'transparent', border: `1.5px dashed ${C3.ink20}`,
            borderRadius: 6, cursor: 'pointer', width: '100%',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 22, height: 22, color: C3.stamp }}>
                {ICONS.unlock}
              </span>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontFamily: C3.display, fontSize: 16,
                  color: C3.stamp, lineHeight: 1 }}>Sign Out</div>
                <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
                  letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 3 }}>
                  Signed in as darko@example.com
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div style={{ height: 8 }} />
    </div>
  );
}

function ProfileExisting({ state = 'saved' }) {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <ProfileBody state={state} />
      <BottomNav variant="live" activeId="players" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

Object.assign(window, {
  EMOJI_AVATARS, EmojiPicker, AvatarPreview,
  ProfileOnboarding, ProfileExisting,
});
