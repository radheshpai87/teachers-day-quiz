'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { NotebookBackgroundDecor } from '@/components/notebook-background-decor'
import { YentechFooterCredit } from '@/components/yentech-branding'
import { PaperClip } from '@/components/icons'
import { Trophy, CheckCircle2, XCircle, RotateCcw, ArrowLeft } from 'lucide-react'
import { sound } from '@/lib/client/sound'

interface PlayerOption {
  id: number
  name: string
  image: string
  isCorrect: boolean
}

const OPTIONS: PlayerOption[] = [
  {
    id: 1,
    name: 'Stuart Binny',
    image: '/players/stuart-binny.png',
    isCorrect: true,
  },
  {
    id: 2,
    name: 'Murali Kartik',
    image: '/players/murali-kartik.png',
    isCorrect: false,
  },
  {
    id: 3,
    name: 'Amit Mishra',
    image: '/players/amit-mishra.png',
    isCorrect: false,
  },
  {
    id: 4,
    name: 'Mohit Sharma',
    image: '/players/mohit-sharma.png',
    isCorrect: false,
  },
]

export default function HiddenQuestionsPage() {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const handleSelectOption = (idx: number) => {
    if (selectedIndex !== null) return
    sound.tap()
    setSelectedIndex(idx)
  }

  const handleReset = () => {
    sound.tap()
    setSelectedIndex(null)
  }

  const selectedPlayer = selectedIndex !== null ? OPTIONS[selectedIndex] : null
  const isCorrect = selectedPlayer?.isCorrect ?? false

  return (
    <main className="min-h-dvh notebook-paper flex flex-col items-center justify-between py-6 px-4 sm:px-8 select-none relative overflow-hidden">
      {/* Notebook Aesthetic Background */}
      <NotebookBackgroundDecor />

      {/* Top Header */}
      <header className="w-full max-w-4xl flex items-center justify-between gap-3 text-ink border-b-2 border-ink pb-3.5 z-10">
        <div className="flex items-center gap-3">
          <Image
            src="/yenepoya-university-logo.svg"
            alt="Yenepoya University Logo"
            width={240}
            height={70}
            priority
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-xs"
          />
          <div className="hidden sm:block border-l-2 border-ink/20 pl-3.5 py-0.5">
            <h1 className="text-xl sm:text-2xl font-black text-ink">
              Interactive Image Quiz
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft font-extrabold flex items-center gap-1">
              <PaperClip className="w-3.5 h-3.5 text-ink" />
              <span>Special Feature Preview</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-full sticky-note-lavender border-2 border-ink text-ink font-black text-xs sm:text-sm flex items-center gap-1.5 shadow-[2px_2px_0px_#231f20] hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </header>

      {/* Main Question Card Area */}
      <div className="w-full max-w-3xl my-auto py-6 z-10 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full sticky-note-yellow p-6 sm:p-8 rounded-3xl border-3 border-ink shadow-[6px_6px_0px_#231f20] space-y-6"
        >
          {/* Question Header Badge */}
          <div className="flex items-center justify-between border-b-2 border-ink/15 pb-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#6bc4e8] text-ink font-black text-xs uppercase tracking-wider border border-ink shadow-[1px_1px_0px_#231f20]">
              <Trophy className="w-3.5 h-3.5 text-ink" />
              Cricket Record Quiz
            </span>
            {selectedIndex !== null && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white text-ink font-black text-xs uppercase tracking-wider border border-ink shadow-[1px_1px_0px_#231f20] hover:bg-paper-cream cursor-pointer"
              >
                <RotateCcw className="w-3 h-3 text-ink" />
                Try Again
              </button>
            )}
          </div>

          {/* Question Prompt */}
          <h2 className="text-lg sm:text-2xl font-black text-ink leading-relaxed">
            "Despite playing only 14 ODI matches in his career, which of these Indian cricketers holds the all-time record for the best ODI bowling figures by an Indian (taking 6 wickets for just 4 runs)?"
          </h2>

          {/* 2x2 Image Options Grid */}
          <div className="grid grid-cols-2 gap-4 sm:gap-6 pt-2">
            {OPTIONS.map((opt, idx) => {
              const isChosen = selectedIndex === idx
              const isLocked = selectedIndex !== null

              // Determine border and background styles based on click outcome
              let cardStyle = 'bg-white border-2 border-ink shadow-[4px_4px_0px_#231f20] hover:scale-[1.02]'
              if (isLocked) {
                if (opt.isCorrect) {
                  cardStyle = 'bg-emerald-50 border-3 border-emerald-600 ring-4 ring-emerald-400 shadow-[4px_4px_0px_#15803d]'
                } else if (isChosen && !opt.isCorrect) {
                  cardStyle = 'bg-rose-50 border-3 border-rose-600 ring-4 ring-rose-400 shadow-[4px_4px_0px_#b91c1c]'
                } else {
                  cardStyle = 'bg-gray-100 border-2 border-ink/40 opacity-60 shadow-none'
                }
              }

              return (
                <motion.button
                  key={opt.id}
                  type="button"
                  disabled={isLocked}
                  whileTap={!isLocked ? { scale: 0.96 } : undefined}
                  onClick={() => handleSelectOption(idx)}
                  className={`relative flex flex-col rounded-2xl overflow-hidden text-left transition-all duration-200 cursor-pointer ${cardStyle} ${
                    isLocked ? 'cursor-default' : ''
                  }`}
                >
                  {/* Option Badge */}
                  <div className="absolute top-2 left-2 z-10 w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-ink text-paper-cream font-black text-xs sm:text-sm flex items-center justify-center border border-white shadow-md">
                    {String.fromCharCode(65 + idx)}
                  </div>

                  {/* Status Indicator Icon */}
                  {isLocked && opt.isCorrect && (
                    <div className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-lg animate-bounce">
                      <CheckCircle2 className="w-5 h-5 stroke-[3]" />
                    </div>
                  )}
                  {isLocked && isChosen && !opt.isCorrect && (
                    <div className="absolute top-2 right-2 z-10 w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg">
                      <XCircle className="w-5 h-5 stroke-[3]" />
                    </div>
                  )}

                  {/* Player Image */}
                  <div className="relative w-full h-36 sm:h-52 bg-slate-100 border-b-2 border-ink/15">
                    <Image
                      src={opt.image}
                      alt={opt.name}
                      fill
                      priority
                      className="object-cover object-top"
                    />
                  </div>

                  {/* Player Name Banner */}
                  <div className="p-3 sm:p-4 text-center bg-white/90 backdrop-blur-xs flex items-center justify-center">
                    <span className="font-black text-ink text-sm sm:text-lg tracking-tight">
                      {opt.name}
                    </span>
                  </div>
                </motion.button>
              )
            })}
          </div>

          {/* Feedback & Success/Error Banner below Grid */}
          <AnimatePresence mode="wait">
            {selectedIndex !== null && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
                className={`p-4 sm:p-5 rounded-2xl border-2 border-ink shadow-[3px_3px_0px_#231f20] text-center ${
                  isCorrect
                    ? 'sticky-note-green text-ink'
                    : 'sticky-note-rose text-ink'
                }`}
              >
                <p className="font-black text-sm sm:text-base leading-relaxed">
                  {isCorrect
                    ? '✅ Correct! Stuart Binny stunned the world in 2014 by taking 6/4 against Bangladesh to defend a total of just 105.'
                    : '❌ Incorrect. The right answer is Stuart Binny (6/4 vs Bangladesh, 2014).'}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Footer Banner */}
      <footer className="w-full max-w-4xl mx-auto flex flex-col items-center justify-center gap-2 border-t-2 border-ink pt-3 z-10">
        <YentechFooterCredit className="py-0" />
      </footer>
    </main>
  )
}
