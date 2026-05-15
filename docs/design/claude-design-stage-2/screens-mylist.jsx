// My List — reorderable team preferences screen + position-picker sheet.
//
// Composition:
//   ┌─ TopBar (shared)
//   ├─ ListHeader  (title "My List", FIFA ranking subtitle, save badge)
//   ├─ TeamListRow × N (rank · flag · name · move icon · grip)
//   └─ Footer hint (tap reorder copy)
// Sheet (separate variant): PositionPickerSheet shown above the screen.

// ─────────────────────────── ICONS (page-local extras)
const LIST_ICONS = {
  grip: (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="9"  cy="7"  r="1.1" fill="currentColor"/>
      <circle cx="15" cy="7"  r="1.1" fill="currentColor"/>
      <circle cx="9"  cy="12" r="1.1" fill="currentColor"/>
      <circle cx="15" cy="12" r="1.1" fill="currentColor"/>
      <circle cx="9"  cy="17" r="1.1" fill="currentColor"/>
      <circle cx="15" cy="17" r="1.1" fill="currentColor"/>
    </svg>
  ),
  moveTo: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M7 7h13M7 12h13M7 17h13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M3 7l1.5-1.5L6 7M3 17l1.5 1.5L6 17M4.5 6v12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  minus: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  arrowUp: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12l7-7 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
};

// ─────────────────────────── SAVE BADGE
// Compact mono pill displayed next to the page title.
function SaveBadge({ state = 'saved' }) {
  const styles = {
    saved:   { bg: 'rgba(31,106,77,0.10)',  fg: '#1f6a4d', label: 'Saved',     icon: ICONS.check,  border: '#1f6a4d33' },
    saving:  { bg: 'rgba(15,58,53,0.06)',   fg: C3.ink,    label: 'Saving…',   icon: null,         border: C3.ink20 },
    error:   { bg: 'rgba(168,57,43,0.10)',  fg: C3.stamp,  label: 'Error',     icon: ICONS.alert,  border: '#a8392b40' },
    locked:  { bg: 'transparent',           fg: C3.ink70,  label: 'Locked',    icon: ICONS.lock,   border: C3.ink20, dashed: true },
  }[state];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '4px 9px 4px 7px', borderRadius: 100,
      background: styles.bg,
      border: `1px ${styles.dashed ? 'dashed' : 'solid'} ${styles.border}`,
      fontFamily: C3.mono, fontSize: 9, color: styles.fg,
      letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 600,
      lineHeight: 1,
    }}>
      <span style={{ width: 12, height: 12, display: 'grid', placeItems: 'center' }}>
        {state === 'saving' ? ICONS.spinner(styles.fg, 12) : styles.icon}
      </span>
      {styles.label}
    </span>
  );
}

// ─────────────────────────── LIST HEADER
function ListHeader({ saveState = 'saved' }) {
  return (
    <div style={{ padding: '4px 20px 14px', fontFamily: C3.sans }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
        letterSpacing: 2.2, textTransform: 'uppercase', fontWeight: 700,
      }}>★ Pre-draw · pick order</div>
      <div style={{
        display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
        gap: 10, marginTop: 4,
      }}>
        <div style={{
          fontFamily: C3.display, fontSize: 36, lineHeight: 1,
          color: C3.ink, letterSpacing: -0.6,
        }}>My List</div>
        <SaveBadge state={saveState} />
      </div>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
        letterSpacing: 0.7, marginTop: 8, lineHeight: 1.5,
        fontVariantNumeric: 'tabular-nums',
      }}>
        FIFA/Coca-Cola Men's World Ranking · 1 Apr 2026<br/>
        <span style={{ color: C3.ink50 }}>Drag or tap a row to set your draft order.</span>
      </div>
    </div>
  );
}

