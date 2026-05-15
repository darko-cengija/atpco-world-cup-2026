// Shared bits: flag SVGs (original, simplified), avatar, helpers.
// All concepts use these so flags stay consistent visually.

const FLAGS = {
  // Mexico: green-white-red vertical, simplified emblem placeholder
  MX: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="10" height="20" x="0"  fill="#1f7a45"/>
      <rect width="10" height="20" x="10" fill="#f3f1ea"/>
      <rect width="10" height="20" x="20" fill="#c8362b"/>
      <circle cx="15" cy="10" r="2.6" fill="none" stroke="#6b4a1f" strokeWidth="0.6"/>
    </svg>
  ),
  // South Africa: simplified Y-shape
  ZA: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#0a7a3b"/>
      <path d="M0 0 L13 10 L0 20 Z" fill="#000"/>
      <path d="M0 2 L11 10 L0 18 Z" fill="#f5c324"/>
      <path d="M0 4.5 L9 10 L0 15.5 Z" fill="#0a7a3b"/>
      <path d="M13 10 L30 0 L30 6 L18 10 L30 14 L30 20 L13 10Z" fill="#fff"/>
      <path d="M14.5 10 L30 1.5 L30 5 L20 10 L30 15 L30 18.5 L14.5 10Z" fill="#c8362b"/>
      <rect x="0" y="0" width="30" height="3.2" fill="#fff"/>
      <rect x="0" y="16.8" width="30" height="3.2" fill="#fff"/>
      <rect x="0" y="0" width="30" height="2" fill="#c8362b"/>
      <rect x="0" y="18" width="30" height="2" fill="#1c4b9b"/>
    </svg>
  ),
  // Korea Republic: white field, taeguk + 4 trigrams simplified
  KR: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#f5f3ec"/>
      <circle cx="15" cy="10" r="4.2" fill="#c8362b"/>
      <path d="M15 5.8 a4.2 4.2 0 0 1 0 8.4 a2.1 2.1 0 0 1 0 -4.2 a2.1 2.1 0 0 0 0 -4.2Z" fill="#1c4b9b"/>
      <g fill="#222" stroke="#222" strokeWidth="0.4">
        <rect x="3" y="3.3" width="3.4" height="0.7"/>
        <rect x="3" y="4.5" width="3.4" height="0.7"/>
        <rect x="3" y="5.7" width="3.4" height="0.7"/>
        <rect x="23.6" y="3.3" width="3.4" height="0.7"/>
        <rect x="23.6" y="5.7" width="3.4" height="0.7"/>
        <rect x="3" y="14" width="3.4" height="0.7"/>
        <rect x="3" y="16" width="3.4" height="0.7"/>
        <rect x="23.6" y="14" width="3.4" height="0.7"/>
        <rect x="23.6" y="15.2" width="3.4" height="0.7"/>
        <rect x="23.6" y="16.4" width="3.4" height="0.7"/>
      </g>
    </svg>
  ),
  // Czechia: white over red with blue triangle
  CZ: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="10" fill="#f5f3ec"/>
      <rect width="30" height="10" y="10" fill="#c8362b"/>
      <path d="M0 0 L13 10 L0 20 Z" fill="#1c4b9b"/>
    </svg>
  ),
  // Canada: red-white-red with red mark
  CA: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="7.5" height="20" x="0"   fill="#c8362b"/>
      <rect width="15"  height="20" x="7.5" fill="#f5f3ec"/>
      <rect width="7.5" height="20" x="22.5" fill="#c8362b"/>
      <path d="M15 6 l1.2 2.4 l2.5 -0.5 l-1.2 2.1 l1.5 1.4 l-2.4 0.4 l0.2 2.4 l-1.8 -1.3 l-1.8 1.3 l0.2 -2.4 l-2.4 -0.4 l1.5 -1.4 l-1.2 -2.1 l2.5 0.5 Z" fill="#c8362b"/>
    </svg>
  ),
  // Bosnia & Herzegovina: blue field, yellow diagonal, stars
  BA: (
    <svg viewBox="0 0 30 20" preserveAspectRatio="xMidYMid slice">
      <rect width="30" height="20" fill="#1c4b9b"/>
      <polygon points="9,0 30,0 30,20" fill="#f5c324"/>
      <g fill="#f5f3ec">
        {Array.from({length: 6}).map((_,i)=>(
          <polygon key={i}
            transform={`translate(${4+i*4},${3+i*2.5}) scale(0.7)`}
            points="0,-1.6 0.5,-0.5 1.6,-0.5 0.7,0.2 1.1,1.4 0,0.7 -1.1,1.4 -0.7,0.2 -1.6,-0.5 -0.5,-0.5"/>
        ))}
      </g>
    </svg>
  ),
};

