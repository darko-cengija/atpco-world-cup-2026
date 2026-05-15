// Prediction Standings — the second ranking surface.
// Same paper-ticket vocabulary as Main Standings, but a leaner row:
//   #  ·  Player  ·  Points
// Pts is a decimal number (per-match share of N/n) and can go negative.
// Negative balances render in stamp-red so they stand out without screaming.

// ─────────────────────────── ROW ───────────────────────────

function PredictionStandingHeader() {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '22px 1fr 80px',
      alignItems: 'center', gap: 10,
      padding: '0 16px 8px',
      borderBottom: `1px solid ${C3.ink20}`,
    }}>
      <span style={{ ...COL_HEAD_STYLE, textAlign: 'left' }}>#</span>
      <span style={{ ...COL_HEAD_STYLE, textAlign: 'left' }}>Player</span>
      <span style={{ ...COL_HEAD_STYLE, textAlign: 'right' }}>Points</span>
    </div>
  );
}

function PredictionStandingRow({ r, last }) {
  const you = r.you;
  const negative = r.pts < 0;
  const ptsColor = negative ? C3.stamp : (you ? C3.stamp : C3.ink);
  const formatted = (r.pts >= 0 ? '+' : '−') + Math.abs(r.pts).toFixed(2);
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '22px 1fr 80px',
      alignItems: 'center', gap: 10,
      padding: '13px 16px',
      borderBottom: last ? 'none' : `1px solid ${C3.ink20}`,
      background: you ? 'rgba(168,57,43,0.07)' : 'transparent',
      position: 'relative', cursor: 'pointer',
    }}>
      {you && (
        <span style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
          background: C3.stamp,
        }} />
      )}
      <MedalRank rank={r.rank} you={you} />
      <PlayerCell p={r} you={you} showFlags={false} />
      <div style={{ textAlign: 'right' }}>
        <div style={{
          fontFamily: C3.display, fontSize: 22,
          color: ptsColor, lineHeight: 1,
          fontVariantNumeric: 'tabular-nums', letterSpacing: -0.5,
        }}>{formatted}</div>
        <div style={{
          fontFamily: C3.mono, fontSize: 9,
          color: negative ? C3.stamp : C3.ink50,
          letterSpacing: 1, marginTop: 3, textTransform: 'uppercase',
        }}>
          {negative ? 'Net loss' : 'Net points'}
        </div>
      </div>
    </div>
  );
}

function PredictionStandingTable({ rows }) {
  return (
    <div>
      <PredictionStandingHeader />
      {rows.map((r, i) => (
        <PredictionStandingRow key={r.name} r={r}
          last={i === rows.length - 1} />
      ))}
    </div>
  );
}

// Rules block — dashed, mono. Sits below the table inside the same
// paper board so the explanation feels stamped onto the same receipt.
function PredictionRules({ playerCount = POOL_PLAYER_COUNT }) {
  return (
    <div style={{
      margin: '14px 14px 0',
      border: `1.5px dashed ${C3.ink20}`,
      borderRadius: 10,
      padding: '12px 14px',
      fontFamily: C3.sans, fontSize: 12, color: C3.ink70,
      lineHeight: 1.55,
    }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
        letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
        marginBottom: 8,
      }}>★ Scoring rules</div>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        <li style={{ marginBottom: 4, textWrap: 'pretty' }}>
          A correct prediction earns{' '}
          <code style={{
            fontFamily: C3.mono, fontSize: 11, color: C3.ink, fontWeight: 700,
            background: 'rgba(15,58,53,0.06)', padding: '1px 5px', borderRadius: 3,
          }}>{playerCount}/n</code>{' '}points, where{' '}
          <code style={{
            fontFamily: C3.mono, fontSize: 11, color: C3.ink, fontWeight: 700,
            background: 'rgba(15,58,53,0.06)', padding: '1px 5px', borderRadius: 3,
          }}>n</code>{' '}is the number of players who got it right.
        </li>
        <li style={{ textWrap: 'pretty' }}>
          If you do not predict, you lose{' '}
          <code style={{
            fontFamily: C3.mono, fontSize: 11, color: C3.stamp, fontWeight: 700,
            background: 'rgba(168,57,43,0.08)', padding: '1px 5px', borderRadius: 3,
          }}>1/{playerCount}</code>{' '}points.
        </li>
      </ul>
    </div>
  );
}

// Skeleton row — matches the populated row silhouette.
function PredictionStandingSkeletonRow() {
  const bar = (w, h = 10) => (
    <span style={{
      display: 'inline-block', width: w, height: h, borderRadius: 2,
      background: 'rgba(15,58,53,0.10)',
    }} />
  );
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '22px 1fr 80px',
      alignItems: 'center', gap: 10,
      padding: '13px 16px', borderBottom: `1px solid ${C3.ink20}`,
    }}>
      {bar(16, 12)}
      <span style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <span style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'rgba(15,58,53,0.10)',
        }} />
        {bar(86, 13)}
      </span>
      <span style={{ display: 'flex', justifyContent: 'flex-end' }}>
        {bar(48, 18)}
      </span>
    </div>
  );
}

// ─────────────────────────── SHELL VARIANTS ───────────────────────────

function PredictionStandingsDefault() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader title="Prediction standings" eyebrow="Pool · Live" />
        <PaperBoard
          eyebrow="Prediction Standings"
          title="Prediction points"
          subtitle="Earned by guessing match outcomes correctly. Negative balances mean you've missed more often than you've hit."
          footer="Tap any row to open that player's detail.">
          <PredictionStandingTable rows={PREDICTION_ROWS} />
          <PredictionRules />
          <div style={{ height: 14 }} />
        </PaperBoard>
      </div>
      <BottomNav variant="live" activeId="predictions" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

function PredictionStandingsLoading() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader title="Prediction standings" eyebrow="Pool · Live" />
        <PaperBoard
          eyebrow="Prediction Standings"
          title="Prediction points"
          subtitle="Earned by guessing match outcomes correctly.">
          <PredictionStandingHeader />
          {Array.from({ length: 6 }).map((_, i) => (
            <PredictionStandingSkeletonRow key={i} />
          ))}
        </PaperBoard>
      </div>
      <BottomNav variant="live" activeId="predictions" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

function PredictionStandingsEmpty() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader title="Prediction standings" eyebrow="Pool · Pre-tournament" />
        <PaperBoard
          eyebrow="Prediction Standings"
          title="Prediction points"
          subtitle="Earned by guessing match outcomes correctly.">
          <div style={{ padding: '0 14px 18px' }}>
            <TKEmpty
              title="No results yet."
              body="Predict outcomes to win points."
              action="Make predictions"
            />
          </div>
          <PredictionRules />
          <div style={{ height: 14 }} />
        </PaperBoard>
      </div>
      <BottomNav variant="live" activeId="predictions" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

Object.assign(window, {
  PredictionStandingHeader, PredictionStandingRow, PredictionStandingTable,
  PredictionStandingSkeletonRow, PredictionRules,
  PredictionStandingsDefault, PredictionStandingsLoading, PredictionStandingsEmpty,
});
