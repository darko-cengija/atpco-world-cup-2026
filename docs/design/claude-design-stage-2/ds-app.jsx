// World Cup 26 — full design system canvas.
// Composes shell, controls, and patterns into a reviewable set of artboards.

// ────────────────────────────────────────────────── helpers (board chrome)
const PHONE_W = 420, PHONE_H = 874;
const BOARD_BG_PAPER = '#e6dcc5';

function BoardHeader({ eyebrow, title }) {
  return (
    <div>
      <div className="board-eyebrow">{eyebrow}</div>
      <div className="board-title">{title}</div>
    </div>
  );
}

function CaptionRow({ children }) {
  return <div className="cap" style={{ marginTop: 8 }}>{children}</div>;
}

// Centered phone frame inside an artboard
function PhoneArtboard({ children }) {
  return (
    <div style={{
      width: '100%', height: '100%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: BOARD_BG_PAPER,
    }}>
      {children}
    </div>
  );
}

// ────────────────────────────────────────────────── 1. COLORS

const TOKENS_COLOR = [
  { name: 'paper',     hex: '#e6dcc5', use: 'page background (kraft outer)' },
  { name: 'ticket',    hex: '#f6efdb', use: 'card / surface' },
  { name: 'ink',       hex: '#0f3a35', use: 'primary text + fills' },
  { name: 'ink-70',    hex: 'rgba(15,58,53,0.7)', use: 'secondary text' },
  { name: 'ink-50',    hex: 'rgba(15,58,53,0.5)', use: 'meta / placeholder' },
  { name: 'ink-20',    hex: 'rgba(15,58,53,0.2)', use: 'hairlines / borders' },
  { name: 'stamp',     hex: '#a8392b', use: 'primary accent · active' },
  { name: 'stamp-ink', hex: '#7a2b20', use: 'stamp hover / pressed' },
  { name: 'gold',      hex: '#b3892e', use: 'secondary accent (sparingly)' },
  { name: 'success',   hex: '#1f6a4d', use: 'success state' },
];

