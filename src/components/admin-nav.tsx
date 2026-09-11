'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ADMIN_NAV, adminPath } from '@/lib/admin-route'
import { LogOut, Menu, X, LayoutDashboard, HelpCircle, Radio, BarChart3 } from 'lucide-react'
import { apiPost } from '@/lib/client/api'
import { useState } from 'react'

const NAV_ICONS = {
  '': LayoutDashboard,
  questions: HelpCircle,
  live: Radio,
  results: BarChart3,
}

export function AdminNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [loggingOut, setLoggingOut] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

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
    <header className="w-full bg-[#0c2340] border-b-3 border-[#00d2ff] sticky top-0 z-50 shadow-[0_4px_0px_#04101d]">
      <div className="max-w-7xl 2xl:max-w-[95rem] mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand */}
        <Link
          href={adminPath()}
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-2 group shrink-0"
        >
          <Image
            src="/yenepoya-school-engineering-and-technology.svg?v=2"
            alt="Yenepoya School of Engineering and Technology"
            width={180}
            height={50}
            priority
            className="h-8 sm:h-10 w-auto object-contain"
          />
          <div className="hidden sm:flex flex-col border-l-2 border-[#00d2ff]/30 pl-2.5">
            <span className="font-extrabold text-ink text-xs sm:text-sm leading-none">
              Host Console
            </span>
            <span className="text-[10px] text-ink-soft uppercase font-black tracking-wider mt-0.5">
              Engineers' Day Quiz
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links (Visible md+) */}
        <nav className="hidden md:flex items-center gap-2">
          {ADMIN_NAV.map((tab) => {
            const fullPath = adminPath(tab.href)
            const isActive =
              tab.href === ''
                ? pathname === adminPath() || pathname === adminPath('/')
                : pathname?.startsWith(fullPath)

            const Icon = NAV_ICONS[tab.href as keyof typeof NAV_ICONS] || LayoutDashboard

            return (
              <Link
                key={tab.href}
                href={fullPath}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all border-2 border-[#00d2ff] flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[#00d2ff] text-[#081a2e] shadow-[2px_2px_0px_#04101d]'
                    : 'bg-[#0e2e4e] text-ink hover:bg-[#00d2ff] hover:text-[#081a2e]'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Desktop Logout Button */}
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#00d2ff] bg-[#f97316] text-white text-xs font-extrabold hover:bg-orange-600 transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-[2px_2px_0px_#04101d]"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Logout</span>
        </button>

        {/* Mobile Hamburger Menu Toggle Button (Visible < md) */}
        <div className="flex md:hidden items-center gap-2">
          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-xl sticky-note-yellow border-2 border-[#081a2e] text-[#081a2e] font-black shadow-[2px_2px_0px_#04101d] hover:scale-105 transition-all cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {menuOpen ? <X className="w-5 h-5 text-[#081a2e]" /> : <Menu className="w-5 h-5 text-[#081a2e]" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-down Menu Drawer (< md) */}
      {menuOpen && (
        <div className="md:hidden border-t-2 border-[#00d2ff] bg-[#0c2340] p-4 space-y-2.5 shadow-[0_6px_12px_rgba(0,0,0,0.3)]">
          <div className="text-[10px] font-black uppercase tracking-wider text-ink-soft px-1">
            Host Navigation
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ADMIN_NAV.map((tab) => {
              const fullPath = adminPath(tab.href)
              const isActive =
                tab.href === ''
                  ? pathname === adminPath() || pathname === adminPath('/')
                  : pathname?.startsWith(fullPath)

              const Icon = NAV_ICONS[tab.href as keyof typeof NAV_ICONS] || LayoutDashboard

              return (
                <Link
                  key={tab.href}
                  href={fullPath}
                  onClick={() => setMenuOpen(false)}
                  className={`p-3 rounded-xl font-extrabold text-xs flex items-center gap-2 border-2 border-[#00d2ff] transition-all shadow-[2px_2px_0px_#04101d] ${
                    isActive
                      ? 'bg-[#00d2ff] text-[#081a2e] font-black'
                      : 'bg-[#0e2e4e] text-ink hover:bg-[#00d2ff] hover:text-[#081a2e]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#00d2ff]" />
                  <span>{tab.label}</span>
                </Link>
              )
            })}
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full py-2.5 px-4 rounded-xl border-2 border-[#00d2ff] bg-[#f97316] text-white text-xs font-black hover:bg-orange-600 transition-all cursor-pointer shadow-[2px_2px_0px_#04101d] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout Host Session</span>
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
