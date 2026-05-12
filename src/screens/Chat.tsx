import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Send, X, CornerUpLeft, MessageCircle, Heart } from 'lucide-react'
import { doc, setDoc, serverTimestamp, getDoc, Timestamp } from 'firebase/firestore'
import { db } from '@/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { useChat } from '@/hooks/useChat'
import { useUsers } from '@/hooks/useUsers'
import { Avatar } from '@/components/Avatar'
import { PushPrompt } from '@/components/PushPrompt'
import { ReactionPicker } from '@/components/ReactionPicker'
import type { ChatMessage } from '@/types'
import type { ChatUser } from '@/hooks/useUsers'

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LIKE_REACTION = '💙'

function formatTime(date: Date): string {
  const now = new Date()
  const isToday = date.toDateString() === now.toDateString()
  const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (isToday) return time
  const d = date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  return `${d} ${time}`
}

function MentionText({ text }: { text: string }) {
  const parts = text.split(/(@\S+)/g)
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith('@') ? (
          <span key={i} className="font-semibold opacity-90">
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}

function getUserReaction(reactions: Record<string, string[]>, userId: string): string | null {
  if (!userId) return null
  return Object.entries(reactions).find(([, uids]) => uids.includes(userId))?.[0] ?? null
}

function getUniqueReactionCount(reactions: Record<string, string[]>): number {
  const userIds = new Set<string>()
  Object.values(reactions).forEach((uids) => {
    uids.forEach((uid) => userIds.add(uid))
  })
  return userIds.size
}

function getOtherReactionEntries(reactions: Record<string, string[]>, currentUserId: string) {
  return Object.entries(reactions)
    .map(([emoji, uids]) => [emoji, uids.filter((uid) => uid !== currentUserId)] as const)
    .filter(([, uids]) => uids.length > 0)
}

function ReactionButton({
  emoji,
  label,
  isActive,
  isEmphasized,
  onSelect,
  onLongPress,
  children,
}: {
  emoji: string
  label: string
  isActive?: boolean
  isEmphasized?: boolean
  onSelect: (emoji: string) => void
  onLongPress: (rect: DOMRect) => void
  children: ReactNode
}) {
  const buttonRef = useRef<HTMLButtonElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)

  function startLongPress() {
    longPressTriggered.current = false
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true
      if (buttonRef.current) onLongPress(buttonRef.current.getBoundingClientRect())
    }, 500)
  }

  function cancelLongPress() {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      aria-label={label}
      aria-pressed={isActive ?? false}
      onClick={(e) => {
        e.stopPropagation()
        if (longPressTriggered.current) {
          longPressTriggered.current = false
          return
        }
        onSelect(emoji)
      }}
      onPointerDown={(e) => {
        e.stopPropagation()
        startLongPress()
      }}
      onPointerUp={(e) => {
        e.stopPropagation()
        cancelLongPress()
      }}
      onPointerLeave={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onContextMenu={(e) => e.preventDefault()}
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xl transition-transform active:scale-95 ${
        isActive || isEmphasized ? 'bg-[#1d2630]' : 'bg-transparent'
      }`}
    >
      {children}
    </button>
  )
}

function ReactionRail({
  msg,
  isMe,
  currentUserId,
  onReactionSelect,
  onOpenPicker,
}: {
  msg: ChatMessage
  isMe: boolean
  currentUserId: string
  onReactionSelect: (emoji: string) => void
  onOpenPicker: (rect: DOMRect) => void
}) {
  const currentReaction = getUserReaction(msg.reactions ?? {}, currentUserId)
  const otherReactionEntries = getOtherReactionEntries(msg.reactions ?? {}, currentUserId)
  const totalReactions = getUniqueReactionCount(msg.reactions ?? {})

  const currentSlot =
    currentReaction === LIKE_REACTION || currentReaction === null ? (
      <ReactionButton
        key="current"
        emoji={LIKE_REACTION}
        label={currentReaction === LIKE_REACTION ? 'Remove like' : 'Like message'}
        isActive={currentReaction === LIKE_REACTION}
        isEmphasized
        onSelect={onReactionSelect}
        onLongPress={onOpenPicker}
      >
        <Heart
          size={22}
          strokeWidth={2}
          fill={currentReaction === LIKE_REACTION ? 'currentColor' : 'none'}
          className={currentReaction === LIKE_REACTION ? 'text-[#6d63ff]' : 'text-white'}
        />
      </ReactionButton>
    ) : (
      <ReactionButton
        key="current"
        emoji={currentReaction}
        label={`Remove ${currentReaction} reaction`}
        isActive
        isEmphasized
        onSelect={onReactionSelect}
        onLongPress={onOpenPicker}
      >
        <span className="leading-none">{currentReaction}</span>
      </ReactionButton>
    )

  const otherSlots = otherReactionEntries.map(([emoji]) => (
    <ReactionButton
      key={emoji}
      emoji={emoji}
      label={`React with ${emoji}`}
      onSelect={onReactionSelect}
      onLongPress={onOpenPicker}
    >
      <span className="leading-none">{emoji}</span>
    </ReactionButton>
  ))

  const slots = isMe ? [currentSlot, ...otherSlots] : [...otherSlots, currentSlot]

  return (
    <div className="relative flex shrink-0 items-center self-center">
      <div className="flex items-center rounded-full border border-white/5 bg-black/50 p-0.5 shadow-lg shadow-black/30">
        {slots}
      </div>
      {totalReactions > 1 && (
        <span className="absolute left-1/2 top-full mt-0.5 -translate-x-1/2 text-sm font-medium leading-none text-white drop-shadow-[0_1px_1px_rgba(0,212,255,0.65)]">
          {totalReactions}
        </span>
      )}
    </div>
  )
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  msg,
  isMe,
  isFirst,
  currentUserId,
  onReply,
  onOpenPicker,
  onReactionSelect,
}: {
  msg: ChatMessage
  isMe: boolean
  isFirst: boolean
  currentUserId: string
  onReply: () => void
  onOpenPicker: (rect: DOMRect) => void
  onReactionSelect: (emoji: string) => void
}) {
  return (
    <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} ${isFirst ? 'mt-3' : 'mt-0.5'}`}>
      <div className={`flex flex-col ${isMe ? 'items-end max-w-[78%]' : 'items-start max-w-[88%]'}`}>
        {!isMe && isFirst && (
          <span className="text-xs text-gray-400 ml-10 mb-1">{msg.authorName}</span>
        )}

        <div className={`flex items-start gap-2 w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
          {!isMe && (
            <div className="w-8 shrink-0">
              {isFirst && <Avatar url={msg.authorAvatar} name={msg.authorName} className="w-8 h-8" />}
            </div>
          )}

          <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} min-w-0`}>
            <div className={`flex items-center gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
              {isMe && (
                <ReactionRail
                  msg={msg}
                  isMe={isMe}
                  currentUserId={currentUserId}
                  onReactionSelect={onReactionSelect}
                  onOpenPicker={onOpenPicker}
                />
              )}

              <div
                onClick={onReply}
                className={`rounded-2xl px-3.5 py-2.5 text-sm cursor-pointer active:opacity-75 transition-opacity select-none ${
                  isMe
                    ? 'bg-brand-accent text-brand-bg rounded-br-sm'
                    : 'bg-brand-card border border-brand-border text-white rounded-bl-sm'
                }`}
              >
                {msg.replyTo && (
                  <div
                    className={`mb-2 pl-3 border-l-2 rounded-sm ${
                      isMe ? 'border-brand-bg/40' : 'border-brand-accent/60'
                    }`}
                  >
                    <p
                      className={`text-xs font-semibold mb-0.5 ${
                        isMe ? 'text-brand-bg/70' : 'text-brand-accent'
                      }`}
                    >
                      {msg.replyTo.authorName}
                    </p>
                    <p
                      className={`text-xs line-clamp-1 ${
                        isMe ? 'text-brand-bg/60' : 'text-gray-400'
                      }`}
                    >
                      {msg.replyTo.text}
                    </p>
                  </div>
                )}

                <span className="whitespace-pre-wrap break-words leading-relaxed">
                  <MentionText text={msg.text} />
                </span>
              </div>

              {!isMe && (
                <ReactionRail
                  msg={msg}
                  isMe={isMe}
                  currentUserId={currentUserId}
                  onReactionSelect={onReactionSelect}
                  onOpenPicker={onOpenPicker}
                />
              )}
            </div>

            <span className="text-[10px] text-gray-500 mt-0.5 mx-1">{formatTime(msg.sentAt)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function Chat() {
  const { user } = useAuth()
  const { messages, loading, sendMessage, toggleReaction } = useChat()
  const users = useUsers()

  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<ChatMessage['replyTo'] | null>(null)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [pickerState, setPickerState] = useState<{ msgId: string; rect: DOMRect } | null>(null)
  // Snapshot of lastReadAt captured at mount, used to place the unread divider.
  // Must be read before markRead() runs, so we capture it in a separate effect.
  const [dividerAt, setDividerAt] = useState<Date | null | 'loading'>('loading')

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const atBottomRef = useRef(true)

  // Scroll to bottom on initial load
  useEffect(() => {
    if (!loading) {
      bottomRef.current?.scrollIntoView()
    }
  }, [loading])

  // Auto-scroll when messages change — only if near bottom
  const prevLengthRef = useRef(0)
  useEffect(() => {
    if (messages.length <= prevLengthRef.current) {
      prevLengthRef.current = messages.length
      return
    }
    prevLengthRef.current = messages.length
    const lastMsg = messages[messages.length - 1]
    if (atBottomRef.current || lastMsg?.authorId === user?.uid) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages.length, user?.uid])

  // Track if user is near the bottom by observing the sentinel div
  useEffect(() => {
    if (!bottomRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        atBottomRef.current = entry.isIntersecting
      },
      { threshold: 0 },
    )
    observer.observe(bottomRef.current)
    return () => observer.disconnect()
  }, [])

  // Capture lastReadAt BEFORE markRead runs — this is the divider position for this session
  useEffect(() => {
    if (!user) return
    getDoc(doc(db, 'chatReads', user.uid)).then((snap) => {
      const ts = snap.exists() ? (snap.data().lastReadAt as Timestamp | null) : null
      setDividerAt(ts ? ts.toDate() : null)
    })
  }, [user])

  // Mark chat as read on mount + when app tab becomes visible
  const markRead = useCallback(async () => {
    if (!user) return
    await setDoc(doc(db, 'chatReads', user.uid), { lastReadAt: serverTimestamp() }, { merge: true })
  }, [user])

  useEffect(() => {
    markRead()
    const onVisibility = () => {
      if (!document.hidden) markRead()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [markRead])

  // Detect @mention query from input
  function handleTextChange(val: string) {
    setText(val)
    const cursor = inputRef.current?.selectionStart ?? val.length
    const before = val.slice(0, cursor)
    const match = before.match(/@(\w*)$/)
    setMentionQuery(match ? match[1] : null)
  }

  // Replace the @fragment with the selected user's name
  function selectMention(mentionUser: ChatUser) {
    const cursor = inputRef.current?.selectionStart ?? text.length
    const before = text.slice(0, cursor)
    const after = text.slice(cursor)
    const replaced = before.replace(/@\w*$/, `@${mentionUser.displayName} `)
    setText(replaced + after)
    setMentionQuery(null)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  // Build mentions array for Firestore by matching @Name in text against users
  function extractMentions(str: string): string[] {
    const ids: string[] = []
    const regex = /@(\S+)/g
    let m: RegExpExecArray | null
    while ((m = regex.exec(str)) !== null) {
      const raw = m[1].replace(/[.,!?;:]+$/, '')
      const found = users.find((u) => u.displayName.toLowerCase() === raw.toLowerCase())
      if (found && !ids.includes(found.uid)) ids.push(found.uid)
    }
    return ids
  }

  async function handleSend() {
    const trimmed = text.trim()
    if (!trimmed || !user || sending) return
    setSending(true)
    try {
      await sendMessage({
        text: trimmed,
        user,
        replyTo: replyTo ?? undefined,
        mentions: extractMentions(trimmed),
      })
      setText('')
      setReplyTo(null)
      setMentionQuery(null)
    } finally {
      setSending(false)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const mentionUsers =
    mentionQuery !== null
      ? users.filter(
          (u) =>
            u.uid !== user?.uid &&
            u.displayName.toLowerCase().startsWith(mentionQuery.toLowerCase()),
        )
      : []

  // Group consecutive messages from the same author (within 5 minutes)
  const grouped = messages.map((msg, i) => {
    const prev = messages[i - 1]
    const isFirst =
      !prev ||
      prev.authorId !== msg.authorId ||
      msg.sentAt.getTime() - prev.sentAt.getTime() > 5 * 60 * 1000
    return { msg, isFirst }
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <>
      {/* Messages list */}
      <div className="px-3 pt-2 pb-44">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-500">
            <MessageCircle size={44} className="mb-3 opacity-20" />
            <p className="text-sm">No messages yet.</p>
            <p className="text-sm">Start the chat!</p>
          </div>
        )}

        {(() => {
          let dividerShown = false
          return grouped.map(({ msg, isFirst }) => {
            const isFirstUnread =
              !dividerShown &&
              dividerAt !== 'loading' &&
              dividerAt !== null &&
              msg.sentAt > dividerAt &&
              msg.authorId !== user?.uid
            if (isFirstUnread) dividerShown = true
            return (
              <div key={msg.id}>
                {isFirstUnread && (
                  <div className="flex items-center gap-3 my-4">
                    <div className="flex-1 h-px bg-brand-border" />
                    <span className="text-xs text-gray-500 font-medium tracking-wide">Unread</span>
                    <div className="flex-1 h-px bg-brand-border" />
                  </div>
                )}
                <MessageBubble
                  msg={msg}
                  isMe={msg.authorId === user?.uid}
                  isFirst={isFirst}
                  currentUserId={user?.uid ?? ''}
                  onReply={() =>
                    setReplyTo({ messageId: msg.id, authorName: msg.authorName, text: msg.text })
                  }
                  onOpenPicker={(rect) => setPickerState({ msgId: msg.id, rect })}
                  onReactionSelect={(emoji) => {
                    if (!user) return
                    toggleReaction(msg.id, msg.reactions, emoji, user.uid)
                  }}
                />
              </div>
            )
          })
        })()}

        {/* Push notification prompt — shown once, after messages */}
        <div className="mt-4">
          <PushPrompt />
        </div>

        {/* Sentinel for auto-scroll detection */}
        <div ref={bottomRef} className="h-1" />
      </div>

      {/* Reaction picker overlay */}
      <AnimatePresence>
        {pickerState && (
          <ReactionPicker
            rect={pickerState.rect}
            onSelect={(emoji) => {
              if (!user) return
              const msg = messages.find((m) => m.id === pickerState.msgId)
              if (!msg) return
              toggleReaction(pickerState.msgId, msg.reactions, emoji, user.uid)
              setPickerState(null)
            }}
            onClose={() => setPickerState(null)}
          />
        )}
      </AnimatePresence>

      {/* Fixed input panel above the bottom nav */}
      <div
        className="fixed left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-brand-bg border-t border-brand-border z-10"
        style={{ bottom: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
      >
        {/* @mention picker */}
        <AnimatePresence>
          {mentionUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="border-b border-brand-border bg-brand-card max-h-44 overflow-y-auto"
            >
              {mentionUsers.map((u) => (
                <button
                  key={u.uid}
                  onMouseDown={(e) => {
                    e.preventDefault()
                    selectMention(u)
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault()
                    selectMention(u)
                  }}
                  className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-brand-border transition-colors text-left"
                >
                  <Avatar url={u.avatarUrl} name={u.displayName} className="w-7 h-7" />
                  <span className="text-white text-sm">{u.displayName}</span>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reply preview */}
        <AnimatePresence>
          {replyTo && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-b border-brand-border"
            >
              <div className="flex items-center gap-2 px-4 py-2 bg-brand-card">
                <CornerUpLeft size={14} className="text-brand-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-brand-accent font-medium">{replyTo.authorName}</p>
                  <p className="text-xs text-gray-400 truncate">{replyTo.text}</p>
                </div>
                <button
                  onClick={() => setReplyTo(null)}
                  className="text-gray-500 hover:text-white p-1 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input row */}
        <div className="flex items-end gap-2 px-3 py-2">
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            rows={1}
            className="flex-1 bg-brand-card border border-brand-border rounded-2xl px-4 py-2.5 text-white text-sm placeholder-gray-500 resize-none focus:outline-none focus:border-brand-accent transition-colors"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="w-10 h-10 rounded-full bg-brand-accent flex items-center justify-center shrink-0 disabled:opacity-30 transition-opacity active:scale-95"
          >
            <Send size={16} className="text-brand-bg translate-x-px" />
          </button>
        </div>
      </div>
    </>
  )
}
