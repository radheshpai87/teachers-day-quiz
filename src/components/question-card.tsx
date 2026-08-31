'use client'

import { useState, useEffect } from 'react'
import type { PublicQuestion, SelfState } from '@/lib/types'
import { Timer } from '@/components/timer'
import { AnswerButton } from '@/components/answer-button'
import { ParticipantAvatar } from '@/components/participant-avatar'
import { Trophy, Target, PaperClip } from '@/components/icons'
import { sound } from '@/lib/client/sound'
import { motion } from 'framer-motion'

interface QuestionCardProps {
  question: PublicQuestion
  roundIndex: number
  totalRounds: number
  answersOpenAt: number
  answersCloseAt: number
  clockOffsetMs: number
  yourChoice: number | null
  self?: SelfState
  onSelectAnswer: (choiceIndex: number) => void
}

export function QuestionCard({
  question,
  roundIndex,
  totalRounds,
  answersCloseAt,
  clockOffsetMs,
  yourChoice,
  self,
  onSelectAnswer,
}: QuestionCardProps) {
  const [selectedChoice, setSelectedChoice] = useState<number | null>(yourChoice)
  const isLocked = selectedChoice !== null

  useEffect(() => {
    setSelectedChoice(yourChoice)
  }, [yourChoice, roundIndex])

  const handleChoice = (index: number) => {
    if (isLocked) return
    sound.tap()
    setSelectedChoice(index)
    onSelectAnswer(index)
  }

  const isTrueFalse = question.type === 'TRUE_FALSE'

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col space-y-4 px-3 py-2 sm:px-4 select-none">
      {/* Header bar: Round badge, Timer, Score pill */}
      <div className="w-full flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-xl sticky-note-yellow border-2 border-ink text-ink font-black text-xs sm:text-sm shadow-[2px_2px_0px_#231f20] shrink-0 whitespace-nowrap">
          <PaperClip className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-ink shrink-0" />
          <span className="whitespace-nowrap">Question</span>
          <span className="tnum font-black text-[#0284c7] whitespace-nowrap ml-0.5">
            {roundIndex + 1}/{totalRounds}
          </span>
        </div>

        {/* Timer */}
        <Timer
          deadline={answersCloseAt}
          clockOffsetMs={clockOffsetMs}
          totalSeconds={question.timerSeconds}
          variant="ring"
          size="md"
        />

        {/* Score pill */}
        {self && (
          <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-xl sticky-note-lavender border-2 border-ink text-ink font-black text-xs sm:text-sm shadow-[2px_2px_0px_#231f20] shrink-0 whitespace-nowrap">
            <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#0284c7] shrink-0" />
            <span className="tnum font-black">{self.score.toLocaleString()}</span>
          </div>
        )}
      </div>

      {/* Question Prompt Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full notebook-card p-5 sm:p-7 text-center space-y-4"
      >
        {/* Optional Image */}
        {question.imageUrl && (
          <div className="w-full max-h-56 overflow-hidden rounded-xl border-2 border-ink bg-white flex items-center justify-center">
            {/* eslint-disable-next-html-element-suppression */}
            <img
              src={question.imageUrl}
              alt="Question illustration"
              className="max-h-56 object-contain rounded-xl"
            />
          </div>
        )}

        <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-ink leading-snug">
          {question.prompt}
        </h2>
      </motion.div>

      {/* Answer Choices Grid */}
      <div
        className={`w-full grid gap-3 ${
          isTrueFalse ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'
        }`}
      >
        {question.options.map((optionText, idx) => (
          <AnswerButton
            key={idx}
            index={idx}
            text={optionText}
            selected={selectedChoice === idx}
            disabled={isLocked}
            onClick={() => handleChoice(idx)}
          />
        ))}
      </div>

      {/* Bottom Status bar */}
      <div className="w-full flex items-center justify-between text-xs font-black text-ink-soft px-1 pt-1">
        <div className="flex items-center gap-1.5">
          <Target className="w-4 h-4 text-[#388e3c]" />
          <span className={isLocked ? 'text-[#388e3c] font-black' : ''}>
            {isLocked ? 'Answer locked in! Evaluating result...' : 'Tap an answer to submit'}
          </span>
        </div>
        {self && (
          <div className="flex items-center gap-1.5">
            <ParticipantAvatar seed={self.avatarSeed} size="sm" className="border border-ink" />
            <span className="font-extrabold text-ink">{self.name}</span>
          </div>
        )}
      </div>
    </div>
  )
}
