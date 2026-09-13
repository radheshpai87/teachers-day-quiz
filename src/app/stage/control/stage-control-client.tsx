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
  sendStageNetworkSync,
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
  Volume2,
  Timer as TimerIcon,
  Zap,
  Sparkles,
} from 'lucide-react'

export function StageControlClient({ stageData }: { stageData: StageData | null }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isRevealed, setIsRevealed] = useState(false)
  const [rapidQuestionIdx, setRapidQuestionIdx] = useState(0)
  const [rapidSeconds, setRapidSeconds] = useState(40)
  const [timerRunning, setTimerRunning] = useState(false)
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [mcqOptionStep, setMcqOptionStep] = useState(0)

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

  // Local timer countdown when timer is running
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (timerRunning && rapidSeconds > 0) {
      interval = setInterval(() => {
        setRapidSeconds((prev) => {
          if (prev <= 1) {
            setTimerRunning(false)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [timerRunning, rapidSeconds])

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
          setPlayingAudioId(null)
          setMcqOptionStep(typeof payload.mcqOptionStep === 'number' ? payload.mcqOptionStep : 0)
          setRapidQuestionIdx(typeof payload.rapidQuestionIdx === 'number' ? payload.rapidQuestionIdx : 0)
        } else if (type === 'UPDATE_FINALISTS') {
          setFinalists(payload.finalists)
        } else if (type === 'TOGGLE_REVEAL') {
          setIsRevealed(payload.isRevealed)
        } else if (type === 'MCQ_OPTION_STEP') {
          if (typeof payload.step === 'number') {
            setMcqOptionStep(payload.step)
          }
        } else if (type === 'RAPID_QUESTION_STEP') {
          if (typeof payload.rapidQuestionIdx === 'number') {
            setRapidQuestionIdx(payload.rapidQuestionIdx)
          }
        } else if (type === 'TIMER_ACTION') {
          setTimerRunning(payload.running)
          if (payload.seconds !== undefined) setRapidSeconds(payload.seconds)
        } else if (type === 'AUDIO_ACTION') {
          setPlayingAudioId(payload.action === 'play' ? payload.id : null)
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

    // Cross-device network SSE stream listener
    let es: EventSource | null = null
    try {
      es = new EventSource('/api/stage/stream')
      es.onmessage = (event) => {
        try {
          const state = JSON.parse(event.data)
          if (!state) return
          if (typeof state.slideIndex === 'number') {
            setCurrentSlide(state.slideIndex)
          }
          if (typeof state.isRevealed === 'boolean') {
            setIsRevealed(state.isRevealed)
          }
          if (typeof state.mcqOptionStep === 'number') {
            setMcqOptionStep(state.mcqOptionStep)
          }
          if (typeof state.rapidQuestionIdx === 'number') {
            setRapidQuestionIdx(state.rapidQuestionIdx)
          }
          if (Array.isArray(state.finalists)) {
            setFinalists(state.finalists)
          }
          if (typeof state.rapidSeconds === 'number') {
            setRapidSeconds(state.rapidSeconds)
          }
          if (typeof state.timerRunning === 'boolean') {
            setTimerRunning(state.timerRunning)
          }
          if (state.audioState) {
            setPlayingAudioId(state.audioState.playing ? state.audioState.audioId : null)
          }
        } catch {}
      }
    } catch {}

    return () => {
      if (channel) channel.close()
      if (es) es.close()
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  // Broadcast helper
  const broadcast = useCallback((msg: StageSyncMessage) => {
    if (channelRef.current) {
      channelRef.current.postMessage(msg)
    }
  }, [])

  // Save finalists to localStorage, broadcast & network sync
  const updateFinalists = useCallback(
    (newFinalists: StageFinalist[]) => {
      setFinalists(newFinalists)
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('ingenium_stage_finalists_v2', JSON.stringify(newFinalists))
        } catch {}
      }
      broadcast({ type: 'UPDATE_FINALISTS', payload: { finalists: newFinalists } })
      sendStageNetworkSync({ finalists: newFinalists })
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
    list.push({ index: idx++, title: 'Round 1 Standings & Leaderboard', round: 'R1', type: 'round_leaderboard', data: { roundName: 'Round 1 (MCQ)' } })

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
    list.push({ index: idx++, title: 'Round 2 Standings & Leaderboard', round: 'R2', type: 'round_leaderboard', data: { roundName: 'Round 2 (Audio & Image)' } })

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
    list.push({ index: idx++, title: 'Round 3 Standings & Leaderboard', round: 'R3', type: 'round_leaderboard', data: { roundName: 'Round 3 (Rapid Fire)' } })

    // Tie breaker & Podium
    list.push({ index: idx++, title: 'Tie-Breaker Arena', type: 'tie_breaker' })
    list.push({ index: idx++, title: 'Grand Victory Podium (Top 2 Prizes)', type: 'podium' })

    return list
  }, [stageData])

  // Slide navigation
  const setSlide = useCallback(
    (slideIdx: number) => {
      const clamped = Math.max(0, Math.min(slides.length - 1, slideIdx))
      setCurrentSlide(clamped)
      setIsRevealed(false)
      setPlayingAudioId(null)
      setMcqOptionStep(0)
      setRapidQuestionIdx(0)
      broadcast({ type: 'CHANGE_SLIDE', payload: { slideIndex: clamped, mcqOptionStep: 0, rapidQuestionIdx: 0 } })
      sendStageNetworkSync({
        slideIndex: clamped,
        isRevealed: false,
        mcqOptionStep: 0,
        rapidQuestionIdx: 0,
        audioState: { playing: false, audioId: null, timestamp: Date.now() },
      })
      sound.tap()
    },
    [broadcast, slides.length],
  )

  // Direct rapid question jump helper
  const jumpToRapidQuestion = useCallback(
    (idx: number) => {
      setRapidQuestionIdx(idx)
      setIsRevealed(false)
      broadcast({ type: 'RAPID_QUESTION_STEP', payload: { rapidQuestionIdx: idx } })
      sendStageNetworkSync({ rapidQuestionIdx: idx, isRevealed: false })
      sound.tap()
    },
    [broadcast],
  )

  // Step-by-step navigation helper (Reveals MCQ options / Rapid questions one-by-one or advances slide)
  const handleNext = useCallback(() => {
    const currentSlideObj = slides[currentSlide]
    if (currentSlideObj?.type === 'r1_mcq' && mcqOptionStep < 4 && !isRevealed) {
      const nextStep = mcqOptionStep + 1
      setMcqOptionStep(nextStep)
      broadcast({ type: 'MCQ_OPTION_STEP', payload: { step: nextStep } })
      sendStageNetworkSync({ mcqOptionStep: nextStep })
      sound.tap()
      return
    }

    if (currentSlideObj?.type === 'r3_rapid') {
      const questionsCount = currentSlideObj.data?.questions?.length || 5
      if (!isRevealed) {
        if (rapidQuestionIdx < questionsCount - 1) {
          const nextQ = rapidQuestionIdx + 1
          setRapidQuestionIdx(nextQ)
          broadcast({ type: 'RAPID_QUESTION_STEP', payload: { rapidQuestionIdx: nextQ } })
          sendStageNetworkSync({ rapidQuestionIdx: nextQ })
          sound.tap()
          return
        } else {
          setIsRevealed(true)
          broadcast({ type: 'TOGGLE_REVEAL', payload: { isRevealed: true } })
          sendStageNetworkSync({ isRevealed: true })
          sound.correct()
          return
        }
      }
    }

    if (currentSlide < slides.length - 1) {
      setSlide(currentSlide + 1)
    }
  }, [currentSlide, slides, mcqOptionStep, rapidQuestionIdx, isRevealed, broadcast, setSlide])

  const handlePrev = useCallback(() => {
    const currentSlideObj = slides[currentSlide]
    if (currentSlideObj?.type === 'r1_mcq' && mcqOptionStep > 0 && !isRevealed) {
      const prevStep = mcqOptionStep - 1
      setMcqOptionStep(prevStep)
      broadcast({ type: 'MCQ_OPTION_STEP', payload: { step: prevStep } })
      sendStageNetworkSync({ mcqOptionStep: prevStep })
      sound.tap()
      return
    }

    if (currentSlideObj?.type === 'r3_rapid') {
      if (isRevealed) {
        setIsRevealed(false)
        broadcast({ type: 'TOGGLE_REVEAL', payload: { isRevealed: false } })
        sendStageNetworkSync({ isRevealed: false })
        sound.tap()
        return
      } else if (rapidQuestionIdx > 0) {
        const prevQ = rapidQuestionIdx - 1
        setRapidQuestionIdx(prevQ)
        broadcast({ type: 'RAPID_QUESTION_STEP', payload: { rapidQuestionIdx: prevQ } })
        sendStageNetworkSync({ rapidQuestionIdx: prevQ })
        sound.tap()
        return
      }
    }

    if (currentSlide > 0) {
      const prevIdx = currentSlide - 1
      const prevSlideObj = slides[prevIdx]
      const targetStep = prevSlideObj?.type === 'r1_mcq' ? 4 : 0
      setCurrentSlide(prevIdx)
      setIsRevealed(false)
      setPlayingAudioId(null)
      setMcqOptionStep(targetStep)
      setRapidQuestionIdx(0)
      broadcast({ type: 'CHANGE_SLIDE', payload: { slideIndex: prevIdx, mcqOptionStep: targetStep, rapidQuestionIdx: 0 } })
      sendStageNetworkSync({
        slideIndex: prevIdx,
        isRevealed: false,
        mcqOptionStep: targetStep,
        rapidQuestionIdx: 0,
        audioState: { playing: false, audioId: null, timestamp: Date.now() },
      })
      sound.tap()
    }
  }, [currentSlide, slides, mcqOptionStep, rapidQuestionIdx, isRevealed, broadcast])

  // Toggle stage audio playback
  const toggleStageAudio = useCallback(
    (rawAudioUrl: string, audioId: string) => {
      if (!rawAudioUrl) return
      const audioUrl = rawAudioUrl.startsWith('http') || rawAudioUrl.startsWith('/') ? rawAudioUrl : '/' + rawAudioUrl
      const isCurrentlyPlaying = playingAudioId === audioId
      const nextPlaying = !isCurrentlyPlaying
      setPlayingAudioId(nextPlaying ? audioId : null)

      broadcast({
        type: 'AUDIO_ACTION',
        payload: {
          action: nextPlaying ? 'play' : 'pause',
          id: audioId,
          url: audioUrl,
          timestamp: Date.now(),
        },
      })

      sendStageNetworkSync({
        audioState: {
          playing: nextPlaying,
          audioId: nextPlaying ? audioId : null,
          audioUrl: audioUrl,
          timestamp: Date.now(),
        },
      })

      sound.tap()
    },
    [broadcast, playingAudioId],
  )

  // Toggle reveal
  const toggleReveal = useCallback(() => {
    setIsRevealed((prev) => {
      const next = !prev
      if (next) {
        setMcqOptionStep(4)
      }
      broadcast({ type: 'TOGGLE_REVEAL', payload: { isRevealed: next } })
      sendStageNetworkSync({ isRevealed: next, mcqOptionStep: next ? 4 : mcqOptionStep })
      if (next) sound.correct()
      return next
    })
  }, [broadcast, mcqOptionStep])

  // Timer controls for Rapid Fire
  const toggleTimer = useCallback(() => {
    setTimerRunning((prev) => {
      const next = !prev
      broadcast({ type: 'TIMER_ACTION', payload: { running: next, seconds: rapidSeconds } })
      sendStageNetworkSync({ timerRunning: next, rapidSeconds })
      return next
    })
  }, [broadcast, rapidSeconds])

  const resetTimer = useCallback(() => {
    setRapidSeconds(40)
    setTimerRunning(false)
    broadcast({ type: 'TIMER_ACTION', payload: { running: false, seconds: 40 } })
    sendStageNetworkSync({ timerRunning: false, rapidSeconds: 40 })
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

  const [isImporting, setIsImporting] = useState(false)
  const [importNotice, setImportNotice] = useState<string | null>(null)

  // Import Top 6 Qualifiers from Live Audience Quiz
  const handleImportQualifiers = async () => {
    setIsImporting(true)
    setImportNotice(null)
    try {
      const res = await fetch('/api/stage/qualifiers', { method: 'POST' })
      const data = await res.json()
      if (data.ok && Array.isArray(data.finalists)) {
        updateFinalists(data.finalists)
        sound.ting()
        setImportNotice('✓ Top 6 Imported!')
        setTimeout(() => setImportNotice(null), 4000)
      } else {
        alert('Could not import qualifiers: ' + (data.error || 'No participants found'))
      }
    } catch (err: any) {
      alert('Failed to import qualifiers: ' + (err.message || 'Network error'))
    } finally {
      setIsImporting(false)
    }
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
    <div className="notebook-paper min-h-screen text-slate-100 flex flex-col font-sans select-none">
      {/* 1. TOP APP HEADER (Clean, uncrowded on mobile & desktop) */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-3 sm:px-6 py-2.5 sm:py-3 border-b-2 border-[#00d2ff]/40 bg-[#081a2e]/95 backdrop-blur-md shadow-[0_4px_0px_#04101d]">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Image
            src="/yenepoya-school-engineering-and-technology.svg"
            alt="YSET"
            width={120}
            height={30}
            className="h-6 sm:h-7 w-auto object-contain brightness-110 shrink-0"
            priority
          />
          <div className="h-4 sm:h-5 w-px bg-[#00d2ff]/40 shrink-0" />
          <span className="text-xs sm:text-sm font-black text-white truncate">
            Quizmaster Deck
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="hidden md:inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider sticky-note-yellow text-[#081a2e] shadow-[1px_1px_0px_#04101d]">
            Live Stage Host
          </span>

          <Link
            href="/stage"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#00d2ff] hover:bg-[#38bdf8] text-[#081a2e] font-black text-xs border border-[#081a2e] shadow-[2px_2px_0px_#04101d] transition active:scale-95"
            title="Open Projector Presentation in another tab/window"
          >
            <span>Stage View</span> <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      {/* 2. MAIN RESPONSIVE CONTENT GRID (3 cols on PC, natural 1-col on Phone) */}
      <main className="max-w-7xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6 pb-28 lg:pb-8 flex-1">
        {/* LEFT 2 COLUMNS: Slide Controller & Quick Scoring Matrix */}
        <div className="lg:col-span-2 space-y-5">
          {/* CARD 1: ACTIVE PROJECTOR SLIDE & LIVE Q&A */}
          <div className="notebook-card p-3 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-[#7dd3fc]">
                Slide {currentSlide + 1}/{slides.length}
              </span>
              <div className="flex items-center gap-2">
                {isRevealed && (
                  <span className="lg:hidden px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black border border-emerald-500/40">
                    ✓ Revealed
                  </span>
                )}
                <span className="px-2.5 py-0.5 rounded-full bg-[#00d2ff]/20 text-[#00d2ff] text-xs font-black border border-[#00d2ff]/40">
                  {currentSlideObj?.round ? `Round ${currentSlideObj.round}` : currentSlideObj?.type}
                </span>
              </div>
            </div>

            {/* Slide Title & Reveal Button */}
            <div className="p-3 sm:p-4 rounded-2xl bg-[#081a2e] border-2 border-[#00d2ff]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
              <div>
                <span className="text-[11px] text-[#7dd3fc] font-bold block">Current Screen</span>
                <h3 className="text-sm sm:text-lg font-black text-white">{currentSlideObj?.title}</h3>
              </div>

              <button
                onClick={toggleReveal}
                className={`hidden lg:flex px-5 py-2.5 rounded-full font-black text-xs uppercase tracking-wider border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] transition shrink-0 hover:scale-105 active:scale-95 items-center gap-1.5 ${
                  isRevealed
                    ? 'bg-[#0e2e4e] text-slate-200 border-[#00d2ff]/50'
                    : 'bg-[#fbbf24] hover:bg-[#f59e0b] text-[#081a2e]'
                }`}
              >
                {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {isRevealed ? 'Hide Answer on Stage (R)' : 'Reveal Answer on Stage (R)'}
              </button>
            </div>

            {/* Live Question & Verified Answer Peek */}
            {currentSlideObj?.data && (
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#081a2e]/90 border border-[#00d2ff]/30 space-y-2 text-left">
                {/* Round 1 MCQ */}
                {currentSlideObj.type === 'r1_mcq' && (
                  <>
                    <div className="flex items-center justify-between text-xs text-[#7dd3fc] font-mono">
                      <span>Question #{currentSlideObj.qIndex! + 1} of 12</span>
                      <span className="text-[#fbbf24] font-bold">+5 Correct</span>
                    </div>
                    <p className="text-sm font-black text-white leading-snug">{currentSlideObj.data.question}</p>

                    {/* Options Step-by-Step Status & Grid */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-[11px] text-[#7dd3fc] font-bold">
                        <span>
                          Options on Stage: <strong className="text-white">{isRevealed ? 4 : mcqOptionStep}/4</strong>
                        </span>
                        {mcqOptionStep < 4 && !isRevealed && (
                          <button
                            onClick={() => {
                              setMcqOptionStep(4)
                              broadcast({ type: 'MCQ_OPTION_STEP', payload: { step: 4 } })
                              sendStageNetworkSync({ mcqOptionStep: 4 })
                              sound.tap()
                            }}
                            className="text-[10px] text-[#00d2ff] hover:underline font-black cursor-pointer"
                          >
                            Reveal All 4 Options
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {currentSlideObj.data.options.map((opt: string, optIdx: number) => {
                          const isOptRevealed = optIdx < mcqOptionStep || isRevealed
                          const isCorrect = optIdx === currentSlideObj.data.correctIndex
                          const optLetter = ['A', 'B', 'C', 'D'][optIdx]

                          return (
                            <div
                              key={optIdx}
                              className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-1.5 transition ${
                                isCorrect && isRevealed
                                  ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 font-black'
                                  : isOptRevealed
                                  ? 'bg-[#0e2e4e] border-[#00d2ff]/40 text-slate-200'
                                  : 'bg-[#081a2e]/60 border-dashed border-slate-700 text-slate-500'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span
                                  className={`w-5 h-5 rounded-md flex items-center justify-center font-black text-[10px] shrink-0 ${
                                    isCorrect && isRevealed
                                      ? 'bg-emerald-500 text-[#081a2e]'
                                      : isOptRevealed
                                      ? 'bg-[#00d2ff]/20 text-[#00d2ff]'
                                      : 'bg-slate-800 text-slate-500'
                                  }`}
                                >
                                  {optLetter}
                                </span>
                                <span className="truncate font-bold">{opt}</span>
                              </div>

                              <span className="text-[10px] shrink-0 font-bold">
                                {isCorrect && isRevealed ? (
                                  <strong className="text-emerald-400">✓ Correct</strong>
                                ) : isOptRevealed ? (
                                  <span className="text-[#7dd3fc]">Shown</span>
                                ) : (
                                  <span className="text-slate-600">Hidden</span>
                                )}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {currentSlideObj.data.explanation && (
                      <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 font-medium">
                        <span className="text-emerald-400 font-black uppercase tracking-wider block text-[10px]">
                          Correct: ({['A', 'B', 'C', 'D'][currentSlideObj.data.correctIndex]}) {currentSlideObj.data.options[currentSlideObj.data.correctIndex]}
                        </span>
                        <p className="text-[11px] text-emerald-200/80 mt-0.5">{currentSlideObj.data.explanation}</p>
                      </div>
                    )}
                  </>
                )}

                {/* Round 2 Image */}
                {currentSlideObj.type === 'r2_image' && (
                  <>
                    <div className="flex items-center justify-between text-xs text-[#7dd3fc] font-mono">
                      <span>Image #{currentSlideObj.qIndex! + 1} of 6</span>
                      <span className="text-[#fbbf24] font-bold">Dir +10 | −5 | Pass +5</span>
                    </div>
                    <p className="text-sm font-black text-white leading-snug">{currentSlideObj.data.question}</p>
                    <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-300 font-bold flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-emerald-400 font-black uppercase tracking-wider block text-[10px]">Verified Answer:</span>
                        <strong className="text-white text-sm">{currentSlideObj.data.answer}</strong>
                        {currentSlideObj.data.explanation && (
                          <p className="text-emerald-200/90 text-xs font-normal mt-1">{currentSlideObj.data.explanation}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Round 2 Audio */}
                {currentSlideObj.type === 'r2_audio' && (
                  <>
                    <div className="flex items-center justify-between text-xs text-[#7dd3fc] font-mono">
                      <span>Audio #{currentSlideObj.qIndex! + 1} of 6</span>
                      <span className="text-[#fbbf24] font-bold">Dir +10 | −5 | Pass +5</span>
                    </div>
                    <p className="text-sm font-black text-white leading-snug">{currentSlideObj.data.question}</p>

                    {/* Stage Audio Remote Trigger */}
                    <div className="p-2.5 sm:p-3 rounded-xl bg-[#0e2e4e] border-2 border-[#00d2ff]/40 flex items-center justify-between gap-2 shadow-inner">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center font-black shrink-0 transition-all ${
                            playingAudioId === currentSlideObj.data.id
                              ? 'bg-emerald-500 text-[#081a2e] animate-pulse'
                              : 'bg-[#00d2ff]/20 text-[#00d2ff] border border-[#00d2ff]/40'
                          }`}
                        >
                          <Volume2 className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] text-[#7dd3fc] font-bold block uppercase tracking-wider">
                            Stage Sound System
                          </span>
                          <span className="text-xs font-black text-white truncate block">
                            {playingAudioId === currentSlideObj.data.id
                              ? 'Playing on Stage...'
                              : 'Ready to Play on Stage'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleStageAudio(currentSlideObj.data.audioUrl, currentSlideObj.data.id)}
                        className={`px-3.5 sm:px-4 py-2 rounded-xl font-black text-xs uppercase tracking-wider border-2 border-[#081a2e] shadow-[2px_2px_0px_#04101d] transition flex items-center gap-1.5 shrink-0 active:scale-95 ${
                          playingAudioId === currentSlideObj.data.id
                            ? 'bg-rose-600 hover:bg-rose-500 text-white animate-pulse'
                            : 'bg-[#00d2ff] hover:bg-[#38bdf8] text-[#081a2e]'
                        }`}
                      >
                        {playingAudioId === currentSlideObj.data.id ? (
                          <>
                            <Pause className="w-4 h-4" /> Pause Audio
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-current" /> Play on Stage
                          </>
                        )}
                      </button>
                    </div>

                    <div className="p-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs text-emerald-300 font-bold flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-emerald-400 font-black uppercase tracking-wider block text-[10px]">Speaker / Person:</span>
                        <strong className="text-white text-sm">{currentSlideObj.data.answer}</strong>
                        {currentSlideObj.data.quote && (
                          <p className="text-emerald-200 italic text-xs mt-1">"{currentSlideObj.data.quote}"</p>
                        )}
                        {currentSlideObj.data.explanation && (
                          <p className="text-emerald-200/90 text-xs font-normal mt-1">{currentSlideObj.data.explanation}</p>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Round 3 Rapid Fire */}
                {currentSlideObj.type === 'r3_rapid' && (
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-[#fbbf24] font-black">
                      <span className="truncate">
                        Rapid Fire: {currentSlideObj.data.participantLabel} (Set {currentSlideObj.data.setNumber})
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <div
                          className={`px-2.5 py-1 rounded-lg font-mono font-black text-xs border ${
                            rapidSeconds <= 10
                              ? 'bg-rose-600 text-white animate-pulse border-rose-400'
                              : timerRunning
                              ? 'bg-[#fbbf24] text-[#081a2e] border-[#fbbf24]'
                              : 'bg-[#0e2e4e] text-[#00d2ff] border-[#00d2ff]/40'
                          }`}
                        >
                          {rapidSeconds}s
                        </div>
                        <button
                          onClick={toggleTimer}
                          className={`px-3 py-1 rounded-lg text-xs font-black shadow-sm transition active:scale-95 ${
                            timerRunning ? 'bg-rose-600 hover:bg-rose-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                          }`}
                        >
                          {timerRunning ? 'Pause' : 'Start 40s'}
                        </button>
                        <button
                          onClick={resetTimer}
                          className="p-1 rounded-lg bg-[#0e2e4e] text-slate-300 border border-[#00d2ff]/40 hover:text-white"
                          title="Reset Timer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Step selector pills: Q1, Q2, Q3, Q4, Q5 */}
                    <div className="flex items-center gap-1.5 bg-[#081a2e] p-1.5 rounded-xl border border-[#00d2ff]/30">
                      <span className="text-[10px] font-black uppercase text-[#7dd3fc] mr-1">Stage Q:</span>
                      {currentSlideObj.data.questions.map((_: any, i: number) => {
                        const isCurrent = rapidQuestionIdx === i && !isRevealed
                        return (
                          <button
                            key={i}
                            onClick={() => jumpToRapidQuestion(i)}
                            className={`flex-1 py-1 rounded-lg font-mono font-black text-xs transition border ${
                              isCurrent
                                ? 'bg-[#fbbf24] text-[#081a2e] border-[#fbbf24] shadow-sm font-black'
                                : i < rapidQuestionIdx || isRevealed
                                ? 'bg-[#0e2e4e] text-[#00d2ff] border-[#00d2ff]/40'
                                : 'bg-[#0e2e4e]/50 text-slate-400 border-transparent hover:text-white'
                            }`}
                          >
                            Q{i + 1}
                          </button>
                        )
                      })}
                      <button
                        onClick={toggleReveal}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border transition ${
                          isRevealed
                            ? 'bg-emerald-600 text-white border-emerald-400'
                            : 'bg-[#0e2e4e] text-slate-300 border-[#00d2ff]/40'
                        }`}
                      >
                        {isRevealed ? 'All Revealed' : 'Reveal'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 gap-1.5 pt-0.5 max-h-52 overflow-y-auto">
                      {currentSlideObj.data.questions.map((q: any, i: number) => {
                        const isLiveOnStage = rapidQuestionIdx === i && !isRevealed
                        return (
                          <div
                            key={i}
                            onClick={() => jumpToRapidQuestion(i)}
                            className={`p-2 rounded-xl border transition text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1 cursor-pointer ${
                              isLiveOnStage
                                ? 'bg-[#0e2e4e] border-[#fbbf24] shadow-[0_0_10px_rgba(251,191,36,0.2)]'
                                : isRevealed
                                ? 'bg-[#081a2e] border-emerald-500/40'
                                : 'bg-[#081a2e]/80 border-[#00d2ff]/20 hover:border-[#00d2ff]/50'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`w-5 h-5 rounded font-mono font-black text-[11px] flex items-center justify-center shrink-0 ${
                                  isLiveOnStage ? 'bg-[#fbbf24] text-[#081a2e]' : 'bg-[#00d2ff]/20 text-[#00d2ff]'
                                }`}
                              >
                                {i + 1}
                              </span>
                              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 rounded bg-white/10 text-slate-300 shrink-0">
                                {q.category}
                              </span>
                              <span className="text-slate-200 font-bold truncate">
                                {q.prompt}
                              </span>
                              {isLiveOnStage && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-[#fbbf24] text-[#081a2e] shrink-0">
                                  Live on Stage
                                </span>
                              )}
                            </div>
                            <strong className="text-emerald-300 shrink-0 sm:ml-2">✓ {q.answer}</strong>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Slide Navigation Buttons (Hidden on mobile — floating thumb bar handles it) */}
            <div className="hidden lg:flex items-center justify-between gap-3 pt-1">
              <button
                onClick={handlePrev}
                disabled={currentSlide === 0 && mcqOptionStep === 0 && rapidQuestionIdx === 0}
                className="flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#0e2e4e] border-2 border-[#00d2ff]/50 font-black text-xs sm:text-sm text-[#00d2ff] hover:bg-[#00d2ff] hover:text-[#081a2e] disabled:opacity-30 disabled:pointer-events-none transition flex items-center justify-center gap-1 shadow-[2px_2px_0px_#04101d] active:scale-95 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" /> Previous
              </button>

              <button
                onClick={handleNext}
                disabled={
                  currentSlide === slides.length - 1 &&
                  (currentSlideObj?.type !== 'r1_mcq' || mcqOptionStep >= 4) &&
                  (currentSlideObj?.type !== 'r3_rapid' || isRevealed)
                }
                className="flex-1 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#00d2ff] hover:bg-[#38bdf8] text-[#081a2e] font-black text-xs sm:text-sm border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] disabled:opacity-30 disabled:pointer-events-none transition flex items-center justify-center gap-1 hover:scale-[1.02] active:scale-95 cursor-pointer"
              >
                {currentSlideObj?.type === 'r1_mcq' && mcqOptionStep < 4 && !isRevealed ? (
                  <>
                    <span>Reveal Option {['A', 'B', 'C', 'D'][mcqOptionStep]} ({mcqOptionStep + 1}/4)</span>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                ) : currentSlideObj?.type === 'r3_rapid' && !isRevealed ? (
                  rapidQuestionIdx < (currentSlideObj.data?.questions?.length || 5) - 1 ? (
                    <>
                      <span>Next Question ({rapidQuestionIdx + 2}/{currentSlideObj.data?.questions?.length || 5})</span>
                      <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                    </>
                  ) : (
                    <>
                      <span>Reveal All Answers</span>
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                    </>
                  )
                ) : (
                  <>
                    <span>Next Slide</span>
                    <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </>
                )}
              </button>
            </div>

            {/* Quick Slide Jump Dropdown (Desktop only — phone uses thumb bar) */}
            <div className="hidden lg:block pt-1">
              <label className="text-[11px] font-black uppercase text-[#7dd3fc] block mb-1">
                Jump Direct to Slide
              </label>
              <select
                value={currentSlide}
                onChange={(e) => setSlide(Number(e.target.value))}
                className="w-full bg-[#081a2e] border-2 border-[#00d2ff]/40 text-white font-bold rounded-xl p-2 sm:p-2.5 text-xs outline-none focus:border-[#00d2ff]"
              >
                {slides.map((s) => (
                  <option key={s.index} value={s.index}>
                    Slide {s.index + 1}: {s.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* CARD 2: QUICK SCORE ASSIGNER (6 FINALISTS) */}
          <div className="notebook-card p-3 sm:p-6 space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#00d2ff]/30 pb-2 sm:pb-3 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-[#fbbf24] shrink-0" />
                <h3 className="font-black text-white text-sm sm:text-base truncate">Score Assigner</h3>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {importNotice && (
                  <span className="text-[10px] sm:text-xs font-black text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-lg border border-emerald-500/40">
                    {importNotice}
                  </span>
                )}
                <button
                  onClick={handleImportQualifiers}
                  disabled={isImporting}
                  className="px-2.5 sm:px-3 py-1 rounded-xl bg-[#00d2ff] hover:bg-[#38bdf8] text-[#081a2e] font-black text-[11px] sm:text-xs border border-[#081a2e] shadow-[2px_2px_0px_#04101d] transition flex items-center gap-1 active:scale-95 disabled:opacity-50 cursor-pointer"
                  title="Import Top 6 ranked participants from the live audience round"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isImporting ? 'Importing...' : 'Import Top 6'}</span>
                </button>
              </div>
            </div>

            {/* Finalist Cards Grid (Always 2 cols — compact on phone) */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-4">
              {finalists.map((f, i) => (
                <div key={f.id} className="p-2.5 sm:p-4 rounded-xl sm:rounded-2xl bg-[#081a2e] border-2 border-[#00d2ff]/40 space-y-2 sm:space-y-3 shadow-[2px_2px_0px_#04101d]">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                      <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[#00d2ff] text-[#081a2e] font-black text-[10px] sm:text-xs flex items-center justify-center shrink-0">
                        #{i + 1}
                      </span>
                      <span className="hidden sm:block"><ParticipantAvatar seed={f.avatarSeed} size="sm" /></span>
                      <input
                        type="text"
                        defaultValue={f.name}
                        onBlur={(e) => handleRename(f.id, e.target.value)}
                        className="bg-transparent font-black text-white text-xs sm:text-sm focus:bg-[#0e2e4e] rounded px-1 sm:px-1.5 py-0.5 border border-transparent focus:border-[#00d2ff] outline-none truncate max-w-[70px] sm:max-w-[140px]"
                        title="Click to rename"
                      />
                    </div>
                    <span className="font-mono font-black text-sm sm:text-lg text-[#00d2ff] shrink-0">{f.score}</span>
                  </div>

                  {/* Cohesive Point Awarding Buttons (3 Live Rounds: +10, +5, −5) */}
                  <div className="grid grid-cols-3 gap-1 sm:gap-1.5 text-xs font-black">
                    <button
                      onClick={() => adjustScore(f.id, 10, 'r2')}
                      className="py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black border border-emerald-500/60 shadow-sm transition active:scale-95 cursor-pointer"
                      title="Direct Correct / Rapid Fire (+10)"
                    >
                      +10
                    </button>
                    <button
                      onClick={() => adjustScore(f.id, 5, 'r1')}
                      className="py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-black border border-sky-500/60 shadow-sm transition active:scale-95 cursor-pointer"
                      title="MCQ / Passed (+5)"
                    >
                      +5
                    </button>
                    <button
                      onClick={() => adjustScore(f.id, -5, 'r2')}
                      className="py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-black border border-rose-500/60 shadow-sm transition active:scale-95 cursor-pointer"
                      title="Wrong Penalty (-5)"
                    >
                      −5
                    </button>
                  </div>

                  {/* Fine Adjustment Buttons (Desktop only) */}
                  <div className="hidden sm:flex items-center gap-2 text-xs font-bold pt-0.5">
                    <button
                      onClick={() => adjustScore(f.id, 1)}
                      className="flex-1 py-1 rounded-lg bg-[#0e2e4e] text-slate-200 border border-[#00d2ff]/40 hover:bg-[#00d2ff] hover:text-[#081a2e] transition active:scale-95"
                    >
                      +1 Fine
                    </button>
                    <button
                      onClick={() => adjustScore(f.id, -1)}
                      className="flex-1 py-1 rounded-lg bg-[#0e2e4e] text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white transition active:scale-95"
                    >
                      −1 Fine
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT 1 COLUMN: LIVE STAGE STANDINGS (Desktop only — scores visible in scorer above on mobile) */}
        <div className="hidden lg:block lg:col-span-1 space-y-5">
          <div className="notebook-card p-4 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b-2 border-[#00d2ff]/30 pb-3">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#fbbf24]" />
                <h3 className="font-black text-white text-base">Live Stage Standings</h3>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider sticky-note-yellow text-[#081a2e] px-2 py-0.5 rounded-full">
                2 Prizes
              </span>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              {rankedFinalists.map((f, rank) => (
                <div
                  key={f.id}
                  className={`p-3 sm:p-3.5 rounded-2xl flex items-center justify-between border-2 transition ${
                    rank === 0
                      ? 'bg-[#fbbf24]/10 border-[#fbbf24] shadow-[3px_3px_0px_#04101d]'
                      : rank === 1
                      ? 'bg-slate-800/60 border-slate-300 shadow-[2px_2px_0px_#04101d]'
                      : 'bg-[#081a2e] border-[#00d2ff]/30'
                  }`}
                >
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <span
                      className={`font-black text-sm w-5 sm:w-6 text-center ${
                        rank === 0 ? 'text-[#fbbf24]' : rank === 1 ? 'text-slate-200' : 'text-slate-400'
                      }`}
                    >
                      #{rank + 1}
                    </span>
                    <ParticipantAvatar seed={f.avatarSeed} size="sm" />
                    <div className="min-w-0">
                      <span className="font-black text-white text-sm block truncate">{f.name}</span>
                      <span className="text-[10px] text-[#7dd3fc] font-bold">
                        {rank === 0 ? '1st Place (Champion)' : rank === 1 ? '2nd Place (Runner-Up)' : `Qualifier #${rank + 1}`}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono font-black text-base sm:text-lg text-[#00d2ff] shrink-0">{f.score} pts</span>
                </div>
              ))}
            </div>

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

      {/* 3. ERGONOMIC FLOATING THUMB CONTROLS ON PHONE (Solves the scroll issue!) */}
      <div className="fixed bottom-2 left-2 right-2 z-40 lg:hidden flex items-center justify-between gap-2 p-2 rounded-2xl bg-[#081a2e]/95 backdrop-blur-md border-2 border-[#00d2ff]/60 shadow-[0_4px_16px_rgba(0,0,0,0.7)]">
        <button
          onClick={handlePrev}
          disabled={currentSlide === 0 && mcqOptionStep === 0 && rapidQuestionIdx === 0}
          className="px-3 py-2.5 rounded-xl bg-[#0e2e4e] border border-[#00d2ff]/50 text-[#00d2ff] font-black text-xs disabled:opacity-30 active:scale-95 flex items-center gap-1 shadow-sm shrink-0"
        >
          <ChevronLeft className="w-4 h-4" /> Prev
        </button>

        <button
          onClick={toggleReveal}
          className={`flex-1 py-2.5 px-2.5 rounded-xl font-black text-xs uppercase tracking-wider border-2 border-[#081a2e] shadow-sm transition flex items-center justify-center gap-1 active:scale-95 text-center truncate ${
            isRevealed
              ? 'bg-[#0e2e4e] text-slate-200 border-[#00d2ff]/50'
              : 'bg-[#fbbf24] text-[#081a2e]'
          }`}
        >
          {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {isRevealed ? 'Hide (R)' : 'Reveal (R)'}
        </button>

        <button
          onClick={handleNext}
          disabled={
            currentSlide === slides.length - 1 &&
            (currentSlideObj?.type !== 'r1_mcq' || mcqOptionStep >= 4) &&
            (currentSlideObj?.type !== 'r3_rapid' || isRevealed)
          }
          className="px-3 py-2.5 rounded-xl bg-[#00d2ff] text-[#081a2e] font-black text-xs border border-[#081a2e] disabled:opacity-30 active:scale-95 flex items-center gap-1 shadow-sm shrink-0"
        >
          {currentSlideObj?.type === 'r1_mcq' && mcqOptionStep < 4 && !isRevealed ? (
            <>
              Opt {['A', 'B', 'C', 'D'][mcqOptionStep]} ({mcqOptionStep + 1}/4) <ChevronRight className="w-4 h-4" />
            </>
          ) : currentSlideObj?.type === 'r3_rapid' && !isRevealed ? (
            rapidQuestionIdx < (currentSlideObj.data?.questions?.length || 5) - 1 ? (
              <>
                Next Q ({rapidQuestionIdx + 2}/5) <ChevronRight className="w-4 h-4" />
              </>
            ) : (
              <>
                Reveal All <Eye className="w-4 h-4" />
              </>
            )
          ) : (
            <>
              Next <ChevronRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
