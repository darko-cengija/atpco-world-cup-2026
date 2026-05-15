// Live draw — round intro, picking view, team picker sheet, round summary.
//
// Composition (full screen):
//   TopBar
//   LiveDrawHeader  ("Live draw" eyebrow + round label + round chip strip)
//   <variant>:
//     · RoundIntro    — single hero card with Start (admin) or waiting copy
//     · PickingView   — big avatar + name + selected team + admin controls
//     · RoundSummary  — finished round + player pick cards
//   BottomNav (pre-draw variant, Draw tab active)

// ─────────────────────────── HEADER (live draw)
function LiveDrawHeader({ round = 1, total = 4, status = 'in-play' }) {
  // round chip strip — small mono pills, current is filled
  const chips = Array.from({ length: total }).map((_, i) => i + 1);
  return (
    <div style={{ padding: '4px 20px 12px', fontFamily: C3.sans }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
        letterSpacing: 2.2, textTransform: 'uppercase', fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        ★ Live draw
        <span style={{
          width: 6, height: 6, borderRadius: '50%', background: C3.stamp,
          boxShadow: '0 0 0 3px rgba(168,57,43,0.20)',
          animation: 'tkPulse 1.4s ease-in-out infinite',
        }} />
      </div>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: 10, marginTop: 4,
      }}>
        <div style={{
          fontFamily: C3.display, fontSize: 30, lineHeight: 1,
          color: C3.ink, letterSpacing: -0.5,
        }}>
          {round === 1 ? 'First Round' : (round === 2 ? 'Second Round' :
            round === 3 ? 'Third Round' : `Round ${round}`)}
        </div>
        <div style={{
          fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
          letterSpacing: 1.2, textTransform: 'uppercase',
          fontVariantNumeric: 'tabular-nums',
        }}>{round}/{total}</div>
      </div>
      {/* Round chips */}
      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
        {chips.map(n => {
          const past = n < round;
          const cur  = n === round;
          return (
            <div key={n} style={{
              flex: 1, height: 28, borderRadius: 4,
              border: `1.5px ${cur ? 'solid' : 'dashed'} ${cur ? C3.ink : C3.ink20}`,
              background: past ? 'rgba(15,58,53,0.08)' : (cur ? C3.ticket : 'transparent'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 4,
              fontFamily: C3.mono, fontSize: 9, fontWeight: 600,
              color: cur ? C3.ink : (past ? C3.ink70 : C3.ink50),
              letterSpacing: 1.2, textTransform: 'uppercase',
            }}>
              {past && <span style={{ width: 10, height: 10 }}>{ICONS.check}</span>}
              R{n}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────── ROUND INTRO
function RoundIntroCard({ round = 1, total = 4, isAdmin = true }) {
  const titles = {
    1: 'First Round',
    2: 'Second Round',
    3: 'Third Round',
    4: 'Fourth Round',
  };
  return (
    <div style={{
      margin: '0 16px 18px',
      borderRadius: 16, position: 'relative',
      ...paperTexture(C3.ticket),
      boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
      overflow: 'hidden', fontFamily: C3.sans,
    }}>
      {/* Stamp strip */}
      <div style={{
        padding: '16px 18px 12px',
        borderBottom: `1px solid ${C3.ink20}`,
      }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
          letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
        }}>★ Round {round} · about to start</div>
        <div style={{
          fontFamily: C3.display, fontSize: 32, color: C3.ink,
          lineHeight: 1, marginTop: 8, letterSpacing: -0.5, textWrap: 'pretty',
        }}>{titles[round] || `Round ${round}`}</div>
      </div>
      {/* Tear line */}
      <div style={{ position: 'relative', height: 0 }}>
        <div style={{ position: 'absolute', left: -10, top: -10, width: 20, height: 20, borderRadius: '50%', background: C3.paper }} />
        <div style={{ position: 'absolute', right: -10, top: -10, width: 20, height: 20, borderRadius: '50%', background: C3.paper }} />
        <div style={{ position: 'absolute', left: 14, right: 14, top: -1, borderTop: `1.5px dashed ${C3.ink20}` }} />
      </div>

      <div style={{ padding: '18px 18px 12px' }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 10, color: C3.ink50,
          letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600,
        }}>Order</div>
        <div style={{
          marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap',
        }}>
          {POOL_PLAYERS.map((p, i) => (
            <div key={p.id} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 10px 4px 4px', borderRadius: 100,
              background: 'rgba(15,58,53,0.06)',
              fontFamily: C3.sans, fontSize: 12, color: C3.ink, fontWeight: 500,
            }}>
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: C3.ink, color: C3.ticket,
                display: 'grid', placeItems: 'center',
                fontFamily: C3.mono, fontSize: 9, fontWeight: 600,
              }}>{i + 1}</span>
              {p.name.replace(' (you)', '')}
            </div>
          ))}
        </div>
        <div style={{
          marginTop: 12, fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
          letterSpacing: 0.7, lineHeight: 1.5,
        }}>
          Snake order — round 2 reverses · round 3 forwards again.<br/>
          Each player gets their top-available team from their saved list, or chooses live.
        </div>
      </div>

      <div style={{
        borderTop: `1px dashed ${C3.ink20}`,
        padding: '12px 16px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12,
      }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.4, textTransform: 'uppercase',
        }}>
          Round #{String(round).padStart(2, '0')}<br/>
          <span style={{ color: C3.ink70 }}>{total - round} more after this</span>
        </div>
        {isAdmin ? (
          <TKButton variant="primary" size="md" trailing="→">Start round</TKButton>
        ) : (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '8px 12px', borderRadius: 100,
            border: `1px dashed ${C3.ink20}`,
            fontFamily: C3.mono, fontSize: 9, color: C3.ink70,
            letterSpacing: 1.2, textTransform: 'uppercase',
          }}>
            {ICONS.spinner(C3.ink50, 12)}
            Waiting for round to start
          </div>
        )}
      </div>
    </div>
  );
}

