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
  const totalQuestions = current?.totalRounds ?? current?.quiz?.questionCount ?? 0
  const avgScore = current?.averageScore ?? 0
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
              {current?.quiz?.name || "Engineers' Day Quiz"}
            </h1>
            <p className="text-sm text-ink-soft mt-0.5 font-medium">
              {current?.quiz?.description || 'Event control room & analytics.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              href={adminPath('live')}
              className="px-6 py-3 rounded-xl bg-[#00d2ff] text-[#081a2e] font-black text-sm border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-2"
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
              className="px-5 py-3 rounded-xl sticky-note-yellow text-[#081a2e] font-extrabold text-sm border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] hover:-translate-y-0.5 transition-all flex items-center gap-2 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 text-[#d32f2f]" />
              <span>Reset Event</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="notebook-card p-4 space-y-1">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-bold uppercase tracking-wider">Players</span>
            <Users className="w-4 h-4 text-[#0284c7]" />
          </div>
          <div className="text-2xl font-black text-ink tnum">{playersCount}</div>
        </div>

        <div className="notebook-card p-4 space-y-1">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-bold uppercase tracking-wider">Questions</span>
            <HelpCircle className="w-4 h-4 text-[#388e3c]" />
          </div>
          <div className="text-2xl font-black text-ink tnum">{totalQuestions}</div>
        </div>

        <div className="notebook-card p-4 space-y-1">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-bold uppercase tracking-wider">Avg Score</span>
            <Target className="w-4 h-4 text-[#fb8c00]" />
          </div>
          <div className="text-2xl font-black text-ink tnum">{avgScore}</div>
        </div>

        <div className="notebook-card p-4 space-y-1">
          <div className="flex items-center justify-between text-ink-soft">
            <span className="text-xs font-bold uppercase tracking-wider">Status</span>
            <Trophy className="w-4 h-4 text-[#d32f2f]" />
          </div>
          <div className="text-xl font-black text-ink uppercase">{status}</div>
        </div>
      </div>

      {/* Quick Launch Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href={adminPath('live')}
          className="notebook-card-interactive p-5 space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#00d2ff] text-[#081a2e] flex items-center justify-center font-bold border-2 border-[#081a2e]">
            <Play className="w-5 h-5 fill-current" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-ink text-base">Live Quiz Console</h3>
            <ArrowRight className="w-4 h-4 text-ink-soft group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-ink-soft font-medium">
            Status: <span className="font-black text-[#00d2ff] uppercase">{status}</span>. Single-click start & monitor.
          </p>
        </Link>

        <Link
          href={adminPath('questions')}
          className="notebook-card-interactive p-5 space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#1976d2] text-white flex items-center justify-center font-bold border-2 border-[#081a2e]">
            <Edit className="w-5 h-5" />
          </div>
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-ink text-base">Question Pool</h3>
            <ArrowRight className="w-4 h-4 text-ink-soft group-hover:translate-x-1 transition-transform" />
          </div>
          <p className="text-xs text-ink-soft font-medium">
            Review and manage Round 1 question content.
          </p>
        </Link>

        <Link
          href={adminPath('results')}
          className="notebook-card-interactive p-5 space-y-2 group"
        >
          <div className="w-10 h-10 rounded-xl bg-[#388e3c] text-white flex items-center justify-center font-bold border-2 border-[#081a2e]">
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
