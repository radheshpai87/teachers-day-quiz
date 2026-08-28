import { notFound } from 'next/navigation'

/**
 * The host area lives at a configurable, unguessable path (never `/admin`).
 * `app/[adminRoute]/...` matches any single top-level segment; every page in
 * that tree calls `assertAdminRoute` so anything but the configured value 404s
 * exactly like a non-existent page would.
 */

export const DEFAULT_ADMIN_ROUTE = 'event-control-x7k92m'

export function getAdminRoute(): string {
  const configured = process.env.ADMIN_ROUTE_SECRET?.trim()
  return configured && configured.length > 0 ? configured : DEFAULT_ADMIN_ROUTE
}

/** 404 unless the incoming segment matches the configured secret. */
export function assertAdminRoute(segment: string) {
  if (segment !== getAdminRoute()) notFound()
}

/** Build a path inside the host area, e.g. adminPath('live') -> '/secret/live'. */
export function adminPath(...segments: string[]): string {
  return `/${[getAdminRoute(), ...segments].join('/')}`
}

export const ADMIN_NAV = [
  { href: '', label: 'Dashboard' },
  { href: 'questions', label: 'Questions' },
  { href: 'live', label: 'Live Quiz' },
  { href: 'results', label: 'Results' },
] as const