function LiveRoundIntroAdmin() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <LiveDrawHeader round={1} total={4} />
        <RoundIntroCard round={1} total={4} isAdmin={true} />
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

function LiveRoundIntroNonAdmin() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar avatar="A" />
        <LiveDrawHeader round={2} total={4} />
        <RoundIntroCard round={2} total={4} isAdmin={false} />
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// ─────────────────────────── PICKING VIEW
// Big card with the current player's avatar, name, already-assigned chips,
// and the selected team display.

// Team display row — used for the "selected team" card on the picking view.
function SelectedTeamDisplay({ code, name, owner, state = 'idle' }) {
  // state: 'idle' (no team yet) | 'selected' | 'no-available'
  if (state === 'no-available') {
    return (
      <div style={{
        padding: '14px 14px',
        border: `1.5px dashed ${C3.stamp}`,
        borderRadius: 8, background: 'rgba(168,57,43,0.06)',
        display: 'flex', alignItems: 'center', gap: 12,
      }}>
        <span style={{
          width: 38, height: 38, borderRadius: '50%',
          background: 'rgba(168,57,43,0.10)', color: C3.stamp,
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <span style={{ width: 18, height: 18 }}>{ICONS.alert}</span>
        </span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
            letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 700,
          }}>No available team</div>
          <div style={{
            fontFamily: C3.display, fontSize: 17, color: C3.ink,
            lineHeight: 1.15, marginTop: 2,
          }}>This player's whole list is taken.</div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink70, marginTop: 3,
            letterSpacing: 0.6, lineHeight: 1.5,
          }}>Admin will choose any remaining team for them.</div>
        </div>
      </div>
    );
  }
  if (state === 'idle' || !code) {
    return (
      <div style={{
        padding: '14px 14px',
        border: `1.5px dashed ${C3.ink20}`, borderRadius: 8,
        display: 'flex', alignItems: 'center', gap: 12,
        background: 'rgba(15,58,53,0.03)',
      }}>
        <span style={{
          width: 38, height: 38, borderRadius: 4,
          background: 'rgba(15,58,53,0.06)',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <span style={{
            width: 22, height: 14, borderRadius: 2,
            background: `repeating-linear-gradient(135deg, ${C3.ink20} 0 3px, transparent 3px 6px)`,
          }} />
        </span>
        <div style={{ flex: 1 }}>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600,
          }}>Up next</div>
          <div style={{
            fontFamily: C3.display, fontSize: 16, color: C3.ink70,
            lineHeight: 1.15, marginTop: 2,
          }}>Top of their list will be picked.</div>
        </div>
      </div>
    );
  }
  return (
    <div style={{
      padding: '14px 14px',
      border: `1.5px solid ${C3.ink}`, borderRadius: 8,
      background: C3.ticket,
      display: 'flex', alignItems: 'center', gap: 12,
      boxShadow: '0 6px 14px rgba(15,58,53,0.10)',
      position: 'relative',
    }}>
      <FlagSquare code={code} size={48} radius={4} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600,
        }}>★ Selected · #{code}</div>
        <div style={{
          fontFamily: C3.display, fontSize: 22, color: C3.ink,
          lineHeight: 1.1, marginTop: 3, letterSpacing: -0.2,
        }}>{name}</div>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.ink70, marginTop: 4,
          letterSpacing: 0.6,
        }}>From {owner || 'top of list'}</div>
      </div>
      <span style={{
        position: 'absolute', top: -10, right: -10,
        width: 22, height: 22, borderRadius: '50%',
        background: C3.stamp, color: C3.ticket,
        display: 'grid', placeItems: 'center',
        boxShadow: '0 2px 6px rgba(168,57,43,0.35)',
      }}>
        <span style={{ width: 14, height: 14 }}>{ICONS.check}</span>
      </span>
    </div>
  );
}

