'use client'

import { SupportWall } from '@/components/SupportWalls'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession, signOut, signIn } from 'next-auth/react'

const CATEGORIES = [
  { id: 'introduction', label: 'Self Introduction', emoji: '👋' },
  { id: 'daily', label: 'Daily Routine', emoji: '☀️' },
  { id: 'opinion', label: 'Share Opinion', emoji: '💬' },
  { id: 'story', label: 'Tell a Story', emoji: '📖' },
  { id: 'interview', label: 'Job Interview', emoji: '💼' },
  { id: 'travel', label: 'Travel Talk', emoji: '✈️' },
  { id: 'motivation', label: 'Motivation', emoji: '🔥' },
  { id: 'custom', label: 'Custom Topic', emoji: '✏️' },
]

const LEVELS_SIMPLE = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]

const LEVELS_CEFR = [
  { id: 'a1', label: 'A1', desc: 'Beginner' },
  { id: 'a2', label: 'A2', desc: 'Elementary' },
  { id: 'b1', label: 'B1', desc: 'Intermediate' },
  { id: 'b2', label: 'B2', desc: 'Upper Intermediate' },
  { id: 'c1', label: 'C1', desc: 'Advanced' },
  { id: 'c2', label: 'C2', desc: 'Proficient' },
]

const PRESET_AVATARS = ['🐻', '🦊', '🐼', '🦁', '🐯', '🐨', '🦉', '🐸', '🐙', '🦋', '🌊', '🔥']
const PRESET_COLORS = ['#d4f564', '#94a3b8', '#a78bfa', '#38bdf8', '#fb923c', '#4ade80']

type Screen = 'setup' | 'teleprompter' | 'history'

type ScriptEntry = {
  id: string
  script: string
  category: string
  level: string
  createdAt: number
  useCount: number
  userName?: string
}

const btn = (active: boolean, accent = false) => ({
  background: accent && active ? 'var(--accent)' : active ? 'var(--accent-dim)' : 'var(--surface)',
  border: '1px solid ' + (accent && active ? 'var(--accent)' : active ? 'var(--accent-border)' : 'var(--border)'),
  color: accent && active ? '#0c0c0e' : active ? 'var(--accent)' : 'var(--text-muted)',
  borderRadius: 10,
  cursor: 'pointer',
  fontFamily: 'var(--font-display)',
  fontWeight: active ? 600 : 400,
  transition: 'all 0.15s',
})

