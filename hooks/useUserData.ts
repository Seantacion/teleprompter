import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'

export function useUserData() {
  const { data: session } = useSession()
  const [streak, setStreak] = useState(0)
  const [longestStreak, setLongestStreak] = useState(0)
  const [streakLost, setStreakLost] = useState(false)
  const [prevStreak, setPrevStreak] = useState(0)
  const [favorites, setFavorites] = useState<string[]>([])
  const [userAvatar, setUserAvatar] = useState('')
  const [userColor, setUserColor] = useState('#d4f564')

  useEffect(() => {
    if (!session?.user?.id) {
      const saved = localStorage.getItem('favorites')
      if (saved) setFavorites(JSON.parse(saved))
      return
    }

    const id = session.user.id

    // load avatar & color dari localStorage
    const savedAvatar = localStorage.getItem(`avatar:${id}`)
    if (savedAvatar) setUserAvatar(savedAvatar)
    const savedColor = localStorage.getItem(`color:${id}`)
    if (savedColor) setUserColor(savedColor)

    // fetch streak & favorites paralel
    Promise.all([
      fetch('/api/streak').then(r => r.json()),
      fetch('/api/favorites').then(r => r.json()),
    ]).then(([streakData, favData]) => {
      setStreak(streakData.streak)
      setLongestStreak(streakData.longest)
      if (streakData.wasReset && streakData.prevStreak > 1) {
        setStreakLost(true)
        setPrevStreak(streakData.prevStreak)
      }
      setFavorites(favData.favorites ?? [])
    })
  }, [session?.user?.id])

  const toggleFavorite = (id: string) => {
    if (session?.user?.id) {
      fetch('/api/favorites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
        .then(r => r.json())
        .then(d => setFavorites(d.favorites))
    } else {
      setFavorites(prev => {
        const next = prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        localStorage.setItem('favorites', JSON.stringify(next))
        return next
      })
    }
  }

  const updateStreak = (data: { streak: number; longest: number }) => {
    setStreak(data.streak)
    setLongestStreak(data.longest)
  }

  const updateAvatar = (avatar: string, color: string) => {
    setUserAvatar(avatar)
    setUserColor(color)
  }

  return {
    streak, setStreak, longestStreak, setLongestStreak,
    streakLost, setStreakLost, prevStreak,
    favorites, toggleFavorite,
    userAvatar, userColor, updateAvatar, updateStreak,
  }
}