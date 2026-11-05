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
import {
  type StageFinalist,
  DEFAULT_STAGE_FINALISTS,
  getStageBroadcastChannel,
  type StageSyncMessage,
  sendStageNetworkSync,
} from '@/lib/stage-sync'
import { sound } from '@/lib/client/sound'
import { ParticipantAvatar } from '@/components/participant-avatar'
import { NotebookBackgroundDecor } from '@/components/notebook-background-decor'
import {
  ANSWER_SHAPES,
  PaperClip,
  Trophy,
  Check as IconCheck,
  Cross as IconCross,
  Bolt,
} from '@/components/icons'
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  Timer as TimerIcon,
  Play,
  Pause,
  RotateCcw,
  Eye,
  EyeOff,
  Sparkles,
  Crown,
  Medal,
  Award,
  Zap,
  HelpCircle,
  Radio,
  Flame,
  Check,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ImageIcon,
  ArrowRight,
  ShieldCheck,
  FlameKindling,
  Lock,
  UserCheck,
} from 'lucide-react'

// The exact 4 Kahoot Answer Themes used across the actual quiz
const ANSWER_THEMES = [
  {
    bg: 'bg-[#e53935] text-white hover:bg-[#d32f2f]',
    border: 'border-[#b71c1c]',
    label: 'A',
  },
  {
    bg: 'bg-[#1e88e5] text-white hover:bg-[#1976d2]',
    border: 'border-[#0d47a1]',
    label: 'B',
  },
  {
    bg: 'bg-[#fb8c00] text-white hover:bg-[#f57c00]',
    border: 'border-[#e65100]',
    label: 'C',
  },
  {
    bg: 'bg-[#43a047] text-white hover:bg-[#388e3c]',
    border: 'border-[#1b5e20]',
    label: 'D',
  },
]

interface SlideItem {
  type:
    | 'error'
    | 'title'
    | 'rules'
    | 'finalists'
    | 'round_intro'
    | 'r1_mcq'
    | 'round_leaderboard'
    | 'r2_image'
    | 'r2_audio'
    | 'r3_who_am_i'
    | 'r3_rapid'
    | 'r4_intro'
    | 'r4_buzzer'
    | 'tie_breaker'
    | 'podium'
  title: string
  roundNum?: number
  roundName?: string
  data?: any
  qIndex?: number
  totalInRound?: number
}

