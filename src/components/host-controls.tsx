'use client'

import { useState, useMemo, useEffect } from 'react'
import type { HostFrame } from '@/lib/types'
import { apiPost } from '@/lib/client/api'
import { ANSWER_SHAPES, Users, QrFrame, GraduationCap, PaperClip } from '@/components/icons'
import {
  Play,
  Pause,
  SkipForward,
  Square,
  BarChart2,
  RotateCcw,
  Search,
  Trophy,
  Check,
  UserX,
  Keyboard,
  Phone,
  Clock,
  Activity,
  CheckCircle2,
  FileText,
} from 'lucide-react'
import { QrModal } from '@/components/qr-modal'
import { ParticipantAvatar } from '@/components/participant-avatar'

interface HostControlsProps {
  snapshot: HostFrame
  liveTally: {
    answered: number
    players: number
    spread: number[]
  } | null
}

const ANSWER_COLORS = [
  'bg-[#e53935]',
  'bg-[#1e88e5]',
  'bg-[#fb8c00]',
  'bg-[#43a047]',
]

export function HostControls({ snapshot, liveTally }: HostControlsProps) {
  const [showQr, setShowQr] = useState(false)
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [kickingId, setKickingId] = useState<string | null>(null)

  const allMembers = useMemo(() => {
    return snapshot.allParticipants ?? snapshot.top ?? []
  }, [snapshot.allParticipants, snapshot.top])

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return allMembers
    const q = searchQuery.toLowerCase().trim()
    return allMembers.filter((m) => m.name.toLowerCase().includes(q))
  }, [allMembers, searchQuery])

  const { status, phase, players, roundIndex, totalRounds, quiz, phaseEndsAt, perQuestion } = snapshot

  const isWaiting = status === 'WAITING'
  const isLive = status === 'LIVE'
  const isPaused = status === 'PAUSED'
  const isCompleted = status === 'COMPLETED'
  const isExamLive = phase === 'EXAM_LIVE'

  // Live Timer Countdown calculation
  const [remainingMs, setRemainingMs] = useState<number>(0)

  useEffect(() => {
    if (!phaseEndsAt || (!isLive && !isPaused)) {
      setRemainingMs(0)
      return
    }

    const updateTimer = () => {
      const remaining = Math.max(0, phaseEndsAt - Date.now())
      setRemainingMs(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 500)
    return () => clearInterval(interval)
  }, [phaseEndsAt, isLive, isPaused])

  const formatTimer = (ms: number) => {
    const totalSec = Math.ceil(ms / 1000)
    const mins = Math.floor(totalSec / 60)
    const secs = totalSec % 60
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`
  }

  const currentAnswered = liveTally?.answered ?? snapshot.answered
  const currentSpread = liveTally?.spread ?? snapshot.spread

  const handleAction = async (action: 'start' | 'pause' | 'resume' | 'skip' | 'end' | 'reset') => {
    try {
      setLoadingAction(action)
      await apiPost('/api/admin/control', { action })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Control action failed')
    } finally {
      setLoadingAction(null)
    }
  }

  const handleKickParticipant = async (participantId: string, participantName: string) => {
    if (!confirm(`Are you sure you want to remove "${participantName}" from the quiz session?`)) return
    try {
      setKickingId(participantId)
      await apiPost('/api/admin/control', { action: 'kick', participantId })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to kick participant')
    } finally {
      setKickingId(null)
    }
  }

  // Keyboard Shortcuts (Space to Pause/Resume, S to Skip, Q for QR Code)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      if (e.code === 'Space') {
        e.preventDefault()
        if (isWaiting) handleAction('start')
        else if (isLive) handleAction('pause')
        else if (isPaused) handleAction('resume')
      } else if (e.key === 's' || e.key === 'S') {
        if (isLive || isPaused) handleAction('skip')
      } else if (e.key === 'q' || e.key === 'Q') {
        setShowQr((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isWaiting, isLive, isPaused])

  return (
    <div className="w-full space-y-6 select-none">
      {/* Top Banner: Quiz Name, System Status & Action Buttons */}
      <div className="notebook-card p-6 border-2 border-ink space-y-4 shadow-[4px_4px_0px_#2a2440]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full sticky-note-yellow text-ink font-black text-xs -rotate-1">
                <PaperClip className="w-4 h-4 text-ink" />
                <GraduationCap className="w-4 h-4" />
                <span>{quiz.name}</span>
              </div>

              {/* System Health Check Badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-paper-cream border border-ink text-xs font-bold text-ink">
                <Activity className="w-3.5 h-3.5 text-[#388e3c] animate-pulse" />
                <span>System Ready</span>
                <span className="text-[10px] text-ink-soft">• SSE Connected</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-ink">
              Host Console
            </h1>
            <div className="flex items-center gap-2 text-[11px] font-extrabold text-ink-soft pt-0.5">
              <Keyboard className="w-3.5 h-3.5 text-[#0284c7]" />
              <span>Hotkeys: <kbd className="px-1.5 py-0.5 rounded bg-paper-cream border border-ink font-mono text-[10px]">Space</kbd> Start/Pause • <kbd className="px-1.5 py-0.5 rounded bg-paper-cream border border-ink font-mono text-[10px]">S</kbd> Skip • <kbd className="px-1.5 py-0.5 rounded bg-paper-cream border border-ink font-mono text-[10px]">Q</kbd> QR Code</span>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowQr(true)}
              className="px-5 py-3 rounded-2xl sticky-note-lavender border-2 border-ink text-ink font-black text-sm hover:-translate-y-0.5 transition-all cursor-pointer shadow-[3px_3px_0px_#2a2440] flex items-center gap-2"
            >
              <QrFrame className="w-5 h-5 text-[#0284c7]" />
              <span>Display QR Code</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (
                  confirm(
                    'Resetting the game will remove all connected players and return the quiz to the waiting lobby. All questions and settings will remain unchanged. Proceed?',
                  )
                ) {
                  handleAction('reset')
                }
              }}
              disabled={loadingAction !== null}
              className="px-5 py-3 rounded-2xl sticky-note-yellow border-2 border-ink text-ink font-black text-sm hover:-translate-y-0.5 transition-all cursor-pointer shadow-[3px_3px_0px_#2a2440] flex items-center gap-2 disabled:opacity-50"
            >
              <RotateCcw className="w-5 h-5 text-[#d32f2f]" />
              <span>{loadingAction === 'reset' ? 'Resetting...' : 'Reset Event'}</span>
            </button>
          </div>
        </div>

        <div className="w-full border-t-2 border-ink" />

        {/* Live Status, Live Countdown Timer & Main Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border-2 border-ink sticky-note-mint text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_#2a2440]">
              <span
                className={`w-3 h-3 rounded-full border border-ink ${
                  isLive
                    ? 'bg-emerald-500 animate-ping'
                    : isPaused
                    ? 'bg-amber-500'
                    : isCompleted
                    ? 'bg-gray-400'
                    : 'bg-[#0284c7]'
                }`}
              />
              <span className="text-ink font-black">{status}</span>
              {phase && phase !== 'WAITING' && (
                <span className="text-ink-soft text-[10px]">({phase})</span>
              )}
            </div>

            {/* Live Participants Count */}
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl sticky-note-yellow border-2 border-ink text-ink text-sm font-black tnum shadow-[2px_2px_0px_#2a2440]">
              <Users className="w-4 h-4 text-ink" />
              <span>{players} players</span>
            </div>

            {/* Mode / Round Info */}
            {isExamLive ? (
              <div className="text-xs font-black text-ink tnum sticky-note-lavender px-3 py-2 rounded-xl border-2 border-ink flex items-center gap-1.5 shadow-[2px_2px_0px_#2a2440]">
                <FileText className="w-4 h-4 text-[#0284c7]" />
                <span>Live Exam Mode ({totalRounds} Questions)</span>
              </div>
            ) : (
              roundIndex >= 0 && (
                <div className="text-xs font-black text-ink tnum bg-paper-warm px-3 py-2 rounded-xl border-2 border-ink">
                  Question {roundIndex + 1} / {totalRounds}
                </div>
              )
            )}

            {/* Live Countdown Timer Badge */}
            {(isLive || isPaused) && remainingMs > 0 && (
              <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-paper-cream border-2 border-ink text-ink text-sm font-black tnum shadow-[2px_2px_0px_#2a2440]">
                <Clock className="w-4 h-4 text-[#d32f2f] animate-spin" style={{ animationDuration: '3s' }} />
                <span>Timer: <span className="text-[#d32f2f] font-mono">{formatTimer(remainingMs)}</span></span>
              </div>
            )}
          </div>

          {/* Primary Action Button (START QUIZ) */}
          {isWaiting && (
            <button
              type="button"
              onClick={() => handleAction('start')}
              disabled={loadingAction !== null}
              className="px-7 py-3.5 rounded-2xl bg-[#388e3c] text-white font-black text-base border-2 border-ink shadow-[4px_4px_0px_#2a2440] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer flex items-center gap-2.5 disabled:opacity-50"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>START QUIZ</span>
            </button>
          )}

          {/* Controls during live quiz */}
          {(isLive || isPaused) && (
            <div className="flex flex-wrap items-center gap-2">
              {isPaused ? (
                <button
                  type="button"
                  onClick={() => handleAction('resume')}
                  disabled={loadingAction !== null}
                  className="px-4 py-2.5 rounded-xl bg-[#388e3c] text-white font-black text-xs border-2 border-ink shadow-[2px_2px_0px_#2a2440] flex items-center gap-1.5 hover:-translate-y-0.5 cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Resume</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleAction('pause')}
                  disabled={loadingAction !== null}
                  className="px-4 py-2.5 rounded-xl bg-[#fbc02d] text-ink font-black text-xs border-2 border-ink shadow-[2px_2px_0px_#2a2440] flex items-center gap-1.5 hover:-translate-y-0.5 cursor-pointer"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => handleAction('skip')}
                disabled={loadingAction !== null || isCompleted}
                className="px-4 py-2.5 rounded-xl sticky-note-lavender text-ink font-black text-xs border-2 border-ink shadow-[2px_2px_0px_#2a2440] flex items-center gap-1.5 hover:-translate-y-0.5 cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
                <span>Skip</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to end the quiz early?')) {
                    handleAction('end')
                  }
                }}
                disabled={loadingAction !== null}
                className="px-4 py-2.5 rounded-xl sticky-note-rose text-ink font-black text-xs border-2 border-ink shadow-[2px_2px_0px_#2a2440] flex items-center gap-1.5 hover:-translate-y-0.5 cursor-pointer"
              >
                <Square className="w-4 h-4" />
                <span>End Quiz</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Live Question Completion Progress / Tallies Card */}
      {(isExamLive || roundIndex >= 0) && (
        <div className="notebook-card p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#0284c7]" />
              <h2 className="font-black text-ink text-base">
                {isExamLive ? 'Exam Questions Live Submission Progress' : 'Live Question Tallies'}
              </h2>
            </div>

            <div className="text-xs font-black text-ink tnum">
              {isExamLive ? (
                <span>Total Exam Submissions</span>
              ) : (
                <span>Answered: <span className="text-[#0284c7] font-black">{currentAnswered}</span> / {players}</span>
              )}
            </div>
          </div>

          {/* Per-Question Live Completion Bars for Exam Mode */}
          {isExamLive && perQuestion && perQuestion.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-1">
              {perQuestion.map((item, idx) => {
                const pct = players > 0 ? Math.min(100, Math.round((item.answered / players) * 100)) : 0
                return (
                  <div
                    key={item.questionId || idx}
                    className="p-3.5 rounded-xl border-2 border-ink bg-paper-cream space-y-2 shadow-[2px_2px_0px_#2a2440]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-extrabold text-ink text-xs line-clamp-2">
                        Q{idx + 1}. {item.prompt}
                      </span>
                      <span className="shrink-0 text-xs font-black text-[#0284c7] tnum">
                        {item.answered} / {players}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-paper-warm rounded-full h-3 border border-ink overflow-hidden relative">
                      <div
                        className="bg-[#0284c7] h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            /* Option Tallies for Traditional QUESTION mode */
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {currentSpread.map((count, idx) => {
                const Shape = ANSWER_SHAPES[idx % ANSWER_SHAPES.length]
                const pct = currentAnswered > 0 ? Math.round((count / currentAnswered) * 100) : 0

                return (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border-2 border-ink bg-paper-cream flex flex-col items-center text-center space-y-2 shadow-[2px_2px_0px_#2a2440]"
                  >
                    <div
                      className={`w-9 h-9 rounded-xl ${ANSWER_COLORS[idx]} text-white flex items-center justify-center border-2 border-ink`}
                    >
                      <Shape className="w-5 h-5 fill-current" />
                    </div>
                    <span className="tnum font-black text-2xl text-ink">{count}</span>
                    <span className="text-xs font-extrabold text-ink-soft tnum">{pct}%</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* Participating Members Roster Card */}
      <div className="notebook-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#0284c7]" />
            <h2 className="font-black text-ink text-base">
              Participating Members Roster
            </h2>
            <span className="text-xs font-extrabold sticky-note-yellow text-ink px-2.5 py-0.5 rounded-full border border-ink shadow-xs">
              {allMembers.length} Members
            </span>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-ink-soft absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search member by name..."
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border-2 border-ink bg-paper-cream text-ink text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
            />
          </div>
        </div>

        {filteredMembers.length === 0 ? (
          <div className="p-6 text-center text-xs font-extrabold text-ink-soft bg-paper-cream rounded-xl border border-ink">
            {searchQuery.trim() ? 'No matching members found.' : 'No participants joined yet. Display the QR code to let members join!'}
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredMembers.map((member) => {
              const rankColor =
                member.rank === 1
                  ? 'sticky-note-yellow text-ink font-black'
                  : member.rank === 2
                  ? 'sticky-note-mint text-ink font-black'
                  : member.rank === 3
                  ? 'sticky-note-rose text-ink font-black'
                  : 'bg-paper-cream text-ink font-extrabold'

              const answeredCount = member.answered ?? 0
              const isCompletedAll = answeredCount >= totalRounds && totalRounds > 0

              return (
                <div
                  key={member.id}
                  className="p-3 rounded-xl border-2 border-ink bg-paper-cream flex items-center justify-between gap-3 shadow-[2px_2px_0px_#2a2440] hover:-translate-y-0.5 transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Rank Badge */}
                    <div
                      className={`shrink-0 w-8 h-8 rounded-xl border-2 border-ink flex items-center justify-center text-xs tnum ${rankColor}`}
                    >
                      {member.rank === 1 ? (
                        <Trophy className="w-4 h-4 text-[#d32f2f]" />
                      ) : (
                        `#${member.rank}`
                      )}
                    </div>

                    {/* Avatar */}
                    <ParticipantAvatar seed={member.avatarSeed} size="sm" className="shrink-0 border border-ink shadow-xs" />

                    {/* Member Name, Phone, College & Progress */}
                    <div className="min-w-0 flex-1">
                      <div className="font-extrabold text-ink text-sm truncate flex items-center gap-1.5 flex-wrap">
                        <span>{member.name}</span>
                        {member.college && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md sticky-note-mint border border-ink shadow-[1px_1px_0px_#231f20]">
                            {member.college}
                          </span>
                        )}
                        {isCompletedAll && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[#388e3c] text-white border border-ink shadow-[1px_1px_0px_#231f20] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 stroke-[3]" />
                            Finished
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-ink-soft flex items-center gap-3 flex-wrap mt-0.5">
                        {member.phone && (
                          <span className="text-ink-soft flex items-center gap-1">
                            <Phone className="w-3 h-3 text-ink-soft shrink-0" />
                            <span>{member.phone}</span>
                          </span>
                        )}
                        <span className="text-ink-soft">
                          Progress: <span className="font-black text-[#0284c7]">{answeredCount} / {totalRounds}</span>
                        </span>
                        {typeof member.correct === 'number' && (
                          <span className="flex items-center gap-0.5 text-[#388e3c]">
                            <Check className="w-3 h-3 stroke-[3]" />
                            {member.correct} correct
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Member Score / Points & Kick Action */}
                  <div className="shrink-0 flex items-center gap-3">
                    <div className="text-right">
                      <span className="tnum font-black text-base text-[#0284c7]">
                        {member.score.toLocaleString()}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase text-ink-soft block">
                        pts
                      </span>
                    </div>

                    <button
                      type="button"
                      title="Remove participant"
                      onClick={() => handleKickParticipant(member.id, member.name)}
                      disabled={kickingId === member.id}
                      className="p-1.5 rounded-lg border border-ink sticky-note-rose text-ink hover:bg-rose-tint cursor-pointer transition-all disabled:opacity-50"
                    >
                      <UserX className="w-4 h-4 text-[#d32f2f]" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* QR Code Modal */}
      <QrModal isOpen={showQr} onClose={() => setShowQr(false)} />
    </div>
  )
}
