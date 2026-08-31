'use client'

import { useState, useEffect } from 'react'
import type { PublicQuestion, SelfState } from '@/lib/types'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, CheckCircle2, ArrowLeft, ArrowRight, Flag } from 'lucide-react'
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

  return (
    <div className="w-full flex flex-col gap-4">
      {/* Sticky Header with 10-Minute Global Timer & Progress */}
      <div className="w-full flex items-center justify-between sticky-note-yellow p-4 rounded-2xl border-3 border-ink shadow-[4px_4px_0px_#2a2440]">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-ink animate-pulse" />
          <span className="font-black text-lg tracking-wider text-ink">
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
              onClick={() => setCurrentIndex(idx)}
              className={`px-3 py-1.5 rounded-xl font-black text-xs border-2 border-ink transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                isCurrent
                  ? 'sticky-note-lavender shadow-[2px_2px_0px_#2a2440] scale-105'
                  : isAnswered
                  ? 'sticky-note-green text-ink'
                  : 'bg-white text-ink-soft opacity-70'
              }`}
            >
              Q{idx + 1}
              {isAnswered && <CheckCircle2 className="w-3 h-3 text-emerald-600 inline" />}
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

          {/* Answer Choice Options Grid */}
          <div className="grid grid-cols-1 gap-3 mt-1">
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = selectedChoice === optIdx

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => onSelectAnswer(currentIndex, optIdx)}
                  className={`w-full p-4 rounded-2xl border-3 border-ink font-bold text-base text-left transition-all flex items-center justify-between cursor-pointer ${
                    isSelected
                      ? 'sticky-note-green text-ink shadow-[4px_4px_0px_#2a2440] translate-x-1'
                      : 'bg-white hover:bg-slate-50 text-ink shadow-[2px_2px_0px_#2a2440]'
                  }`}
                >
                  <span>{opt}</span>
                  {isSelected && <CheckCircle2 className="w-5 h-5 text-ink shrink-0" />}
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
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          className="px-4 py-2.5 rounded-xl sticky-note-lavender border-2 border-ink text-ink font-black text-sm shadow-[2px_2px_0px_#2a2440] disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Previous
        </button>

        {currentIndex < totalQ - 1 ? (
          <button
            type="button"
            onClick={() => setCurrentIndex((prev) => Math.min(totalQ - 1, prev + 1))}
            className="px-5 py-2.5 rounded-xl sticky-note-yellow border-2 border-ink text-ink font-black text-sm shadow-[2px_2px_0px_#2a2440] hover:-translate-y-0.5 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            Next
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={onFinishExam}
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
