// Draw setup / list-prep / draft-day surface.
//
// Composition (full screen, scrollable):
//   TopBar
//   DrawHeader        (eyebrow / title / phase-subtitle)
//   [Error banner]    (optional)
//   AdminSetupCard    (teams-per-player, metrics, Start Draw)
//   ReadinessCard     (X/Y ready · privacy copy)
//   ReadinessList     (player rows · ready check / waiting circle)

// ─────────────────────────── DRAW HEADER
// Phase label drives the eyebrow + subtitle copy. Title stays "Draw" so
// the page identity doesn't shift.
function DrawHeader({ phase = 'list-prep', subtitleOverride }) {
  const phases = {
    'list-prep':   { eyebrow: 'List prep',     line: 'Get your team order ready.' },
    'draft-day':   { eyebrow: 'Draft day',     line: 'Lists are in. Admin can start any time.' },
    'in-progress': { eyebrow: 'Round in play', line: 'Tap Live draw to follow along.' },
    'complete':    { eyebrow: 'Draw complete', line: 'All teams are assigned. Group stage opens at kick-off.' },
  };
  const p = phases[phase];
  return (
    <div style={{ padding: '4px 20px 14px', fontFamily: C3.sans }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
        letterSpacing: 2.2, textTransform: 'uppercase', fontWeight: 700,
      }}>★ {p.eyebrow}</div>
      <div style={{
        fontFamily: C3.display, fontSize: 36, lineHeight: 1,
        color: C3.ink, letterSpacing: -0.6, marginTop: 4,
      }}>Draw</div>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
        letterSpacing: 0.7, marginTop: 8, lineHeight: 1.55,
      }}>{subtitleOverride || p.line}</div>
    </div>
  );
}

