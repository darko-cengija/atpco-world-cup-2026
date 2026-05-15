// Lucide-style stroke icons used across the Match Ticket system.
// 24x24 viewBox, currentColor stroke, 1.6 stroke-width.
// One source of truth — concepts and screens import from window.ICONS.

const ICONS = {
  back: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M15 5l-7 7 7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chevronRight: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M9 5l7 7-7 7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  chevronDown: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M5 9l7 7 7-7" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M5 12.5l4 4 10-10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="6" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M16 16l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  lock: (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="4.5" y="11" width="15" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  unlock: (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="4.5" y="11" width="15" height="9" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M8 11V8a4 4 0 0 1 7-2.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  alert: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M12 4l9.5 16h-19L12 4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <path d="M12 10v4M12 17v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  info: (
    <svg viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M12 11v6M12 7.5v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  send: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M3 11l18-7-7 18-3-7-8-4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  eye: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6"/>
    </svg>
  ),
  eyeOff: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 4l16 16M9 5.5C10 5.2 11 5 12 5c6 0 9.5 7 9.5 7-.6 1.2-1.6 2.7-3 4M14.5 14.5A3 3 0 0 1 9.5 9.5M6 7C4 8.5 2.5 12 2.5 12s3.5 7 9.5 7c1.4 0 2.7-.4 4-1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  edit: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 20h4l11-11-4-4L4 16v4z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  filter: (
    <svg viewBox="0 0 24 24" fill="none">
      <path d="M3 5h18l-7 9v6l-4-2v-4L3 5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
    </svg>
  ),
  calendar: (
    <svg viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="5" width="17" height="15" rx="2" stroke="currentColor" strokeWidth="1.6"/>
      <path d="M3.5 10h17M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  ),
  spinner: (color, size = 24) => (
    <svg viewBox="0 0 24 24" width={size} height={size} style={{ animation: 'tkSpin 0.9s linear infinite' }}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeOpacity="0.18" strokeWidth="2.4" fill="none"/>
      <path d="M21 12a9 9 0 0 0-9-9" stroke={color} strokeWidth="2.4" strokeLinecap="round" fill="none"/>
    </svg>
  ),
};

Object.assign(window, { ICONS });
