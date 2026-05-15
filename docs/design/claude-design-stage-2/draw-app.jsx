// World Cup 26 — Pre-Draw + Draft-Day surfaces.
// Composes the three new screen files onto a Design Canvas.
//
// Sections:
//   00 · Map / legend
//   01 · My List — saved, saving, error, locked
//   02 · My List — loading, empty, dragging
//   03 · Position-picker bottom sheet
//   04 · Draw setup — list prep, draft day, invalid, non-admin, complete
//   05 · Draw setup — modals and sheets
//   06 · Live draw — round intro
//   07 · Live draw — picking view (5 states)
//   08 · Live draw — team picker sheet
//   09 · Live draw — round summary
//   10 · Handoff notes

const ART_W = 420;
const ART_H = 884;

function PhoneArt({ children }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#e6dcc5',
      backgroundImage: `radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
                        radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px)`,
      backgroundSize: '3px 3px, 7px 7px',
      backgroundPosition: '0 0, 1.5px 1.5px',
    }}>{children}</div>
  );
}

function NoteBlock({ heading, bullets }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 8,
      border: `1px dashed ${C3.ink20}`,
    }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
        letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 600,
        marginBottom: 8,
      }}>★ {heading}</div>
      <ul style={{ margin: 0, paddingLeft: 18,
        fontFamily: C3.sans, fontSize: 12.5, color: C3.ink, lineHeight: 1.55 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ marginBottom: 4, textWrap: 'pretty' }}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  return (
    <DesignCanvas>
      {/* ─────────── 00 · MAP ─────────── */}
      <DCSection
        id="map"
        title="Pre-draw &amp; Draft Day · prototype + spec"
        subtitle='Two app surfaces extend the Match Ticket direction from Stage 1: "My List" (each user&apos;s draft preference list) and "Draw" (admin setup → readiness → live draw → recap). All chrome (top bar, paper-stamp bottom nav, dashed perforations, mono metadata) reuses the system DS without modification. The pre-draw nav swaps the Predictions / Standings tabs for My List / Draw — both tabs disappear once the draw is complete and the live nav takes over.'
      >
        <DCArtboard id="legend" label="Legend · what's where" width={580} height={780}>
          <div className="board">
            <div className="board-eyebrow">★ Map · 00</div>
            <div className="board-title">In this canvas</div>
            <hr className="board-divider" />
            <div className="vstack" style={{ gap: 14 }}>
              {[
                ['01 · My List · save states',  '4 phones — saved / saving / error / locked. SaveBadge in the header surfaces every state, never a separate toast.'],
                ['02 · My List · data states',  '3 phones — loading skeleton, empty pool, mid-drag with placeholder slot.'],
                ['03 · Position picker',        'Bottom sheet — number wheel + team header. Tap "move-to" icon on any row to open.'],
                ['04 · Draw · phase states',    '5 phones — list prep (admin), draft day (admin · Start enabled), invalid math, non-admin, complete.'],
                ['05 · Draw · modals + sheets', '2 phones — confirm "Start the draw?" modal, teams-per-player wheel sheet.'],
                ['06 · Live draw · round intro','2 phones — admin (Start button) and spectator (waiting copy).'],
                ['07 · Live draw · picking',    '5 phones — auto-pick, R2 with chips, no-available-team, spectator, your turn.'],
                ['08 · Live draw · pick sheet', '2 phones — populated picker with taken markers, empty results state.'],
                ['09 · Live draw · summary',    '3 phones — round complete (5 picks), mid-round (some empty), Game started recap.'],
              ].map(([h, b]) => (
                <div key={h} style={{
                  padding: '10px 12px', borderRadius: 8,
                  border: `1px dashed ${C3.ink20}`,
                }}>
                  <div style={{
                    fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
                    letterSpacing: 1.6, textTransform: 'uppercase',
                    fontWeight: 600,
                  }}>{h}</div>
                  <div style={{
                    fontFamily: C3.sans, fontSize: 12.5, color: C3.ink70,
                    marginTop: 4, lineHeight: 1.5, textWrap: 'pretty',
                  }}>{b}</div>
                </div>
              ))}
              <div style={{
                marginTop: 4, padding: '10px 12px',
                background: 'rgba(168,57,43,0.08)',
                border: `1px solid rgba(168,57,43,0.25)`,
                borderRadius: 8,
                fontFamily: C3.sans, fontSize: 12, color: C3.ink, lineHeight: 1.45,
              }}>
                <b>System note · </b> All cards extend the Match Ticket vocabulary — paper texture, dashed tear lines, stamped CTAs, mono metadata. Admin-only controls are visually marked with the same "★ Admin · …" eyebrow used across the rest of the system.
              </div>
            </div>
          </div>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 01 · MY LIST · SAVE STATES ─────────── */}
      <DCSection
        id="mylist-save"
        title="01 · My List · save states"
        subtitle="Reorderable team list, one row per pool entrant. The SaveBadge inline in the title row carries every save status — saved, saving, error, locked — so there's no separate toast cluttering the bottom edge."
      >
        <DCArtboard id="ml-saved" label="Saved · default" width={ART_W} height={ART_H}>
          <PhoneArt><MyListSaved /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ml-saving" label="Saving · with drag" width={ART_W} height={ART_H}>
          <PhoneArt><MyListSaving /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ml-error" label="Error · banner + retry" width={ART_W} height={ART_H}>
          <PhoneArt><MyListError /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ml-locked" label="Locked · draw started" width={ART_W} height={ART_H}>
          <PhoneArt><MyListLocked /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 02 · MY LIST · DATA STATES ─────────── */}
      <DCSection
        id="mylist-data"
        title="02 · My List · data states"
        subtitle="Loading uses the same row silhouette as the loaded list so nothing reflows. Empty card uses the dashed paper vocabulary. Dragging state floats the row over a dashed placeholder slot — a familiar reorder affordance without any 3rd-party drag library."
      >
        <DCArtboard id="ml-loading" label="Loading · skeleton rows" width={ART_W} height={ART_H}>
          <PhoneArt><MyListLoading /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ml-empty" label="Empty · no teams yet" width={ART_W} height={ART_H}>
          <PhoneArt><MyListEmpty /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ml-dragging" label="Dragging · row in motion" width={ART_W} height={ART_H}>
          <PhoneArt><MyListDragging /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 03 · POSITION PICKER ─────────── */}
      <DCSection
        id="mylist-sheet"
        title="03 · Position picker · bottom sheet"
        subtitle="Tap the move-to icon on any row to open this sheet. A 5-slot number wheel scrolls between 1 and N (=pool size). The selected slot is ink-filled — same visual weight as the Predict CTA stamp, so the destination always reads as the primary action."
      >
        <DCArtboard id="ml-sheet" label="Picker · in context" width={ART_W} height={ART_H}>
          <PhoneArt><MyListWithSheet /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ml-sheet-bare" label="Picker · sheet alone" width={400} height={420}>
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            ...paperTexture(C3.paper),
          }}>
            <PositionPickerSheet
              team={teamByCode('DE')}
              currentRank={10}
              targetRank={3}
              max={32}
            />
          </div>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 04 · DRAW · PHASE STATES ─────────── */}
      <DCSection
        id="draw-phase"
        title="04 · Draw · phase states"
        subtitle='Phase eyebrow drives every secondary string on the page: "list prep" / "draft day" / "draw is complete". Page title stays "Draw" so the page identity doesn&apos;t shift mid-flow. Admin sees a setup ticket above the readiness list; non-admins see their own status card.'
      >
        <DCArtboard id="dr-list-prep" label="List prep · admin · 3/5 ready" width={ART_W} height={ART_H}>
          <PhoneArt><DrawListPrepAdmin /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="dr-draft-day" label="Draft day · admin · 5/5 ready" width={ART_W} height={ART_H}>
          <PhoneArt><DrawDraftDayAdmin /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="dr-invalid" label="Invalid · math doesn't fit" width={ART_W} height={ART_H}>
          <PhoneArt><DrawInvalid /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="dr-non-admin" label="Non-admin · status only" width={ART_W} height={ART_H}>
          <PhoneArt><DrawNonAdmin /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="dr-complete" label="Complete · stamp + recap link" width={ART_W} height={ART_H}>
          <PhoneArt><DrawComplete /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 05 · DRAW · MODALS + SHEETS ─────────── */}
      <DCSection
        id="draw-overlays"
        title="05 · Draw · modals + sheets"
        subtitle='"Start the draw?" is a destructive confirm — modal pulled out as a perforated paper card so the action feels like tearing a ticket free. The teams-per-player wheel is identical chrome to the position picker so the gesture transfers.'
      >
        <DCArtboard id="dr-modal" label="Start draw · confirm modal" width={ART_W} height={ART_H}>
          <PhoneArt><DrawSetupWithModal /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="dr-wheel" label="Teams per player · wheel sheet" width={ART_W} height={ART_H}>
          <PhoneArt><DrawSetupWithWheel /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="dr-modal-bare" label="Modal · alone" width={400} height={360}>
          <div style={{
            width: '100%', height: '100%',
            display: 'grid', placeItems: 'center', padding: 20,
            ...paperTexture(C3.paper),
          }}>
            <StartDrawModal />
          </div>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 06 · LIVE DRAW · ROUND INTRO ─────────── */}
      <DCSection
        id="live-intro"
        title="06 · Live draw · round intro"
        subtitle="Each round opens with this paper card. The pulsing red dot in the live-draw eyebrow signals everyone's looking at the same screen at the same time — a small social ceremony cue."
      >
        <DCArtboard id="li-admin" label="R1 · admin · Start button" width={ART_W} height={ART_H}>
          <PhoneArt><LiveRoundIntroAdmin /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="li-non-admin" label="R2 · spectator · waiting" width={ART_W} height={ART_H}>
          <PhoneArt><LiveRoundIntroNonAdmin /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 07 · LIVE DRAW · PICKING ─────────── */}
      <DCSection
        id="live-pick"
        title="07 · Live draw · picking view"
        subtitle="One pick per screen. The current player's avatar grows to 88px so it reads from across the room — this is the ceremony moment. Already-assigned teams appear as compact chips above the selected card so the audience can see the roster building up."
      >
        <DCArtboard id="lp-auto" label="Auto-pick · admin · top of list" width={ART_W} height={ART_H}>
          <PhoneArt><LivePickingAdmin /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="lp-r2" label="R2 · already-assigned chips" width={ART_W} height={ART_H}>
          <PhoneArt><LivePickingAdminR2 /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="lp-noavail" label="No available · admin must choose" width={ART_W} height={ART_H}>
          <PhoneArt><LivePickingNoAvail /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="lp-spec" label="Spectator · waiting copy" width={ART_W} height={ART_H}>
          <PhoneArt><LivePickingSpectator /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="lp-you" label="Your turn · stamp-red ring" width={ART_W} height={ART_H}>
          <PhoneArt><LivePickingYou /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 08 · LIVE DRAW · TEAM PICKER ─────────── */}
      <DCSection
        id="live-sheet"
        title="08 · Live draw · team picker sheet"
        subtitle='Admin "Choose Team" opens this sheet. Taken teams stay visible but are dimmed and marked with a lock + the owner&apos;s initial — context for why the auto-pick may have skipped a team.'
      >
        <DCArtboard id="ls-pick" label="Picker · in context" width={ART_W} height={ART_H}>
          <PhoneArt><LivePickingWithSheet /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ls-empty" label="Picker · empty results" width={ART_W} height={ART_H}>
          <PhoneArt><LivePickingSheetEmpty /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ls-bare" label="Picker · sheet alone" width={400} height={580}>
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            ...paperTexture(C3.paper),
          }}>
            <TeamPickerSheet
              selectedCode="DE"
              takenCodes={{ AR: 'D', FR: 'A', BR: 'M', EN: 'P', ES: 'I' }}
              height={540}
            />
          </div>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 09 · LIVE DRAW · ROUND SUMMARY ─────────── */}
      <DCSection
        id="live-summary"
        title="09 · Live draw · round summary"
        subtitle='Round close. Per-player roster cards stack vertically so it reads top-to-bottom on a phone. "Game started" is the very last summary — its CTA is "Start Game" and it earns a stamped "FILED" mark to mark the threshold between draft and competition.'
      >
        <DCArtboard id="ls-r1" label="R1 complete · 5 picks filed" width={ART_W} height={ART_H}>
          <PhoneArt><LiveR1Complete /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ls-r1-mid" label="R1 mid · some empty" width={ART_W} height={ART_H}>
          <PhoneArt><LiveR1Mid /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ls-final" label="Game started · final recap" width={ART_W} height={ART_H}>
          <PhoneArt><LiveGameStarted /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 10 · HANDOFF ─────────── */}
      <DCSection
        id="notes"
        title="Handoff notes"
        subtitle="Behaviour the developer needs that isn't visible in the static mockups."
      >
        <DCArtboard id="notes-card" label="Behaviours · gotchas · constants" width={720} height={1080}>
          <div className="board">
            <div className="board-eyebrow">★ Handoff · 10</div>
            <div className="board-title">What to wire up</div>
            <hr className="board-divider" />
            <div className="vstack" style={{ gap: 14 }}>
              <NoteBlock heading="01 · My List · reorder"
                bullets={[
                  'Drag handle (right) starts a pointer-based reorder. Use a long-press of 220ms on mobile to avoid catching scroll. While dragging, ghost the row at 1.02× scale + 0.4° rotation; the slot left behind is a dashed placeholder of the same height (56px).',
                  'Move-to icon (left of the grip) opens the PositionPickerSheet for that row. The wheel shows ±2 around the chosen index and clamps at 1 / N.',
                  'Persisted by debounced PUT /lists (300ms). SaveBadge owns the status — flip to "Saving…" the moment a drag completes, then to "Saved" on 2xx, "Error" on failure. Never use a toast for save status here.',
                  'Locked state is server-driven: as soon as the draw starts, /lists returns 423 + locked=true. Rows render with dashed borders + a lock icon in place of the controls; the badge flips to Locked.',
                ]} />
              <NoteBlock heading="02 · Draw · admin setup"
                bullets={[
                  'Teams-per-player is the only admin parameter. Allowed range is computed server-side as 2 … floor(poolSize / playerCount); the field hint shows that range so the admin never sees a fail-after-save.',
                  '"Not possible with this player count" surfaces when teamsPerPlayer × playerCount > poolSize. Banner + inline error on the field + Save button stays enabled (so a quick reduction still saves). Start Draw is disabled until the math is valid.',
                  'Metrics block recomputes live: players (live roster count), teams (teamsPerPlayer × players), double-owned (teams - poolSize if positive, else 0).',
                  'Start Draw is admin-only and primary. It triggers the confirm modal — no double-tap-to-confirm. Modal shows the unsaved-list count so the admin can decide whether to wait.',
                ]} />
              <NoteBlock heading="03 · Readiness"
                bullets={[
                  'Polls /pool every 10s during list-prep / draft-day. Each player row shows their save state, never their list contents — privacy line in the readiness card calls this out explicitly.',
                  'Order in the readiness list matches the order used in the live draw (snake). Once the draw starts this list is hidden — replaced by the live draw view.',
                  'Admin badge on the admin row is decorative; admin permissions are server-enforced regardless of badge visibility.',
                ]} />
              <NoteBlock heading="04 · Live draw · picking"
                bullets={[
                  'On round start, server emits per-pick events over WebSocket. Each event includes player, pickIndex (1-based), suggested code (top of their saved list filtered by availability), and admin flag.',
                  'Auto-pick is the default UX: admin taps Next player → server records the suggested team. Admin can override at any time via "Choose team" which opens the picker sheet.',
                  'No-available-team: the suggested code is null AND every remaining team in the pool is owned by other players (rare but possible at round 4 with high teams-per-player). The card flips to the no-available variant and forces the admin to use Choose team.',
                  'Spectators see the exact same screen with the controls swapped for the "Waiting for the pick to be confirmed." copy. The pulsing live dot in the header doubles as the "we are all looking at this together" cue.',
                ]} />
              <NoteBlock heading="05 · Team picker sheet"
                bullets={[
                  'Search is fuzzy across name + code (case-insensitive). Filtered list re-orders to put exact code matches first, then name-prefix matches, then substring.',
                  'Taken teams render with the owner\'s initial in mono — admin can still see them but can\'t select. Tap on a taken row is a no-op (no error toast).',
                  'Selected row uses ink fill + check disc; primary CTA flips from "Pick team" disabled → "Pick {CODE}" enabled. Confirm closes the sheet AND advances the picking view in one server round-trip.',
                ]} />
              <NoteBlock heading="06 · Round summary"
                bullets={[
                  'Rendered after the round\'s final pick. Same paper-ticket vocabulary as the prediction archive.',
                  'Double-owned chips appear from round 2 onward whenever count(picks) > pool size. Each duplicate gets a small "TIE" mono tag in gold + a tinted background; the card-bottom block explains the tie-break rule.',
                  'Admin sees Next round → / Start Game →. Spectators see the same summary but with a quiet "Round X complete" line instead of the CTA.',
                ]} />
              <NoteBlock heading="07 · Phase transitions"
                bullets={[
                  'list-prep → draft-day fires automatically the moment all players have ready=true. The eyebrow word swaps; Start Draw button does NOT auto-arm — admin still has to tap it.',
                  'draft-day → in-progress is admin-only via Start Draw. All player /lists are locked atomically; clients with My List open get a 423 push and the lock state renders without reload.',
                  'in-progress → complete fires after the final pick is confirmed. The Draw tab\'s page flips to the Draw-complete state; bottom nav swaps from PRE_NAV → LIVE_NAV the first time the user navigates away.',
                ]} />
              <NoteBlock heading="08 · Bottom nav"
                bullets={[
                  'Pre-draw uses the PRE_NAV variant: Home · My List · Draw · Chat · Players. "Draw" is the focal action — same primary tab treatment as Predict on the live nav.',
                  'Both phases share the Home and Chat tabs (and their unread badges).',
                  'Once the game phase begins, the nav swaps for LIVE_NAV automatically on next route change; no UI for the user to do this manually.',
                ]} />
            </div>
          </div>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
