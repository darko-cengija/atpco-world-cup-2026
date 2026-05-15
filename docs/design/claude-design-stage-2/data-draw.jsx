// Pre-draw / draft-day data: extended flag set, team pool,
// player roster (with draw-ready states), and sample draw timelines.

// ─────────────────────────── EXTRA FLAGS
// Stripe-based simplifications — same viewBox / preserveAspectRatio as
// the originals in shared.jsx. Object.assign extends window.FLAGS in
// place so every FlagSquare / FlagCircle just works.

function StripeFlag({ dir = 'h', colors, mark, markColor = '#000', emblem }) {
  // dir: 'h' (horizontal) | 'v' (vertical)
  const isH = dir === 'h';
  const n = colors.length;
  return (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      {colors.map((c, i) => (
        <rect key={i}
          x={isH ? 0 : (30 / n) * i}
          y={isH ? (20 / n) * i : 0}
          width={isH ? 30 : 30 / n}
          height={isH ? 20 / n : 20}
          fill={c} />
      ))}
      {emblem === 'disc' &&
        <circle cx="15" cy="10" r="3" fill={markColor} />}
      {emblem === 'star' &&
        <polygon
          transform="translate(15 10)"
          points="0,-3 0.9,-0.9 3,-0.9 1.3,0.4 2,2.7 0,1.3 -2,2.7 -1.3,0.4 -3,-0.9 -0.9,-0.9"
          fill={markColor} />}
      {emblem === 'crescent' && (
        <g>
          <circle cx="11" cy="10" r="3.2" fill={markColor} />
          <circle cx="12.5" cy="10" r="2.6" fill={colors[0]} />
        </g>
      )}
      {emblem === 'diamond' &&
        <polygon points="15,3 27,10 15,17 3,10" fill={markColor} />}
      {mark}
    </svg>
  );
}

