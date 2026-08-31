import { requireAdminApi } from '@/lib/auth'
import { getEngine } from '@/lib/engine'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

/** Escape a value for CSV: quote it and double any embedded quotes. */
function csvCell(value: string | number): string {
  const text = String(value)
  // A leading =, +, - or @ can be interpreted as a formula by spreadsheet apps.
  const guarded = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${guarded.replace(/"/g, '""')}"`
}

export async function GET() {
  const denied = await requireAdminApi()
  if (denied) return denied

  const results = getEngine().results()

  const header = [
    'Rank',
    'Name',
    'Phone Number',
    'College / Institution',
    'Score',
    'Correct',
    'Answered',
    'Total Questions',
    'Accuracy %',
    'Avg Response (s)',
  ]

  const lines = [header.map(csvCell).join(',')]
  for (const row of results.rows) {
    lines.push(
      [
        row.rank,
        row.name,
        row.phone || '',
        row.college || '',
        row.score,
        row.correct,
        row.answered,
        results.totalQuestions,
        Math.round(row.accuracy * 100),
        row.averageResponseSeconds.toFixed(1),
      ]
        .map(csvCell)
        .join(','),
    )
  }

  const filename = `teachers-day-quiz-results-${results.runId}.csv`

  return new Response(lines.join('\r\n'), {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  })
}
