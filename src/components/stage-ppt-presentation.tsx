'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import {
  STAGE_RULES,
  ROUND_1_MCQ,
  ROUND_2_AUDIO_IMAGE,
  ROUND_3_RAPID_FIRE,
  ROUND_4_FASTEST_FINGERS,
  TIE_BREAKER_QUESTIONS,
  type StageMcqQuestion,
  type StageMediaQuestion,
  type RapidFireQuestion,
  type FastestFingerQuestion,
} from '@/data/stage-rounds-data'
import { sound } from '@/lib/client/sound'
import { ParticipantAvatar } from '@/components/participant-avatar'
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Trophy,
  Users,
  Timer as TimerIcon,
  Play,
  RotateCcw,
  Eye,
  EyeOff,
  Sparkles,
  Volume2,
  VolumeX,
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
  Paperclip,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react'

export interface StageFinalist {
  id: string
  name: string
  avatarSeed: string
  score: number
  roundScores: {
    r1: number
    r2: number
    r3: number
    r4: number
  }
}

const DEFAULT_FINALISTS: StageFinalist[] = [
  { id: 'f1', name: 'Finalist 1', avatarSeed: 'finalist-1', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
  { id: 'f2', name: 'Finalist 2', avatarSeed: 'finalist-2', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
  { id: 'f3', name: 'Finalist 3', avatarSeed: 'finalist-3', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
  { id: 'f4', name: 'Finalist 4', avatarSeed: 'finalist-4', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
  { id: 'f5', name: 'Finalist 5', avatarSeed: 'finalist-5', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
  { id: 'f6', name: 'Finalist 6', avatarSeed: 'finalist-6', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
]

export function StagePptPresentation({ initialFinalists }: { initialFinalists?: StageFinalist[] }) {
  // Slide Management
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showScoreboard, setShowScoreboard] = useState(false)
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({})

  // Rapid Fire Timer (15s)
  const [rapidSeconds, setRapidSeconds] = useState(15)
  const [timerRunning, setTimerRunning] = useState(false)

  // Stage Scoreboard State for 6 Finalists (Persisted in localStorage)
  const [finalists, setFinalists] = useState<StageFinalist[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ingenium_stage_finalists_v1')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return initialFinalists && initialFinalists.length === 6 ? initialFinalists : DEFAULT_FINALISTS
  })

  // Save finalists to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ingenium_stage_finalists_v1', JSON.stringify(finalists))
    } catch {}
  }, [finalists])

  // Rapid Fire Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerRunning && rapidSeconds > 0) {
      interval = setInterval(() => {
        setRapidSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false)
            sound.buzzer()
            return 0
          }
          if (prev <= 4) {
            sound.tick()
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning, rapidSeconds])

  // Build Slides Array
  const slides = useMemo(() => {
    const list: Array<{
      id: string
      type: 'TITLE' | 'RULES' | 'FINALISTS_INTRO' | 'ROUND_INTRO' | 'MCQ' | 'MEDIA' | 'RAPID_SET' | 'FASTEST' | 'TIE' | 'PODIUM'
      title?: string
      roundNumber?: number
      roundName?: string
      data?: any
    }> = []

    // 1. Title Slide
    list.push({ id: 'slide-title', type: 'TITLE' })

    // 2. Official Rules Slide
    list.push({ id: 'slide-rules', type: 'RULES' })

    // 3. Meet Finalists Slide
    list.push({ id: 'slide-finalists', type: 'FINALISTS_INTRO' })

    // 4. Round 1 Intro (MCQ)
    list.push({
      id: 'r1-intro',
      type: 'ROUND_INTRO',
      roundNumber: 1,
      roundName: 'Round 1 — MCQ',
      data: {
        title: 'Multiple Choice Questions (MCQ)',
        rules: [
          'Direct Question to Participant: +5 Points for Correct Answer',
          'No Negative Marking in Round 1',
          '30 Seconds Think Time per Question',
        ],
        icon: HelpCircle,
        color: 'from-blue-600 to-cyan-600',
      },
    })

    // Round 1 Question Slides
    ROUND_1_MCQ.forEach((q) => {
      list.push({ id: `r1-q-${q.number}`, type: 'MCQ', roundNumber: 1, data: q })
    })

    // 5. Round 2 Intro (Audio & Image)
    list.push({
      id: 'r2-intro',
      type: 'ROUND_INTRO',
      roundNumber: 2,
      roundName: 'Round 2 — Audio & Image',
      data: {
        title: 'Audio & Image Clue Round',
        rules: [
          'Direct Correct: +10 Points | Direct Wrong: −5 Points',
          'Passed Correct: +5 Points | Passed Wrong: 0 Points',
          'Visual & Acoustic Clues for Historic Engineering Milestones',
        ],
        icon: Radio,
        color: 'from-amber-500 to-orange-600',
      },
    })

    // Round 2 Question Slides
    ROUND_2_AUDIO_IMAGE.forEach((q) => {
      list.push({ id: `r2-q-${q.number}`, type: 'MEDIA', roundNumber: 2, data: q })
    })

    // 6. Round 3 Intro (Rapid Fire)
    list.push({
      id: 'r3-intro',
      type: 'ROUND_INTRO',
      roundNumber: 3,
      roundName: 'Round 3 — Rapid Fire',
      data: {
        title: 'Rapid Fire Round',
        rules: [
          '5 Questions per Participant',
          '15 Seconds Timer per Question (No Options)',
          'Correct Answer: +10 Points | Pass allowed (0 pts)',
        ],
        icon: Flame,
        color: 'from-rose-600 to-red-600',
      },
    })

    // Round 3 Participant Question Sets
    ROUND_3_RAPID_FIRE.forEach((set) => {
      list.push({ id: `r3-p-${set.participantNumber}`, type: 'RAPID_SET', roundNumber: 3, data: set })
    })

    // 7. Round 4 Intro (Fastest Fingers First)
    list.push({
      id: 'r4-intro',
      type: 'ROUND_INTRO',
      roundNumber: 4,
      roundName: 'Round 4 — Fastest Fingers First',
      data: {
        title: 'Fastest Fingers First (Buzzer Round)',
        rules: [
          'Open to All 6 Finalists — Fastest to Buzz Gets the Floor',
          'Correct Answer: +15 Points',
          'Wrong Answer after Buzzing: −5 Points',
        ],
        icon: Zap,
        color: 'from-purple-600 to-pink-600',
      },
    })

    // Round 4 Question Slides
    ROUND_4_FASTEST_FINGERS.forEach((q) => {
      list.push({ id: `r4-q-${q.number}`, type: 'FASTEST', roundNumber: 4, data: q })
    })

    // 8. Tie Breaker Slide
    list.push({
      id: 'slide-tie-breaker',
      type: 'TIE',
      data: TIE_BREAKER_QUESTIONS,
    })

    // 9. Grand Finale Winner Podium Slide
    list.push({ id: 'slide-podium', type: 'PODIUM' })

    return list
  }, [])

  const totalSlides = slides.length
  const current = slides[currentSlide]

  const nextSlide = useCallback(() => {
    if (currentSlide < totalSlides - 1) {
      sound.tap()
      setCurrentSlide((prev) => prev + 1)
      setTimerRunning(false)
      setRapidSeconds(15)
    }
  }, [currentSlide, totalSlides])

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      sound.tap()
      setCurrentSlide((prev) => prev - 1)
      setTimerRunning(false)
      setRapidSeconds(15)
    }
  }, [currentSlide])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  const toggleAnswer = (id: string) => {
    sound.tap()
    setRevealedAnswers((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return

      if (e.key === 'ArrowRight' || e.key === 'Space' || e.key === 'PageDown') {
        e.preventDefault()
        nextSlide()
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault()
        prevSlide()
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        toggleFullscreen()
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault()
        setShowScoreboard((prev) => !prev)
      } else if (e.key === 't' || e.key === 'T') {
        // Toggle timer in Rapid Fire
        if (current.type === 'RAPID_SET') {
          e.preventDefault()
          setTimerRunning((prev) => !prev)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide, current.type])

  // Fire confetti when reaching the Grand Podium slide
  useEffect(() => {
    if (current?.type === 'PODIUM') {
      sound.celebrate()
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#00d2ff', '#fb8c00', '#43a047', '#e53935', '#fbc02d'],
      })
    }
  }, [current])

  // Score modifier for Stage Scoreboard
  const updateScore = (finalistId: string, delta: number) => {
    sound.ting()
    setFinalists((prev) =>
      prev.map((f) => (f.id === finalistId ? { ...f, score: Math.max(0, f.score + delta) } : f)),
    )
  }

  const updateFinalistName = (finalistId: string, name: string) => {
    setFinalists((prev) => prev.map((f) => (f.id === finalistId ? { ...f, name } : f)))
  }

  const resetAllScores = () => {
    if (confirm('Reset all stage finalists scores to 0?')) {
      setFinalists((prev) =>
        prev.map((f) => ({ ...f, score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } })),
      )
    }
  }

  // Sorted finalists by score for the scoreboard
  const rankedFinalists = useMemo(() => {
    return [...finalists].sort((a, b) => b.score - a.score)
  }, [finalists])

  return (
    <div className="fixed inset-0 bg-[#061424] text-white flex flex-col justify-between select-none overflow-hidden font-sans">
      {/* Background Cyber Grid Aesthetic */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#00d2ff_1px,transparent_1px),linear-gradient(to_bottom,#00d2ff_1px,transparent_1px)] bg-[size:4rem_4rem]" />

      {/* TOP PRESENTATION BAR */}
      <header className="relative z-30 w-full h-16 bg-[#081a2e]/90 backdrop-blur-md border-b-2 border-[#00d2ff]/40 px-4 sm:px-8 flex items-center justify-between">
        {/* Left: Branding & Event Title */}
        <div className="flex items-center gap-4">
          <Image
            src="/yenepoya-school-engineering-and-technology.svg"
            alt="Yenepoya School of Engineering and Technology"
            width={180}
            height={40}
            priority
            className="h-8 sm:h-9 w-auto object-contain"
          />
          <div className="hidden md:flex flex-col border-l-2 border-[#00d2ff]/30 pl-3">
            <span className="font-black text-sm text-[#00d2ff] uppercase tracking-wider">
              INGENIUM 2026 • Live Stage Quiz
            </span>
            <span className="text-[11px] text-white/70 font-semibold">
              Celebrating National Engineers' Day
            </span>
          </div>
        </div>

        {/* Center: Slide Jump Navigator */}
        <div className="hidden lg:flex items-center gap-1.5 bg-[#0e2e4e] px-3 py-1 rounded-xl border border-[#00d2ff]/40 text-xs font-bold">
          <span>Slide {currentSlide + 1} of {totalSlides}</span>
          <span className="text-[#00d2ff] font-black">•</span>
          <span className="text-[#00d2ff] font-black truncate max-w-[200px]">
            {current.roundName || current.type}
          </span>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Toggle Scoreboard Button */}
          <button
            type="button"
            onClick={() => setShowScoreboard((prev) => !prev)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border-2 transition-all font-black text-xs cursor-pointer shadow-[2px_2px_0px_#04101d] ${
              showScoreboard
                ? 'bg-yellow-400 text-[#081a2e] border-[#081a2e]'
                : 'bg-[#0e2e4e] text-yellow-300 border-yellow-400/50 hover:border-yellow-400'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span className="hidden sm:inline">Stage Scoreboard</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-[#0e2e4e] border-2 border-[#00d2ff]/50 hover:border-[#00d2ff] text-[#00d2ff] transition-all cursor-pointer"
            title="Toggle Fullscreen (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* MAIN SLIDE STAGE CONTENT */}
      <main className="relative z-10 flex-1 w-full max-w-7xl mx-auto p-4 sm:p-8 flex flex-col justify-center items-center overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full h-full flex flex-col justify-center items-center"
          >
            {/* 1. TITLE SLIDE */}
            {current.type === 'TITLE' && (
              <div className="text-center space-y-6 max-w-4xl py-6">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#00d2ff]/15 border-2 border-[#00d2ff] text-[#00d2ff] font-black text-sm uppercase tracking-widest animate-pulse">
                  <Sparkles className="w-4 h-4" />
                  <span>Grand Finale • Live Stage Showdown</span>
                </div>

                <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight leading-tight">
                  INGENIUM QUIZ 2026
                </h1>

                <p className="text-lg sm:text-2xl text-cyan-300 font-extrabold max-w-2xl mx-auto leading-relaxed">
                  Honoring Sir M. Visvesvaraya & The Spirit of Engineering Innovation
                </p>

                <div className="pt-4 flex items-center justify-center gap-3 flex-wrap">
                  <span className="px-4 py-2 rounded-xl bg-[#0e2e4e] border-2 border-[#00d2ff]/40 text-sm font-black text-white">
                    🎯 Top 6 Finalists
                  </span>
                  <span className="px-4 py-2 rounded-xl bg-[#0e2e4e] border-2 border-[#00d2ff]/40 text-sm font-black text-white">
                    ⚡ 4 High-Octane Rounds
                  </span>
                  <span className="px-4 py-2 rounded-xl bg-[#0e2e4e] border-2 border-[#00d2ff]/40 text-sm font-black text-white">
                    🏆 1 Champion Trophy
                  </span>
                </div>
              </div>
            )}

            {/* 2. OFFICIAL RULES SLIDE */}
            {current.type === 'RULES' && (
              <div className="w-full max-w-4xl bg-[#0e2e4e]/90 p-6 sm:p-10 rounded-3xl border-3 border-[#00d2ff] shadow-[8px_8px_0px_#04101d] space-y-6">
                <div className="flex items-center justify-between border-b-2 border-[#00d2ff]/40 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-yellow-400 text-[#081a2e]">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-black text-white">
                        Official Stage Competition Rules
                      </h2>
                      <p className="text-xs sm:text-sm text-cyan-300 font-bold">
                        Please read carefully before the round commences
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff] font-black text-xs uppercase">
                    Stage Finals
                  </span>
                </div>

                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm sm:text-base font-semibold text-white/95">
                  {STAGE_RULES.map((rule, idx) => (
                    <li
                      key={idx}
                      className="p-3 sm:p-4 rounded-2xl bg-[#081a2e]/90 border border-[#00d2ff]/30 flex items-start gap-3 shadow-md"
                    >
                      <span className="w-6 h-6 rounded-lg bg-[#00d2ff] text-[#081a2e] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{rule.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 3. MEET THE 6 FINALISTS */}
            {current.type === 'FINALISTS_INTRO' && (
              <div className="w-full max-w-5xl space-y-6 text-center">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-400/20 text-yellow-300 font-black text-xs uppercase tracking-widest border border-yellow-400">
                    <Crown className="w-4 h-4 text-yellow-400" />
                    <span>Round 1 Qualifiers</span>
                  </div>
                  <h2 className="text-3xl sm:text-5xl font-black text-white">
                    Meet the 6 Stage Finalists
                  </h2>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6 pt-2">
                  {finalists.map((f, idx) => (
                    <div
                      key={f.id}
                      className="p-4 sm:p-6 rounded-3xl bg-[#0e2e4e]/90 border-2 border-[#00d2ff] shadow-[4px_4px_0px_#04101d] flex flex-col items-center gap-3 text-center"
                    >
                      <div className="relative">
                        <ParticipantAvatar seed={f.avatarSeed} size="xl" className="border-2 border-yellow-400 shadow-lg" />
                        <span className="absolute -bottom-2 -right-1 px-2.5 py-0.5 rounded-full bg-yellow-400 text-[#081a2e] font-black text-xs border border-[#081a2e]">
                          #{idx + 1}
                        </span>
                      </div>
                      <input
                        type="text"
                        value={f.name}
                        onChange={(e) => updateFinalistName(f.id, e.target.value)}
                        className="w-full text-center font-black text-base sm:text-lg text-white bg-transparent border-b border-white/20 focus:border-[#00d2ff] outline-none px-1"
                      />
                      <span className="text-xs font-black px-3 py-1 rounded-full bg-[#081a2e] text-[#00d2ff] border border-[#00d2ff]/40">
                        Score: {f.score} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. ROUND INTRO SLIDE */}
            {current.type === 'ROUND_INTRO' && (
              <div className="w-full max-w-4xl text-center space-y-6 py-6">
                <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#00d2ff]/20 text-[#00d2ff] font-black text-sm uppercase tracking-widest border-2 border-[#00d2ff]">
                  <span>Round {current.roundNumber} of 4</span>
                </div>

                <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight">
                  {current.data.title}
                </h1>

                <div className="max-w-2xl mx-auto p-6 rounded-3xl bg-[#0e2e4e] border-2 border-[#00d2ff] shadow-[6px_6px_0px_#04101d] text-left space-y-3">
                  <h3 className="text-xs uppercase font-black tracking-wider text-yellow-300 border-b border-white/20 pb-2">
                    Round Rules & Scoring
                  </h3>
                  <ul className="space-y-2 text-sm sm:text-base font-bold text-white/90">
                    {current.data.rules.map((r: string, idx: number) => (
                      <li key={idx} className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* 5. ROUND 1: MCQ QUESTION SLIDE */}
            {current.type === 'MCQ' && (
              <div className="w-full max-w-4xl bg-[#0e2e4e] p-6 sm:p-10 rounded-3xl border-3 border-[#00d2ff] shadow-[8px_8px_0px_#04101d] space-y-6">
                <div className="flex items-center justify-between border-b-2 border-[#00d2ff]/30 pb-3">
                  <span className="px-3 py-1 rounded-full bg-[#00d2ff]/20 text-[#00d2ff] font-black text-xs uppercase tracking-wider">
                    Round 1 — MCQ • Question {current.data.number}
                  </span>
                  <span className="text-xs font-bold text-yellow-300">
                    +5 Points
                  </span>
                </div>

                <h2 className="text-xl sm:text-3xl font-black text-white leading-snug">
                  {current.data.question}
                </h2>

                {/* 4 Options Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  {current.data.options.map((opt: { label: string; text: string }, idx: number) => {
                    const isRevealed = revealedAnswers[current.id]
                    const isCorrect = idx === current.data.correctIndex

                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-2xl border-2 font-bold text-base sm:text-lg flex items-center gap-3 transition-all ${
                          isRevealed && isCorrect
                            ? 'bg-emerald-600 border-emerald-300 text-white shadow-xl scale-102 ring-4 ring-emerald-400'
                            : 'bg-[#081a2e] border-[#00d2ff]/40 text-white'
                        }`}
                      >
                        <span className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-black text-sm shrink-0">
                          {opt.label}
                        </span>
                        <span className="leading-snug">{opt.text}</span>
                      </div>
                    )
                  })}
                </div>

                {/* Reveal Answer Section */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/15">
                  <button
                    type="button"
                    onClick={() => toggleAnswer(current.id)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-yellow-400 text-[#081a2e] font-black text-sm hover:bg-yellow-300 transition-all cursor-pointer shadow-[3px_3px_0px_#04101d]"
                  >
                    {revealedAnswers[current.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{revealedAnswers[current.id] ? 'Hide Answer' : 'Reveal Correct Answer'}</span>
                  </button>

                  {revealedAnswers[current.id] && (
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="text-xs sm:text-sm text-emerald-300 font-bold bg-emerald-950/60 p-3 rounded-xl border border-emerald-500/40 flex-1 ml-0 sm:ml-4"
                    >
                      💡 {current.data.explanation}
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* 6. ROUND 2: AUDIO & IMAGE QUESTION SLIDE */}
            {current.type === 'MEDIA' && (
              <div className="w-full max-w-4xl bg-[#0e2e4e] p-6 sm:p-10 rounded-3xl border-3 border-[#00d2ff] shadow-[8px_8px_0px_#04101d] space-y-6">
                <div className="flex items-center justify-between border-b-2 border-[#00d2ff]/30 pb-3">
                  <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-black text-xs uppercase tracking-wider">
                    Round 2 — Audio & Image • Question {current.data.number}
                  </span>
                  <span className="text-xs font-bold text-amber-300">
                    Direct +10 / −5 | Pass +5 / 0
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-black uppercase text-[#00d2ff] tracking-wider">
                    {current.data.title}
                  </span>
                  <h2 className="text-xl sm:text-3xl font-black text-white leading-snug">
                    {current.data.clue}
                  </h2>
                </div>

                {current.data.audioClueText && (
                  <div className="p-4 rounded-2xl bg-[#081a2e] border-2 border-amber-400/50 text-amber-200 font-mono text-sm sm:text-base flex items-center gap-3">
                    <Radio className="w-6 h-6 text-amber-400 animate-pulse shrink-0" />
                    <span>{current.data.audioClueText}</span>
                  </div>
                )}

                {/* Reveal Answer Section */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/15">
                  <button
                    type="button"
                    onClick={() => toggleAnswer(current.id)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-400 text-[#081a2e] font-black text-sm hover:bg-amber-300 transition-all cursor-pointer shadow-[3px_3px_0px_#04101d]"
                  >
                    {revealedAnswers[current.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{revealedAnswers[current.id] ? 'Hide Answer' : 'Reveal Answer'}</span>
                  </button>

                  {revealedAnswers[current.id] && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#081a2e] p-4 rounded-2xl border-2 border-emerald-400 text-left flex-1 sm:ml-4 space-y-1"
                    >
                      <div className="text-lg font-black text-emerald-400">
                        Answer: {current.data.answer}
                      </div>
                      <div className="text-xs text-white/80 font-medium">
                        {current.data.explanation}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* 7. ROUND 3: RAPID FIRE QUESTION SET SLIDE */}
            {current.type === 'RAPID_SET' && (
              <div className="w-full max-w-4xl bg-[#0e2e4e] p-6 sm:p-8 rounded-3xl border-3 border-[#00d2ff] shadow-[8px_8px_0px_#04101d] space-y-5">
                {/* Header with 15s Timer */}
                <div className="flex items-center justify-between border-b-2 border-[#00d2ff]/30 pb-3 flex-wrap gap-2">
                  <div>
                    <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 font-black text-xs uppercase tracking-wider">
                      Round 3 — Rapid Fire
                    </span>
                    <h2 className="text-2xl font-black text-white mt-1">
                      {current.data.title}
                    </h2>
                  </div>

                  {/* 15-Second Interactive Timer */}
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex items-center gap-2 px-4 py-1.5 rounded-2xl border-2 font-black text-xl tnum shadow-md ${
                        rapidSeconds <= 4
                          ? 'bg-rose-600 text-white border-rose-300 animate-pulse'
                          : 'bg-yellow-400 text-[#081a2e] border-[#081a2e]'
                      }`}
                    >
                      <TimerIcon className="w-5 h-5" />
                      <span>{rapidSeconds}s</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setTimerRunning((prev) => !prev)}
                      className="px-3 py-1.5 rounded-xl bg-[#00d2ff] text-[#081a2e] font-black text-xs hover:bg-[#38bdf8] transition-all cursor-pointer shadow-md"
                    >
                      {timerRunning ? 'Pause' : 'Start 15s'}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setTimerRunning(false)
                        setRapidSeconds(15)
                      }}
                      className="p-1.5 rounded-xl bg-[#081a2e] border border-[#00d2ff]/40 text-[#00d2ff] hover:bg-[#00d2ff]/20 transition-all cursor-pointer"
                      title="Reset Timer"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* 5 Questions List */}
                <div className="space-y-2.5">
                  {current.data.questions.map((q: RapidFireQuestion, idx: number) => {
                    const isRevealed = revealedAnswers[q.id]

                    return (
                      <div
                        key={q.id}
                        className="p-3 sm:p-4 rounded-2xl bg-[#081a2e] border border-[#00d2ff]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3 flex-1">
                          <span className="w-6 h-6 rounded-lg bg-rose-500 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                            Q{idx + 1}
                          </span>
                          <span className="font-extrabold text-sm sm:text-base text-white">
                            {q.question}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          {isRevealed && (
                            <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400 text-xs font-black">
                              {q.answer}
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleAnswer(q.id)}
                            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-bold cursor-pointer"
                          >
                            {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 8. ROUND 4: FASTEST FINGERS FIRST SLIDE */}
            {current.type === 'FASTEST' && (
              <div className="w-full max-w-4xl bg-[#0e2e4e] p-6 sm:p-10 rounded-3xl border-3 border-[#00d2ff] shadow-[8px_8px_0px_#04101d] space-y-6">
                <div className="flex items-center justify-between border-b-2 border-[#00d2ff]/30 pb-3">
                  <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 font-black text-xs uppercase tracking-wider">
                    Round 4 — Fastest Fingers First • Q{current.data.number}
                  </span>
                  <span className="text-xs font-bold text-yellow-300">
                    Correct +15 | Wrong −5
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-black uppercase text-[#00d2ff] tracking-wider">
                    {current.data.category}
                  </span>
                  <h2 className="text-xl sm:text-3xl font-black text-white leading-snug">
                    {current.data.question}
                  </h2>
                </div>

                {/* Reveal Answer Section */}
                <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-white/15">
                  <button
                    type="button"
                    onClick={() => toggleAnswer(current.id)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-500 text-white font-black text-sm hover:bg-purple-400 transition-all cursor-pointer shadow-[3px_3px_0px_#04101d]"
                  >
                    {revealedAnswers[current.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    <span>{revealedAnswers[current.id] ? 'Hide Answer' : 'Reveal Answer'}</span>
                  </button>

                  {revealedAnswers[current.id] && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-[#081a2e] p-4 rounded-2xl border-2 border-purple-400 text-left flex-1 sm:ml-4 space-y-1"
                    >
                      <div className="text-lg font-black text-purple-300">
                        Answer: {current.data.answer}
                      </div>
                      <div className="text-xs text-white/80 font-medium">
                        {current.data.explanation}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* 9. TIE BREAKER SLIDE */}
            {current.type === 'TIE' && (
              <div className="w-full max-w-4xl bg-[#0e2e4e] p-6 sm:p-10 rounded-3xl border-3 border-yellow-400 shadow-[8px_8px_0px_#04101d] space-y-6">
                <div className="flex items-center justify-between border-b-2 border-yellow-400/40 pb-3">
                  <span className="px-3 py-1 rounded-full bg-yellow-400 text-[#081a2e] font-black text-xs uppercase tracking-wider">
                    Sudden Death Tie-Breaker
                  </span>
                  <span className="text-xs font-bold text-yellow-300">
                    Fastest Correct Answer Wins
                  </span>
                </div>

                <div className="space-y-4">
                  {current.data.map((tb: FastestFingerQuestion, idx: number) => {
                    const isRevealed = revealedAnswers[tb.id]

                    return (
                      <div key={tb.id} className="p-4 rounded-2xl bg-[#081a2e] border border-yellow-400/40 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-yellow-400 uppercase">
                            Tie-Breaker Question #{idx + 1} • {tb.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleAnswer(tb.id)}
                            className="px-3 py-1 rounded-lg bg-yellow-400/20 text-yellow-300 text-xs font-bold hover:bg-yellow-400/30 cursor-pointer"
                          >
                            {isRevealed ? 'Hide' : 'Reveal Answer'}
                          </button>
                        </div>
                        <p className="text-base sm:text-lg font-extrabold text-white">
                          {tb.question}
                        </p>
                        {isRevealed && (
                          <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-400 text-emerald-300 font-black text-sm">
                            Answer: {tb.answer} ({tb.explanation})
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 10. GRAND PODIUM SLIDE */}
            {current.type === 'PODIUM' && (
              <div className="w-full max-w-4xl text-center space-y-6">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-yellow-400 text-[#081a2e] font-black text-sm uppercase tracking-widest shadow-lg">
                    <Trophy className="w-5 h-5" />
                    <span>Grand Finale Ceremony</span>
                  </div>
                  <h1 className="text-4xl sm:text-6xl font-black text-white">
                    Congratulations Champions!
                  </h1>
                </div>

                {/* Top 3 Finalists Podium */}
                <div className="grid grid-cols-3 gap-3 sm:gap-6 items-end pt-4 pb-2">
                  {/* 2nd Place */}
                  {rankedFinalists[1] && (
                    <div className="p-4 sm:p-6 rounded-3xl bg-[#0e2e4e] border-2 border-slate-300 shadow-xl flex flex-col items-center gap-2">
                      <ParticipantAvatar seed={rankedFinalists[1].avatarSeed} size="lg" className="border-2 border-slate-300" />
                      <span className="font-black text-sm sm:text-lg text-white truncate max-w-full">
                        {rankedFinalists[1].name}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-slate-300 text-[#081a2e] font-black text-xs uppercase">
                        🥈 1st Runner Up
                      </span>
                      <span className="text-sm font-black text-cyan-300">
                        {rankedFinalists[1].score} pts
                      </span>
                    </div>
                  )}

                  {/* 1st Place (Winner) */}
                  {rankedFinalists[0] && (
                    <div className="p-5 sm:p-8 rounded-3xl bg-[#0e2e4e] border-3 border-yellow-400 shadow-2xl flex flex-col items-center gap-3 -translate-y-4 ring-4 ring-yellow-400/50">
                      <Crown className="w-8 h-8 text-yellow-400 animate-bounce" />
                      <ParticipantAvatar seed={rankedFinalists[0].avatarSeed} size="xl" className="border-3 border-yellow-400" />
                      <span className="font-black text-lg sm:text-2xl text-yellow-300 truncate max-w-full">
                        {rankedFinalists[0].name}
                      </span>
                      <span className="px-4 py-1.5 rounded-full bg-yellow-400 text-[#081a2e] font-black text-xs sm:text-sm uppercase tracking-wider">
                        🏆 INGENIUM CHAMPION
                      </span>
                      <span className="text-base font-black text-emerald-400">
                        {rankedFinalists[0].score} pts
                      </span>
                    </div>
                  )}

                  {/* 3rd Place */}
                  {rankedFinalists[2] && (
                    <div className="p-4 sm:p-6 rounded-3xl bg-[#0e2e4e] border-2 border-amber-600 shadow-xl flex flex-col items-center gap-2">
                      <ParticipantAvatar seed={rankedFinalists[2].avatarSeed} size="lg" className="border-2 border-amber-600" />
                      <span className="font-black text-sm sm:text-lg text-white truncate max-w-full">
                        {rankedFinalists[2].name}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-amber-600 text-white font-black text-xs uppercase">
                        🥉 2nd Runner Up
                      </span>
                      <span className="text-sm font-black text-cyan-300">
                        {rankedFinalists[2].score} pts
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* BOTTOM SLIDE CONTROLS BAR */}
      <footer className="relative z-30 w-full h-16 bg-[#081a2e]/90 backdrop-blur-md border-t-2 border-[#00d2ff]/40 px-4 sm:px-8 flex items-center justify-between">
        {/* Previous Slide */}
        <button
          type="button"
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0e2e4e] border-2 border-[#00d2ff]/50 text-white font-black text-xs sm:text-sm hover:bg-[#00d2ff] hover:text-[#081a2e] transition-all cursor-pointer disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        {/* Progress Bar Dots */}
        <div className="hidden sm:flex items-center gap-1.5 overflow-x-auto max-w-md py-1 px-2">
          {slides.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                sound.tap()
                setCurrentSlide(idx)
              }}
              className={`h-2 rounded-full transition-all cursor-pointer ${
                idx === currentSlide
                  ? 'w-6 bg-[#00d2ff]'
                  : 'w-2 bg-white/20 hover:bg-white/40'
              }`}
              title={`Jump to Slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Next Slide */}
        <button
          type="button"
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00d2ff] text-[#081a2e] font-black text-xs sm:text-sm hover:bg-[#38bdf8] transition-all cursor-pointer disabled:opacity-30 shadow-[2px_2px_0px_#04101d]"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>

      {/* INTERACTIVE STAGE SCOREBOARD DRAWER */}
      <AnimatePresence>
        {showScoreboard && (
          <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="w-full max-w-md h-full bg-[#0c2340] border-l-3 border-[#00d2ff] p-5 flex flex-col justify-between shadow-2xl overflow-y-auto"
            >
              {/* Header */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-[#00d2ff]/30 pb-3">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-yellow-400" />
                    <h3 className="text-lg font-black text-white">Stage Finalists Scoreboard</h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowScoreboard(false)}
                    className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Finalists Score Modification List */}
                <div className="space-y-3">
                  {rankedFinalists.map((f, rankIdx) => (
                    <div
                      key={f.id}
                      className="p-3.5 rounded-2xl bg-[#081a2e] border-2 border-[#00d2ff]/40 space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-6 h-6 rounded-lg bg-yellow-400 text-[#081a2e] font-black text-xs flex items-center justify-center shrink-0">
                            #{rankIdx + 1}
                          </span>
                          <ParticipantAvatar seed={f.avatarSeed} size="sm" className="shrink-0" />
                          <input
                            type="text"
                            value={f.name}
                            onChange={(e) => updateFinalistName(f.id, e.target.value)}
                            className="font-black text-sm text-white bg-transparent border-b border-transparent focus:border-[#00d2ff] outline-none truncate"
                          />
                        </div>
                        <span className="text-base font-black text-yellow-300 shrink-0 tnum">
                          {f.score} pts
                        </span>
                      </div>

                      {/* Score Modifier Buttons */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => updateScore(f.id, 15)}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-black cursor-pointer"
                        >
                          +15
                        </button>
                        <button
                          type="button"
                          onClick={() => updateScore(f.id, 10)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer"
                        >
                          +10
                        </button>
                        <button
                          type="button"
                          onClick={() => updateScore(f.id, 5)}
                          className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-black cursor-pointer"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          onClick={() => updateScore(f.id, -5)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-black cursor-pointer"
                        >
                          −5
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-[#00d2ff]/30 flex items-center justify-between">
                <button
                  type="button"
                  onClick={resetAllScores}
                  className="px-3 py-1.5 rounded-xl bg-rose-600/30 text-rose-300 border border-rose-500 text-xs font-bold hover:bg-rose-600/50 cursor-pointer"
                >
                  Reset Scores
                </button>
                <button
                  type="button"
                  onClick={() => setShowScoreboard(false)}
                  className="px-4 py-2 rounded-xl bg-[#00d2ff] text-[#081a2e] font-black text-xs cursor-pointer shadow-md"
                >
                  Close Panel (S)
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
