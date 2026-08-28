'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveSession, loadSession } from '@/lib/client/idb'
import { apiPost } from '@/lib/client/api'
import { ParticipantAvatar } from '@/components/participant-avatar'
import { GraduationCap, ArrowUp, PaperClip } from '@/components/icons'
import { NotebookBackgroundDecor } from '@/components/notebook-background-decor'
import { YentechBranding } from '@/components/yentech-branding'
import { motion } from 'framer-motion'

export default function JoinPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewSeed = name.trim() ? `preview-${name.trim()}` : 'preview-guest'

  useEffect(() => {
    loadSession().then((session) => {
      if (session?.participantId) {
        router.replace('/play')
      }
    })
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) {
      setError('Please enter your name to join')
      return
    }

    try {
      setLoading(true)
      setError(null)

      const res = await apiPost<{
        participantId: string
        name: string
        avatarSeed: string
        runId: string
        quizName: string
      }>('/api/join', { name: trimmed })

      await saveSession({
        participantId: res.participantId,
        name: res.name,
        avatarSeed: res.avatarSeed,
        runId: res.runId,
        quizName: res.quizName,
        savedAt: Date.now(),
      })

      router.replace('/play')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join quiz')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-dvh notebook-paper flex flex-col items-center justify-center pl-7 pr-3 sm:px-6 py-4 pb-safe select-none relative overflow-hidden">
      {/* Consistent Notebook Background Geometry */}
      <NotebookBackgroundDecor />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md flex flex-col items-center space-y-6 text-center z-10"
      >
        {/* Header Branding */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full sticky-note-yellow text-ink font-black text-xs uppercase tracking-wider -rotate-1 shadow-[2.5px_2.5px_0px_#2a2440]">
              <PaperClip className="w-4 h-4 text-ink" />
              <GraduationCap className="w-4 h-4 text-ink" />
              <span>Teachers' Day Quiz</span>
            </div>
            <YentechBranding />
          </div>
          <h1 className="text-3xl font-black text-ink">
            Join the Celebration
          </h1>
          <p className="text-sm text-ink-soft font-bold">
            Ready to celebrate the teachers who inspire us?
          </p>
        </div>

        {/* Join Card */}
        <div className="w-full notebook-card p-6 sm:p-8 space-y-6 bg-[#fffdf7]">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center space-y-2">
            <ParticipantAvatar seed={previewSeed} size="xl" className="shadow-[3px_3px_0px_#2a2440] border-2 border-ink" />
            <span className="text-xs font-black text-ink-soft">
              Your Avatar
            </span>
          </div>

          <form onSubmit={handleSubmit} suppressHydrationWarning className="space-y-4">
            <div className="space-y-1.5 text-left">
              <label htmlFor="participant-name" className="block text-xs font-black uppercase text-ink-soft">
                What's your name?
              </label>
              <input
                id="participant-name"
                suppressHydrationWarning
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="Enter your name"
                maxLength={32}
                autoFocus
                className="w-full px-4 py-3.5 rounded-xl border-2 border-ink bg-paper-cream text-ink font-extrabold text-base focus:outline-hidden focus:ring-3 focus:ring-[#7b1fa2] transition-all placeholder:text-ink-faint shadow-[2px_2px_0px_#2a2440]"
              />
            </div>

            {error && (
              <div className="text-xs font-black text-ink sticky-note-rose p-3 rounded-xl border border-ink shadow-[2px_2px_0px_#2a2440]">
                {error}
              </div>
            )}

            <button
              suppressHydrationWarning
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full py-4 px-6 rounded-2xl bg-[#7b1fa2] text-white font-black text-lg border-2 border-ink shadow-[4px_4px_0px_#2a2440] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Joining...' : 'Join Quiz'}</span>
              {!loading && <ArrowUp className="w-5 h-5 rotate-90 stroke-[3]" />}
            </button>
          </form>
        </div>
      </motion.div>
    </main>
  )
}
