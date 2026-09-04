'use client'

import Image from 'next/image'
import { useQuizStream } from '@/lib/client/use-stream'
import { LeaderboardView } from '@/components/leaderboard-view'
import { QrFrame, PaperClip } from '@/components/icons'
import { NotebookBackgroundDecor } from '@/components/notebook-background-decor'
import { ReactionOverlayAndBar } from '@/components/reaction-bar'
import { useState } from 'react'
import { QrModal } from '@/components/qr-modal'
import { YentechFooterCredit } from '@/components/yentech-branding'
import { Users } from 'lucide-react'

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
      <header className="w-full max-w-6xl mx-auto flex items-center justify-between gap-3 text-[#231f20] border-b-2 border-ink pb-3 z-10">
        <div className="flex items-center gap-3">
          <PaperClip className="w-5 h-5 text-ink-soft hidden sm:block shrink-0" />
          <Image
            src="/yenepoya-university-logo.svg"
            alt="Yenepoya University Logo"
            width={240}
            height={55}
            priority
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-xs"
          />
          <div className="hidden sm:block border-l-2 border-ink/20 pl-3.5 py-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-ink">
              Teachers' Day Quiz
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft font-extrabold flex items-center gap-1">
              <PaperClip className="w-3.5 h-3.5 text-ink" />
              <span>Hall of Fame</span>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="sticky-note-yellow px-3 py-1 text-xs font-black text-[#231f20] rounded-full border-2 border-ink shadow-[2px_2px_0px_#231f20] uppercase tracking-wider">
            Live Standings
          </span>
          <button
            type="button"
            onClick={() => setShowQr(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-paper-cream border-2 border-ink hover:bg-[#6bc4e8] transition-colors cursor-pointer text-xs font-black text-[#231f20] shadow-[2px_2px_0px_#231f20]"
          >
            <QrFrame className="w-4 h-4" />
            <span className="hidden sm:inline">Join QR</span>
          </button>
        </div>
      </header>

      {/* Main Leaderboard Table & Podium */}
      <section className="w-full max-w-6xl mx-auto my-auto py-4 z-10">
        <LeaderboardView top={top} totalPlayers={totalPlayers} displayMode={true} />
      </section>

      {/* Footer Banner */}
      <footer className="w-full max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-ink font-black border-t-2 border-ink pt-2.5 z-10">
        <YentechFooterCredit className="py-0" />
        <span className="tnum font-black text-[#231f20] bg-[#93d500] px-4 py-1.5 rounded-full border-2 border-ink shadow-[2px_2px_0px_#231f20] shrink-0 text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
          <Users className="w-4 h-4 text-[#231f20]" /> <span>{totalPlayers.toLocaleString()} Participants Joined</span>
        </span>
      </footer>

      {/* QR Modal */}
      <QrModal isOpen={showQr} onClose={() => setShowQr(false)} />

      {/* Live Reactions on Projector Display */}
      <ReactionOverlayAndBar lastReaction={lastReaction} />
    </main>
  )
}
