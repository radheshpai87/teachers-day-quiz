'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'

const CAROUSEL_IMAGES = [
  { src: '/event.png', alt: 'Yenepoya Teachers Day Event Banner' },
  { src: '/yenepoya1.jpeg', alt: 'Yenepoya Campus Event Image 1' },
  { src: '/yenepoya2image.webp', alt: 'Yenepoya Campus Event Image 2' },
  { src: '/yenepoya3image.jpeg', alt: 'Yenepoya Campus Event Image 3' },
]

export function EventImageCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length)
    }, 3500)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="w-full overflow-hidden rounded-xl border-2 border-ink bg-white relative aspect-[16/10] max-h-52 sm:max-h-64 shadow-[2px_2px_0px_#231f20] select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          className="absolute inset-0 w-full h-full"
        >
          <Image
            src={CAROUSEL_IMAGES[currentIndex].src}
            alt={CAROUSEL_IMAGES[currentIndex].alt}
            fill
            priority={currentIndex === 0}
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
