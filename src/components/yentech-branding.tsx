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
      className={`flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-4 gap-y-1.5 py-2 w-full max-w-full text-center px-2 ${className}`}
    >
      {/* Line 1 (on mobile/narrow) / Segment 1 (on desktop/wide): Powered by YENTECH */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-extrabold text-ink-soft shrink-0">
        <span>Powered by</span>
        <Image
          src="/yentech.png"
          alt="YENTECH Logo"
          width={160}
          height={44}
          priority
          className="h-5 sm:h-6 w-auto object-contain shrink-0 drop-shadow-xs"
        />
      </div>

      {/* Line 2 (on mobile/narrow) / Segment 2 (on desktop/wide): Official Technical Club of YSET */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs font-extrabold text-ink-soft shrink-0">
        <span>Official Technical Club of</span>
        <Image
          src="/yenepoya-school-engineering-and-technology.svg"
          alt="YSET Logo"
          width={180}
          height={48}
          priority
          className="h-5 sm:h-6 w-auto object-contain shrink-0 drop-shadow-xs"
        />
      </div>
    </div>
  )
}
