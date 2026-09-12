import crypto from 'node:crypto'
import { getDb, newId } from './db'
import type { Question, Quiz } from './types'
import encryptedSeed from './encrypted-seed.json'

/**
 * Data access for quiz content. Thin, synchronous wrappers over SQLite --
 * better-sqlite3 is fast enough that a query per admin request is a non-issue,
 * and the participant hot path never touches this file (see `engine.ts`).
 */

interface QuizRow {
  id: string
  name: string
  description: string
  default_timer: number
  reveal_seconds: number
  leaderboard_seconds: number
  ready_seconds: number
}

interface QuestionRow {
  id: string
  quiz_id: string
  type: string
  prompt: string
  options: string
  correct_index: number
  timer_seconds: number
  explanation: string | null
  image_id: string | null
  position: number
}

function mapQuiz(row: QuizRow): Quiz {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    defaultTimer: row.default_timer,
    revealSeconds: row.reveal_seconds,
    leaderboardSeconds: row.leaderboard_seconds,
    readySeconds: row.ready_seconds,
  }
}

function mapQuestion(row: QuestionRow): Question {
  let options: string[]
  try {
    const parsed = JSON.parse(row.options)
    options = Array.isArray(parsed) ? parsed.map(String) : []
  } catch {
    options = []
  }
  return {
    id: row.id,
    quizId: row.quiz_id,
    type: row.type as Question['type'],
    prompt: row.prompt,
    options,
    correctIndex: row.correct_index,
    timerSeconds: row.timer_seconds,
    explanation: row.explanation,
    imageId: row.image_id,
    position: row.position,
  }
}

// ---------------------------------------------------------------------------
// Quiz
// ---------------------------------------------------------------------------

let isSeeding = false

/**
 * This app runs a single event, so there is exactly one quiz row. Creating it
 * on first read means a fresh checkout is immediately usable.
 */
export function getQuiz(): Quiz {
  const db = getDb()
  const row = db
    .prepare('SELECT * FROM quizzes ORDER BY created_at ASC LIMIT 1')
    .get() as unknown as QuizRow | undefined

  if (row) {
    if (row.name.includes("Teachers'") || row.name.includes('Teachers')) {
      db.prepare('UPDATE quizzes SET name = ?, description = ? WHERE id = ?').run(
        "Engineers' Day Quiz",
        'A celebration of innovation, engineering, and the minds shaping our future.',
        row.id,
      )
      row.name = "Engineers' Day Quiz"
      row.description =
        'A celebration of innovation, engineering, and the minds shaping our future.'
    }

    if (!isSeeding) {
      isSeeding = true
      try {
        const qCount = db
          .prepare('SELECT COUNT(*) as count FROM questions WHERE quiz_id = ?')
          .get(row.id) as unknown as { count: number }
        const firstQ = db
          .prepare(
            'SELECT prompt FROM questions WHERE quiz_id = ? ORDER BY position ASC LIMIT 1',
          )
          .get(row.id) as unknown as { prompt: string } | undefined

        if (qCount.count === 0) {
          seedQuestions(row.id)
        }
      } finally {
        isSeeding = false
      }
    }
    return mapQuiz(row)
  }

  const now = Date.now()
  const id = newId('quiz')
  db.prepare(
    `INSERT INTO quizzes
       (id, name, description, default_timer, reveal_seconds,
        leaderboard_seconds, ready_seconds, created_at, updated_at)
     VALUES (?, ?, ?, 15, 3, 3, 3, ?, ?)`,
  ).run(
    id,
    "Engineers' Day Quiz",
    'A celebration of innovation, engineering, and the minds shaping our future.',
    now,
    now,
  )

  if (!isSeeding) {
    isSeeding = true
    try {
      seedQuestions(id)
    } finally {
      isSeeding = false
    }
  }

  const createdRow = db
    .prepare('SELECT * FROM quizzes WHERE id = ?')
    .get(id) as unknown as QuizRow
  return mapQuiz(createdRow)
}

