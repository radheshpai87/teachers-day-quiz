import type { NextRequest } from 'next/server'
import { fail, ok } from '@/lib/api-helpers'
import { getEngine } from '@/lib/engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/**
 * Reconnect check. The participant page calls this with the id it restored from
 * IndexedDB, before opening the stream, so a stale session can be cleared and
 * the person sent back to /join instead of staring at a blank screen.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const participantId = url.searchParams.get('pid')
  const isDisplay = url.searchParams.get('role') === 'display'

  const engine = getEngine()

  if (isDisplay) {
    return ok({
      state: engine.stateForDisplay(),
    })
  }

  if (!participantId) return fail('Missing participant id.')

  if (!engine.hasParticipant(participantId)) {
    return fail('Unknown participant.', 404)
  }

  engine.touch(participantId)
  return ok({
    state: engine.stateForParticipant(participantId),
  })
}
