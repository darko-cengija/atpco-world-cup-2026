// Standings + Player Detail — design canvas composition.
//
// 01 · Map (overview card)
// 02 · Main Standings (default · loading · empty · narrow 360 · wide 560)
// 03 · Winning Chances (refreshing · refreshed toast · failed toast · no-sim row)
// 04 · Prediction Standings (default · loading · empty)
// 05 · Player Detail (actual · projection · empty predictions)
// 06 · Handoff notes

const ART_W = 420;
const ART_H = 920;

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

// Narrow / wide phones — same screen at different widths.
function NarrowPhoneArt({ children }) {
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

// Narrow phone using the shared Phone shell with a custom width.
// Phone is a fixed 390x844 box — for narrow / wide we wrap a Phone in a
// scaling div instead of rewriting the shell. Cleaner: just render the
// same component inside a smaller artboard frame at native size and let
// the surface tell its story.

// Custom-sized phone shell for narrow / landscape phones.
function PhoneAt({ width = 390, height = 844, children, bg, statusColor }) {
  return (
    <div style={{
      width, height, borderRadius: 44, overflow: 'hidden',
      position: 'relative', background: bg || C3.paper,
      boxShadow: '0 30px 60px rgba(0,0,0,0.18), 0 0 0 8px #111, 0 0 0 9px rgba(0,0,0,0.5)',
      fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased',
      color: '#111',
    }}>
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 115, height: 33, borderRadius: 22, background: '#000', zIndex: 50,
      }} />
      <StatusStrip color={statusColor || C3.ink} />
      <div style={{
        position: 'absolute', inset: '54px 0 0 0',
        display: 'flex', flexDirection: 'column',
      }}>{children}</div>
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 134, height: 5, borderRadius: 100,
        background: 'rgba(0,0,0,0.35)', zIndex: 60,
      }} />
    </div>
  );
}

// Standings shell at custom width — re-used by narrow / wide variants.
function StandingsAtWidth({ width, form }) {
  return (
    <PhoneAt width={width} height={844} bg={C3.paper}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader title="Standings" eyebrow="Pool · Live" />
        <PaperBoard
          eyebrow="Standings"
          title="Standings"
          subtitle="Based on results from your teams.">
          <StandingsTable rows={STANDINGS_ROWS} form={form} />
        </PaperBoard>
        <PaperBoard
          eyebrow="Winning Chances"
          title="Winning chances"
          subtitle="Based on a Monte Carlo simulation of remaining matches."
          action={<RefreshControl state="idle" lastRun="14 min ago" />}>
          <ChancesTable rows={CHANCES_ROWS} />
        </PaperBoard>
      </div>
      <BottomNav variant="live" activeId="standings" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </PhoneAt>
  );
}

