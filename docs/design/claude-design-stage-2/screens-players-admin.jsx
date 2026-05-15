// Players and Teams — admin variants and the stop-tracking confirm modal.

// ─────────────────────────── STOP TRACKING MODAL
function StopTrackingModal() {
  return (
    <div style={{
      position: 'relative', width: 332,
      borderRadius: 14, ...paperTexture(C3.ticket),
      boxShadow: '0 20px 50px rgba(20,10,0,0.32)',
      overflow: 'hidden', fontFamily: C3.sans,
    }}>
      {/* Stamped destructive eyebrow */}
      <div style={{
        position: 'absolute', top: 14, right: 14,
        transform: 'rotate(4deg)',
        padding: '3px 6px',
        border: `1.5px solid ${C3.stamp}`,
        color: C3.stamp,
        fontFamily: C3.mono, fontSize: 8,
        letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
        borderRadius: 2,
      }}>Destructive</div>

      <div style={{ padding: '18px 20px 8px' }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
          letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
        }}>★ Confirm</div>
        <div style={{
          fontFamily: C3.display, fontSize: 24, color: C3.ink,
          lineHeight: 1.05, marginTop: 4, letterSpacing: -0.3, textWrap: 'pretty',
        }}>Stop tracking?</div>
      </div>
      <div style={{ padding: '8px 20px 16px',
        fontSize: 13, color: C3.ink70, lineHeight: 1.5 }}>
        This will reset the draw, return lists to the default ranking,
        and delete assigned teams.
      </div>
      <div style={{
        margin: '0 20px 14px',
        padding: '10px 12px',
        background: 'rgba(168,57,43,0.08)',
        border: `1px solid ${C3.stamp}40`,
        borderLeft: `3px solid ${C3.stamp}`,
        borderRadius: 6,
        display: 'flex', alignItems: 'flex-start', gap: 8,
      }}>
        <span style={{ width: 16, height: 16, color: C3.stamp, marginTop: 1 }}>
          {ICONS.alert}
        </span>
        <div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
            letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 700,
          }}>Irreversible</div>
          <div style={{ fontSize: 12, color: C3.ink, marginTop: 3, lineHeight: 1.45 }}>
            Predictions submitted so far will be kept, but un-scored
            until the next draw is filed.
          </div>
        </div>
      </div>
      <div style={{
        borderTop: `1px dashed ${C3.ink20}`,
        padding: '12px 16px',
        display: 'flex', gap: 8, justifyContent: 'flex-end',
      }}>
        <button style={{
          padding: '9px 16px', borderRadius: 4, border: `1.5px solid ${C3.ink}`,
          background: 'transparent', color: C3.ink, cursor: 'pointer',
          fontFamily: C3.mono, fontSize: 11, fontWeight: 700,
          letterSpacing: 1.6, textTransform: 'uppercase',
        }}>No</button>
        <button style={{
          padding: '9px 16px', borderRadius: 4, border: 'none',
          background: C3.stamp, color: C3.ticket, cursor: 'pointer',
          fontFamily: C3.mono, fontSize: 11, fontWeight: 700,
          letterSpacing: 1.6, textTransform: 'uppercase',
          display: 'inline-flex', alignItems: 'center', gap: 6,
        }}>Yes, Stop <span style={{ fontFamily: C3.display, fontSize: 13 }}>→</span></button>
      </div>
    </div>
  );
}

// ═══════════════════════════ ADMIN VIEW · STATES

