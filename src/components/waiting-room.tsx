'use client'

import { ParticipantAvatar } from '@/components/participant-avatar'
import { GraduationCap, Book, Pencil, Chalkboard, Star, Users, PaperClip } from '@/components/icons'
import { motion } from 'framer-motion'
import { ShieldAlert } from 'lucide-react'

interface WaitingRoomProps {
  name: string
  avatarSeed: string
  playersCount: number
  quizName?: string
}

export function WaitingRoom({ name, avatarSeed, playersCount, quizName = "Teachers' Day Quiz" }: WaitingRoomProps) {
  return (
    <div className="w-full max-w-xl mx-auto flex flex-col items-center justify-center py-4 px-3 space-y-6 select-none">
      {/* Decorative Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full notebook-card p-6 text-center space-y-3 relative"
      >
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full sticky-note-yellow text-ink font-black text-xs uppercase tracking-wider -rotate-1">
          <PaperClip className="w-4 h-4 text-ink" />
          <GraduationCap className="w-4 h-4 text-ink" />
          <span>{quizName}</span>
        </div>

        <h1 className="text-3xl font-black text-ink">
          You're In!
        </h1>

        <p className="text-ink-soft text-sm sm:text-base font-extrabold max-w-md mx-auto">
          Ready to celebrate the teachers who inspire us?
        </p>
      </motion.div>

      {/* Participant Profile Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="w-full notebook-card p-6 flex flex-col items-center text-center space-y-4"
      >
        <div className="relative">
          <ParticipantAvatar seed={avatarSeed} size="xl" className="border-2 border-ink shadow-[4px_4px_0px_#2a2440]" />
        </div>

        <div className="space-y-1">
          <span className="text-xs uppercase font-black tracking-wider text-ink-soft">
            Participant Profile
          </span>
          <h2 className="text-2xl font-black text-ink">{name}</h2>
        </div>

        <div className="w-full border-t-2 border-ink my-1" />

        {/* Live Players Pill */}
        <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl sticky-note-yellow border-2 border-ink text-ink font-black text-sm shadow-[2px_2px_0px_#2a2440]">
          <Users className="w-4 h-4 text-ink animate-bounce" />
          <span className="tnum font-black text-[#0284c7]">{playersCount}</span>
          <span>{playersCount === 1 ? 'player joined' : 'players joined'}</span>
        </div>
      </motion.div>

      {/* Important Quiz Rules & Anti-Cheat Note */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="w-full sticky-note-rose p-5 rounded-2xl border-2 border-ink shadow-[3px_3px_0px_#2a2440] text-left space-y-2"
      >
        <div className="flex items-center gap-2 text-[#b71c1c] font-black text-sm uppercase tracking-wider">
          <ShieldAlert className="w-5 h-5 shrink-0 animate-pulse" />
          <span>Important Rules & Anti-Cheat Notice</span>
        </div>
        <ul className="text-xs font-bold text-ink space-y-1.5 list-disc list-inside">
          <li>
            <strong className="text-[#b71c1c]">Strict Window Lock:</strong> Once the quiz starts, do <strong>NOT</strong> switch tabs, leave the browser, or minimize the window. Leaving the quiz tab will <strong>auto-submit your test immediately</strong>.
          </li>
          <li>
            <strong className="text-ink">Copy Protection:</strong> Text selection, right-clicking, and copy keyboard shortcuts are strictly disabled during the exam.
          </li>
          <li>
            <strong className="text-ink">Auto-Save:</strong> Your answers are recorded live as you tap each option.
          </li>
        </ul>
      </motion.div>

      {/* Motifs Footer */}
      <div className="flex items-center justify-center gap-6 text-ink-soft font-black pt-1">
        <div className="flex items-center gap-1.5 text-xs">
          <Pencil className="w-4 h-4 text-[#d32f2f]" />
          <span>Interactive</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Star className="w-4 h-4 text-[#fbc02d]" />
          <span>Live Scores</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <Book className="w-4 h-4 text-[#1976d2]" />
          <span>Teachers' Day</span>
        </div>
      </div>
    </div>
  )
}
