'use client'

import { useState, useEffect, useCallback } from 'react'

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
  favorites: string[]
  onToggleFavorite: (id: string) => void
  onUseScript: (entry: ScriptEntry) => void
}

const btn = (active: boolean) => ({
  background: active ? 'var(--accent-dim)' : 'var(--surface)',
  border: '1px solid ' + (active ? 'var(--accent-border)' : 'var(--border)'),
  color: active ? 'var(--accent)' : 'var(--text-muted)',
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

export function HistoryTab({ favorites, onToggleFavorite, onUseScript }: Props) {
  const [historyCategory, setHistoryCategory] = useState('all')
  const [historyLevel, setHistoryLevel] = useState('all')
  const [historyLevelMode, setHistoryLevelMode] = useState<'simple' | 'cefr'>('simple')
  const [historyScripts, setHistoryScripts] = useState<ScriptEntry[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [page, setPage] = useState(1)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const PER_PAGE = 10

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
    fetchHistory(historyCategory, historyLevel)
  }, [historyCategory, historyLevel, fetchHistory])

  useEffect(() => { setPage(1) }, [historyCategory, historyLevel, showFavoritesOnly])

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const handleUseScript = (entry: ScriptEntry) => {
    fetch('/api/scripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: entry.id }),
    })
    onUseScript(entry)
  }

  const displayedScripts = showFavoritesOnly
    ? historyScripts.filter(s => favorites.includes(s.id))
    : historyScripts

  const paginatedScripts = displayedScripts.slice(0, page * PER_PAGE)
  const hasMore = displayedScripts.length > page * PER_PAGE

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {[{ id: 'all', label: 'All', emoji: '🗂️' }, ...CATEGORIES].map(cat => (
          <button key={cat.id} onClick={() => setHistoryCategory(cat.id)} style={{ ...btn(historyCategory === cat.id), padding: '7px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14 }}>{cat.emoji}</span>{cat.label}
          </button>
        ))}
      </div>

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
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 13 }}>{catInfo?.emoji}</span>
                    <span style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-dim)', border: '1px solid var(--accent-border)', borderRadius: 999, padding: '2px 8px' }}>{catInfo?.label ?? entry.category}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', background: 'var(--surface2)', borderRadius: 999, padding: '2px 8px', textTransform: 'capitalize' }}>{entry.level}</span>
                    {entry.userName && <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>by {entry.userName}</span>}
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
                <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {expanded ? entry.script : preview}
                </p>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  {getReadingTime(entry.script).words} words · {getReadingTime(entry.script).duration}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onToggleFavorite(entry.id)} style={{ ...btn(favorites.includes(entry.id)), padding: '7px 10px', fontSize: 14 }}>
                    {favorites.includes(entry.id) ? '★' : '☆'}
                  </button>
                  <button onClick={() => setExpandedId(expanded ? null : entry.id)} style={{ ...btn(false), padding: '7px 12px', fontSize: 12 }}>
                    {expanded ? 'Collapse' : 'Read more'}
                  </button>
                  <button onClick={() => handleCopy(entry.script, entry.id)} style={{ ...btn(false), padding: '7px 10px', fontSize: 12 }}>
                    {copiedId === entry.id ? 'Copied!' : 'Copy'}
                  </button>
                  <button onClick={() => handleUseScript(entry)} style={{ ...btn(true), padding: '7px 12px', fontSize: 12, flex: 1 }}>
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
  )
}