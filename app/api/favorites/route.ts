import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redis } from '@/lib/kv'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ favorites: [] })

  const raw = await redis.get(`favorites:${session.user.id}`)
  const favorites = raw ? JSON.parse(raw as string) : []
  return NextResponse.json({ favorites })
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ ok: false }, { status: 401 })

  const { id } = await req.json()
  const key = `favorites:${session.user.id}`
  const raw = await redis.get(key)
  const favorites: string[] = raw ? JSON.parse(raw as string) : []

  const next = favorites.includes(id)
    ? favorites.filter(f => f !== id)
    : [...favorites, id]

  await redis.set(key, JSON.stringify(next))
  return NextResponse.json({ favorites: next })
}