import { useEffect, useState, useMemo } from 'react'
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore'
import { db } from '@/firebase'

interface MessageMeta {
  authorId: string
  mentions: string[]
  sentAt: Date | null
}

export function useUnreadChat(userId: string | undefined, isReading = false) {
  // 'loading' = not yet received from Firestore
  const [lastReadAt, setLastReadAt] = useState<Date | null | 'loading'>('loading')
  const [messages, setMessages] = useState<MessageMeta[]>([])

  useEffect(() => {
    if (!userId) return
    return onSnapshot(doc(db, 'chatReads', userId), (snap) => {
      if (snap.exists()) {
        const ts = snap.data().lastReadAt as Timestamp | null
        setLastReadAt(ts ? ts.toDate() : null)
      } else {
        setLastReadAt(null)
      }
    })
  }, [userId])

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'desc'), limit(200))
    return onSnapshot(q, (snap) => {
      setMessages(
        snap.docs.map((d) => ({
          authorId: d.data().authorId as string,
          mentions: (d.data().mentions as string[]) ?? [],
          sentAt: (d.data().timestamp as Timestamp | null)?.toDate() ?? null,
        })),
      )
    })
  }, [])

  const { unreadCount, mentionCount } = useMemo(() => {
    if (!userId || lastReadAt === 'loading') return { unreadCount: 0, mentionCount: 0 }
    const unread = messages.filter(
      (m) =>
        m.authorId !== userId &&
        (lastReadAt === null || (m.sentAt !== null && m.sentAt > lastReadAt)),
    )
    return {
      unreadCount: unread.length,
      mentionCount: unread.filter((m) => m.mentions.includes(userId)).length,
    }
  }, [messages, lastReadAt, userId])

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nav = navigator as any
    if (!('setAppBadge' in navigator)) return
    const effective = isReading ? 0 : unreadCount
    if (effective > 0) {
      nav.setAppBadge(effective)
    } else {
      nav.clearAppBadge?.()
    }
  }, [unreadCount, isReading])

  const effective = isReading ? 0 : unreadCount
  const effectiveMentions = isReading ? 0 : mentionCount
  return { unreadCount: effective, mentionCount: effectiveMentions }
}
