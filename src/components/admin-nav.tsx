'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ADMIN_NAV, adminPath } from '@/lib/admin-route'
import { LogOut } from 'lucide-react'
import { apiPost } from '@/lib/client/api'
import { useState } from 'react'

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    try {
      setLoggingOut(true)
      await apiPost('/api/admin/logout')
      router.push(adminPath('login'))
      router.refresh()
    } catch {
      setLoggingOut(false)
    }
  }

  return (
    <header className="w-full bg-paper-warm border-b-3 border-ink sticky top-0 z-40 shadow-[0_4px_0px_#231f20]">
      <div className="max-w-7xl 2xl:max-w-[95rem] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href={adminPath()} className="flex items-center gap-2.5 group shrink-0">
          <Image
            src="/yenepoya-university-logo.svg"
            alt="Yenepoya University Logo"
            width={200}
            height={70}
            priority
            className="h-10 sm:h-12 w-auto object-contain drop-shadow-sm"
          />
          <div className="hidden sm:flex flex-col border-l-2 border-ink/20 pl-2.5">
            <span className="font-extrabold text-ink text-xs sm:text-sm leading-none">
              Host Console
            </span>
            <span className="text-[10px] text-ink-soft uppercase font-black tracking-wider mt-0.5">
              Teachers' Day Quiz
            </span>
          </div>
        </Link>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {ADMIN_NAV.map((tab) => {
            const fullPath = adminPath(tab.href)
            const isActive =
              tab.href === ''
                ? pathname === adminPath() || pathname === adminPath('/')
                : pathname?.startsWith(fullPath)

            return (
              <Link
                key={tab.href}
                href={fullPath}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all shrink-0 border-2 border-ink ${
                  isActive
                    ? 'bg-[#6bc4e8] text-[#231f20] shadow-[2px_2px_0px_#231f20]'
                    : 'bg-paper-warm text-ink hover:bg-[#93d500]'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </nav>

        {/* Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-ink bg-note-rose text-ink text-xs font-extrabold hover:bg-red-400 transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-[2px_2px_0px_#2a2440]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}
