'use client'

import { SupportWall } from '@/components/SupportWalls'
import { useState, useRef, useEffect, useCallback } from 'react'

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

const LEVELS = [
  { id: 'beginner', label: 'Beginner' },
  { id: 'intermediate', label: 'Intermediate' },
  { id: 'advanced', label: 'Advanced' },
]

type Screen = 'setup' | 'teleprompter' | 'history'

type ScriptEntry = {
  id: string
  script: string
  category: string
  level: string
  createdAt: number
  useCount: number
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
      return
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

  const togglePlay = () => {
    const next = !playing
    playingRef.current = next
    setPlaying(next)
    if (next) lastTsRef.current = 0
  }

  const resetScroll = () => {
    cancelAnimationFrame(animRef.current)
    playingRef.current = false
    setPlaying(false)
    setDone(false)
    posRef.current = 0
    setPos(0)
  }

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

  // ── Teleprompter screen ──
  if (screen === 'teleprompter') {
    return (
      <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
          <button onClick={() => { resetScroll(); setScreen('setup') }} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: 8, padding: '6px 12px', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-display)' }}>
            ← Back
          </button>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em' }}>NATHING</span>
          <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{Math.round((pos / getTotalHeight()) * 100)}%</span>
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
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '32px 20px 16px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.15em', marginBottom: 8 }}>NATHING</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }}>Speak <br />English Freely</h1>
        <p style={{ marginTop: 8, fontSize: 14, color: 'var(--text-muted)', lineHeight: 1.5 }}>Practice speaking English fluently.</p>
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
              <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 10 }}>DIFFICULTY</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {LEVELS.map(l => (
                  <button key={l.id} onClick={() => setLevel(l.id)} style={{ ...btn(level === l.id), flex: 1, padding: 9, fontSize: 13 }}>{l.label}</button>
                ))}
              </div>
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
                  <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{script.split(/\s+/).length} words</span>
                </div>
                <textarea value={script} onChange={e => setScript(e.target.value)} rows={8} style={{ width: '100%', padding: 14, fontSize: 14, lineHeight: 1.7, resize: 'vertical' }} />
              </div>
            ) : (
              <div>
                <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-dim)', marginBottom: 8 }}>or write your own</div>
                <textarea value={script} onChange={e => setScript(e.target.value)} placeholder="Write your own script here..." rows={5} style={{ width: '100%', padding: 12, fontSize: 14, lineHeight: 1.7, resize: 'vertical' }} />
              </div>
            )}

            <button onClick={startTeleprompter} disabled={!script.trim()} style={{ width: '100%', padding: 14, background: script.trim() ? 'var(--surface2)' : 'var(--surface)', color: script.trim() ? 'var(--text)' : 'var(--text-dim)', border: '1px solid ' + (script.trim() ? 'var(--border-hover)' : 'var(--border)'), borderRadius: 12, fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', cursor: script.trim() ? 'pointer' : 'not-allowed' }}>
              Start Reading →
            </button>
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
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 10 }}>CATEGORY</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[{ id: 'all', label: 'All', emoji: '🗂️' }, ...CATEGORIES].map(cat => (
                  <button key={cat.id} onClick={() => setHistoryCategory(cat.id)} style={{ ...btn(historyCategory === cat.id), padding: '7px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 14 }}>{cat.emoji}</span>{cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Filter by level */}
            <div>
              <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 10 }}>LEVEL</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {[{ id: 'all', label: 'All' }, ...LEVELS].map(l => (
                  <button key={l.id} onClick={() => setHistoryLevel(l.id)} style={{ ...btn(historyLevel === l.id), flex: 1, padding: 9, fontSize: 13 }}>{l.label}</button>
                ))}
              </div>
            </div>

            {/* Script list */}
            {historyLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)', fontSize: 14 }}>Loading...</div>
            ) : historyScripts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-dim)', fontSize: 14 }}>
                No scripts yet for this filter.<br />
                <span style={{ fontSize: 12 }}>Generate one first!</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {historyScripts.map(entry => {
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
                        </div>
                        <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                          {entry.useCount > 0 ? `▶ ${entry.useCount}x` : 'new'}
                        </span>
                      </div>

                      {/* Preview / full */}
                      <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {expanded ? entry.script : preview}
                      </p>

                      {/* Actions */}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setExpandedId(expanded ? null : entry.id)} style={{ ...btn(false), padding: '7px 12px', fontSize: 12 }}>
                          {expanded ? 'Collapse' : 'Read more'}
                        </button>
                        <button onClick={() => loadFromHistory(entry)} style={{ ...btn(true), padding: '7px 12px', fontSize: 12, flex: 1 }}>
                          Use this script →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
    <SupportWall />
    </>
  )
}