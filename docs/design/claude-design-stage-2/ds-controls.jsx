// Controls: buttons, form fields, avatars, team chips.
// All extending the Match Ticket vocabulary — ink fills, mono caps,
// dashed/hairline rules, no rounded-fluff.

// ─────────────────────────── BUTTONS

function TKButton({
  children, variant = 'primary', size = 'md', icon, trailing,
  state = 'idle', // idle | hover | pressed | disabled | loading | success
  block,
}) {
  const sizes = {
    sm: { pad: '7px 11px', fs: 10, gap: 6, h: 30 },
    md: { pad: '11px 16px', fs: 11, gap: 8, h: 40 },
    lg: { pad: '14px 20px', fs: 12, gap: 10, h: 48 },
  };
  const s = sizes[size];

  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: s.gap, padding: s.pad, height: s.h,
    fontFamily: C3.mono, fontSize: s.fs, letterSpacing: 1.6,
    textTransform: 'uppercase', fontWeight: 600,
    borderRadius: 4, border: 'none', cursor: 'pointer',
    width: block ? '100%' : 'auto',
    transition: 'transform 120ms, opacity 120ms',
  };

  let style = {};
  if (variant === 'primary') {
    style = { background: C3.ink, color: C3.ticket };
    if (state === 'hover')   style = { background: '#0a2723', color: C3.ticket };
    if (state === 'pressed') style = { background: '#0a2723', color: C3.ticket, transform: 'translateY(1px)' };
  }
  if (variant === 'secondary') {
    style = { background: 'transparent', color: C3.ink, border: `1.5px solid ${C3.ink}` };
    if (state === 'hover')   style = { background: 'rgba(15,58,53,0.06)', color: C3.ink, border: `1.5px solid ${C3.ink}` };
    if (state === 'pressed') style = { background: 'rgba(15,58,53,0.10)', color: C3.ink, border: `1.5px solid ${C3.ink}`, transform: 'translateY(1px)' };
  }
  if (variant === 'quiet') {
    style = { background: 'transparent', color: C3.ink };
    if (state === 'hover')   style = { background: 'rgba(15,58,53,0.06)', color: C3.ink };
    if (state === 'pressed') style = { background: 'rgba(15,58,53,0.10)', color: C3.ink, transform: 'translateY(1px)' };
  }
  if (variant === 'destructive') {
    style = { background: C3.stamp, color: C3.ticket };
    if (state === 'hover')   style = { background: C3.stampInk, color: C3.ticket };
    if (state === 'pressed') style = { background: C3.stampInk, color: C3.ticket, transform: 'translateY(1px)' };
  }

  if (state === 'disabled') {
    style = { ...style,
      background: variant === 'primary' || variant === 'destructive' ? C3.ink20 : 'transparent',
      color: C3.ink50,
      border: variant === 'secondary' ? `1.5px dashed ${C3.ink20}` : style.border,
      cursor: 'not-allowed', opacity: 0.9,
    };
  }
  if (state === 'loading') {
    style = { ...style, cursor: 'progress' };
  }
  if (state === 'success') {
    style = { ...style,
      background: variant === 'primary' ? '#1f6a4d' : style.background,
      color: variant === 'primary' ? C3.ticket : '#1f6a4d',
      border: variant === 'secondary' ? '1.5px solid #1f6a4d' : style.border,
    };
  }

  return (
    <button style={{ ...base, ...style }}>
      {state === 'loading' && ICONS.spinner(style.color || C3.ink, s.fs + 4)}
      {state === 'success' && (
        <span style={{ width: s.fs + 4, height: s.fs + 4, display: 'grid', placeItems: 'center' }}>
          {ICONS.check}
        </span>
      )}
      {state !== 'loading' && state !== 'success' && icon &&
        <span style={{ width: s.fs + 4, height: s.fs + 4, display: 'grid', placeItems: 'center' }}>
          {icon}
        </span>}
      <span>{children}</span>
      {trailing && state !== 'loading' && state !== 'success' &&
        <span style={{ fontFamily: C3.display, fontSize: s.fs + 3, letterSpacing: 0 }}>{trailing}</span>}
    </button>
  );
}

// Square icon button
function TKIconButton({ icon, variant = 'secondary', state = 'idle', size = 40 }) {
  const styles = {
    primary:     { bg: C3.ink, color: C3.ticket, border: 'none' },
    secondary:   { bg: 'transparent', color: C3.ink, border: `1px solid ${C3.ink}` },
    quiet:       { bg: 'transparent', color: C3.ink70, border: `1px solid ${C3.ink20}` },
    destructive: { bg: C3.stamp, color: C3.ticket, border: 'none' },
  };
  const s = styles[variant];
  const opacity = state === 'disabled' ? 0.45 : 1;
  return (
    <button style={{
      width: size, height: size, borderRadius: 6,
      background: s.bg, color: s.color, border: s.border,
      display: 'grid', placeItems: 'center', cursor: state === 'disabled' ? 'not-allowed' : 'pointer',
      padding: 0, opacity,
      transform: state === 'pressed' ? 'translateY(1px)' : 'none',
    }}>
      <div style={{ width: size * 0.5, height: size * 0.5 }}>{icon}</div>
    </button>
  );
}

