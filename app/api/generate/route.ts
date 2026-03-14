import { NextRequest, NextResponse } from 'next/server'
import { saveScript } from '@/lib/kv'
import { randomUUID } from 'crypto'

const CATEGORIES: Record<string, string> = {
  introduction: 'a self-introduction monologue. The speaker introduces who they are, where they come from, what they do, and what they care about.',
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
}

export async function POST(req: NextRequest) {
  const { category, customPrompt, level } = await req.json()

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
- Make it feel like something worth reading aloud`

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
    })
  } catch (e) {
    console.error('KV save failed:', e)
  }

  return NextResponse.json({ script: text })
}