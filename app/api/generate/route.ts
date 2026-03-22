import { NextRequest, NextResponse } from 'next/server'
import { redis, saveScript } from '@/lib/kv'
import { randomUUID } from 'crypto'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'


const CATEGORIES: Record<string, string> = {
  introduction: 'a self-introduction for an English learner. The speaker introduces their name, what they do, why they are learning English, and what their goal is. Keep it grounded and relatable — not poetic or abstract.',
  daily: 'a monologue about a daily routine — morning habits, work, small moments, and how the day ends.',
  opinion: 'a monologue sharing a personal opinion on a relatable topic like technology, social media, or work-life balance.',
  story: 'a personal story monologue about a meaningful experience or lesson learned.',
  interview: 'a job interview monologue answering "Tell me about yourself" — professional but warm and human.',
  travel: 'a monologue about a dream destination or a past travel memory.',
  motivation: 'a motivational monologue about growth, consistency, and showing up even when it is hard.',
  custom: '',
}

const LEVEL_NOTES: Record<string, string> = {
  beginner: 'Use simple vocabulary and short sentences. Avoid complex grammar.',
  intermediate: 'Use natural everyday English with moderate vocabulary and varied sentence length.',
  advanced: 'Use rich vocabulary, idioms, rhetorical questions, and varied sentence structures.',
  a1: 'A1 Beginner: Use only the most basic vocabulary and very short simple sentences. Present tense only.',
  a2: 'A2 Elementary: Use simple vocabulary and basic grammar. Short sentences, common everyday words.',
  b1: 'B1 Intermediate: Use everyday English with some variety in sentence structure. Occasional idioms are fine.',
  b2: 'B2 Upper Intermediate: Use varied vocabulary and sentence structures. Include some idiomatic expressions.',
  c1: 'C1 Advanced: Use sophisticated vocabulary, complex sentence structures, and natural idiomatic English.',
  c2: 'C2 Proficient: Use near-native level English with nuanced vocabulary, complex grammar, and natural flow.',
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? req.headers.get('x-forwarded-for') ?? 'guest'
  const role = session?.user?.role ?? 'guest'
  const limit = role === 'admin' ? Infinity : role === 'user' ? 25 : 5
  const { category, customPrompt, level } = await req.json()

  // cek usage hari ini
  const today = new Date().toISOString().slice(0, 10)
  const usageKey = `usage:${userId}:${today}`
  const usage = parseInt((await redis.get(usageKey)) ?? '0')

  if (usage >= limit) {
    return NextResponse.json({
      script: role === 'guest'
        ? 'Daily limit reached (5/day). Sign in to get 25 generations per day.'
        : 'Daily limit reached (25/day).',
    }, { status: 429 })
  }

  await redis.set(usageKey, String(usage + 1), 'EX', 86400)

  const levelNote = LEVEL_NOTES[level] ?? LEVEL_NOTES.intermediate
  const categoryDesc = category === 'custom'
    ? `a spoken monologue about: "${customPrompt}"`
    : CATEGORIES[category]

  const prompt = `Write ${categoryDesc}

Style guide — this is a SPOKEN monologue, not an essay:
- Short punchy sentences mixed with longer flowing ones
- Use line breaks between thoughts to create rhythm and pauses
- Rhetorical questions are great ("Why? Because...")
- Repetition for emphasis ("This is not about X. This is about Y.")
- Natural transitions ("So...", "And honestly...", "Here's the thing —")
- End with a strong closing line that lands

Requirements:
- 130-160 words total (enough to read for about 1 minute)
- ${levelNote}
- First person voice
- No headers, labels, or bullet points — just the script
- Use ___ as placeholder where a name would go
- Make it feel like something worth reading aloud
- Avoid poetic, abstract, or overly literary language
- Sound like a real person talking, not a writer showing off
- Simple and direct — like talking to a camera`

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ script: 'API key not configured. Add GEMINI_API_KEY to your environment variables.' }, { status: 500 })
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1024, temperature: 0.9 },
      }),
    }
  )

  if (!res.ok) {
    const err = await res.json()
    return NextResponse.json({ script: `API error: ${err?.error?.message ?? res.statusText}` }, { status: 500 })
  }

  const data = await res.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Failed to generate script. Please try again.'

  // Save to KV (non-blocking — don't fail the request if KV is unavailable)
  try {
    await saveScript({
      id: randomUUID(),
      script: text,
      category,
      level,
      createdAt: Date.now(),
      userName: session?.user?.name ?? 'Anonymous',
    })
  } catch (e) {
    console.error('KV save failed:', e)
  }

  return NextResponse.json({ script: text })
}