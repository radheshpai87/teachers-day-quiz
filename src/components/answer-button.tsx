'use client'

import { ANSWER_SHAPES } from '@/components/icons'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'

interface AnswerButtonProps {
  index: number
  text: string
  selected: boolean
  disabled: boolean
  correct?: boolean | null
  revealed?: boolean
  onClick: () => void
}

const ANSWER_THEMES = [
  {
    bg: 'bg-[#e53935] text-white hover:bg-[#d32f2f] active:bg-[#c62828]',
    border: 'border-[#b71c1c]',
    lightBg: 'bg-rose-tint border-rose-ink/30 text-rose-ink',
    label: 'A',
  },
  {
    bg: 'bg-[#1e88e5] text-white hover:bg-[#1976d2] active:bg-[#1565c0]',
    border: 'border-[#0d47a1]',
    lightBg: 'bg-blue-tint border-blue-ink/30 text-blue-ink',
    label: 'B',
  },
  {
    bg: 'bg-[#fb8c00] text-white hover:bg-[#f57c00] active:bg-[#ef6c00]',
    border: 'border-[#e65100]',
    lightBg: 'bg-butter-tint border-butter-ink/30 text-butter-ink',
    label: 'C',
  },
  {
    bg: 'bg-[#43a047] text-white hover:bg-[#388e3c] active:bg-[#2e7d32]',
    border: 'border-[#1b5e20]',
    lightBg: 'bg-mint-tint border-mint-ink/30 text-mint-ink',
    label: 'D',
  },
]

export function AnswerButton({
  index,
  text,
  selected,
  disabled,
  correct,
  revealed,
  onClick,
}: AnswerButtonProps) {
  const theme = ANSWER_THEMES[index % ANSWER_THEMES.length]
  const Shape = ANSWER_SHAPES[index % ANSWER_SHAPES.length]

  let variantStyles = `${theme.bg} ${theme.border} shadow-md`

  if (revealed) {
    if (correct) {
      variantStyles = 'bg-[#10b981] text-white ring-4 ring-emerald-300 scale-[1.02] shadow-lg border-b-[#059669]'
    } else if (selected) {
      variantStyles = 'bg-[#e53935] text-white opacity-85 ring-4 ring-rose-400 border-b-[#b71c1c]'
    } else {
      variantStyles = 'bg-[#0a2239]/80 text-[#64748b] opacity-40 border-[#1e3a5f]'
    }
  } else if (selected) {
    variantStyles = `${theme.bg} ring-4 ring-[#00d2ff] scale-[1.02] shadow-xl`
  }

  return (
    <motion.button
      whileHover={disabled ? {} : { scale: 1.015 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`relative w-full min-h-[4.5rem] p-4 rounded-2xl border-b-4 flex items-center justify-between transition-all duration-150 select-none text-left cursor-pointer disabled:cursor-not-allowed ${variantStyles}`}
    >
      <div className="flex items-center gap-3.5 pr-2 min-w-0">
        <div className="shrink-0 w-9 h-9 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center font-black text-lg">
          <Shape className="w-5 h-5 fill-current" />
        </div>
        <span className="font-semibold text-lg md:text-xl leading-snug line-clamp-3">
          {text}
        </span>
      </div>

      <div className="shrink-0 ml-2">
        {revealed && correct && (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white text-emerald-700 font-extrabold text-sm">
            <Check className="w-4 h-4 stroke-[3]" />
          </span>
        )}
        {revealed && selected && !correct && (
          <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-white text-rose-700 font-extrabold text-sm">
            <X className="w-4 h-4 stroke-[3]" />
          </span>
        )}
        {!revealed && selected && (
          <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full bg-white/30 backdrop-blur-md font-bold text-xs">
            Selected
          </span>
        )}
      </div>
    </motion.button>
  )
}
