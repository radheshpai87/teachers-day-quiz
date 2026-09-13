import { Metadata } from 'next'
import { StagePptPresentation } from '@/components/stage-ppt-presentation'

export const metadata: Metadata = {
  title: "INGENIUM 2026 — Live Stage Quiz (PPT Presentation)",
  description: "Live Stage Finale Presentation for Top 6 Qualifiers of Engineers' Day Quiz.",
}

export default function StagePage() {
  return <StagePptPresentation />
}
