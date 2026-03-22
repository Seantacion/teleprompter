import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redis } from '@/lib/kv'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 })

  const userId = session.user.id
  const today = new Date().toISOString().slice(0, 10)
  const streakKey = `streak:${userId}`
  const raw = await redis.get(streakKey)
  const data = raw ? JSON.parse(raw as string) : { count: 0, lastDate: '' }
  

  // kalau hari ini udah dicatat, skip
  if (data.lastDate === today) return NextResponse.json({ streak: data.count })

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().slice(0, 10)

  // kalau kemarin ada aktivitas, lanjut streak — kalau engga, reset
  const newCount = data.lastDate === yesterdayStr ? data.count + 1 : 1
    const newLongest = Math.max(newCount, data.longest ?? 0)
    await redis.set(streakKey, JSON.stringify({ count: newCount, lastDate: today, longest: newLongest }))

    return NextResponse.json({ streak: newCount, longest: newLongest })
}

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ streak: 0, longest: 0 })
  
    const today = new Date().toISOString().slice(0, 10)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().slice(0, 10)
  
    const raw = await redis.get(`streak:${session.user.id}`)
    const data = raw ? JSON.parse(raw as string) : { count: 0, longest: 0, lastDate: '' }
  
    const wasReset = data.lastDate !== today && data.lastDate !== yesterdayStr && data.count > 1
    const prevStreak = wasReset ? data.count : 0
  
    if (wasReset) {
      await redis.set(`streak:${session.user.id}`, JSON.stringify({ ...data, count: 1, lastDate: '' }))
    }
  
    return NextResponse.json({ streak: wasReset ? 0 : data.count, longest: data.longest ?? 0, wasReset, prevStreak })
  }