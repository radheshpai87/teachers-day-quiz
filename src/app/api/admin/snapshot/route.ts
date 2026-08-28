import type { NextRequest } from 'next/server'
import { ok } from '@/lib/api-helpers'
import { requireAdminApi } from '@/lib/auth'
import { getEngine } from '@/lib/engine'

/**
 * REST endpoint for retrieving the current host snapshot.
 * Used by admin dashboard / host screens for fallback polling when SSE reconnects.
 */

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const denied = await requireAdminApi()
  if (denied) return denied

  const engine = getEngine()
  return ok(engine.hostSnapshot())
}
