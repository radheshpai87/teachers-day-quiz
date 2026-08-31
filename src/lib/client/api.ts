'use client'

/** Tiny fetch wrappers so components don't repeat error handling. */

async function parse<T>(res: Response): Promise<T> {
  const text = await res.text()
  let body: unknown = null
  try {
    body = text ? JSON.parse(text) : null
  } catch {
    body = null
  }
  if (!res.ok) {
    let message = ''
    if (body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string') {
      message = (body as { error: string }).error
    } else if (res.status === 429) {
      message = 'Rate limit exceeded (Status 429). Please wait a few seconds and try again.'
    } else if (res.status === 401) {
      message = 'Host session unauthenticated or expired (Status 401). Please log in again.'
    } else if (res.status === 409) {
      message = 'Conflict action (Status 409). The quiz phase or state action is not valid.'
    } else {
      message = `Request failed with HTTP Status ${res.status}.`
    }
    throw new Error(message)
  }
  return body as T
}

export async function apiGet<T>(url: string): Promise<T> {
  return parse<T>(await fetch(url, { cache: 'no-store' }))
}

export async function apiPost<T>(url: string, body?: unknown): Promise<T> {
  return parse<T>(
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  )
}

export async function apiPut<T>(url: string, body?: unknown): Promise<T> {
  return parse<T>(
    await fetch(url, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  )
}

export async function apiDelete<T>(url: string): Promise<T> {
  return parse<T>(await fetch(url, { method: 'DELETE' }))
}
