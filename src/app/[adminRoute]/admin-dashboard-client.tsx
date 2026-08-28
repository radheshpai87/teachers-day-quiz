'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { apiGet, apiPost } from '@/lib/client/api'
import { adminPath } from '@/lib/admin-route'
import type { HostFrame } from '@/lib/types'
import { useHostStream } from '@/lib/client/use-stream'
import { Users, HelpCircle, Trophy, Target, Play, Edit, FileText, ArrowRight, RotateCcw } from 'lucide-react'

export function AdminDashboardClient() {
  const { snapshot } = useHostStream()
  const [initialData, setInitialData] = useState<HostFrame | null>(null)

  useEffect(() => {
    apiGet<HostFrame>('/api/admin/snapshot')
      .then((res) => setInitialData(res))
      .catch(() => {})
  }, [])

  const current = snapshot || initialData

  const playersCount = current?.players ?? 0
  const totalQuestions = current?.totalRounds ?? 5
  const avgScore = current?.averageScore ?? 0
  const rawAccuracy = current?.averageAccuracy ?? 0
  const avgAccuracy = Math.round(rawAccuracy <= 1 ? rawAccuracy * 100 : rawAccuracy)
  const status = current?.status ?? 'WAITING'

  return (
    <div className="w-full space-y-6">
      {/* Welcome & Overview Card */}
      <div className="notebook-card p-6 sm:p-8 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="px-3 py-1 rounded-full sticky-note-lavender font-extrabold text-xs uppercase tracking-wider">
              Admin Overview
            </span>
            <h1 className="text-3xl font-black text-ink mt-2">
              {current?.quiz?.name || "Teachers' Day Quiz"}
            </h1>
            <p className="text-sm text-ink-soft mt-0.5 font-medium">
              {current?.quiz?.description || 'Event control room & analytics.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={adminPath('live')}
              className="px-6 py-3 rounded-xl bg-[#7b1fa2] text-white font-extrabold text-sm border-2 border-ink shadow-[3px_3px_0px_#2a2440] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Open Live Control</span>
            </Link>

            <button
              type="button"
              onClick={async () => {
                if (
                  confirm(
                    'Resetting the game will remove all connected players and return the quiz to the waiting lobby. All questions and settings will remain unchanged. Proceed?',
                  )
                ) {
                  try {
                    await apiPost('/api/admin/control', { action: 'reset' })
                    alert('Quiz reset successfully! Connected players removed.')
                  } catch {
                    alert('Failed to reset quiz.')
                  }
                }
              }}
              className="px-5 py-3 rounded-xl sticky-note-yellow text-ink font-extrabold text-sm border-2 border-ink shadow-[3px_3px_0px_#2a2440] hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#d32f2f]" />
              <span>Reset Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Participants */}
        <div className="sticky-note-lavender p-5 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-ink text-xs font-black uppercase">
            <Users className="w-4 h-4 text-[#7b1fa2]" />
            <span>Participants</span>
          </div>
          <div className="tnum text-3xl font-black text-ink">
            {playersCount.toLocaleString()}
          </div>
        </div>

        {/* Questions */}
        <div className="sticky-note-mint p-5 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-ink text-xs font-black uppercase">
            <HelpCircle className="w-4 h-4 text-[#1976d2]" />
            <span>Questions</span>
          </div>
          <div className="tnum text-3xl font-black text-ink">
            {totalQuestions}
          </div>
        </div>

        {/* Average Score */}
        <div className="sticky-note-yellow p-5 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-ink text-xs font-black uppercase">
            <Trophy className="w-4 h-4 text-[#d32f2f]" />
            <span>Avg. Score</span>
          </div>
          <div className="tnum text-3xl font-black text-ink">
            {avgScore.toLocaleString()}
          </div>
        </div>

        {/* Average Accuracy */}
        <div className="sticky-note-rose p-5 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-ink text-xs font-black uppercase">
            <Target className="w-4 h-4 text-[#388e3c]" />
            <span>Avg. Accuracy</span>
          </div>
          <div className="tnum text-3xl font-black text-ink">
            {avgAccuracy}%
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Link
          href={adminPath('live')}
          className="notebook-card-interactive p-5 space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#7b1fa2] text-white flex items-center justify-center font-bold border-2 border-ink">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-ink text-base">Live Quiz Console</h3>
            <ArrowRight className="w-4 h-4 text-ink-soft group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-ink-soft font-medium">
            Status: <span className="font-black text-[#7b1fa2] uppercase">{status}</span>. Single-click start & monitor.
          </p>
        </Link>

        <Link
          href={adminPath('questions')}
          className="notebook-card-interactive p-5 space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#1976d2] text-white flex items-center justify-center font-bold border-2 border-ink">
            <Edit className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-ink text-base">Question Pool</h3>
            <ArrowRight className="w-4 h-4 text-ink-soft group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-ink-soft font-medium">
            Add, reorder via drag-and-drop, set timers and upload images.
          </p>
        </Link>

        <Link
          href={adminPath('results')}
          className="notebook-card-interactive p-5 space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#388e3c] text-white flex items-center justify-center font-bold border-2 border-ink">
            <FileText className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-ink text-base">Event Results</h3>
            <ArrowRight className="w-4 h-4 text-ink-soft group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-ink-soft font-medium">
            View full participant leaderboards and export data to CSV.
          </p>
        </Link>
      </div>
    </div>
  )
}
