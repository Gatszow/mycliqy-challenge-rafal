import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type { ClassifyRequest, ClassifyResponse, MessageCategory, MessagePriority } from '@/types'

// Model i limit tokenów są zablokowane — nie zmieniaj tych stałych.
const MODEL = 'gpt-4o-mini' as const
const MAX_TOKENS = 300

const CATEGORIES: MessageCategory[] = ['zamówienie', 'pytanie', 'reklamacja', 'spam']
const PRIORITIES: MessagePriority[] = ['high', 'medium', 'low']

const SYSTEM_PROMPT = `Jesteś asystentem zespołu obsługi klienta polskiej firmy. Klasyfikujesz przychodzące wiadomości i piszesz gotowy szkic odpowiedzi.

Zasady:
- category: "zamówienie" (chęć kupna, zapytanie ofertowe, rabaty), "pytanie" (prośba o informację: godziny, dostępność, zasady), "reklamacja" (problem, opóźnienie, zwrot, niezadowolenie), "spam" (oferty marketingowe, treści niezwiązane, boty).
- priority: "high" (reklamacje, gorące zamówienia, zdenerwowany klient), "medium" (zwykłe zapytania zakupowe), "low" (proste pytania informacyjne, spam).
- draft_reply: gotowa odpowiedź PO POLSKU, którą operator wyśle po akceptacji. Ton dopasuj do firmy i kategorii — uprzejmy, konkretny, bez lania wody. Maksymalnie 3–4 zdania. Dla spamu napisz krótką, grzeczną odmowę. Nie zmyślaj faktów (cen, terminów, numerów) — jeśli ich brak, poproś o dane lub obiecaj sprawdzić.
- confidence: 0.0–1.0, Twoja pewność klasyfikacji.`

const RESPONSE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    category: { type: 'string', enum: CATEGORIES },
    priority: { type: 'string', enum: PRIORITIES },
    draft_reply: { type: 'string' },
    confidence: { type: 'number' },
  },
  required: ['category', 'priority', 'draft_reply', 'confidence'],
}

function clamp01(n: unknown): number {
  const v = typeof n === 'number' && Number.isFinite(n) ? n : 0
  return Math.min(1, Math.max(0, v))
}

export async function POST(req: Request): Promise<NextResponse<ClassifyResponse | { error: string }>> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Brak konfiguracji OPENAI_API_KEY na serwerze.' }, { status: 500 })
  }
  const openai = new OpenAI({ apiKey })

  let body: ClassifyRequest
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy JSON w żądaniu.' }, { status: 400 })
  }

  const message = body?.message?.trim()
  const company = body?.company?.trim()
  if (!message || !company) {
    return NextResponse.json({ error: 'Pola "message" i "company" są wymagane.' }, { status: 400 })
  }

  let completion
  try {
    completion = await openai.chat.completions.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.3,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'classification', schema: RESPONSE_SCHEMA, strict: true },
      },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Firma: ${company}\n\nWiadomość klienta:\n${message}` },
      ],
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'nieznany błąd'
    return NextResponse.json({ error: `Błąd wywołania modelu: ${detail}` }, { status: 502 })
  }

  const raw = completion.choices[0]?.message?.content
  if (!raw) {
    return NextResponse.json({ error: 'Model nie zwrócił odpowiedzi.' }, { status: 502 })
  }

  let parsed: Partial<ClassifyResponse>
  try {
    parsed = JSON.parse(raw)
  } catch {
    return NextResponse.json({ error: 'Model zwrócił nieprawidłowy JSON.' }, { status: 502 })
  }

  if (
    !parsed.category ||
    !CATEGORIES.includes(parsed.category) ||
    !parsed.priority ||
    !PRIORITIES.includes(parsed.priority) ||
    !parsed.draft_reply
  ) {
    return NextResponse.json({ error: 'Odpowiedź modelu nie spełnia schematu.' }, { status: 502 })
  }

  return NextResponse.json({
    category: parsed.category,
    priority: parsed.priority,
    draft_reply: parsed.draft_reply,
    confidence: clamp01(parsed.confidence),
  })
}
