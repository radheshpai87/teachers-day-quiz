import { assertAdminRoute } from '@/lib/admin-route'
import { AdminNav } from '@/components/admin-nav'
import { isAdmin } from '@/lib/auth'
import { NotebookBackgroundDecor } from '@/components/notebook-background-decor'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export function generateStaticParams() {
  return [{ adminRoute: process.env.ADMIN_ROUTE || 'admin' }]
}

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ adminRoute: string }>
}) {
  const { adminRoute } = await params
  assertAdminRoute(adminRoute)
  const authenticated = await isAdmin()

  return (
    <div className="min-h-screen notebook-paper flex flex-col relative overflow-hidden">
      <NotebookBackgroundDecor minimal />
      {authenticated && <AdminNav />}
      <main className="flex-1 max-w-7xl 2xl:max-w-[95rem] w-full mx-auto p-3 sm:p-6 z-10 relative">
        {children}
      </main>
    </div>
  )
}