// ─────────────────────────── TEAM LIST ROW
// state: 'idle' | 'dragging' | 'placeholder' | 'locked'
function TeamListRow({ rank, code, name, state = 'idle' }) {
  const isDragging   = state === 'dragging';
  const isPlaceholder= state === 'placeholder';
  const isLocked     = state === 'locked';

  if (isPlaceholder) {
    return (
      <div style={{
        margin: '0 16px',
        height: 56,
        border: `1.5px dashed ${C3.ink20}`,
        borderRadius: 8,
        background: 'rgba(15,58,53,0.03)',
      }} />
    );
  }

  return (
    <div style={{
      margin: '0 16px',
      display: 'grid',
      gridTemplateColumns: '28px 36px 1fr auto',
      alignItems: 'center', gap: 12,
      padding: '10px 12px 10px 8px',
      borderRadius: 8,
      background: isDragging ? C3.ticket : 'transparent',
      border: isDragging
        ? `1.5px solid ${C3.ink}`
        : (isLocked ? `1px dashed ${C3.ink20}` : `1px solid ${C3.ink20}`),
      boxShadow: isDragging
        ? '0 14px 30px rgba(50,30,10,0.18), 0 1px 0 rgba(0,0,0,0.05)'
        : 'none',
      transform: isDragging ? 'translateY(-2px) rotate(-0.4deg)' : 'none',
      opacity: isLocked ? 0.6 : 1,
      fontFamily: C3.sans,
      position: 'relative',
    }}>
      <span style={{
        fontFamily: C3.mono, fontSize: 12, color: isLocked ? C3.ink50 : C3.ink70,
        fontVariantNumeric: 'tabular-nums', letterSpacing: 0.5, fontWeight: 600,
        textAlign: 'center',
      }}>{String(rank).padStart(2, '0')}</span>
      <span style={{
        width: 36, height: 24, borderRadius: 4, overflow: 'hidden',
        boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.1)',
        opacity: isLocked ? 0.75 : 1,
      }}>
        {FLAGS[code] || <span style={{ background: C3.ink20, width: '100%', height: '100%', display: 'block' }} />}
      </span>
      <span style={{
        fontFamily: C3.display, fontSize: 17, color: isLocked ? C3.ink70 : C3.ink,
        lineHeight: 1.05, letterSpacing: -0.1,
        textDecoration: isLocked ? 'line-through' : 'none',
        textDecorationColor: C3.ink20,
      }}>{name}</span>

      {isLocked ? (
        <span style={{
          width: 28, height: 28, borderRadius: 6,
          border: `1px dashed ${C3.ink20}`, color: C3.ink50,
          display: 'grid', placeItems: 'center',
        }}>
          <span style={{ width: 14, height: 14 }}>{ICONS.lock}</span>
        </span>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button aria-label="Move to position" style={{
            width: 32, height: 32, borderRadius: 6, padding: 0,
            border: `1px solid ${C3.ink20}`, background: 'transparent',
            color: C3.ink70, display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}>
            <span style={{ width: 16, height: 16 }}>{LIST_ICONS.moveTo}</span>
          </button>
          <button aria-label="Drag to reorder" style={{
            width: 32, height: 32, borderRadius: 6, padding: 0,
            border: 'none', background: 'transparent',
            color: isDragging ? C3.ink : C3.ink50,
            display: 'grid', placeItems: 'center', cursor: 'grab',
          }}>
            <span style={{ width: 18, height: 18 }}>{LIST_ICONS.grip}</span>
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────── MY LIST · STATES

// 1. Saved (default · full list scrolled to top)
function MyListSaved() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <ListHeader saveState="saved" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {MY_LIST_DEFAULT.slice(0, 12).map((code, i) => (
            <TeamListRow key={code}
              rank={i + 1} code={code} name={teamByCode(code).name} />
          ))}
        </div>
        <div style={{
          margin: '14px 16px 18px',
          padding: '10px 12px',
          fontFamily: C3.mono, fontSize: 10, color: C3.ink50,
          letterSpacing: 0.6, lineHeight: 1.55,
          border: `1px dashed ${C3.ink20}`, borderRadius: 8,
        }}>
          {MY_LIST_DEFAULT.length} teams · changes save instantly.<br/>
          List locks when admin starts the draw.
        </div>
      </div>
      <BottomNav variant="pre" activeId="mylist" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 2. Saving badge state
function MyListSaving() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <ListHeader saveState="saving" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {/* show a row mid-drag to imply an edit just happened */}
          <TeamListRow rank={1} code="AR" name="Argentina" />
          <TeamListRow rank={2} code="FR" name="France" state="dragging" />
          {MY_LIST_DEFAULT.slice(2, 11).map((code, i) => (
            <TeamListRow key={code}
              rank={i + 3} code={code} name={teamByCode(code).name} />
          ))}
        </div>
      </div>
      <BottomNav variant="pre" activeId="mylist" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 3. Error save state — banner above the list
function MyListError() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <ListHeader saveState="error" />
        <div style={{ padding: '0 16px 12px' }}>
          <TKBanner
            tone="error"
            title="Couldn't save"
            body="We'll keep your order locally and retry when you're back online."
            action="Retry"
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: 0.6 }}>
          {MY_LIST_DEFAULT.slice(0, 10).map((code, i) => (
            <TeamListRow key={code}
              rank={i + 1} code={code} name={teamByCode(code).name} />
          ))}
        </div>
      </div>
      <BottomNav variant="pre" activeId="mylist" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 4. Locked — draw started · list immutable
function MyListLocked() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <ListHeader saveState="locked" />
        <div style={{ padding: '0 16px 12px' }}>
          <TKBanner
            tone="notice"
            title="List locked"
            body="The draw has begun. Your saved order will be used for any of your turns that need a default."
          />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {MY_LIST_DEFAULT.slice(0, 11).map((code, i) => (
            <TeamListRow key={code}
              rank={i + 1} code={code} name={teamByCode(code).name} state="locked" />
          ))}
        </div>
      </div>
      <BottomNav variant="pre" activeId="mylist" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 5. Loading — skeleton rows
function MyListLoading() {
  const bar = (w, h = 12) => (
    <span style={{
      display: 'inline-block', width: w, height: h, borderRadius: 2,
      background: 'rgba(15,58,53,0.08)',
    }} />
  );
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <div style={{ padding: '4px 20px 14px', animation: 'tkPulse 1.6s ease-in-out infinite' }}>
          {bar(140, 10)}
          <div style={{ marginTop: 8 }}>{bar(160, 30)}</div>
          <div style={{ marginTop: 12 }}>{bar(220, 9)}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6,
          animation: 'tkPulse 1.6s ease-in-out infinite' }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{
              margin: '0 16px',
              display: 'grid',
              gridTemplateColumns: '28px 36px 1fr 76px',
              alignItems: 'center', gap: 12,
              padding: '10px 12px 10px 8px',
              borderRadius: 8, border: `1px solid ${C3.ink20}`,
            }}>
              {bar(20, 10)}
              <span style={{ width: 36, height: 24, borderRadius: 4,
                background: 'rgba(15,58,53,0.08)' }} />
              {bar(110, 14)}
              <span style={{ height: 28, background: 'transparent' }} />
            </div>
          ))}
        </div>
      </div>
      <BottomNav variant="pre" activeId="mylist" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 6. Empty — no teams added yet (this would be admin-side edge case)