// ─────────────────────────── ADMIN SETUP CARD
// Paper ticket. Top half: teams-per-player picker + save row.
// Tear line. Bottom half: metrics + Start Draw + readiness counter.
//
// state: 'editable' | 'saved' | 'invalid' | 'locked'
function AdminSetupCard({
  teamsPerPlayer = 4,
  saveState = 'saved',      // editable | saved | saving | error
  invalid = false,          // teams * players > pool size
  startEnabled = false,
  readinessCount = '3/5',
  metrics = { players: 5, teams: 20, doubleOwned: 12 },
}) {
  const range = '2 – 8 per player';
  return (
    <div style={{
      margin: '0 16px 18px',
      borderRadius: 16, position: 'relative',
      ...paperTexture(C3.ticket),
      boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
      overflow: 'hidden',
      fontFamily: C3.sans,
    }}>
      {/* Top strip — admin label + identifier */}
      <div style={{
        padding: '12px 16px 10px',
        borderBottom: `1px solid ${C3.ink20}`,
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        gap: 12,
      }}>
        <div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
            letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
          }}>★ Admin · setup</div>
          <div style={{
            fontFamily: C3.display, fontSize: 19, color: C3.ink,
            lineHeight: 1.1, marginTop: 3, letterSpacing: -0.2,
          }}>Draw parameters</div>
        </div>
        <span style={{
          padding: '4px 8px', borderRadius: 4,
          border: `1px dashed ${C3.ink20}`,
          fontFamily: C3.mono, fontSize: 9, color: C3.ink70,
          letterSpacing: 1.2, textTransform: 'uppercase',
        }}>Pool #042</span>
      </div>

      {/* Teams per player */}
      <div style={{ padding: '14px 16px 12px' }}>
        <FieldLabel hint={range}>Teams per player</FieldLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            display: 'flex', alignItems: 'center',
            border: `1.5px solid ${invalid ? C3.stamp : C3.ink}`,
            borderRadius: 6, background: C3.ticket,
            padding: '4px',
            boxShadow: invalid ? '0 0 0 3px rgba(168,57,43,0.10)' : '0 0 0 3px rgba(15,58,53,0.06)',
          }}>
            <button style={{
              width: 30, height: 30, borderRadius: 4, border: 'none',
              background: 'transparent', color: C3.ink70, cursor: 'pointer',
              display: 'grid', placeItems: 'center', padding: 0,
            }}>
              <span style={{ width: 16, height: 16 }}>{LIST_ICONS.minus}</span>
            </button>
            <div style={{
              minWidth: 50, textAlign: 'center',
              fontFamily: C3.display, fontSize: 30, color: C3.ink,
              lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: 0.3,
            }}>{teamsPerPlayer}</div>
            <button style={{
              width: 30, height: 30, borderRadius: 4, border: 'none',
              background: 'transparent', color: C3.ink, cursor: 'pointer',
              display: 'grid', placeItems: 'center', padding: 0,
              fontFamily: C3.display, fontSize: 22, lineHeight: 1,
            }}>+</button>
          </div>
          <div style={{ flex: 1 }} />
          {saveState === 'editable' && <TKButton variant="primary" size="sm">Save</TKButton>}
          {saveState === 'saved'    && <TKButton variant="secondary" size="sm" state="success">Saved</TKButton>}
          {saveState === 'saving'   && <TKButton variant="primary" size="sm" state="loading">Saving</TKButton>}
          {saveState === 'error'    && <TKButton variant="destructive" size="sm">Retry</TKButton>}
        </div>
        {invalid && (
          <FieldHelp tone="error">
            Not possible with this player count. {metrics.players} × {teamsPerPlayer} = {metrics.players * teamsPerPlayer},
            but only {metrics.teams >= 32 ? 32 : metrics.teams} teams in the pool.
          </FieldHelp>
        )}
      </div>

      {/* Tear line */}
      <div style={{ position: 'relative', height: 0 }}>
        <div style={{ position: 'absolute', left: -10, top: -10, width: 20, height: 20, borderRadius: '50%', background: C3.paper }} />
        <div style={{ position: 'absolute', right: -10, top: -10, width: 20, height: 20, borderRadius: '50%', background: C3.paper }} />
        <div style={{ position: 'absolute', left: 14, right: 14, top: -1, borderTop: `1.5px dashed ${C3.ink20}` }} />
      </div>

      {/* Metrics */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr',
        padding: '16px 14px 6px',
      }}>
        {[
          { label: 'Players',      value: metrics.players },
          { label: 'Teams',        value: metrics.teams },
          { label: 'Double-owned', value: metrics.doubleOwned, hint: 'tie-break' },
        ].map((m, i) => (
          <div key={m.label} style={{
            textAlign: i === 0 ? 'left' : (i === 1 ? 'center' : 'right'),
            padding: '0 2px',
          }}>
            <div style={{
              fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600,
            }}>{m.label}</div>
            <div style={{
              fontFamily: C3.display, fontSize: 28, color: C3.ink,
              lineHeight: 1, marginTop: 4,
              fontVariantNumeric: 'tabular-nums', letterSpacing: 0.3,
            }}>{m.value}</div>
            {m.hint && (
              <div style={{
                fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
                letterSpacing: 0.6, marginTop: 4,
              }}>{m.hint}</div>
            )}
          </div>
        ))}
      </div>

      {/* Start Draw + readiness counter */}
      <div style={{
        borderTop: `1px dashed ${C3.ink20}`,
        padding: '12px 16px 14px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, marginTop: 10,
      }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
          letterSpacing: 1, lineHeight: 1.5, textTransform: 'uppercase', fontWeight: 600,
        }}>
          <span style={{ color: C3.stamp }}>★</span> {readinessCount} ready<br/>
          <span style={{ color: C3.ink50, letterSpacing: 0.6,
            textTransform: 'none', fontWeight: 400 }}>
            players have saved a list
          </span>
        </div>
        <TKButton
          variant="primary" size="md" trailing="→"
          state={startEnabled ? 'idle' : 'disabled'}
        >Start Draw</TKButton>
      </div>
    </div>
  );
}

