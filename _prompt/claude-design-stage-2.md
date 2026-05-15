# Claude Design Stage 2 Prompt Pack

Use these prompts in order. For every prompt, attach or reference the accepted Stage 1 Home screen direction and tell Claude Design that it is the source of truth for visual style, tone, colors, spacing, typography, card/button treatments, and interaction feel.

The goal is no longer exploration. The goal is to apply one chosen direction across the whole app, covering every screen and state users may encounter.

## Shared Context To Paste Into Every Prompt

```text
We are designing "World Cup 26", a private invite-only mobile-first PWA for an adult World Cup prediction game among friends/colleagues.

Use the accepted Stage 1 Home screen design direction as the strict visual source of truth. Do not create a new direction. Extend it into a complete product design system.

Product feel:
- Fun, friendly, social, lightly competitive, and play-like for adults.
- Joyful and clear, not childish.
- Not a betting app.
- No unnecessary noise, clutter, confetti overload, mascots, or generic dashboard sameness.
- The app should feel practical and fast to use on a phone.

Technical/product context:
- Mobile-first PWA, primary frame around 390x844, max content width around 430px.
- Also account for narrow phones around 360px and landscape/wider phone layouts up to about 560px.
- Bottom tab navigation is fixed.
- Most screens use a top brand bar or simple back header.
- Users have avatars, often Google photos or emoji avatars.
- Teams are shown with flag emoji and country names.
- Use familiar iconography where useful. Current implementation uses lucide-style icons.

Output requirements:
- High-fidelity mobile mockups for each listed screen/state.
- Component specs and reusable patterns, not just static art.
- Design tokens: colors, typography, spacing, radii, borders, shadows/elevation, button styles, form styles, table styles, nav styles, modal/sheet styles, toast styles.
- Include enough detail that a developer can implement the UI without inventing missing states.
- Preserve the exact behaviors and content described below.
```

## Prompt 1: App Shell And Global System

```text
Using the shared context and accepted Stage 1 Home direction, design the global app shell and reusable UI system for World Cup 26.

Design these app-wide structures:
- Main authenticated shell with top app bar:
  - small app logo/mark
  - "World Cup 26"
  - profile/avatar button
- Fixed bottom navigation, two variants:
  - Live competition nav: Home, Standings, Predictions, Chat, Players
  - Pre-draw nav: Home, My List, Draw, Chat, Players
- Active tab state, inactive tab state, pressed state.
- Chat unread states:
  - unread dot
  - mention count badge, including 99+
- Back-header pattern for detail screens:
  - back icon
  - compact title
  - optional right-side status icon, e.g. lock
- Global loading spinner/skeleton approach.
- Empty states, error banners, success toasts, warning/notice banners.
- Modal dialog pattern.
- Bottom sheet pattern.
- Form controls: text input, email input, number input, search input, select/dropdown, toggle, icon button.
- Buttons:
  - primary
  - secondary
  - quiet/text
  - destructive
  - disabled
  - loading
  - saved/success
- Avatar system:
  - photo avatar
  - emoji avatar
  - initials fallback
  - tiny/avatar-chip sizes
- Team chip system:
  - flag + country
  - compact chip
  - selected chip
  - disabled/locked chip
- Table/list row patterns for dense football data.

Create a small component board plus shell mockups for both nav variants. Keep the chosen visual direction intact and make all components feel like one coherent system.
```

## Prompt 2: Auth, Profile, Invites, Install Prompts

