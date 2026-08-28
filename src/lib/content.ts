import { getDb, newId } from './db'
import type { Question, Quiz } from './types'

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

/**
 * This app runs a single event, so there is exactly one quiz row. Creating it
 * on first read means a fresh checkout is immediately usable.
 */
export function getQuiz(): Quiz {
  const db = getDb()
  const row = db
    .prepare('SELECT * FROM quizzes ORDER BY created_at ASC LIMIT 1')
    .get() as unknown as QuizRow | undefined

  if (row) return mapQuiz(row)

  const now = Date.now()
  const id = newId('quiz')
  db.prepare(
    `INSERT INTO quizzes
       (id, name, description, default_timer, reveal_seconds,
        leaderboard_seconds, ready_seconds, created_at, updated_at)
     VALUES (?, ?, ?, 5, 3, 3, 3, ?, ?)`,
  ).run(
    id,
    "Teachers' Day Quiz",
    'A celebration of the teachers who inspire us.',
    now,
    now,
  )
  seedQuestions(id)
  return getQuiz()
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
  const quiz = getQuiz()
  const timerSeconds = input.timerSeconds && input.timerSeconds > 0 ? input.timerSeconds : quiz.defaultTimer
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
  const quiz = getQuiz()
  const timerSeconds = input.timerSeconds && input.timerSeconds > 0 ? input.timerSeconds : quiz.defaultTimer
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
// Seed content -- the five questions the event starts with
// ---------------------------------------------------------------------------

function seedQuestions(quizId: string) {
  const seeds: QuestionInput[] = [
    {
      type: 'MCQ',
      prompt: "When is Teachers' Day celebrated in India?",
      options: ['August 15', 'September 5', 'October 2', 'November 14'],
      correctIndex: 1,
      timerSeconds: 5,
      explanation:
        "🎓 Fun Fact: September 5 marks the birthday of Dr. Sarvepalli Radhakrishnan. When his students wanted to celebrate his birthday, he said: 'Instead of celebrating my birthday, it would be my proud privilege if September 5 is observed as Teachers' Day!'",
      imageId: null,
    },
    {
      type: 'TRUE_FALSE',
      prompt:
        "Teachers' Day in India is celebrated on the birthday of Dr. Sarvepalli Radhakrishnan.",
      options: ['True', 'False'],
      correctIndex: 0,
      timerSeconds: 5,
      explanation:
        '🌟 Fun Fact: Dr. Radhakrishnan was a world-renowned scholar and professor at Oxford, Calcutta, and Mysore Universities. He was nominated for the Nobel Prize 27 times during his life!',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'Which of these qualities makes an inspiring teacher?',
      options: ['Patience', 'Curiosity', 'Empathy', 'All of the above'],
      correctIndex: 3,
      timerSeconds: 5,
      explanation:
        "💡 Fun Fact: Patience, Curiosity, and Empathy are known as the Golden Triangle of inspiring teaching. Swami Vivekananda said, 'Education is the manifestation of the perfection already in man.'",
      imageId: null,
    },
    {
      type: 'IMAGE',
      prompt: 'What object is commonly associated with a traditional classroom?',
      options: ['Blackboard', 'Football', 'Helmet', 'Guitar'],
      correctIndex: 0,
      timerSeconds: 5,
      explanation:
        '✏️ Fun Fact: The blackboard was invented in Scotland in 1801 by James Pillans, who joined small individual slates together so an entire classroom could learn simultaneously!',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: "Dr. Sarvepalli Radhakrishnan served as India's:",
      options: [
        'First Prime Minister',
        'First Vice President',
        'Second President',
        'First Chief Justice',
      ],
      correctIndex: 2,
      timerSeconds: 5,
      explanation:
        '🏆 Fun Fact: Dr. Radhakrishnan was India’s 1st Vice President (1952–1962) and 2nd President (1962–1967). In 1954, he received the Bharat Ratna, India’s highest civilian award.',
      imageId: null,
    },
  ]

  for (const seed of seeds) createQuestion(quizId, seed)
}
