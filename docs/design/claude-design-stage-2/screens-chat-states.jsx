// Chat — composed states (full-phone artboards).
// Each state wires components from screens-chat.jsx into the Phone shell
// with the same chrome the rest of the app uses (TopBar + BottomNav · chat tab).

// ─── Helper: chat-phone scaffold. Renders the standard shell with the
// message stream in the scroll area and a fixed composer + bottom nav.
function ChatPhone({
  children, composer, overlay,
  navVariant = 'live', notification, scrollPad = 16,
}) {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'hidden',
        ...paperTexture(C3.paper),
        display: 'flex', flexDirection: 'column', position: 'relative',
      }}>
        <TopBar />
        <div style={{
          flex: 1, overflow: 'auto',
          display: 'flex', flexDirection: 'column',
        }}>
          {children}
          <div style={{ height: scrollPad }} />
        </div>
        {overlay}
        {composer}
      </div>
      <BottomNav variant={navVariant} activeId="chat" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// ───────────────────────────────────────── 01 · MESSAGE LIST · STATES

function ChatEmpty() {
  return (
    <ChatPhone composer={<Composer state="idle" />}>
      <ChatHeader count={0} />
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '0 32px 60px', textAlign: 'center',
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: 16,
          border: `1.5px dashed ${C3.ink20}`,
          display: 'grid', placeItems: 'center',
          color: C3.ink70, marginBottom: 18,
          background: 'rgba(15,58,53,0.03)',
          position: 'relative',
        }}>
          {/* paper notches like a tear-stub */}
          <div style={{
            position: 'absolute', left: -10, top: '50%', transform: 'translateY(-50%)',
            width: 18, height: 18, borderRadius: '50%', background: C3.paper,
            border: `1px solid ${C3.ink20}`,
          }} />
          <div style={{
            position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)',
            width: 18, height: 18, borderRadius: '50%', background: C3.paper,
            border: `1px solid ${C3.ink20}`,
          }} />
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none">
            <path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-7l-4 4v-4H6a2 2 0 0 1-2-2V6z"
              stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round"/>
          </svg>
        </div>
        <div style={{
          fontFamily: C3.display, fontSize: 24, color: C3.ink,
          letterSpacing: -0.3, lineHeight: 1.1,
        }}>No messages yet.</div>
        <div style={{
          fontFamily: C3.mono, fontSize: 11, color: C3.stamp,
          letterSpacing: 2, textTransform: 'uppercase', fontWeight: 700,
          marginTop: 12,
        }}>★ Start the chat!</div>
        <div style={{
          fontFamily: C3.sans, fontSize: 12.5, color: C3.ink70,
          marginTop: 14, lineHeight: 1.5, maxWidth: 260,
          textWrap: 'pretty',
        }}>
          Trash talk, lineup gossip, last-minute swap requests — all five of
          you can see whatever lands here.
        </div>
      </div>
    </ChatPhone>
  );
}

function ChatDefault() {
  return (
    <ChatPhone composer={<Composer state="idle" />}>
      <MessageList messages={CHAT_MESSAGES_DEFAULT} showUnread={false} />
    </ChatPhone>
  );
}

function ChatWithUnread() {
  return (
    <ChatPhone composer={<Composer state="idle" />}>
      <MessageList messages={CHAT_MESSAGES_DEFAULT} showUnread />
    </ChatPhone>
  );
}

function ChatWithNotification() {
  return (
    <ChatPhone composer={<Composer state="idle" />}>
      <MessageList messages={CHAT_MESSAGES_DEFAULT.slice(0, 4)} showUnread={false}
        notification={<NotificationPromptCard />} />
    </ChatPhone>
  );
}

// Long-message wrap demo — a single long message that has to flow across
// several lines while preserving the bubble's max-width.
const LONG_WRAP_MESSAGES = [
  { id: 101, day: 'Wed, Jun 10', author: 'ivan', time: '11:47',
    text: "ok hot take — the entire group of death narrative is overblown. we run the same simulations every cycle, half the upsets come from the 'easy' groups because everyone takes their foot off the gas. genuinely think @Ana or @Petra wins this whole thing with their list and I'm not even being nice",
    reactions: [{ emoji: '🔥', count: 2, mine: false, by: ['ana', 'petra'] }],
  },
  { id: 102, author: 'darko', time: '11:50',
    text: 'spoken like someone who drew BIH first round and is now coping. respect though, that\'s a real take',
  },
];

