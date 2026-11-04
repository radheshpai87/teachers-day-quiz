'use client'

import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  CircuitBoard,
  PaperClip,
  ThumbtackPin,
  CrownDoodle,
  SparkleRays,
  AiChipIcon,
  RobotHandIcon,
  BrainNeuralIcon,
} from '@/components/icons'

export function NotebookBackgroundDecor({ minimal = false }: { minimal?: boolean } = {}) {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none w-full h-full min-h-full">
      {/* 1. Deep Cyber-Violet Backdrop Gradient */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, #260e4d 0%, #17072e 60%, #0d021a 100%)',
        }}
      />

      {/* 2. Top-Left Purple Torn Paper Scrapbook Accent (matching poster) */}
      <div 
        className="absolute -top-12 -left-12 w-48 h-48 sm:w-64 sm:h-64 opacity-50 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, #7c3aed 0%, #581c87 70%, transparent 100%)',
          clipPath: 'polygon(0% 0%, 100% 0%, 85% 60%, 70% 80%, 40% 100%, 0% 85%)',
        }}
      />

      {/* 3. Outer Frame & Corner L-Brackets in Neon Violet */}
      <div className="absolute inset-2 sm:inset-4 border-2 border-[#a855f7]/30 pointer-events-none">
        <div className="absolute -top-1 -left-1 w-4 h-4 border-t-3 border-l-3 border-[#c084fc]" />
        <div className="absolute -top-1 -right-1 w-4 h-4 border-t-3 border-r-3 border-[#c084fc]" />
        <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-3 border-l-3 border-[#c084fc]" />
        <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-3 border-r-3 border-[#c084fc]" />
      </div>

      {/* 4. High-Density AI, Neural Network & Cyber Schematics Layer */}
      <svg
        className="absolute inset-0 w-full h-full text-[#c084fc]/30"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          {/* 100px Cyber-Purple Major Grid */}
          <pattern id="cyber-grid" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(168, 85, 247, 0.22)" strokeWidth="1.2" />
            <path d="M 20 0 L 20 100 M 40 0 L 40 100 M 60 0 L 60 100 M 80 0 L 80 100" fill="none" stroke="rgba(168, 85, 247, 0.07)" strokeWidth="0.8" />
            <path d="M 0 20 L 100 20 M 0 40 L 100 40 M 0 60 L 100 60 M 0 80 L 100 80" fill="none" stroke="rgba(168, 85, 247, 0.07)" strokeWidth="0.8" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cyber-grid)" />

        {/* Neural Network Architecture Grid (Left Center) */}
        <g stroke="currentColor" strokeWidth="1.2" fill="none" className="opacity-35 hidden md:block">
          {/* Input Layer */}
          <circle cx="10%" cy="30%" r="6" fill="#06b6d4" fillOpacity={0.6} />
          <circle cx="10%" cy="40%" r="6" fill="#06b6d4" fillOpacity={0.6} />
          <circle cx="10%" cy="50%" r="6" fill="#06b6d4" fillOpacity={0.6} />
          {/* Hidden Layer 1 */}
          <circle cx="16%" cy="25%" r="7" fill="#8b5cf6" fillOpacity={0.7} />
          <circle cx="16%" cy="35%" r="7" fill="#8b5cf6" fillOpacity={0.7} />
          <circle cx="16%" cy="45%" r="7" fill="#8b5cf6" fillOpacity={0.7} />
          <circle cx="16%" cy="55%" r="7" fill="#8b5cf6" fillOpacity={0.7} />
          {/* Hidden Layer 2 */}
          <circle cx="22%" cy="30%" r="7" fill="#a855f7" fillOpacity={0.8} />
          <circle cx="22%" cy="40%" r="7" fill="#a855f7" fillOpacity={0.8} />
          <circle cx="22%" cy="50%" r="7" fill="#a855f7" fillOpacity={0.8} />
          {/* Synapses lines */}
          <line x1="10%" y1="30%" x2="16%" y2="25%" strokeDasharray="3 2" />
          <line x1="10%" y1="30%" x2="16%" y2="35%" />
          <line x1="10%" y1="40%" x2="16%" y2="35%" />
          <line x1="10%" y1="40%" x2="16%" y2="45%" />
          <line x1="10%" y1="50%" x2="16%" y2="45%" />
          <line x1="10%" y1="50%" x2="16%" y2="55%" />
          <line x1="16%" y1="25%" x2="22%" y2="30%" />
          <line x1="16%" y1="35%" x2="22%" y2="30%" />
          <line x1="16%" y1="35%" x2="22%" y2="40%" />
          <line x1="16%" y1="45%" x2="22%" y2="40%" />
          <line x1="16%" y1="45%" x2="22%" y2="50%" />
          <line x1="16%" y1="55%" x2="22%" y2="50%" />
          <text x="10%" y="22%" fill="currentColor" fontSize="10" fontFamily="monospace" fontWeight="bold">
            DEEP NEURAL NETWORK • SYNAPSE MATRIX
          </text>
        </g>

        {/* AI Transformer Attention & Logic Formulas */}
        <g fill="currentColor" className="opacity-45 hidden md:block" fontFamily="monospace" fontWeight="bold" fontSize="12">
          <text x="4%" y="10%">Attention(Q,K,V) = softmax(QKᵀ / √dₖ) V</text>
          <text x="4%" y="14%">y = σ(W · x + b)</text>
          <text x="4%" y="18%">∇L = ∂Loss / ∂W</text>
          <text x="78%" y="65%">f(x) = max(0, x)</text>
          <text x="78%" y="69%">H(p, q) = -Σ p(x) log q(x)</text>
        </g>

        {/* Cyber Visor Symbol Motif (Top Center) */}
        <g stroke="#c084fc" strokeWidth="1.5" fill="none" className="opacity-40 hidden sm:block">
          <rect x="42%" y="18" width="16%" height="24" rx="12" stroke="#a855f7" strokeWidth="1.5" />
          <text x="47.5%" y="35" fill="#fdfbf7" fontSize="13" fontFamily="monospace" fontWeight="bold">
            &lt; / &gt;
          </text>
        </g>

        {/* Microprocessor AI Core (Bottom Left) */}
        <g stroke="currentColor" strokeWidth="1.2" fill="none" className="opacity-40 hidden sm:block">
          <rect x="6%" y="72%" width="130" height="95" rx="6" strokeWidth="1.8" />
          <path d="M 6% 77% H 2% M 6% 82% H 2% M 6% 87% H 2% M 6% 92% H 2%" />
          <path d="M 19% 77% H 23% M 19% 82% H 23% M 19% 87% H 23% M 19% 92% H 23%" />
          <text x="7.5%" y="84%" fill="currentColor" fontSize="10" fontFamily="monospace" fontWeight="bold">
            NEURAL NPU • 128 TFLOPS
          </text>
        </g>

        {/* Creation of Adam: Pointing Vector Hand (Top Right) */}
        <g stroke="#c084fc" strokeWidth="1.5" fill="none" className="opacity-35 hidden md:block">
          <path d="M 88% 8% L 82% 16% L 77% 18% L 72% 23% L 74% 25% L 79% 20% L 84% 19% L 91% 10% Z" />
          <circle cx="72%" cy="23%" r="3" fill="#06b6d4" />
          <text x="70%" y="29%" fill="currentColor" fontSize="9" fontFamily="monospace" fontWeight="bold">
            AI CREATION // ADAM
          </text>
        </g>
      </svg>

      {/* 5. Left Measurement Ruler Scale */}
      <div className="hidden sm:flex absolute top-0 bottom-0 left-1 sm:left-3 flex-col justify-around py-6 pointer-events-none opacity-60 z-0">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 sm:w-5 sm:h-0.5 bg-[#a855f7]" />
            <span className="hidden sm:inline text-[9px] font-mono font-black text-[#c084fc]">
              {i * 100}mm
            </span>
          </div>
        ))}
      </div>

      {/* 6. Iconic Top-Left Yellow Crown Doodle (positioned above 0mm ruler tick mark) */}
      <div className="absolute top-4 left-4 sm:top-5 sm:left-5 opacity-90 text-[#fbbf24] pointer-events-none z-0">
        <CrownDoodle className="w-8 h-8 sm:w-10 sm:h-10 drop-shadow-sm" />
      </div>

      {!minimal && (
        <>
          {/* 7. Rotating AI Neural Wheel Animation (Top Right) */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 28, repeat: Infinity, ease: 'linear' }}
            className="absolute top-3 right-3 sm:top-8 sm:right-10 opacity-30 sm:opacity-80 text-[#c084fc] pointer-events-none z-0 scale-75 sm:scale-100 transform origin-top-right"
          >
            <CircuitBoard className="w-12 h-12 sm:w-20 sm:h-20 stroke-[1.8]" />
          </motion.div>

          {/* 8. Cyan Sparkles (Mid Right) */}
          <div className="absolute top-1/3 right-6 opacity-25 sm:opacity-80 text-[#06b6d4] pointer-events-none z-0">
            <SparkleRays className="w-8 h-8 sm:w-12 sm:h-12 stroke-[2]" />
          </div>

          {/* 8. Bottom-Left Scrapbook Brain Sticker (No cream background box, pure transparent PNG) */}
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-6 left-6 opacity-30 sm:opacity-95 pointer-events-none z-0 hidden lg:flex items-center"
          >
            <div className="relative w-36 h-36 -rotate-6 drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]">
              <Image
                src="/technova-brain-sticker.png"
                alt="AI Brain Sticker"
                fill
                className="object-contain"
              />
            </div>
          </motion.div>

          {/* 9. Bottom-Right Scrapbook AI Chip Sticker (No cream background box, pure transparent PNG) */}
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute bottom-6 right-6 opacity-30 sm:opacity-95 pointer-events-none z-0 hidden lg:flex items-center"
          >
            <div className="relative w-36 h-36 rotate-6 drop-shadow-[0_12px_24px_rgba(0,0,0,0.7)]">
              <Image
                src="/technova-chip-sticker.png"
                alt="AI Microchip Sticker"
                fill
                className="object-contain"
              />
            </div>
          </motion.div>

          {/* 10. Side Specs (Desktop Viewports Only) */}
          <div className="absolute top-[38%] left-6 bg-[#1e0e38]/95 p-3.5 rounded-xl border-2 border-[#8b5cf6] shadow-[4px_4px_0px_#090214] -rotate-6 hidden xl:block w-52 text-left pointer-events-none z-10">
            <div className="flex items-center justify-between mb-1">
              <PaperClip className="w-4 h-4 text-[#c084fc]" />
              <span className="text-[9px] font-black uppercase tracking-wider text-[#a855f7]">NSS Units 1 & 2</span>
            </div>
            <p className="text-xs font-black text-white">TECHNOVA 2026</p>
            <p className="text-[10px] font-bold text-[#c084fc]">AI and Innovation Convention</p>
          </div>

          <div className="absolute top-[48%] right-6 bg-[#1e0e38]/95 p-3.5 rounded-xl border-2 border-[#c084fc] shadow-[4px_4px_0px_#090214] rotate-6 hidden xl:block w-52 text-left pointer-events-none z-10">
            <div className="flex items-center justify-between mb-1">
              <ThumbtackPin className="w-4 h-4 text-[#fbbf24]" />
              <span className="text-[9px] font-black uppercase tracking-wider text-[#06b6d4]">NSS Convention</span>
            </div>
            <p className="text-xs font-black text-white">Test Your Tech IQ</p>
            <p className="text-[10px] font-bold text-[#c084fc]">Yenepoya Balmatta Campus</p>
          </div>
        </>
      )}
    </div>
  )
}
