import { useEffect, useState } from 'react'
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  doc,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'
import type { ChatMessage, AppUser } from '@/types'

const MESSAGE_LIMIT = 200

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      orderBy('timestamp', 'asc'),
      limit(MESSAGE_LIMIT),
    )

    return onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => {
          const data = d.data()
          return {
            id: d.id,
            text: data.text as string,
            authorId: data.authorId as string,
            authorName: data.authorName as string,
            authorAvatar: (data.authorAvatar as string | null) ?? null,
            sentAt: (data.timestamp as Timestamp | null)?.toDate() ?? new Date(),
            replyTo: data.replyTo ?? undefined,
            mentions: (data.mentions as string[]) ?? [],
            reactions: (data.reactions as Record<string, string[]>) ?? {},
          }
        }),
      )
      setLoading(false)
    })
  }, [])

  async function sendMessage({
    text,
    user,
    replyTo,
    mentions,
  }: {
    text: string
    user: AppUser
    replyTo?: ChatMessage['replyTo']
    mentions: string[]
  }) {
    await addDoc(collection(db, 'messages'), {
      text,
      authorId: user.uid,
      authorName: user.displayName,
      authorAvatar: user.avatarUrl ?? null,
      timestamp: serverTimestamp(),
      ...(replyTo ? { replyTo } : {}),
      mentions,
    })
  }

  async function toggleReaction(
    msgId: string,
    reactions: Record<string, string[]>,
    emoji: string,
    userId: string,
  ) {
    const reactedEmojis = Object.entries(reactions)
      .filter(([, uids]) => uids.includes(userId))
      .map(([reactionEmoji]) => reactionEmoji)
    const isRemovingOnlyReaction = reactedEmojis.length === 1 && reactedEmojis[0] === emoji
    const updates: Record<string, ReturnType<typeof arrayUnion>> = {}

    if (isRemovingOnlyReaction) {
      updates[`reactions.${emoji}`] = arrayRemove(userId)
    } else {
      reactedEmojis
        .filter((reactionEmoji) => reactionEmoji !== emoji)
        .forEach((reactionEmoji) => {
          updates[`reactions.${reactionEmoji}`] = arrayRemove(userId)
        })

      if (!(reactions[emoji] ?? []).includes(userId)) {
        updates[`reactions.${emoji}`] = arrayUnion(userId)
      }
    }

    if (Object.keys(updates).length === 0) return
    await updateDoc(doc(db, 'messages', msgId), updates)
  }

  return { messages, loading, sendMessage, toggleReaction }
}
