'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadSession, clearSession, type StoredSession } from '@/lib/client/idb'
import { useQuizStream } from '@/lib/client/use-stream'
import { apiGet, apiPost } from '@/lib/client/api'
import { WaitingRoom } from '@/components/waiting-room'
import { QuestionCard } from '@/components/question-card'
import { RevealView } from '@/components/reveal-view'
import { LeaderboardView } from '@/components/leaderboard-view'
import { GraduationCap, PaperClip } from '@/components/icons'
import { NotebookBackgroundDecor } from '@/components/notebook-background-decor'
import { ReactionOverlayAndBar } from '@/components/reaction-bar'
import { motion, AnimatePresence } from 'framer-motion'

export default function PlayPage() {
  const router = useRouter()
  const [session, setSession] = useState<StoredSession | null>(null)
  const [loadingSession, setLoadingSession] = useState(true)

  useEffect(() => {
    let active = true

    loadSession()
      .then(async (s) => {
        if (!s?.participantId) {
          if (active) router.replace('/join')
          return
        }

        try {
          await apiGet(`/api/me?pid=${encodeURIComponent(s.participantId)}`)
          if (active) setSession(s)
        } catch {
          await clearSession()
          if (active) router.replace('/join')
        }
      })
      .finally(() => {
        if (active) setLoadingSession(false)
      })

    return () => {
      active = false
    }
  }, [router])

  const { state, status, showReconnecting, players, clockOffset, lastReaction } = useQuizStream({
    participantId: session?.participantId,
  })

  useEffect(() => {
    if (status === 'invalid') {
      clearSession().then(() => router.replace('/join'))
    }
  }, [status, router])

  useEffect(() => {
    if (state?.phase === 'COMPLETED') {
      router.replace('/results')
    }
  }, [state?.phase, router])

  const handleSelectAnswer = async (choiceIndex: number) => {
    if (!session?.participantId || !state?.question) return
    try {
      const res = await apiPost<{ accepted: boolean; reason?: string }>('/api/answer', {
        participantId: session.participantId,
        questionId: state.question.question.id,
        roundIndex: state.roundIndex,
        choice: choiceIndex,
      })
      if (res && res.accepted === false && res.reason !== 'DUPLICATE') {
        console.warn('Answer submission rejected by server:', res.reason)
      }
    } catch {
      /* answer handling is server-authoritative */
    }
  }

  if (loadingSession || !session) {
    return (
      <main className="min-h-screen notebook-paper flex items-center justify-center p-4 select-none relative overflow-hidden">
        <NotebookBackgroundDecor />
        <div className="flex flex-col items-center gap-3 text-ink z-10">
          <GraduationCap className="w-10 h-10 text-[#7b1fa2] animate-bounce" />
          <span className="text-sm font-black">Loading your session...</span>
        </div>
      </main>
    )
  }

  const phase = state?.phase || 'WAITING'

  return (
    <main className="min-h-dvh notebook-paper flex flex-col items-center justify-start py-4 pl-7 pr-3 sm:px-6 pb-safe select-none relative overflow-hidden">
      {/* Consistent Notebook Background Geometry */}
      <NotebookBackgroundDecor />

      {/* Top Navbar Header */}
      <header className="w-full max-w-2xl flex items-center justify-between py-2 px-3 mb-2 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl sticky-note-yellow flex items-center justify-center border-2 border-ink -rotate-3 shadow-[2px_2px_0px_#2a2440]">
            <GraduationCap className="w-5 h-5 text-ink" />
          </div>
          <div className="flex items-center gap-1.5 font-black text-ink text-sm sm:text-base">
            <PaperClip className="w-4 h-4" />
            <span>{state?.quizName || session.quizName || "Teachers' Day Quiz"}</span>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          {showReconnecting && status === 'reconnecting' && (
            <span className="px-3 py-1 rounded-full sticky-note-rose text-ink font-black text-xs border border-ink shadow-[2px_2px_0px_#2a2440] animate-pulse">
              Reconnecting...
            </span>
          )}
        </div>
      </header>

      {/* Main Gameplay Screen Content based on phase */}
      <div className="w-full max-w-2xl flex-1 flex flex-col justify-center z-10">
        <AnimatePresence mode="wait">
          {phase === 'WAITING' && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              className="w-full"
            >
              <WaitingRoom
                name={session.name}
                avatarSeed={session.avatarSeed}
                playersCount={players}
                quizName={state?.quizName || session.quizName}
              />
            </motion.div>
          )}

          {phase === 'QUESTION' && state?.question && (
            <motion.div
              key={`question-${state.roundIndex}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <QuestionCard
                question={state.question.question}
                roundIndex={state.roundIndex}
                totalRounds={state.totalRounds}
                answersOpenAt={state.question.answersOpenAt}
                answersCloseAt={state.question.answersCloseAt}
                clockOffsetMs={clockOffset.current}
                yourChoice={state.question.yourChoice}
                self={state.you}
                onSelectAnswer={handleSelectAnswer}
              />
            </motion.div>
          )}

          {phase === 'REVEAL' && state?.reveal && (
            <motion.div
              key={`reveal-${state.roundIndex}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
            >
              <RevealView reveal={state.reveal} self={state.you} />
            </motion.div>
          )}

          {phase === 'LEADERBOARD' && state?.leaderboard && (
            <motion.div
              key={`leaderboard-${state.roundIndex}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
            >
              <LeaderboardView
                top={state.leaderboard.top}
                totalPlayers={state.leaderboard.totalPlayers}
                currentParticipantId={session.participantId}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Live Celebratory Reactions Overlay & Interactive Bar */}
      <ReactionOverlayAndBar
        participantId={session.participantId}
        lastReaction={lastReaction}
      />
    </main>
  )
}
