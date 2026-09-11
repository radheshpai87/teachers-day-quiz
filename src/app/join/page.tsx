'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveSession, loadSession, clearSession } from '@/lib/client/idb'
import { apiGet, apiPost } from '@/lib/client/api'
import { ParticipantAvatar } from '@/components/participant-avatar'
import Image from 'next/image'
import { ArrowUp } from '@/components/icons'
import { NotebookBackgroundDecor } from '@/components/notebook-background-decor'
import { motion } from 'framer-motion'
import { YentechFooterCredit } from '@/components/yentech-branding'

const YEAR_OPTIONS = ['1st Year', '2nd Year', '3rd Year']
const EDUTECH_OPTIONS = ['Kavium', 'Proxima', 'NxtWave']

export default function JoinPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [year, setYear] = useState('')
  const [edutechPartner, setEdutechPartner] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewSeed = name.trim() ? `preview-${name.trim()}` : 'preview-guest'

  useEffect(() => {
    let active = true
    loadSession().then(async (session) => {
      if (!session?.participantId) return
      try {
        await apiGet(`/api/me?pid=${encodeURIComponent(session.participantId)}`)
        if (active) {
          router.replace('/play')
        }
      } catch {
        await clearSession()
      }
    })
    return () => {
      active = false
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()

    if (!trimmedName) {
      setError('Please enter your full name')
      return
    }
    if (!year) {
      setError('Please select your Year of Study from the dropdown')
      return
    }
    if (!edutechPartner) {
      setError('Please select your Edutech Partner / Program from the dropdown')
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
      }>('/api/join', {
        name: trimmedName,
        year,
        edutechPartner,
      })

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
    <main className="min-h-dvh notebook-paper flex flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-6 pb-safe select-none relative overflow-hidden">
      {/* Consistent Notebook Background Geometry */}
      <NotebookBackgroundDecor />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md flex flex-col items-center space-y-6 text-center z-10"
      >
        {/* Header Branding */}
        <div className="space-y-2">
          <div className="flex items-center justify-center py-1 sm:py-2">
            <Image
              src="/yenepoya-school-engineering-and-technology.svg?v=2"
              alt="Yenepoya School of Engineering and Technology"
              width={380}
              height={100}
              priority
              className="h-14 sm:h-20 max-w-[85vw] w-auto object-contain"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink">
            Join the Celebration
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft font-bold">
            Enter your details to participate in the Engineers' Day Live Quiz
          </p>
        </div>

        {/* Join Form Card */}
        <div className="w-full notebook-card p-6 sm:p-8 space-y-5 bg-[#0e2e4e]">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center space-y-1.5">
            <ParticipantAvatar seed={previewSeed} size="xl" className="shadow-[3px_3px_0px_#04101d] border-2 border-[#00d2ff]" />
            <span className="text-xs font-black text-ink-soft">
              Your Avatar
            </span>
          </div>

          <form onSubmit={handleSubmit} suppressHydrationWarning className="space-y-4 text-left">
            {/* Full Name Field */}
            <div className="space-y-1.5">
              <label htmlFor="participant-name" className="block text-xs font-black uppercase text-ink-soft">
                Full Name *
              </label>
              <input
                id="participant-name"
                suppressHydrationWarning
                type="text"
                required
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="Enter your full name"
                maxLength={32}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border-2 border-[#00d2ff]/40 bg-paper-cream text-ink font-extrabold text-base focus:outline-hidden focus:border-[#00d2ff] focus:ring-2 focus:ring-[#00d2ff]/30 transition-all placeholder:text-ink-faint shadow-[2px_2px_0px_#04101d]"
              />
            </div>

            {/* Year of Study Dropdown Select */}
            <div className="space-y-1.5">
              <label htmlFor="participant-year" className="block text-xs font-black uppercase text-ink-soft">
                Year of Study *
              </label>
              <select
                id="participant-year"
                suppressHydrationWarning
                required
                value={year}
                onChange={(e) => {
                  setYear(e.target.value)
                  if (error) setError(null)
                }}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#00d2ff]/40 bg-paper-cream text-ink font-extrabold text-sm focus:outline-hidden focus:border-[#00d2ff] focus:ring-2 focus:ring-[#00d2ff]/30 transition-all shadow-[2px_2px_0px_#04101d] cursor-pointer"
              >
                <option value="">-- Choose Year of Study --</option>
                {YEAR_OPTIONS.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>

            {/* Edutech Partner / Program Dropdown Select */}
            <div className="space-y-1.5">
              <label htmlFor="participant-edutech" className="block text-xs font-black uppercase text-ink-soft">
                Edutech Partner / Program *
              </label>
              <select
                id="participant-edutech"
                suppressHydrationWarning
                required
                value={edutechPartner}
                onChange={(e) => {
                  setEdutechPartner(e.target.value)
                  if (error) setError(null)
                }}
                className="w-full px-4 py-3 rounded-xl border-2 border-[#00d2ff]/40 bg-paper-cream text-ink font-extrabold text-sm focus:outline-hidden focus:border-[#00d2ff] focus:ring-2 focus:ring-[#00d2ff]/30 transition-all shadow-[2px_2px_0px_#04101d] cursor-pointer"
              >
                <option value="">-- Choose Edutech Partner / Program --</option>
                {EDUTECH_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="text-xs font-black text-white sticky-note-rose p-3 rounded-xl border border-[#00d2ff] shadow-[2px_2px_0px_#04101d]">
                {error}
              </div>
            )}

            <button
              suppressHydrationWarning
              type="submit"
              disabled={loading || !name.trim() || !year || !edutechPartner}
              className="w-full py-4 px-6 rounded-2xl bg-[#00d2ff] hover:bg-[#38bdf8] text-[#081a2e] font-black text-lg border-2 border-[#081a2e] shadow-[4px_4px_0px_#04101d] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              <span>{loading ? 'Joining...' : 'Join Quiz'}</span>
              {!loading && <ArrowUp className="w-5 h-5 rotate-90 stroke-[3]" />}
            </button>
          </form>
        </div>

        {/* Consistent YENTECH & YSET Branding Footer */}
        <YentechFooterCredit />
      </motion.div>
    </main>
  )
}
