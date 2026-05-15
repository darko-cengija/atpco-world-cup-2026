// Sample data for the Standings + Prediction Standings + Player Detail screens.
// Adds AR / DE / ES flags so each player can own ~2 teams across the pool.
// Keeps the same roster (Darko = you) used by data-matches.jsx so the system
// reads as one continuous app.

// ─── extra flags onto window.FLAGS
Object.assign(window.FLAGS, {
  // Argentina — light-blue / white / light-blue + sun
  AR: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="6.67" y="0"     fill="#74acdf"/>
      <rect width="30" height="6.66" y="6.67"  fill="#f5f3ec"/>
      <rect width="30" height="6.67" y="13.33" fill="#74acdf"/>
      <circle cx="15" cy="10" r="1.6" fill="#f5c324"/>
    </svg>
  ),
  // Germany — black / red / gold horizontal
  DE: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="6.67" y="0"     fill="#111"/>
      <rect width="30" height="6.66" y="6.67"  fill="#c8362b"/>
      <rect width="30" height="6.67" y="13.33" fill="#f5c324"/>
    </svg>
  ),
  // Spain — red / yellow (2x) / red horizontal
  ES: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="5"  y="0"  fill="#c8362b"/>
      <rect width="30" height="10" y="5"  fill="#f5c324"/>
      <rect width="30" height="5"  y="15" fill="#c8362b"/>
      <rect x="6" y="8.5" width="3" height="3.5" fill="#c8362b" opacity="0.85"/>
    </svg>
  ),
});

// ─── Main Standings (results from owned teams)
// Sorted by Pts desc, then GD, then GF.
const STANDINGS_ROWS = [
  { rank: 1, name: 'Marko', kind: 'initials', initial: 'M',  teams: ['KR','DE'],
    pld: 5, w: 3, d: 2, l: 0, gf: 8, ga: 3, gd: '+5', pts: 11 },
  { rank: 2, name: 'Petra', kind: 'emoji',    emoji: '🐺',   teams: ['CZ','BR'],
    pld: 5, w: 2, d: 3, l: 0, gf: 5, ga: 2, gd: '+3', pts: 9 },
  { rank: 3, name: 'Ana',   kind: 'emoji',    emoji: '🦊',   teams: ['ZA','FR'],
    pld: 4, w: 2, d: 2, l: 0, gf: 4, ga: 2, gd: '+2', pts: 8 },
  { rank: 4, name: 'Ivan',  kind: 'initials', initial: 'I',  teams: ['CA','AR'],
    pld: 5, w: 2, d: 1, l: 2, gf: 6, ga: 5, gd: '+1', pts: 7 },
  { rank: 5, name: 'Darko', kind: 'initials', initial: 'D',  teams: ['MX','BA'], you: true,
    pld: 4, w: 1, d: 3, l: 0, gf: 3, ga: 2, gd: '+1', pts: 6 },
  { rank: 6, name: 'Lena',  kind: 'emoji',    emoji: '🦁',   teams: ['MA','ES'],
    pld: 3, w: 1, d: 2, l: 0, gf: 3, ga: 2, gd: '+1', pts: 5 },
  { rank: 7, name: 'Mira',  kind: 'photo',    initial: 'M',  teams: ['BR'],
    pld: 4, w: 0, d: 3, l: 1, gf: 2, ga: 4, gd: '-2', pts: 3 },
];

// ─── Winning Chances (Monte Carlo over remaining matches)
const CHANCES_ROWS = [
  { name: 'Marko', kind: 'initials', initial: 'M', pct: 38, expPts: 18.4 },
  { name: 'Petra', kind: 'emoji',    emoji: '🐺',  pct: 24, expPts: 16.2 },
  { name: 'Ana',   kind: 'emoji',    emoji: '🦊',  pct: 16, expPts: 14.5 },
  { name: 'Ivan',  kind: 'initials', initial: 'I', pct: 10, expPts: 13.1 },
  { name: 'Darko', kind: 'initials', initial: 'D', pct:  7, expPts: 11.6, you: true },
  { name: 'Lena',  kind: 'emoji',    emoji: '🦁',  pct:  4, expPts: 10.2 },
  { name: 'Mira',  kind: 'photo',    initial: 'M', pct:  1, expPts:  7.8 },
];

