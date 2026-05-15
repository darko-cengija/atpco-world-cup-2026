// World Cup 26 — Match prediction surfaces.
// Composes the three screen files onto a Design Canvas:
//   01 · Match-card vocabulary (5 states side by side)
//   02 · Home · Upcoming Matches (default, loading, error, empty)
//   03 · Prediction detail (group blank → selected → saving → saved → advance)
//   04 · Knockout selector
//   05 · Locked states (with pick, no pick)
//   06 · Detail edge cases (loading, not found)
//   07 · Finished Matches (populated, loading, empty)
//   08 · Handoff notes

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

// Helper: a small framed mini-card preview for the vocabulary section.
// Wraps a single MatchTicket in a fixed-width board so all five states sit
// at the same scale.
function MiniCard({ children, label, hint }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      background: '#e6dcc5',
      backgroundImage: `radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
                        radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px)`,
      backgroundSize: '3px 3px, 7px 7px',
      backgroundPosition: '0 0, 1.5px 1.5px',
      padding: '20px 0',
      display: 'flex', flexDirection: 'column',
    }}>
      <div style={{ padding: '0 20px 12px' }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
          letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
        }}>★ {label}</div>
        {hint && (
          <div style={{
            fontFamily: C3.sans, fontSize: 12, color: C3.ink70,
            marginTop: 4, lineHeight: 1.4, textWrap: 'pretty',
          }}>{hint}</div>
        )}
      </div>
      <div style={{ marginTop: 6 }}>{children}</div>
    </div>
  );
}

