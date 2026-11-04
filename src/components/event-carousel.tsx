'use client'

import Image from 'next/image'

export function EventImageCarousel() {
  return (
    <div className="w-full overflow-hidden rounded-xl border-2 border-[#8b5cf6] bg-[#120726] relative aspect-[16/10] max-h-52 sm:max-h-64 shadow-[2px_2px_0px_#090214] select-none">
      <Image
        src="/technova-hero.jpg"
        alt="TECHNOVA 2026 — AI and Innovation"
        fill
        priority
        className="object-cover"
      />
    </div>
  )
}