// Picking card — the centerpiece of the live screen.
function PickingCard({
  round = 1,
  player = POOL_PLAYERS[1],     // currently picking
  pickIndex = 2,                // 1-based position in round order
  totalPlayers = 5,
  assigned = [],                // codes already picked by this player
  selectedCode = null,
  selectedName = null,
  selectedOwner = null,
  selectedState = 'idle',       // idle | selected | no-available
  isAdmin = true,
  isYou = false,                // is the user the one picking right now?
}) {
  return (
    <div style={{
      margin: '0 16px 18px',
      borderRadius: 16, position: 'relative',
      ...paperTexture(C3.ticket),
      boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
      overflow: 'hidden', fontFamily: C3.sans,
    }}>
      {/* Top strip: round + position */}
      <div style={{
        padding: '12px 18px 10px',
        borderBottom: `1px solid ${C3.ink20}`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
            letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
          }}>★ Round {round} · pick {pickIndex} of {totalPlayers}</div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.2, marginTop: 4, textTransform: 'uppercase',
          }}>On the clock</div>
        </div>
        <span style={{
          padding: '4px 8px', borderRadius: 4,
          border: `1px solid ${C3.ink20}`,
          fontFamily: C3.mono, fontSize: 9, color: C3.ink70,
          letterSpacing: 1.2, textTransform: 'uppercase',
          fontVariantNumeric: 'tabular-nums',
        }}>#{String(pickIndex + (round - 1) * totalPlayers).padStart(2, '0')}</span>
      </div>

      {/* Player headline */}
      <div style={{
        padding: '20px 18px 14px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 10, textAlign: 'center',
      }}>
        <TKAvatar
          kind={player.kind}
          initial={player.initial}
          emoji={player.emoji}
          size={88}
          ring={isYou ? C3.stamp : undefined}
        />
        <div>
          <div style={{
            fontFamily: C3.display, fontSize: 28, color: C3.ink,
            lineHeight: 1, letterSpacing: -0.4, textWrap: 'pretty',
          }}>{player.name.replace(' (you)', '')}</div>
          <div style={{
            fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
            letterSpacing: 1, marginTop: 6, textTransform: 'uppercase',
          }}>{isYou ? 'Your turn' : `${player.name.replace(' (you)','')}'s turn`}</div>
        </div>
      </div>

      {/* Already assigned */}
      {assigned.length > 0 && (
        <div style={{
          padding: '0 16px 12px',
        }}>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600,
            marginBottom: 6,
          }}>Already on roster</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {assigned.map(code => {
              const t = teamByCode(code);
              return t && (
                <TKTeamChip key={code}
                  code={code} short={code} name={t.name} variant="compact" />
              );
            })}
          </div>
        </div>
      )}

      {/* Selected team */}
      <div style={{ padding: '0 16px 14px' }}>
        <SelectedTeamDisplay
          code={selectedCode}
          name={selectedName}
          owner={selectedOwner}
          state={selectedState}
        />
      </div>

      {/* Admin / non-admin controls */}
      <div style={{
        borderTop: `1px dashed ${C3.ink20}`,
        padding: '12px 16px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 10,
      }}>
        {isAdmin ? (
          <React.Fragment>
            <TKButton variant="secondary" size="sm" icon={
              <span style={{ width: 14, height: 14 }}>{ICONS.search}</span>
            }>Choose team</TKButton>
            <TKButton variant="primary" size="sm" trailing="→"
              state={selectedState === 'no-available' && !selectedCode ? 'disabled' : 'idle'}>
              {pickIndex >= totalPlayers ? 'Finish round' : 'Next player'}
            </TKButton>
          </React.Fragment>
        ) : (
          <div style={{
            width: '100%', textAlign: 'center',
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.4, textTransform: 'uppercase', lineHeight: 1.5,
          }}>
            {ICONS.spinner(C3.ink50, 12)} Waiting for the pick to be confirmed.
          </div>
        )}
      </div>
    </div>
  );
}

