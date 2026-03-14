import Redis from 'ioredis'

const redis = new Redis(process.env.REDIS_URL!)

export type ScriptEntry = {
  id: string
  script: string
  category: string
  level: string
  createdAt: number
  useCount: number
}

export async function saveScript(entry: Omit<ScriptEntry, 'useCount'>): Promise<void> {
  const data: ScriptEntry = { ...entry, useCount: 0 }
  await redis.set(`script:${entry.id}`, JSON.stringify(data))
  await redis.zadd(`index:${entry.category}:${entry.level}`, entry.createdAt, entry.id)
  await redis.zadd('index:all', entry.createdAt, entry.id)
}

export async function incrementUseCount(id: string): Promise<void> {
  const raw = await redis.get(`script:${id}`)
  if (!raw) return
  const entry: ScriptEntry = JSON.parse(raw)
  entry.useCount = (entry.useCount ?? 0) + 1
  await redis.set(`script:${id}`, JSON.stringify(entry))
}

export async function getScripts(category: string, level: string): Promise<ScriptEntry[]> {
  let ids: string[] = []
  const CATEGORIES = ['introduction', 'daily', 'opinion', 'story', 'interview', 'travel', 'motivation', 'custom']
  const LEVELS = ['beginner', 'intermediate', 'advanced']

  if (category === 'all' && level === 'all') {
    // semua data
    ids = await redis.zrevrange('index:all', 0, 49)
  } else if (category !== 'all' && level === 'all') {
    // kategori tertentu, semua level
    const sets = await Promise.all(
      LEVELS.map(l => redis.zrevrange(`index:${category}:${l}`, 0, -1))
    )
    ids = sets.flat()
  } else if (category === 'all' && level !== 'all') {
    // semua kategori, level tertentu — fetch semua lalu filter
    const sets = await Promise.all(
      CATEGORIES.map(c => redis.zrevrange(`index:${c}:${level}`, 0, -1))
    )
    ids = sets.flat()
  } else {
    // kategori + level spesifik
    ids = await redis.zrevrange(`index:${category}:${level}`, 0, 49)
  }

  if (!ids.length) return []

  const raws = await Promise.all(ids.map(id => redis.get(`script:${id}`)))
  return raws
    .filter(Boolean)
    .map(r => JSON.parse(r!) as ScriptEntry)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 50)
}