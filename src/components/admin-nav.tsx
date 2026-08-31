'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ADMIN_NAV, adminPath } from '@/lib/admin-route'
import { GraduationCap, LogOut } from 'lucide-react'
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
    <header className="w-full bg-paper-warm border-b-3 border-ink sticky top-0 z-40 shadow-[0_4px_0px_#2a2440]">
      <div className="max-w-7xl 2xl:max-w-[95rem] mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href={adminPath()} className="flex items-center gap-2.5 group shrink-0">
          <div className="w-9 h-9 rounded-xl bg-note-yellow text-ink flex items-center justify-center border-2 border-ink group-hover:-rotate-3 transition-transform">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-ink text-sm sm:text-base leading-none">
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
                    ? 'bg-[#2a2440] text-white shadow-[2px_2px_0px_#2a2440]'
                    : 'bg-paper-warm text-ink hover:bg-note-yellow'
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
