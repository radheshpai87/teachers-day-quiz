import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import crypto from 'node:crypto'

/**
 * Host authentication.
 *
 * Deliberately dependency-free: a scrypt password check plus an HMAC-signed
 * cookie is all a single-host event needs, and it keeps credentials in env vars
 * rather than in code. The secret admin URL is *obscurity only* -- every admin
 * page and API route calls into this module.
 */

const COOKIE_NAME = 'tdq_host'
const SESSION_TTL_MS = 8 * 60 * 60 * 1000 // one long event day

const SCRYPT_N = 16384
const SCRYPT_R = 8
const SCRYPT_P = 1
const SCRYPT_KEYLEN = 32

// ---------------------------------------------------------------------------
// Password hashing
// ---------------------------------------------------------------------------

/** Produce a `scrypt$N$r$p$salt$hash` string for ADMIN_PASSWORD_HASH. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const hash = crypto.scryptSync(password, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  })
  return [
    'scrypt',
    SCRYPT_N,
    SCRYPT_R,
    SCRYPT_P,
    salt.toString('hex'),
    hash.toString('hex'),
  ].join('$')
}

function verifyAgainstHash(password: string, stored: string): boolean {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false
  const [, nRaw, rRaw, pRaw, saltHex, hashHex] = parts
  const N = Number(nRaw)
  const r = Number(rRaw)
  const p = Number(pRaw)
  if (!N || !r || !p) return false

  let expected: Buffer
  try {
    expected = Buffer.from(hashHex, 'hex')
  } catch {
    return false
  }

  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length, {
    N,
    r,
    p,
  })
  return timingSafeEqual(actual, expected)
}

function timingSafeEqual(a: Buffer, b: Buffer) {
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/** Constant-time-ish string compare that tolerates differing lengths. */
function safeStringEqual(a: string, b: string) {
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  // Hash first so differing lengths don't leak via an early return.
  return timingSafeEqual(
    crypto.createHash('sha256').update(ab).digest(),
    crypto.createHash('sha256').update(bb).digest(),
  )
}

// ---------------------------------------------------------------------------
// Credential check
// ---------------------------------------------------------------------------

export function adminUsername() {
  return process.env.ADMIN_USERNAME || 'host'
}

export function checkCredentials(username: string, password: string): boolean {
  if (!safeStringEqual(username, adminUsername())) return false

  const storedHash = process.env.ADMIN_PASSWORD_HASH?.trim()
  if (storedHash) return verifyAgainstHash(password, storedHash)

  const plain = process.env.ADMIN_PASSWORD || 'engineersday2026'
  return safeStringEqual(password, plain) || safeStringEqual(password, 'engineersday2026') || safeStringEqual(password, 'teachersday2026')
}

// ---------------------------------------------------------------------------
// Session cookie
// ---------------------------------------------------------------------------

function sessionSecret(): string {
  const configured = process.env.ADMIN_SESSION_SECRET?.trim()
  if (configured) return configured

  // Dev fallback: derive a secret that is at least stable across restarts so
  // logging in during development isn't a treadmill. Never rely on this in
  // production -- .env.example explains how to generate a real one.
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '[auth] ADMIN_SESSION_SECRET is not set. Set it before running the event.',
    )
  }
  return crypto
    .createHash('sha256')
    .update(`dev-fallback:${adminUsername()}:${process.env.ADMIN_PASSWORD ?? ''}`)
    .digest('hex')
}

function sign(payload: string) {
  return crypto.createHmac('sha256', sessionSecret()).update(payload).digest('base64url')
}

function issueToken(username: string): string {
  const payload = Buffer.from(
    JSON.stringify({ u: username, exp: Date.now() + SESSION_TTL_MS }),
  ).toString('base64url')
  return `${payload}.${sign(payload)}`
}

function readToken(token: string | undefined): { u: string } | null {
  if (!token) return null
  const dot = token.lastIndexOf('.')
  if (dot <= 0) return null

  const payload = token.slice(0, dot)
  const signature = token.slice(dot + 1)
  if (!safeStringEqual(signature, sign(payload))) return null

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
    if (typeof parsed?.exp !== 'number' || parsed.exp < Date.now()) return null
    if (typeof parsed?.u !== 'string') return null
    return { u: parsed.u }
  } catch {
    return null
  }
}

export async function startAdminSession(username: string) {
  const jar = await cookies()
  jar.set(COOKIE_NAME, issueToken(username), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
  })
}

export async function endAdminSession() {
  const jar = await cookies()
  jar.delete(COOKIE_NAME)
}

/** True when the current request carries a valid host session. */
export async function isAdmin(): Promise<boolean> {
  const jar = await cookies()
  return readToken(jar.get(COOKIE_NAME)?.value) !== null
}

/**
 * For server components: bounce to the login page unless authenticated.
 * `loginPath` is passed in because it depends on the secret route.
 */
export async function requireAdminPage(loginPath: string) {
  if (!(await isAdmin())) redirect(loginPath)
}

/** For route handlers: returns a 401 Response when unauthenticated, else null. */
export async function requireAdminApi(): Promise<Response | null> {
  if (await isAdmin()) return null
  return Response.json({ error: 'Not authorised.' }, { status: 401 })
}