export default function Home() {
  const [screen, setScreen] = useState<Screen>('setup')
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate')
  const [category, setCategory] = useState('introduction')
  const [level, setLevel] = useState('intermediate')
  const [customPrompt, setCustomPrompt] = useState('')
  const [script, setScript] = useState('')
  const [generating, setGenerating] = useState(false)
  const [speed, setSpeed] = useState(50)
  const [fontSize, setFontSize] = useState(28)
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(0)
  const [done, setDone] = useState(false)
  const [levelMode, setLevelMode] = useState<'simple' | 'cefr'>('simple')
  const [historyLevelMode, setHistoryLevelMode] = useState<'simple' | 'cefr'>('simple')
  const [timer, setTimer] = useState(0)
  const [favorites, setFavorites] = useState<string[]>([])
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [page, setPage] = useState(1)
  const PER_PAGE = 10
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [copiedScript, setCopiedScript] = useState(false)

  const { data: session, update } = useSession()

  // History
  const [historyCategory, setHistoryCategory] = useState('all')
  const [historyLevel, setHistoryLevel] = useState('all')
  const [historyScripts, setHistoryScripts] = useState<ScriptEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const scrollerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const lastTsRef = useRef<number>(0)
  const posRef = useRef(0)
  const playingRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  const [limitReached, setLimitReached] = useState(false)

  const displayedScripts = showFavoritesOnly 
  ? historyScripts.filter(s => favorites.includes(s.id)) 
  : historyScripts

  // Auth
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin')
  const [authName, setAuthName] = useState('')
  const [authEmail, setAuthEmail] = useState('')
  const [authPassword, setAuthPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [authLoading, setAuthLoading] = useState(false)

  // Profile
  const [showProfile, setShowProfile] = useState(false)
  const [profileName, setProfileName] = useState('')
  const [profilePassword, setProfilePassword] = useState('')
  const [profileNewPassword, setProfileNewPassword] = useState('')
  const [profileAvatar, setProfileAvatar] = useState('')
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState('')
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [userAvatar, setUserAvatar] = useState<string>(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem(`avatar:${session?.user?.id}`) ?? ''
  })
  const [profileColor, setProfileColor] = useState('#d4f564')
  const [userColor, setUserColor] = useState('#d4f564')

  // Streak
  const [streak, setStreak] = useState(0)
  const streakCalledRef = useRef(false)
  const [longestStreak, setLongestStreak] = useState(0)
  const [streakLost, setStreakLost] = useState(false)
  const [prevStreak, setPrevStreak] = useState(0)

  const paginatedScripts = displayedScripts.slice(0, page * PER_PAGE)
  const hasMore = displayedScripts.length > page * PER_PAGE

  const fetchHistory = useCallback(async (cat: string, lvl: string) => {
    setHistoryLoading(true)
    try {
      const res = await fetch(`/api/scripts?category=${cat}&level=${lvl}`)
      const data = await res.json()
      setHistoryScripts(data.scripts ?? [])
    } catch { setHistoryScripts([]) }
    setHistoryLoading(false)
  }, [])

  useEffect(() => {
    if (activeTab === 'history') fetchHistory(historyCategory, historyLevel)
  }, [activeTab, historyCategory, historyLevel, fetchHistory])

  const loadFromHistory = async (entry: ScriptEntry) => {
    // Increment use count
    fetch('/api/scripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: entry.id }),
    })
    setScript(entry.script)
    setCategory(entry.category)
    setLevel(entry.level)
    setActiveTab('generate')
  }

  const generateScript = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, customPrompt, level }),
      })

      if (res.status === 429) {
        setLimitReached(true)
        setGenerating(false)
        return
      }
      const data = await res.json()
      setScript(data.script)
    } catch {
      setScript('Failed to generate. Please check your connection and try again.')
    }
    setGenerating(false)
  }

  const startTeleprompter = () => {
    if (!script.trim()) return
    posRef.current = 0
    setPos(0)
    setDone(false)
    setPlaying(false)
    streakCalledRef.current = false
    playingRef.current = false
    setScreen('teleprompter')
  }

  const getTotalHeight = useCallback(() => {
    const scroller = scrollerRef.current
    const stage = stageRef.current
    if (!scroller || !stage) return 0
    return scroller.scrollHeight + stage.clientHeight
  }, [])

  const animate = useCallback((ts: number) => {
    if (!playingRef.current) return
    if (!lastTsRef.current) lastTsRef.current = ts
    const delta = ts - lastTsRef.current
    lastTsRef.current = ts
    posRef.current += (speed / 1000) * delta
    setPos(posRef.current)
    if (posRef.current >= getTotalHeight()) {
      playingRef.current = false
      setPlaying(false)
      setDone(true)
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }
    // streak trigger pas 50%
    const progress = posRef.current / getTotalHeight()
    if (progress >= 0.5 && !streakCalledRef.current && session?.user?.id) {
      streakCalledRef.current = true
      fetch('/api/streak', { method: 'POST' })
        .then(r => r.json())
        .then(d => { setStreak(d.streak); setLongestStreak(d.longest) })
    }
    animRef.current = requestAnimationFrame(animate)
  }, [speed, getTotalHeight])

  useEffect(() => {
    if (playing) {
      lastTsRef.current = 0
      animRef.current = requestAnimationFrame(animate)
    } else {
      cancelAnimationFrame(animRef.current)
    }
    return () => cancelAnimationFrame(animRef.current)
  }, [playing, animate])

  // pas togglePlay, tambah logic timer
  const togglePlay = () => {
    const next = !playing
    playingRef.current = next
    setPlaying(next)
    if (next) {
      lastTsRef.current = 0
      timerRef.current = setInterval(() => setTimer(t => t + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const resetScroll = () => {
    cancelAnimationFrame(animRef.current)
    streakCalledRef.current = false
    playingRef.current = false
    setPlaying(false)
    setDone(false)
    posRef.current = 0
    setPos(0)
    if (timerRef.current) clearInterval(timerRef.current)
    setTimer(0)
  }

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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleAuth = async () => {
    setAuthError('')
    setAuthLoading(true)
  
    if (authMode === 'register') {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: authName, email: authEmail, password: authPassword }),
      })
      const data = await res.json()
      if (!res.ok) { setAuthError(data.error); setAuthLoading(false); return }
    }
  
    const result = await signIn('credentials', {
      email: authEmail, password: authPassword, redirect: false,
    })
  
    setAuthLoading(false)
    if (result?.error) { setAuthError('Invalid email or password'); return }
    setShowAuth(false)
  }

  const saveProfile = async () => {
    setProfileSaving(true)
    setProfileError('')
    setProfileSuccess(false)
  
    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: profileName,
        password: profilePassword,
        newPassword: profileNewPassword,
        image: profileAvatar || undefined,
      }),
    })
  
    const data = await res.json()
    setProfileSaving(false)
    if (!res.ok) { setProfileError(data.error); return }
    setProfileSuccess(true)
    if (profileAvatar) {
      localStorage.setItem(`avatar:${session?.user?.id}`, profileAvatar)
      setUserAvatar(profileAvatar)
      localStorage.setItem(`color:${session?.user?.id}`, profileColor)
      setUserColor(profileColor)
    }
    await update({ image: profileAvatar || undefined, name: profileName })
    setTimeout(() => setProfileSuccess(false), 2000)
  }

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/favorites')
        .then(r => r.json())
        .then(d => setFavorites(d.favorites))
    } else {
      const saved = localStorage.getItem('favorites')
      if (saved) setFavorites(JSON.parse(saved))
    }
  }, [session?.user?.id])

  useEffect(() => {
    if (session?.user?.id) {
      const saved = localStorage.getItem(`avatar:${session.user.id}`)
      if (saved) setUserAvatar(saved)
      const savedColor = localStorage.getItem(`color:${session.user.id}`) // tambahin ini
      if (savedColor) setUserColor(savedColor)       
    }
  }, [session?.user?.id])

  const [stageH, setStageH] = useState(400)
  const translateY = stageH / 2 - pos

  useEffect(() => {
    if (!stageRef.current) return
    
    const observer = new ResizeObserver(entries => {
      setStageH(entries[0].contentRect.height)
    })
    
    observer.observe(stageRef.current)
    return () => observer.disconnect()
  }, [screen])

  useEffect(() => {
    if (session?.user?.id) {
      fetch('/api/streak')
        .then(r => r.json())
        .then(d => {
          setStreak(d.streak)
          setLongestStreak(d.longest)
          setPrevStreak(d.prevStreak ?? 0)
          if (d.prevStreak > 1 && d.streak === 1 && d.wasReset) {
            setStreakLost(true)
          }
        })
    }
  }, [session?.user?.id])

  const getReadingTime = (text: string) => {
    const words = text.trim().split(/\s+/).filter(Boolean).length
    const seconds = Math.round((words / 130) * 60)
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return { words, duration: m > 0 ? `~${m}m ${s}s` : `~${s}s` }
  }

  useEffect(() => { setPage(1) }, [historyCategory, historyLevel, showFavoritesOnly])

  // ── Teleprompter screen ──
  if (screen === 'teleprompter') {
    return (
      <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <button onClick={() => { resetScroll(); setScreen('setup') }} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
            ← Back
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>NATHING</span>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
            </span>
            {session && streak > 0 && (
              <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>
                🔥 {streak}
              </span>
            )}
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              {Math.round((pos / getTotalHeight()) * 100)}%
            </span>
          </div>
        </div>

        <div ref={stageRef} style={{ flex: 1, overflow: 'hidden', position: 'relative', cursor: playing ? 'none' : 'default' }} onClick={togglePlay}>
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to bottom, var(--bg), transparent)', zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 120, background: 'linear-gradient(to top, var(--bg), transparent)', zIndex: 2, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '50%', left: '5%', right: '5%', height: '1px', background: 'var(--accent-border)', zIndex: 1, transform: 'translateY(-20px)' }} />

          <div ref={scrollerRef} style={{ position: 'absolute', left: 0, right: 0, padding: '0 24px', transform: `translateY(${translateY}px)`, willChange: 'transform' }}>
            <p style={{ fontSize, lineHeight: 1.65, color: 'var(--text)', fontFamily: 'var(--font-display)', fontWeight: 500, textAlign: 'center', whiteSpace: 'pre-wrap' }}>
              {script}
            </p>
          </div>

          {!playing && !done && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ background: 'rgba(12,12,14,0.7)', backdropFilter: 'blur(8px)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 28px', fontSize: 15, color: 'var(--text-muted)' }}>
                {pos === 0 ? 'Tap to start' : 'Tap to continue'}
              </div>
            </div>
          )}

          {done && (
            <div style={{ position: 'absolute', inset: 0, zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
              <div style={{ fontSize: 40 }}>🎉</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--accent)' }}>Great job!</div>
              <button onClick={(e) => { e.stopPropagation(); resetScroll() }} style={{ marginTop: 8, background: 'var(--accent)', color: '#0c0c0e', border: 'none', borderRadius: 10, padding: '10px 24px', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
                Read Again
              </button>
            </div>
          )}
        </div>

        <div style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)', padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>SPEED</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{speed}</span>
              </div>
              <input type="range" min={10} max={150} step={5} value={speed} onChange={e => setSpeed(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>SIZE</span>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{fontSize}px</span>
              </div>
              <input type="range" min={16} max={44} step={2} value={fontSize} onChange={e => setFontSize(Number(e.target.value))} style={{ width: '100%', accentColor: 'var(--accent)' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={togglePlay} style={{ flex: 1, background: playing ? 'var(--surface2)' : 'var(--accent)', color: playing ? 'var(--text)' : '#0c0c0e', border: '1px solid ' + (playing ? 'var(--border)' : 'var(--accent)'), borderRadius: 10, padding: 11, fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <button onClick={resetScroll} style={{ background: 'var(--surface2)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 10, padding: '11px 16px', fontSize: 14, fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
              Reset
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── Setup screen ──
  return (
    <>
    {limitReached && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px', maxWidth: 360, width: '100%', display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 36 }}>⚡</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Daily limit reached</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {session 
              ? "You've used all 25 generations for today. Come back tomorrow or browse History for existing scripts." 
              : "You've used all 5 free generations for today. Sign in to get 25/day, browse scripts in History, or write your own in the script box."}
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {!session && (
              <button onClick={() => { setLimitReached(false); setShowAuth(true) }} style={{ display: 'block', width: '100%', padding: '12px', background: 'var(--accent)', color: '#0c0c0e', borderRadius: 10, fontSize: 14, fontWeight: 700, border: 'none', fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
                Sign in / Register
              </button>
            )}
            <button onClick={() => setLimitReached(false)} style={{ padding: '11px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
              Close
            </button>
          </div>
        </div>
      </div>
    )}
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '32px 20px 16px' }}>
        <div className='flex justify-between'>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.15em', marginBottom: 8 }}>NATHING</div>
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {session && streak > 0 && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 999, padding: '3px 10px' }}>
                  <span style={{ fontSize: 13 }}>🔥</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{streak}</span>
                </div>
              )}
              <div onClick={() => { 
                  setProfileName(session.user?.name ?? '')
                  setProfileAvatar(userAvatar)
                  setProfileColor(userColor)
                  setShowProfile(true)  
                }}
                style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                {userAvatar
                  ? userAvatar.startsWith('http') || userAvatar.startsWith('data')
                    ? <img src={userAvatar} width={32} height={32} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                    : <span style={{ fontSize: 18 }}>{userAvatar}</span>
                  : session.user?.image
                    ? <img src={session.user.image} width={32} height={32} style={{ width: '100%', height: '100%', objectFit: 'cover' }} referrerPolicy="no-referrer" />
                    : <span style={{ fontSize: 14, fontWeight: 700, color: '#0c0c0e' }}>{(session.user?.name?.[0] ?? '?').toUpperCase()}</span>
                }
              </div>
            </div>
          ) : (
            <span onClick={() => setShowAuth(true)} style={{ fontSize: 13, color: 'var(--accent)', cursor: 'pointer' }}>
              Sign in →
            </span>
          )}
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {session ? (() => {
            const hour = new Date().getHours()
            const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
            const name = session.user?.name?.split(' ')[0] ?? 'there'
            return <>
              <span style={{ fontSize: 22, fontWeight: 800 }}>{greeting},</span>
              <br />
              {name}.
            </>
          })() : <>Speak<br />English Freely</>}
        </h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>Practice speaking English fluently.</p>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, padding: '0 20px', marginBottom: 20 }}>
        {(['generate', 'history'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{ ...btn(activeTab === tab), flex: 1, padding: '9px', fontSize: 13, textTransform: 'capitalize' }}>
            {tab === 'generate' ? '✦ Generate' : '📚 History'}
          </button>
        ))}
      </div>

      <div style={{ padding: '0 20px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ── GENERATE TAB ── */}
        {activeTab === 'generate' && (
          <>
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 10 }}>CATEGORY</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {CATEGORIES.map(cat => (
                  <button key={cat.id} onClick={() => setCategory(cat.id)} style={{ ...btn(category === cat.id), padding: '10px 12px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                    <span style={{ fontSize: 16 }}>{cat.emoji}</span>{cat.label}
                  </button>
                ))}
              </div>
            </div>

            {category === 'custom' && (
              <div className="animate-fadeUp">
                <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 8 }}>YOUR TOPIC</div>
                <textarea value={customPrompt} onChange={e => setCustomPrompt(e.target.value)} placeholder="e.g. Talk about my experience learning programming..." rows={3} style={{ width: '100%', padding: 12, fontSize: 14, resize: 'none', lineHeight: 1.5 }} />
              </div>
            )}

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>DIFFICULTY</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: levelMode === 'simple' ? 'var(--accent)' : 'var(--text-dim)' }}>Simple</span>
                  <div onClick={() => { setLevelMode(m => m === 'simple' ? 'cefr' : 'simple'); setLevel(levelMode === 'simple' ? 'b1' : 'intermediate') }}
                    style={{ width: 36, height: 20, borderRadius: 999, background: levelMode === 'cefr' ? 'var(--accent)' : 'var(--surface2)', border: '1px solid var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: 2, left: levelMode === 'cefr' ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: levelMode === 'cefr' ? '#0c0c0e' : 'var(--text-muted)', transition: 'left 0.2s' }} />
                  </div>
                  <span style={{ fontSize: 11, color: levelMode === 'cefr' ? 'var(--accent)' : 'var(--text-dim)' }}>CEFR</span>
                </div>
              </div>
              {levelMode === 'simple' ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  {LEVELS_SIMPLE.map(l => (
                    <button key={l.id} onClick={() => setLevel(l.id)} style={{ ...btn(level === l.id), flex: 1, padding: 9, fontSize: 13 }}>{l.label}</button>
                  ))}
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {LEVELS_CEFR.map(l => (
                    <button key={l.id} onClick={() => setLevel(l.id)} style={{ ...btn(level === l.id), padding: '8px 4px', fontSize: 13, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <span style={{ fontWeight: 700 }}>{l.label}</span>
                      <span style={{ fontSize: 10, opacity: 0.7 }}>{l.desc}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button onClick={generateScript} disabled={generating || (category === 'custom' && !customPrompt.trim())} style={{ width: '100%', padding: 14, background: generating ? 'var(--surface2)' : 'var(--accent)', color: generating ? 'var(--text-muted)' : '#0c0c0e', border: 'none', borderRadius: 12, fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', cursor: generating ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {generating ? (
                <><span style={{ width: 16, height: 16, border: '2px solid var(--border)', borderTopColor: 'var(--text-muted)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Generating...</>
              ) : '✦ Generate with AI'}
            </button>

            {script ? (
              <div className="animate-fadeUp">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>SCRIPT</div>
                  {script && (
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-dim)' }}>
                      <span>{getReadingTime(script).words} words</span>
                      <span>{getReadingTime(script).duration} to speak</span>
                    </div>
                  )}
                </div>
                <textarea value={script} onChange={e => setScript(e.target.value)} rows={8} style={{ width: '100%', padding: 14, fontSize: 14, lineHeight: 1.7, resize: 'vertical' }} />
              </div>
            ) : (
              <div>
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>or write your own</div>
                <textarea value={script} onChange={e => setScript(e.target.value)} placeholder="Write your own script here..." rows={5} style={{ width: '100%', padding: 12, fontSize: 14, lineHeight: 1.7, resize: 'vertical' }} />
              </div>
            )}

            
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { navigator.clipboard.writeText(script); setCopiedScript(true); setTimeout(() => setCopiedScript(false), 1500) }} style={{ ...btn(false), padding: 14, fontSize: 15 }}>
                {copiedScript ? 'Copied!' : 'Copy'}
              </button>
              <button onClick={startTeleprompter} disabled={!script.trim()} style={{ flex: 1, padding: 14, background: script.trim() ? 'var(--surface2)' : 'var(--surface)', color: script.trim() ? 'var(--text)' : 'var(--text-dim)', border: '1px solid ' + (script.trim() ? 'var(--border-hover)' : 'var(--border)'), borderRadius: 12, fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', cursor: script.trim() ? 'pointer' : 'not-allowed' }}>
                Start Reading →
              </button>
            </div>
            {/* saweria */}
            <div style={{ margin:"12px 0px", padding: "8px 16px 12px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>barangkali aja ini mah</span>
              <a href="https://saweria.co/nathing" target="_blank" style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", textDecoration: "none", fontWeight: 600 }}>
                saweria ↗
              </a>
            </div>
          </>
        )}

        {/* ── HISTORY TAB ── */}
        {activeTab === 'history' && (
          <>
            {/* Filter by category */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[{ id: 'all', label: 'All', emoji: '🗂️' }, ...CATEGORIES].map(cat => (
                <button key={cat.id} onClick={() => setHistoryCategory(cat.id)} style={{ ...btn(historyCategory === cat.id), padding: '7px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{cat.emoji}</span>{cat.label}
                </button>
              ))}
            </div>

            {/* Filter by level */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>LEVEL</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: historyLevelMode === 'simple' ? 'var(--accent)' : 'var(--text-dim)' }}>Simple</span>
                  <div onClick={() => { setHistoryLevelMode(m => m === 'simple' ? 'cefr' : 'simple'); setHistoryLevel('all') }}
                    style={{ width: 36, height: 20, borderRadius: 999, background: historyLevelMode === 'cefr' ? 'var(--accent)' : 'var(--surface2)', border: '1px solid var(--border)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' }}>
                    <div style={{ position: 'absolute', top: 2, left: historyLevelMode === 'cefr' ? 18 : 2, width: 14, height: 14, borderRadius: '50%', background: historyLevelMode === 'cefr' ? '#0c0c0e' : 'var(--text-muted)', transition: 'left 0.2s' }} />
                  </div>
                  <span style={{ fontSize: 11, color: historyLevelMode === 'cefr' ? 'var(--accent)' : 'var(--text-dim)' }}>CEFR</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ id: 'all', label: 'All' }, ...(historyLevelMode === 'simple' ? LEVELS_SIMPLE : LEVELS_CEFR)].map(l => (
                  <button key={l.id} onClick={() => setHistoryLevel(l.id)} style={{ ...btn(historyLevel === l.id), flex: 1, padding: 9, fontSize: 13 }}>{l.label}</button>
                ))}
                <button onClick={() => setShowFavoritesOnly(f => !f)} style={{ ...btn(showFavoritesOnly), padding: '7px 12px', fontSize: 12, alignSelf: 'flex-start' }}>
                  ★ Favorites only
                </button>
              </div>
            </div>

            {/* Script list */}
            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)', fontSize: 14 }}>Loading...</div>
            ) : displayedScripts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)', fontSize: 14 }}>
                No scripts yet for this filter.<br />
                <span style={{ fontSize: 12 }}>Generate one first!</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {paginatedScripts.map(entry => {
                  const catInfo = CATEGORIES.find(c => c.id === entry.category)
                  const expanded = expandedId === entry.id
                  const preview = entry.script.slice(0, 100) + (entry.script.length > 100 ? '…' : '')
                  return (
                    <div key={entry.id} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {/* Meta */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13 }}>{catInfo?.emoji}</span>
                          <span style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 999, padding: '2px 8px' }}>{catInfo?.label ?? entry.category}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface2)', borderRadius: 999, padding: '2px 8px', textTransform: 'capitalize' }}>{entry.level}</span>
                          {entry.userName && (
                            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>by {entry.userName}</span>
                          )}
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                          {(() => {
                            const diff = Date.now() - entry.createdAt
                            const hours = Math.floor(diff / 3600000)
                            if (hours < 1) return 'just now'
                            if (hours < 24) return `${hours}h ago`
                            return new Date(entry.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                          })()}
                        </span>
                      </div>
                      {/* Preview / full */}
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {expanded ? entry.script : preview}
                      </p>
                      <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                        {getReadingTime(entry.script).words} words · {getReadingTime(entry.script).duration}
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => toggleFavorite(entry.id)} style={{ ...btn(favorites.includes(entry.id)), padding: '7px 10px', fontSize: 14 }}>
                          {favorites.includes(entry.id) ? '★' : '☆'}
                        </button>
                        <button onClick={() => setExpandedId(expanded ? null : entry.id)} style={{ ...btn(false), padding: '7px 12px', fontSize: 12 }}>
                          {expanded ? 'Collapse' : 'Read more'}
                        </button>
                        <button onClick={() => handleCopy(entry.script, entry.id)} style={{ ...btn(false), padding: '7px 10px', fontSize: 12 }}>
                          {copiedId === entry.id ? 'Copied!' : 'Copy'}
                        </button>
                        <button onClick={() => loadFromHistory(entry)} style={{ ...btn(true), padding: '7px 12px', fontSize: 12, flex: 1 }}>
                          Use this script →
                        </button>
                      </div>
                    </div>
                  )
                })}
                {hasMore && (
                  <button onClick={() => setPage(p => p + 1)} style={{ ...btn(false), width: '100%', padding: '10px', fontSize: 13 }}>
                    Load more
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
    {showAuth && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px', maxWidth: 380, width: '100%', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>{authMode === 'signin' ? 'Welcome back' : 'Create account'}</div>
            <button onClick={() => setShowAuth(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>×</button>
          </div>

          <button onClick={() => signIn('google', { callbackUrl: '/' })} style={{ width: '100%', padding: 11, background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font-display)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <svg width="16" height="16" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/><path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/></svg>
            Continue with Google
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          {authMode === 'register' && (
            <input value={authName} onChange={e => setAuthName(e.target.value)} placeholder="Full name" style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10 }} />
          )}
          <input value={authEmail} onChange={e => setAuthEmail(e.target.value)} placeholder="Email" type="email" style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10 }} />
          <input value={authPassword} onChange={e => setAuthPassword(e.target.value)} placeholder="Password" type="password" style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10 }} />

          {authError && <div style={{ fontSize: 13, color: 'var(--red)' }}>{authError}</div>}

          <button onClick={handleAuth} disabled={authLoading} style={{ width: '100%', padding: 12, background: 'var(--accent)', color: '#0c0c0e', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', cursor: authLoading ? 'not-allowed' : 'pointer', opacity: authLoading ? 0.7 : 1 }}>
            {authLoading ? 'Please wait...' : authMode === 'signin' ? 'Sign in' : 'Create account'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
            {authMode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
            <span onClick={() => { setAuthMode(m => m === 'signin' ? 'register' : 'signin'); setAuthError('') }} style={{ color: 'var(--accent)', cursor: 'pointer' }}>
              {authMode === 'signin' ? 'Register' : 'Sign in'}
            </span>
          </div>
        </div>
      </div>
    )}
    {showProfile && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px', maxWidth: 380, width: '100%', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '90svh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Edit Profile</div>
            <button onClick={() => setShowProfile(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 20, cursor: 'pointer' }}>×</button>
          </div>

          {/* Avatar preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: profileColor, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, overflow: 'hidden' }}>
              {profileAvatar
                ? profileAvatar.startsWith('http') || profileAvatar.startsWith('data')
                  ? <img src={profileAvatar} width={56} height={56} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                  : <span>{profileAvatar}</span>
                : <span style={{ fontSize: 14, fontWeight: 700, color: '#0c0c0e' }}>{(session?.user?.name?.[0] ?? '?').toUpperCase()}</span>
              }
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <div style={{ fontWeight: 600, color: 'var(--text)' }}>{session?.user?.name}</div>
              <div>{session?.user?.email}</div>
            </div>
          </div>

          {/* Preset emoji */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 8 }}>PICK AVATAR</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PRESET_AVATARS.map(a => (
                <button key={a} onClick={() => setProfileAvatar(a)} style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid ' + (profileAvatar === a ? 'var(--accent)' : 'var(--border)'), background: profileAvatar === a ? 'var(--accent-dim)' : 'var(--surface2)', fontSize: 20, cursor: 'pointer' }}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Colors */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 8 }}>AVATAR COLOR</div>
            <div style={{ display: 'flex', gap: 8 }}>
              {PRESET_COLORS.map(c => (
                <div key={c} onClick={() => setProfileColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer', border: profileColor === c ? '2px solid var(--text)' : '2px solid transparent' }} />
              ))}
            </div>
          </div>

          {/* Upload image */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 8 }}>OR UPLOAD PHOTO</div>
            <input type="file" accept="image/*" onChange={async e => {
              const file = e.target.files?.[0]
              if (!file) return
              
              // compress via canvas
              const img = new Image()
              const url = URL.createObjectURL(file)
              img.onload = () => {
                const canvas = document.createElement('canvas')
                const MAX = 100
                const ratio = Math.min(MAX / img.width, MAX / img.height)
                canvas.width = img.width * ratio
                canvas.height = img.height * ratio
                canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height)
                const compressed = canvas.toDataURL('image/jpeg', 0.7)
                setProfileAvatar(compressed)
                URL.revokeObjectURL(url)
              }
              img.src = url
            }} style={{ width: '100%', fontSize: 13, color: 'var(--text-muted)' }} />
          </div>

          {/* Name */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 8 }}>DISPLAY NAME</div>
            <input value={profileName} onChange={e => setProfileName(e.target.value)} placeholder="Your name" style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10 }} />
          </div>

          {/* Password — only for credentials users */}
          {!session?.user?.image?.includes('google') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>CHANGE PASSWORD</div>
              <input value={profilePassword} onChange={e => setProfilePassword(e.target.value)} placeholder="Current password" type="password" style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10 }} />
              <input value={profileNewPassword} onChange={e => setProfileNewPassword(e.target.value)} placeholder="New password" type="password" style={{ width: '100%', padding: '11px 14px', fontSize: 14, borderRadius: 10 }} />
            </div>
          )}

          {profileError && <div style={{ fontSize: 13, color: 'var(--red)' }}>{profileError}</div>}
          {profileSuccess && <div style={{ fontSize: 13, color: 'var(--accent)' }}>Saved!</div>}

          <div style={{ display: 'flex', gap: 12, padding: '12px 0', borderTop: '1px solid var(--border)' }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--accent)' }}>🔥 {streak}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Current streak</div>
            </div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-muted)' }}>⭐ {longestStreak}</div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>Longest streak</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => signOut()} style={{ padding: '11px 16px', background: 'transparent', border: '1px solid var(--border)', borderRadius: 10, fontSize: 13, color: 'var(--text-muted)', fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
              Sign out
            </button>
            <button onClick={saveProfile} disabled={profileSaving} style={{ flex: 1, padding: 11, background: 'var(--accent)', color: '#0c0c0e', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', cursor: profileSaving ? 'not-allowed' : 'pointer', opacity: profileSaving ? 0.7 : 1 }}>
              {profileSaving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    )}
    {streakLost && (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 20px' }}>
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '28px 24px', maxWidth: 360, width: '100%', display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>😔</div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Streak lost</div>
            <div style={{ fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Your {prevStreak}-day streak ended. Don't worry — start fresh today and build it back up!
            </div>
          </div>
          <button onClick={() => setStreakLost(false)} style={{ padding: '12px', background: 'var(--accent)', color: '#0c0c0e', border: 'none', borderRadius: 10, fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', cursor: 'pointer' }}>
            Let's go 💪
          </button>
        </div>
      </div>
    )}
    <SupportWall />
    </>
  )
}