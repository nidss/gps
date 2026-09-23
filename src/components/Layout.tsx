// ── โครงหน้าเว็บฝั่งลูกค้า ──────────────────────────────────────────
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'
import { ChatWidget } from './ChatWidget'

export function Layout() {
  const { pathname } = useLocation()

  // เลื่อนกลับขึ้นบนสุดทุกครั้งที่เปลี่ยนหน้า
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <ChatWidget />
    </div>
  )
}

/** กล่องจำกัดความกว้างเนื้อหา ใช้ซ้ำทุกหน้า */
export function Container({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto w-full max-w-7xl px-4 lg:px-6 ${className}`}>{children}</div>
}

/** หัวข้อหน้าพร้อมเส้นทางนำทาง */
export function PageHeader({ title, breadcrumb }: { title: string; breadcrumb?: React.ReactNode }) {
  return (
    <div className="border-b border-gp-line bg-white">
      <Container className="py-6 sm:py-8">
        {breadcrumb && <div className="mb-2 text-xs text-gp-ink-soft">{breadcrumb}</div>}
        <h1 className="section-title text-2xl font-bold text-gp-ink sm:text-3xl">{title}</h1>
      </Container>
    </div>
  )
}