// 1. Picking · admin · auto-selected from top of list
function LivePickingAdmin() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <LiveDrawHeader round={1} total={4} />
        <PickingCard
          round={1}
          player={POOL_PLAYERS[1]}        // Ana
          pickIndex={2}
          totalPlayers={5}
          assigned={[]}
          selectedCode="FR"
          selectedName="France"
          selectedOwner="top of Ana's list"
          selectedState="selected"
          isAdmin={true}
        />
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 2. Picking · admin · second round · already-assigned chips visible
function LivePickingAdminR2() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <LiveDrawHeader round={2} total={4} />
        <PickingCard
          round={2}
          player={POOL_PLAYERS[2]}        // Marko
          pickIndex={3}
          totalPlayers={5}
          assigned={['BR']}
          selectedCode="IT"
          selectedName="Italy"
          selectedOwner="top of Marko's list"
          selectedState="selected"
          isAdmin={true}
        />
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 3. Picking · admin · no available team
function LivePickingNoAvail() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <LiveDrawHeader round={4} total={4} />
        <PickingCard
          round={4}
          player={POOL_PLAYERS[4]}        // Ivan
          pickIndex={5}
          totalPlayers={5}
          assigned={['ES','NL','KR','AU']}
          selectedState="no-available"
          isAdmin={true}
        />
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 4. Picking · non-admin spectator
function LivePickingSpectator() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar avatar="A" />
        <LiveDrawHeader round={1} total={4} />
        <PickingCard
          round={1}
          player={POOL_PLAYERS[2]}        // Marko
          pickIndex={3}
          totalPlayers={5}
          assigned={[]}
          selectedCode="BR"
          selectedName="Brazil"
          selectedOwner="top of Marko's list"
          selectedState="selected"
          isAdmin={false}
        />
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 5. Picking · it's YOUR turn
function LivePickingYou() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <LiveDrawHeader round={1} total={4} />
        <PickingCard
          round={1}
          player={POOL_PLAYERS[0]}        // you (Darko, admin)
          pickIndex={1}
          totalPlayers={5}
          assigned={[]}
          selectedCode="AR"
          selectedName="Argentina"
          selectedOwner="top of your list"
          selectedState="selected"
          isAdmin={true}
          isYou={true}
        />
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// ─────────────────────────── TEAM PICKER BOTTOM SHEET
// Search input · scrollable rows. Used by the admin "Choose Team" CTA when
// the auto-pick is wrong or unavailable.

