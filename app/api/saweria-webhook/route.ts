import redis from "@/lib/redis"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()

  // payload Saweria: donator_name, message, amount
  const { donator_name, message, amount } = body

  // skip kalau kosong
  if (!donator_name && !message) {
    return NextResponse.json({ ok: true })
  }

  const entry = {
    id: crypto.randomUUID(),
    name: donator_name || "Anonymous",
    message: message || `donated Rp${Number(amount).toLocaleString("id-ID")}`,
    createdAt: new Date().toISOString(),
    source: "saweria",
  }

  await redis.zadd("support:wall", Date.now(), JSON.stringify(entry))

  return NextResponse.json({ ok: true })
}