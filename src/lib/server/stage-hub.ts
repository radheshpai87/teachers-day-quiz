import type { StageFinalist } from '@/lib/stage-sync'

export interface StageServerState {
  slideIndex: number
  isRevealed: boolean
  mcqOptionStep: number
  rapidQuestionIdx: number
  rapidSeconds: number
  timerRunning: boolean
  finalists: StageFinalist[]
  audioState?: {
    playing: boolean
    audioId: string | null
    audioUrl?: string
    timestamp: number
  }
  updatedAt: number
}

declare global {
  var __stageState: StageServerState | undefined
  var __stageClients: Set<(data: string) => void> | undefined
  var __stageTimerInterval: NodeJS.Timeout | undefined
}

if (!global.__stageClients) {
  global.__stageClients = new Set()
}

if (!global.__stageState) {
  global.__stageState = {
    slideIndex: 0,
    isRevealed: false,
    mcqOptionStep: 0,
    rapidQuestionIdx: 0,
    rapidSeconds: 60,
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

function startServerTimer() {
  if (global.__stageTimerInterval) {
    clearInterval(global.__stageTimerInterval)
    global.__stageTimerInterval = undefined
  }

  global.__stageTimerInterval = setInterval(() => {
    if (!global.__stageState || !global.__stageState.timerRunning) {
      if (global.__stageTimerInterval) {
        clearInterval(global.__stageTimerInterval)
        global.__stageTimerInterval = undefined
      }
      return
    }

    if (global.__stageState.rapidSeconds <= 1) {
      global.__stageState.rapidSeconds = 0
      global.__stageState.timerRunning = false
      global.__stageState.updatedAt = Date.now()
      if (global.__stageTimerInterval) {
        clearInterval(global.__stageTimerInterval)
        global.__stageTimerInterval = undefined
      }
      broadcastStageState(global.__stageState)
      return
    }

    global.__stageState.rapidSeconds -= 1
    global.__stageState.updatedAt = Date.now()
    broadcastStageState(global.__stageState)
  }, 1000)
}

function stopServerTimer() {
  if (global.__stageTimerInterval) {
    clearInterval(global.__stageTimerInterval)
    global.__stageTimerInterval = undefined
  }
}

export function getStageState(): StageServerState {
  return global.__stageState!
}

export function updateStageState(patch: Partial<StageServerState>): StageServerState {
  const previousSlide = global.__stageState?.slideIndex

  global.__stageState = {
    ...global.__stageState!,
    ...patch,
    updatedAt: Date.now(),
  }

  // If slide changed to a different slide, reset timer
  if (patch.slideIndex !== undefined && patch.slideIndex !== previousSlide) {
    stopServerTimer()
    global.__stageState.timerRunning = false
    global.__stageState.rapidSeconds = 60
  } else if (patch.timerRunning !== undefined) {
    if (patch.timerRunning) {
      if (global.__stageState.rapidSeconds <= 0) {
        global.__stageState.rapidSeconds = 60
      }
      startServerTimer()
    } else {
      stopServerTimer()
    }
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
