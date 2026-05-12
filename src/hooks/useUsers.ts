import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

export interface ChatUser {
  uid: string
  displayName: string
  avatarUrl: string | null
}

export function useUsers() {
  const [users, setUsers] = useState<ChatUser[]>([])

  useEffect(() => {
    getDocs(collection(db, 'users')).then((snap) => {
      setUsers(
        snap.docs.map((d) => ({
          uid: d.id,
          displayName: d.data().displayName as string,
          avatarUrl: d.data().avatarUrl as string | null,
        })),
      )
    })
  }, [])

  return users
}
