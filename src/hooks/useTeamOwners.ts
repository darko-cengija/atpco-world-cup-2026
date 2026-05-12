import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '@/firebase'

// Returns a map of teamId → array of player display names
export function useTeamOwners(teamIds: string[]) {
  const [owners, setOwners] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (teamIds.length === 0) {
      setLoading(false)
      return
    }

    async function load() {
      const result: Record<string, string[]> = {}

      for (const teamId of teamIds) {
        const q = query(collection(db, 'playerTeams'), where('teamId', '==', teamId))
        const snap = await getDocs(q)

        const names: string[] = []
        for (const docSnap of snap.docs) {
          const { userId } = docSnap.data()
          const userSnap = await getDoc(doc(db, 'users', userId))
          if (userSnap.exists()) {
            names.push(userSnap.data().displayName ?? 'Unknown')
          }
        }
        result[teamId] = names
      }

      setOwners(result)
      setLoading(false)
    }

    load()
  }, [teamIds.join(',')])

  return { owners, loading }
}
