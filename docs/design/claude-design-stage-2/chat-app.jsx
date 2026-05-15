// World Cup 26 — Chat surface · design canvas.
// Lays out every chat state on the standard Design Canvas using the
// Match Ticket DS chrome.

const ART_W = 420;
const ART_H = 884;

function PhoneArt({ children }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: '#e6dcc5',
      backgroundImage: `radial-gradient(rgba(0,0,0,0.04) 1px, transparent 1px),
                        radial-gradient(rgba(0,0,0,0.025) 1px, transparent 1px)`,
      backgroundSize: '3px 3px, 7px 7px',
      backgroundPosition: '0 0, 1.5px 1.5px',
    }}>{children}</div>
  );
}

function NoteBlock({ heading, bullets }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 8,
      border: `1px dashed ${C3.ink20}`,
    }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
        letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 700,
        marginBottom: 8,
      }}>★ {heading}</div>
      <ul style={{ margin: 0, paddingLeft: 18,
        fontFamily: C3.sans, fontSize: 12.5, color: C3.ink, lineHeight: 1.55 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ marginBottom: 4, textWrap: 'pretty' }}>{b}</li>
        ))}
      </ul>
    </div>
  );
}

function App() {
  return (
    <DesignCanvas>
      {/* ─────────── 00 · MAP / LEGEND ─────────── */}
      <DCSection
        id="map"
        title="Chat · prototype + spec"
        subtitle='Pool chat lives on its own tab and re-uses the Match Ticket vocabulary — paper texture, dashed tear-lines, monospace metadata, stamp-red accents. Every bubble, picker, divider and composer state below ships with the same chrome (TopBar + BottomNav · "Chat") so the chat tab never feels like a separate product.'
      >
        <DCArtboard id="legend" label="Legend · what's where" width={620} height={780}>
          <div style={{
            ...paperTexture(C3.ticket),
            borderRadius: 14,
            boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
            padding: 22, height: '100%', overflow: 'auto',
          }}>
            <div style={{
              fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
              letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: 700,
            }}>★ Map · 00</div>
            <div style={{
              fontFamily: C3.display, fontSize: 26, color: C3.ink,
              letterSpacing: -0.4, lineHeight: 1, marginTop: 6,
            }}>In this canvas</div>
            <hr style={{
              height: 1, border: 'none',
              borderTop: `1px dashed ${C3.ink20}`,
              margin: '14px 0 16px',
            }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                ['01 · Message list',
                 '5 phones — empty state, default thread, unread divider, reply + mention, long-message wrap. Every phone uses the standard TopBar + chat tab in the bottom nav.'],
                ['02 · Reactions',
                 '5 artboards — reaction rail anatomy spec, compact picker over a selected message, expanded grid picker as a modal, and bare cards for the picker components on their own.'],
                ['03 · Composer',
                 '6 artboards — idle (send disabled), typing (enabled), sending (spinner), with reply preview, with @mention picker, plus a stacked anatomy spec card.'],
                ['04 · Notification prompt',
                 '3 artboards — card pinned to a live chat, the same card mid-enable, plus a bare spec card with idle + enabling states stacked.'],
                ['05 · Handoff notes',
                 'Behaviour the developer needs that isn\'t visible in the static mockups — grouping rules, optimistic send, reactions semantics, OS permission.'],
              ].map(([h, b]) => (
                <div key={h} style={{
                  padding: '10px 12px', borderRadius: 8,
                  border: `1px dashed ${C3.ink20}`,
                }}>
                  <div style={{
                    fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
                    letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: 600,
                  }}>{h}</div>
                  <div style={{
                    fontFamily: C3.sans, fontSize: 12.5, color: C3.ink70,
                    marginTop: 4, lineHeight: 1.5, textWrap: 'pretty',
                  }}>{b}</div>
                </div>
              ))}
              <div style={{
                marginTop: 4, padding: '10px 12px',
                background: 'rgba(168,57,43,0.08)',
                border: `1px solid rgba(168,57,43,0.25)`,
                borderRadius: 8,
                fontFamily: C3.sans, fontSize: 12, color: C3.ink, lineHeight: 1.45,
              }}>
                <b>System note · </b> Chat is intentionally lightweight — no
                threading, no separate read receipts, no search. It's the
                social glue around the predictions, not a messaging product.
                Every chat surface re-uses an existing ticket component or
                extends the existing vocabulary; nothing new gets invented
                here.
              </div>
            </div>
          </div>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 01 · MESSAGE LIST ─────────── */}
      <DCSection
        id="list"
        title="01 · Message list"
        subtitle='Other-author bubbles sit left as cream paper tickets; current-user bubbles sit right as ink-fill stamps. Author + mono timestamp anchors the first message of each group; the same group continues with smaller-radius "tear" bubbles. Mentions render as small outlined stamps inline.'
      >
        <DCArtboard id="ms-empty" label="Empty · no messages yet" width={ART_W} height={ART_H}>
          <PhoneArt><ChatEmpty /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ms-default" label="Default thread · 6 messages, 2 groups" width={ART_W} height={ART_H}>
          <PhoneArt><ChatDefault /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ms-unread" label="With Unread divider + reply quote" width={ART_W} height={ART_H}>
          <PhoneArt><ChatWithUnread /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ms-notif" label="With notification prompt pinned" width={ART_W} height={ART_H}>
          <PhoneArt><ChatWithNotification /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="ms-longwrap" label="Long message · wraps cleanly" width={ART_W} height={ART_H}>
          <PhoneArt><ChatLongWrap /></PhoneArt>
        </DCArtboard>
      </DCSection>

      {/* ─────────── 02 · REACTIONS ─────────── */}
      <DCSection
        id="reactions"
        title="02 · Reactions"
        subtitle="Reactions ride 4px below each bubble, aligned to the bubble side. Mine reactions get a stamp-red ring; others stay in cream paper. The compact picker is a floating stamp tray triggered by long-press; the expanded picker is a paper sheet over a 55% ink wash."
      >
        <DCArtboard id="rx-rail-spec" label="Rail anatomy · 5 states" width={520} height={620}>
          <ReactionsRailSpec />
        </DCArtboard>
        <DCArtboard id="rx-compact" label="Compact picker · long-press" width={ART_W} height={ART_H}>
          <PhoneArt><ChatReactionsCompact /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="rx-expanded" label="Expanded picker · modal" width={ART_W} height={ART_H}>
          <PhoneArt><ChatReactionsExpanded /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="rx-compact-bare" label="Compact picker · alone" width={460} height={200}>
          <CompactPickerBare />
        </DCArtboard>
        <DCArtboard id="rx-expanded-bare" label="Expanded picker · alone" width={460} height={520}>
          <ExpandedPickerBare />
        </DCArtboard>
      </DCSection>

      {/* ─────────── 03 · COMPOSER ─────────── */}
      <DCSection
        id="composer"
        title="03 · Composer"
        subtitle='Fixed above the bottom nav. Pill textarea with placeholder "Message…". Send is a stamped ink rectangle — disabled when empty (cream + dashed), enabled (ink fill + arrow), sending (ink fill + spinner). @mention triggers a paper popover above the input; reply is a stamp-red strip above the input.'
      >
        <DCArtboard id="cp-idle" label="Idle · send disabled" width={ART_W} height={ART_H}>
          <PhoneArt><ChatComposerIdle /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="cp-typing" label="Typing · send enabled" width={ART_W} height={ART_H}>
          <PhoneArt><ChatComposerTyping /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="cp-sending" label="Sending · spinner" width={ART_W} height={ART_H}>
          <PhoneArt><ChatComposerSending /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="cp-mention" label="@mention picker open" width={ART_W} height={ART_H}>
          <PhoneArt><ChatComposerMention /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="cp-reply" label="Reply preview above composer" width={ART_W} height={ART_H}>
          <PhoneArt><ChatComposerReply /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="cp-spec" label="Composer · anatomy spec" width={460} height={760}>
          <ComposerSpec />
        </DCArtboard>
      </DCSection>

      {/* ─────────── 04 · NOTIFICATION PROMPT ─────────── */}
      <DCSection
        id="notif"
        title="04 · Push notification prompt"
        subtitle='A ticket-style card pinned above the message stream the first time a user opens the chat tab. Bell stamp, copy lifted verbatim from spec — "Chat notifications" / "Let me know when someone sends a message." — and three exits: Enable (red CTA), No thanks (ghost), close ×.'
      >
        <DCArtboard id="nf-idle" label="Card in chat · idle" width={ART_W} height={ART_H}>
          <PhoneArt><ChatWithNotificationStates variant="idle" /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="nf-enabling" label="Card in chat · enabling" width={ART_W} height={ART_H}>
          <PhoneArt><ChatWithNotificationStates variant="enabling" /></PhoneArt>
        </DCArtboard>
        <DCArtboard id="nf-bare" label="Card alone · anatomy" width={460} height={580}>
          <NotificationCardBare />
        </DCArtboard>
      </DCSection>

      {/* ─────────── 05 · HANDOFF ─────────── */}
      <DCSection
        id="notes"
        title="Handoff notes"
        subtitle="Behaviour the developer needs that isn't visible in the static mockups."
      >
        <DCArtboard id="notes-card" label="Behaviours · gotchas · constants" width={720} height={1180}>
          <div style={{
            ...paperTexture(C3.ticket),
            borderRadius: 14,
            boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)',
            padding: 22, height: '100%', overflow: 'auto',
          }}>
            <div style={{
              fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
              letterSpacing: 1.8, textTransform: 'uppercase', fontWeight: 700,
            }}>★ Handoff · 05</div>
            <div style={{
              fontFamily: C3.display, fontSize: 26, color: C3.ink,
              letterSpacing: -0.4, lineHeight: 1, marginTop: 6,
            }}>What to wire up</div>
            <hr style={{ height: 1, border: 'none',
              borderTop: `1px dashed ${C3.ink20}`,
              margin: '14px 0 16px' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <NoteBlock heading="01 · Message grouping"
                bullets={[
                  'Consecutive messages from the same author within the same calendar day collapse into one group.',
                  'A group breaks on: author change · day boundary · 10-minute idle gap · unread divider crossing.',
                  'First message in a group renders the author label (★ NAME) + mono timestamp above. Subsequent messages render bubble-only.',
                  'Last message in an others-group anchors the avatar (32px) in the gutter; intermediate messages leave the slot empty.',
                  'Mine groups never show an avatar — the right-edge alignment + ink fill is the tell.',
                ]} />
              <NoteBlock heading="02 · Bubble + content"
                bullets={[
                  'Other bubble: cream paper texture, 1px ink20 border, 14px radius, last-in-group tear corner = 4px on the bubble\'s bottom-author corner.',
                  'Mine bubble: solid ink fill, 14px radius, last-in-group tear corner = 4px on the bottom-right. No border.',
                  'Bubble max-width = 76% of viewport. Long messages wrap with text-wrap: pretty; word-break: break-word so URLs/codes don\'t overflow.',
                  'Inline @Name mentions render as small outlined stamps — stamp-red on cream bubbles, gold/cream on ink bubbles. Tap = open profile.',
                  'Reply quote sits inside the bubble at the top: 3px accent border-left, mono "↳ Replying to NAME" eyebrow, one-line truncated body.',
                ]} />
              <NoteBlock heading="03 · Unread divider"
                bullets={[
                  'Inserted before the first message with unread=true the FIRST time the chat scroll lands. Position is sticky for the session — it does not jump as you read past it.',
                  'Visual: dashed stamp-red rule with perforation discs at both edges, centred "★ UNREAD" pill in mono caps.',
                  'On scroll past the divider, all earlier messages flip to read; the divider stays pinned where it was for context. On next mount the read pointer moves.',
                ]} />
              <NoteBlock heading="04 · Reactions"
                bullets={[
                  'Rail is 26px tall, sits 4px below the bubble, aligned to bubble side. Wraps to a second row at narrow widths.',
                  'Pill state: mine = stamp-red 1.5px ring + 10% red wash · others = cream paper + 1px ink20 border. Count rendered with tabular-nums; hidden when count = 1.',
                  'Default state (no one reacted yet) = single dashed heart button next to the bubble. Tapping it adds my default ❤️ AND opens the compact picker for 600ms in case I want a different one.',
                  'Compact picker: long-press a bubble → tray hovers ~6px above the message. Five quick reactions + a "···" button that opens the expanded picker.',
                  'Expanded picker: 6-col grid, 30 emoji total, modal over a 55% ink wash. Closes on tap outside, Esc, or selection.',
                  'Server side: reactions are upsert-by-(message, user). Switching emoji removes the previous one, no two-emoji-per-user state.',
                ]} />
              <NoteBlock heading="05 · Composer"
                bullets={[
                  'Pill textarea grows from 38px → 96px (4 lines) before scrolling internally. Auto-resize on input.',
                  'Placeholder text is literally "Message…" — three dots is a real character (U+2026), not three periods.',
                  'Send button: disabled when textarea is empty OR whitespace-only · enabled when there\'s real content · sending while the POST is in flight (spinner replaces arrow, button is non-interactive). ⌘↵ / Ctrl↵ submits.',
                  'Optimistic send: bubble appears in the stream immediately with mine styling and a "sending" 50% opacity. On 2xx → opacity to 100%, append to read pointer. On failure → bubble switches to a stamp-red dashed border with a "Retry · Discard" footer.',
                ]} />
              <NoteBlock heading="06 · @mention picker"
                bullets={[
                  'Triggered by typing "@" at the start of a word in the textarea.',
                  'Popover renders ABOVE the composer, full-width with top-radius matching the composer\'s pill. Composer\'s top-border switches from dashed to solid while open.',
                  'Filter: fuzzy match across display name, falling back to "no matches" if zero hits. Current user is never in the list.',
                  'Tap inserts "@Name " (trailing space). Keyboard ↑↓ navigates; ↵ accepts the highlighted row; Esc closes.',
                  'On message render, mentioned users get a push notification regardless of their global chat notification setting.',
                ]} />
              <NoteBlock heading="07 · Reply preview"
                bullets={[
                  'Triggered by swiping a bubble right OR long-press → Reply.',
                  'Renders above the composer with a stamp-red left border, mono "Replying to NAME" eyebrow, and one-line truncated quote body.',
                  'Cancelling (×) drops the reply but keeps any typed text. Sending attaches the original message id; the server inlines author + quote on the rendered bubble.',
                  'Quoted text is captured at reply time — edits/deletes of the original do not propagate.',
                ]} />
              <NoteBlock heading="08 · Notification prompt"
                bullets={[
                  'Pinned above the message stream on first chat-tab visit only — never re-appears in the same session.',
                  'Copy lifted verbatim from spec: "Chat notifications" · "Let me know when someone sends a message." Do not paraphrase.',
                  'Enable → OS permission prompt. On grant → the card swaps to a stamped "★ NOTIFICATIONS ON" confirmation strip for 3s, then unmounts. On deny → the card unmounts immediately and we don\'t re-prompt for 30 days.',
                  'No thanks → unmounts and we don\'t re-prompt for 30 days. × → session-dismiss only (next session asks again).',
                  'If the OS has already granted permission, the card never renders. If permission is system-blocked, the card replaces "Enable" with a "Open settings →" mono link.',
                ]} />
              <NoteBlock heading="09 · Empty state"
                bullets={[
                  'Renders when the conversation has zero messages, not when the page is loading. The loading state is a 3-bubble skeleton (not shown — same recipe as the player ticket skeleton).',
                  'Copy: "No messages yet." display headline · "★ Start the chat!" mono caps line · short prose explaining who can see it. No CTAs — the composer itself is the only call to action.',
                  'Persists until the first message lands locally (optimistic or remote).',
                ]} />
              <NoteBlock heading="10 · Nav variant"
                bullets={[
                  'Chat tab uses the live competition nav once Game Started flips on; the pre-draw nav before that. Same tab id ("chat") in both.',
                  'Unread badge on the chat tab: red dot in pre-draw nav · stamp-red count pill (max 99+) in live nav.',
                  'Tabbing INTO chat clears the unread badge after a 1.2s dwell — quick taps to peek don\'t mark as read.',
                ]} />
            </div>
          </div>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
