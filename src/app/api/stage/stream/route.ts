import { NextRequest } from 'next/server'
import { getStageState, subscribeStage } from '@/lib/server/stage-hub'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder()
  let unsubscribe: (() => void) | null = null

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false
      const send = (chunk: string) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(chunk))
        } catch {
          closed = true
        }
      }

      // Push current state immediately upon connecting
      const initial = getStageState()
      send(`data: ${JSON.stringify(initial)}\n\n`)

      unsubscribe = subscribeStage(send)

      req.signal.addEventListener('abort', () => {
        closed = true
        if (unsubscribe) unsubscribe()
      })
    },
    cancel() {
      if (unsubscribe) unsubscribe()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
