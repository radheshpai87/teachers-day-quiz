'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import type { StageData } from '@/data/stage-rounds-data'
import {
  type StageFinalist,
  DEFAULT_STAGE_FINALISTS,
  getStageBroadcastChannel,
  type StageSyncMessage,
} from '@/lib/stage-sync'
import { sound } from '@/lib/client/sound'
import { ParticipantAvatar } from '@/components/participant-avatar'
import {
  Trophy,
  Users,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Minus,
  Crown,
  Medal,
  Award,
  Zap,
  HelpCircle,
  Radio,
  Flame,
  X,
  Check,
  Edit3,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
} from 'lucide-react'

export function StageControlClient({ stageData }: { stageData: StageData | null }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [rapidSeconds, setRapidSeconds] = useState(40)
  const [timerRunning, setTimerRunning] = useState(false)

  // Stage Scoreboard State (Persisted in localStorage & BroadcastChannel)
  const [finalists, setFinalists] = useState<StageFinalist[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ingenium_stage_finalists_v2')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return DEFAULT_STAGE_FINALISTS
  })

  // Broadcast channel instance
  const channelRef = useRef<BroadcastChannel | null>(null)

  useEffect(() => {
    const channel = getStageBroadcastChannel()
    channelRef.current = channel

    if (channel) {
      channel.onmessage = (event: MessageEvent<StageSyncMessage>) => {
        const { type, payload } = event.data
        if (type === 'CHANGE_SLIDE') {
          setCurrentSlide(payload.slideIndex)
        } else if (type === 'UPDATE_FINALISTS') {
          setFinalists(payload.finalists)
        } else if (type === 'TOGGLE_REVEAL') {
          setIsRevealed(payload.isRevealed)
        } else if (type === 'TIMER_ACTION') {
          setTimerRunning(payload.running)
          if (payload.seconds !== undefined) setRapidSeconds(payload.seconds)
        }
      }
    }

    return () => {
      if (channel) channel.close()
    }
  }, [])

  // Broadcast helper
  const broadcast = useCallback((msg: StageSyncMessage) => {
    if (channelRef.current) {
      channelRef.current.postMessage(msg)
    }
  }, [])

  // Save finalists to localStorage & broadcast
  const updateFinalists = useCallback(
    (newFinalists: StageFinalist[]) => {
      setFinalists(newFinalists)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('ingenium_stage_finalists_v2', JSON.stringify(newFinalists))
        } catch {}
      }
      broadcast({ type: 'UPDATE_FINALISTS', payload: { finalists: newFinalists } })
    },
    [broadcast],
  )

  // Slide list definition matching projector
  const slides = useMemo(() => {
    if (!stageData) return []

    const list: Array<{
      index: number
      title: string
      round?: string
      type: string
    }> = []

    let idx = 0
    list.push({ index: idx++, title: 'Title: INGENIUM 2026', type: 'title' })
    list.push({ index: idx++, title: 'Official Stage Rules', type: 'rules' })
    list.push({ index: idx++, title: 'Meet Top 6 Finalists', type: 'finalists' })

    // Round 1
    list.push({ index: idx++, title: 'Round 1: MCQ Intro', round: 'R1', type: 'intro' })
    stageData.round1.questions.forEach((q, qIdx) => {
      list.push({ index: idx++, title: `R1 Q${qIdx + 1}: ${q.question.slice(0, 40)}...`, round: 'R1', type: 'question' })
    })
    list.push({ index: idx++, title: '🏆 Round 1 Standings & Leaderboard', round: 'R1', type: 'leaderboard' })

    // Round 2
    list.push({ index: idx++, title: 'Round 2: Audio & Image Intro', round: 'R2', type: 'intro' })
    stageData.round2.images.forEach((img, iIdx) => {
      list.push({ index: idx++, title: `R2 Image ${iIdx + 1}: ${img.answer}`, round: 'R2', type: 'image' })
    })
    stageData.round2.audios.forEach((aud, aIdx) => {
      list.push({ index: idx++, title: `R2 Audio ${aIdx + 1}: ${aud.answer}`, round: 'R2', type: 'audio' })
    })
    list.push({ index: idx++, title: '🏆 Round 2 Standings & Leaderboard', round: 'R2', type: 'leaderboard' })

    // Round 3
    list.push({ index: idx++, title: 'Round 3: Rapid Fire Intro', round: 'R3', type: 'intro' })
    stageData.round3.sets.forEach((set, sIdx) => {
      list.push({ index: idx++, title: `R3 Set ${sIdx + 1}: ${set.participantLabel}`, round: 'R3', type: 'rapid' })
    })
    list.push({ index: idx++, title: '🏆 Round 3 Standings & Leaderboard', round: 'R3', type: 'leaderboard' })

    // Round 4
    list.push({ index: idx++, title: 'Round 4: Fastest Fingers Intro', round: 'R4', type: 'intro' })
    list.push({ index: idx++, title: 'Round 4: Live Buzzer Arena', round: 'R4', type: 'buzzer' })

    // Tie breaker & Podium
    list.push({ index: idx++, title: 'Tie-Breaker Arena', type: 'tie_breaker' })
    list.push({ index: idx++, title: '🎉 Grand Victory Podium (Top 2 Prizes)', type: 'podium' })

    return list
  }, [stageData])

  // Slide navigation
  const setSlide = useCallback(
    (slideIdx: number) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, slideIdx))
      setCurrentSlide(clamped)
      setIsRevealed(false)
      broadcast({ type: 'CHANGE_SLIDE', payload: { slideIndex: clamped } })
      sound.tap()
    },
    [broadcast, slides.length],
  )

  // Toggle reveal
  const toggleReveal = useCallback(() => {
    setIsRevealed((prev) => {
      const next = !prev
      broadcast({ type: 'TOGGLE_REVEAL', payload: { isRevealed: next } })
      if (next) sound.correct()
      return next
    })
  }, [broadcast])

  // Adjust score
  const adjustScore = (finalistId: string, delta: number, roundKey?: 'r1' | 'r2' | 'r3' | 'r4') => {
    const updated = finalists.map((f) => {
      if (f.id !== finalistId) return f
      const newScore = Math.max(0, f.score + delta)
      const roundScores = { ...f.roundScores }
      if (roundKey) {
        roundScores[roundKey] = Math.max(0, roundScores[roundKey] + delta)
      }
      return { ...f, score: newScore, roundScores }
    })
    updateFinalists(updated)
    if (delta > 0) sound.ting()
    else sound.wrong()
  }

  // Rename finalist
  const handleRename = (id: string, name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    const updated = finalists.map((f) => (f.id === id ? { ...f, name: trimmed } : f))
    updateFinalists(updated)
  }

  // Reset scores
  const handleResetScores = () => {
    if (confirm('Are you sure you want to reset all stage scores to 0?')) {
      updateFinalists(DEFAULT_STAGE_FINALISTS)
      sound.tap()
    }
  }

  // Ranked finalists
  const rankedFinalists = useMemo(() => {
    return [...finalists].sort((a, b) => b.score - a.score)
  }, [finalists])

  if (!stageData) {
    return (
      <div className="notebook-paper min-h-screen text-white flex items-center justify-center p-6 text-center">
        <div className="notebook-card p-6 max-w-md">
          <AlertTriangle className="w-12 h-12 text-[#fbbf24] mx-auto mb-3 animate-bounce" />
          <h2 className="text-xl font-black mb-2">Stage Data Encrypted</h2>
          <p className="text-xs text-slate-300 mb-4">Please make sure QUIZ_SEED_KEY is configured in your environment.</p>
          <Link href="/" className="px-4 py-2 rounded-full bg-[#00d2ff] text-[#081a2e] font-black text-xs">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  const currentSlideObj = slides[currentSlide] || slides[0]

  return (
    <div className="notebook-paper min-h-screen text-slate-100 flex flex-col font-sans select-none pb-12">
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-4 sm:px-6 py-3 border-b-2 border-[#00d2ff]/40 bg-[#081a2e]/95 backdrop-blur-md shadow-[0_4px_0px_#04101d]">
        <div className="flex items-center gap-3">
          <Image
            src="/yenepoya-school-engineering-and-technology.svg"
            alt="YSET"
            width={120}
            height={30}
            className="h-7 w-auto object-contain brightness-110"
            priority
          />
          <div className="h-5 w-px bg-[#00d2ff]/40" />
          <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider sticky-note-yellow text-[#081a2e] shadow-[2px_2px_0px_#04101d]">
            🎮 Quizmaster Control Deck
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/stage"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00d2ff] hover:bg-[#38bdf8] text-[#081a2e] font-black text-xs border-2 border-[#081a2e] shadow-[2px_2px_0px_#04101d] transition hover:scale-105"
          >
            <span>Open Projector View</span> <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* Main Grid: Left Controls & Right Scoreboard */}
      <main className="max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT 2 COLUMNS: Slide Controller & Actions */}
        <div className="lg:col-span-2 space-y-6">
          {/* Live Slide Navigation Bar */}
          <div className="notebook-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#7dd3fc]">
                Active Projector Slide ({currentSlide + 1} / {slides.length})
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#00d2ff]/20 text-[#00d2ff] text-xs font-black border border-[#00d2ff]/40">
                {currentSlideObj?.round || 'Intro/Outro'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-[#081a2e] border-2 border-[#00d2ff]/50 flex items-center justify-between gap-4">
              <div>
                <span className="text-xs text-[#7dd3fc] font-bold block mb-0.5">Current Title</span>
                <h3 className="text-lg sm:text-xl font-black text-white">{currentSlideObj?.title}</h3>
              </div>

              <button
                onClick={toggleReveal}
                className={`px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] transition shrink-0 ${
                  isRevealed
                    ? 'bg-[#0e2e4e] text-white'
                    : 'bg-[#fbbf24] hover:bg-[#f59e0b] text-[#081a2e]'
                }`}
              >
                {isRevealed ? <EyeOff className="w-4 h-4 inline mr-1" /> : <Eye className="w-4 h-4 inline mr-1" />}
                {isRevealed ? 'Hide Answer' : 'Reveal Answer'}
              </button>
            </div>

            {/* Slide Navigation Buttons */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setSlide(currentSlide - 1)}
                disabled={currentSlide === 0}
                className="flex-1 py-3 rounded-2xl bg-[#0e2e4e] border-2 border-[#00d2ff]/50 font-black text-sm text-[#00d2ff] hover:bg-[#00d2ff] hover:text-[#081a2e] disabled:opacity-30 disabled:pointer-events-none transition flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#04101d]"
              >
                <ChevronLeft className="w-5 h-5" /> Previous Slide
              </button>

              <button
                onClick={() => setSlide(currentSlide + 1)}
                disabled={currentSlide === slides.length - 1}
                className="flex-1 py-3 rounded-2xl bg-[#00d2ff] hover:bg-[#38bdf8] text-[#081a2e] font-black text-sm border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] disabled:opacity-30 disabled:pointer-events-none transition flex items-center justify-center gap-1.5 hover:scale-[1.02]"
              >
                Next Slide <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Slide Jump Dropdown / List */}
            <div className="pt-2">
              <label className="text-xs font-black uppercase text-[#7dd3fc] block mb-1.5">
                Jump Direct to Slide
              </label>
              <select
                value={currentSlide}
                onChange={(e) => setSlide(Number(e.target.value))}
                className="w-full bg-[#081a2e] border-2 border-[#00d2ff]/40 text-white font-bold rounded-xl p-2.5 text-xs outline-none focus:border-[#00d2ff]"
              >
                {slides.map((s) => (
                  <option key={s.index} value={s.index}>
                    Slide {s.index + 1}: {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Score Assigner Matrix */}
          <div className="notebook-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#00d2ff]/30 pb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[#fbbf24]" />
                <h3 className="font-black text-white text-base">Quick Score Assigner (6 Finalists)</h3>
              </div>
              <span className="text-xs text-[#7dd3fc] font-bold">Instant Projector Sync</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {finalists.map((f, i) => (
                <div key={f.id} className="p-3.5 rounded-2xl bg-[#081a2e] border-2 border-[#00d2ff]/40 space-y-2.5 shadow-[2px_2px_0px_#04101d]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-5 h-5 rounded bg-[#00d2ff] text-[#081a2e] font-black text-xs flex items-center justify-center shrink-0">
                        #{i + 1}
                      </span>
                      <input
                        type="text"
                        defaultValue={f.name}
                        onBlur={(e) => handleRename(f.id, e.target.value)}
                        className="bg-transparent font-black text-white text-sm focus:bg-[#0e2e4e] rounded px-1.5 py-0.5 border border-transparent focus:border-[#00d2ff] outline-none truncate max-w-[130px]"
                        title="Click to rename"
                      />
                    </div>
                    <span className="font-mono font-black text-base text-[#00d2ff] shrink-0">{f.score} pts</span>
                  </div>

                  {/* Scoring Actions for Finalist */}
                  <div className="grid grid-cols-4 gap-1.5 text-xs font-black">
                    <button
                      onClick={() => adjustScore(f.id, 5, 'r1')}
                      className="py-1 rounded-lg bg-[#00d2ff] text-[#081a2e] border border-[#081a2e] hover:scale-105 transition shadow-[1px_1px_0px_#04101d]"
                      title="Round 1 MCQ (+5)"
                    >
                      +5 (R1)
                    </button>
                    <button
                      onClick={() => adjustScore(f.id, 10, 'r2')}
                      className="py-1 rounded-lg bg-[#10b981] text-[#081a2e] border border-[#081a2e] hover:scale-105 transition shadow-[1px_1px_0px_#04101d]"
                      title="Round 2 Direct / Rapid Fire (+10)"
                    >
                      +10 (Dir)
                    </button>
                    <button
                      onClick={() => adjustScore(f.id, 5, 'r2')}
                      className="py-1 rounded-lg bg-[#fbbf24] text-[#081a2e] border border-[#081a2e] hover:scale-105 transition shadow-[1px_1px_0px_#04101d]"
                      title="Round 2 Passed (+5)"
                    >
                      +5 (Pass)
                    </button>
                    <button
                      onClick={() => adjustScore(f.id, -5, 'r2')}
                      className="py-1 rounded-lg bg-[#f43f5e] text-white border border-[#081a2e] hover:scale-105 transition shadow-[1px_1px_0px_#04101d]"
                      title="Direct Wrong / Buzz Wrong (-5)"
                    >
                      −5 (Wr)
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-black pt-1">
                    <button
                      onClick={() => adjustScore(f.id, 15, 'r4')}
                      className="flex-1 py-1 rounded-lg bg-[#a855f7] text-white border border-[#081a2e] hover:scale-105 transition shadow-[1px_1px_0px_#04101d]"
                      title="Round 4 Fastest Fingers (+15)"
                    >
                      +15 (FFF)
                    </button>
                    <button
                      onClick={() => adjustScore(f.id, 1)}
                      className="px-2.5 py-1 rounded-lg bg-[#0e2e4e] text-slate-200 border border-[#00d2ff]/40 hover:bg-[#00d2ff] hover:text-[#081a2e] transition"
                      title="+1 custom"
                    >
                      +1
                    </button>
                    <button
                      onClick={() => adjustScore(f.id, -1)}
                      className="px-2.5 py-1 rounded-lg bg-[#0e2e4e] text-slate-200 border border-[#00d2ff]/40 hover:bg-[#f43f5e] hover:text-white transition"
                      title="-1 custom"
                    >
                      −1
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT 1 COLUMN: Live Standings & Quick Actions */}
        <div className="space-y-6">
          {/* Standings Card */}
          <div className="notebook-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#00d2ff]/30 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#fbbf24]" />
                <h3 className="font-black text-white text-base">Live Stage Standings</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider sticky-note-yellow text-[#081a2e] px-2 py-0.5 rounded-full">
                2 Prizes (1st & 2nd)
              </span>
            </div>

            <div className="space-y-2.5">
              {rankedFinalists.map((f, rank) => (
                <div
                  key={f.id}
                  className={`p-3 rounded-2xl flex items-center justify-between border-2 transition ${
                    rank === 0
                      ? 'bg-[#fbbf24]/10 border-[#fbbf24] shadow-[3px_3px_0px_#04101d]'
                      : rank === 1
                      ? 'bg-slate-800/60 border-slate-300 shadow-[2px_2px_0px_#04101d]'
                      : 'bg-[#081a2e] border-[#00d2ff]/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`font-black text-sm w-5 text-center ${
                        rank === 0 ? 'text-[#fbbf24]' : rank === 1 ? 'text-slate-200' : 'text-slate-400'
                      }`}
                    >
                      #{rank + 1}
                    </span>
                    <ParticipantAvatar seed={f.avatarSeed} size="sm" />
                    <div className="min-w-0">
                      <span className="font-black text-white text-sm block truncate">{f.name}</span>
                      <span className="text-[10px] text-[#7dd3fc] font-bold">
                        R1:{f.roundScores.r1} • R2:{f.roundScores.r2} • R3:{f.roundScores.r3} • R4:{f.roundScores.r4}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono font-black text-base text-[#00d2ff] shrink-0">{f.score}</span>
                </div>
              ))}
            </div>

            {/* Reset All Scores */}
            <div className="pt-3 border-t-2 border-[#00d2ff]/30 flex items-center justify-between">
              <button
                onClick={handleResetScores}
                className="text-xs text-[#f43f5e] hover:text-[#fb7185] flex items-center gap-1 font-black transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset All Stage Scores
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