function App() {
  return (
    <DesignCanvas>
      {/* ─────────── 00 · MAP ─────────── */}
      <DCSection
        id="map"
        title="Standings & Player Detail · prototype + spec"
        subtitle="The two ranking surfaces of the pool (overall + prediction) sit on the same paper-ticket vocabulary as the home list. Every board reads as a tear-off stub: stamp eyebrow, perforation, dense mono table. Player detail extends that into a one-screen receipt for a single competitor with two modes — actual results and projected end-state."
      >
        <DCArtboard id="legend" label="Legend · what's where" width={560} height={700}>
          <div className="board">
            <div className="board-eyebrow">★ Map · 00</div>
            <div className="board-title">In this canvas</div>
            <hr className="board-divider" />
            <div className="vstack" style={{ gap: 14 }}>
              {[
                ['02 · Main Standings',     '5 phones — default, loading, empty, narrow 360 (cols hide), wide 560 (full columns).'],
                ['03 · Winning Chances',    '4 phones — refreshing toast, success toast, error toast, no-sim row state.'],
                ['04 · Prediction Standings', '3 phones — default, loading, empty. Rules block lives below the table.'],
                ['05 · Player Detail',      '3 phones — actual, projection (fixed sim banner), empty predictions.'],
                ['06 · Handoff notes',      'Behaviours not visible in static mockups.'],
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
                <b>System note · </b>Pts column always uses DM Serif Display so it pops. All other numerals are JetBrains Mono with tabular-nums. Top-3 ranks render as stamped medal discs (gold / silver / bronze) — every other rank uses zero-padded mono "01" so the column still aligns.
              </div>
            </div>
          </div>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 02 · MAIN STANDINGS ─────────── */}
      <DCSection
        id="standings"
        title="02 · Main Standings"
        subtitle="Pool table — players ranked by points earned from the teams they own. Tap any row to open the player detail. Compact form drops GF/GA so all 10 columns can stay scannable on 390 width."
      >
        <DCArtboard id="st-default" label="Default · 390 (compact)" width={ART_W} height={ART_H}>
          <PhoneArt><StandingsScrollDefault form="compact" /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="st-loading" label="Loading · skeleton rows" width={ART_W} height={ART_H}>
          <PhoneArt><StandingsScrollLoading /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="st-empty" label="Empty · no results yet" width={ART_W} height={ART_H}>
          <PhoneArt><StandingsScrollEmpty /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="st-narrow" label="Narrow · 360 (cols collapse)" width={390} height={ART_H}>
          <NarrowPhoneArt><StandingsAtWidth width={360} form="compact" /></NarrowPhoneArt>
        </DCArtboard>
        <DCArtboard id="st-wide" label="Wide · 560 (full columns)" width={590} height={ART_H}>
          <NarrowPhoneArt><StandingsAtWidth width={560} form="wide" /></NarrowPhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 03 · WINNING CHANCES ─────────── */}
      <DCSection
        id="chances"
        title="03 · Winning Chances · admin states"
        subtitle="Inline section beneath Standings (one scroll, two boards). Admin-only Refresh button cycles idle → loading → toast. A no-simulation row state covers the gap between pool creation and the first calculation."
      >
        <DCArtboard id="ch-refreshing" label="Refreshing · table dims" width={ART_W} height={ART_H}>
          <PhoneArt><StandingsScrollRefreshing /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ch-success" label="Success · toast" width={ART_W} height={ART_H}>
          <PhoneArt><StandingsScrollRefreshSuccess /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ch-error" label="Failed · toast" width={ART_W} height={ART_H}>
          <PhoneArt><StandingsScrollRefreshError /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ch-nosim" label="No simulation yet" width={ART_W} height={ART_H}>
          <PhoneArt><ChancesNoSim /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 04 · PREDICTION STANDINGS ─────────── */}
      <DCSection
        id="pred"
        title="04 · Prediction Standings"
        subtitle="The second leaderboard — points from correct predictions, with negative balances rendered in stamp-red so the consequence of skipping a match is felt. Rules text lives inside the same paper card as a dashed sub-board."
      >
        <DCArtboard id="pr-default" label="Default · populated" width={ART_W} height={ART_H}>
          <PhoneArt><PredictionStandingsDefault /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="pr-loading" label="Loading · skeleton rows" width={ART_W} height={ART_H}>
          <PhoneArt><PredictionStandingsLoading /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="pr-empty" label="Empty · no results yet" width={ART_W} height={ART_H}>
          <PhoneArt><PredictionStandingsEmpty /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 05 · PLAYER DETAIL ─────────── */}
      <DCSection
        id="player"
        title="05 · Player Detail"
        subtitle="One scrolling receipt for a single player: hero with avatar + summary strip, owned-team stats table with Total row, then the prediction history as a stack of stubs. Projection mode swaps integers for decimals and pins a sim banner above the nav."
      >
        <DCArtboard id="pl-default" label="Default · actual results" width={ART_W} height={ART_H}>
          <PhoneArt><PlayerDetailDefault /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="pl-projection" label="Projection · decimals + banner" width={ART_W} height={ART_H}>
          <PhoneArt><PlayerDetailProjection /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="pl-empty" label="Empty · no finished matches" width={ART_W} height={ART_H}>
          <PhoneArt><PlayerDetailEmptyPredictions /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 06 · HANDOFF ─────────── */}
      <DCSection
        id="notes"
        title="Handoff notes"
        subtitle="Behaviours the developer needs that aren't visible in the static mockups."
      >
        <DCArtboard id="notes-card" label="Behaviours · gotchas · constants" width={720} height={920}>
          <div className="board">
            <div className="board-eyebrow">★ Handoff · 06</div>
            <div className="board-title">What to wire up</div>
            <hr className="board-divider" />
            <div className="vstack" style={{ gap: 14 }}>
              <NoteBlock heading="01 · Responsive table"
                bullets={[
                  'Two table forms — compact (<480px) and wide (≥480px). Compact drops GF and GA; GD is the lone goal-context column kept. Wide restores all 10 columns.',
                  'Switch on container width, not viewport, so the table also adapts inside split-pane layouts. Wide form is what landscape phones (~560 wide) and tablets get.',
                  'Pts column always renders in DM Serif Display 18–22px. Every other numeric cell is JetBrains Mono with font-variant-numeric: tabular-nums so columns align.',
                  'You-row treatment: stamp-red 3px left bar, tinted background (0.07 alpha), avatar ring, name + Pts in stamp-red, "(you)" suffix on the name.',
                  'Top-3 ranks render as medal discs (gold #cba14e, silver #a9a9a9, bronze #a06640) with the rank number in DM Serif. Ranks 4+ use mono "04" zero-padded so columns align.',
                ]} />
              <NoteBlock heading="02 · Winning Chances"
                bullets={[
                  'Same paper board pattern as Standings — scrolls in the same view so the user sees both contexts at once. No separate route.',
                  'Refresh button is gated on the user being an admin. Idle → Loading swaps the icon for a spinner and the label for "Refreshing". Disable the button while loading.',
                  'On success: toast "Winning chances refreshed" (success tone) + replace lastRun with "just now" + recompute table values. On failure: toast "Refresh failed · try again" (error tone). The table never clears — stale numbers stay visible.',
                  'During refresh the table dims to 50% with hatched bars in the progress fills, so the user understands the numbers on screen are about to update.',
                  'No-simulation row state: the chances table renders the roster at 50% opacity with — for both Chance and Exp pts. A notice banner above explains the state. This is what new pools see before the admin runs the first calculation.',
                ]} />
              <NoteBlock heading="03 · Prediction Standings"
                bullets={[
                  'Same row component as main standings, but the right column is points (decimal, signed) instead of Pts.',
                  'Negative balances render in stamp-red — colour, font weight, "Net loss" mono label. The brief says warning/error colour; stamp-red is the system\'s error tone and reads as warning in this paper palette.',
                  'Show the sign explicitly: +4.81 / −0.45 (real minus glyph, not hyphen). Improves scannability and matches the printed-receipt feel.',
                  'Rules block sits inside the same paper card, below the table, as a dashed-bordered sub-card. The {playerCount} and {n} tokens render as inline mono pills so the rule reads as a formula.',
                ]} />
              <NoteBlock heading="04 · Player Detail"
                bullets={[
                  'Hero summary strip is 3 cells: pool rank · team pts · pred pts. The third cell uses stamp-red when the player is the current user so their own card always points at their tournament identity.',
                  'Team stats table reuses the standings grid. Each row is a flag + name; the Total row is dashed-top, slightly tinted, mono "Total" label, Pts in display-serif.',
                  'Predictions list is one mini-stub per finished match. 3-line layout — date+stage / matchup+score / actual pill + pick pill + delta. Status disc top-right: hit (filled green), miss (outlined red), missing (dashed grey).',
                  'Penalty / extra-time deciders show as a small mono line below the score ("Bosnia & Herzegovina won 4-3 on penalties"). The pick still scores against the regulation result.',
                ]} />
              <NoteBlock heading="05 · Projection mode"
                bullets={[
                  'Triggered from a toggle above the team stats (not pictured — lives in the player-detail hero strip on the real screen). Toggling rewrites the team-stats table values to decimal Monte Carlo averages.',
                  'Decimal cells should ALWAYS show one digit after the dot, even for whole numbers (e.g. "5.0"). Keeps the column visually distinct from the integer mode.',
                  'Pin the simulation banner above the bottom nav as a fixed paper-ink strip. Banner is non-dismissible — it disappears when projection is toggled off.',
                  'Predictions list stays in actual mode below the projected stats. Past hits don\'t get re-simulated — they are frozen receipts.',
                ]} />
              <NoteBlock heading="06 · Empty / loading"
                bullets={[
                  'Loading uses two skeleton patterns: skeleton row for standings, skeleton row for prediction-standings. Both match the populated silhouette so nothing reflows when data arrives. The chances card shows a small inline spinner (it\'s not list-shaped).',
                  'Empty copy is exact-match to the brief — never paraphrase. "No results yet. Standings will appear after matches are played." / "Winning chances will appear after the next calculation." / "No results yet. Predict outcomes to win points." / "No finished matches yet."',
                  'The empty Player Detail still renders the team stats table — but every value reads 0 / 0 / 0 — so the player has a sense of what will populate. Easier to grok than a single big empty state.',
                ]} />
            </div>
          </div>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
