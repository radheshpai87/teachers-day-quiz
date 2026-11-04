import { Metadata } from 'next'
import { StagePptPresentation } from '@/components/stage-ppt-presentation'
import { getStageData } from '@/lib/stage-loader'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'TECHNOVA 2026 — Live Stage Quiz (PPT Presentation)',
  description: 'Live Stage Finale Presentation for Top 6 Qualifiers of TECHNOVA AI and Innovation Quiz.',
}

export default function StagePage() {
  const stageData = getStageData()
  return <StagePptPresentation stageData={stageData} />
}
