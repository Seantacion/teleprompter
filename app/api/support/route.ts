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
    const body = await req.json()
  
    const { donator_name, message, amount } = body
    
    if (!donator_name && !message) {
      return NextResponse.json({ ok: true })
    }
  
    const entry = {
        id: crypto.randomUUID(),
        name: donator_name || "Anonymous",
        message: message || "no message",
        amount: amount ? `Rp${Number(amount).toLocaleString("id-ID")}` : null,
        createdAt: new Date().toISOString(),
        source: "saweria",
      }
  
    await redis.zadd("support:wall", Date.now(), JSON.stringify(entry))
  
    return NextResponse.json({ ok: true })
  }