function TeamPickerRow({ team, taken = false, selected = false, ownerCode }) {
  // ownerCode shown when team is taken — small mono note.
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '40px 1fr auto',
      alignItems: 'center', gap: 12,
      padding: '11px 18px',
      borderBottom: `1px dashed ${C3.ink20}`,
      background: selected ? 'rgba(15,58,53,0.06)' : 'transparent',
      opacity: taken ? 0.45 : 1,
      cursor: taken ? 'not-allowed' : 'pointer',
    }}>
      <FlagSquare code={team.code} size={40} radius={4} />
      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: C3.display, fontSize: 17, color: C3.ink,
          lineHeight: 1.05, letterSpacing: -0.1,
        }}>{team.name}</div>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 0.7, marginTop: 3, textTransform: 'uppercase',
          fontVariantNumeric: 'tabular-nums',
        }}>
          Rank #{String(team.rank).padStart(2, '0')} · {team.code}
          {taken && ownerCode && <> · taken by {ownerCode}</>}
        </div>
      </div>
      {selected ? (
        <span style={{
          width: 28, height: 28, borderRadius: '50%',
          background: C3.ink, color: C3.ticket,
          display: 'grid', placeItems: 'center',
        }}>
          <span style={{ width: 14, height: 14 }}>{ICONS.check}</span>
        </span>
      ) : (taken ? (
        <span style={{
          width: 28, height: 28, borderRadius: '50%',
          border: `1px dashed ${C3.ink20}`, color: C3.ink50,
          display: 'grid', placeItems: 'center',
        }}>
          <span style={{ width: 14, height: 14 }}>{ICONS.lock}</span>
        </span>
      ) : (
        <span style={{ width: 28, height: 28 }} />
      ))}
    </div>
  );
}

function TeamPickerSheet({
  query = '',
  selectedCode = null,
  takenCodes = {},        // { code: ownerInitial }
  height = 540,
  emptyMessage,           // when set, list region is replaced with empty card
}) {
  const filtered = TEAM_POOL.filter(t =>
    !query || t.name.toLowerCase().includes(query.toLowerCase()) ||
    t.code.toLowerCase().includes(query.toLowerCase())
  );
  return (
    <div style={{
      width: 360, height,
      borderTopLeftRadius: 18, borderTopRightRadius: 18,
      ...paperTexture(C3.ticket),
      boxShadow: '0 -16px 40px rgba(20,10,0,0.20)',
      overflow: 'hidden', fontFamily: C3.sans,
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ display: 'grid', placeItems: 'center', padding: '8px 0 0' }}>
        <span style={{ width: 38, height: 4, borderRadius: 2,
          background: C3.ink20 }} />
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 18px 6px',
      }}>
        <div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.6, textTransform: 'uppercase',
          }}>★ Admin pick</div>
          <div style={{
            fontFamily: C3.display, fontSize: 22, color: C3.ink,
            lineHeight: 1.05, marginTop: 2, letterSpacing: -0.3,
          }}>Choose Team</div>
        </div>
        <TKIconButton icon={ICONS.close} variant="quiet" size={32} />
      </div>
      <div style={{ padding: '8px 18px 10px' }}>
        <TKInput
          placeholder="Search team or code"
          value={query}
          leading={ICONS.search}
          state={query ? 'filled' : 'idle'}
        />
      </div>
      <div style={{
        borderTop: `1px dashed ${C3.ink20}`,
        flex: 1, overflow: 'auto', minHeight: 0,
      }}>
        {emptyMessage ? (
          <div style={{ padding: '32px 22px' }}>
            <TKEmpty
              title={emptyMessage}
              body="Every remaining team is already on another roster."
            />
          </div>
        ) : (
          filtered.slice(0, 10).map(t => (
            <TeamPickerRow key={t.code}
              team={t}
              taken={!!takenCodes[t.code]}
              ownerCode={takenCodes[t.code]}
              selected={t.code === selectedCode} />
          ))
        )}
      </div>
      <div style={{
        borderTop: `1px solid ${C3.ink20}`,
        padding: '12px 16px',
        display: 'flex', gap: 8, justifyContent: 'space-between',
      }}>
        <TKButton variant="quiet" size="md">Cancel</TKButton>
        <TKButton variant="primary" size="md" trailing="→"
          state={selectedCode ? 'idle' : 'disabled'}>
          {selectedCode ? `Pick ${selectedCode}` : 'Pick team'}
        </TKButton>
      </div>
    </div>
  );
}

