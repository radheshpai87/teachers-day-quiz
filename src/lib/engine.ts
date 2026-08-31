import { getDb, newId, newPin } from './db'
import { getQuiz, listQuestions } from './content'
import { frame, getHub } from './bus'
import { seededShuffle } from './rng'
import { MAX_POINTS, SUBMIT_GRACE_MS, scoreAnswer } from './scoring'
import type {
  ClientState,
  HostSnapshot,
  LeaderboardEntry,
  Phase,
  PublicQuestion,
  Question,
  Quiz,
  ResultRow,
  ResultsSummary,
  RunStatus,
  SelfState,
} from './types'

/**
 * The live game engine.
 *
 * Everything the host asked for in one place: the host clicks START once, and
 * this object drives QUESTION -> REVEAL -> LEADERBOARD -> next question ->
 * ... -> COMPLETED on its own `setTimeout` chain. Nothing about the flow depends
 * on a client being connected.
 *
 * Design notes worth knowing before editing:
 *
 * - Hot state (scores, tallies, who answered what) lives in memory. SQLite gets
 *   a batched write once a second. 1,000 participants tapping an answer inside
 *   the same two seconds therefore costs ~2 transactions, not 1,000.
 *
 * - Per-participant question order is *derived* from (run seed, participant id)
 *   rather than stored, so it survives refreshes, reconnects and a server
 *   restart without persisting 1,000 arrays. See `orderFor`.
 *
 * - Every question keeps its own authored timer for both the countdown and the
 *   scoring curve, so two people who receive the same question always face
 *   identical conditions. The shared round window is the pool maximum, which is
 *   what keeps a single global clock valid despite randomised order.
 */

const LEADERBOARD_SIZE = 100
const TALLY_INTERVAL_MS = 1000
const PLAYER_COUNT_THROTTLE_MS = 750
const ANSWER_FLUSH_MS = 1000

interface StoredAnswer {
  questionId: string
  roundIndex: number
  choice: number
  elapsedMs: number
  correct: boolean
  points: number
}

interface EngineParticipant {
  id: string
  name: string
  avatarSeed: string
  joinedAt: number
  score: number
  correct: number
  answered: number
  totalElapsedMs: number
  answers: Map<string, StoredAnswer>
  /** Derived question order for this participant; cached on first use. */
  order: string[]
}

export type SubmitResult =
  | { ok: true }
  | {
      ok: false
      reason: 'CLOSED' | 'STALE' | 'UNKNOWN' | 'DUPLICATE' | 'NOT_OPEN' | 'EXPIRED' | 'INVALID'
      choice?: number
    }

declare global {
  // eslint-disable-next-line no-var
  var __quizEngine: QuizEngine | undefined
}

class QuizEngine {
  private quiz: Quiz
  private questions = new Map<string, Question>()
  private pool: string[] = []

  private runId = ''
  private pin = ''
  private seed = ''

  phase: Phase = 'WAITING'
  roundIndex = -1
  phaseStartedAt = 0
  phaseEndsAt = 0
  answersOpenAt = 0

  private participants = new Map<string, EngineParticipant>()
  private ranked: EngineParticipant[] = []
  private rankMap = new Map<string, number>()
  /** Ranks as of the previous leaderboard, for the movement indicators. */
  private previousRanks = new Map<string, number>()

  /** Cumulative answer counts per question, indexed by option. */
  private distribution = new Map<string, number[]>()
  private roundAnswered = 0
  private roundSpread = [0, 0, 0, 0]
  private roundPerQuestion = new Map<string, number>()

  private phaseTimer: ReturnType<typeof setTimeout> | null = null
  private tallyTimer: ReturnType<typeof setInterval> | null = null
  private playersTimer: ReturnType<typeof setTimeout> | null = null
  private playersDirty = false

  private writeQueue: { participantId: string; answer: StoredAnswer }[] = []
  private flushTimer: ReturnType<typeof setTimeout> | null = null

  /** Remaining phase time captured when the host pauses. */
  private pausedRemainingMs = 0
  private pausedPhase: Phase = 'WAITING'

  constructor() {
    this.quiz = getQuiz()
    this.loadOrCreateRun()
  }

  // -------------------------------------------------------------------------
  // Run lifecycle
  // -------------------------------------------------------------------------

