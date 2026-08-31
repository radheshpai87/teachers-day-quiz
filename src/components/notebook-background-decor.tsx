'use client'

import { motion } from 'framer-motion'
import {
  GraduationCap,
  Pencil,
  PencilScribble,
  PaperAirplaneDoodle,
  MathFormulaDoodle,
  CompassRulerDoodle,
  DoodleStars,
  PaperClip,
} from '@/components/icons'

export function NotebookBackgroundDecor() {
  return (
    <>
      {/* Left Red Margin Binder Hole Punches (Scaled for mobile left-1 & desktop left-3) */}
      <div className="absolute top-0 bottom-0 left-1 sm:left-3 flex flex-col justify-around py-6 pointer-events-none opacity-40 z-0">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="w-2 h-2 sm:w-3.5 sm:h-3.5 rounded-full bg-[#231f20] border border-ink shadow-inner" />
        ))}
      </div>

      {/* SVG Hand-Drawn Math Formulas (Top-Left Background, Scaled and offset to avoid header collision) */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1.5 left-7 sm:top-8 sm:left-12 opacity-25 sm:opacity-80 text-ink pointer-events-none z-0 scale-75 sm:scale-100 transform origin-top-left"
      >
        <MathFormulaDoodle className="w-28 h-14 sm:w-44 sm:h-24" />
      </motion.div>

      {/* SVG Paper Airplane (Top-Right Background) */}
      <motion.div
        animate={{ y: [0, 6, 0], rotate: [0, -4, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-1.5 right-2 sm:top-10 sm:right-12 opacity-35 sm:opacity-80 text-[#6bc4e8] pointer-events-none z-0 scale-75 sm:scale-100 transform origin-top-right"
      >
        <PaperAirplaneDoodle className="w-10 h-10 sm:w-20 sm:h-20" />
      </motion.div>

      {/* Mid-Page Pencil Scribble & Stars */}
      <div className="absolute top-1/4 left-5 opacity-20 text-ink pointer-events-none z-0">
        <PencilScribble className="w-20 h-7 sm:w-36 sm:h-12 -rotate-12" />
      </div>

      <div className="absolute top-1/3 right-3 opacity-40 text-[#6bc4e8] pointer-events-none z-0">
        <DoodleStars className="w-8 h-8 sm:w-16 sm:h-16 fill-current" />
      </div>

      {/* Bottom-Left Geometry Compass & Pencil */}
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-4 left-6 sm:bottom-10 sm:left-12 opacity-60 sm:opacity-90 text-[#93d500] pointer-events-none flex items-center gap-1.5 sm:gap-3 z-0"
      >
        <CompassRulerDoodle className="w-6 h-6 sm:w-12 sm:h-12 stroke-[2.2]" />
        <Pencil className="w-5 h-5 sm:w-10 sm:h-10 stroke-[2.2] -rotate-45" />
      </motion.div>

      {/* Bottom-Right Graduation Cap */}
      <motion.div
        animate={{ y: [0, 5, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-4 right-4 sm:bottom-12 sm:right-12 opacity-60 sm:opacity-90 text-[#6bc4e8] pointer-events-none z-0"
      >
        <GraduationCap className="w-7 h-7 sm:w-14 sm:h-14 stroke-[2.2]" />
      </motion.div>

      {/* Side Floating Sticky Note Accents (Desktop Large Viewports Only) */}
      <div className="absolute top-1/3 left-6 sticky-note-yellow p-4 rounded-xl border-2 border-ink shadow-[3px_3px_0px_#231f20] -rotate-6 hidden xl:block w-44 text-left pointer-events-none z-0">
        <PaperClip className="w-4 h-4 text-[#231f20] mb-1" />
        <p className="text-xs font-black text-[#231f20]">Campus Event</p>
        <p className="text-[10px] font-bold text-[#231f20]/80">Honoring Teachers</p>
      </div>

      <div className="absolute top-1/2 right-6 sticky-note-lavender p-4 rounded-xl border-2 border-ink shadow-[3px_3px_0px_#231f20] rotate-6 hidden xl:block w-44 text-left pointer-events-none z-0">
        <PaperClip className="w-4 h-4 text-[#231f20] mb-1" />
        <p className="text-xs font-black text-[#231f20]">Live Rankings</p>
        <p className="text-[10px] font-bold text-ink-soft">Top 10 Leaders</p>
      </div>
    </>
  )
}