// ─────────────────────────── READINESS CARD
// Compact, sits below the admin card (or by itself for non-admins).
function ReadinessCard({ ready = 3, total = 5 }) {
  const pct = Math.round((ready / total) * 100);
  return (
    <div style={{
      margin: '0 16px 14px',
      borderRadius: 12,
      ...paperTexture(C3.ticket),
      boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 4px 12px rgba(50,30,10,0.06)',
      padding: '14px 16px',
      fontFamily: C3.sans,
    }}>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
            letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
          }}>★ Readiness</div>
          <div style={{
            fontFamily: C3.display, fontSize: 24, color: C3.ink,
            lineHeight: 1, marginTop: 4, letterSpacing: -0.3,
            fontVariantNumeric: 'tabular-nums',
          }}>{ready}/{total} ready</div>
        </div>
        <div style={{
          fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
          letterSpacing: 1.2, textTransform: 'uppercase',
          fontVariantNumeric: 'tabular-nums',
        }}>{pct}%</div>
      </div>
      {/* progress bar (mono-style ticked rule) */}
      <div style={{
        marginTop: 10, height: 4, borderRadius: 2,
        background: C3.ink20, overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`, height: '100%', background: C3.ink,
        }} />
      </div>
      <div style={{
        marginTop: 8, fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
        letterSpacing: 0.7, lineHeight: 1.45,
      }}>
        Lists stay private until the draw starts.
      </div>
    </div>
  );
}

// ─────────────────────────── READINESS LIST
// One row per player. Right-side check or empty circle.
function ReadinessList({ players = POOL_PLAYERS, locked = false }) {
  return (
    <div style={{ margin: '0 16px 18px', fontFamily: C3.sans }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
        letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600,
        padding: '0 2px 8px',
      }}>Players</div>
      <div style={{
        borderRadius: 12, overflow: 'hidden',
        ...paperTexture(C3.ticket),
        boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 4px 12px rgba(50,30,10,0.06)',
      }}>
        {players.map((p, i) => (
          <div key={p.id} style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '11px 14px',
            borderBottom: i < players.length - 1 ? `1px dashed ${C3.ink20}` : 'none',
            background: p.you ? 'rgba(168,57,43,0.05)' : 'transparent',
          }}>
            <TKAvatar
              kind={p.kind} initial={p.initial} emoji={p.emoji}
              size={32} ring={p.you ? C3.stamp : undefined} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontFamily: C3.display, fontSize: 16,
                color: p.you ? C3.stamp : C3.ink,
                lineHeight: 1, letterSpacing: -0.1,
              }}>
                {p.name}
                {p.admin && (
                  <span style={{
                    padding: '2px 5px', borderRadius: 3,
                    border: `1px solid ${C3.ink20}`,
                    fontFamily: C3.mono, fontSize: 8, color: C3.ink70,
                    letterSpacing: 1.2, textTransform: 'uppercase',
                  }}>Admin</span>
                )}
              </div>
              <div style={{
                fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
                letterSpacing: 1, marginTop: 3, textTransform: 'uppercase',
              }}>
                {p.ready ? 'List saved' : 'No list saved yet'}
              </div>
            </div>
            {/* Right-side check or empty circle */}
            {p.ready ? (
              <span style={{
                width: 26, height: 26, borderRadius: '50%',
                background: 'rgba(31,106,77,0.12)', color: '#1f6a4d',
                border: '1.5px solid #1f6a4d',
                display: 'grid', placeItems: 'center',
              }}>
                <span style={{ width: 14, height: 14 }}>{ICONS.check}</span>
              </span>
            ) : (
              <span style={{
                width: 26, height: 26, borderRadius: '50%',
                border: `1.5px dashed ${C3.ink20}`,
                background: 'transparent',
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────── DRAW · STATES

// 1. List prep · admin (some players still missing lists)
function DrawListPrepAdmin() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <DrawHeader phase="list-prep" />
        <AdminSetupCard
          teamsPerPlayer={4}
          saveState="saved"
          startEnabled={false}
          readinessCount="3/5"
          metrics={{ players: 5, teams: 20, doubleOwned: 12 }}
        />
        <ReadinessCard ready={3} total={5} />
        <ReadinessList />
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 2. Draft day · admin · all ready, Start enabled
function DrawDraftDayAdmin() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <DrawHeader phase="draft-day" />
        <AdminSetupCard
          teamsPerPlayer={4}
          saveState="saved"
          startEnabled={true}
          readinessCount="5/5"
          metrics={{ players: 5, teams: 20, doubleOwned: 12 }}
        />
        <ReadinessCard ready={5} total={5} />
        <ReadinessList players={POOL_PLAYERS_READY} />
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 3. Invalid — "Not possible with this player count."
function DrawInvalid() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <DrawHeader phase="list-prep" />
        <div style={{ padding: '0 16px 12px' }}>
          <TKBanner
            tone="warning"
            title="Math doesn't fit"
            body="With 5 players × 8 teams = 40 picks, you'd need 40 teams in the pool. You currently have 32. Lower teams per player or invite fewer players."
          />
        </div>
        <AdminSetupCard
          teamsPerPlayer={8}
          saveState="editable"
          invalid={true}
          startEnabled={false}
          readinessCount="3/5"
          metrics={{ players: 5, teams: 32, doubleOwned: 0 }}
        />
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 4. Non-admin · waiting (no setup card, just readiness)
function DrawNonAdmin() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar avatar="A" />
        <DrawHeader
          phase="list-prep"
          subtitleOverride="Admin will start the draw once everyone has saved a list."
        />
        <div style={{
          margin: '0 16px 16px',
          ...paperTexture(C3.ticket),
          borderRadius: 14,
          boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
          padding: '16px 18px', fontFamily: C3.sans,
        }}>
          <div style={{
            fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
            letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
          }}>★ Your list</div>
          <div style={{
            fontFamily: C3.display, fontSize: 22, color: C3.ink,
            lineHeight: 1.05, marginTop: 6, letterSpacing: -0.3, textWrap: 'pretty',
          }}>Saved · 32 teams in your draft order.</div>
          <div style={{
            fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
            letterSpacing: 0.7, marginTop: 8, lineHeight: 1.5,
          }}>
            You can keep editing My List until the admin starts the draw.
            We'll notify you the moment it goes live.
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
            <TKButton variant="secondary" size="sm">Edit my list</TKButton>
            <TKButton variant="quiet" size="sm">Notify pool</TKButton>
          </div>
        </div>
        <ReadinessCard ready={3} total={5} />
        <ReadinessList />
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 5. Complete — admin sees a stamped receipt + link to live draw recap
function DrawComplete() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <DrawHeader phase="complete" />
        <div style={{
          margin: '0 16px 18px',
          ...paperTexture(C3.ticket),
          borderRadius: 16, position: 'relative',
          boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
          overflow: 'hidden',
          padding: '24px 18px 18px', fontFamily: C3.sans, textAlign: 'center',
        }}>
          <div style={{
            display: 'inline-block', padding: '6px 14px',
            border: `2.5px solid ${C3.stamp}`, color: C3.stamp,
            transform: 'rotate(-3deg)',
            fontFamily: C3.display, fontSize: 18, letterSpacing: 1.2,
            textTransform: 'uppercase', borderRadius: 3,
          }}>Draw complete · 20 picks</div>
          <div style={{
            fontFamily: C3.display, fontSize: 28, color: C3.ink,
            lineHeight: 1.05, marginTop: 16, letterSpacing: -0.4,
            textWrap: 'pretty',
          }}>All teams assigned.</div>
          <div style={{
            fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
            letterSpacing: 0.7, marginTop: 8, lineHeight: 1.55,
            fontVariantNumeric: 'tabular-nums',
          }}>
            5 players · 4 teams each · 12 double-owned.<br/>
            Group stage opens at the first kick-off.
          </div>
          <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <TKButton variant="secondary" size="sm">Draw recap</TKButton>
            <TKButton variant="primary" size="sm" trailing="→">Go to home</TKButton>
          </div>
        </div>
        <ReadinessList players={POOL_PLAYERS_READY} locked />
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// ─────────────────────────── TEAMS-PER-PLAYER WHEEL SHEET
function TeamsPerPlayerSheet({ value = 4, min = 2, max = 8 }) {
  // Use the same wheel idea as the position picker, but with fewer slots.
  const around = [-2, -1, 0, 1, 2];
  return (
    <div style={{
      width: 360, borderTopLeftRadius: 18, borderTopRightRadius: 18,
      ...paperTexture(C3.ticket),
      boxShadow: '0 -16px 40px rgba(20,10,0,0.20)',
      overflow: 'hidden', fontFamily: C3.sans,
    }}>
      <div style={{ display: 'grid', placeItems: 'center', padding: '8px 0 0' }}>
        <span style={{ width: 38, height: 4, borderRadius: 2,
          background: C3.ink20 }} />
      </div>
      <div style={{ padding: '8px 18px 12px' }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.6, textTransform: 'uppercase',
        }}>★ Admin · set</div>
        <div style={{
          fontFamily: C3.display, fontSize: 22, color: C3.ink,
          lineHeight: 1.05, marginTop: 4, letterSpacing: -0.3,
        }}>Teams per player</div>
        <div style={{
          fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
          letterSpacing: 0.7, marginTop: 8, lineHeight: 1.5,
          fontVariantNumeric: 'tabular-nums',
        }}>
          Allowed: {min} – {max} · pool has 32 teams.
        </div>
      </div>

      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 14, padding: '6px 0 16px',
        borderTop: `1px dashed ${C3.ink20}`,
        borderBottom: `1px dashed ${C3.ink20}`,
      }}>
        <button aria-label="Up" style={{
          width: 36, height: 36, borderRadius: '50%',
          border: `1px solid ${C3.ink20}`, color: C3.ink70,
          background: 'transparent', display: 'grid', placeItems: 'center',
          cursor: 'pointer', padding: 0,
        }}>
          <span style={{ width: 16, height: 16 }}>{LIST_ICONS.arrowUp}</span>
        </button>
        <div style={{
          position: 'relative',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
          padding: '8px 18px',
        }}>
          <div style={{
            position: 'absolute', left: 0, right: 0,
            top: '50%', transform: 'translateY(-50%)',
            height: 42, borderRadius: 4, background: C3.ink, zIndex: 0,
          }} />
          {around.map(d => {
            const n = value + d;
            if (n < min || n > max) {
              return <div key={d} style={{ height: 30, width: 60 }} />;
            }
            const isSel = d === 0;
            return (
              <div key={d} style={{
                height: isSel ? 42 : 30, width: 80, zIndex: 1,
                display: 'grid', placeItems: 'center',
                fontFamily: C3.display,
                fontSize: isSel ? 32 : 22,
                color: isSel ? C3.ticket : C3.ink50,
                opacity: isSel ? 1 : Math.max(0.3, 1 - Math.abs(d) * 0.3),
                fontVariantNumeric: 'tabular-nums', lineHeight: 1,
              }}>{n}</div>
            );
          })}
        </div>
        <button aria-label="Down" style={{
          width: 36, height: 36, borderRadius: '50%',
          border: `1px solid ${C3.ink20}`, color: C3.ink70,
          background: 'transparent', display: 'grid', placeItems: 'center',
          cursor: 'pointer', padding: 0, transform: 'rotate(180deg)',
        }}>
          <span style={{ width: 16, height: 16 }}>{LIST_ICONS.arrowUp}</span>
        </button>
      </div>

      <div style={{
        padding: '14px 16px 18px',
        display: 'flex', gap: 8, justifyContent: 'space-between',
      }}>
        <TKButton variant="quiet" size="md">Cancel</TKButton>
        <TKButton variant="primary" size="md" trailing="→">Set to {value}</TKButton>
      </div>
    </div>
  );
}

// ─────────────────────────── START CONFIRMATION MODAL
function StartDrawModal() {
  return (
    <div style={{
      position: 'relative', width: 340,
      borderRadius: 14, ...paperTexture(C3.ticket),
      boxShadow: '0 20px 50px rgba(20,10,0,0.32)',
      overflow: 'hidden', fontFamily: C3.sans,
    }}>
      {/* Stamp header strip */}
      <div style={{
        padding: '18px 20px 8px',
      }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
          letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
        }}>★ Confirm · admin only</div>
        <div style={{
          fontFamily: C3.display, fontSize: 24, color: C3.ink,
          lineHeight: 1.05, marginTop: 4, letterSpacing: -0.3, textWrap: 'pretty',
        }}>Start the draw?</div>
      </div>
      {/* Tear line */}
      <div style={{ position: 'relative', height: 0, margin: '6px 0' }}>
        <div style={{ position: 'absolute', left: -10, top: -10, width: 20, height: 20, borderRadius: '50%', background: C3.paper }} />
        <div style={{ position: 'absolute', right: -10, top: -10, width: 20, height: 20, borderRadius: '50%', background: C3.paper }} />
        <div style={{ position: 'absolute', left: 14, right: 14, top: -1, borderTop: `1.5px dashed ${C3.ink20}` }} />
      </div>
      <div style={{
        padding: '12px 20px 16px',
        fontSize: 13, color: C3.ink, lineHeight: 1.55,
      }}>
        All player lists will lock. Players who have not saved a list will
        use the default ranking order.
      </div>
      <div style={{
        padding: '0 16px 14px',
        display: 'flex', gap: 8, justifyContent: 'space-between',
      }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1, lineHeight: 1.4,
        }}>3/5 lists saved<br/>2 will fall back to default</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <TKButton variant="quiet" size="sm">No</TKButton>
          <TKButton variant="primary" size="sm" trailing="→">Start</TKButton>
        </div>
      </div>
    </div>
  );
}

// Mock phone with the start modal centered over a dimmed setup screen.
function DrawSetupWithModal() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative',
        ...paperTexture(C3.paper) }}>
        <div style={{ filter: 'blur(0.4px)', opacity: 0.5 }}>
          <TopBar />
          <DrawHeader phase="draft-day" />
          <AdminSetupCard
            teamsPerPlayer={4} saveState="saved" startEnabled={true}
            readinessCount="3/5"
            metrics={{ players: 5, teams: 20, doubleOwned: 12 }}
          />
        </div>
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(15,58,53,0.45)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}>
          <StartDrawModal />
        </div>
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// Mock phone with teams-per-player wheel sheet
function DrawSetupWithWheel() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative',
        ...paperTexture(C3.paper) }}>
        <div style={{ filter: 'blur(0.4px)', opacity: 0.5 }}>
          <TopBar />
          <DrawHeader phase="list-prep" />
          <AdminSetupCard
            teamsPerPlayer={4} saveState="editable" startEnabled={false}
            readinessCount="3/5"
            metrics={{ players: 5, teams: 20, doubleOwned: 12 }}
          />
        </div>
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(15,58,53,0.28)',
        }} />
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          display: 'flex', justifyContent: 'center',
        }}>
          <TeamsPerPlayerSheet value={4} min={2} max={8} />
        </div>
      </div>
      <BottomNav variant="pre" activeId="draw" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

Object.assign(window, {
  DrawHeader, AdminSetupCard, ReadinessCard, ReadinessList,
  DrawListPrepAdmin, DrawDraftDayAdmin, DrawInvalid, DrawNonAdmin, DrawComplete,
  TeamsPerPlayerSheet, StartDrawModal,
  DrawSetupWithModal, DrawSetupWithWheel,
});
