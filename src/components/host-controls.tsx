'use client'

import { useState, useMemo } from 'react'
import type { HostFrame } from '@/lib/types'
import { apiPost } from '@/lib/client/api'
import { ANSWER_SHAPES, Users, QrFrame, GraduationCap, PaperClip } from '@/components/icons'
import { Play, Pause, SkipForward, Square, BarChart2, RotateCcw, Search, Trophy, Check } from 'lucide-react'
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

  const allMembers = useMemo(() => {
    return snapshot.allParticipants ?? snapshot.top ?? []
  }, [snapshot.allParticipants, snapshot.top])

  const filteredMembers = useMemo(() => {
    if (!searchQuery.trim()) return allMembers
    const q = searchQuery.toLowerCase().trim()
    return allMembers.filter((m) => m.name.toLowerCase().includes(q))
  }, [allMembers, searchQuery])

  const { status, phase, players, roundIndex, totalRounds, quiz } = snapshot

  const isWaiting = status === 'WAITING'
  const isLive = status === 'LIVE'
  const isPaused = status === 'PAUSED'
  const isCompleted = status === 'COMPLETED'

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

  return (
    <div className="w-full space-y-6 select-none">
      {/* Top Banner: Quiz Name, Status, QR Button & Reset Button */}
      <div className="notebook-card p-6 border-2 border-ink space-y-4 shadow-[4px_4px_0px_#2a2440]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full sticky-note-yellow text-ink font-black text-xs -rotate-1">
              <PaperClip className="w-4 h-4 text-ink" />
              <GraduationCap className="w-4 h-4" />
              <span>{quiz.name}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-ink">
              Host Console
            </h1>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowQr(true)}
              className="px-5 py-3 rounded-2xl sticky-note-lavender border-2 border-ink text-ink font-black text-sm hover:-translate-y-0.5 transition-all cursor-pointer shadow-[3px_3px_0px_#2a2440] flex items-center gap-2"
            >
              <QrFrame className="w-5 h-5 text-[#7b1fa2]" />
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

        {/* Live Status & Main Action Button */}
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
                    : 'bg-[#7b1fa2]'
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

            {/* Round info */}
            {roundIndex >= 0 && (
              <div className="text-xs font-black text-ink tnum bg-paper-warm px-3 py-2 rounded-xl border-2 border-ink">
                Question {roundIndex + 1} / {totalRounds}
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

      {/* Live Answers Tally Display */}
      {roundIndex >= 0 && (
        <div className="notebook-card p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-[#7b1fa2]" />
              <h2 className="font-black text-ink text-base">Live Question Tallies</h2>
            </div>

            <div className="text-xs font-black text-ink tnum">
              Answered: <span className="text-[#7b1fa2] font-black">{currentAnswered}</span> / {players}
            </div>
          </div>

          {/* Option Tallies */}
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
        </div>
      )}

      {/* Participating Members Roster Card */}
      <div className="notebook-card p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-[#7b1fa2]" />
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
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border-2 border-ink bg-paper-cream text-ink text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#7b1fa2]"
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
              const isTop3 = member.rank <= 3
              const rankColor =
                member.rank === 1
                  ? 'sticky-note-yellow text-ink font-black'
                  : member.rank === 2
                  ? 'sticky-note-mint text-ink font-black'
                  : member.rank === 3
                  ? 'sticky-note-rose text-ink font-black'
                  : 'bg-paper-cream text-ink font-extrabold'

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

                    {/* Member Name */}
                    <div className="min-w-0">
                      <div className="font-extrabold text-ink text-sm truncate flex items-center gap-1.5">
                        <span>{member.name}</span>
                        {isTop3 && (
                          <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded-full sticky-note-yellow border border-ink">
                            Top {member.rank}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] font-bold text-ink-soft flex items-center gap-2">
                        {typeof member.correct === 'number' && (
                          <span className="flex items-center gap-0.5 text-[#388e3c]">
                            <Check className="w-3 h-3 stroke-[3]" />
                            {member.correct} correct
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Member Score / Points */}
                  <div className="shrink-0 text-right">
                    <span className="tnum font-black text-base text-[#7b1fa2]">
                      {member.score.toLocaleString()}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase text-ink-soft block">
                      pts
                    </span>
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
