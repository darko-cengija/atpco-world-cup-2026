// Chat — message bubbles, reactions, composer, pickers, notification card.
// Every piece reuses Match Ticket DS: paper texture, dashed tear-lines,
// mono metadata, ink fills, stamp-red accents.
//
// Component vocabulary:
//   ChatDayDivider · UnreadDivider · ChatHeader
//   MessageBubble (other / mine, first-in-group, with reply, with reactions)
//   ReplyQuote (in-bubble)
//   ReactionRail · ReactionPill · DefaultHeartButton
//   CompactReactionPicker · ExpandedReactionPicker
//   Composer · SendButton · MentionPicker · ReplyComposerPreview
//   NotificationPromptCard

// ═══════════════════════════════════════════════ MENTION RENDERER

// Splits a message string into spans, highlighting @Name tokens.
function renderMentions(text, mine) {
  const tokenColor   = mine ? '#f1c69e' : C3.stamp;
  const tokenBg      = mine ? 'rgba(255,255,255,0.10)' : 'rgba(168,57,43,0.10)';
  const tokenBorder  = mine ? 'rgba(255,255,255,0.18)' : 'rgba(168,57,43,0.22)';
  // Tokenise on @Word boundaries (capitalised name, alphanumeric).
  const parts = text.split(/(@[A-Z][A-Za-z]+)/g);
  return parts.map((p, i) => {
    if (/^@[A-Z][A-Za-z]+$/.test(p)) {
      return (
        <span key={i} style={{
          color: tokenColor, background: tokenBg,
          border: `1px solid ${tokenBorder}`,
          padding: '0 5px', borderRadius: 3,
          fontWeight: 600, fontFamily: C3.sans,
          fontVariant: 'all-petite-caps', letterSpacing: 0.4,
        }}>{p}</span>
      );
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}

// ═══════════════════════════════════════════════ DIVIDERS

function ChatDayDivider({ label }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '14px 24px 10px',
    }}>
      <span style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${C3.ink20}` }} />
      <span style={{
        fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
        letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: 600,
      }}>{label}</span>
      <span style={{ flex: 1, height: 1, borderTop: `1.5px dashed ${C3.ink20}` }} />
    </div>
  );
}

function UnreadDivider() {
  return (
    <div style={{
      position: 'relative',
      padding: '14px 16px 6px',
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      {/* perforation notches at the edges */}
      <div style={{
        position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
        width: 20, height: 20, borderRadius: '50%', background: C3.paper,
        border: `1px solid ${C3.stamp}30`,
      }} />
      <div style={{
        position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)',
        width: 20, height: 20, borderRadius: '50%', background: C3.paper,
        border: `1px solid ${C3.stamp}30`,
      }} />
      <span style={{ flex: 1, height: 0, borderTop: `1.5px dashed ${C3.stamp}80` }} />
      <span style={{
        fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
        letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700,
        padding: '3px 8px',
        border: `1px solid ${C3.stamp}`,
        borderRadius: 3,
        background: C3.paper,
      }}>★ Unread</span>
      <span style={{ flex: 1, height: 0, borderTop: `1.5px dashed ${C3.stamp}80` }} />
    </div>
  );
}

// ═══════════════════════════════════════════════ CHAT HEADER

function ChatHeader({ count = 12 }) {
  return (
    <div style={{ padding: '4px 20px 14px', fontFamily: C3.sans }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
        letterSpacing: 2.2, textTransform: 'uppercase', fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <span>★ Pool · 5 players</span>
        <span style={{ flex: 1, height: 1, background: C3.ink20 }} />
        <span style={{ color: C3.ink50, letterSpacing: 1.4 }}>{count} today</span>
      </div>
      <div style={{
        fontFamily: C3.display, fontSize: 36, lineHeight: 1,
        color: C3.ink, letterSpacing: -0.6, marginTop: 6,
      }}>Chat</div>
    </div>
  );
}

// ═══════════════════════════════════════════════ REPLY QUOTE (in-bubble)

function ReplyQuote({ author, text, mine }) {
  const ink   = mine ? C3.ticket : C3.ink;
  const muted = mine ? 'rgba(246,239,219,0.6)' : C3.ink70;
  const accent= mine ? C3.gold   : C3.stamp;
  const bg    = mine ? 'rgba(255,255,255,0.08)' : 'rgba(15,58,53,0.04)';
  return (
    <div style={{
      display: 'flex', alignItems: 'stretch', gap: 8,
      padding: '6px 8px', marginBottom: 6,
      background: bg, borderRadius: 6,
      borderLeft: `3px solid ${accent}`,
      minWidth: 0,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 8, color: accent,
          letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
        }}>↳ Replying to {author}</div>
        <div style={{
          fontFamily: C3.sans, fontSize: 11.5, color: muted,
          marginTop: 2, lineHeight: 1.35,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{text}</div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════ MESSAGE BUBBLE

function MessageHeader({ author, time, mine }) {
  const user = CHAT_USERS[author];
  const label = mine ? 'You' : user.name;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      marginBottom: 4, paddingLeft: mine ? 0 : 44,
      justifyContent: mine ? 'flex-end' : 'flex-start',
    }}>
      <span style={{
        fontFamily: C3.mono, fontSize: 9, color: C3.ink70,
        letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: 700,
      }}>★ {label}</span>
      <span style={{
        fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
        letterSpacing: 1, fontVariantNumeric: 'tabular-nums',
      }}>{time}</span>
    </div>
  );
}

function MessageBubble({ msg, firstInGroup, lastInGroup }) {
  const mine = msg.author === 'darko';
  const user = CHAT_USERS[msg.author];

  const bubbleBg     = mine ? C3.ink : C3.ticket;
  const bubbleColor  = mine ? C3.ticket : C3.ink;
  const bubbleBorder = mine ? 'none' : `1px solid ${C3.ink20}`;
  const bubbleShadow = mine
    ? '0 2px 6px rgba(15,58,53,0.18)'
    : '0 1px 0 rgba(0,0,0,0.04), 0 4px 12px rgba(50,30,10,0.08)';

  return (
    <div style={{
      padding: `${firstInGroup ? 4 : 2}px 16px ${lastInGroup ? 2 : 2}px`,
      fontFamily: C3.sans,
    }}>
      {firstInGroup && (
        <MessageHeader author={msg.author} time={msg.time} mine={mine} />
      )}

      <div style={{
        display: 'flex',
        flexDirection: mine ? 'row-reverse' : 'row',
        alignItems: 'flex-end', gap: 8,
      }}>
        {/* Avatar slot — only on the LAST message in an others-group */}
        {!mine && (
          <div style={{ width: 36, flexShrink: 0 }}>
            {lastInGroup && (
              <TKAvatar
                kind={user.kind} initial={user.initial} emoji={user.emoji}
                size={32}
              />
            )}
          </div>
        )}

        {/* Bubble */}
        <div style={{
          maxWidth: '76%',
          padding: msg.replyTo ? '8px 12px 10px' : '10px 13px',
          background: bubbleBg,
          color: bubbleColor,
          border: bubbleBorder,
          borderRadius: 14,
          // Subtle "ticket corner" — squared the side toward the author
          borderBottomRightRadius: mine && lastInGroup ? 4 : 14,
          borderBottomLeftRadius: !mine && lastInGroup ? 4 : 14,
          boxShadow: bubbleShadow,
          ...(mine ? {} : paperTexture(C3.ticket)),
          fontSize: 14, lineHeight: 1.4,
          textWrap: 'pretty',
          wordBreak: 'break-word',
          position: 'relative',
        }}>
          {msg.replyTo && (
            <ReplyQuote author={msg.replyTo.author} text={msg.replyTo.text} mine={mine} />
          )}
          {renderMentions(msg.text, mine)}
        </div>
      </div>

      {/* Reactions sit BELOW the bubble, aligned to bubble side */}
      {msg.reactions && msg.reactions.length > 0 && (
        <ReactionRail mine={mine} reactions={msg.reactions} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════ REACTION RAIL

function ReactionPill({ emoji, count, mine }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 7px 2px 6px',
      borderRadius: 100,
      border: mine ? `1.5px solid ${C3.stamp}` : `1px solid ${C3.ink20}`,
      background: mine ? 'rgba(168,57,43,0.10)' : C3.paper,
      fontFamily: C3.mono, fontSize: 10,
      color: mine ? C3.stamp : C3.ink70,
      letterSpacing: 0.4, fontWeight: 700,
      fontVariantNumeric: 'tabular-nums',
      lineHeight: 1.4,
    }}>
      <span style={{ fontSize: 12 }}>{emoji}</span>
      {count > 1 && count}
    </span>
  );
}

function DefaultHeartButton() {
  return (
    <button style={{
      width: 26, height: 26, padding: 0, borderRadius: 100,
      background: C3.paper, color: C3.ink50,
      border: `1px dashed ${C3.ink20}`, cursor: 'pointer',
      display: 'inline-grid', placeItems: 'center',
    }}>
      <svg viewBox="0 0 24 24" width="13" height="13" fill="none">
        <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"
          stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
      </svg>
    </button>
  );
}

function AddReactionButton() {
  return (
    <button style={{
      width: 26, height: 22, padding: 0, borderRadius: 100,
      background: 'transparent', color: C3.ink50,
      border: `1px dashed ${C3.ink20}`, cursor: 'pointer',
      display: 'inline-grid', placeItems: 'center',
      fontFamily: C3.mono, fontSize: 11, fontWeight: 600,
      lineHeight: 1,
    }}>+</button>
  );
}

function ReactionRail({ mine, reactions }) {
  return (
    <div style={{
      display: 'flex', flexWrap: 'wrap',
      gap: 4, marginTop: 4,
      justifyContent: mine ? 'flex-end' : 'flex-start',
      paddingLeft:  mine ? 0  : 44,
      paddingRight: mine ? 0  : 0,
    }}>
      {reactions.map((r, i) => (
        <ReactionPill key={i} emoji={r.emoji} count={r.count} mine={r.mine} />
      ))}
      <AddReactionButton />
    </div>
  );
}

// Default-heart-only rail — for messages with zero reactions yet.
function DefaultReactionRail({ mine }) {
  return (
    <div style={{
      display: 'flex',
      gap: 4, marginTop: 4,
      justifyContent: mine ? 'flex-end' : 'flex-start',
      paddingLeft:  mine ? 0  : 44,
    }}>
      <DefaultHeartButton />
    </div>
  );
}

// ═══════════════════════════════════════════════ REACTION PICKERS

// Floating compact picker — appears above a long-pressed message.
function CompactReactionPicker({ activeEmoji = '❤️' }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '6px 6px',
      background: C3.ticket,
      border: `1px solid ${C3.ink}`,
      borderRadius: 100,
      boxShadow: '0 8px 22px rgba(50,30,10,0.18), 0 1px 0 rgba(0,0,0,0.05)',
      ...paperTexture(C3.ticket),
    }}>
      {QUICK_REACTIONS.map((e) => {
        const active = e === activeEmoji;
        return (
          <button key={e} style={{
            width: 32, height: 32, padding: 0,
            borderRadius: '50%',
            border: 'none',
            background: active ? 'rgba(168,57,43,0.14)' : 'transparent',
            cursor: 'pointer', fontSize: 18, lineHeight: 1,
            boxShadow: active ? `inset 0 0 0 1.5px ${C3.stamp}` : 'none',
            transition: 'background 100ms',
          }}>{e}</button>
        );
      })}
      <span style={{ width: 1, height: 22, background: C3.ink20, margin: '0 2px' }} />
      <button style={{
        width: 30, height: 30, padding: 0,
        borderRadius: '50%',
        border: `1px dashed ${C3.ink20}`,
        background: 'transparent', color: C3.ink70,
        cursor: 'pointer', fontFamily: C3.mono, fontSize: 11,
        fontWeight: 700, lineHeight: 1,
        display: 'inline-grid', placeItems: 'center',
      }}>···</button>
    </div>
  );
}

function ExpandedReactionPicker() {
  return (
    <div style={{
      width: 320,
      ...paperTexture(C3.ticket),
      borderRadius: 14,
      border: `1px solid ${C3.ink}`,
      boxShadow: '0 24px 60px rgba(50,30,10,0.22), 0 1px 0 rgba(0,0,0,0.05)',
      overflow: 'hidden', fontFamily: C3.sans,
    }}>
      {/* Header strip */}
      <div style={{
        padding: '12px 14px',
        borderBottom: `1px dashed ${C3.ink20}`,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
            letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: 700,
          }}>★ React with</div>
          <div style={{
            fontFamily: C3.display, fontSize: 16, color: C3.ink,
            lineHeight: 1, marginTop: 2,
          }}>Pick a stamp</div>
        </div>
        <button aria-label="Close" style={{
          width: 28, height: 28, padding: 0, borderRadius: 6,
          border: `1px solid ${C3.ink20}`, background: 'transparent',
          color: C3.ink70, cursor: 'pointer',
          display: 'grid', placeItems: 'center',
        }}>
          <span style={{ width: 14, height: 14 }}>{ICONS.close}</span>
        </button>
      </div>

      {/* Emoji grid */}
      <div style={{
        padding: 10,
        display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 2,
      }}>
        {FULL_REACTIONS.map((e, i) => {
          const active = e === '❤️'; // currently-selected demo
          return (
            <button key={i} style={{
              aspectRatio: '1 / 1',
              border: 'none', borderRadius: 8,
              background: active ? 'rgba(168,57,43,0.14)' : 'transparent',
              boxShadow: active ? `inset 0 0 0 1.5px ${C3.stamp}` : 'none',
              cursor: 'pointer', fontSize: 22, lineHeight: 1,
            }}>{e}</button>
          );
        })}
      </div>

      {/* Footer strip */}
      <div style={{
        padding: '10px 14px',
        borderTop: `1px dashed ${C3.ink20}`,
        fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
        letterSpacing: 1.2, textTransform: 'uppercase',
        display: 'flex', justifyContent: 'space-between',
      }}>
        <span>{FULL_REACTIONS.length} stamps · pool only</span>
        <span style={{ color: C3.ink70 }}>tap to react</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════ COMPOSER

// Send button: enabled · disabled · sending
function SendButton({ state = 'enabled' }) {
  const enabled = state === 'enabled';
  const sending = state === 'sending';
  return (
    <button aria-label="Send" style={{
      width: 44, height: 38, padding: 0,
      border: enabled || sending ? 'none' : `1.5px dashed ${C3.ink20}`,
      background: enabled || sending ? C3.ink : 'transparent',
      color: enabled || sending ? C3.ticket : C3.ink50,
      borderRadius: 6, cursor: enabled ? 'pointer' : 'default',
      display: 'grid', placeItems: 'center',
      flexShrink: 0, position: 'relative',
      opacity: sending ? 0.9 : 1,
      boxShadow: enabled ? '0 1px 0 rgba(0,0,0,0.05), 0 2px 6px rgba(15,58,53,0.18)' : 'none',
      transform: sending ? 'translateY(1px)' : 'none',
    }}>
      {sending ? (
        <span style={{ width: 20, height: 20 }}>{ICONS.spinner(C3.ticket, 20)}</span>
      ) : (
        <span style={{ width: 18, height: 18, transform: 'translateX(-1px)' }}>
          {ICONS.send}
        </span>
      )}
    </button>
  );
}

// Reply preview that sits IMMEDIATELY above the composer.
function ReplyComposerPreview({ author = 'Marko',
  text = 'you crazy, MEX 3-0 easy. azteca crowd will eat them alive' }) {
  return (
    <div style={{
      margin: '0 12px',
      padding: '8px 10px',
      background: 'rgba(168,57,43,0.06)',
      borderLeft: `3px solid ${C3.stamp}`,
      border: `1px solid ${C3.stamp}30`,
      borderTopLeftRadius: 8, borderTopRightRadius: 8,
      borderBottom: 'none',
      display: 'flex', alignItems: 'center', gap: 10,
      fontFamily: C3.sans,
    }}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none"
        style={{ color: C3.stamp, flexShrink: 0 }}>
        <path d="M9 14L4 9l5-5M4 9h9a6 6 0 0 1 6 6v4"
          stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 8, color: C3.stamp,
          letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
        }}>Replying to {author}</div>
        <div style={{
          fontFamily: C3.sans, fontSize: 12, color: C3.ink70,
          marginTop: 2, lineHeight: 1.3,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{text}</div>
      </div>
      <button aria-label="Cancel reply" style={{
        width: 24, height: 24, padding: 0, borderRadius: 4,
        border: 'none', background: 'transparent',
        color: C3.ink70, cursor: 'pointer',
        display: 'grid', placeItems: 'center', flexShrink: 0,
      }}>
        <span style={{ width: 14, height: 14 }}>{ICONS.close}</span>
      </button>
    </div>
  );
}

// Mention picker — floats above the composer when the user types "@".
function MentionPicker({ query = '' }) {
  const rows = MENTIONABLE
    .map(id => CHAT_USERS[id])
    .filter(u => !query || u.name.toLowerCase().startsWith(query.toLowerCase()));
  return (
    <div style={{
      margin: '0 12px',
      ...paperTexture(C3.ticket),
      border: `1px solid ${C3.ink}`,
      borderBottom: 'none',
      borderTopLeftRadius: 10, borderTopRightRadius: 10,
      boxShadow: '0 -8px 22px rgba(50,30,10,0.10)',
      overflow: 'hidden',
    }}>
      <div style={{
        padding: '8px 12px',
        borderBottom: `1px dashed ${C3.ink20}`,
        fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
        letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span>★ Mention</span>
        <span style={{ color: C3.ink50, letterSpacing: 1.2 }}>
          {query ? `@${query}` : 'type to filter'}
        </span>
        <span style={{ flex: 1 }} />
        <span style={{ color: C3.ink50 }}>{rows.length} match{rows.length === 1 ? '' : 'es'}</span>
      </div>
      <div>
        {rows.map((u, i) => (
          <div key={u.id} style={{
            padding: '8px 12px',
            display: 'flex', alignItems: 'center', gap: 10,
            borderBottom: i < rows.length - 1 ? `1px dashed ${C3.ink20}` : 'none',
            cursor: 'pointer',
            background: i === 0 ? 'rgba(168,57,43,0.06)' : 'transparent',
          }}>
            <TKAvatar kind={u.kind} initial={u.initial} emoji={u.emoji} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: C3.display, fontSize: 15, color: C3.ink,
                lineHeight: 1.1, letterSpacing: -0.1,
              }}>{u.name}</div>
              <div style={{
                fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
                letterSpacing: 1.2, marginTop: 2, textTransform: 'uppercase',
              }}>@{u.name.toLowerCase()}{u.admin ? ' · admin' : ''}</div>
            </div>
            {i === 0 && (
              <span style={{
                fontFamily: C3.mono, fontSize: 9, color: C3.ink70,
                letterSpacing: 1.4, textTransform: 'uppercase',
                border: `1px solid ${C3.ink20}`, padding: '2px 6px', borderRadius: 3,
              }}>↵</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// The composer bar itself. state controls send button + textarea content.
function Composer({
  text = '',
  state = 'idle',           // idle (empty) | typing | sending
  placeholder = 'Message…',
  flatTop = false,          // when stacked under a reply preview / mention picker
}) {
  const sendState = state === 'idle' ? 'disabled'
                  : state === 'sending' ? 'sending' : 'enabled';
  return (
    <div style={{
      ...paperTexture(C3.paper),
      borderTop: `1px dashed ${C3.ink20}`,
      padding: '10px 12px 10px',
      display: 'flex', alignItems: 'flex-end', gap: 8,
      fontFamily: C3.sans,
      ...(flatTop ? { borderTop: `1px solid ${C3.ink20}` } : {}),
    }}>
      {/* Textarea pill */}
      <div style={{
        flex: 1,
        border: `1.5px solid ${state === 'typing' || state === 'sending' ? C3.ink : C3.ink20}`,
        background: C3.ticket,
        borderRadius: 20,
        padding: '9px 14px',
        minHeight: 38,
        display: 'flex', alignItems: 'center',
        fontFamily: C3.sans, fontSize: 14, color: C3.ink,
        lineHeight: 1.35,
        ...paperTexture(C3.ticket),
        position: 'relative',
      }}>
        {text ? (
          <span>{renderMentions(text, false)}</span>
        ) : (
          <span style={{ color: C3.ink50, fontStyle: 'italic' }}>{placeholder}</span>
        )}
        {state === 'typing' && (
          <span style={{
            display: 'inline-block', width: 1.5, height: 16,
            marginLeft: 2, background: C3.ink,
            animation: 'tkPulse 0.9s ease-in-out infinite',
          }} />
        )}
      </div>
      <SendButton state={sendState} />
    </div>
  );
}

// ═══════════════════════════════════════════════ NOTIFICATION CARD

function NotificationPromptCard({ variant = 'idle' }) {
  // variant: idle | enabling | declined-fading
  return (
    <div style={{
      margin: '0 16px 14px',
      ...paperTexture(C3.ticket),
      borderRadius: 14,
      border: `1px solid ${C3.ink20}`,
      boxShadow: '0 1px 0 rgba(0,0,0,0.04), 0 6px 14px rgba(50,30,10,0.08)',
      overflow: 'hidden', fontFamily: C3.sans,
      position: 'relative',
    }}>
      {/* Close X */}
      <button aria-label="Dismiss" style={{
        position: 'absolute', top: 8, right: 8,
        width: 26, height: 26, padding: 0, borderRadius: 6,
        border: 'none', background: 'transparent',
        color: C3.ink50, cursor: 'pointer',
        display: 'grid', placeItems: 'center', zIndex: 2,
      }}>
        <span style={{ width: 14, height: 14 }}>{ICONS.close}</span>
      </button>

      {/* Body */}
      <div style={{ padding: '12px 14px 10px',
        display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 8, flexShrink: 0,
          border: `1.5px solid ${C3.stamp}`, color: C3.stamp,
          display: 'grid', placeItems: 'center',
          background: 'rgba(168,57,43,0.08)',
        }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
            <path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15L6 16z"
              stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
            <path d="M10 20a2 2 0 0 0 4 0"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0, paddingRight: 22 }}>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
            letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
          }}>★ Notice</div>
          <div style={{
            fontFamily: C3.display, fontSize: 18, color: C3.ink,
            lineHeight: 1.1, marginTop: 2,
          }}>Chat notifications</div>
          <div style={{
            fontFamily: C3.sans, fontSize: 12.5, color: C3.ink70,
            marginTop: 6, lineHeight: 1.45, textWrap: 'pretty',
          }}>Let me know when someone sends a message.</div>
        </div>
      </div>

      {/* Dashed tear + button row */}
      <div style={{
        borderTop: `1.5px dashed ${C3.ink20}`,
        padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <button style={{
          padding: '8px 12px', border: 'none',
          background: variant === 'enabling' ? C3.stampInk : C3.stamp,
          color: C3.ticket,
          borderRadius: 4,
          fontFamily: C3.mono, fontSize: 10, fontWeight: 700,
          letterSpacing: 1.6, textTransform: 'uppercase',
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6,
          transform: variant === 'enabling' ? 'translateY(1px)' : 'none',
        }}>
          {variant === 'enabling' && (
            <span style={{ width: 14, height: 14 }}>{ICONS.spinner(C3.ticket, 14)}</span>
          )}
          {variant === 'enabling' ? 'Enabling…' : 'Enable'}
          {variant !== 'enabling' && (
            <span style={{ fontFamily: C3.display, fontSize: 13 }}>→</span>
          )}
        </button>
        <button style={{
          padding: '8px 12px', borderRadius: 4,
          border: `1px solid ${C3.ink}`, background: 'transparent',
          color: C3.ink, cursor: 'pointer',
          fontFamily: C3.mono, fontSize: 10, fontWeight: 700,
          letterSpacing: 1.4, textTransform: 'uppercase',
        }}>No thanks</button>
        <span style={{ flex: 1 }} />
        <span style={{
          fontFamily: C3.mono, fontSize: 8, color: C3.ink50,
          letterSpacing: 1.2, textTransform: 'uppercase',
        }}>Permission · OS prompt</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════ MESSAGE LIST RENDERER
// Renders a list of messages, inserting day dividers, unread divider,
// grouping consecutive messages from the same author, applying first/last
// flags to each. The unread marker is inserted BEFORE the first msg.unread.

function MessageList({ messages, showUnread = false, showHeader = true, notification }) {
  if (!messages || messages.length === 0) return null;

  const out = [];
  let firstDayPushed = false;
  let lastAuthor = null;
  let lastUnread = null;
  let unreadInserted = false;
  let pendingDay = null;

  messages.forEach((m, i) => {
    // Day header
    if (m.day) {
      out.push(<ChatDayDivider key={`d${i}`} label={m.day} />);
      lastAuthor = null;
    }
    // Unread divider (once, before first msg.unread)
    if (showUnread && m.unread && !unreadInserted) {
      out.push(<UnreadDivider key={`u${i}`} />);
      lastAuthor = null;
      unreadInserted = true;
    }
    const next = messages[i + 1];
    const firstInGroup = lastAuthor !== m.author;
    const lastInGroup  = !next || next.author !== m.author || next.day
      || (showUnread && next.unread && !unreadInserted);
    out.push(
      <MessageBubble key={m.id} msg={m}
        firstInGroup={firstInGroup} lastInGroup={lastInGroup} />
    );
    lastAuthor = m.author;
  });

  return (
    <div>
      {showHeader && <ChatHeader count={messages.length} />}
      {notification}
      {out}
    </div>
  );
}

Object.assign(window, {
  renderMentions, ChatDayDivider, UnreadDivider, ChatHeader,
  ReplyQuote, MessageHeader, MessageBubble,
  ReactionPill, DefaultHeartButton, AddReactionButton,
  ReactionRail, DefaultReactionRail,
  CompactReactionPicker, ExpandedReactionPicker,
  SendButton, ReplyComposerPreview, MentionPicker, Composer,
  NotificationPromptCard, MessageList,
});
