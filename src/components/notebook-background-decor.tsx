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
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* 1. Authentic Blueprint Cyan Radial Backdrop Gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, #0b3860 0%, #06223d 70%, #031324 100%)',
        }}
      />

      {/* 2. Technical Blueprint Outer Border Frame & Corner Marks */}
      <div className="absolute inset-2 sm:inset-4 border-2 border-[#00d2ff]/30 pointer-events-none">
        {/* Corner L-brackets */}
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-[#00d2ff]" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-[#00d2ff]" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-[#00d2ff]" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-[#00d2ff]" />
      </div>

      {/* 3. Architectural Blueprint Vector Schematics Layer */}
      <svg
        className="absolute inset-0 w-full h-full text-[#00d2ff]/25"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* 100px Blueprint Major Grid */}
          <pattern id="blueprint-grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(0, 210, 255, 0.2)" strokeWidth="1.2" />
            <path d="M 20 0 L 20 100 M 40 0 L 40 100 M 60 0 L 60 100 M 80 0 L 80 100" fill="none" stroke="rgba(0, 210, 255, 0.06)" strokeWidth="0.8" />
            <path d="M 0 20 L 100 20 M 0 40 L 100 40 M 0 60 L 100 60 M 0 80 L 100 80" fill="none" stroke="rgba(0, 210, 255, 0.06)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#blueprint-grid)" />

        {/* Blueprint Compass Construction Arcs (Center-Left) */}
        <g stroke="currentColor" strokeWidth="1" fill="none" className="opacity-40">
          <circle cx="15%" cy="40%" r="180" strokeDasharray="6 4" />
          <circle cx="15%" cy="40%" r="120" strokeDasharray="3 3" />
          <circle cx="15%" cy="40%" r="4" fill="currentColor" />
          <path d="M 15% 15% L 15% 65%" strokeDasharray="4 4" />
          <path d="M 2% 40% L 30% 40%" strokeDasharray="4 4" />
          <text x="16%" y="38%" fill="currentColor" fontSize="10" fontFamily="monospace" fontWeight="bold">
            R = 180.00 mm
          </text>
        </g>

        {/* Structural Bridge Truss Blueprint (Top Right) */}
        <g stroke="currentColor" strokeWidth="1.2" fill="none" className="opacity-35 hidden md:block">
          <path d="M 65% 12% L 95% 12% L 90% 28% L 70% 28% Z" strokeWidth="1.5" />
          <path d="M 65% 12% L 75% 28% L 80% 12% L 85% 28% L 90% 12%" />
          <line x1="65%" y1="12%" x2="95%" y2="12%" strokeDasharray="4 4" />
          <text x="75%" y="10%" fill="currentColor" fontSize="9" fontFamily="monospace" fontWeight="bold">
            STRUCTURAL TRUSS • LOAD CAP = 500 kN
          </text>
        </g>

        {/* Electronic Microchip & Circuit Lines (Bottom Left) */}
        <g stroke="currentColor" strokeWidth="1.2" fill="none" className="opacity-35 hidden sm:block">
          <rect x="8%" y="70%" width="120" height="90" rx="4" strokeWidth="1.8" />
          <path d="M 8% 75% H 4% M 8% 80% H 4% M 8% 85% H 4% M 8% 90% H 4%" />
          <path d="M 20% 75% H 24% M 20% 80% H 24% M 20% 85% H 24% M 20% 90% H 24%" />
          <text x="9%" y="82%" fill="currentColor" fontSize="10" fontFamily="monospace" fontWeight="bold">
            CPU BUS-32
          </text>
        </g>

        {/* Horizontal Technical Dimensioning Line (Top Center) */}
        <g stroke="currentColor" strokeWidth="1" fill="none" className="opacity-50 hidden sm:block">
          <line x1="30%" y1="60" x2="70%" y2="60" strokeWidth="1.5" />
          <line x1="30%" y1="50" x2="30%" y2="70" strokeWidth="1.5" />
          <line x1="70%" y1="50" x2="70%" y2="70" strokeWidth="1.5" />
          <path d="M 30% 60 L 32% 57 L 32% 63 Z" fill="currentColor" />
          <path d="M 70% 60 L 68% 57 L 68% 63 Z" fill="currentColor" />
          <text x="47%" y="54" fill="currentColor" fontSize="11" fontFamily="monospace" fontWeight="bold">
            |&lt;--- 1250.00 mm ---&gt;|
          </text>
        </g>
      </svg>

      {/* 4. Left Ruler Measurement Scale */}
      <div className="absolute top-0 bottom-0 left-1 sm:left-3 flex flex-col justify-around py-6 pointer-events-none opacity-60 z-0">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 sm:w-5 sm:h-0.5 bg-[#00d2ff]" />
            <span className="hidden sm:inline text-[9px] font-mono font-black text-[#00d2ff]">
              {i * 100}mm
            </span>
          </div>
        ))}
      </div>

      {/* 5. Architectural Blueprint Title Block (Bottom-Right Corner) */}
      <div className="absolute bottom-3 right-3 hidden md:flex flex-col bg-[#071d33]/90 border-2 border-[#00d2ff] p-3 rounded-lg text-left font-mono text-ink shadow-[4px_4px_0px_#04101d] pointer-events-none z-10 max-w-xs">
        <div className="flex items-center justify-between border-b border-[#00d2ff]/40 pb-1 mb-1.5">
          <span className="text-[11px] font-black text-[#00d2ff] tracking-wider uppercase">
            YENEPOYA UNIVERSITY
          </span>
          <span className="text-[9px] font-bold text-[#fbbf24] px-1.5 py-0.5 bg-[#081a2e] rounded border border-[#fbbf24]/40">
            APPROVED
          </span>
        </div>
        <div className="text-[10px] font-extrabold text-white truncate">
          PROJECT: ENGINEERS' DAY LIVE QUIZ 2026
        </div>
        <div className="text-[9px] font-bold text-slate-300 flex items-center justify-between mt-1 pt-1 border-t border-[#00d2ff]/20">
          <span>DWG: YET-ENG-2026</span>
          <span>SCALE: 1:100</span>
          <span>REV: 2.0</span>
        </div>
      </div>

      {/* 6. Rotating Gears Animation */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        className="absolute top-3 right-3 sm:top-10 sm:right-12 opacity-50 sm:opacity-90 text-[#00d2ff] pointer-events-none z-0 scale-75 sm:scale-100 transform origin-top-right"
      >
        <Gear className="w-12 h-12 sm:w-20 sm:h-20 stroke-[2]" />
      </motion.div>

      {/* 7. Mid-Page Interlocking Gear Train & Caliper */}
      <div className="absolute top-1/4 left-5 opacity-40 sm:opacity-90 text-[#10b981] pointer-events-none z-0">
        <GearsSet className="w-16 h-16 sm:w-28 sm:h-28 stroke-[1.8]" />
      </div>

      <div className="absolute top-1/3 right-5 opacity-50 sm:opacity-90 text-[#00d2ff] pointer-events-none z-0">
        <CircuitBoard className="w-12 h-12 sm:w-18 sm:h-18 stroke-[1.8]" />
      </div>

      {/* 8. Bottom-Left Drafting Compass & Caliper */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-4 left-6 sm:bottom-10 sm:left-12 opacity-70 sm:opacity-90 text-[#fbbf24] pointer-events-none flex items-center gap-2 sm:gap-3 z-0"
      >
        <Compass className="w-7 h-7 sm:w-12 sm:h-12 stroke-[2]" />
        <Caliper className="w-7 h-7 sm:w-12 sm:h-12 stroke-[2] -rotate-12" />
      </motion.div>

      {/* 9. Bottom-Right Engineer Hard Hat */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-4 right-4 sm:bottom-12 sm:right-12 opacity-70 sm:opacity-90 text-[#38bdf8] pointer-events-none z-0 md:hidden"
      >
        <HardHat className="w-8 h-8 sm:w-14 sm:h-14 stroke-[2.2]" />
      </motion.div>

      {/* 10. Side Blueprint Sticky Specs (Desktop Large Viewports Only) */}
      <div className="absolute top-1/3 left-6 sticky-note-yellow p-4 rounded-xl border-2 border-[#081a2e] shadow-[4px_4px_0px_#04101d] -rotate-6 hidden xl:block w-48 text-left pointer-events-none z-10">
        <PaperClip className="w-4 h-4 text-[#081a2e] mb-1" />
        <p className="text-xs font-black text-[#081a2e]">Engineers' Day 2026</p>
        <p className="text-[10px] font-bold text-[#081a2e]/80">Honoring Sir M. Visvesvaraya</p>
      </div>

      <div className="absolute top-1/2 right-6 sticky-note-lavender p-4 rounded-xl border-2 border-[#081a2e] shadow-[4px_4px_0px_#04101d] rotate-6 hidden xl:block w-48 text-left pointer-events-none z-10">
        <PaperClip className="w-4 h-4 text-[#081a2e] mb-1" />
        <p className="text-xs font-black text-[#081a2e]">Live Rankings</p>
        <p className="text-[10px] font-bold text-[#081a2e]/80">Innovation Hall of Fame</p>
      </div>
    </div>
  )
}
