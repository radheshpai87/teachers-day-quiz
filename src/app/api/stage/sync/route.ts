import { NextRequest, NextResponse } from 'next/server'
import { getStageState, updateStageState } from '@/lib/server/stage-hub'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json(getStageState())
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const updated = updateStageState(body)
    return NextResponse.json(updated)
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Failed to update' }, { status: 400 })
  }
}
