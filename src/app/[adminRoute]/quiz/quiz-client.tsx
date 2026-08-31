'use client'

import { useEffect, useState } from 'react'
import { apiGet, apiPut } from '@/lib/client/api'
import type { Quiz } from '@/lib/types'
import { TIMER_CHOICES } from '@/lib/types'
import { Save, Check } from 'lucide-react'

export function AdminQuizClient() {
  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [defaultTimer, setDefaultTimer] = useState(20)
  const [revealSeconds, setRevealSeconds] = useState(5)
  const [leaderboardSeconds, setLeaderboardSeconds] = useState(5)

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    apiGet<{ quiz: Quiz }>('/api/admin/quiz')
      .then((res) => {
        setQuiz(res.quiz)
        setName(res.quiz.name)
        setDescription(res.quiz.description)
        setDefaultTimer(res.quiz.defaultTimer)
        setRevealSeconds(res.quiz.revealSeconds)
        setLeaderboardSeconds(res.quiz.leaderboardSeconds)
      })
      .catch((err: unknown) => {
        console.error('Failed to load quiz settings:', err)
      })
      .finally(() => setLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('Please provide a quiz title.')
      return
    }

    try {
      setSaving(true)
      const res = await apiPut<{ quiz: Quiz }>('/api/admin/quiz', {
        name: name.trim(),
        description: description.trim(),
        defaultTimer: Number(defaultTimer) || 20,
        revealSeconds: Number(revealSeconds) || 5,
        leaderboardSeconds: Number(leaderboardSeconds) || 5,
      })
      setQuiz(res.quiz)
      setName(res.quiz.name)
      setDescription(res.quiz.description)
      setDefaultTimer(res.quiz.defaultTimer)
      setRevealSeconds(res.quiz.revealSeconds)
      setLeaderboardSeconds(res.quiz.leaderboardSeconds)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Failed to update quiz settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !quiz) {
    return (
      <div className="flex items-center justify-center p-8 text-ink-soft font-bold">
        <span>Loading quiz configuration...</span>
      </div>
    )
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-ink">Quiz Settings</h1>
        <p className="text-xs text-ink-soft font-medium">
          Configure event details and automatic transition timers.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="notebook-card p-6 space-y-5">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black uppercase text-ink-soft">
            Quiz Title
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-ink bg-paper-cream text-ink font-extrabold text-base focus:outline-hidden focus:ring-2 focus:ring-[#0284c7]"
          />
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black uppercase text-ink-soft">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-4 py-2.5 rounded-xl border-2 border-ink bg-paper-cream text-ink text-sm font-semibold focus:outline-hidden"
          />
        </div>

        {/* Global Question Timer */}
        <div className="space-y-2">
          <label className="block text-xs font-black uppercase text-ink-soft">
            Question Timer Duration (Applies to all questions)
          </label>
          <div className="flex flex-wrap gap-2">
            {TIMER_CHOICES.map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setDefaultTimer(sec)}
                className={`px-4 py-2 rounded-xl border-2 border-ink text-xs font-extrabold transition-all cursor-pointer ${
                  defaultTimer === sec
                    ? 'bg-[#0284c7] text-white shadow-[2px_2px_0px_#2a2440]'
                    : 'bg-paper-cream text-ink hover:bg-note-yellow'
                }`}
              >
                {sec} seconds
              </button>
            ))}
          </div>
          <p className="text-[11px] font-bold text-ink-soft pt-0.5">
            Every question in the quiz will give participants {defaultTimer} seconds to answer.
          </p>
        </div>

        {/* Transition Durations */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase text-ink-soft">
              Answer Reveal Duration
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={2}
                max={60}
                value={revealSeconds}
                onChange={(e) => setRevealSeconds(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border-2 border-ink bg-paper-cream text-ink font-bold text-sm"
              />
              <span className="text-xs text-ink-soft font-bold shrink-0">seconds</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase text-ink-soft">
              Leaderboard Phase Duration
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={2}
                max={60}
                value={leaderboardSeconds}
                onChange={(e) => setLeaderboardSeconds(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl border-2 border-ink bg-paper-cream text-ink font-bold text-sm"
              />
              <span className="text-xs text-ink-soft font-bold shrink-0">seconds</span>
            </div>
          </div>
        </div>

        {savedSuccess && (
          <div className="p-3 rounded-xl sticky-note-mint font-extrabold text-xs flex items-center gap-2 text-ink">
            <Check className="w-4 h-4 text-[#388e3c]" />
            <span>Quiz settings updated and live engine synchronized!</span>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-[#0284c7] text-white font-black text-sm border-2 border-ink shadow-[3px_3px_0px_#2a2440] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving Settings...' : 'Save Configuration'}</span>
        </button>
      </form>
    </div>
  )
}
