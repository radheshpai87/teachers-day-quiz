import type { NextRequest } from 'next/server'
import { clientIp, fail, ok, rateLimit, readJson } from '@/lib/api-helpers'
import { getEngine } from '@/lib/engine'
import type { ReactionEmoji } from '@/lib/types'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ALLOWED_EMOJIS: ReactionEmoji[] = ['❤️', '👏', '🔥', '🎓', '🌟']

export async function POST(req: NextRequest) {
  const ip = clientIp(req)
  if (ip !== 'unknown' && !rateLimit(`react:ip:${ip}`, 300, 60_000)) {
    return fail('Too many reactions.', 429)
  }

  const body = await readJson<{
    participantId?: unknown
    emoji?: unknown
  }>(req)

  const participantId = typeof body?.participantId === 'string' ? body.participantId : ''
  const emoji = typeof body?.emoji === 'string' ? (body.emoji as ReactionEmoji) : null

  if (!participantId) return fail('Missing participant ID.')
  if (!emoji || !ALLOWED_EMOJIS.includes(emoji)) return fail('Invalid reaction emoji.')

  // Per-participant rate limit (e.g. 5 reactions per 3 seconds)
  if (!rateLimit(`react:pid:${participantId}`, 5, 3_000)) {
    return fail('Easy with the reactions!', 429)
  }

  const success = getEngine().sendReaction(participantId, emoji)
  if (!success) return fail('Participant not found.', 404)

  return ok({ ok: true })
}
