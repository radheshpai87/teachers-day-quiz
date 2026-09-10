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
  title: "Engineers' Day Quiz",
  description:
    'A live quiz celebrating innovation, engineering, and the minds shaping our future. Scan, join, and play together.',
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#FFFBF5',
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
