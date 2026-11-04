'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import {
  QrFrame,
  Book,
  ThumbtackPin,
  CrownDoodle,
  SwirlLoop,
  SparkleRays,
} from '@/components/icons'
import { NotebookBackgroundDecor } from '@/components/notebook-background-decor'
import { YentechFooterCredit } from '@/components/yentech-branding'
import { EventImageCarousel } from '@/components/event-carousel'
import { motion } from 'framer-motion'

const AI_INNOVATION_QUOTES = [
  {
    quote: "Can machines think? Sometimes it is the people no one imagines anything of who do the things that no one can imagine.",
    author: "Alan Turing",
  },
  {
    quote: "Artificial intelligence is the new electricity. It will transform every single facet of human potential.",
    author: "Andrew Ng",
  },
  {
    quote: "Artificial intelligence is not a substitute for human intelligence; it is a tool to amplify human creativity.",
    author: "Dr. Fei-Fei Li",
  },
  {
    quote: "Innovation distinguishes between a leader and a follower. Have the courage to create the future.",
    author: "Steve Jobs",
  },
  {
    quote: "The question of whether machines can think is about understanding the boundless frontiers of human curiosity.",
    author: "Edsger W. Dijkstra",
  },
  {
    quote: "Technology is at its best when it brings people together and solves real-world human challenges.",
    author: "Matt Mullenweg",
  },
]

export default function HomePage() {
  const [quote, setQuote] = useState(AI_INNOVATION_QUOTES[0])

  // Pick a fresh random quote on client mount after hydration
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * AI_INNOVATION_QUOTES.length)
    setQuote(AI_INNOVATION_QUOTES[randomIndex])
  }, [])

  return (
    <main className="min-h-dvh notebook-paper flex flex-col items-center justify-center px-4 sm:px-6 py-4 sm:py-7 pb-safe text-center select-none relative overflow-hidden">
      {/* Consistent TECHNOVA Cyber-Scrapbook Background */}
      <NotebookBackgroundDecor />

      {/* Main Content Container */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md flex flex-col items-center space-y-3.5 sm:space-y-4.5 z-10"
      >
        {/* Presenter Pill Badge from Poster */}
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#261247] border border-[#a855f7]/60 text-[#e9d5ff] font-black text-[11px] sm:text-xs uppercase tracking-wider shadow-[2px_2px_0px_#090214]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
          <span>NSS Unit 1 & Unit 2 Presents</span>
        </div>

        {/* Yenepoya School of Engineering and Technology Logo */}
        <div className="flex items-center justify-center py-0.5 sm:py-1">
          <Image
            src="/yenepoya-school-engineering-and-technology.svg"
            alt="Yenepoya School of Engineering and Technology"
            width={380}
            height={100}
            priority
            className="h-12 sm:h-18 max-w-[85vw] w-auto object-contain drop-shadow"
          />
        </div>

        {/* Quiz Competition Title & TECHNOVA Branding */}
        <div className="space-y-1 relative w-full flex flex-col items-center">
          <div className="flex items-center justify-center gap-2 text-[11px] sm:text-xs font-black uppercase tracking-[0.25em] text-[#c084fc]">
            <span>Q U I Z &nbsp; C O M P E T I T I O N</span>
          </div>

          {/* Main TECHNOVA Title with Crown Doodle */}
          <div className="relative inline-block my-1">
            <h1 className="text-4xl sm:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#ffffff] via-[#e9d5ff] to-[#c084fc] tracking-tight leading-none drop-shadow-[0_4px_16px_rgba(168,85,247,0.45)]">
              TECHNOVA
            </h1>
            <div className="absolute -top-4 -right-4 sm:-top-5 sm:-right-6 text-[#fbbf24] rotate-12 drop-shadow-md">
              <CrownDoodle className="w-8 h-8 sm:w-11 sm:h-11" />
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-32 sm:w-44 text-[#a855f7]/60 pointer-events-none">
              <SwirlLoop className="w-full h-auto" />
            </div>
          </div>

          {/* Torn Kraft Tape Tagline: "Test Your Technology IQ" */}
          <div className="relative inline-flex items-center justify-center mt-2 px-5 py-1.5 tape-strip rounded-sm font-black text-xs sm:text-sm tracking-wide -rotate-1">
            <span>Test Your Technology IQ</span>
          </div>
        </div>

        {/* Main Hero Card with Event Carousel & CTA */}
        <div className="w-full notebook-card p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 bg-[#1e0e38]">
          {/* Event Image Carousel */}
          <EventImageCarousel />

          {/* Primary Join Action Button */}
          <Link
            href="/join"
            className="w-full py-3.5 sm:py-4 px-5 sm:px-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#7c3aed] to-[#9333ea] hover:from-[#6d28d9] hover:to-[#7c3aed] text-white font-black text-base sm:text-lg border-2 border-[#c084fc] shadow-[4px_4px_0px_#090214] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 sm:gap-2.5"
          >
            <QrFrame className="w-5 h-5 sm:w-6 sm:h-6 text-[#fdfbf7]" />
            <span>Join TECHNOVA Quiz</span>
          </Link>
        </div>

        {/* AI & Innovation Quote Card */}
        <div className="w-full notebook-card p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border-2 border-[#8b5cf6]/70 shadow-[3px_3px_0px_#090214] sm:shadow-[4px_4px_0px_#090214] space-y-2 text-left relative rotate-0 sm:-rotate-1 bg-[#1e0e38]">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-[#c084fc] uppercase tracking-wider">
              <Book className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#a855f7]" />
              <span>AI & Innovation Insight</span>
            </div>
            <ThumbtackPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#c084fc]" />
          </div>

          <p className="text-xs sm:text-sm font-extrabold text-[#fdfbf7] leading-snug italic">
            "{quote.quote}"
          </p>

          <p className="text-[11px] sm:text-xs font-black text-[#a855f7] text-right">
            — {quote.author}
          </p>
        </div>

        {/* YENTECH Official Student Club Footer Credit */}
        <YentechFooterCredit />
      </motion.div>
    </main>
  )
}
