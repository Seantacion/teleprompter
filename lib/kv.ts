import { kv } from '@vercel/kv'

export type ScriptEntry = {
  id: string
  script: string
  category: string
  level: string
  createdAt: number
  useCount: number
}

// Save a generated script to KV
export async function saveScript(entry: Omit<ScriptEntry, 'useCount'>): Promise<void> {
  const data: ScriptEntry = { ...entry, useCount: 0 }
  // Store the entry by ID
  await kv.set(`script:${entry.id}`, JSON.stringify(data))
  // Add to sorted set per category:level — score = createdAt for time ordering
  await kv.zadd(`index:${entry.category}:${entry.level}`, { score: entry.createdAt, member: entry.id })
  // Also add to global index
  await kv.zadd('index:all', { score: entry.createdAt, member: entry.id })
}

// Increment use count when someone loads a script
export async function incrementUseCount(id: string): Promise<void> {
  const raw = await kv.get<string>(`script:${id}`)
  if (!raw) return
  const entry: ScriptEntry = typeof raw === 'string' ? JSON.parse(raw) : raw
  entry.useCount = (entry.useCount ?? 0) + 1
  await kv.set(`script:${id}`, JSON.stringify(entry))
}

// Get scripts filtered by category and/or level, newest first
export async function getScripts(category: string, level: string): Promise<ScriptEntry[]> {
  const key = category === 'all' && level === 'all'
    ? 'index:all'
    : category === 'all'
    ? null
    : level === 'all'
    ? `index:${category}:beginner` // will merge below
    : `index:${category}:${level}`

  let ids: string[] = []

  if (category !== 'all' && level === 'all') {
    // merge all levels for this category
    const levels = ['beginner', 'intermediate', 'advanced']
    const sets = await Promise.all(
      levels.map(l => kv.zrange<string[]>(`index:${category}:${l}`, 0, -1, { rev: true }))
    )
    ids = sets.flat().filter(Boolean)
  } else if (key) {
    ids = (await kv.zrange<string[]>(key, 0, -1, { rev: true })) ?? []
  }

  if (!ids.length) return []

  const raws = await Promise.all(ids.map(id => kv.get<string>(`script:${id}`)))
  return raws
    .filter(Boolean)
    .map(r => (typeof r === 'string' ? JSON.parse(r) : r) as ScriptEntry)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 50) // cap at 50
}