export function updateQuiz(
  id: string,
  patch: Partial<
    Pick<
      Quiz,
      | 'name'
      | 'description'
      | 'defaultTimer'
      | 'revealSeconds'
      | 'leaderboardSeconds'
      | 'readySeconds'
    >
  >,
) {
  const current = getQuiz()
  const next = { ...current, ...patch }
  getDb()
    .prepare(
      `UPDATE quizzes SET
         name = ?, description = ?, default_timer = ?, reveal_seconds = ?,
         leaderboard_seconds = ?, ready_seconds = ?, updated_at = ?
       WHERE id = ?`,
    )
    .run(
      next.name,
      next.description,
      next.defaultTimer,
      next.revealSeconds,
      next.leaderboardSeconds,
      next.readySeconds,
      Date.now(),
      id,
    )
  return getQuiz()
}

export function updateAllQuestionsTimer(quizId: string, timerSeconds: number) {
  getDb()
    .prepare('UPDATE questions SET timer_seconds = ? WHERE quiz_id = ?')
    .run(timerSeconds, quizId)
}

// ---------------------------------------------------------------------------
// Questions
// ---------------------------------------------------------------------------

export function listQuestions(quizId: string): Question[] {
  const rows = getDb()
    .prepare(
      'SELECT * FROM questions WHERE quiz_id = ? ORDER BY position ASC, id ASC',
    )
    .all(quizId) as unknown as QuestionRow[]
  return rows.map(mapQuestion)
}

export function getQuestion(id: string): Question | null {
  const row = getDb()
    .prepare('SELECT * FROM questions WHERE id = ?')
    .get(id) as unknown as QuestionRow | undefined
  return row ? mapQuestion(row) : null
}

export type QuestionInput = Pick<
  Question,
  | 'type'
  | 'prompt'
  | 'options'
  | 'correctIndex'
  | 'timerSeconds'
  | 'explanation'
  | 'imageId'
>

