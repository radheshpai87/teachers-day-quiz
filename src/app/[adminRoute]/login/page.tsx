'use client'

import Image from 'next/image'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { apiPost } from '@/lib/client/api'
import { adminPath } from '@/lib/admin-route'
import { Lock, User, ArrowRight } from 'lucide-react'
import { PaperClip } from '@/components/icons'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('host')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username || !password) {
      setError('Please enter both username and password.')
      return
    }

    try {
      setLoading(true)
      setError(null)

      await apiPost('/api/admin/login', { username, password })
      router.push(adminPath())
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 select-none">
      <div className="w-full max-w-md notebook-card p-8 space-y-6">
        <div className="text-center space-y-3 flex flex-col items-center">
          <Image
            src="/yenepoya-university-logo.svg"
            alt="Yenepoya University Logo"
            width={320}
            height={110}
            priority
            className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm"
          />
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full sticky-note-lavender text-ink font-black text-xs -rotate-1">
            <PaperClip className="w-4 h-4" />
            <span>Host Authentication</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-ink">
            Admin Login
          </h1>
          <p className="text-xs font-bold text-ink-soft">
            Enter your host credentials to access the quiz console.
          </p>
        </div>

        <form onSubmit={handleSubmit} suppressHydrationWarning className="space-y-4">
          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-black uppercase text-ink-soft">
              Username
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-ink-soft absolute left-3.5 top-3.5" />
              <input
                suppressHydrationWarning
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-ink bg-paper-cream text-ink text-sm font-extrabold focus:outline-hidden focus:ring-3 focus:ring-[#0284c7]"
              />
            </div>
          </div>

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-black uppercase text-ink-soft">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-soft absolute left-3.5 top-3.5" />
              <input
                suppressHydrationWarning
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border-2 border-ink bg-paper-cream text-ink text-sm font-extrabold focus:outline-hidden focus:ring-3 focus:ring-[#0284c7]"
              />
            </div>
          </div>

          {error && (
            <div className="text-xs font-black text-ink sticky-note-rose p-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            suppressHydrationWarning
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-[#0284c7] text-white font-black text-sm border-2 border-ink shadow-[3px_3px_0px_#2a2440] hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Login to Console'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  )
}