```text
Using the shared context and accepted Stage 1 direction, design the account, onboarding, invite, and PWA install surfaces.

Screens/states to design:

1. Login
- Default login screen:
  - app logo
  - title "World Cup 26"
  - copy: "Invite-only. Sign in with your Google account."
  - "Continue with Google" button
- Loading state:
  - "Finishing sign-in"
  - "One moment while Google sends you back to the app."
- Error state under Google sign-in.
- iOS in-app browser state:
  - "Open in Safari"
  - explanation that Google sign-in does not work in this browser
  - "Copy link" button
  - copied confirmation: "Link copied. Open Safari and paste it."

2. Profile / Onboarding
- Onboarding profile screen:
  - title "Set Up Profile"
  - helper text: "This is how everyone will see you. You can change it later."
  - avatar preview
  - emoji avatar picker
  - optional "Use Google photo" action
  - display name input labeled "Your app name"
  - "Save and Continue"
- Existing profile screen:
  - title "Your Profile"
  - back button
  - saved/dirty/saving/error states
  - "Save Changes" / "Saved!" button states
  - admin-only "Invite Player"
  - "Sign Out"

3. Invites admin screen
- Header "Invites"
- Add invite card:
  - "Invite player"
  - app name input
  - email input
  - Invite button with icon
  - validation error: "Enter a valid email address." / "That address is already invited."
- Invite list:
  - loading
  - empty: "No one has been invited yet."
  - joined invite row
  - waiting/sent invite row
  - status labels: Joined, Invite sent, Sent 2x, Waiting for invite
  - row actions: resend, copy install link, delete
  - toast: "Invite sent.", "Invite resent.", "Link copied."

4. PWA install surfaces
- Bottom install prompt:
  - native install: "Install World Cup 26", Install/Later, preparing/opening states
  - iOS Safari instructions: "Add to Home Screen" with 3 steps and Got it
  - iOS other browser: "Open in Safari", Copy link/Got it, copied confirmation
  - manual Chrome: "Chrome did not show the automatic install prompt...", Try again/Later
- Full-screen installed state:
  - "App Installed"
  - "Close this tab and open the World Cup 26 icon from your Home Screen."
  - "Continue in browser"

Make these screens feel welcoming and trustworthy, but keep them compact and app-like rather than marketing-like.
```

## Prompt 3: Match Home, Prediction Flow, Finished Matches

```text
Using the shared context and accepted Stage 1 direction, design the match prediction experience and all match card states.

Screens/states to design:

1. Home: Upcoming Matches
- Top shell from the global system.
- Page title "Upcoming Matches", subtitle "World Cup 26".
- Upcoming match list with 3-5 cards.
- Each card includes:
  - date/time
  - venue
  - home flag/name/optional owner
  - away flag/name/optional owner
  - central VS or score
  - prediction action/state
- Card states:
  - no prediction: primary "Predict"
  - already predicted: "You predicted X · Edit"
  - live locked with score and status/minute, e.g. Live, Halftime, 68'
  - locked with prediction: "You predicted 1 · Locked"
  - locked without prediction: "No prediction · Locked"
- Loading state.
- Error banner: "Upcoming matches could not be loaded. Refresh the page in a minute."
- Empty state: "No upcoming matches."
- "Finished Matches" secondary action near the bottom.

Use sample matches:
- Jun 11, 2026 · 9:00 PM, Estadio Azteca Mexico City, Mexico vs South Africa, owners Darko/Ana, Predict
- Jun 12, 2026 · 4:00 AM, Estadio Guadalajara, Korea Republic vs Czechia, owners Marko/Petra, You predicted X · Edit
- Jun 12, 2026 · 9:00 PM, Toronto Stadium, Canada vs Bosnia and Herzegovina, owners Ivan/Darko, Predict
- Live sample: Brazil 2-1 Morocco, 68', locked

2. Prediction detail screen
- Header with back button, title "Prediction", optional lock icon.
- Match card:
  - full date/time/venue
  - large flags and team names
  - VS for upcoming or score for live/locked
- Outcome selector states:
  - group match options: 1, X, 2
  - knockout options: 1, X1, X2, 2
  - unselected, selected, disabled/locked
- Submit button states:
  - disabled when no change
  - "Save Prediction"
  - "Saving..."
  - "Prediction saved"
  - "Saved · Moving on..."
- Locked states:
  - saved prediction: "You predicted X · Locked"
  - no prediction: "No prediction · Locked"
- Everyone's Predictions section:
  - list of avatars, names, outcomes
  - current user highlighted as "(you)"
- Loading and "Match not found." states.

3. Finished Matches
- Header with back button and "Finished Matches".
- Loading state.
- Empty state: "No finished matches."
- Finished match cards:
  - stage and date
  - flags/team names
  - final score
  - actual outcome badge, e.g. 1, X, X1
  - player prediction chips for every player
  - correct, incorrect, and missing prediction states

Keep prediction actions very obvious. This is the core repeated workflow.
```

## Prompt 4: Standings, Prediction Standings, Player Detail

