'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveSession, loadSession } from '@/lib/client/idb'
import { apiPost } from '@/lib/client/api'
import { ParticipantAvatar } from '@/components/participant-avatar'
import Image from 'next/image'
import { ArrowUp } from '@/components/icons'
import { NotebookBackgroundDecor } from '@/components/notebook-background-decor'
import { motion } from 'framer-motion'
import { YentechFooterCredit } from '@/components/yentech-branding'

const COLLEGE_LIST = [
  'Yenepoya Medical College',
  'Yenepoya Dental College',
  'Yenepoya Nursing College',
  'Yenepoya Pharmacy College & Research Centre',
  'Yenepoya Physiotherapy College',
  'Yenepoya Institute of Arts, Science, Commerce & Management (YIASCM)',
  'Yenepoya School of Allied Health Sciences',
  'Yenepoya Homoeopathic Medical College & Hospital',
  'Yenepoya Ayurveda Medical College & Hospital',
  'Yenepoya Technology Zone / Engineering & Technology',
  'Yenepoya Research Centre (YRC)',
  'Other External Institution',
]

export default function JoinPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [college, setCollege] = useState('')
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
    const trimmedName = name.trim()
    const trimmedPhone = phone.trim()
    const trimmedCollege = college.trim()

    if (!trimmedName) {
      setError('Please enter your full name')
      return
    }
    if (!trimmedPhone || trimmedPhone.length < 10) {
      setError('Please enter a valid 10-digit phone number')
      return
    }
    if (!trimmedCollege) {
      setError('Please select your College / Institution from the dropdown')
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
        phone: trimmedPhone,
        college: trimmedCollege,
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
    <main className="min-h-dvh notebook-paper flex flex-col items-center justify-center pl-7 pr-3 sm:px-6 py-6 pb-safe select-none relative overflow-hidden">
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
              src="/yenepoya-university-logo.svg"
              alt="Yenepoya University Logo"
              width={360}
              height={120}
              priority
              className="h-14 sm:h-20 max-w-[85vw] w-auto object-contain drop-shadow-sm"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink">
            Join the Celebration
          </h1>
          <p className="text-xs sm:text-sm text-ink-soft font-bold">
            Enter your details to participate in the Teachers' Day Live Quiz
          </p>
        </div>

        {/* Join Form Card */}
        <div className="w-full notebook-card p-6 sm:p-8 space-y-5 bg-[#fffdf7]">
          {/* Avatar Preview */}
          <div className="flex flex-col items-center space-y-1.5">
            <ParticipantAvatar seed={previewSeed} size="xl" className="shadow-[3px_3px_0px_#231f20] border-2 border-ink" />
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
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (error) setError(null)
                }}
                placeholder="Enter your full name"
                maxLength={32}
                autoFocus
                className="w-full px-4 py-3 rounded-xl border-2 border-ink bg-paper-cream text-ink font-extrabold text-base focus:outline-hidden focus:ring-3 focus:ring-[#6bc4e8] transition-all placeholder:text-ink-faint shadow-[2px_2px_0px_#231f20]"
              />
            </div>

            {/* Phone Number Field */}
            <div className="space-y-1.5">
              <label htmlFor="participant-phone" className="block text-xs font-black uppercase text-ink-soft">
                Phone Number *
              </label>
              <input
                id="participant-phone"
                suppressHydrationWarning
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))
                  if (error) setError(null)
                }}
                placeholder="Enter 10-digit mobile number"
                className="w-full px-4 py-3 rounded-xl border-2 border-ink bg-paper-cream text-ink font-extrabold text-base focus:outline-hidden focus:ring-3 focus:ring-[#6bc4e8] transition-all placeholder:text-ink-faint shadow-[2px_2px_0px_#231f20]"
              />
            </div>

            {/* College / Institution Dropdown Select */}
            <div className="space-y-1.5">
              <label htmlFor="participant-college" className="block text-xs font-black uppercase text-ink-soft">
                College / Institution *
              </label>
              <select
                id="participant-college"
                suppressHydrationWarning
                value={college}
                onChange={(e) => {
                  setCollege(e.target.value)
                  if (error) setError(null)
                }}
                className="w-full px-4 py-3 rounded-xl border-2 border-ink bg-paper-cream text-ink font-extrabold text-sm focus:outline-hidden focus:ring-3 focus:ring-[#6bc4e8] transition-all shadow-[2px_2px_0px_#231f20] cursor-pointer"
              >
                <option value="">-- Choose your College --</option>
                {COLLEGE_LIST.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="text-xs font-black text-[#231f20] sticky-note-rose p-3 rounded-xl border border-ink shadow-[2px_2px_0px_#231f20]">
                {error}
              </div>
            )}

            <button
              suppressHydrationWarning
              type="submit"
              disabled={loading || !name.trim() || phone.length < 10 || !college.trim()}
              className="w-full py-4 px-6 rounded-2xl bg-[#6bc4e8] hover:bg-[#38bdf8] text-[#231f20] font-black text-lg border-2 border-ink shadow-[4px_4px_0px_#231f20] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
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
