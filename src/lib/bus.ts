/**
 * SSE connection hub.
 *
 * One process holds every open stream. Frames are only written on *state
 * transitions* (and a throttled lobby counter), never on a per-second tick --
 * clients derive their countdown from absolute deadlines in the payload. That is
 * the single most important decision for surviving 1,000+ participants: a
 * running 20-second timer costs zero bytes.
 */

export type ClientRole = 'player' | 'display' | 'admin'

export interface SseClient {
  id: string
  role: ClientRole
  /** Set for role === 'player'. */
  participantId?: string
  /** Write a pre-formatted SSE chunk. Never throws. */
  write(chunk: string): void
  close(): void
}

declare global {
  var __quizHub: Hub | undefined
}

const HEARTBEAT_MS = 20_000

class Hub {
  private clients = new Map<string, SseClient>()
  private heartbeat: ReturnType<typeof setInterval> | null = null

  add(client: SseClient) {
    this.clients.set(client.id, client)
    this.ensureHeartbeat()
  }

  remove(id: string) {
    this.clients.delete(id)
    if (this.clients.size === 0 && this.heartbeat) {
      clearInterval(this.heartbeat)
      this.heartbeat = null
    }
  }

  /** Number of *connected* streams for a role (not the same as participants). */
  countByRole(role: ClientRole) {
    let n = 0
    for (const c of this.clients.values()) if (c.role === role) n++
    return n
  }

  hasRole(role: ClientRole) {
    for (const c of this.clients.values()) if (c.role === role) return true
    return false
  }

  /**
   * Write to every client. `build` returns the chunk for a given client, or
   * null to skip it -- this lets the engine send participants their own
   * question while display screens get the aggregate view, in one pass.
   */
  broadcast(build: (client: SseClient) => string | null) {
    for (const client of this.clients.values()) {
      let chunk: string | null
      try {
        chunk = build(client)
      } catch {
        continue
      }
      if (chunk) client.write(chunk)
    }
  }

  sendTo(participantId: string, chunk: string) {
    for (const client of this.clients.values()) {
      if (client.participantId === participantId) client.write(chunk)
    }
  }

  private ensureHeartbeat() {
    if (this.heartbeat) return
    this.heartbeat = setInterval(() => {
      // Comment frames keep proxies and mobile radios from dropping the stream.
      for (const client of this.clients.values()) client.write(': hb\n\n')
    }, HEARTBEAT_MS)
    // Don't hold the process open on shutdown.
    this.heartbeat.unref?.()
  }
}

export function getHub(): Hub {
  if (!globalThis.__quizHub) globalThis.__quizHub = new Hub()
  return globalThis.__quizHub
}

/** Format any JSON-serialisable value as a single SSE `data:` frame. */
export function frame(payload: unknown): string {
  return `data: ${JSON.stringify(payload)}\n\n`
}

/** Format a frame from an already-serialised JSON string. */
export function rawFrame(json: string): string {
  return `data: ${json}\n\n`
}
