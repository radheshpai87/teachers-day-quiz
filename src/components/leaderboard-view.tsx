'use client'

import { useState } from 'react'
import type { LeaderboardEntry } from '@/lib/types'
import { ParticipantAvatar } from '@/components/participant-avatar'
import { Medal, ArrowUp, ArrowDown, Trophy, PaperClip } from '@/components/icons'
import { motion, AnimatePresence } from 'framer-motion'
import { GraduationCap, Building2, User, X, Users } from 'lucide-react'
import { YentechFooterCredit } from '@/components/yentech-branding'

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
  const [selectedStudent, setSelectedStudent] = useState<LeaderboardEntry | null>(null)

  const topSix = top.slice(0, 6)
  const topThree = top.slice(0, 3)
  const rankFourToSix = top.slice(3, 6)
  const rest = top.slice(6)

  const podiumOrder = [
    topThree[1] || null, // 2nd
    topThree[0] || null, // 1st
    topThree[2] || null, // 3rd
  ]

  return (
    <div
      className={`w-full mx-auto flex flex-col items-center space-y-6 ${
        displayMode ? 'max-w-5xl p-2 sm:p-6' : 'max-w-xl p-2 sm:p-4'
      }`}
    >
      {/* Header Title */}
      <div className="text-center space-y-2 select-none flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full sticky-note-yellow font-black text-xs uppercase tracking-wider text-ink -rotate-1">
          <PaperClip className="w-4 h-4 text-ink" />
          <Trophy className="w-4 h-4 text-[#d32f2f]" />
          <span>Round 1 Results & Stage Qualifiers</span>
        </div>
        <h2 className={`font-black text-ink ${displayMode ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-3xl'}`}>
          Hall of Fame
        </h2>
        <div className="flex items-center gap-2.5 flex-wrap justify-center">
          {totalPlayers !== undefined && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#93d500] text-[#231f20] border-2 border-[#081a2e] shadow-[2px_2px_0px_#04101d] font-black text-xs sm:text-sm uppercase tracking-wider">
              <Users className="w-4 h-4 text-[#231f20]" />
              <span>{totalPlayers.toLocaleString()} Participants</span>
            </div>
          )}
          <a
            href="/stage"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#00d2ff] hover:bg-[#38bdf8] text-[#081a2e] border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] font-black text-xs sm:text-sm uppercase tracking-wider transition-transform hover:scale-105"
          >
            <span>🚀 Open Stage Quiz (PPT)</span>
          </a>
        </div>
      </div>

      {/* TOP 6 STAGE QUALIFIERS SHOWCASE */}
      {topSix.length > 0 && (
        <div className="w-full space-y-3 bg-[#081f37]/80 p-3.5 sm:p-5 rounded-3xl border-2 border-[#00d2ff] shadow-[4px_4px_0px_#04101d]">
          <div className="flex items-center justify-between border-b-2 border-[#00d2ff]/40 pb-2.5 px-1">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-black text-xs sm:text-sm uppercase tracking-wider text-white">
                🎯 Top 6 Qualifiers — Stage Finalists
              </span>
            </div>
            <span className="text-[11px] sm:text-xs font-black px-2.5 py-0.5 rounded-full bg-[#10b981] text-[#081a2e] border border-[#081a2e]">
              Advancing to Stage Round
            </span>
          </div>

          {/* Top 3 Podium Cards */}
          {topThree.length > 0 && (
            <div className="w-full grid grid-cols-3 gap-2 sm:gap-3.5 items-end pt-2 pb-1">
              {podiumOrder.map((entry, idx) => {
                if (!entry) return <div key={idx} />
                const place = (idx === 1 ? 1 : idx === 0 ? 2 : 3) as 1 | 2 | 3
                const isFirst = place === 1
                const isSelf = currentParticipantId && entry.id === currentParticipantId

                return (
                  <motion.div
                    key={entry.id}
                    layout
                    onClick={() => setSelectedStudent(entry)}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex flex-col items-center text-center p-2.5 sm:p-3.5 rounded-2xl border-2 border-[#081a2e] transition-all cursor-pointer hover:scale-105 ${
                      isFirst
                        ? 'sticky-note-yellow shadow-[4px_4px_0px_#04101d] -translate-y-2 ring-2 ring-yellow-400'
                        : place === 2
                        ? 'sticky-note-lavender shadow-[3px_3px_0px_#04101d]'
                        : 'sticky-note-rose shadow-[3px_3px_0px_#04101d]'
                    } ${isSelf ? 'ring-4 ring-[#0284c7]' : ''}`}
                  >
                    <div className="relative mb-1">
                      <ParticipantAvatar
                        seed={entry.avatarSeed}
                        size={displayMode ? (isFirst ? 'xl' : 'lg') : isFirst ? 'lg' : 'md'}
                        className="border-2 border-[#081a2e] shadow-[2px_2px_0px_#04101d]"
                      />
                      <div className="absolute -bottom-2 -right-1">
                        <Medal place={place} className="w-6 h-6 sm:w-7 sm:h-7 drop-shadow-xs" />
                      </div>
                    </div>

                    <span className="font-black text-[#081a2e] text-xs sm:text-sm line-clamp-1 mt-1 break-all">
                      {entry.name}
                    </span>

                    <span className="px-2 py-0.5 mt-1 rounded-md bg-[#081a2e] text-white text-[9px] font-black uppercase tracking-wider">
                      Qualifier #{place}
                    </span>

                    <span className="tnum font-black text-[#0284c7] text-[11px] sm:text-xs mt-1">
                      {entry.score.toLocaleString()} pts
                    </span>
                  </motion.div>
                )
              })}
            </div>
          )}

          {/* Qualifiers 4, 5, 6 Grid */}
          {rankFourToSix.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              {rankFourToSix.map((entry, idx) => {
                const rankNum = idx + 4
                const isSelf = currentParticipantId && entry.id === currentParticipantId

                return (
                  <motion.div
                    key={entry.id}
                    layout
                    onClick={() => setSelectedStudent(entry)}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border-2 border-[#081a2e] bg-[#10b981]/20 hover:bg-[#10b981]/30 transition-all cursor-pointer shadow-[2px_2px_0px_#04101d] ${
                      isSelf ? 'ring-3 ring-[#00d2ff]' : ''
                    }`}
                  >
                    <span className="shrink-0 w-6 h-6 rounded-lg bg-[#10b981] text-[#081a2e] font-black text-xs flex items-center justify-center border border-[#081a2e]">
                      #{rankNum}
                    </span>
                    <ParticipantAvatar seed={entry.avatarSeed} size="sm" className="border border-[#00d2ff]/40 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <span className="font-black text-white text-xs block truncate">
                        {entry.name}
                      </span>
                      <span className="text-[10px] text-emerald-300 font-bold block">
                        Qualifier #{rankNum} • {entry.score.toLocaleString()} pts
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ALL OTHER PARTICIPANTS (Rank 7+) */}
      {rest.length > 0 && (
        <div className="w-full space-y-2">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-ink-soft px-1 pt-2 border-t border-[#00d2ff]/30">
            <span>Other Participants (Ranks 7 – {top.length})</span>
            <span>{rest.length} Students</span>
          </div>

          <div className="w-full space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-1">
            <AnimatePresence mode="popLayout">
              {rest.map((entry) => {
                const isSelf = currentParticipantId && entry.id === currentParticipantId

                return (
                  <motion.div
                    key={entry.id}
                    layout
                    onClick={() => setSelectedStudent(entry)}
                    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className={`w-full p-2.5 sm:p-3 rounded-xl border-2 border-[#00d2ff]/40 flex items-center justify-between gap-3 overflow-hidden transition-all shadow-[2px_2px_0px_#04101d] cursor-pointer hover:translate-x-1 ${
                      isSelf
                        ? 'sticky-note-yellow ring-2 ring-[#0284c7]'
                        : 'bg-[#0e2e4e] hover:bg-[#143e68]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
                      <span className="tnum font-black text-ink-soft text-xs sm:text-sm w-6 text-center shrink-0">
                        #{entry.rank}
                      </span>
                      <ParticipantAvatar seed={entry.avatarSeed} size="sm" className="border border-[#00d2ff]/40 shrink-0" />
                      <span className="font-extrabold text-ink text-xs sm:text-sm truncate min-w-0 flex-1">
                        {entry.name}
                      </span>

                      {/* Year & Edutech Badges */}
                      {entry.year && (
                        <span className="px-2 py-0.5 rounded-md sticky-note-yellow text-[#081a2e] text-[9px] font-black border border-[#081a2e] shadow-[1px_1px_0px_#04101d] shrink-0 uppercase hidden sm:inline">
                          {entry.year}
                        </span>
                      )}
                      {entry.edutechPartner && (
                        <span className="px-2 py-0.5 rounded-md sticky-note-mint text-[#081a2e] text-[9px] font-black border border-[#081a2e] shadow-[1px_1px_0px_#04101d] shrink-0 uppercase hidden sm:inline">
                          {entry.edutechPartner}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 ml-auto">
                      <span className="tnum font-black text-[#00d2ff] text-xs sm:text-sm">
                        {entry.score.toLocaleString()}
                      </span>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Interactive Student Details Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#031324]/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm sticky-note-yellow p-6 rounded-3xl border-3 border-[#081a2e] shadow-[8px_8px_0px_#04101d] flex flex-col items-center gap-4 text-center relative"
            >
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-white border-2 border-[#081a2e] text-[#081a2e] hover:scale-105 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <ParticipantAvatar seed={selectedStudent.avatarSeed} size="xl" className="border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d]" />

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-white text-[#081a2e] border border-[#081a2e] font-black text-xs uppercase tracking-wider">
                  Rank #{selectedStudent.rank} • {selectedStudent.score.toLocaleString()} Pts
                </span>
                <h3 className="text-xl font-black text-[#081a2e]">{selectedStudent.name}</h3>
              </div>

              <div className="w-full bg-white p-4 rounded-2xl border-2 border-[#081a2e] text-left space-y-3 font-bold text-xs sm:text-sm text-[#081a2e] shadow-[3px_3px_0px_#04101d]">
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-[#0284c7] shrink-0" />
                  <div>
                    <span className="block text-[10px] text-ink-soft uppercase font-black">Full Name</span>
                    <span>{selectedStudent.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 border-t border-[#081a2e]/20 pt-2">
                  <GraduationCap className="w-4 h-4 text-[#43a047] shrink-0" />
                  <div>
                    <span className="block text-[10px] text-ink-soft uppercase font-black">Year of Study</span>
                    <span>{selectedStudent.year || 'N/A'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 border-t border-[#081a2e]/20 pt-2">
                  <Building2 className="w-4 h-4 text-[#e53935] shrink-0" />
                  <div>
                    <span className="block text-[10px] text-ink-soft uppercase font-black">Edutech Partner / Program</span>
                    <span>{selectedStudent.edutechPartner || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Footer Branding for Mobile / Participant view */}
      {!displayMode && (
        <div className="w-full border-t border-[#00d2ff]/30 pt-3 mt-4">
          <YentechFooterCredit className="py-0" />
        </div>
      )}
    </div>
  )
}
