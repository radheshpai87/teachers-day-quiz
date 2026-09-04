'use client'

import { useHostStream } from '@/lib/client/use-stream'
import { HostControls } from '@/components/host-controls'
import { LeaderboardView } from '@/components/leaderboard-view'
import { Trophy, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export function AdminLiveClient() {
  const { snapshot, liveTally } = useHostStream()

  if (!snapshot) {
    return (
      <div className="flex items-center justify-center p-8 text-ink-soft font-bold">
        <span>Connecting to live host engine...</span>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* 2-Column Side-by-Side Host Console Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Host Controls, Status Banner, Question Tallies, Full Participating Members Roster */}
        <div className="lg:col-span-7 space-y-6">
          <HostControls snapshot={snapshot} />
        </div>

        {/* Right Column: Top 10 Live Leaderboard & Projector View Launcher */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-6">
          <div className="notebook-card p-6 space-y-5 border-2 border-ink shadow-[4px_4px_0px_#2a2440]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg sticky-note-yellow border border-ink flex items-center justify-center -rotate-2">
                  <Trophy className="w-4 h-4 text-[#d32f2f]" />
                </div>
                <div>
                  <h2 className="font-black text-ink text-base">
                    Top 10 Participants
                  </h2>
                  <p className="text-[11px] font-bold text-ink-soft">
                    Broadcast to projector & participant screens
                  </p>
                </div>
              </div>

              <Link
                href="/leaderboard"
                target="_blank"
                className="px-3 py-1.5 rounded-xl sticky-note-lavender border-2 border-ink text-ink font-black text-xs hover:-translate-y-0.5 transition-all flex items-center gap-1.5 shadow-[2px_2px_0px_#2a2440]"
              >
                <span>Full Projector View</span>
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
