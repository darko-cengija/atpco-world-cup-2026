// Extended fixture data for the matches & predictions surfaces.
// Adds BR / MA / FR flags onto window.FLAGS, plus live + finished samples
// the brief requires. Reuses the same MATCHES shape as data.jsx.

// ─── extra flag SVGs (added onto the shared FLAGS map)
Object.assign(window.FLAGS, {
  // Brazil — green field, yellow diamond, blue disc
  BR: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#0a7a3b"/>
      <polygon points="15,2.4 27.5,10 15,17.6 2.5,10" fill="#f5c324"/>
      <circle cx="15" cy="10" r="4.2" fill="#1c4b9b"/>
      <path d="M10.9 10 Q15 7.4 19.1 10" fill="none" stroke="#f5f3ec" strokeWidth="0.7"/>
    </svg>
  ),
  // Morocco — red field, green pentagram
  MA: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#c8362b"/>
      <polygon
        points="15,5.8 16.2,9.5 20.1,9.5 16.9,11.8 18.1,15.5 15,13.2 11.9,15.5 13.1,11.8 9.9,9.5 13.8,9.5"
        fill="none" stroke="#0a7a3b" strokeWidth="0.8"
      />
    </svg>
  ),
  // France — blue/white/red vertical tricolour (referee in everyone's list)
  FR: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="10" height="20" x="0"  fill="#1c4b9b"/>
      <rect width="10" height="20" x="10" fill="#f5f3ec"/>
      <rect width="10" height="20" x="20" fill="#c8362b"/>
    </svg>
  ),
});

// One live match + two extra upcoming + three finished matches.
// We don't override MATCHES from data.jsx — those still feed the home list.

const MATCH_LIVE = {
  id: 14, dayLong: 'Wednesday, Jun 17', dayShort: 'Wed, Jun 17',
  dayNum: 17, monthShort: 'JUN', monthLong: 'June',
  time: '5:00 PM', time24: '17:00',
  venue: 'MetLife Stadium', city: 'East Rutherford',
  home: { code: 'BR', name: 'Brazil',  short: 'BRA', owner: 'Petra' },
  away: { code: 'MA', name: 'Morocco', short: 'MAR', owner: 'Lena'  },
  stage: 'Group G · MD2',
  score: { home: 2, away: 1, minute: "68'", phase: 'live' },
  predicted: null,
};

const MATCH_HT = {
  ...MATCH_LIVE, id: 15,
  score: { home: 1, away: 1, minute: 'Halftime', phase: 'halftime' },
  predicted: '1',
};

// Locked-with-prediction sample (the brief's "You predicted 1 · Locked")
const MATCH_LOCKED_PRED = {
  id: 16, dayLong: 'Wednesday, Jun 17', dayShort: 'Wed, Jun 17',
  dayNum: 17, monthShort: 'JUN', monthLong: 'June',
  time: '1:00 PM', time24: '13:00',
  venue: 'SoFi Stadium', city: 'Los Angeles',
  home: { code: 'KR', name: 'Korea Republic', short: 'KOR', owner: 'Marko' },
  away: { code: 'MA', name: 'Morocco',         short: 'MAR', owner: 'Lena' },
  stage: 'Group F · MD3',
  predicted: '1',
  locked: true,
};

const MATCH_LOCKED_NONE = {
  id: 17, dayLong: 'Wednesday, Jun 17', dayShort: 'Wed, Jun 17',
  dayNum: 17, monthShort: 'JUN', monthLong: 'June',
  time: '4:00 PM', time24: '16:00',
  venue: 'Estadio BBVA', city: 'Monterrey',
  home: { code: 'BA', name: 'Bosnia & Herzegovina', short: 'BIH', owner: 'Darko' },
  away: { code: 'CZ', name: 'Czechia',              short: 'CZE', owner: 'Petra' },
  stage: 'Group D · MD3',
  predicted: null,
  locked: true,
};

