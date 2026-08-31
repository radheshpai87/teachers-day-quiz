import type { NextRequest } from 'next/server'
import { clientIp, fail, ok, rateLimit, readJson } from '@/lib/api-helpers'
import { getEngine } from '@/lib/engine'
import { sanitizeName } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Register a participant. No account, no email -- just a display name. */
export async function POST(req: NextRequest) {
  // Relax rate limit for large campus NAT / Wi-Fi deployment & testing (up to 20,000 joins per minute per IP)
  const ip = clientIp(req)
  if (ip !== 'unknown' && !rateLimit(`join:${ip}`, 20000, 60_000)) {
    return fail('Too many attempts. Please wait a moment and try again.', 429)
  }

  const body = await readJson<{ name?: unknown; phone?: unknown; college?: unknown }>(req)
  const name = sanitizeName(body?.name)
  if (name.length < 2) {
    return fail('Please enter a name with at least 2 characters.')
  }

  const phone = typeof body?.phone === 'string' ? body.phone.trim() : ''
  const college = typeof body?.college === 'string' ? body.college.trim() : ''

  const engine = getEngine()
  const result = engine.join(name, phone, college)
  if ('error' in result) return fail(result.error, 409)

  return ok({
    participantId: result.id,
    avatarSeed: result.avatarSeed,
    name,
    runId: engine.getRunId(),
    quizName: engine.getQuiz().name,
  })
}
