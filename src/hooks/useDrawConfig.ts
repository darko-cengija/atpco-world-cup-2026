import { useEffect, useState } from 'react'
import { doc, onSnapshot } from 'firebase/firestore'
import { db } from '@/firebase'
import type { DrawConfig } from '@/types'

export function useDrawConfig() {
  const [config, setConfig] = useState<DrawConfig>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    return onSnapshot(doc(db, 'config', 'app'), (snap) => {
      setConfig(snap.exists() ? (snap.data() as DrawConfig) : {})
      setLoading(false)
    })
  }, [])

  return { config, loading }
}