// Finished matches — final score + actual outcome + per-player predictions.
// Outcome codes: '1' (home win) · 'X' (draw) · 'X1' (draw, home advanced in
// knockout) · 'X2' (draw, away advanced) · '2' (away win).
// players[] entries: { name, kind, initial?, emoji?, pick, you? }
const FINISHED_MATCHES = [
  {
    id: 9, stage: 'Group F · MD1', dayLabel: 'Jun 12, 2026',
    home: { code: 'KR', name: 'Korea Republic', short: 'KOR', owner: 'Marko' },
    away: { code: 'CZ', name: 'Czechia',        short: 'CZE', owner: 'Petra' },
    score: { home: 1, away: 0 },
    actual: '1',
    players: [
      { name: 'Darko', kind: 'initials', initial: 'D', pick: '1', you: true },
      { name: 'Ana',   kind: 'emoji', emoji: '🦊',     pick: 'X' },
      { name: 'Marko', kind: 'initials', initial: 'M', pick: '1' },
      { name: 'Petra', kind: 'emoji', emoji: '🐺',     pick: '2' },
      { name: 'Ivan',  kind: 'initials', initial: 'I', pick: null },
      { name: 'Lena',  kind: 'emoji', emoji: '🦁',     pick: '1' },
      { name: 'Mira',  kind: 'photo',  initial: 'M',   pick: 'X' },
    ],
  },
  {
    id: 10, stage: 'Group A · MD1', dayLabel: 'Jun 11, 2026',
    home: { code: 'MX', name: 'Mexico',       short: 'MEX', owner: 'Darko' },
    away: { code: 'ZA', name: 'South Africa', short: 'RSA', owner: 'Ana'   },
    score: { home: 2, away: 1 },
    actual: '1',
    players: [
      { name: 'Darko', kind: 'initials', initial: 'D', pick: '1', you: true },
      { name: 'Ana',   kind: 'emoji', emoji: '🦊',     pick: '2' },
      { name: 'Marko', kind: 'initials', initial: 'M', pick: '1' },
      { name: 'Petra', kind: 'emoji', emoji: '🐺',     pick: 'X' },
      { name: 'Ivan',  kind: 'initials', initial: 'I', pick: '1' },
      { name: 'Lena',  kind: 'emoji', emoji: '🦁',     pick: null },
      { name: 'Mira',  kind: 'photo',  initial: 'M',   pick: '1' },
    ],
  },
  {
    id: 11, stage: 'Round of 16', dayLabel: 'Jun 30, 2026',
    home: { code: 'CA', name: 'Canada',                short: 'CAN', owner: 'Ivan'  },
    away: { code: 'BA', name: 'Bosnia & Herzegovina',  short: 'BIH', owner: 'Darko' },
    score: { home: 1, away: 1, decided: 'pen', decidedBy: 'Bosnia & Herzegovina won 4-3 on penalties' },
    actual: 'X2', // draw in regulation, away advanced
    knockout: true,
    players: [
      { name: 'Darko', kind: 'initials', initial: 'D', pick: 'X2', you: true },
      { name: 'Ana',   kind: 'emoji', emoji: '🦊',     pick: '1' },
      { name: 'Marko', kind: 'initials', initial: 'M', pick: '2' },
      { name: 'Petra', kind: 'emoji', emoji: '🐺',     pick: 'X1' },
      { name: 'Ivan',  kind: 'initials', initial: 'I', pick: '1' },
      { name: 'Lena',  kind: 'emoji', emoji: '🦁',     pick: 'X2' },
      { name: 'Mira',  kind: 'photo',  initial: 'M',   pick: null },
    ],
  },
];

// Players for the "Everyone's Predictions" section of the detail screen.
const PLAYER_ROSTER = [
  { name: 'Darko (you)', kind: 'initials', initial: 'D', pick: null, you: true },
  { name: 'Ana',         kind: 'emoji',    emoji: '🦊',  pick: '1' },
  { name: 'Marko',       kind: 'initials', initial: 'M', pick: '1' },
  { name: 'Petra',       kind: 'emoji',    emoji: '🐺',  pick: 'X' },
  { name: 'Ivan',        kind: 'initials', initial: 'I', pick: '2' },
  { name: 'Lena',        kind: 'emoji',    emoji: '🦁',  pick: '1' },
  { name: 'Mira',        kind: 'photo',    initial: 'M', pick: null },
];

Object.assign(window, {
  MATCH_LIVE, MATCH_HT, MATCH_LOCKED_PRED, MATCH_LOCKED_NONE,
  FINISHED_MATCHES, PLAYER_ROSTER,
});
