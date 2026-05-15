// Shared match data + label helpers used by all concepts.

const MATCHES = [
  {
    id: 1, dayLong: 'Thursday, Jun 11', dayShort: 'Thu, Jun 11',
    dayNum: 11, monthShort: 'JUN', monthLong: 'June',
    time: '9:00 PM', time24: '21:00',
    venue: 'Estadio Azteca', city: 'Mexico City',
    home: { code: 'MX', name: 'Mexico',       short: 'MEX', owner: 'Darko' },
    away: { code: 'ZA', name: 'South Africa', short: 'RSA', owner: 'Ana'   },
    predicted: null,
  },
  {
    id: 2, dayLong: 'Friday, Jun 12', dayShort: 'Fri, Jun 12',
    dayNum: 12, monthShort: 'JUN', monthLong: 'June',
    time: '4:00 AM', time24: '04:00',
    venue: 'Estadio Guadalajara', city: 'Guadalajara',
    home: { code: 'KR', name: 'Korea Republic', short: 'KOR', owner: 'Marko' },
    away: { code: 'CZ', name: 'Czechia',        short: 'CZE', owner: 'Petra' },
    predicted: '1',
  },
  {
    id: 3, dayLong: 'Friday, Jun 12', dayShort: 'Fri, Jun 12',
    dayNum: 12, monthShort: 'JUN', monthLong: 'June',
    time: '9:00 PM', time24: '21:00',
    venue: 'Toronto Stadium', city: 'Toronto',
    home: { code: 'CA', name: 'Canada',                short: 'CAN', owner: 'Ivan'  },
    away: { code: 'BA', name: 'Bosnia & Herzegovina',  short: 'BIH', owner: 'Darko' },
    predicted: null,
  },
];

const NAV_ITEMS = [
  { id: 'home',        label: 'Home',        active: true  },
  { id: 'standings',   label: 'Standings',   active: false },
  { id: 'predictions', label: 'Predictions', active: false },
  { id: 'chat',        label: 'Chat',        active: false },
  { id: 'players',     label: 'Players',     active: false },
];

// Compact nav icon set — 24x24 stroke, used across concepts; each concept
// styles them (color/weight) to fit. Outline-style to stay neutral.
const NAV_ICONS = {
  home: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 11l8-7 8 7v8a2 2 0 0 1-2 2h-3v-6h-6v6H6a2 2 0 0 1-2-2v-8z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  standings: (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="3"  y="13" width="5" height="8" rx="1" stroke="currentColor" strokeWidth="1.6"/>
      <rect x="9.5" y="8" width="5" height="13" rx="1" stroke="currentColor" strokeWidth="1.6"/>
      <rect x="16" y="4" width="5" height="17" rx="1" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
  predictions: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M5 17.5L9.5 13l3.5 3 5.5-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9.5"  cy="13"  r="1.4" fill="currentColor"/>
      <circle cx="13"   cy="16"  r="1.4" fill="currentColor"/>
      <circle cx="18.5" cy="9"   r="1.4" fill="currentColor"/>
    </svg>
  ),
  chat: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 4v-4H6a2 2 0 0 1-2-2V6z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  players: (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="9" r="3.4" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
      <circle cx="17" cy="7" r="2.6" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M14.5 14.5C16 14 17 13.7 18 13.7c1.7 0 3 1 3 2.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
};

Object.assign(window, { MATCHES, NAV_ITEMS, NAV_ICONS });