export function createQuestion(quizId: string, input: QuestionInput): Question {
  const db = getDb()
  const timerSeconds = input.timerSeconds && input.timerSeconds > 0 ? input.timerSeconds : 15
  const maxPos = db
    .prepare(
      'SELECT COALESCE(MAX(position), -1) AS pos FROM questions WHERE quiz_id = ?',
    )
    .get(quizId) as unknown as { pos: number }
  const id = newId('q')
  db.prepare(
    `INSERT INTO questions
       (id, quiz_id, type, prompt, options, correct_index, timer_seconds,
        explanation, image_id, position)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    quizId,
    input.type,
    input.prompt,
    JSON.stringify(input.options),
    input.correctIndex,
    timerSeconds,
    input.explanation,
    input.imageId,
    maxPos.pos + 1,
  )
  return getQuestion(id)!
}

export function updateQuestion(id: string, input: QuestionInput): Question | null {
  const timerSeconds = input.timerSeconds && input.timerSeconds > 0 ? input.timerSeconds : 15
  getDb()
    .prepare(
      `UPDATE questions SET
         type = ?, prompt = ?, options = ?, correct_index = ?,
         timer_seconds = ?, explanation = ?, image_id = ?
       WHERE id = ?`,
    )
    .run(
      input.type,
      input.prompt,
      JSON.stringify(input.options),
      input.correctIndex,
      timerSeconds,
      input.explanation,
      input.imageId,
      id,
    )
  return getQuestion(id)
}

export function deleteQuestion(id: string) {
  getDb().prepare('DELETE FROM questions WHERE id = ?').run(id)
}

export function duplicateQuestion(id: string): Question | null {
  const source = getQuestion(id)
  if (!source) return null
  const copy = createQuestion(source.quizId, {
    type: source.type,
    prompt: `${source.prompt} (copy)`,
    options: source.options,
    correctIndex: source.correctIndex,
    timerSeconds: source.timerSeconds,
    explanation: source.explanation,
    imageId: source.imageId,
  })
  // Drop the copy in immediately after the original rather than at the end.
  const ordered = listQuestions(source.quizId)
    .filter((q) => q.id !== copy.id)
    .map((q) => q.id)
  const at = ordered.indexOf(source.id)
  ordered.splice(at + 1, 0, copy.id)
  reorderQuestions(source.quizId, ordered)
  return getQuestion(copy.id)
}

export function reorderQuestions(quizId: string, orderedIds: string[]) {
  const db = getDb()
  const stmt = db.prepare(
    'UPDATE questions SET position = ? WHERE id = ? AND quiz_id = ?',
  )
  db.exec('BEGIN IMMEDIATE;')
  try {
    orderedIds.forEach((id, index) => stmt.run(index, id, quizId))
    db.exec('COMMIT;')
  } catch (err) {
    db.exec('ROLLBACK;')
    throw err
  }
}

// ---------------------------------------------------------------------------
// Images (stored as blobs so there is nothing to sync to a filesystem)
// ---------------------------------------------------------------------------

export function saveImage(mime: string, bytes: Buffer): string {
  const id = newId('img')
  getDb()
    .prepare('INSERT INTO images (id, mime, bytes, created_at) VALUES (?, ?, ?, ?)')
    .run(id, mime, bytes, Date.now())
  return id
}

export function getImage(id: string): { mime: string; bytes: Buffer } | null {
  const row = getDb()
    .prepare('SELECT mime, bytes FROM images WHERE id = ?')
    .get(id) as unknown as { mime: string; bytes: Buffer } | undefined
  return row ?? null
}

// ---------------------------------------------------------------------------
// Seed content -- AES-256-GCM encrypted questions & images
// ---------------------------------------------------------------------------

interface EncryptedSeedBundle {
  iv: string
  tag: string
  data: string
}

interface DecryptedImage {
  ref: string
  mime: string
  dataBase64: string
}

interface DecryptedQuestion {
  type: Question['type']
  prompt: string
  options: string[]
  correctIndex: number
  timerSeconds: number
  explanation: string | null
  imageRef: string | null
}

interface DecryptedPayload {
  version: number
  images: DecryptedImage[]
  questions: DecryptedQuestion[]
}

function seedQuestions(quizId: string) {
  const secretKeyHex = process.env.QUIZ_SEED_KEY?.trim()
  if (!secretKeyHex) {
    console.info(
      '[Quiz Engine] No QUIZ_SEED_KEY configured. Running with empty questions database.',
    )
    return
  }

  try {
    const bundle = encryptedSeed as EncryptedSeedBundle
    const key = Buffer.from(secretKeyHex, 'hex')
    if (key.length !== 32) {
      console.error('[Quiz Engine] QUIZ_SEED_KEY must be a 64-character (32-byte) hex string.')
      return
    }
    const iv = Buffer.from(bundle.iv, 'hex')
    const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv)
    decipher.setAuthTag(Buffer.from(bundle.tag, 'hex'))
    let decrypted = decipher.update(bundle.data, 'base64', 'utf8')
    decrypted += decipher.final('utf8')

    const payload = JSON.parse(decrypted) as DecryptedPayload

    // Save images into SQLite and build a lookup map
    const imageMap: Record<string, string> = {}
    for (const img of payload.images) {
      try {
        const bytes = Buffer.from(img.dataBase64, 'base64')
        const imgId = saveImage(img.mime, bytes)
        imageMap[img.ref] = imgId
      } catch (err) {
        console.error(`[Quiz Engine] Failed to save image ${img.ref}:`, err)
      }
    }

    // Insert questions
    for (const q of payload.questions) {
      const imageId = q.imageRef ? (imageMap[q.imageRef] ?? null) : null
      createQuestion(quizId, {
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        correctIndex: q.correctIndex,
        timerSeconds: q.timerSeconds,
        explanation: q.explanation,
        imageId,
      })
    }
    console.info(
      `[Quiz Engine] Successfully decrypted and loaded ${payload.questions.length} questions into database.`,
    )
  } catch (err) {
    console.error('[Quiz Engine] Failed to decrypt seed questions with QUIZ_SEED_KEY:', err)
  }
}

