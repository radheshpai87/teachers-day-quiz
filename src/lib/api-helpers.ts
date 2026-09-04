import type { NextRequest } from 'next/server'

/** Small helpers shared by the API routes. */

export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json(data as object, init)
}

export function fail(message: string, status = 400) {
  return Response.json({ error: message }, { status })
}

export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return req.headers.get('x-real-ip') ?? 'unknown'
}

/**
 * Very small fixed-window rate limiter, kept in memory.
 *
 * Enough to stop an accidental tap-loop or a single misbehaving script from
 * flooding the event; it is not a security control. Buckets are pruned lazily so
 * the map can't grow unbounded across a long event.
 */
interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()
let lastPrune = 0

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  // Bypass IP rate limiting for local machine testing (loopback / local dev)
  if (key.includes('127.0.0.1') || key.includes('::1') || key.includes('localhost')) {
    return true
  }

  const now = Date.now()

  if (now - lastPrune > 10_000 || buckets.size > 5000) {
    lastPrune = now
    for (const [k, b] of buckets) if (b.resetAt < now) buckets.delete(k)
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  if (bucket.count >= limit) {
    console.warn(
      `[429_RATE_LIMIT_TRIGGERED] Rate limit exceeded for key="${key}" (count=${bucket.count}, limit=${limit}, window=${windowMs}ms)`
    )
    return false
  }
  bucket.count += 1
  return true
}

export function clearRateLimit(key: string) {
  buckets.delete(key)
}

/** Parse a JSON body, returning null rather than throwing on malformed input. */
export async function readJson<T = unknown>(req: NextRequest): Promise<T | null> {
  try {
    return (await req.json()) as T
  } catch {
    return null
  }
}

/** Resolve the origin to embed in the join QR code. */
export function appOrigin(req: NextRequest): string {
  const configured = process.env.NEXT_PUBLIC_APP_ORIGIN?.trim()
  if (configured) return configured.replace(/\/$/, '')

  const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host')
  const proto = req.headers.get('x-forwarded-proto') || (process.env.VERCEL ? 'https' : 'http')
  if (host) return `${proto}://${host}`
  return new URL(req.url).origin
}
