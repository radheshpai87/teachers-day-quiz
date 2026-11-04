import type { Metadata, Viewport } from 'next'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const display = Fraunces({
  subsets: ['latin'],
  variable: '--font-fraunces',
  display: 'swap',
  fallback: ['system-ui', 'ui-sans-serif', 'sans-serif'],
})

const sans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
  fallback: ['system-ui', 'ui-sans-serif', 'sans-serif'],
})

export const metadata: Metadata = {
  title: 'TECHNOVA 2026 — AI and Innovation Quiz Competition',
  description:
    'TECHNOVA 2026: Youth Convention for NSS Volunteers on AI and Innovation at Yenepoya School of Engineering & Technology. Test your Technology IQ.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#120726',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable}`}>
      <body className="mesh-ground min-h-dvh antialiased">{children}</body>
    </html>
  )
}
