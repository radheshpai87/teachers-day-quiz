'use client'

export interface StageFinalist {
  id: string
  name: string
  avatarSeed: string
  score: number
  roundScores: {
    r1: number
    r2: number
    r3: number
    r4: number
  }
}

export const DEFAULT_STAGE_FINALISTS: StageFinalist[] = [
  { id: 'f1', name: 'Finalist 1', avatarSeed: 'finalist-1', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
  { id: 'f2', name: 'Finalist 2', avatarSeed: 'finalist-2', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
  { id: 'f3', name: 'Finalist 3', avatarSeed: 'finalist-3', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
  { id: 'f4', name: 'Finalist 4', avatarSeed: 'finalist-4', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
  { id: 'f5', name: 'Finalist 5', avatarSeed: 'finalist-5', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
  { id: 'f6', name: 'Finalist 6', avatarSeed: 'finalist-6', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
]

export interface StageSyncMessage {
  type: 'CHANGE_SLIDE' | 'UPDATE_FINALISTS' | 'TOGGLE_REVEAL' | 'TIMER_ACTION' | 'AUDIO_ACTION' | 'MCQ_OPTION_STEP' | 'REQUEST_SYNC' | 'SYNC_STATE'
  payload?: any
}

const CHANNEL_NAME = 'ingenium_stage_sync_v1'

export function getStageBroadcastChannel(): BroadcastChannel | null {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    return new BroadcastChannel(CHANNEL_NAME)
  }
  return null
}

export async function sendStageNetworkSync(patch: Record<string, any>) {
  if (typeof window === 'undefined') return
  try {
    await fetch('/api/stage/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  } catch (err) {
    console.error('Failed to sync over network:', err)
  }
}