// ─────────────────────────── FORM FIELDS

function FieldLabel({ children, hint }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'baseline', justifyContent: 'space-between',
      fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
      letterSpacing: 1.4, textTransform: 'uppercase', marginBottom: 6,
    }}>
      <span>{children}</span>
      {hint && <span style={{ color: C3.ink50, letterSpacing: 0.6, textTransform: 'none' }}>{hint}</span>}
    </div>
  );
}

function FieldHelp({ children, tone = 'help' }) {
  const color = tone === 'error' ? C3.stamp : C3.ink50;
  return (
    <div style={{
      fontFamily: C3.mono, fontSize: 9, color,
      letterSpacing: 0.4, marginTop: 6,
    }}>{children}</div>
  );
}

function TKInput({
  type = 'text', value, placeholder,
  label, help, errorText, leading, trailing,
  state = 'idle', // idle | focus | filled | error | disabled
  block = true,
}) {
  const borderColor =
    state === 'error' ? C3.stamp :
    state === 'focus' ? C3.ink :
    state === 'disabled' ? C3.ink20 : C3.ink20;
  const borderStyle = state === 'disabled' ? 'dashed' : 'solid';
  const ringStyle = state === 'focus' ? { boxShadow: `0 0 0 3px rgba(15,58,53,0.10)` } : {};
  const bg = state === 'disabled' ? 'rgba(15,58,53,0.03)' : C3.ticket;

  return (
    <div style={{ width: block ? '100%' : 'auto' }}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        border: `1.5px ${borderStyle} ${borderColor}`,
        borderRadius: 4, background: bg,
        ...ringStyle,
      }}>
        {leading && (
          <span style={{ width: 16, height: 16, color: C3.ink50, flexShrink: 0,
            display: 'grid', placeItems: 'center' }}>{leading}</span>
        )}
        <input
          type={type}
          defaultValue={value}
          placeholder={placeholder}
          disabled={state === 'disabled'}
          style={{
            flex: 1, border: 'none', outline: 'none', background: 'transparent',
            fontFamily: type === 'number' ? C3.mono : C3.sans,
            fontSize: type === 'number' ? 14 : 14,
            color: C3.ink, padding: 0,
            letterSpacing: type === 'number' ? 0.5 : 0,
            fontVariantNumeric: 'tabular-nums',
          }}
        />
        {trailing && (
          <span style={{ width: 16, height: 16, color: C3.ink50, flexShrink: 0,
            display: 'grid', placeItems: 'center' }}>{trailing}</span>
        )}
      </div>
      {errorText && <FieldHelp tone="error">{errorText}</FieldHelp>}
      {help && !errorText && <FieldHelp>{help}</FieldHelp>}
    </div>
  );
}

function TKSelect({ label, value = 'Group A', state = 'idle' }) {
  return (
    <div>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 12px', border: `1.5px solid ${C3.ink20}`, borderRadius: 4,
        background: C3.ticket, fontFamily: C3.sans, fontSize: 14, color: C3.ink,
        ...(state === 'focus' ? { borderColor: C3.ink, boxShadow: `0 0 0 3px rgba(15,58,53,0.10)` } : {}),
      }}>
        <span>{value}</span>
        <span style={{ width: 16, height: 16, color: C3.ink70 }}>{ICONS.chevronDown}</span>
      </div>
    </div>
  );
}

function TKToggle({ on, disabled, label }) {
  return (
    <label style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      fontFamily: C3.sans, fontSize: 13, color: C3.ink,
      cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.5 : 1,
    }}>
      <span style={{
        width: 38, height: 22, borderRadius: 11, position: 'relative',
        background: on ? C3.ink : 'transparent',
        border: `1.5px solid ${on ? C3.ink : C3.ink20}`,
        transition: 'background 120ms',
      }}>
        <span style={{
          position: 'absolute', top: 2, left: on ? 17 : 2,
          width: 15, height: 15, borderRadius: '50%',
          background: on ? C3.ticket : C3.ink70,
          transition: 'left 120ms',
        }} />
      </span>
      {label && <span>{label}</span>}
    </label>
  );
}

// ─────────────────────────── AVATARS

