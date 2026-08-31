'use client'

import { useState, useEffect } from 'react'
import { QrFrame, GraduationCap, Cross, PaperClip } from '@/components/icons'
import { apiGet } from '@/lib/client/api'

interface QrModalProps {
  isOpen: boolean
  onClose: () => void
}

export function QrModal({ isOpen, onClose }: QrModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [joinUrl, setJoinUrl] = useState<string>('')

  useEffect(() => {
    if (!isOpen) return
    let active = true

    apiGet<{ dataUrl?: string; svg?: string; joinUrl: string }>('/api/qr')
      .then((res) => {
        if (active) {
          setJoinUrl(res.joinUrl)
          if (res.dataUrl) {
            setQrDataUrl(res.dataUrl)
          } else if (res.svg) {
            setQrDataUrl(`data:image/svg+xml;utf8,${encodeURIComponent(res.svg)}`)
          }
        }
      })
      .catch(() => {})

    return () => {
      active = false
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-ink/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg notebook-card p-6 sm:p-8 space-y-6 text-center relative shadow-[6px_6px_0px_#2a2440] animate-pop">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-paper-cream border-2 border-ink text-ink font-bold hover:bg-note-rose transition-colors cursor-pointer"
        >
          <Cross className="w-5 h-5" />
        </button>

        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full sticky-note-yellow text-ink font-black text-xs uppercase tracking-wider -rotate-1">
            <PaperClip className="w-4 h-4 text-ink" />
            <GraduationCap className="w-4 h-4 text-ink" />
            <span>Scan QR Code to Join</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-ink">
            Teachers' Day Quiz
          </h2>
          <p className="text-xs sm:text-sm font-extrabold text-ink-soft">
            Scan with any smartphone camera to open the quiz instantly!
          </p>
        </div>

        {/* Big QR Code Frame */}
        <div className="w-72 h-72 sm:w-80 sm:h-80 mx-auto bg-white p-4 rounded-2xl border-3 border-ink shadow-[4px_4px_0px_#2a2440] flex items-center justify-center relative">
          {qrDataUrl ? (
            /* eslint-disable-next-html-element-suppression */
            <img src={qrDataUrl} alt="Scan to Join Quiz" className="w-full h-full object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-3 text-ink">
              <QrFrame className="w-16 h-16 animate-bounce text-[#0284c7]" />
              <span className="text-sm font-black">Generating QR Code...</span>
            </div>
          )}
        </div>

        {/* Join URL Display */}
        {joinUrl && (
          <div className="p-3.5 rounded-xl sticky-note-mint border-2 border-ink text-ink font-black text-xs sm:text-sm truncate">
            {joinUrl}
          </div>
        )}
      </div>
    </div>
  )
}
