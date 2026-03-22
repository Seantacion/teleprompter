'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { StreakBadge } from '@/components/ui/StreakBadge'
import { AvatarCircle } from '@/components/ui/AvatarCircle'

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

type ScriptEntry = {
  id: string
  script: string
  category: string
  level: string
  createdAt: number
  useCount: number
  userName?: string
}

type Props = {
  streak: number
  userAvatar: string
  userColor: string
  favorites: string[]
  onOpenAuth: () => void
  onOpenProfile: () => void
  onStartReading: (script: string) => void
  onToggleFavorite: (id: string) => void
  onUseScript: (entry: ScriptEntry) => void
  onLimitReached: () => void
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

const getReadingTime = (text: string) => {
  const words = text.trim().split(/\s+/).filter(Boolean).length
  const seconds = Math.round((words / 130) * 60)
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return { words, duration: m > 0 ? `~${m}m ${s}s` : `~${s}s` }
}

export function SetupScreen({ streak, userAvatar, userColor, favorites, onOpenAuth, onOpenProfile, onStartReading, onToggleFavorite, onUseScript, onLimitReached }: Props) {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate')
  const [category, setCategory] = useState('introduction')
  const [level, setLevel] = useState('intermediate')
  const [levelMode, setLevelMode] = useState<'simple' | 'cefr'>('simple')
  const [customPrompt, setCustomPrompt] = useState('')
  const [script, setScript] = useState('')
  const [generating, setGenerating] = useState(false)
  const [copiedScript, setCopiedScript] = useState(false)

  const generateScript = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, customPrompt, level }),
      })
      if (res.status === 429) {
        onLimitReached()
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

  const handleUseScript = (entry: ScriptEntry) => {
    setScript(entry.script)
    setCategory(entry.category)
    setLevel(entry.level)
    setActiveTab('generate')
    onUseScript(entry)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const firstName = session?.user?.name?.split(' ')[0] ?? 'there'

  return (
    <div style={{ minHeight: '100svh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', maxWidth: 480, margin: '0 auto', paddingBottom: 40 }}>
      {/* Header */}
      <div style={{ padding: '32px 20px 16px' }}>
        <div style={{display:'flex', justifyContent:'space-between'}}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent)', letterSpacing: '0.15em', marginBottom: 8 }}>NATHING</div>
          <div>
            {session ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <StreakBadge streak={streak} />
                <AvatarCircle
                    userAvatar={userAvatar}
                    userColor={userColor}
                    name={session.user?.name}
                    image={session.user?.image}
                    size={32}
                    onClick={onOpenProfile}
                />
                </div>
            ) : (
                <span onClick={onOpenAuth} style={{ fontSize: 13, color: 'var(--accent)', cursor: 'pointer' }}>
                Sign in →
                </span>
            )}
          </div>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
          {session ? (
            <>
              <span style={{ fontSize: 22, fontWeight: 800 }}>{greeting},</span>
              <br />{firstName}.
            </>
          ) : <>Speak<br />English Freely</>}
        </h1>
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
                  <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-dim)' }}>
                    <span>{getReadingTime(script).words} words</span>
                    <span>{getReadingTime(script).duration} to speak</span>
                  </div>
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
              <button onClick={() => onStartReading(script)} disabled={!script.trim()} style={{ flex: 1, padding: 14, background: script.trim() ? 'var(--surface2)' : 'var(--surface)', color: script.trim() ? 'var(--text)' : 'var(--text-dim)', border: '1px solid ' + (script.trim() ? 'var(--border-hover)' : 'var(--border)'), borderRadius: 12, fontSize: 15, fontWeight: 600, fontFamily: 'var(--font-display)', cursor: script.trim() ? 'pointer' : 'not-allowed' }}>
                Start Reading →
              </button>
            </div>

            <div style={{ margin: '12px 0px', padding: '8px 16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>barangkali aja ini mah</span>
              <a href="https://saweria.co/nathing" target="_blank" style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', textDecoration: 'none', fontWeight: 600 }}>saweria ↗</a>
            </div>
          </>
        )}

        {activeTab === 'history' && (
          <HistoryTab
            favorites={favorites}
            onToggleFavorite={onToggleFavorite}
            onUseScript={handleUseScript}
          />
        )}
      </div>
    </div>
  )
}

import { HistoryTab } from '@/components/HistoryTab'