'use client'

import { useState } from 'react'
import { useHostStream } from '@/lib/client/use-stream'
import { HostControls } from '@/components/host-controls'
import { LeaderboardView } from '@/components/leaderboard-view'
import { Trophy, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export function AdminLiveClient() {
  const [mobileTab, setMobileTab] = useState<'controls' | 'leaderboard'>('controls')
  const { snapshot } = useHostStream()

  if (!snapshot) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-8 text-ink font-extrabold">
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl sticky-note-yellow border-2 border-ink shadow-[3px_3px_0px_#2a2440] animate-pulse">
          <Trophy className="w-5 h-5 text-[#d32f2f]" />
          <span>Connecting to live host engine...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 pb-20 lg:pb-6">
      {/* Mobile Tab Switcher (Visible only on < lg screens) */}
      <div className="lg:hidden grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-paper-warm border-2 border-ink shadow-[3px_3px_0px_#2a2440]">
        <button
          type="button"
          onClick={() => setMobileTab('controls')}
          className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 border border-ink transition-all cursor-pointer ${
            mobileTab === 'controls'
              ? 'sticky-note-yellow text-ink shadow-[2px_2px_0px_#2a2440]'
              : 'bg-paper-cream text-ink-soft hover:text-ink'
          }`}
        >
          <span>Host Console & Roster</span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('leaderboard')}
          className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 border border-ink transition-all cursor-pointer ${
            mobileTab === 'leaderboard'
              ? 'sticky-note-yellow text-ink shadow-[2px_2px_0px_#2a2440]'
              : 'bg-paper-cream text-ink-soft hover:text-ink'
          }`}
        >
          <Trophy className="w-4 h-4 text-[#d32f2f]" />
          <span>Top 10 Leaderboard</span>
        </button>
      </div>

      {/* 2-Column Desktop / Mobile Tabbed Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left Column: Host Controls, Status Banner, Question Tallies, Member Roster */}
        <div className={`lg:col-span-7 space-y-4 sm:space-y-6 ${mobileTab === 'controls' ? 'block' : 'hidden lg:block'}`}>
          <HostControls snapshot={snapshot} />
        </div>

        {/* Right Column: Top 10 Live Leaderboard & Projector View Launcher */}
        <div className={`lg:col-span-5 space-y-4 sm:space-y-6 lg:sticky lg:top-6 ${mobileTab === 'leaderboard' ? 'block' : 'hidden lg:block'}`}>
          <div className="notebook-card p-4 sm:p-6 space-y-4 sm:space-y-5 border-2 border-ink shadow-[4px_4px_0px_#2a2440]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg sticky-note-yellow border border-ink flex items-center justify-center -rotate-2 shrink-0">
                  <Trophy className="w-4 h-4 text-[#d32f2f]" />
                </div>
                <div>
                  <h2 className="font-black text-ink text-sm sm:text-base">
                    Top 10 Participants
                  </h2>
                  <p className="text-[10px] sm:text-[11px] font-bold text-ink-soft">
                    Broadcast to projector & screens
                  </p>
                </div>
              </div>

              <Link
                href="/leaderboard"
                target="_blank"
                className="px-3 py-1.5 rounded-xl sticky-note-lavender border-2 border-ink text-ink font-black text-xs hover:-translate-y-0.5 transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_#2a2440] shrink-0"
              >
                <span className="hidden sm:inline">Full Projector View</span>
                <span className="sm:hidden">Projector</span>
                <ExternalLink className="w-3.5 h-3.5 text-ink" />
              </Link>
            </div>

            <div className="w-full border-t-2 border-ink" />

            {/* Leaderboard Entries List */}
            {snapshot.top && snapshot.top.length > 0 ? (
              <LeaderboardView top={snapshot.top} totalPlayers={snapshot.players} />
            ) : (
              <div className="p-6 text-center text-xs font-extrabold text-ink-soft bg-paper-cream rounded-xl border border-ink">
                No participants ranked yet. Start the quiz to display live scores!
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
