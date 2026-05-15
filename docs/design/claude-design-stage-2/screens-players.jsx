// Players and Teams — player view + shared building blocks.
//
// Composition:
//   ShellLive (post-game) or ShellPreDraw (pre-game), TopBar, then:
//   ┌─ PTHeader (eyebrow · "Players and Teams" · subtitle)
//   ├─ Optional GameStartedCard (admin only)
//   ├─ PlayerTicket × N
//   └─ Footer hint
//
// Each PlayerTicket reuses the Match Ticket vocabulary — paper texture,
// dashed tear-line under the player meta, mono metadata, stamped count.

// ─────────────────────────── HEADER
function PTHeader({ subtitle, count = 5 }) {
  return (
    <div style={{ padding: '4px 20px 16px', fontFamily: C3.sans }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
        letterSpacing: 2.2, textTransform: 'uppercase', fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>★ Pool · {count} players</span>
        <span style={{ flex: 1, height: 1, background: C3.ink20 }} />
        <span style={{ color: C3.ink50, letterSpacing: 1.4 }}>32 teams</span>
      </div>
      <div style={{
        fontFamily: C3.display, fontSize: 36, lineHeight: 1,
        color: C3.ink, letterSpacing: -0.6, marginTop: 6,
        textWrap: 'pretty',
      }}>
        Players<br/>and Teams
      </div>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
        letterSpacing: 1.2, marginTop: 8, textTransform: 'uppercase',
      }}>{subtitle}</div>
    </div>
  );
}