  private loadOrCreateRun() {
    const db = getDb()
    const row = db
      .prepare(
        `SELECT * FROM runs WHERE quiz_id = ? AND status != 'COMPLETED'
         ORDER BY created_at DESC LIMIT 1`,
      )
      .get(this.quiz.id) as
      | {
          id: string
          pin: string
          seed: string
          status: RunStatus
          phase: Phase
          round_index: number
          phase_started_at: number
          phase_ends_at: number
          question_ids: string
        }
      | undefined

    if (!row) {
      this.createRun()
      return
    }

    this.runId = row.id
    this.pin = row.pin
    this.seed = row.seed
    this.phase = row.phase
    this.roundIndex = row.round_index
    this.phaseStartedAt = row.phase_started_at
    this.phaseEndsAt = row.phase_ends_at

    let storedPool: string[] = []
    try {
      const parsed = JSON.parse(row.question_ids)
      if (Array.isArray(parsed)) storedPool = parsed.map(String)
    } catch {
      storedPool = []
    }

    if (row.status === 'WAITING' || storedPool.length === 0) {
      // Nothing in flight: pick up whatever the admin has authored since.
      this.phase = 'WAITING'
      this.roundIndex = -1
      this.loadQuestions()
      this.loadParticipants()
      this.persistRun('WAITING')
      return
    }

    // A run was in flight when the process stopped. Rebuild it exactly.
    this.pool = storedPool
    const missing = this.hydrateQuestions(storedPool)
    if (missing) {
      console.warn('[engine] questions from the in-flight run are gone; ending it.')
      this.phase = 'COMPLETED'
      this.persistRun('COMPLETED')
      return
    }

    this.loadParticipants()
    this.loadAnswers()
    this.recomputeRanks()
    this.recomputeRoundTallies()

    if (this.phase === 'PAUSED') {
      this.pausedPhase = 'QUESTION'
      this.pausedRemainingMs = Math.max(0, this.phaseEndsAt - Date.now())
      return
    }

    // Deadlines are absolute, so a restart simply resumes -- or, if the phase
    // already elapsed while we were down, advances immediately.
    const remaining = this.phaseEndsAt - Date.now()
    if (remaining <= 0) this.advance()
    else this.scheduleAdvance(remaining)
  }

  private createRun() {
    this.runId = newId('run')
    this.pin = newPin()
    this.seed = newId('seed')
    this.phase = 'WAITING'
    this.roundIndex = -1
    this.phaseStartedAt = 0
    this.phaseEndsAt = 0
    this.participants.clear()
    this.distribution.clear()
    this.previousRanks.clear()
    this.rankMap.clear()
    this.ranked = []
    this.loadQuestions()

    getDb()
      .prepare(
        `INSERT INTO runs
           (id, quiz_id, pin, seed, status, phase, round_index,
            phase_started_at, phase_ends_at, question_ids, created_at)
         VALUES (?, ?, ?, ?, 'WAITING', 'WAITING', -1, 0, 0, '[]', ?)`,
      )
      .run(this.runId, this.quiz.id, this.pin, this.seed, Date.now())
  }

  private loadQuestions() {
    const all = listQuestions(this.quiz.id)
    this.questions.clear()
    for (const q of all) this.questions.set(q.id, q)
    this.pool = all.map((q) => q.id)
  }

  /** Returns true if any id in `ids` no longer exists. */
  private hydrateQuestions(ids: string[]): boolean {
    const all = listQuestions(this.quiz.id)
    this.questions.clear()
    for (const q of all) this.questions.set(q.id, q)
    return ids.some((id) => !this.questions.has(id))
  }

  private loadParticipants() {
    const rows = getDb()
      .prepare(
        'SELECT id, name, avatar_seed, joined_at FROM participants WHERE run_id = ?',
      )
      .all(this.runId) as {
      id: string
      name: string
      avatar_seed: string
      joined_at: number
    }[]

    this.participants.clear()
    for (const row of rows) {
      this.participants.set(row.id, {
        id: row.id,
        name: row.name,
        avatarSeed: row.avatar_seed,
        joinedAt: row.joined_at,
        score: 0,
        correct: 0,
        answered: 0,
        totalElapsedMs: 0,
        answers: new Map(),
        order: this.orderFor(row.id),
      })
    }
    this.recomputeRanks()
  }

  private loadAnswers() {
    const rows = getDb()
      .prepare(
        `SELECT participant_id, question_id, round_index, choice, elapsed_ms, correct, points
         FROM answers WHERE run_id = ?`,
      )
      .all(this.runId) as {
      participant_id: string
      question_id: string
      round_index: number
      choice: number
      elapsed_ms: number
      correct: number
      points: number
    }[]

    for (const row of rows) {
      const p = this.participants.get(row.participant_id)
      if (!p) continue
      const answer: StoredAnswer = {
        questionId: row.question_id,
        roundIndex: row.round_index,
        choice: row.choice,
        elapsedMs: row.elapsed_ms,
        correct: row.correct === 1,
        points: row.points,
      }
      p.answers.set(row.question_id, answer)
      p.answered += 1
      p.score += row.points
      p.totalElapsedMs += row.elapsed_ms
      if (answer.correct) p.correct += 1
      this.bumpDistribution(row.question_id, row.choice)
    }
    this.recomputeRanks()
  }

