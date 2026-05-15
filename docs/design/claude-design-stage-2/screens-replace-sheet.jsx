// Replace Team bottom sheet — admin tool to swap an assigned team for
// a team that wasn't in the pool (e.g. a tournament withdrawal). The
// destructive surface in the admin set, so it leans on stamped marks,
// dashed perforations and an unmistakable preview block.
//
// Props on ReplaceTeamSheet:
//   dropped        — the assigned team being replaced (object or code)
//   selectedCode   — the picked replacement (optional)
//   query          — current search text
//   bannerError    — error banner string (optional)
//   bannerNotice   — info/warning banner string (optional)
//   bannerWarning  — yellow warning banner string (optional)
//   rankValue      — value of the FIFA rank input
//   rankError      — error string for the rank input (or null)
//   showEmpty      — replacement list shows no-results state
//   submit         — 'idle' | 'busy' | 'disabled' | 'enabled'
//   height         — sheet height (defaults sensibly)

// Available replacements that AREN'T in the current pool but plausible
// for a substitution (withdrawal scenarios).
const REPLACEMENT_POOL = [
  { rank: 23, code: 'TR', name: 'Türkiye'    },
  { rank: 25, code: 'EC', name: 'Ecuador'    },
  { rank: 27, code: 'EG', name: 'Egypt'      },
  { rank: 34, code: 'JP', name: 'Japan'      },
  { rank: 41, code: 'CL', name: 'Chile'      },
  { rank: 44, code: 'CH', name: 'Switzerland'},
  { rank: 48, code: 'PE', name: 'Peru'       },
];

// Mini ticket showing one team — used inside the replacement preview.
function MiniTeam({ code, name, label, dim }) {
  return (
    <div style={{
      flex: 1, minWidth: 0,
      padding: '10px',
      borderRadius: 8,
      background: dim ? 'rgba(15,58,53,0.04)' : C3.ticket,
      border: dim ? `1px dashed ${C3.ink20}` : `1px solid ${C3.ink20}`,
      opacity: dim ? 0.75 : 1,
    }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 8, color: dim ? C3.stamp : C3.ink50,
        letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 700,
      }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
        <FlagSquare code={code} size={28} radius={3} />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontFamily: C3.display, fontSize: 15, color: C3.ink,
            lineHeight: 1.05, letterSpacing: -0.1,
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            textDecoration: dim ? 'line-through' : 'none',
            textDecorationColor: C3.ink50,
          }}>{name}</div>
          <div style={{
            fontFamily: C3.mono, fontSize: 8, color: C3.ink50,
            letterSpacing: 1.2, marginTop: 2, textTransform: 'uppercase',
          }}>{code} · {confedOf(code)}</div>
        </div>
      </div>
    </div>
  );
}

// One row in the replacement list.
function ReplacementRow({ team, selected, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 16px',
      borderBottom: last ? 'none' : `1px dashed ${C3.ink20}`,
      background: selected ? 'rgba(15,58,53,0.06)' : 'transparent',
      cursor: 'pointer', position: 'relative',
    }}>
      {selected && (
        <span style={{
          position: 'absolute', left: 0, top: 6, bottom: 6, width: 3,
          background: C3.ink, borderRadius: 2,
        }} />
      )}
      <FlagSquare code={team.code} size={30} radius={3} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: C3.display, fontSize: 16, color: C3.ink,
          lineHeight: 1.05, letterSpacing: -0.1,
        }}>{team.name}</div>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.2, marginTop: 3, textTransform: 'uppercase',
        }}>{team.code} · {confedOf(team.code)}</div>
      </div>
      {selected ? (
        <span style={{
          width: 24, height: 24, borderRadius: '50%',
          background: C3.ink, color: C3.ticket,
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <span style={{ width: 14, height: 14 }}>{ICONS.check}</span>
        </span>
      ) : (
        <span style={{
          width: 24, height: 24, borderRadius: '50%',
          border: `1.5px dashed ${C3.ink20}`, flexShrink: 0,
        }} />
      )}
    </div>
  );
}

