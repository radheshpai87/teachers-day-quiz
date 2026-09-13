import type { StageFinalist } from '@/lib/stage-sync'

export interface StageServerState {
  slideIndex: number
  isRevealed: boolean
  rapidSeconds: number
  timerRunning: boolean
  finalists: StageFinalist[]
  updatedAt: number
}

declare global {
  var __stageState: StageServerState | undefined
  var __stageClients: Set<(data: string) => void> | undefined
}

if (!global.__stageClients) {
  global.__stageClients = new Set()
}

if (!global.__stageState) {
  global.__stageState = {
    slideIndex: 0,
    isRevealed: false,
    rapidSeconds: 40,
    timerRunning: false,
    finalists: [
      { id: 'f1', name: 'Finalist 1', avatarSeed: 'finalist-1', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
      { id: 'f2', name: 'Finalist 2', avatarSeed: 'finalist-2', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
      { id: 'f3', name: 'Finalist 3', avatarSeed: 'finalist-3', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
      { id: 'f4', name: 'Finalist 4', avatarSeed: 'finalist-4', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
      { id: 'f5', name: 'Finalist 5', avatarSeed: 'finalist-5', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
      { id: 'f6', name: 'Finalist 6', avatarSeed: 'finalist-6', score: 0, roundScores: { r1: 0, r2: 0, r3: 0, r4: 0 } },
    ],
    updatedAt: Date.now(),
  }
}

export function getStageState(): StageServerState {
  return global.__stageState!
}

export function updateStageState(patch: Partial<StageServerState>): StageServerState {
  global.__stageState = {
    ...global.__stageState!,
    ...patch,
    updatedAt: Date.now(),
  }
  broadcastStageState(global.__stageState)
  return global.__stageState
}

export function subscribeStage(send: (data: string) => void): () => void {
  global.__stageClients!.add(send)
  return () => {
    global.__stageClients!.delete(send)
  }
}

export function broadcastStageState(state: StageServerState) {
  const payload = `data: ${JSON.stringify(state)}\n\n`
  for (const send of global.__stageClients!) {
    try {
      send(payload)
    } catch {}
  }
}
