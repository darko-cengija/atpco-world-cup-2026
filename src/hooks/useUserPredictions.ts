import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import type { Prediction } from '@/types'

// Returns all predictions made by a specific user, keyed by matchId
export function useUserPredictions(userId: string | undefined) {
  const [predictions, setPredictions] = useState<Record<string, Prediction>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const q = query(collection(db, 'predictions'), where('userId', '==', userId))

    const unsubscribe = onSnapshot(q, (snap) => {
      const result: Record<string, Prediction> = {}
      snap.docs.forEach((d) => {
        const data = d.data()
        result[data.matchId] = {
          id: d.id,
          matchId: data.matchId,
          userId: data.userId,
          outcome: data.outcome,
          submittedAt: data.submittedAt.toDate(),
        }
      })
      setPredictions(result)
      setLoading(false)
    })

    return unsubscribe
  }, [userId])

  return { predictions, loading }
}
