import { NextRequest, NextResponse } from 'next/server'
import { getEngine } from '@/lib/engine'
import { getDb } from '@/lib/db'
import { updateStageState } from '@/lib/server/stage-hub'
import type { StageFinalist } from '@/lib/stage-sync'

export const dynamic = 'force-dynamic'

function fetchTopQualifiers(): StageFinalist[] {
  // 1. Try fetching from active live engine in memory
  try {
    const engine = getEngine()
    const results = engine.results()
    if (results && Array.isArray(results.rows) && results.rows.length > 0) {
      const topRows = results.rows.slice(0, 6)
      const qualifiers: StageFinalist[] = topRows.map((r, idx) => ({
        id: `f${idx + 1}`,
        name: r.name,
        avatarSeed: r.avatarSeed || `finalist-${idx + 1}`,
        score: 0,
        roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 },
      }))

      // Fill remaining if fewer than 6
      while (qualifiers.length < 6) {
        const idx = qualifiers.length
        qualifiers.push({
          id: `f${idx + 1}`,
          name: `Finalist ${idx + 1}`,
          avatarSeed: `finalist-${idx + 1}`,
          score: 0,
          roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 },
        })
      }
      return qualifiers
    }
  } catch (err) {
    console.warn('[Stage Qualifiers] Error reading from live engine:', err)
  }

  // 2. Fallback: Query SQLite database for the latest run's top participants
  try {
    const db = getDb()
    const latestRun = db.prepare('SELECT id FROM runs ORDER BY created_at DESC LIMIT 1').get() as { id: string } | undefined

    if (latestRun?.id) {
      const rows = db
        .prepare(
          `SELECT 
             p.id, 
             p.name, 
             p.avatar_seed, 
             COALESCE(SUM(a.points), 0) as total_score,
             COALESCE(SUM(a.elapsed_ms), 0) as total_elapsed,
             p.joined_at
           FROM participants p
           LEFT JOIN answers a ON a.participant_id = p.id AND a.run_id = p.run_id
           WHERE p.run_id = ?
           GROUP BY p.id, p.name, p.avatar_seed
           ORDER BY total_score DESC, total_elapsed ASC, p.joined_at ASC
           LIMIT 6`,
        )
        .all(latestRun.id) as Array<{ id: string; name: string; avatar_seed: string; total_score: number }>

      if (rows && rows.length > 0) {
        const qualifiers: StageFinalist[] = rows.map((r, idx) => ({
          id: `f${idx + 1}`,
          name: r.name,
          avatarSeed: r.avatar_seed || `finalist-${idx + 1}`,
          score: 0,
          roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 },
        }))

        while (qualifiers.length < 6) {
          const idx = qualifiers.length
          qualifiers.push({
            id: `f${idx + 1}`,
            name: `Finalist ${idx + 1}`,
            avatarSeed: `finalist-${idx + 1}`,
            score: 0,
            roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 },
          })
        }
        return qualifiers
      }
    }
  } catch (err) {
    console.error('[Stage Qualifiers] Error reading from SQLite DB:', err)
  }

  // 3. Default fallback
  return [
    { id: 'f1', name: 'Finalist 1', avatarSeed: 'finalist-1', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
    { id: 'f2', name: 'Finalist 2', avatarSeed: 'finalist-2', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
    { id: 'f3', name: 'Finalist 3', avatarSeed: 'finalist-3', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
    { id: 'f4', name: 'Finalist 4', avatarSeed: 'finalist-4', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
    { id: 'f5', name: 'Finalist 5', avatarSeed: 'finalist-5', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
    { id: 'f6', name: 'Finalist 6', avatarSeed: 'finalist-6', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
  ]
}

export async function GET() {
  const qualifiers = fetchTopQualifiers()
  return NextResponse.json({ ok: true, qualifiers })
}

export async function POST(req: NextRequest) {
  try {
    const qualifiers = fetchTopQualifiers()
    updateStageState({ finalists: qualifiers })
    return NextResponse.json({ ok: true, finalists: qualifiers })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to import qualifiers' }, { status: 500 })
  }
}
