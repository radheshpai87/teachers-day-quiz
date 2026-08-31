'use client'

import { useState, useEffect } from 'react'
import type { PublicQuestion, SelfState } from '@/lib/types'
import { ANSWER_SHAPES } from '@/components/icons'
import { sound } from '@/lib/client/sound'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle2, ArrowLeft, ArrowRight, Flag, Check } from 'lucide-react'
import Image from 'next/image'

interface ExamCardProps {
  questions: PublicQuestion[]
  answersOpenAt: number
  examEndsAt: number
  clockOffsetMs: number
  userChoices: Record<number, number>
  self?: SelfState | null
  onSelectAnswer: (roundIndex: number, choiceIndex: number) => void
  onFinishExam: () => void
}

const OPTION_THEMES = [
  {
    bg: 'bg-[#e53935] text-white hover:bg-[#d32f2f] active:bg-[#c62828]',
    border: 'border-[#b71c1c]',
    selectedBg: 'bg-[#b71c1c] text-white ring-4 ring-white shadow-xl scale-[1.02]',
    label: 'A',
  },
  {
    bg: 'bg-[#1e88e5] text-white hover:bg-[#1976d2] active:bg-[#1565c0]',
    border: 'border-[#0d47a1]',
    selectedBg: 'bg-[#0d47a1] text-white ring-4 ring-white shadow-xl scale-[1.02]',
    label: 'B',
  },
  {
    bg: 'bg-[#fb8c00] text-white hover:bg-[#f57c00] active:bg-[#ef6c00]',
    border: 'border-[#e65100]',
    selectedBg: 'bg-[#e65100] text-white ring-4 ring-white shadow-xl scale-[1.02]',
    label: 'C',
  },
  {
    bg: 'bg-[#43a047] text-white hover:bg-[#388e3c] active:bg-[#2e7d32]',
    border: 'border-[#1b5e20]',
    selectedBg: 'bg-[#1b5e20] text-white ring-4 ring-white shadow-xl scale-[1.02]',
    label: 'D',
  },
]

