'use client'

import { useQuizStream } from '@/lib/client/use-stream'
import { LeaderboardView } from '@/components/leaderboard-view'
import { GraduationCap, QrFrame, PaperClip } from '@/components/icons'
import { NotebookBackgroundDecor } from '@/components/notebook-background-decor'
import { ReactionOverlayAndBar } from '@/components/reaction-bar'
import { useState } from 'react'
import { QrModal } from '@/components/qr-modal'

export default function LeaderboardPage() {
  const { state, players, lastReaction } = useQuizStream({ display: true })
  const [showQr, setShowQr] = useState(false)

  const top = state?.leaderboard?.top || []
  const totalPlayers = state?.players ?? players

  return (
    <main className="min-h-dvh notebook-paper flex flex-col justify-between pl-7 pr-3 py-4 sm:p-8 pb-safe select-none relative overflow-hidden">
      {/* Consistent Notebook Background Geometry */}
      <NotebookBackgroundDecor />

      {/* Top Header */}
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between gap-4 z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl sticky-note-yellow flex items-center justify-center border-2 border-ink -rotate-3 shadow-[2px_2px_0px_#2a2440]">
            <GraduationCap className="w-6 h-6 text-ink" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-ink">
              Teachers' Day Quiz
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft font-extrabold flex items-center gap-1">
              <PaperClip className="w-3.5 h-3.5 text-ink" />
              <span>Live Event Leaderboard</span>
            </p>
          </div>
        </div>

        {/* Action / QR button */}
        <button
          type="button"
          onClick={() => setShowQr(true)}
          className="px-4 py-2 rounded-xl sticky-note-lavender border-2 border-ink text-ink font-black text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer shadow-[2px_2px_0px_#2a2440] hover:-translate-y-0.5"
        >
          <QrFrame className="w-4 h-4" />
          <span>Join QR Code</span>
        </button>
      </header>

      {/* Main Leaderboard Display */}
      <div className="w-full max-w-5xl mx-auto my-auto py-6 sm:py-8 z-10">
        <LeaderboardView
          top={top}
          totalPlayers={totalPlayers}
          displayMode={true}
        />
      </div>

      {/* Footer Banner */}
      <footer className="w-full max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-ink font-black border-t-2 border-ink pt-4 z-10">
        <div className="flex items-center gap-2">
          <span>Happy Teachers' Day 🎓</span>
          <span className="text-ink-soft">•</span>
          <span className="text-ink-soft text-xs font-extrabold">Presented by <strong className="text-ink font-black">YENTECH</strong> (YSET)</span>
        </div>
        <span className="tnum font-black text-[#7b1fa2]">
          {totalPlayers} Participants Online
        </span>
      </footer>

      {/* QR Modal */}
      <QrModal isOpen={showQr} onClose={() => setShowQr(false)} />

      {/* Live Reactions on Projector Display */}
      <ReactionOverlayAndBar lastReaction={lastReaction} />
    </main>
  )
}
