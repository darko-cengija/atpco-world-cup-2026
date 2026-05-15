# ATPCO World Cup 2026 — Project Instructions

A private prediction game (PWA, mobile-first) for the 2026 World Cup. Adult
friends/colleagues pool — fun, friendly, social, **not** childish or gambling-y.

## Chosen design direction: **Match Ticket** (Concept 3)

Every screen extends the ticket-stub metaphor: paper textures, perforation
notches, dashed tear-lines, monospace metadata, stamped CTAs. Tactile,
collectible, sport-archival — not feed-like.

**Source of truth: `concept-ticket.jsx`.** Read it before designing any new
screen. Reuse its components, palette, type ramp, and chrome (header, bottom
nav) verbatim unless the user asks otherwise.

Supporting files:
- `shared.jsx` — `FLAGS`, `FlagSquare`, `FlagCircle`, `Avatar`, `StatusStrip`, `Phone` (390×844 frame)
- `data.jsx` — sample `MATCHES`, `NAV_ITEMS`, `NAV_ICONS`
- `Home Screen Concepts.html` — the original 4-concept canvas (reference only; do not edit)

## Design tokens (locked)

```
kraft outer   #e6dcc5   (page bg)
ticket cream  #f6efdb   (card bg)
teal ink      #0f3a35   (primary text / fills)
ink70 / 50 / 20 / opacity tokens — see C3 object in concept-ticket.jsx
stamp red     #a8392b   (primary accent, active states)
stamp ink     #7a2b20   (stamp hover/pressed)
gold          #b3892e   (secondary accent — sparingly)
```

## Type ramp

```
Display     DM Serif Display       42 / 22 / 19
Body        Inter Tight            13 / 11
Metadata    JetBrains Mono         10 / 9    (uppercase, letter-spaced)
```

Apply `text-wrap: pretty` to multi-line headings. Tabular numerals for any
match codes, times, or scores (`font-variant-numeric: tabular-nums`).

## Component vocabulary (reuse, don't reinvent)

- **`TicketCard`** — cream card, soft warm shadow, dashed tear with edge notches
- **`StampLabel`** — uppercase mono label block (eyebrow + value)
- **`StampedCTA`** — primary action; ink fill, mono caps, small right-arrow
- **`PredictedBadge`** — rotated outlined stamp in stamp-red
- **`PaperTextureBg`** — radial-gradient dotted grain layer
- **`FlagSquare`** — 4-px radius rounded flag (use on ticket bodies)
- Paper-stamp bottom nav with stamp-red underline on active tab

When a new screen needs a component that doesn't exist yet, design it inside
the ticket vocabulary (paper, dashed rules, monospace metadata, stamped fills)
and add it to `concept-ticket.jsx` so it's reusable.

## Frame + scaling

All screens are 390×844 inside the `Phone` shell from `shared.jsx`. For
multi-screen comparisons or flow storyboards, lay them out on a
`design-canvas.jsx` board (one `DCSection` per screen group; one `DCArtboard`
per state/variant).

## Out of scope / avoid

- No gambling/betting visual language (odds tables, big green/red money tints)
- No mascots, confetti overload, cartoon flourishes
- No generic dark dashboards
- No emoji unless the user asks (decorative ⚽/🏁 are out — the stamp/perforation
  language carries the personality)
- No FIFA brand assets, official wordmarks, or trademarked color systems —
  this is a private pool, original design only
