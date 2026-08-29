import type { NextRequest } from 'next/server'
import { fail, ok, readJson } from '@/lib/api-helpers'
import { requireAdminApi } from '@/lib/auth'
import { deleteQuestion, getQuestion, updateQuestion } from '@/lib/content'
import { getEngine } from '@/lib/engine'
import { validateQuestion } from '@/lib/validate'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi()
  if (denied) return denied

  const { id } = await params
  if (!getQuestion(id)) return fail('That question no longer exists.', 404)

  const body = await readJson<Record<string, unknown>>(req)
  if (!body) return fail('Invalid request body.')

  const result = validateQuestion(body)
  if (!result.ok) return fail(result.error)

  const question = updateQuestion(id, result.value)
  getEngine().refreshQuestions()
  return ok({ question })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdminApi()
  if (denied) return denied

  const engine = getEngine()
  if (engine.phase !== 'WAITING' && engine.phase !== 'COMPLETED') {
    return fail('Cannot delete questions while a quiz event is live or paused.', 400)
  }

  const { id } = await params
  deleteQuestion(id)
  engine.refreshQuestions()
  return ok({ ok: true })
}
