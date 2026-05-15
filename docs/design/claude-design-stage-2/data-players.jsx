// Players-and-Teams sample data: assignments per player, confederations,
// derived helpers for the admin/replace-team surfaces.

// ─────────────────────────── CONFEDERATIONS
const CONFEDERATIONS = {
  AR: 'CONMEBOL', BR: 'CONMEBOL', UY: 'CONMEBOL', CO: 'CONMEBOL',
  EC: 'CONMEBOL', CL: 'CONMEBOL', PE: 'CONMEBOL',
  FR: 'UEFA', ES: 'UEFA', EN: 'UEFA', PT: 'UEFA', NL: 'UEFA',
  BE: 'UEFA', IT: 'UEFA', DE: 'UEFA', HR: 'UEFA', CH: 'UEFA',
  DK: 'UEFA', NO: 'UEFA', SE: 'UEFA', PL: 'UEFA', TR: 'UEFA',
  RS: 'UEFA', CZ: 'UEFA', BA: 'UEFA',
  MX: 'CONCACAF', US: 'CONCACAF', CA: 'CONCACAF',
  KR: 'AFC', JP: 'AFC', SA: 'AFC', IR: 'AFC', AU: 'AFC',
  MA: 'CAF', SN: 'CAF', NG: 'CAF', EG: 'CAF', CI: 'CAF',
  GH: 'CAF', ZA: 'CAF',
};

function confedOf(code) { return CONFEDERATIONS[code] || ''; }

// ─────────────────────────── PLAYERS · TEAM ASSIGNMENTS
// 4 teams per player. Used by the "all assigned" default view.
const PT_ASSIGNED = {
  darko: ['AR', 'PT', 'HR', 'UY'],
  ana:   ['FR', 'BE', 'MX', 'SE'],
  marko: ['BR', 'IT', 'US', 'CA'],
  petra: ['EN', 'DE', 'SN', 'MA'],
  ivan:  ['ES', 'NL', 'KR', 'AU'],
};

// Partial / mid-draw — some players still empty.
const PT_PARTIAL = {
  darko: ['AR', 'PT', 'HR', 'UY'],
  ana:   ['FR', 'BE'],
  marko: ['BR'],
  petra: [],
  ivan:  ['ES', 'NL', 'KR'],
};

// Pre-draw — Ivan was admitted but has no teams yet.
const PT_EMPTY_IVAN = {
  darko: ['AR', 'PT', 'HR', 'UY'],
  ana:   ['FR', 'BE', 'MX', 'SE'],
  marko: ['BR', 'IT', 'US', 'CA'],
  petra: ['EN', 'DE', 'SN', 'MA'],
  ivan:  [],
};

// Total slots per player — pool config (teamsPerPlayer).
const TEAMS_PER_PLAYER = 4;

// All codes already owned by anyone — used to dim/disable available picks.
function ownedCodes(assignments) {
  return new Set(Object.values(assignments).flat());
}

// Available pool — every TEAM_POOL code not in `taken`.
function availableTeams(taken) {
  return TEAM_POOL.filter(t => !taken.has(t.code));
}

Object.assign(window, {
  CONFEDERATIONS, confedOf,
  PT_ASSIGNED, PT_PARTIAL, PT_EMPTY_IVAN,
  TEAMS_PER_PLAYER,
  ownedCodes, availableTeams,
});
