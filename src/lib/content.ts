import fs from 'node:fs'
import path from 'node:path'
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

        if (
          qCount.count === 0 ||
          (firstQ && firstQ.prompt.includes('human body temperature'))
        ) {
          db.prepare('DELETE FROM questions WHERE quiz_id = ?').run(row.id)
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
// Seed content -- 20 official Engineers' Day questions from INGENIUM QUIZ
// ---------------------------------------------------------------------------

function loadSeedImage(relativePublicPath: string, mime = 'image/png'): string | null {
  const candidates = [
    path.join(process.cwd(), 'public', relativePublicPath),
    path.join(process.cwd(), relativePublicPath),
    path.join(__dirname, '..', '..', 'public', relativePublicPath),
    path.join(__dirname, '..', 'public', relativePublicPath),
  ]
  for (const fullPath of candidates) {
    try {
      if (fs.existsSync(fullPath)) {
        const bytes = fs.readFileSync(fullPath)
        return saveImage(mime, bytes)
      }
    } catch {}
  }
  return null
}

function seedQuestions(quizId: string) {
  const demonCoreImg = loadSeedImage('quiz-images/demon-core.png', 'image/png')
  const littleBoyImg = loadSeedImage('quiz-images/little-boy.png', 'image/png')
  const atalTunnelImg = loadSeedImage('quiz-images/atal-tunnel.jpg', 'image/jpeg')
  const voyagerImg = loadSeedImage('quiz-images/voyager.jpg', 'image/jpeg')
  const maglevImg = loadSeedImage('quiz-images/maglev.jpg', 'image/jpeg')

  const seeds: QuestionInput[] = [
    {
      type: 'MCQ',
      prompt: 'Who is widely regarded as the “Father of Modern Indian Engineering” and was awarded the Bharat Ratna?',
      options: ['Sir M. Visvesvaraya', 'Sir C. V. Raman', 'Sir M. S. Swaminathan', 'Sir A. P. J. Abdul Kalam'],
      correctIndex: 0,
      timerSeconds: 15,
      explanation: "Sir M. Visvesvaraya was a pioneer Indian civil engineer, scholar, and statesman. His birthday, September 15, is celebrated as National Engineers' Day in India.",
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'What was the infamous plutonium sphere at the Los Alamos laboratory nicknamed after two scientists died in separate criticality accidents involving it?',
      options: ['The Black Core', 'The Demon Core', 'The Atomic Core', 'The Death Sphere'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation: 'The Demon Core was a 6.2-kilogram subcritical mass of plutonium that accidentally reached criticality in 1945 and 1946, fatally irradiating scientists Harry Daghlian and Louis Slotin.',
      imageId: demonCoreImg,
    },
    {
      type: 'MCQ',
      prompt: 'What was the codename of the atomic bomb dropped on Hiroshima on August 6, 1945?',
      options: ['Fat Man', 'Little Boy', 'The Gadget', 'Thin Man'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation: 'Little Boy was the gun-type uranium weapon dropped on Hiroshima. Fat Man was the implosion plutonium weapon dropped on Nagasaki three days later.',
      imageId: littleBoyImg,
    },
    {
      type: 'MCQ',
      prompt: 'Which tunnel, inaugurated in 2020, is one of the world’s longest highway tunnels above 10,000 feet and connects Manali with the Lahaul-Spiti region?',
      options: ['Atal Tunnel', 'Rohtang Tunnel', 'Zojila Tunnel', 'Sela Tunnel'],
      correctIndex: 0,
      timerSeconds: 15,
      explanation: 'Atal Tunnel (9.02 km long), built under the Rohtang Pass in Himachal Pradesh, is one of the highest and longest vehicular tunnels in the world, providing year-round all-weather connectivity.',
      imageId: atalTunnelImg,
    },
    {
      type: 'MCQ',
      prompt: 'Which antibiotic was accidentally discovered by Alexander Fleming in 1928 and went on to revolutionize the treatment of bacterial infections?',
      options: ['Penicillin', 'Streptomycin', 'Tetracycline', 'Amoxicillin'],
      correctIndex: 0,
      timerSeconds: 15,
      explanation: 'Sir Alexander Fleming discovered penicillin in 1928 after observing that a Penicillium notatum mould contaminating a petri dish inhibited the growth of surrounding staphylococci.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'A futuristic “space elevator” could theoretically use an extremely strong, lightweight material to form a cable extending from Earth toward space. Which material is considered one of the leading candidates for such a cable?',
      options: ['Carbon Nanotubes', 'Graphene', 'Kevlar', 'Carbon Fiber'],
      correctIndex: 0,
      timerSeconds: 15,
      explanation: 'Carbon nanotubes possess exceptional theoretical tensile strength (exceeding 100 GPa) combined with low density, making them a leading theoretical candidate for space elevator tether cables.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'Which aerospace company successfully demonstrated the routine recovery and reuse of orbital-class rocket boosters with its Falcon 9 program?',
      options: ['SpaceX', 'Blue Origin', 'Rocket Lab', 'NASA'],
      correctIndex: 0,
      timerSeconds: 15,
      explanation: 'SpaceX pioneered aerospace reuse by achieving the first vertical landing of an orbital-class booster in December 2015 and routinely re-flying Falcon 9 first stages.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: "Which artifact was designed as a time capsule of Earth's life and culture, carrying photographs, music, natural sounds, and greetings in numerous human languages for a hypothetical extraterrestrial audience?",
      options: ['Pioneer Plaque', 'Arecibo Message', 'Golden Record', 'Earth Archive'],
      correctIndex: 2,
      timerSeconds: 15,
      explanation: 'The Voyager Golden Records are gold-plated copper phonograph records carrying sounds and imagery of Earth, placed aboard both Voyager 1 and Voyager 2 spacecraft launched in 1977.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'Launched in 1977 as part of NASA’s mission to explore the outer planets, which spacecraft later became the first human-made object to enter interstellar space and continues to transmit scientific data back to Earth?',
      options: ['Pioneer 10', 'Voyager 1', 'Voyager 2', 'New Horizons'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation: 'Voyager 1 crossed the heliopause into interstellar space in August 2012, becoming humanity\'s farthest active spacecraft from Earth at over 24 billion kilometers away.',
      imageId: voyagerImg,
    },
    {
      type: 'MCQ',
      prompt: 'The “black box” in an aircraft is actually painted what colour to make it easier to find after a crash?',
      options: ['Orange', 'Yellow', 'Red', 'Green'],
      correctIndex: 0,
      timerSeconds: 15,
      explanation: 'Aircraft flight recorders ("black boxes") are painted in bright, high-visibility fluorescent orange with reflective strips so search and rescue teams can spot them easily in wreckage and underwater.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'Which railway technology allows trains to travel at very high speeds by eliminating direct contact between the vehicle and the track?',
      options: ['Maglev', 'Monorail', 'Hyperloop', 'Bullet Train'],
      correctIndex: 0,
      timerSeconds: 15,
      explanation: 'Magnetic levitation (Maglev) utilizes electromagnetic repulsion and attraction to suspend, guide, and propel trains above tracks with zero physical mechanical contact, reducing friction dramatically.',
      imageId: maglevImg,
    },
    {
      type: 'MCQ',
      prompt: 'Which ancient monument is known for its exceptionally precise alignment with the four cardinal directions?',
      options: ['Stonehenge', 'Great Pyramid of Giza', 'Petra', 'Colosseum'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation: 'The Great Pyramid of Giza in Egypt aligns to true north with astounding engineering precision, having an orientation error of less than four-sixtieths of a single degree.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'Which skyscraper, completed in 2010, currently holds the record as the world’s tallest building?',
      options: ['Shanghai Tower', 'Burj Khalifa', 'Taipei 101', 'One World Trade Center'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation: 'Burj Khalifa in Dubai, United Arab Emirates, stands at 828 meters (2,717 feet) tall, engineered with a distinctive Y-shaped tri-axial buttressed core to withstand vortex shedding and high winds.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'Which space telescope uses a large segmented primary mirror and operates near the Sun–Earth L2 point to observe some of the universe’s earliest galaxies?',
      options: ['Hubble Space Telescope', 'James Webb Space Telescope', 'Chandra X-ray Observatory', 'Spitzer Space Telescope'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation: 'The James Webb Space Telescope (JWST) features an 18-segment gold-coated beryllium primary mirror operating at the Second Lagrange Point (L2), approximately 1.5 million km from Earth.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'What was the name of the first known self-replicating program designed to move between computers, created as an early experiment in computer networking?',
      options: ['Creeper', 'Elk Cloner', 'Brain', 'Reaper'],
      correctIndex: 0,
      timerSeconds: 15,
      explanation: "Written by Bob Thomas at BBN in 1971 for the ARPANET on DEC PDP-10 mainframes, Creeper jumped across network nodes displaying: 'I'm the creeper, catch me if you can!'.",
      imageId: null,
    },
    {
      type: 'TRUE_FALSE',
      prompt: 'True or False: The footprints left by astronauts on the Moon could remain there for millions of years.',
      options: ['True', 'False'],
      correctIndex: 0,
      timerSeconds: 15,
      explanation: 'Because the Moon possesses no atmosphere, liquid water, or volcanic weather cycles to erode its surface, astronaut footprints in lunar regolith can persist for millions of years.',
      imageId: null,
    },
    {
      type: 'TRUE_FALSE',
      prompt: 'True or False: Since sound cannot travel through the vacuum of space, astronauts inside a spacecraft cannot hear anything produced by another astronaut unless the sound is transmitted electronically through a radio system.',
      options: ['True', 'False'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation: 'Inside a pressurized spacecraft or orbital habitat, air is present to propagate sound waves normally, allowing astronauts to converse and hear sounds without any electronic radios.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'A machine accepts a 3-digit access code.\n\nYou know:\n• 682 → One digit is correct and in the correct position.\n• 614 → One digit is correct but in the wrong position.\n• 206 → Two digits are correct but both are in the wrong positions.\n• 738 → None of the digits are correct.\n• 780 → One digit is correct but in the wrong position.\n\nWhat is the code?',
      options: ['042', '024', '062', '402'],
      correctIndex: 0,
      timerSeconds: 20,
      explanation: 'Step-by-step logic:\n1. 738 has no correct digits → eliminate 7, 3, 8.\n2. In 780, only 0 remains and is in the wrong position (pos 3), so 0 is in pos 1 or 2.\n3. In 682, 8 is eliminated. If 6 were correct at pos 1, clue 614 says 6 is in wrong position (contradiction). Thus 2 is correct at pos 3 (code: _ _ 2).\n4. In 206, 2 is in pos 3 (wrong position here in pos 1, matches!). Since 6 is out, 0 is the second correct digit and must be in pos 1 (code: 0 _ 2).\n5. In 614, 4 is in wrong position (pos 3), so 4 must be in pos 2.\n→ The access code is 042.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'In a race, Rahul finishes 7th from the front and 12th from the back. How many people participated in the race?',
      options: ['18', '19', '20', '21'],
      correctIndex: 0,
      timerSeconds: 15,
      explanation: 'Total participants = (Position from front) + (Position from back) - 1 = 7 + 12 - 1 = 18 participants.',
      imageId: null,
    },
    {
      type: 'MCQ',
      prompt: 'A father is 3 times as old as his son. After 10 years, the father will be twice as old as his son. What is the son\'s present age?',
      options: ['5 years', '10 years', '15 years', '20 years'],
      correctIndex: 1,
      timerSeconds: 15,
      explanation: "Let son's age = S. Father's age F = 3S.\nIn 10 years: (3S + 10) = 2(S + 10)\n3S + 10 = 2S + 20 → S = 10 years old.",
      imageId: null,
    },
  ]

  for (const seed of seeds) createQuestion(quizId, seed)
}
