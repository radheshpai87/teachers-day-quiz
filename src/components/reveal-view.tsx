'use client'

import { useEffect } from 'react'
import type { RevealPhasePayload, SelfState } from '@/lib/types'
import { ANSWER_SHAPES } from '@/components/icons'
import { Check, Cross, Bolt } from '@/components/icons'
import { sound } from '@/lib/client/sound'
import { motion } from 'framer-motion'

interface RevealViewProps {
  reveal: RevealPhasePayload
  self?: SelfState
}

const ANSWER_COLORS = [
  'bg-[#e53935]',
  'bg-[#1e88e5]',
  'bg-[#fb8c00]',
  'bg-[#43a047]',
]

export function RevealView({ reveal, self }: RevealViewProps) {
  const {
    options,
    correctIndex,
    explanation,
    distribution,
    totalAnswers,
    yourChoice,
    yourCorrect,
    yourPoints,
  } = reveal

  useEffect(() => {
    if (yourCorrect) {
      sound.correct()
    } else if (yourChoice !== null) {
      sound.wrong()
    }
  }, [yourCorrect, yourChoice])

  const maxAnswers = Math.max(1, ...distribution)

  return (
    <div className="w-full max-w-xl mx-auto flex flex-col space-y-5 px-3 py-2 select-none">
      {/* Result Status Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full p-6 text-center space-y-2 rounded-2xl border-2 border-[#081a2e] shadow-[4px_4px_0px_#04101d] ${
          yourCorrect
            ? 'sticky-note-mint text-[#081a2e]'
            : yourChoice !== null
            ? 'sticky-note-rose text-white'
            : 'sticky-note-yellow text-[#081a2e]'
        }`}
      >
        <div className="flex items-center justify-center gap-2">
          {yourCorrect ? (
            <div className="w-12 h-12 rounded-xl bg-[#081a2e] text-[#10b981] border-2 border-[#081a2e] flex items-center justify-center shadow-[2px_2px_0px_#04101d]">
              <Check className="w-7 h-7 stroke-[3]" />
            </div>
          ) : yourChoice !== null ? (
            <div className="w-12 h-12 rounded-xl bg-[#081a2e] text-[#f43f5e] border-2 border-[#081a2e] flex items-center justify-center shadow-[2px_2px_0px_#04101d]">
              <Cross className="w-7 h-7 stroke-[3]" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-xl bg-[#081a2e] text-[#fbbf24] border-2 border-[#081a2e] flex items-center justify-center shadow-[2px_2px_0px_#04101d]">
              <Bolt className="w-7 h-7" />
            </div>
          )}
        </div>

        <h2 className="text-2xl sm:text-3xl font-black">
          {yourCorrect
            ? 'Correct!'
            : yourChoice !== null
            ? 'Incorrect!'
            : 'Time Expired!'}
        </h2>

        {yourCorrect && (
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#081a2e] text-[#00d2ff] font-black text-sm border border-[#081a2e] tnum">
            <Bolt className="w-4 h-4 fill-current text-[#fbbf24]" />
            <span>+{yourPoints.toLocaleString()} points</span>
          </div>
        )}

        {self && (
          <div className="text-xs font-black pt-1 opacity-90">
            Total Score: <span className="tnum font-black underline">{self.score.toLocaleString()}</span>
          </div>
        )}
      </motion.div>

      {/* Answer Distribution Breakdown */}
      <div className="w-full notebook-card p-5 space-y-4 bg-[#0e2e4e] border-2 border-[#00d2ff] shadow-[4px_4px_0px_#04101d]">
        <h3 className="text-xs uppercase font-black tracking-wider text-ink-soft text-center">
          Answer Distribution ({totalAnswers} answers)
        </h3>

        <div className="space-y-3">
          {options.map((optText, idx) => {
            const count = distribution[idx] || 0
            const percentage = totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0
            const barWidth = Math.max(8, Math.round((count / maxAnswers) * 100))
            const isCorrect = idx === correctIndex
            const isYourChoice = idx === yourChoice
            const Shape = ANSWER_SHAPES[idx % ANSWER_SHAPES.length]

            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between gap-2 text-xs font-black text-ink">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-5 h-5 shrink-0 rounded-md ${ANSWER_COLORS[idx]} text-white flex items-center justify-center text-[10px] border border-[#081a2e]`}>
                      <Shape className="w-3.5 h-3.5 fill-current" />
                    </span>
                    <span className="truncate min-w-0">{optText}</span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {isCorrect && (
                      <span className="px-1.5 py-0.5 rounded bg-[#10b981] text-[#081a2e] text-[10px] font-black border border-[#081a2e] shrink-0">
                        CORRECT
                      </span>
                    )}
                    {isYourChoice && (
                      <span className="px-1.5 py-0.5 rounded sticky-note-yellow text-[#081a2e] text-[10px] font-black border border-[#081a2e] shrink-0 shadow-xs">
                        YOU
                      </span>
                    )}
                    <span className="tnum font-black shrink-0 whitespace-nowrap ml-0.5">
                      {count} ({percentage}%)
                    </span>
                  </div>
                </div>

                <div className="h-4 w-full bg-[#082038] rounded-full overflow-hidden p-0.5 border border-[#00d2ff]/30">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barWidth}%` }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className={`h-full rounded-full ${
                      isCorrect ? 'bg-[#10b981]' : ANSWER_COLORS[idx]
                    }`}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Explanation text if present */}
        {explanation && (
          <div className="mt-4 pt-3 border-t-2 border-[#00d2ff]/30 text-xs sm:text-sm text-[#081a2e] font-semibold sticky-note-yellow p-3.5 rounded-xl border-2 border-[#081a2e] shadow-[2px_2px_0px_#04101d]">
            <span className="font-black text-[#081a2e] block mb-0.5">Did you know?</span>
            {explanation}
          </div>
        )}
      </div>
    </div>
  )
}