function ReplaceTeamSheet({
  dropped = 'BR',
  selectedCode = null,
  query = '',
  bannerError = null,
  bannerNotice = null,
  bannerWarning = null,
  rankValue = '',
  rankError = null,
  showEmpty = false,
  submit = 'disabled',
  height = 760,
  width = 360,
  hideDropdown = false,
}) {
  const droppedTeam = typeof dropped === 'string' ? teamByCode(dropped) : dropped;
  const sel = selectedCode ? REPLACEMENT_POOL.find(t => t.code === selectedCode) : null;
  const hits = query
    ? REPLACEMENT_POOL.filter(t =>
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.code.toLowerCase().includes(query.toLowerCase()))
    : REPLACEMENT_POOL;

  return (
    <div style={{
      width, maxHeight: height,
      borderTopLeftRadius: 18, borderTopRightRadius: 18,
      ...paperTexture(C3.ticket),
      boxShadow: '0 -16px 40px rgba(20,10,0,0.20)',
      overflow: 'hidden', fontFamily: C3.sans,
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Grabber */}
      <div style={{ display: 'grid', placeItems: 'center', padding: '8px 0 0' }}>
        <span style={{ width: 38, height: 4, borderRadius: 2,
          background: C3.ink20 }} />
      </div>

      {/* Title */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
        padding: '8px 18px 12px', gap: 12,
        borderBottom: `1px dashed ${C3.ink20}`, flexShrink: 0,
      }}>
        <div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
            letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
          }}>★ Admin · destructive</div>
          <div style={{
            fontFamily: C3.display, fontSize: 24, color: C3.ink,
            lineHeight: 1.05, marginTop: 3, letterSpacing: -0.3,
          }}>Replace Team</div>
        </div>
        <button aria-label="Close" style={{
          width: 32, height: 32, borderRadius: 6,
          border: `1px solid ${C3.ink20}`,
          background: 'transparent', color: C3.ink70, cursor: 'pointer',
          display: 'grid', placeItems: 'center', flexShrink: 0,
        }}>
          <span style={{ width: 16, height: 16 }}>{ICONS.close}</span>
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{
        flex: 1, overflow: 'auto', padding: '14px 18px 6px',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        {/* BANNERS */}
        {bannerError && (
          <TKBanner tone="error" title="Couldn't replace" body={bannerError} action="Retry" />
        )}
        {bannerWarning && (
          <TKBanner tone="warning" title="Heads up" body={bannerWarning} />
        )}
        {bannerNotice && (
          <TKBanner tone="notice" title="Note" body={bannerNotice} />
        )}

        {/* DROPPED TEAM SELECT */}
        {!hideDropdown && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
              fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6,
            }}>
              <span>Dropped team</span>
              <span style={{ letterSpacing: 0.6, textTransform: 'none' }}>From the assigned pool</span>
            </div>
            <div style={{
              padding: '10px 12px', borderRadius: 6,
              border: `1.5px solid ${C3.ink20}`, background: C3.ticket,
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            }}>
              <FlagSquare code={droppedTeam.code} size={28} radius={3} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: C3.display, fontSize: 16, color: C3.ink, lineHeight: 1.05,
                }}>{droppedTeam.name}</div>
                <div style={{
                  fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
                  letterSpacing: 1.2, marginTop: 3, textTransform: 'uppercase',
                }}>{droppedTeam.code} · player Marko · pool rank #{droppedTeam.rank}</div>
              </div>
              <span style={{ width: 16, height: 16, color: C3.ink70 }}>
                {ICONS.chevronDown}
              </span>
            </div>
          </div>
        )}

        {/* SEPARATOR */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
          letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
        }}>
          <span style={{ flex: 1, height: 1, background: C3.ink20 }} />
          <span>Sub In</span>
          <span style={{ flex: 1, height: 1, background: C3.ink20 }} />
        </div>

        {/* REPLACEMENT SEARCH */}
        <div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6,
          }}>Replacement team</div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            border: `1.5px solid ${query ? C3.ink : C3.ink20}`,
            borderRadius: 6, background: C3.ticket,
            boxShadow: query ? `0 0 0 3px rgba(15,58,53,0.10)` : 'none',
          }}>
            <span style={{ width: 16, height: 16, color: C3.ink70 }}>
              {ICONS.search}
            </span>
            <input
              defaultValue={query}
              placeholder="Search teams outside the pool"
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontFamily: C3.sans, fontSize: 14, color: C3.ink, padding: 0,
              }}
            />
            {query && (
              <span style={{ width: 16, height: 16, color: C3.ink50, cursor: 'pointer' }}>
                {ICONS.close}
              </span>
            )}
          </div>
        </div>

        {/* SELECTED SUMMARY */}
        {sel && (
          <div style={{
            padding: '10px 12px',
            border: `1.5px solid ${C3.ink}`,
            borderRadius: 8, background: C3.ticket,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <span style={{
              width: 24, height: 24, borderRadius: '50%',
              background: C3.ink, color: C3.ticket,
              display: 'grid', placeItems: 'center', flexShrink: 0,
            }}>
              <span style={{ width: 14, height: 14 }}>{ICONS.check}</span>
            </span>
            <FlagSquare code={sel.code} size={28} radius={3} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: C3.display, fontSize: 16, color: C3.ink, lineHeight: 1.05,
              }}>Selected · {sel.name}</div>
              <div style={{
                fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
                letterSpacing: 1.2, marginTop: 3, textTransform: 'uppercase',
              }}>{sel.code} · {confedOf(sel.code)}</div>
            </div>
            <button aria-label="Clear selection" style={{
              padding: '4px 8px', borderRadius: 4,
              border: `1px solid ${C3.ink20}`, background: 'transparent',
              color: C3.ink70, cursor: 'pointer',
              fontFamily: C3.mono, fontSize: 9, fontWeight: 700,
              letterSpacing: 1.4, textTransform: 'uppercase',
            }}>Clear</button>
          </div>
        )}

        {/* REPLACEMENT LIST */}
        <div style={{
          border: `1px solid ${C3.ink20}`, borderRadius: 8,
          overflow: 'hidden', background: C3.ticket,
        }}>
          <div style={{
            padding: '8px 16px',
            borderBottom: `1px dashed ${C3.ink20}`,
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.4, textTransform: 'uppercase',
          }}>
            <span>Available teams</span>
            <span style={{ letterSpacing: 0.6, textTransform: 'none' }}>
              {showEmpty ? '0' : hits.length} found
            </span>
          </div>
          {showEmpty || hits.length === 0 ? (
            <div style={{
              padding: '22px 16px', textAlign: 'center',
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                border: `2px dashed ${C3.ink20}`, margin: '0 auto 10px',
                display: 'grid', placeItems: 'center', color: C3.ink50,
                fontFamily: C3.display, fontSize: 22,
              }}>∅</div>
              <div style={{
                fontFamily: C3.display, fontSize: 17, color: C3.ink,
                lineHeight: 1.15,
              }}>No available teams.</div>
              <div style={{
                fontFamily: C3.sans, fontSize: 11, color: C3.ink70,
                marginTop: 5, lineHeight: 1.5,
              }}>Try a different search, or enter a FIFA rank manually below.</div>
            </div>
          ) : (
            hits.slice(0, 4).map((t, i) => (
              <ReplacementRow key={t.code} team={t}
                selected={sel && sel.code === t.code}
                last={i === Math.min(3, hits.length - 1)} />
            ))
          )}
        </div>

        {/* FIFA RANK INPUT */}
        <div>
          <div style={{
            display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6,
          }}>
            <span>FIFA Rank · override</span>
            <span style={{ letterSpacing: 0.6, textTransform: 'none' }}>Optional</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px',
            border: `1.5px solid ${rankError ? C3.stamp : C3.ink20}`,
            borderRadius: 6, background: C3.ticket,
          }}>
            <span style={{
              fontFamily: C3.mono, fontSize: 11, color: C3.ink50,
              letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: 600,
            }}>#</span>
            <input
              type="number"
              defaultValue={rankValue}
              placeholder={sel ? String(sel.rank) : "e.g. 23"}
              style={{
                flex: 1, border: 'none', outline: 'none', background: 'transparent',
                fontFamily: C3.mono, fontSize: 14, color: C3.ink, padding: 0,
                letterSpacing: 0.5, fontVariantNumeric: 'tabular-nums',
              }}
            />
            <span style={{
              fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 1, textTransform: 'uppercase',
            }}>1 - 211</span>
          </div>
          {rankError ? (
            <div style={{
              fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
              letterSpacing: 0.4, marginTop: 6, fontWeight: 600,
            }}>{rankError}</div>
          ) : (
            <div style={{
              fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
              letterSpacing: 0.4, marginTop: 6,
            }}>
              Defaults to the replacement's current FIFA rank.
            </div>
          )}
        </div>

        {/* PREVIEW */}
        <div style={{
          padding: '12px',
          borderRadius: 10,
          border: `1.5px dashed ${sel ? C3.ink : C3.ink20}`,
          background: sel ? 'rgba(15,58,53,0.03)' : 'transparent',
        }}>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
            letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
            marginBottom: 8,
          }}>★ Preview</div>
          <div style={{
            display: 'flex', alignItems: 'stretch', gap: 8,
          }}>
            <MiniTeam code={droppedTeam.code} name={droppedTeam.name} label="Drops" dim />
            <div style={{
              display: 'grid', placeItems: 'center',
              width: 36, fontFamily: C3.display, fontSize: 22, color: C3.ink,
            }}>→</div>
            {sel ? (
              <MiniTeam code={sel.code} name={sel.name} label="Subs In" />
            ) : (
              <div style={{
                flex: 1,
                border: `1.5px dashed ${C3.ink20}`,
                borderRadius: 8, padding: '10px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: C3.mono, fontSize: 10, color: C3.ink50,
                letterSpacing: 1.4, textTransform: 'uppercase',
                textAlign: 'center', lineHeight: 1.45,
              }}>Pick a team to preview</div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER · actions */}
      <div style={{
        borderTop: `1px dashed ${C3.ink20}`,
        padding: '12px 16px',
        display: 'flex', gap: 8, justifyContent: 'flex-end',
        background: C3.ticket, flexShrink: 0,
      }}>
        <button style={{
          padding: '11px 16px', borderRadius: 4,
          border: 'none', background: 'transparent',
          color: C3.ink, cursor: 'pointer',
          fontFamily: C3.mono, fontSize: 11, fontWeight: 700,
          letterSpacing: 1.6, textTransform: 'uppercase',
        }}>Cancel</button>
        <button disabled={submit === 'disabled' || submit === 'busy'} style={{
          padding: '11px 18px', borderRadius: 4,
          border: 'none',
          background: submit === 'disabled' ? C3.ink20 : C3.stamp,
          color: submit === 'disabled' ? C3.ink50 : C3.ticket,
          cursor: submit === 'disabled' ? 'not-allowed'
                : submit === 'busy' ? 'progress' : 'pointer',
          fontFamily: C3.mono, fontSize: 11, fontWeight: 700,
          letterSpacing: 1.6, textTransform: 'uppercase',
          display: 'inline-flex', alignItems: 'center', gap: 8,
          opacity: submit === 'busy' ? 0.92 : 1,
        }}>
          {submit === 'busy' && (
            <span style={{ width: 16, height: 16, display: 'grid', placeItems: 'center' }}>
              {ICONS.spinner(C3.ticket, 16)}
            </span>
          )}
          {submit === 'busy' ? 'Replacing…' : (
            <>
              Replace
              <span style={{ fontFamily: C3.display, fontSize: 14, letterSpacing: 0 }}>→</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════ SHEET · IN-CONTEXT WRAPPERS

// Backdrop + sheet pinned to the bottom of a faded admin page.
function SheetOver({ sheet }) {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative', ...paperTexture(C3.paper) }}>
        <TopBar />
        <PTHeader subtitle="Assign teams to players" />
        <ReplaceTeamRow />
        <PlayerTicket player={POOL_PLAYERS_READY[2]}
          codes={PT_ASSIGNED.marko}
          variant="admin" showAdd />
        {/* Backdrop */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(15,30,28,0.55)',
          backdropFilter: 'blur(1px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          {sheet}
        </div>
      </div>
      <BottomNav variant="live" activeId="players" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

function ReplaceSheetDefault() {
  return <SheetOver sheet={
    <ReplaceTeamSheet dropped="BR" />
  } />;
}

function ReplaceSheetWithSelection() {
  return <SheetOver sheet={
    <ReplaceTeamSheet
      dropped="BR"
      selectedCode="EC"
      bannerNotice="Marko's predictions for Brazil will be reassigned to Ecuador for un-played fixtures only."
      submit="enabled"
    />
  } />;
}

function ReplaceSheetRankError() {
  return <SheetOver sheet={
    <ReplaceTeamSheet
      dropped="BR"
      selectedCode="EC"
      rankValue="-3"
      rankError="Rank must be a positive whole number."
      submit="disabled"
    />
  } />;
}

function ReplaceSheetWarning() {
  return <SheetOver sheet={
    <ReplaceTeamSheet
      dropped="BR"
      selectedCode="JP"
      bannerWarning="Different confederation (AFC). Group-stage standings will not be affected."
      submit="enabled"
    />
  } />;
}

function ReplaceSheetError() {
  return <SheetOver sheet={
    <ReplaceTeamSheet
      dropped="BR"
      selectedCode="EC"
      bannerError="The replacement service is offline. Your change wasn't saved."
      submit="enabled"
    />
  } />;
}

function ReplaceSheetEmpty() {
  return <SheetOver sheet={
    <ReplaceTeamSheet
      dropped="BR"
      query="zzzzz"
      showEmpty
      submit="disabled"
    />
  } />;
}

function ReplaceSheetBusy() {
  return <SheetOver sheet={
    <ReplaceTeamSheet
      dropped="BR"
      selectedCode="EC"
      submit="busy"
    />
  } />;
}

Object.assign(window, {
  REPLACEMENT_POOL, MiniTeam, ReplacementRow, ReplaceTeamSheet,
  SheetOver,
  ReplaceSheetDefault, ReplaceSheetWithSelection, ReplaceSheetRankError,
  ReplaceSheetWarning, ReplaceSheetError, ReplaceSheetEmpty, ReplaceSheetBusy,
});