function App() {
  return (
    <DesignCanvas>
      {/* ─────────── 00 · MAP ─────────── */}
      <DCSection
        id="map"
        title="Match Predictions · prototype + spec"
        subtitle="Every screen here extends the Match Ticket direction locked in Stage 1. Tickets gain four new footer treatments (live, locked-with-pick, locked-no-pick, predicted-stamp). The prediction detail screen is a single scrollable column: match headline → outcome selector → submit/locked row → everyone's predictions. Finished stubs add a chip grid that flips every player's pick against the actual outcome."
      >
        <DCArtboard id="legend" label="Legend · what's where" width={540} height={680}>
          <div className="board">
            <div className="board-eyebrow">★ Map · 00</div>
            <div className="board-title">In this canvas</div>
            <hr className="board-divider" />
            <div className="vstack" style={{ gap: 14 }}>
              {[
                ['01 · Card vocabulary',  '5 mini-frames — every footer treatment the home list can render.'],
                ['02 · Upcoming Matches', '4 phones — default (mixed list incl. live), loading, error banner, empty.'],
                ['03 · Prediction detail',  '6 phones — blank → selected → re-selected → saving → saved → "moving on".'],
                ['04 · Knockout selector', '1 phone — 4-cell selector (1 · X1 · X2 · 2) with hints.'],
                ['05 · Locked detail',     '2 phones — locked with pick, locked with no pick.'],
                ['06 · Detail edge cases', '2 phones — loading skeleton, match-not-found.'],
                ['07 · Finished Matches',  '3 phones — populated archive, loading, empty.'],
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
                <b>System note · </b>The Predict CTA is the only primary action on the home list. Everything else (Edit, lock pills, Save Prediction) reads as secondary or stamped — keeps the core repeated workflow obvious.
              </div>
            </div>
          </div>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 01 · CARD VOCABULARY ─────────── */}
      <DCSection
        id="vocab"
        title="01 · Match card · footer vocabulary"
        subtitle="One ticket body, five footer treatments. The home list mixes any combination of these. Skeleton tickets share the same silhouette so the loading state doesn't shift layout when content arrives."
      >
        <DCArtboard id="vocab-open" label="Open · primary Predict CTA" width={ART_W} height={500}>
          <MiniCard label="State · open" hint="No prediction yet. Primary CTA on the right.">
            <MatchTicket m={MATCHES[0]} state="open" />
          </MiniCard>
        </DCArtboard>
        <DCArtboard id="vocab-predicted" label="Open · already predicted" width={ART_W} height={500}>
          <MiniCard label="State · predicted" hint="Stamp shows the pick. Edit reopens the detail screen.">
            <MatchTicket m={MATCHES[1]} state="open" />
          </MiniCard>
        </DCArtboard>
        <DCArtboard id="vocab-live" label="Live · in play, score visible" width={ART_W} height={500}>
          <MiniCard label="State · live" hint="Score replaces VS. Live + minute pulse in the strip.">
            <MatchTicket m={MATCH_LIVE} state="live" />
          </MiniCard>
        </DCArtboard>
        <DCArtboard id="vocab-locked-pred" label="Locked · with prediction" width={ART_W} height={500}>
          <MiniCard label="State · locked + pick" hint="Kick-off passed. Your pick is fixed; lock pill on the right.">
            <MatchTicket m={MATCH_LOCKED_PRED} state="locked" />
          </MiniCard>
        </DCArtboard>
        <DCArtboard id="vocab-locked-none" label="Locked · no prediction" width={ART_W} height={500}>
          <MiniCard label="State · locked, no pick" hint='"No prediction" reads in stamp red — visible reminder that the slot was missed.'>
            <MatchTicket m={MATCH_LOCKED_NONE} state="locked" />
          </MiniCard>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 02 · UPCOMING MATCHES (HOME) ─────────── */}
      <DCSection
        id="home"
        title="02 · Home · Upcoming Matches"
        subtitle="Top brand bar from the global shell. List is a mix of states so the user always sees their next action immediately. Bottom Finished Matches link is the only secondary route — the live tab nav handles the rest."
      >
        <DCArtboard id="home-default" label="Default · mixed list incl. live" width={ART_W} height={ART_H}>
          <PhoneArt><HomeUpcomingMatches /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="home-loading" label="Loading · skeleton tickets" width={ART_W} height={ART_H}>
          <PhoneArt><HomeUpcomingLoading /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="home-error" label="Error · couldn't load" width={ART_W} height={ART_H}>
          <PhoneArt><HomeUpcomingError /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="home-empty" label="Empty · no upcoming matches" width={ART_W} height={ART_H}>
          <PhoneArt><HomeUpcomingEmpty /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 03 · PREDICTION DETAIL (GROUP) ─────────── */}
      <DCSection
        id="detail-group"
        title="03 · Prediction detail · group match"
        subtitle="Reached by tapping Predict or Edit on any open ticket. Single column: match headline → outcome selector → submit → everyone's predictions. Submit cycles disabled → idle → saving → saved → moving-on (auto-advance to the next un-predicted match)."
      >
        <DCArtboard id="det-blank" label="Blank · Save disabled" width={ART_W} height={ART_H}>
          <PhoneArt><PredictionGroupBlank /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="det-selected" label="1 selected · Save enabled" width={ART_W} height={ART_H}>
          <PhoneArt><PredictionGroupSelected /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="det-draw" label="X re-selected · dirty" width={ART_W} height={ART_H}>
          <PhoneArt><PredictionGroupDraw /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="det-saving" label="Saving · spinner" width={ART_W} height={ART_H}>
          <PhoneArt><PredictionSaving /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="det-saved" label="Saved · success flash" width={ART_W} height={ART_H}>
          <PhoneArt><PredictionSaved /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="det-advance" label='Saved · "Moving on…"' width={ART_W} height={ART_H}>
          <PhoneArt><PredictionSavedAdvance /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 04 · KNOCKOUT SELECTOR ─────────── */}
      <DCSection
        id="detail-knockout"
        title="04 · Prediction detail · knockout"
        subtitle="From the Round of 16 onwards. The selector grows to four cells so the user can pick which side advances on a draw. Submit/locked rows behave identically."
      >
        <DCArtboard id="det-knockout" label="Knockout · X1 selected" width={ART_W} height={ART_H}>
          <PhoneArt><PredictionKnockout /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 05 · LOCKED DETAIL ─────────── */}
      <DCSection
        id="detail-locked"
        title="05 · Prediction detail · locked"
        subtitle="After kick-off the screen reads as a finished receipt: outcome cells dim, submit row is replaced by a dashed Locked panel, and the everyone's predictions list reveals everyone's picks."
      >
        <DCArtboard id="det-locked-with" label="Locked · you predicted 1" width={ART_W} height={ART_H}>
          <PhoneArt><PredictionLockedWithPick /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="det-locked-none" label="Locked · no prediction" width={ART_W} height={ART_H}>
          <PhoneArt><PredictionLockedNoPick /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 06 · DETAIL EDGE CASES ─────────── */}
      <DCSection
        id="detail-edges"
        title="06 · Prediction detail · edge cases"
        subtitle="Loading skeleton mirrors the real layout so nothing reflows when data arrives. Not-found surface uses the same paper card vocabulary, with a 'void ticket' stamp so the failure feels in-system."
      >
        <DCArtboard id="det-loading" label="Loading · skeleton" width={ART_W} height={ART_H}>
          <PhoneArt><PredictionLoading /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="det-404" label="Match not found · 404" width={ART_W} height={ART_H}>
          <PhoneArt><PredictionNotFound /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 07 · FINISHED MATCHES ─────────── */}
      <DCSection
        id="finished"
        title="07 · Finished Matches"
        subtitle="Reached from the bottom link on Upcoming. Each stub flips every player's pick against the actual outcome. Three statuses on the chips — hit (green), miss (stamp red), none (dashed). Knockout draws show X1 / X2 in the outcome stamp so the path of advancement stays explicit."
      >
        <DCArtboard id="fin-populated" label="Populated · 3 stubs filed" width={ART_W} height={ART_H}>
          <PhoneArt><FinishedMatchesScreen /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="fin-loading" label="Loading · skeleton stubs" width={ART_W} height={ART_H}>
          <PhoneArt><FinishedLoading /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="fin-empty" label="Empty · no finished matches" width={ART_W} height={ART_H}>
          <PhoneArt><FinishedEmpty /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 08 · HANDOFF NOTES ─────────── */}
      <DCSection
        id="notes"
        title="Handoff notes"
        subtitle="Behaviour the developer needs that isn't visible in the static mockups."
      >
        <DCArtboard id="notes-card" label="Behaviours · gotchas · constants" width={700} height={820}>
          <div className="board">
            <div className="board-eyebrow">★ Handoff · 09</div>
            <div className="board-title">What to wire up</div>
            <hr className="board-divider" />
            <div className="vstack" style={{ gap: 14 }}>
              <NoteBlock heading="01 · Card states"
                bullets={[
                  'Locked at kick-off. The home list polls the schedule every 60s — when a fixture\'s kick-off passes, its footer flips from Predict/Edit → locked (with the user\'s last-saved pick if any). No further client edits accepted; the server rejects them anyway with 409.',
                  'Live transitions: when status crosses kicked-off → in-play, swap VS for the score and add the Live · minute badge. Minute updates every 30s; the dot animation is decorative only.',
                  '"You predicted X" pill in locked footers must show what was saved, not what\'s selected in the local UI — predictions are immutable after kick-off.',
                ]} />
              <NoteBlock heading="02 · Outcome selector"
                bullets={[
                  '3-cell group selector and 4-cell knockout selector share the same OutcomeCell component. Knockout adds an "X1 / X2" pair distinguishing which side advances on a draw — submitting X1 vs X2 is a different prediction.',
                  'Selected cell uses ink fill, mono caps subtitle, and a stamp-red check disc top-right. Pressed state nudges 1px down so taps feel physical.',
                  'Disabled = locked. Border switches solid → dashed and the colour mutes; selection remains visible (the actual saved pick) but no cell is interactive.',
                ]} />
              <NoteBlock heading="03 · Submit cycle"
                bullets={[
                  'Save Prediction starts disabled when the local pick equals the server pick. Any change → idle (enabled, ink fill, → trailing).',
                  'On tap: saving (spinner + "Saving…") → success (green fill + "Prediction saved", 1200ms) → either drop back to disabled if user stays on screen, or transition to success-advance ("Saved · Moving on…") + a 2s countdown if there\'s an un-predicted next match.',
                  'After advance, route to the next match\'s detail screen with the selector blank — never auto-pick a default outcome.',
                  'Error case (not pictured): banner under the submit row, button returns to idle. Inline error supersedes any toast.',
                ]} />
              <NoteBlock heading="04 · Everyone's predictions"
                bullets={[
                  'Public after submission. Listed in roster order (the same order used in Standings · Players) so users learn to scan the same column every match.',
                  'You-row is highlighted with a stamp-red ring on the avatar + tinted background. The chip variant is "you" (ink fill) — visually loudest in the list.',
                  'Pre-kick-off privacy mode (out of scope here, optional Tweak later): hide the column entirely with a "Hidden until kick-off" mono line, and only reveal yourself.',
                ]} />
              <NoteBlock heading="05 · Finished archive"
                bullets={[
                  'Chips arranged in a 2-col grid sorted by player roster order. Hit = green outline + green fill on the chip; miss = stamp-red outline; missing = dashed border.',
                  'Hit rate is correct/total — count missing as misses. Used as a header tally inside each stub and as a tiebreaker on the standings page.',
                  'Knockout outcomes show X1 / X2 in the Actual outcome stamp. If a chip says X1 and the actual is X2 (both draws but wrong advancement guess), that\'s still a miss — strict equality.',
                  'Penalty / extra-time deciders show below the score as a mono line ("Bosnia & Herzegovina won 4-3 on penalties"). The pick still scores against the regulation result.',
                ]} />
              <NoteBlock heading="06 · Empty / error / 404"
                bullets={[
                  'No upcoming matches → TKEmpty dashed card. Don\'t mock fixtures; let the schedule be the source of truth.',
                  'Load error → TKBanner tone=error pinned to the top of the scroll; previously-cached cards render at 40% opacity behind it so the user knows the data they\'re seeing is stale.',
                  'Match-not-found → the "void ticket" 404 paper card. Two CTAs: Back to home (secondary) + Schedule (primary).',
                  'All copy is in the design system\'s sentence style — never "Oops" or "Something went wrong". Be specific.',
                ]} />
            </div>
          </div>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
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

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
