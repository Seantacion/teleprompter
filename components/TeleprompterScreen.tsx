'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { useSession } from 'next-auth/react'

type Props = {
  script: string
  streak: number
  onBack: () => void
  onStreakUpdate: (data: { streak: number; longest: number }) => void
}

export function TeleprompterScreen({ script, streak, onBack, onStreakUpdate }: Props) {
  const { data: session } = useSession()
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(0)
  const [done, setDone] = useState(false)
  const [timer, setTimer] = useState(0)
  const [speed, setSpeed] = useState(50)
  const [fontSize, setFontSize] = useState(28)
  const [stageH, setStageH] = useState(400)

  const scrollerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const animRef = useRef<number>(0)
  const lastTsRef = useRef<number>(0)
  const posRef = useRef(0)
  const playingRef = useRef(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const streakCalledRef = useRef(false)

  const translateY = stageH / 2 - pos

  useEffect(() => {
    if (!stageRef.current) return
    const observer = new ResizeObserver(entries => setStageH(entries[0].contentRect.height))
    observer.observe(stageRef.current)
    return () => observer.disconnect()
  }, [])

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
    const progress = posRef.current / getTotalHeight()
    if (progress >= 0.5 && !streakCalledRef.current && session?.user?.id) {
      streakCalledRef.current = true
      fetch('/api/streak', { method: 'POST' })
        .then(r => r.json())
        .then(onStreakUpdate)
    }
    animRef.current = requestAnimationFrame(animate)
  }, [speed, getTotalHeight, session?.user?.id, onStreakUpdate])

  useEffect(() => {
    if (playing) {
      lastTsRef.current = 0
      animRef.current = requestAnimationFrame(animate)
    } else {
      cancelAnimationFrame(animRef.current)
    }
    return () => cancelAnimationFrame(animRef.current)
  }, [playing, animate])

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

  const handleBack = () => { resetScroll(); onBack() }

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <button onClick={handleBack} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
          ← Back
        </button>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>NATHING</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            {String(Math.floor(timer / 60)).padStart(2, '0')}:{String(timer % 60).padStart(2, '0')}
          </span>
          {session && streak > 0 && (
            <span style={{ fontSize: 11, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>🔥 {streak}</span>
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