```text
Using the shared context and accepted Stage 1 direction, design the ranking and player-detail screens.

Screens/states to design:

1. Main Standings
- Title "Standings", subtitle "Based on results from your teams".
- Loading state.
- Empty state: "No results yet. Standings will appear after matches are played."
- Dense standings table:
  - columns: #, Player, Pld, W, D, L, GF, GA, GD, Pts
  - medal ranks for top 3
  - current user row highlighted with "(you)"
  - avatar, display name, team flags
  - row tap affordance to player detail
- Responsive behavior for narrow phones: lower-priority columns may hide, but the table must stay readable.

2. Winning Chances section on Main Standings
- Heading "Winning Chances".
- subtitle "Based on a Monte Carlo simulation of remaining matches".
- Loading card.
- Empty state: "Winning chances will appear after the next calculation."
- Populated table:
  - Player
  - Chance with progress bar and percentage
  - exp. pts
  - current user highlight
- Admin-only refresh button:
  - default "Refresh"
  - loading "Refreshing"
  - toast: "Winning chances refreshed" and "Refresh failed"
- Row state when simulation is not available yet.

3. Prediction Standings
- Title "Prediction Standings", subtitle "Prediction points".
- Loading state.
- Empty state: "No results yet. Predict outcomes to win points."
- Ranking list/table:
  - #, Player, Points
  - medal ranks
  - current user highlight
  - negative points in warning/error color
- Rules text:
  - "A correct prediction earns {playerCount}/n points, where n is the number of players who got it right."
  - "If you do not predict, you lose 1/{playerCount} points."

4. Player Detail
- Back header.
- Large avatar and player name.
- Team stats table:
  - Team, Pld, W, D, L, GF, GA, GD, Pts
  - team flag + name rows
  - Total row
  - responsive narrow-phone table behavior
- Predictions section:
  - heading "Predictions"
  - empty: "No finished matches yet."
  - rows with date, flags, score, actual outcome, player outcome, correct/incorrect/missing icons
- Projection mode:
  - same table with decimal projected values
  - fixed bottom banner: "Simulation: average of 10,000 scenarios for remaining matches"

Make tables feel sporty and scannable without becoming spreadsheet-heavy.
```

## Prompt 5: Pre-Draw List And Draw Day

```text
Using the shared context and accepted Stage 1 direction, design the pre-draw and draft-day experience.

Screens/states to design:

1. My List
- Page title "My List".
- Subtitle/ranking snapshot, e.g. "FIFA/Coca-Cola Men's World Ranking, 1 April 2026".
- Save badge states:
  - Saved
  - Saving...
  - Error
  - Locked
- Loading state.
- Empty state: "Teams have not been added yet."
- Reorderable team list:
  - rank number
  - flag
  - country name
  - move-to-position icon button
  - drag handle icon button
  - dragging state
  - disabled/locked row state
- Position picker bottom sheet:
  - selected team flag/name
  - current rank
  - number wheel
  - "Move to #N"
  - Cancel

2. Draw setup/list prep
- Page title "Draw".
- Subtitle changes:
  - "List prep"
  - "Draft day"
  - "Draw is complete"
- Error banner.
- Admin setup card:
  - "Teams per player"
  - selected number button
  - Save/Saved button
  - allowed range text
  - impossible state: "Not possible with this player count."
  - metrics: Players, Teams, Double-owned
  - "Start Draw" button
  - readiness text: "3/5 players have saved a list"
- Number wheel bottom sheet for teams per player.
- Start confirmation modal:
  - "Start the draw?"
  - "All player lists will lock. Players who have not saved a list will use the default ranking order."
  - No / Start
- Readiness card:
  - "3/5 ready"
  - "Lists stay private until the draw starts."
- Readiness list:
  - player rows
  - ready check state
  - not-ready empty circle state

3. Live draw
- Round intro:
  - "First Round" / "Second Round"
  - admin: Start button
  - non-admin: "Waiting for the round to start."
- Picking view:
  - round label
  - current player's large avatar and name
  - already assigned team chips
  - selected team control
  - no available team state
  - admin choose-team affordance
  - "Next player" / "Finish round"
  - non-admin waiting copy: "Waiting for the pick to be confirmed."
- Team picker bottom sheet:
  - "Choose Team"
  - search input
  - available team rows
  - selected check state
  - empty: "No available teams."
  - Cancel
- Round summary/completed:
  - "First Round complete" / "Game started"
  - assigned count
  - player cards with assigned team chips
  - no assigned teams state
  - admin next round button or "Start Game"
  - double ownership note

This flow should feel like a small social ceremony, but still be clean, legible, and quick for an admin to control.
```

## Prompt 6: Players And Teams Admin Surface