const EXTRA_FLAGS = {
  AR: <StripeFlag dir="h" colors={['#74acdf','#f5f3ec','#74acdf']} emblem="disc" markColor="#f5c324"/>,
  BR: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#069c46"/>
      <polygon points="15,3 27,10 15,17 3,10" fill="#f5c324"/>
      <circle cx="15" cy="10" r="3" fill="#1c4b9b"/>
    </svg>
  ),
  FR: <StripeFlag dir="v" colors={['#1c4b9b','#f5f3ec','#c8362b']}/>,
  DE: <StripeFlag dir="h" colors={['#222','#c8362b','#f5c324']}/>,
  ES: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#c8362b"/>
      <rect width="30" height="10" y="5" fill="#f5c324"/>
      <rect x="6.5" y="8" width="3" height="4.2" fill="#c8362b" rx="0.4"/>
    </svg>
  ),
  EN: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#f5f3ec"/>
      <rect x="13" y="0" width="4" height="20" fill="#c8362b"/>
      <rect x="0" y="8" width="30" height="4" fill="#c8362b"/>
    </svg>
  ),
  IT: <StripeFlag dir="v" colors={['#0a7a3b','#f5f3ec','#c8362b']}/>,
  NL: <StripeFlag dir="h" colors={['#c8362b','#f5f3ec','#1c4b9b']}/>,
  BE: <StripeFlag dir="v" colors={['#222','#f5c324','#c8362b']}/>,
  PT: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#c8362b"/>
      <rect width="12" height="20" fill="#0a7a3b"/>
      <circle cx="12" cy="10" r="2.6" fill="none" stroke="#f5c324" strokeWidth="0.5"/>
    </svg>
  ),
  HR: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="6.66" fill="#c8362b"/>
      <rect width="30" height="6.66" y="6.66" fill="#f5f3ec"/>
      <rect width="30" height="6.68" y="13.33" fill="#1c4b9b"/>
      <rect x="13.5" y="7.5" width="3" height="3" fill="#c8362b"/>
    </svg>
  ),
  CH: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#c8362b"/>
      <rect x="13" y="7" width="4" height="6" fill="#f5f3ec"/>
      <rect x="12" y="8" width="6" height="4" fill="#f5f3ec"/>
    </svg>
  ),
  PL: <StripeFlag dir="h" colors={['#f5f3ec','#c8362b']}/>,
  DK: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#c8362b"/>
      <rect x="9" y="0" width="3.5" height="20" fill="#f5f3ec"/>
      <rect x="0" y="8.25" width="30" height="3.5" fill="#f5f3ec"/>
    </svg>
  ),
  NO: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#c8362b"/>
      <rect x="9" y="0" width="4" height="20" fill="#f5f3ec"/>
      <rect x="0" y="8" width="30" height="4" fill="#f5f3ec"/>
      <rect x="10" y="0" width="2" height="20" fill="#1c4b9b"/>
      <rect x="0" y="9" width="30" height="2" fill="#1c4b9b"/>
    </svg>
  ),
  SE: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#1c4b9b"/>
      <rect x="9" y="0" width="3" height="20" fill="#f5c324"/>
      <rect x="0" y="8.5" width="30" height="3" fill="#f5c324"/>
    </svg>
  ),
  US: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#f5f3ec"/>
      {Array.from({length:7}).map((_,i)=>(
        <rect key={i} width="30" height="1.54" y={i*3.08} fill="#c8362b"/>
      ))}
      <rect width="12" height="10.78" fill="#1c4b9b"/>
    </svg>
  ),
  JP: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#f5f3ec"/>
      <circle cx="15" cy="10" r="4.5" fill="#c8362b"/>
    </svg>
  ),
  AU: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#1c4b9b"/>
      <rect width="15" height="10" fill="#1c4b9b"/>
      <path d="M0 0 L15 10 M15 0 L0 10" stroke="#f5f3ec" strokeWidth="1.2"/>
      <path d="M0 0 L15 10 M15 0 L0 10" stroke="#c8362b" strokeWidth="0.5"/>
      <path d="M7.5 0 V10 M0 5 H15" stroke="#f5f3ec" strokeWidth="1.8"/>
      <path d="M7.5 0 V10 M0 5 H15" stroke="#c8362b" strokeWidth="0.8"/>
      <polygon transform="translate(22 14) scale(0.45)" points="0,-3 0.9,-0.9 3,-0.9 1.3,0.4 2,2.7 0,1.3 -2,2.7 -1.3,0.4 -3,-0.9 -0.9,-0.9" fill="#f5f3ec"/>
    </svg>
  ),
  AR2: null, // placeholder so commas stay readable
  MA: <StripeFlag dir="h" colors={['#c8362b']} emblem="star" markColor="#0a7a3b"/>,
  SN: <StripeFlag dir="v" colors={['#0a7a3b','#f5c324','#c8362b']} emblem="star" markColor="#0a7a3b"/>,
  NG: <StripeFlag dir="v" colors={['#0a7a3b','#f5f3ec','#0a7a3b']}/>,
  EG: <StripeFlag dir="h" colors={['#c8362b','#f5f3ec','#222']} emblem="disc" markColor="#b3892e"/>,
  CI: <StripeFlag dir="v" colors={['#d9851b','#f5f3ec','#0a7a3b']}/>,
  GH: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="6.66" fill="#c8362b"/>
      <rect width="30" height="6.66" y="6.66" fill="#f5c324"/>
      <rect width="30" height="6.68" y="13.33" fill="#0a7a3b"/>
      <polygon transform="translate(15 10) scale(0.9)" points="0,-3 0.9,-0.9 3,-0.9 1.3,0.4 2,2.7 0,1.3 -2,2.7 -1.3,0.4 -3,-0.9 -0.9,-0.9" fill="#111"/>
    </svg>
  ),
  UY: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#f5f3ec"/>
      {[1,3,5,7].map(i=>(<rect key={i} width="30" height="1.6" y={i*2.2} fill="#1c4b9b"/>))}
      <rect width="11" height="11" fill="#f5f3ec"/>
      <circle cx="5.5" cy="5.5" r="2.4" fill="#f5c324"/>
    </svg>
  ),
  CO: <StripeFlag dir="h" colors={['#f5c324','#f5c324','#1c4b9b','#c8362b']}/>,
  EC: <StripeFlag dir="h" colors={['#f5c324','#f5c324','#1c4b9b','#c8362b']}/>,
  CL: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="10" fill="#f5f3ec"/>
      <rect width="30" height="10" y="10" fill="#c8362b"/>
      <rect width="10" height="10" fill="#1c4b9b"/>
      <polygon transform="translate(5 5) scale(0.9)" points="0,-3 0.9,-0.9 3,-0.9 1.3,0.4 2,2.7 0,1.3 -2,2.7 -1.3,0.4 -3,-0.9 -0.9,-0.9" fill="#f5f3ec"/>
    </svg>
  ),
  PE: <StripeFlag dir="v" colors={['#c8362b','#f5f3ec','#c8362b']}/>,
  IR: <StripeFlag dir="h" colors={['#0a7a3b','#f5f3ec','#c8362b']}/>,
  SA: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#0a7a3b"/>
      <rect x="6" y="9" width="18" height="2" fill="#f5f3ec"/>
      <rect x="6" y="11.5" width="18" height="0.6" fill="#f5f3ec"/>
    </svg>
  ),
  TR: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#c8362b"/>
      <circle cx="12" cy="10" r="3.6" fill="#f5f3ec"/>
      <circle cx="13" cy="10" r="2.8" fill="#c8362b"/>
      <polygon transform="translate(16.5 10) scale(0.7)" points="0,-3 0.9,-0.9 3,-0.9 1.3,0.4 2,2.7 0,1.3 -2,2.7 -1.3,0.4 -3,-0.9 -0.9,-0.9" fill="#f5f3ec"/>
    </svg>
  ),
  RS: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#1c4b9b"/>
      <rect width="30" height="6.67" fill="#c8362b"/>
      <rect width="30" height="6.66" y="13.33" fill="#f5f3ec"/>
    </svg>
  ),
};