function TKAvatar({
  kind = 'initials', // initials | photo | emoji
  initial = 'D', emoji = '🦊',
  size = 32, ring,
}) {
  const fs = Math.round(size * 0.42);
  if (kind === 'photo') {
    // Striped placeholder — no fake portraits.
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        flexShrink: 0,
        background: `repeating-linear-gradient(135deg, ${C3.ink} 0 4px, ${C3.gold} 4px 8px)`,
        boxShadow: ring ? `0 0 0 2px ${ring}` : 'none',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, display: 'grid', placeItems: 'center',
          fontFamily: C3.mono, fontSize: Math.max(7, size * 0.18), color: C3.ticket,
          letterSpacing: 1, textTransform: 'uppercase',
          background: 'rgba(15,58,53,0.45)',
        }}>photo</div>
      </div>
    );
  }
  if (kind === 'emoji') {
    return (
      <div style={{
        width: size, height: size, borderRadius: '50%',
        background: C3.ticket, border: `1.5px solid ${C3.ink}`,
        display: 'grid', placeItems: 'center',
        fontSize: Math.round(size * 0.55), flexShrink: 0,
        boxShadow: ring ? `0 0 0 2px ${ring}` : 'none',
      }}>{emoji}</div>
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: C3.ink, color: C3.ticket,
      display: 'grid', placeItems: 'center',
      fontFamily: C3.display, fontSize: fs, lineHeight: 1, fontWeight: 400,
      flexShrink: 0,
      boxShadow: ring ? `0 0 0 2px ${ring}` : 'none',
    }}>{initial}</div>
  );
}

// Avatar chip: avatar + name in a single inline pill
function TKAvatarChip({ name, kind = 'initials', initial, emoji }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 8px 3px 3px', borderRadius: 100,
      background: 'rgba(15,58,53,0.06)',
      fontFamily: C3.sans, fontSize: 11, color: C3.ink, fontWeight: 500,
    }}>
      <TKAvatar kind={kind} initial={initial || (name && name[0])} emoji={emoji} size={18} />
      {name}
    </span>
  );
}

// ─────────────────────────── TEAM CHIPS

function TKTeamChip({
  code, name, short,
  variant = 'default', // default | compact | selected | disabled
  owner,
}) {
  if (variant === 'compact') {
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 8px', borderRadius: 4,
        background: 'rgba(15,58,53,0.05)',
        fontFamily: C3.sans, fontSize: 12, color: C3.ink, fontWeight: 500,
      }}>
        <span style={{ width: 18, height: 12, borderRadius: 2, overflow: 'hidden',
          boxShadow: 'inset 0 0 0 0.5px rgba(0,0,0,0.1)' }}>{FLAGS[code]}</span>
        {short || name}
      </span>
    );
  }

  const selected = variant === 'selected';
  const disabled = variant === 'disabled';
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      padding: '8px 12px 8px 8px',
      border: `1.5px ${disabled ? 'dashed' : 'solid'} ${selected ? C3.ink : C3.ink20}`,
      background: selected ? C3.ticket : (disabled ? 'transparent' : C3.ticket),
      borderRadius: 4, position: 'relative',
      opacity: disabled ? 0.55 : 1,
    }}>
      <FlagSquare code={code} size={28} radius={3} />
      <div>
        <div style={{
          fontFamily: C3.mono, fontSize: 8, color: C3.ink50,
          letterSpacing: 1.2, textTransform: 'uppercase', lineHeight: 1,
        }}>{short}</div>
        <div style={{
          fontFamily: C3.display, fontSize: 15, color: C3.ink,
          lineHeight: 1.1, marginTop: 2,
        }}>{name}</div>
        {owner && (
          <div style={{
            fontFamily: C3.sans, fontSize: 10, color: C3.ink70,
            marginTop: 2, fontWeight: 500,
          }}><span style={{ color: C3.ink50 }}>player</span> {owner}</div>
        )}
      </div>
      {selected && (
        <span style={{
          position: 'absolute', top: -8, right: -8,
          width: 18, height: 18, borderRadius: '50%',
          background: C3.ink, color: C3.ticket,
          display: 'grid', placeItems: 'center',
        }}>
          <span style={{ width: 12, height: 12 }}>{ICONS.check}</span>
        </span>
      )}
      {disabled && (
        <span style={{
          position: 'absolute', top: -7, right: -7,
          width: 22, height: 22, borderRadius: '50%',
          background: C3.paper, color: C3.ink70,
          border: `1px dashed ${C3.ink20}`,
          display: 'grid', placeItems: 'center',
        }}>
          <span style={{ width: 12, height: 12 }}>{ICONS.lock}</span>
        </span>
      )}
    </div>
  );
}

Object.assign(window, {
  TKButton, TKIconButton,
  TKInput, TKSelect, TKToggle, FieldLabel, FieldHelp,
  TKAvatar, TKAvatarChip, TKTeamChip,
});
