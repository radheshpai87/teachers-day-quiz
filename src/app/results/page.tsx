'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { loadSession, clearSession, type StoredSession } from '@/lib/client/idb'
import { apiGet } from '@/lib/client/api'
import type { FinalSummary } from '@/lib/types'
import { ParticipantAvatar } from '@/components/participant-avatar'
import Image from 'next/image'
import { Trophy, Target, Bolt, GraduationCap, Check, ArrowUp, PaperClip, Star } from '@/components/icons'
import { sound } from '@/lib/client/sound'
import { motion } from 'framer-motion'
import { YentechFooterCredit } from '@/components/yentech-branding'

import confetti from 'canvas-confetti'

export default function ResultsPage() {
  const router = useRouter()
  const [session, setSession] = useState<StoredSession | null>(null)
  const [results, setResults] = useState<FinalSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const [wasTabSwitched, setWasTabSwitched] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem('exam_tab_switched') === 'true') {
        setWasTabSwitched(true)
      }
    } catch {
      /* storage fallback */
    }
  }, [])

  useEffect(() => {
    loadSession().then((s) => {
      if (!s?.participantId) {
        router.replace('/join')
        return
      }
      setSession(s)

      const fetchResults = (attempts = 0) => {
        apiGet<FinalSummary>(`/api/results/me?pid=${encodeURIComponent(s.participantId)}`)
          .then((res) => {
            setResults(res)
            setLoading(false)
          })
          .catch(() => {
            if (attempts < 5) {
              setTimeout(() => fetchResults(attempts + 1), 1000)
            } else {
              setLoading(false)
            }
          })
      }
      fetchResults()
    })
  }, [router])

  // Fire celebratory sound effect and multi-burst confetti animation when results load
  useEffect(() => {
    if (!loading && results) {
      sound.celebrate()

      // Initial center burst
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0284c7', '#388e3c', '#fbc02d', '#e53935', '#a855f7'],
      })

      // Side confetti cannons firing for 2.5 seconds
      const end = Date.now() + 2500
      const frameFunc = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors: ['#0284c7', '#388e3c', '#fbc02d'],
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors: ['#e53935', '#a855f7', '#fbc02d'],
        })

        if (Date.now() < end) {
          requestAnimationFrame(frameFunc)
        }
      }
      requestAnimationFrame(frameFunc)
    }
  }, [loading, results])

  const handlePlayAgain = async () => {
    try {
      sessionStorage.removeItem('exam_tab_switched')
    } catch {
      /* storage fallback */
    }
    await clearSession()
    router.replace('/join')
  }

  if (loading || !session) {
    return (
      <main className="min-h-screen notebook-paper flex items-center justify-center p-4 select-none">
        <div className="flex flex-col items-center gap-3 text-ink">
          <GraduationCap className="w-10 h-10 text-[#0284c7] animate-bounce" />
          <span className="text-sm font-black">Loading your final results...</span>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen notebook-paper flex flex-col items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden">
      {/* Floating Animated Motifs */}
      <motion.div
        animate={{ y: [0, -10, 0], rotate: [0, 8, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-10 left-8 text-[#fbc02d] opacity-80 pointer-events-none hidden sm:block"
      >
        <Star className="w-12 h-12 fill-current" />
      </motion.div>

      <motion.div
        animate={{ y: [0, 10, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-12 right-10 text-[#0284c7] opacity-80 pointer-events-none hidden sm:block"
      >
        <GraduationCap className="w-14 h-14" />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg flex flex-col items-center space-y-6 text-center z-10"
      >
        {/* Celebration Header */}
        <div className="space-y-3 flex flex-col items-center">
          <div className="flex items-center justify-center py-1 sm:py-2">
            <Image
              src="/yenepoya-university-logo.svg"
              alt="Yenepoya University Logo"
              width={340}
              height={110}
              priority
              className="h-14 sm:h-20 max-w-[85vw] w-auto object-contain drop-shadow-sm"
            />
          </div>
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#6bc4e8] text-[#231f20] font-black text-xs uppercase tracking-wider -rotate-1 border-2 border-ink shadow-[2px_2px_0px_#231f20]">
            <PaperClip className="w-4 h-4 text-[#231f20]" />
            <Trophy className="w-4 h-4 text-[#231f20]" />
            <span>All Questions Completed!</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-ink">
            Great Job, {session.name}!
          </h1>
          <p className="text-xs sm:text-sm font-extrabold text-ink-soft">
            All quiz questions are done! Here are your final event results.
          </p>
        </div>

        {/* Anti-Cheat Tab Switch Warning Banner */}
        {wasTabSwitched && (
          <div className="w-full sticky-note-rose p-4 rounded-2xl border-2 border-ink shadow-[3px_3px_0px_#231f20] text-center space-y-1.5">
            <span className="font-black text-sm sm:text-base text-[#b71c1c] block uppercase tracking-wider">
              ⚠️ Anti-Cheat Triggered: Quiz Auto-Submitted
            </span>
            <p className="text-xs font-bold text-ink-soft">
              Your quiz session was automatically submitted because you left the quiz tab or switched browser windows during the test.
            </p>
          </div>
        )}

        {/* Profile & Main Stats Card */}
        <div className="w-full notebook-card p-6 sm:p-8 space-y-6">
          <div className="flex flex-col items-center">
            <ParticipantAvatar seed={session.avatarSeed} size="xl" className="border-2 border-ink shadow-[4px_4px_0px_#231f20]" />
            <h2 className="text-xl font-black text-ink mt-3">{session.name}</h2>
          </div>

          <div className="w-full border-t-2 border-ink" />

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {/* Rank */}
            <div className="p-4 rounded-2xl sticky-note-lavender border-2 border-ink flex flex-col items-center justify-center shadow-[3px_3px_0px_#231f20]">
              <span className="text-xs uppercase font-black text-[#231f20]">Rank</span>
              <span className="tnum font-black text-3xl text-[#231f20] mt-1">
                #{results?.rank ?? '-'}
              </span>
            </div>

            {/* Score */}
            <div className="p-4 rounded-2xl sticky-note-yellow border-2 border-ink flex flex-col items-center justify-center shadow-[3px_3px_0px_#231f20]">
              <span className="text-xs uppercase font-black text-[#231f20]">Score</span>
              <span className="tnum font-black text-3xl text-[#231f20] mt-1">
                {results?.score.toLocaleString() ?? 0}
              </span>
            </div>

            {/* Correct */}
            <div className="p-4 rounded-2xl sticky-note-mint border-2 border-ink flex flex-col items-center justify-center shadow-[3px_3px_0px_#231f20]">
              <div className="flex items-center gap-1 text-xs uppercase font-black text-[#231f20]">
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                <span>Correct</span>
              </div>
              <span className="tnum font-black text-2xl text-[#231f20] mt-1">
                {results?.correct ?? 0} / {results?.totalQuestions ?? 0}
              </span>
            </div>

            {/* Accuracy */}
            <div className="p-4 rounded-2xl sticky-note-peach border-2 border-ink flex flex-col items-center justify-center shadow-[3px_3px_0px_#231f20]">
              <div className="flex items-center gap-1 text-xs uppercase font-black text-[#231f20]">
                <Target className="w-3.5 h-3.5 text-[#231f20]" />
                <span>Accuracy</span>
              </div>
              <span className="tnum font-black text-2xl text-[#231f20] mt-1">
                {results?.accuracy ?? 0}%
              </span>
            </div>
          </div>

          {/* Response Speed */}
          {results && (
            <div className="p-3.5 rounded-xl bg-paper-cream border-2 border-ink flex items-center justify-between text-xs font-extrabold text-ink shadow-[2px_2px_0px_#231f20]">
              <div className="flex items-center gap-2">
                <Bolt className="w-4 h-4 text-[#93d500]" />
                <span>Avg. Response Speed</span>
              </div>
              <span className="tnum font-black text-[#0284c7] text-sm">
                {results.averageResponseSeconds.toFixed(1)}s
              </span>
            </div>
          )}

          {/* Teachers' Day Message */}
          <div className="pt-2 text-center space-y-1">
            <p className="font-black text-[#0284c7] text-base sm:text-lg">
              Happy Teachers' Day!
            </p>
            <p className="text-xs text-ink-soft font-extrabold">
              Thank you for participating in honoring our incredible teachers.
            </p>
          </div>

          <button
            type="button"
            onClick={handlePlayAgain}
            className="w-full py-3.5 px-6 rounded-2xl bg-[#6bc4e8] hover:bg-[#38bdf8] text-[#231f20] font-black text-sm border-2 border-ink hover:-translate-y-0.5 transition-all cursor-pointer shadow-[3px_3px_0px_#231f20] flex items-center justify-center gap-2"
          >
            <ArrowUp className="w-4 h-4 rotate-180 text-ink" />
            <span>Join Another Session</span>
          </button>
        </div>

        {/* Consistent YENTECH & YSET Branding Footer */}
        <YentechFooterCredit />
      </motion.div>
    </main>
  )
}