// Drop stub keys (we used `null` to skip)
Object.keys(EXTRA_FLAGS).forEach(k => {
  if (EXTRA_FLAGS[k] != null) FLAGS[k] = EXTRA_FLAGS[k];
});

// ─────────────────────────── TEAM POOL
// Snapshot of the FIFA/Coca-Cola Men's World Ranking as of 1 Apr 2026.
// Original ordering — only the codes are real-world; numbers are sample data.
const TEAM_POOL = [
  { rank:  1, code: 'AR', name: 'Argentina' },
  { rank:  2, code: 'FR', name: 'France' },
  { rank:  3, code: 'ES', name: 'Spain' },
  { rank:  4, code: 'EN', name: 'England' },
  { rank:  5, code: 'BR', name: 'Brazil' },
  { rank:  6, code: 'PT', name: 'Portugal' },
  { rank:  7, code: 'NL', name: 'Netherlands' },
  { rank:  8, code: 'BE', name: 'Belgium' },
  { rank:  9, code: 'IT', name: 'Italy' },
  { rank: 10, code: 'DE', name: 'Germany' },
  { rank: 11, code: 'HR', name: 'Croatia' },
  { rank: 12, code: 'MX', name: 'Mexico' },
  { rank: 13, code: 'CO', name: 'Colombia' },
  { rank: 14, code: 'US', name: 'United States' },
  { rank: 15, code: 'MA', name: 'Morocco' },
  { rank: 16, code: 'UY', name: 'Uruguay' },
  { rank: 17, code: 'JP', name: 'Japan' },
  { rank: 18, code: 'SN', name: 'Senegal' },
  { rank: 19, code: 'CH', name: 'Switzerland' },
  { rank: 20, code: 'KR', name: 'Korea Republic' },
  { rank: 21, code: 'DK', name: 'Denmark' },
  { rank: 22, code: 'AU', name: 'Australia' },
  { rank: 23, code: 'CA', name: 'Canada' },
  { rank: 24, code: 'NG', name: 'Nigeria' },
  { rank: 25, code: 'EC', name: 'Ecuador' },
  { rank: 26, code: 'TR', name: 'Türkiye' },
  { rank: 27, code: 'EG', name: 'Egypt' },
  { rank: 28, code: 'PL', name: 'Poland' },
  { rank: 29, code: 'SE', name: 'Sweden' },
  { rank: 30, code: 'NO', name: 'Norway' },
  { rank: 31, code: 'IR', name: 'IR Iran' },
  { rank: 32, code: 'RS', name: 'Serbia' },
];

