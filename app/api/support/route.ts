// app/api/support/route.ts
import redis from "@/lib/redis"
import { NextResponse } from "next/server"

export async function GET() {
  const raw = await redis.zrange("support:wall", 0, 49)
  // ioredis zrange ascending by default, jadi reverse manual
  const supports = raw.reverse().map(s => JSON.parse(s))
  return NextResponse.json(supports)
}

export async function POST(req: Request) {
  const { name, message } = await req.json()

  if (!message || message.trim().length < 3) {
    return NextResponse.json({ error: "pesan terlalu pendek" }, { status: 400 })
  }

  const entry = {
    id: crypto.randomUUID(),
    name: (name?.trim() || "Anonymous").slice(0, 32),
    message: message.trim().slice(0, 120),
    createdAt: new Date().toISOString(),
  }

  // ioredis: zadd(key, score, member) — beda urutan dari @upstash/redis
  await redis.zadd("support:wall", Date.now(), JSON.stringify(entry))

  return NextResponse.json(entry, { status: 201 })
}