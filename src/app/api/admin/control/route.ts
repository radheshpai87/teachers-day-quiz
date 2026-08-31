import type { NextRequest } from 'next/server'
import { fail, ok, readJson } from '@/lib/api-helpers'
import { requireAdminApi } from '@/lib/auth'
import { getEngine } from '@/lib/engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const ACTIONS = ['start', 'pause', 'resume', 'skip', 'end', 'reset', 'kick'] as const
type Action = (typeof ACTIONS)[number]

/**
 * Host controls. `start` is the only one the normal event flow needs -- the
 * engine drives every question, reveal and leaderboard after that. The rest are
 * escape hatches for when something goes sideways on stage.
 */
export async function POST(req: NextRequest) {
  const denied = await requireAdminApi()
  if (denied) return denied

  const body = await readJson<{ action?: unknown; participantId?: unknown }>(req)
  const action = body?.action
  if (typeof action !== 'string' || !ACTIONS.includes(action as Action)) {
    return fail(`Unknown action. Expected one of ${ACTIONS.join(', ')}.`)
  }

  const engine = getEngine()

  switch (action as Action) {
    case 'start': {
      const result = engine.start()
      if (!result.ok) return fail(result.error, 409)
      break
    }
    case 'pause':
      if (!engine.pause().ok) return fail('Nothing to pause right now.', 409)
      break
    case 'resume':
      if (!engine.resume().ok) return fail('The quiz is not paused.', 409)
      break
    case 'skip':
      if (!engine.skip().ok) return fail('Nothing to skip right now.', 409)
      break
    case 'end':
      if (!engine.end().ok) return fail('The quiz has already ended.', 409)
      break
    case 'reset':
      engine.reset()
      break
    case 'kick': {
      const pid = typeof body?.participantId === 'string' ? body.participantId : ''
      if (!pid) return fail('Participant id is required to kick.')
      if (!engine.kickParticipant(pid)) return fail('Participant not found or already removed.', 404)
      break
    }
  }

  return ok({ snapshot: engine.hostSnapshot() })
}