// Tiny circular flag chip — used by Concept 2 (Pop) etc.
function FlagCircle({ code, size = 56, ring = '#fff', ringWidth = 3 }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      overflow: 'hidden', flexShrink: 0,
      boxShadow: `0 0 0 ${ringWidth}px ${ring}, 0 2px 6px rgba(0,0,0,0.12)`,
      background: '#ddd',
    }}>
      <div style={{ width: '100%', height: '100%' }}>{FLAGS[code]}</div>
    </div>
  );
}

// Rounded-square flag — used by Concept 1, 3, 4
function FlagSquare({ code, size = 44, radius = 10 }) {
  return (
    <div style={{
      width: size, height: size * 0.66, borderRadius: radius,
      overflow: 'hidden', flexShrink: 0,
      boxShadow: '0 1px 2px rgba(0,0,0,0.08), inset 0 0 0 0.5px rgba(0,0,0,0.06)',
    }}>{FLAGS[code]}</div>
  );
}

// Compact avatar with initial
function Avatar({ initial = 'D', size = 32, bg = '#1f1f1f', fg = '#fff', ring }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: bg, color: fg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: 600, fontSize: size * 0.42, letterSpacing: 0.2,
      boxShadow: ring ? `0 0 0 2px ${ring}` : 'none', flexShrink: 0,
    }}>{initial}</div>
  );
}

// Status bar pinned to a custom bg color (so we can recolor per concept).
function StatusStrip({ color = '#000' }) {
  return (
    <div style={{
      height: 54, display: 'flex', alignItems: 'flex-end',
      justifyContent: 'space-between', padding: '0 30px 8px',
      fontFamily: '-apple-system, system-ui',
      fontWeight: 600, fontSize: 15, color,
      flexShrink: 0,
    }}>
      <span>9:41</span>
      <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center' }}>
        <svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="0.5" fill={color}/><rect x="4.5" y="5" width="3" height="6" rx="0.5" fill={color}/><rect x="9" y="2.5" width="3" height="8.5" rx="0.5" fill={color}/><rect x="13.5" y="0" width="3" height="11" rx="0.5" fill={color}/></svg>
        <svg width="15" height="11" viewBox="0 0 15 11"><path d="M7.5 3 C9.6 3 11.4 3.8 12.8 5.2 L13.8 4.2 C12 2.4 9.8 1.4 7.5 1.4 C5.2 1.4 3 2.4 1.2 4.2 L2.2 5.2 C3.6 3.8 5.4 3 7.5 3Z M7.5 6 C8.6 6 9.6 6.4 10.4 7.2 L11.3 6.3 C10.2 5.2 8.9 4.6 7.5 4.6 C6.1 4.6 4.8 5.2 3.7 6.3 L4.6 7.2 C5.4 6.4 6.4 6 7.5 6Z" fill={color}/><circle cx="7.5" cy="9" r="1.2" fill={color}/></svg>
        <svg width="25" height="11" viewBox="0 0 25 11"><rect x="0.5" y="0.5" width="21" height="10" rx="2.5" fill="none" stroke={color} strokeOpacity="0.5"/><rect x="2" y="2" width="16" height="7" rx="1.2" fill={color}/></svg>
      </span>
    </div>
  );
}

// Generic phone shell used by every concept. Lets each concept own the chrome.
function Phone({ children, bg = '#fff', statusColor = '#000', width = 390, height = 844 }) {
  return (
    <div style={{
      width, height, borderRadius: 44, overflow: 'hidden',
      position: 'relative', background: bg,
      boxShadow: '0 30px 60px rgba(0,0,0,0.18), 0 0 0 8px #111, 0 0 0 9px rgba(0,0,0,0.5)',
      fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
      WebkitFontSmoothing: 'antialiased',
      color: '#111',
    }}>
      <div style={{
        position: 'absolute', top: 11, left: '50%', transform: 'translateX(-50%)',
        width: 115, height: 33, borderRadius: 22, background: '#000', zIndex: 50,
      }} />
      <StatusStrip color={statusColor} />
      <div style={{
        position: 'absolute', inset: '54px 0 0 0',
        display: 'flex', flexDirection: 'column',
      }}>{children}</div>
      <div style={{
        position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
        width: 134, height: 5, borderRadius: 100,
        background: statusColor === '#fff' ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.35)',
        zIndex: 60,
      }} />
    </div>
  );
}

Object.assign(window, { FLAGS, FlagCircle, FlagSquare, Avatar, StatusStrip, Phone });