function MyListEmpty() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <ListHeader saveState="saved" />
        <div style={{ padding: '24px 20px' }}>
          <TKEmpty
            title="Teams have not been added yet."
            body="The pool admin loads the ranking before the draw opens. Check back shortly — you'll get a push when it's ready."
            action="Refresh"
          />
        </div>
      </div>
      <BottomNav variant="pre" activeId="mylist" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// 7. Dragging — full state with one row mid-drag and a placeholder gap
function MyListDragging() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <TopBar />
        <ListHeader saveState="saving" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <TeamListRow rank={1} code="AR" name="Argentina" />
          <TeamListRow rank={2} code="BR" name="Brazil" />
          {/* dragged FR is "floating" above placeholder slot at rank 3 */}
          <div style={{ position: 'relative' }}>
            <TeamListRow rank={3} code={null} name="" state="placeholder" />
            <div style={{ position: 'absolute', top: -8, left: 0, right: 0 }}>
              <TeamListRow rank={3} code="FR" name="France" state="dragging" />
            </div>
          </div>
          <TeamListRow rank={4} code="EN" name="England" />
          <TeamListRow rank={5} code="ES" name="Spain" />
          <TeamListRow rank={6} code="DE" name="Germany" />
          <TeamListRow rank={7} code="PT" name="Portugal" />
          <TeamListRow rank={8} code="NL" name="Netherlands" />
          <TeamListRow rank={9} code="IT" name="Italy" />
        </div>
      </div>
      <BottomNav variant="pre" activeId="mylist" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// ─────────────────────────── POSITION-PICKER SHEET
