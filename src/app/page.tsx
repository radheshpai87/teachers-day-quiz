'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  QrFrame,
  Book,
  ThumbtackPin,
} from '@/components/icons'
import { NotebookBackgroundDecor } from '@/components/notebook-background-decor'
import { YentechFooterCredit } from '@/components/yentech-branding'
import { EventImageCarousel } from '@/components/event-carousel'
import { motion } from 'framer-motion'

const ENGINEERS_DAY_QUOTES = [
  {
    quote: "Remember, your work is only done when it is done right.",
    author: "Sir M. Visvesvaraya",
  },
  {
    quote: "The scientist explores what is; the engineer creates what has never been.",
    author: "Theodore von Kármán",
  },
  {
    quote: "Science is about knowing; engineering is about doing.",
    author: "Henry Petroski",
  },
  {
    quote: "Engineers turn dreams into reality.",
    author: "Hayao Miyazaki",
  },
  {
    quote: "Engineering is the professional art of applying science to the benefit of humankind.",
    author: "Dr. A.P.J. Abdul Kalam",
  },
  {
    quote: "Strive for perfection in everything you do. Take the best that exists and make it better.",
    author: "Sir Henry Royce",
  },
]

export default function HomePage() {
  const [quote, setQuote] = useState(ENGINEERS_DAY_QUOTES[0])

  // Pick a fresh random quote on client mount after hydration
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * ENGINEERS_DAY_QUOTES.length)
    setQuote(ENGINEERS_DAY_QUOTES[randomIndex])
  }, [])

  return (
    <main className="min-h-dvh notebook-paper flex flex-col items-center justify-center px-4 sm:px-6 py-3 sm:py-6 pb-safe text-center select-none relative overflow-hidden">
      {/* Consistent Blueprint Background Geometry */}
      <NotebookBackgroundDecor />

      {/* Main Content Container */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md flex flex-col items-center space-y-3.5 sm:space-y-5 z-10"
      >
        {/* Yenepoya School of Engineering and Technology Logo */}
        <div className="flex items-center justify-center py-1 sm:py-2">
          <Image
            src="/yenepoya-school-engineering-and-technology.svg?v=2"
            alt="Yenepoya School of Engineering and Technology"
            width={380}
            height={100}
            priority
            className="h-14 sm:h-22 max-w-[85vw] w-auto object-contain drop-shadow-sm brightness-200"
          />
        </div>

        {/* Title */}
        <div className="space-y-0.5 sm:space-y-1">
          <h1 className="text-2xl sm:text-4xl font-black text-ink tracking-tight leading-tight">
            Engineers' Day Live Quiz
          </h1>
          <p className="text-xs sm:text-sm font-extrabold text-ink-soft">
            Celebrating innovation, precision, and the minds that build our future.
          </p>
        </div>

        {/* Main Hero Card with Event Carousel */}
        <div className="w-full notebook-card p-3.5 sm:p-6 space-y-3.5 sm:space-y-5 bg-[#0e2e4e]">
          {/* Auto-playing Event Image Carousel */}
          <EventImageCarousel />

          {/* Primary Join Action Button */}
          <Link
            href="/join"
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-[#00d2ff] hover:bg-[#38bdf8] text-[#081a2e] font-black text-base sm:text-lg border-2 border-[#081a2e] shadow-[4px_4px_0px_#04101d] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 sm:gap-2.5"
          >
            <QrFrame className="w-5 h-5 sm:w-6 sm:h-6" />
            <span>Join Live Quiz</span>
          </Link>
        </div>

        {/* Engineers' Day Quote Sticky Note Card */}
        <div className="w-full sticky-note-lavender p-3.5 sm:p-5 rounded-xl sm:rounded-2xl border-2 border-[#081a2e] shadow-[3px_3px_0px_#04101d] sm:shadow-[4px_4px_0px_#04101d] space-y-2 sm:space-y-3 text-left relative rotate-0 sm:-rotate-1">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-[#081a2e] uppercase tracking-wider">
              <Book className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#081a2e]" />
              <span>Engineers' Day Quote</span>
            </div>
            <ThumbtackPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#081a2e] opacity-70" />
          </div>

          <p className="text-xs sm:text-sm font-extrabold text-[#081a2e] leading-snug italic">
            "{quote.quote}"
          </p>

          <p className="text-[11px] sm:text-xs font-black text-[#081a2e] text-right">
            — {quote.author}
          </p>
        </div>

        {/* YENTECH Official Student Club Footer Credit */}
        <YentechFooterCredit />
      </motion.div>
    </main>
  )
}