function AdminShell({ children, gameState = 'off', showReplace = true }) {
  // Pre-game shell uses pre-draw nav, post-game uses live nav.
  const variant = gameState === 'on' || gameState === 'loading' ? 'live' : 'pre';
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <PTHeader subtitle="Assign teams to players" />
        <GameStartedCard state={gameState} />
        {showReplace && <ReplaceTeamRow />}
        {children}
        <PTFooter kind="admin" />
      </div>
      <BottomNav variant={variant} activeId="players" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 1. Admin · game not started — toggle off
function AdminGameOff() {
  return (
    <AdminShell gameState="off">
      {POOL_PLAYERS_READY.map(p => (
        <PlayerTicket key={p.id} player={p}
          codes={PT_ASSIGNED[p.id]}
          variant="admin" showAdd />
      ))}
    </AdminShell>
  );
}

// 2. Admin · game started — toggle on
function AdminGameOn() {
  return (
    <AdminShell gameState="on">
      {POOL_PLAYERS_READY.map(p => (
        <PlayerTicket key={p.id} player={p}
          codes={PT_ASSIGNED[p.id]}
          variant="admin" showAdd />
      ))}
    </AdminShell>
  );
}

// 3. Admin · toggle loading
function AdminGameLoading() {
  return (
    <AdminShell gameState="loading">
      {POOL_PLAYERS_READY.slice(0, 3).map(p => (
        <PlayerTicket key={p.id} player={p}
          codes={PT_ASSIGNED[p.id]}
          variant="admin" showAdd />
      ))}
    </AdminShell>
  );
}

// 4. Admin · stop-tracking modal in context
function AdminWithStopModal() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'hidden', ...paperTexture(C3.paper) }}>
        <TopBar />
        <PTHeader subtitle="Assign teams to players" />
        <GameStartedCard state="on" />
        <ReplaceTeamRow />
        {POOL_PLAYERS_READY.slice(0, 2).map(p => (
          <PlayerTicket key={p.id} player={p}
            codes={PT_ASSIGNED[p.id]} variant="admin" showAdd />
        ))}
        {/* Backdrop */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(15,30,28,0.55)',
          backdropFilter: 'blur(1px)',
          display: 'grid', placeItems: 'center', padding: 20,
        }}>
          <StopTrackingModal />
        </div>
      </div>
      <BottomNav variant="live" activeId="players" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 5. Admin · one player's picker is open
function AdminPickerOpen() {
  return (
    <AdminShell gameState="off">
      <PlayerTicket player={POOL_PLAYERS_READY[0]}
        codes={PT_ASSIGNED.darko}
        variant="admin" showAdd />
      <PlayerTicket player={POOL_PLAYERS_READY[1]}
        codes={PT_ASSIGNED.ana.slice(0, 3)}
        variant="admin" showAdd addOpen addQuery="" />
      <PlayerTicket player={POOL_PLAYERS_READY[2]}
        codes={PT_ASSIGNED.marko}
        variant="admin" showAdd />
    </AdminShell>
  );
}

// 6. Admin · picker shows no-available state
function AdminPickerEmpty() {
  return (
    <AdminShell gameState="off">
      <PlayerTicket player={POOL_PLAYERS_READY[0]}
        codes={PT_ASSIGNED.darko}
        variant="admin" showAdd />
      <PlayerTicket player={POOL_PLAYERS_READY[1]}
        codes={PT_ASSIGNED.ana.slice(0, 3)}
        variant="admin" showAdd addOpen
        noAvailable />
      <PlayerTicket player={POOL_PLAYERS_READY[2]}
        codes={PT_ASSIGNED.marko}
        variant="admin" showAdd />
    </AdminShell>
  );
}

// 7. Admin · inline delete confirmation on one player
function AdminDeleteConfirm() {
  return (
    <AdminShell gameState="off">
      <PlayerTicket player={POOL_PLAYERS_READY[0]}
        codes={PT_ASSIGNED.darko} variant="admin" showAdd />
      <PlayerTicket player={POOL_PLAYERS_READY[3]}
        codes={PT_ASSIGNED.petra} variant="admin" showAdd
        state="confirmDelete" />
      <PlayerTicket player={POOL_PLAYERS_READY[2]}
        codes={PT_ASSIGNED.marko} variant="admin" showAdd />
    </AdminShell>
  );
}

// 8. Admin · player deleting (in-flight)
function AdminDeleting() {
  return (
    <AdminShell gameState="off">
      <PlayerTicket player={POOL_PLAYERS_READY[0]}
        codes={PT_ASSIGNED.darko} variant="admin" showAdd />
      <PlayerTicket player={POOL_PLAYERS_READY[3]}
        codes={PT_ASSIGNED.petra} variant="admin" showAdd
        state="deleting" />
      <PlayerTicket player={POOL_PLAYERS_READY[2]}
        codes={PT_ASSIGNED.marko} variant="admin" showAdd />
    </AdminShell>
  );
}

Object.assign(window, {
  StopTrackingModal,
  AdminShell, AdminGameOff, AdminGameOn, AdminGameLoading,
  AdminWithStopModal, AdminPickerOpen, AdminPickerEmpty,
  AdminDeleteConfirm, AdminDeleting,
});
