'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import type {
  StageData,
  StageMcqQuestion,
  StageImageQuestion,
  StageAudioQuestion,
  RapidFireSet,
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
  Pause,
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
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Music,
  ImageIcon,
  ArrowRight,
  ShieldCheck,
  FlameKindling,
  Compass,
  Cpu,
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

interface SlideItem {
  type:
    | 'error'
    | 'title'
    | 'rules'
    | 'finalists'
    | 'round_intro'
    | 'r1_mcq'
    | 'r2_image'
    | 'r2_audio'
    | 'r3_rapid'
    | 'r4_intro'
    | 'r4_buzzer'
    | 'tie_breaker'
    | 'podium'
  title: string
  roundNum?: number
  data?: any
  qIndex?: number
  totalInRound?: number
}

export function StagePptPresentation({ stageData }: { stageData: StageData | null }) {
  // Slide Management
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showScoreboard, setShowScoreboard] = useState(false)
  const [revealedAnswers, setRevealedAnswers] = useState<Record<string, boolean>>({})

  // Rapid Fire State
  const [rapidSetIndex, setRapidSetIndex] = useState(0)
  const [rapidQuestionIdx, setRapidQuestionIdx] = useState(0)
  const [rapidSeconds, setRapidSeconds] = useState(40)
  const [timerRunning, setTimerRunning] = useState(false)
  const [rapidRevealMode, setRapidRevealMode] = useState<Record<number, boolean>>({})
  const [rapidAnswerAwarded, setRapidAnswerAwarded] = useState<Record<string, boolean>>({})

  // Audio Playback State for Round 2 Audio Questions
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Stage Scoreboard State (Persisted in localStorage)
  const [finalists, setFinalists] = useState<StageFinalist[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('ingenium_stage_finalists_v2')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return DEFAULT_FINALISTS
  })

  // Save finalists to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('ingenium_stage_finalists_v2', JSON.stringify(finalists))
    } catch {}
  }, [finalists])

  // Slide list definition
  const slides = useMemo<SlideItem[]>(() => {
    if (!stageData) {
      return [{ type: 'error', title: 'Data Missing' }]
    }

    const list: SlideItem[] = []

    // 0: Title
    list.push({ type: 'title', title: stageData.title })
    // 1: Rules
    list.push({ type: 'rules', title: 'Official Stage Rules' })
    // 2: Finalists Intro
    list.push({ type: 'finalists', title: 'Meet the Top 6 Qualifiers' })

    // Round 1: MCQ (12 Questions)
    list.push({ type: 'round_intro', title: stageData.round1.name, roundNum: 1, data: stageData.round1 })
    stageData.round1.questions.forEach((q, idx) => {
      list.push({
        type: 'r1_mcq',
        title: `Round 1: Question ${idx + 1} of ${stageData.round1.questions.length}`,
        roundNum: 1,
        data: q,
        qIndex: idx,
        totalInRound: stageData.round1.questions.length,
      })
    })

    // Round 2: Audio & Image
    list.push({ type: 'round_intro', title: stageData.round2.name, roundNum: 2, data: stageData.round2 })
    // Image questions (6)
    stageData.round2.images.forEach((imgQ, idx) => {
      list.push({
        type: 'r2_image',
        title: `Round 2 — Image ${idx + 1} of ${stageData.round2.images.length}`,
        roundNum: 2,
        data: imgQ,
        qIndex: idx,
        totalInRound: stageData.round2.images.length,
      })
    })
    // Audio questions (6)
    stageData.round2.audios.forEach((audQ, idx) => {
      list.push({
        type: 'r2_audio',
        title: `Round 2 — Audio ${idx + 1} of ${stageData.round2.audios.length}`,
        roundNum: 2,
        data: audQ,
        qIndex: idx,
        totalInRound: stageData.round2.audios.length,
      })
    })

    // Round 3: Rapid Fire (6 Sets for 6 Participants)
    list.push({ type: 'round_intro', title: stageData.round3.name, roundNum: 3, data: stageData.round3 })
    stageData.round3.sets.forEach((set, idx) => {
      list.push({
        type: 'r3_rapid',
        title: `Round 3 — Rapid Fire: ${set.participantLabel} (Set ${set.setNumber})`,
        roundNum: 3,
        data: set,
        qIndex: idx,
        totalInRound: stageData.round3.sets.length,
      })
    })

    // Round 4: Fastest Fingers First
    list.push({ type: 'r4_intro', title: stageData.round4.name, roundNum: 4, data: stageData.round4 })
    list.push({ type: 'r4_buzzer', title: 'Round 4 — Live Buzzer Arena', roundNum: 4, data: stageData.round4 })

    // Tie Breaker & Podium
    list.push({ type: 'tie_breaker', title: 'Tie-Breaker Arena' })
    list.push({ type: 'podium', title: 'Grand Finale — Victory Ceremony' })

    return list
  }, [stageData])

  const slide = slides[currentSlide] || slides[0]

  // Stop audio on slide change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setPlayingAudioId(null)
    setAudioProgress(0)
  }, [currentSlide])

  // Rapid Fire Timer Interval (40s)
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerRunning && rapidSeconds > 0) {
      interval = setInterval(() => {
        setRapidSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false)
            sound.wrong()
            return 0
          }
          if (prev === 11 || prev === 6) {
            sound.tick()
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning, rapidSeconds])

  // Confetti on Podium slide
  useEffect(() => {
    if (slide?.type === 'podium') {
      sound.celebrate()
      const duration = 4.5 * 1000
      const end = Date.now() + duration
      const interval: NodeJS.Timeout = setInterval(() => {
        if (Date.now() > end) return clearInterval(interval)
        confetti({
          startVelocity: 35,
          spread: 360,
          ticks: 70,
          origin: { x: Math.random(), y: Math.random() * 0.4 },
          colors: ['#00d2ff', '#fbbf24', '#10b981', '#38bdf8', '#f43f5e', '#ffffff'],
        })
      }, 350)
      return () => clearInterval(interval)
    }
  }, [slide?.type])

  // Navigation handlers
  const nextSlide = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1)
      sound.tap()
    }
  }, [currentSlide, slides.length])

  const prevSlide = useCallback(() => {
    if (currentSlide > 0) {
      setCurrentSlide((prev) => prev - 1)
      sound.tap()
    }
  }, [currentSlide])

  // Toggle reveal
  const toggleReveal = (key: string) => {
    setRevealedAnswers((prev) => {
      const next = !prev[key]
      if (next) sound.correct()
      return { ...prev, [key]: next }
    })
  }

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  // Score adjustments
  const adjustScore = (finalistId: string, delta: number, roundKey?: 'r1' | 'r2' | 'r3' | 'r4') => {
    setFinalists((prev) =>
      prev.map((f) => {
        if (f.id !== finalistId) return f
        const newScore = Math.max(0, f.score + delta)
        const roundScores = { ...f.roundScores }
        if (roundKey) {
          roundScores[roundKey] = Math.max(0, roundScores[roundKey] + delta)
        }
        return { ...f, score: newScore, roundScores }
      }),
    )
    if (delta > 0) sound.ting()
    else sound.wrong()
  }

  // Rename finalist
  const updateFinalistName = (id: string, name: string) => {
    setFinalists((prev) => prev.map((f) => (f.id === id ? { ...f, name: name.trim() || f.name } : f)))
  }

  // Reset all scores
  const resetScores = () => {
    if (confirm('Are you sure you want to reset all stage scores to 0?')) {
      setFinalists(DEFAULT_FINALISTS)
      localStorage.removeItem('ingenium_stage_finalists_v2')
      sound.tap()
    }
  }

  // Audio Playback toggle
  const togglePlayAudio = (url: string, id: string) => {
    if (playingAudioId === id && audioRef.current) {
      if (audioRef.current.paused) {
        audioRef.current.play()
      } else {
        audioRef.current.pause()
        setPlayingAudioId(null)
      }
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
    }

    const audio = new Audio(url)
    audioRef.current = audio
    setPlayingAudioId(id)

    audio.ontimeupdate = () => {
      setAudioProgress(audio.currentTime)
      setAudioDuration(audio.duration || 0)
    }

    audio.onended = () => {
      setPlayingAudioId(null)
      setAudioProgress(0)
    }

    audio.play().catch((err) => {
      console.error('Audio play error:', err)
      setPlayingAudioId(null)
    })
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return
      }

      if (e.key === 'ArrowRight' || e.key === 'PageDown') {
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
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        const revealKey = `slide_${currentSlide}`
        toggleReveal(revealKey)
      } else if (e.key === ' ') {
        e.preventDefault()
        if (slide.type === 'r3_rapid') {
          setTimerRunning((prev) => !prev)
        } else {
          nextSlide()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentSlide, nextSlide, prevSlide, slide?.type])

  // Ranked Finalists
  const rankedFinalists = useMemo(() => {
    return [...finalists].sort((a, b) => b.score - a.score)
  }, [finalists])

  if (!stageData) {
    return (
      <div className="notebook-paper min-h-screen text-white flex flex-col items-center justify-center p-8 text-center">
        <div className="p-6 rounded-3xl notebook-card max-w-md">
          <AlertTriangle className="w-16 h-16 text-[#fbbf24] mx-auto mb-4 animate-bounce" />
          <h1 className="text-2xl font-black mb-2 text-white">Stage Data Encrypted / Key Required</h1>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            Please make sure <code className="text-[#00d2ff] bg-[#081a2e] px-2 py-0.5 rounded">QUIZ_SEED_KEY</code> is configured in your environment to decrypt the stage questions.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 rounded-full bg-[#00d2ff] text-[#081a2e] font-black border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] transition hover:scale-105"
          >
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  const isRevealed = !!revealedAnswers[`slide_${currentSlide}`]

  return (
    <div className="notebook-paper relative w-screen h-screen text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* Blueprint Grid Technical Vignette Accent */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-40 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(4,16,29,0.85)_100%)]" />

      {/* Presentation Top Bar (Blueprint Header) */}
      <header className="relative z-20 flex items-center justify-between px-5 py-3 border-b-2 border-[#00d2ff]/40 bg-[#081a2e]/95 backdrop-blur-md shadow-[0_4px_0px_#04101d]">
        <div className="flex items-center gap-3">
          <Image
            src="/yenepoya-school-engineering-and-technology.svg"
            alt="Yenepoya School of Engineering & Technology"
            width={140}
            height={36}
            className="h-8 w-auto object-contain brightness-110"
            priority
          />
          <div className="h-5 w-px bg-[#00d2ff]/40" />
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider sticky-note-yellow text-[#081a2e]">
              ⚡ Live Stage Finale
            </span>
            <span className="text-xs text-[#7dd3fc] font-bold hidden sm:inline">
              Slide {currentSlide + 1} / {slides.length}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          {/* Quick Finalists Score Ticker */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-xl bg-[#0e2e4e] border-2 border-[#00d2ff]/60 shadow-[2px_2px_0px_#04101d] text-xs">
            <Trophy className="w-3.5 h-3.5 text-[#fbbf24]" />
            <div className="flex items-center gap-3">
              {rankedFinalists.slice(0, 3).map((f, i) => (
                <div key={f.id} className="flex items-center gap-1.5 font-bold">
                  <span className={i === 0 ? 'text-[#fbbf24]' : i === 1 ? 'text-slate-200' : 'text-[#f59e0b]'}>
                    #{i + 1}
                  </span>
                  <span className="text-slate-200 max-w-[80px] truncate">{f.name}:</span>
                  <span className="font-mono font-black text-[#00d2ff]">{f.score}</span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setShowScoreboard((prev) => !prev)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black border-2 border-[#081a2e] shadow-[2px_2px_0px_#04101d] transition hover:scale-105 active:scale-95 ${
              showScoreboard
                ? 'bg-[#fbbf24] text-[#081a2e]'
                : 'bg-[#00d2ff] text-[#081a2e]'
            }`}
            title="Toggle Finalists Scoreboard (Key: S)"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Scoreboard</span> (S)
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-[#0e2e4e] text-[#00d2ff] border-2 border-[#00d2ff]/60 shadow-[2px_2px_0px_#04101d] hover:bg-[#00d2ff] hover:text-[#081a2e] transition"
            title="Toggle Fullscreen (Key: F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Slide Canvas */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.01, y: -8 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
            className="w-full max-w-6xl h-full flex flex-col justify-center"
          >
            {/* SLIDE TYPE: Title */}
            {slide.type === 'title' && (
              <div className="text-center flex flex-col items-center justify-center py-6">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full sticky-note-yellow font-black text-xs uppercase tracking-wider text-[#081a2e] mb-5 -rotate-1"
                >
                  <Sparkles className="w-4 h-4 text-[#081a2e]" />
                  Yenepoya School of Engineering & Technology
                </motion.div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white mb-3 text-ink drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                  {stageData.title}
                </h1>

                <p className="text-lg md:text-2xl text-[#7dd3fc] max-w-2xl font-bold mb-8 leading-relaxed">
                  {stageData.subtitle}
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-4xl mb-8">
                  <div className="p-4 rounded-2xl notebook-card text-center">
                    <div className="text-xs uppercase text-[#7dd3fc] font-black tracking-wider mb-1">Round 1</div>
                    <div className="text-lg font-black text-[#00d2ff]">MCQ Arena</div>
                    <div className="text-xs text-slate-300 font-semibold">+5 pts • No Negative</div>
                  </div>
                  <div className="p-4 rounded-2xl notebook-card text-center">
                    <div className="text-xs uppercase text-[#7dd3fc] font-black tracking-wider mb-1">Round 2</div>
                    <div className="text-lg font-black text-[#38bdf8]">Audio & Image</div>
                    <div className="text-xs text-slate-300 font-semibold">+10 / −5 • Pass +5</div>
                  </div>
                  <div className="p-4 rounded-2xl notebook-card text-center">
                    <div className="text-xs uppercase text-[#7dd3fc] font-black tracking-wider mb-1">Round 3</div>
                    <div className="text-lg font-black text-[#fbbf24]">Rapid Fire</div>
                    <div className="text-xs text-slate-300 font-semibold">40s • 5 Qs • +10 pts</div>
                  </div>
                  <div className="p-4 rounded-2xl notebook-card text-center">
                    <div className="text-xs uppercase text-[#7dd3fc] font-black tracking-wider mb-1">Round 4</div>
                    <div className="text-lg font-black text-[#f43f5e]">Fastest Fingers</div>
                    <div className="text-xs text-slate-300 font-semibold">+15 / −5 on Buzz</div>
                  </div>
                </div>

                <button
                  onClick={nextSlide}
                  className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#00d2ff] hover:bg-[#38bdf8] text-[#081a2e] text-lg font-black border-2 border-[#081a2e] shadow-[4px_4px_0px_#04101d] transition-transform hover:scale-105 active:scale-95"
                >
                  Start Stage Presentation <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* SLIDE TYPE: Rules */}
            {slide.type === 'rules' && (
              <div className="flex flex-col h-full justify-center p-2 sm:p-4">
                <div className="flex items-center gap-3 mb-5">
                  <div className="p-3 rounded-2xl bg-[#00d2ff] text-[#081a2e] border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d]">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase tracking-wider text-[#00d2ff]">Blueprint Directives</span>
                    <h2 className="text-2xl md:text-4xl font-black text-white">Official Stage Quiz Rules</h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
                  {stageData.rules.map((rule, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.04 }}
                      className="flex items-start gap-3 p-3.5 rounded-2xl notebook-card"
                    >
                      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00d2ff] text-[#081a2e] font-mono font-black text-xs flex items-center justify-center border border-[#081a2e]">
                        {idx + 1}
                      </div>
                      <p className="text-slate-100 text-xs md:text-sm font-bold leading-relaxed">{rule}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t-2 border-[#00d2ff]/30">
                  <span className="text-xs text-[#7dd3fc] font-bold">Press Space or Arrow Right to proceed</span>
                  <button
                    onClick={nextSlide}
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#00d2ff] hover:bg-[#38bdf8] font-black text-[#081a2e] border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] transition"
                  >
                    Meet Finalists <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SLIDE TYPE: Finalists Intro */}
            {slide.type === 'finalists' && (
              <div className="flex flex-col h-full justify-center p-2 sm:p-4">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full sticky-note-yellow text-[#081a2e] text-xs font-black uppercase tracking-wider mb-2 -rotate-1">
                    <Crown className="w-4 h-4 text-[#081a2e]" /> Stage Qualifiers
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-white">Meet the Top 6 Finalists</h2>
                  <p className="text-[#7dd3fc] text-xs font-bold mt-1">Click any name to edit qualifier name</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
                  {finalists.map((finalist, idx) => (
                    <motion.div
                      key={finalist.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.06 }}
                      className="flex flex-col items-center p-4 rounded-2xl notebook-card text-center group"
                    >
                      <div className="relative mb-2.5">
                        <ParticipantAvatar seed={finalist.avatarSeed} size="lg" className="ring-2 ring-[#00d2ff]" />
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#fbbf24] text-[#081a2e] font-black text-xs flex items-center justify-center border border-[#081a2e]">
                          #{idx + 1}
                        </div>
                      </div>

                      <input
                        type="text"
                        defaultValue={finalist.name}
                        onBlur={(e) => updateFinalistName(finalist.id, e.target.value)}
                        className="w-full text-center font-black text-white bg-transparent hover:bg-[#081a2e] focus:bg-[#081a2e] focus:ring-2 focus:ring-[#00d2ff] rounded-lg px-1 py-0.5 text-xs md:text-sm transition outline-none"
                      />

                      <div className="mt-2.5 w-full pt-2 border-t-2 border-[#00d2ff]/30 flex items-center justify-between text-xs">
                        <span className="text-[#7dd3fc] font-bold">Score</span>
                        <span className="font-mono font-black text-[#00d2ff] text-sm">{finalist.score} pts</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex items-center justify-center">
                  <button
                    onClick={nextSlide}
                    className="flex items-center gap-2 px-8 py-3 rounded-full bg-[#00d2ff] hover:bg-[#38bdf8] font-black text-[#081a2e] border-2 border-[#081a2e] shadow-[4px_4px_0px_#04101d] transition hover:scale-105"
                  >
                    Enter Round 1 (MCQ) <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SLIDE TYPE: Round Intro */}
            {slide.type === 'round_intro' && (
              <div className="text-center flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 rounded-3xl notebook-card flex items-center justify-center mb-5 text-[#00d2ff]">
                  {slide.roundNum === 1 && <HelpCircle className="w-8 h-8" />}
                  {slide.roundNum === 2 && <Radio className="w-8 h-8" />}
                  {slide.roundNum === 3 && <Flame className="w-8 h-8 text-[#fbbf24]" />}
                </div>

                <span className="text-xs font-black uppercase tracking-widest text-[#00d2ff] mb-1">
                  Round {slide.roundNum}
                </span>

                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-3">{slide.data?.name}</h2>
                <p className="text-base md:text-lg text-[#7dd3fc] max-w-xl mb-6 font-bold leading-relaxed">{slide.data?.ruleText}</p>

                <button
                  onClick={nextSlide}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#00d2ff] hover:bg-[#38bdf8] text-[#081a2e] font-black border-2 border-[#081a2e] shadow-[4px_4px_0px_#04101d] transition hover:scale-105"
                >
                  Start Round {slide.roundNum} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* SLIDE TYPE: Round 1 MCQ */}
            {slide.type === 'r1_mcq' && (
              <div className="flex flex-col h-full justify-between p-2 sm:p-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#00d2ff]/20 text-[#00d2ff] border-2 border-[#00d2ff]/50">
                      Round 1 — MCQ • Question {slide.qIndex! + 1} of {slide.totalInRound}
                    </span>
                    <span className="text-xs text-[#fbbf24] font-black uppercase tracking-wider">+5 Points for Correct</span>
                  </div>

                  {/* Question Prompt */}
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-black text-white leading-snug mb-6">
                    {slide.data.question}
                  </h2>

                  {/* 4 Options Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mb-4">
                    {slide.data.options.map((opt: string, idx: number) => {
                      const isCorrect = idx === slide.data.correctIndex
                      const letter = String.fromCharCode(65 + idx)
                      return (
                        <div
                          key={idx}
                          className={`flex items-center gap-3.5 p-3.5 md:p-4 rounded-2xl transition-all duration-200 border-2 ${
                            isRevealed
                              ? isCorrect
                                ? 'bg-[#10b981] text-[#081a2e] border-[#081a2e] shadow-[4px_4px_0px_#04101d] font-black scale-[1.01]'
                                : 'bg-[#081a2e]/50 border-[#00d2ff]/20 text-slate-400 opacity-40'
                              : 'notebook-card-interactive text-white'
                          }`}
                        >
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm border-2 ${
                              isRevealed && isCorrect
                                ? 'bg-[#081a2e] text-[#10b981] border-[#081a2e]'
                                : 'bg-[#00d2ff] text-[#081a2e] border-[#081a2e]'
                            }`}
                          >
                            {letter}
                          </div>
                          <span className="text-sm md:text-base font-bold flex-1">{opt}</span>
                          {isRevealed && isCorrect && <CheckCircle2 className="w-6 h-6 text-[#081a2e]" />}
                        </div>
                      )
                    })}
                  </div>

                  {/* Engineering Fact Card */}
                  <AnimatePresence>
                    {isRevealed && slide.data.explanation && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 8, height: 0 }}
                        className="p-4 rounded-2xl sticky-note-yellow text-[#081a2e] text-xs md:text-sm leading-relaxed mb-2 shadow-[4px_4px_0px_#04101d] flex items-start gap-3"
                      >
                        <Lightbulb className="w-5 h-5 text-[#081a2e] flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[11px] font-black uppercase tracking-wider block mb-0.5 text-[#081a2e]">
                            💡 Engineering Backstory & Fact
                          </span>
                          <p className="font-bold">{slide.data.explanation}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Bottom Bar Controls for Slide */}
                <div className="pt-3 border-t-2 border-[#00d2ff]/30 flex flex-wrap items-center justify-between gap-2.5">
                  <button
                    onClick={() => toggleReveal(`slide_${currentSlide}`)}
                    className={`flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] transition hover:scale-105 active:scale-95 ${
                      isRevealed
                        ? 'bg-[#0e2e4e] text-white'
                        : 'bg-[#fbbf24] text-[#081a2e]'
                    }`}
                  >
                    {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {isRevealed ? 'Hide Answer' : 'Reveal Answer & Fact'} (R)
                  </button>

                  {/* Award Points Quick Bar */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs text-[#7dd3fc] font-bold mr-1">Award +5 to:</span>
                    {finalists.map((f, i) => (
                      <button
                        key={f.id}
                        onClick={() => adjustScore(f.id, 5, 'r1')}
                        className="px-2.5 py-1 rounded-xl bg-[#00d2ff] hover:bg-[#38bdf8] text-[#081a2e] border-2 border-[#081a2e] shadow-[2px_2px_0px_#04101d] text-xs font-black transition hover:scale-105"
                      >
                        #{i + 1} {f.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE TYPE: Round 2 Image Question */}
            {slide.type === 'r2_image' && (
              <div className="flex flex-col h-full justify-between p-2 sm:p-4">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#00d2ff]/20 text-[#00d2ff] border-2 border-[#00d2ff]/50">
                      Round 2 — Image {slide.qIndex! + 1} of {slide.totalInRound} • NO OPTIONS
                    </span>
                    <span className="text-xs text-[#fbbf24] font-black">Direct +10 | Direct −5 | Pass +5</span>
                  </div>

                  <h2 className="text-lg md:text-2xl font-black text-white mb-3 leading-snug">
                    {slide.data.question}
                  </h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center mb-3">
                    {/* Image Box */}
                    <div className="relative w-full h-56 md:h-72 rounded-2xl overflow-hidden notebook-card flex items-center justify-center p-2">
                      <Image
                        src={slide.data.imageUrl}
                        alt="Clue Image"
                        fill
                        className="object-contain p-2"
                        priority
                      />
                    </div>

                    {/* Answer Reveal Box */}
                    <div className="flex flex-col justify-center">
                      <AnimatePresence>
                        {isRevealed ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-5 rounded-2xl sticky-note-mint text-[#081a2e] shadow-[4px_4px_0px_#04101d]"
                          >
                            <span className="text-[11px] font-black uppercase tracking-wider block mb-1">
                              ✓ Verified Technical Answer
                            </span>
                            <h3 className="text-xl md:text-2xl font-black mb-2">{slide.data.answer}</h3>
                            <p className="text-xs md:text-sm font-bold leading-relaxed">{slide.data.explanation}</p>
                          </motion.div>
                        ) : (
                          <div className="p-6 rounded-2xl notebook-card text-center text-[#7dd3fc]">
                            <ImageIcon className="w-8 h-8 mx-auto text-[#00d2ff] mb-2" />
                            <p className="text-sm font-black text-white">Direct Answer Round (No Multiple Choice)</p>
                            <p className="text-xs text-[#7dd3fc] mt-1 font-bold">Press Reveal Answer or Key R</p>
                          </div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>

                {/* Score Award Bar */}
                <div className="pt-3 border-t-2 border-[#00d2ff]/30 flex flex-wrap items-center justify-between gap-2.5">
                  <button
                    onClick={() => toggleReveal(`slide_${currentSlide}`)}
                    className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black bg-[#fbbf24] hover:bg-[#f59e0b] text-[#081a2e] border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] transition"
                  >
                    {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {isRevealed ? 'Hide Answer' : 'Reveal Answer'} (R)
                  </button>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[#10b981] font-black">Direct (+10):</span>
                      {finalists.map((f, i) => (
                        <button
                          key={f.id}
                          onClick={() => adjustScore(f.id, 10, 'r2')}
                          className="px-2 py-0.5 rounded-lg bg-[#10b981] text-[#081a2e] text-xs font-black border border-[#081a2e] shadow-[1px_1px_0px_#04101d] hover:scale-105 transition"
                        >
                          #{i + 1}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[#fbbf24] font-black">Passed (+5):</span>
                      {finalists.map((f, i) => (
                        <button
                          key={f.id}
                          onClick={() => adjustScore(f.id, 5, 'r2')}
                          className="px-2 py-0.5 rounded-lg bg-[#fbbf24] text-[#081a2e] text-xs font-black border border-[#081a2e] shadow-[1px_1px_0px_#04101d] hover:scale-105 transition"
                        >
                          #{i + 1}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[#f43f5e] font-black">Wrong (−5):</span>
                      {finalists.map((f, i) => (
                        <button
                          key={f.id}
                          onClick={() => adjustScore(f.id, -5, 'r2')}
                          className="px-2 py-0.5 rounded-lg bg-[#f43f5e] text-white text-xs font-black border border-[#081a2e] shadow-[1px_1px_0px_#04101d] hover:scale-105 transition"
                        >
                          #{i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE TYPE: Round 2 Audio Question */}
            {slide.type === 'r2_audio' && (
              <div className="flex flex-col h-full justify-between p-2 sm:p-4">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#00d2ff]/20 text-[#00d2ff] border-2 border-[#00d2ff]/50">
                      Round 2 — Audio {slide.qIndex! + 1} of {slide.totalInRound} • NO OPTIONS
                    </span>
                    <span className="text-xs text-[#fbbf24] font-black">Direct +10 | Direct −5 | Pass +5</span>
                  </div>

                  <h2 className="text-lg md:text-2xl font-black text-white mb-4 leading-snug">
                    {slide.data.question}
                  </h2>

                  {/* Audio Player Card (Blueprint Style) */}
                  <div className="p-5 md:p-6 rounded-3xl notebook-card mb-4 flex flex-col md:flex-row items-center gap-5">
                    <button
                      onClick={() => togglePlayAudio(slide.data.audioUrl, slide.data.id)}
                      className="w-16 h-16 rounded-2xl bg-[#00d2ff] hover:bg-[#38bdf8] text-[#081a2e] flex items-center justify-center border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] transition-transform active:scale-95 flex-shrink-0"
                    >
                      {playingAudioId === slide.data.id ? (
                        <Pause className="w-8 h-8" />
                      ) : (
                        <Play className="w-8 h-8 ml-1" />
                      )}
                    </button>

                    <div className="flex-1 w-full">
                      <div className="flex items-center justify-between text-xs font-mono font-bold text-[#7dd3fc] mb-1.5">
                        <span>AUDIO TRACK #{slide.qIndex! + 1}</span>
                        <span>
                          {Math.floor(audioProgress)}s / {Math.floor(audioDuration)}s
                        </span>
                      </div>

                      {/* Animated Technical Waveform Bars */}
                      <div className="flex items-center gap-1 h-10 w-full px-2 py-1 rounded-xl bg-[#081a2e] border-2 border-[#00d2ff]/40">
                        {Array.from({ length: 36 }).map((_, i) => (
                          <motion.div
                            key={i}
                            animate={
                              playingAudioId === slide.data.id
                                ? { height: ['20%', `${Math.random() * 80 + 20}%`, '20%'] }
                                : { height: '20%' }
                            }
                            transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.025 }}
                            className={`flex-1 rounded-full ${
                              playingAudioId === slide.data.id ? 'bg-[#00d2ff]' : 'bg-[#0f355c]'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Answer Reveal Box */}
                  <AnimatePresence>
                    {isRevealed && (
                      <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-2xl sticky-note-mint text-[#081a2e] shadow-[4px_4px_0px_#04101d]"
                      >
                        <span className="text-[11px] font-black uppercase tracking-wider block mb-0.5">
                          ✓ Speaker Personality Identified
                        </span>
                        <h3 className="text-xl md:text-2xl font-black mb-1">{slide.data.answer}</h3>
                        {slide.data.quote && (
                          <p className="text-xs md:text-sm font-black italic mb-1 text-[#081a2e]">
                            "{slide.data.quote}"
                          </p>
                        )}
                        <p className="text-xs font-bold text-[#081a2e]">{slide.data.explanation}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Score Award Bar */}
                <div className="pt-3 border-t-2 border-[#00d2ff]/30 flex flex-wrap items-center justify-between gap-2.5">
                  <button
                    onClick={() => toggleReveal(`slide_${currentSlide}`)}
                    className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black bg-[#fbbf24] hover:bg-[#f59e0b] text-[#081a2e] border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] transition"
                  >
                    {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {isRevealed ? 'Hide Answer' : 'Reveal Answer'} (R)
                  </button>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[#10b981] font-black">Direct (+10):</span>
                      {finalists.map((f, i) => (
                        <button
                          key={f.id}
                          onClick={() => adjustScore(f.id, 10, 'r2')}
                          className="px-2 py-0.5 rounded-lg bg-[#10b981] text-[#081a2e] text-xs font-black border border-[#081a2e] shadow-[1px_1px_0px_#04101d] hover:scale-105 transition"
                        >
                          #{i + 1}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[#fbbf24] font-black">Passed (+5):</span>
                      {finalists.map((f, i) => (
                        <button
                          key={f.id}
                          onClick={() => adjustScore(f.id, 5, 'r2')}
                          className="px-2 py-0.5 rounded-lg bg-[#fbbf24] text-[#081a2e] text-xs font-black border border-[#081a2e] shadow-[1px_1px_0px_#04101d] hover:scale-105 transition"
                        >
                          #{i + 1}
                        </button>
                      ))}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-[#f43f5e] font-black">Wrong (−5):</span>
                      {finalists.map((f, i) => (
                        <button
                          key={f.id}
                          onClick={() => adjustScore(f.id, -5, 'r2')}
                          className="px-2 py-0.5 rounded-lg bg-[#f43f5e] text-white text-xs font-black border border-[#081a2e] shadow-[1px_1px_0px_#04101d] hover:scale-105 transition"
                        >
                          #{i + 1}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE TYPE: Round 3 Rapid Fire */}
            {slide.type === 'r3_rapid' && (
              <div className="flex flex-col h-full justify-between p-2 sm:p-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider sticky-note-yellow text-[#081a2e] flex items-center gap-1">
                        <FlameKindling className="w-3.5 h-3.5" /> Rapid Fire • {slide.data.participantLabel} (Set {slide.data.setNumber})
                      </span>
                    </div>

                    {/* 40s Acoustic Timer Pill */}
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] font-mono font-black text-base transition ${
                          rapidSeconds <= 10
                            ? 'bg-[#f43f5e] text-white animate-pulse'
                            : timerRunning
                            ? 'bg-[#fbbf24] text-[#081a2e]'
                            : 'bg-[#00d2ff] text-[#081a2e]'
                        }`}
                      >
                        <TimerIcon className="w-4 h-4" />
                        <span>{rapidSeconds}s</span>
                      </div>

                      <button
                        onClick={() => setTimerRunning((prev) => !prev)}
                        className={`p-2 rounded-xl font-black text-[#081a2e] border-2 border-[#081a2e] shadow-[2px_2px_0px_#04101d] transition ${
                          timerRunning ? 'bg-[#fbbf24]' : 'bg-[#10b981]'
                        }`}
                        title="Start / Pause Timer (Space)"
                      >
                        {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => {
                          setTimerRunning(false)
                          setRapidSeconds(40)
                          setRapidQuestionIdx(0)
                        }}
                        className="p-2 rounded-xl bg-[#0e2e4e] text-[#00d2ff] border-2 border-[#00d2ff]/60 shadow-[2px_2px_0px_#04101d] transition"
                        title="Reset 40s Timer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* If NOT in reveal mode: Live 5 questions run (NO ANSWERS SHOWN) */}
                  {!rapidRevealMode[slide.data.setNumber] ? (
                    <div className="space-y-2.5 mb-4">
                      <div className="flex items-center justify-between text-xs text-[#7dd3fc] font-bold mb-1">
                        <span>Target: <strong className="text-white">{finalists[slide.data.participantIndex]?.name || slide.data.participantLabel}</strong></span>
                        <span>5 Questions • 40s Total</span>
                      </div>

                      {slide.data.questions.map((q: any, qIdx: number) => (
                        <div
                          key={qIdx}
                          onClick={() => setRapidQuestionIdx(qIdx)}
                          className={`p-3.5 rounded-2xl border-2 transition flex items-center justify-between cursor-pointer ${
                            rapidQuestionIdx === qIdx
                              ? 'bg-[#0e2e4e] border-[#fbbf24] shadow-[4px_4px_0px_#04101d]'
                              : 'bg-[#081a2e]/80 border-[#00d2ff]/30 hover:border-[#00d2ff]'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-[#00d2ff] text-[#081a2e] font-mono font-black text-xs flex items-center justify-center border border-[#081a2e]">
                              {q.number}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/40">
                              {q.category}
                            </span>
                            <span className="text-sm md:text-base font-bold text-white">{q.prompt}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* REVEAL ALL ANSWERS MODE: After questions are done, reveal each question with answers! */
                    <div className="space-y-2.5 mb-4 max-h-[60vh] overflow-y-auto pr-1">
                      <div className="flex items-center justify-between text-xs font-black text-[#10b981] uppercase tracking-wider mb-1">
                        <span>✓ Verification & Scoring Mode</span>
                        <span>Participant: {finalists[slide.data.participantIndex]?.name}</span>
                      </div>

                      {slide.data.questions.map((q: any, qIdx: number) => {
                        const awardKey = `r3_s${slide.data.setNumber}_q${q.number}`
                        const isAwarded = !!rapidAnswerAwarded[awardKey]
                        return (
                          <motion.div
                            key={qIdx}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: qIdx * 0.04 }}
                            className="p-3.5 rounded-2xl notebook-card flex flex-col md:flex-row md:items-center justify-between gap-2.5"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="w-5 h-5 rounded bg-[#00d2ff] text-[#081a2e] font-mono font-black text-xs flex items-center justify-center border border-[#081a2e]">
                                  {q.number}
                                </span>
                                <span className="px-2 py-0.2 rounded text-[10px] font-black uppercase tracking-wider bg-[#00d2ff]/20 text-[#00d2ff]">
                                  {q.category}
                                </span>
                                <span className="text-xs md:text-sm font-bold text-white">{q.prompt}</span>
                              </div>
                              <div className="ml-7 text-[#10b981] font-black text-xs md:text-sm flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4 text-[#10b981]" /> Ans: {q.answer}
                              </div>
                            </div>

                            <button
                              onClick={() => {
                                const finalistId = finalists[slide.data.participantIndex]?.id
                                if (!finalistId) return
                                if (isAwarded) {
                                  adjustScore(finalistId, -10, 'r3')
                                  setRapidAnswerAwarded((prev) => ({ ...prev, [awardKey]: false }))
                                } else {
                                  adjustScore(finalistId, 10, 'r3')
                                  setRapidAnswerAwarded((prev) => ({ ...prev, [awardKey]: true }))
                                }
                              }}
                              className={`px-3.5 py-1.5 rounded-xl text-xs font-black border-2 border-[#081a2e] shadow-[2px_2px_0px_#04101d] transition flex items-center gap-1 ${
                                isAwarded
                                  ? 'bg-[#10b981] text-[#081a2e]'
                                  : 'bg-[#00d2ff] hover:bg-[#38bdf8] text-[#081a2e]'
                              }`}
                            >
                              {isAwarded ? '✓ Awarded +10' : '+10 Correct'}
                            </button>
                          </motion.div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Mode Switcher */}
                <div className="pt-3 border-t-2 border-[#00d2ff]/30 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setRapidRevealMode((prev) => ({
                        ...prev,
                        [slide.data.setNumber]: !prev[slide.data.setNumber],
                      }))
                      sound.tap()
                    }}
                    className="flex items-center gap-2 px-6 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-[#fbbf24] hover:bg-[#f59e0b] text-[#081a2e] border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] transition"
                  >
                    {rapidRevealMode[slide.data.setNumber] ? (
                      <>
                        <RotateCcw className="w-4 h-4" /> Back to Questions Mode
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" /> Reveal All Answers & Score (+10)
                      </>
                    )}
                  </button>

                  <div className="text-xs text-[#7dd3fc] font-bold">
                    Target: <strong className="text-white">{finalists[slide.data.participantIndex]?.name}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* SLIDE TYPE: Round 4 Intro */}
            {slide.type === 'r4_intro' && (
              <div className="text-center flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 rounded-3xl notebook-card flex items-center justify-center mb-5 text-[#f43f5e]">
                  <Zap className="w-8 h-8" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-[#f43f5e] mb-1">Final Round</span>
                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-3">Fastest Fingers First</h2>
                <p className="text-base md:text-lg text-[#7dd3fc] max-w-xl mb-4 font-bold leading-relaxed">
                  Correct answer = <strong className="text-[#10b981]">+15 Points</strong> • Wrong answer after buzzing = <strong className="text-[#f43f5e]">−5 Points</strong>
                </p>
                <p className="text-xs text-slate-300 font-bold max-w-md mb-6">
                  Buzz only after the question is completely read. Early buzzes will not be considered.
                </p>
                <button
                  onClick={nextSlide}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#f43f5e] hover:bg-[#e11d48] text-white font-black border-2 border-[#081a2e] shadow-[4px_4px_0px_#04101d] transition hover:scale-105"
                >
                  Enter Buzzer Arena <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* SLIDE TYPE: Round 4 Live Buzzer Arena */}
            {slide.type === 'r4_buzzer' && (
              <div className="flex flex-col h-full justify-between p-2 sm:p-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#f43f5e]/20 text-[#f43f5e] border-2 border-[#f43f5e]/50">
                      Round 4 — Fastest Fingers First • Live Arena
                    </span>
                    <span className="text-xs text-[#fbbf24] font-black">Correct +15 | Wrong −5</span>
                  </div>

                  <h2 className="text-xl md:text-3xl font-black text-white mb-5 text-center">
                    Fastest Fingers Live Buzzer Arena
                  </h2>

                  {/* 6 Finalists Buzzer Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-4">
                    {finalists.map((f, i) => (
                      <div
                        key={f.id}
                        className="p-4 rounded-2xl notebook-card flex flex-col items-center text-center group"
                      >
                        <ParticipantAvatar seed={f.avatarSeed} size="md" className="mb-2 ring-2 ring-[#00d2ff]" />
                        <span className="font-black text-white text-xs truncate w-full">{f.name}</span>
                        <span className="font-mono font-black text-base text-[#00d2ff] my-1.5">{f.score} pts</span>

                        <div className="flex items-center gap-1.5 w-full mt-1">
                          <button
                            onClick={() => adjustScore(f.id, 15, 'r4')}
                            className="flex-1 py-1 rounded-lg bg-[#10b981] hover:bg-[#059669] text-[#081a2e] font-black text-xs border border-[#081a2e] shadow-[1px_1px_0px_#04101d] transition"
                            title="Award +15 points"
                          >
                            +15
                          </button>
                          <button
                            onClick={() => adjustScore(f.id, -5, 'r4')}
                            className="flex-1 py-1 rounded-lg bg-[#f43f5e] hover:bg-[#e11d48] text-white font-black text-xs border border-[#081a2e] shadow-[1px_1px_0px_#04101d] transition"
                            title="Deduct 5 points"
                          >
                            −5
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-[#00d2ff]/30 flex items-center justify-between">
                  <span className="text-xs text-[#7dd3fc] font-bold">In case of tied scores, proceed to Tie-Breaker</span>
                  <button
                    onClick={nextSlide}
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#fbbf24] hover:bg-[#f59e0b] font-black text-[#081a2e] border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] transition"
                  >
                    Proceed to Finale <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SLIDE TYPE: Tie Breaker */}
            {slide.type === 'tie_breaker' && (
              <div className="text-center flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 rounded-3xl notebook-card flex items-center justify-center mb-5 text-[#fbbf24]">
                  <Crown className="w-8 h-8" />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-[#fbbf24] mb-1">Stage Finale</span>
                <h2 className="text-3xl md:text-5xl font-black text-white mb-3">Tie-Breaker Arena</h2>
                <p className="text-[#7dd3fc] font-bold max-w-md mb-6 leading-relaxed">
                  Conducted by Quizmaster if two or more finalists share identical scores for podium positions.
                </p>
                <button
                  onClick={nextSlide}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#fbbf24] hover:bg-[#f59e0b] text-[#081a2e] font-black border-2 border-[#081a2e] shadow-[4px_4px_0px_#04101d] transition hover:scale-105"
                >
                  Reveal Grand Victory Podium <Trophy className="w-5 h-5 ml-1" />
                </button>
              </div>
            )}

            {/* SLIDE TYPE: Grand Podium */}
            {slide.type === 'podium' && (
              <div className="flex flex-col items-center justify-center h-full text-center py-4">
                <motion.div
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full sticky-note-yellow text-[#081a2e] font-black text-xs uppercase tracking-widest mb-4 -rotate-1"
                >
                  <Sparkles className="w-4 h-4 text-[#081a2e]" /> INGENIUM 2026 Champion Ceremony
                </motion.div>

                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-6">Grand Victory Podium</h2>

                {/* Podium Top 3 */}
                <div className="grid grid-cols-3 gap-3 md:gap-5 w-full max-w-2xl items-end mb-6">
                  {/* Rank 2 (Silver) */}
                  <motion.div
                    initial={{ y: 25, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center"
                  >
                    <ParticipantAvatar seed={rankedFinalists[1]?.avatarSeed || 'f2'} size="lg" className="mb-2 ring-2 ring-slate-300" />
                    <span className="font-black text-slate-100 text-xs md:text-sm truncate max-w-[110px]">
                      {rankedFinalists[1]?.name || 'Finalist 2'}
                    </span>
                    <span className="font-mono font-black text-[#00d2ff] text-xs md:text-sm mb-1.5">{rankedFinalists[1]?.score || 0} pts</span>
                    <div className="w-full h-24 md:h-28 rounded-t-2xl bg-slate-400 border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] flex flex-col items-center justify-center text-[#081a2e]">
                      <Medal className="w-6 h-6 mb-0.5" />
                      <span className="font-black text-sm md:text-base">2nd Place</span>
                    </div>
                  </motion.div>

                  {/* Rank 1 (Gold) */}
                  <motion.div
                    initial={{ y: 35, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="flex flex-col items-center"
                  >
                    <div className="relative mb-2">
                      <ParticipantAvatar seed={rankedFinalists[0]?.avatarSeed || 'f1'} size="xl" className="ring-4 ring-[#fbbf24]" />
                      <Crown className="w-7 h-7 text-[#fbbf24] absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce" />
                    </div>
                    <span className="font-black text-white text-sm md:text-base truncate max-w-[130px]">
                      {rankedFinalists[0]?.name || 'Finalist 1'}
                    </span>
                    <span className="font-mono font-black text-[#fbbf24] text-sm md:text-base mb-1.5">{rankedFinalists[0]?.score || 0} pts</span>
                    <div className="w-full h-36 md:h-40 rounded-t-2xl bg-[#fbbf24] border-2 border-[#081a2e] shadow-[4px_4px_0px_#04101d] flex flex-col items-center justify-center text-[#081a2e]">
                      <Trophy className="w-8 h-8 mb-0.5" />
                      <span className="font-black text-base md:text-xl">CHAMPION</span>
                    </div>
                  </motion.div>

                  {/* Rank 3 (Bronze) */}
                  <motion.div
                    initial={{ y: 25, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="flex flex-col items-center"
                  >
                    <ParticipantAvatar seed={rankedFinalists[2]?.avatarSeed || 'f3'} size="lg" className="mb-2 ring-2 ring-[#d97706]" />
                    <span className="font-black text-slate-100 text-xs md:text-sm truncate max-w-[110px]">
                      {rankedFinalists[2]?.name || 'Finalist 3'}
                    </span>
                    <span className="font-mono font-black text-[#00d2ff] text-xs md:text-sm mb-1.5">{rankedFinalists[2]?.score || 0} pts</span>
                    <div className="w-full h-18 md:h-20 rounded-t-2xl bg-[#d97706] border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] flex flex-col items-center justify-center text-white">
                      <Award className="w-5 h-5 mb-0.5" />
                      <span className="font-black text-xs md:text-sm">3rd Place</span>
                    </div>
                  </motion.div>
                </div>

                {/* Qualifiers 4 to 6 */}
                <div className="flex items-center justify-center gap-3 text-xs text-[#7dd3fc] font-bold">
                  {rankedFinalists.slice(3, 6).map((f, i) => (
                    <div key={f.id} className="px-3 py-1 rounded-xl notebook-card">
                      #{i + 4} <strong className="text-white">{f.name}</strong>: {f.score} pts
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Presentation Footer Navigation */}
      <footer className="relative z-20 flex items-center justify-between px-5 py-2.5 border-t-2 border-[#00d2ff]/40 bg-[#081a2e]/95 backdrop-blur-md shadow-[0_-4px_0px_#04101d]">
        <div className="flex items-center gap-2">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0e2e4e] border-2 border-[#00d2ff]/50 text-xs font-black text-[#00d2ff] hover:bg-[#00d2ff] hover:text-[#081a2e] disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00d2ff] hover:bg-[#38bdf8] text-xs font-black text-[#081a2e] border-2 border-[#081a2e] shadow-[2px_2px_0px_#04101d] disabled:opacity-30 disabled:pointer-events-none transition"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Slide Selector Scrubber */}
        <div className="flex items-center gap-1 max-w-md overflow-x-auto py-1 px-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                currentSlide === i ? 'w-6 bg-[#00d2ff]' : 'w-1.5 bg-[#0f355c] hover:bg-[#00d2ff]/60'
              }`}
              title={`Jump to Slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="text-xs text-[#7dd3fc] font-mono font-bold hidden sm:inline">
          Use &larr; &rarr; keys or Space to navigate
        </div>
      </footer>

      {/* Interactive Scoreboard Drawer */}
      <AnimatePresence>
        {showScoreboard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#04101d]/85 backdrop-blur-sm flex justify-end"
            onClick={() => setShowScoreboard(false)}
          >
            <motion.div
              initial={{ x: 400 }}
              animate={{ x: 0 }}
              exit={{ x: 400 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="w-full max-w-md h-full notebook-paper border-l-2 border-[#00d2ff] p-6 flex flex-col justify-between shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div>
                <div className="flex items-center justify-between pb-3.5 border-b-2 border-[#00d2ff]/40 mb-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[#fbbf24]" />
                    <h3 className="font-black text-white text-lg">Stage Leaderboard</h3>
                  </div>
                  <button
                    onClick={() => setShowScoreboard(false)}
                    className="p-1 rounded-lg hover:bg-[#0e2e4e] text-slate-300 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                  {rankedFinalists.map((f, rank) => (
                    <div
                      key={f.id}
                      className="p-3.5 rounded-2xl notebook-card flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`font-black text-sm w-5 text-center ${
                            rank === 0 ? 'text-[#fbbf24]' : rank === 1 ? 'text-slate-200' : rank === 2 ? 'text-[#d97706]' : 'text-slate-400'
                          }`}
                        >
                          #{rank + 1}
                        </span>
                        <ParticipantAvatar seed={f.avatarSeed} size="sm" />
                        <div>
                          <span className="font-black text-white text-sm block">{f.name}</span>
                          <span className="text-[10px] text-[#7dd3fc] font-bold">
                            R1: {f.roundScores.r1} • R2: {f.roundScores.r2} • R3: {f.roundScores.r3} • R4: {f.roundScores.r4}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-[#00d2ff] text-base">{f.score}</span>
                        <div className="flex flex-col gap-0.5">
                          <button
                            onClick={() => adjustScore(f.id, 5)}
                            className="p-1 rounded bg-[#00d2ff] text-[#081a2e] font-black text-[10px] hover:scale-105"
                            title="Add 5 pts"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => adjustScore(f.id, -5)}
                            className="p-1 rounded bg-[#f43f5e] text-white font-black text-[10px] hover:scale-105"
                            title="Deduct 5 pts"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3.5 border-t-2 border-[#00d2ff]/40 flex items-center justify-between">
                <button
                  onClick={resetScores}
                  className="text-xs text-[#f43f5e] hover:text-[#fb7185] flex items-center gap-1 font-black"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Reset All Scores
                </button>
                <button
                  onClick={() => setShowScoreboard(false)}
                  className="px-5 py-1.5 rounded-full bg-[#00d2ff] text-[#081a2e] font-black text-xs hover:bg-[#38bdf8] border-2 border-[#081a2e] shadow-[2px_2px_0px_#04101d]"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