// A wheel + flag/team header + two CTAs. Number column is centered with
// adjacent +/- nudge buttons; the selected slot is ink-filled.

function PositionWheel({ value = 5, max = 32 }) {
  const around = [-2, -1, 0, 1, 2];
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 14, padding: '6px 0 12px',
      borderTop: `1px dashed ${C3.ink20}`,
      borderBottom: `1px dashed ${C3.ink20}`,
      ...paperTexture(C3.ticket),
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
        {/* highlight band behind selected slot */}
        <div style={{
          position: 'absolute', left: 0, right: 0,
          top: '50%', transform: 'translateY(-50%)',
          height: 42, borderRadius: 4,
          background: C3.ink,
          zIndex: 0,
        }} />
        {around.map(d => {
          const n = value + d;
          if (n < 1 || n > max) {
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
              fontVariantNumeric: 'tabular-nums', letterSpacing: 0.3,
              lineHeight: 1,
            }}>{String(n).padStart(2, '0')}</div>
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
  );
}

function PositionPickerSheet({ team, currentRank = 5, targetRank = 5, max = 32 }) {
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
        }}>★ Move team</div>
        <div style={{
          marginTop: 6,
          display: 'grid', gridTemplateColumns: '40px 1fr auto',
          alignItems: 'center', gap: 12,
        }}>
          <FlagSquare code={team.code} size={40} radius={4} />
          <div style={{ minWidth: 0 }}>
            <div style={{
              fontFamily: C3.display, fontSize: 20, color: C3.ink,
              lineHeight: 1.05, letterSpacing: -0.2,
            }}>{team.name}</div>
            <div style={{
              fontFamily: C3.mono, fontSize: 10, color: C3.ink70,
              letterSpacing: 0.6, marginTop: 3,
              fontVariantNumeric: 'tabular-nums',
            }}>Current rank #{String(currentRank).padStart(2, '0')} · of {max}</div>
          </div>
          <span style={{
            padding: '4px 8px', borderRadius: 4, border: `1px solid ${C3.ink20}`,
            fontFamily: C3.mono, fontSize: 9, color: C3.ink70,
            letterSpacing: 1.2, textTransform: 'uppercase',
          }}>{team.code}</span>
        </div>
      </div>

      <PositionWheel value={targetRank} max={max} />

      <div style={{
        padding: '14px 16px 18px',
        display: 'flex', gap: 8, justifyContent: 'space-between',
      }}>
        <TKButton variant="quiet" size="md">Cancel</TKButton>
        <TKButton variant="primary" size="md" trailing="→">
          Move to #{String(targetRank).padStart(2, '0')}
        </TKButton>
      </div>
    </div>
  );
}

// Mock phone with the position-picker sheet docked at the bottom over a
// dimmed list — used in the canvas to show the sheet in context.
function MyListWithSheet() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative',
        ...paperTexture(C3.paper) }}>
        <div style={{ filter: 'blur(0.4px)', opacity: 0.5 }}>
          <TopBar />
          <ListHeader saveState="saved" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {MY_LIST_DEFAULT.slice(0, 6).map((code, i) => (
              <TeamListRow key={code}
                rank={i + 1} code={code} name={teamByCode(code).name} />
            ))}
          </div>
        </div>
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(15,58,53,0.28)',
        }} />
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          display: 'flex', justifyContent: 'center',
        }}>
          <PositionPickerSheet
            team={teamByCode('DE')}
            currentRank={10}
            targetRank={3}
            max={32}
          />
        </div>
      </div>
      <BottomNav variant="pre" activeId="mylist" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

Object.assign(window, {
  LIST_ICONS, SaveBadge, ListHeader, TeamListRow,
  MyListSaved, MyListSaving, MyListError, MyListLocked,
  MyListLoading, MyListEmpty, MyListDragging,
  PositionWheel, PositionPickerSheet, MyListWithSheet,
});