function ChatLongWrap() {
  return (
    <ChatPhone composer={<Composer state="idle" />}>
      <MessageList messages={LONG_WRAP_MESSAGES} showUnread={false} />
    </ChatPhone>
  );
}

// ───────────────────────────────────────── 02 · REACTIONS · STATES

// Compact picker hovering over a single (selected) message bubble.
function ChatReactionsCompact() {
  // Selected message (Marko's "you crazy" line) gets a faint highlight ring.
  const focusMsg = CHAT_MESSAGES_DEFAULT[3];
  return (
    <ChatPhone
      composer={<Composer state="idle" />}
      overlay={
        // Backdrop wash to focus the picker
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(15,58,53,0.18)',
          backdropFilter: 'blur(0.5px)', pointerEvents: 'none',
          zIndex: 4,
        }} />
      }
    >
      <ChatHeader count={CHAT_MESSAGES_DEFAULT.length} />
      {/* Render first 4 messages, then a focused/picker version of msg 4 */}
      {CHAT_MESSAGES_DEFAULT.slice(0, 3).map((m, i) => {
        const next = CHAT_MESSAGES_DEFAULT[i + 1];
        const prev = CHAT_MESSAGES_DEFAULT[i - 1];
        return (
          <MessageBubble key={m.id} msg={m}
            firstInGroup={!prev || prev.author !== m.author}
            lastInGroup={!next || next.author !== m.author} />
        );
      })}
      {/* The focused message + floating picker */}
      <div style={{ position: 'relative', zIndex: 6 }}>
        <div style={{
          position: 'absolute', inset: '-4px 12px -4px 12px',
          borderRadius: 18, boxShadow: `0 0 0 1.5px ${C3.stamp}55`,
          pointerEvents: 'none',
        }} />
        <MessageBubble msg={focusMsg} firstInGroup lastInGroup />
        <div style={{
          display: 'flex', justifyContent: 'flex-start',
          paddingLeft: 60, marginTop: -2, marginBottom: 4,
        }}>
          <CompactReactionPicker activeEmoji="❤️" />
        </div>
      </div>
    </ChatPhone>
  );
}

// Expanded picker — modal centered over the chat.
function ChatReactionsExpanded() {
  return (
    <ChatPhone
      composer={<Composer state="idle" />}
      overlay={
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          background: 'rgba(15,58,53,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: 16,
        }}>
          <ExpandedReactionPicker />
        </div>
      }
    >
      <MessageList messages={CHAT_MESSAGES_DEFAULT.slice(0, 4)} />
    </ChatPhone>
  );
}

