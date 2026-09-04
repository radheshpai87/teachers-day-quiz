'use client'

import Image from 'next/image'

export function YentechBranding({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-flex flex-col items-center justify-center gap-1 p-2 rounded-xl bg-white border-2 border-ink text-ink shadow-[2px_2px_0px_#231f20] ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-extrabold text-ink-soft">Powered by</span>
        <Image
          src="/yentech.png"
          alt="YENTECH Logo"
          width={110}
          height={30}
          className="h-5 sm:h-6 w-auto object-contain"
        />
      </div>
      <div className="flex items-center gap-1.5 text-[10px] font-bold text-ink-soft">
        <span>Official Tech Club of</span>
        <Image
          src="/yenepoya-school-engineering-and-technology.svg"
          alt="YSET Logo"
          width={120}
          height={32}
          className="h-5 sm:h-6 w-auto object-contain"
        />
      </div>
    </div>
  )
}

export function YentechFooterCredit({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex flex-col md:flex-row items-center justify-center gap-1.5 md:gap-4 lg:gap-6 py-2 ${className}`}
    >
      {/* Line 1 (on mobile) / Segment 1 (on desktop): Powered by YENTECH */}
      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold text-ink-soft shrink-0">
        <span>Powered by</span>
        <Image
          src="/yentech.png"
          alt="YENTECH Logo"
          width={160}
          height={44}
          priority
          className="h-6 sm:h-7 md:h-8 w-auto object-contain shrink-0 drop-shadow-xs"
        />
      </div>

      {/* Subtle Dot Separator (Desktop only) */}
      <span className="hidden md:inline-block text-ink-soft/40 font-bold select-none text-base">
        •
      </span>

      {/* Line 2 (on mobile) / Segment 2 (on desktop): Official Technical Club of YSET */}
      <div className="flex items-center justify-center gap-2 text-xs sm:text-sm font-extrabold text-ink-soft shrink-0">
        <span>Official Technical Club of</span>
        <Image
          src="/yenepoya-school-engineering-and-technology.svg"
          alt="YSET Logo"
          width={180}
          height={48}
          priority
          className="h-6 sm:h-7 md:h-8 w-auto object-contain shrink-0 drop-shadow-xs"
        />
      </div>
    </div>
  )
}
