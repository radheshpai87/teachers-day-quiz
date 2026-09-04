'use client'

import { useState } from 'react'
import type { LeaderboardEntry } from '@/lib/types'
import { ParticipantAvatar } from '@/components/participant-avatar'
import { Medal, ArrowUp, ArrowDown, Trophy, PaperClip } from '@/components/icons'
import { motion, AnimatePresence } from 'framer-motion'
import { Phone, Building2, User, X, Users } from 'lucide-react'

interface LeaderboardViewProps {
  top: LeaderboardEntry[]
  totalPlayers?: number
  currentParticipantId?: string
  displayMode?: boolean
}

export function getCollegeShortform(college?: string): string {
  if (!college) return 'Yenepoya'
  if (college.includes('Medical')) return 'YMC'
  if (college.includes('Dental')) return 'YDC'
  if (college.includes('Nursing')) return 'YNC'
  if (college.includes('Pharmacy')) return 'YPC'
  if (college.includes('Physiotherapy')) return 'YPT'
  if (college.includes('Arts') || college.includes('YIASCM')) return 'YIASCM'
  if (college.includes('Allied')) return 'YSAHS'
  if (college.includes('Homoeopathic')) return 'YHMCH'
  if (college.includes('Ayurveda')) return 'YAMCH'
  if (college.includes('Naturopathy') || college.includes('Yogic')) return 'YNYSC'
  if (college.includes('Technology') || college.includes('Engineering')) return 'YTech'
  if (college.includes('Research')) return 'YRC'
  return 'Other'
}

export function LeaderboardView({
  top,
  totalPlayers,
  currentParticipantId,
  displayMode = false,
}: LeaderboardViewProps) {
  const [selectedStudent, setSelectedStudent] = useState<LeaderboardEntry | null>(null)

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
      <div className="text-center space-y-2 select-none flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full sticky-note-yellow font-black text-xs uppercase tracking-wider text-ink -rotate-1">
          <PaperClip className="w-4 h-4 text-ink" />
          <Trophy className="w-4 h-4 text-[#d32f2f]" />
          <span>Live Rankings</span>
        </div>
        <h2 className={`font-black text-ink ${displayMode ? 'text-3xl sm:text-5xl' : 'text-2xl sm:text-3xl'}`}>
          Hall of Fame
        </h2>
        {totalPlayers !== undefined && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#93d500] text-[#231f20] border-2 border-ink shadow-[2px_2px_0px_#231f20] font-black text-xs sm:text-sm uppercase tracking-wider">
            <Users className="w-4 h-4 text-[#231f20]" />
            <span>{totalPlayers.toLocaleString()} Total Participants</span>
          </div>
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
                onClick={() => setSelectedStudent(entry)}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col items-center text-center p-2.5 sm:p-4 rounded-2xl border-2 border-ink transition-all cursor-pointer hover:scale-105 ${
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

                {/* College Shortform Badge */}
                <span className="px-2 py-0.5 mt-1 rounded-md sticky-note-mint text-[10px] font-black border border-ink shadow-[1px_1px_0px_#231f20] uppercase">
                  {getCollegeShortform(entry.college)}
                </span>

                <span className="tnum font-black text-[#0284c7] text-[11px] sm:text-sm mt-1">
                  {entry.score.toLocaleString()} pts
                </span>
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
                  onClick={() => setSelectedStudent(entry)}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className={`w-full p-3 rounded-xl border-2 border-ink flex items-center justify-between gap-3 overflow-hidden transition-all shadow-[2px_2px_0px_#231f20] cursor-pointer hover:translate-x-1 ${
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

                    {/* Shortform College Badge */}
                    <span className="px-2 py-0.5 rounded-md sticky-note-mint text-[10px] font-black border border-ink shadow-[1px_1px_0px_#231f20] shrink-0 uppercase">
                      {getCollegeShortform(entry.college)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0 ml-auto">
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

      {/* Interactive Student Details Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="w-full max-w-sm sticky-note-yellow p-6 rounded-3xl border-3 border-ink shadow-[8px_8px_0px_#2a2440] flex flex-col items-center gap-4 text-center relative"
            >
              <button
                type="button"
                onClick={() => setSelectedStudent(null)}
                className="absolute top-4 right-4 p-1.5 rounded-xl bg-white border-2 border-ink text-ink hover:scale-105 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <ParticipantAvatar seed={selectedStudent.avatarSeed} size="xl" className="border-2 border-ink shadow-[3px_3px_0px_#2a2440]" />

              <div className="space-y-1">
                <span className="px-3 py-1 rounded-full bg-white text-ink border border-ink font-black text-xs uppercase tracking-wider">
                  Rank #{selectedStudent.rank} • {selectedStudent.score.toLocaleString()} Pts
                </span>
                <h3 className="text-xl font-black text-ink">{selectedStudent.name}</h3>
              </div>

              <div className="w-full bg-white p-4 rounded-2xl border-2 border-ink text-left space-y-3 font-bold text-xs sm:text-sm text-ink shadow-[3px_3px_0px_#2a2440]">
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-[#0284c7] shrink-0" />
                  <div>
                    <span className="block text-[10px] text-ink-soft uppercase font-black">Full Name</span>
                    <span>{selectedStudent.name}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 border-t border-ink/10 pt-2">
                  <Phone className="w-4 h-4 text-[#43a047] shrink-0" />
                  <div>
                    <span className="block text-[10px] text-ink-soft uppercase font-black">Phone Number</span>
                    <span>{selectedStudent.phone || 'Not Provided'}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 border-t border-ink/10 pt-2">
                  <Building2 className="w-4 h-4 text-[#e53935] shrink-0" />
                  <div>
                    <span className="block text-[10px] text-ink-soft uppercase font-black">College / Institution</span>
                    <span>{selectedStudent.college || 'Yenepoya University'}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
