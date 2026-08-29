'use client'

import { useEffect, useRef, useState } from 'react'
import type { ClientState, HostFrame } from '@/lib/types'

export type StreamStatus = 'connecting' | 'open' | 'reconnecting' | 'invalid'

interface Options {
  participantId?: string
  /** Projector / display mode: aggregate state, no personal fields. */
  display?: boolean
}

export function useQuizStream({ participantId, display }: Options) {
  const [state, setState] = useState<ClientState | null>(null)
  const [status, setStatus] = useState<StreamStatus>('connecting')
  const [showReconnecting, setShowReconnecting] = useState(false)
  const [players, setPlayers] = useState(0)
  const [lastReaction, setLastReaction] = useState<{ id: string; emoji: import('@/lib/types').ReactionEmoji; senderName?: string } | null>(null)

  // Positive when the server clock is ahead of this device.
  const clockOffset = useRef(0)

  useEffect(() => {
    if (!display && !participantId) return

    const url = display ? '/api/stream?role=display' : `/api/stream?pid=${encodeURIComponent(participantId!)}`
    const source = new EventSource(url)
    let cancelled = false
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const fetchFallbackState = async () => {
      if (cancelled) return
      try {
        const fetchUrl = display
          ? '/api/me?role=display'
          : participantId
          ? `/api/me?pid=${encodeURIComponent(participantId)}`
          : null
        if (!fetchUrl) return

        const res = await fetch(fetchUrl, { cache: 'no-store' })
        if (res.status === 404 && !cancelled && !display) {
          setStatus('invalid')
          source.close()
          return
        }
        if (res.ok && !cancelled) {
          const data = await res.json()
          if (data?.state) {
            clockOffset.current = data.state.serverNow - Date.now()
            setPlayers(data.state.players || 0)
            setState((prev) => {
              if (
                prev &&
                prev.phase === data.state.phase &&
                prev.roundIndex === data.state.roundIndex &&
                prev.players === data.state.players &&
                prev.question?.question.id === data.state.question?.question.id &&
                prev.question?.yourChoice === data.state.question?.yourChoice &&
                prev.reveal?.yourChoice === data.state.reveal?.yourChoice
              ) {
                return prev
              }
              return data.state
            })
          }
        }
      } catch {
        /* offline -- keep retrying */
      }
    }

    // Immediately fetch state once on mount and maintain a 1000ms heartbeat poll for guaranteed sync
    fetchFallbackState()
    const pollInterval = setInterval(fetchFallbackState, 1000)

    source.onopen = () => {
      if (cancelled) return
      setStatus('open')
      setShowReconnecting(false)
      if (reconnectTimer) clearTimeout(reconnectTimer)
    }

    source.onmessage = (event) => {
      if (cancelled) return
      let frame: ClientState | { t: 'players'; players: number } | { t: 'invalid' } | { t: 'reaction'; id: string; emoji: import('@/lib/types').ReactionEmoji; senderName?: string }
      try {
        frame = JSON.parse(event.data)
      } catch {
        return
      }

      if ('t' in frame && frame.t === 'invalid') {
        setStatus('invalid')
        source.close()
        return
      }

      if (frame.t === 'players') {
        setPlayers(frame.players)
        return
      }

      if (frame.t === 'reaction') {
        setLastReaction({ id: frame.id, emoji: frame.emoji, senderName: frame.senderName })
        return
      }

      if (frame.t === 'state') {
        clockOffset.current = frame.serverNow - Date.now()
        setPlayers(frame.players)
        setState((prev) => {
          if (
            prev &&
            prev.phase === frame.phase &&
            prev.roundIndex === frame.roundIndex &&
            prev.players === frame.players &&
            prev.question?.question.id === frame.question?.question.id &&
            prev.question?.yourChoice === frame.question?.yourChoice &&
            prev.reveal?.yourChoice === frame.reveal?.yourChoice
          ) {
            return prev
          }
          return frame
        })
      }
    }

    source.onerror = async () => {
      if (cancelled) return
      setStatus('reconnecting')

      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          if (!cancelled) setShowReconnecting(true)
        }, 3500)
      }

      fetchFallbackState()
    }

    return () => {
      cancelled = true
      if (reconnectTimer) clearTimeout(reconnectTimer)
      clearInterval(pollInterval)
      source.close()
    }
  }, [participantId, display])

  return { state, status, showReconnecting, players, clockOffset, lastReaction }
}

/** The same subscription for the authenticated host screen. */
export function useHostStream() {
  const [snapshot, setSnapshot] = useState<HostFrame | null>(null)
  const [status, setStatus] = useState<StreamStatus>('connecting')
  const [liveTally, setLiveTally] = useState<{
    answered: number
    players: number
    spread: number[]
    perQuestion: { questionId: string; answered: number }[]
  } | null>(null)
  const clockOffset = useRef(0)

  useEffect(() => {
    const source = new EventSource('/api/admin/stream')
    let cancelled = false

    const fetchHostFallback = async () => {
      if (cancelled) return
      try {
        const res = await fetch('/api/admin/snapshot', { cache: 'no-store' })
        if (res.ok && !cancelled) {
          const data = await res.json()
          if (data) {
            clockOffset.current = (data.serverNow || Date.now()) - Date.now()
            setSnapshot(data)
          }
        }
      } catch {}
    }

    // Immediately fetch snapshot on mount and maintain a 1000ms polling heartbeat for bulletproof sync
    fetchHostFallback()
    const pollInterval = setInterval(fetchHostFallback, 1000)

    source.onopen = () => {
      if (cancelled) return
      setStatus('open')
    }

    source.onerror = () => {
      if (cancelled) return
      setStatus('reconnecting')
      fetchHostFallback()
    }

    source.onmessage = (event) => {
      if (cancelled) return
      let frame: HostFrame | { t: 'tally'; answered: number; players: number; spread: number[]; perQuestion: { questionId: string; answered: number }[] } | { t: 'players'; players: number }
      try {
        frame = JSON.parse(event.data)
      } catch {
        return
      }

      if (frame.t === 'host') {
        clockOffset.current = frame.serverNow - Date.now()
        setSnapshot(frame)
        setLiveTally(null)
      } else if (frame.t === 'tally') {
        setLiveTally({
          answered: frame.answered,
          players: frame.players,
          spread: frame.spread,
          perQuestion: frame.perQuestion,
        })
      } else if (frame.t === 'players') {
        setSnapshot((prev) => (prev ? { ...prev, players: frame.players } : prev))
      }
    }

    return () => {
      cancelled = true
      clearInterval(pollInterval)
      source.close()
    }
  }, [])

  return { snapshot, status, liveTally, clockOffset }
}
