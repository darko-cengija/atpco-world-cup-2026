// World Cup 26 — Players & Teams + admin tools.
// Composes the player/admin/replace-team screens onto a Design Canvas.

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
        letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
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
        title="Players &amp; Teams · prototype + spec"
        subtitle='Two related surfaces in one tab — a read-only player view ("Assigned teams") and an admin counterpart ("Assign teams to players") that adds chip ×, Add Team picker, the game-started toggle, delete-player flow, and a Replace Team sheet. All chrome reuses the Match Ticket DS — paper texture, dashed tear-lines, mono metadata, stamped CTAs — no new direction.'
      >
        <DCArtboard id="legend" label="Legend · what's where" width={580} height={780}>
          <div className="board">
            <div className="board-eyebrow">★ Map · 00</div>
            <div className="board-title">In this canvas</div>
            <hr className="board-divider" />
            <div className="vstack" style={{ gap: 14 }}>
              {[
                ['01 · Player view',          '3 phones — loading skeleton (matches the loaded silhouette), mid-draw partial state, all-assigned default.'],
                ['02 · Admin · base',         '3 phones — game not started (toggle off), game started (toggle on + Stop pill), toggle in mid-flight (loading variant).'],
                ['03 · Admin · per-player',   '4 phones — inline Add Team picker open, picker with no-available state, inline delete confirmation, player card deleting (in-flight).'],
                ['04 · Stop tracking modal',  '2 phones — modal in context over the admin page, plus the modal alone on background.'],
                ['05 · Replace Team sheet',   '7 phones — default (no replacement yet), with selection + notice, FIFA-rank validation error, warning banner (different confederation), error banner (server failure), no-available-teams empty, busy submit. Plus the sheet on its own.'],
                ['06 · Handoff notes',        'What needs wiring up — privacy of assignments, destructive flow rules, request shapes.'],
              ].map(([h, b]) => (
                <div key={h} style={{
                  padding: '10px 12px', borderRadius: 8,
                  border: `1px dashed ${C3.ink20}`,
                }}>
                  <div style={{
                    fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
                    letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 600,
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
                <b>System note · </b> Destructive admin actions (Stop tracking, Replace Team, Delete player) consistently use the stamp-red accent, are confirmed inline or in a paper modal, and never appear as a single tap. Friendly tone — destructive weight — never a hidden gun.
              </div>
            </div>
          </div>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 01 · PLAYER VIEW ─────────── */}
      <DCSection
        id="player-view"
        title="01 · Player view · read-only"
        subtitle='Subtitle "Assigned teams". Each player gets one paper ticket — avatar, display name, optional Admin stamp, team count, dashed tear-line, then a 2-up grid of team chips. Empty state replaces the grid with a dashed "No assigned teams" slot — same height as a single chip row so layout doesn&apos;t jump.'
      >
        <DCArtboard id="pv-loading" label="Loading · skeleton" width={ART_W} height={ART_H}>
          <PhoneArt><PlayersLoading /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="pv-partial" label="Mid-draw · partial assignments" width={ART_W} height={ART_H}>
          <PhoneArt><PlayersPartial /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="pv-assigned" label="All assigned · default" width={ART_W} height={ART_H}>
          <PhoneArt><PlayersAllAssigned /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 02 · ADMIN · BASE ─────────── */}
      <DCSection
        id="admin-base"
        title="02 · Admin view · base"
        subtitle='Subtitle "Assign teams to players". Adds the Game Started toggle card (off / on / loading) at the top, and a Replace Team action card above the player list. Every team chip now carries a remove ×, every card carries an Add Team affordance, every player has a destructive trash icon in the top-right.'
      >
        <DCArtboard id="ad-off" label="Game not started · toggle off" width={ART_W} height={ART_H}>
          <PhoneArt><AdminGameOff /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ad-on" label="Game started · since 11 Jun" width={ART_W} height={ART_H}>
          <PhoneArt><AdminGameOn /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ad-loading" label="Toggle · loading (server round-trip)" width={ART_W} height={ART_H}>
          <PhoneArt><AdminGameLoading /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 03 · ADMIN · PER-PLAYER EDITING ─────────── */}
      <DCSection
        id="admin-edits"
        title="03 · Admin · per-player editing"
        subtitle="Add Team is an inline expansion of the player card — search + 4-row preview list, taps to assign. No available teams renders as an in-card empty state instead of a separate page. Delete uses the same inline-confirmation pattern: red strip + Yes/No mono buttons, no second modal."
      >
        <DCArtboard id="ad-picker" label="Picker open · default results" width={ART_W} height={ART_H}>
          <PhoneArt><AdminPickerOpen /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ad-picker-empty" label="Picker · no available teams" width={ART_W} height={ART_H}>
          <PhoneArt><AdminPickerEmpty /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ad-del-confirm" label="Inline delete · Yes/No" width={ART_W} height={ART_H}>
          <PhoneArt><AdminDeleteConfirm /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ad-del-busy" label="Deleting · in-flight" width={ART_W} height={ART_H}>
          <PhoneArt><AdminDeleting /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 04 · STOP TRACKING MODAL ─────────── */}
      <DCSection
        id="stop-modal"
        title="04 · Stop tracking · confirm modal"
        subtitle='Flipping the Game Started toggle off after it has been on is destructive — the saved scores are about to be invalidated. The modal pulls the body copy directly from spec: "This will reset the draw, return lists to the default ranking, and delete assigned teams." Rotated red stamp marks the action as irreversible.'
      >
        <DCArtboard id="sm-context" label="Modal · in context" width={ART_W} height={ART_H}>
          <PhoneArt><AdminWithStopModal /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="sm-bare" label="Modal · alone" width={400} height={420}>
          <div style={{
            width: '100%', height: '100%',
            display: 'grid', placeItems: 'center', padding: 20,
            background: '#e6dcc5',
            backgroundImage: `radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
                              radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px)`,
            backgroundSize: '3px 3px, 7px 7px',
            backgroundPosition: '0 0, 1.5px 1.5px',
          }}>
            <StopTrackingModal />
          </div>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 05 · REPLACE TEAM SHEET ─────────── */}
      <DCSection
        id="replace-sheet"
        title="05 · Replace Team · bottom sheet"
        subtitle="Tournament withdrawals happen (e.g. a team drops out the day before kickoff). The Replace sheet swaps an assigned team for a non-pool team in one round-trip, keeping the owning player's predictions where possible. Stamped red eyebrow, mandatory preview block, and a stamp-red submit make sure no one fires this by accident."
      >
        <DCArtboard id="rs-default" label="Default · no replacement yet" width={ART_W} height={ART_H}>
          <PhoneArt><ReplaceSheetDefault /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="rs-selected" label="Replacement selected · notice" width={ART_W} height={ART_H}>
          <PhoneArt><ReplaceSheetWithSelection /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="rs-rank-err" label="FIFA rank · validation error" width={ART_W} height={ART_H}>
          <PhoneArt><ReplaceSheetRankError /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="rs-warn" label="Warning · different confederation" width={ART_W} height={ART_H}>
          <PhoneArt><ReplaceSheetWarning /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="rs-error" label="Error banner · service offline" width={ART_W} height={ART_H}>
          <PhoneArt><ReplaceSheetError /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="rs-empty" label="Empty results · no available teams" width={ART_W} height={ART_H}>
          <PhoneArt><ReplaceSheetEmpty /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="rs-busy" label="Submit · replacing…" width={ART_W} height={ART_H}>
          <PhoneArt><ReplaceSheetBusy /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="rs-bare" label="Sheet · alone (full anatomy)" width={400} height={780}>
          <div style={{
            width: '100%', height: '100%',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
            background: '#e6dcc5',
            backgroundImage: `radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
                              radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px)`,
            backgroundSize: '3px 3px, 7px 7px',
            backgroundPosition: '0 0, 1.5px 1.5px',
          }}>
            <ReplaceTeamSheet
              dropped="BR"
              selectedCode="EC"
              bannerNotice="Marko's predictions for Brazil will be reassigned to Ecuador for un-played fixtures only."
              submit="enabled"
            />
          </div>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 06 · HANDOFF ─────────── */}
      <DCSection
        id="notes"
        title="Handoff notes"
        subtitle="Behaviour the developer needs that isn't visible in the static mockups."
      >
        <DCArtboard id="notes-card" label="Behaviours · gotchas · constants" width={720} height={1080}>
          <div className="board">
            <div className="board-eyebrow">★ Handoff · 06</div>
            <div className="board-title">What to wire up</div>
            <hr className="board-divider" />
            <div className="vstack" style={{ gap: 14 }}>
              <NoteBlock heading="01 · Page identity"
                bullets={[
                  'Same page, two roles. The page identity stays "Players and Teams" regardless of admin/non-admin. The subtitle is the role tell — "Assigned teams" vs. "Assign teams to players".',
                  'Tab is "Players" in the bottom nav (both pre-draw and live nav). Pre-game uses the pre-draw nav; once Game Started is toggled on we swap to the live nav on next route change.',
                  'Loading uses a skeleton matched to the loaded silhouette — same avatar size, same tear line, same chip slots — so nothing reflows when data lands.',
                ]} />
              <NoteBlock heading="02 · Player ticket"
                bullets={[
                  'Top row: 40px avatar · display name · optional Admin stamp · team count. Count uses tabular-nums so 12/20 stays aligned.',
                  'Tear line is decorative only. Notches are paper-colored discs overlapping the card edges; the dashed line connects them. Identical recipe to the prediction ticket so visual language stays one system.',
                  'Empty state ("No assigned teams") is the dashed slot that replaces the chip grid. Same vertical height as one chip row to avoid layout jitter when a player goes from empty → 1 → many.',
                  'Chip uses 28px FlagSquare + 3-letter mono code + display name. 2-column grid by default; wraps at <340px wide.',
                ]} />
              <NoteBlock heading="03 · Game Started toggle"
                bullets={[
                  'Three permanent states: off (Points are not counted), on (Since <ISO-formatted match-1 kickoff>), loading (mid round-trip).',
                  'A fourth latent state — disabled — surfaces if the draw isn\'t complete yet. The toggle renders dimmed with copy "Not yet — start the draw first" and ignores taps.',
                  'Flipping ON is a one-tap. Flipping OFF after it\'s been on triggers the Stop Tracking modal — never auto-confirm.',
                  'Time is formatted to the pool admin\'s locale and timezone, not the viewer\'s, so everyone sees the same string.',
                ]} />
              <NoteBlock heading="04 · Stop tracking modal"
                bullets={[
                  'Body copy is spec-fixed: "This will reset the draw, return lists to the default ranking, and delete assigned teams." Don\'t paraphrase.',
                  'Buttons: No (secondary, on the left) · Yes (destructive, on the right). Tab order matches.',
                  'Backdrop is a 55% ink wash + 1px blur. Closing via Esc or backdrop counts as No.',
                  'Yes triggers a 3-call rollback in this order — assignments deleted → lists reset to FIFA rank → draw status reset → toggle flips off. UI shows a single Replacing… spinner during the round-trip; on failure, surface a stamp-red toast and keep state.',
                ]} />
              <NoteBlock heading="05 · Replace Team button"
                bullets={[
                  'Always present in admin mode, regardless of game-started state. Opens the Replace Team bottom sheet.',
                  'Dropped Team defaults to "—" if not pre-selected; the dropdown surfaces every team in the pool with its current owner.',
                  'If invoked from a specific team chip (long-press), the sheet opens with that team pre-selected as the dropped team.',
                ]} />
              <NoteBlock heading="06 · Add Team picker (inline)"
                bullets={[
                  'Tap "Add Team" inside a player ticket → the dashed pill expands into a bordered picker. Same width as the chip grid, no overlay.',
                  'Search is fuzzy across name + code (case-insensitive). Results are limited to ~4 rows visible; scroll inside the picker.',
                  'If every team in the pool is owned, swap the rows for the no-available state — title in mono caps, body explaining the constraint.',
                  'Closing the picker via the × discards the search; the picker also dismisses automatically after a successful pick.',
                ]} />
              <NoteBlock heading="07 · Delete player flow"
                bullets={[
                  'Trash icon in the player card\'s top-right opens an inline confirmation strip (stamp-red border-left, "Delete?" copy, Yes / No).',
                  'Confirming flips the card to the deleting state: 55% opacity, dashed chip borders, controls hidden. Server response removes the card from the list with a brief fade.',
                  'Deleting a player also frees their teams back to the pool; surface a quiet "+ N teams returned" mono line below the next player ticket for 4 seconds.',
                  'The pool admin cannot be deleted via this control — the trash icon is hidden on their own row.',
                ]} />
              <NoteBlock heading="08 · Replace Team bottom sheet"
                bullets={[
                  'Sheet is full-width on mobile, max 430px on wider phones. Header is sticky; submit/cancel footer is sticky; body scrolls between.',
                  'Dropped team select shows: flag · name · "player <owner> · pool rank #N". Tapping opens an in-sheet team list — same row pattern as the replacement list.',
                  'Replacement search filters across name + code, falls back to "No available teams." with no fuzzy match. The FIFA rank input below is an escape hatch — accepts any positive whole number up to 211 and creates a new team record.',
                  'Validation runs on blur AND on submit. Rank validation: required only if no replacement was picked from the list. Allowed values: positive whole numbers — error string is spec-fixed: "Rank must be a positive whole number."',
                  'Preview block is mandatory — it renders even before a replacement is picked (with the dashed empty target slot), so the admin always sees what\'s about to change.',
                  'Different-confederation warning fires when the replacement is in a different confed than the dropped team. Friendly tone — not a block, just a heads-up that group-stage standings won\'t be affected.',
                  'Submit is stamp-red. While busy: spinner + "Replacing…" copy, button is non-interactive. On 2xx: sheet dismisses, the player ticket animates the swap with a subtle 1-frame highlight.',
                  'Errors keep the sheet open with all inputs preserved + an error banner pinned to the top so the admin doesn\'t lose context.',
                ]} />
              <NoteBlock heading="09 · Permissions + privacy"
                bullets={[
                  'Admin actions (×, Add Team, trash, Replace, Stop) are server-enforced regardless of UI state. A non-admin who reaches an admin URL gets the player view, not a permission error.',
                  'The player view shows OTHER players\' assigned teams as well — that\'s intentional. The draw is a social moment; secrecy ends when the draw is filed.',
                  'Pre-draw and mid-draw views show the same screen with partial data; the empty/partial state is "No assigned teams" until the live draw has filed at least one round.',
                ]} />
            </div>
          </div>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
