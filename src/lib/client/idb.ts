/**
 * Participant session persistence.
 *
 * IndexedDB holds just enough to survive a refresh or a dropped connection:
 * who this person is and which run they belong to. It deliberately holds *no*
 * scores and *no* answers -- the server is the only authority on those, so
 * there is nothing here worth tampering with.
 *
 * A localStorage mirror is kept as a fallback because IndexedDB is unavailable
 * in some private-browsing modes, and losing a session mid-quiz is worse than
 * the redundancy.
 */

const DB_NAME = 'engineers-day-quiz'
const STORE = 'session'
const KEY = 'current'
const VERSION = 1
const MIRROR_KEY = 'edq.session'
const LEGACY_MIRROR_KEY = 'tdq.session'

export interface StoredSession {
  participantId: string
  name: string
  avatarSeed: string
  runId: string
  quizName?: string
  savedAt: number
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'))
      return
    }
    const request = indexedDB.open(DB_NAME, VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE)
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('IndexedDB open failed'))
  })
}

function readMirror(): StoredSession | null {
  try {
    const raw = localStorage.getItem(MIRROR_KEY) || localStorage.getItem(LEGACY_MIRROR_KEY)
    return raw ? (JSON.parse(raw) as StoredSession) : null
  } catch {
    return null
  }
}

function writeMirror(session: StoredSession | null) {
  try {
    if (session) localStorage.setItem(MIRROR_KEY, JSON.stringify(session))
    else localStorage.removeItem(MIRROR_KEY)
  } catch {
    /* storage disabled -- nothing we can do, and nothing critical is lost */
  }
}

export async function saveSession(session: StoredSession): Promise<void> {
  writeMirror(session)
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put(session, KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
      tx.onabort = () => reject(tx.error)
    })
    db.close()
  } catch {
    /* the mirror already has it */
  }
}

export async function loadSession(): Promise<StoredSession | null> {
  try {
    const db = await openDb()
    const value = await new Promise<StoredSession | null>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly')
      const request = tx.objectStore(STORE).get(KEY)
      request.onsuccess = () => resolve((request.result as StoredSession) ?? null)
      request.onerror = () => reject(request.error)
    })
    db.close()
    if (value) return value
  } catch {
    /* fall through to the mirror */
  }
  return readMirror()
}

export async function clearSession(): Promise<void> {
  writeMirror(null)
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).delete(KEY)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    db.close()
  } catch {
    /* nothing to clear */
  }
}
