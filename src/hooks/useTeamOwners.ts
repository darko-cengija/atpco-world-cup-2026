import { useEffect, useMemo, useState } from 'react'
import { collection, documentId, query, where, getDocs } from 'firebase/firestore'
import { db } from '@/firebase'

const FIRESTORE_IN_QUERY_LIMIT = 30

// Returns a map of teamId → array of player display names
export function useTeamOwners(teamIds: string[]) {
  const [owners, setOwners] = useState<Record<string, string[]>>({})
  const [loading, setLoading] = useState(true)
  const teamIdKey = useMemo(
    () => [...new Set(teamIds)].sort().join(','),
    [teamIds],
  )

  useEffect(() => {
    const uniqueTeamIds = teamIdKey.length > 0 ? teamIdKey.split(',') : []

    if (uniqueTeamIds.length === 0) {
      setOwners({})
      setLoading(false)
      return
    }

    let disposed = false
    setLoading(true)
    setOwners(Object.fromEntries(uniqueTeamIds.map((teamId) => [teamId, []])))

    async function load() {
      try {
        const ownerIdsByTeamId: Record<string, string[]> = Object.fromEntries(
          uniqueTeamIds.map((teamId) => [teamId, []]),
        )
        const ownerIds = new Set<string>()

        await Promise.all(
          chunk(uniqueTeamIds, FIRESTORE_IN_QUERY_LIMIT).map(async (ids) => {
            const snap = await getDocs(query(
              collection(db, 'playerTeams'),
              where('teamId', 'in', ids),
            ))

            for (const assignmentDoc of snap.docs) {
              const { teamId, userId } = assignmentDoc.data() as { teamId?: string; userId?: string }
              if (!teamId || !userId || !ownerIdsByTeamId[teamId]) continue

              ownerIdsByTeamId[teamId].push(userId)
              ownerIds.add(userId)
            }
          }),
        )

        const ownerNamesById: Record<string, string> = {}

        await Promise.all(
          chunk([...ownerIds], FIRESTORE_IN_QUERY_LIMIT).map(async (ids) => {
            const snap = await getDocs(query(
              collection(db, 'users'),
              where(documentId(), 'in', ids),
            ))

            for (const userDoc of snap.docs) {
              ownerNamesById[userDoc.id] = userDoc.data().displayName ?? 'Unknown'
            }
          }),
        )

        const result: Record<string, string[]> = {}
        for (const teamId of uniqueTeamIds) {
          result[teamId] = ownerIdsByTeamId[teamId].map((ownerId) => ownerNamesById[ownerId] ?? 'Unknown')
        }

        if (!disposed) {
          setOwners(result)
          setLoading(false)
        }
      } catch (err) {
        console.error('Failed to load team owners.', err)
        if (!disposed) {
          setLoading(false)
          setOwners((current) => current)
        }
      }
    }

    void load()

    return () => {
      disposed = true
    }
  }, [teamIdKey])

  return { owners, loading }
}

function chunk<T>(items: T[], size: number) {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size))
  }
  return chunks
}
