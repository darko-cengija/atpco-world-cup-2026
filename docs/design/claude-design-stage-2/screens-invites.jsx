// INVITES admin surfaces — Match Ticket system.
// Header "Invites" · Add Invite card · Invite list · toasts.

// ─────────────────────────── Status pill — paper stamp style
function InviteStatus({ kind }) {
  // kind: joined | sent | resent | waiting
  const map = {
    joined:  { fg: '#1f6a4d', bg: 'rgba(31,106,77,0.10)',  label: 'Joined' },
    sent:    { fg: C3.ink,    bg: 'rgba(15,58,53,0.08)',   label: 'Invite sent' },
    resent:  { fg: C3.gold,   bg: 'rgba(179,137,46,0.14)', label: 'Sent 2×' },
    waiting: { fg: C3.stamp,  bg: 'rgba(168,57,43,0.10)',  label: 'Waiting for invite' },
  };
  const s = map[kind];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 8px', borderRadius: 100,
      background: s.bg, color: s.fg,
      fontFamily: C3.mono, fontSize: 9, fontWeight: 600,
      letterSpacing: 1.2, textTransform: 'uppercase',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.fg }} />
      {s.label}
    </span>
  );
}

// ─────────────────────────── Add Invite card (form block)
function AddInviteCard({
  appName = '',
  email = '',
  errorText = null,
  state = 'idle', // idle | valid | invalid | sending
}) {
  const sending = state === 'sending';
  const valid = state === 'valid';
  return (
    <div style={{
      ...paperTexture(C3.ticket),
      borderRadius: 14, padding: '16px 16px 14px',
      boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
      position: 'relative', overflow: 'hidden',
    }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
        letterSpacing: 2.2, textTransform: 'uppercase', marginBottom: 4,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>★ Invite player</span>
        <span style={{ flex: 1, height: 1, background: C3.ink20 }} />
        <span style={{ color: C3.ink50, fontWeight: 600 }}>Admin only</span>
      </div>
      <div style={{
        fontFamily: C3.display, fontSize: 22, color: C3.ink,
        lineHeight: 1.05, marginTop: 2, letterSpacing: -0.2,
      }}>Issue a new pass</div>

      <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <TKInput
          label="App name"
          value={appName}
          placeholder="What we'll call them"
          help={!errorText ? 'Visible to the rest of the pool.' : null}
        />
        <TKInput
          label="Email"
          type="email"
          value={email}
          placeholder="them@example.com"
          state={errorText ? 'error' : (state === 'valid' || state === 'sending' ? 'filled' : 'idle')}
          errorText={errorText}
          leading={ICONS.send}
        />
      </div>

      <div style={{
        marginTop: 14, paddingTop: 12,
        borderTop: `1.5px dashed ${C3.ink20}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10,
      }}>
        <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Sends a link · expires 7 days
        </div>
        <TKButton
          variant="primary" size="sm"
          icon={ICONS.send}
          state={sending ? 'loading' : (valid ? 'idle' : 'disabled')}>
          {sending ? 'Sending' : 'Invite'}
        </TKButton>
      </div>
    </div>
  );
}

// ─────────────────────────── One invite row
function InviteRow({
  appName, email, status, kind, emoji, initial,
  joinedAvatar = false,
  showDivider = true,
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 14px',
      borderBottom: showDivider ? `1px dashed ${C3.ink20}` : 'none',
      fontFamily: C3.sans,
    }}>
      {joinedAvatar ? (
        <TKAvatar kind={kind || 'emoji'} emoji={emoji} initial={initial} size={38} />
      ) : (
        <div style={{
          width: 38, height: 38, borderRadius: '50%',
          border: `1.5px dashed ${C3.ink20}`,
          display: 'grid', placeItems: 'center', color: C3.ink50,
          fontFamily: C3.display, fontSize: 16,
        }}>{initial || '?'}</div>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8,
          flexWrap: 'wrap' }}>
          <span style={{ fontFamily: C3.display, fontSize: 16,
            color: C3.ink, lineHeight: 1.1 }}>{appName}</span>
          <InviteStatus kind={status} />
        </div>
        <div style={{
          fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
          marginTop: 4, letterSpacing: 0.3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{email}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {kind !== 'joined-row' && status !== 'joined' && (
          <TKIconButton icon={ICONS.send}  variant="quiet" size={32} />
        )}
        {status !== 'joined' && (
          <TKIconButton icon={ICONS.edit}  variant="quiet" size={32} />
        )}
        <TKIconButton icon={ICONS.trash} variant="quiet" size={32} />
      </div>
    </div>
  );
}

// Joined row uses a slightly richer treatment — avatar + filled state.
function JoinedRow({ appName, email, kind, emoji, initial, showDivider = true }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 14px',
      borderBottom: showDivider ? `1px dashed ${C3.ink20}` : 'none',
      fontFamily: C3.sans,
    }}>
      <TKAvatar kind={kind} emoji={emoji} initial={initial} size={38} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8,
          flexWrap: 'wrap' }}>
          <span style={{ fontFamily: C3.display, fontSize: 16,
            color: C3.ink, lineHeight: 1.1 }}>{appName}</span>
          <InviteStatus kind="joined" />
        </div>
        <div style={{
          fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
          marginTop: 4, letterSpacing: 0.3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{email}</div>
      </div>
      <TKIconButton icon={ICONS.trash} variant="quiet" size={32} />
    </div>
  );
}

// ─────────────────────────── Invite list container
function InviteList({ state = 'populated', toast }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ padding: '4px 20px 6px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="row-label" style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600,
        }}>
          {state === 'loading' ? 'Loading roster' :
           state === 'empty'   ? 'Roster' :
                                 'Roster · 5 issued · 3 joined'}
        </div>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.ink70,
          letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600,
        }}>
          ★ Pool of 12
        </div>
      </div>

      <div style={{
        margin: '6px 16px 0',
        ...paperTexture(C3.ticket), borderRadius: 14,
        border: `1px solid ${C3.ink20}`,
        boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 6px 18px rgba(50,30,10,0.06)',
        overflow: 'hidden',
      }}>
        {state === 'loading' && (
          <div style={{
            padding: '40px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 12,
          }}>
            {ICONS.spinner(C3.ink, 28)}
            <div style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 1.4, textTransform: 'uppercase' }}>
              Fetching invite list
            </div>
          </div>
        )}

        {state === 'empty' && (
          <div style={{ padding: 22 }}>
            <TKEmpty
              title="No one has been invited yet."
              body="Use the card above to issue the first pass. Each invite goes out as an email link."
            />
          </div>
        )}

        {state === 'populated' && (
          <React.Fragment>
            <JoinedRow appName="Ana"   email="ana@example.com"   kind="emoji" emoji="🦊" />
            <JoinedRow appName="Marko" email="marko@example.com" kind="photo" />
            <JoinedRow appName="Petra" email="petra@example.com" kind="initials" initial="P" />
            <InviteRow appName="Ivan"  email="ivan@example.com"  status="sent"    initial="I" />
            <InviteRow appName="Lena"  email="lena@example.com"  status="resent"  initial="L" />
            <InviteRow appName="Goran" email="goran@example.com" status="waiting" initial="G" showDivider={false} />
          </React.Fragment>
        )}
      </div>

      {toast && (
        <div style={{
          position: 'absolute', bottom: -56, left: 0, right: 0,
          display: 'flex', justifyContent: 'center',
        }}>
          <TKToast tone={toast.tone || 'success'} text={toast.text} />
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── Composed Invites screen
function InvitesScreen({
  formState = 'idle',
  formError = null,
  formAppName = '',
  formEmail = '',
  listState = 'populated',
  toast = null,
}) {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper),
        position: 'relative' }}>
        <BackHeader eyebrow="Admin" title="Invites" />

        <div style={{ padding: '4px 16px 16px' }}>
          <AddInviteCard
            appName={formAppName}
            email={formEmail}
            errorText={formError}
            state={formState}
          />
        </div>

        <InviteList state={listState} toast={toast} />

        <div style={{ height: 80 }} />
      </div>
      <BottomNav variant="live" activeId="players" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

Object.assign(window, {
  InviteStatus, AddInviteCard, InviteRow, JoinedRow, InviteList, InvitesScreen,
});
