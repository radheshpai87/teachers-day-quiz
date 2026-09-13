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
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Play,
  Pause,
  RotateCcw,
  Crown,
  Medal,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  Edit3,
  X,
  Volume2,
  Timer as TimerIcon,
  Zap,
} from 'lucide-react'

export function StageControlClient({ stageData }: { stageData: StageData | null }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [rapidSeconds, setRapidSeconds] = useState(40)
  const [timerRunning, setTimerRunning] = useState(false)
  const [isEditingNames, setIsEditingNames] = useState(false)

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
          setIsRevealed(false)
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

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'ingenium_stage_finalists_v2' && e.newValue) {
        try {
          setFinalists(JSON.parse(e.newValue))
        } catch {}
      }
    }
    window.addEventListener('storage', handleStorage)

    return () => {
      if (channel) channel.close()
      window.removeEventListener('storage', handleStorage)
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

  // Slide list definition matching projector 100%
  const slides = useMemo(() => {
    if (!stageData) return []

    const list: Array<{
      index: number
      title: string
      round?: string
      type: string
      data?: any
      qIndex?: number
      totalInRound?: number
    }> = []

    let idx = 0
    // 0: Title
    list.push({ index: idx++, title: stageData.title, type: 'title', data: stageData })
    // 1: Rules
    list.push({ index: idx++, title: 'Official Stage Rules', type: 'rules', data: stageData.rules })
    // 2: Finalists Intro
    list.push({ index: idx++, title: 'Meet Top 6 Finalists', type: 'finalists' })

    // Round 1
    list.push({ index: idx++, title: 'Round 1: MCQ Intro', round: 'R1', type: 'round_intro', data: stageData.round1 })
    stageData.round1.questions.forEach((q, qIdx) => {
      list.push({
        index: idx++,
        title: `R1 Q${qIdx + 1}: ${q.question.slice(0, 35)}...`,
        round: 'R1',
        type: 'r1_mcq',
        data: q,
        qIndex: qIdx,
        totalInRound: stageData.round1.questions.length,
      })
    })
    list.push({ index: idx++, title: '🏆 Round 1 Standings & Leaderboard', round: 'R1', type: 'round_leaderboard', data: { roundName: 'Round 1 (MCQ)' } })

    // Round 2
    list.push({ index: idx++, title: 'Round 2: Audio & Image Intro', round: 'R2', type: 'round_intro', data: stageData.round2 })
    stageData.round2.images.forEach((img, iIdx) => {
      list.push({
        index: idx++,
        title: `R2 Image ${iIdx + 1}: ${img.answer}`,
        round: 'R2',
        type: 'r2_image',
        data: img,
        qIndex: iIdx,
        totalInRound: stageData.round2.images.length,
      })
    })
    stageData.round2.audios.forEach((aud, aIdx) => {
      list.push({
        index: idx++,
        title: `R2 Audio ${aIdx + 1}: ${aud.answer}`,
        round: 'R2',
        type: 'r2_audio',
        data: aud,
        qIndex: aIdx,
        totalInRound: stageData.round2.audios.length,
      })
    })
    list.push({ index: idx++, title: '🏆 Round 2 Standings & Leaderboard', round: 'R2', type: 'round_leaderboard', data: { roundName: 'Round 2 (Audio & Image)' } })

    // Round 3
    list.push({ index: idx++, title: 'Round 3: Rapid Fire Intro', round: 'R3', type: 'round_intro', data: stageData.round3 })
    stageData.round3.sets.forEach((set, sIdx) => {
      list.push({
        index: idx++,
        title: `R3 Set ${sIdx + 1}: ${set.participantLabel}`,
        round: 'R3',
        type: 'r3_rapid',
        data: set,
        qIndex: sIdx,
        totalInRound: stageData.round3.sets.length,
      })
    })
    list.push({ index: idx++, title: '🏆 Round 3 Standings & Leaderboard', round: 'R3', type: 'round_leaderboard', data: { roundName: 'Round 3 (Rapid Fire)' } })

    // Round 4
    list.push({ index: idx++, title: 'Round 4: Fastest Fingers Intro', round: 'R4', type: 'r4_intro', data: stageData.round4 })
    list.push({ index: idx++, title: 'Round 4: Live Buzzer Arena', round: 'R4', type: 'r4_buzzer', data: stageData.round4 })

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

  // Timer controls for Rapid Fire
  const toggleTimer = useCallback(() => {
    setTimerRunning((prev) => {
      const next = !prev
      broadcast({ type: 'TIMER_ACTION', payload: { running: next, seconds: rapidSeconds } })
      return next
    })
  }, [broadcast, rapidSeconds])

  const resetTimer = useCallback(() => {
    setRapidSeconds(40)
    setTimerRunning(false)
    broadcast({ type: 'TIMER_ACTION', payload: { running: false, seconds: 40 } })
  }, [broadcast])

  // Score adjustment helper
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
    if (confirm('Reset all 6 stage scores to 0?')) {
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
          <p className="text-xs text-slate-300 mb-4">Please make sure QUIZ_SEED_KEY is configured.</p>
          <Link href="/" className="px-4 py-2 rounded-full bg-[#00d2ff] text-[#081a2e] font-black text-xs">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  const currentSlideObj = slides[currentSlide] || slides[0]
  const isRapidFire = currentSlideObj?.type === 'r3_rapid'

  return (
    <div className="notebook-paper min-h-screen max-h-screen text-slate-100 flex flex-col font-sans select-none overflow-hidden">
      {/* 1. TOP HEADER & QUICK SLIDE NAVIGATOR */}
      <header className="shrink-0 z-20 flex items-center justify-between px-3 py-2 border-b-2 border-[#00d2ff]/40 bg-[#081a2e]/95 backdrop-blur-md shadow-[0_2px_0px_#04101d]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider sticky-note-yellow text-[#081a2e] shrink-0">
            Host
          </span>

          {/* Compact Slide Selector Dropdown */}
          <select
            value={currentSlide}
            onChange={(e) => setSlide(Number(e.target.value))}
            className="bg-[#0e2e4e] border border-[#00d2ff]/50 text-white font-bold rounded-lg px-2 py-1 text-xs outline-none truncate max-w-[170px] sm:max-w-xs focus:border-[#00d2ff]"
          >
            {slides.map((s) => (
              <option key={s.index} value={s.index}>
                {s.index + 1}/{slides.length}: {s.title}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setIsEditingNames(true)}
            className="p-1.5 rounded-lg bg-[#0e2e4e] text-[#00d2ff] border border-[#00d2ff]/40 hover:bg-[#00d2ff] hover:text-[#081a2e] transition"
            title="Edit Finalist Names & Standings"
          >
            <Edit3 className="w-4 h-4" />
          </button>

          <Link
            href="/stage"
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-[#00d2ff] text-[#081a2e] font-black text-xs border border-[#081a2e] hover:bg-[#38bdf8] transition flex items-center gap-1"
            title="Open Projector View"
          >
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* 2. PRIMARY MOBILE DASHBOARD (Fits phone viewport with zero scrolling) */}
      <main className="flex-1 flex flex-col justify-between p-2.5 sm:p-4 max-w-2xl mx-auto w-full overflow-y-auto">
        {/* TOP SECTION: QUESTION & ANSWER PREVIEW */}
        <div className="space-y-2 shrink-0">
          {/* Action Row: Prev / Reveal / Next / Timer */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setSlide(currentSlide - 1)}
              disabled={currentSlide === 0}
              className="px-3 py-2 rounded-xl bg-[#0e2e4e] border border-[#00d2ff]/40 font-black text-xs text-[#00d2ff] active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-1 shadow-[2px_2px_0px_#04101d]"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>

            {/* Large Reveal Toggle Button */}
            <button
              onClick={toggleReveal}
              className={`flex-1 py-2 px-3 rounded-xl font-black text-xs uppercase tracking-wider border-2 border-[#081a2e] shadow-[2px_2px_0px_#04101d] transition flex items-center justify-center gap-1.5 active:scale-95 ${
                isRevealed
                  ? 'bg-[#0e2e4e] text-slate-200 border-[#00d2ff]/50'
                  : 'bg-[#fbbf24] text-[#081a2e] hover:bg-[#f59e0b]'
              }`}
            >
              {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {isRevealed ? 'Hide (R)' : 'Reveal Answer (R)'}
            </button>

            {/* Rapid Fire Timer controls if on Set */}
            {isRapidFire && (
              <div className="flex items-center gap-1">
                <button
                  onClick={toggleTimer}
                  className={`p-2 rounded-xl border border-[#081a2e] font-black text-xs shadow-[2px_2px_0px_#04101d] ${
                    timerRunning ? 'bg-[#f43f5e] text-white' : 'bg-[#10b981] text-[#081a2e]'
                  }`}
                  title={timerRunning ? 'Pause Timer' : 'Start 40s Timer'}
                >
                  {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={resetTimer}
                  className="p-2 rounded-xl bg-[#0e2e4e] text-slate-300 border border-[#00d2ff]/40"
                  title="Reset Timer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={() => setSlide(currentSlide + 1)}
              disabled={currentSlide === slides.length - 1}
              className="px-3.5 py-2 rounded-xl bg-[#00d2ff] text-[#081a2e] font-black text-xs border border-[#081a2e] active:scale-95 disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-1 shadow-[2px_2px_0px_#04101d]"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Live Slide Question & Verified Answer Card */}
          <div className="p-3 rounded-2xl bg-[#081a2e] border-2 border-[#00d2ff]/40 shadow-[2px_2px_0px_#04101d]">
            {/* MCQ Preview */}
            {currentSlideObj?.type === 'r1_mcq' && currentSlideObj.data && (
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#7dd3fc]">
                  <span>Round 1 MCQ • Q{currentSlideObj.qIndex! + 1} of 12</span>
                  <span className="text-[#fbbf24] font-bold">+5 Correct</span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white leading-snug">
                  {currentSlideObj.data.question}
                </h4>
                <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-start gap-1.5 text-xs text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider block text-emerald-400">
                      Correct Answer ({['A', 'B', 'C', 'D'][currentSlideObj.data.correctIndex]}):
                    </span>
                    <span className="text-white font-black">{currentSlideObj.data.options[currentSlideObj.data.correctIndex]}</span>
                    {currentSlideObj.data.explanation && (
                      <p className="text-[10px] text-emerald-200/90 font-normal mt-0.5">{currentSlideObj.data.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Image Question Preview */}
            {currentSlideObj?.type === 'r2_image' && currentSlideObj.data && (
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#7dd3fc]">
                  <span>Round 2 Image • #{currentSlideObj.qIndex! + 1}</span>
                  <span className="text-[#fbbf24] font-bold">Dir +10 | −5 | Pass +5</span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white leading-snug">
                  {currentSlideObj.data.question}
                </h4>
                <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-start gap-1.5 text-xs text-emerald-300 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider block text-emerald-400">Verified Answer:</span>
                    <span className="text-white font-black">{currentSlideObj.data.answer}</span>
                    {currentSlideObj.data.explanation && (
                      <p className="text-[10px] text-emerald-200/90 font-normal mt-0.5">{currentSlideObj.data.explanation}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Audio Question Preview */}
            {currentSlideObj?.type === 'r2_audio' && currentSlideObj.data && (
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#7dd3fc]">
                  <span>Round 2 Audio • #{currentSlideObj.qIndex! + 1}</span>
                  <span className="text-[#fbbf24] font-bold">Dir +10 | −5 | Pass +5</span>
                </div>
                <h4 className="text-xs sm:text-sm font-black text-white leading-snug">
                  {currentSlideObj.data.question}
                </h4>
                <div className="p-2 rounded-xl bg-emerald-950/70 border border-emerald-500/50 flex items-start gap-1.5 text-xs text-emerald-300 font-bold">
                  <Volume2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider block text-emerald-400">Speaker / Answer:</span>
                    <span className="text-white font-black">{currentSlideObj.data.answer}</span>
                    {currentSlideObj.data.quote && (
                      <p className="text-[10px] text-emerald-200 italic mt-0.5">"{currentSlideObj.data.quote}"</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Rapid Fire Preview (5 Questions & Answers) */}
            {currentSlideObj?.type === 'r3_rapid' && currentSlideObj.data && (
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#7dd3fc]">
                  <span>Rapid Fire: {currentSlideObj.data.participantLabel} (Set {currentSlideObj.data.setNumber})</span>
                  <span className="text-[#fbbf24] font-bold">+10 each (40s)</span>
                </div>
                <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                  {currentSlideObj.data.questions.map((q: any, i: number) => (
                    <div key={i} className="p-1.5 rounded-lg bg-[#0e2e4e] border border-[#00d2ff]/30 text-[11px]">
                      <div className="text-slate-200 font-bold">
                        <span className="text-[#00d2ff] font-mono mr-1">#{i + 1} [{q.category}]</span>
                        {q.prompt}
                      </div>
                      <div className="text-emerald-300 font-black mt-0.5">
                        ✓ {q.answer}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Round 4 Buzzer Preview */}
            {currentSlideObj?.type === 'r4_buzzer' && (
              <div className="text-left space-y-1">
                <div className="text-[11px] font-mono text-[#fbbf24] font-black uppercase">
                  ⚡ Round 4 — Fastest Fingers First Arena
                </div>
                <p className="text-xs text-slate-200 font-bold">
                  Award points immediately after buzzer: <strong className="text-emerald-400">+15 Correct</strong> or <strong className="text-rose-400">−5 Wrong</strong>.
                </p>
              </div>
            )}

            {/* Default Slides (Title, Intro, Standings) */}
            {['title', 'rules', 'finalists', 'round_intro', 'round_leaderboard', 'r4_intro', 'tie_breaker', 'podium'].includes(currentSlideObj?.type) && (
              <div className="text-center py-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#7dd3fc]">
                  {currentSlideObj?.round ? `${currentSlideObj.round} Screen` : 'Presentation Screen'}
                </span>
                <h4 className="text-sm font-black text-white">{currentSlideObj?.title}</h4>
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM SECTION: 6 FINALISTS QUICK SCORING MATRIX (ZERO-SCROLL COMPACT) */}
        <div className="mt-2 space-y-1.5 shrink-0">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-[#7dd3fc] flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-[#fbbf24]" /> 1-Tap Scoring Matrix
            </span>
            <span className="text-[10px] font-bold text-slate-300">
              Top 2: 🥇 #{rankedFinalists[0]?.name?.split(' ')[0]} ({rankedFinalists[0]?.score}) • 🥈 #{rankedFinalists[1]?.name?.split(' ')[0]} ({rankedFinalists[1]?.score})
            </span>
          </div>

          <div className="space-y-1.5">
            {finalists.map((f, i) => (
              <div
                key={f.id}
                className="px-2.5 py-1.5 rounded-xl bg-[#081a2e] border border-[#00d2ff]/40 flex items-center justify-between gap-2 shadow-[2px_2px_0px_#04101d]"
              >
                {/* Finalist Info */}
                <div className="flex items-center gap-2 min-w-0 max-w-[125px] sm:max-w-[180px]">
                  <span className="w-4 h-4 rounded bg-[#00d2ff]/20 text-[#00d2ff] font-mono font-black text-[10px] flex items-center justify-center shrink-0 border border-[#00d2ff]/40">
                    {i + 1}
                  </span>
                  <ParticipantAvatar seed={f.avatarSeed} size="sm" className="shrink-0" />
                  <span className="font-black text-xs text-white truncate">{f.name}</span>
                </div>

                {/* Points Display */}
                <div className="font-mono font-black text-xs text-[#00d2ff] shrink-0 text-center min-w-[40px]">
                  {f.score} <span className="text-[9px] font-normal text-slate-400">pts</span>
                </div>

                {/* Cohesive, Ergonomic Point Awarding Buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {/* +10 Direct (Solid Emerald) */}
                  <button
                    onClick={() => adjustScore(f.id, 10, 'r2')}
                    className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs border border-emerald-700 shadow-sm active:scale-95 transition"
                    title="Direct Correct / Rapid Fire (+10)"
                  >
                    +10
                  </button>

                  {/* +5 Pass / MCQ (Solid Sky Blue) */}
                  <button
                    onClick={() => adjustScore(f.id, 5, 'r1')}
                    className="px-2 py-1 rounded-lg bg-[#0284c7] hover:bg-[#0369a1] active:bg-[#075985] text-white font-black text-xs border border-[#0369a1] shadow-sm active:scale-95 transition"
                    title="MCQ / Passed (+5)"
                  >
                    +5
                  </button>

                  {/* -5 Penalty (Solid Crimson Rose) */}
                  <button
                    onClick={() => adjustScore(f.id, -5, 'r2')}
                    className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-black text-xs border border-rose-700 shadow-sm active:scale-95 transition"
                    title="Wrong Penalty (-5)"
                  >
                    −5
                  </button>

                  {/* +15 FFF Bonus (Solid Amber Gold) */}
                  <button
                    onClick={() => adjustScore(f.id, 15, 'r4')}
                    className="px-1.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 active:bg-amber-500 text-[#081a2e] font-black text-xs border border-amber-500 shadow-sm active:scale-95 transition"
                    title="Fastest Fingers First (+15)"
                  >
                    +15
                  </button>

                  {/* Fine Adjustment (+1 / -1) */}
                  <button
                    onClick={() => adjustScore(f.id, 1)}
                    className="px-1.5 py-1 rounded-lg bg-[#0e2e4e] text-[#7dd3fc] font-bold text-[11px] border border-[#00d2ff]/30 active:scale-95 transition"
                    title="+1 Fine tune"
                  >
                    +1
                  </button>
                  <button
                    onClick={() => adjustScore(f.id, -1)}
                    className="px-1.5 py-1 rounded-lg bg-[#0e2e4e] text-rose-300 font-bold text-[11px] border border-rose-500/30 active:scale-95 transition"
                    title="-1 Fine tune"
                  >
                    −1
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 3. MANAGE FINALISTS & RESET MODAL */}
      {isEditingNames && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="notebook-card p-5 rounded-3xl max-w-md w-full space-y-4 border-2 border-[#00d2ff]">
            <div className="flex items-center justify-between border-b border-[#00d2ff]/30 pb-2.5">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#00d2ff]" />
                <h3 className="font-black text-white text-base">Edit Finalist Names</h3>
              </div>
              <button
                onClick={() => setIsEditingNames(false)}
                className="p-1 rounded-lg bg-[#0e2e4e] text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {finalists.map((f, i) => (
                <div key={f.id} className="flex items-center gap-2 p-2 rounded-xl bg-[#081a2e] border border-[#00d2ff]/30">
                  <span className="w-6 h-6 rounded-full bg-[#00d2ff] text-[#081a2e] font-mono font-black text-xs flex items-center justify-center shrink-0">
                    #{i + 1}
                  </span>
                  <input
                    type="text"
                    defaultValue={f.name}
                    onBlur={(e) => handleRename(f.id, e.target.value)}
                    className="flex-1 bg-[#0e2e4e] text-white font-bold text-xs rounded-lg px-2.5 py-1.5 border border-[#00d2ff]/40 outline-none focus:border-[#00d2ff]"
                    placeholder={`Finalist ${i + 1} Name`}
                  />
                  <span className="font-mono text-xs font-black text-[#00d2ff] shrink-0">{f.score} pts</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[#00d2ff]/30 flex items-center justify-between">
              <button
                onClick={handleResetScores}
                className="text-xs font-black text-[#f43f5e] hover:text-[#fb7185] flex items-center gap-1 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset All Scores
              </button>

              <button
                onClick={() => setIsEditingNames(false)}
                className="px-5 py-2 rounded-full bg-[#00d2ff] hover:bg-[#38bdf8] text-[#081a2e] font-black text-xs border border-[#081a2e] shadow-[2px_2px_0px_#04101d]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
