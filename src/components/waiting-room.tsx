'use client'

import { ParticipantAvatar } from '@/components/participant-avatar'
import { GraduationCap, Book, Pencil, Chalkboard, Star, Users, PaperClip } from '@/components/icons'
import { motion } from 'framer-motion'

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

      {/* Waiting Status Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="w-full sticky-note-mint p-5 rounded-2xl flex items-center gap-4 border-2 border-ink"
      >
        <div className="w-10 h-10 rounded-xl bg-paper-cream border-2 border-ink flex items-center justify-center shrink-0 text-ink">
          <Chalkboard className="w-5 h-5" />
        </div>
        <div className="text-left space-y-0.5">
          <p className="font-black text-ink text-sm sm:text-base">
            Waiting for the quiz to begin...
          </p>
          <p className="text-xs text-ink-soft font-extrabold">
            The host will start the quiz shortly. Keep this screen open!
          </p>
        </div>
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
