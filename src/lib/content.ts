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
// Seed content -- the 15 official questions from the docx file
// ---------------------------------------------------------------------------

function seedQuestions(quizId: string) {
  const seeds: QuestionInput[] = [
    {
      type: 'MCQ',
      prompt: 'What is the normal average human body temperature?',
      options: ['36.0°C', '37.0°C', '38.0°C', '35.0°C'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation:
        '🌡️ Fun Fact: 37.0°C (98.6°F) was established as the standard normal human body temperature by German physician Carl Wunderlich in 1851.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'Which blood group is known as the "universal donor"?',
      options: ['AB positive', 'O negative', 'B positive', 'O positive'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation:
        '🩸 Fun Fact: O negative red blood cells can be given to patients of any blood type because they lack A, B, and Rh antigens.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'In dental terminology, "caries" refers to:',
      options: ['Gum inflammation', 'Tooth decay', 'Jaw misalignment', 'Tooth sensitivity'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation:
        '🦷 Fun Fact: Dental caries (cavities) is one of the most common chronic conditions worldwide, caused by bacteria producing acids that break down tooth enamel.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt:
        'In the ABCDE primary survey used in emergency/nursing assessment, what do the first three letters stand for?',
      options: [
        'Airway, Breathing, Circulation',
        'Alertness, Blood pressure, Consciousness',
        'Appearance, Behavior, Colour',
        'Assess, Bandage, Call',
      ],
      correctIndex: 0,
      timerSeconds: 15,
      explanation:
        '🚑 Fun Fact: ABCDE stands for Airway, Breathing, Circulation, Disability, and Exposure — the systematic protocol for assessing critical emergency patients.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'Which planet in our solar system has the shortest day (fastest rotational period)?',
      options: ['Earth', 'Jupiter', 'Saturn', 'Neptune'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation:
        '🪐 Fun Fact: Jupiter rotates on its axis in just under 10 hours (about 9 hours and 55 minutes), giving it the shortest day of any planet in our solar system.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'The Tropic of Cancer does NOT pass through which of the following Indian states?',
      options: ['Gujarat', 'Madhya Pradesh', 'Kerala', 'West Bengal'],
      correctIndex: 2,
      timerSeconds: 15,
      explanation:
        '📍 Fun Fact: The Tropic of Cancer passes through 8 Indian states: Gujarat, Rajasthan, Madhya Pradesh, Chhattisgarh, Jharkhand, West Bengal, Tripura, and Mizoram. Kerala is located much further south.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: "Which gas is the most abundant in Earth's atmosphere by volume?",
      options: ['Oxygen', 'Carbon dioxide', 'Nitrogen', 'Argon'],
      correctIndex: 2,
      timerSeconds: 15,
      explanation:
        "🌍 Fun Fact: Nitrogen makes up roughly 78% of Earth's atmosphere, followed by Oxygen at approximately 21%.",
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'Which prestigious civilian award did Dr. Radhakrishnan receive in 1954?',
      options: ['Padma Vibhushan', 'Bharat Ratna', 'Padma Bhushan', 'Param Vir Chakra'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation:
        '🏆 Fun Fact: Dr. Sarvepalli Radhakrishnan was awarded the Bharat Ratna in 1954, the very year the award was instituted.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt:
        "Dr. Radhakrishnan's systematic two-volume study of Indian philosophical traditions was published in which years?",
      options: ['1919 and 1923', '1923 and 1927', '1927 and 1931', '1931 and 1936'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation:
        "📚 Fun Fact: Dr. Radhakrishnan's landmark treatise 'Indian Philosophy' was published in two volumes in 1923 and 1927, establishing Indian philosophy in global academic discourse.",
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'During which years did Dr. Radhakrishnan serve as the President of India?',
      options: ['1950–1957', '1957–1962', '1962–1967', '1967–1972'],
      correctIndex: 2,
      timerSeconds: 15,
      explanation:
        "🇮🇳 Fun Fact: Dr. Radhakrishnan served as the 2nd President of India from 1962 to 1967, after serving as India's 1st Vice President from 1952 to 1962.",
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt:
        "What is the highest NIRF 'University' category ranking Yenepoya (Deemed to be University) has achieved to date?",
      options: ['97', '85', '65', '15'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation:
        "🎓 Fun Fact: Yenepoya (Deemed to be University) achieved a rank of 85 in the NIRF 'University' category rankings.",
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'Which was the first institution established under the Islamic Academy of Education?',
      options: [
        'Yenepoya Medical College',
        'Yenepoya Dental College',
        'Yenepoya Nursing College',
        'Yenepoya Physiotherapy College',
      ],
      correctIndex: 1,
      timerSeconds: 15,
      explanation:
        '🏫 Fun Fact: Yenepoya Dental College was established in 1992 as the pioneer institution under the Islamic Academy of Education.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'Which planet is closest to the Sun?',
      options: ['Venus', 'Mercury', 'Earth', 'Mars'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation:
        '☀️ Fun Fact: Mercury is the smallest planet in the Solar System and the closest to the Sun, orbiting it in just 88 days.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'In which year was Dr. Sarvepalli Radhakrishnan born?',
      options: ['1886', '1888', '1890', '1892'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation:
        '✨ Fun Fact: Dr. Sarvepalli Radhakrishnan was born on September 5, 1888, in Thiruttani, Tamil Nadu.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt:
        "As per Outlook India's 2025 rankings, Yenepoya climbed 26 ranks in the 'Deemed To Be University' category to reach which position?",
      options: ['#5', '#8', '#11', '#14'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation:
        "📊 Fun Fact: Yenepoya achieved a remarkable 26-rank jump to secure the #8 rank among Deemed to be Universities in Outlook India's 2025 rankings.",
      imageId: null,
    },
  ]

  for (const seed of seeds) createQuestion(quizId, seed)
}
