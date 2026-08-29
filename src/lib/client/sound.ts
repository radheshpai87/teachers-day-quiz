'use client'

/**
 * Lightweight Web Audio synthesizer for zero-dependency sound effects.
 * Uses native Web Audio API oscillators and gain envelopes for instant playback
 * without requiring external MP3/WAV asset downloads.
 */

class SoundFX {
  private ctx: AudioContext | null = null
  private enabled = true

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quiz_sound_enabled')
      if (saved !== null) this.enabled = saved === 'true'
    }
  }

  private init() {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) this.ctx = new AudioCtx()
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  get isEnabled() {
    return this.enabled
  }

  toggle(): boolean {
    this.enabled = !this.enabled
    if (typeof window !== 'undefined') {
      localStorage.setItem('quiz_sound_enabled', String(this.enabled))
    }
    if (this.enabled) this.tap()
    return this.enabled
  }

  /** Tap feedback for answer selection */
  tap() {
    if (!this.enabled) return
    const ctx = this.init()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(440, ctx.currentTime)
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05)

      gain.gain.setValueAtTime(0.15, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.05)
    } catch {}
  }

  /** Ticking sound for the final countdown seconds */
  tick() {
    if (!this.enabled) return
    const ctx = this.init()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(800, ctx.currentTime)

      gain.gain.setValueAtTime(0.2, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.04)
    } catch {}
  }

  /** Cheerful major chord chime for a correct answer */
  correct() {
    if (!this.enabled) return
    const ctx = this.init()
    if (!ctx) return

    try {
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08)

        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08)
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.08 + 0.02)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.35)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + i * 0.08)
        osc.stop(ctx.currentTime + i * 0.08 + 0.35)
      })
    } catch {}
  }

  /** Low descending tone for an incorrect answer */
  wrong() {
    if (!this.enabled) return
    const ctx = this.init()
    if (!ctx) return

    try {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(220, ctx.currentTime)
      osc.frequency.linearRampToValueAtTime(140, ctx.currentTime + 0.25)

      gain.gain.setValueAtTime(0.18, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      osc.stop(ctx.currentTime + 0.25)
    } catch {}
  }

  /** Celebratory fanfare for final leaderboard & podium */
  celebrate() {
    if (!this.enabled) return
    const ctx = this.init()
    if (!ctx) return

    try {
      const notes = [440, 554.37, 659.25, 880, 1108.73]
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1)

        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.45)

        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime + i * 0.1)
        osc.stop(ctx.currentTime + i * 0.1 + 0.45)
      })
    } catch {}
  }
}

export const sound = new SoundFX()
