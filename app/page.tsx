'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { SupportWall } from '@/components/SupportWalls'
import { SetupScreen } from '@/components/SetupScreen'
import { TeleprompterScreen } from '@/components/TeleprompterScreen'
import { AuthModal } from '@/components/modals/AuthModal'
import { ProfileModal } from '@/components/modals/ProfileModal'
import { LimitModal } from '@/components/modals/LimitModal'
import { StreakLostModal } from '@/components/modals/StreakLostModal'
import { useUserData } from '@/hooks/useUserData'

type Screen = 'setup' | 'teleprompter'

type ScriptEntry = {
  id: string
  script: string
  category: string
  level: string
  createdAt: number
  useCount: number
  userName?: string
}

export default function Home() {
  const { data: session } = useSession()
  const [screen, setScreen] = useState<Screen>('setup')
  const [currentScript, setCurrentScript] = useState('')
  const [showAuth, setShowAuth] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showLimit, setShowLimit] = useState(false)

  const {
    streak, longestStreak, updateStreak,
    streakLost, setStreakLost, prevStreak,
    favorites, toggleFavorite,
    userAvatar, userColor, updateAvatar,
  } = useUserData()

  const handleStartReading = (script: string) => {
    if (!script.trim()) return
    setCurrentScript(script)
    setScreen('teleprompter')
  }

  const handleUseScript = (entry: ScriptEntry) => {
    // handled inside SetupScreen
  }

  if (screen === 'teleprompter') {
    return (
      <TeleprompterScreen
        script={currentScript}
        streak={streak}
        onBack={() => setScreen('setup')}
        onStreakUpdate={updateStreak}
      />
    )
  }

  return (
    <>
      <SetupScreen
        streak={streak}
        userAvatar={userAvatar}
        userColor={userColor}
        favorites={favorites}
        onOpenAuth={() => setShowAuth(true)}
        onOpenProfile={() => setShowProfile(true)}
        onStartReading={handleStartReading}
        onToggleFavorite={toggleFavorite}
        onUseScript={handleUseScript}
        onLimitReached={() => setShowLimit(true)}
      />

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}

      {showProfile && (
        <ProfileModal
          onClose={() => setShowProfile(false)}
          streak={streak}
          longestStreak={longestStreak}
          userAvatar={userAvatar}
          userColor={userColor}
          onSaved={updateAvatar}
        />
      )}

      {showLimit && (
        <LimitModal
          session={session}
          onClose={() => setShowLimit(false)}
          onSignIn={() => { setShowLimit(false); setShowAuth(true) }}
        />
      )}

      {streakLost && (
        <StreakLostModal
          prevStreak={prevStreak}
          onClose={() => setStreakLost(false)}
        />
      )}

      <SupportWall />
    </>
  )
}