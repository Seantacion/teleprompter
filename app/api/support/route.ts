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
    console.log("payload:", JSON.stringify(body))
  
    const { donator_name, message, amount } = body
    
    if (!donator_name && !message) {
      console.log("skipped: empty payload")
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
  
    console.log("saving entry:", entry)
    await redis.zadd("support:wall", Date.now(), JSON.stringify(entry))
    console.log("saved!")
  
    return NextResponse.json({ ok: true })
  }