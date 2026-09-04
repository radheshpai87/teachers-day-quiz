/**
 * Shared types for the Teachers' Day quiz.
 *
 * These types are used on both the server (game engine, API routes) and the
 * client (participant + host screens), so keep them free of Node-only imports.
 */

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export type QuestionType = 'MCQ' | 'TRUE_FALSE' | 'IMAGE'

export const TIMER_CHOICES = [5, 10, 15, 20, 30, 45, 60] as const
export type TimerChoice = (typeof TIMER_CHOICES)[number]

export interface Question {
  id: string
  quizId: string
  type: QuestionType
  prompt: string
  options: string[]
  correctIndex: number
  timerSeconds: number
  explanation: string | null
  imageId: string | null
  position: number
}

/** A question as sent to a participant: never carries `correctIndex`. */
export interface PublicQuestion {
  id: string
  type: QuestionType
  prompt: string
  options: string[]
  imageUrl: string | null
  timerSeconds: number
}

export interface Quiz {
  id: string
  name: string
  description: string
  /** Timer pre-filled for newly created questions. */
  defaultTimer: number
  /** How long the correct answer + answer distribution stays on screen. */
  revealSeconds: number
  /** How long the between-rounds leaderboard stays on screen. */
  leaderboardSeconds: number
  /** "Get ready" lead-in before answers unlock on each question. */
  readySeconds: number
  questionCount?: number
}

// ---------------------------------------------------------------------------
// Game state
// ---------------------------------------------------------------------------

/**
 * The phases a run moves through. The normal automatic flow is
 *   WAITING -> QUESTION -> REVEAL -> LEADERBOARD -> QUESTION -> ... -> COMPLETED
 * PAUSED is only entered by an explicit host action.
 */
export type Phase =
  | 'WAITING'
  | 'QUESTION'
  | 'REVEAL'
  | 'LEADERBOARD'
  | 'PAUSED'
  | 'COMPLETED'
  | 'EXAM_LIVE'

/** Coarse status, matching the vocabulary used on the host dashboard. */
export type RunStatus = 'WAITING' | 'LIVE' | 'PAUSED' | 'COMPLETED'

export interface LeaderboardEntry {
  id: string
  name: string
  avatarSeed: string
  score: number
  rank: number
  /** Rank movement since the previous leaderboard. Positive = moved up. */
  delta: number | null
  correct?: number
  answered?: number
  phone?: string
  college?: string
}

export interface SelfState {
  id: string
  name: string
  avatarSeed: string
  score: number
  rank: number
  /** Number of questions answered correctly so far. */
  correct: number
  /** Number of questions answered at all (correct or not). */
  answered: number
  phone?: string
  college?: string
}

export interface QuestionPhasePayload {
  question: PublicQuestion
  /** Absolute epoch ms when answers unlock (after the "get ready" lead-in). */
  answersOpenAt: number
  /** Absolute epoch ms when this participant's answer window closes. */
  answersCloseAt: number
  /** The choice this participant already submitted, if any (reconnect-safe). */
  yourChoice: number | null
}

export interface RevealPhasePayload {
  questionId: string
  prompt: string
  options: string[]
  imageUrl: string | null
  correctIndex: number
  explanation: string | null
  /** Answer counts per option index, across everyone who got this question. */
  distribution: number[]
  totalAnswers: number
  yourChoice: number | null
  yourCorrect: boolean
  yourPoints: number
}

export interface LeaderboardPhasePayload {
  top: LeaderboardEntry[]
  totalPlayers: number
}

export interface FinalSummary {
  rank: number
  score: number
  correct: number
  totalQuestions: number
  accuracy: number
  /** Average response time in seconds, across answered questions. */
  averageResponseSeconds: number
}

export interface ExamPayload {
  questions: PublicQuestion[]
  answersOpenAt: number
  examEndsAt: number
  /** Map of roundIndex -> choice submitted by participant */
  userChoices: Record<number, number>
}

/**
 * The single message shape pushed over SSE to participants and display
 * screens. Only the fields relevant to the current phase are populated, which
 * keeps payloads small at 1,000+ connections.
 */
export interface ClientState {
  t: 'state'
  runId: string
  quizName: string
  quizDescription: string
  phase: Phase
  status: RunStatus
  /** 0-based round index; -1 while waiting. */
  roundIndex: number
  totalRounds: number
  /** Server time when this frame was built -- used to correct client clock skew. */
  serverNow: number
  phaseStartedAt: number
  phaseEndsAt: number
  /** During QUESTION: when the "get ready" lead-in ends and answers unlock. */
  answersOpenAt?: number
  players: number

  question?: QuestionPhasePayload
  reveal?: RevealPhasePayload
  leaderboard?: LeaderboardPhasePayload
  you?: SelfState
  final?: FinalSummary
  exam?: ExamPayload
}

/** Lightweight frame used for live participant-count updates in the lobby. */
export interface PlayersFrame {
  t: 'players'
  players: number
}

export type ReactionEmoji = 'heart' | 'clap' | 'fire' | 'cap' | 'star'

export interface ReactionFrame {
  t: 'reaction'
  id: string
  emoji: ReactionEmoji
  senderName?: string
}

/** Host-only live tallies, pushed roughly once a second while a question runs. */
export interface TallyFrame {
  t: 'tally'
  answered: number
  players: number
  /** Answers this round grouped by option index, aggregated across questions. */
  spread: number[]
  /** Per-question answered counts for the current round. */
  perQuestion: { questionId: string; answered: number }[]
}

export type ServerFrame = ClientState | PlayersFrame | ReactionFrame | TallyFrame | HostFrame

// ---------------------------------------------------------------------------
// Results
// ---------------------------------------------------------------------------

export interface ResultRow {
  id: string
  name: string
  avatarSeed: string
  score: number
  correct: number
  answered: number
  accuracy: number
  averageResponseSeconds: number
  rank: number
  phone?: string
  college?: string
}

export interface ResultsSummary {
  quizName: string
  runId: string
  status: RunStatus
  totalQuestions: number
  participants: number
  /** Participants who answered every question. */
  completed: number
  averageScore: number
  averageAccuracy: number
  rows: ResultRow[]
}

// ---------------------------------------------------------------------------
// Host dashboard
// ---------------------------------------------------------------------------

export interface HostParticipantEntry {
  id: string
  name: string
  avatarSeed: string
  score: number
  rank: number
  correct: number
  answered: number
  phone?: string
  college?: string
}

export interface HostSnapshot {
  quiz: Quiz
  runId: string
  pin: string
  status: RunStatus
  phase: Phase
  roundIndex: number
  totalRounds: number
  players: number
  answered: number
  serverNow: number
  phaseStartedAt: number
  phaseEndsAt: number
  answersOpenAt?: number
  spread: number[]
  perQuestion: { questionId: string; prompt: string; answered: number }[]
  top: LeaderboardEntry[]
  allParticipants?: HostParticipantEntry[]
  averageScore: number
  averageAccuracy: number
}

/** The frame pushed to authenticated host screens over SSE. */
export interface HostFrame extends HostSnapshot {
  t: 'host'
}
