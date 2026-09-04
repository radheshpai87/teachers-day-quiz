'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { ReactionEmoji } from '@/lib/types'
import { apiPost } from '@/lib/client/api'
import { Heart, ThumbsUp, Flame, GraduationCap, Sparkles } from 'lucide-react'

interface FloatingReaction {
  id: string
  emoji: ReactionEmoji
  senderName?: string
  x: number // Horizontal percentage (20% - 80%)
}

interface ReactionBarProps {
  participantId?: string
  lastReaction?: { id: string; emoji: ReactionEmoji; senderName?: string } | null
}

const REACTIONS: { id: ReactionEmoji; label: string; icon: React.ReactNode }[] = [
  { id: 'heart', label: 'Heart', icon: <Heart className="w-5 h-5 fill-rose-500 text-rose-500" /> },
  { id: 'clap', label: 'Clap', icon: <ThumbsUp className="w-5 h-5 fill-amber-400 text-amber-500" /> },
  { id: 'fire', label: 'Fire', icon: <Flame className="w-5 h-5 fill-orange-500 text-orange-500" /> },
  { id: 'cap', label: 'Cap', icon: <GraduationCap className="w-5 h-5 fill-sky-500 text-sky-600" /> },
  { id: 'star', label: 'Star', icon: <Sparkles className="w-5 h-5 fill-yellow-400 text-yellow-500" /> },
]

function renderReactionIcon(emoji: ReactionEmoji) {
  switch (emoji) {
    case 'heart':
      return <Heart className="w-7 h-7 sm:w-8 sm:h-8 fill-rose-500 text-rose-500 filter drop-shadow-md" />
    case 'clap':
      return <ThumbsUp className="w-7 h-7 sm:w-8 sm:h-8 fill-amber-400 text-amber-500 filter drop-shadow-md" />
    case 'fire':
      return <Flame className="w-7 h-7 sm:w-8 sm:h-8 fill-orange-500 text-orange-500 filter drop-shadow-md" />
    case 'cap':
      return <GraduationCap className="w-7 h-7 sm:w-8 sm:h-8 fill-sky-500 text-sky-600 filter drop-shadow-md" />
    case 'star':
      return <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 fill-yellow-400 text-yellow-500 filter drop-shadow-md" />
    default:
      return <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 fill-yellow-400 text-yellow-500 filter drop-shadow-md" />
  }
}

export function ReactionOverlayAndBar({ participantId, lastReaction }: ReactionBarProps) {
  const [floating, setFloating] = useState<FloatingReaction[]>([])
  const [cooldown, setCooldown] = useState(false)

  // Listen for incoming reactions from SSE
  useEffect(() => {
    if (!lastReaction) return
    const id = `${lastReaction.id}-${Date.now()}-${Math.random()}`
    const x = Math.floor(Math.random() * 60) + 20 // 20% to 80%

    setFloating((prev) => [...prev.slice(-15), { id, emoji: lastReaction.emoji, senderName: lastReaction.senderName, x }])

    const timer = setTimeout(() => {
      setFloating((prev) => prev.filter((r) => r.id !== id))
    }, 2500)

    return () => clearTimeout(timer)
  }, [lastReaction])

  const handleSendReaction = async (emoji: ReactionEmoji) => {
    if (!participantId || cooldown) return
    setCooldown(true)
    setTimeout(() => setCooldown(false), 500)

    try {
      await apiPost('/api/react', { participantId, emoji })
    } catch {
      /* fail silently on reaction errors */
    }
  }

  return (
    <>
      {/* Floating Reaction Animation Layer */}
      <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
        <AnimatePresence>
          {floating.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: '80vh', scale: 0.5, x: `${item.x}vw` }}
              animate={{
                opacity: [0, 1, 1, 0],
                y: '-10vh',
                scale: [0.5, 1.2, 1, 0.8],
                x: [`${item.x}vw`, `${item.x + (Math.random() * 10 - 5)}vw`],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 2.2, ease: 'easeOut' }}
              className="absolute flex flex-col items-center select-none"
            >
              {renderReactionIcon(item.emoji)}
              {item.senderName && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full sticky-note-yellow text-ink border border-ink shadow-xs mt-1">
                  {item.senderName}
                </span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Interactive Bottom Reaction Bar (Only when participantId is present) */}
      {participantId && (
        <div className="fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-40 flex items-center gap-1.5 p-1.5 rounded-2xl bg-paper-cream/90 backdrop-blur-xs border-2 border-ink shadow-[3px_3px_0px_#2a2440]">
          {REACTIONS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSendReaction(item.id)}
              disabled={cooldown}
              aria-label={item.label}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl hover:bg-note-yellow/60 active:scale-90 transition-all flex items-center justify-center cursor-pointer disabled:opacity-60"
            >
              {item.icon}
            </button>
          ))}
        </div>
      )}
    </>
  )
}
