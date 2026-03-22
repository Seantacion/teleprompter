import { useRef } from 'react'
import { useSession } from 'next-auth/react'

export function useStreak(onUpdate: (data: { streak: number; longest: number }) => void) {
  const { data: session } = useSession()
  const streakCalledRef = useRef(false)

  const tryTriggerStreak = (progress: number) => {
    if (progress >= 0.5 && !streakCalledRef.current && session?.user?.id) {
      streakCalledRef.current = true
      fetch('/api/streak', { method: 'POST' })
        .then(r => r.json())
        .then(onUpdate)
    }
  }

  const reset = () => { streakCalledRef.current = false }

  return { tryTriggerStreak, reset }
}