  private recomputeRoundTallies() {
    this.roundAnswered = 0
    this.roundSpread = [0, 0, 0, 0]
    this.roundPerQuestion.clear()
    if (this.roundIndex < 0) return
    for (const p of this.participants.values()) {
      for (const a of p.answers.values()) {
        if (a.roundIndex !== this.roundIndex) continue
        this.roundAnswered += 1
        if (a.choice >= 0 && a.choice < this.roundSpread.length) {
          this.roundSpread[a.choice] += 1
        }
        this.roundPerQuestion.set(
          a.questionId,
          (this.roundPerQuestion.get(a.questionId) ?? 0) + 1,
        )
      }
    }
  }

  private persistRun(status: RunStatus) {
    getDb()
      .prepare(
        `UPDATE runs SET status = ?, phase = ?, round_index = ?,
           phase_started_at = ?, phase_ends_at = ?, question_ids = ?,
           started_at = COALESCE(started_at, ?), ended_at = ?
         WHERE id = ?`,
      )
      .run(
        status,
        this.phase,
        this.roundIndex,
        this.phaseStartedAt,
        this.phaseEndsAt,
        JSON.stringify(this.pool),
        status === 'WAITING' ? null : Date.now(),
        status === 'COMPLETED' ? Date.now() : null,
        this.runId,
      )
  }

  // -------------------------------------------------------------------------
  // Derived per-participant order
  // -------------------------------------------------------------------------

  /**
   * Every participant gets the same pool in a different order. Deriving it from
   * the run seed keeps it stable forever without storing anything.
   */
  private orderFor(participantId: string): string[] {
    return seededShuffle(this.pool, `${this.seed}:${participantId}`)
  }

  private questionForRound(p: EngineParticipant, round: number): Question | null {
    const id = p.order[round]
    if (!id) return null
    return this.questions.get(id) ?? null
  }

  // -------------------------------------------------------------------------
  // Public accessors
  // -------------------------------------------------------------------------

  get status(): RunStatus {
    if (this.phase === 'WAITING') return 'WAITING'
    if (this.phase === 'COMPLETED') return 'COMPLETED'
    if (this.phase === 'PAUSED') return 'PAUSED'
    return 'LIVE'
  }

  get totalRounds() {
    return this.pool.length > 0 ? this.pool.length : this.questions.size
  }

  get playerCount() {
    return this.participants.size
  }

  getRunId() {
    return this.runId
  }

  getPin() {
    return this.pin
  }

  getQuiz() {
    return this.quiz
  }

  refreshQuiz() {
    this.quiz = getQuiz()
    this.loadQuestions()
    this.broadcastState()
  }

  /** Called after the admin edits questions while the run is still WAITING. */
  refreshQuestions() {
    if (this.phase !== 'WAITING') return
    this.loadQuestions()
    this.broadcastState()
  }

  hasParticipant(id: string) {
    return this.participants.has(id)
  }

  // -------------------------------------------------------------------------
  // Joining
  // -------------------------------------------------------------------------