function ColorsBoard() {
  return (
    <div className="board">
      <BoardHeader eyebrow="★ Foundations · 01" title="Palette" />
      <hr className="board-divider" />
      <div style={{ flex: 1, overflow: 'auto' }}>
        {TOKENS_COLOR.map(t => (
          <div key={t.name} className="swatch-row">
            <span className="swatch-sq" style={{ background: t.hex }} />
            <div style={{ minWidth: 0 }}>
              <div className="swatch-name">{t.name}</div>
              <div style={{
                fontFamily: 'Inter Tight', fontSize: 11,
                color: 'rgba(15,58,53,0.65)',
              }}>{t.use}</div>
            </div>
            <span className="swatch-hex">{t.hex}</span>
          </div>
        ))}
      </div>
      <div className="cap" style={{ marginTop: 14, borderTop: '1px dashed rgba(15,58,53,0.2)', paddingTop: 10 }}>
        Accent rule · stamp red carries every primary CTA + active tab. Gold is reserved for archive/finished states.
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────── 2. TYPOGRAPHY

function TypeBoard() {
  return (
    <div className="board">
      <BoardHeader eyebrow="★ Foundations · 02" title="Type ramp" />
      <hr className="board-divider" />
      <div style={{ flex: 1, overflow: 'auto', color: '#0f3a35' }}>
        <div className="row-label">Display · DM Serif Display</div>
        <div style={{ fontFamily: C3.display, fontSize: 42, lineHeight: 1, letterSpacing: -0.5 }}>Match day</div>
        <div style={{ fontFamily: C3.display, fontSize: 22, marginTop: 10 }}>Section title</div>
        <div style={{ fontFamily: C3.display, fontSize: 19, marginTop: 6 }}>Card heading</div>

        <hr className="board-divider" />
        <div className="row-label">Body · Inter Tight</div>
        <div style={{ fontFamily: C3.sans, fontSize: 14, fontWeight: 600 }}>14 · Field input · Strong</div>
        <div style={{ fontFamily: C3.sans, fontSize: 13, marginTop: 6 }}>13 · Body paragraph. The quick brown fox jumps over the lazy dog.</div>
        <div style={{ fontFamily: C3.sans, fontSize: 12, color: C3.ink70, marginTop: 6 }}>12 · Secondary body / list meta</div>
        <div style={{ fontFamily: C3.sans, fontSize: 11, color: C3.ink70, marginTop: 6 }}>11 · Captions, hints, footnotes</div>

        <hr className="board-divider" />
        <div className="row-label">Metadata · JetBrains Mono</div>
        <div style={{ fontFamily: C3.mono, fontSize: 11, letterSpacing: 1.6, textTransform: 'uppercase' }}>11 · BUTTON CAPS · 1.6 TRACKING</div>
        <div style={{ fontFamily: C3.mono, fontSize: 10, letterSpacing: 1.4, textTransform: 'uppercase', color: C3.ink50, marginTop: 6 }}>10 · EYEBROWS · 1.4 TRACKING</div>
        <div style={{ fontFamily: C3.mono, fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase', color: C3.ink50, marginTop: 6 }}>9 · STAMP / NAV CAPS · 1.2 TRACKING</div>
        <div style={{ fontFamily: C3.mono, fontSize: 11, marginTop: 10, fontVariantNumeric: 'tabular-nums' }}>21:00 · MEX-RSA · 0000123</div>

        <hr className="board-divider" />
        <div className="row-label">Rules</div>
        <ul style={{ paddingLeft: 16, margin: 0, fontFamily: C3.sans, fontSize: 12, color: C3.ink70, lineHeight: 1.55 }}>
          <li>Multi-line headings always get <code style={{fontFamily: C3.mono, fontSize:10, color:C3.ink}}>text-wrap: pretty</code>.</li>
          <li>Times, scores, match codes use tabular-nums.</li>
          <li>Mono is uppercase only — never set lowercase mono text.</li>
        </ul>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────── 3. TOKENS — spacing, radii, shadow

function TokensBoard() {
  const SPACE = [4, 8, 12, 16, 20, 24, 32, 40];
  const RADII = [
    { v: 2, n: 'stamp' },
    { v: 4, n: 'button / input' },
    { v: 6, n: 'icon-button / banner' },
    { v: 12, n: 'modal / sheet inner' },
    { v: 16, n: 'ticket card' },
    { v: 18, n: 'bottom sheet top' },
  ];
  return (
    <div className="board">
      <BoardHeader eyebrow="★ Foundations · 03" title="Space · radii · elevation" />
      <hr className="board-divider" />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div className="row-label">Spacing scale (4px base)</div>
        <div className="scale-row" style={{ marginBottom: 16 }}>
          {SPACE.map(v => (
            <div key={v} className="scale-cell">
              <div className="spec-box" style={{ width: v, height: 36 }} />
              <div className="lbl">{v}</div>
            </div>
          ))}
        </div>

        <hr className="board-divider" />
        <div className="row-label">Border radii</div>
        <div className="cluster" style={{ gap: 14, marginBottom: 4 }}>
          {RADII.map(r => (
            <div key={r.v} style={{ textAlign: 'center' }}>
              <div className="spec-box" style={{
                width: 56, height: 56, borderRadius: r.v,
              }} />
              <div className="lbl" style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
                marginTop: 6, letterSpacing: 0.6 }}>{r.v}px · {r.n}</div>
            </div>
          ))}
        </div>

        <hr className="board-divider" />
        <div className="row-label">Elevation</div>
        <div className="grid3" style={{ marginBottom: 4 }}>
          {[
            { label: 'flat', shadow: 'none', note: 'rows, hairline-divided lists' },
            { label: 'card', shadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)', note: 'ticket card' },
            { label: 'lift', shadow: '0 20px 50px rgba(20,10,0,0.32)', note: 'modal, focused sheet' },
          ].map(e => (
            <div key={e.label}>
              <div style={{
                background: C3.ticket, height: 80, borderRadius: 12,
                boxShadow: e.shadow,
              }} />
              <div className="lbl" style={{ fontFamily: C3.mono, fontSize: 9, color: C3.ink50,
                marginTop: 8, letterSpacing: 0.6, textTransform: 'uppercase' }}>{e.label}</div>
              <div style={{ fontFamily: C3.sans, fontSize: 11, color: C3.ink70, marginTop: 2 }}>{e.note}</div>
            </div>
          ))}
        </div>

        <hr className="board-divider" />
        <div className="row-label">Borders / rules</div>
        <table className="tokens-table">
          <tbody>
            <tr><td>hairline</td><td>1px solid ink-20</td></tr>
            <tr><td>focus</td><td>1.5px solid ink + 3px ink-10 ring</td></tr>
            <tr><td>tear-line</td><td>1.5px dashed ink-20 · w/ 20px notch disks</td></tr>
            <tr><td>disabled</td><td>1.5px dashed ink-20</td></tr>
            <tr><td>error</td><td>1.5px solid stamp</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────── 4. SHELL — phone mockups

// A trimmed home body for shell demos so we don't repeat all 3 ticket cards.
function ShellHomeBody() {
  return (
    <React.Fragment>
      <C3Hero />
      <C3Match m={MATCHES[0]} />
      <C3Match m={MATCHES[1]} />
    </React.Fragment>
  );
}

function PreDrawBody() {
  return (
    <div style={{ padding: '6px 20px 16px' }}>
      <div style={{
        fontFamily: C3.mono, fontSize: 10, color: C3.stamp,
        letterSpacing: 2.4, textTransform: 'uppercase', marginBottom: 6,
      }}>★ Draw opens in</div>
      <div style={{ fontFamily: C3.display, fontSize: 42, lineHeight: 1,
        color: C3.ink, letterSpacing: -0.5 }}>3 days,<br/>11 hours</div>

      <div style={{ marginTop: 18, padding: '14px 16px',
        ...paperTexture(C3.ticket), borderRadius: 14,
        boxShadow: '0 1px 0 rgba(0,0,0,0.05), 0 8px 22px rgba(50,30,10,0.10)' }}>
        <div className="row-label">My shortlist · 4 of 8</div>
        <div className="cluster" style={{ marginTop: 6 }}>
          <TKTeamChip code="MX" name="Mexico"  short="MEX" variant="selected" />
          <TKTeamChip code="CA" name="Canada"  short="CAN" variant="selected" />
          <TKTeamChip code="KR" name="Korea"   short="KOR" variant="selected" />
          <TKTeamChip code="BA" name="Bosnia"  short="BIH" variant="selected" />
        </div>
        <div style={{ marginTop: 14 }}>
          <TKButton variant="primary" size="sm" trailing="→" block>Open draw lobby</TKButton>
        </div>
      </div>
    </div>
  );
}

function DetailBody() {
  return (
    <div style={{ padding: '0 16px 16px' }}>
      <TKBanner
        tone="notice"
        title="Locked at kick-off"
        body="Your prediction can be edited until 21:00 local. Then this card stamps."
      />
      <div style={{ height: 14 }} />
      <C3Match m={MATCHES[0]} />
      <div style={{ padding: '0 4px' }}>
        <div className="row-label">Score · pool consensus</div>
        <div className="cluster">
          <TKTeamChip code="MX" name="Mexico" short="MEX" owner="6 picks" />
          <TKTeamChip code="ZA" name="S. Africa" short="RSA" owner="2 picks" />
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────── 5. HEADERS — close-ups

function HeadersBoard() {
  const wrap = (label, child) => (
    <div>
      <div className="row-label">{label}</div>
      <div style={{ ...paperTexture(C3.paper), borderRadius: 10,
        border: '1px solid rgba(15,58,53,0.18)', overflow: 'hidden' }}>
        {child}
      </div>
    </div>
  );
  return (
    <div className="board paper">
      <BoardHeader eyebrow="★ Shell · 04" title="Headers" />
      <hr className="board-divider" />
      <div className="vstack" style={{ flex: 1, overflow: 'auto', gap: 18 }}>
        {wrap('Top app bar · authenticated shell', <TopBar />)}
        {wrap('Back · compact title', <BackHeader title="Match #001" />)}
        {wrap('Back · eyebrow + title', <BackHeader eyebrow="Group A · Matchday 2" title="Mexico vs South Africa" />)}
        {wrap('Back · right-side status (lock = locked match)', <BackHeader eyebrow="Match #001 · locked" title="Mexico vs S. Africa" statusIcon="lock" />)}
        {wrap('Back · open (unlock = still editable)', <BackHeader eyebrow="Predict by 21:00" title="My pick" statusIcon="unlock" />)}
      </div>
      <CaptionRow>BackHeader props · title · eyebrow? · statusIcon? · onBack</CaptionRow>
    </div>
  );
}

// ────────────────────────────────────────────────── 6. NAV — close-ups + states

function NavBoard() {
  // Tiny nav wrapper that constrains width like a phone
  const wrap = (label, child) => (
    <div>
      <div className="row-label">{label}</div>
      <div style={{ width: 360, ...paperTexture(C3.paper), borderRadius: 10,
        border: '1px solid rgba(15,58,53,0.18)', overflow: 'hidden' }}>
        {child}
      </div>
    </div>
  );
  return (
    <div className="board paper">
      <BoardHeader eyebrow="★ Shell · 05" title="Bottom nav · variants + states" />
      <hr className="board-divider" />
      <div className="vstack" style={{ flex: 1, overflow: 'auto', gap: 18 }}>
        {wrap('Live competition · Home active',
          <BottomNav variant="live" activeId="home" />)}
        {wrap('Live competition · Predictions active',
          <BottomNav variant="live" activeId="predictions" />)}
        {wrap('Pre-draw · Home active',
          <BottomNav variant="pre" activeId="home" />)}
        {wrap('Pre-draw · Draw active',
          <BottomNav variant="pre" activeId="draw" />)}
        {wrap('Pressed state (touch-down on Players)',
          <BottomNav variant="live" activeId="home" pressedId="players" />)}

        <hr className="board-divider" style={{ margin: '4px 0 0' }} />
        <div>
          <div className="row-label">Chat unread treatments</div>
          <div className="cluster" style={{ gap: 28, padding: '8px 10px',
            background: C3.paper, borderRadius: 10,
            border: '1px solid rgba(15,58,53,0.18)' }}>
            <NavTab item={{ id: 'chat', label: 'Chat' }} />
            <NavTab item={{ id: 'chat', label: 'Chat', unread: 'dot' }} />
            <NavTab item={{ id: 'chat', label: 'Chat', unread: 'count', count: 3 }} />
            <NavTab item={{ id: 'chat', label: 'Chat', unread: 'count', count: 12 }} />
            <NavTab item={{ id: 'chat', label: 'Chat', unread: 'count', count: 150 }} />
          </div>
          <div className="cap" style={{ marginTop: 8 }}>
            none · dot · 3 · 12 · 99+ (any count &gt;99 caps to "99+")
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────── 7. BUTTONS

function ButtonsBoard() {
  const row = (label, variant) => (
    <div>
      <div className="row-label">{label}</div>
      <div className="cluster">
        <TKButton variant={variant}>Idle</TKButton>
        <TKButton variant={variant} state="hover">Hover</TKButton>
        <TKButton variant={variant} state="pressed">Pressed</TKButton>
        <TKButton variant={variant} state="disabled">Disabled</TKButton>
        <TKButton variant={variant} state="loading">Saving</TKButton>
        <TKButton variant={variant} state="success">Saved</TKButton>
      </div>
    </div>
  );
  return (
    <div className="board">
      <BoardHeader eyebrow="★ Components · 06" title="Buttons" />
      <hr className="board-divider" />
      <div className="vstack" style={{ flex: 1, overflow: 'auto', gap: 18 }}>
        {row('Primary — ink fill, mono caps, optional → trailing', 'primary')}
        {row('Secondary — ink outline', 'secondary')}
        {row('Quiet — text-only', 'quiet')}
        {row('Destructive — stamp red fill', 'destructive')}

        <hr className="board-divider" style={{ margin: '4px 0 0' }} />
        <div>
          <div className="row-label">Sizes</div>
          <div className="cluster">
            <TKButton variant="primary" size="sm" trailing="→">Predict</TKButton>
            <TKButton variant="primary" size="md" trailing="→">Predict</TKButton>
            <TKButton variant="primary" size="lg" trailing="→">Predict</TKButton>
          </div>
          <div className="cap" style={{ marginTop: 6 }}>sm · 30 / md · 40 / lg · 48 px tall</div>
        </div>

        <div>
          <div className="row-label">Block / full-width primary</div>
          <TKButton variant="primary" size="md" trailing="→" block>Submit my predictions</TKButton>
        </div>

        <div>
          <div className="row-label">Icon buttons</div>
          <div className="cluster">
            <TKIconButton icon={ICONS.send} variant="primary" />
            <TKIconButton icon={ICONS.edit} variant="secondary" />
            <TKIconButton icon={ICONS.search} variant="quiet" />
            <TKIconButton icon={ICONS.trash} variant="destructive" />
            <TKIconButton icon={ICONS.filter} variant="secondary" state="disabled" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────── 8. FORMS

function FormsBoard() {
  return (
    <div className="board">
      <BoardHeader eyebrow="★ Components · 07" title="Form controls" />
      <hr className="board-divider" />
      <div className="vstack" style={{ flex: 1, overflow: 'auto', gap: 16 }}>
        <div className="grid2">
          <TKInput label="Display name" value="Darko" help="Shown to your pool" />
          <TKInput label="Email" type="email" placeholder="you@company.com" leading={ICONS.send} state="focus" />
        </div>
        <div className="grid2">
          <TKInput label="Tiebreaker score" type="number" value="2" trailing={<span style={{ fontFamily: C3.mono, fontSize: 10, color: C3.ink50 }}>HOME</span>} />
          <TKInput label="Search players" type="search" placeholder="Search by name" leading={ICONS.search} />
        </div>
        <div className="grid2">
          <TKInput label="Pool code" value="WC26-FRIENDS" state="filled" trailing={ICONS.check} />
          <TKInput label="Password" type="password" value="••••••••" trailing={ICONS.eye} />
        </div>
        <div className="grid2">
          <TKInput label="Invite email" value="nope" errorText="That email is not in the pool roster." state="error" />
          <TKInput label="Locked field" value="Drawn at 18:00" state="disabled" help="Set by the admin." />
        </div>

        <hr className="board-divider" style={{ margin: '4px 0 0' }} />

        <div className="grid2">
          <TKSelect label="Group" value="Group A · 6 teams" />
          <TKSelect label="Sort by" value="Points · descending" state="focus" />
        </div>

        <div>
          <div className="row-label">Toggle</div>
          <div className="cluster" style={{ gap: 22 }}>
            <TKToggle label="Email summaries" />
            <TKToggle label="Push reminders" on />
            <TKToggle label="DMs from pool" on disabled />
          </div>
        </div>

      </div>
    </div>
  );
}

// ────────────────────────────────────────────────── 9. AVATARS

function AvatarsBoard() {
  return (
    <div className="board">
      <BoardHeader eyebrow="★ Components · 08" title="Avatars" />
      <hr className="board-divider" />
      <div className="vstack" style={{ flex: 1, overflow: 'auto', gap: 18 }}>
        <div>
          <div className="row-label">Kinds · 32px</div>
          <div className="cluster" style={{ gap: 18 }}>
            <div style={{ textAlign: 'center' }}>
              <TKAvatar kind="photo" size={40} />
              <div className="cap" style={{ marginTop: 6 }}>photo</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <TKAvatar kind="emoji" emoji="🦊" size={40} />
              <div className="cap" style={{ marginTop: 6 }}>emoji</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <TKAvatar kind="initials" initial="D" size={40} />
              <div className="cap" style={{ marginTop: 6 }}>initials</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <TKAvatar kind="initials" initial="A" size={40} ring={C3.paper} />
              <div className="cap" style={{ marginTop: 6 }}>ringed</div>
            </div>
          </div>
        </div>

        <div>
          <div className="row-label">Sizes (initials)</div>
          <div className="cluster" style={{ gap: 14, alignItems: 'baseline' }}>
            {[16, 20, 24, 32, 40, 56, 80].map(s => (
              <div key={s} style={{ textAlign: 'center' }}>
                <TKAvatar size={s} initial="D" />
                <div className="cap" style={{ marginTop: 6 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="row-label">Avatar chips</div>
          <div className="cluster">
            <TKAvatarChip name="Darko" initial="D" />
            <TKAvatarChip name="Ana" kind="emoji" emoji="🦊" />
            <TKAvatarChip name="Marko" kind="photo" />
            <TKAvatarChip name="Petra" initial="P" />
            <TKAvatarChip name="Ivan" kind="emoji" emoji="⚡️" />
          </div>
        </div>

        <div>
          <div className="row-label">Stacking · pool roster preview</div>
          <div style={{ display: 'inline-flex' }}>
            {['D','A','M','P','I'].map((n, i) => (
              <div key={n} style={{ marginLeft: i === 0 ? 0 : -8 }}>
                <TKAvatar size={28} initial={n} ring={C3.ticket} />
              </div>
            ))}
            <div style={{ marginLeft: -8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: C3.ticket, color: C3.ink70,
                border: `1.5px solid ${C3.ink20}`,
                display: 'grid', placeItems: 'center',
                fontFamily: C3.mono, fontSize: 10, fontWeight: 600,
              }}>+3</div>
            </div>
          </div>
        </div>
      </div>
      <CaptionRow>Photo avatars get a paper ring on dark cards to keep edges crisp.</CaptionRow>
    </div>
  );
}

// ────────────────────────────────────────────────── 10. TEAM CHIPS

function TeamChipsBoard() {
  return (
    <div className="board">
      <BoardHeader eyebrow="★ Components · 09" title="Team chips" />
      <hr className="board-divider" />
      <div className="vstack" style={{ flex: 1, overflow: 'auto', gap: 18 }}>
        <div>
          <div className="row-label">Default — full block, used in shortlists & detail views</div>
          <div className="cluster">
            <TKTeamChip code="MX" name="Mexico" short="MEX" />
            <TKTeamChip code="CA" name="Canada" short="CAN" />
            <TKTeamChip code="KR" name="Korea Republic" short="KOR" />
          </div>
        </div>
        <div>
          <div className="row-label">Selected — picked in draw / shortlist</div>
          <div className="cluster">
            <TKTeamChip code="MX" name="Mexico" short="MEX" variant="selected" />
            <TKTeamChip code="ZA" name="South Africa" short="RSA" variant="selected" />
          </div>
        </div>
        <div>
          <div className="row-label">Disabled / locked — already taken by another player</div>
          <div className="cluster">
            <TKTeamChip code="CZ" name="Czechia" short="CZE" variant="disabled" />
            <TKTeamChip code="BA" name="Bosnia & H." short="BIH" variant="disabled" />
          </div>
        </div>
        <div>
          <div className="row-label">With owner (post-draw)</div>
          <div className="cluster">
            <TKTeamChip code="MX" name="Mexico" short="MEX" owner="Darko" />
            <TKTeamChip code="KR" name="Korea Republic" short="KOR" owner="Marko" />
          </div>
        </div>
        <div>
          <div className="row-label">Compact — inline in rows / chat / messages</div>
          <div className="cluster">
            <TKTeamChip code="MX" short="MEX" variant="compact" />
            <TKTeamChip code="ZA" short="RSA" variant="compact" />
            <TKTeamChip code="CA" short="CAN" variant="compact" />
            <TKTeamChip code="KR" short="KOR" variant="compact" />
            <TKTeamChip code="CZ" short="CZE" variant="compact" />
            <TKTeamChip code="BA" short="BIH" variant="compact" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────── 11. BANNERS / TOASTS / EMPTY

function FeedbackBoard() {
  return (
    <div className="board">
      <BoardHeader eyebrow="★ Components · 10" title="Banners · toasts · empty" />
      <hr className="board-divider" />
      <div className="vstack" style={{ flex: 1, overflow: 'auto', gap: 14 }}>
        <div>
          <div className="row-label">Inline banners</div>
          <div className="vstack" style={{ gap: 8 }}>
            <TKBanner tone="success" title="Prediction saved"   body="MEX 2–1 RSA · locks at 21:00 local."  action="View" />
            <TKBanner tone="notice"  title="Draw lobby is open" body="Pick your 8 shortlisted teams before Friday." action="Open" />
            <TKBanner tone="warning" title="3 picks left"       body="You still need to predict tomorrow's 3 matches." />
            <TKBanner tone="error"   title="Pool code invalid"  body="That code is closed or doesn't exist. Ask an admin." action="Retry" />
          </div>
        </div>

        <hr className="board-divider" style={{ margin: 0 }} />

        <div>
          <div className="row-label">Toasts — bottom anchored, auto-dismiss</div>
          <div className="cluster" style={{ gap: 12 }}>
            <TKToast tone="success" text="Saved · MEX 2–1 RSA" />
            <TKToast tone="notice"  text="Match locks in 12 minutes" />
            <TKToast tone="error"   text="Couldn't reach pool · retrying" />
          </div>
        </div>

        <hr className="board-divider" style={{ margin: 0 }} />

        <div>
          <div className="row-label">Empty state</div>
          <TKEmpty
            title="No predictions yet"
            body="Open a match ticket to call the score. Predictions lock at kick-off."
            action="Browse fixtures"
          />
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────── 12. MODAL / SHEET

function OverlaysBoard() {
  return (
    <div className="board paper">
      <BoardHeader eyebrow="★ Patterns · 11" title="Modal & bottom sheet" />
      <hr className="board-divider" />
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div className="row-label">Confirm modal (primary action)</div>
        <div style={{
          padding: 18, display: 'grid', placeItems: 'center',
          background: 'rgba(15,58,53,0.45)', borderRadius: 12, marginBottom: 18,
        }}>
          <TKModal
            title="Submit predictions?"
            body="You've called all 3 matches for Matchday 2. Once submitted, each ticket locks at kick-off."
            secondary="Review"
            primary="Submit"
          />
        </div>

        <div className="row-label">Destructive modal</div>
        <div style={{
          padding: 18, display: 'grid', placeItems: 'center',
          background: 'rgba(15,58,53,0.45)', borderRadius: 12, marginBottom: 18,
        }}>
          <TKModal
            title="Leave the pool?"
            body="Your predictions stay in the archive but you'll lose access to chat and the live standings."
            secondary="Cancel"
            primary="Leave pool"
            tone="destructive"
          />
        </div>

        <div className="row-label">Bottom sheet</div>
        <div style={{
          padding: '24px 18px 0', display: 'grid', placeItems: 'end center',
          background: 'rgba(15,58,53,0.45)', borderRadius: 12,
        }}>
          <TKBottomSheet
            title="Match #001 actions"
            items={[
              { icon: ICONS.edit,   label: 'Edit my prediction',  hint: 'LOCKS AT 21:00' },
              { icon: ICONS.send,   label: 'Share to pool chat',  hint: 'POSTS A TICKET CARD' },
              { icon: ICONS.calendar,label:'Add to calendar',     hint: 'ICS · LOCAL TIME' },
              { icon: ICONS.trash,  label: 'Clear my pick',       hint: 'CANNOT BE UNDONE', tone: 'destructive' },
            ]}
          />
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────── 13. LISTS / TABLES

function ListsBoard() {
  return (
    <div className="board">
      <BoardHeader eyebrow="★ Patterns · 12" title="Tables & list rows" />
      <hr className="board-divider" />
      <div className="vstack" style={{ flex: 1, overflow: 'auto', gap: 18 }}>
        <div>
          <div className="row-label">Group standings table</div>
          <div style={{ background: C3.ticket, borderRadius: 10,
            border: `1px solid ${C3.ink20}`, overflow: 'hidden' }}>
            <TKStandingHeader />
            <TKStandingRow rank={1} code="MX" name="Mexico"           p={3} w={2} d={1} l={0} pts={7} highlight />
            <TKStandingRow rank={2} code="KR" name="Korea Republic"   p={3} w={2} d={0} l={1} pts={6} />
            <TKStandingRow rank={3} code="CA" name="Canada"           p={3} w={1} d={1} l={1} pts={4} />
            <TKStandingRow rank={4} code="CZ" name="Czechia"          p={3} w={0} d={1} l={2} pts={1} />
          </div>
          <div className="cap" style={{ marginTop: 6 }}>Highlight row = your owned team · stamp-red tint at 6% alpha.</div>
        </div>

        <div>
          <div className="row-label">Player leaderboard</div>
          <div style={{ background: C3.ticket, borderRadius: 10,
            border: `1px solid ${C3.ink20}`, overflow: 'hidden' }}>
            <TKPlayerRow rank={1} name="Darko"  kind="initials" initial="D" pts={48} predictions={12} />
            <TKPlayerRow rank={2} name="Ana"    kind="emoji"    emoji="🦊"  pts={41} predictions={12} />
            <TKPlayerRow rank={3} name="Marko"  kind="photo"                pts={37} predictions={11} />
            <TKPlayerRow rank={4} name="Petra"  kind="initials" initial="P" pts={29} predictions={10} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────── 14. LOADING

function LoadingBoard() {
  return (
    <div className="board paper">
      <BoardHeader eyebrow="★ Patterns · 13" title="Loading & skeletons" />
      <hr className="board-divider" />
      <div className="vstack" style={{ flex: 1, overflow: 'auto', gap: 18 }}>
        <div>
          <div className="row-label">Spinner</div>
          <div className="cluster" style={{ gap: 22 }}>
            <TKSpinner size={16} label="Loading" />
            <TKSpinner size={24} label="Saving prediction" />
            <TKSpinner size={32} color={C3.stamp} label="Live · syncing" />
          </div>
        </div>

        <div>
          <div className="row-label">Skeleton — ticket card (same silhouette as match card)</div>
          <TKSkeletonTicket />
        </div>

        <div className="cap">
          Skeletons mirror final geometry exactly. Pulse @ 1.6s ease-in-out · ink-08 fills.
          Spinners never show without context — always paired with a mono caps label.
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────── 15. EXAMPLE COMPOSITION
// One screen showing every primitive at work together — a Predict detail page.

function PredictDetailComposition() {
  return (
    <Phone bg={C3.paper} statusColor={C3.ink}>
      <div style={{ flex: 1, overflow: 'auto', ...paperTexture(C3.paper) }}>
        <BackHeader eyebrow="Match #001 · group A" title="Call the score" statusIcon="unlock" />
        <div style={{ padding: '0 16px 16px' }}>
          <C3Match m={MATCHES[0]} />

          <div style={{ padding: '6px 4px 16px' }}>
            <div className="row-label">Your prediction</div>
            <div className="cluster" style={{ gap: 16, alignItems: 'center' }}>
              <div>
                <FieldLabel>Home</FieldLabel>
                <TKInput type="number" value="2" leading={
                  <span style={{ width: 16, height: 12, borderRadius: 2, overflow: 'hidden', display: 'inline-block' }}>{FLAGS.MX}</span>
                } block={false} />
              </div>
              <div style={{ fontFamily: C3.display, fontSize: 22, color: C3.ink, marginTop: 14 }}>—</div>
              <div>
                <FieldLabel>Away</FieldLabel>
                <TKInput type="number" value="1" leading={
                  <span style={{ width: 16, height: 12, borderRadius: 2, overflow: 'hidden', display: 'inline-block' }}>{FLAGS.ZA}</span>
                } block={false} />
              </div>
            </div>

            <div style={{ marginTop: 14 }}>
              <FieldLabel hint="Tie-break for points">First scorer</FieldLabel>
              <TKSelect value="Edson Álvarez (MEX)" />
            </div>

            <div style={{ marginTop: 14 }}>
              <TKBanner tone="notice" title="Locks at 21:00 local" body="You can edit until kick-off." />
            </div>

            <div style={{ marginTop: 14 }}>
              <TKButton variant="primary" size="md" trailing="→" block>Stamp my prediction</TKButton>
            </div>
            <div style={{ marginTop: 8 }}>
              <TKButton variant="quiet" size="sm" block>Clear pick</TKButton>
            </div>
          </div>
        </div>
      </div>
      <BottomNav variant="live" activeId="predictions" />
      <div style={{ height: 22, ...paperTexture(C3.paper) }} />
    </Phone>
  );
}

// ────────────────────────────────────────────────── APP

function App() {
  return (
    <DesignCanvas>
      <DCSection
        id="intro"
        title="World Cup 26 — Design system"
        subtitle="The Match Ticket direction, extended into a full reusable system. All screens are 390×844 inside the standard phone shell.">
        <DCArtboard id="colors" label="Foundations · 01 · palette" width={420} height={620}>
          <ColorsBoard />
        </DCArtboard>
        <DCArtboard id="type" label="Foundations · 02 · type" width={420} height={620}>
          <TypeBoard />
        </DCArtboard>
        <DCArtboard id="tokens" label="Foundations · 03 · tokens" width={420} height={620}>
          <TokensBoard />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="shell"
        title="App shell · two nav variants + detail header"
        subtitle="Same top app bar across the app. Bottom nav swaps between Pre-Draw and Live Competition. Detail pages replace the top bar with a back-header.">
        <DCArtboard id="shell-live" label="Live competition · home" width={420} height={874}>
          <PhoneArtboard>
            <ShellLive><ShellHomeBody/></ShellLive>
          </PhoneArtboard>
        </DCArtboard>
        <DCArtboard id="shell-pre" label="Pre-draw · home" width={420} height={874}>
          <PhoneArtboard>
            <ShellPreDraw><PreDrawBody/></ShellPreDraw>
          </PhoneArtboard>
        </DCArtboard>
        <DCArtboard id="shell-detail" label="Detail · match (back header)" width={420} height={874}>
          <PhoneArtboard>
            <ShellBack eyebrow="Match #001 · group A · locked" title="Mexico vs S. Africa" statusIcon="lock">
              <DetailBody/>
            </ShellBack>
          </PhoneArtboard>
        </DCArtboard>
      </DCSection>

      <DCSection
        id="chrome"
        title="Headers & navigation"
        subtitle="Header and nav specs broken out so all states are visible at once.">
        <DCArtboard id="headers" label="Headers · spec" width={500} height={580}>
          <HeadersBoard />
        </DCArtboard>
        <DCArtboard id="nav" label="Bottom nav · spec" width={500} height={780}>
          <NavBoard />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="controls"
        title="Controls"
        subtitle="Buttons, form inputs, avatars, and team chips — the primitives every screen reuses.">
        <DCArtboard id="buttons" label="Buttons" width={620} height={680}>
          <ButtonsBoard />
        </DCArtboard>
        <DCArtboard id="forms" label="Forms" width={620} height={780}>
          <FormsBoard />
        </DCArtboard>
        <DCArtboard id="avatars" label="Avatars" width={500} height={560}>
          <AvatarsBoard />
        </DCArtboard>
        <DCArtboard id="chips" label="Team chips" width={500} height={620}>
          <TeamChipsBoard />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="feedback"
        title="Feedback & overlays"
        subtitle="Banners, toasts, empty states, dialogs, sheets, and loading affordances.">
        <DCArtboard id="banners" label="Banners · toasts · empty" width={500} height={780}>
          <FeedbackBoard />
        </DCArtboard>
        <DCArtboard id="overlays" label="Modal & sheet" width={500} height={920}>
          <OverlaysBoard />
        </DCArtboard>
        <DCArtboard id="lists" label="Tables & lists" width={500} height={680}>
          <ListsBoard />
        </DCArtboard>
        <DCArtboard id="loading" label="Loading & skeleton" width={500} height={620}>
          <LoadingBoard />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="prediction-components"
        title="Prediction · Progress · Status · Chat"
        subtitle="The remaining product-specific components: outcome selector, progress bars, save / status pills, and the chat bubble + reaction rail used inside the Chat tab.">
        <DCArtboard id="outcome" label="Prediction outcome buttons" width={500} height={680}>
          <OutcomeBoard />
        </DCArtboard>
        <DCArtboard id="progress-status" label="Progress + status pills" width={500} height={680}>
          <ProgressBoard />
        </DCArtboard>
        <DCArtboard id="chat" label="Chat bubble + reaction rail" width={500} height={620}>
          <ChatBoard />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="handoff"
        title="Handoff · matrix · responsive · motion · impl"
        subtitle="Final cross-cutting documentation: interaction-state spec, motion timing, state coverage matrix, responsive notes, and a one-page implementation guide for React + Tailwind + lucide.">
        <DCArtboard id="interaction" label="Focus · pressed · disabled" width={620} height={620}>
          <InteractionSpecBoard />
        </DCArtboard>
        <DCArtboard id="motion" label="Motion & animation" width={620} height={720}>
          <MotionBoard />
        </DCArtboard>
        <DCArtboard id="state-matrix" label="State coverage matrix" width={920} height={720}>
          <StateMatrixBoard />
        </DCArtboard>
        <DCArtboard id="responsive" label="Responsive breakpoints" width={620} height={640}>
          <ResponsiveBoard />
        </DCArtboard>
        <DCArtboard id="impl" label="Implementation notes" width={620} height={920}>
          <ImplBoard />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="proof"
        title="Composition · Predict a match"
        subtitle="One screen wiring back-header + ticket card + inputs + select + banner + primary CTA + nav into a single editable detail page.">
        <DCArtboard id="composition" label="Predict · detail page" width={420} height={874}>
          <PhoneArtboard>
            <PredictDetailComposition />
          </PhoneArtboard>
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
