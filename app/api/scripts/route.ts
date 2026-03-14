import { NextRequest, NextResponse } from 'next/server'
import { getScripts, incrementUseCount } from '@/lib/kv'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const category = searchParams.get('category') ?? 'all'
  const level = searchParams.get('level') ?? 'all'

  try {
    const scripts = await getScripts(category, level)
    return NextResponse.json({ scripts })
  } catch (e) {
    console.error('KV fetch failed:', e)
    return NextResponse.json({ scripts: [] })
  }
}

export async function POST(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ ok: false }, { status: 400 })
  try {
    await incrementUseCount(id)
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('KV increment failed:', e)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}