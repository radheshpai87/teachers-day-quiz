'use client'

import { useEffect, useState } from 'react'
import { apiGet } from '@/lib/client/api'
import type { ResultsSummary } from '@/lib/types'
import { ParticipantAvatar } from '@/components/participant-avatar'
import { Download, Users, Trophy, Target, CheckCircle } from 'lucide-react'

export function AdminResultsClient() {
  const [results, setResults] = useState<ResultsSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiGet<ResultsSummary>('/api/admin/results')
      .then((res) => setResults(res))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleExportCsv = () => {
    window.open('/api/admin/results/export', '_blank')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8 text-ink-soft font-bold">
        <span>Loading final results...</span>
      </div>
    )
  }

  if (!results) {
    return (
      <div className="flex items-center justify-center p-8 text-ink-soft">
        <span>No results found.</span>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink">Event Final Results</h1>
          <p className="text-xs text-ink-soft font-semibold">
            {results.quizName} (Run ID: {results.runId})
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          className="px-5 py-2.5 rounded-xl bg-[#0284c7] text-white font-black text-xs border-2 border-ink shadow-[3px_3px_0px_#2a2440] hover:-translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="sticky-note-lavender p-5 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-ink text-xs font-black uppercase">
            <Users className="w-4 h-4 text-[#0284c7]" />
            <span>Participants</span>
          </div>
          <div className="tnum text-3xl font-black text-ink">
            {results.participants}
          </div>
        </div>

        <div className="sticky-note-mint p-5 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-ink text-xs font-black uppercase">
            <CheckCircle className="w-4 h-4 text-[#388e3c]" />
            <span>Completed</span>
          </div>
          <div className="tnum text-3xl font-black text-ink">
            {results.completed}
          </div>
        </div>

        <div className="sticky-note-yellow p-5 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-ink text-xs font-black uppercase">
            <Trophy className="w-4 h-4 text-[#d32f2f]" />
            <span>Avg. Score</span>
          </div>
          <div className="tnum text-3xl font-black text-ink">
            {results.averageScore.toLocaleString()}
          </div>
        </div>

        <div className="sticky-note-rose p-5 rounded-2xl space-y-1">
          <div className="flex items-center gap-2 text-ink text-xs font-black uppercase">
            <Target className="w-4 h-4 text-[#1976d2]" />
            <span>Avg. Accuracy</span>
          </div>
          <div className="tnum text-3xl font-black text-ink">
            {Math.round(results.averageAccuracy)}%
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="notebook-card p-6 space-y-4 overflow-x-auto">
        <h2 className="text-base font-black text-ink">Full Participant Rankings</h2>

        <table className="w-full text-left text-xs sm:text-sm border-collapse">
          <thead>
            <tr className="border-b-2 border-ink text-ink-soft uppercase text-[10px] font-black tracking-wider">
              <th className="py-3 px-2 text-center w-12">Rank</th>
              <th className="py-3 px-3">Participant</th>
              <th className="py-3 px-3">Phone Number</th>
              <th className="py-3 px-3">College / Institution</th>
              <th className="py-3 px-3 text-right">Score</th>
              <th className="py-3 px-3 text-right">Correct</th>
              <th className="py-3 px-3 text-right">Accuracy</th>
              <th className="py-3 px-3 text-right">Avg Response</th>
            </tr>
          </thead>
          <tbody className="divide-y border-ink">
            {results.rows.map((row) => (
              <tr key={row.id} className="hover:bg-note-yellow/30 transition-colors">
                <td className="py-3 px-2 text-center font-black tnum text-ink">
                  #{row.rank}
                </td>
                <td className="py-3 px-3 font-extrabold text-ink">
                  <div className="flex items-center gap-2.5">
                    <ParticipantAvatar seed={row.avatarSeed} size="sm" />
                    <span>{row.name}</span>
                  </div>
                </td>
                <td className="py-3 px-3 font-bold text-ink-soft tnum">
                  {row.phone || 'N/A'}
                </td>
                <td className="py-3 px-3 font-black text-ink">
                  <span className="px-2 py-0.5 rounded-md sticky-note-mint text-xs border border-ink shadow-[1px_1px_0px_#231f20]">
                    {row.college || 'Yenepoya University'}
                  </span>
                </td>
                <td className="py-3 px-3 text-right font-black tnum text-[#0284c7]">
                  {row.score.toLocaleString()}
                </td>
                <td className="py-3 px-3 text-right font-bold tnum text-ink-soft">
                  {row.correct} / {results.totalQuestions}
                </td>
                <td className="py-3 px-3 text-right font-black tnum text-[#388e3c]">
                  {Math.round(row.accuracy)}%
                </td>
                <td className="py-3 px-3 text-right font-bold tnum text-ink-soft">
                  {row.averageResponseSeconds.toFixed(1)}s
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