// Rail variants close-up — a "spec card" instead of a phone, to call out
// the reaction states side-by-side.
function ReactionsRailSpec() {
  const Row = ({ label, children }) => (
    <div style={{
      padding: '14px 16px',
      borderBottom: `1px dashed ${C3.ink20}`,
      display: 'flex', alignItems: 'center', gap: 16,
    }}>
      <div style={{ width: 92, flexShrink: 0 }}>
        <div style={{
          fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
          letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
        }}>{label}</div>
      </div>
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      ...paperTexture(C3.paper), padding: 18,
    }}>
      <div style={{
        ...paperTexture(C3.ticket),
        borderRadius: 14, overflow: 'hidden',
        boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
      }}>
        <div style={{ padding: '14px 16px', borderBottom: `1px dashed ${C3.ink20}` }}>
          <div style={{
            fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
            letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: 700,
          }}>★ Reaction rail · spec</div>
          <div style={{
            fontFamily: C3.display, fontSize: 22, color: C3.ink,
            lineHeight: 1, marginTop: 4,
          }}>Five states</div>
          <div style={{
            fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
            letterSpacing: 1.2, marginTop: 6, textTransform: 'uppercase',
          }}>Sits 4px below the bubble, aligned to bubble side</div>
        </div>

        <Row label="Default">
          <DefaultHeartButton />
          <div style={{ marginTop: 6, fontFamily: C3.sans, fontSize: 11.5, color: C3.ink70 }}>
            Empty heart · invites a first reaction. Dashed border = no one has reacted yet.
          </div>
        </Row>
        <Row label="Mine · active">
          <div style={{ display: 'inline-flex', gap: 4 }}>
            <ReactionPill emoji="❤️" count={2} mine={true} />
          </div>
          <div style={{ marginTop: 6, fontFamily: C3.sans, fontSize: 11.5, color: C3.ink70 }}>
            Stamp-red ring + soft red wash → "I reacted with this". Tabular count.
          </div>
        </Row>
        <Row label="Others">
          <div style={{ display: 'inline-flex', gap: 4 }}>
            <ReactionPill emoji="😮" count={1} mine={false} />
            <ReactionPill emoji="🙏" count={3} mine={false} />
          </div>
          <div style={{ marginTop: 6, fontFamily: C3.sans, fontSize: 11.5, color: C3.ink70 }}>
            Cream paper · ink20 border. Count hidden when only 1 person reacted.
          </div>
        </Row>
        <Row label="Single">
          <ReactionPill emoji="🔥" count={1} mine={false} />
          <div style={{ marginTop: 6, fontFamily: C3.sans, fontSize: 11.5, color: C3.ink70 }}>
            When count = 1, the number is dropped — keeps the rail compact.
          </div>
        </Row>
        <Row label="Mixed + add">
          <div style={{ display: 'inline-flex', gap: 4 }}>
            <ReactionPill emoji="❤️" count={2} mine={true} />
            <ReactionPill emoji="😮" count={1} mine={false} />
            <ReactionPill emoji="🙏" count={1} mine={false} />
            <AddReactionButton />
          </div>
          <div style={{ marginTop: 6, fontFamily: C3.sans, fontSize: 11.5, color: C3.ink70 }}>
            Trailing + button opens the compact picker. Rail wraps at narrow widths.
          </div>
        </Row>

        <div style={{ padding: '12px 16px',
          fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
          letterSpacing: 1.2, textTransform: 'uppercase' }}>
          Inverted reactions inside mine bubble · same shapes, gold accent
        </div>
      </div>
    </div>
  );
}

// Compact + expanded picker alone — for "anatomy" cards.
function CompactPickerBare() {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'grid', placeItems: 'center', padding: 24,
      ...paperTexture(C3.paper),
    }}>
      <CompactReactionPicker activeEmoji="❤️" />
    </div>
  );
}

function ExpandedPickerBare() {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'grid', placeItems: 'center', padding: 24,
      ...paperTexture(C3.paper),
    }}>
      <ExpandedReactionPicker />
    </div>
  );
}

// ───────────────────────────────────────── 03 · COMPOSER · STATES

function ChatComposerIdle() {
  return (
    <ChatPhone composer={<Composer state="idle" />}>
      <MessageList messages={CHAT_MESSAGES_DEFAULT.slice(0, 4)} />
    </ChatPhone>
  );
}

function ChatComposerTyping() {
  return (
    <ChatPhone composer={<Composer state="typing" text="raiola wins the group, mark my words" />}>
      <MessageList messages={CHAT_MESSAGES_DEFAULT.slice(0, 4)} />
    </ChatPhone>
  );
}

function ChatComposerSending() {
  return (
    <ChatPhone composer={<Composer state="sending" text="raiola wins the group, mark my words" />}>
      <MessageList messages={CHAT_MESSAGES_DEFAULT.slice(0, 4)} />
    </ChatPhone>
  );
}

function ChatComposerMention() {
  return (
    <ChatPhone composer={
      <div>
        <MentionPicker query="" />
        <Composer state="typing" text="@" flatTop />
      </div>
    }>
      <MessageList messages={CHAT_MESSAGES_DEFAULT.slice(0, 3)} />
    </ChatPhone>
  );
}

function ChatComposerReply() {
  return (
    <ChatPhone composer={
      <div>
        <ReplyComposerPreview author="Marko"
          text="you crazy, MEX 3-0 easy. azteca crowd will eat them alive" />
        <Composer state="typing" text="MEX defense is held together with tape rn" flatTop />
      </div>
    }>
      <MessageList messages={CHAT_MESSAGES_DEFAULT.slice(0, 4)} />
    </ChatPhone>
  );
}

