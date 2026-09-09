'use client'

import { motion } from 'framer-motion'
import {
  HardHat,
  Gear,
  GearsSet,
  Blueprint,
  Caliper,
  CircuitBoard,
  Ruler,
  Compass,
  PaperClip,
} from '@/components/icons'

export function NotebookBackgroundDecor() {
  return (
    <>
      {/* Blueprint Grid Technical Measurement Marks (Left Side Ruler Tick Marks) */}
      <div className="absolute top-0 bottom-0 left-1 sm:left-3 flex flex-col justify-around py-6 pointer-events-none opacity-50 z-0">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex items-center gap-1">
            <div className="w-2.5 h-0.5 sm:w-4 sm:h-0.5 bg-[#0284c7] border border-ink" />
            <span className="hidden sm:inline text-[8px] font-mono font-black text-ink-soft opacity-60">
              {i * 50}mm
            </span>
          </div>
        ))}
      </div>

      {/* Blueprint Technical Schematic Badge (Top-Left Background) */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-2 left-6 sm:top-8 sm:left-12 opacity-30 sm:opacity-90 text-ink pointer-events-none z-0 scale-75 sm:scale-100 transform origin-top-left"
      >
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border-2 border-ink sticky-note-lavender shadow-[2px_2px_0px_#2a2440]">
          <Blueprint className="w-5 h-5 text-[#0284c7]" />
          <div className="font-mono text-[10px] font-black uppercase text-ink">
            <div>SPEC: ENG-2026</div>
            <div className="text-[8px] text-ink-soft">SCALE 1:1 • REV 2.0</div>
          </div>
        </div>
      </motion.div>

      {/* Rotating Mechanical Gear (Top-Right Background) */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
        className="absolute top-2 right-2 sm:top-10 sm:right-12 opacity-40 sm:opacity-90 text-[#0284c7] pointer-events-none z-0 scale-75 sm:scale-100 transform origin-top-right"
      >
        <Gear className="w-10 h-10 sm:w-16 sm:h-16 stroke-[2]" />
      </motion.div>

      {/* Mid-Page Interlocking Gears & Circuit Traces */}
      <div className="absolute top-1/4 left-5 opacity-30 sm:opacity-80 text-ink pointer-events-none z-0">
        <GearsSet className="w-14 h-14 sm:w-24 sm:h-24 stroke-[1.8] text-[#93d500]" />
      </div>

      <div className="absolute top-1/3 right-4 opacity-40 sm:opacity-90 text-[#0284c7] pointer-events-none z-0">
        <CircuitBoard className="w-10 h-10 sm:w-16 sm:h-16 stroke-[1.8]" />
      </div>

      {/* Bottom-Left Drafting Compass & Caliper */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-4 left-6 sm:bottom-10 sm:left-12 opacity-60 sm:opacity-90 text-[#93d500] pointer-events-none flex items-center gap-2 sm:gap-3 z-0"
      >
        <Compass className="w-6 h-6 sm:w-10 sm:h-10 stroke-[2]" />
        <Caliper className="w-6 h-6 sm:w-10 sm:h-10 stroke-[2] -rotate-12" />
      </motion.div>

      {/* Bottom-Right Engineer Safety Hard Hat */}
      <motion.div
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-4 right-4 sm:bottom-12 sm:right-12 opacity-60 sm:opacity-90 text-[#6bc4e8] pointer-events-none z-0"
      >
        <HardHat className="w-8 h-8 sm:w-14 sm:h-14 stroke-[2.2]" />
      </motion.div>

      {/* Side Floating Technical Sticky Cards (Desktop Viewports) */}
      <div className="absolute top-1/3 left-6 sticky-note-yellow p-4 rounded-xl border-2 border-ink shadow-[3px_3px_0px_#231f20] -rotate-6 hidden xl:block w-48 text-left pointer-events-none z-0">
        <PaperClip className="w-4 h-4 text-[#231f20] mb-1" />
        <p className="text-xs font-black text-[#231f20]">Engineers' Day 2026</p>
        <p className="text-[10px] font-bold text-[#231f20]/80">Honoring Visionaries</p>
      </div>

      <div className="absolute top-1/2 right-6 sticky-note-lavender p-4 rounded-xl border-2 border-ink shadow-[3px_3px_0px_#231f20] rotate-6 hidden xl:block w-48 text-left pointer-events-none z-0">
        <PaperClip className="w-4 h-4 text-[#231f20] mb-1" />
        <p className="text-xs font-black text-[#231f20]">Live Rankings</p>
        <p className="text-[10px] font-bold text-ink-soft">Innovation Hall of Fame</p>
      </div>
    </>
  )
}
