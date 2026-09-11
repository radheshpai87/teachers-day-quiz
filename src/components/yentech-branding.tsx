'use client'

import Image from 'next/image'

export function YentechBranding({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center justify-center gap-2.5 p-2 px-3 rounded-xl bg-[#0e2e4e] border-2 border-[#00d2ff] text-ink shadow-[2px_2px_0px_#04101d] ${className}`}
    >
      <span className="text-xs font-black text-ink-soft tracking-wide uppercase">Powered by</span>
      <Image
        src="/yentech.png?v=4"
        alt="YENTECH Logo"
        width={140}
        height={40}
        className="h-7 w-auto object-contain drop-shadow-sm"
      />
    </div>
  )
}

export function YentechFooterCredit({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center py-2.5 w-full max-w-full text-center px-2 select-none ${className}`}
    >
      <div className="flex items-center justify-center gap-2.5 sm:gap-3.5">
        <span className="text-xs sm:text-base font-black text-ink-soft tracking-wider uppercase drop-shadow-xs">
          Powered by
        </span>
        <Image
          src="/yentech.png?v=4"
          alt="YENTECH Logo"
          width={280}
          height={75}
          priority
          className="h-8 sm:h-12 w-auto object-contain shrink-0 drop-shadow-md"
        />
      </div>
    </div>
  )
}