// Composer anatomy — all four send-button states stacked.
function ComposerSpec() {
  const Block = ({ label, children }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 9, color: C3.stamp,
        letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
        marginBottom: 6,
      }}>{label}</div>
      <div style={{
        borderRadius: 10,
        boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 6px 14px rgba(50,30,10,0.08)',
        overflow: 'hidden',
        background: C3.paper,
      }}>{children}</div>
    </div>
  );
  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      ...paperTexture(C3.paper), padding: 18,
    }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
        letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: 700,
      }}>★ Composer · spec</div>
      <div style={{
        fontFamily: C3.display, fontSize: 22, color: C3.ink,
        letterSpacing: -0.3, lineHeight: 1, marginTop: 4, marginBottom: 16,
      }}>States · anatomy</div>

      <Block label="Idle · send disabled">
        <Composer state="idle" />
      </Block>
      <Block label="Typing · send enabled">
        <Composer state="typing" text="thinking…" />
      </Block>
      <Block label="Sending · spinner">
        <Composer state="sending" text="raiola wins the group, mark my words" />
      </Block>
      <Block label="With reply preview">
        <ReplyComposerPreview author="Marko"
          text="you crazy, MEX 3-0 easy. azteca crowd will eat them alive" />
        <Composer state="typing" text="MEX defense is held together with tape rn" flatTop />
      </Block>
      <Block label="With mention picker">
        <MentionPicker query="" />
        <Composer state="typing" text="@" flatTop />
      </Block>

      <div style={{
        marginTop: 4,
        padding: '12px 14px', borderRadius: 8,
        border: `1px dashed ${C3.ink20}`,
        fontFamily: C3.sans, fontSize: 12, color: C3.ink70,
        lineHeight: 1.5, textWrap: 'pretty',
      }}>
        Composer is fixed above the bottom nav. Textarea grows up to 4
        lines (~96px) before scrolling internally. Send shortcut is ⌘↵.
        Cursor blink is the only animation in idle/typing.
      </div>
    </div>
  );
}

// ───────────────────────────────────────── 04 · NOTIFICATION CARD · STATES

function ChatWithNotificationStates({ variant = 'idle' }) {
  return (
    <ChatPhone composer={<Composer state="idle" />}>
      <MessageList messages={CHAT_MESSAGES_DEFAULT.slice(0, 4)}
        notification={<NotificationPromptCard variant={variant} />} />
    </ChatPhone>
  );
}

function NotificationCardBare() {
  return (
    <div style={{
      width: '100%', height: '100%', overflow: 'auto',
      ...paperTexture(C3.paper), padding: 18,
    }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
        letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: 700,
      }}>★ Notification prompt · spec</div>
      <div style={{
        fontFamily: C3.display, fontSize: 22, color: C3.ink,
        letterSpacing: -0.3, lineHeight: 1, marginTop: 4, marginBottom: 14,
      }}>Idle · Enabling · Anatomy</div>
      <div style={{ marginBottom: 14 }}>
        <NotificationPromptCard variant="idle" />
      </div>
      <div style={{ marginBottom: 14 }}>
        <NotificationPromptCard variant="enabling" />
      </div>
      <div style={{
        padding: '12px 14px', borderRadius: 8,
        border: `1px dashed ${C3.ink20}`,
        fontFamily: C3.sans, fontSize: 12, color: C3.ink70,
        lineHeight: 1.5, textWrap: 'pretty', margin: '0 16px',
      }}>
        Pinned above the message stream after first chat-tab visit.
        Tapping × dismisses for the session. Tapping <b>No thanks</b> dismisses
        for 30 days. <b>Enable</b> triggers the OS permission prompt — on grant,
        the card swaps to a stamped <i>Notifications on</i> confirmation toast
        for 3 seconds, then unmounts.
      </div>
    </div>
  );
}

Object.assign(window, {
  ChatPhone,
  ChatEmpty, ChatDefault, ChatWithUnread, ChatWithNotification, ChatLongWrap,
  ChatReactionsCompact, ChatReactionsExpanded,
  ReactionsRailSpec, CompactPickerBare, ExpandedPickerBare,
  ChatComposerIdle, ChatComposerTyping, ChatComposerSending,
  ChatComposerMention, ChatComposerReply, ComposerSpec,
  ChatWithNotificationStates, NotificationCardBare,
});