export function ExamCard({
  questions,
  examEndsAt,
  clockOffsetMs,
  userChoices,
  self,
  onSelectAnswer,
  onFinishExam,
}: ExamCardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [timeLeftMs, setTimeLeftMs] = useState(0)

  // Live 10-minute countdown timer calculation
  useEffect(() => {
    const updateTimer = () => {
      const serverNow = Date.now() + clockOffsetMs
      const remaining = Math.max(0, examEndsAt - serverNow)
      setTimeLeftMs(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 500)
    return () => clearInterval(interval)
  }, [examEndsAt, clockOffsetMs])

  const currentQ = questions[currentIndex]
  if (!currentQ) return null

  const minutes = Math.floor(timeLeftMs / 60000)
  const seconds = Math.floor((timeLeftMs % 60000) / 1000)
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`

  const answeredCount = Object.keys(userChoices).length
  const totalQ = questions.length
  const selectedChoice = userChoices[currentIndex]

  const handleSelectChoice = (optIdx: number) => {
    sound.tap()
    onSelectAnswer(currentIndex, optIdx)
  }

  return (
    <div className="w-full flex flex-col gap-4 select-none">
      {/* Sticky Header with 10-Minute Global Timer & Progress */}
      <div className="w-full flex items-center justify-between sticky-note-yellow p-4 rounded-2xl border-3 border-ink shadow-[4px_4px_0px_#2a2440]">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-ink animate-pulse" />
          <span className="font-black text-lg sm:text-xl tracking-wider text-ink tnum">
            {timeFormatted}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-black text-ink-soft uppercase tracking-wider">
            Answered: {answeredCount} / {totalQ}
          </span>
        </div>
      </div>

      {/* Question Number Pills Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {questions.map((_, idx) => {
          const isAnswered = userChoices[idx] !== undefined
          const isCurrent = idx === currentIndex

          return (
            <button
              key={idx}
              type="button"
              onClick={() => {
                sound.tap()
                setCurrentIndex(idx)
              }}
              className={`px-3.5 py-2 rounded-xl font-black text-xs border-2 border-ink transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                isCurrent
                  ? 'sticky-note-lavender shadow-[3px_3px_0px_#2a2440] scale-105'
                  : isAnswered
                  ? 'sticky-note-green text-ink shadow-[2px_2px_0px_#2a2440]'
                  : 'bg-white text-ink-soft opacity-70'
              }`}
            >
              Q{idx + 1}
              {isAnswered && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 inline" />}
            </button>
          )
        })}
      </div>

      {/* Main Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.15 }}
          className="w-full sticky-note-blue p-5 sm:p-6 rounded-3xl border-3 border-ink shadow-[6px_6px_0px_#2a2440] flex flex-col gap-5"
        >
          {/* Question Counter Header */}
          <div className="flex items-center justify-between border-b-2 border-ink/10 pb-3">
            <span className="text-xs font-black uppercase text-ink-soft tracking-wider">
              Question {currentIndex + 1} of {totalQ}
            </span>
            {self && (
              <span className="text-xs font-black text-ink">
                {self.name}
              </span>
            )}
          </div>

          {/* Question Prompt */}
          <h2 className="text-lg sm:text-xl font-black text-ink leading-snug">
            {currentQ.prompt}
          </h2>

          {/* Optional Image */}
          {currentQ.imageUrl && (
            <div className="relative w-full h-48 sm:h-56 rounded-2xl overflow-hidden border-2 border-ink bg-white">
              <Image
                src={currentQ.imageUrl}
                alt="Question diagram"
                fill
                className="object-contain p-2"
              />
            </div>
          )}

          {/* Vibrant Kahoot Option Color Grid */}
          <div className="grid grid-cols-1 gap-3 mt-1">
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = selectedChoice === optIdx
              const theme = OPTION_THEMES[optIdx % OPTION_THEMES.length]
              const Shape = ANSWER_SHAPES[optIdx % ANSWER_SHAPES.length]

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectChoice(optIdx)}
                  className={`w-full min-h-[4.25rem] p-4 rounded-2xl border-b-4 ${theme.border} font-bold text-base sm:text-lg text-left transition-all duration-150 flex items-center justify-between cursor-pointer ${
                    isSelected ? theme.selectedBg : `${theme.bg} shadow-md`
                  }`}
                >
                  <div className="flex items-center gap-3.5 pr-2 min-w-0">
                    <div className="shrink-0 w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-lg">
                      <Shape className="w-5 h-5 fill-current" />
                    </div>
                    <span className="leading-snug">{opt}</span>
                  </div>

                  <div className="shrink-0 ml-2">
                    {isSelected && (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-ink font-black text-xs shadow-md animate-pulse">
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                        Selected
                      </span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Bottom Action Controls */}
      <div className="w-full flex items-center justify-between pt-2">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => {
            sound.tap()
            setCurrentIndex((prev) => Math.max(0, prev - 1))
          }}
          className="px-4 py-2.5 rounded-xl sticky-note-lavender border-2 border-ink text-ink font-black text-sm shadow-[2px_2px_0px_#2a2440] disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        {currentIndex < totalQ - 1 ? (
          <button
            type="button"
            onClick={() => {
              sound.tap()
              setCurrentIndex((prev) => Math.min(totalQ - 1, prev + 1))
            }}
            className="px-5 py-2.5 rounded-xl sticky-note-yellow border-2 border-ink text-ink font-black text-sm shadow-[2px_2px_0px_#2a2440] hover:-translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              sound.tap()
              onFinishExam()
            }}
            className="px-6 py-2.5 rounded-xl sticky-note-rose border-3 border-ink text-ink font-black text-sm shadow-[3px_3px_0px_#2a2440] hover:scale-105 transition-all flex items-center gap-2 cursor-pointer animate-bounce"
          >
            <Flag className="w-4 h-4" />
            Submit Quiz 🏁
          </button>
        )}
      </div>
    </div>
  )
}
