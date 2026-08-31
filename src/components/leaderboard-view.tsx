'use client'

import type { LeaderboardEntry } from '@/lib/types'
import { ParticipantAvatar } from '@/components/participant-avatar'
import { Medal, ArrowUp, ArrowDown, Trophy, PaperClip } from '@/components/icons'
import { motion, AnimatePresence } from 'framer-motion'

interface LeaderboardViewProps {
  top: LeaderboardEntry[]
  totalPlayers?: number
  currentParticipantId?: string
  displayMode?: boolean
}

export function LeaderboardView({
  top,
  totalPlayers,
  currentParticipantId,
  displayMode = false,
}: LeaderboardViewProps) {
  // Top 3 for podium, rest for full list of all joined participants
  const topThree = top.slice(0, 3)
  const rest = top.slice(3)

  const podiumOrder = [
    topThree[1] || null, // 2nd
    topThree[0] || null, // 1st
    topThree[2] || null, // 3rd
  ]

  return (
    <div
      className={`w-full mx-auto flex flex-col items-center space-y-6 ${
        displayMode ? 'max-w-4xl p-2 sm:p-6' : 'max-w-xl p-2 sm:p-4'
      }`}
    >
      {/* Header Title */}
      <div className="text-center space-y-1.5 select-none">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full sticky-note-yellow font-black text-xs uppercase tracking-wider text-ink -rotate-1">
          <PaperClip className="w-4 h-4 text-ink" />
          <Trophy className="w-4 h-4 text-[#d32f2f]" />
          <span>Live Rankings</span>
        </div>
        <h2 className={`font-black text-ink ${displayMode ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-3xl'}`}>
          Leaderboard
        </h2>
        {totalPlayers !== undefined && (
          <p className="text-xs sm:text-sm text-ink-soft tnum font-extrabold">
            Competing out of {totalPlayers.toLocaleString()} players
          </p>
        )}
      </div>

      {/* Podium for Top 3 */}
      {topThree.length > 0 && (
        <div className="w-full grid grid-cols-3 gap-2 sm:gap-4 items-end pt-3 pb-2 px-1">
          {podiumOrder.map((entry, idx) => {
            if (!entry) return <div key={idx} />
            const place = (idx === 1 ? 1 : idx === 0 ? 2 : 3) as 1 | 2 | 3
            const isFirst = place === 1
            const isSelf = currentParticipantId && entry.id === currentParticipantId

            return (
              <motion.div
                key={entry.id}
                layout
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col items-center text-center p-2.5 sm:p-4 rounded-2xl border-2 border-ink transition-all ${
                  isFirst
                    ? 'sticky-note-yellow shadow-[4px_4px_0px_#231f20] -translate-y-2'
                    : place === 2
                    ? 'sticky-note-lavender shadow-[3px_3px_0px_#231f20]'
                    : 'sticky-note-rose shadow-[3px_3px_0px_#231f20]'
                } ${isSelf ? 'ring-4 ring-[#0284c7]' : ''}`}
              >
                <div className="relative mb-1">
                  <ParticipantAvatar
                    seed={entry.avatarSeed}
                    size={displayMode ? (isFirst ? 'xl' : 'lg') : isFirst ? 'lg' : 'md'}
                    className="border-2 border-ink shadow-[2px_2px_0px_#231f20]"
                  />
                  <div className="absolute -bottom-2 -right-1">
                    <Medal place={place} className="w-6 h-6 sm:w-8 sm:h-8 drop-shadow-xs" />
                  </div>
                </div>

                <span className="font-black text-ink text-xs sm:text-base line-clamp-1 mt-1 break-all">
                  {entry.name}
                </span>

                <span className="tnum font-black text-[#0284c7] text-[11px] sm:text-sm">
                  {entry.score.toLocaleString()} pts
                </span>

                {/* Rank Movement Indicator */}
                {entry.delta !== null && entry.delta !== 0 && (
                  <motion.span
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className={`inline-flex items-center gap-0.5 text-[10px] font-black mt-0.5 px-1.5 py-0.2 rounded border border-ink bg-paper-light ${
                      entry.delta > 0 ? 'text-[#388e3c]' : 'text-[#d32f2f]'
                    }`}
                  >
                    {entry.delta > 0 ? (
                      <ArrowUp className="w-3 h-3 text-[#388e3c] animate-bounce" />
                    ) : (
                      <ArrowDown className="w-3 h-3 text-[#d32f2f]" />
                    )}
                    <span>{entry.delta > 0 ? `+${entry.delta}` : entry.delta}</span>
                  </motion.span>
                )}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Ranks 4+ list for all joined participants */}
      {rest.length > 0 && (
        <div className="w-full space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
          <AnimatePresence mode="popLayout">
            {rest.map((entry) => {
              const isSelf = currentParticipantId && entry.id === currentParticipantId

              return (
                <motion.div
                  key={entry.id}
                  layout
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`w-full p-3 rounded-xl border-2 border-ink flex items-center justify-between gap-3 overflow-hidden transition-all shadow-[2px_2px_0px_#231f20] ${
                    isSelf
                      ? 'sticky-note-yellow ring-2 ring-[#0284c7]'
                      : 'bg-paper-light hover:bg-note-mint/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                    <span className="tnum font-black text-ink text-xs sm:text-base w-6 text-center shrink-0">
                      #{entry.rank}
                    </span>
                    <ParticipantAvatar seed={entry.avatarSeed} size="sm" className="border border-ink shrink-0" />
                    <span className="font-extrabold text-ink text-xs sm:text-base truncate min-w-0 flex-1">
                      {entry.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                    {entry.delta !== null && entry.delta !== 0 && (
                      <motion.span
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className={`inline-flex items-center gap-0.5 text-xs font-black px-1.5 py-0.5 rounded border border-ink bg-paper-light ${
                          entry.delta > 0 ? 'text-[#388e3c]' : 'text-[#d32f2f]'
                        }`}
                      >
                        {entry.delta > 0 ? (
                          <ArrowUp className="w-3.5 h-3.5 text-[#388e3c] animate-bounce" />
                        ) : (
                          <ArrowDown className="w-3.5 h-3.5 text-[#d32f2f]" />
                        )}
                        <span>{entry.delta > 0 ? `+${entry.delta}` : entry.delta}</span>
                      </motion.span>
                    )}

                    <span className="tnum font-black text-[#0284c7] text-xs sm:text-base">
                      {entry.score.toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}