// ─── Prediction Standings (props · proportional · 7/n)
// playerCount = 7. Negative for net-missing player.
const PREDICTION_ROWS = [
  { rank: 1, name: 'Lena',  kind: 'emoji',    emoji: '🦁',  pts:  4.81 },
  { rank: 2, name: 'Marko', kind: 'initials', initial: 'M', pts:  3.97 },
  { rank: 3, name: 'Darko', kind: 'initials', initial: 'D', pts:  3.42, you: true },
  { rank: 4, name: 'Petra', kind: 'emoji',    emoji: '🐺',  pts:  2.18 },
  { rank: 5, name: 'Mira',  kind: 'photo',    initial: 'M', pts:  1.50 },
  { rank: 6, name: 'Ana',   kind: 'emoji',    emoji: '🦊',  pts:  0.83 },
  { rank: 7, name: 'Ivan',  kind: 'initials', initial: 'I', pts: -0.45 },
];

const POOL_PLAYER_COUNT = 7;

// ─── Player Detail · Darko (you)
const DARKO = {
  name: 'Darko', kind: 'initials', initial: 'D', tag: 'you',
  teams: ['MX', 'BA'], pickRate: '4 of 7', joined: 'Joined Apr 14, 2026',
};

// Actuals — team stats rows for the player detail screen.
const DARKO_TEAM_STATS = [
  { code: 'MX', name: 'Mexico',              short: 'MEX',
    pld: 2, w: 1, d: 1, l: 0, gf: 2, ga: 1, gd: '+1', pts: 4 },
  { code: 'BA', name: 'Bosnia & Herzegovina', short: 'BIH',
    pld: 2, w: 0, d: 2, l: 0, gf: 1, ga: 1, gd: ' 0', pts: 2 },
];
const DARKO_TEAM_TOTAL = { pld: 4, w: 1, d: 3, l: 0, gf: 3, ga: 2, gd: '+1', pts: 6 };

// Projection mode (decimals — Monte Carlo avg)
const DARKO_TEAM_PROJ = [
  { code: 'MX', name: 'Mexico',              short: 'MEX',
    pld: '5.0', w: '2.4', d: '1.8', l: '0.8', gf: '5.4', ga: '3.1', gd: '+2.3', pts: '9.0' },
  { code: 'BA', name: 'Bosnia & Herzegovina', short: 'BIH',
    pld: '5.0', w: '0.7', d: '2.6', l: '1.7', gf: '2.9', ga: '4.0', gd: '-1.1', pts: '4.7' },
];
const DARKO_TEAM_PROJ_TOTAL = {
  pld: '10.0', w: '3.1', d: '4.4', l: '2.5', gf: '8.3', ga: '7.1', gd: '+1.2', pts: '13.7',
};

// Darko's predictions on every finished match.
// status: 'hit' | 'miss' | 'none'
const DARKO_PREDICTIONS = [
  { id: 9,  date: 'Jun 12', stage: 'Group F · MD1',
    home: { code: 'KR', short: 'KOR' }, away: { code: 'CZ', short: 'CZE' },
    score: { home: 1, away: 0 }, actual: '1', pick: 'X', status: 'miss',
    delta: '+0.00' },
  { id: 10, date: 'Jun 11', stage: 'Group A · MD1',
    home: { code: 'MX', short: 'MEX' }, away: { code: 'ZA', short: 'RSA' },
    score: { home: 2, away: 1 }, actual: '1', pick: '1', status: 'hit',
    delta: '+1.75' },
  { id: 11, date: 'Jun 30', stage: 'Round of 16',
    home: { code: 'CA', short: 'CAN' }, away: { code: 'BA', short: 'BIH' },
    score: { home: 1, away: 1, decided: 'Bosnia & Herzegovina won 4-3 on penalties' },
    actual: 'X2', pick: 'X2', status: 'hit', delta: '+3.50' },
  { id: 12, date: 'Jun 16', stage: 'Group A · MD2',
    home: { code: 'MX', short: 'MEX' }, away: { code: 'AR', short: 'ARG' },
    score: { home: 1, away: 3 }, actual: '2', pick: null, status: 'none',
    delta: '-0.14' },
  { id: 13, date: 'Jun 17', stage: 'Group D · MD2',
    home: { code: 'BA', short: 'BIH' }, away: { code: 'DE', short: 'GER' },
    score: { home: 1, away: 1 }, actual: 'X', pick: '1', status: 'miss',
    delta: '+0.00' },
];

Object.assign(window, {
  STANDINGS_ROWS, CHANCES_ROWS, PREDICTION_ROWS, POOL_PLAYER_COUNT,
  DARKO, DARKO_TEAM_STATS, DARKO_TEAM_TOTAL,
  DARKO_TEAM_PROJ, DARKO_TEAM_PROJ_TOTAL,
  DARKO_PREDICTIONS,
});
