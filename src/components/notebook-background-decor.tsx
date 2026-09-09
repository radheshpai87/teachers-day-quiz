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

      {/* 2. Technical Blueprint Outer Border Frame & Corner L-brackets */}
      <div className="absolute inset-2 sm:inset-4 border-2 border-[#00d2ff]/30 pointer-events-none">
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-[#00d2ff]" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-[#00d2ff]" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-[#00d2ff]" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-[#00d2ff]" />
      </div>

      {/* 3. High-Density Architectural & Engineering Vector Schematics Layer */}
      <svg
        className="absolute inset-0 w-full h-full text-[#00d2ff]/30"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* 100px Blueprint Major Grid */}
          <pattern id="blueprint-grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(0, 210, 255, 0.22)" strokeWidth="1.2" />
            <path d="M 20 0 L 20 100 M 40 0 L 40 100 M 60 0 L 60 100 M 80 0 L 80 100" fill="none" stroke="rgba(0, 210, 255, 0.07)" strokeWidth="0.8" />
            <path d="M 0 20 L 100 20 M 0 40 L 100 40 M 0 60 L 100 60 M 0 80 L 100 80" fill="none" stroke="rgba(0, 210, 255, 0.07)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#blueprint-grid)" />

        {/* Protractor Radial Degree Scale (Center Background) */}
        <g stroke="currentColor" strokeWidth="1" fill="none" className="opacity-40">
          <circle cx="20%" cy="42%" r="220" strokeDasharray="6 4" />
          <circle cx="20%" cy="42%" r="160" strokeDasharray="3 3" />
          <circle cx="20%" cy="42%" r="5" fill="currentColor" />
          <line x1="20%" y1="20%" x2="20%" y2="64%" strokeDasharray="4 4" />
          <line x1="2%" y1="42%" x2="38%" y2="42%" strokeDasharray="4 4" />
          <text x="21%" y="39%" fill="currentColor" fontSize="10" fontFamily="monospace" fontWeight="bold">
            R = 220.00 mm • θ = 45.0°
          </text>
        </g>

        {/* Structural Skyscraper / Building Elevation Grid (Left Center) */}
        <g stroke="currentColor" strokeWidth="1.2" fill="none" className="opacity-35 hidden lg:block">
          <path d="M 12% 15% L 28% 15% L 28% 85% L 12% 85% Z" strokeWidth="1.5" />
          <path d="M 12% 25% H 28% M 12% 35% H 28% M 12% 45% H 28% M 12% 55% H 28% M 12% 65% H 28% M 12% 75% H 28%" />
          <path d="M 17% 15% V 85% M 23% 15% V 85%" strokeDasharray="3 3" />
          <text x="13%" y="13%" fill="currentColor" fontSize="10" fontFamily="monospace" fontWeight="bold">
            CIVIL TOWER • H = 150.0m
          </text>
        </g>

        {/* Structural Bridge Truss Blueprint (Top Right) */}
        <g stroke="currentColor" strokeWidth="1.2" fill="none" className="opacity-35 hidden md:block">
          <path d="M 62% 10% L 96% 10% L 92% 26% L 66% 26% Z" strokeWidth="1.5" />
          <path d="M 62% 10% L 72% 26% L 78% 10% L 84% 26% L 90% 10%" />
          <line x1="62%" y1="10%" x2="96%" y2="10%" strokeDasharray="4 4" />
          <text x="72%" y="8%" fill="currentColor" fontSize="10" fontFamily="monospace" fontWeight="bold">
            STRUCTURAL TRUSS • LOAD CAP = 750 kN
          </text>
        </g>

        {/* Robotic Arm & Joint Mechanism Schematic (Mid Right) */}
        <g stroke="currentColor" strokeWidth="1.4" fill="none" className="opacity-35 hidden md:block">
          <circle cx="82%" cy="45%" r="16" strokeWidth="1.8" />
          <line x1="82%" y1="45%" x2="92%" y2="35%" strokeWidth="2.2" />
          <circle cx="92%" cy="35%" r="10" />
          <line x1="92%" y1="35%" x2="96%" y2="48%" strokeWidth="2.2" />
          <path d="M 94% 48% L 98% 46% M 94% 48% L 98% 50%" strokeWidth="2" />
          <text x="78%" y="52%" fill="currentColor" fontSize="9" fontFamily="monospace" fontWeight="bold">
            ROBOTIC ARM • 6-DOF
          </text>
        </g>

        {/* Wind Turbine / Propulsion Fan Blades (Bottom Right Background) */}
        <g stroke="currentColor" strokeWidth="1.2" fill="none" className="opacity-35 hidden sm:block">
          <circle cx="85%" cy="80%" r="65" strokeDasharray="4 4" />
          <circle cx="85%" cy="80%" r="12" fill="currentColor" fillOpacity={0.2} />
          <path d="M 85% 67% C 88% 72%, 88% 76%, 85% 80% C 82% 76%, 82% 72%, 85% 67%" fill="currentColor" fillOpacity={0.15} />
          <path d="M 85% 80% C 89% 83%, 93% 83%, 98% 80% C 93% 77%, 89% 77%, 85% 80%" fill="currentColor" fillOpacity={0.15} />
          <path d="M 85% 80% C 82% 85%, 82% 89%, 85% 93% C 88% 89%, 88% 85%, 85% 80%" fill="currentColor" fillOpacity={0.15} />
          <text x="80%" y="94%" fill="currentColor" fontSize="9" fontFamily="monospace" fontWeight="bold">
            TURBINE FAN • 3000 RPM
          </text>
        </g>

        {/* Rocket Aerodynamic Airframe Blueprint (Center Right) */}
        <g stroke="currentColor" strokeWidth="1.2" fill="none" className="opacity-30 hidden lg:block">
          <path d="M 52% 18% C 54% 24%, 54% 30%, 54% 45% L 50% 45% C 50% 30%, 50% 24%, 52% 18% Z" strokeWidth="1.5" />
          <path d="M 50% 38% H 54% M 50% 42% H 54%" />
          <path d="M 48% 45% L 50% 41% M 56% 45% L 54% 41%" strokeWidth="1.8" />
          <text x="48%" y="16%" fill="currentColor" fontSize="9" fontFamily="monospace" fontWeight="bold">
            AEROSPACE NOZZLE
          </text>
        </g>

        {/* Electronic Microchip & Circuit Array (Bottom Left) */}
        <g stroke="currentColor" strokeWidth="1.2" fill="none" className="opacity-40 hidden sm:block">
          <rect x="6%" y="70%" width="130" height="95" rx="5" strokeWidth="1.8" />
          <path d="M 6% 75% H 2% M 6% 80% H 2% M 6% 85% H 2% M 6% 90% H 2%" />
          <path d="M 19% 75% H 23% M 19% 80% H 23% M 19% 85% H 23% M 19% 90% H 23%" />
          <text x="7%" y="82%" fill="currentColor" fontSize="10" fontFamily="monospace" fontWeight="bold">
            SOC MCU-64 • VCC 3.3V
          </text>
        </g>

        {/* Horizontal Technical Dimensioning Line (Top Center) */}
        <g stroke="currentColor" strokeWidth="1.2" fill="none" className="opacity-55 hidden sm:block">
          <line x1="28%" y1="50" x2="72%" y2="50" strokeWidth="1.5" />
          <line x1="28%" y1="40" x2="28%" y2="60" strokeWidth="1.5" />
          <line x1="72%" y1="40" x2="72%" y2="60" strokeWidth="1.5" />
          <path d="M 28% 50 L 30% 47 L 30% 53 Z" fill="currentColor" />
          <path d="M 72% 50 L 70% 47 L 70% 53 Z" fill="currentColor" />
          <text x="44%" y="44" fill="currentColor" fontSize="11" fontFamily="monospace" fontWeight="bold">
            |&lt;--- 1450.00 mm ---&gt;|
          </text>
        </g>

        {/* Engineering Formulas Blueprint Annotations */}
        <g fill="currentColor" className="opacity-45 hidden md:block" fontFamily="monospace" fontWeight="bold" fontSize="12">
          <text x="4%" y="10%">F = m · a</text>
          <text x="4%" y="14%">V = I · R</text>
          <text x="4%" y="18%">E = m · c²</text>
          <text x="88%" y="65%">PV = nRT</text>
          <text x="88%" y="69%">σ = F / A</text>
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

      {/* 5. Rotating Gears Animation */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
        className="absolute top-3 right-3 sm:top-10 sm:right-12 opacity-50 sm:opacity-90 text-[#00d2ff] pointer-events-none z-0 scale-75 sm:scale-100 transform origin-top-right"
      >
        <Gear className="w-12 h-12 sm:w-20 sm:h-20 stroke-[2]" />
      </motion.div>

      {/* 6. Mid-Page Interlocking Gear Train & Caliper */}
      <div className="absolute top-[14%] left-8 opacity-40 sm:opacity-90 text-[#10b981] pointer-events-none z-0">
        <GearsSet className="w-16 h-16 sm:w-28 sm:h-28 stroke-[1.8]" />
      </div>

      <div className="absolute top-1/3 right-5 opacity-50 sm:opacity-90 text-[#00d2ff] pointer-events-none z-0">
        <CircuitBoard className="w-12 h-12 sm:w-18 sm:h-18 stroke-[1.8]" />
      </div>

      {/* 7. Bottom-Left Drafting Compass & Caliper */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-4 left-6 sm:bottom-10 sm:left-12 opacity-70 sm:opacity-90 text-[#fbbf24] pointer-events-none flex items-center gap-2 sm:gap-3 z-0"
      >
        <Compass className="w-7 h-7 sm:w-12 sm:h-12 stroke-[2]" />
        <Caliper className="w-7 h-7 sm:w-12 sm:h-12 stroke-[2] -rotate-12" />
      </motion.div>

      {/* 8. Bottom-Right Engineer Hard Hat */}
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute bottom-4 right-4 sm:bottom-10 sm:right-10 opacity-70 sm:opacity-90 text-[#38bdf8] pointer-events-none z-0"
      >
        <HardHat className="w-8 h-8 sm:w-14 sm:h-14 stroke-[2.2]" />
      </motion.div>

      {/* 9. Side Blueprint Sticky Specs (Desktop Large Viewports Only) */}
      <div className="absolute top-[42%] left-6 sticky-note-yellow p-4 rounded-xl border-2 border-[#081a2e] shadow-[4px_4px_0px_#04101d] -rotate-6 hidden xl:block w-48 text-left pointer-events-none z-10">
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
