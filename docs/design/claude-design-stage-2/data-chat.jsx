// Chat — sample message data, user registry, emoji sets.
// Shape mirrors the rest of the pool: 5 players, same kind/initial/emoji.

const CHAT_USERS = {
  darko: { id: 'darko', name: 'Darko', kind: 'initials', initial: 'D', you: true,  admin: true },
  ana:   { id: 'ana',   name: 'Ana',   kind: 'emoji',    emoji: '🦊' },
  marko: { id: 'marko', name: 'Marko', kind: 'initials', initial: 'M' },
  petra: { id: 'petra', name: 'Petra', kind: 'emoji',    emoji: '🐺' },
  ivan:  { id: 'ivan',  name: 'Ivan',  kind: 'photo',    initial: 'I' },
};

// Order matters — list flows top → bottom (oldest first).
// `mine` is computed at render time from author === 'darko'.
const CHAT_MESSAGES_DEFAULT = [
  // ── DAY HEADER · TUE · JUN 9 ─────────────────────────────────
  { id: 1, day: 'Tue, Jun 9', author: 'ana', time: '9:14',
    text: 'did everyone see the friday fixture list? mexico v south africa is gonna be a brawl 🥊',
    reactions: [
      { emoji: '❤️', count: 2, mine: true,  by: ['darko', 'marko'] },
      { emoji: '😮', count: 1, mine: false, by: ['petra'] },
    ],
  },
  { id: 2, author: 'darko', time: '9:16',
    text: "lol yeah, I'm taking RSA actually",
  },
  { id: 3, author: 'darko', time: '9:16',
    text: 'long-shot but at +650 i kinda have to',
    reactions: [
      { emoji: '🙏', count: 1, mine: false, by: ['ana'] },
    ],
  },
  { id: 4, author: 'marko', time: '9:22',
    text: '@Darko you crazy, MEX 3-0 easy. azteca crowd will eat them alive',
  },
  // ── UNREAD DIVIDER goes between id 4 and id 5 ────────────────
  { id: 5, author: 'petra', time: '10:01', unread: true,
    replyTo: { author: 'Marko', text: 'you crazy, MEX 3-0 easy. azteca crowd will eat them alive' },
    text: 'azteca? altitude is overrated tbh — RSA has been quietly excellent in qualifying. don\'t sleep on them',
  },
  { id: 6, author: 'petra', time: '10:02', unread: true,
    text: "anyway, whoever's got CAN-BIH on friday — that's the real banker. hosts opening 2-0 in toronto, easiest call of the group stage",
    reactions: [
      { emoji: '❤️', count: 1, mine: false, by: ['marko'] },
    ],
  },
];

// Empty conversation — used by the empty state artboard.
const CHAT_MESSAGES_EMPTY = [];

// Quick reactions surfaced in the compact picker (left to right).
const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '🙏'];

// Full grid for the expanded picker. Order is loose-categories;
// keep it short and mobile-compact (5 cols × 6 rows = 30).
const FULL_REACTIONS = [
  '❤️', '😂', '😮', '😢', '🙏', // quick row (mirrors compact picker)
  '👍', '👎', '🔥', '💯', '🎉',
  '⚽', '🏆', '🥅', '🥊', '🏁',
  '😅', '😎', '🤔', '😴', '🤯',
  '👏', '🙌', '💪', '🫡', '🤝',
  '☕', '🍻', '🍿', '🚀', '✨',
];

// Mention picker rows — fired by typing "@" in the composer.
// Excludes the current user from suggestions.
const MENTIONABLE = ['ana', 'marko', 'petra', 'ivan'];

Object.assign(window, {
  CHAT_USERS, CHAT_MESSAGES_DEFAULT, CHAT_MESSAGES_EMPTY,
  QUICK_REACTIONS, FULL_REACTIONS, MENTIONABLE,
});