export function StagePptPresentation({ stageData }: { stageData: StageData | null }) {
  // Slide Management
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const [mcqOptionStep, setMcqOptionStep] = useState(0)

  // Sync initial slide from URL query parameter (?slide=1)
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search)
      const s = params.get('slide')
      if (s) {
        const parsed = parseInt(s, 10)
        if (!isNaN(parsed) && parsed >= 0) {
          setCurrentSlide(parsed)
        }
      }
    } catch {}
  }, [])

  // Rapid Fire State
  const [rapidQuestionIdx, setRapidQuestionIdx] = useState(0)
  const [rapidSeconds, setRapidSeconds] = useState(60)
  const [timerRunning, setTimerRunning] = useState(false)
  const [rapidRevealMode, setRapidRevealMode] = useState<Record<number, boolean>>({})

  // Audio Playback State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null)
  const [audioProgress, setAudioProgress] = useState(0)
  const [audioDuration, setAudioDuration] = useState(0)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Stage Scoreboard State (Persisted in localStorage & synchronized with /stage/control)
  const [finalists, setFinalists] = useState<StageFinalist[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('technova_stage_finalists_v1')
        if (saved) return JSON.parse(saved)
      } catch {}
    }
    return DEFAULT_STAGE_FINALISTS
  })

  // Broadcast channel for sync with /stage/control
  const channelRef = useRef<BroadcastChannel | null>(null)
  const lastAudioTimestamp = useRef<number>(0)
  const currentPlayingUrlRef = useRef<string | null>(null)

  // Broadcast helper
  const broadcast = useCallback((msg: StageSyncMessage) => {
    if (channelRef.current) {
      channelRef.current.postMessage(msg)
    }
  }, [])

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    setPlayingAudioId(null)
    setAudioProgress(0)
  }, [])

  const pauseAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
    }
    setPlayingAudioId(null)
  }, [])

  const playAudio = useCallback((rawUrl: string, id: string) => {
    if (!rawUrl) return
    const url = rawUrl.startsWith('http') || rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl

    // If same audio is already loaded, resume without recreating Audio object
    if (audioRef.current && currentPlayingUrlRef.current === url && audioRef.current.paused) {
      setPlayingAudioId(id)
      const playPromise = audioRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Stage audio resume notice:', err)
          setPlayingAudioId(null)
        })
      }
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    const audio = new Audio(url)
    audio.preload = 'auto'
    audioRef.current = audio
    currentPlayingUrlRef.current = url
    setPlayingAudioId(id)

    audio.ontimeupdate = () => {
      setAudioProgress(audio.currentTime)
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(audio.duration)
      }
    }

    audio.onloadedmetadata = () => {
      if (audio.duration && !isNaN(audio.duration)) {
        setAudioDuration(audio.duration)
      }
    }

    audio.onended = () => {
      setPlayingAudioId(null)
      setAudioProgress(0)
      const ts = Date.now()
      lastAudioTimestamp.current = ts
      broadcast({ type: 'AUDIO_ACTION', payload: { action: 'stop', id, url, timestamp: ts } })
      sendStageNetworkSync({
        audioState: {
          playing: false,
          audioId: null,
          timestamp: ts,
        },
      })
    }

    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Stage audio playback auto-play notice:', err)
        setPlayingAudioId(null)
      })
    }
  }, [broadcast])

  useEffect(() => {
    const channel = getStageBroadcastChannel()
    channelRef.current = channel

    if (channel) {
      channel.onmessage = (event: MessageEvent<StageSyncMessage>) => {
        const { type, payload } = event.data
        if (type === 'CHANGE_SLIDE') {
          setCurrentSlide(payload.slideIndex)
          setIsRevealed(false)
          setTimerRunning(false)
          setRapidSeconds(60)
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
          if (typeof payload.running === 'boolean') {
            setTimerRunning(payload.running)
          }
          if (typeof payload.seconds === 'number') {
            setRapidSeconds(payload.seconds)
          }
        } else if (type === 'AUDIO_ACTION') {
          const { action, id, url, timestamp } = payload
          if (timestamp && timestamp > lastAudioTimestamp.current) {
            lastAudioTimestamp.current = timestamp
            if (action === 'play' && url && id) {
              playAudio(url, id)
            } else if (action === 'pause') {
              pauseAudio()
            } else if (action === 'stop') {
              stopAudio()
            }
          }
        }
      }
    }

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'technova_stage_finalists_v1' && e.newValue) {
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
          if (typeof state.timerRunning === 'boolean') {
            setTimerRunning(state.timerRunning)
          }
          if (typeof state.rapidSeconds === 'number') {
            setRapidSeconds(state.rapidSeconds)
          }
          if (state.audioState) {
            const { playing, audioId, audioUrl, timestamp } = state.audioState
            if (timestamp && timestamp > lastAudioTimestamp.current) {
              lastAudioTimestamp.current = timestamp
              if (playing && audioUrl && audioId) {
                playAudio(audioUrl, audioId)
              } else {
                pauseAudio()
              }
            }
          }
        } catch {}
      }
    } catch {}

    return () => {
      if (channel) channel.close()
      if (es) es.close()
      window.removeEventListener('storage', handleStorage)
    }
  }, [playAudio, pauseAudio, stopAudio, broadcast])

  // Stop audio on slide change
  useEffect(() => {
    stopAudio()
  }, [currentSlide, stopAudio])

  // Auto-sync Top 6 Qualifiers on mount if currently using default placeholders
  useEffect(() => {
    const isUsingPlaceholders =
      !finalists ||
      finalists.length === 0 ||
      finalists.some(
        (f) =>
          f.name.startsWith('Team ') ||
          f.name.startsWith('Finalist ') ||
          f.name === 'Team Alpha' ||
          f.name === 'Finalist 1',
      )

    if (isUsingPlaceholders) {
      fetch('/api/stage/qualifiers', { method: 'POST' })
        .then((r) => r.json())
        .then((data) => {
          if (data.ok && Array.isArray(data.finalists) && data.finalists.length > 0) {
            const hasRealNames = data.finalists.some(
              (f: StageFinalist) =>
                !f.name.startsWith('Team ') &&
                !f.name.startsWith('Finalist '),
            )
            if (hasRealNames) {
              setFinalists(data.finalists)
              try {
                localStorage.setItem('technova_stage_finalists_v1', JSON.stringify(data.finalists))
              } catch {}
            }
          }
        })
        .catch(() => {})
    }
  }, [])

  // Save finalists to localStorage & broadcast
  useEffect(() => {
    try {
      localStorage.setItem('technova_stage_finalists_v1', JSON.stringify(finalists))
    } catch {}
  }, [finalists])

  // Slide list definition with Leaderboard after each round
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
    // Leaderboard after Round 1
    list.push({
      type: 'round_leaderboard',
      title: 'Round 1 Complete — Current Standings',
      roundNum: 1,
      roundName: 'Round 1 (MCQ)',
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
    // Audio questions (if any)
    if (stageData.round2.audios && stageData.round2.audios.length > 0) {
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
    }
    // Leaderboard after Round 2
    list.push({
      type: 'round_leaderboard',
      title: 'Round 2 Complete — Cumulative Standings',
      roundNum: 2,
      roundName: 'Round 2 (Image Round)',
    })

    // Round 3: Who Am I? or Rapid Fire
    list.push({ type: 'round_intro', title: stageData.round3.name, roundNum: 3, data: stageData.round3 })
    if (stageData.round3.questions && stageData.round3.questions.length > 0) {
      stageData.round3.questions.forEach((q, idx) => {
        list.push({
          type: 'r3_who_am_i',
          title: `Round 3 — Who Am I? ${q.participantLabel} (Q${q.number})`,
          roundNum: 3,
          data: q,
          qIndex: idx,
          totalInRound: stageData.round3.questions?.length || 6,
        })
      })
    } else if (stageData.round3.sets) {
      const sets = stageData.round3.sets
      sets.forEach((set, idx) => {
        list.push({
          type: 'r3_rapid',
          title: `Round 3 — Rapid Fire: ${set.participantLabel} (Set ${set.setNumber})`,
          roundNum: 3,
          data: set,
          qIndex: idx,
          totalInRound: sets.length,
        })
      })
    }
    // Leaderboard after Round 3
    list.push({
      type: 'round_leaderboard',
      title: 'Round 3 Complete — Pre-Finals Sprint Standings',
      roundNum: 3,
      roundName: stageData.round3.questions?.length ? 'Round 3 (Who Am I?)' : 'Round 3 (Rapid Fire)',
    })

    // Tie Breaker & Podium
    list.push({ type: 'tie_breaker', title: 'Tie-Breaker Arena' })
    list.push({ type: 'podium', title: 'Grand Finale — Victory Ceremony (Top 2 Prizes)' })

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

  // Rapid Fire & Who Am I? Timer toggle / reset actions
  const toggleRapidTimer = useCallback(() => {
    const isR3WhoAmI = slides[currentSlide]?.type === 'r3_who_am_i'
    const defaultSecs = isR3WhoAmI ? 15 : 60
    const nextRunning = !timerRunning
    const secs = rapidSeconds <= 0 ? defaultSecs : rapidSeconds
    setTimerRunning(nextRunning)
    setRapidSeconds(secs)
    broadcast({ type: 'TIMER_ACTION', payload: { running: nextRunning, seconds: secs } })
    sendStageNetworkSync({ timerRunning: nextRunning, rapidSeconds: secs })
  }, [timerRunning, rapidSeconds, broadcast, currentSlide, slides])

  const resetRapidTimer = useCallback(() => {
    const isR3WhoAmI = slides[currentSlide]?.type === 'r3_who_am_i'
    const defaultSecs = isR3WhoAmI ? 15 : 60
    setTimerRunning(false)
    setRapidSeconds(defaultSecs)
    setRapidQuestionIdx(0)
    broadcast({ type: 'TIMER_ACTION', payload: { running: false, seconds: defaultSecs } })
    sendStageNetworkSync({ timerRunning: false, rapidSeconds: defaultSecs, rapidQuestionIdx: 0 })
  }, [broadcast, currentSlide, slides])

  // Sound FX cues for timer countdown
  const prevRapidSecs = useRef(rapidSeconds)
  useEffect(() => {
    if (prevRapidSecs.current > 0 && rapidSeconds === 0) {
      sound.wrong()
    } else if (rapidSeconds <= 5 && rapidSeconds > 0 && timerRunning && prevRapidSecs.current !== rapidSeconds) {
      sound.tick()
    }
    prevRapidSecs.current = rapidSeconds
  }, [rapidSeconds, timerRunning])

  // Confetti on Podium slide (2 Prizes Finale)
  useEffect(() => {
    if (slide?.type === 'podium') {
      sound.celebrate()
      const duration = 5 * 1000
      const end = Date.now() + duration
      const interval: NodeJS.Timeout = setInterval(() => {
        if (Date.now() > end) {
          return clearInterval(interval)
        }
        confetti({
          startVelocity: 40,
          spread: 360,
          ticks: 80,
          origin: {
            x: Math.random(),
            y: Math.random() - 0.2,
          },
        })
      }, 350)
      return () => clearInterval(interval)
    }
  }, [slide?.type])

  // Jump directly to a rapid question
  const jumpToRapidQuestion = useCallback(
    (idx: number) => {
      setRapidQuestionIdx(idx)
      setIsRevealed(false)
      broadcast({ type: 'RAPID_QUESTION_STEP', payload: { rapidQuestionIdx: idx } })
      sendStageNetworkSync({ rapidQuestionIdx: idx, isRevealed: false })
      sound.tap()
    },
    [broadcast]
  )

  // Next / Prev slide handlers
  const nextSlide = useCallback(() => {
    const currentSlideObj = slides[currentSlide]

    // Multi-step reveals for Round 1 MCQ & Round 2 Image MCQ (Step through options 1, 2, 3, 4 one-by-one)
    if ((currentSlideObj?.type === 'r1_mcq' || currentSlideObj?.type === 'r2_image') && !isRevealed) {
      if (mcqOptionStep < 4) {
        const nextStep = mcqOptionStep + 1
        setMcqOptionStep(nextStep)
        broadcast({ type: 'MCQ_OPTION_STEP', payload: { step: nextStep } })
        sendStageNetworkSync({ mcqOptionStep: nextStep })
        sound.tap()
        return
      }
    }

    // Step-by-step progressive clues for Round 3 Who Am I?
    if (currentSlideObj?.type === 'r3_who_am_i') {
      const hintCount = currentSlideObj.data?.hints?.length || 4
      if (!isRevealed) {
        if (rapidQuestionIdx < hintCount - 1) {
          const nextHint = rapidQuestionIdx + 1
          setRapidQuestionIdx(nextHint)
          setRapidSeconds(15)
          setTimerRunning(false)
          broadcast({ type: 'RAPID_QUESTION_STEP', payload: { rapidQuestionIdx: nextHint } })
          broadcast({ type: 'TIMER_ACTION', payload: { running: false, seconds: 15 } })
          sendStageNetworkSync({ rapidQuestionIdx: nextHint, rapidSeconds: 15, timerRunning: false })
          sound.tap()
          return
        } else {
          setIsRevealed(true)
          setTimerRunning(false)
          broadcast({ type: 'TOGGLE_REVEAL', payload: { isRevealed: true } })
          broadcast({ type: 'TIMER_ACTION', payload: { running: false, seconds: 0 } })
          sendStageNetworkSync({ isRevealed: true, timerRunning: false })
          sound.correct()
          return
        }
      }
    }

    // Step-by-step questions for Round 3 Rapid Fire (advance through Q1->Q2->Q3 without revealing answer)
    if (currentSlideObj?.type === 'r3_rapid') {
      const qCount = currentSlideObj.data?.questions?.length || 5
      if (!isRevealed) {
        if (rapidQuestionIdx < qCount - 1) {
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
      const nextIdx = currentSlide + 1
      const isNextR3 = slides[nextIdx]?.type === 'r3_who_am_i'
      const initSecs = isNextR3 ? 15 : 60
      setCurrentSlide(nextIdx)
      setIsRevealed(false)
      setTimerRunning(false)
      setRapidSeconds(initSecs)
      setMcqOptionStep(0)
      setRapidQuestionIdx(0)
      broadcast({ type: 'CHANGE_SLIDE', payload: { slideIndex: nextIdx, mcqOptionStep: 0, rapidQuestionIdx: 0 } })
      broadcast({ type: 'TIMER_ACTION', payload: { running: false, seconds: initSecs } })
      sendStageNetworkSync({ slideIndex: nextIdx, isRevealed: false, mcqOptionStep: 0, rapidQuestionIdx: 0, timerRunning: false, rapidSeconds: initSecs })
      sound.tap()
    }
  }, [currentSlide, slides, mcqOptionStep, rapidQuestionIdx, isRevealed, broadcast])

  const prevSlide = useCallback(() => {
    const currentSlideObj = slides[currentSlide]
    if ((currentSlideObj?.type === 'r1_mcq' || currentSlideObj?.type === 'r2_image') && mcqOptionStep > 0 && !isRevealed) {
      const prevStep = mcqOptionStep - 1
      setMcqOptionStep(prevStep)
      broadcast({ type: 'MCQ_OPTION_STEP', payload: { step: prevStep } })
      sendStageNetworkSync({ mcqOptionStep: prevStep })
      sound.tap()
      return
    }

    if (currentSlideObj?.type === 'r3_who_am_i') {
      if (isRevealed) {
        setIsRevealed(false)
        broadcast({ type: 'TOGGLE_REVEAL', payload: { isRevealed: false } })
        sendStageNetworkSync({ isRevealed: false })
        sound.tap()
        return
      } else if (rapidQuestionIdx > 0) {
        const prevHint = rapidQuestionIdx - 1
        setRapidQuestionIdx(prevHint)
        setRapidSeconds(15)
        setTimerRunning(false)
        broadcast({ type: 'RAPID_QUESTION_STEP', payload: { rapidQuestionIdx: prevHint } })
        broadcast({ type: 'TIMER_ACTION', payload: { running: false, seconds: 15 } })
        sendStageNetworkSync({ rapidQuestionIdx: prevHint, rapidSeconds: 15, timerRunning: false })
        sound.tap()
        return
      }
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
      const isPrevR3 = prevSlideObj?.type === 'r3_who_am_i'
      const initSecs = isPrevR3 ? 15 : 60
      const targetStep = (prevSlideObj?.type === 'r1_mcq' || prevSlideObj?.type === 'r2_image') ? 4 : 0
      setCurrentSlide(prevIdx)
      setIsRevealed(false)
      setTimerRunning(false)
      setRapidSeconds(initSecs)
      setMcqOptionStep(targetStep)
      setRapidQuestionIdx(0)
      broadcast({ type: 'CHANGE_SLIDE', payload: { slideIndex: prevIdx, mcqOptionStep: targetStep, rapidQuestionIdx: 0 } })
      broadcast({ type: 'TIMER_ACTION', payload: { running: false, seconds: initSecs } })
      sendStageNetworkSync({ slideIndex: prevIdx, isRevealed: false, mcqOptionStep: targetStep, rapidQuestionIdx: 0, timerRunning: false, rapidSeconds: initSecs })
      sound.tap()
    }
  }, [currentSlide, slides, mcqOptionStep, rapidQuestionIdx, isRevealed, broadcast])

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

  // Audio Playback toggle
  const togglePlayAudio = useCallback(
    (url: string, id: string) => {
      const ts = Date.now()
      lastAudioTimestamp.current = ts
      if (playingAudioId === id && audioRef.current && !audioRef.current.paused) {
        pauseAudio()
        broadcast({ type: 'AUDIO_ACTION', payload: { action: 'pause', id, url, timestamp: ts } })
        sendStageNetworkSync({ audioState: { playing: false, audioId: null, timestamp: ts } })
      } else {
        playAudio(url, id)
        broadcast({ type: 'AUDIO_ACTION', payload: { action: 'play', id, url, timestamp: ts } })
        sendStageNetworkSync({ audioState: { playing: true, audioId: id, audioUrl: url, timestamp: ts } })
      }
    },
    [playingAudioId, playAudio, pauseAudio, broadcast],
  )

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
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault()
        toggleReveal()
      } else if (e.key === ' ') {
        e.preventDefault()
        if (slide.type === 'r3_rapid' || slide.type === 'r3_who_am_i') {
          toggleRapidTimer()
        } else {
          nextSlide()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [nextSlide, prevSlide, toggleReveal, toggleRapidTimer, slide?.type])

  // Ranked Finalists
  const rankedFinalists = useMemo(() => {
    return [...finalists].sort((a, b) => b.score - a.score)
  }, [finalists])

  if (!stageData) {
    return (
      <div className="notebook-paper min-h-screen text-white flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
        <NotebookBackgroundDecor minimal />
        <div className="relative z-10 p-6 rounded-3xl notebook-card max-w-md">
          <AlertTriangle className="w-16 h-16 text-[#fbbf24] mx-auto mb-4 animate-bounce" />
          <h1 className="text-2xl font-black mb-2 text-white">Stage Data Encrypted / Key Required</h1>
          <p className="text-slate-300 text-sm mb-6 leading-relaxed">
            Please make sure <code className="text-[#c084fc] bg-[#16082b] px-2 py-0.5 rounded">QUIZ_SEED_KEY</code> is configured in your environment.
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-2.5 rounded-full bg-[#7c3aed] text-white font-black border-2 border-[#1e0e38] shadow-[3px_3px_0px_#090214] transition hover:scale-105"
          >
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="notebook-paper relative w-screen h-screen text-slate-100 flex flex-col overflow-hidden font-sans select-none">
      {/* 100% Authentic Blueprint Vector Schematics Background Matching Rest of Site */}
      <NotebookBackgroundDecor minimal />

      {/* Clean Presentation Top Bar (Projector Ready) */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-2.5 border-b-2 border-[#8b5cf6]/40 bg-[#16082b]/90 backdrop-blur-md shadow-[0_4px_0px_#090214]">
        <div className="flex items-center gap-3">
          <Image
            src="/yenepoya-school-engineering-and-technology.svg"
            alt="Yenepoya School of Engineering & Technology"
            width={140}
            height={36}
            className="h-7 sm:h-8 w-auto object-contain brightness-110"
            priority
          />
          <div className="h-5 w-px bg-[#7c3aed]/40" />
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider sticky-note-yellow text-[#1e0e38] shadow-[2px_2px_0px_#090214]">
              Live Stage Quiz
            </span>
            <span className="text-xs text-[#7dd3fc] font-bold hidden md:inline">
              Slide {currentSlide + 1} / {slides.length}
            </span>
          </div>
        </div>

        {/* Clean Controls: Fullscreen Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-[#1e0e38] text-[#c084fc] border-2 border-[#8b5cf6]/60 shadow-[2px_2px_0px_#090214] hover:bg-[#7c3aed] hover:text-white transition"
            title="Toggle Fullscreen (Key: F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Slide Canvas */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-3 sm:p-6 md:p-8 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, scale: 0.98, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 1.01, y: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="w-full max-w-5xl h-full flex flex-col justify-center"
          >
            {/* SLIDE TYPE: Title */}
            {slide.type === 'title' && (
              <div className="text-center flex flex-col items-center justify-center py-6">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full sticky-note-yellow font-black text-xs uppercase tracking-wider text-[#1e0e38] mb-4 -rotate-1 shadow-[2px_2px_0px_#090214]"
                >
                  <PaperClip className="w-4 h-4 text-[#1e0e38]" />
                  Yenepoya School of Engineering & Technology
                </motion.div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black tracking-tight text-white mb-3 text-ink drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
                  {stageData.title}
                </h1>

                <p className="text-base md:text-xl text-[#7dd3fc] max-w-2xl font-bold mb-8 leading-relaxed">
                  {stageData.subtitle}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full max-w-4xl mb-8">
                  <div className="p-4 rounded-2xl notebook-card text-center">
                    <div className="text-xs uppercase text-[#7dd3fc] font-black tracking-wider mb-1">Round 1</div>
                    <div className="text-lg font-black text-[#c084fc]">MCQ Arena</div>
                    <div className="text-xs text-slate-300 font-semibold">+10 pts • No Negative</div>
                  </div>
                  <div className="p-4 rounded-2xl notebook-card text-center">
                    <div className="text-xs uppercase text-[#7dd3fc] font-black tracking-wider mb-1">Round 2</div>
                    <div className="text-lg font-black text-[#38bdf8]">Image Round</div>
                    <div className="text-xs text-slate-300 font-semibold">4 Options • +10 / −5 pts</div>
                  </div>
                  <div className="p-4 rounded-2xl notebook-card text-center">
                    <div className="text-xs uppercase text-[#7dd3fc] font-black tracking-wider mb-1">Round 3</div>
                    <div className="text-lg font-black text-[#fbbf24]">Who Am I?</div>
                    <div className="text-xs text-slate-300 font-semibold">4 Hints (15s) • Up to +20 pts</div>
                  </div>
                </div>

                <button
                  onClick={nextSlide}
                  className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-[#7c3aed] hover:bg-[#8b5cf6] text-white text-lg font-black border-2 border-[#1e0e38] shadow-[4px_4px_0px_#090214] transition-transform hover:scale-105 active:scale-95"
                >
                  Start Stage Quiz <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* SLIDE TYPE: Rules (Clean, Balanced & High-Impact Layout) */}
            {slide.type === 'rules' && (
              <div className="flex flex-col h-full justify-between p-2 sm:p-4 max-w-5xl mx-auto w-full select-none">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 rounded-2xl bg-[#7c3aed] text-white border-2 border-[#1e0e38] shadow-[3px_3px_0px_#090214]">
                      <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-[#c084fc]">
                        Quiz Regulations & Guidelines
                      </span>
                      <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white">
                        Official Stage Rules
                      </h2>
                    </div>
                  </div>

                  <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider sticky-note-yellow text-[#1e0e38] border-2 border-[#1e0e38] shadow-[2px_2px_0px_#090214]">
                    3 Finale Rounds • Top 6 Qualifiers
                  </span>
                </div>

                {/* Main 3-Column Round Cards (High Contrast, Beautiful Hierarchy) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-auto">
                  {/* ROUND 1 */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="p-3.5 sm:p-4 rounded-2xl notebook-card border-2 border-[#8b5cf6]/40 flex flex-col justify-between space-y-3 shadow-[3px_3px_0px_#090214]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-[#7c3aed]/30 text-[#c084fc] border border-[#8b5cf6]/50">
                          Round 1
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          +10 Correct • 0 Wrong
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white mb-2 flex items-center gap-1.5">
                        <HelpCircle className="w-4 h-4 text-[#c084fc]" /> MCQ Arena
                      </h3>
                      <ul className="text-xs text-slate-200 font-semibold space-y-1.5 pl-1">
                        <li className="flex items-start gap-1.5">
                          <span className="text-[#c084fc] font-black">•</span>
                          <span><strong>2 Questions</strong> per finalist (12 total)</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-[#c084fc] font-black">•</span>
                          <span><strong>4 Options</strong> (A, B, C, D) on screen</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-[#c084fc] font-black">•</span>
                          <span><strong>No negative points</strong> for wrong answers</span>
                        </li>
                      </ul>
                    </div>
                    <div className="p-2 rounded-xl bg-[#1e0e38]/70 border border-[#8b5cf6]/30 text-[11px] font-bold text-slate-300">
                      💡 Tech & AI fact revealed after each answer
                    </div>
                  </motion.div>

                  {/* ROUND 2 */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-3.5 sm:p-4 rounded-2xl notebook-card border-2 border-[#38bdf8]/40 flex flex-col justify-between space-y-3 shadow-[3px_3px_0px_#090214]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/40">
                          Round 2
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          +10 Correct • −5 Wrong
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white mb-2 flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-sky-400" /> Image Round
                      </h3>
                      <ul className="text-xs text-slate-200 font-semibold space-y-1.5 pl-1">
                        <li className="flex items-start gap-1.5">
                          <span className="text-sky-400 font-black">•</span>
                          <span><strong>1 Visual Clue</strong> per finalist (6 total)</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-sky-400 font-black">•</span>
                          <span><strong>4 Options</strong> displayed on projector</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-sky-400 font-black">•</span>
                          <span><strong>−5 Penalty</strong> for incorrect answer</span>
                        </li>
                      </ul>
                    </div>
                    <div className="p-2 rounded-xl bg-[#081a2e]/70 border border-sky-500/30 text-[11px] font-bold text-sky-200">
                      🎯 Identify robots, inventions & historic hardware
                    </div>
                  </motion.div>

                  {/* ROUND 3 */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="p-3.5 sm:p-4 rounded-2xl notebook-card border-2 border-[#fbbf24]/40 flex flex-col justify-between space-y-3 shadow-[3px_3px_0px_#090214]"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Round 3
                        </span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                          +20 / +15 / +10 / +5 pts
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-white mb-2 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-[#fbbf24]" /> Who Am I?
                      </h3>
                      <ul className="text-xs text-slate-200 font-semibold space-y-1.5 pl-1">
                        <li className="flex items-start gap-1.5">
                          <span className="text-[#fbbf24] font-black">•</span>
                          <span><strong>4 Progressive Clues</strong> (15s timer each)</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-[#fbbf24] font-black">•</span>
                          <span><strong>No options</strong> • Image starts blurred</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <span className="text-[#fbbf24] font-black">•</span>
                          <span>Portrait unblurs on answer reveal</span>
                        </li>
                      </ul>
                    </div>
                    <div className="p-2 rounded-xl bg-[#2e1d05]/70 border border-amber-500/30 text-[11px] font-bold text-amber-200">
                      ⚡ 1st Hint: +20 | 2nd: +15 | 3rd: +10 | 4th: +5
                    </div>
                  </motion.div>
                </div>

                {/* Tournament Regulations & Fair Play Grid (4 sleek cards) */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 my-2.5">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-[#16082b] border border-[#8b5cf6]/30 flex items-center gap-2">
                    <UserCheck className="w-3.5 h-3.5 text-[#c084fc] shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-200 leading-tight">6 Finalists compete individually</span>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-[#16082b] border border-[#8b5cf6]/30 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-200 leading-tight">No phones or external assistance</span>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-[#16082b] border border-[#8b5cf6]/30 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-200 leading-tight">Quizmaster decision is final</span>
                  </div>
                  <div className="p-2 sm:p-2.5 rounded-xl bg-[#16082b] border border-[#8b5cf6]/30 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="text-[10px] sm:text-[11px] font-bold text-slate-200 leading-tight">Tie-breaker question on deadlock</span>
                  </div>
                </div>

                {/* Clean Bottom Navigation Bar */}
                <div className="flex items-center justify-between pt-2.5 border-t-2 border-[#8b5cf6]/30">
                  <span className="text-xs text-[#7dd3fc] font-bold">Press Space or Arrow Right to proceed</span>
                  <button
                    onClick={nextSlide}
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#7c3aed] hover:bg-[#8b5cf6] font-black text-white border-2 border-[#1e0e38] shadow-[3px_3px_0px_#090214] transition hover:scale-105 active:scale-95 cursor-pointer text-xs sm:text-sm"
                  >
                    Meet Finalists <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SLIDE TYPE: Finalists Intro (Clean Projector Presentation) */}
            {slide.type === 'finalists' && (
              <div className="flex flex-col h-full justify-center p-2 sm:p-4">
                <div className="text-center mb-6">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full sticky-note-yellow text-[#1e0e38] text-xs font-black uppercase tracking-wider mb-2 -rotate-1 shadow-[2px_2px_0px_#090214]">
                    <Crown className="w-4 h-4 text-[#1e0e38]" /> Stage Qualifiers
                  </div>
                  <h2 className="text-3xl md:text-5xl font-black text-white">Meet the Top 6 Finalists</h2>
                  <p className="text-[#7dd3fc] text-xs font-bold mt-1">6 Stage Competitors • 3 Live Rounds</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-6">
                  {finalists.map((finalist, idx) => (
                    <motion.div
                      key={finalist.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="flex flex-col items-center p-4 rounded-2xl notebook-card text-center group"
                    >
                      <div className="relative mb-2.5">
                        <ParticipantAvatar seed={finalist.avatarSeed} size="lg" className="ring-2 ring-[#c084fc]" />
                        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-[#fbbf24] text-[#1e0e38] font-black text-xs flex items-center justify-center border border-[#1e0e38]">
                          #{idx + 1}
                        </div>
                      </div>

                      <span className="w-full text-center font-black text-white text-xs md:text-sm truncate block">
                        {finalist.name}
                      </span>

                      <div className="mt-2.5 w-full pt-2 border-t-2 border-[#8b5cf6]/30 flex items-center justify-between text-xs">
                        <span className="text-[#7dd3fc] font-bold">Score</span>
                        <span className="font-mono font-black text-[#c084fc] text-sm">{finalist.score} pts</span>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="flex items-center justify-center">
                  <button
                    onClick={nextSlide}
                    className="flex items-center gap-2 px-8 py-3 rounded-full bg-[#7c3aed] hover:bg-[#8b5cf6] font-black text-white border-2 border-[#1e0e38] shadow-[4px_4px_0px_#090214] transition hover:scale-105"
                  >
                    Enter Round 1 (MCQ) <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SLIDE TYPE: Round Intro */}
            {slide.type === 'round_intro' && (
              <div className="text-center flex flex-col items-center justify-center py-8">
                <div className="w-16 h-16 rounded-3xl notebook-card flex items-center justify-center mb-5 text-[#c084fc]">
                  {slide.roundNum === 1 && <HelpCircle className="w-8 h-8" />}
                  {slide.roundNum === 2 && <Radio className="w-8 h-8" />}
                  {slide.roundNum === 3 && <Flame className="w-8 h-8 text-[#fbbf24]" />}
                </div>

                <span className="text-xs font-black uppercase tracking-widest text-[#c084fc] mb-1">
                  Round {slide.roundNum}
                </span>

                <h2 className="text-3xl md:text-5xl lg:text-6xl font-black text-white mb-3">{slide.data?.name}</h2>
                <p className="text-base md:text-lg text-[#7dd3fc] max-w-xl mb-6 font-bold leading-relaxed">{slide.data?.ruleText}</p>

                <button
                  onClick={nextSlide}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#7c3aed] hover:bg-[#8b5cf6] text-white font-black border-2 border-[#1e0e38] shadow-[4px_4px_0px_#090214] transition hover:scale-105"
                >
                  Start Round {slide.roundNum} <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* SLIDE TYPE: Round 1 MCQ (Clean Centered Question Card & Kahoot Answer Tiles) */}
            {slide.type === 'r1_mcq' && (
              <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-center my-auto px-4 select-none h-full py-4">
                <div className="w-full flex flex-col items-center justify-center space-y-4 my-auto">
                  {/* Header bar: Round badge, Score pill */}
                  <div className="w-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl sticky-note-yellow border-2 border-[#1e0e38] text-[#1e0e38] font-black text-xs sm:text-sm shadow-[2px_2px_0px_#090214] shrink-0">
                      <PaperClip className="w-4 h-4 text-[#1e0e38]" />
                      <span>Round 1 • Question</span>
                      <span className="tnum font-black ml-0.5">
                        {slide.qIndex! + 1}/{slide.totalInRound}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl sticky-note-lavender border-2 border-[#1e0e38] text-[#1e0e38] font-black text-xs sm:text-sm shadow-[2px_2px_0px_#090214]">
                      <Trophy className="w-4 h-4 text-[#1e0e38]" />
                      <span>+{stageData?.round1?.points?.correct || 10} Points</span>
                    </div>
                  </div>

                  {/* Question Prompt Card */}
                  <div className="w-full notebook-card p-6 md:p-8 text-center space-y-3">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-ink leading-snug whitespace-pre-line">
                      {slide.data.question}
                    </h2>
                  </div>

                  {/* 4 Kahoot-Style Vibrant Options Grid (Smooth Drop-In Reveal One by One) */}
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {slide.data.options.map((opt: string, idx: number) => {
                      const isOptionRevealed = idx < mcqOptionStep || isRevealed
                      const isCorrect = idx === slide.data.correctIndex
                      const theme = ANSWER_THEMES[idx % ANSWER_THEMES.length]
                      const Shape = ANSWER_SHAPES[idx % ANSWER_SHAPES.length]

                      let buttonStyles = `${theme.bg} ${theme.border} shadow-md`
                      if (isRevealed) {
                        if (isCorrect) {
                          buttonStyles = 'bg-[#10b981] text-white ring-4 ring-emerald-300 shadow-xl border-b-[#059669]'
                        } else {
                          buttonStyles = 'bg-[#1e0e38]/80 text-[#64748b] opacity-35 border-[#3b0764]'
                        }
                      }

                      return (
                        <div key={idx} className="relative w-full min-h-[4.5rem]">
                          {/* Fall-Into-Place Smooth Option Card (Invisible until revealed) */}
                          <AnimatePresence mode="wait">
                            {isOptionRevealed && (
                              <motion.div
                                initial={{ opacity: 0, y: -30, scale: 0.98 }}
                                animate={{
                                  opacity: isRevealed && !isCorrect ? 0.35 : 1,
                                  scale: isRevealed && isCorrect ? 1.02 : 1,
                                  y: 0,
                                }}
                                exit={{ opacity: 0, y: 15 }}
                                transition={{
                                  duration: 0.38,
                                  ease: [0.16, 1, 0.3, 1], // Deceleration curve (smooth touchdown with zero jerk)
                                }}
                                style={{ willChange: 'transform, opacity' }}
                                className={`relative w-full h-full min-h-[4.5rem] p-4 rounded-2xl border-b-4 flex items-center justify-between select-none text-left cursor-default ${buttonStyles}`}
                              >
                                <div className="flex items-center gap-3.5 pr-2 min-w-0">
                                  <div className="shrink-0 w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-lg">
                                    <Shape className="w-5 h-5 fill-current" />
                                  </div>
                                  <span className="font-bold text-base sm:text-lg leading-snug">
                                    {opt}
                                  </span>
                                </div>

                                <div className="shrink-0 ml-2">
                                  {isRevealed && isCorrect && (
                                    <motion.span
                                      initial={{ opacity: 0, scale: 0.6 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      transition={{ duration: 0.25, ease: 'easeOut' }}
                                      className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white text-emerald-700 font-extrabold text-sm shadow-md"
                                    >
                                      <Check className="w-4 h-4 stroke-[3]" />
                                    </motion.span>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
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
                        className="w-full p-4 rounded-2xl sticky-note-yellow text-[#1e0e38] text-xs sm:text-sm leading-relaxed shadow-[4px_4px_0px_#090214] flex items-start gap-3"
                      >
                        <Lightbulb className="w-5 h-5 text-[#1e0e38] flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[11px] font-black uppercase tracking-wider block mb-0.5 text-[#1e0e38]">
                            Tech & AI Innovation Fact
                          </span>
                          <p className="font-bold">{slide.data.explanation}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* SLIDE TYPE: Round Leaderboard (Shown after each round!) */}
            {slide.type === 'round_leaderboard' && (
              <div className="flex flex-col h-full justify-between p-2 sm:p-4 max-w-5xl mx-auto w-full">
                <div className="text-center mb-3">
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full sticky-note-yellow text-[#1e0e38] text-xs font-black uppercase tracking-wider mb-2 -rotate-1 shadow-[2px_2px_0px_#090214]">
                    <Trophy className="w-4 h-4 text-[#1e0e38]" /> {slide.roundName || 'Cumulative Standings'}
                  </div>
                  <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white">{slide.title}</h2>
                  <p className="text-[#7dd3fc] text-xs sm:text-sm font-bold mt-1">Official Stage Leaderboard Standings</p>
                </div>

                <div className="flex flex-col space-y-4 w-full my-auto">
                  {/* TOP 2 SHOWCASE (Clear Highlight) */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* #1 Leader */}
                    {rankedFinalists[0] && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 rounded-3xl bg-gradient-to-br from-[#3b0764] to-[#1e0838] border-2 border-[#fbbf24] shadow-[0_0_25px_rgba(251,191,36,0.35)] flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative shrink-0">
                            <ParticipantAvatar seed={rankedFinalists[0].avatarSeed} size="lg" className="ring-2 ring-[#fbbf24]" />
                            <Crown className="w-6 h-6 text-[#fbbf24] absolute -top-3 -right-2 rotate-12" />
                          </div>
                          <div className="min-w-0">
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#fbbf24] text-[#1e0e38] text-[10px] font-black uppercase tracking-wider mb-1">
                              1st Place • Leader
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-white truncate">{rankedFinalists[0].name}</h3>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-black text-2xl sm:text-3xl text-[#fbbf24] block leading-none">
                            {rankedFinalists[0].score}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-[#7dd3fc]">Total Points</span>
                        </div>
                      </motion.div>
                    )}

                    {/* #2 Runner-Up */}
                    {rankedFinalists[1] && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        className="p-5 rounded-3xl bg-gradient-to-br from-[#2e1065] to-[#16082b] border-2 border-slate-300 shadow-[0_0_20px_rgba(226,232,240,0.25)] flex items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative shrink-0">
                            <ParticipantAvatar seed={rankedFinalists[1].avatarSeed} size="lg" className="ring-2 ring-slate-300" />
                            <Medal className="w-6 h-6 text-slate-300 absolute -top-3 -right-2 rotate-12" />
                          </div>
                          <div className="min-w-0">
                            <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-300 text-[#1e0e38] text-[10px] font-black uppercase tracking-wider mb-1">
                              2nd Place • Runner-Up
                            </div>
                            <h3 className="text-lg sm:text-xl font-black text-white truncate">{rankedFinalists[1].name}</h3>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="font-mono font-black text-2xl sm:text-3xl text-slate-100 block leading-none">
                            {rankedFinalists[1].score}
                          </span>
                          <span className="text-[10px] uppercase font-bold text-[#7dd3fc]">Total Points</span>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {/* RANKS 3 TO 6 (Clean Compact Grid) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {rankedFinalists.slice(2, 6).map((f, idx) => (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 + idx * 0.05 }}
                        className="p-3.5 rounded-2xl notebook-card flex items-center justify-between gap-2 border-2 border-[#8b5cf6]/30 shadow-[2px_2px_0px_#090214]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-6 h-6 rounded-full bg-[#7c3aed]/20 text-[#c084fc] font-mono font-black text-xs flex items-center justify-center border border-[#8b5cf6]/40 shrink-0">
                            #{idx + 3}
                          </div>
                          <ParticipantAvatar seed={f.avatarSeed} size="sm" />
                          <span className="font-bold text-white text-xs sm:text-sm truncate">{f.name}</span>
                        </div>
                        <span className="font-mono font-black text-base text-[#c084fc] shrink-0">
                          {f.score} <span className="text-[10px] font-sans font-normal text-[#7dd3fc]">pts</span>
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t-2 border-[#8b5cf6]/30 flex items-center justify-between w-full">
                  <span className="text-xs text-[#7dd3fc] font-bold">Scores update in real-time from Host Deck</span>
                  <button
                    onClick={nextSlide}
                    className="flex items-center gap-2 px-6 py-2 rounded-full bg-[#7c3aed] hover:bg-[#8b5cf6] font-black text-white border-2 border-[#1e0e38] shadow-[3px_3px_0px_#090214] transition hover:scale-105"
                  >
                    Proceed to Next Round <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* SLIDE TYPE: Round 2 Image Question (Centered Image & Options Step-by-Step) */}
            {slide.type === 'r2_image' && (
              <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-between my-auto px-4 select-none h-full py-3">
                <div className="w-full flex flex-col items-center justify-center space-y-2.5 my-auto">
                  {/* Top Header Badges */}
                  <div className="w-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl sticky-note-yellow border-2 border-[#1e0e38] text-[#1e0e38] font-black text-xs sm:text-sm shadow-[2px_2px_0px_#090214] shrink-0">
                      <PaperClip className="w-4 h-4 text-[#1e0e38]" />
                      <span>Round 2 • Visual Clue</span>
                      <span className="tnum font-black ml-0.5">
                        {slide.qIndex! + 1}/{slide.totalInRound}
                      </span>
                      <span className="text-[10px] sm:text-xs text-[#1e0e38]/70 ml-1 font-bold">• 4 Options</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl sticky-note-lavender border-2 border-[#1e0e38] text-[#1e0e38] font-black text-xs sm:text-sm shadow-[2px_2px_0px_#090214]">
                      <Trophy className="w-4 h-4 text-[#1e0e38]" />
                      <span>Correct: +10 | Wrong: −5 Pts</span>
                    </div>
                  </div>

                  {/* Centered Question Prompt Card */}
                  <div className="w-full notebook-card px-5 py-3 text-center">
                    <h2 className="text-base sm:text-lg md:text-xl font-black text-ink leading-snug whitespace-pre-line">
                      {slide.data.question}
                    </h2>
                  </div>

                  {/* Centered Image Card */}
                  <div className="relative mx-auto w-full max-w-lg h-[22vh] sm:h-[26vh] max-h-[240px] rounded-2xl overflow-hidden notebook-card flex items-center justify-center p-2 border-2 border-[#8b5cf6]/50 shadow-[4px_4px_0px_#090214]">
                    <Image
                      src={slide.data.imageUrl}
                      alt="Clue Image"
                      fill
                      className="object-contain p-2"
                      priority
                    />
                  </div>

                  {/* 4 Kahoot-Style Options Grid (Loads one by one, identical to Round 1) */}
                  <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3">
                    {slide.data.options && slide.data.options.length > 0 ? (
                      slide.data.options.map((opt: string, idx: number) => {
                        const isOptionRevealed = idx < mcqOptionStep || isRevealed
                        const isCorrect = idx === slide.data.correctIndex
                        const theme = ANSWER_THEMES[idx % ANSWER_THEMES.length]
                        const Shape = ANSWER_SHAPES[idx % ANSWER_SHAPES.length]

                        let buttonStyles = `${theme.bg} ${theme.border} shadow-md`
                        if (isRevealed) {
                          if (isCorrect) {
                            buttonStyles = 'bg-[#10b981] text-white ring-4 ring-emerald-300 shadow-xl border-b-[#059669]'
                          } else {
                            buttonStyles = 'bg-[#1e0e38]/80 text-[#64748b] opacity-35 border-[#3b0764]'
                          }
                        }

                        return (
                          <div key={idx} className="relative w-full min-h-[3.6rem]">
                            <AnimatePresence mode="wait">
                              {isOptionRevealed && (
                                <motion.div
                                  initial={{ opacity: 0, y: -25, scale: 0.98 }}
                                  animate={{
                                    opacity: isRevealed && !isCorrect ? 0.35 : 1,
                                    scale: isRevealed && isCorrect ? 1.02 : 1,
                                    y: 0,
                                  }}
                                  exit={{ opacity: 0, y: 15 }}
                                  transition={{
                                    duration: 0.38,
                                    ease: [0.16, 1, 0.3, 1],
                                  }}
                                  style={{ willChange: 'transform, opacity' }}
                                  className={`relative w-full h-full min-h-[3.6rem] px-4 py-2 rounded-2xl border-b-4 flex items-center justify-between select-none text-left cursor-default ${buttonStyles}`}
                                >
                                  <div className="flex items-center gap-3 pr-2 min-w-0">
                                    <div className="shrink-0 w-8 h-8 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-base">
                                      <Shape className="w-4 h-4 fill-current" />
                                    </div>
                                    <span className="font-bold text-sm sm:text-base md:text-lg leading-snug">
                                      {opt}
                                    </span>
                                  </div>

                                  <div className="shrink-0 ml-2">
                                    {isRevealed && isCorrect && (
                                      <motion.span
                                        initial={{ opacity: 0, scale: 0.6 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ duration: 0.25, ease: 'easeOut' }}
                                        className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white text-emerald-700 font-extrabold text-sm shadow-md"
                                      >
                                        <Check className="w-4 h-4 stroke-[3]" />
                                      </motion.span>
                                    )}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })
                    ) : (
                      <div className="p-4 rounded-xl notebook-card text-center text-slate-400 font-bold col-span-2">
                        Identify the image shown on screen
                      </div>
                    )}
                  </div>

                  {/* Verified Answer & Explanation Revealed Below */}
                  <AnimatePresence>
                    {isRevealed && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: 8, height: 0 }}
                        className="w-full p-3 rounded-2xl sticky-note-mint text-[#1e0e38] shadow-[4px_4px_0px_#090214] text-left border-2 border-[#1e0e38]"
                      >
                        <div className="flex items-center gap-2 mb-0.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-800" />
                          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-900">
                            Verified Answer: {slide.data.answer}
                          </span>
                        </div>
                        {slide.data.explanation && (
                          <p className="text-xs sm:text-sm font-bold text-[#1e0e38]/90 leading-relaxed">{slide.data.explanation}</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Clean Bottom Bar */}
                <div className="pt-2 border-t-2 border-[#8b5cf6]/30 flex items-center justify-between w-full">
                  <button
                    onClick={toggleReveal}
                    className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-xs font-black border-2 border-[#1e0e38] shadow-[3px_3px_0px_#090214] transition hover:scale-105 active:scale-95 ${
                      isRevealed ? 'bg-[#1e0e38] text-white' : 'bg-[#fbbf24] text-[#1e0e38]'
                    }`}
                  >
                    {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {isRevealed ? 'Hide Answer' : 'Reveal Answer'} (R)
                  </button>

                  <span className="text-xs text-[#7dd3fc] font-bold">Scored on Quizmaster Control Panel (+10 / −5)</span>
                </div>
              </div>
            )}

            {/* SLIDE TYPE: Round 2 Audio Question */}
            {slide.type === 'r2_audio' && (
              <div className="flex flex-col h-full justify-between p-2 sm:p-4">
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#7c3aed]/20 text-[#c084fc] border-2 border-[#8b5cf6]/50">
                      Round 2 — Audio {slide.qIndex! + 1} of {slide.totalInRound} • NO OPTIONS
                    </span>
                    <span className="text-xs text-[#fbbf24] font-black">Direct +10 | Direct −5 | Pass +5</span>
                  </div>

                  <h2 className="text-lg md:text-2xl font-black text-white mb-4 leading-snug">
                    {slide.data.question}
                  </h2>

                  {/* Audio Player Card */}
                  <div className="p-5 md:p-6 rounded-3xl notebook-card mb-4 flex flex-col md:flex-row items-center gap-5">
                    <button
                      onClick={() => togglePlayAudio(slide.data.audioUrl, slide.data.id)}
                      className="w-16 h-16 rounded-2xl bg-[#7c3aed] hover:bg-[#8b5cf6] text-white flex items-center justify-center border-2 border-[#1e0e38] shadow-[3px_3px_0px_#090214] transition-transform active:scale-95 flex-shrink-0"
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
                      <div className="flex items-center gap-1 h-10 w-full px-2 py-1 rounded-xl bg-[#16082b] border-2 border-[#8b5cf6]/40">
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
                              playingAudioId === slide.data.id ? 'bg-[#7c3aed]' : 'bg-[#28144b]'
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
                        className="p-5 rounded-2xl sticky-note-mint text-[#1e0e38] shadow-[4px_4px_0px_#090214]"
                      >
                        <span className="text-[11px] font-black uppercase tracking-wider block mb-0.5">
                          ✓ Speaker Personality Identified
                        </span>
                        <h3 className="text-xl md:text-2xl font-black mb-1">{slide.data.answer}</h3>
                        {slide.data.quote && (
                          <p className="text-xs md:text-sm font-black italic mb-1 text-[#1e0e38]">
                            "{slide.data.quote}"
                          </p>
                        )}
                        <p className="text-xs font-bold text-[#1e0e38]">{slide.data.explanation}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Clean Bottom Bar */}
                <div className="pt-3 border-t-2 border-[#8b5cf6]/30 flex items-center justify-between">
                  <button
                    onClick={toggleReveal}
                    className="flex items-center gap-2 px-5 py-2 rounded-full text-xs font-black bg-[#fbbf24] hover:bg-[#f59e0b] text-[#1e0e38] border-2 border-[#1e0e38] shadow-[3px_3px_0px_#090214] transition"
                  >
                    {isRevealed ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {isRevealed ? 'Hide Answer' : 'Reveal Answer'} (R)
                  </button>

                  <span className="text-xs text-[#7dd3fc] font-bold">Direct / Pass score awarded from Host Deck</span>
                </div>
              </div>
            )}

            {/* SLIDE TYPE: Round 3 Who Am I? */}
            {slide.type === 'r3_who_am_i' && (
              <div className="flex flex-col h-full justify-between p-1 sm:p-3 max-w-5xl mx-auto w-full">
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider sticky-note-yellow text-[#1e0e38] flex items-center gap-1.5 shadow-[2px_2px_0px_#090214]">
                        <UserCheck className="w-3.5 h-3.5" /> Who Am I? • {finalists[slide.data.participantIndex]?.name || slide.data.participantLabel} (Q{slide.data.number} of {slide.totalInRound})
                      </span>
                      <span className="hidden sm:inline-flex px-3 py-1 rounded-full text-xs font-mono font-bold bg-[#7c3aed]/20 text-[#c084fc] border border-[#8b5cf6]/40">
                        Clue {Math.min(rapidQuestionIdx + 1, 4)} of 4
                      </span>
                    </div>

                    {/* Step progress pills */}
                    <div className="flex items-center gap-1.5 bg-[#16082b]/90 p-1.5 rounded-2xl border border-[#8b5cf6]/30">
                      {[
                        { label: 'H1', pts: '+20' },
                        { label: 'H2', pts: '+15' },
                        { label: 'H3', pts: '+10' },
                        { label: 'H4', pts: '+5' },
                      ].map((h, hIdx) => {
                        const isCurrent = rapidQuestionIdx === hIdx && !isRevealed
                        const isPast = hIdx < rapidQuestionIdx || isRevealed
                        return (
                          <button
                            key={hIdx}
                            onClick={() => jumpToRapidQuestion(hIdx)}
                            className={`px-2.5 py-1 rounded-xl font-mono font-black text-xs transition flex items-center gap-1 border-2 ${
                              isCurrent
                                ? 'bg-[#fbbf24] text-[#1e0e38] border-[#1e0e38] shadow-[2px_2px_0px_#090214] scale-105'
                                : isPast
                                ? 'bg-[#7c3aed]/30 text-[#c084fc] border-[#8b5cf6]/60'
                                : 'bg-[#1e0e38] text-slate-500 border-transparent'
                            }`}
                            title={`Jump to Hint ${hIdx + 1} (${h.pts} Pts)`}
                          >
                            <span>{h.label}</span>
                            <span className="text-[10px] opacity-80">{h.pts}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* 15s Acoustic Timer Pill */}
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex items-center gap-2 px-3.5 py-1 rounded-full border-2 border-[#1e0e38] shadow-[2px_2px_0px_#090214] font-mono font-black text-sm transition ${
                          rapidSeconds <= 5
                            ? 'bg-[#f43f5e] text-white animate-pulse'
                            : timerRunning
                            ? 'bg-[#fbbf24] text-[#1e0e38]'
                            : 'bg-[#7c3aed] text-white'
                        }`}
                      >
                        <TimerIcon className="w-3.5 h-3.5" />
                        <span>{rapidSeconds}s</span>
                      </div>

                      <button
                        onClick={toggleRapidTimer}
                        className={`p-1.5 rounded-xl font-black text-[#1e0e38] border-2 border-[#1e0e38] shadow-[2px_2px_0px_#090214] transition ${
                          timerRunning ? 'bg-[#fbbf24]' : 'bg-[#10b981]'
                        }`}
                        title="Start / Pause 15s Timer (Space)"
                      >
                        {timerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      </button>

                      <button
                        onClick={resetRapidTimer}
                        className="p-1.5 rounded-xl bg-[#1e0e38] text-[#c084fc] border-2 border-[#8b5cf6]/60 shadow-[2px_2px_0px_#090214] transition"
                        title="Reset 15s Timer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Main Grid: Left Portrait + Right Clues */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch">
                    {/* Left: Mystery Portrait with Blur Transition */}
                    <div className="md:col-span-5 flex flex-col justify-center">
                      <div className="relative w-full h-[270px] sm:h-[330px] md:h-[380px] rounded-3xl notebook-card border-2 border-[#8b5cf6]/50 shadow-[6px_6px_0px_#090214] overflow-hidden flex items-center justify-center p-3 bg-[#0d041a]">
                        <div className="absolute inset-0 bg-[radial-gradient(#8b5cf6_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />

                        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-2xl">
                          <Image
                            src={slide.data.imageUrl}
                            alt={isRevealed ? slide.data.answer : 'Mystery Persona'}
                            fill
                            className={`object-contain rounded-2xl transition-all duration-700 ease-out select-none ${
                              isRevealed
                                ? 'filter-none scale-100 brightness-105'
                                : 'blur-2xl brightness-90 contrast-125 scale-110'
                            }`}
                            priority
                          />

                          {/* Unrevealed Label */}
                          {!isRevealed && (
                            <div className="absolute inset-0 flex flex-col items-center justify-between p-3 pointer-events-none">
                              <span className="px-3 py-1 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-[#16082b]/90 text-[#fbbf24] border border-[#fbbf24]/40 shadow-md">
                                Visual Clue
                              </span>
                              <div className="px-3 py-1.5 rounded-xl bg-[#090214]/85 border border-[#8b5cf6]/50 backdrop-blur-md text-center shadow-lg">
                                <div className="flex items-center justify-center gap-1.5 text-xs font-mono font-bold text-[#c084fc]">
                                  <EyeOff className="w-3.5 h-3.5" />
                                  <span>Blurred Until Answer</span>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Answer Revealed Card */}
                          <AnimatePresence>
                            {isRevealed && (
                              <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                                className="absolute bottom-2 inset-x-2 p-2.5 sm:p-3 rounded-2xl bg-[#090214]/95 border-2 border-[#10b981] backdrop-blur-md shadow-[0_4px_20px_rgba(16,185,129,0.4)] text-center"
                              >
                                <div className="flex items-center justify-center gap-1 text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400">
                                  <CheckCircle2 className="w-3 h-3" /> Identity Revealed
                                </div>
                                <h3 className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight">
                                  {slide.data.answer}
                                </h3>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </div>

                    {/* Right: Progressive Hints */}
                    <div className="md:col-span-7 flex flex-col justify-between space-y-2">
                      <div className="space-y-2 flex-1 flex flex-col justify-around">
                        {slide.data.hints.map((hintText: string, hIdx: number) => {
                          const isUnlocked = isRevealed || hIdx <= rapidQuestionIdx
                          const isCurrent = !isRevealed && hIdx === rapidQuestionIdx
                          const pointsVal = [20, 15, 10, 5][hIdx] || 5

                          return (
                            <motion.div
                              key={hIdx}
                              initial={{ opacity: 0, x: 12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.2, delay: hIdx * 0.04 }}
                              className={`relative p-2.5 sm:p-3 rounded-2xl border-2 transition-all ${
                                isCurrent
                                  ? 'notebook-card border-[#fbbf24] shadow-[4px_4px_0px_#090214] scale-[1.01]'
                                  : isUnlocked
                                  ? 'bg-[#16082b]/85 border-[#8b5cf6]/40 shadow-sm'
                                  : 'bg-[#16082b]/30 border-dashed border-[#8b5cf6]/20 opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded-lg font-mono font-black text-[11px] ${
                                      isCurrent
                                        ? 'bg-[#fbbf24] text-[#1e0e38]'
                                        : isUnlocked
                                        ? 'bg-[#7c3aed] text-white'
                                        : 'bg-white/10 text-slate-400'
                                    }`}
                                  >
                                    Hint {hIdx + 1}
                                  </span>
                                  <span
                                    className={`text-xs font-mono font-bold ${
                                      isCurrent ? 'text-[#fbbf24]' : isUnlocked ? 'text-[#c084fc]' : 'text-slate-500'
                                    }`}
                                  >
                                    +{pointsVal} Pts
                                  </span>
                                </div>

                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-black uppercase tracking-wider bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/40 animate-pulse">
                                    Active Hint
                                  </span>
                                )}
                                {isUnlocked && !isCurrent && (
                                  <span className="text-emerald-400">
                                    <Check className="w-3.5 h-3.5" />
                                  </span>
                                )}
                                {!isUnlocked && (
                                  <span className="text-slate-500">
                                    <Lock className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </div>

                              {isUnlocked ? (
                                <p className="text-xs sm:text-sm md:text-base font-bold text-slate-100 leading-snug">
                                  {hintText}
                                </p>
                              ) : (
                                <p className="text-xs font-mono text-slate-500 italic">
                                  Unlocks after 15 seconds if unanswered (+{pointsVal} pts)
                                </p>
                              )}
                            </motion.div>
                          )
                        })}
                      </div>

                      {/* Bottom Info / Backstory Box */}
                      {isRevealed && slide.data.explanation && (
                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="p-2.5 rounded-2xl bg-[#1e0e38]/90 border border-[#8b5cf6]/40 text-xs text-slate-200 leading-relaxed shadow-md"
                        >
                          <strong className="text-[#fbbf24] font-black uppercase tracking-wider mr-1.5">Context:</strong>
                          {slide.data.explanation}
                        </motion.div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Bar: Reveal / Blur Mode Switcher */}
                <div className="pt-2 border-t-2 border-[#8b5cf6]/30 flex items-center justify-between mt-2">
                  <button
                    onClick={toggleReveal}
                    className="flex items-center gap-2 px-5 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-[#fbbf24] hover:bg-[#f59e0b] text-[#1e0e38] border-2 border-[#1e0e38] shadow-[3px_3px_0px_#090214] transition cursor-pointer"
                  >
                    {isRevealed ? (
                      <>
                        <RotateCcw className="w-4 h-4" /> Blur Image & Hide Answer (R)
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" /> Unblur Portrait & Reveal Answer (R)
                      </>
                    )}
                  </button>

                  <div className="text-xs text-[#7dd3fc] font-bold">
                    Target Finalist: <strong className="text-white">{finalists[slide.data.participantIndex]?.name || slide.data.participantLabel}</strong>
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
                      <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider sticky-note-yellow text-[#1e0e38] flex items-center gap-1 shadow-[2px_2px_0px_#090214]">
                        <FlameKindling className="w-3.5 h-3.5" /> Rapid Fire • {finalists[slide.data.participantIndex]?.name || slide.data.participantLabel} (Set {slide.data.setNumber})
                      </span>
                    </div>

                    {/* Step progress pills */}
                    <div className="flex items-center gap-1.5 bg-[#16082b]/90 p-1.5 rounded-2xl border border-[#8b5cf6]/30">
                      {slide.data.questions.map((_: any, qIdx: number) => {
                        const isCurrent = rapidQuestionIdx === qIdx && !isRevealed
                        const isPast = qIdx < rapidQuestionIdx || isRevealed
                        return (
                          <button
                            key={qIdx}
                            onClick={() => jumpToRapidQuestion(qIdx)}
                            className={`w-7 h-7 rounded-xl font-mono font-black text-xs transition flex items-center justify-center border-2 ${
                              isCurrent
                                ? 'bg-[#fbbf24] text-[#1e0e38] border-[#1e0e38] shadow-[2px_2px_0px_#090214] scale-110'
                                : isPast
                                ? 'bg-[#7c3aed]/30 text-[#c084fc] border-[#8b5cf6]/60'
                                : 'bg-[#1e0e38] text-slate-400 border-transparent'
                            }`}
                            title={`Jump to Question ${qIdx + 1}`}
                          >
                            {qIdx + 1}
                          </button>
                        )
                      })}
                    </div>

                    {/* 60s Acoustic Timer Pill */}
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`flex items-center gap-2 px-4 py-1.5 rounded-full border-2 border-[#1e0e38] shadow-[3px_3px_0px_#090214] font-mono font-black text-base transition ${
                          rapidSeconds <= 10
                            ? 'bg-[#f43f5e] text-white animate-pulse'
                            : timerRunning
                            ? 'bg-[#fbbf24] text-[#1e0e38]'
                            : 'bg-[#7c3aed] text-white'
                        }`}
                      >
                        <TimerIcon className="w-4 h-4" />
                        <span>{rapidSeconds}s</span>
                      </div>

                      <button
                        onClick={toggleRapidTimer}
                        className={`p-2 rounded-xl font-black text-[#1e0e38] border-2 border-[#1e0e38] shadow-[2px_2px_0px_#090214] transition ${
                          timerRunning ? 'bg-[#fbbf24]' : 'bg-[#10b981]'
                        }`}
                        title="Start / Pause Timer (Space)"
                      >
                        {timerRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={resetRapidTimer}
                        className="p-2 rounded-xl bg-[#1e0e38] text-[#c084fc] border-2 border-[#8b5cf6]/60 shadow-[2px_2px_0px_#090214] transition"
                        title="Reset 60s Timer"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mode 1: STEP-BY-STEP QUESTION (Only Active Question Shown, NO ANSWERS) */}
                  {!isRevealed ? (
                    (() => {
                      const currentQ = slide.data.questions[rapidQuestionIdx] || slide.data.questions[0]
                      return (
                        <div className="flex flex-col items-center justify-center py-6 sm:py-10 text-center">
                          <div className="w-full max-w-4xl p-6 sm:p-10 rounded-3xl notebook-card relative overflow-hidden flex flex-col items-center justify-center min-h-[300px] border-2 border-[#fbbf24]/50 shadow-[6px_6px_0px_#090214]">
                            <div className="flex items-center gap-2.5 mb-4">
                              <span className="px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#fbbf24]/20 text-[#fbbf24] border border-[#fbbf24]/50">
                                Question {currentQ?.number || rapidQuestionIdx + 1} of {slide.data.questions.length}
                              </span>
                              {currentQ?.category && (
                                <span className="px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#7c3aed]/20 text-[#c084fc] border border-[#8b5cf6]/50">
                                  {currentQ.category}
                                </span>
                              )}
                            </div>

                            <motion.h3
                              key={rapidQuestionIdx}
                              initial={{ opacity: 0, scale: 0.96 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.2 }}
                              className="text-2xl sm:text-4xl md:text-5xl font-black text-white leading-relaxed sm:leading-snug tracking-tight max-w-3xl my-3"
                            >
                              {currentQ?.prompt}
                            </motion.h3>

                            <div className="mt-8 flex items-center justify-between w-full pt-4 border-t border-[#8b5cf6]/20 text-xs text-[#7dd3fc] font-bold">
                              <span>Target Finalist: <strong className="text-white text-sm">{finalists[slide.data.participantIndex]?.name || slide.data.participantLabel}</strong></span>
                              <span>60 Seconds Total • +10 Pts per Correct</span>
                            </div>
                          </div>
                        </div>
                      )
                    })()
                  ) : (
                    /* Mode 2: REVEAL ALL ANSWERS MODE (Verification & Scoring Review) */
                    <div className="space-y-2.5 mb-4 max-h-[58vh] overflow-y-auto pr-1">
                      <div className="flex items-center justify-between text-xs font-black text-[#10b981] uppercase tracking-wider mb-1 px-1">
                        <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-[#10b981]" /> Verification & Scoring Review</span>
                        <span>Participant: {finalists[slide.data.participantIndex]?.name || slide.data.participantLabel}</span>
                      </div>

                      {slide.data.questions.map((q: any, qIdx: number) => (
                        <motion.div
                          key={qIdx}
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: qIdx * 0.04 }}
                          className="p-3.5 rounded-2xl notebook-card flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-2 border-[#10b981]/40"
                        >
                          <div className="flex items-center gap-3">
                            <span className="w-6 h-6 rounded-lg bg-[#7c3aed] text-white font-mono font-black text-xs flex items-center justify-center border border-[#1e0e38] shrink-0">
                              {q.number}
                            </span>
                            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-[#7c3aed]/20 text-[#c084fc] shrink-0">
                              {q.category}
                            </span>
                            <span className="text-xs sm:text-sm font-bold text-white">{q.prompt}</span>
                          </div>
                          <div className="text-[#10b981] font-black text-xs sm:text-sm flex items-center gap-1 shrink-0 bg-[#10b981]/15 px-3 py-1.5 rounded-xl border border-[#10b981]/30">
                            <CheckCircle2 className="w-4 h-4 text-[#10b981]" /> Ans: {q.answer}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Mode Switcher */}
                <div className="pt-3 border-t-2 border-[#8b5cf6]/30 flex items-center justify-between">
                  <button
                    onClick={toggleReveal}
                    className="flex items-center gap-2 px-6 py-2 rounded-full font-black text-xs uppercase tracking-wider bg-[#fbbf24] hover:bg-[#f59e0b] text-[#1e0e38] border-2 border-[#1e0e38] shadow-[3px_3px_0px_#090214] transition cursor-pointer"
                  >
                    {isRevealed ? (
                      <>
                        <RotateCcw className="w-4 h-4" /> Back to Questions Mode (R)
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4" /> Reveal All Answers (R)
                      </>
                    )}
                  </button>

                  <div className="text-xs text-[#7dd3fc] font-bold">
                    Target: <strong className="text-white">{finalists[slide.data.participantIndex]?.name || slide.data.participantLabel}</strong>
                  </div>
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
                  Conducted by Quizmaster if two or more finalists share identical scores for 1st or 2nd place.
                </p>
                <button
                  onClick={nextSlide}
                  className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#fbbf24] hover:bg-[#f59e0b] text-[#1e0e38] font-black border-2 border-[#1e0e38] shadow-[4px_4px_0px_#090214] transition hover:scale-105"
                >
                  Reveal Grand Victory Podium (Top 2 Prizes) <Trophy className="w-5 h-5 ml-1" />
                </button>
              </div>
            )}

            {/* SLIDE TYPE: Grand Podium (EXACTLY 2 PRIZES: 1st on LEFT, 2nd on RIGHT, All Finalists Honored) */}
            {slide.type === 'podium' && (
              <div className="w-full max-w-5xl mx-auto flex flex-col items-center justify-between h-full py-1 sm:py-3 px-2 sm:px-4 text-center">
                {/* Header Badge & Title */}
                <div className="shrink-0 mb-1">
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full sticky-note-lavender text-white font-black text-xs uppercase tracking-widest mb-1 -rotate-1 shadow-[2px_2px_0px_#090214]"
                  >
                    <Sparkles className="w-4 h-4 text-[#fbbf24]" /> TECHNOVA 2026 Champion Ceremony
                  </motion.div>
                  <h2 className="text-2xl sm:text-4xl md:text-5xl font-black text-white tracking-tight">
                    Grand Victory Podium
                  </h2>
                  <p className="text-xs sm:text-sm font-bold text-[#7dd3fc]">
                    Celebrating the 1st & 2nd Prize Winners
                  </p>
                </div>

                {/* 2 Prizes Stage Layout (1st on the Left, 2nd on the Right) */}
                <div className="grid grid-cols-2 gap-4 sm:gap-8 md:gap-12 w-full max-w-2xl items-end my-auto pt-6 pb-2">
                  {/* Rank 1 (Champion / 1st Prize) - LEFT */}
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center w-full"
                  >
                    {/* Avatar with Floating Crown */}
                    <div className="relative mb-2">
                      <ParticipantAvatar
                        seed={rankedFinalists[0]?.avatarSeed || 'f1'}
                        size="xl"
                        className="ring-4 ring-[#fbbf24] shadow-2xl"
                      />
                      <div className="absolute -top-7 left-1/2 -translate-x-1/2">
                        <Crown className="w-9 h-9 text-[#fbbf24] drop-shadow-[0_4px_12px_rgba(251,191,36,0.8)]" />
                      </div>
                    </div>

                    <div className="text-center w-full mb-2">
                      <h3 className="font-black text-white text-lg sm:text-xl md:text-2xl truncate max-w-[220px] mx-auto leading-tight">
                        {rankedFinalists[0]?.name || 'Finalist 1'}
                      </h3>
                      <div className="inline-flex items-center gap-1 px-3 py-0.5 mt-1 rounded-full bg-[#fbbf24]/20 border border-[#fbbf24]/60 font-mono font-black text-[#fbbf24] text-sm sm:text-base shadow-sm">
                        {rankedFinalists[0]?.score || 0} pts
                      </div>
                    </div>

                    {/* Gold Podium Pedestal */}
                    <div className="w-full h-36 sm:h-44 rounded-3xl bg-gradient-to-b from-[#fbbf24] to-[#f59e0b] border-2 border-[#1e0e38] shadow-[5px_5px_0px_#090214] flex flex-col items-center justify-center text-[#1e0e38] p-3">
                      <Trophy className="w-9 h-9 sm:w-11 sm:h-11 mb-1 text-[#1e0e38]" />
                      <span className="font-black text-xl sm:text-2xl tracking-tight leading-none">1st Prize</span>
                      <span className="text-[11px] sm:text-xs font-black uppercase tracking-widest text-[#1e0e38] mt-1">
                        GRAND CHAMPION
                      </span>
                    </div>
                  </motion.div>

                  {/* Rank 2 (Runner-Up / 2nd Prize) - RIGHT */}
                  <motion.div
                    initial={{ y: 25, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.35 }}
                    className="flex flex-col items-center w-full"
                  >
                    {/* Avatar */}
                    <div className="relative mb-2">
                      <ParticipantAvatar
                        seed={rankedFinalists[1]?.avatarSeed || 'f2'}
                        size="lg"
                        className="ring-4 ring-slate-300 shadow-xl"
                      />
                    </div>

                    <div className="text-center w-full mb-2">
                      <h3 className="font-black text-white text-base sm:text-lg md:text-xl truncate max-w-[200px] mx-auto leading-tight">
                        {rankedFinalists[1]?.name || 'Finalist 2'}
                      </h3>
                      <div className="inline-flex items-center gap-1 px-3 py-0.5 mt-1 rounded-full bg-slate-300/20 border border-slate-300/60 font-mono font-black text-[#7dd3fc] text-xs sm:text-sm shadow-sm">
                        {rankedFinalists[1]?.score || 0} pts
                      </div>
                    </div>

                    {/* Silver Podium Pedestal */}
                    <div className="w-full h-28 sm:h-34 rounded-3xl bg-gradient-to-b from-slate-200 to-slate-300 border-2 border-[#1e0e38] shadow-[4px_4px_0px_#090214] flex flex-col items-center justify-center text-[#1e0e38] p-3">
                      <Medal className="w-8 h-8 sm:w-9 sm:h-9 mb-1 text-[#1e0e38]" />
                      <span className="font-black text-lg sm:text-xl tracking-tight leading-none">2nd Prize</span>
                      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-slate-800 mt-0.5">
                        RUNNER-UP
                      </span>
                    </div>
                  </motion.div>
                </div>

                {/* Qualifiers #3 to #6 Full Visibility Showcase */}
                <div className="w-full max-w-4xl bg-[#1e0e38]/90 p-3 sm:p-4 rounded-3xl border-2 border-[#8b5cf6]/40 shadow-[4px_4px_0px_#090214] shrink-0 mt-1">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-xs font-black uppercase tracking-wider text-[#7dd3fc] flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#fbbf24]" /> Stage Finalists & Honorable Mentions
                    </span>
                    <span className="text-[11px] font-bold text-[#7dd3fc]/80">Ranks #3 to #6</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                    {rankedFinalists.slice(2, 6).map((f, i) => (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 + i * 0.08 }}
                        className="p-3 rounded-2xl bg-[#16082b] border-2 border-[#8b5cf6]/30 shadow-md flex flex-col items-center text-center relative hover:border-[#8b5cf6] transition-all"
                      >
                        <div className="flex items-center justify-between w-full mb-1.5">
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-black bg-[#7c3aed]/20 text-[#c084fc] border border-[#8b5cf6]/40">
                            #{i + 3}
                          </span>
                          <span className="text-[10px] font-bold uppercase text-slate-400">Finalist</span>
                        </div>

                        <ParticipantAvatar
                          seed={f.avatarSeed || `f${i + 3}`}
                          size="md"
                          className="ring-2 ring-[#c084fc]/50 mb-1.5 shadow-md"
                        />

                        <strong className="text-white text-xs sm:text-sm font-bold truncate w-full mb-1" title={f.name}>
                          {f.name}
                        </strong>

                        <div className="w-full py-0.5 px-2 rounded-xl bg-[#1e0e38] border border-[#8b5cf6]/40 font-mono font-black text-[#c084fc] text-xs sm:text-sm shadow-inner">
                          {f.score} <span className="text-[10px] font-semibold text-[#7dd3fc]">pts</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Clean Presentation Footer Navigation */}
      <footer className="relative z-20 flex items-center justify-between px-4 sm:px-6 py-2.5 border-t-2 border-[#8b5cf6]/40 bg-[#16082b]/90 backdrop-blur-md shadow-[0_-4px_0px_#090214]">
        <div className="flex items-center gap-2">
          <button
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1e0e38] border-2 border-[#8b5cf6]/50 text-xs font-black text-[#c084fc] hover:bg-[#7c3aed] hover:text-white disabled:opacity-30 disabled:pointer-events-none transition"
          >
            <ChevronLeft className="w-4 h-4" /> Prev
          </button>
          <button
            onClick={nextSlide}
            disabled={currentSlide === slides.length - 1}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#7c3aed] hover:bg-[#8b5cf6] text-xs font-black text-[#1e0e38] border-2 border-[#1e0e38] shadow-[2px_2px_0px_#090214] disabled:opacity-30 disabled:pointer-events-none transition"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Slide Selector Scrubber */}
        <div className="flex items-center gap-1 max-w-md overflow-x-auto py-1 px-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => {
                setCurrentSlide(i)
                setIsRevealed(false)
                broadcast({ type: 'CHANGE_SLIDE', payload: { slideIndex: i } })
              }}
              className={`h-1.5 rounded-full transition-all duration-200 ${
                currentSlide === i ? 'w-6 bg-[#7c3aed]' : 'w-1.5 bg-[#28144b] hover:bg-[#7c3aed]/60'
              }`}
              title={`Jump to Slide ${i + 1}`}
            />
          ))}
        </div>

        <div className="text-xs text-[#7dd3fc] font-mono font-bold hidden sm:inline">
          Use &larr; &rarr; keys or Space to navigate
        </div>
      </footer>
    </div>
  )
}
