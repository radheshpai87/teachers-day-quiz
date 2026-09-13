'use client'

import { useState } from 'react'
import { useHostStream } from '@/lib/client/use-stream'
import { HostControls } from '@/components/host-controls'
import { ParticipantAvatar } from '@/components/participant-avatar'
import type { LeaderboardEntry } from '@/lib/types'
import { Trophy, ExternalLink, Award, Users, User, GraduationCap, Building2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'

export function AdminLiveClient() {
  const [mobileTab, setMobileTab] = useState<'controls' | 'leaderboard'>('controls')
  const [selectedStudent, setSelectedStudent] = useState<LeaderboardEntry | null>(null)
  const { snapshot } = useHostStream()

  if (!snapshot) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-8 text-ink font-extrabold">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl sticky-note-yellow border-2 border-[#081a2e] text-[#081a2e] shadow-[3px_3px_0px_#04101d] animate-pulse">
          <Trophy className="w-5 h-5 text-[#d32f2f]" />
          <span>Connecting to live host engine...</span>
        </div>
      </div>
    )
  }

  const topEntries = snapshot.top || []
  const topSix = topEntries.slice(0, 6)
  const restEntries = topEntries.slice(6)

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      {/* Mobile Tab Switcher (Visible only on < lg screens) */}
      <div className="lg:hidden grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-paper-warm border-2 border-[#00d2ff]/40 shadow-[3px_3px_0px_#04101d]">
        <button
          type="button"
          onClick={() => setMobileTab('controls')}
          className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#00d2ff]/30 transition-all cursor-pointer ${
            mobileTab === 'controls'
              ? 'sticky-note-yellow text-[#081a2e] shadow-[2px_2px_0px_#04101d]'
              : 'bg-paper-cream text-ink-soft hover:text-ink'
          }`}
        >
          <span>Host Console & Roster</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('leaderboard')}
          className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 border border-[#00d2ff]/30 transition-all cursor-pointer ${
            mobileTab === 'leaderboard'
              ? 'sticky-note-yellow text-[#081a2e] shadow-[2px_2px_0px_#04101d]'
              : 'bg-paper-cream text-ink-soft hover:text-ink'
          }`}
        >
          <Trophy className="w-4 h-4 text-[#d32f2f]" />
          <span>Stage Qualifiers ({topEntries.length})</span>
        </button>
      </div>

      {/* 2-Column Desktop / Mobile Tabbed Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left Column: Host Controls, Status Banner, Question Tallies, Member Roster */}
        <div className={`lg:col-span-7 space-y-4 sm:space-y-6 ${mobileTab === 'controls' ? 'block' : 'hidden lg:block'}`}>
          <HostControls snapshot={snapshot} />
        </div>

        {/* Right Column: Tailored Admin Live Leaderboard & Stage Qualifiers */}
        <div className={`lg:col-span-5 space-y-4 sm:space-y-6 lg:sticky lg:top-6 ${mobileTab === 'leaderboard' ? 'block' : 'hidden lg:block'}`}>
          <div className="notebook-card p-4 sm:p-5 space-y-4 bg-[#0e2e4e]">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl sticky-note-yellow border-2 border-[#081a2e] flex items-center justify-center -rotate-2 shrink-0 shadow-[2px_2px_0px_#04101d]">
                  <Trophy className="w-4 h-4 text-[#d32f2f]" />
                </div>
                <div>
                  <h2 className="font-black text-ink text-sm sm:text-base leading-tight">
                    Live Standings & Qualifiers
                  </h2>
                  <p className="text-[10px] sm:text-[11px] font-extrabold text-ink-soft">
                    {snapshot.players} Connected • Top 6 to Stage Finale
                  </p>
                </div>
              </div>

              <Link
                href="/leaderboard"
                target="_blank"
                className="px-3 py-1.5 rounded-xl bg-[#00d2ff] hover:bg-[#38bdf8] text-[#081a2e] border-2 border-[#081a2e] font-black text-xs hover:-translate-y-0.5 transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_#04101d] shrink-0"
              >
                <span>Projector</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#081a2e]" />
              </Link>
            </div>

            <div className="w-full border-t border-[#00d2ff]/30" />

            {topEntries.length === 0 ? (
              <div className="p-6 text-center text-xs font-extrabold text-ink-soft bg-paper-cream rounded-xl border border-[#00d2ff]/30">
                No scores recorded yet. Start the quiz to display live standings and qualifiers!
              </div>
            ) : (
              <div className="space-y-4">
                {/* Top 6 Stage Qualifiers Card */}
                {topSix.length > 0 && (
                  <div className="space-y-2.5 bg-[#081f37] p-3 sm:p-3.5 rounded-2xl border-2 border-[#00d2ff] shadow-[3px_3px_0px_#04101d]">
                    <div className="flex items-center justify-between border-b border-[#00d2ff]/30 pb-2 px-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <Award className="w-3.5 h-3.5 text-yellow-300" />
                        <span className="font-black text-[11px] sm:text-xs uppercase tracking-wider text-white">
                          Top 6 Stage Finalists
                        </span>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-[#10b981] text-[#081a2e] border border-[#081a2e] uppercase">
                        Stage Round
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {topSix.map((entry, idx) => {
                        const rankNum = idx + 1
                        const noteStyles = [
                          'sticky-note-yellow ring-2 ring-yellow-400',
                          'sticky-note-lavender',
                          'sticky-note-rose',
                          'sticky-note-mint',
                          'sticky-note-peach',
                          'sticky-note-yellow',
                        ]
                        const styleClass = noteStyles[idx] || 'sticky-note-mint'

                        return (
                          <div
                            key={entry.id}
                            onClick={() => setSelectedStudent(entry)}
                            className={`p-2 rounded-xl border-2 border-[#081a2e] ${styleClass} shadow-[2px_2px_0px_#04101d] flex items-center justify-between gap-2.5 transition-all cursor-pointer hover:scale-[1.02]`}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span className="w-5 h-5 rounded-md bg-[#081a2e] text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                #{rankNum}
                              </span>
                              <ParticipantAvatar seed={entry.avatarSeed} size="sm" className="shrink-0 border border-[#081a2e]/40" />
                              <div className="min-w-0 flex-1">
                                <span className="font-black text-[#081a2e] text-xs block truncate leading-tight">
                                  {entry.name}
                                </span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {entry.year && (
                                    <span className="text-[9px] font-black text-[#081a2e]/80 uppercase">
                                      {entry.year}
                                    </span>
                                  )}
                                  {entry.edutechPartner && (
                                    <span className="text-[9px] font-extrabold text-[#081a2e]/80 uppercase">
                                      • {entry.edutechPartner}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="tnum font-black text-[#081a2e] text-xs block">
                                {entry.score.toLocaleString()} pts
                              </span>
                              <span className="text-[8px] font-black uppercase text-[#081a2e]/70">
                                Qualifier #{rankNum}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Remaining Participants (Ranks 7+) */}
                {restEntries.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-ink-soft px-1">
                      <span>Other Participants (Ranks 7 – {topEntries.length})</span>
                      <span>{restEntries.length} Students</span>
                    </div>

                    <div className="space-y-1.5 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                      {restEntries.map((entry) => (
                        <div
                          key={entry.id}
                          onClick={() => setSelectedStudent(entry)}
                          className="p-2 rounded-xl bg-[#0a233c] hover:bg-[#103456] border border-[#00d2ff]/30 flex items-center justify-between gap-2 transition-all cursor-pointer shadow-[1px_1px_0px_#04101d]"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="tnum font-black text-ink-soft text-xs w-5 text-center shrink-0">
                              #{entry.rank}
                            </span>
                            <ParticipantAvatar seed={entry.avatarSeed} size="sm" className="shrink-0" />
                            <span className="font-extrabold text-ink text-xs truncate">
                              {entry.name}
                            </span>
                          </div>

                          <span className="tnum font-black text-[#00d2ff] text-xs shrink-0">
                            {entry.score.toLocaleString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

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
    </div>
  )
}