```text
Using the shared context and accepted Stage 1 direction, design the Players and Teams screen and admin tools.

Screens/states to design:

1. Players and Teams, player view
- Title "Players and Teams".
- Subtitle "Assigned teams".
- Loading state.
- Player cards:
  - avatar
  - display name
  - team count, e.g. 4/4 teams
  - assigned team chips
  - empty assigned state: "No assigned teams"

2. Players and Teams, admin view
- Subtitle "Assign teams to players".
- Game started control card:
  - toggle off: "Points are not counted"
  - toggle on: "Since 11 Jun 2026, 9:00 PM"
  - disabled/loading toggle state
- Stop tracking confirmation modal:
  - "Stop tracking?"
  - "This will reset the draw, return lists to the default ranking, and delete assigned teams."
  - No / Yes
- "Replace Team" button.
- Player cards with:
  - remove team button on each team chip
  - inline "Add Team" action
  - expanded team picker with search
  - no available teams state
  - admin delete player icon
  - inline delete confirmation: "Delete? Yes No"
  - deleting state

3. Replace Team bottom sheet
- Header "Replace Team".
- Error banner.
- Warning/notice banner.
- Dropped team select.
- Replacement search.
- Selected replacement summary.
- Replacement list rows:
  - flag
  - country name
  - confederation
  - selected check mark
- Empty replacement list: "No available teams."
- FIFA rank input:
  - optional placeholder
  - validation: "Rank must be a positive whole number."
- Replacement preview:
  - dropped team -> replacement team
- Submit button:
  - "Replace"
  - busy/replacing spinner state
  - disabled state
- Cancel.

This screen has administrative power. Keep it friendly, but make destructive and irreversible actions visually unmistakable.
```

## Prompt 7: Chat, Mentions, Reactions, Notifications

```text
Using the shared context and accepted Stage 1 direction, design the chat experience.

Screens/states to design:

1. Chat message list
- Empty state:
  - message icon
  - "No messages yet."
  - "Start the chat!"
- Message bubbles:
  - current user's messages
  - other users' messages
  - grouped consecutive messages
  - author name shown on first message in a group
  - avatar shown on first message in a group
  - timestamp
  - mention text highlight, e.g. @Darko
  - long messages wrapping cleanly
- Reply message bubble state:
  - quoted author
  - one-line quoted text
- Unread divider:
  - horizontal line + "Unread"

2. Reactions
- Reaction rail attached to messages:
  - default heart/like state
  - active current-user reaction
  - other reactions
  - reaction count when more than one user reacted
- Compact reaction picker:
  - quick reactions: heart, laugh, surprised, sad, pray
  - more button
- Expanded reaction picker:
  - grid of available emoji
  - positioned overlay with backdrop
  - compact enough for mobile

3. Composer
- Fixed input panel above bottom nav.
- Textarea with placeholder "Message..."
- Send button:
  - enabled
  - disabled
  - sending/pressed state
- @mention picker:
  - rows with avatar/name
  - appears above input
- Reply preview:
  - reply icon
  - author
  - truncated text
  - close button

4. Push notification prompt inside chat
- Card:
  - bell icon
  - "Chat notifications"
  - "Let me know when someone sends a message."
  - Enable / No thanks / close states
- Dismissed state is simply absent.

Make chat feel casual and alive, but still visually consistent with the rest of the app. Avoid making it look like a separate messaging product.
```

## Prompt 8: Final Coverage And Implementation Handoff

```text
Using all previous outputs and the accepted Stage 1 direction, produce a final design-system handoff for World Cup 26.

Create:
- A consolidated token sheet:
  - colors
  - typography
  - spacing scale
  - border radii
  - borders
  - elevation/shadows
  - motion/animation guidance
  - focus/pressed/disabled states
- Component catalog:
  - app shell
  - nav item
  - page header
  - back header
  - button variants
  - icon button
  - input/search/select/number input
  - toggle
  - toast
  - alert/banner
  - modal
  - bottom sheet
  - match card
  - prediction outcome button
  - team chip
  - avatar
  - player row
  - standings table
  - progress bar
  - chat bubble
  - reaction rail
  - save badge/status pill
- State matrix confirming coverage for:
  - loading
  - empty
  - error
  - success
  - disabled
  - locked
  - saving/submitting
  - admin-only
  - current user
  - live match
  - finished match
  - unread chat
  - modal/sheet open
- Responsive notes for:
  - 360px narrow phones
  - 390x844 default
  - 430px PWA max width
  - landscape/wider phone up to 560px
- Implementation notes for a React/Tailwind app using lucide-style icons.

Do a final pass for consistency:
- The selected visual direction must remain intact.
- Every surface should feel like part of the same app.
- Dense screens must remain readable.
- All buttons and text must fit on mobile.
- No extra screens, marketing sections, decorative clutter, or generic filler.
```
