import fs from 'node:fs'
import path from 'node:path'
import { DatabaseSync } from 'node:sqlite'

/**
 * SQLite is the source of truth for content (quiz, questions, images) and for
 * the durable record of a run (participants, answers). The live game clock and
 * hot tallies live in memory in `engine.ts` -- see the README for why.
 *
 * The connection is cached on `globalThis` so Next.js dev-server hot reloads
 * don't open a second handle to the same file.
 */

declare global {
  // eslint-disable-next-line no-var
  var __quizDb: DatabaseSync | undefined
}

const SCHEMA = `
CREATE TABLE IF NOT EXISTS quizzes (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  description         TEXT NOT NULL DEFAULT '',
  default_timer       INTEGER NOT NULL DEFAULT 5,
  reveal_seconds      INTEGER NOT NULL DEFAULT 5,
  leaderboard_seconds INTEGER NOT NULL DEFAULT 5,
  ready_seconds       INTEGER NOT NULL DEFAULT 3,
  created_at          INTEGER NOT NULL,
  updated_at          INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS questions (
  id            TEXT PRIMARY KEY,
  quiz_id       TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,
  prompt        TEXT NOT NULL,
  options       TEXT NOT NULL,           -- JSON array of strings
  correct_index INTEGER NOT NULL,
  timer_seconds INTEGER NOT NULL DEFAULT 5,
  explanation   TEXT,
  image_id      TEXT REFERENCES images(id) ON DELETE SET NULL,
  position      INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_questions_quiz ON questions(quiz_id, position);

CREATE TABLE IF NOT EXISTS images (
  id         TEXT PRIMARY KEY,
  mime       TEXT NOT NULL,
  bytes      BLOB NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS runs (
  id               TEXT PRIMARY KEY,
  quiz_id          TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  pin              TEXT NOT NULL,
  seed             TEXT NOT NULL,
  status           TEXT NOT NULL,        -- WAITING | LIVE | PAUSED | COMPLETED
  phase            TEXT NOT NULL,
  round_index      INTEGER NOT NULL DEFAULT -1,
  phase_started_at INTEGER NOT NULL DEFAULT 0,
  phase_ends_at    INTEGER NOT NULL DEFAULT 0,
  question_ids     TEXT NOT NULL DEFAULT '[]',
  started_at       INTEGER,
  ended_at         INTEGER,
  created_at       INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs(status, created_at);

CREATE TABLE IF NOT EXISTS participants (
  id           TEXT PRIMARY KEY,
  run_id       TEXT NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  avatar_seed  TEXT NOT NULL,
  joined_at    INTEGER NOT NULL,
  last_seen_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_participants_run ON participants(run_id);

CREATE TABLE IF NOT EXISTS answers (
  run_id         TEXT NOT NULL,
  participant_id TEXT NOT NULL,
  question_id    TEXT NOT NULL,
  round_index    INTEGER NOT NULL,
  choice         INTEGER NOT NULL,
  elapsed_ms     INTEGER NOT NULL,
  correct        INTEGER NOT NULL,
  points         INTEGER NOT NULL,
  created_at     INTEGER NOT NULL,
  PRIMARY KEY (run_id, participant_id, question_id)
);
CREATE INDEX IF NOT EXISTS idx_answers_run ON answers(run_id);
`

function resolveDbPath() {
  const configured = process.env.DATABASE_PATH || (process.env.VERCEL ? '/tmp/quiz.db' : 'data/quiz.db')
  return path.isAbsolute(configured)
    ? configured
    : path.join(process.cwd(), configured)
}

function open(): DatabaseSync {
  const file = resolveDbPath()
  fs.mkdirSync(path.dirname(file), { recursive: true })

  const db = new DatabaseSync(file)
  // WAL lets the many concurrent readers proceed while answers are being
  // flushed, and `synchronous = NORMAL` keeps those flushes cheap.
  db.exec('PRAGMA journal_mode = WAL;')
  db.exec('PRAGMA synchronous = NORMAL;')
  db.exec('PRAGMA foreign_keys = ON;')
  db.exec(SCHEMA)
  return db
}

export function getDb(): DatabaseSync {
  if (!globalThis.__quizDb) {
    globalThis.__quizDb = open()
  }
  return globalThis.__quizDb
}

/** Short, URL-safe, collision-resistant id. */
export function newId(prefix = ''): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  let out = ''
  for (const b of bytes) out += b.toString(16).padStart(2, '0')
  return prefix ? `${prefix}_${out}` : out
}

/** Six-digit game PIN, shown on the host screen and projector. */
export function newPin(): string {
  const bytes = new Uint8Array(4)
  crypto.getRandomValues(bytes)
  const n =
    ((bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]) >>> 0
  return String(100000 + (n % 900000))
}