// ─────────────────────────── PT TEAM CHIP
// Slim 2-up team chip used inside PlayerTicket. Optional remove × in
// admin mode. Disabled variant = "deleting" while server round-trips.
function PTChip({ code, name, onRemove, disabled }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 8px 6px 6px', borderRadius: 6,
      border: `1px ${disabled ? 'dashed' : 'solid'} ${C3.ink20}`,
      background: C3.ticket,
      fontFamily: C3.sans, minWidth: 0,
      opacity: disabled ? 0.55 : 1,
      position: 'relative',
    }}>
      <FlagSquare code={code} size={28} radius={3} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 8, color: C3.ink50,
          letterSpacing: 1.2, textTransform: 'uppercase', lineHeight: 1,
        }}>{code}</div>
        <div style={{
          fontFamily: C3.display, fontSize: 14, color: C3.ink, lineHeight: 1.1,
          marginTop: 2, letterSpacing: -0.1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</div>
      </div>
      {onRemove && (
        <button aria-label={`Remove ${name}`} style={{
          width: 22, height: 22, borderRadius: '50%', padding: 0,
          border: `1px solid ${C3.ink20}`,
          background: C3.paper, color: C3.ink70, cursor: 'pointer',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <span style={{ width: 12, height: 12 }}>{ICONS.close}</span>
        </button>
      )}
    </div>
  );
}

// ─────────────────────────── PLAYER TICKET
// One paper card per player. Variants:
//   variant: 'player' (read-only) | 'admin' (×, add, delete)
//   state:   'idle' | 'confirmDelete' | 'deleting'
function PlayerTicket({
  player, codes, variant = 'player',
  showAdd, addOpen, addQuery = '',
  noAvailable, state = 'idle',
  total = TEAMS_PER_PLAYER,
}) {
  const isAdmin = variant === 'admin';
  const filled = codes.length;
  const slots  = isAdmin ? total : Math.max(total, filled);
  const empty  = filled === 0 && !isAdmin;
  const deleting = state === 'deleting';

  // Available teams stub for the inline picker preview.
  const sampleAvail = [
    { code: 'CO', name: 'Colombia' },
    { code: 'JP', name: 'Japan'    },
    { code: 'CH', name: 'Switzerland' },
    { code: 'DK', name: 'Denmark'  },
  ];
  const searchHits = addQuery ? sampleAvail.filter(t =>
    t.name.toLowerCase().includes(addQuery.toLowerCase()) ||
    t.code.toLowerCase().includes(addQuery.toLowerCase())) : sampleAvail;

  return (
    <div style={{
      margin: '0 16px 14px',
      borderRadius: 14, position: 'relative',
      ...paperTexture(C3.ticket),
      boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
      overflow: 'hidden',
      fontFamily: C3.sans,
      opacity: deleting ? 0.55 : 1,
      filter: deleting ? 'grayscale(0.2)' : 'none',
      transition: 'opacity 200ms',
    }}>
      {/* Top meta row */}
      <div style={{
        padding: '12px 14px 11px',
        display: 'flex', alignItems: 'center', gap: 12,
        position: 'relative',
      }}>
        <TKAvatar kind={player.kind} initial={player.initial} emoji={player.emoji} size={40} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
            <div style={{
              fontFamily: C3.display, fontSize: 19, color: C3.ink,
              lineHeight: 1, letterSpacing: -0.2,
            }}>{player.name}</div>
            {player.admin && (
              <span style={{
                fontFamily: C3.mono, fontSize: 8, color: C3.stamp,
                letterSpacing: 1.4, textTransform: 'uppercase',
                fontWeight: 700, border: `1px solid ${C3.stamp}`,
                padding: '1px 5px', borderRadius: 2, lineHeight: 1.3,
              }}>Admin</span>
            )}
          </div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 4,
          }}>
            {empty ? 'No assigned teams' : `${filled}/${slots} teams`}
          </div>
        </div>

        {/* Team count stamp (compact) */}
        <div style={{
          fontFamily: C3.display, fontSize: 22, color: C3.ink,
          lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          letterSpacing: -0.5, textAlign: 'right',
        }}>
          {filled}<span style={{ color: C3.ink50, fontSize: 14 }}>/{slots}</span>
        </div>

        {/* Admin delete icon */}
        {isAdmin && state !== 'confirmDelete' && !deleting && (
          <button aria-label={`Delete ${player.name}`} style={{
            width: 30, height: 30, borderRadius: 6, padding: 0,
            border: `1px dashed ${C3.ink20}`,
            background: 'transparent', color: C3.stamp, cursor: 'pointer',
            display: 'grid', placeItems: 'center', marginLeft: 4,
          }}>
            <span style={{ width: 16, height: 16 }}>{ICONS.trash}</span>
          </button>
        )}
      </div>

      {/* Inline delete confirmation row (admin only) */}
      {state === 'confirmDelete' && (
        <div style={{
          margin: '0 14px 10px', padding: '8px 10px',
          background: 'rgba(168,57,43,0.08)',
          border: `1px solid ${C3.stamp}40`,
          borderLeft: `3px solid ${C3.stamp}`,
          borderRadius: 6,
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: C3.sans, fontSize: 13, color: C3.ink,
        }}>
          <span style={{ width: 16, height: 16, color: C3.stamp }}>{ICONS.alert}</span>
          <span style={{ flex: 1, fontWeight: 600 }}>Delete?</span>
          <button style={{
            padding: '5px 11px', borderRadius: 4, border: 'none',
            background: C3.stamp, color: C3.ticket, cursor: 'pointer',
            fontFamily: C3.mono, fontSize: 10, fontWeight: 700,
            letterSpacing: 1.4, textTransform: 'uppercase',
          }}>Yes</button>
          <button style={{
            padding: '5px 11px', borderRadius: 4,
            border: `1px solid ${C3.ink}`, background: 'transparent',
            color: C3.ink, cursor: 'pointer',
            fontFamily: C3.mono, fontSize: 10, fontWeight: 700,
            letterSpacing: 1.4, textTransform: 'uppercase',
          }}>No</button>
        </div>
      )}

      {/* Tear line */}
      <div style={{ position: 'relative', height: 0 }}>
        <div style={{
          position: 'absolute', left: -10, top: -10, width: 20, height: 20,
          borderRadius: '50%', background: C3.paper,
        }} />
        <div style={{
          position: 'absolute', right: -10, top: -10, width: 20, height: 20,
          borderRadius: '50%', background: C3.paper,
        }} />
        <div style={{
          position: 'absolute', left: 14, right: 14, top: -1,
          borderTop: `1.5px dashed ${C3.ink20}`,
        }} />
      </div>

      {/* Teams grid or empty */}
      <div style={{ padding: '14px 12px 12px' }}>
        {empty ? (
          <div style={{
            padding: '14px 12px',
            border: `1.5px dashed ${C3.ink20}`,
            borderRadius: 8, textAlign: 'center',
            fontFamily: C3.mono, fontSize: 10, color: C3.ink50,
            letterSpacing: 1.6, textTransform: 'uppercase',
          }}>No assigned teams</div>
        ) : codes.length === 0 ? (
          // admin · player with 0 teams · render as a dashed slot
          <div style={{
            padding: '12px',
            border: `1.5px dashed ${C3.ink20}`,
            borderRadius: 8, textAlign: 'center',
            fontFamily: C3.mono, fontSize: 10, color: C3.ink50,
            letterSpacing: 1.4, textTransform: 'uppercase',
          }}>Awaiting first pick</div>
        ) : (
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
          }}>
            {codes.map(code => (
              <PTChip
                key={code}
                code={code}
                name={teamByCode(code)?.name || code}
                onRemove={isAdmin ? () => {} : null}
                disabled={deleting}
              />
            ))}
          </div>
        )}

        {/* Add team action */}
        {isAdmin && showAdd && !addOpen && !deleting && (
          <button style={{
            marginTop: codes.length ? 10 : 0,
            width: '100%', padding: '9px 12px',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            gap: 8, borderRadius: 6,
            border: `1.5px dashed ${C3.ink}`, background: 'transparent',
            color: C3.ink, cursor: 'pointer',
            fontFamily: C3.mono, fontSize: 10, fontWeight: 700,
            letterSpacing: 1.4, textTransform: 'uppercase',
          }}>
            <span style={{ width: 14, height: 14 }}>{ICONS.plus}</span>
            Add Team
          </button>
        )}

        {/* Inline expanded team picker */}
        {addOpen && (
          <div style={{
            marginTop: codes.length ? 10 : 0,
            border: `1.5px solid ${C3.ink}`,
            borderRadius: 8, background: C3.ticket,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '8px 10px',
              borderBottom: `1px dashed ${C3.ink20}`,
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 16, height: 16, color: C3.ink70 }}>
                {ICONS.search}
              </span>
              <input
                defaultValue={addQuery}
                placeholder="Search teams"
                style={{
                  flex: 1, border: 'none', outline: 'none',
                  background: 'transparent', padding: 0,
                  fontFamily: C3.sans, fontSize: 13, color: C3.ink,
                }}
              />
              <button aria-label="Close picker" style={{
                width: 22, height: 22, padding: 0, border: 'none',
                background: 'transparent', color: C3.ink50, cursor: 'pointer',
                display: 'grid', placeItems: 'center',
              }}>
                <span style={{ width: 14, height: 14 }}>{ICONS.close}</span>
              </button>
            </div>

            {noAvailable || searchHits.length === 0 ? (
              <div style={{
                padding: '14px 12px', textAlign: 'center',
                fontFamily: C3.mono, fontSize: 10, color: C3.ink50,
                letterSpacing: 1.4, textTransform: 'uppercase',
              }}>
                No available teams.
                <div style={{
                  fontFamily: C3.sans, fontSize: 11, color: C3.ink70,
                  marginTop: 6, letterSpacing: 0, textTransform: 'none',
                }}>Every team in the pool is already assigned to a player.</div>
              </div>
            ) : (
              <div>
                {searchHits.slice(0, 4).map((t, i) => (
                  <div key={t.code} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px',
                    borderBottom: i < Math.min(3, searchHits.length - 1)
                      ? `1px dashed ${C3.ink20}` : 'none',
                    cursor: 'pointer',
                  }}>
                    <FlagSquare code={t.code} size={26} radius={3} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: C3.display, fontSize: 14, color: C3.ink,
                        lineHeight: 1.1,
                      }}>{t.name}</div>
                      <div style={{
                        fontFamily: C3.mono, fontSize: 8, color: C3.ink50,
                        letterSpacing: 1.2, marginTop: 2, textTransform: 'uppercase',
                      }}>{t.code} · {confedOf(t.code)}</div>
                    </div>
                    <span style={{
                      fontFamily: C3.mono, fontSize: 9, color: C3.ink70,
                      letterSpacing: 1.4, textTransform: 'uppercase',
                    }}>Pick</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────── LOADING SKELETON
function PlayerTicketSkeleton() {
  const bar = (w, h = 10) => (
    <span style={{
      display: 'inline-block', width: w, height: h, borderRadius: 2,
      background: 'rgba(15,58,53,0.08)',
    }} />
  );
  return (
    <div style={{
      margin: '0 16px 14px',
      borderRadius: 14, ...paperTexture(C3.ticket),
      boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
      overflow: 'hidden', animation: 'tkPulse 1.6s ease-in-out infinite',
    }}>
      <div style={{
        padding: '12px 14px 11px', display: 'flex',
        alignItems: 'center', gap: 12,
      }}>
        <span style={{ width: 40, height: 40, borderRadius: '50%',
          background: 'rgba(15,58,53,0.08)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          {bar(110, 14)} {bar(64, 8)}
        </div>
        {bar(44, 22)}
      </div>
      <div style={{ position: 'relative', height: 0 }}>
        <div style={{ position: 'absolute', left: -10, top: -10, width: 20, height: 20,
          borderRadius: '50%', background: C3.paper }} />
        <div style={{ position: 'absolute', right: -10, top: -10, width: 20, height: 20,
          borderRadius: '50%', background: C3.paper }} />
        <div style={{ position: 'absolute', left: 14, right: 14, top: -1,
          borderTop: `1.5px dashed ${C3.ink20}` }} />
      </div>
      <div style={{
        padding: '14px 12px 14px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8,
      }}>
        {[0,1,2,3].map(i => (
          <span key={i} style={{
            height: 44, borderRadius: 6, background: 'rgba(15,58,53,0.06)',
            border: `1px solid ${C3.ink20}`,
          }} />
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────── GAME STARTED CARD
// Admin-only switch above the player list.
// state: 'off' | 'on' | 'loading' | 'disabled'
function GameStartedCard({ state = 'off', onClickStop }) {
  const on  = state === 'on' || state === 'loading';
  const sub = state === 'on'      ? 'Since 11 Jun 2026, 9:00 PM'
            : state === 'loading' ? 'Saving change…'
            : state === 'disabled'? 'Not yet — start the draw first'
            : 'Points are not counted';

  return (
    <div style={{
      margin: '0 16px 14px',
      borderRadius: 14,
      ...paperTexture(C3.ticket),
      boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
      overflow: 'hidden',
      fontFamily: C3.sans,
    }}>
      <div style={{
        padding: '12px 14px',
        display: 'flex', alignItems: 'center', gap: 12,
        opacity: state === 'disabled' ? 0.55 : 1,
      }}>
        {/* Toggle */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <span style={{
            display: 'inline-block',
            width: 50, height: 28, borderRadius: 14, position: 'relative',
            background: on ? C3.ink : 'transparent',
            border: `1.5px solid ${on ? C3.ink : C3.ink20}`,
            transition: 'background 150ms',
            opacity: state === 'loading' ? 0.55 : 1,
          }}>
            <span style={{
              position: 'absolute', top: 2, left: on ? 23 : 2,
              width: 21, height: 21, borderRadius: '50%',
              background: on ? C3.ticket : C3.ink70,
              transition: 'left 150ms',
            }} />
          </span>
          {state === 'loading' && (
            <span style={{
              position: 'absolute', top: -2, left: 14,
              width: 32, height: 32,
            }}>{ICONS.spinner(C3.ink, 32)}</span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: on ? C3.ink : C3.ink50,
            letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 700,
          }}>{on ? '★ Game started' : 'Game started'}</div>
          <div style={{
            fontFamily: C3.display, fontSize: 16, color: C3.ink,
            lineHeight: 1.1, marginTop: 2,
            fontVariantNumeric: 'tabular-nums',
          }}>{sub}</div>
        </div>

        {state === 'on' && (
          <button onClick={onClickStop} style={{
            padding: '6px 10px', borderRadius: 4,
            border: `1.5px solid ${C3.stamp}`, background: 'transparent',
            color: C3.stamp, cursor: 'pointer',
            fontFamily: C3.mono, fontSize: 9, fontWeight: 700,
            letterSpacing: 1.4, textTransform: 'uppercase',
            flexShrink: 0,
          }}>Stop</button>
        )}
      </div>

      {state === 'off' && (
        <div style={{
          padding: '8px 14px 11px',
          borderTop: `1px dashed ${C3.ink20}`,
          fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.2, lineHeight: 1.6,
        }}>
          Flip on once the tournament kicks off. Predictions submitted
          before this point are kept as drafts.
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── ADMIN ACTION ROW
// Replace Team button row above the player list.
function ReplaceTeamRow({ onClickReplace }) {
  return (
    <div style={{
      margin: '0 16px 14px',
      padding: '11px 14px 11px 12px',
      border: `1.5px dashed ${C3.ink20}`,
      borderRadius: 12,
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: C3.sans,
    }}>
      <span style={{
        width: 30, height: 30, borderRadius: 6,
        border: `1.5px solid ${C3.ink}`, color: C3.ink,
        display: 'grid', placeItems: 'center',
      }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
          <path d="M4 7h11M15 7l-3-3M15 7l-3 3M20 17H9M9 17l3 3M9 17l3-3"
            stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: C3.display, fontSize: 15, color: C3.ink, lineHeight: 1.05,
        }}>Replace a team</div>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.2, marginTop: 3, textTransform: 'uppercase',
        }}>Withdrawal · sub in from outside pool</div>
      </div>
      <button onClick={onClickReplace} style={{
        padding: '8px 12px', borderRadius: 4,
        border: 'none', background: C3.ink, color: C3.ticket,
        fontFamily: C3.mono, fontSize: 10, fontWeight: 700,
        letterSpacing: 1.6, textTransform: 'uppercase',
        cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
      }}>
        Replace
        <span style={{ fontFamily: C3.display, fontSize: 13 }}>→</span>
      </button>
    </div>
  );
}

// ─────────────────────────── FOOTER HINT
function PTFooter({ kind = 'player' }) {
  const text = kind === 'admin'
    ? 'Removing a team frees it back to the pool. Deleting a player removes their predictions too.'
    : 'Teams were assigned during the live draw on 10 Jun 2026.';
  return (
    <div style={{
      margin: '4px 16px 18px',
      padding: '10px 12px',
      fontFamily: C3.mono, fontSize: 10, color: C3.ink50,
      letterSpacing: 0.6, lineHeight: 1.55,
      border: `1px dashed ${C3.ink20}`, borderRadius: 8,
    }}>
      {text}
    </div>
  );
}

// ═══════════════════════════ PLAYER VIEW · STATES

// 1. All-assigned default (post-game-started)
function PlayersAllAssigned() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <PTHeader subtitle="Assigned teams" />
        {POOL_PLAYERS_READY.map(p => (
          <PlayerTicket key={p.id} player={p} codes={PT_ASSIGNED[p.id]} variant="player" />
        ))}
        <PTFooter kind="player" />
      </div>
      <BottomNav variant="live" activeId="players" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 2. Loading
function PlayersLoading() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <PTHeader subtitle="Assigned teams" />
        {[0,1,2,3,4].map(i => <PlayerTicketSkeleton key={i} />)}
      </div>
      <BottomNav variant="live" activeId="players" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 3. Partial (mid-draw)
function PlayersPartial() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <PTHeader subtitle="Assigned teams" />
        {POOL_PLAYERS_READY.map(p => (
          <PlayerTicket key={p.id} player={p} codes={PT_PARTIAL[p.id]} variant="player" />
        ))}
      </div>
      <BottomNav variant="pre" activeId="players" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

Object.assign(window, {
  PTHeader, PTChip, PlayerTicket, PlayerTicketSkeleton,
  GameStartedCard, ReplaceTeamRow, PTFooter,
  PlayersAllAssigned, PlayersLoading, PlayersPartial,
});