  join(name: string, phone?: string, college?: string): { id: string; avatarSeed: string } | { error: string } {
    if (this.phase === 'COMPLETED') {
      return { error: 'This quiz has already finished.' }
    }
    if (this.totalRounds === 0) {
      return { error: 'The quiz has no questions yet. Hang on a moment.' }
    }

    const id = newId('p')
    const now = Date.now()
    const participant: EngineParticipant = {
      id,
      name,
      avatarSeed: id,
      joinedAt: now,
      score: 0,
      correct: 0,
      answered: 0,
      totalElapsedMs: 0,
      answers: new Map(),
      order: this.orderFor(id),
    }
    this.participants.set(id, participant)

    getDb()
      .prepare(
        `INSERT INTO participants (id, run_id, name, avatar_seed, joined_at, last_seen_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(id, this.runId, name, id, now, now)

    this.recomputeRanks()
    this.schedulePlayerCountBroadcast()
    return { id, avatarSeed: id }
  }

  touch(participantId: string) {
    getDb()
      .prepare('UPDATE participants SET last_seen_at = ? WHERE id = ?')
      .run(Date.now(), participantId)
  }

  kickParticipant(participantId: string): boolean {
    if (!this.participants.has(participantId)) return false
    this.participants.delete(participantId)
    this.ranked = this.ranked.filter((p) => p.id !== participantId)
    this.rankMap.delete(participantId)
    this.previousRanks.delete(participantId)

    getDb().prepare('DELETE FROM participants WHERE id = ?').run(participantId)
    getDb().prepare('DELETE FROM answers WHERE participant_id = ?').run(participantId)

    this.recomputeRanks()
    this.recomputeRoundTallies()

    const hub = getHub()
    hub.sendTo(participantId, frame({ t: 'invalid', message: 'You have been removed from the session by the host.' }))
    this.broadcastState()
    return true
  }

  // -------------------------------------------------------------------------
  // Host controls
  // -------------------------------------------------------------------------

  start(): { ok: true } | { ok: false; error: string } {
    if (this.phase !== 'WAITING') {
      return { ok: false, error: 'The quiz is already running.' }
    }
    this.loadQuestions()
    if (this.pool.length === 0) {
      return { ok: false, error: 'Add at least one question before starting.' }
    }
    // Freeze the pool for the whole run and rebuild orders against it, so
    // editing questions mid-quiz cannot shift anybody's sequence.
    for (const p of this.participants.values()) p.order = this.orderFor(p.id)
    this.beginExam()
    return { ok: true }
  }

  pause(): { ok: boolean } {
    if (this.phase === 'WAITING' || this.phase === 'COMPLETED' || this.phase === 'PAUSED') {
      return { ok: false }
    }
    this.clearPhaseTimer()
    this.stopTallies()
    this.pausedPhase = this.phase
    this.pausedRemainingMs = Math.max(0, this.phaseEndsAt - Date.now())
    this.phase = 'PAUSED'
    this.persistRun('PAUSED')
    this.broadcastState()
    return { ok: true }
  }

  resume(): { ok: boolean } {
    if (this.phase !== 'PAUSED') return { ok: false }
    const now = Date.now()
    const elapsedBefore = this.phaseEndsAt - this.phaseStartedAt - this.pausedRemainingMs
    this.phase = this.pausedPhase
    this.phaseStartedAt = now - Math.max(0, elapsedBefore)
    this.phaseEndsAt = now + this.pausedRemainingMs
    if (this.phase === 'QUESTION') {
      // Preserve the remaining answer window rather than replaying the lead-in.
      this.answersOpenAt = Math.min(this.answersOpenAt, now)
      this.startTallies()
    }
    this.persistRun('LIVE')
    this.broadcastState()
    this.scheduleAdvance(this.pausedRemainingMs)
    return { ok: true }
  }

  /** Cut the current phase short and move straight on. */
  skip(): { ok: boolean } {
    if (this.phase === 'WAITING' || this.phase === 'COMPLETED') return { ok: false }
    if (this.phase === 'PAUSED') this.phase = this.pausedPhase
    this.clearPhaseTimer()
    this.advance()
    return { ok: true }
  }

  end(): { ok: boolean } {
    if (this.phase === 'COMPLETED') return { ok: false }
    this.complete()
    return { ok: true }
  }

  /** Start a completely fresh session: new PIN, new order seed, no players. */
  reset(): { ok: true } {
    this.clearPhaseTimer()
    this.stopTallies()
    this.flushAnswers()
    if (this.phase !== 'COMPLETED') {
      this.phase = 'COMPLETED'
      this.persistRun('COMPLETED')
    }
    this.quiz = getQuiz()
    this.createRun()
    this.broadcastState()
    return { ok: true }
  }

  // -------------------------------------------------------------------------
  // The automatic phase machine
  // -------------------------------------------------------------------------

  private clearPhaseTimer() {
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer)
      this.phaseTimer = null
    }
  }

  private scheduleAdvance(ms: number) {
    this.clearPhaseTimer()
    this.phaseTimer = setTimeout(() => {
      this.phaseTimer = null
      this.advance()
    }, Math.max(0, ms))
  }

  /** The one function that drives the whole event forward. */
  private advance() {
    switch (this.phase) {
      case 'QUESTION':
        this.beginReveal()
        break
      case 'REVEAL':
        this.beginLeaderboard()
        break
      case 'EXAM_LIVE':
        this.beginLeaderboard()
        break
      case 'LEADERBOARD':
        this.complete()
        break
      default:
        break
    }
  }

  private beginExam() {
    this.flushAnswers()
    const now = Date.now()
    const durationMs = 10 * 60 * 1000 // 10 Minutes Total Event Window
    this.phase = 'EXAM_LIVE'
    this.phaseStartedAt = now
    this.answersOpenAt = now
    this.phaseEndsAt = now + durationMs
    this.roundIndex = 0

    this.persistRun('LIVE')
    this.broadcastState()
    this.scheduleAdvance(durationMs)
  }

  /** The global authored question timer for the quiz or the round question's specific timer. */
  private maxLimitMs(round?: number) {
    if (typeof round === 'number' && round >= 0) {
      // Find the max timer across any question assigned in this round (or global default)
      const timers: number[] = []
      for (const p of this.participants.values()) {
        const q = this.questionForRound(p, round)
        if (q?.timerSeconds && q.timerSeconds > 0) timers.push(q.timerSeconds)
      }
      if (timers.length > 0) return Math.max(...timers) * 1000
    }
    return (this.quiz.defaultTimer || 5) * 1000
  }

  private beginQuestion(round: number) {
    this.flushAnswers()
    const now = Date.now()

    this.phase = 'QUESTION'
    this.roundIndex = round
    this.phaseStartedAt = now
    this.answersOpenAt = now
    this.phaseEndsAt = this.answersOpenAt + this.maxLimitMs(round)

    this.roundAnswered = 0
    this.roundSpread = [0, 0, 0, 0]
    this.roundPerQuestion.clear()

    this.persistRun('LIVE')
    this.broadcastState()
    this.startTallies()
    this.scheduleAdvance(this.phaseEndsAt - now)
  }

  private beginReveal() {
    this.stopTallies()
    this.flushAnswers()
    const now = Date.now()
    this.phase = 'REVEAL'
    this.phaseStartedAt = now
    this.phaseEndsAt = now + Math.max(1, this.quiz.revealSeconds) * 1000
    this.recomputeRanks()
    this.persistRun('LIVE')
    this.broadcastState()
    this.scheduleAdvance(this.phaseEndsAt - now)
  }

  private beginLeaderboard() {
    const now = Date.now()
    this.phase = 'LEADERBOARD'
    this.phaseStartedAt = now
    this.phaseEndsAt = now + Math.max(1, this.quiz.leaderboardSeconds) * 1000
    this.recomputeRanks()
    this.persistRun('LIVE')
    this.broadcastState()
    // Movement arrows compare against the *previous* leaderboard, so snapshot
    // ranks only after this frame has gone out.
    this.previousRanks = new Map(this.rankMap)
    this.scheduleAdvance(this.phaseEndsAt - now)
  }

  private complete() {
    this.clearPhaseTimer()
    this.stopTallies()
    this.flushAnswers()
    const now = Date.now()
    this.phase = 'COMPLETED'
    this.phaseStartedAt = now
    this.phaseEndsAt = now
    this.recomputeRanks()
    this.persistRun('COMPLETED')
    this.broadcastState()
  }

  // -------------------------------------------------------------------------
  // Answer submission -- the only place a score is ever produced
  // -------------------------------------------------------------------------

  submitAnswer(participantId: string, roundIndex: number, choice: unknown): SubmitResult {
    if (this.phase !== 'QUESTION' && this.phase !== 'REVEAL' && this.phase !== 'EXAM_LIVE') {
      return { ok: false, reason: 'CLOSED' }
    }
    if (roundIndex < 0 || roundIndex >= this.totalRounds) return { ok: false, reason: 'STALE' }

    const p = this.participants.get(participantId)
    if (!p) return { ok: false, reason: 'UNKNOWN' }

    const question = this.questionForRound(p, roundIndex)
    if (!question) return { ok: false, reason: 'CLOSED' }

    const existing = p.answers.get(question.id)
    if (existing) return { ok: false, reason: 'DUPLICATE', choice: existing.choice }

    if (
      typeof choice !== 'number' ||
      !Number.isInteger(choice) ||
      choice < 0 ||
      choice >= question.options.length
    ) {
      return { ok: false, reason: 'INVALID' }
    }

    const now = Date.now()
    const elapsedMs = Math.max(0, now - this.phaseStartedAt)

    // Check overall 10-minute exam window
    if (this.phase === 'EXAM_LIVE' && now > this.phaseEndsAt) {
      return { ok: false, reason: 'EXPIRED' }
    }

    const limitSeconds = question.timerSeconds && question.timerSeconds > 0 ? question.timerSeconds : (this.quiz.defaultTimer || 5)
    const correct = Number(choice) === Number(question.correctIndex)
    const points = scoreAnswer({
      correct,
      elapsedMs: Math.min(elapsedMs, limitSeconds * 1000),
      limitSeconds,
    })

    const answer: StoredAnswer = {
      questionId: question.id,
      roundIndex,
      choice,
      elapsedMs,
      correct,
      points,
    }

    p.answers.set(question.id, answer)
    p.answered += 1
    p.score += points
    p.totalElapsedMs += elapsedMs
    if (correct) p.correct += 1

    this.bumpDistribution(question.id, choice)
    this.queueWrite(participantId, answer)
    return { ok: true }
  }

  private bumpDistribution(questionId: string, choice: number) {
    const q = this.questions.get(questionId)
    const size = q ? q.options.length : 4
    let counts = this.distribution.get(questionId)
    if (!counts) {
      counts = new Array(size).fill(0)
      this.distribution.set(questionId, counts)
    }
    if (choice >= 0 && choice < counts.length) counts[choice] += 1
  }

  // -------------------------------------------------------------------------
  // Batched persistence
  // -------------------------------------------------------------------------

  private queueWrite(participantId: string, answer: StoredAnswer) {
    this.writeQueue.push({ participantId, answer })
    if (!this.flushTimer) {
      this.flushTimer = setTimeout(() => this.flushAnswers(), ANSWER_FLUSH_MS)
    }
  }

  private flushAnswers() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer)
      this.flushTimer = null
    }
    if (this.writeQueue.length === 0) return

    const batch = this.writeQueue
    this.writeQueue = []
    const db = getDb()
    const stmt = db.prepare(
      `INSERT OR REPLACE INTO answers
         (run_id, participant_id, question_id, round_index, choice,
          elapsed_ms, correct, points, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    const now = Date.now()
    try {
      db.exec('BEGIN IMMEDIATE;')
      for (const item of batch) {
        stmt.run(
          this.runId,
          item.participantId,
          item.answer.questionId,
          item.answer.roundIndex,
          item.answer.choice,
          item.answer.elapsedMs,
          item.answer.correct ? 1 : 0,
          item.answer.points,
          now,
        )
      }
      db.exec('COMMIT;')
    } catch (err) {
      db.exec('ROLLBACK;')
      console.error('[engine] failed to flush answers', err)
    }
  }

  // -------------------------------------------------------------------------
  // Ranking
  // -------------------------------------------------------------------------

  private recomputeRanks() {
    const list = [...this.participants.values()]
    list.sort(
      (a, b) =>
        b.score - a.score ||
        a.totalElapsedMs - b.totalElapsedMs ||
        a.joinedAt - b.joinedAt,
    )
    this.ranked = list
    this.rankMap.clear()
    list.forEach((p, i) => this.rankMap.set(p.id, i + 1))
  }

  private entry(p: EngineParticipant, rank: number): LeaderboardEntry {
    const before = this.previousRanks.get(p.id)
    return {
      id: p.id,
      name: p.name,
      avatarSeed: p.avatarSeed,
      score: p.score,
      rank,
      delta: before === undefined ? null : before - rank,
      correct: p.correct,
      answered: p.answered,
    }
  }

  private topEntries(limit = LEADERBOARD_SIZE): LeaderboardEntry[] {
    if (this.ranked.length !== this.participants.size) this.recomputeRanks()
    return this.ranked.slice(0, limit).map((p, i) => this.entry(p, i + 1))
  }

  private selfState(p: EngineParticipant): SelfState {
    return {
      id: p.id,
      name: p.name,
      avatarSeed: p.avatarSeed,
      score: p.score,
      rank: this.rankMap.get(p.id) ?? this.participants.size,
      correct: p.correct,
      answered: p.answered,
    }
  }

  // -------------------------------------------------------------------------
  // Payload construction
  // -------------------------------------------------------------------------

  private publicQuestion(q: Question): PublicQuestion {
    return {
      id: q.id,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      imageUrl: q.imageId ? `/api/image/${q.imageId}` : null,
      timerSeconds: q.timerSeconds && q.timerSeconds > 0 ? q.timerSeconds : (this.quiz.defaultTimer || 5),
    }
  }

  private baseState(): ClientState {
    return {
      t: 'state',
      runId: this.runId,
      quizName: this.quiz.name,
      quizDescription: this.quiz.description,
      phase: this.phase,
      status: this.status,
      roundIndex: this.roundIndex,
      totalRounds: this.totalRounds,
      serverNow: Date.now(),
      phaseStartedAt: this.phaseStartedAt,
      phaseEndsAt: this.phaseEndsAt,
      answersOpenAt: this.phase === 'QUESTION' ? this.answersOpenAt : undefined,
      players: this.participants.size,
    }
  }

  /**
   * State for one participant. `memo` lets a single broadcast reuse the
   * per-question payloads across everyone who received that question.
   */
  stateForParticipant(
    participantId: string,
    memo?: {
      questions: Map<string, PublicQuestion>
      reveals: Map<string, Omit<NonNullable<ClientState['reveal']>, 'yourChoice' | 'yourCorrect' | 'yourPoints'>>
      top?: LeaderboardEntry[]
    },
  ): ClientState | null {
    const p = this.participants.get(participantId)
    if (!p) return null

    const state = this.baseState()
    state.you = this.selfState(p)

    if (this.phase === 'EXAM_LIVE') {
      const publicQuestions: PublicQuestion[] = []
      const userChoices: Record<number, number> = {}

      for (let r = 0; r < p.order.length; r++) {
        const q = this.questionForRound(p, r)
        if (q) {
          publicQuestions.push(this.publicQuestion(q))
          const existing = p.answers.get(q.id)
          if (existing !== undefined) {
            userChoices[r] = existing.choice
          }
        }
      }

      state.exam = {
        questions: publicQuestions,
        answersOpenAt: this.answersOpenAt,
        examEndsAt: this.phaseEndsAt,
        userChoices,
      }
    }

    if (this.phase === 'QUESTION' || this.phase === 'PAUSED') {
      const q = this.questionForRound(p, this.roundIndex)
      if (q) {
        let payload = memo?.questions.get(q.id)
        if (!payload) {
          payload = this.publicQuestion(q)
          memo?.questions.set(q.id, payload)
        }
        const limitSeconds = q.timerSeconds && q.timerSeconds > 0 ? q.timerSeconds : (this.quiz.defaultTimer || 5)
        state.question = {
          question: payload,
          answersOpenAt: this.answersOpenAt,
          answersCloseAt: this.answersOpenAt + limitSeconds * 1000,
          yourChoice: p.answers.get(q.id)?.choice ?? null,
        }
      }
    }

    if (this.phase === 'REVEAL') {
      const q = this.questionForRound(p, this.roundIndex)
      if (q) {
        let shared = memo?.reveals.get(q.id)
        if (!shared) {
          const counts = this.distribution.get(q.id) ?? new Array(q.options.length).fill(0)
          shared = {
            questionId: q.id,
            prompt: q.prompt,
            options: q.options,
            imageUrl: q.imageId ? `/api/image/${q.imageId}` : null,
            correctIndex: q.correctIndex,
            explanation: q.explanation,
            distribution: counts,
            totalAnswers: counts.reduce((a, b) => a + b, 0),
          }
          memo?.reveals.set(q.id, shared)
        }
        const own = p.answers.get(q.id)
        state.reveal = {
          ...shared,
          yourChoice: own?.choice ?? null,
          yourCorrect: own?.correct ?? false,
          yourPoints: own?.points ?? 0,
        }
      }
    }

    if (this.phase === 'LEADERBOARD' || this.phase === 'COMPLETED') {
      state.leaderboard = {
        top: memo?.top ?? this.topEntries(),
        totalPlayers: this.participants.size,
      }
    }

    if (this.phase === 'COMPLETED') {
      state.final = this.summaryFor(p)
    }

    return state
  }

  /** Aggregate state for projector / display screens: no personal fields. */
  stateForDisplay(memoTop?: LeaderboardEntry[]): ClientState {
    const state = this.baseState()
    // The projector always wants to show standings, whatever the phase.
    state.leaderboard = {
      top: memoTop ?? this.topEntries(),
      totalPlayers: this.participants.size,
    }
    return state
  }

  private summaryFor(p: EngineParticipant) {
    const total = this.totalRounds
    return {
      rank: this.rankMap.get(p.id) ?? this.participants.size,
      score: p.score,
      correct: p.correct,
      totalQuestions: total,
      accuracy: total > 0 ? p.correct / total : 0,
      averageResponseSeconds: p.answered > 0 ? p.totalElapsedMs / p.answered / 1000 : 0,
    }
  }

  // -------------------------------------------------------------------------
  // Host snapshot
  // -------------------------------------------------------------------------

  hostSnapshot(): HostSnapshot {
    this.recomputeRanks()

    let scoreTotal = 0
    let accuracyTotal = 0
    for (const p of this.participants.values()) {
      scoreTotal += p.score
      accuracyTotal += this.totalRounds > 0 ? p.correct / this.totalRounds : 0
    }
    const n = this.participants.size || 1

    const activePool = this.pool.length > 0 ? this.pool : [...this.questions.keys()]

    return {
      quiz: { ...this.quiz, questionCount: this.totalRounds },
      runId: this.runId,
      pin: this.pin,
      status: this.status,
      phase: this.phase,
      roundIndex: this.roundIndex,
      totalRounds: this.totalRounds,
      players: this.participants.size,
      answered: this.roundAnswered,
      serverNow: Date.now(),
      phaseStartedAt: this.phaseStartedAt,
      phaseEndsAt: this.phaseEndsAt,
      answersOpenAt: this.phase === 'QUESTION' ? this.answersOpenAt : undefined,
      spread: [...this.roundSpread],
      perQuestion: activePool.map((id) => ({
        questionId: id,
        prompt: this.questions.get(id)?.prompt ?? '(removed)',
        answered: this.roundPerQuestion.get(id) ?? 0,
      })),
      top: this.topEntries(),
      allParticipants: this.ranked.map((p, i) => ({
        id: p.id,
        name: p.name,
        avatarSeed: p.avatarSeed,
        score: p.score,
        rank: i + 1,
        correct: p.correct,
        answered: p.answered,
      })),
      averageScore: Math.round(scoreTotal / n),
      averageAccuracy: Math.round((accuracyTotal / n) * 100),
    }
  }

  // -------------------------------------------------------------------------
  // Results
  // -------------------------------------------------------------------------

  results(): ResultsSummary {
    this.recomputeRanks()
    const total = this.totalRounds
    const rows: ResultRow[] = this.ranked.map((p, i) => ({
      id: p.id,
      name: p.name,
      avatarSeed: p.avatarSeed,
      score: p.score,
      correct: p.correct,
      answered: p.answered,
      accuracy: total > 0 ? Math.round((p.correct / total) * 100) : 0,
      averageResponseSeconds: p.answered > 0 ? p.totalElapsedMs / p.answered / 1000 : 0,
      rank: i + 1,
    }))

    const participants = rows.length
    const completed = rows.filter((r) => total > 0 && r.answered >= total).length
    const averageScore =
      participants > 0
        ? Math.round(rows.reduce((sum, r) => sum + r.score, 0) / participants)
        : 0
    const averageAccuracy =
      participants > 0 ? Math.round(rows.reduce((sum, r) => sum + r.accuracy, 0) / participants) : 0

    return {
      quizName: this.quiz.name,
      runId: this.runId,
      status: this.status,
      totalQuestions: total,
      participants,
      completed,
      averageScore,
      averageAccuracy,
      rows,
    }
  }

  /** Per-participant result, used by the /results page. */
  resultFor(participantId: string) {
    const p = this.participants.get(participantId)
    if (!p) return null
    this.recomputeRanks()
    return {
      name: p.name,
      avatarSeed: p.avatarSeed,
      totalPlayers: this.participants.size,
      status: this.status,
      ...this.summaryFor(p),
    }
  }

  sendReaction(participantId: string, emoji: import('./types').ReactionEmoji): boolean {
    const p = this.participants.get(participantId)
    if (!p) return false
    const reactionFrame = frame({
      t: 'reaction',
      id: newId('react'),
      emoji,
      senderName: p.name,
    })
    getHub().broadcast(() => reactionFrame)
    return true
  }

  // -------------------------------------------------------------------------
  // Broadcasting
  // -------------------------------------------------------------------------

  broadcastState() {
    const hub = getHub()
    const memo = {
      questions: new Map<string, PublicQuestion>(),
      reveals: new Map<
        string,
        Omit<NonNullable<ClientState['reveal']>, 'yourChoice' | 'yourCorrect' | 'yourPoints'>
      >(),
      top: this.topEntries(),
    }

    let displayChunk: string | null = null
    let hostChunk: string | null = null

    hub.broadcast((client) => {
      if (client.role === 'player') {
        if (!client.participantId) return null
        const state = this.stateForParticipant(client.participantId, memo)
        if (!state) {
          client.write(frame({ t: 'invalid', message: 'Session reset by host.' }))
          client.close()
          return null
        }
        return frame(state)
      }
      if (client.role === 'admin') {
        hostChunk ??= frame({ t: 'host', ...this.hostSnapshot() })
        return hostChunk
      }
      displayChunk ??= frame(this.stateForDisplay(memo.top))
      return displayChunk
    })
  }

  /** Push the current state to a single participant (used right after connect). */
  sendInitial(client: { write(chunk: string): void }, participantId?: string, role: 'player' | 'display' | 'admin' = 'player') {
    if (role === 'admin') {
      client.write(frame({ t: 'host', ...this.hostSnapshot() }))
      return
    }
    if (role === 'display' || !participantId) {
      client.write(frame(this.stateForDisplay()))
      return
    }
    const state = this.stateForParticipant(participantId)
    if (state) client.write(frame(state))
  }

  /**
   * The lobby counter changes on every join. Throttle it so 1,000 arrivals in a
   * minute don't turn into 1,000 broadcasts.
   */
  private schedulePlayerCountBroadcast() {
    if (this.playersTimer) {
      this.playersDirty = true
      return
    }
    this.emitPlayerCount()
    this.playersTimer = setTimeout(() => {
      this.playersTimer = null
      if (this.playersDirty) {
        this.playersDirty = false
        this.schedulePlayerCountBroadcast()
      }
    }, PLAYER_COUNT_THROTTLE_MS)
  }

  private emitPlayerCount() {
    this.broadcastState()
  }

  /** While a question runs, host screens get live tallies once a second. */
  private startTallies() {
    if (this.tallyTimer) return
    this.tallyTimer = setInterval(() => {
      if (this.phase !== 'QUESTION') return
      const hub = getHub()
      if (!hub.hasRole('admin') && !hub.hasRole('display')) return

      const tally = frame({
        t: 'tally',
        answered: this.roundAnswered,
        players: this.participants.size,
        spread: [...this.roundSpread],
        perQuestion: [...this.roundPerQuestion.entries()].map(([questionId, answered]) => ({
          questionId,
          answered,
        })),
      })
      hub.broadcast((client) => (client.role === 'player' ? null : tally))
    }, TALLY_INTERVAL_MS)
    this.tallyTimer.unref?.()
  }

  private stopTallies() {
    if (this.tallyTimer) {
      clearInterval(this.tallyTimer)
      this.tallyTimer = null
    }
  }
}

export function getEngine(): QuizEngine {
  if (!globalThis.__quizEngine) {
    globalThis.__quizEngine = new QuizEngine()
  }
  return globalThis.__quizEngine
}

export { MAX_POINTS }
export type { QuizEngine }
