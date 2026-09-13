import { Metadata } from 'next'
import { StageControlClient } from './stage-control-client'
import { getStageData } from '@/lib/stage-loader'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "Quizmaster Control Deck — Live Stage Quiz",
  description: "Live Quizmaster & Host Control Panel for INGENIUM 2026 Stage Quiz.",
}

export default function StageControlPage() {
  const stageData = getStageData()
  return <StageControlClient stageData={stageData} />
}