// Look up a team by code.
function teamByCode(code) {
  return TEAM_POOL.find(t => t.code === code);
}

// ─────────────────────────── MY LIST (sample saved state)
// User's draft preferences. Reordering them changes who the draw assigns
// first when their turn comes up. Order is just team codes.
const MY_LIST_DEFAULT = [
  'AR','BR','FR','EN','ES','DE','PT','NL','IT','HR',
  'BE','MX','UY','JP','CH','KR','CA','MA','SN','US',
  'CO','AU','DK','NG','SE','PL','TR','EC','NO','EG',
  'IR','RS',
];

// A bit different ordering — sample dragging state.
const MY_LIST_DRAGGING = [
  'AR','FR','BR','EN','ES','DE','PT','NL','IT','HR',
];

// ─────────────────────────── PLAYERS (pre-draw roster)
const POOL_PLAYERS = [
  { id: 'darko', name: 'Darko (you)', kind: 'initials', initial: 'D', you: true,  admin: true,  ready: true  },
  { id: 'ana',   name: 'Ana',         kind: 'emoji',    emoji: '🦊',  ready: true  },
  { id: 'marko', name: 'Marko',       kind: 'initials', initial: 'M', ready: true  },
  { id: 'petra', name: 'Petra',       kind: 'emoji',    emoji: '🐺',  ready: false },
  { id: 'ivan',  name: 'Ivan',        kind: 'photo',    initial: 'I', ready: false },
];

// All-ready variant used by Draft-Day state.
const POOL_PLAYERS_READY = POOL_PLAYERS.map(p => ({ ...p, ready: true }));

// ─────────────────────────── DRAW · ASSIGNMENTS (live + complete states)
// Per-player pick lists. Each entry is an array of team codes in the
// order they were picked across rounds.
const ASSIGNMENTS_R1_INPROGRESS = {
  darko: ['AR'],   // round 1 first pick
  ana:   ['FR'],
  marko: ['BR'],
  petra: ['EN'],   // currently picking would be petra → empty / not yet
  ivan:  [],
};

const ASSIGNMENTS_R1_COMPLETE = {
  darko: ['AR'],
  ana:   ['FR'],
  marko: ['BR'],
  petra: ['EN'],
  ivan:  ['ES'],
};

const ASSIGNMENTS_FINAL = {
  darko: ['AR','PT','HR','UY','DK','RS'],
  ana:   ['FR','BE','MX','SE','TR'],
  marko: ['BR','IT','US','CA','EC'],
  petra: ['EN','DE','SN','MA','PL'],
  ivan:  ['ES','NL','KR','AU','CO'],
};

// Sample currently-selected (in-flight) team for the picking view.
const PICK_SELECTED_NONE = null;
const PICK_SELECTED_DE   = 'DE';

// Double-owned codes after the final round (used by summary cards).
const DOUBLE_OWNED = ['BR','FR']; // sample

Object.assign(window, {
  FLAGS, StripeFlag,
  TEAM_POOL, teamByCode,
  MY_LIST_DEFAULT, MY_LIST_DRAGGING,
  POOL_PLAYERS, POOL_PLAYERS_READY,
  ASSIGNMENTS_R1_INPROGRESS, ASSIGNMENTS_R1_COMPLETE, ASSIGNMENTS_FINAL,
  PICK_SELECTED_NONE, PICK_SELECTED_DE, DOUBLE_OWNED,
});
