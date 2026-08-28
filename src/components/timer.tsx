'use client'

import { useCountdown } from '@/lib/client/use-countdown'

interface TimerProps {
  deadline: number | undefined
  clockOffsetMs: number
  totalSeconds: number
  variant?: 'ring' | 'bar'
  size?: 'md' | 'lg'
}

export function Timer({
  deadline,
  clockOffsetMs,
  totalSeconds,
  variant = 'ring',
  size = 'md',
}: TimerProps) {
  const { msLeft, secondsLeft } = useCountdown(deadline, clockOffsetMs)
  const totalMs = Math.max(1, totalSeconds * 1000)
  const fraction = Math.min(1, Math.max(0, msLeft / totalMs))

  const isWarning = secondsLeft <= 2 && secondsLeft > 0

  if (variant === 'bar') {
    return (
      <div className="w-full space-y-1.5 select-none">
        <div className="flex justify-between items-center text-xs font-semibold text-ink-soft">
          <span className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                isWarning ? 'bg-rose-ink animate-ping' : 'bg-lav-ink'
              }`}
            />
            Time Remaining
          </span>
          <span className={`tnum text-sm font-bold ${isWarning ? 'text-rose-ink' : 'text-ink'}`}>
            {secondsLeft}s
          </span>
        </div>
        <div className="h-3 w-full bg-black/5 rounded-full overflow-hidden p-0.5 border border-black/10">
          <div
            className={`h-full rounded-full transition-all duration-100 ease-linear ${
              isWarning ? 'bg-gradient-to-r from-peach-ink to-rose-ink' : 'bg-gradient-to-r from-blue-ink via-lav-ink to-mint-ink'
            }`}
            style={{ width: `${fraction * 100}%` }}
          />
        </div>
      </div>
    )
  }

  const radius = size === 'lg' ? 42 : 32
  const strokeWidth = size === 'lg' ? 7 : 5
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - fraction)
  const svgSize = (radius + strokeWidth) * 2

  return (
    <div
      className={`relative inline-flex items-center justify-center select-none ${
        size === 'lg' ? 'w-24 h-24' : 'w-18 h-18'
      }`}
    >
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${svgSize} ${svgSize}`}>
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          className="stroke-black/10 fill-none"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          className={`fill-none transition-all duration-100 ease-linear ${
            isWarning ? 'stroke-rose-ink' : 'stroke-lav-ink'
          }`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`tnum font-black leading-none ${
            size === 'lg' ? 'text-3xl' : 'text-2xl'
          } ${isWarning ? 'text-rose-ink animate-bounce' : 'text-ink'}`}
        >
          {secondsLeft}
        </span>
      </div>
    </div>
  )
}