// 6. Picking · with team-picker sheet open
function LivePickingWithSheet() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative',
        ...paperTexture(C3.paper) }}>
        <div style={{ filter: 'blur(0.4px)', opacity: 0.5 }}>
          <TopBar />
          <LiveDrawHeader round={1} total={4} />
          <PickingCard
            round={1}
            player={POOL_PLAYERS[1]}
            pickIndex={2}
            totalPlayers={5}
            assigned={[]}
            selectedCode="FR"
            selectedName="France"
            selectedOwner="top of Ana's list"
            selectedState="selected"
            isAdmin={true}
          />
        </div>
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(15,58,53,0.28)',
        }} />
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          display: 'flex', justifyContent: 'center',
        }}>
          <TeamPickerSheet
            selectedCode="DE"
            takenCodes={{ AR: 'D', FR: 'A', BR: 'M', EN: 'P', ES: 'I' }}
          />
        </div>
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 7. Picker sheet · empty results
function LivePickingSheetEmpty() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative',
        ...paperTexture(C3.paper) }}>
        <div style={{ filter: 'blur(0.4px)', opacity: 0.5 }}>
          <TopBar />
          <LiveDrawHeader round={4} total={4} />
          <PickingCard
            round={4}
            player={POOL_PLAYERS[4]}
            pickIndex={5}
            totalPlayers={5}
            assigned={['ES','NL','KR','AU']}
            selectedState="no-available"
            isAdmin={true}
          />
        </div>
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(15,58,53,0.28)',
        }} />
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          display: 'flex', justifyContent: 'center',
        }}>
          <TeamPickerSheet
            query="zzz"
            emptyMessage="No available teams."
          />
        </div>
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// ─────────────────────────── ROUND SUMMARY
// Card with the round title and per-player rosters.

function PlayerRosterCard({ player, assigned = [], doubleOwned = [], isYou }) {
  return (
    <div style={{
      borderRadius: 10,
      border: `1px solid ${C3.ink20}`,
      padding: '12px 14px',
      background: isYou ? 'rgba(168,57,43,0.05)' : 'transparent',
      display: 'grid',
      gridTemplateColumns: '36px 1fr',
      gap: 12, alignItems: 'flex-start',
    }}>
      <TKAvatar kind={player.kind} initial={player.initial} emoji={player.emoji}
        size={36} ring={isYou ? C3.stamp : undefined} />
      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{
            fontFamily: C3.display, fontSize: 16,
            color: isYou ? C3.stamp : C3.ink,
            lineHeight: 1, letterSpacing: -0.1,
          }}>{player.name.replace(' (you)', '')}{isYou && ' (you)'}</div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.2, textTransform: 'uppercase',
            fontVariantNumeric: 'tabular-nums',
          }}>{assigned.length} {assigned.length === 1 ? 'pick' : 'picks'}</div>
        </div>
        {assigned.length === 0 ? (
          <div style={{
            marginTop: 8,
            padding: '8px 10px',
            border: `1px dashed ${C3.ink20}`,
            borderRadius: 6,
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 0.7,
          }}>No teams assigned yet.</div>
        ) : (
          <div style={{
            marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap',
          }}>
            {assigned.map(code => {
              const t = teamByCode(code);
              if (!t) return null;
              const isDouble = doubleOwned.includes(code);
              return (
                <span key={code} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '4px 8px 4px 4px', borderRadius: 4,
                  background: isDouble ? 'rgba(179,137,46,0.15)' : 'rgba(15,58,53,0.05)',
                  border: isDouble ? `1px solid ${C3.gold}55` : 'none',
                  fontFamily: C3.sans, fontSize: 12, color: C3.ink, fontWeight: 500,
                }}>
                  <span style={{ width: 18, height: 12, borderRadius: 2, overflow: 'hidden',
                    boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.1)' }}>{FLAGS[code]}</span>
                  {code}
                  {isDouble && (
                    <span style={{
                      fontFamily: C3.mono, fontSize: 8, color: C3.gold,
                      letterSpacing: 1, textTransform: 'uppercase', marginLeft: 2,
                    }}>tie</span>
                  )}
                </span>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function RoundSummaryCard({
  round = 1, total = 4, complete = false, gameStart = false,
  assignments, doubleOwned = [],
}) {
  const heading = gameStart ? 'Game started' :
    (round === 1 ? 'First Round complete' :
     round === 2 ? 'Second Round complete' :
     `Round ${round} complete`);
  const totalPicks = Object.values(assignments).reduce((s, arr) => s + arr.length, 0);

  return (
    <div style={{
      margin: '0 16px 18px',
      borderRadius: 16,
      ...paperTexture(C3.ticket),
      boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
      overflow: 'hidden', fontFamily: C3.sans,
    }}>
      <div style={{
        padding: '16px 18px 14px',
        borderBottom: `1px dashed ${C3.ink20}`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 12,
      }}>
        <div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
            letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
          }}>★ {gameStart ? 'Draw complete' : `Round ${round} of ${total}`}</div>
          <div style={{
            fontFamily: C3.display, fontSize: 26, color: C3.ink,
            lineHeight: 1, marginTop: 6, letterSpacing: -0.4, textWrap: 'pretty',
          }}>{heading}</div>
        </div>
        {gameStart && (
          <div style={{
            padding: '5px 10px',
            border: `2px solid ${C3.stamp}`, color: C3.stamp,
            transform: 'rotate(-3deg)',
            fontFamily: C3.display, fontSize: 13, letterSpacing: 1,
            textTransform: 'uppercase', borderRadius: 3, flexShrink: 0,
          }}>filed</div>
        )}
      </div>

      <div style={{
        padding: '12px 16px 6px',
        fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
        letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600,
      }}>
        {totalPicks} {totalPicks === 1 ? 'team' : 'teams'} assigned
        {doubleOwned.length > 0 && (
          <span style={{ color: C3.gold, marginLeft: 8 }}>
            · {doubleOwned.length} double-owned
          </span>
        )}
      </div>

      <div style={{
        padding: '6px 14px 12px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        {POOL_PLAYERS.map(p => (
          <PlayerRosterCard
            key={p.id}
            player={p}
            assigned={assignments[p.id] || []}
            doubleOwned={doubleOwned}
            isYou={p.you}
          />
        ))}
      </div>

      {doubleOwned.length > 0 && (
        <div style={{
          margin: '0 14px 12px',
          padding: '10px 12px',
          background: 'rgba(179,137,46,0.10)',
          border: `1px solid ${C3.gold}40`,
          borderRadius: 8,
          fontFamily: C3.sans, fontSize: 12, color: C3.ink, lineHeight: 1.45,
        }}>
          <span style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.gold,
            letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 700,
          }}>★ Double-owned · {doubleOwned.length}</span>
          <div style={{ marginTop: 4 }}>
            Two players share these teams. On match day, the higher-ranked
            owner's prediction is scored; the lower-ranked owner gets points
            only if their prediction beats both.
          </div>
        </div>
      )}

      <div style={{
        borderTop: `1px dashed ${C3.ink20}`,
        padding: '12px 16px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12,
      }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.4, textTransform: 'uppercase',
        }}>
          {gameStart ? 'All rounds filed' : `${total - round} round${total-round===1?'':'s'} to go`}
        </div>
        {gameStart ? (
          <TKButton variant="primary" size="md" trailing="→">Start Game</TKButton>
        ) : (
          <TKButton variant="primary" size="md" trailing="→">Next round</TKButton>
        )}
      </div>
    </div>
  );
}

// 1. R1 complete — 5 picks
function LiveR1Complete() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <LiveDrawHeader round={1} total={4} />
        <RoundSummaryCard
          round={1} total={4}
          assignments={ASSIGNMENTS_R1_COMPLETE}
          doubleOwned={[]}
        />
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 2. Game started — final draw recap
function LiveGameStarted() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <LiveDrawHeader round={4} total={4} />
        <RoundSummaryCard
          round={4} total={4} gameStart={true}
          assignments={ASSIGNMENTS_FINAL}
          doubleOwned={DOUBLE_OWNED}
        />
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 3. R1 mid — partial assignments to show "no assigned teams yet" state
function LiveR1Mid() {
  // last two players still have nothing
  const partial = {
    darko: ['AR'],
    ana:   ['FR'],
    marko: ['BR'],
    petra: [],
    ivan:  [],
  };
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <LiveDrawHeader round={1} total={4} />
        <RoundSummaryCard
          round={1} total={4}
          assignments={partial}
          doubleOwned={[]}
        />
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

Object.assign(window, {
  LiveDrawHeader, RoundIntroCard, SelectedTeamDisplay, PickingCard,
  TeamPickerRow, TeamPickerSheet,
  PlayerRosterCard, RoundSummaryCard,
  LiveRoundIntroAdmin, LiveRoundIntroNonAdmin,
  LivePickingAdmin, LivePickingAdminR2, LivePickingNoAvail,
  LivePickingSpectator, LivePickingYou,
  LivePickingWithSheet, LivePickingSheetEmpty,
  LiveR1Complete, LiveGameStarted, LiveR1Mid,
});
